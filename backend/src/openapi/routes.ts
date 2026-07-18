// OpenAPI route registrations.
// Each call to `registry.registerPath({...})` documents one HTTP route in
// the generated spec. The body/query/params schemas MUST be the SAME zod
// objects used by the validate() middleware, so the spec and the runtime
// validation can never drift.

import { registry } from './registry';
import { z } from 'zod';
import {
  RegisterSchema, LoginSchema, ChangePasswordSchema, ProfileUpdateSchema,
  ProductCreateSchema, ProductUpdateSchema,
  CategoryCreateSchema, CategoryUpdateSchema,
  HeroSlideCreateSchema, HeroSlideUpdateSchema,
  SettingsUpdateSchema, PageCreateSchema, PageUpdateSchema,
  OrderStatusUpdateSchema, WalletPaySchema, WithdrawSchema,
  AdminUserUpdateSchema, WithdrawalUpdateSchema,
  SystemConfigUpdateSchema, AITranslateSchema,
  I18nTranslateSchema, I18nTranslateBatchSchema,
  MediaFolderCreateSchema, MediaMoveSchema,
  ReviewSubmitSchema, StoreReviewSubmitSchema, ReviewStatusUpdateSchema,
  CheckoutSchema, PaginationQuerySchema, UserSearchQuerySchema,
  OrderListQuerySchema, IdParamSchema, RefreshTokenSchema
} from '../validators';

// Schema for the dedicated search endpoint (re-used from validators? No —
// it's defined in product.ts as a local schema. We mirror it here so the
// OpenAPI spec is in sync.)
const SearchQuerySchema = z.object({
  q: z.string().min(1, 'q is required').max(200),
  categoryId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  inStock: z.coerce.boolean().optional()
}).strict().openapi('ProductSearchQuery', { description: 'Full-text search query string' });

// ════════════════════════════════════════════════════════════════════════════
// Shared response envelopes (reused by the new bulk / cursor / search /
// analytics endpoints). Defining them once here keeps the spec DRY and
// makes the auto-generated TypeScript clients on the frontend match
// the actual response shape exactly.
// ════════════════════════════════════════════════════════════════════════════

// Standard offset-pagination envelope (admin/users, admin/withdrawals,
// reviews, store-reviews, orders, finance/transactions).
const PaginationEnvelope = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().describe('Total rows matching the query'),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    hasMore: z.boolean().describe('True if there is at least one more page')
  }).openapi(`PaginationEnvelope<${itemSchema.description || 'T'}>`);

// Cursor pagination envelope (admin/impersonation/sessions,
// push/broadcast-history).
const CursorEnvelope = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable().describe('Opaque base64url cursor — null when there are no more pages'),
    hasMore: z.boolean()
  }).openapi(`CursorEnvelope<${itemSchema.description || 'T'}>`);

// Common admin user row.
const AdminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string()
}).openapi('AdminUserSummary');

// Common admin withdrawal row.
const AdminWithdrawalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  createdAt: z.string(),
  user: z.object({ name: z.string(), email: z.string() }).optional()
}).openapi('AdminWithdrawal');

// Order list item (lightweight — the dashboard doesn't need items[]).
const AdminOrderListItem = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  status: z.string(),
  totalKgs: z.number(),
  orderType: z.string().optional(),
  createdAt: z.string()
}).openapi('AdminOrderListItem');

const AdminReviewListItem = z.object({
  id: z.string(),
  productId: z.string(),
  userId: z.string(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
  status: z.string(),
  createdAt: z.string(),
  product: z.object({ name: z.string(), barcode: z.string() }).optional()
}).openapi('AdminReviewListItem');

const AdminStoreReviewListItem = z.object({
  id: z.string(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
  status: z.string(),
  createdAt: z.string()
}).openapi('AdminStoreReviewListItem');

const FinanceTransaction = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  amount: z.number(),
  currency: z.string(),
  description: z.string().optional(),
  createdAt: z.string()
}).openapi('FinanceTransaction');

// Authenticated user's own withdrawal row (safe fields only — no userId leak).
// `.describe()` doubles as the PaginationEnvelope component suffix so this
// endpoint gets its own typed envelope instead of the shared `PaginationEnvelope<T>`.
const FinanceWithdrawal = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.string().describe('pending | approved | rejected'),
  bankInfo: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
}).openapi('FinanceWithdrawal').describe('FinanceWithdrawal');

// ─── Trends endpoint schemas ────────────────────────────────────────────────
const DailyBucket = z.object({
  date: z.string().describe('YYYY-MM-DD'),
  revenue: z.number(),
  orders: z.number().int(),
  completedOrders: z.number().int(),
  newUsers: z.number().int()
}).openapi('DailyBucket');

const TrendsRange = z.object({
  from: z.string(),
  to: z.string(),
  days: z.number().int()
}).openapi('TrendsRange');

const TrendsResponse = z.object({
  range: TrendsRange,
  daily: z.array(DailyBucket),
  totals: z.object({
    revenue: z.number(),
    orders: z.number().int(),
    newUsers: z.number().int(),
    completedOrders: z.number().int()
  })
}).openapi('TrendsResponse');

// ─── Search endpoint schemas ───────────────────────────────────────────────
const AdminUserSearchResult = AdminUserSchema.extend({
  walletKgs: z.number(),
  walletUsd: z.number(),
  isActive: z.boolean()
}).openapi('AdminUserSearchResult');

const AdminProductSearchResult = z.object({
  id: z.string(),
  name: z.string(),
  barcode: z.string(),
  priceKgs: z.number(),
  priceUsd: z.number(),
  stock: z.number().int(),
  lowStock: z.boolean(),
  category: z.object({ id: z.string(), name: z.string() }).nullable()
}).openapi('AdminProductSearchResult');

const SearchEnvelope = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    query: z.string().describe('The trimmed query (echoed back)'),
    count: z.number().int(),
    results: z.array(itemSchema)
  }).openapi(`SearchEnvelope<${itemSchema.description || 'T'}>`);

// ─── Analytics endpoint schemas ─────────────────────────────────────────────
const CategoryAnalytics = z.object({
  id: z.string(),
  name: z.string(),
  iconEmoji: z.string().nullable().optional(),
  productCount: z.number().int(),
  unitsSold: z.number().int(),
  revenueKgs: z.number(),
  sharePct: z.number().describe('0-100, with 1 decimal')
}).openapi('CategoryAnalytics');

const TopCustomer = z.object({
  rank: z.number().int(),
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  orderCount: z.number().int(),
  totalKgs: z.number()
}).openapi('TopCustomer');

const TopProduct = z.object({
  rank: z.number().int(),
  id: z.string(),
  name: z.string(),
  barcode: z.string(),
  categoryName: z.string().nullable(),
  unitsSold: z.number().int(),
  revenueKgs: z.number()
}).openapi('TopProduct');

// ─── Bulk action schemas ──────────────────────────────────────────────────
const OrderStatusEnum = z.enum(['pending', 'paid', 'shipped', 'completed', 'cancelled']);
const RoleEnum = z.enum(['customer', 'distributor', 'cashier', 'admin', 'dealer']);

const BulkOrderStatusSchema = z.object({
  orderIds: z.array(z.string().min(8)).min(1).max(500),
  status: OrderStatusEnum,
  note: z.string().max(500).optional()
}).openapi('BulkOrderStatus');

const BulkUserRoleSchema = z.object({
  userIds: z.array(z.string().min(8)).min(1).max(500),
  role: RoleEnum
}).openapi('BulkUserRole');

const BulkProductCategorySchema = z.object({
  productIds: z.array(z.string().min(8)).min(1).max(500),
  categoryId: z.string().min(8).nullable()
}).openapi('BulkProductCategory');

const BulkDeleteSchema = z.object({
  ids: z.array(z.string().min(8)).min(1).max(500)
}).openapi('BulkDelete');

const BulkResult = z.object({
  ok: z.boolean(),
  updated: z.number().int().optional(),
  deleted: z.number().int().optional(),
  requested: z.number().int().optional()
}).openapi('BulkResult');

// ─── Impersonation schemas ─────────────────────────────────────────────────
const ImpersonationSession = z.object({
  id: z.string(),
  adminId: z.string(),
  targetId: z.string(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  expiresAt: z.string(),
  target: z.object({
    id: z.string(), name: z.string(), email: z.string(), role: z.string()
  }).optional()
}).openapi('ImpersonationSession');

const ImpersonationActiveStatus = z.discriminatedUnion('active', [
  z.object({ active: z.literal(false) }),
  z.object({
    active: z.literal(true),
    sessionId: z.string(),
    targetId: z.string(),
    targetName: z.string().nullable(),
    targetEmail: z.string().nullable(),
    expiresAt: z.string(),
    startedAt: z.string()
  })
]).openapi('ImpersonationActiveStatus');

// ─── Push / broadcast schemas ──────────────────────────────────────────────
const BroadcastLogEntry = z.object({
  id: z.string(),
  parentBroadcastId: z.string().nullable(),
  targetId: z.string().nullable(),
  actorId: z.string().nullable(),
  eventKey: z.string(),
  sent: z.number().int(),
  expired: z.number().int(),
  failed: z.number().int(),
  createdAt: z.string(),
  actor: z.object({ id: z.string(), name: z.string(), email: z.string() }).optional(),
  target: z.object({ id: z.string(), name: z.string(), email: z.string() }).optional()
}).openapi('BroadcastLogEntry');

// ─── Cursor pagination helper params ───────────────────────────────────────
const CursorQuerySchema = z.object({
  cursor: z.string().optional().describe('Opaque base64url cursor from a previous response'),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50)
}).strict().openapi('CursorQuery');

const TrendsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional().default(30)
}).strict().openapi('TrendsQuery');

const AdminSearchQuerySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters').max(100),
  limit: z.coerce.number().int().min(1).max(20).optional().default(10)
}).strict().openapi('AdminSearchQuery');

const AnalyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional().default(30),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10)
}).strict().openapi('AnalyticsQuery');

// Common response shapes
const ErrorResponse = z.object({
  error: z.string(),
  issues: z.array(z.object({
    path: z.string(),
    message: z.string(),
    code: z.string()
  })).optional()
}).openapi('ErrorResponse');

const OrderResponse = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  orderType: z.string(),
  status: z.string(),
  totalKgs: z.number(),
  paymentMethod: z.string(),
  customerName: z.string().nullable(),
  customerPhone: z.string().nullable(),
  address: z.string().nullable(),
  receiptImageUrl: z.string().nullable(),
  createdAt: z.string()
}).openapi('Order');

const Tag = (name: string, description: string) => ({ name, description });

// ── Auth ──────────────────────────────────────────────────────────────────
export const registerAuthRoutes = () => {
  const tag = Tag('Auth', 'Registration, login, password change, profile');

  registry.registerPath({
    method: 'post', path: '/api/v1/auth/register',
    tags: [tag.name], description: 'Register a new customer account',
    request: { body: { content: { 'application/json': { schema: RegisterSchema } } } },
    responses: { 201: { description: 'Account created' }, 400: { description: 'Validation failed', content: { 'application/json': { schema: ErrorResponse } } } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/auth/login',
    tags: [tag.name],
    description: 'Exchange credentials for a short-lived access token (15m) + long-lived refresh token (7d). The refresh token is also set as an HttpOnly cookie. Replay of an already-rotated refresh token revokes the entire family.',
    request: { body: { content: { 'application/json': { schema: LoginSchema } } } },
    responses: {
      200: {
        description: 'Login successful. Returns accessToken + refreshToken + user profile + TTLs.',
        content: { 'application/json': { schema: z.object({
          accessToken: z.string(),
          refreshToken: z.string(),
          token: z.string().describe('Legacy alias for accessToken'),
          expiresIn: z.number().describe('Access token TTL in seconds'),
          refreshExpiresIn: z.number().describe('Refresh token TTL in seconds'),
          tokenType: z.string(),
          user: z.object({ id: z.string(), name: z.string(), email: z.string(), role: z.string() }).passthrough()
        }) } }
      },
      401: { description: 'Invalid credentials' },
      429: { description: 'Too many login attempts (5/15min per IP)' }
    }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/auth/refresh',
    tags: [tag.name],
    description: 'Rotate the refresh token. The new refresh token is returned and (for browser clients) set as an HttpOnly cookie. The old token is marked revoked. If the supplied token has already been used, the entire family is revoked and 401 is returned. The refresh token may be sent either in the request body (refreshToken field) or via the HttpOnly pv_refresh cookie.',
    request: { body: { content: { 'application/json': { schema: RefreshTokenSchema } } } },
    responses: {
      200: { description: 'New access + refresh tokens issued' },
      401: { description: 'Invalid, expired, or replayed refresh token' }
    }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/auth/logout',
    tags: [tag.name],
    description: 'Revoke the supplied refresh token (and its whole family). The HttpOnly cookie is cleared. Access tokens issued before this call remain valid until they expire (15 min max).',
    responses: { 200: { description: 'Logged out' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/auth/me',
    tags: [tag.name], description: 'Return the authenticated user profile',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Current user' }, 401: { description: 'Not authenticated' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/auth/network',
    tags: [tag.name], description: 'Return the distributor downline tree (max depth 8)',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Network tree' }, 401: { description: 'Not authenticated' } }
  });

  registry.registerPath({
    method: 'put', path: '/api/v1/auth/change-password',
    tags: [tag.name], description: 'Change the authenticated user\'s password',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: ChangePasswordSchema } } } },
    responses: { 200: { description: 'Password changed' }, 400: { description: 'Validation failed' }, 401: { description: 'Wrong current password' } }
  });

  registry.registerPath({
    method: 'put', path: '/api/v1/auth/me',
    tags: [tag.name], description: 'Update the authenticated user\'s own profile (name, phone, address, city, birth date)',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: ProfileUpdateSchema } } } },
    responses: { 200: { description: 'Profile updated' }, 400: { description: 'Validation failed' }, 401: { description: 'Not authenticated' } }
  });
};

// ── Products ──────────────────────────────────────────────────────────────
export const registerProductRoutes = () => {
  const tag = Tag('Products', 'Product catalogue, prices, stock');

  registry.registerPath({
    method: 'get', path: '/api/v1/products',
    tags: [tag.name], description: 'List products (public). When ?search= is provided, returns SearchResult envelope with relevance + snippet. Otherwise returns a plain product list.',
    responses: { 200: { description: 'Products (or SearchResult if ?search= is set)' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/products/search',
    tags: [tag.name], description: 'Dedicated full-text search (MySQL FULLTEXT with ngram parser). Always returns the SearchResult envelope with relevance scores and highlighted snippets.',
    request: { query: SearchQuerySchema },
    responses: { 200: { description: 'SearchResult' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/products/{id}',
    tags: [tag.name], description: 'Get a single product by id',
    request: { params: IdParamSchema },
    responses: { 200: { description: 'Product' }, 404: { description: 'Not found' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/products',
    tags: [tag.name], description: 'Create a product (admin). Triggers auto-AI translation into RU/KG.',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: ProductCreateSchema } } } },
    responses: { 201: { description: 'Created' }, 400: { description: 'Validation failed' }, 403: { description: 'Not admin' } }
  });

  registry.registerPath({
    method: 'put', path: '/api/v1/products/{id}',
    tags: [tag.name], description: 'Update a product (admin). Triggers re-translation if name changed.',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema, body: { content: { 'application/json': { schema: ProductUpdateSchema } } } },
    responses: { 200: { description: 'Updated' }, 400: { description: 'Validation failed' }, 403: { description: 'Not admin' } }
  });

  registry.registerPath({
    method: 'delete', path: '/api/v1/products/{id}',
    tags: [tag.name], description: 'Delete a product (admin). Cascades orderItems + images.',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: { 200: { description: 'Deleted' }, 403: { description: 'Not admin' } }
  });
};

// ── Categories ────────────────────────────────────────────────────────────
export const registerCategoryRoutes = () => {
  const tag = Tag('Categories', 'Product categories');

  registry.registerPath({
    method: 'get', path: '/api/v1/categories',
    tags: [tag.name], description: 'List active categories (public)',
    responses: { 200: { description: 'Categories' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/categories',
    tags: [tag.name], description: 'Create a category (admin)',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: CategoryCreateSchema } } } },
    responses: { 201: { description: 'Created' }, 400: { description: 'Validation failed' } }
  });

  registry.registerPath({
    method: 'put', path: '/api/v1/categories/{id}',
    tags: [tag.name], description: 'Update a category (admin)',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema, body: { content: { 'application/json': { schema: CategoryUpdateSchema } } } },
    responses: { 200: { description: 'Updated' } }
  });

  registry.registerPath({
    method: 'delete', path: '/api/v1/categories/{id}',
    tags: [tag.name], description: 'Delete a category (admin)',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: { 200: { description: 'Deleted' } }
  });
};

// ── Slider / Hero ─────────────────────────────────────────────────────────
export const registerSliderRoutes = () => {
  const tag = Tag('Slider', 'Hero slider / hero slides');

  registry.registerPath({
    method: 'get', path: '/api/v1/slides',
    tags: [tag.name], description: 'List active hero slides (public)',
    responses: { 200: { description: 'Slides' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/slides/all',
    tags: [tag.name], description: 'List ALL slides including inactive (admin)',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'All slides' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/slides',
    tags: [tag.name], description: 'Create a hero slide (admin)',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: HeroSlideCreateSchema } } } },
    responses: { 201: { description: 'Created' } }
  });

  registry.registerPath({
    method: 'put', path: '/api/v1/slides/{id}',
    tags: [tag.name], description: 'Update a hero slide (admin)',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema, body: { content: { 'application/json': { schema: HeroSlideUpdateSchema } } } },
    responses: { 200: { description: 'Updated' } }
  });

  registry.registerPath({
    method: 'delete', path: '/api/v1/slides/{id}',
    tags: [tag.name], description: 'Delete a hero slide (admin)',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: { 200: { description: 'Deleted' } }
  });
};

// ── Settings ──────────────────────────────────────────────────────────────
export const registerSettingsRoutes = () => {
  const tag = Tag('Settings', 'Site-wide settings (logo, contact, finance, CMS blocks)');

  registry.registerPath({
    method: 'get', path: '/api/v1/settings',
    tags: [tag.name], description: 'Fetch the current site settings (public)',
    responses: { 200: { description: 'Settings' } }
  });

  registry.registerPath({
    method: 'put', path: '/api/v1/settings',
    tags: [tag.name], description: 'Update site settings (admin). Triggers auto-translation.',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: SettingsUpdateSchema } } } },
    responses: { 200: { description: 'Updated' } }
  });
};

// ── Pages (CMS) ───────────────────────────────────────────────────────────
export const registerPageRoutes = () => {
  const tag = Tag('CMS Pages', 'Markdown/HTML pages (about, terms, etc.)');

  registry.registerPath({
    method: 'get', path: '/api/v1/pages',
    tags: [tag.name], description: 'List pages (public)',
    responses: { 200: { description: 'Pages' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/pages/{slug}',
    tags: [tag.name], description: 'Get a page by slug',
    request: { params: z.object({ slug: z.string() }) },
    responses: { 200: { description: 'Page' }, 404: { description: 'Not found' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/pages',
    tags: [tag.name], description: 'Create a page (admin)',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: PageCreateSchema } } } },
    responses: { 201: { description: 'Created' } }
  });

  registry.registerPath({
    method: 'put', path: '/api/v1/pages/{id}',
    tags: [tag.name], description: 'Update a page (admin)',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema, body: { content: { 'application/json': { schema: PageUpdateSchema } } } },
    responses: { 200: { description: 'Updated' } }
  });

  registry.registerPath({
    method: 'delete', path: '/api/v1/pages/{id}',
    tags: [tag.name], description: 'Delete a page (admin)',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: { 200: { description: 'Deleted' } }
  });
};

// ── Orders ────────────────────────────────────────────────────────────────
export const registerOrderRoutes = () => {
  const tag = Tag('Orders', 'Admin order management');

  registry.registerPath({
    method: 'get', path: '/api/v1/orders',
    tags: [tag.name], description: 'List orders (admin). Filter by status, include cancelled.',
    security: [{ bearerAuth: [] }],
    request: { query: OrderListQuerySchema },
    responses: { 200: { description: 'Orders' } }
  });

  registry.registerPath({
    method: 'put', path: '/api/v1/orders/{id}/status',
    tags: [tag.name], description: 'Manually transition order status (admin). Triggers side effects on paid/completed.',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema, body: { content: { 'application/json': { schema: OrderStatusUpdateSchema } } } },
    responses: { 200: { description: 'Updated' } }
  });
};

// ── Checkout ──────────────────────────────────────────────────────────────
export const registerCheckoutRoutes = () => {
  const tag = Tag('Checkout', 'Cart, order creation, receipt upload, OCR verify');

  registry.registerPath({
    method: 'post', path: '/api/v1/checkout',
    tags: [tag.name], description: 'Create a pending order, atomically decrement stock, return QR payload for bank transfer',
    request: { body: { content: { 'application/json': { schema: CheckoutSchema } } } },
    responses: {
      201: { description: 'Order created, returns orderId + totalKgs + bankInfo + qrPayload', content: { 'application/json': { schema: z.object({ orderId: z.string(), totalKgs: z.number(), bankInfo: z.any(), qrPayload: z.string() }) } } },
      400: { description: 'Validation or stock error', content: { 'application/json': { schema: ErrorResponse } } }
    }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/checkout/{orderId}/receipt',
    tags: [tag.name], description: 'Upload a bank transfer receipt (image or PDF, 5MB max)',
    request: { params: z.object({ orderId: z.string() }) },
    responses: { 200: { description: 'Receipt URL stored' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/checkout/{orderId}/verify',
    tags: [tag.name], description: 'Run OCR on the receipt. Strict mode: amount mismatch leaves order PENDING for manual review (NEVER auto-approves).',
    request: { params: z.object({ orderId: z.string() }) },
    responses: { 200: { description: 'Verification result' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/checkout/{orderId}',
    tags: [tag.name], description: 'Fetch an order by id',
    request: { params: z.object({ orderId: z.string() }) },
    responses: { 200: { description: 'Order', content: { 'application/json': { schema: OrderResponse } } }, 404: { description: 'Not found' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/checkout/search-users',
    tags: [tag.name], description: 'Search users for POS sales (admin/cashier)',
    security: [{ bearerAuth: [] }],
    request: { query: UserSearchQuerySchema },
    responses: { 200: { description: 'Matching users' } }
  });
};

// ── Finance ───────────────────────────────────────────────────────────────
export const registerFinanceRoutes = () => {
  const tag = Tag('Finance', 'Wallet, withdrawals, transactions');

  registry.registerPath({
    method: 'get', path: '/api/v1/finance/wallet',
    tags: [tag.name], description: 'Fetch the authenticated user\'s wallet balances',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Balances' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/finance/wallet/pay',
    tags: [tag.name], description: 'Pay for an order using wallet balance (POS or e-commerce)',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: WalletPaySchema } } } },
    responses: { 200: { description: 'Payment successful' }, 400: { description: 'Insufficient balance' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/finance/withdraw',
    tags: [tag.name], description: 'Create a withdrawal request (atomic: balance decremented immediately)',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: WithdrawSchema } } } },
    responses: { 201: { description: 'Withdrawal request created' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/finance/withdrawals',
    tags: [tag.name], description: 'List the authenticated user\'s own withdrawal requests (paginated, newest first)',
    security: [{ bearerAuth: [] }],
    request: { query: PaginationQuerySchema },
    responses: {
      200: {
        description: 'Paginated envelope',
        content: { 'application/json': { schema: PaginationEnvelope(FinanceWithdrawal) } }
      },
      401: { description: 'Not authenticated' }
    }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/finance/transactions',
    tags: [tag.name], description: 'List the authenticated user\'s transaction history',
    security: [{ bearerAuth: [] }],
    request: { query: PaginationQuerySchema },
    responses: { 200: { description: 'Transactions' } }
  });
};

// ── System config ─────────────────────────────────────────────────────────
export const registerSystemRoutes = () => {
  const tag = Tag('System', 'MLM toggles, payout limits');

  registry.registerPath({
    method: 'get', path: '/api/v1/system/mlm-status',
    tags: [tag.name], description: 'Is MLM enabled? (public, Redis-cached)',
    responses: { 200: { description: 'Status' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/system/config',
    tags: [tag.name], description: 'Fetch system config + revenue/bonus/payout stats (admin)',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Config + stats' } }
  });

  registry.registerPath({
    method: 'put', path: '/api/v1/system/config',
    tags: [tag.name], description: 'Update system config (admin)',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: SystemConfigUpdateSchema } } } },
    responses: { 200: { description: 'Updated' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/system/close-week',
    tags: [tag.name], description: 'Close the current week and roll points over (admin)',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Week closed' } }
  });
};

// ── Admin (users + withdrawals) ───────────────────────────────────────────
export const registerAdminRoutes = () => {
  const tag = Tag('Admin', 'User management, withdrawal approval');

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/dashboard',
    tags: [tag.name], description: 'Full admin dashboard (revenue, low stock, recent orders)',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Dashboard' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/events',
    tags: [tag.name],
    description: 'Server-Sent Events (SSE) stream of admin-only events. Returns text/event-stream with one frame per event (`event: <type>` + `data: <json>`). Events: new_order, payment_received, ocr_pending, withdrawal_request, withdrawal_approved, withdrawal_rejected, review_pending, low_stock. Auth via Bearer header OR HttpOnly refresh-token cookie (same as other admin routes). Heartbeat every 25s.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'text/event-stream connection established',
        content: { 'text/event-stream': { schema: z.string().describe('SSE frames — `event: <type>\\ndata: <json>\\n\\n` per event, with `:` comment lines for heartbeats') } }
      },
      401: { description: 'Not authenticated' },
      403: { description: 'Not an admin or distributor' }
    }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/users',
    tags: [tag.name], description: 'List all users (admin)',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Users' } }
  });

  registry.registerPath({
    method: 'put', path: '/api/v1/admin/users/{id}',
    tags: [tag.name], description: 'Update a user (role, monthly active, wallet balances)',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema, body: { content: { 'application/json': { schema: AdminUserUpdateSchema } } } },
    responses: { 200: { description: 'Updated' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/withdrawals',
    tags: [tag.name], description: 'List withdrawal requests (admin)',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Withdrawals' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/withdrawals/{id}',
    tags: [tag.name], description: 'Get a single withdrawal request (admin)',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: { 200: { description: 'Withdrawal' } }
  });

  registry.registerPath({
    method: 'put', path: '/api/v1/admin/withdrawals/{id}',
    tags: [tag.name], description: 'Approve or reject a withdrawal. On reject, wallet is refunded atomically.',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema, body: { content: { 'application/json': { schema: WithdrawalUpdateSchema } } } },
    responses: { 200: { description: 'Updated' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/metrics',
    tags: [tag.name], description: 'Live in-process metrics: HTTP request counts, latency histograms, SSE connections, refresh-token metrics, notification + search counts. Resets on process restart.',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Metrics snapshot' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/admin/metrics/reset',
    tags: [tag.name], description: 'Reset all in-process metric counters (admin only, logged in audit).',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Reset OK' } }
  });
};

// ── AI / i18n admin ───────────────────────────────────────────────────────
export const registerAIRoutes = () => {
  const tag = Tag('AI / i18n', 'Manual + automatic AI translation');

  registry.registerPath({
    method: 'post', path: '/api/v1/ai/translate',
    tags: [tag.name], description: 'One-off AI translation (admin). Each call costs API quota.',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: AITranslateSchema } } } },
    responses: { 200: { description: 'Translations per locale' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/i18n/stats',
    tags: [tag.name], description: 'Translation coverage stats per model (admin)',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Coverage' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/admin/i18n/translate',
    tags: [tag.name], description: 'Translate missing fields for one record (admin)',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: I18nTranslateSchema } } } },
    responses: { 200: { description: 'Fill stats' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/admin/i18n/translate-batch',
    tags: [tag.name], description: 'Translate missing fields for up to N records (admin)',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: I18nTranslateBatchSchema } } } },
    responses: { 200: { description: 'Batch fill stats' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/i18n/ui-strings',
    tags: [tag.name], description: 'Load the storefront UI string overrides (per locale) used to override the bundled locale JSON at storefront boot. Returns `{ overrides: { tr:{}, ru:{}, kg:{} } }`.',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'UI string overrides' } }
  });

  registry.registerPath({
    method: 'patch', path: '/api/v1/admin/i18n/ui-strings',
    tags: [tag.name], description: 'Save a single UI string override. `key` is a dot path (e.g. `cart.addToCart`); an empty `value` removes the override (reverts to bundled default).',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: z.object({
      locale: z.enum(['tr', 'ru', 'kg']),
      key: z.string().min(1).max(200),
      value: z.string().max(10000)
    }) } } } },
    responses: { 200: { description: 'Saved' }, 400: { description: 'Invalid input' } }
  });
};

// ── Upload ────────────────────────────────────────────────────────────────
export const registerUploadRoutes = () => {
  const tag = Tag('Media', 'Image + folder management');

  registry.registerPath({
    method: 'get', path: '/api/v1/upload',
    tags: [tag.name], description: 'List all media files (public)',
    responses: { 200: { description: 'Media' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/upload/folders',
    tags: [tag.name], description: 'List media folders',
    responses: { 200: { description: 'Folders' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/upload/folders',
    tags: [tag.name], description: 'Create a media folder (admin)',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: MediaFolderCreateSchema } } } },
    responses: { 200: { description: 'Created' } }
  });

  registry.registerPath({
    method: 'delete', path: '/api/v1/upload/folders/{id}',
    tags: [tag.name], description: 'Delete a folder (admin). Media inside are moved to root.',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: { 200: { description: 'Deleted' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/upload',
    tags: [tag.name], description: 'Upload one or more images (admin). Produces WebP 85 + AVIF + 600/1024/1920 variants.',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'multipart/form-data': { schema: z.object({ files: z.array(z.any()).max(20), folderId: z.string().nullable().optional() }) } } } },
    responses: { 200: { description: 'Upload results' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/upload/hires',
    tags: [tag.name], description: 'Upload high-res images (admin). Cap 2560w, quality 88.',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Hi-res upload results' } }
  });

  registry.registerPath({
    method: 'put', path: '/api/v1/upload/{id}/move',
    tags: [tag.name], description: 'Move a media file to a different folder (admin)',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema, body: { content: { 'application/json': { schema: MediaMoveSchema } } } },
    responses: { 200: { description: 'Moved' } }
  });

  registry.registerPath({
    method: 'delete', path: '/api/v1/upload/{id}',
    tags: [tag.name], description: 'Delete a media file (admin)',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: { 200: { description: 'Deleted' } }
  });
};

// ── Reviews ───────────────────────────────────────────────────────────────
export const registerReviewRoutes = () => {
  const productTag = Tag('Product Reviews', 'Customer reviews on products');
  const storeTag = Tag('Store Reviews', 'Reviews of the store itself');

  registry.registerPath({
    method: 'post', path: '/api/v1/reviews',
    tags: [productTag.name], description: 'Submit a product review (public, pending until moderation)',
    request: { body: { content: { 'application/json': { schema: ReviewSubmitSchema } } } },
    responses: { 201: { description: 'Submitted for moderation' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/reviews/product/{productId}',
    tags: [productTag.name], description: 'List published reviews for a product (public)',
    request: { params: z.object({ productId: z.string() }) },
    responses: { 200: { description: 'Reviews' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/reviews/admin/all',
    tags: [productTag.name], description: 'List all reviews for moderation (admin)',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'All reviews' } }
  });

  registry.registerPath({
    method: 'put', path: '/api/v1/reviews/admin/{id}/status',
    tags: [productTag.name], description: 'Update a review status / translations (admin)',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema, body: { content: { 'application/json': { schema: ReviewStatusUpdateSchema } } } },
    responses: { 200: { description: 'Updated' } }
  });

  registry.registerPath({
    method: 'delete', path: '/api/v1/reviews/admin/{id}',
    tags: [productTag.name], description: 'Delete a review (admin)',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: { 200: { description: 'Deleted' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/store-reviews',
    tags: [storeTag.name], description: 'Submit a store review (public)',
    request: { body: { content: { 'application/json': { schema: StoreReviewSubmitSchema } } } },
    responses: { 201: { description: 'Submitted' } }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/store-reviews',
    tags: [storeTag.name], description: 'List published store reviews (public)',
    responses: { 200: { description: 'Reviews' } }
  });

  registry.registerPath({
    method: 'put', path: '/api/v1/store-reviews/admin/{id}/status',
    tags: [storeTag.name], description: 'Update a store review status (admin)',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema, body: { content: { 'application/json': { schema: ReviewStatusUpdateSchema } } } },
    responses: { 200: { description: 'Updated' } }
  });
};

// ── Health ────────────────────────────────────────────────────────────────
export const registerHealthRoutes = () => {
  const tag = Tag('Health', 'Liveness + readiness probes (no auth, no rate limit)');

  registry.registerPath({
    method: 'get', path: '/health',
    tags: [tag.name], description: 'Liveness: process is up, returns uptime + memory',
    responses: { 200: { description: 'OK' } }
  });

  registry.registerPath({
    method: 'get', path: '/health/ready',
    tags: [tag.name], description: 'Readiness: pings the DB. Returns 503 if degraded.',
    responses: { 200: { description: 'Ready' }, 503: { description: 'Degraded' } }
  });
};

export const registerErrorRoutes = () => {
  const tag = Tag('Errors', 'Front-end error ingestion + admin feed');

  registry.registerPath({
    method: 'post', path: '/api/v1/errors/report',
    tags: [tag.name], description: 'Report a client-side error. Open to anonymous, rate-limited.',
    request: {
      body: {
        content: { 'application/json': { schema: z.object({
          message: z.string().min(1).max(500),
          stack: z.string().max(32768).optional(),
          source: z.string().min(1).max(80),
          phase: z.string().max(80).optional(),
          route: z.string().max(200).optional(),
          locale: z.string().max(8).optional(),
          context: z.string().max(2048).optional(),
          clientTimestamp: z.string().datetime().optional()
        }) } }
      }
    },
    responses: {
      201: { description: 'Error persisted' },
      400: { description: 'Invalid payload' },
      429: { description: 'Rate limited' }
    }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/errors/recent',
    tags: [tag.name], description: 'Admin: recent client errors. Pass ?resolved=true to include resolved.',
    security: [{ bearerAuth: [] }],
    request: { query: z.object({ limit: z.coerce.number().int().min(1).max(200).optional(), resolved: z.enum(['true','false']).optional() }) },
    responses: { 200: { description: 'Recent errors' }, 401: { description: 'Unauthenticated' }, 403: { description: 'Admin only' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/errors/{id}/resolve',
    tags: [tag.name], description: 'Admin: mark a client error as resolved.',
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().min(1) }),
      body: { content: { 'application/json': { schema: z.object({ resolvedNote: z.string().max(2000).optional() }) } } }
    },
    responses: { 200: { description: 'Resolved' }, 404: { description: 'Not found' } }
  });
};

// ─── Trends ────────────────────────────────────────────────────────────────
export const registerTrendsRoutes = () => {
  const tag = Tag('Admin — Trends', 'Time-bucketed KPIs (revenue, orders, users)');

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/trends',
    tags: [tag.name],
    description: 'Daily-bucketed aggregates over the last N days (default 30, max 365). Used by the AdminChartWidget on the dashboard.',
    security: [{ bearerAuth: [] }],
    request: { query: TrendsQuerySchema },
    responses: {
      200: {
        description: 'Daily buckets + totals',
        content: { 'application/json': { schema: TrendsResponse } }
      },
      401: { description: 'Not authenticated', content: { 'application/json': { schema: ErrorResponse } } },
      403: { description: 'Not an admin', content: { 'application/json': { schema: ErrorResponse } } }
    }
  });
};

// ─── Search ────────────────────────────────────────────────────────────────
export const registerSearchRoutes = () => {
  const tag = Tag('Admin — Search', 'Typeahead autocomplete for user/product pickers');

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/search/users',
    tags: [tag.name],
    description: 'Search users by name or email (LIKE, case-insensitive). Min 2 chars. Cached 60s. Used by AdminUserSearch typeahead.',
    security: [{ bearerAuth: [] }],
    request: { query: AdminSearchQuerySchema },
    responses: {
      200: {
        description: 'Top N matches + total count',
        content: { 'application/json': { schema: SearchEnvelope(AdminUserSearchResult) } }
      },
      401: { description: 'Not authenticated', content: { 'application/json': { schema: ErrorResponse } } },
      403: { description: 'Not an admin', content: { 'application/json': { schema: ErrorResponse } } }
    }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/search/products',
    tags: [tag.name],
    description: 'Search products by name or barcode prefix. Cached 60s. Used by AdminProductSearch typeahead (AdminDashboard stock column).',
    security: [{ bearerAuth: [] }],
    request: { query: AdminSearchQuerySchema },
    responses: {
      200: {
        description: 'Top N matches + total count',
        content: { 'application/json': { schema: SearchEnvelope(AdminProductSearchResult) } }
      },
      401: { description: 'Not authenticated', content: { 'application/json': { schema: ErrorResponse } } },
      403: { description: 'Not an admin', content: { 'application/json': { schema: ErrorResponse } } }
    }
  });
};

// ─── Analytics ────────────────────────────────────────────────────────────
export const registerAnalyticsRoutes = () => {
  const tag = Tag('Admin — Analytics', 'BI aggregates (category mix, top customers, top products)');

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/analytics/categories',
    tags: [tag.name],
    description: 'Revenue + units sold grouped by product category over the last N days. Each entry includes sharePct (out of 100). Cancelled orders are excluded.',
    security: [{ bearerAuth: [] }],
    request: { query: AnalyticsQuerySchema },
    responses: {
      200: {
        description: 'Per-category revenue + sharePct + totalRevenueKgs',
        content: { 'application/json': { schema: z.object({
          range: TrendsRange,
          categories: z.array(CategoryAnalytics),
          totalRevenueKgs: z.number()
        }) } }
      },
      401: { description: 'Not authenticated' },
      403: { description: 'Not an admin' }
    }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/analytics/top-customers',
    tags: [tag.name],
    description: 'Top N customers ranked by total spend (KGS). Default limit 10, max 50.',
    security: [{ bearerAuth: [] }],
    request: { query: AnalyticsQuerySchema },
    responses: {
      200: {
        description: 'Ranked customers',
        content: { 'application/json': { schema: z.object({
          range: TrendsRange,
          customers: z.array(TopCustomer)
        }) } }
      },
      401: { description: 'Not authenticated' },
      403: { description: 'Not an admin' }
    }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/analytics/top-products',
    tags: [tag.name],
    description: 'Top N products ranked by units sold (with revenue as secondary metric).',
    security: [{ bearerAuth: [] }],
    request: { query: AnalyticsQuerySchema },
    responses: {
      200: {
        description: 'Ranked products',
        content: { 'application/json': { schema: z.object({
          range: TrendsRange,
          products: z.array(TopProduct)
        }) } }
      },
      401: { description: 'Not authenticated' },
      403: { description: 'Not an admin' }
    }
  });
};

// ─── Bulk actions ──────────────────────────────────────────────────────────
export const registerBulkRoutes = () => {
  const tag = Tag('Admin — Bulk', 'Bulk CSV export + bulk operations');

  const CSV_DESC = (kind: string) => `CSV export of ${kind}. Columns are RFC 4180 escaped, UTF-8 BOM prefix for Excel auto-detection, max 10k rows.`;

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/bulk/orders.csv',
    tags: [tag.name], description: CSV_DESC('orders (with date filter via ?from=&to=)'),
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'text/csv', content: { 'text/csv': { schema: z.string() } } } }
  });
  registry.registerPath({
    method: 'get', path: '/api/v1/admin/bulk/users.csv',
    tags: [tag.name], description: CSV_DESC('users'),
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'text/csv' } }
  });
  registry.registerPath({
    method: 'get', path: '/api/v1/admin/bulk/products.csv',
    tags: [tag.name], description: CSV_DESC('products (filterable by categoryId and lowStock=1)'),
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'text/csv' } }
  });
  registry.registerPath({
    method: 'get', path: '/api/v1/admin/bulk/withdrawals.csv',
    tags: [tag.name], description: CSV_DESC('withdrawal requests'),
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'text/csv' } }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/admin/bulk/orders/status',
    tags: [tag.name],
    description: 'Bulk-update the status of up to 500 orders. Triggers side effects (audit event, payment_received SSE, etc.).',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: BulkOrderStatusSchema } } } },
    responses: { 200: { description: 'Summary', content: { 'application/json': { schema: BulkResult } } } }
  });
  registry.registerPath({
    method: 'post', path: '/api/v1/admin/bulk/users/role',
    tags: [tag.name], description: 'Bulk-update the role of up to 500 users.',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: BulkUserRoleSchema } } } },
    responses: { 200: { description: 'Summary', content: { 'application/json': { schema: BulkResult } } } }
  });
  registry.registerPath({
    method: 'post', path: '/api/v1/admin/bulk/products/category',
    tags: [tag.name], description: 'Bulk-move up to 500 products into a category (null to un-categorize).',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: BulkProductCategorySchema } } } },
    responses: { 200: { description: 'Summary', content: { 'application/json': { schema: BulkResult } } } }
  });
  registry.registerPath({
    method: 'post', path: '/api/v1/admin/bulk/delete',
    tags: [tag.name],
    description: 'Bulk soft-delete (users) or hard-delete (orders/products). Always audited via adminEvents.',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: z.object({
      kind: z.enum(['orders', 'users', 'products']),
      ids: z.array(z.string().min(8)).min(1).max(500)
    }) } } } },
    responses: { 200: { description: 'Summary', content: { 'application/json': { schema: BulkResult } } } }
  });
};

// ─── Impersonation ────────────────────────────────────────────────────────
export const registerImpersonationRoutes = () => {
  const tag = Tag('Admin — Impersonation', 'Admin audit + active session status');

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/impersonation/sessions',
    tags: [tag.name],
    description: 'Cursor-paginated audit log of the calling admin\'s impersonation sessions (most recent first). Sessions are tied to the real admin via X-Real-Admin header requirement.',
    security: [{ bearerAuth: [] }],
    request: { query: CursorQuerySchema },
    responses: {
      200: {
        description: 'Page of sessions + next cursor',
        content: { 'application/json': { schema: CursorEnvelope(ImpersonationSession) } }
      },
      401: { description: 'Not authenticated' },
      403: { description: 'Not an admin' }
    }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/impersonation/status',
    tags: [tag.name],
    description: 'Get the current impersonation status for the calling admin. Used by the ImpersonationBanner / useImpersonation composable on mount.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Status', content: { 'application/json': { schema: ImpersonationActiveStatus } } },
      401: { description: 'Not authenticated' }
    }
  });

  registry.registerPath({
    method: 'post', path: '/api/v1/admin/impersonation/impersonate',
    tags: [tag.name],
    description: 'Start an impersonation session against a target user. Returns 201 with the sessionId; subsequent requests must include X-Impersonation-Session=<id>.',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: z.object({
      targetId: z.string().min(8).max(64),
      reason: z.string().max(500).optional()
    }) } } } },
    responses: { 201: { description: 'Session started' }, 403: { description: 'Not an admin' } }
  });

  registry.registerPath({
    method: 'delete', path: '/api/v1/admin/impersonation/impersonate/{sessionId}',
    tags: [tag.name],
    description: 'End an impersonation session early (admin-only — admins always have the kill switch).',
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ sessionId: z.string() }) },
    responses: { 200: { description: 'Session ended' } }
  });
};

// ─── Cart ─────────────────────────────────────────────────────────────────
export const registerCartRoutes = () => {
  const tag = Tag('Cart', 'Shopping cart');

  registry.registerPath({
    method: 'get', path: '/api/v1/cart',
    tags: [tag.name], description: 'Get the current user\'s cart',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Cart' }, 401: { description: 'Not authenticated' } }
  });
  registry.registerPath({
    method: 'post', path: '/api/v1/cart',
    tags: [tag.name], description: 'Add an item to the cart',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Updated cart' } }
  });
  registry.registerPath({
    method: 'put', path: '/api/v1/cart/{id}',
    tags: [tag.name], description: 'Update cart item quantity',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: { 200: { description: 'Updated cart' } }
  });
  registry.registerPath({
    method: 'delete', path: '/api/v1/cart/{id}',
    tags: [tag.name], description: 'Remove a cart item',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: { 200: { description: 'Cart' } }
  });
};

// ─── Presence ─────────────────────────────────────────────────────────────
export const registerPresenceRoutes = () => {
  const tag = Tag('Presence', 'Live product page view tracking');

  registry.registerPath({
    method: 'post', path: '/api/v1/presence/{productId}',
    tags: [tag.name],
    description: 'Heartbeat from a product page (10s cadence). Increments the live viewer count for the cart-recovery funnel.',
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ productId: z.string() }) },
    responses: { 200: { description: 'OK' } }
  });
  registry.registerPath({
    method: 'get', path: '/api/v1/presence/{productId}',
    tags: [tag.name],
    description: 'Get the current live viewer count for a product (public, Redis-cached).',
    request: { params: z.object({ productId: z.string() }) },
    responses: { 200: { description: 'Viewers count' } }
  });
  registry.registerPath({
    method: 'get', path: '/api/v1/presence/admin/all',
    tags: [tag.name], description: 'Get live viewers + abandoned carts (admin)',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Presence map' } }
  });
};

// ─── Push / broadcast ────────────────────────────────────────────────────
export const registerPushRoutes = () => {
  const tag = Tag('Push', 'Web Push subscriptions + broadcast history');

  registry.registerPath({
    method: 'post', path: '/api/v1/push/subscribe',
    tags: [tag.name], description: 'Subscribe the current browser to push notifications',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Subscribed' } }
  });
  registry.registerPath({
    method: 'delete', path: '/api/v1/push/subscribe',
    tags: [tag.name], description: 'Unsubscribe the current browser',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Unsubscribed' } }
  });
  registry.registerPath({
    method: 'get', path: '/api/v1/push/preferences',
    tags: [tag.name], description: 'Get the user\'s push preferences (admin/cashier)',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Preferences' } }
  });
  registry.registerPath({
    method: 'get', path: '/api/v1/push/broadcast-history',
    tags: [tag.name],
    description: 'Cursor-paginated broadcast log with actor/target/event filters.',
    security: [{ bearerAuth: [] }],
    request: { query: CursorQuerySchema },
    responses: {
      200: {
        description: 'Page of broadcast log entries',
        content: { 'application/json': { schema: CursorEnvelope(BroadcastLogEntry) } }
      },
      401: { description: 'Not authenticated' },
      403: { description: 'Not an admin' }
    }
  });
  registry.registerPath({
    method: 'get', path: '/api/v1/push/broadcast-history.csv',
    tags: [tag.name], description: 'CSV export of broadcast history (admin). RFC 4180, UTF-8 BOM.',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'text/csv' } }
  });
  registry.registerPath({
    method: 'post', path: '/api/v1/push/broadcast',
    tags: [tag.name], description: 'Send a push notification to a single user / multi-target list / role segment. Returns 201 with sent/expired/failed counters (and parentBroadcastId for multi).',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: z.object({
      title: z.string().min(1).max(200),
      body: z.string().min(1).max(2000),
      url: z.string().max(500).optional(),
      eventKey: z.string().min(1).max(64),
      tag: z.string().max(64).optional(),
      note: z.string().max(500).optional(),
      userId: z.string().optional(),
      userIds: z.array(z.string()).optional(),
      role: z.string().optional()
    }).passthrough() } } } },
    responses: {
      201: {
        description: 'Broadcast queued',
        content: { 'application/json': { schema: z.object({
          sent: z.number().optional(),
          expired: z.number().optional(),
          failed: z.number().optional(),
          parentBroadcastId: z.string().optional(),
          targetCount: z.number().optional(),
          totalSent: z.number().optional()
        }).passthrough() } }
      }
    }
  });
  registry.registerPath({
    method: 'post', path: '/api/v1/push/test',
    tags: [tag.name], description: 'Send a test push to the calling admin (browser self-test)',
    security: [{ bearerAuth: [] }],
    request: { body: { content: { 'application/json': { schema: z.object({
      message: z.string().max(2000).optional()
    }).passthrough() } } } },
    responses: { 200: { description: 'Sent' } }
  });
};

// ─── Cart recovery (admin) ────────────────────────────────────────────────
export const registerCartRecoveryRoutes = () => {
  const tag = Tag('Admin — Cart Recovery', 'Abandoned-cart dashboard + campaigns');

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/cart-recovery',
    tags: [tag.name], description: 'Live cart-recovery funnel: views → abandoned → recovered (admin)',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Funnel' } }
  });
};

// ─── Inventory ────────────────────────────────────────────────────────────
export const registerInventoryRoutes = () => {
  const tag = Tag('Inventory', 'Stock movement tracking');

  registry.registerPath({
    method: 'get', path: '/api/v1/inventory/{productId}',
    tags: [tag.name], description: 'List stock movements for a product',
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ productId: z.string() }) },
    responses: { 200: { description: 'Movements' } }
  });
};

// ─── Admin — list endpoints (paginated) ───────────────────────────────────
export const registerAdminListRoutes = () => {
  const tag = Tag('Admin — Lists', 'Standard paginated list endpoints');

  registry.registerPath({
    method: 'get', path: '/api/v1/orders',
    tags: [tag.name],
    description: 'List orders (admin, paginated). Excludes cancelled by default; pass includeCancelled=true to include them. Filter by status.',
    security: [{ bearerAuth: [] }],
    request: { query: OrderListQuerySchema },
    responses: {
      200: {
        description: 'Paginated envelope',
        content: { 'application/json': { schema: PaginationEnvelope(AdminOrderListItem) } }
      },
      401: { description: 'Not authenticated' },
      403: { description: 'Not an admin' }
    }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/users',
    tags: [tag.name], description: 'List users (admin, paginated). Filterable by ?search=.',
    security: [{ bearerAuth: [] }],
    request: { query: PaginationQuerySchema },
    responses: {
      200: {
        description: 'Paginated envelope',
        content: { 'application/json': { schema: PaginationEnvelope(AdminUserSchema.extend({
          walletBalanceKgs: z.string(),
          walletBalanceUsd: z.string(),
          isMonthlyActive: z.boolean(),
          createdAt: z.string(),
          sponsor: z.object({ name: z.string() }).nullable().optional()
        })) } }
      },
      401: { description: 'Not authenticated' },
      403: { description: 'Not an admin' }
    }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/withdrawals',
    tags: [tag.name], description: 'List withdrawals (admin, paginated).',
    security: [{ bearerAuth: [] }],
    request: { query: PaginationQuerySchema },
    responses: {
      200: {
        description: 'Paginated envelope',
        content: { 'application/json': { schema: PaginationEnvelope(AdminWithdrawalSchema) } }
      },
      401: { description: 'Not authenticated' },
      403: { description: 'Not an admin' }
    }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/reviews/admin/all',
    tags: [tag.name], description: 'List product reviews (admin, paginated)',
    security: [{ bearerAuth: [] }],
    request: { query: PaginationQuerySchema },
    responses: {
      200: {
        description: 'Paginated envelope',
        content: { 'application/json': { schema: PaginationEnvelope(AdminReviewListItem) } }
      },
      401: { description: 'Not authenticated' },
      403: { description: 'Not an admin' }
    }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/store-reviews/admin/all',
    tags: [tag.name], description: 'List store reviews (admin, paginated)',
    security: [{ bearerAuth: [] }],
    request: { query: PaginationQuerySchema },
    responses: {
      200: {
        description: 'Paginated envelope',
        content: { 'application/json': { schema: PaginationEnvelope(AdminStoreReviewListItem) } }
      },
      401: { description: 'Not authenticated' },
      403: { description: 'Not an admin' }
    }
  });

  registry.registerPath({
    method: 'get', path: '/api/v1/finance/transactions',
    tags: [tag.name], description: 'List the authenticated user\'s transactions (paginated).',
    security: [{ bearerAuth: [] }],
    request: { query: PaginationQuerySchema },
    responses: {
      200: {
        description: 'Paginated envelope',
        content: { 'application/json': { schema: PaginationEnvelope(FinanceTransaction) } }
      },
      401: { description: 'Not authenticated' }
    }
  });
};

// ─── Admin — Logs ─────────────────────────────────────────────────────────
export const registerAdminLogsRoutes = () => {
  const tag = Tag('Admin — Logs', 'Live log tail (admin, streaming)');

  registry.registerPath({
    method: 'get', path: '/api/v1/admin/logs',
    tags: [tag.name],
    description: 'Tail the most recent lines of the backend log file. Filters: ?level=info|warn|error|debug, ?q=text, ?limit=200, ?maxBytes=256K, ?since=ms. Returns parsed JSON lines ordered chronologically (oldest first).',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Parsed log lines' }, 503: { description: 'Log file not configured' } }
  });
};

// ─── Admin — broadcast send ──────────────────────────────────────────────
export const registerAdminBroadcastRoutes = () => {
  const tag = Tag('Admin — Broadcast', 'Push broadcast send + test');

  registry.registerPath({
    method: 'post', path: '/api/v1/admin/broadcast',
    tags: [tag.name],
    description: 'Send a broadcast via Web Push (admin). Supports single / multi / segment targets. Mirrors /push/broadcast but admin-scoped.',
    security: [{ bearerAuth: [] }],
    responses: { 201: { description: 'Broadcast queued' } }
  });
};

/** Register every documented route in one call. */
export const registerAllRoutes = () => {
  registerAuthRoutes();
  registerProductRoutes();
  registerCategoryRoutes();
  registerSliderRoutes();
  registerSettingsRoutes();
  registerPageRoutes();
  registerOrderRoutes();
  registerCheckoutRoutes();
  registerFinanceRoutes();
  registerSystemRoutes();
  registerAdminRoutes();
  registerAdminListRoutes();      // NEW — paginated list endpoints
  registerAdminLogsRoutes();      // NEW
  registerAdminBroadcastRoutes(); // NEW
  registerAIRoutes();
  registerAnalyticsRoutes();      // NEW — H
  registerBulkRoutes();          // NEW — bulk CSV + operations
  registerCartRecoveryRoutes();   // NEW
  registerCartRoutes();           // NEW
  registerImpersonationRoutes();  // NEW
  registerInventoryRoutes();      // NEW
  registerPresenceRoutes();       // NEW
  registerPushRoutes();           // NEW
  registerReviewRoutes();
  registerSearchRoutes();         // NEW — G
  registerTrendsRoutes();         // NEW — F
  registerUploadRoutes();
  registerHealthRoutes();
  registerErrorRoutes();
};
