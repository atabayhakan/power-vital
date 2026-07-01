
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  role: 'role',
  sponsorId: 'sponsorId',
  placementId: 'placementId',
  legPosition: 'legPosition',
  name: 'name',
  email: 'email',
  passwordHash: 'passwordHash',
  phone: 'phone',
  address: 'address',
  city: 'city',
  birthDate: 'birthDate',
  walletBalanceKgs: 'walletBalanceKgs',
  walletBalanceUsd: 'walletBalanceUsd',
  cumulativeSpendKgs: 'cumulativeSpendKgs',
  loyaltyLevel: 'loyaltyLevel',
  dynamicDiscountRate: 'dynamicDiscountRate',
  isMonthlyActive: 'isMonthlyActive',
  preferredLocale: 'preferredLocale',
  deletedAt: 'deletedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WithdrawalRequestScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  amount: 'amount',
  currency: 'currency',
  status: 'status',
  bankInfo: 'bankInfo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  barcode: 'barcode',
  name: 'name',
  description: 'description',
  accordions: 'accordions',
  benefits: 'benefits',
  basePriceKgs: 'basePriceKgs',
  translations: 'translations',
  stockQuantity: 'stockQuantity',
  minStockAlert: 'minStockAlert',
  categoryId: 'categoryId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PriceRuleScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  role: 'role',
  customPriceKgs: 'customPriceKgs'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  orderType: 'orderType',
  status: 'status',
  totalKgs: 'totalKgs',
  paymentMethod: 'paymentMethod',
  customerName: 'customerName',
  customerPhone: 'customerPhone',
  customerEmail: 'customerEmail',
  address: 'address',
  receiptImageUrl: 'receiptImageUrl',
  ocrResult: 'ocrResult',
  verifiedAt: 'verifiedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderItemScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  productId: 'productId',
  quantity: 'quantity',
  unitPriceKgs: 'unitPriceKgs',
  totalPriceKgs: 'totalPriceKgs'
};

exports.Prisma.TransactionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  amount: 'amount',
  currency: 'currency',
  description: 'description',
  createdAt: 'createdAt'
};

exports.Prisma.SystemConfigScalarFieldEnum = {
  id: 'id',
  isMlmEnabled: 'isMlmEnabled',
  maxPayoutLimitPct: 'maxPayoutLimitPct',
  isFastStartActive: 'isFastStartActive',
  fastStartRates: 'fastStartRates',
  isUnilevelActive: 'isUnilevelActive',
  unilevelRates: 'unilevelRates',
  isOverdriveActive: 'isOverdriveActive',
  overdrivePoolPct: 'overdrivePoolPct',
  updatedAt: 'updatedAt'
};

exports.Prisma.WeeklyCycleScalarFieldEnum = {
  id: 'id',
  weekNumber: 'weekNumber',
  year: 'year',
  startDate: 'startDate',
  endDate: 'endDate',
  isClosed: 'isClosed'
};

exports.Prisma.UserWeeklyStatsScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  cycleId: 'cycleId',
  personalVolume: 'personalVolume',
  teamVolume: 'teamVolume',
  carryOverVolume: 'carryOverVolume'
};

exports.Prisma.HeroSlideScalarFieldEnum = {
  id: 'id',
  title: 'title',
  subtitle: 'subtitle',
  buttonText: 'buttonText',
  buttonLink: 'buttonLink',
  imageUrl: 'imageUrl',
  mobileImageUrl: 'mobileImageUrl',
  displayMode: 'displayMode',
  overlayOpacity: 'overlayOpacity',
  scheduledStart: 'scheduledStart',
  scheduledEnd: 'scheduledEnd',
  sortOrder: 'sortOrder',
  translations: 'translations',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  iconEmoji: 'iconEmoji',
  imageUrl: 'imageUrl',
  translations: 'translations',
  sortOrder: 'sortOrder',
  isActive: 'isActive'
};

exports.Prisma.ProductImageScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  imageUrl: 'imageUrl',
  sortOrder: 'sortOrder'
};

exports.Prisma.SiteSettingsScalarFieldEnum = {
  id: 'id',
  companyName: 'companyName',
  logoUrl: 'logoUrl',
  address: 'address',
  phone: 'phone',
  email: 'email',
  mapIframeCode: 'mapIframeCode',
  topbarShippingMsg: 'topbarShippingMsg',
  topbarPhone: 'topbarPhone',
  trustBadges: 'trustBadges',
  partners: 'partners',
  footerLinks: 'footerLinks',
  homepageBlocks: 'homepageBlocks',
  themeSettings: 'themeSettings',
  financeSettings: 'financeSettings',
  faqItems: 'faqItems',
  copyrightText: 'copyrightText',
  activeThemeId: 'activeThemeId',
  campaignEnabled: 'campaignEnabled',
  campaignEndsAt: 'campaignEndsAt',
  campaignTitle: 'campaignTitle',
  campaignCta: 'campaignCta',
  campaignLink: 'campaignLink',
  translations: 'translations',
  uiTranslations: 'uiTranslations',
  updatedAt: 'updatedAt'
};

exports.Prisma.MediaFolderScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt'
};

exports.Prisma.MediaScalarFieldEnum = {
  id: 'id',
  folderId: 'folderId',
  filename: 'filename',
  originalName: 'originalName',
  url: 'url',
  mimeType: 'mimeType',
  size: 'size',
  createdAt: 'createdAt'
};

exports.Prisma.PageScalarFieldEnum = {
  id: 'id',
  slug: 'slug',
  title: 'title',
  content: 'content',
  translations: 'translations',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductReviewScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  userId: 'userId',
  name: 'name',
  rating: 'rating',
  text: 'text',
  translations: 'translations',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StoreReviewScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  name: 'name',
  rating: 'rating',
  text: 'text',
  translations: 'translations',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RefreshTokenScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  tokenHash: 'tokenHash',
  family: 'family',
  replacedBy: 'replacedBy',
  revokedAt: 'revokedAt',
  issuedToIp: 'issuedToIp',
  userAgent: 'userAgent',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.PushSubscriptionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  endpoint: 'endpoint',
  p256dh: 'p256dh',
  auth: 'auth',
  userAgent: 'userAgent',
  preferences: 'preferences',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lastSeenAt: 'lastSeenAt'
};

exports.Prisma.CartAbandonmentScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  guestId: 'guestId',
  lastProductId: 'lastProductId',
  lastProductName: 'lastProductName',
  lastProductImg: 'lastProductImg',
  cartItems: 'cartItems',
  cartTotalKgs: 'cartTotalKgs',
  status: 'status',
  lastActivityAt: 'lastActivityAt',
  notifiedAt: 'notifiedAt',
  convertedAt: 'convertedAt',
  expiresAt: 'expiresAt',
  translations: 'translations',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BroadcastLogScalarFieldEnum = {
  id: 'id',
  actorId: 'actorId',
  targetId: 'targetId',
  eventKey: 'eventKey',
  sent: 'sent',
  expired: 'expired',
  failed: 'failed',
  note: 'note',
  parentBroadcastId: 'parentBroadcastId',
  createdAt: 'createdAt'
};

exports.Prisma.BroadcastJobScalarFieldEnum = {
  id: 'id',
  actorId: 'actorId',
  note: 'note',
  status: 'status',
  targetMode: 'targetMode',
  targetIds: 'targetIds',
  segmentRole: 'segmentRole',
  title: 'title',
  body: 'body',
  url: 'url',
  eventKey: 'eventKey',
  tag: 'tag',
  scheduledAt: 'scheduledAt',
  dispatchedAt: 'dispatchedAt',
  cancelledAt: 'cancelledAt',
  resultParentBroadcastId: 'resultParentBroadcastId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ImpersonationSessionScalarFieldEnum = {
  id: 'id',
  adminId: 'adminId',
  targetId: 'targetId',
  reason: 'reason',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  startedAt: 'startedAt',
  expiresAt: 'expiresAt',
  endedAt: 'endedAt',
  endedByAdmin: 'endedByAdmin'
};

exports.Prisma.ClientErrorScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  source: 'source',
  message: 'message',
  stack: 'stack',
  phase: 'phase',
  route: 'route',
  locale: 'locale',
  userAgent: 'userAgent',
  context: 'context',
  resolved: 'resolved',
  resolvedAt: 'resolvedAt',
  resolvedBy: 'resolvedBy',
  resolvedNote: 'resolvedNote',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  User: 'User',
  WithdrawalRequest: 'WithdrawalRequest',
  Product: 'Product',
  PriceRule: 'PriceRule',
  Order: 'Order',
  OrderItem: 'OrderItem',
  Transaction: 'Transaction',
  SystemConfig: 'SystemConfig',
  WeeklyCycle: 'WeeklyCycle',
  UserWeeklyStats: 'UserWeeklyStats',
  HeroSlide: 'HeroSlide',
  Category: 'Category',
  ProductImage: 'ProductImage',
  SiteSettings: 'SiteSettings',
  MediaFolder: 'MediaFolder',
  Media: 'Media',
  Page: 'Page',
  ProductReview: 'ProductReview',
  StoreReview: 'StoreReview',
  RefreshToken: 'RefreshToken',
  PushSubscription: 'PushSubscription',
  CartAbandonment: 'CartAbandonment',
  BroadcastLog: 'BroadcastLog',
  BroadcastJob: 'BroadcastJob',
  ImpersonationSession: 'ImpersonationSession',
  ClientError: 'ClientError'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
