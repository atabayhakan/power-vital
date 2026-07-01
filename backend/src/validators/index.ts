// Shared zod schemas + Express middleware for request validation.
//
// Usage:
//   import { validate, RegisterSchema, ProductCreateSchema } from '../validators';
//
//   router.post('/',
//     authenticateJWT,
//     requireRole('admin'),
//     validate({ body: ProductCreateSchema }),
//     async (req, res) => { ... }
//
//   // Inside the handler the body is now typed — req.body has been replaced
//   // with the parsed (and coerced) value.
//
// We accept { body?, query?, params? } so each route can pick what it needs.
// `body` is the most common; `query` and `params` are for GET routes that
// take inputs (e.g. pagination, search filters).
import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

export { z } from 'zod';
import { z } from 'zod';

// Enables `.openapi(...)` on every zod schema in this module + the registry.
// Side-effect import — must run before any schema is constructed below.
extendZodWithOpenApi(z);

// ────────────────────────────────────────────────────────────────────────────
// Common primitives
// ────────────────────────────────────────────────────────────────────────────

export const LocaleEnum = z.enum(['tr', 'ru', 'kg', 'en']);
export const CurrencyEnum = z.enum(['KGS', 'USD']);
export const OrderTypeEnum = z.enum(['ecommerce', 'pos', 'mlm_backoffice', 'b2b']);
export const OrderStatusEnum = z.enum(['pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded']);
export const ReviewStatusEnum = z.enum(['published', 'rejected', 'pending']);
export const WithdrawalStatusEnum = z.enum(['approved', 'rejected']);
export const UserRoleEnum = z.enum(['guest', 'customer', 'cashier', 'dealer', 'distributor', 'admin']);
export const PaymentMethodEnum = z.enum(['qr_transfer', 'wallet', 'cash', 'card']);
export const DisplayModeEnum = z.enum(['IMAGE_ONLY', 'TEXT_OVERLAY', 'BUTTON_LINK']);

const idParam = z.object({ id: z.string().min(1, 'ID is required') });

// ────────────────────────────────────────────────────────────────────────────
// Auth
// ────────────────────────────────────────────────────────────────────────────
export const RegisterSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  sponsorId: z.string().min(1).optional().nullable()
}).openapi('RegisterRequest', {
  description: 'Self-service customer registration. Sponsor chain is read from the sponsorId when present.'
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
}).openapi('LoginRequest', {
  description: 'Exchange email + password for a 24h JWT. Returns the token plus a public-safe user profile.'
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(128)
}).openapi('ChangePasswordRequest', {
  description: 'Authenticated user changes their own password. Requires the current password as proof.'
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const ProfileUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200).optional(),
  phone: z.string().trim().max(30).optional().nullable().or(z.literal('').transform(() => undefined)),
  address: z.string().trim().max(500).optional().nullable().or(z.literal('').transform(() => undefined)),
  city: z.string().trim().max(100).optional().nullable().or(z.literal('').transform(() => undefined)),
  birthDate: z.string().datetime().optional().nullable().or(z.literal('').transform(() => undefined))
}).strict().openapi('ProfileUpdateRequest', {
  description: 'Authenticated user updates their own profile details (name, phone, address, city, birth date). Email/role/wallet are never editable here.'
});
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

// Refresh token: send the raw token in the request body OR rely on the
// HttpOnly cookie (cookie takes precedence if present). Either way the
// body is optional — the caller can be JS or curl.
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required').optional()
}).strict();
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Products
// ────────────────────────────────────────────────────────────────────────────
const AccordionItem = z.object({
  key: z.string().min(1).max(50),
  icon: z.string().max(20).optional(),
  title: z.string().min(1).max(200),
  // Content is optional — admin products with placeholder/empty
  // accordions (e.g. legacy rows pre-dating the schema tightening) should
  // still be savable. Frontend can render an empty/placeholder body.
  content: z.string().max(5000).optional().default(''),
  isOpen: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(100).optional()
});
// Benefits are often long descriptive paragraphs (not just short bullets) in
// this catalog — real items run ~1500 chars — so allow generous length.
const BenefitItem = z.string().min(1).max(3000);

// Product images may be a full http(s) URL OR a root-relative path such as
// "/uploads/foo.webp" — which is exactly what the /upload endpoint returns.
// z.string().url() rejects relative paths, so accept both forms explicitly.
const ImageUrlSchema = z.string().trim().min(1).max(2048).refine(
  (s) => /^https?:\/\//i.test(s) || s.startsWith('/'),
  { message: 'Image must be an http(s) URL or a /-relative path' }
);

export const ProductCreateSchema = z.object({
  barcode: z.string().trim().min(1, 'Barcode is required').max(50),
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: z.string().max(5000).optional().nullable(),
  basePriceKgs: z.union([
    z.number().nonnegative('Price must be >= 0'),
    z.string().regex(/^\d+(\.\d+)?$/).transform(Number)
  ]),
  stockQuantity: z.number().int().min(0).optional().default(0),
  minStockAlert: z.number().int().min(0).optional().default(10),
  categoryId: z.string().min(1).optional().nullable(),
  imageUrls: z.array(ImageUrlSchema).max(20).optional(),
  benefits: z.union([z.array(BenefitItem), z.string()]).optional().nullable(),
  accordions: z.union([z.array(AccordionItem), z.string()]).optional(),
  translations: z.union([z.string(), z.record(z.string(), z.any())]).optional().nullable()
}).strict().openapi('ProductCreateRequest', {
  description: 'Create a new product with a fixed KGS price.'
});
export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;

export const ProductUpdateSchema = ProductCreateSchema.partial().strict();
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Categories
// ────────────────────────────────────────────────────────────────────────────
export const CategoryCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase a-z, 0-9, dashes'),
  iconEmoji: z.string().max(20).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).max(1000).optional().default(0),
  translations: z.union([z.string(), z.record(z.string(), z.any())]).optional().nullable()
}).strict();
export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>;

export const CategoryUpdateSchema = CategoryCreateSchema.partial().extend({
  isActive: z.boolean().optional()
}).strict();

// ────────────────────────────────────────────────────────────────────────────
// Slider / Hero slides
// ────────────────────────────────────────────────────────────────────────────
export const HeroSlideCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  subtitle: z.string().max(500).optional().nullable(),
  buttonText: z.string().max(50).optional().nullable(),
  buttonLink: z.string().url().optional().nullable(),
  imageUrl: z.string().url('imageUrl must be a valid URL'),
  mobileImageUrl: z.string().url().optional().nullable(),
  displayMode: DisplayModeEnum.optional().default('IMAGE_ONLY'),
  overlayOpacity: z.number().int().min(0).max(100).optional().default(0),
  scheduledStart: z.union([z.string().datetime(), z.date()]).optional().nullable(),
  scheduledEnd: z.union([z.string().datetime(), z.date()]).optional().nullable(),
  sortOrder: z.number().int().min(0).max(1000).optional().default(0),
  isActive: z.boolean().optional().default(true),
  translations: z.union([z.string(), z.record(z.string(), z.any())]).optional().nullable()
}).strict();
export type HeroSlideCreateInput = z.infer<typeof HeroSlideCreateSchema>;

export const HeroSlideUpdateSchema = HeroSlideCreateSchema.partial().strict();

// ────────────────────────────────────────────────────────────────────────────
// Settings (site-wide)
// ────────────────────────────────────────────────────────────────────────────
export const SettingsUpdateSchema = z.object({
  companyName: z.string().max(200).optional(),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('').transform(() => undefined)),
  mapIframeCode: z.string().max(5000).optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal('').transform(() => undefined)),
  topbarShippingMsg: z.string().max(500).optional().nullable(),
  topbarPhone: z.string().max(50).optional().nullable(),
  copyrightText: z.string().max(500).optional().nullable(),
  trustBadges: z.union([z.string(), z.array(z.any())]).optional().nullable(),
  partners: z.union([z.string(), z.array(z.any())]).optional().nullable(),
  footerLinks: z.union([z.string(), z.array(z.any()), z.record(z.string(), z.any())]).optional().nullable(),
  homepageBlocks: z.union([z.string(), z.record(z.string(), z.any())]).optional().nullable(),
  financeSettings: z.union([z.string(), z.record(z.string(), z.any())]).optional().nullable(),
  faqItems: z.union([z.string(), z.array(z.any())]).optional().nullable(),
  // Hero campaign banner — admin schedules a countdown that
  // appears at the top of the storefront. The end datetime is
  // sent as an ISO-8601 string from the admin UI; we coerce to
  // a Date on the server and accept null to clear.
  campaignEnabled: z.boolean().optional(),
  campaignEndsAt: z.string().datetime({ offset: true }).optional().nullable(),
  campaignTitle: z.string().max(500).optional().nullable(),
  campaignCta: z.string().max(200).optional().nullable(),
  campaignLink: z.string().max(500).optional().nullable(),
  translations: z.union([z.string(), z.record(z.string(), z.any())]).optional().nullable()
}).strict();
export type SettingsUpdateInput = z.infer<typeof SettingsUpdateSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Pages (CMS)
// ────────────────────────────────────────────────────────────────────────────
export const PageCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase a-z, 0-9, dashes'),
  content: z.string().min(1, 'Content is required').max(50000),
  status: z.enum(['draft', 'published', 'archived']).optional().default('published'),
  translations: z.union([z.string(), z.record(z.string(), z.any())]).optional().nullable()
}).strict();
export type PageCreateInput = z.infer<typeof PageCreateSchema>;

export const PageUpdateSchema = PageCreateSchema.partial().strict();

// ────────────────────────────────────────────────────────────────────────────
// Orders
// ────────────────────────────────────────────────────────────────────────────
export const OrderStatusUpdateSchema = z.object({
  status: OrderStatusEnum
}).strict().openapi('OrderStatusUpdateRequest', {
  description: 'Manually move an order between workflow states. The system runs side effects (ascension, refunds) automatically on paid/completed.'
});

// ────────────────────────────────────────────────────────────────────────────
// Finance (wallet, withdraw)
// ────────────────────────────────────────────────────────────────────────────
const positiveNumber = z.union([
  z.number().positive('Must be > 0'),
  z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number').transform(Number)
]);

export const WalletPaySchema = z.object({
  orderType: OrderTypeEnum.optional().default('ecommerce'),
  amountKgs: positiveNumber,
  productIds: z.array(z.string().min(1)).optional()
}).strict();
export type WalletPayInput = z.infer<typeof WalletPaySchema>;

export const WithdrawSchema = z.object({
  amount: positiveNumber,
  currency: CurrencyEnum.optional().default('KGS'),
  bankInfo: z.string().max(500).optional().nullable()
}).strict();
export type WithdrawInput = z.infer<typeof WithdrawSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Admin: users + withdrawals
// ────────────────────────────────────────────────────────────────────────────
export const AdminUserUpdateSchema = z.object({
  role: UserRoleEnum.optional(),
  isMonthlyActive: z.boolean().optional(),
  walletBalanceKgs: z.number().nonnegative().optional(),
  walletBalanceUsd: z.number().nonnegative().optional()
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

export const WithdrawalUpdateSchema = z.object({
  status: WithdrawalStatusEnum
}).strict();

// ────────────────────────────────────────────────────────────────────────────
// System config
// ────────────────────────────────────────────────────────────────────────────
const intArrayString = z.string().regex(/^\[[\d,\s]+\]$/, 'Must be a JSON array of integers, e.g. "[10,5,2]"');

export const SystemConfigUpdateSchema = z.object({
  isMlmEnabled: z.boolean().optional(),
  maxPayoutLimitPct: z.number().min(0).max(100).optional(),
  isFastStartActive: z.boolean().optional(),
  fastStartRates: z.union([intArrayString, z.array(z.number().int().nonnegative())]).optional(),
  isUnilevelActive: z.boolean().optional(),
  unilevelRates: z.union([intArrayString, z.array(z.number().int().nonnegative())]).optional(),
  isOverdriveActive: z.boolean().optional(),
  overdrivePoolPct: z.number().min(0).max(100).optional()
}).strict();
export type SystemConfigUpdateInput = z.infer<typeof SystemConfigUpdateSchema>;

// ────────────────────────────────────────────────────────────────────────────
// AI / i18n admin
// ────────────────────────────────────────────────────────────────────────────
export const AITranslateSchema = z.object({
  text: z.string().min(1, 'text is required').max(5000),
  targetLangs: z.array(z.string().min(2)).min(1, 'At least one target language required').max(10)
}).strict();

export const I18nTranslateSchema = z.object({
  model: z.string().min(1, 'model is required'),
  id: z.string().min(1, 'id is required'),
  targets: z.array(LocaleEnum).optional()
}).strict();

export const I18nTranslateBatchSchema = z.object({
  model: z.string().min(1).optional(),
  ids: z.array(z.string().min(1)).max(500).optional(),
  targets: z.array(LocaleEnum).optional(),
  limit: z.number().int().min(1).max(200).optional().default(25)
}).strict();

// ────────────────────────────────────────────────────────────────────────────
// Manual translation save — replaces the old AI translate/batch endpoints.
// The admin writes a single field value for a single (model, record, locale)
// triple. The frontend decides what to send based on the field type:
//   • Scalar:  { locale, field, value }
//   • Array object (accordions/faq): { locale, arrayField, key, subField, value }
//   • String array (benefits):       { locale, arrayField, index, value }
// Sending `value: ''` (or null) is a valid "clear this slot" operation.
// ────────────────────────────────────────────────────────────────────────────
export const I18nRecordUpdateSchema = z.object({
  locale: LocaleEnum,
  field: z.string().min(1).optional(),
  value: z.union([z.string(), z.null()]).optional(),
  // For array fields:
  arrayField: z.string().min(1).optional(),
  key: z.string().min(1).optional(),        // matchBy: 'key' (e.g. accordion.key)
  subField: z.string().min(1).optional(),  // sub-field inside the item
  index: z.number().int().min(0).optional() // matchBy: 'index' (string arrays)
}).strict().refine(
  (d) => {
    const hasScalar = typeof d.field === 'string' && d.field.length > 0;
    const hasKeyed = typeof d.arrayField === 'string' && typeof d.key === 'string' && typeof d.subField === 'string';
    const hasIndexed = typeof d.arrayField === 'string' && typeof d.index === 'number';
    return hasScalar || hasKeyed || hasIndexed;
  },
  { message: 'Provide either (field) or (arrayField + key + subField) or (arrayField + index)' }
);

// CSV import — one row per (record_id, locale, field_path)
// path uses dotted notation for scalars ("name") and bracket notation
// for arrays ("accordions[storage].title", "benefits[2]").
export const I18nImportRowSchema = z.object({
  recordId: z.string().min(1),
  locale: LocaleEnum,
  path: z.string().min(1),
  value: z.string()
}).strict();

export const I18nImportSchema = z.object({
  model: z.string().min(1),
  rows: z.array(I18nImportRowSchema).min(1).max(5000)
}).strict();

// ────────────────────────────────────────────────────────────────────────────
// Upload folders + media move
// ────────────────────────────────────────────────────────────────────────────
export const MediaFolderCreateSchema = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(100)
}).strict();

export const MediaMoveSchema = z.object({
  folderId: z.string().min(1).nullable().optional()
}).strict();

// ────────────────────────────────────────────────────────────────────────────
// Reviews (product + store)
// ────────────────────────────────────────────────────────────────────────────
export const ReviewSubmitSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  name: z.string().trim().min(1, 'Name is required').max(100),
  rating: z.number().int().min(1, 'Rating must be >= 1').max(5, 'Rating must be <= 5'),
  text: z.string().min(1, 'Review text is required').max(2000)
}).strict();
export type ReviewSubmitInput = z.infer<typeof ReviewSubmitSchema>;

export const StoreReviewSubmitSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1, 'Review text is required').max(2000)
}).strict();
export type StoreReviewSubmitInput = z.infer<typeof StoreReviewSubmitSchema>;

export const ReviewStatusUpdateSchema = z.object({
  status: ReviewStatusEnum.optional(),
  translations: z.union([z.string(), z.record(z.string(), z.any())]).optional()
}).strict().refine(
  (data) => data.status !== undefined || data.translations !== undefined,
  { message: 'At least one of status or translations must be provided' }
);

// ────────────────────────────────────────────────────────────────────────────
// Checkout (anonymous + authed guest cart)
// ────────────────────────────────────────────────────────────────────────────
const CartItemSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  quantity: z.number().int().positive('Quantity must be > 0').max(999)
});

export const CheckoutSchema = z.object({
  cart: z.array(CartItemSchema).min(1, 'Cart cannot be empty').max(50),
  customerName: z.string().trim().min(1, 'Customer name is required').max(200),
  customerPhone: z.string().trim().min(5, 'Phone is required').max(30),
  customerEmail: z.string().email('Invalid email').max(200).optional().nullable()
    .or(z.literal('').transform(() => undefined)),
  address: z.string().max(500).optional().nullable(),
  orderType: OrderTypeEnum.optional().default('ecommerce'),
  paymentMethod: PaymentMethodEnum.optional().default('qr_transfer'),
  targetUserId: z.string().min(1).optional()
}).strict().openapi('CheckoutRequest', {
  description: 'Create a pending order, atomically decrement stock, and return the QR payload for bank transfer. Use targetUserId (admin/cashier only) for POS sales on behalf of a customer.'
});
export type CheckoutInput = z.infer<typeof CheckoutSchema>;

// Cart heartbeat — what the client sends every time the cart
// mutates. Lenient by design: missing fields fall back to
// safe defaults (quantity 1, totals 0) so a stale client can
// still reach the endpoint.
export const CartHeartbeatSchema = z.object({
  items: z.array(z.object({
    id: z.string().min(1).max(191),
    name: z.string().max(500).optional().default(''),
    imageUrl: z.string().max(500).optional(),
    basePriceKgs: z.number().nonnegative().max(100_000_000).optional().default(0),
    quantity: z.number().int().positive().max(999).optional().default(1)
  })).max(100).optional().default([]),
  totals: z.object({
    kgs: z.number().nonnegative().max(100_000_000).optional().default(0)
  }).optional().default({ kgs: 0 })
}).strict();
export type CartHeartbeatInput = z.infer<typeof CartHeartbeatSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Pagination + search query (used by GET routes)
// ────────────────────────────────────────────────────────────────────────────
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50)
}).strict();

export const UserSearchQuerySchema = z.object({
  q: z.string().min(3, 'Search query must be at least 3 characters').max(100)
}).strict();

export const OrderListQuerySchema = z.object({
  status: OrderStatusEnum.optional(),
  includeCancelled: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50)
}).strict();

// ────────────────────────────────────────────────────────────────────────────
// Path-param-only schemas (for PUT/DELETE /:id routes)
// ────────────────────────────────────────────────────────────────────────────
export const IdParamSchema = idParam;

// ────────────────────────────────────────────────────────────────────────────
// validate() middleware
// ────────────────────────────────────────────────────────────────────────────
export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Express middleware factory. Wraps a request handler in zod validation for
 * any combination of body/query/params. Replaces the original request fields
 * with the parsed (and coerced) values, so handlers can rely on typed data.
 *
 * On failure responds 400 with the standardised error envelope:
 *   { error: 'Validation failed', issues: [{ path, message, code }] }
 */
export const validate = (schemas: ValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        // Express 5 makes req.query a getter; we override via Object.defineProperty
        // to keep the parsed result visible to downstream handlers.
        const parsed = await schemas.query.parseAsync(req.query);
        Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true });
      }
      if (schemas.params) {
        const parsed = await schemas.params.parseAsync(req.params);
        Object.defineProperty(req, 'params', { value: parsed, writable: true, configurable: true });
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          issues: err.issues.map(i => ({
            path: i.path.join('.'),
            message: i.message,
            code: i.code
          }))
        });
      }
      next(err);
    }
  };
};
