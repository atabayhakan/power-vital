
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
  name: 'name',
  email: 'email',
  passwordHash: 'passwordHash',
  walletBalanceKgs: 'walletBalanceKgs',
  walletBalanceUsd: 'walletBalanceUsd',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  barcode: 'barcode',
  name: 'name',
  description: 'description',
  basePriceKgs: 'basePriceKgs',
  basePriceUsd: 'basePriceUsd',
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
  totalUsd: 'totalUsd',
  paymentMethod: 'paymentMethod',
  customerName: 'customerName',
  customerPhone: 'customerPhone',
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

exports.Prisma.ExchangeRateScalarFieldEnum = {
  id: 'id',
  currency: 'currency',
  rateToKgs: 'rateToKgs',
  updatedAt: 'updatedAt'
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
  sortOrder: 'sortOrder',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  iconEmoji: 'iconEmoji',
  imageUrl: 'imageUrl',
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
  copyrightText: 'copyrightText',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.Role = exports.$Enums.Role = {
  admin: 'admin',
  customer: 'customer',
  dealer: 'dealer',
  distributor: 'distributor'
};

exports.OrderType = exports.$Enums.OrderType = {
  pos: 'pos',
  ecommerce: 'ecommerce',
  b2b: 'b2b'
};

exports.OrderStatus = exports.$Enums.OrderStatus = {
  pending: 'pending',
  paid: 'paid',
  completed: 'completed',
  shipped: 'shipped',
  cancelled: 'cancelled',
  refunded: 'refunded'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  cash: 'cash',
  credit_card: 'credit_card',
  wallet: 'wallet',
  qr_transfer: 'qr_transfer'
};

exports.TransactionType = exports.$Enums.TransactionType = {
  deposit: 'deposit',
  withdrawal: 'withdrawal',
  bonus: 'bonus',
  purchase: 'purchase'
};

exports.Currency = exports.$Enums.Currency = {
  KGS: 'KGS',
  USD: 'USD'
};

exports.Prisma.ModelName = {
  User: 'User',
  Product: 'Product',
  PriceRule: 'PriceRule',
  Order: 'Order',
  OrderItem: 'OrderItem',
  Transaction: 'Transaction',
  ExchangeRate: 'ExchangeRate',
  SystemConfig: 'SystemConfig',
  WeeklyCycle: 'WeeklyCycle',
  UserWeeklyStats: 'UserWeeklyStats',
  HeroSlide: 'HeroSlide',
  Category: 'Category',
  ProductImage: 'ProductImage',
  SiteSettings: 'SiteSettings'
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
