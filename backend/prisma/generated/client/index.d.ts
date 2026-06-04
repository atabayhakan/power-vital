
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Product
 * 
 */
export type Product = $Result.DefaultSelection<Prisma.$ProductPayload>
/**
 * Model PriceRule
 * 
 */
export type PriceRule = $Result.DefaultSelection<Prisma.$PriceRulePayload>
/**
 * Model Order
 * 
 */
export type Order = $Result.DefaultSelection<Prisma.$OrderPayload>
/**
 * Model OrderItem
 * 
 */
export type OrderItem = $Result.DefaultSelection<Prisma.$OrderItemPayload>
/**
 * Model Transaction
 * 
 */
export type Transaction = $Result.DefaultSelection<Prisma.$TransactionPayload>
/**
 * Model ExchangeRate
 * 
 */
export type ExchangeRate = $Result.DefaultSelection<Prisma.$ExchangeRatePayload>
/**
 * Model SystemConfig
 * 
 */
export type SystemConfig = $Result.DefaultSelection<Prisma.$SystemConfigPayload>
/**
 * Model WeeklyCycle
 * 
 */
export type WeeklyCycle = $Result.DefaultSelection<Prisma.$WeeklyCyclePayload>
/**
 * Model UserWeeklyStats
 * 
 */
export type UserWeeklyStats = $Result.DefaultSelection<Prisma.$UserWeeklyStatsPayload>
/**
 * Model HeroSlide
 * 
 */
export type HeroSlide = $Result.DefaultSelection<Prisma.$HeroSlidePayload>
/**
 * Model Category
 * 
 */
export type Category = $Result.DefaultSelection<Prisma.$CategoryPayload>
/**
 * Model ProductImage
 * 
 */
export type ProductImage = $Result.DefaultSelection<Prisma.$ProductImagePayload>
/**
 * Model SiteSettings
 * 
 */
export type SiteSettings = $Result.DefaultSelection<Prisma.$SiteSettingsPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Role: {
  admin: 'admin',
  customer: 'customer',
  dealer: 'dealer',
  distributor: 'distributor'
};

export type Role = (typeof Role)[keyof typeof Role]


export const OrderType: {
  pos: 'pos',
  ecommerce: 'ecommerce',
  b2b: 'b2b'
};

export type OrderType = (typeof OrderType)[keyof typeof OrderType]


export const OrderStatus: {
  pending: 'pending',
  paid: 'paid',
  completed: 'completed',
  shipped: 'shipped',
  cancelled: 'cancelled',
  refunded: 'refunded'
};

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]


export const PaymentMethod: {
  cash: 'cash',
  credit_card: 'credit_card',
  wallet: 'wallet',
  qr_transfer: 'qr_transfer'
};

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]


export const TransactionType: {
  deposit: 'deposit',
  withdrawal: 'withdrawal',
  bonus: 'bonus',
  purchase: 'purchase'
};

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType]


export const Currency: {
  KGS: 'KGS',
  USD: 'USD'
};

export type Currency = (typeof Currency)[keyof typeof Currency]

}

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

export type OrderType = $Enums.OrderType

export const OrderType: typeof $Enums.OrderType

export type OrderStatus = $Enums.OrderStatus

export const OrderStatus: typeof $Enums.OrderStatus

export type PaymentMethod = $Enums.PaymentMethod

export const PaymentMethod: typeof $Enums.PaymentMethod

export type TransactionType = $Enums.TransactionType

export const TransactionType: typeof $Enums.TransactionType

export type Currency = $Enums.Currency

export const Currency: typeof $Enums.Currency

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs>;

  /**
   * `prisma.product`: Exposes CRUD operations for the **Product** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Products
    * const products = await prisma.product.findMany()
    * ```
    */
  get product(): Prisma.ProductDelegate<ExtArgs>;

  /**
   * `prisma.priceRule`: Exposes CRUD operations for the **PriceRule** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PriceRules
    * const priceRules = await prisma.priceRule.findMany()
    * ```
    */
  get priceRule(): Prisma.PriceRuleDelegate<ExtArgs>;

  /**
   * `prisma.order`: Exposes CRUD operations for the **Order** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Orders
    * const orders = await prisma.order.findMany()
    * ```
    */
  get order(): Prisma.OrderDelegate<ExtArgs>;

  /**
   * `prisma.orderItem`: Exposes CRUD operations for the **OrderItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more OrderItems
    * const orderItems = await prisma.orderItem.findMany()
    * ```
    */
  get orderItem(): Prisma.OrderItemDelegate<ExtArgs>;

  /**
   * `prisma.transaction`: Exposes CRUD operations for the **Transaction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Transactions
    * const transactions = await prisma.transaction.findMany()
    * ```
    */
  get transaction(): Prisma.TransactionDelegate<ExtArgs>;

  /**
   * `prisma.exchangeRate`: Exposes CRUD operations for the **ExchangeRate** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ExchangeRates
    * const exchangeRates = await prisma.exchangeRate.findMany()
    * ```
    */
  get exchangeRate(): Prisma.ExchangeRateDelegate<ExtArgs>;

  /**
   * `prisma.systemConfig`: Exposes CRUD operations for the **SystemConfig** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SystemConfigs
    * const systemConfigs = await prisma.systemConfig.findMany()
    * ```
    */
  get systemConfig(): Prisma.SystemConfigDelegate<ExtArgs>;

  /**
   * `prisma.weeklyCycle`: Exposes CRUD operations for the **WeeklyCycle** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WeeklyCycles
    * const weeklyCycles = await prisma.weeklyCycle.findMany()
    * ```
    */
  get weeklyCycle(): Prisma.WeeklyCycleDelegate<ExtArgs>;

  /**
   * `prisma.userWeeklyStats`: Exposes CRUD operations for the **UserWeeklyStats** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more UserWeeklyStats
    * const userWeeklyStats = await prisma.userWeeklyStats.findMany()
    * ```
    */
  get userWeeklyStats(): Prisma.UserWeeklyStatsDelegate<ExtArgs>;

  /**
   * `prisma.heroSlide`: Exposes CRUD operations for the **HeroSlide** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more HeroSlides
    * const heroSlides = await prisma.heroSlide.findMany()
    * ```
    */
  get heroSlide(): Prisma.HeroSlideDelegate<ExtArgs>;

  /**
   * `prisma.category`: Exposes CRUD operations for the **Category** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Categories
    * const categories = await prisma.category.findMany()
    * ```
    */
  get category(): Prisma.CategoryDelegate<ExtArgs>;

  /**
   * `prisma.productImage`: Exposes CRUD operations for the **ProductImage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ProductImages
    * const productImages = await prisma.productImage.findMany()
    * ```
    */
  get productImage(): Prisma.ProductImageDelegate<ExtArgs>;

  /**
   * `prisma.siteSettings`: Exposes CRUD operations for the **SiteSettings** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SiteSettings
    * const siteSettings = await prisma.siteSettings.findMany()
    * ```
    */
  get siteSettings(): Prisma.SiteSettingsDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
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

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "user" | "product" | "priceRule" | "order" | "orderItem" | "transaction" | "exchangeRate" | "systemConfig" | "weeklyCycle" | "userWeeklyStats" | "heroSlide" | "category" | "productImage" | "siteSettings"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Product: {
        payload: Prisma.$ProductPayload<ExtArgs>
        fields: Prisma.ProductFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProductFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProductFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          findFirst: {
            args: Prisma.ProductFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProductFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          findMany: {
            args: Prisma.ProductFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          create: {
            args: Prisma.ProductCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          createMany: {
            args: Prisma.ProductCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProductCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          delete: {
            args: Prisma.ProductDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          update: {
            args: Prisma.ProductUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          deleteMany: {
            args: Prisma.ProductDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProductUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ProductUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          aggregate: {
            args: Prisma.ProductAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProduct>
          }
          groupBy: {
            args: Prisma.ProductGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProductGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProductCountArgs<ExtArgs>
            result: $Utils.Optional<ProductCountAggregateOutputType> | number
          }
        }
      }
      PriceRule: {
        payload: Prisma.$PriceRulePayload<ExtArgs>
        fields: Prisma.PriceRuleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PriceRuleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceRulePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PriceRuleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceRulePayload>
          }
          findFirst: {
            args: Prisma.PriceRuleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceRulePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PriceRuleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceRulePayload>
          }
          findMany: {
            args: Prisma.PriceRuleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceRulePayload>[]
          }
          create: {
            args: Prisma.PriceRuleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceRulePayload>
          }
          createMany: {
            args: Prisma.PriceRuleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PriceRuleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceRulePayload>[]
          }
          delete: {
            args: Prisma.PriceRuleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceRulePayload>
          }
          update: {
            args: Prisma.PriceRuleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceRulePayload>
          }
          deleteMany: {
            args: Prisma.PriceRuleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PriceRuleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PriceRuleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceRulePayload>
          }
          aggregate: {
            args: Prisma.PriceRuleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePriceRule>
          }
          groupBy: {
            args: Prisma.PriceRuleGroupByArgs<ExtArgs>
            result: $Utils.Optional<PriceRuleGroupByOutputType>[]
          }
          count: {
            args: Prisma.PriceRuleCountArgs<ExtArgs>
            result: $Utils.Optional<PriceRuleCountAggregateOutputType> | number
          }
        }
      }
      Order: {
        payload: Prisma.$OrderPayload<ExtArgs>
        fields: Prisma.OrderFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OrderFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OrderFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          findFirst: {
            args: Prisma.OrderFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OrderFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          findMany: {
            args: Prisma.OrderFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>[]
          }
          create: {
            args: Prisma.OrderCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          createMany: {
            args: Prisma.OrderCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.OrderCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>[]
          }
          delete: {
            args: Prisma.OrderDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          update: {
            args: Prisma.OrderUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          deleteMany: {
            args: Prisma.OrderDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OrderUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.OrderUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          aggregate: {
            args: Prisma.OrderAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOrder>
          }
          groupBy: {
            args: Prisma.OrderGroupByArgs<ExtArgs>
            result: $Utils.Optional<OrderGroupByOutputType>[]
          }
          count: {
            args: Prisma.OrderCountArgs<ExtArgs>
            result: $Utils.Optional<OrderCountAggregateOutputType> | number
          }
        }
      }
      OrderItem: {
        payload: Prisma.$OrderItemPayload<ExtArgs>
        fields: Prisma.OrderItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OrderItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OrderItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderItemPayload>
          }
          findFirst: {
            args: Prisma.OrderItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OrderItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderItemPayload>
          }
          findMany: {
            args: Prisma.OrderItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderItemPayload>[]
          }
          create: {
            args: Prisma.OrderItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderItemPayload>
          }
          createMany: {
            args: Prisma.OrderItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.OrderItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderItemPayload>[]
          }
          delete: {
            args: Prisma.OrderItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderItemPayload>
          }
          update: {
            args: Prisma.OrderItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderItemPayload>
          }
          deleteMany: {
            args: Prisma.OrderItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OrderItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.OrderItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderItemPayload>
          }
          aggregate: {
            args: Prisma.OrderItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOrderItem>
          }
          groupBy: {
            args: Prisma.OrderItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<OrderItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.OrderItemCountArgs<ExtArgs>
            result: $Utils.Optional<OrderItemCountAggregateOutputType> | number
          }
        }
      }
      Transaction: {
        payload: Prisma.$TransactionPayload<ExtArgs>
        fields: Prisma.TransactionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TransactionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TransactionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          findFirst: {
            args: Prisma.TransactionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TransactionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          findMany: {
            args: Prisma.TransactionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>[]
          }
          create: {
            args: Prisma.TransactionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          createMany: {
            args: Prisma.TransactionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TransactionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>[]
          }
          delete: {
            args: Prisma.TransactionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          update: {
            args: Prisma.TransactionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          deleteMany: {
            args: Prisma.TransactionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TransactionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TransactionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          aggregate: {
            args: Prisma.TransactionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTransaction>
          }
          groupBy: {
            args: Prisma.TransactionGroupByArgs<ExtArgs>
            result: $Utils.Optional<TransactionGroupByOutputType>[]
          }
          count: {
            args: Prisma.TransactionCountArgs<ExtArgs>
            result: $Utils.Optional<TransactionCountAggregateOutputType> | number
          }
        }
      }
      ExchangeRate: {
        payload: Prisma.$ExchangeRatePayload<ExtArgs>
        fields: Prisma.ExchangeRateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ExchangeRateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangeRatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ExchangeRateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangeRatePayload>
          }
          findFirst: {
            args: Prisma.ExchangeRateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangeRatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ExchangeRateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangeRatePayload>
          }
          findMany: {
            args: Prisma.ExchangeRateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangeRatePayload>[]
          }
          create: {
            args: Prisma.ExchangeRateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangeRatePayload>
          }
          createMany: {
            args: Prisma.ExchangeRateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ExchangeRateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangeRatePayload>[]
          }
          delete: {
            args: Prisma.ExchangeRateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangeRatePayload>
          }
          update: {
            args: Prisma.ExchangeRateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangeRatePayload>
          }
          deleteMany: {
            args: Prisma.ExchangeRateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ExchangeRateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ExchangeRateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangeRatePayload>
          }
          aggregate: {
            args: Prisma.ExchangeRateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateExchangeRate>
          }
          groupBy: {
            args: Prisma.ExchangeRateGroupByArgs<ExtArgs>
            result: $Utils.Optional<ExchangeRateGroupByOutputType>[]
          }
          count: {
            args: Prisma.ExchangeRateCountArgs<ExtArgs>
            result: $Utils.Optional<ExchangeRateCountAggregateOutputType> | number
          }
        }
      }
      SystemConfig: {
        payload: Prisma.$SystemConfigPayload<ExtArgs>
        fields: Prisma.SystemConfigFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SystemConfigFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemConfigPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SystemConfigFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemConfigPayload>
          }
          findFirst: {
            args: Prisma.SystemConfigFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemConfigPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SystemConfigFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemConfigPayload>
          }
          findMany: {
            args: Prisma.SystemConfigFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemConfigPayload>[]
          }
          create: {
            args: Prisma.SystemConfigCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemConfigPayload>
          }
          createMany: {
            args: Prisma.SystemConfigCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SystemConfigCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemConfigPayload>[]
          }
          delete: {
            args: Prisma.SystemConfigDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemConfigPayload>
          }
          update: {
            args: Prisma.SystemConfigUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemConfigPayload>
          }
          deleteMany: {
            args: Prisma.SystemConfigDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SystemConfigUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SystemConfigUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemConfigPayload>
          }
          aggregate: {
            args: Prisma.SystemConfigAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSystemConfig>
          }
          groupBy: {
            args: Prisma.SystemConfigGroupByArgs<ExtArgs>
            result: $Utils.Optional<SystemConfigGroupByOutputType>[]
          }
          count: {
            args: Prisma.SystemConfigCountArgs<ExtArgs>
            result: $Utils.Optional<SystemConfigCountAggregateOutputType> | number
          }
        }
      }
      WeeklyCycle: {
        payload: Prisma.$WeeklyCyclePayload<ExtArgs>
        fields: Prisma.WeeklyCycleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WeeklyCycleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeeklyCyclePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WeeklyCycleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeeklyCyclePayload>
          }
          findFirst: {
            args: Prisma.WeeklyCycleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeeklyCyclePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WeeklyCycleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeeklyCyclePayload>
          }
          findMany: {
            args: Prisma.WeeklyCycleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeeklyCyclePayload>[]
          }
          create: {
            args: Prisma.WeeklyCycleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeeklyCyclePayload>
          }
          createMany: {
            args: Prisma.WeeklyCycleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WeeklyCycleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeeklyCyclePayload>[]
          }
          delete: {
            args: Prisma.WeeklyCycleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeeklyCyclePayload>
          }
          update: {
            args: Prisma.WeeklyCycleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeeklyCyclePayload>
          }
          deleteMany: {
            args: Prisma.WeeklyCycleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WeeklyCycleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.WeeklyCycleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeeklyCyclePayload>
          }
          aggregate: {
            args: Prisma.WeeklyCycleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWeeklyCycle>
          }
          groupBy: {
            args: Prisma.WeeklyCycleGroupByArgs<ExtArgs>
            result: $Utils.Optional<WeeklyCycleGroupByOutputType>[]
          }
          count: {
            args: Prisma.WeeklyCycleCountArgs<ExtArgs>
            result: $Utils.Optional<WeeklyCycleCountAggregateOutputType> | number
          }
        }
      }
      UserWeeklyStats: {
        payload: Prisma.$UserWeeklyStatsPayload<ExtArgs>
        fields: Prisma.UserWeeklyStatsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserWeeklyStatsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeeklyStatsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserWeeklyStatsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeeklyStatsPayload>
          }
          findFirst: {
            args: Prisma.UserWeeklyStatsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeeklyStatsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserWeeklyStatsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeeklyStatsPayload>
          }
          findMany: {
            args: Prisma.UserWeeklyStatsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeeklyStatsPayload>[]
          }
          create: {
            args: Prisma.UserWeeklyStatsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeeklyStatsPayload>
          }
          createMany: {
            args: Prisma.UserWeeklyStatsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserWeeklyStatsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeeklyStatsPayload>[]
          }
          delete: {
            args: Prisma.UserWeeklyStatsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeeklyStatsPayload>
          }
          update: {
            args: Prisma.UserWeeklyStatsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeeklyStatsPayload>
          }
          deleteMany: {
            args: Prisma.UserWeeklyStatsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserWeeklyStatsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserWeeklyStatsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeeklyStatsPayload>
          }
          aggregate: {
            args: Prisma.UserWeeklyStatsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUserWeeklyStats>
          }
          groupBy: {
            args: Prisma.UserWeeklyStatsGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserWeeklyStatsGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserWeeklyStatsCountArgs<ExtArgs>
            result: $Utils.Optional<UserWeeklyStatsCountAggregateOutputType> | number
          }
        }
      }
      HeroSlide: {
        payload: Prisma.$HeroSlidePayload<ExtArgs>
        fields: Prisma.HeroSlideFieldRefs
        operations: {
          findUnique: {
            args: Prisma.HeroSlideFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HeroSlidePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.HeroSlideFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HeroSlidePayload>
          }
          findFirst: {
            args: Prisma.HeroSlideFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HeroSlidePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.HeroSlideFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HeroSlidePayload>
          }
          findMany: {
            args: Prisma.HeroSlideFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HeroSlidePayload>[]
          }
          create: {
            args: Prisma.HeroSlideCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HeroSlidePayload>
          }
          createMany: {
            args: Prisma.HeroSlideCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.HeroSlideCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HeroSlidePayload>[]
          }
          delete: {
            args: Prisma.HeroSlideDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HeroSlidePayload>
          }
          update: {
            args: Prisma.HeroSlideUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HeroSlidePayload>
          }
          deleteMany: {
            args: Prisma.HeroSlideDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.HeroSlideUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.HeroSlideUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HeroSlidePayload>
          }
          aggregate: {
            args: Prisma.HeroSlideAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateHeroSlide>
          }
          groupBy: {
            args: Prisma.HeroSlideGroupByArgs<ExtArgs>
            result: $Utils.Optional<HeroSlideGroupByOutputType>[]
          }
          count: {
            args: Prisma.HeroSlideCountArgs<ExtArgs>
            result: $Utils.Optional<HeroSlideCountAggregateOutputType> | number
          }
        }
      }
      Category: {
        payload: Prisma.$CategoryPayload<ExtArgs>
        fields: Prisma.CategoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CategoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CategoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findFirst: {
            args: Prisma.CategoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CategoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findMany: {
            args: Prisma.CategoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          create: {
            args: Prisma.CategoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          createMany: {
            args: Prisma.CategoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CategoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          delete: {
            args: Prisma.CategoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          update: {
            args: Prisma.CategoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          deleteMany: {
            args: Prisma.CategoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CategoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CategoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          aggregate: {
            args: Prisma.CategoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCategory>
          }
          groupBy: {
            args: Prisma.CategoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<CategoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.CategoryCountArgs<ExtArgs>
            result: $Utils.Optional<CategoryCountAggregateOutputType> | number
          }
        }
      }
      ProductImage: {
        payload: Prisma.$ProductImagePayload<ExtArgs>
        fields: Prisma.ProductImageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProductImageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductImagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProductImageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductImagePayload>
          }
          findFirst: {
            args: Prisma.ProductImageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductImagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProductImageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductImagePayload>
          }
          findMany: {
            args: Prisma.ProductImageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductImagePayload>[]
          }
          create: {
            args: Prisma.ProductImageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductImagePayload>
          }
          createMany: {
            args: Prisma.ProductImageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProductImageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductImagePayload>[]
          }
          delete: {
            args: Prisma.ProductImageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductImagePayload>
          }
          update: {
            args: Prisma.ProductImageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductImagePayload>
          }
          deleteMany: {
            args: Prisma.ProductImageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProductImageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ProductImageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductImagePayload>
          }
          aggregate: {
            args: Prisma.ProductImageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProductImage>
          }
          groupBy: {
            args: Prisma.ProductImageGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProductImageGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProductImageCountArgs<ExtArgs>
            result: $Utils.Optional<ProductImageCountAggregateOutputType> | number
          }
        }
      }
      SiteSettings: {
        payload: Prisma.$SiteSettingsPayload<ExtArgs>
        fields: Prisma.SiteSettingsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SiteSettingsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SiteSettingsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SiteSettingsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SiteSettingsPayload>
          }
          findFirst: {
            args: Prisma.SiteSettingsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SiteSettingsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SiteSettingsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SiteSettingsPayload>
          }
          findMany: {
            args: Prisma.SiteSettingsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SiteSettingsPayload>[]
          }
          create: {
            args: Prisma.SiteSettingsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SiteSettingsPayload>
          }
          createMany: {
            args: Prisma.SiteSettingsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SiteSettingsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SiteSettingsPayload>[]
          }
          delete: {
            args: Prisma.SiteSettingsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SiteSettingsPayload>
          }
          update: {
            args: Prisma.SiteSettingsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SiteSettingsPayload>
          }
          deleteMany: {
            args: Prisma.SiteSettingsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SiteSettingsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SiteSettingsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SiteSettingsPayload>
          }
          aggregate: {
            args: Prisma.SiteSettingsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSiteSettings>
          }
          groupBy: {
            args: Prisma.SiteSettingsGroupByArgs<ExtArgs>
            result: $Utils.Optional<SiteSettingsGroupByOutputType>[]
          }
          count: {
            args: Prisma.SiteSettingsCountArgs<ExtArgs>
            result: $Utils.Optional<SiteSettingsCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    sponsoredUsers: number
    orders: number
    transactions: number
    userWeeklyStats: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sponsoredUsers?: boolean | UserCountOutputTypeCountSponsoredUsersArgs
    orders?: boolean | UserCountOutputTypeCountOrdersArgs
    transactions?: boolean | UserCountOutputTypeCountTransactionsArgs
    userWeeklyStats?: boolean | UserCountOutputTypeCountUserWeeklyStatsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSponsoredUsersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountOrdersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrderWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountUserWeeklyStatsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWeeklyStatsWhereInput
  }


  /**
   * Count Type ProductCountOutputType
   */

  export type ProductCountOutputType = {
    priceRules: number
    orderItems: number
    images: number
  }

  export type ProductCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    priceRules?: boolean | ProductCountOutputTypeCountPriceRulesArgs
    orderItems?: boolean | ProductCountOutputTypeCountOrderItemsArgs
    images?: boolean | ProductCountOutputTypeCountImagesArgs
  }

  // Custom InputTypes
  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductCountOutputType
     */
    select?: ProductCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeCountPriceRulesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PriceRuleWhereInput
  }

  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeCountOrderItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrderItemWhereInput
  }

  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeCountImagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProductImageWhereInput
  }


  /**
   * Count Type OrderCountOutputType
   */

  export type OrderCountOutputType = {
    items: number
  }

  export type OrderCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    items?: boolean | OrderCountOutputTypeCountItemsArgs
  }

  // Custom InputTypes
  /**
   * OrderCountOutputType without action
   */
  export type OrderCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderCountOutputType
     */
    select?: OrderCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * OrderCountOutputType without action
   */
  export type OrderCountOutputTypeCountItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrderItemWhereInput
  }


  /**
   * Count Type WeeklyCycleCountOutputType
   */

  export type WeeklyCycleCountOutputType = {
    userStats: number
  }

  export type WeeklyCycleCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    userStats?: boolean | WeeklyCycleCountOutputTypeCountUserStatsArgs
  }

  // Custom InputTypes
  /**
   * WeeklyCycleCountOutputType without action
   */
  export type WeeklyCycleCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeeklyCycleCountOutputType
     */
    select?: WeeklyCycleCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * WeeklyCycleCountOutputType without action
   */
  export type WeeklyCycleCountOutputTypeCountUserStatsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWeeklyStatsWhereInput
  }


  /**
   * Count Type CategoryCountOutputType
   */

  export type CategoryCountOutputType = {
    products: number
  }

  export type CategoryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    products?: boolean | CategoryCountOutputTypeCountProductsArgs
  }

  // Custom InputTypes
  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryCountOutputType
     */
    select?: CategoryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeCountProductsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProductWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    walletBalanceKgs: Decimal | null
    walletBalanceUsd: Decimal | null
  }

  export type UserSumAggregateOutputType = {
    walletBalanceKgs: Decimal | null
    walletBalanceUsd: Decimal | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    role: $Enums.Role | null
    sponsorId: string | null
    name: string | null
    email: string | null
    passwordHash: string | null
    walletBalanceKgs: Decimal | null
    walletBalanceUsd: Decimal | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    role: $Enums.Role | null
    sponsorId: string | null
    name: string | null
    email: string | null
    passwordHash: string | null
    walletBalanceKgs: Decimal | null
    walletBalanceUsd: Decimal | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    role: number
    sponsorId: number
    name: number
    email: number
    passwordHash: number
    walletBalanceKgs: number
    walletBalanceUsd: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    walletBalanceKgs?: true
    walletBalanceUsd?: true
  }

  export type UserSumAggregateInputType = {
    walletBalanceKgs?: true
    walletBalanceUsd?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    role?: true
    sponsorId?: true
    name?: true
    email?: true
    passwordHash?: true
    walletBalanceKgs?: true
    walletBalanceUsd?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    role?: true
    sponsorId?: true
    name?: true
    email?: true
    passwordHash?: true
    walletBalanceKgs?: true
    walletBalanceUsd?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    role?: true
    sponsorId?: true
    name?: true
    email?: true
    passwordHash?: true
    walletBalanceKgs?: true
    walletBalanceUsd?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    role: $Enums.Role
    sponsorId: string | null
    name: string
    email: string
    passwordHash: string
    walletBalanceKgs: Decimal
    walletBalanceUsd: Decimal
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    role?: boolean
    sponsorId?: boolean
    name?: boolean
    email?: boolean
    passwordHash?: boolean
    walletBalanceKgs?: boolean
    walletBalanceUsd?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    sponsor?: boolean | User$sponsorArgs<ExtArgs>
    sponsoredUsers?: boolean | User$sponsoredUsersArgs<ExtArgs>
    orders?: boolean | User$ordersArgs<ExtArgs>
    transactions?: boolean | User$transactionsArgs<ExtArgs>
    userWeeklyStats?: boolean | User$userWeeklyStatsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    role?: boolean
    sponsorId?: boolean
    name?: boolean
    email?: boolean
    passwordHash?: boolean
    walletBalanceKgs?: boolean
    walletBalanceUsd?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    sponsor?: boolean | User$sponsorArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    role?: boolean
    sponsorId?: boolean
    name?: boolean
    email?: boolean
    passwordHash?: boolean
    walletBalanceKgs?: boolean
    walletBalanceUsd?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sponsor?: boolean | User$sponsorArgs<ExtArgs>
    sponsoredUsers?: boolean | User$sponsoredUsersArgs<ExtArgs>
    orders?: boolean | User$ordersArgs<ExtArgs>
    transactions?: boolean | User$transactionsArgs<ExtArgs>
    userWeeklyStats?: boolean | User$userWeeklyStatsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sponsor?: boolean | User$sponsorArgs<ExtArgs>
  }

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      sponsor: Prisma.$UserPayload<ExtArgs> | null
      sponsoredUsers: Prisma.$UserPayload<ExtArgs>[]
      orders: Prisma.$OrderPayload<ExtArgs>[]
      transactions: Prisma.$TransactionPayload<ExtArgs>[]
      userWeeklyStats: Prisma.$UserWeeklyStatsPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      role: $Enums.Role
      sponsorId: string | null
      name: string
      email: string
      passwordHash: string
      walletBalanceKgs: Prisma.Decimal
      walletBalanceUsd: Prisma.Decimal
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sponsor<T extends User$sponsorArgs<ExtArgs> = {}>(args?: Subset<T, User$sponsorArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    sponsoredUsers<T extends User$sponsoredUsersArgs<ExtArgs> = {}>(args?: Subset<T, User$sponsoredUsersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany"> | Null>
    orders<T extends User$ordersArgs<ExtArgs> = {}>(args?: Subset<T, User$ordersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findMany"> | Null>
    transactions<T extends User$transactionsArgs<ExtArgs> = {}>(args?: Subset<T, User$transactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany"> | Null>
    userWeeklyStats<T extends User$userWeeklyStatsArgs<ExtArgs> = {}>(args?: Subset<T, User$userWeeklyStatsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserWeeklyStatsPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'Role'>
    readonly sponsorId: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly passwordHash: FieldRef<"User", 'String'>
    readonly walletBalanceKgs: FieldRef<"User", 'Decimal'>
    readonly walletBalanceUsd: FieldRef<"User", 'Decimal'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }

  /**
   * User.sponsor
   */
  export type User$sponsorArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
  }

  /**
   * User.sponsoredUsers
   */
  export type User$sponsoredUsersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    cursor?: UserWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User.orders
   */
  export type User$ordersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    where?: OrderWhereInput
    orderBy?: OrderOrderByWithRelationInput | OrderOrderByWithRelationInput[]
    cursor?: OrderWhereUniqueInput
    take?: number
    skip?: number
    distinct?: OrderScalarFieldEnum | OrderScalarFieldEnum[]
  }

  /**
   * User.transactions
   */
  export type User$transactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    cursor?: TransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * User.userWeeklyStats
   */
  export type User$userWeeklyStatsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeeklyStats
     */
    select?: UserWeeklyStatsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeeklyStatsInclude<ExtArgs> | null
    where?: UserWeeklyStatsWhereInput
    orderBy?: UserWeeklyStatsOrderByWithRelationInput | UserWeeklyStatsOrderByWithRelationInput[]
    cursor?: UserWeeklyStatsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserWeeklyStatsScalarFieldEnum | UserWeeklyStatsScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Product
   */

  export type AggregateProduct = {
    _count: ProductCountAggregateOutputType | null
    _avg: ProductAvgAggregateOutputType | null
    _sum: ProductSumAggregateOutputType | null
    _min: ProductMinAggregateOutputType | null
    _max: ProductMaxAggregateOutputType | null
  }

  export type ProductAvgAggregateOutputType = {
    basePriceKgs: Decimal | null
    basePriceUsd: Decimal | null
    stockQuantity: number | null
    minStockAlert: number | null
  }

  export type ProductSumAggregateOutputType = {
    basePriceKgs: Decimal | null
    basePriceUsd: Decimal | null
    stockQuantity: number | null
    minStockAlert: number | null
  }

  export type ProductMinAggregateOutputType = {
    id: string | null
    barcode: string | null
    name: string | null
    description: string | null
    basePriceKgs: Decimal | null
    basePriceUsd: Decimal | null
    stockQuantity: number | null
    minStockAlert: number | null
    categoryId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProductMaxAggregateOutputType = {
    id: string | null
    barcode: string | null
    name: string | null
    description: string | null
    basePriceKgs: Decimal | null
    basePriceUsd: Decimal | null
    stockQuantity: number | null
    minStockAlert: number | null
    categoryId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProductCountAggregateOutputType = {
    id: number
    barcode: number
    name: number
    description: number
    basePriceKgs: number
    basePriceUsd: number
    stockQuantity: number
    minStockAlert: number
    categoryId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ProductAvgAggregateInputType = {
    basePriceKgs?: true
    basePriceUsd?: true
    stockQuantity?: true
    minStockAlert?: true
  }

  export type ProductSumAggregateInputType = {
    basePriceKgs?: true
    basePriceUsd?: true
    stockQuantity?: true
    minStockAlert?: true
  }

  export type ProductMinAggregateInputType = {
    id?: true
    barcode?: true
    name?: true
    description?: true
    basePriceKgs?: true
    basePriceUsd?: true
    stockQuantity?: true
    minStockAlert?: true
    categoryId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProductMaxAggregateInputType = {
    id?: true
    barcode?: true
    name?: true
    description?: true
    basePriceKgs?: true
    basePriceUsd?: true
    stockQuantity?: true
    minStockAlert?: true
    categoryId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProductCountAggregateInputType = {
    id?: true
    barcode?: true
    name?: true
    description?: true
    basePriceKgs?: true
    basePriceUsd?: true
    stockQuantity?: true
    minStockAlert?: true
    categoryId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ProductAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Product to aggregate.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Products
    **/
    _count?: true | ProductCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProductAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProductSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProductMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProductMaxAggregateInputType
  }

  export type GetProductAggregateType<T extends ProductAggregateArgs> = {
        [P in keyof T & keyof AggregateProduct]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProduct[P]>
      : GetScalarType<T[P], AggregateProduct[P]>
  }




  export type ProductGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProductWhereInput
    orderBy?: ProductOrderByWithAggregationInput | ProductOrderByWithAggregationInput[]
    by: ProductScalarFieldEnum[] | ProductScalarFieldEnum
    having?: ProductScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProductCountAggregateInputType | true
    _avg?: ProductAvgAggregateInputType
    _sum?: ProductSumAggregateInputType
    _min?: ProductMinAggregateInputType
    _max?: ProductMaxAggregateInputType
  }

  export type ProductGroupByOutputType = {
    id: string
    barcode: string
    name: string
    description: string | null
    basePriceKgs: Decimal
    basePriceUsd: Decimal
    stockQuantity: number
    minStockAlert: number
    categoryId: string | null
    createdAt: Date
    updatedAt: Date
    _count: ProductCountAggregateOutputType | null
    _avg: ProductAvgAggregateOutputType | null
    _sum: ProductSumAggregateOutputType | null
    _min: ProductMinAggregateOutputType | null
    _max: ProductMaxAggregateOutputType | null
  }

  type GetProductGroupByPayload<T extends ProductGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProductGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProductGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProductGroupByOutputType[P]>
            : GetScalarType<T[P], ProductGroupByOutputType[P]>
        }
      >
    >


  export type ProductSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    barcode?: boolean
    name?: boolean
    description?: boolean
    basePriceKgs?: boolean
    basePriceUsd?: boolean
    stockQuantity?: boolean
    minStockAlert?: boolean
    categoryId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    category?: boolean | Product$categoryArgs<ExtArgs>
    priceRules?: boolean | Product$priceRulesArgs<ExtArgs>
    orderItems?: boolean | Product$orderItemsArgs<ExtArgs>
    images?: boolean | Product$imagesArgs<ExtArgs>
    _count?: boolean | ProductCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["product"]>

  export type ProductSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    barcode?: boolean
    name?: boolean
    description?: boolean
    basePriceKgs?: boolean
    basePriceUsd?: boolean
    stockQuantity?: boolean
    minStockAlert?: boolean
    categoryId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    category?: boolean | Product$categoryArgs<ExtArgs>
  }, ExtArgs["result"]["product"]>

  export type ProductSelectScalar = {
    id?: boolean
    barcode?: boolean
    name?: boolean
    description?: boolean
    basePriceKgs?: boolean
    basePriceUsd?: boolean
    stockQuantity?: boolean
    minStockAlert?: boolean
    categoryId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ProductInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | Product$categoryArgs<ExtArgs>
    priceRules?: boolean | Product$priceRulesArgs<ExtArgs>
    orderItems?: boolean | Product$orderItemsArgs<ExtArgs>
    images?: boolean | Product$imagesArgs<ExtArgs>
    _count?: boolean | ProductCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ProductIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | Product$categoryArgs<ExtArgs>
  }

  export type $ProductPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Product"
    objects: {
      category: Prisma.$CategoryPayload<ExtArgs> | null
      priceRules: Prisma.$PriceRulePayload<ExtArgs>[]
      orderItems: Prisma.$OrderItemPayload<ExtArgs>[]
      images: Prisma.$ProductImagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      barcode: string
      name: string
      description: string | null
      basePriceKgs: Prisma.Decimal
      basePriceUsd: Prisma.Decimal
      stockQuantity: number
      minStockAlert: number
      categoryId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["product"]>
    composites: {}
  }

  type ProductGetPayload<S extends boolean | null | undefined | ProductDefaultArgs> = $Result.GetResult<Prisma.$ProductPayload, S>

  type ProductCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ProductFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ProductCountAggregateInputType | true
    }

  export interface ProductDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Product'], meta: { name: 'Product' } }
    /**
     * Find zero or one Product that matches the filter.
     * @param {ProductFindUniqueArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProductFindUniqueArgs>(args: SelectSubset<T, ProductFindUniqueArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Product that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ProductFindUniqueOrThrowArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProductFindUniqueOrThrowArgs>(args: SelectSubset<T, ProductFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Product that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindFirstArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProductFindFirstArgs>(args?: SelectSubset<T, ProductFindFirstArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Product that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindFirstOrThrowArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProductFindFirstOrThrowArgs>(args?: SelectSubset<T, ProductFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Products that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Products
     * const products = await prisma.product.findMany()
     * 
     * // Get first 10 Products
     * const products = await prisma.product.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const productWithIdOnly = await prisma.product.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProductFindManyArgs>(args?: SelectSubset<T, ProductFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Product.
     * @param {ProductCreateArgs} args - Arguments to create a Product.
     * @example
     * // Create one Product
     * const Product = await prisma.product.create({
     *   data: {
     *     // ... data to create a Product
     *   }
     * })
     * 
     */
    create<T extends ProductCreateArgs>(args: SelectSubset<T, ProductCreateArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Products.
     * @param {ProductCreateManyArgs} args - Arguments to create many Products.
     * @example
     * // Create many Products
     * const product = await prisma.product.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProductCreateManyArgs>(args?: SelectSubset<T, ProductCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Products and returns the data saved in the database.
     * @param {ProductCreateManyAndReturnArgs} args - Arguments to create many Products.
     * @example
     * // Create many Products
     * const product = await prisma.product.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Products and only return the `id`
     * const productWithIdOnly = await prisma.product.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProductCreateManyAndReturnArgs>(args?: SelectSubset<T, ProductCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Product.
     * @param {ProductDeleteArgs} args - Arguments to delete one Product.
     * @example
     * // Delete one Product
     * const Product = await prisma.product.delete({
     *   where: {
     *     // ... filter to delete one Product
     *   }
     * })
     * 
     */
    delete<T extends ProductDeleteArgs>(args: SelectSubset<T, ProductDeleteArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Product.
     * @param {ProductUpdateArgs} args - Arguments to update one Product.
     * @example
     * // Update one Product
     * const product = await prisma.product.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProductUpdateArgs>(args: SelectSubset<T, ProductUpdateArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Products.
     * @param {ProductDeleteManyArgs} args - Arguments to filter Products to delete.
     * @example
     * // Delete a few Products
     * const { count } = await prisma.product.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProductDeleteManyArgs>(args?: SelectSubset<T, ProductDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Products.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Products
     * const product = await prisma.product.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProductUpdateManyArgs>(args: SelectSubset<T, ProductUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Product.
     * @param {ProductUpsertArgs} args - Arguments to update or create a Product.
     * @example
     * // Update or create a Product
     * const product = await prisma.product.upsert({
     *   create: {
     *     // ... data to create a Product
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Product we want to update
     *   }
     * })
     */
    upsert<T extends ProductUpsertArgs>(args: SelectSubset<T, ProductUpsertArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Products.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductCountArgs} args - Arguments to filter Products to count.
     * @example
     * // Count the number of Products
     * const count = await prisma.product.count({
     *   where: {
     *     // ... the filter for the Products we want to count
     *   }
     * })
    **/
    count<T extends ProductCountArgs>(
      args?: Subset<T, ProductCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProductCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Product.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProductAggregateArgs>(args: Subset<T, ProductAggregateArgs>): Prisma.PrismaPromise<GetProductAggregateType<T>>

    /**
     * Group by Product.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProductGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProductGroupByArgs['orderBy'] }
        : { orderBy?: ProductGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProductGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProductGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Product model
   */
  readonly fields: ProductFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Product.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProductClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    category<T extends Product$categoryArgs<ExtArgs> = {}>(args?: Subset<T, Product$categoryArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    priceRules<T extends Product$priceRulesArgs<ExtArgs> = {}>(args?: Subset<T, Product$priceRulesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PriceRulePayload<ExtArgs>, T, "findMany"> | Null>
    orderItems<T extends Product$orderItemsArgs<ExtArgs> = {}>(args?: Subset<T, Product$orderItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderItemPayload<ExtArgs>, T, "findMany"> | Null>
    images<T extends Product$imagesArgs<ExtArgs> = {}>(args?: Subset<T, Product$imagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductImagePayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Product model
   */ 
  interface ProductFieldRefs {
    readonly id: FieldRef<"Product", 'String'>
    readonly barcode: FieldRef<"Product", 'String'>
    readonly name: FieldRef<"Product", 'String'>
    readonly description: FieldRef<"Product", 'String'>
    readonly basePriceKgs: FieldRef<"Product", 'Decimal'>
    readonly basePriceUsd: FieldRef<"Product", 'Decimal'>
    readonly stockQuantity: FieldRef<"Product", 'Int'>
    readonly minStockAlert: FieldRef<"Product", 'Int'>
    readonly categoryId: FieldRef<"Product", 'String'>
    readonly createdAt: FieldRef<"Product", 'DateTime'>
    readonly updatedAt: FieldRef<"Product", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Product findUnique
   */
  export type ProductFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product findUniqueOrThrow
   */
  export type ProductFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product findFirst
   */
  export type ProductFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Products.
     */
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product findFirstOrThrow
   */
  export type ProductFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Products.
     */
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product findMany
   */
  export type ProductFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Products to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product create
   */
  export type ProductCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * The data needed to create a Product.
     */
    data: XOR<ProductCreateInput, ProductUncheckedCreateInput>
  }

  /**
   * Product createMany
   */
  export type ProductCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Products.
     */
    data: ProductCreateManyInput | ProductCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Product createManyAndReturn
   */
  export type ProductCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Products.
     */
    data: ProductCreateManyInput | ProductCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Product update
   */
  export type ProductUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * The data needed to update a Product.
     */
    data: XOR<ProductUpdateInput, ProductUncheckedUpdateInput>
    /**
     * Choose, which Product to update.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product updateMany
   */
  export type ProductUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Products.
     */
    data: XOR<ProductUpdateManyMutationInput, ProductUncheckedUpdateManyInput>
    /**
     * Filter which Products to update
     */
    where?: ProductWhereInput
  }

  /**
   * Product upsert
   */
  export type ProductUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * The filter to search for the Product to update in case it exists.
     */
    where: ProductWhereUniqueInput
    /**
     * In case the Product found by the `where` argument doesn't exist, create a new Product with this data.
     */
    create: XOR<ProductCreateInput, ProductUncheckedCreateInput>
    /**
     * In case the Product was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProductUpdateInput, ProductUncheckedUpdateInput>
  }

  /**
   * Product delete
   */
  export type ProductDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter which Product to delete.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product deleteMany
   */
  export type ProductDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Products to delete
     */
    where?: ProductWhereInput
  }

  /**
   * Product.category
   */
  export type Product$categoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    where?: CategoryWhereInput
  }

  /**
   * Product.priceRules
   */
  export type Product$priceRulesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceRule
     */
    select?: PriceRuleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceRuleInclude<ExtArgs> | null
    where?: PriceRuleWhereInput
    orderBy?: PriceRuleOrderByWithRelationInput | PriceRuleOrderByWithRelationInput[]
    cursor?: PriceRuleWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PriceRuleScalarFieldEnum | PriceRuleScalarFieldEnum[]
  }

  /**
   * Product.orderItems
   */
  export type Product$orderItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderItem
     */
    select?: OrderItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderItemInclude<ExtArgs> | null
    where?: OrderItemWhereInput
    orderBy?: OrderItemOrderByWithRelationInput | OrderItemOrderByWithRelationInput[]
    cursor?: OrderItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: OrderItemScalarFieldEnum | OrderItemScalarFieldEnum[]
  }

  /**
   * Product.images
   */
  export type Product$imagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductImage
     */
    select?: ProductImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductImageInclude<ExtArgs> | null
    where?: ProductImageWhereInput
    orderBy?: ProductImageOrderByWithRelationInput | ProductImageOrderByWithRelationInput[]
    cursor?: ProductImageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ProductImageScalarFieldEnum | ProductImageScalarFieldEnum[]
  }

  /**
   * Product without action
   */
  export type ProductDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
  }


  /**
   * Model PriceRule
   */

  export type AggregatePriceRule = {
    _count: PriceRuleCountAggregateOutputType | null
    _avg: PriceRuleAvgAggregateOutputType | null
    _sum: PriceRuleSumAggregateOutputType | null
    _min: PriceRuleMinAggregateOutputType | null
    _max: PriceRuleMaxAggregateOutputType | null
  }

  export type PriceRuleAvgAggregateOutputType = {
    customPriceKgs: Decimal | null
  }

  export type PriceRuleSumAggregateOutputType = {
    customPriceKgs: Decimal | null
  }

  export type PriceRuleMinAggregateOutputType = {
    id: string | null
    productId: string | null
    role: $Enums.Role | null
    customPriceKgs: Decimal | null
  }

  export type PriceRuleMaxAggregateOutputType = {
    id: string | null
    productId: string | null
    role: $Enums.Role | null
    customPriceKgs: Decimal | null
  }

  export type PriceRuleCountAggregateOutputType = {
    id: number
    productId: number
    role: number
    customPriceKgs: number
    _all: number
  }


  export type PriceRuleAvgAggregateInputType = {
    customPriceKgs?: true
  }

  export type PriceRuleSumAggregateInputType = {
    customPriceKgs?: true
  }

  export type PriceRuleMinAggregateInputType = {
    id?: true
    productId?: true
    role?: true
    customPriceKgs?: true
  }

  export type PriceRuleMaxAggregateInputType = {
    id?: true
    productId?: true
    role?: true
    customPriceKgs?: true
  }

  export type PriceRuleCountAggregateInputType = {
    id?: true
    productId?: true
    role?: true
    customPriceKgs?: true
    _all?: true
  }

  export type PriceRuleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PriceRule to aggregate.
     */
    where?: PriceRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PriceRules to fetch.
     */
    orderBy?: PriceRuleOrderByWithRelationInput | PriceRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PriceRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PriceRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PriceRules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PriceRules
    **/
    _count?: true | PriceRuleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PriceRuleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PriceRuleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PriceRuleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PriceRuleMaxAggregateInputType
  }

  export type GetPriceRuleAggregateType<T extends PriceRuleAggregateArgs> = {
        [P in keyof T & keyof AggregatePriceRule]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePriceRule[P]>
      : GetScalarType<T[P], AggregatePriceRule[P]>
  }




  export type PriceRuleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PriceRuleWhereInput
    orderBy?: PriceRuleOrderByWithAggregationInput | PriceRuleOrderByWithAggregationInput[]
    by: PriceRuleScalarFieldEnum[] | PriceRuleScalarFieldEnum
    having?: PriceRuleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PriceRuleCountAggregateInputType | true
    _avg?: PriceRuleAvgAggregateInputType
    _sum?: PriceRuleSumAggregateInputType
    _min?: PriceRuleMinAggregateInputType
    _max?: PriceRuleMaxAggregateInputType
  }

  export type PriceRuleGroupByOutputType = {
    id: string
    productId: string
    role: $Enums.Role
    customPriceKgs: Decimal
    _count: PriceRuleCountAggregateOutputType | null
    _avg: PriceRuleAvgAggregateOutputType | null
    _sum: PriceRuleSumAggregateOutputType | null
    _min: PriceRuleMinAggregateOutputType | null
    _max: PriceRuleMaxAggregateOutputType | null
  }

  type GetPriceRuleGroupByPayload<T extends PriceRuleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PriceRuleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PriceRuleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PriceRuleGroupByOutputType[P]>
            : GetScalarType<T[P], PriceRuleGroupByOutputType[P]>
        }
      >
    >


  export type PriceRuleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    role?: boolean
    customPriceKgs?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["priceRule"]>

  export type PriceRuleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    role?: boolean
    customPriceKgs?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["priceRule"]>

  export type PriceRuleSelectScalar = {
    id?: boolean
    productId?: boolean
    role?: boolean
    customPriceKgs?: boolean
  }

  export type PriceRuleInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }
  export type PriceRuleIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }

  export type $PriceRulePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PriceRule"
    objects: {
      product: Prisma.$ProductPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      productId: string
      role: $Enums.Role
      customPriceKgs: Prisma.Decimal
    }, ExtArgs["result"]["priceRule"]>
    composites: {}
  }

  type PriceRuleGetPayload<S extends boolean | null | undefined | PriceRuleDefaultArgs> = $Result.GetResult<Prisma.$PriceRulePayload, S>

  type PriceRuleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PriceRuleFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PriceRuleCountAggregateInputType | true
    }

  export interface PriceRuleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PriceRule'], meta: { name: 'PriceRule' } }
    /**
     * Find zero or one PriceRule that matches the filter.
     * @param {PriceRuleFindUniqueArgs} args - Arguments to find a PriceRule
     * @example
     * // Get one PriceRule
     * const priceRule = await prisma.priceRule.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PriceRuleFindUniqueArgs>(args: SelectSubset<T, PriceRuleFindUniqueArgs<ExtArgs>>): Prisma__PriceRuleClient<$Result.GetResult<Prisma.$PriceRulePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one PriceRule that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PriceRuleFindUniqueOrThrowArgs} args - Arguments to find a PriceRule
     * @example
     * // Get one PriceRule
     * const priceRule = await prisma.priceRule.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PriceRuleFindUniqueOrThrowArgs>(args: SelectSubset<T, PriceRuleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PriceRuleClient<$Result.GetResult<Prisma.$PriceRulePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first PriceRule that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceRuleFindFirstArgs} args - Arguments to find a PriceRule
     * @example
     * // Get one PriceRule
     * const priceRule = await prisma.priceRule.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PriceRuleFindFirstArgs>(args?: SelectSubset<T, PriceRuleFindFirstArgs<ExtArgs>>): Prisma__PriceRuleClient<$Result.GetResult<Prisma.$PriceRulePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first PriceRule that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceRuleFindFirstOrThrowArgs} args - Arguments to find a PriceRule
     * @example
     * // Get one PriceRule
     * const priceRule = await prisma.priceRule.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PriceRuleFindFirstOrThrowArgs>(args?: SelectSubset<T, PriceRuleFindFirstOrThrowArgs<ExtArgs>>): Prisma__PriceRuleClient<$Result.GetResult<Prisma.$PriceRulePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more PriceRules that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceRuleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PriceRules
     * const priceRules = await prisma.priceRule.findMany()
     * 
     * // Get first 10 PriceRules
     * const priceRules = await prisma.priceRule.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const priceRuleWithIdOnly = await prisma.priceRule.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PriceRuleFindManyArgs>(args?: SelectSubset<T, PriceRuleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PriceRulePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a PriceRule.
     * @param {PriceRuleCreateArgs} args - Arguments to create a PriceRule.
     * @example
     * // Create one PriceRule
     * const PriceRule = await prisma.priceRule.create({
     *   data: {
     *     // ... data to create a PriceRule
     *   }
     * })
     * 
     */
    create<T extends PriceRuleCreateArgs>(args: SelectSubset<T, PriceRuleCreateArgs<ExtArgs>>): Prisma__PriceRuleClient<$Result.GetResult<Prisma.$PriceRulePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many PriceRules.
     * @param {PriceRuleCreateManyArgs} args - Arguments to create many PriceRules.
     * @example
     * // Create many PriceRules
     * const priceRule = await prisma.priceRule.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PriceRuleCreateManyArgs>(args?: SelectSubset<T, PriceRuleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PriceRules and returns the data saved in the database.
     * @param {PriceRuleCreateManyAndReturnArgs} args - Arguments to create many PriceRules.
     * @example
     * // Create many PriceRules
     * const priceRule = await prisma.priceRule.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PriceRules and only return the `id`
     * const priceRuleWithIdOnly = await prisma.priceRule.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PriceRuleCreateManyAndReturnArgs>(args?: SelectSubset<T, PriceRuleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PriceRulePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a PriceRule.
     * @param {PriceRuleDeleteArgs} args - Arguments to delete one PriceRule.
     * @example
     * // Delete one PriceRule
     * const PriceRule = await prisma.priceRule.delete({
     *   where: {
     *     // ... filter to delete one PriceRule
     *   }
     * })
     * 
     */
    delete<T extends PriceRuleDeleteArgs>(args: SelectSubset<T, PriceRuleDeleteArgs<ExtArgs>>): Prisma__PriceRuleClient<$Result.GetResult<Prisma.$PriceRulePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one PriceRule.
     * @param {PriceRuleUpdateArgs} args - Arguments to update one PriceRule.
     * @example
     * // Update one PriceRule
     * const priceRule = await prisma.priceRule.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PriceRuleUpdateArgs>(args: SelectSubset<T, PriceRuleUpdateArgs<ExtArgs>>): Prisma__PriceRuleClient<$Result.GetResult<Prisma.$PriceRulePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more PriceRules.
     * @param {PriceRuleDeleteManyArgs} args - Arguments to filter PriceRules to delete.
     * @example
     * // Delete a few PriceRules
     * const { count } = await prisma.priceRule.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PriceRuleDeleteManyArgs>(args?: SelectSubset<T, PriceRuleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PriceRules.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceRuleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PriceRules
     * const priceRule = await prisma.priceRule.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PriceRuleUpdateManyArgs>(args: SelectSubset<T, PriceRuleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PriceRule.
     * @param {PriceRuleUpsertArgs} args - Arguments to update or create a PriceRule.
     * @example
     * // Update or create a PriceRule
     * const priceRule = await prisma.priceRule.upsert({
     *   create: {
     *     // ... data to create a PriceRule
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PriceRule we want to update
     *   }
     * })
     */
    upsert<T extends PriceRuleUpsertArgs>(args: SelectSubset<T, PriceRuleUpsertArgs<ExtArgs>>): Prisma__PriceRuleClient<$Result.GetResult<Prisma.$PriceRulePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of PriceRules.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceRuleCountArgs} args - Arguments to filter PriceRules to count.
     * @example
     * // Count the number of PriceRules
     * const count = await prisma.priceRule.count({
     *   where: {
     *     // ... the filter for the PriceRules we want to count
     *   }
     * })
    **/
    count<T extends PriceRuleCountArgs>(
      args?: Subset<T, PriceRuleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PriceRuleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PriceRule.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceRuleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PriceRuleAggregateArgs>(args: Subset<T, PriceRuleAggregateArgs>): Prisma.PrismaPromise<GetPriceRuleAggregateType<T>>

    /**
     * Group by PriceRule.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceRuleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PriceRuleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PriceRuleGroupByArgs['orderBy'] }
        : { orderBy?: PriceRuleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PriceRuleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPriceRuleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PriceRule model
   */
  readonly fields: PriceRuleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PriceRule.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PriceRuleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    product<T extends ProductDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProductDefaultArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PriceRule model
   */ 
  interface PriceRuleFieldRefs {
    readonly id: FieldRef<"PriceRule", 'String'>
    readonly productId: FieldRef<"PriceRule", 'String'>
    readonly role: FieldRef<"PriceRule", 'Role'>
    readonly customPriceKgs: FieldRef<"PriceRule", 'Decimal'>
  }
    

  // Custom InputTypes
  /**
   * PriceRule findUnique
   */
  export type PriceRuleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceRule
     */
    select?: PriceRuleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceRuleInclude<ExtArgs> | null
    /**
     * Filter, which PriceRule to fetch.
     */
    where: PriceRuleWhereUniqueInput
  }

  /**
   * PriceRule findUniqueOrThrow
   */
  export type PriceRuleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceRule
     */
    select?: PriceRuleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceRuleInclude<ExtArgs> | null
    /**
     * Filter, which PriceRule to fetch.
     */
    where: PriceRuleWhereUniqueInput
  }

  /**
   * PriceRule findFirst
   */
  export type PriceRuleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceRule
     */
    select?: PriceRuleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceRuleInclude<ExtArgs> | null
    /**
     * Filter, which PriceRule to fetch.
     */
    where?: PriceRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PriceRules to fetch.
     */
    orderBy?: PriceRuleOrderByWithRelationInput | PriceRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PriceRules.
     */
    cursor?: PriceRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PriceRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PriceRules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PriceRules.
     */
    distinct?: PriceRuleScalarFieldEnum | PriceRuleScalarFieldEnum[]
  }

  /**
   * PriceRule findFirstOrThrow
   */
  export type PriceRuleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceRule
     */
    select?: PriceRuleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceRuleInclude<ExtArgs> | null
    /**
     * Filter, which PriceRule to fetch.
     */
    where?: PriceRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PriceRules to fetch.
     */
    orderBy?: PriceRuleOrderByWithRelationInput | PriceRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PriceRules.
     */
    cursor?: PriceRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PriceRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PriceRules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PriceRules.
     */
    distinct?: PriceRuleScalarFieldEnum | PriceRuleScalarFieldEnum[]
  }

  /**
   * PriceRule findMany
   */
  export type PriceRuleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceRule
     */
    select?: PriceRuleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceRuleInclude<ExtArgs> | null
    /**
     * Filter, which PriceRules to fetch.
     */
    where?: PriceRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PriceRules to fetch.
     */
    orderBy?: PriceRuleOrderByWithRelationInput | PriceRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PriceRules.
     */
    cursor?: PriceRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PriceRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PriceRules.
     */
    skip?: number
    distinct?: PriceRuleScalarFieldEnum | PriceRuleScalarFieldEnum[]
  }

  /**
   * PriceRule create
   */
  export type PriceRuleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceRule
     */
    select?: PriceRuleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceRuleInclude<ExtArgs> | null
    /**
     * The data needed to create a PriceRule.
     */
    data: XOR<PriceRuleCreateInput, PriceRuleUncheckedCreateInput>
  }

  /**
   * PriceRule createMany
   */
  export type PriceRuleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PriceRules.
     */
    data: PriceRuleCreateManyInput | PriceRuleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PriceRule createManyAndReturn
   */
  export type PriceRuleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceRule
     */
    select?: PriceRuleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many PriceRules.
     */
    data: PriceRuleCreateManyInput | PriceRuleCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceRuleIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PriceRule update
   */
  export type PriceRuleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceRule
     */
    select?: PriceRuleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceRuleInclude<ExtArgs> | null
    /**
     * The data needed to update a PriceRule.
     */
    data: XOR<PriceRuleUpdateInput, PriceRuleUncheckedUpdateInput>
    /**
     * Choose, which PriceRule to update.
     */
    where: PriceRuleWhereUniqueInput
  }

  /**
   * PriceRule updateMany
   */
  export type PriceRuleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PriceRules.
     */
    data: XOR<PriceRuleUpdateManyMutationInput, PriceRuleUncheckedUpdateManyInput>
    /**
     * Filter which PriceRules to update
     */
    where?: PriceRuleWhereInput
  }

  /**
   * PriceRule upsert
   */
  export type PriceRuleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceRule
     */
    select?: PriceRuleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceRuleInclude<ExtArgs> | null
    /**
     * The filter to search for the PriceRule to update in case it exists.
     */
    where: PriceRuleWhereUniqueInput
    /**
     * In case the PriceRule found by the `where` argument doesn't exist, create a new PriceRule with this data.
     */
    create: XOR<PriceRuleCreateInput, PriceRuleUncheckedCreateInput>
    /**
     * In case the PriceRule was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PriceRuleUpdateInput, PriceRuleUncheckedUpdateInput>
  }

  /**
   * PriceRule delete
   */
  export type PriceRuleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceRule
     */
    select?: PriceRuleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceRuleInclude<ExtArgs> | null
    /**
     * Filter which PriceRule to delete.
     */
    where: PriceRuleWhereUniqueInput
  }

  /**
   * PriceRule deleteMany
   */
  export type PriceRuleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PriceRules to delete
     */
    where?: PriceRuleWhereInput
  }

  /**
   * PriceRule without action
   */
  export type PriceRuleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceRule
     */
    select?: PriceRuleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceRuleInclude<ExtArgs> | null
  }


  /**
   * Model Order
   */

  export type AggregateOrder = {
    _count: OrderCountAggregateOutputType | null
    _avg: OrderAvgAggregateOutputType | null
    _sum: OrderSumAggregateOutputType | null
    _min: OrderMinAggregateOutputType | null
    _max: OrderMaxAggregateOutputType | null
  }

  export type OrderAvgAggregateOutputType = {
    totalKgs: Decimal | null
    totalUsd: Decimal | null
  }

  export type OrderSumAggregateOutputType = {
    totalKgs: Decimal | null
    totalUsd: Decimal | null
  }

  export type OrderMinAggregateOutputType = {
    id: string | null
    userId: string | null
    orderType: $Enums.OrderType | null
    status: $Enums.OrderStatus | null
    totalKgs: Decimal | null
    totalUsd: Decimal | null
    paymentMethod: $Enums.PaymentMethod | null
    customerName: string | null
    customerPhone: string | null
    address: string | null
    receiptImageUrl: string | null
    verifiedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type OrderMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    orderType: $Enums.OrderType | null
    status: $Enums.OrderStatus | null
    totalKgs: Decimal | null
    totalUsd: Decimal | null
    paymentMethod: $Enums.PaymentMethod | null
    customerName: string | null
    customerPhone: string | null
    address: string | null
    receiptImageUrl: string | null
    verifiedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type OrderCountAggregateOutputType = {
    id: number
    userId: number
    orderType: number
    status: number
    totalKgs: number
    totalUsd: number
    paymentMethod: number
    customerName: number
    customerPhone: number
    address: number
    receiptImageUrl: number
    ocrResult: number
    verifiedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type OrderAvgAggregateInputType = {
    totalKgs?: true
    totalUsd?: true
  }

  export type OrderSumAggregateInputType = {
    totalKgs?: true
    totalUsd?: true
  }

  export type OrderMinAggregateInputType = {
    id?: true
    userId?: true
    orderType?: true
    status?: true
    totalKgs?: true
    totalUsd?: true
    paymentMethod?: true
    customerName?: true
    customerPhone?: true
    address?: true
    receiptImageUrl?: true
    verifiedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type OrderMaxAggregateInputType = {
    id?: true
    userId?: true
    orderType?: true
    status?: true
    totalKgs?: true
    totalUsd?: true
    paymentMethod?: true
    customerName?: true
    customerPhone?: true
    address?: true
    receiptImageUrl?: true
    verifiedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type OrderCountAggregateInputType = {
    id?: true
    userId?: true
    orderType?: true
    status?: true
    totalKgs?: true
    totalUsd?: true
    paymentMethod?: true
    customerName?: true
    customerPhone?: true
    address?: true
    receiptImageUrl?: true
    ocrResult?: true
    verifiedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type OrderAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Order to aggregate.
     */
    where?: OrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Orders to fetch.
     */
    orderBy?: OrderOrderByWithRelationInput | OrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Orders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Orders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Orders
    **/
    _count?: true | OrderCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: OrderAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: OrderSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OrderMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OrderMaxAggregateInputType
  }

  export type GetOrderAggregateType<T extends OrderAggregateArgs> = {
        [P in keyof T & keyof AggregateOrder]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOrder[P]>
      : GetScalarType<T[P], AggregateOrder[P]>
  }




  export type OrderGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrderWhereInput
    orderBy?: OrderOrderByWithAggregationInput | OrderOrderByWithAggregationInput[]
    by: OrderScalarFieldEnum[] | OrderScalarFieldEnum
    having?: OrderScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OrderCountAggregateInputType | true
    _avg?: OrderAvgAggregateInputType
    _sum?: OrderSumAggregateInputType
    _min?: OrderMinAggregateInputType
    _max?: OrderMaxAggregateInputType
  }

  export type OrderGroupByOutputType = {
    id: string
    userId: string
    orderType: $Enums.OrderType
    status: $Enums.OrderStatus
    totalKgs: Decimal
    totalUsd: Decimal
    paymentMethod: $Enums.PaymentMethod
    customerName: string | null
    customerPhone: string | null
    address: string | null
    receiptImageUrl: string | null
    ocrResult: JsonValue | null
    verifiedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: OrderCountAggregateOutputType | null
    _avg: OrderAvgAggregateOutputType | null
    _sum: OrderSumAggregateOutputType | null
    _min: OrderMinAggregateOutputType | null
    _max: OrderMaxAggregateOutputType | null
  }

  type GetOrderGroupByPayload<T extends OrderGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OrderGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OrderGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OrderGroupByOutputType[P]>
            : GetScalarType<T[P], OrderGroupByOutputType[P]>
        }
      >
    >


  export type OrderSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    orderType?: boolean
    status?: boolean
    totalKgs?: boolean
    totalUsd?: boolean
    paymentMethod?: boolean
    customerName?: boolean
    customerPhone?: boolean
    address?: boolean
    receiptImageUrl?: boolean
    ocrResult?: boolean
    verifiedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    items?: boolean | Order$itemsArgs<ExtArgs>
    _count?: boolean | OrderCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["order"]>

  export type OrderSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    orderType?: boolean
    status?: boolean
    totalKgs?: boolean
    totalUsd?: boolean
    paymentMethod?: boolean
    customerName?: boolean
    customerPhone?: boolean
    address?: boolean
    receiptImageUrl?: boolean
    ocrResult?: boolean
    verifiedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["order"]>

  export type OrderSelectScalar = {
    id?: boolean
    userId?: boolean
    orderType?: boolean
    status?: boolean
    totalKgs?: boolean
    totalUsd?: boolean
    paymentMethod?: boolean
    customerName?: boolean
    customerPhone?: boolean
    address?: boolean
    receiptImageUrl?: boolean
    ocrResult?: boolean
    verifiedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type OrderInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    items?: boolean | Order$itemsArgs<ExtArgs>
    _count?: boolean | OrderCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type OrderIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $OrderPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Order"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      items: Prisma.$OrderItemPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      orderType: $Enums.OrderType
      status: $Enums.OrderStatus
      totalKgs: Prisma.Decimal
      totalUsd: Prisma.Decimal
      paymentMethod: $Enums.PaymentMethod
      customerName: string | null
      customerPhone: string | null
      address: string | null
      receiptImageUrl: string | null
      ocrResult: Prisma.JsonValue | null
      verifiedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["order"]>
    composites: {}
  }

  type OrderGetPayload<S extends boolean | null | undefined | OrderDefaultArgs> = $Result.GetResult<Prisma.$OrderPayload, S>

  type OrderCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<OrderFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: OrderCountAggregateInputType | true
    }

  export interface OrderDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Order'], meta: { name: 'Order' } }
    /**
     * Find zero or one Order that matches the filter.
     * @param {OrderFindUniqueArgs} args - Arguments to find a Order
     * @example
     * // Get one Order
     * const order = await prisma.order.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OrderFindUniqueArgs>(args: SelectSubset<T, OrderFindUniqueArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Order that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {OrderFindUniqueOrThrowArgs} args - Arguments to find a Order
     * @example
     * // Get one Order
     * const order = await prisma.order.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OrderFindUniqueOrThrowArgs>(args: SelectSubset<T, OrderFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Order that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderFindFirstArgs} args - Arguments to find a Order
     * @example
     * // Get one Order
     * const order = await prisma.order.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OrderFindFirstArgs>(args?: SelectSubset<T, OrderFindFirstArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Order that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderFindFirstOrThrowArgs} args - Arguments to find a Order
     * @example
     * // Get one Order
     * const order = await prisma.order.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OrderFindFirstOrThrowArgs>(args?: SelectSubset<T, OrderFindFirstOrThrowArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Orders that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Orders
     * const orders = await prisma.order.findMany()
     * 
     * // Get first 10 Orders
     * const orders = await prisma.order.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const orderWithIdOnly = await prisma.order.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OrderFindManyArgs>(args?: SelectSubset<T, OrderFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Order.
     * @param {OrderCreateArgs} args - Arguments to create a Order.
     * @example
     * // Create one Order
     * const Order = await prisma.order.create({
     *   data: {
     *     // ... data to create a Order
     *   }
     * })
     * 
     */
    create<T extends OrderCreateArgs>(args: SelectSubset<T, OrderCreateArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Orders.
     * @param {OrderCreateManyArgs} args - Arguments to create many Orders.
     * @example
     * // Create many Orders
     * const order = await prisma.order.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OrderCreateManyArgs>(args?: SelectSubset<T, OrderCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Orders and returns the data saved in the database.
     * @param {OrderCreateManyAndReturnArgs} args - Arguments to create many Orders.
     * @example
     * // Create many Orders
     * const order = await prisma.order.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Orders and only return the `id`
     * const orderWithIdOnly = await prisma.order.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends OrderCreateManyAndReturnArgs>(args?: SelectSubset<T, OrderCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Order.
     * @param {OrderDeleteArgs} args - Arguments to delete one Order.
     * @example
     * // Delete one Order
     * const Order = await prisma.order.delete({
     *   where: {
     *     // ... filter to delete one Order
     *   }
     * })
     * 
     */
    delete<T extends OrderDeleteArgs>(args: SelectSubset<T, OrderDeleteArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Order.
     * @param {OrderUpdateArgs} args - Arguments to update one Order.
     * @example
     * // Update one Order
     * const order = await prisma.order.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OrderUpdateArgs>(args: SelectSubset<T, OrderUpdateArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Orders.
     * @param {OrderDeleteManyArgs} args - Arguments to filter Orders to delete.
     * @example
     * // Delete a few Orders
     * const { count } = await prisma.order.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OrderDeleteManyArgs>(args?: SelectSubset<T, OrderDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Orders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Orders
     * const order = await prisma.order.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OrderUpdateManyArgs>(args: SelectSubset<T, OrderUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Order.
     * @param {OrderUpsertArgs} args - Arguments to update or create a Order.
     * @example
     * // Update or create a Order
     * const order = await prisma.order.upsert({
     *   create: {
     *     // ... data to create a Order
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Order we want to update
     *   }
     * })
     */
    upsert<T extends OrderUpsertArgs>(args: SelectSubset<T, OrderUpsertArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Orders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderCountArgs} args - Arguments to filter Orders to count.
     * @example
     * // Count the number of Orders
     * const count = await prisma.order.count({
     *   where: {
     *     // ... the filter for the Orders we want to count
     *   }
     * })
    **/
    count<T extends OrderCountArgs>(
      args?: Subset<T, OrderCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OrderCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Order.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OrderAggregateArgs>(args: Subset<T, OrderAggregateArgs>): Prisma.PrismaPromise<GetOrderAggregateType<T>>

    /**
     * Group by Order.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends OrderGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OrderGroupByArgs['orderBy'] }
        : { orderBy?: OrderGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, OrderGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOrderGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Order model
   */
  readonly fields: OrderFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Order.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OrderClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    items<T extends Order$itemsArgs<ExtArgs> = {}>(args?: Subset<T, Order$itemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderItemPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Order model
   */ 
  interface OrderFieldRefs {
    readonly id: FieldRef<"Order", 'String'>
    readonly userId: FieldRef<"Order", 'String'>
    readonly orderType: FieldRef<"Order", 'OrderType'>
    readonly status: FieldRef<"Order", 'OrderStatus'>
    readonly totalKgs: FieldRef<"Order", 'Decimal'>
    readonly totalUsd: FieldRef<"Order", 'Decimal'>
    readonly paymentMethod: FieldRef<"Order", 'PaymentMethod'>
    readonly customerName: FieldRef<"Order", 'String'>
    readonly customerPhone: FieldRef<"Order", 'String'>
    readonly address: FieldRef<"Order", 'String'>
    readonly receiptImageUrl: FieldRef<"Order", 'String'>
    readonly ocrResult: FieldRef<"Order", 'Json'>
    readonly verifiedAt: FieldRef<"Order", 'DateTime'>
    readonly createdAt: FieldRef<"Order", 'DateTime'>
    readonly updatedAt: FieldRef<"Order", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Order findUnique
   */
  export type OrderFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * Filter, which Order to fetch.
     */
    where: OrderWhereUniqueInput
  }

  /**
   * Order findUniqueOrThrow
   */
  export type OrderFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * Filter, which Order to fetch.
     */
    where: OrderWhereUniqueInput
  }

  /**
   * Order findFirst
   */
  export type OrderFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * Filter, which Order to fetch.
     */
    where?: OrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Orders to fetch.
     */
    orderBy?: OrderOrderByWithRelationInput | OrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Orders.
     */
    cursor?: OrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Orders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Orders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Orders.
     */
    distinct?: OrderScalarFieldEnum | OrderScalarFieldEnum[]
  }

  /**
   * Order findFirstOrThrow
   */
  export type OrderFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * Filter, which Order to fetch.
     */
    where?: OrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Orders to fetch.
     */
    orderBy?: OrderOrderByWithRelationInput | OrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Orders.
     */
    cursor?: OrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Orders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Orders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Orders.
     */
    distinct?: OrderScalarFieldEnum | OrderScalarFieldEnum[]
  }

  /**
   * Order findMany
   */
  export type OrderFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * Filter, which Orders to fetch.
     */
    where?: OrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Orders to fetch.
     */
    orderBy?: OrderOrderByWithRelationInput | OrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Orders.
     */
    cursor?: OrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Orders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Orders.
     */
    skip?: number
    distinct?: OrderScalarFieldEnum | OrderScalarFieldEnum[]
  }

  /**
   * Order create
   */
  export type OrderCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * The data needed to create a Order.
     */
    data: XOR<OrderCreateInput, OrderUncheckedCreateInput>
  }

  /**
   * Order createMany
   */
  export type OrderCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Orders.
     */
    data: OrderCreateManyInput | OrderCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Order createManyAndReturn
   */
  export type OrderCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Orders.
     */
    data: OrderCreateManyInput | OrderCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Order update
   */
  export type OrderUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * The data needed to update a Order.
     */
    data: XOR<OrderUpdateInput, OrderUncheckedUpdateInput>
    /**
     * Choose, which Order to update.
     */
    where: OrderWhereUniqueInput
  }

  /**
   * Order updateMany
   */
  export type OrderUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Orders.
     */
    data: XOR<OrderUpdateManyMutationInput, OrderUncheckedUpdateManyInput>
    /**
     * Filter which Orders to update
     */
    where?: OrderWhereInput
  }

  /**
   * Order upsert
   */
  export type OrderUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * The filter to search for the Order to update in case it exists.
     */
    where: OrderWhereUniqueInput
    /**
     * In case the Order found by the `where` argument doesn't exist, create a new Order with this data.
     */
    create: XOR<OrderCreateInput, OrderUncheckedCreateInput>
    /**
     * In case the Order was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OrderUpdateInput, OrderUncheckedUpdateInput>
  }

  /**
   * Order delete
   */
  export type OrderDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * Filter which Order to delete.
     */
    where: OrderWhereUniqueInput
  }

  /**
   * Order deleteMany
   */
  export type OrderDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Orders to delete
     */
    where?: OrderWhereInput
  }

  /**
   * Order.items
   */
  export type Order$itemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderItem
     */
    select?: OrderItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderItemInclude<ExtArgs> | null
    where?: OrderItemWhereInput
    orderBy?: OrderItemOrderByWithRelationInput | OrderItemOrderByWithRelationInput[]
    cursor?: OrderItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: OrderItemScalarFieldEnum | OrderItemScalarFieldEnum[]
  }

  /**
   * Order without action
   */
  export type OrderDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
  }


  /**
   * Model OrderItem
   */

  export type AggregateOrderItem = {
    _count: OrderItemCountAggregateOutputType | null
    _avg: OrderItemAvgAggregateOutputType | null
    _sum: OrderItemSumAggregateOutputType | null
    _min: OrderItemMinAggregateOutputType | null
    _max: OrderItemMaxAggregateOutputType | null
  }

  export type OrderItemAvgAggregateOutputType = {
    quantity: number | null
    unitPriceKgs: Decimal | null
    totalPriceKgs: Decimal | null
  }

  export type OrderItemSumAggregateOutputType = {
    quantity: number | null
    unitPriceKgs: Decimal | null
    totalPriceKgs: Decimal | null
  }

  export type OrderItemMinAggregateOutputType = {
    id: string | null
    orderId: string | null
    productId: string | null
    quantity: number | null
    unitPriceKgs: Decimal | null
    totalPriceKgs: Decimal | null
  }

  export type OrderItemMaxAggregateOutputType = {
    id: string | null
    orderId: string | null
    productId: string | null
    quantity: number | null
    unitPriceKgs: Decimal | null
    totalPriceKgs: Decimal | null
  }

  export type OrderItemCountAggregateOutputType = {
    id: number
    orderId: number
    productId: number
    quantity: number
    unitPriceKgs: number
    totalPriceKgs: number
    _all: number
  }


  export type OrderItemAvgAggregateInputType = {
    quantity?: true
    unitPriceKgs?: true
    totalPriceKgs?: true
  }

  export type OrderItemSumAggregateInputType = {
    quantity?: true
    unitPriceKgs?: true
    totalPriceKgs?: true
  }

  export type OrderItemMinAggregateInputType = {
    id?: true
    orderId?: true
    productId?: true
    quantity?: true
    unitPriceKgs?: true
    totalPriceKgs?: true
  }

  export type OrderItemMaxAggregateInputType = {
    id?: true
    orderId?: true
    productId?: true
    quantity?: true
    unitPriceKgs?: true
    totalPriceKgs?: true
  }

  export type OrderItemCountAggregateInputType = {
    id?: true
    orderId?: true
    productId?: true
    quantity?: true
    unitPriceKgs?: true
    totalPriceKgs?: true
    _all?: true
  }

  export type OrderItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OrderItem to aggregate.
     */
    where?: OrderItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrderItems to fetch.
     */
    orderBy?: OrderItemOrderByWithRelationInput | OrderItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OrderItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrderItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrderItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned OrderItems
    **/
    _count?: true | OrderItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: OrderItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: OrderItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OrderItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OrderItemMaxAggregateInputType
  }

  export type GetOrderItemAggregateType<T extends OrderItemAggregateArgs> = {
        [P in keyof T & keyof AggregateOrderItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOrderItem[P]>
      : GetScalarType<T[P], AggregateOrderItem[P]>
  }




  export type OrderItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrderItemWhereInput
    orderBy?: OrderItemOrderByWithAggregationInput | OrderItemOrderByWithAggregationInput[]
    by: OrderItemScalarFieldEnum[] | OrderItemScalarFieldEnum
    having?: OrderItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OrderItemCountAggregateInputType | true
    _avg?: OrderItemAvgAggregateInputType
    _sum?: OrderItemSumAggregateInputType
    _min?: OrderItemMinAggregateInputType
    _max?: OrderItemMaxAggregateInputType
  }

  export type OrderItemGroupByOutputType = {
    id: string
    orderId: string
    productId: string
    quantity: number
    unitPriceKgs: Decimal
    totalPriceKgs: Decimal
    _count: OrderItemCountAggregateOutputType | null
    _avg: OrderItemAvgAggregateOutputType | null
    _sum: OrderItemSumAggregateOutputType | null
    _min: OrderItemMinAggregateOutputType | null
    _max: OrderItemMaxAggregateOutputType | null
  }

  type GetOrderItemGroupByPayload<T extends OrderItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OrderItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OrderItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OrderItemGroupByOutputType[P]>
            : GetScalarType<T[P], OrderItemGroupByOutputType[P]>
        }
      >
    >


  export type OrderItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    orderId?: boolean
    productId?: boolean
    quantity?: boolean
    unitPriceKgs?: boolean
    totalPriceKgs?: boolean
    order?: boolean | OrderDefaultArgs<ExtArgs>
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["orderItem"]>

  export type OrderItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    orderId?: boolean
    productId?: boolean
    quantity?: boolean
    unitPriceKgs?: boolean
    totalPriceKgs?: boolean
    order?: boolean | OrderDefaultArgs<ExtArgs>
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["orderItem"]>

  export type OrderItemSelectScalar = {
    id?: boolean
    orderId?: boolean
    productId?: boolean
    quantity?: boolean
    unitPriceKgs?: boolean
    totalPriceKgs?: boolean
  }

  export type OrderItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    order?: boolean | OrderDefaultArgs<ExtArgs>
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }
  export type OrderItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    order?: boolean | OrderDefaultArgs<ExtArgs>
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }

  export type $OrderItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "OrderItem"
    objects: {
      order: Prisma.$OrderPayload<ExtArgs>
      product: Prisma.$ProductPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      orderId: string
      productId: string
      quantity: number
      unitPriceKgs: Prisma.Decimal
      totalPriceKgs: Prisma.Decimal
    }, ExtArgs["result"]["orderItem"]>
    composites: {}
  }

  type OrderItemGetPayload<S extends boolean | null | undefined | OrderItemDefaultArgs> = $Result.GetResult<Prisma.$OrderItemPayload, S>

  type OrderItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<OrderItemFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: OrderItemCountAggregateInputType | true
    }

  export interface OrderItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['OrderItem'], meta: { name: 'OrderItem' } }
    /**
     * Find zero or one OrderItem that matches the filter.
     * @param {OrderItemFindUniqueArgs} args - Arguments to find a OrderItem
     * @example
     * // Get one OrderItem
     * const orderItem = await prisma.orderItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OrderItemFindUniqueArgs>(args: SelectSubset<T, OrderItemFindUniqueArgs<ExtArgs>>): Prisma__OrderItemClient<$Result.GetResult<Prisma.$OrderItemPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one OrderItem that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {OrderItemFindUniqueOrThrowArgs} args - Arguments to find a OrderItem
     * @example
     * // Get one OrderItem
     * const orderItem = await prisma.orderItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OrderItemFindUniqueOrThrowArgs>(args: SelectSubset<T, OrderItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OrderItemClient<$Result.GetResult<Prisma.$OrderItemPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first OrderItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderItemFindFirstArgs} args - Arguments to find a OrderItem
     * @example
     * // Get one OrderItem
     * const orderItem = await prisma.orderItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OrderItemFindFirstArgs>(args?: SelectSubset<T, OrderItemFindFirstArgs<ExtArgs>>): Prisma__OrderItemClient<$Result.GetResult<Prisma.$OrderItemPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first OrderItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderItemFindFirstOrThrowArgs} args - Arguments to find a OrderItem
     * @example
     * // Get one OrderItem
     * const orderItem = await prisma.orderItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OrderItemFindFirstOrThrowArgs>(args?: SelectSubset<T, OrderItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__OrderItemClient<$Result.GetResult<Prisma.$OrderItemPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more OrderItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all OrderItems
     * const orderItems = await prisma.orderItem.findMany()
     * 
     * // Get first 10 OrderItems
     * const orderItems = await prisma.orderItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const orderItemWithIdOnly = await prisma.orderItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OrderItemFindManyArgs>(args?: SelectSubset<T, OrderItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderItemPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a OrderItem.
     * @param {OrderItemCreateArgs} args - Arguments to create a OrderItem.
     * @example
     * // Create one OrderItem
     * const OrderItem = await prisma.orderItem.create({
     *   data: {
     *     // ... data to create a OrderItem
     *   }
     * })
     * 
     */
    create<T extends OrderItemCreateArgs>(args: SelectSubset<T, OrderItemCreateArgs<ExtArgs>>): Prisma__OrderItemClient<$Result.GetResult<Prisma.$OrderItemPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many OrderItems.
     * @param {OrderItemCreateManyArgs} args - Arguments to create many OrderItems.
     * @example
     * // Create many OrderItems
     * const orderItem = await prisma.orderItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OrderItemCreateManyArgs>(args?: SelectSubset<T, OrderItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many OrderItems and returns the data saved in the database.
     * @param {OrderItemCreateManyAndReturnArgs} args - Arguments to create many OrderItems.
     * @example
     * // Create many OrderItems
     * const orderItem = await prisma.orderItem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many OrderItems and only return the `id`
     * const orderItemWithIdOnly = await prisma.orderItem.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends OrderItemCreateManyAndReturnArgs>(args?: SelectSubset<T, OrderItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderItemPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a OrderItem.
     * @param {OrderItemDeleteArgs} args - Arguments to delete one OrderItem.
     * @example
     * // Delete one OrderItem
     * const OrderItem = await prisma.orderItem.delete({
     *   where: {
     *     // ... filter to delete one OrderItem
     *   }
     * })
     * 
     */
    delete<T extends OrderItemDeleteArgs>(args: SelectSubset<T, OrderItemDeleteArgs<ExtArgs>>): Prisma__OrderItemClient<$Result.GetResult<Prisma.$OrderItemPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one OrderItem.
     * @param {OrderItemUpdateArgs} args - Arguments to update one OrderItem.
     * @example
     * // Update one OrderItem
     * const orderItem = await prisma.orderItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OrderItemUpdateArgs>(args: SelectSubset<T, OrderItemUpdateArgs<ExtArgs>>): Prisma__OrderItemClient<$Result.GetResult<Prisma.$OrderItemPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more OrderItems.
     * @param {OrderItemDeleteManyArgs} args - Arguments to filter OrderItems to delete.
     * @example
     * // Delete a few OrderItems
     * const { count } = await prisma.orderItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OrderItemDeleteManyArgs>(args?: SelectSubset<T, OrderItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OrderItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many OrderItems
     * const orderItem = await prisma.orderItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OrderItemUpdateManyArgs>(args: SelectSubset<T, OrderItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one OrderItem.
     * @param {OrderItemUpsertArgs} args - Arguments to update or create a OrderItem.
     * @example
     * // Update or create a OrderItem
     * const orderItem = await prisma.orderItem.upsert({
     *   create: {
     *     // ... data to create a OrderItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the OrderItem we want to update
     *   }
     * })
     */
    upsert<T extends OrderItemUpsertArgs>(args: SelectSubset<T, OrderItemUpsertArgs<ExtArgs>>): Prisma__OrderItemClient<$Result.GetResult<Prisma.$OrderItemPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of OrderItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderItemCountArgs} args - Arguments to filter OrderItems to count.
     * @example
     * // Count the number of OrderItems
     * const count = await prisma.orderItem.count({
     *   where: {
     *     // ... the filter for the OrderItems we want to count
     *   }
     * })
    **/
    count<T extends OrderItemCountArgs>(
      args?: Subset<T, OrderItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OrderItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a OrderItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OrderItemAggregateArgs>(args: Subset<T, OrderItemAggregateArgs>): Prisma.PrismaPromise<GetOrderItemAggregateType<T>>

    /**
     * Group by OrderItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends OrderItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OrderItemGroupByArgs['orderBy'] }
        : { orderBy?: OrderItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, OrderItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOrderItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the OrderItem model
   */
  readonly fields: OrderItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for OrderItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OrderItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    order<T extends OrderDefaultArgs<ExtArgs> = {}>(args?: Subset<T, OrderDefaultArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    product<T extends ProductDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProductDefaultArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the OrderItem model
   */ 
  interface OrderItemFieldRefs {
    readonly id: FieldRef<"OrderItem", 'String'>
    readonly orderId: FieldRef<"OrderItem", 'String'>
    readonly productId: FieldRef<"OrderItem", 'String'>
    readonly quantity: FieldRef<"OrderItem", 'Int'>
    readonly unitPriceKgs: FieldRef<"OrderItem", 'Decimal'>
    readonly totalPriceKgs: FieldRef<"OrderItem", 'Decimal'>
  }
    

  // Custom InputTypes
  /**
   * OrderItem findUnique
   */
  export type OrderItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderItem
     */
    select?: OrderItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderItemInclude<ExtArgs> | null
    /**
     * Filter, which OrderItem to fetch.
     */
    where: OrderItemWhereUniqueInput
  }

  /**
   * OrderItem findUniqueOrThrow
   */
  export type OrderItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderItem
     */
    select?: OrderItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderItemInclude<ExtArgs> | null
    /**
     * Filter, which OrderItem to fetch.
     */
    where: OrderItemWhereUniqueInput
  }

  /**
   * OrderItem findFirst
   */
  export type OrderItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderItem
     */
    select?: OrderItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderItemInclude<ExtArgs> | null
    /**
     * Filter, which OrderItem to fetch.
     */
    where?: OrderItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrderItems to fetch.
     */
    orderBy?: OrderItemOrderByWithRelationInput | OrderItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OrderItems.
     */
    cursor?: OrderItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrderItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrderItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OrderItems.
     */
    distinct?: OrderItemScalarFieldEnum | OrderItemScalarFieldEnum[]
  }

  /**
   * OrderItem findFirstOrThrow
   */
  export type OrderItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderItem
     */
    select?: OrderItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderItemInclude<ExtArgs> | null
    /**
     * Filter, which OrderItem to fetch.
     */
    where?: OrderItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrderItems to fetch.
     */
    orderBy?: OrderItemOrderByWithRelationInput | OrderItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OrderItems.
     */
    cursor?: OrderItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrderItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrderItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OrderItems.
     */
    distinct?: OrderItemScalarFieldEnum | OrderItemScalarFieldEnum[]
  }

  /**
   * OrderItem findMany
   */
  export type OrderItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderItem
     */
    select?: OrderItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderItemInclude<ExtArgs> | null
    /**
     * Filter, which OrderItems to fetch.
     */
    where?: OrderItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrderItems to fetch.
     */
    orderBy?: OrderItemOrderByWithRelationInput | OrderItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing OrderItems.
     */
    cursor?: OrderItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrderItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrderItems.
     */
    skip?: number
    distinct?: OrderItemScalarFieldEnum | OrderItemScalarFieldEnum[]
  }

  /**
   * OrderItem create
   */
  export type OrderItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderItem
     */
    select?: OrderItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderItemInclude<ExtArgs> | null
    /**
     * The data needed to create a OrderItem.
     */
    data: XOR<OrderItemCreateInput, OrderItemUncheckedCreateInput>
  }

  /**
   * OrderItem createMany
   */
  export type OrderItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many OrderItems.
     */
    data: OrderItemCreateManyInput | OrderItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * OrderItem createManyAndReturn
   */
  export type OrderItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderItem
     */
    select?: OrderItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many OrderItems.
     */
    data: OrderItemCreateManyInput | OrderItemCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderItemIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * OrderItem update
   */
  export type OrderItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderItem
     */
    select?: OrderItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderItemInclude<ExtArgs> | null
    /**
     * The data needed to update a OrderItem.
     */
    data: XOR<OrderItemUpdateInput, OrderItemUncheckedUpdateInput>
    /**
     * Choose, which OrderItem to update.
     */
    where: OrderItemWhereUniqueInput
  }

  /**
   * OrderItem updateMany
   */
  export type OrderItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update OrderItems.
     */
    data: XOR<OrderItemUpdateManyMutationInput, OrderItemUncheckedUpdateManyInput>
    /**
     * Filter which OrderItems to update
     */
    where?: OrderItemWhereInput
  }

  /**
   * OrderItem upsert
   */
  export type OrderItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderItem
     */
    select?: OrderItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderItemInclude<ExtArgs> | null
    /**
     * The filter to search for the OrderItem to update in case it exists.
     */
    where: OrderItemWhereUniqueInput
    /**
     * In case the OrderItem found by the `where` argument doesn't exist, create a new OrderItem with this data.
     */
    create: XOR<OrderItemCreateInput, OrderItemUncheckedCreateInput>
    /**
     * In case the OrderItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OrderItemUpdateInput, OrderItemUncheckedUpdateInput>
  }

  /**
   * OrderItem delete
   */
  export type OrderItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderItem
     */
    select?: OrderItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderItemInclude<ExtArgs> | null
    /**
     * Filter which OrderItem to delete.
     */
    where: OrderItemWhereUniqueInput
  }

  /**
   * OrderItem deleteMany
   */
  export type OrderItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OrderItems to delete
     */
    where?: OrderItemWhereInput
  }

  /**
   * OrderItem without action
   */
  export type OrderItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderItem
     */
    select?: OrderItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderItemInclude<ExtArgs> | null
  }


  /**
   * Model Transaction
   */

  export type AggregateTransaction = {
    _count: TransactionCountAggregateOutputType | null
    _avg: TransactionAvgAggregateOutputType | null
    _sum: TransactionSumAggregateOutputType | null
    _min: TransactionMinAggregateOutputType | null
    _max: TransactionMaxAggregateOutputType | null
  }

  export type TransactionAvgAggregateOutputType = {
    amount: Decimal | null
  }

  export type TransactionSumAggregateOutputType = {
    amount: Decimal | null
  }

  export type TransactionMinAggregateOutputType = {
    id: string | null
    userId: string | null
    type: $Enums.TransactionType | null
    amount: Decimal | null
    currency: $Enums.Currency | null
    description: string | null
    createdAt: Date | null
  }

  export type TransactionMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    type: $Enums.TransactionType | null
    amount: Decimal | null
    currency: $Enums.Currency | null
    description: string | null
    createdAt: Date | null
  }

  export type TransactionCountAggregateOutputType = {
    id: number
    userId: number
    type: number
    amount: number
    currency: number
    description: number
    createdAt: number
    _all: number
  }


  export type TransactionAvgAggregateInputType = {
    amount?: true
  }

  export type TransactionSumAggregateInputType = {
    amount?: true
  }

  export type TransactionMinAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    amount?: true
    currency?: true
    description?: true
    createdAt?: true
  }

  export type TransactionMaxAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    amount?: true
    currency?: true
    description?: true
    createdAt?: true
  }

  export type TransactionCountAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    amount?: true
    currency?: true
    description?: true
    createdAt?: true
    _all?: true
  }

  export type TransactionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Transaction to aggregate.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Transactions
    **/
    _count?: true | TransactionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TransactionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TransactionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TransactionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TransactionMaxAggregateInputType
  }

  export type GetTransactionAggregateType<T extends TransactionAggregateArgs> = {
        [P in keyof T & keyof AggregateTransaction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTransaction[P]>
      : GetScalarType<T[P], AggregateTransaction[P]>
  }




  export type TransactionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithAggregationInput | TransactionOrderByWithAggregationInput[]
    by: TransactionScalarFieldEnum[] | TransactionScalarFieldEnum
    having?: TransactionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TransactionCountAggregateInputType | true
    _avg?: TransactionAvgAggregateInputType
    _sum?: TransactionSumAggregateInputType
    _min?: TransactionMinAggregateInputType
    _max?: TransactionMaxAggregateInputType
  }

  export type TransactionGroupByOutputType = {
    id: string
    userId: string
    type: $Enums.TransactionType
    amount: Decimal
    currency: $Enums.Currency
    description: string | null
    createdAt: Date
    _count: TransactionCountAggregateOutputType | null
    _avg: TransactionAvgAggregateOutputType | null
    _sum: TransactionSumAggregateOutputType | null
    _min: TransactionMinAggregateOutputType | null
    _max: TransactionMaxAggregateOutputType | null
  }

  type GetTransactionGroupByPayload<T extends TransactionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TransactionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TransactionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TransactionGroupByOutputType[P]>
            : GetScalarType<T[P], TransactionGroupByOutputType[P]>
        }
      >
    >


  export type TransactionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    amount?: boolean
    currency?: boolean
    description?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["transaction"]>

  export type TransactionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    amount?: boolean
    currency?: boolean
    description?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["transaction"]>

  export type TransactionSelectScalar = {
    id?: boolean
    userId?: boolean
    type?: boolean
    amount?: boolean
    currency?: boolean
    description?: boolean
    createdAt?: boolean
  }

  export type TransactionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type TransactionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $TransactionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Transaction"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      type: $Enums.TransactionType
      amount: Prisma.Decimal
      currency: $Enums.Currency
      description: string | null
      createdAt: Date
    }, ExtArgs["result"]["transaction"]>
    composites: {}
  }

  type TransactionGetPayload<S extends boolean | null | undefined | TransactionDefaultArgs> = $Result.GetResult<Prisma.$TransactionPayload, S>

  type TransactionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TransactionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TransactionCountAggregateInputType | true
    }

  export interface TransactionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Transaction'], meta: { name: 'Transaction' } }
    /**
     * Find zero or one Transaction that matches the filter.
     * @param {TransactionFindUniqueArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TransactionFindUniqueArgs>(args: SelectSubset<T, TransactionFindUniqueArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Transaction that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TransactionFindUniqueOrThrowArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TransactionFindUniqueOrThrowArgs>(args: SelectSubset<T, TransactionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Transaction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindFirstArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TransactionFindFirstArgs>(args?: SelectSubset<T, TransactionFindFirstArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Transaction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindFirstOrThrowArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TransactionFindFirstOrThrowArgs>(args?: SelectSubset<T, TransactionFindFirstOrThrowArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Transactions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Transactions
     * const transactions = await prisma.transaction.findMany()
     * 
     * // Get first 10 Transactions
     * const transactions = await prisma.transaction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const transactionWithIdOnly = await prisma.transaction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TransactionFindManyArgs>(args?: SelectSubset<T, TransactionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Transaction.
     * @param {TransactionCreateArgs} args - Arguments to create a Transaction.
     * @example
     * // Create one Transaction
     * const Transaction = await prisma.transaction.create({
     *   data: {
     *     // ... data to create a Transaction
     *   }
     * })
     * 
     */
    create<T extends TransactionCreateArgs>(args: SelectSubset<T, TransactionCreateArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Transactions.
     * @param {TransactionCreateManyArgs} args - Arguments to create many Transactions.
     * @example
     * // Create many Transactions
     * const transaction = await prisma.transaction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TransactionCreateManyArgs>(args?: SelectSubset<T, TransactionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Transactions and returns the data saved in the database.
     * @param {TransactionCreateManyAndReturnArgs} args - Arguments to create many Transactions.
     * @example
     * // Create many Transactions
     * const transaction = await prisma.transaction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Transactions and only return the `id`
     * const transactionWithIdOnly = await prisma.transaction.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TransactionCreateManyAndReturnArgs>(args?: SelectSubset<T, TransactionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Transaction.
     * @param {TransactionDeleteArgs} args - Arguments to delete one Transaction.
     * @example
     * // Delete one Transaction
     * const Transaction = await prisma.transaction.delete({
     *   where: {
     *     // ... filter to delete one Transaction
     *   }
     * })
     * 
     */
    delete<T extends TransactionDeleteArgs>(args: SelectSubset<T, TransactionDeleteArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Transaction.
     * @param {TransactionUpdateArgs} args - Arguments to update one Transaction.
     * @example
     * // Update one Transaction
     * const transaction = await prisma.transaction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TransactionUpdateArgs>(args: SelectSubset<T, TransactionUpdateArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Transactions.
     * @param {TransactionDeleteManyArgs} args - Arguments to filter Transactions to delete.
     * @example
     * // Delete a few Transactions
     * const { count } = await prisma.transaction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TransactionDeleteManyArgs>(args?: SelectSubset<T, TransactionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Transactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Transactions
     * const transaction = await prisma.transaction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TransactionUpdateManyArgs>(args: SelectSubset<T, TransactionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Transaction.
     * @param {TransactionUpsertArgs} args - Arguments to update or create a Transaction.
     * @example
     * // Update or create a Transaction
     * const transaction = await prisma.transaction.upsert({
     *   create: {
     *     // ... data to create a Transaction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Transaction we want to update
     *   }
     * })
     */
    upsert<T extends TransactionUpsertArgs>(args: SelectSubset<T, TransactionUpsertArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Transactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionCountArgs} args - Arguments to filter Transactions to count.
     * @example
     * // Count the number of Transactions
     * const count = await prisma.transaction.count({
     *   where: {
     *     // ... the filter for the Transactions we want to count
     *   }
     * })
    **/
    count<T extends TransactionCountArgs>(
      args?: Subset<T, TransactionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TransactionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Transaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TransactionAggregateArgs>(args: Subset<T, TransactionAggregateArgs>): Prisma.PrismaPromise<GetTransactionAggregateType<T>>

    /**
     * Group by Transaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TransactionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TransactionGroupByArgs['orderBy'] }
        : { orderBy?: TransactionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TransactionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTransactionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Transaction model
   */
  readonly fields: TransactionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Transaction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TransactionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Transaction model
   */ 
  interface TransactionFieldRefs {
    readonly id: FieldRef<"Transaction", 'String'>
    readonly userId: FieldRef<"Transaction", 'String'>
    readonly type: FieldRef<"Transaction", 'TransactionType'>
    readonly amount: FieldRef<"Transaction", 'Decimal'>
    readonly currency: FieldRef<"Transaction", 'Currency'>
    readonly description: FieldRef<"Transaction", 'String'>
    readonly createdAt: FieldRef<"Transaction", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Transaction findUnique
   */
  export type TransactionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction findUniqueOrThrow
   */
  export type TransactionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction findFirst
   */
  export type TransactionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Transactions.
     */
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Transaction findFirstOrThrow
   */
  export type TransactionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Transactions.
     */
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Transaction findMany
   */
  export type TransactionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transactions to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Transaction create
   */
  export type TransactionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The data needed to create a Transaction.
     */
    data: XOR<TransactionCreateInput, TransactionUncheckedCreateInput>
  }

  /**
   * Transaction createMany
   */
  export type TransactionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Transactions.
     */
    data: TransactionCreateManyInput | TransactionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Transaction createManyAndReturn
   */
  export type TransactionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Transactions.
     */
    data: TransactionCreateManyInput | TransactionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Transaction update
   */
  export type TransactionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The data needed to update a Transaction.
     */
    data: XOR<TransactionUpdateInput, TransactionUncheckedUpdateInput>
    /**
     * Choose, which Transaction to update.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction updateMany
   */
  export type TransactionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Transactions.
     */
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyInput>
    /**
     * Filter which Transactions to update
     */
    where?: TransactionWhereInput
  }

  /**
   * Transaction upsert
   */
  export type TransactionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The filter to search for the Transaction to update in case it exists.
     */
    where: TransactionWhereUniqueInput
    /**
     * In case the Transaction found by the `where` argument doesn't exist, create a new Transaction with this data.
     */
    create: XOR<TransactionCreateInput, TransactionUncheckedCreateInput>
    /**
     * In case the Transaction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TransactionUpdateInput, TransactionUncheckedUpdateInput>
  }

  /**
   * Transaction delete
   */
  export type TransactionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter which Transaction to delete.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction deleteMany
   */
  export type TransactionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Transactions to delete
     */
    where?: TransactionWhereInput
  }

  /**
   * Transaction without action
   */
  export type TransactionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
  }


  /**
   * Model ExchangeRate
   */

  export type AggregateExchangeRate = {
    _count: ExchangeRateCountAggregateOutputType | null
    _avg: ExchangeRateAvgAggregateOutputType | null
    _sum: ExchangeRateSumAggregateOutputType | null
    _min: ExchangeRateMinAggregateOutputType | null
    _max: ExchangeRateMaxAggregateOutputType | null
  }

  export type ExchangeRateAvgAggregateOutputType = {
    rateToKgs: Decimal | null
  }

  export type ExchangeRateSumAggregateOutputType = {
    rateToKgs: Decimal | null
  }

  export type ExchangeRateMinAggregateOutputType = {
    id: string | null
    currency: string | null
    rateToKgs: Decimal | null
    updatedAt: Date | null
  }

  export type ExchangeRateMaxAggregateOutputType = {
    id: string | null
    currency: string | null
    rateToKgs: Decimal | null
    updatedAt: Date | null
  }

  export type ExchangeRateCountAggregateOutputType = {
    id: number
    currency: number
    rateToKgs: number
    updatedAt: number
    _all: number
  }


  export type ExchangeRateAvgAggregateInputType = {
    rateToKgs?: true
  }

  export type ExchangeRateSumAggregateInputType = {
    rateToKgs?: true
  }

  export type ExchangeRateMinAggregateInputType = {
    id?: true
    currency?: true
    rateToKgs?: true
    updatedAt?: true
  }

  export type ExchangeRateMaxAggregateInputType = {
    id?: true
    currency?: true
    rateToKgs?: true
    updatedAt?: true
  }

  export type ExchangeRateCountAggregateInputType = {
    id?: true
    currency?: true
    rateToKgs?: true
    updatedAt?: true
    _all?: true
  }

  export type ExchangeRateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ExchangeRate to aggregate.
     */
    where?: ExchangeRateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ExchangeRates to fetch.
     */
    orderBy?: ExchangeRateOrderByWithRelationInput | ExchangeRateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ExchangeRateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ExchangeRates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ExchangeRates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ExchangeRates
    **/
    _count?: true | ExchangeRateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ExchangeRateAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ExchangeRateSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ExchangeRateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ExchangeRateMaxAggregateInputType
  }

  export type GetExchangeRateAggregateType<T extends ExchangeRateAggregateArgs> = {
        [P in keyof T & keyof AggregateExchangeRate]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateExchangeRate[P]>
      : GetScalarType<T[P], AggregateExchangeRate[P]>
  }




  export type ExchangeRateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ExchangeRateWhereInput
    orderBy?: ExchangeRateOrderByWithAggregationInput | ExchangeRateOrderByWithAggregationInput[]
    by: ExchangeRateScalarFieldEnum[] | ExchangeRateScalarFieldEnum
    having?: ExchangeRateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ExchangeRateCountAggregateInputType | true
    _avg?: ExchangeRateAvgAggregateInputType
    _sum?: ExchangeRateSumAggregateInputType
    _min?: ExchangeRateMinAggregateInputType
    _max?: ExchangeRateMaxAggregateInputType
  }

  export type ExchangeRateGroupByOutputType = {
    id: string
    currency: string
    rateToKgs: Decimal
    updatedAt: Date
    _count: ExchangeRateCountAggregateOutputType | null
    _avg: ExchangeRateAvgAggregateOutputType | null
    _sum: ExchangeRateSumAggregateOutputType | null
    _min: ExchangeRateMinAggregateOutputType | null
    _max: ExchangeRateMaxAggregateOutputType | null
  }

  type GetExchangeRateGroupByPayload<T extends ExchangeRateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ExchangeRateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ExchangeRateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ExchangeRateGroupByOutputType[P]>
            : GetScalarType<T[P], ExchangeRateGroupByOutputType[P]>
        }
      >
    >


  export type ExchangeRateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    currency?: boolean
    rateToKgs?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["exchangeRate"]>

  export type ExchangeRateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    currency?: boolean
    rateToKgs?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["exchangeRate"]>

  export type ExchangeRateSelectScalar = {
    id?: boolean
    currency?: boolean
    rateToKgs?: boolean
    updatedAt?: boolean
  }


  export type $ExchangeRatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ExchangeRate"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      currency: string
      rateToKgs: Prisma.Decimal
      updatedAt: Date
    }, ExtArgs["result"]["exchangeRate"]>
    composites: {}
  }

  type ExchangeRateGetPayload<S extends boolean | null | undefined | ExchangeRateDefaultArgs> = $Result.GetResult<Prisma.$ExchangeRatePayload, S>

  type ExchangeRateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ExchangeRateFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ExchangeRateCountAggregateInputType | true
    }

  export interface ExchangeRateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ExchangeRate'], meta: { name: 'ExchangeRate' } }
    /**
     * Find zero or one ExchangeRate that matches the filter.
     * @param {ExchangeRateFindUniqueArgs} args - Arguments to find a ExchangeRate
     * @example
     * // Get one ExchangeRate
     * const exchangeRate = await prisma.exchangeRate.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ExchangeRateFindUniqueArgs>(args: SelectSubset<T, ExchangeRateFindUniqueArgs<ExtArgs>>): Prisma__ExchangeRateClient<$Result.GetResult<Prisma.$ExchangeRatePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ExchangeRate that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ExchangeRateFindUniqueOrThrowArgs} args - Arguments to find a ExchangeRate
     * @example
     * // Get one ExchangeRate
     * const exchangeRate = await prisma.exchangeRate.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ExchangeRateFindUniqueOrThrowArgs>(args: SelectSubset<T, ExchangeRateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ExchangeRateClient<$Result.GetResult<Prisma.$ExchangeRatePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ExchangeRate that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExchangeRateFindFirstArgs} args - Arguments to find a ExchangeRate
     * @example
     * // Get one ExchangeRate
     * const exchangeRate = await prisma.exchangeRate.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ExchangeRateFindFirstArgs>(args?: SelectSubset<T, ExchangeRateFindFirstArgs<ExtArgs>>): Prisma__ExchangeRateClient<$Result.GetResult<Prisma.$ExchangeRatePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ExchangeRate that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExchangeRateFindFirstOrThrowArgs} args - Arguments to find a ExchangeRate
     * @example
     * // Get one ExchangeRate
     * const exchangeRate = await prisma.exchangeRate.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ExchangeRateFindFirstOrThrowArgs>(args?: SelectSubset<T, ExchangeRateFindFirstOrThrowArgs<ExtArgs>>): Prisma__ExchangeRateClient<$Result.GetResult<Prisma.$ExchangeRatePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ExchangeRates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExchangeRateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ExchangeRates
     * const exchangeRates = await prisma.exchangeRate.findMany()
     * 
     * // Get first 10 ExchangeRates
     * const exchangeRates = await prisma.exchangeRate.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const exchangeRateWithIdOnly = await prisma.exchangeRate.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ExchangeRateFindManyArgs>(args?: SelectSubset<T, ExchangeRateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExchangeRatePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ExchangeRate.
     * @param {ExchangeRateCreateArgs} args - Arguments to create a ExchangeRate.
     * @example
     * // Create one ExchangeRate
     * const ExchangeRate = await prisma.exchangeRate.create({
     *   data: {
     *     // ... data to create a ExchangeRate
     *   }
     * })
     * 
     */
    create<T extends ExchangeRateCreateArgs>(args: SelectSubset<T, ExchangeRateCreateArgs<ExtArgs>>): Prisma__ExchangeRateClient<$Result.GetResult<Prisma.$ExchangeRatePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ExchangeRates.
     * @param {ExchangeRateCreateManyArgs} args - Arguments to create many ExchangeRates.
     * @example
     * // Create many ExchangeRates
     * const exchangeRate = await prisma.exchangeRate.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ExchangeRateCreateManyArgs>(args?: SelectSubset<T, ExchangeRateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ExchangeRates and returns the data saved in the database.
     * @param {ExchangeRateCreateManyAndReturnArgs} args - Arguments to create many ExchangeRates.
     * @example
     * // Create many ExchangeRates
     * const exchangeRate = await prisma.exchangeRate.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ExchangeRates and only return the `id`
     * const exchangeRateWithIdOnly = await prisma.exchangeRate.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ExchangeRateCreateManyAndReturnArgs>(args?: SelectSubset<T, ExchangeRateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExchangeRatePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ExchangeRate.
     * @param {ExchangeRateDeleteArgs} args - Arguments to delete one ExchangeRate.
     * @example
     * // Delete one ExchangeRate
     * const ExchangeRate = await prisma.exchangeRate.delete({
     *   where: {
     *     // ... filter to delete one ExchangeRate
     *   }
     * })
     * 
     */
    delete<T extends ExchangeRateDeleteArgs>(args: SelectSubset<T, ExchangeRateDeleteArgs<ExtArgs>>): Prisma__ExchangeRateClient<$Result.GetResult<Prisma.$ExchangeRatePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ExchangeRate.
     * @param {ExchangeRateUpdateArgs} args - Arguments to update one ExchangeRate.
     * @example
     * // Update one ExchangeRate
     * const exchangeRate = await prisma.exchangeRate.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ExchangeRateUpdateArgs>(args: SelectSubset<T, ExchangeRateUpdateArgs<ExtArgs>>): Prisma__ExchangeRateClient<$Result.GetResult<Prisma.$ExchangeRatePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ExchangeRates.
     * @param {ExchangeRateDeleteManyArgs} args - Arguments to filter ExchangeRates to delete.
     * @example
     * // Delete a few ExchangeRates
     * const { count } = await prisma.exchangeRate.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ExchangeRateDeleteManyArgs>(args?: SelectSubset<T, ExchangeRateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ExchangeRates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExchangeRateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ExchangeRates
     * const exchangeRate = await prisma.exchangeRate.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ExchangeRateUpdateManyArgs>(args: SelectSubset<T, ExchangeRateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ExchangeRate.
     * @param {ExchangeRateUpsertArgs} args - Arguments to update or create a ExchangeRate.
     * @example
     * // Update or create a ExchangeRate
     * const exchangeRate = await prisma.exchangeRate.upsert({
     *   create: {
     *     // ... data to create a ExchangeRate
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ExchangeRate we want to update
     *   }
     * })
     */
    upsert<T extends ExchangeRateUpsertArgs>(args: SelectSubset<T, ExchangeRateUpsertArgs<ExtArgs>>): Prisma__ExchangeRateClient<$Result.GetResult<Prisma.$ExchangeRatePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ExchangeRates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExchangeRateCountArgs} args - Arguments to filter ExchangeRates to count.
     * @example
     * // Count the number of ExchangeRates
     * const count = await prisma.exchangeRate.count({
     *   where: {
     *     // ... the filter for the ExchangeRates we want to count
     *   }
     * })
    **/
    count<T extends ExchangeRateCountArgs>(
      args?: Subset<T, ExchangeRateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ExchangeRateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ExchangeRate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExchangeRateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ExchangeRateAggregateArgs>(args: Subset<T, ExchangeRateAggregateArgs>): Prisma.PrismaPromise<GetExchangeRateAggregateType<T>>

    /**
     * Group by ExchangeRate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExchangeRateGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ExchangeRateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ExchangeRateGroupByArgs['orderBy'] }
        : { orderBy?: ExchangeRateGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ExchangeRateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetExchangeRateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ExchangeRate model
   */
  readonly fields: ExchangeRateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ExchangeRate.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ExchangeRateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ExchangeRate model
   */ 
  interface ExchangeRateFieldRefs {
    readonly id: FieldRef<"ExchangeRate", 'String'>
    readonly currency: FieldRef<"ExchangeRate", 'String'>
    readonly rateToKgs: FieldRef<"ExchangeRate", 'Decimal'>
    readonly updatedAt: FieldRef<"ExchangeRate", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ExchangeRate findUnique
   */
  export type ExchangeRateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExchangeRate
     */
    select?: ExchangeRateSelect<ExtArgs> | null
    /**
     * Filter, which ExchangeRate to fetch.
     */
    where: ExchangeRateWhereUniqueInput
  }

  /**
   * ExchangeRate findUniqueOrThrow
   */
  export type ExchangeRateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExchangeRate
     */
    select?: ExchangeRateSelect<ExtArgs> | null
    /**
     * Filter, which ExchangeRate to fetch.
     */
    where: ExchangeRateWhereUniqueInput
  }

  /**
   * ExchangeRate findFirst
   */
  export type ExchangeRateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExchangeRate
     */
    select?: ExchangeRateSelect<ExtArgs> | null
    /**
     * Filter, which ExchangeRate to fetch.
     */
    where?: ExchangeRateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ExchangeRates to fetch.
     */
    orderBy?: ExchangeRateOrderByWithRelationInput | ExchangeRateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ExchangeRates.
     */
    cursor?: ExchangeRateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ExchangeRates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ExchangeRates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ExchangeRates.
     */
    distinct?: ExchangeRateScalarFieldEnum | ExchangeRateScalarFieldEnum[]
  }

  /**
   * ExchangeRate findFirstOrThrow
   */
  export type ExchangeRateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExchangeRate
     */
    select?: ExchangeRateSelect<ExtArgs> | null
    /**
     * Filter, which ExchangeRate to fetch.
     */
    where?: ExchangeRateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ExchangeRates to fetch.
     */
    orderBy?: ExchangeRateOrderByWithRelationInput | ExchangeRateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ExchangeRates.
     */
    cursor?: ExchangeRateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ExchangeRates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ExchangeRates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ExchangeRates.
     */
    distinct?: ExchangeRateScalarFieldEnum | ExchangeRateScalarFieldEnum[]
  }

  /**
   * ExchangeRate findMany
   */
  export type ExchangeRateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExchangeRate
     */
    select?: ExchangeRateSelect<ExtArgs> | null
    /**
     * Filter, which ExchangeRates to fetch.
     */
    where?: ExchangeRateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ExchangeRates to fetch.
     */
    orderBy?: ExchangeRateOrderByWithRelationInput | ExchangeRateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ExchangeRates.
     */
    cursor?: ExchangeRateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ExchangeRates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ExchangeRates.
     */
    skip?: number
    distinct?: ExchangeRateScalarFieldEnum | ExchangeRateScalarFieldEnum[]
  }

  /**
   * ExchangeRate create
   */
  export type ExchangeRateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExchangeRate
     */
    select?: ExchangeRateSelect<ExtArgs> | null
    /**
     * The data needed to create a ExchangeRate.
     */
    data: XOR<ExchangeRateCreateInput, ExchangeRateUncheckedCreateInput>
  }

  /**
   * ExchangeRate createMany
   */
  export type ExchangeRateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ExchangeRates.
     */
    data: ExchangeRateCreateManyInput | ExchangeRateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ExchangeRate createManyAndReturn
   */
  export type ExchangeRateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExchangeRate
     */
    select?: ExchangeRateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ExchangeRates.
     */
    data: ExchangeRateCreateManyInput | ExchangeRateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ExchangeRate update
   */
  export type ExchangeRateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExchangeRate
     */
    select?: ExchangeRateSelect<ExtArgs> | null
    /**
     * The data needed to update a ExchangeRate.
     */
    data: XOR<ExchangeRateUpdateInput, ExchangeRateUncheckedUpdateInput>
    /**
     * Choose, which ExchangeRate to update.
     */
    where: ExchangeRateWhereUniqueInput
  }

  /**
   * ExchangeRate updateMany
   */
  export type ExchangeRateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ExchangeRates.
     */
    data: XOR<ExchangeRateUpdateManyMutationInput, ExchangeRateUncheckedUpdateManyInput>
    /**
     * Filter which ExchangeRates to update
     */
    where?: ExchangeRateWhereInput
  }

  /**
   * ExchangeRate upsert
   */
  export type ExchangeRateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExchangeRate
     */
    select?: ExchangeRateSelect<ExtArgs> | null
    /**
     * The filter to search for the ExchangeRate to update in case it exists.
     */
    where: ExchangeRateWhereUniqueInput
    /**
     * In case the ExchangeRate found by the `where` argument doesn't exist, create a new ExchangeRate with this data.
     */
    create: XOR<ExchangeRateCreateInput, ExchangeRateUncheckedCreateInput>
    /**
     * In case the ExchangeRate was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ExchangeRateUpdateInput, ExchangeRateUncheckedUpdateInput>
  }

  /**
   * ExchangeRate delete
   */
  export type ExchangeRateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExchangeRate
     */
    select?: ExchangeRateSelect<ExtArgs> | null
    /**
     * Filter which ExchangeRate to delete.
     */
    where: ExchangeRateWhereUniqueInput
  }

  /**
   * ExchangeRate deleteMany
   */
  export type ExchangeRateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ExchangeRates to delete
     */
    where?: ExchangeRateWhereInput
  }

  /**
   * ExchangeRate without action
   */
  export type ExchangeRateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExchangeRate
     */
    select?: ExchangeRateSelect<ExtArgs> | null
  }


  /**
   * Model SystemConfig
   */

  export type AggregateSystemConfig = {
    _count: SystemConfigCountAggregateOutputType | null
    _avg: SystemConfigAvgAggregateOutputType | null
    _sum: SystemConfigSumAggregateOutputType | null
    _min: SystemConfigMinAggregateOutputType | null
    _max: SystemConfigMaxAggregateOutputType | null
  }

  export type SystemConfigAvgAggregateOutputType = {
    maxPayoutLimitPct: Decimal | null
    overdrivePoolPct: Decimal | null
  }

  export type SystemConfigSumAggregateOutputType = {
    maxPayoutLimitPct: Decimal | null
    overdrivePoolPct: Decimal | null
  }

  export type SystemConfigMinAggregateOutputType = {
    id: string | null
    isMlmEnabled: boolean | null
    maxPayoutLimitPct: Decimal | null
    isFastStartActive: boolean | null
    isUnilevelActive: boolean | null
    isOverdriveActive: boolean | null
    overdrivePoolPct: Decimal | null
    updatedAt: Date | null
  }

  export type SystemConfigMaxAggregateOutputType = {
    id: string | null
    isMlmEnabled: boolean | null
    maxPayoutLimitPct: Decimal | null
    isFastStartActive: boolean | null
    isUnilevelActive: boolean | null
    isOverdriveActive: boolean | null
    overdrivePoolPct: Decimal | null
    updatedAt: Date | null
  }

  export type SystemConfigCountAggregateOutputType = {
    id: number
    isMlmEnabled: number
    maxPayoutLimitPct: number
    isFastStartActive: number
    fastStartRates: number
    isUnilevelActive: number
    unilevelRates: number
    isOverdriveActive: number
    overdrivePoolPct: number
    updatedAt: number
    _all: number
  }


  export type SystemConfigAvgAggregateInputType = {
    maxPayoutLimitPct?: true
    overdrivePoolPct?: true
  }

  export type SystemConfigSumAggregateInputType = {
    maxPayoutLimitPct?: true
    overdrivePoolPct?: true
  }

  export type SystemConfigMinAggregateInputType = {
    id?: true
    isMlmEnabled?: true
    maxPayoutLimitPct?: true
    isFastStartActive?: true
    isUnilevelActive?: true
    isOverdriveActive?: true
    overdrivePoolPct?: true
    updatedAt?: true
  }

  export type SystemConfigMaxAggregateInputType = {
    id?: true
    isMlmEnabled?: true
    maxPayoutLimitPct?: true
    isFastStartActive?: true
    isUnilevelActive?: true
    isOverdriveActive?: true
    overdrivePoolPct?: true
    updatedAt?: true
  }

  export type SystemConfigCountAggregateInputType = {
    id?: true
    isMlmEnabled?: true
    maxPayoutLimitPct?: true
    isFastStartActive?: true
    fastStartRates?: true
    isUnilevelActive?: true
    unilevelRates?: true
    isOverdriveActive?: true
    overdrivePoolPct?: true
    updatedAt?: true
    _all?: true
  }

  export type SystemConfigAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SystemConfig to aggregate.
     */
    where?: SystemConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SystemConfigs to fetch.
     */
    orderBy?: SystemConfigOrderByWithRelationInput | SystemConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SystemConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SystemConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SystemConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SystemConfigs
    **/
    _count?: true | SystemConfigCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SystemConfigAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SystemConfigSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SystemConfigMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SystemConfigMaxAggregateInputType
  }

  export type GetSystemConfigAggregateType<T extends SystemConfigAggregateArgs> = {
        [P in keyof T & keyof AggregateSystemConfig]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSystemConfig[P]>
      : GetScalarType<T[P], AggregateSystemConfig[P]>
  }




  export type SystemConfigGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SystemConfigWhereInput
    orderBy?: SystemConfigOrderByWithAggregationInput | SystemConfigOrderByWithAggregationInput[]
    by: SystemConfigScalarFieldEnum[] | SystemConfigScalarFieldEnum
    having?: SystemConfigScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SystemConfigCountAggregateInputType | true
    _avg?: SystemConfigAvgAggregateInputType
    _sum?: SystemConfigSumAggregateInputType
    _min?: SystemConfigMinAggregateInputType
    _max?: SystemConfigMaxAggregateInputType
  }

  export type SystemConfigGroupByOutputType = {
    id: string
    isMlmEnabled: boolean
    maxPayoutLimitPct: Decimal
    isFastStartActive: boolean
    fastStartRates: JsonValue
    isUnilevelActive: boolean
    unilevelRates: JsonValue
    isOverdriveActive: boolean
    overdrivePoolPct: Decimal
    updatedAt: Date
    _count: SystemConfigCountAggregateOutputType | null
    _avg: SystemConfigAvgAggregateOutputType | null
    _sum: SystemConfigSumAggregateOutputType | null
    _min: SystemConfigMinAggregateOutputType | null
    _max: SystemConfigMaxAggregateOutputType | null
  }

  type GetSystemConfigGroupByPayload<T extends SystemConfigGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SystemConfigGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SystemConfigGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SystemConfigGroupByOutputType[P]>
            : GetScalarType<T[P], SystemConfigGroupByOutputType[P]>
        }
      >
    >


  export type SystemConfigSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    isMlmEnabled?: boolean
    maxPayoutLimitPct?: boolean
    isFastStartActive?: boolean
    fastStartRates?: boolean
    isUnilevelActive?: boolean
    unilevelRates?: boolean
    isOverdriveActive?: boolean
    overdrivePoolPct?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["systemConfig"]>

  export type SystemConfigSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    isMlmEnabled?: boolean
    maxPayoutLimitPct?: boolean
    isFastStartActive?: boolean
    fastStartRates?: boolean
    isUnilevelActive?: boolean
    unilevelRates?: boolean
    isOverdriveActive?: boolean
    overdrivePoolPct?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["systemConfig"]>

  export type SystemConfigSelectScalar = {
    id?: boolean
    isMlmEnabled?: boolean
    maxPayoutLimitPct?: boolean
    isFastStartActive?: boolean
    fastStartRates?: boolean
    isUnilevelActive?: boolean
    unilevelRates?: boolean
    isOverdriveActive?: boolean
    overdrivePoolPct?: boolean
    updatedAt?: boolean
  }


  export type $SystemConfigPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SystemConfig"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      isMlmEnabled: boolean
      maxPayoutLimitPct: Prisma.Decimal
      isFastStartActive: boolean
      fastStartRates: Prisma.JsonValue
      isUnilevelActive: boolean
      unilevelRates: Prisma.JsonValue
      isOverdriveActive: boolean
      overdrivePoolPct: Prisma.Decimal
      updatedAt: Date
    }, ExtArgs["result"]["systemConfig"]>
    composites: {}
  }

  type SystemConfigGetPayload<S extends boolean | null | undefined | SystemConfigDefaultArgs> = $Result.GetResult<Prisma.$SystemConfigPayload, S>

  type SystemConfigCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SystemConfigFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SystemConfigCountAggregateInputType | true
    }

  export interface SystemConfigDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SystemConfig'], meta: { name: 'SystemConfig' } }
    /**
     * Find zero or one SystemConfig that matches the filter.
     * @param {SystemConfigFindUniqueArgs} args - Arguments to find a SystemConfig
     * @example
     * // Get one SystemConfig
     * const systemConfig = await prisma.systemConfig.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SystemConfigFindUniqueArgs>(args: SelectSubset<T, SystemConfigFindUniqueArgs<ExtArgs>>): Prisma__SystemConfigClient<$Result.GetResult<Prisma.$SystemConfigPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one SystemConfig that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SystemConfigFindUniqueOrThrowArgs} args - Arguments to find a SystemConfig
     * @example
     * // Get one SystemConfig
     * const systemConfig = await prisma.systemConfig.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SystemConfigFindUniqueOrThrowArgs>(args: SelectSubset<T, SystemConfigFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SystemConfigClient<$Result.GetResult<Prisma.$SystemConfigPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first SystemConfig that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemConfigFindFirstArgs} args - Arguments to find a SystemConfig
     * @example
     * // Get one SystemConfig
     * const systemConfig = await prisma.systemConfig.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SystemConfigFindFirstArgs>(args?: SelectSubset<T, SystemConfigFindFirstArgs<ExtArgs>>): Prisma__SystemConfigClient<$Result.GetResult<Prisma.$SystemConfigPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first SystemConfig that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemConfigFindFirstOrThrowArgs} args - Arguments to find a SystemConfig
     * @example
     * // Get one SystemConfig
     * const systemConfig = await prisma.systemConfig.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SystemConfigFindFirstOrThrowArgs>(args?: SelectSubset<T, SystemConfigFindFirstOrThrowArgs<ExtArgs>>): Prisma__SystemConfigClient<$Result.GetResult<Prisma.$SystemConfigPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more SystemConfigs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemConfigFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SystemConfigs
     * const systemConfigs = await prisma.systemConfig.findMany()
     * 
     * // Get first 10 SystemConfigs
     * const systemConfigs = await prisma.systemConfig.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const systemConfigWithIdOnly = await prisma.systemConfig.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SystemConfigFindManyArgs>(args?: SelectSubset<T, SystemConfigFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SystemConfigPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a SystemConfig.
     * @param {SystemConfigCreateArgs} args - Arguments to create a SystemConfig.
     * @example
     * // Create one SystemConfig
     * const SystemConfig = await prisma.systemConfig.create({
     *   data: {
     *     // ... data to create a SystemConfig
     *   }
     * })
     * 
     */
    create<T extends SystemConfigCreateArgs>(args: SelectSubset<T, SystemConfigCreateArgs<ExtArgs>>): Prisma__SystemConfigClient<$Result.GetResult<Prisma.$SystemConfigPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many SystemConfigs.
     * @param {SystemConfigCreateManyArgs} args - Arguments to create many SystemConfigs.
     * @example
     * // Create many SystemConfigs
     * const systemConfig = await prisma.systemConfig.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SystemConfigCreateManyArgs>(args?: SelectSubset<T, SystemConfigCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SystemConfigs and returns the data saved in the database.
     * @param {SystemConfigCreateManyAndReturnArgs} args - Arguments to create many SystemConfigs.
     * @example
     * // Create many SystemConfigs
     * const systemConfig = await prisma.systemConfig.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SystemConfigs and only return the `id`
     * const systemConfigWithIdOnly = await prisma.systemConfig.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SystemConfigCreateManyAndReturnArgs>(args?: SelectSubset<T, SystemConfigCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SystemConfigPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a SystemConfig.
     * @param {SystemConfigDeleteArgs} args - Arguments to delete one SystemConfig.
     * @example
     * // Delete one SystemConfig
     * const SystemConfig = await prisma.systemConfig.delete({
     *   where: {
     *     // ... filter to delete one SystemConfig
     *   }
     * })
     * 
     */
    delete<T extends SystemConfigDeleteArgs>(args: SelectSubset<T, SystemConfigDeleteArgs<ExtArgs>>): Prisma__SystemConfigClient<$Result.GetResult<Prisma.$SystemConfigPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one SystemConfig.
     * @param {SystemConfigUpdateArgs} args - Arguments to update one SystemConfig.
     * @example
     * // Update one SystemConfig
     * const systemConfig = await prisma.systemConfig.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SystemConfigUpdateArgs>(args: SelectSubset<T, SystemConfigUpdateArgs<ExtArgs>>): Prisma__SystemConfigClient<$Result.GetResult<Prisma.$SystemConfigPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more SystemConfigs.
     * @param {SystemConfigDeleteManyArgs} args - Arguments to filter SystemConfigs to delete.
     * @example
     * // Delete a few SystemConfigs
     * const { count } = await prisma.systemConfig.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SystemConfigDeleteManyArgs>(args?: SelectSubset<T, SystemConfigDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SystemConfigs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemConfigUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SystemConfigs
     * const systemConfig = await prisma.systemConfig.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SystemConfigUpdateManyArgs>(args: SelectSubset<T, SystemConfigUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one SystemConfig.
     * @param {SystemConfigUpsertArgs} args - Arguments to update or create a SystemConfig.
     * @example
     * // Update or create a SystemConfig
     * const systemConfig = await prisma.systemConfig.upsert({
     *   create: {
     *     // ... data to create a SystemConfig
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SystemConfig we want to update
     *   }
     * })
     */
    upsert<T extends SystemConfigUpsertArgs>(args: SelectSubset<T, SystemConfigUpsertArgs<ExtArgs>>): Prisma__SystemConfigClient<$Result.GetResult<Prisma.$SystemConfigPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of SystemConfigs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemConfigCountArgs} args - Arguments to filter SystemConfigs to count.
     * @example
     * // Count the number of SystemConfigs
     * const count = await prisma.systemConfig.count({
     *   where: {
     *     // ... the filter for the SystemConfigs we want to count
     *   }
     * })
    **/
    count<T extends SystemConfigCountArgs>(
      args?: Subset<T, SystemConfigCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SystemConfigCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SystemConfig.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemConfigAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SystemConfigAggregateArgs>(args: Subset<T, SystemConfigAggregateArgs>): Prisma.PrismaPromise<GetSystemConfigAggregateType<T>>

    /**
     * Group by SystemConfig.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemConfigGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SystemConfigGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SystemConfigGroupByArgs['orderBy'] }
        : { orderBy?: SystemConfigGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SystemConfigGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSystemConfigGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SystemConfig model
   */
  readonly fields: SystemConfigFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SystemConfig.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SystemConfigClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SystemConfig model
   */ 
  interface SystemConfigFieldRefs {
    readonly id: FieldRef<"SystemConfig", 'String'>
    readonly isMlmEnabled: FieldRef<"SystemConfig", 'Boolean'>
    readonly maxPayoutLimitPct: FieldRef<"SystemConfig", 'Decimal'>
    readonly isFastStartActive: FieldRef<"SystemConfig", 'Boolean'>
    readonly fastStartRates: FieldRef<"SystemConfig", 'Json'>
    readonly isUnilevelActive: FieldRef<"SystemConfig", 'Boolean'>
    readonly unilevelRates: FieldRef<"SystemConfig", 'Json'>
    readonly isOverdriveActive: FieldRef<"SystemConfig", 'Boolean'>
    readonly overdrivePoolPct: FieldRef<"SystemConfig", 'Decimal'>
    readonly updatedAt: FieldRef<"SystemConfig", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SystemConfig findUnique
   */
  export type SystemConfigFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemConfig
     */
    select?: SystemConfigSelect<ExtArgs> | null
    /**
     * Filter, which SystemConfig to fetch.
     */
    where: SystemConfigWhereUniqueInput
  }

  /**
   * SystemConfig findUniqueOrThrow
   */
  export type SystemConfigFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemConfig
     */
    select?: SystemConfigSelect<ExtArgs> | null
    /**
     * Filter, which SystemConfig to fetch.
     */
    where: SystemConfigWhereUniqueInput
  }

  /**
   * SystemConfig findFirst
   */
  export type SystemConfigFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemConfig
     */
    select?: SystemConfigSelect<ExtArgs> | null
    /**
     * Filter, which SystemConfig to fetch.
     */
    where?: SystemConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SystemConfigs to fetch.
     */
    orderBy?: SystemConfigOrderByWithRelationInput | SystemConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SystemConfigs.
     */
    cursor?: SystemConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SystemConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SystemConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SystemConfigs.
     */
    distinct?: SystemConfigScalarFieldEnum | SystemConfigScalarFieldEnum[]
  }

  /**
   * SystemConfig findFirstOrThrow
   */
  export type SystemConfigFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemConfig
     */
    select?: SystemConfigSelect<ExtArgs> | null
    /**
     * Filter, which SystemConfig to fetch.
     */
    where?: SystemConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SystemConfigs to fetch.
     */
    orderBy?: SystemConfigOrderByWithRelationInput | SystemConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SystemConfigs.
     */
    cursor?: SystemConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SystemConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SystemConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SystemConfigs.
     */
    distinct?: SystemConfigScalarFieldEnum | SystemConfigScalarFieldEnum[]
  }

  /**
   * SystemConfig findMany
   */
  export type SystemConfigFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemConfig
     */
    select?: SystemConfigSelect<ExtArgs> | null
    /**
     * Filter, which SystemConfigs to fetch.
     */
    where?: SystemConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SystemConfigs to fetch.
     */
    orderBy?: SystemConfigOrderByWithRelationInput | SystemConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SystemConfigs.
     */
    cursor?: SystemConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SystemConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SystemConfigs.
     */
    skip?: number
    distinct?: SystemConfigScalarFieldEnum | SystemConfigScalarFieldEnum[]
  }

  /**
   * SystemConfig create
   */
  export type SystemConfigCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemConfig
     */
    select?: SystemConfigSelect<ExtArgs> | null
    /**
     * The data needed to create a SystemConfig.
     */
    data: XOR<SystemConfigCreateInput, SystemConfigUncheckedCreateInput>
  }

  /**
   * SystemConfig createMany
   */
  export type SystemConfigCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SystemConfigs.
     */
    data: SystemConfigCreateManyInput | SystemConfigCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SystemConfig createManyAndReturn
   */
  export type SystemConfigCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemConfig
     */
    select?: SystemConfigSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many SystemConfigs.
     */
    data: SystemConfigCreateManyInput | SystemConfigCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SystemConfig update
   */
  export type SystemConfigUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemConfig
     */
    select?: SystemConfigSelect<ExtArgs> | null
    /**
     * The data needed to update a SystemConfig.
     */
    data: XOR<SystemConfigUpdateInput, SystemConfigUncheckedUpdateInput>
    /**
     * Choose, which SystemConfig to update.
     */
    where: SystemConfigWhereUniqueInput
  }

  /**
   * SystemConfig updateMany
   */
  export type SystemConfigUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SystemConfigs.
     */
    data: XOR<SystemConfigUpdateManyMutationInput, SystemConfigUncheckedUpdateManyInput>
    /**
     * Filter which SystemConfigs to update
     */
    where?: SystemConfigWhereInput
  }

  /**
   * SystemConfig upsert
   */
  export type SystemConfigUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemConfig
     */
    select?: SystemConfigSelect<ExtArgs> | null
    /**
     * The filter to search for the SystemConfig to update in case it exists.
     */
    where: SystemConfigWhereUniqueInput
    /**
     * In case the SystemConfig found by the `where` argument doesn't exist, create a new SystemConfig with this data.
     */
    create: XOR<SystemConfigCreateInput, SystemConfigUncheckedCreateInput>
    /**
     * In case the SystemConfig was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SystemConfigUpdateInput, SystemConfigUncheckedUpdateInput>
  }

  /**
   * SystemConfig delete
   */
  export type SystemConfigDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemConfig
     */
    select?: SystemConfigSelect<ExtArgs> | null
    /**
     * Filter which SystemConfig to delete.
     */
    where: SystemConfigWhereUniqueInput
  }

  /**
   * SystemConfig deleteMany
   */
  export type SystemConfigDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SystemConfigs to delete
     */
    where?: SystemConfigWhereInput
  }

  /**
   * SystemConfig without action
   */
  export type SystemConfigDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemConfig
     */
    select?: SystemConfigSelect<ExtArgs> | null
  }


  /**
   * Model WeeklyCycle
   */

  export type AggregateWeeklyCycle = {
    _count: WeeklyCycleCountAggregateOutputType | null
    _avg: WeeklyCycleAvgAggregateOutputType | null
    _sum: WeeklyCycleSumAggregateOutputType | null
    _min: WeeklyCycleMinAggregateOutputType | null
    _max: WeeklyCycleMaxAggregateOutputType | null
  }

  export type WeeklyCycleAvgAggregateOutputType = {
    weekNumber: number | null
    year: number | null
  }

  export type WeeklyCycleSumAggregateOutputType = {
    weekNumber: number | null
    year: number | null
  }

  export type WeeklyCycleMinAggregateOutputType = {
    id: string | null
    weekNumber: number | null
    year: number | null
    startDate: Date | null
    endDate: Date | null
    isClosed: boolean | null
  }

  export type WeeklyCycleMaxAggregateOutputType = {
    id: string | null
    weekNumber: number | null
    year: number | null
    startDate: Date | null
    endDate: Date | null
    isClosed: boolean | null
  }

  export type WeeklyCycleCountAggregateOutputType = {
    id: number
    weekNumber: number
    year: number
    startDate: number
    endDate: number
    isClosed: number
    _all: number
  }


  export type WeeklyCycleAvgAggregateInputType = {
    weekNumber?: true
    year?: true
  }

  export type WeeklyCycleSumAggregateInputType = {
    weekNumber?: true
    year?: true
  }

  export type WeeklyCycleMinAggregateInputType = {
    id?: true
    weekNumber?: true
    year?: true
    startDate?: true
    endDate?: true
    isClosed?: true
  }

  export type WeeklyCycleMaxAggregateInputType = {
    id?: true
    weekNumber?: true
    year?: true
    startDate?: true
    endDate?: true
    isClosed?: true
  }

  export type WeeklyCycleCountAggregateInputType = {
    id?: true
    weekNumber?: true
    year?: true
    startDate?: true
    endDate?: true
    isClosed?: true
    _all?: true
  }

  export type WeeklyCycleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WeeklyCycle to aggregate.
     */
    where?: WeeklyCycleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WeeklyCycles to fetch.
     */
    orderBy?: WeeklyCycleOrderByWithRelationInput | WeeklyCycleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WeeklyCycleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WeeklyCycles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WeeklyCycles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WeeklyCycles
    **/
    _count?: true | WeeklyCycleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WeeklyCycleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WeeklyCycleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WeeklyCycleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WeeklyCycleMaxAggregateInputType
  }

  export type GetWeeklyCycleAggregateType<T extends WeeklyCycleAggregateArgs> = {
        [P in keyof T & keyof AggregateWeeklyCycle]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWeeklyCycle[P]>
      : GetScalarType<T[P], AggregateWeeklyCycle[P]>
  }




  export type WeeklyCycleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WeeklyCycleWhereInput
    orderBy?: WeeklyCycleOrderByWithAggregationInput | WeeklyCycleOrderByWithAggregationInput[]
    by: WeeklyCycleScalarFieldEnum[] | WeeklyCycleScalarFieldEnum
    having?: WeeklyCycleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WeeklyCycleCountAggregateInputType | true
    _avg?: WeeklyCycleAvgAggregateInputType
    _sum?: WeeklyCycleSumAggregateInputType
    _min?: WeeklyCycleMinAggregateInputType
    _max?: WeeklyCycleMaxAggregateInputType
  }

  export type WeeklyCycleGroupByOutputType = {
    id: string
    weekNumber: number
    year: number
    startDate: Date
    endDate: Date | null
    isClosed: boolean
    _count: WeeklyCycleCountAggregateOutputType | null
    _avg: WeeklyCycleAvgAggregateOutputType | null
    _sum: WeeklyCycleSumAggregateOutputType | null
    _min: WeeklyCycleMinAggregateOutputType | null
    _max: WeeklyCycleMaxAggregateOutputType | null
  }

  type GetWeeklyCycleGroupByPayload<T extends WeeklyCycleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WeeklyCycleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WeeklyCycleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WeeklyCycleGroupByOutputType[P]>
            : GetScalarType<T[P], WeeklyCycleGroupByOutputType[P]>
        }
      >
    >


  export type WeeklyCycleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    weekNumber?: boolean
    year?: boolean
    startDate?: boolean
    endDate?: boolean
    isClosed?: boolean
    userStats?: boolean | WeeklyCycle$userStatsArgs<ExtArgs>
    _count?: boolean | WeeklyCycleCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["weeklyCycle"]>

  export type WeeklyCycleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    weekNumber?: boolean
    year?: boolean
    startDate?: boolean
    endDate?: boolean
    isClosed?: boolean
  }, ExtArgs["result"]["weeklyCycle"]>

  export type WeeklyCycleSelectScalar = {
    id?: boolean
    weekNumber?: boolean
    year?: boolean
    startDate?: boolean
    endDate?: boolean
    isClosed?: boolean
  }

  export type WeeklyCycleInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    userStats?: boolean | WeeklyCycle$userStatsArgs<ExtArgs>
    _count?: boolean | WeeklyCycleCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type WeeklyCycleIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $WeeklyCyclePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WeeklyCycle"
    objects: {
      userStats: Prisma.$UserWeeklyStatsPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      weekNumber: number
      year: number
      startDate: Date
      endDate: Date | null
      isClosed: boolean
    }, ExtArgs["result"]["weeklyCycle"]>
    composites: {}
  }

  type WeeklyCycleGetPayload<S extends boolean | null | undefined | WeeklyCycleDefaultArgs> = $Result.GetResult<Prisma.$WeeklyCyclePayload, S>

  type WeeklyCycleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<WeeklyCycleFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: WeeklyCycleCountAggregateInputType | true
    }

  export interface WeeklyCycleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WeeklyCycle'], meta: { name: 'WeeklyCycle' } }
    /**
     * Find zero or one WeeklyCycle that matches the filter.
     * @param {WeeklyCycleFindUniqueArgs} args - Arguments to find a WeeklyCycle
     * @example
     * // Get one WeeklyCycle
     * const weeklyCycle = await prisma.weeklyCycle.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WeeklyCycleFindUniqueArgs>(args: SelectSubset<T, WeeklyCycleFindUniqueArgs<ExtArgs>>): Prisma__WeeklyCycleClient<$Result.GetResult<Prisma.$WeeklyCyclePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one WeeklyCycle that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {WeeklyCycleFindUniqueOrThrowArgs} args - Arguments to find a WeeklyCycle
     * @example
     * // Get one WeeklyCycle
     * const weeklyCycle = await prisma.weeklyCycle.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WeeklyCycleFindUniqueOrThrowArgs>(args: SelectSubset<T, WeeklyCycleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WeeklyCycleClient<$Result.GetResult<Prisma.$WeeklyCyclePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first WeeklyCycle that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WeeklyCycleFindFirstArgs} args - Arguments to find a WeeklyCycle
     * @example
     * // Get one WeeklyCycle
     * const weeklyCycle = await prisma.weeklyCycle.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WeeklyCycleFindFirstArgs>(args?: SelectSubset<T, WeeklyCycleFindFirstArgs<ExtArgs>>): Prisma__WeeklyCycleClient<$Result.GetResult<Prisma.$WeeklyCyclePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first WeeklyCycle that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WeeklyCycleFindFirstOrThrowArgs} args - Arguments to find a WeeklyCycle
     * @example
     * // Get one WeeklyCycle
     * const weeklyCycle = await prisma.weeklyCycle.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WeeklyCycleFindFirstOrThrowArgs>(args?: SelectSubset<T, WeeklyCycleFindFirstOrThrowArgs<ExtArgs>>): Prisma__WeeklyCycleClient<$Result.GetResult<Prisma.$WeeklyCyclePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more WeeklyCycles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WeeklyCycleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WeeklyCycles
     * const weeklyCycles = await prisma.weeklyCycle.findMany()
     * 
     * // Get first 10 WeeklyCycles
     * const weeklyCycles = await prisma.weeklyCycle.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const weeklyCycleWithIdOnly = await prisma.weeklyCycle.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WeeklyCycleFindManyArgs>(args?: SelectSubset<T, WeeklyCycleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WeeklyCyclePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a WeeklyCycle.
     * @param {WeeklyCycleCreateArgs} args - Arguments to create a WeeklyCycle.
     * @example
     * // Create one WeeklyCycle
     * const WeeklyCycle = await prisma.weeklyCycle.create({
     *   data: {
     *     // ... data to create a WeeklyCycle
     *   }
     * })
     * 
     */
    create<T extends WeeklyCycleCreateArgs>(args: SelectSubset<T, WeeklyCycleCreateArgs<ExtArgs>>): Prisma__WeeklyCycleClient<$Result.GetResult<Prisma.$WeeklyCyclePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many WeeklyCycles.
     * @param {WeeklyCycleCreateManyArgs} args - Arguments to create many WeeklyCycles.
     * @example
     * // Create many WeeklyCycles
     * const weeklyCycle = await prisma.weeklyCycle.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WeeklyCycleCreateManyArgs>(args?: SelectSubset<T, WeeklyCycleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WeeklyCycles and returns the data saved in the database.
     * @param {WeeklyCycleCreateManyAndReturnArgs} args - Arguments to create many WeeklyCycles.
     * @example
     * // Create many WeeklyCycles
     * const weeklyCycle = await prisma.weeklyCycle.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WeeklyCycles and only return the `id`
     * const weeklyCycleWithIdOnly = await prisma.weeklyCycle.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WeeklyCycleCreateManyAndReturnArgs>(args?: SelectSubset<T, WeeklyCycleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WeeklyCyclePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a WeeklyCycle.
     * @param {WeeklyCycleDeleteArgs} args - Arguments to delete one WeeklyCycle.
     * @example
     * // Delete one WeeklyCycle
     * const WeeklyCycle = await prisma.weeklyCycle.delete({
     *   where: {
     *     // ... filter to delete one WeeklyCycle
     *   }
     * })
     * 
     */
    delete<T extends WeeklyCycleDeleteArgs>(args: SelectSubset<T, WeeklyCycleDeleteArgs<ExtArgs>>): Prisma__WeeklyCycleClient<$Result.GetResult<Prisma.$WeeklyCyclePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one WeeklyCycle.
     * @param {WeeklyCycleUpdateArgs} args - Arguments to update one WeeklyCycle.
     * @example
     * // Update one WeeklyCycle
     * const weeklyCycle = await prisma.weeklyCycle.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WeeklyCycleUpdateArgs>(args: SelectSubset<T, WeeklyCycleUpdateArgs<ExtArgs>>): Prisma__WeeklyCycleClient<$Result.GetResult<Prisma.$WeeklyCyclePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more WeeklyCycles.
     * @param {WeeklyCycleDeleteManyArgs} args - Arguments to filter WeeklyCycles to delete.
     * @example
     * // Delete a few WeeklyCycles
     * const { count } = await prisma.weeklyCycle.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WeeklyCycleDeleteManyArgs>(args?: SelectSubset<T, WeeklyCycleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WeeklyCycles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WeeklyCycleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WeeklyCycles
     * const weeklyCycle = await prisma.weeklyCycle.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WeeklyCycleUpdateManyArgs>(args: SelectSubset<T, WeeklyCycleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one WeeklyCycle.
     * @param {WeeklyCycleUpsertArgs} args - Arguments to update or create a WeeklyCycle.
     * @example
     * // Update or create a WeeklyCycle
     * const weeklyCycle = await prisma.weeklyCycle.upsert({
     *   create: {
     *     // ... data to create a WeeklyCycle
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WeeklyCycle we want to update
     *   }
     * })
     */
    upsert<T extends WeeklyCycleUpsertArgs>(args: SelectSubset<T, WeeklyCycleUpsertArgs<ExtArgs>>): Prisma__WeeklyCycleClient<$Result.GetResult<Prisma.$WeeklyCyclePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of WeeklyCycles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WeeklyCycleCountArgs} args - Arguments to filter WeeklyCycles to count.
     * @example
     * // Count the number of WeeklyCycles
     * const count = await prisma.weeklyCycle.count({
     *   where: {
     *     // ... the filter for the WeeklyCycles we want to count
     *   }
     * })
    **/
    count<T extends WeeklyCycleCountArgs>(
      args?: Subset<T, WeeklyCycleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WeeklyCycleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WeeklyCycle.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WeeklyCycleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WeeklyCycleAggregateArgs>(args: Subset<T, WeeklyCycleAggregateArgs>): Prisma.PrismaPromise<GetWeeklyCycleAggregateType<T>>

    /**
     * Group by WeeklyCycle.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WeeklyCycleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WeeklyCycleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WeeklyCycleGroupByArgs['orderBy'] }
        : { orderBy?: WeeklyCycleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WeeklyCycleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWeeklyCycleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WeeklyCycle model
   */
  readonly fields: WeeklyCycleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WeeklyCycle.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WeeklyCycleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    userStats<T extends WeeklyCycle$userStatsArgs<ExtArgs> = {}>(args?: Subset<T, WeeklyCycle$userStatsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserWeeklyStatsPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WeeklyCycle model
   */ 
  interface WeeklyCycleFieldRefs {
    readonly id: FieldRef<"WeeklyCycle", 'String'>
    readonly weekNumber: FieldRef<"WeeklyCycle", 'Int'>
    readonly year: FieldRef<"WeeklyCycle", 'Int'>
    readonly startDate: FieldRef<"WeeklyCycle", 'DateTime'>
    readonly endDate: FieldRef<"WeeklyCycle", 'DateTime'>
    readonly isClosed: FieldRef<"WeeklyCycle", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * WeeklyCycle findUnique
   */
  export type WeeklyCycleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeeklyCycle
     */
    select?: WeeklyCycleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeeklyCycleInclude<ExtArgs> | null
    /**
     * Filter, which WeeklyCycle to fetch.
     */
    where: WeeklyCycleWhereUniqueInput
  }

  /**
   * WeeklyCycle findUniqueOrThrow
   */
  export type WeeklyCycleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeeklyCycle
     */
    select?: WeeklyCycleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeeklyCycleInclude<ExtArgs> | null
    /**
     * Filter, which WeeklyCycle to fetch.
     */
    where: WeeklyCycleWhereUniqueInput
  }

  /**
   * WeeklyCycle findFirst
   */
  export type WeeklyCycleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeeklyCycle
     */
    select?: WeeklyCycleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeeklyCycleInclude<ExtArgs> | null
    /**
     * Filter, which WeeklyCycle to fetch.
     */
    where?: WeeklyCycleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WeeklyCycles to fetch.
     */
    orderBy?: WeeklyCycleOrderByWithRelationInput | WeeklyCycleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WeeklyCycles.
     */
    cursor?: WeeklyCycleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WeeklyCycles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WeeklyCycles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WeeklyCycles.
     */
    distinct?: WeeklyCycleScalarFieldEnum | WeeklyCycleScalarFieldEnum[]
  }

  /**
   * WeeklyCycle findFirstOrThrow
   */
  export type WeeklyCycleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeeklyCycle
     */
    select?: WeeklyCycleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeeklyCycleInclude<ExtArgs> | null
    /**
     * Filter, which WeeklyCycle to fetch.
     */
    where?: WeeklyCycleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WeeklyCycles to fetch.
     */
    orderBy?: WeeklyCycleOrderByWithRelationInput | WeeklyCycleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WeeklyCycles.
     */
    cursor?: WeeklyCycleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WeeklyCycles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WeeklyCycles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WeeklyCycles.
     */
    distinct?: WeeklyCycleScalarFieldEnum | WeeklyCycleScalarFieldEnum[]
  }

  /**
   * WeeklyCycle findMany
   */
  export type WeeklyCycleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeeklyCycle
     */
    select?: WeeklyCycleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeeklyCycleInclude<ExtArgs> | null
    /**
     * Filter, which WeeklyCycles to fetch.
     */
    where?: WeeklyCycleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WeeklyCycles to fetch.
     */
    orderBy?: WeeklyCycleOrderByWithRelationInput | WeeklyCycleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WeeklyCycles.
     */
    cursor?: WeeklyCycleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WeeklyCycles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WeeklyCycles.
     */
    skip?: number
    distinct?: WeeklyCycleScalarFieldEnum | WeeklyCycleScalarFieldEnum[]
  }

  /**
   * WeeklyCycle create
   */
  export type WeeklyCycleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeeklyCycle
     */
    select?: WeeklyCycleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeeklyCycleInclude<ExtArgs> | null
    /**
     * The data needed to create a WeeklyCycle.
     */
    data: XOR<WeeklyCycleCreateInput, WeeklyCycleUncheckedCreateInput>
  }

  /**
   * WeeklyCycle createMany
   */
  export type WeeklyCycleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WeeklyCycles.
     */
    data: WeeklyCycleCreateManyInput | WeeklyCycleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WeeklyCycle createManyAndReturn
   */
  export type WeeklyCycleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeeklyCycle
     */
    select?: WeeklyCycleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many WeeklyCycles.
     */
    data: WeeklyCycleCreateManyInput | WeeklyCycleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WeeklyCycle update
   */
  export type WeeklyCycleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeeklyCycle
     */
    select?: WeeklyCycleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeeklyCycleInclude<ExtArgs> | null
    /**
     * The data needed to update a WeeklyCycle.
     */
    data: XOR<WeeklyCycleUpdateInput, WeeklyCycleUncheckedUpdateInput>
    /**
     * Choose, which WeeklyCycle to update.
     */
    where: WeeklyCycleWhereUniqueInput
  }

  /**
   * WeeklyCycle updateMany
   */
  export type WeeklyCycleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WeeklyCycles.
     */
    data: XOR<WeeklyCycleUpdateManyMutationInput, WeeklyCycleUncheckedUpdateManyInput>
    /**
     * Filter which WeeklyCycles to update
     */
    where?: WeeklyCycleWhereInput
  }

  /**
   * WeeklyCycle upsert
   */
  export type WeeklyCycleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeeklyCycle
     */
    select?: WeeklyCycleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeeklyCycleInclude<ExtArgs> | null
    /**
     * The filter to search for the WeeklyCycle to update in case it exists.
     */
    where: WeeklyCycleWhereUniqueInput
    /**
     * In case the WeeklyCycle found by the `where` argument doesn't exist, create a new WeeklyCycle with this data.
     */
    create: XOR<WeeklyCycleCreateInput, WeeklyCycleUncheckedCreateInput>
    /**
     * In case the WeeklyCycle was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WeeklyCycleUpdateInput, WeeklyCycleUncheckedUpdateInput>
  }

  /**
   * WeeklyCycle delete
   */
  export type WeeklyCycleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeeklyCycle
     */
    select?: WeeklyCycleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeeklyCycleInclude<ExtArgs> | null
    /**
     * Filter which WeeklyCycle to delete.
     */
    where: WeeklyCycleWhereUniqueInput
  }

  /**
   * WeeklyCycle deleteMany
   */
  export type WeeklyCycleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WeeklyCycles to delete
     */
    where?: WeeklyCycleWhereInput
  }

  /**
   * WeeklyCycle.userStats
   */
  export type WeeklyCycle$userStatsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeeklyStats
     */
    select?: UserWeeklyStatsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeeklyStatsInclude<ExtArgs> | null
    where?: UserWeeklyStatsWhereInput
    orderBy?: UserWeeklyStatsOrderByWithRelationInput | UserWeeklyStatsOrderByWithRelationInput[]
    cursor?: UserWeeklyStatsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserWeeklyStatsScalarFieldEnum | UserWeeklyStatsScalarFieldEnum[]
  }

  /**
   * WeeklyCycle without action
   */
  export type WeeklyCycleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeeklyCycle
     */
    select?: WeeklyCycleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeeklyCycleInclude<ExtArgs> | null
  }


  /**
   * Model UserWeeklyStats
   */

  export type AggregateUserWeeklyStats = {
    _count: UserWeeklyStatsCountAggregateOutputType | null
    _avg: UserWeeklyStatsAvgAggregateOutputType | null
    _sum: UserWeeklyStatsSumAggregateOutputType | null
    _min: UserWeeklyStatsMinAggregateOutputType | null
    _max: UserWeeklyStatsMaxAggregateOutputType | null
  }

  export type UserWeeklyStatsAvgAggregateOutputType = {
    personalVolume: Decimal | null
    teamVolume: Decimal | null
    carryOverVolume: Decimal | null
  }

  export type UserWeeklyStatsSumAggregateOutputType = {
    personalVolume: Decimal | null
    teamVolume: Decimal | null
    carryOverVolume: Decimal | null
  }

  export type UserWeeklyStatsMinAggregateOutputType = {
    id: string | null
    userId: string | null
    cycleId: string | null
    personalVolume: Decimal | null
    teamVolume: Decimal | null
    carryOverVolume: Decimal | null
  }

  export type UserWeeklyStatsMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    cycleId: string | null
    personalVolume: Decimal | null
    teamVolume: Decimal | null
    carryOverVolume: Decimal | null
  }

  export type UserWeeklyStatsCountAggregateOutputType = {
    id: number
    userId: number
    cycleId: number
    personalVolume: number
    teamVolume: number
    carryOverVolume: number
    _all: number
  }


  export type UserWeeklyStatsAvgAggregateInputType = {
    personalVolume?: true
    teamVolume?: true
    carryOverVolume?: true
  }

  export type UserWeeklyStatsSumAggregateInputType = {
    personalVolume?: true
    teamVolume?: true
    carryOverVolume?: true
  }

  export type UserWeeklyStatsMinAggregateInputType = {
    id?: true
    userId?: true
    cycleId?: true
    personalVolume?: true
    teamVolume?: true
    carryOverVolume?: true
  }

  export type UserWeeklyStatsMaxAggregateInputType = {
    id?: true
    userId?: true
    cycleId?: true
    personalVolume?: true
    teamVolume?: true
    carryOverVolume?: true
  }

  export type UserWeeklyStatsCountAggregateInputType = {
    id?: true
    userId?: true
    cycleId?: true
    personalVolume?: true
    teamVolume?: true
    carryOverVolume?: true
    _all?: true
  }

  export type UserWeeklyStatsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserWeeklyStats to aggregate.
     */
    where?: UserWeeklyStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserWeeklyStats to fetch.
     */
    orderBy?: UserWeeklyStatsOrderByWithRelationInput | UserWeeklyStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWeeklyStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserWeeklyStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserWeeklyStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned UserWeeklyStats
    **/
    _count?: true | UserWeeklyStatsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserWeeklyStatsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserWeeklyStatsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserWeeklyStatsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserWeeklyStatsMaxAggregateInputType
  }

  export type GetUserWeeklyStatsAggregateType<T extends UserWeeklyStatsAggregateArgs> = {
        [P in keyof T & keyof AggregateUserWeeklyStats]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUserWeeklyStats[P]>
      : GetScalarType<T[P], AggregateUserWeeklyStats[P]>
  }




  export type UserWeeklyStatsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWeeklyStatsWhereInput
    orderBy?: UserWeeklyStatsOrderByWithAggregationInput | UserWeeklyStatsOrderByWithAggregationInput[]
    by: UserWeeklyStatsScalarFieldEnum[] | UserWeeklyStatsScalarFieldEnum
    having?: UserWeeklyStatsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserWeeklyStatsCountAggregateInputType | true
    _avg?: UserWeeklyStatsAvgAggregateInputType
    _sum?: UserWeeklyStatsSumAggregateInputType
    _min?: UserWeeklyStatsMinAggregateInputType
    _max?: UserWeeklyStatsMaxAggregateInputType
  }

  export type UserWeeklyStatsGroupByOutputType = {
    id: string
    userId: string
    cycleId: string
    personalVolume: Decimal
    teamVolume: Decimal
    carryOverVolume: Decimal
    _count: UserWeeklyStatsCountAggregateOutputType | null
    _avg: UserWeeklyStatsAvgAggregateOutputType | null
    _sum: UserWeeklyStatsSumAggregateOutputType | null
    _min: UserWeeklyStatsMinAggregateOutputType | null
    _max: UserWeeklyStatsMaxAggregateOutputType | null
  }

  type GetUserWeeklyStatsGroupByPayload<T extends UserWeeklyStatsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserWeeklyStatsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserWeeklyStatsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserWeeklyStatsGroupByOutputType[P]>
            : GetScalarType<T[P], UserWeeklyStatsGroupByOutputType[P]>
        }
      >
    >


  export type UserWeeklyStatsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    cycleId?: boolean
    personalVolume?: boolean
    teamVolume?: boolean
    carryOverVolume?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    cycle?: boolean | WeeklyCycleDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userWeeklyStats"]>

  export type UserWeeklyStatsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    cycleId?: boolean
    personalVolume?: boolean
    teamVolume?: boolean
    carryOverVolume?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    cycle?: boolean | WeeklyCycleDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userWeeklyStats"]>

  export type UserWeeklyStatsSelectScalar = {
    id?: boolean
    userId?: boolean
    cycleId?: boolean
    personalVolume?: boolean
    teamVolume?: boolean
    carryOverVolume?: boolean
  }

  export type UserWeeklyStatsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    cycle?: boolean | WeeklyCycleDefaultArgs<ExtArgs>
  }
  export type UserWeeklyStatsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    cycle?: boolean | WeeklyCycleDefaultArgs<ExtArgs>
  }

  export type $UserWeeklyStatsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "UserWeeklyStats"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      cycle: Prisma.$WeeklyCyclePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      cycleId: string
      personalVolume: Prisma.Decimal
      teamVolume: Prisma.Decimal
      carryOverVolume: Prisma.Decimal
    }, ExtArgs["result"]["userWeeklyStats"]>
    composites: {}
  }

  type UserWeeklyStatsGetPayload<S extends boolean | null | undefined | UserWeeklyStatsDefaultArgs> = $Result.GetResult<Prisma.$UserWeeklyStatsPayload, S>

  type UserWeeklyStatsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserWeeklyStatsFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserWeeklyStatsCountAggregateInputType | true
    }

  export interface UserWeeklyStatsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['UserWeeklyStats'], meta: { name: 'UserWeeklyStats' } }
    /**
     * Find zero or one UserWeeklyStats that matches the filter.
     * @param {UserWeeklyStatsFindUniqueArgs} args - Arguments to find a UserWeeklyStats
     * @example
     * // Get one UserWeeklyStats
     * const userWeeklyStats = await prisma.userWeeklyStats.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserWeeklyStatsFindUniqueArgs>(args: SelectSubset<T, UserWeeklyStatsFindUniqueArgs<ExtArgs>>): Prisma__UserWeeklyStatsClient<$Result.GetResult<Prisma.$UserWeeklyStatsPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one UserWeeklyStats that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserWeeklyStatsFindUniqueOrThrowArgs} args - Arguments to find a UserWeeklyStats
     * @example
     * // Get one UserWeeklyStats
     * const userWeeklyStats = await prisma.userWeeklyStats.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserWeeklyStatsFindUniqueOrThrowArgs>(args: SelectSubset<T, UserWeeklyStatsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserWeeklyStatsClient<$Result.GetResult<Prisma.$UserWeeklyStatsPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first UserWeeklyStats that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserWeeklyStatsFindFirstArgs} args - Arguments to find a UserWeeklyStats
     * @example
     * // Get one UserWeeklyStats
     * const userWeeklyStats = await prisma.userWeeklyStats.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserWeeklyStatsFindFirstArgs>(args?: SelectSubset<T, UserWeeklyStatsFindFirstArgs<ExtArgs>>): Prisma__UserWeeklyStatsClient<$Result.GetResult<Prisma.$UserWeeklyStatsPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first UserWeeklyStats that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserWeeklyStatsFindFirstOrThrowArgs} args - Arguments to find a UserWeeklyStats
     * @example
     * // Get one UserWeeklyStats
     * const userWeeklyStats = await prisma.userWeeklyStats.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserWeeklyStatsFindFirstOrThrowArgs>(args?: SelectSubset<T, UserWeeklyStatsFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserWeeklyStatsClient<$Result.GetResult<Prisma.$UserWeeklyStatsPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more UserWeeklyStats that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserWeeklyStatsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UserWeeklyStats
     * const userWeeklyStats = await prisma.userWeeklyStats.findMany()
     * 
     * // Get first 10 UserWeeklyStats
     * const userWeeklyStats = await prisma.userWeeklyStats.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWeeklyStatsWithIdOnly = await prisma.userWeeklyStats.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserWeeklyStatsFindManyArgs>(args?: SelectSubset<T, UserWeeklyStatsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserWeeklyStatsPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a UserWeeklyStats.
     * @param {UserWeeklyStatsCreateArgs} args - Arguments to create a UserWeeklyStats.
     * @example
     * // Create one UserWeeklyStats
     * const UserWeeklyStats = await prisma.userWeeklyStats.create({
     *   data: {
     *     // ... data to create a UserWeeklyStats
     *   }
     * })
     * 
     */
    create<T extends UserWeeklyStatsCreateArgs>(args: SelectSubset<T, UserWeeklyStatsCreateArgs<ExtArgs>>): Prisma__UserWeeklyStatsClient<$Result.GetResult<Prisma.$UserWeeklyStatsPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many UserWeeklyStats.
     * @param {UserWeeklyStatsCreateManyArgs} args - Arguments to create many UserWeeklyStats.
     * @example
     * // Create many UserWeeklyStats
     * const userWeeklyStats = await prisma.userWeeklyStats.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserWeeklyStatsCreateManyArgs>(args?: SelectSubset<T, UserWeeklyStatsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many UserWeeklyStats and returns the data saved in the database.
     * @param {UserWeeklyStatsCreateManyAndReturnArgs} args - Arguments to create many UserWeeklyStats.
     * @example
     * // Create many UserWeeklyStats
     * const userWeeklyStats = await prisma.userWeeklyStats.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many UserWeeklyStats and only return the `id`
     * const userWeeklyStatsWithIdOnly = await prisma.userWeeklyStats.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserWeeklyStatsCreateManyAndReturnArgs>(args?: SelectSubset<T, UserWeeklyStatsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserWeeklyStatsPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a UserWeeklyStats.
     * @param {UserWeeklyStatsDeleteArgs} args - Arguments to delete one UserWeeklyStats.
     * @example
     * // Delete one UserWeeklyStats
     * const UserWeeklyStats = await prisma.userWeeklyStats.delete({
     *   where: {
     *     // ... filter to delete one UserWeeklyStats
     *   }
     * })
     * 
     */
    delete<T extends UserWeeklyStatsDeleteArgs>(args: SelectSubset<T, UserWeeklyStatsDeleteArgs<ExtArgs>>): Prisma__UserWeeklyStatsClient<$Result.GetResult<Prisma.$UserWeeklyStatsPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one UserWeeklyStats.
     * @param {UserWeeklyStatsUpdateArgs} args - Arguments to update one UserWeeklyStats.
     * @example
     * // Update one UserWeeklyStats
     * const userWeeklyStats = await prisma.userWeeklyStats.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserWeeklyStatsUpdateArgs>(args: SelectSubset<T, UserWeeklyStatsUpdateArgs<ExtArgs>>): Prisma__UserWeeklyStatsClient<$Result.GetResult<Prisma.$UserWeeklyStatsPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more UserWeeklyStats.
     * @param {UserWeeklyStatsDeleteManyArgs} args - Arguments to filter UserWeeklyStats to delete.
     * @example
     * // Delete a few UserWeeklyStats
     * const { count } = await prisma.userWeeklyStats.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserWeeklyStatsDeleteManyArgs>(args?: SelectSubset<T, UserWeeklyStatsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserWeeklyStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserWeeklyStatsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UserWeeklyStats
     * const userWeeklyStats = await prisma.userWeeklyStats.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserWeeklyStatsUpdateManyArgs>(args: SelectSubset<T, UserWeeklyStatsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one UserWeeklyStats.
     * @param {UserWeeklyStatsUpsertArgs} args - Arguments to update or create a UserWeeklyStats.
     * @example
     * // Update or create a UserWeeklyStats
     * const userWeeklyStats = await prisma.userWeeklyStats.upsert({
     *   create: {
     *     // ... data to create a UserWeeklyStats
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UserWeeklyStats we want to update
     *   }
     * })
     */
    upsert<T extends UserWeeklyStatsUpsertArgs>(args: SelectSubset<T, UserWeeklyStatsUpsertArgs<ExtArgs>>): Prisma__UserWeeklyStatsClient<$Result.GetResult<Prisma.$UserWeeklyStatsPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of UserWeeklyStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserWeeklyStatsCountArgs} args - Arguments to filter UserWeeklyStats to count.
     * @example
     * // Count the number of UserWeeklyStats
     * const count = await prisma.userWeeklyStats.count({
     *   where: {
     *     // ... the filter for the UserWeeklyStats we want to count
     *   }
     * })
    **/
    count<T extends UserWeeklyStatsCountArgs>(
      args?: Subset<T, UserWeeklyStatsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserWeeklyStatsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a UserWeeklyStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserWeeklyStatsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserWeeklyStatsAggregateArgs>(args: Subset<T, UserWeeklyStatsAggregateArgs>): Prisma.PrismaPromise<GetUserWeeklyStatsAggregateType<T>>

    /**
     * Group by UserWeeklyStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserWeeklyStatsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserWeeklyStatsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserWeeklyStatsGroupByArgs['orderBy'] }
        : { orderBy?: UserWeeklyStatsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserWeeklyStatsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserWeeklyStatsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the UserWeeklyStats model
   */
  readonly fields: UserWeeklyStatsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UserWeeklyStats.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserWeeklyStatsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    cycle<T extends WeeklyCycleDefaultArgs<ExtArgs> = {}>(args?: Subset<T, WeeklyCycleDefaultArgs<ExtArgs>>): Prisma__WeeklyCycleClient<$Result.GetResult<Prisma.$WeeklyCyclePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the UserWeeklyStats model
   */ 
  interface UserWeeklyStatsFieldRefs {
    readonly id: FieldRef<"UserWeeklyStats", 'String'>
    readonly userId: FieldRef<"UserWeeklyStats", 'String'>
    readonly cycleId: FieldRef<"UserWeeklyStats", 'String'>
    readonly personalVolume: FieldRef<"UserWeeklyStats", 'Decimal'>
    readonly teamVolume: FieldRef<"UserWeeklyStats", 'Decimal'>
    readonly carryOverVolume: FieldRef<"UserWeeklyStats", 'Decimal'>
  }
    

  // Custom InputTypes
  /**
   * UserWeeklyStats findUnique
   */
  export type UserWeeklyStatsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeeklyStats
     */
    select?: UserWeeklyStatsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeeklyStatsInclude<ExtArgs> | null
    /**
     * Filter, which UserWeeklyStats to fetch.
     */
    where: UserWeeklyStatsWhereUniqueInput
  }

  /**
   * UserWeeklyStats findUniqueOrThrow
   */
  export type UserWeeklyStatsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeeklyStats
     */
    select?: UserWeeklyStatsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeeklyStatsInclude<ExtArgs> | null
    /**
     * Filter, which UserWeeklyStats to fetch.
     */
    where: UserWeeklyStatsWhereUniqueInput
  }

  /**
   * UserWeeklyStats findFirst
   */
  export type UserWeeklyStatsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeeklyStats
     */
    select?: UserWeeklyStatsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeeklyStatsInclude<ExtArgs> | null
    /**
     * Filter, which UserWeeklyStats to fetch.
     */
    where?: UserWeeklyStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserWeeklyStats to fetch.
     */
    orderBy?: UserWeeklyStatsOrderByWithRelationInput | UserWeeklyStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserWeeklyStats.
     */
    cursor?: UserWeeklyStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserWeeklyStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserWeeklyStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserWeeklyStats.
     */
    distinct?: UserWeeklyStatsScalarFieldEnum | UserWeeklyStatsScalarFieldEnum[]
  }

  /**
   * UserWeeklyStats findFirstOrThrow
   */
  export type UserWeeklyStatsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeeklyStats
     */
    select?: UserWeeklyStatsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeeklyStatsInclude<ExtArgs> | null
    /**
     * Filter, which UserWeeklyStats to fetch.
     */
    where?: UserWeeklyStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserWeeklyStats to fetch.
     */
    orderBy?: UserWeeklyStatsOrderByWithRelationInput | UserWeeklyStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserWeeklyStats.
     */
    cursor?: UserWeeklyStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserWeeklyStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserWeeklyStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserWeeklyStats.
     */
    distinct?: UserWeeklyStatsScalarFieldEnum | UserWeeklyStatsScalarFieldEnum[]
  }

  /**
   * UserWeeklyStats findMany
   */
  export type UserWeeklyStatsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeeklyStats
     */
    select?: UserWeeklyStatsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeeklyStatsInclude<ExtArgs> | null
    /**
     * Filter, which UserWeeklyStats to fetch.
     */
    where?: UserWeeklyStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserWeeklyStats to fetch.
     */
    orderBy?: UserWeeklyStatsOrderByWithRelationInput | UserWeeklyStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing UserWeeklyStats.
     */
    cursor?: UserWeeklyStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserWeeklyStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserWeeklyStats.
     */
    skip?: number
    distinct?: UserWeeklyStatsScalarFieldEnum | UserWeeklyStatsScalarFieldEnum[]
  }

  /**
   * UserWeeklyStats create
   */
  export type UserWeeklyStatsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeeklyStats
     */
    select?: UserWeeklyStatsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeeklyStatsInclude<ExtArgs> | null
    /**
     * The data needed to create a UserWeeklyStats.
     */
    data: XOR<UserWeeklyStatsCreateInput, UserWeeklyStatsUncheckedCreateInput>
  }

  /**
   * UserWeeklyStats createMany
   */
  export type UserWeeklyStatsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many UserWeeklyStats.
     */
    data: UserWeeklyStatsCreateManyInput | UserWeeklyStatsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * UserWeeklyStats createManyAndReturn
   */
  export type UserWeeklyStatsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeeklyStats
     */
    select?: UserWeeklyStatsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many UserWeeklyStats.
     */
    data: UserWeeklyStatsCreateManyInput | UserWeeklyStatsCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeeklyStatsIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserWeeklyStats update
   */
  export type UserWeeklyStatsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeeklyStats
     */
    select?: UserWeeklyStatsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeeklyStatsInclude<ExtArgs> | null
    /**
     * The data needed to update a UserWeeklyStats.
     */
    data: XOR<UserWeeklyStatsUpdateInput, UserWeeklyStatsUncheckedUpdateInput>
    /**
     * Choose, which UserWeeklyStats to update.
     */
    where: UserWeeklyStatsWhereUniqueInput
  }

  /**
   * UserWeeklyStats updateMany
   */
  export type UserWeeklyStatsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update UserWeeklyStats.
     */
    data: XOR<UserWeeklyStatsUpdateManyMutationInput, UserWeeklyStatsUncheckedUpdateManyInput>
    /**
     * Filter which UserWeeklyStats to update
     */
    where?: UserWeeklyStatsWhereInput
  }

  /**
   * UserWeeklyStats upsert
   */
  export type UserWeeklyStatsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeeklyStats
     */
    select?: UserWeeklyStatsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeeklyStatsInclude<ExtArgs> | null
    /**
     * The filter to search for the UserWeeklyStats to update in case it exists.
     */
    where: UserWeeklyStatsWhereUniqueInput
    /**
     * In case the UserWeeklyStats found by the `where` argument doesn't exist, create a new UserWeeklyStats with this data.
     */
    create: XOR<UserWeeklyStatsCreateInput, UserWeeklyStatsUncheckedCreateInput>
    /**
     * In case the UserWeeklyStats was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserWeeklyStatsUpdateInput, UserWeeklyStatsUncheckedUpdateInput>
  }

  /**
   * UserWeeklyStats delete
   */
  export type UserWeeklyStatsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeeklyStats
     */
    select?: UserWeeklyStatsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeeklyStatsInclude<ExtArgs> | null
    /**
     * Filter which UserWeeklyStats to delete.
     */
    where: UserWeeklyStatsWhereUniqueInput
  }

  /**
   * UserWeeklyStats deleteMany
   */
  export type UserWeeklyStatsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserWeeklyStats to delete
     */
    where?: UserWeeklyStatsWhereInput
  }

  /**
   * UserWeeklyStats without action
   */
  export type UserWeeklyStatsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeeklyStats
     */
    select?: UserWeeklyStatsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeeklyStatsInclude<ExtArgs> | null
  }


  /**
   * Model HeroSlide
   */

  export type AggregateHeroSlide = {
    _count: HeroSlideCountAggregateOutputType | null
    _avg: HeroSlideAvgAggregateOutputType | null
    _sum: HeroSlideSumAggregateOutputType | null
    _min: HeroSlideMinAggregateOutputType | null
    _max: HeroSlideMaxAggregateOutputType | null
  }

  export type HeroSlideAvgAggregateOutputType = {
    sortOrder: number | null
  }

  export type HeroSlideSumAggregateOutputType = {
    sortOrder: number | null
  }

  export type HeroSlideMinAggregateOutputType = {
    id: string | null
    title: string | null
    subtitle: string | null
    buttonText: string | null
    buttonLink: string | null
    imageUrl: string | null
    sortOrder: number | null
    isActive: boolean | null
    createdAt: Date | null
  }

  export type HeroSlideMaxAggregateOutputType = {
    id: string | null
    title: string | null
    subtitle: string | null
    buttonText: string | null
    buttonLink: string | null
    imageUrl: string | null
    sortOrder: number | null
    isActive: boolean | null
    createdAt: Date | null
  }

  export type HeroSlideCountAggregateOutputType = {
    id: number
    title: number
    subtitle: number
    buttonText: number
    buttonLink: number
    imageUrl: number
    sortOrder: number
    isActive: number
    createdAt: number
    _all: number
  }


  export type HeroSlideAvgAggregateInputType = {
    sortOrder?: true
  }

  export type HeroSlideSumAggregateInputType = {
    sortOrder?: true
  }

  export type HeroSlideMinAggregateInputType = {
    id?: true
    title?: true
    subtitle?: true
    buttonText?: true
    buttonLink?: true
    imageUrl?: true
    sortOrder?: true
    isActive?: true
    createdAt?: true
  }

  export type HeroSlideMaxAggregateInputType = {
    id?: true
    title?: true
    subtitle?: true
    buttonText?: true
    buttonLink?: true
    imageUrl?: true
    sortOrder?: true
    isActive?: true
    createdAt?: true
  }

  export type HeroSlideCountAggregateInputType = {
    id?: true
    title?: true
    subtitle?: true
    buttonText?: true
    buttonLink?: true
    imageUrl?: true
    sortOrder?: true
    isActive?: true
    createdAt?: true
    _all?: true
  }

  export type HeroSlideAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which HeroSlide to aggregate.
     */
    where?: HeroSlideWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HeroSlides to fetch.
     */
    orderBy?: HeroSlideOrderByWithRelationInput | HeroSlideOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: HeroSlideWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HeroSlides from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HeroSlides.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned HeroSlides
    **/
    _count?: true | HeroSlideCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: HeroSlideAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: HeroSlideSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: HeroSlideMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: HeroSlideMaxAggregateInputType
  }

  export type GetHeroSlideAggregateType<T extends HeroSlideAggregateArgs> = {
        [P in keyof T & keyof AggregateHeroSlide]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateHeroSlide[P]>
      : GetScalarType<T[P], AggregateHeroSlide[P]>
  }




  export type HeroSlideGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HeroSlideWhereInput
    orderBy?: HeroSlideOrderByWithAggregationInput | HeroSlideOrderByWithAggregationInput[]
    by: HeroSlideScalarFieldEnum[] | HeroSlideScalarFieldEnum
    having?: HeroSlideScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: HeroSlideCountAggregateInputType | true
    _avg?: HeroSlideAvgAggregateInputType
    _sum?: HeroSlideSumAggregateInputType
    _min?: HeroSlideMinAggregateInputType
    _max?: HeroSlideMaxAggregateInputType
  }

  export type HeroSlideGroupByOutputType = {
    id: string
    title: string
    subtitle: string | null
    buttonText: string | null
    buttonLink: string | null
    imageUrl: string
    sortOrder: number
    isActive: boolean
    createdAt: Date
    _count: HeroSlideCountAggregateOutputType | null
    _avg: HeroSlideAvgAggregateOutputType | null
    _sum: HeroSlideSumAggregateOutputType | null
    _min: HeroSlideMinAggregateOutputType | null
    _max: HeroSlideMaxAggregateOutputType | null
  }

  type GetHeroSlideGroupByPayload<T extends HeroSlideGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<HeroSlideGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof HeroSlideGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], HeroSlideGroupByOutputType[P]>
            : GetScalarType<T[P], HeroSlideGroupByOutputType[P]>
        }
      >
    >


  export type HeroSlideSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    subtitle?: boolean
    buttonText?: boolean
    buttonLink?: boolean
    imageUrl?: boolean
    sortOrder?: boolean
    isActive?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["heroSlide"]>

  export type HeroSlideSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    subtitle?: boolean
    buttonText?: boolean
    buttonLink?: boolean
    imageUrl?: boolean
    sortOrder?: boolean
    isActive?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["heroSlide"]>

  export type HeroSlideSelectScalar = {
    id?: boolean
    title?: boolean
    subtitle?: boolean
    buttonText?: boolean
    buttonLink?: boolean
    imageUrl?: boolean
    sortOrder?: boolean
    isActive?: boolean
    createdAt?: boolean
  }


  export type $HeroSlidePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "HeroSlide"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      subtitle: string | null
      buttonText: string | null
      buttonLink: string | null
      imageUrl: string
      sortOrder: number
      isActive: boolean
      createdAt: Date
    }, ExtArgs["result"]["heroSlide"]>
    composites: {}
  }

  type HeroSlideGetPayload<S extends boolean | null | undefined | HeroSlideDefaultArgs> = $Result.GetResult<Prisma.$HeroSlidePayload, S>

  type HeroSlideCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<HeroSlideFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: HeroSlideCountAggregateInputType | true
    }

  export interface HeroSlideDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['HeroSlide'], meta: { name: 'HeroSlide' } }
    /**
     * Find zero or one HeroSlide that matches the filter.
     * @param {HeroSlideFindUniqueArgs} args - Arguments to find a HeroSlide
     * @example
     * // Get one HeroSlide
     * const heroSlide = await prisma.heroSlide.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends HeroSlideFindUniqueArgs>(args: SelectSubset<T, HeroSlideFindUniqueArgs<ExtArgs>>): Prisma__HeroSlideClient<$Result.GetResult<Prisma.$HeroSlidePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one HeroSlide that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {HeroSlideFindUniqueOrThrowArgs} args - Arguments to find a HeroSlide
     * @example
     * // Get one HeroSlide
     * const heroSlide = await prisma.heroSlide.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends HeroSlideFindUniqueOrThrowArgs>(args: SelectSubset<T, HeroSlideFindUniqueOrThrowArgs<ExtArgs>>): Prisma__HeroSlideClient<$Result.GetResult<Prisma.$HeroSlidePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first HeroSlide that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HeroSlideFindFirstArgs} args - Arguments to find a HeroSlide
     * @example
     * // Get one HeroSlide
     * const heroSlide = await prisma.heroSlide.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends HeroSlideFindFirstArgs>(args?: SelectSubset<T, HeroSlideFindFirstArgs<ExtArgs>>): Prisma__HeroSlideClient<$Result.GetResult<Prisma.$HeroSlidePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first HeroSlide that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HeroSlideFindFirstOrThrowArgs} args - Arguments to find a HeroSlide
     * @example
     * // Get one HeroSlide
     * const heroSlide = await prisma.heroSlide.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends HeroSlideFindFirstOrThrowArgs>(args?: SelectSubset<T, HeroSlideFindFirstOrThrowArgs<ExtArgs>>): Prisma__HeroSlideClient<$Result.GetResult<Prisma.$HeroSlidePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more HeroSlides that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HeroSlideFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all HeroSlides
     * const heroSlides = await prisma.heroSlide.findMany()
     * 
     * // Get first 10 HeroSlides
     * const heroSlides = await prisma.heroSlide.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const heroSlideWithIdOnly = await prisma.heroSlide.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends HeroSlideFindManyArgs>(args?: SelectSubset<T, HeroSlideFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HeroSlidePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a HeroSlide.
     * @param {HeroSlideCreateArgs} args - Arguments to create a HeroSlide.
     * @example
     * // Create one HeroSlide
     * const HeroSlide = await prisma.heroSlide.create({
     *   data: {
     *     // ... data to create a HeroSlide
     *   }
     * })
     * 
     */
    create<T extends HeroSlideCreateArgs>(args: SelectSubset<T, HeroSlideCreateArgs<ExtArgs>>): Prisma__HeroSlideClient<$Result.GetResult<Prisma.$HeroSlidePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many HeroSlides.
     * @param {HeroSlideCreateManyArgs} args - Arguments to create many HeroSlides.
     * @example
     * // Create many HeroSlides
     * const heroSlide = await prisma.heroSlide.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends HeroSlideCreateManyArgs>(args?: SelectSubset<T, HeroSlideCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many HeroSlides and returns the data saved in the database.
     * @param {HeroSlideCreateManyAndReturnArgs} args - Arguments to create many HeroSlides.
     * @example
     * // Create many HeroSlides
     * const heroSlide = await prisma.heroSlide.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many HeroSlides and only return the `id`
     * const heroSlideWithIdOnly = await prisma.heroSlide.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends HeroSlideCreateManyAndReturnArgs>(args?: SelectSubset<T, HeroSlideCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HeroSlidePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a HeroSlide.
     * @param {HeroSlideDeleteArgs} args - Arguments to delete one HeroSlide.
     * @example
     * // Delete one HeroSlide
     * const HeroSlide = await prisma.heroSlide.delete({
     *   where: {
     *     // ... filter to delete one HeroSlide
     *   }
     * })
     * 
     */
    delete<T extends HeroSlideDeleteArgs>(args: SelectSubset<T, HeroSlideDeleteArgs<ExtArgs>>): Prisma__HeroSlideClient<$Result.GetResult<Prisma.$HeroSlidePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one HeroSlide.
     * @param {HeroSlideUpdateArgs} args - Arguments to update one HeroSlide.
     * @example
     * // Update one HeroSlide
     * const heroSlide = await prisma.heroSlide.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends HeroSlideUpdateArgs>(args: SelectSubset<T, HeroSlideUpdateArgs<ExtArgs>>): Prisma__HeroSlideClient<$Result.GetResult<Prisma.$HeroSlidePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more HeroSlides.
     * @param {HeroSlideDeleteManyArgs} args - Arguments to filter HeroSlides to delete.
     * @example
     * // Delete a few HeroSlides
     * const { count } = await prisma.heroSlide.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends HeroSlideDeleteManyArgs>(args?: SelectSubset<T, HeroSlideDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more HeroSlides.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HeroSlideUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many HeroSlides
     * const heroSlide = await prisma.heroSlide.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends HeroSlideUpdateManyArgs>(args: SelectSubset<T, HeroSlideUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one HeroSlide.
     * @param {HeroSlideUpsertArgs} args - Arguments to update or create a HeroSlide.
     * @example
     * // Update or create a HeroSlide
     * const heroSlide = await prisma.heroSlide.upsert({
     *   create: {
     *     // ... data to create a HeroSlide
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the HeroSlide we want to update
     *   }
     * })
     */
    upsert<T extends HeroSlideUpsertArgs>(args: SelectSubset<T, HeroSlideUpsertArgs<ExtArgs>>): Prisma__HeroSlideClient<$Result.GetResult<Prisma.$HeroSlidePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of HeroSlides.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HeroSlideCountArgs} args - Arguments to filter HeroSlides to count.
     * @example
     * // Count the number of HeroSlides
     * const count = await prisma.heroSlide.count({
     *   where: {
     *     // ... the filter for the HeroSlides we want to count
     *   }
     * })
    **/
    count<T extends HeroSlideCountArgs>(
      args?: Subset<T, HeroSlideCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], HeroSlideCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a HeroSlide.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HeroSlideAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends HeroSlideAggregateArgs>(args: Subset<T, HeroSlideAggregateArgs>): Prisma.PrismaPromise<GetHeroSlideAggregateType<T>>

    /**
     * Group by HeroSlide.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HeroSlideGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends HeroSlideGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: HeroSlideGroupByArgs['orderBy'] }
        : { orderBy?: HeroSlideGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, HeroSlideGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetHeroSlideGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the HeroSlide model
   */
  readonly fields: HeroSlideFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for HeroSlide.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__HeroSlideClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the HeroSlide model
   */ 
  interface HeroSlideFieldRefs {
    readonly id: FieldRef<"HeroSlide", 'String'>
    readonly title: FieldRef<"HeroSlide", 'String'>
    readonly subtitle: FieldRef<"HeroSlide", 'String'>
    readonly buttonText: FieldRef<"HeroSlide", 'String'>
    readonly buttonLink: FieldRef<"HeroSlide", 'String'>
    readonly imageUrl: FieldRef<"HeroSlide", 'String'>
    readonly sortOrder: FieldRef<"HeroSlide", 'Int'>
    readonly isActive: FieldRef<"HeroSlide", 'Boolean'>
    readonly createdAt: FieldRef<"HeroSlide", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * HeroSlide findUnique
   */
  export type HeroSlideFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HeroSlide
     */
    select?: HeroSlideSelect<ExtArgs> | null
    /**
     * Filter, which HeroSlide to fetch.
     */
    where: HeroSlideWhereUniqueInput
  }

  /**
   * HeroSlide findUniqueOrThrow
   */
  export type HeroSlideFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HeroSlide
     */
    select?: HeroSlideSelect<ExtArgs> | null
    /**
     * Filter, which HeroSlide to fetch.
     */
    where: HeroSlideWhereUniqueInput
  }

  /**
   * HeroSlide findFirst
   */
  export type HeroSlideFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HeroSlide
     */
    select?: HeroSlideSelect<ExtArgs> | null
    /**
     * Filter, which HeroSlide to fetch.
     */
    where?: HeroSlideWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HeroSlides to fetch.
     */
    orderBy?: HeroSlideOrderByWithRelationInput | HeroSlideOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for HeroSlides.
     */
    cursor?: HeroSlideWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HeroSlides from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HeroSlides.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of HeroSlides.
     */
    distinct?: HeroSlideScalarFieldEnum | HeroSlideScalarFieldEnum[]
  }

  /**
   * HeroSlide findFirstOrThrow
   */
  export type HeroSlideFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HeroSlide
     */
    select?: HeroSlideSelect<ExtArgs> | null
    /**
     * Filter, which HeroSlide to fetch.
     */
    where?: HeroSlideWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HeroSlides to fetch.
     */
    orderBy?: HeroSlideOrderByWithRelationInput | HeroSlideOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for HeroSlides.
     */
    cursor?: HeroSlideWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HeroSlides from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HeroSlides.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of HeroSlides.
     */
    distinct?: HeroSlideScalarFieldEnum | HeroSlideScalarFieldEnum[]
  }

  /**
   * HeroSlide findMany
   */
  export type HeroSlideFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HeroSlide
     */
    select?: HeroSlideSelect<ExtArgs> | null
    /**
     * Filter, which HeroSlides to fetch.
     */
    where?: HeroSlideWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HeroSlides to fetch.
     */
    orderBy?: HeroSlideOrderByWithRelationInput | HeroSlideOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing HeroSlides.
     */
    cursor?: HeroSlideWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HeroSlides from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HeroSlides.
     */
    skip?: number
    distinct?: HeroSlideScalarFieldEnum | HeroSlideScalarFieldEnum[]
  }

  /**
   * HeroSlide create
   */
  export type HeroSlideCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HeroSlide
     */
    select?: HeroSlideSelect<ExtArgs> | null
    /**
     * The data needed to create a HeroSlide.
     */
    data: XOR<HeroSlideCreateInput, HeroSlideUncheckedCreateInput>
  }

  /**
   * HeroSlide createMany
   */
  export type HeroSlideCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many HeroSlides.
     */
    data: HeroSlideCreateManyInput | HeroSlideCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * HeroSlide createManyAndReturn
   */
  export type HeroSlideCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HeroSlide
     */
    select?: HeroSlideSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many HeroSlides.
     */
    data: HeroSlideCreateManyInput | HeroSlideCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * HeroSlide update
   */
  export type HeroSlideUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HeroSlide
     */
    select?: HeroSlideSelect<ExtArgs> | null
    /**
     * The data needed to update a HeroSlide.
     */
    data: XOR<HeroSlideUpdateInput, HeroSlideUncheckedUpdateInput>
    /**
     * Choose, which HeroSlide to update.
     */
    where: HeroSlideWhereUniqueInput
  }

  /**
   * HeroSlide updateMany
   */
  export type HeroSlideUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update HeroSlides.
     */
    data: XOR<HeroSlideUpdateManyMutationInput, HeroSlideUncheckedUpdateManyInput>
    /**
     * Filter which HeroSlides to update
     */
    where?: HeroSlideWhereInput
  }

  /**
   * HeroSlide upsert
   */
  export type HeroSlideUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HeroSlide
     */
    select?: HeroSlideSelect<ExtArgs> | null
    /**
     * The filter to search for the HeroSlide to update in case it exists.
     */
    where: HeroSlideWhereUniqueInput
    /**
     * In case the HeroSlide found by the `where` argument doesn't exist, create a new HeroSlide with this data.
     */
    create: XOR<HeroSlideCreateInput, HeroSlideUncheckedCreateInput>
    /**
     * In case the HeroSlide was found with the provided `where` argument, update it with this data.
     */
    update: XOR<HeroSlideUpdateInput, HeroSlideUncheckedUpdateInput>
  }

  /**
   * HeroSlide delete
   */
  export type HeroSlideDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HeroSlide
     */
    select?: HeroSlideSelect<ExtArgs> | null
    /**
     * Filter which HeroSlide to delete.
     */
    where: HeroSlideWhereUniqueInput
  }

  /**
   * HeroSlide deleteMany
   */
  export type HeroSlideDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which HeroSlides to delete
     */
    where?: HeroSlideWhereInput
  }

  /**
   * HeroSlide without action
   */
  export type HeroSlideDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HeroSlide
     */
    select?: HeroSlideSelect<ExtArgs> | null
  }


  /**
   * Model Category
   */

  export type AggregateCategory = {
    _count: CategoryCountAggregateOutputType | null
    _avg: CategoryAvgAggregateOutputType | null
    _sum: CategorySumAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  export type CategoryAvgAggregateOutputType = {
    sortOrder: number | null
  }

  export type CategorySumAggregateOutputType = {
    sortOrder: number | null
  }

  export type CategoryMinAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    iconEmoji: string | null
    imageUrl: string | null
    sortOrder: number | null
    isActive: boolean | null
  }

  export type CategoryMaxAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    iconEmoji: string | null
    imageUrl: string | null
    sortOrder: number | null
    isActive: boolean | null
  }

  export type CategoryCountAggregateOutputType = {
    id: number
    name: number
    slug: number
    iconEmoji: number
    imageUrl: number
    sortOrder: number
    isActive: number
    _all: number
  }


  export type CategoryAvgAggregateInputType = {
    sortOrder?: true
  }

  export type CategorySumAggregateInputType = {
    sortOrder?: true
  }

  export type CategoryMinAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    iconEmoji?: true
    imageUrl?: true
    sortOrder?: true
    isActive?: true
  }

  export type CategoryMaxAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    iconEmoji?: true
    imageUrl?: true
    sortOrder?: true
    isActive?: true
  }

  export type CategoryCountAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    iconEmoji?: true
    imageUrl?: true
    sortOrder?: true
    isActive?: true
    _all?: true
  }

  export type CategoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Category to aggregate.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Categories
    **/
    _count?: true | CategoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CategoryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CategorySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CategoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CategoryMaxAggregateInputType
  }

  export type GetCategoryAggregateType<T extends CategoryAggregateArgs> = {
        [P in keyof T & keyof AggregateCategory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCategory[P]>
      : GetScalarType<T[P], AggregateCategory[P]>
  }




  export type CategoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategoryWhereInput
    orderBy?: CategoryOrderByWithAggregationInput | CategoryOrderByWithAggregationInput[]
    by: CategoryScalarFieldEnum[] | CategoryScalarFieldEnum
    having?: CategoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CategoryCountAggregateInputType | true
    _avg?: CategoryAvgAggregateInputType
    _sum?: CategorySumAggregateInputType
    _min?: CategoryMinAggregateInputType
    _max?: CategoryMaxAggregateInputType
  }

  export type CategoryGroupByOutputType = {
    id: string
    name: string
    slug: string
    iconEmoji: string | null
    imageUrl: string | null
    sortOrder: number
    isActive: boolean
    _count: CategoryCountAggregateOutputType | null
    _avg: CategoryAvgAggregateOutputType | null
    _sum: CategorySumAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  type GetCategoryGroupByPayload<T extends CategoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CategoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CategoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CategoryGroupByOutputType[P]>
            : GetScalarType<T[P], CategoryGroupByOutputType[P]>
        }
      >
    >


  export type CategorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    iconEmoji?: boolean
    imageUrl?: boolean
    sortOrder?: boolean
    isActive?: boolean
    products?: boolean | Category$productsArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["category"]>

  export type CategorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    iconEmoji?: boolean
    imageUrl?: boolean
    sortOrder?: boolean
    isActive?: boolean
  }, ExtArgs["result"]["category"]>

  export type CategorySelectScalar = {
    id?: boolean
    name?: boolean
    slug?: boolean
    iconEmoji?: boolean
    imageUrl?: boolean
    sortOrder?: boolean
    isActive?: boolean
  }

  export type CategoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    products?: boolean | Category$productsArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CategoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CategoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Category"
    objects: {
      products: Prisma.$ProductPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      slug: string
      iconEmoji: string | null
      imageUrl: string | null
      sortOrder: number
      isActive: boolean
    }, ExtArgs["result"]["category"]>
    composites: {}
  }

  type CategoryGetPayload<S extends boolean | null | undefined | CategoryDefaultArgs> = $Result.GetResult<Prisma.$CategoryPayload, S>

  type CategoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CategoryFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CategoryCountAggregateInputType | true
    }

  export interface CategoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Category'], meta: { name: 'Category' } }
    /**
     * Find zero or one Category that matches the filter.
     * @param {CategoryFindUniqueArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CategoryFindUniqueArgs>(args: SelectSubset<T, CategoryFindUniqueArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Category that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CategoryFindUniqueOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CategoryFindUniqueOrThrowArgs>(args: SelectSubset<T, CategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Category that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CategoryFindFirstArgs>(args?: SelectSubset<T, CategoryFindFirstArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Category that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CategoryFindFirstOrThrowArgs>(args?: SelectSubset<T, CategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Categories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Categories
     * const categories = await prisma.category.findMany()
     * 
     * // Get first 10 Categories
     * const categories = await prisma.category.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const categoryWithIdOnly = await prisma.category.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CategoryFindManyArgs>(args?: SelectSubset<T, CategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Category.
     * @param {CategoryCreateArgs} args - Arguments to create a Category.
     * @example
     * // Create one Category
     * const Category = await prisma.category.create({
     *   data: {
     *     // ... data to create a Category
     *   }
     * })
     * 
     */
    create<T extends CategoryCreateArgs>(args: SelectSubset<T, CategoryCreateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Categories.
     * @param {CategoryCreateManyArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CategoryCreateManyArgs>(args?: SelectSubset<T, CategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Categories and returns the data saved in the database.
     * @param {CategoryCreateManyAndReturnArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Categories and only return the `id`
     * const categoryWithIdOnly = await prisma.category.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CategoryCreateManyAndReturnArgs>(args?: SelectSubset<T, CategoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Category.
     * @param {CategoryDeleteArgs} args - Arguments to delete one Category.
     * @example
     * // Delete one Category
     * const Category = await prisma.category.delete({
     *   where: {
     *     // ... filter to delete one Category
     *   }
     * })
     * 
     */
    delete<T extends CategoryDeleteArgs>(args: SelectSubset<T, CategoryDeleteArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Category.
     * @param {CategoryUpdateArgs} args - Arguments to update one Category.
     * @example
     * // Update one Category
     * const category = await prisma.category.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CategoryUpdateArgs>(args: SelectSubset<T, CategoryUpdateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Categories.
     * @param {CategoryDeleteManyArgs} args - Arguments to filter Categories to delete.
     * @example
     * // Delete a few Categories
     * const { count } = await prisma.category.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CategoryDeleteManyArgs>(args?: SelectSubset<T, CategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Categories
     * const category = await prisma.category.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CategoryUpdateManyArgs>(args: SelectSubset<T, CategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Category.
     * @param {CategoryUpsertArgs} args - Arguments to update or create a Category.
     * @example
     * // Update or create a Category
     * const category = await prisma.category.upsert({
     *   create: {
     *     // ... data to create a Category
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Category we want to update
     *   }
     * })
     */
    upsert<T extends CategoryUpsertArgs>(args: SelectSubset<T, CategoryUpsertArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryCountArgs} args - Arguments to filter Categories to count.
     * @example
     * // Count the number of Categories
     * const count = await prisma.category.count({
     *   where: {
     *     // ... the filter for the Categories we want to count
     *   }
     * })
    **/
    count<T extends CategoryCountArgs>(
      args?: Subset<T, CategoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CategoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CategoryAggregateArgs>(args: Subset<T, CategoryAggregateArgs>): Prisma.PrismaPromise<GetCategoryAggregateType<T>>

    /**
     * Group by Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CategoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CategoryGroupByArgs['orderBy'] }
        : { orderBy?: CategoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Category model
   */
  readonly fields: CategoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Category.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CategoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    products<T extends Category$productsArgs<ExtArgs> = {}>(args?: Subset<T, Category$productsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Category model
   */ 
  interface CategoryFieldRefs {
    readonly id: FieldRef<"Category", 'String'>
    readonly name: FieldRef<"Category", 'String'>
    readonly slug: FieldRef<"Category", 'String'>
    readonly iconEmoji: FieldRef<"Category", 'String'>
    readonly imageUrl: FieldRef<"Category", 'String'>
    readonly sortOrder: FieldRef<"Category", 'Int'>
    readonly isActive: FieldRef<"Category", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * Category findUnique
   */
  export type CategoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findUniqueOrThrow
   */
  export type CategoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findFirst
   */
  export type CategoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findFirstOrThrow
   */
  export type CategoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findMany
   */
  export type CategoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Categories to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category create
   */
  export type CategoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to create a Category.
     */
    data: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
  }

  /**
   * Category createMany
   */
  export type CategoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Category createManyAndReturn
   */
  export type CategoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Category update
   */
  export type CategoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to update a Category.
     */
    data: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
    /**
     * Choose, which Category to update.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category updateMany
   */
  export type CategoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Categories.
     */
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyInput>
    /**
     * Filter which Categories to update
     */
    where?: CategoryWhereInput
  }

  /**
   * Category upsert
   */
  export type CategoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The filter to search for the Category to update in case it exists.
     */
    where: CategoryWhereUniqueInput
    /**
     * In case the Category found by the `where` argument doesn't exist, create a new Category with this data.
     */
    create: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
    /**
     * In case the Category was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
  }

  /**
   * Category delete
   */
  export type CategoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter which Category to delete.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category deleteMany
   */
  export type CategoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Categories to delete
     */
    where?: CategoryWhereInput
  }

  /**
   * Category.products
   */
  export type Category$productsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    where?: ProductWhereInput
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    cursor?: ProductWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Category without action
   */
  export type CategoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
  }


  /**
   * Model ProductImage
   */

  export type AggregateProductImage = {
    _count: ProductImageCountAggregateOutputType | null
    _avg: ProductImageAvgAggregateOutputType | null
    _sum: ProductImageSumAggregateOutputType | null
    _min: ProductImageMinAggregateOutputType | null
    _max: ProductImageMaxAggregateOutputType | null
  }

  export type ProductImageAvgAggregateOutputType = {
    sortOrder: number | null
  }

  export type ProductImageSumAggregateOutputType = {
    sortOrder: number | null
  }

  export type ProductImageMinAggregateOutputType = {
    id: string | null
    productId: string | null
    imageUrl: string | null
    sortOrder: number | null
  }

  export type ProductImageMaxAggregateOutputType = {
    id: string | null
    productId: string | null
    imageUrl: string | null
    sortOrder: number | null
  }

  export type ProductImageCountAggregateOutputType = {
    id: number
    productId: number
    imageUrl: number
    sortOrder: number
    _all: number
  }


  export type ProductImageAvgAggregateInputType = {
    sortOrder?: true
  }

  export type ProductImageSumAggregateInputType = {
    sortOrder?: true
  }

  export type ProductImageMinAggregateInputType = {
    id?: true
    productId?: true
    imageUrl?: true
    sortOrder?: true
  }

  export type ProductImageMaxAggregateInputType = {
    id?: true
    productId?: true
    imageUrl?: true
    sortOrder?: true
  }

  export type ProductImageCountAggregateInputType = {
    id?: true
    productId?: true
    imageUrl?: true
    sortOrder?: true
    _all?: true
  }

  export type ProductImageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProductImage to aggregate.
     */
    where?: ProductImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProductImages to fetch.
     */
    orderBy?: ProductImageOrderByWithRelationInput | ProductImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProductImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProductImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProductImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ProductImages
    **/
    _count?: true | ProductImageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProductImageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProductImageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProductImageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProductImageMaxAggregateInputType
  }

  export type GetProductImageAggregateType<T extends ProductImageAggregateArgs> = {
        [P in keyof T & keyof AggregateProductImage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProductImage[P]>
      : GetScalarType<T[P], AggregateProductImage[P]>
  }




  export type ProductImageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProductImageWhereInput
    orderBy?: ProductImageOrderByWithAggregationInput | ProductImageOrderByWithAggregationInput[]
    by: ProductImageScalarFieldEnum[] | ProductImageScalarFieldEnum
    having?: ProductImageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProductImageCountAggregateInputType | true
    _avg?: ProductImageAvgAggregateInputType
    _sum?: ProductImageSumAggregateInputType
    _min?: ProductImageMinAggregateInputType
    _max?: ProductImageMaxAggregateInputType
  }

  export type ProductImageGroupByOutputType = {
    id: string
    productId: string
    imageUrl: string
    sortOrder: number
    _count: ProductImageCountAggregateOutputType | null
    _avg: ProductImageAvgAggregateOutputType | null
    _sum: ProductImageSumAggregateOutputType | null
    _min: ProductImageMinAggregateOutputType | null
    _max: ProductImageMaxAggregateOutputType | null
  }

  type GetProductImageGroupByPayload<T extends ProductImageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProductImageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProductImageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProductImageGroupByOutputType[P]>
            : GetScalarType<T[P], ProductImageGroupByOutputType[P]>
        }
      >
    >


  export type ProductImageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    imageUrl?: boolean
    sortOrder?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["productImage"]>

  export type ProductImageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    imageUrl?: boolean
    sortOrder?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["productImage"]>

  export type ProductImageSelectScalar = {
    id?: boolean
    productId?: boolean
    imageUrl?: boolean
    sortOrder?: boolean
  }

  export type ProductImageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }
  export type ProductImageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }

  export type $ProductImagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ProductImage"
    objects: {
      product: Prisma.$ProductPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      productId: string
      imageUrl: string
      sortOrder: number
    }, ExtArgs["result"]["productImage"]>
    composites: {}
  }

  type ProductImageGetPayload<S extends boolean | null | undefined | ProductImageDefaultArgs> = $Result.GetResult<Prisma.$ProductImagePayload, S>

  type ProductImageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ProductImageFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ProductImageCountAggregateInputType | true
    }

  export interface ProductImageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ProductImage'], meta: { name: 'ProductImage' } }
    /**
     * Find zero or one ProductImage that matches the filter.
     * @param {ProductImageFindUniqueArgs} args - Arguments to find a ProductImage
     * @example
     * // Get one ProductImage
     * const productImage = await prisma.productImage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProductImageFindUniqueArgs>(args: SelectSubset<T, ProductImageFindUniqueArgs<ExtArgs>>): Prisma__ProductImageClient<$Result.GetResult<Prisma.$ProductImagePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ProductImage that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ProductImageFindUniqueOrThrowArgs} args - Arguments to find a ProductImage
     * @example
     * // Get one ProductImage
     * const productImage = await prisma.productImage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProductImageFindUniqueOrThrowArgs>(args: SelectSubset<T, ProductImageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProductImageClient<$Result.GetResult<Prisma.$ProductImagePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ProductImage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductImageFindFirstArgs} args - Arguments to find a ProductImage
     * @example
     * // Get one ProductImage
     * const productImage = await prisma.productImage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProductImageFindFirstArgs>(args?: SelectSubset<T, ProductImageFindFirstArgs<ExtArgs>>): Prisma__ProductImageClient<$Result.GetResult<Prisma.$ProductImagePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ProductImage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductImageFindFirstOrThrowArgs} args - Arguments to find a ProductImage
     * @example
     * // Get one ProductImage
     * const productImage = await prisma.productImage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProductImageFindFirstOrThrowArgs>(args?: SelectSubset<T, ProductImageFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProductImageClient<$Result.GetResult<Prisma.$ProductImagePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ProductImages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductImageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ProductImages
     * const productImages = await prisma.productImage.findMany()
     * 
     * // Get first 10 ProductImages
     * const productImages = await prisma.productImage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const productImageWithIdOnly = await prisma.productImage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProductImageFindManyArgs>(args?: SelectSubset<T, ProductImageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductImagePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ProductImage.
     * @param {ProductImageCreateArgs} args - Arguments to create a ProductImage.
     * @example
     * // Create one ProductImage
     * const ProductImage = await prisma.productImage.create({
     *   data: {
     *     // ... data to create a ProductImage
     *   }
     * })
     * 
     */
    create<T extends ProductImageCreateArgs>(args: SelectSubset<T, ProductImageCreateArgs<ExtArgs>>): Prisma__ProductImageClient<$Result.GetResult<Prisma.$ProductImagePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ProductImages.
     * @param {ProductImageCreateManyArgs} args - Arguments to create many ProductImages.
     * @example
     * // Create many ProductImages
     * const productImage = await prisma.productImage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProductImageCreateManyArgs>(args?: SelectSubset<T, ProductImageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ProductImages and returns the data saved in the database.
     * @param {ProductImageCreateManyAndReturnArgs} args - Arguments to create many ProductImages.
     * @example
     * // Create many ProductImages
     * const productImage = await prisma.productImage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ProductImages and only return the `id`
     * const productImageWithIdOnly = await prisma.productImage.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProductImageCreateManyAndReturnArgs>(args?: SelectSubset<T, ProductImageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductImagePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ProductImage.
     * @param {ProductImageDeleteArgs} args - Arguments to delete one ProductImage.
     * @example
     * // Delete one ProductImage
     * const ProductImage = await prisma.productImage.delete({
     *   where: {
     *     // ... filter to delete one ProductImage
     *   }
     * })
     * 
     */
    delete<T extends ProductImageDeleteArgs>(args: SelectSubset<T, ProductImageDeleteArgs<ExtArgs>>): Prisma__ProductImageClient<$Result.GetResult<Prisma.$ProductImagePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ProductImage.
     * @param {ProductImageUpdateArgs} args - Arguments to update one ProductImage.
     * @example
     * // Update one ProductImage
     * const productImage = await prisma.productImage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProductImageUpdateArgs>(args: SelectSubset<T, ProductImageUpdateArgs<ExtArgs>>): Prisma__ProductImageClient<$Result.GetResult<Prisma.$ProductImagePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ProductImages.
     * @param {ProductImageDeleteManyArgs} args - Arguments to filter ProductImages to delete.
     * @example
     * // Delete a few ProductImages
     * const { count } = await prisma.productImage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProductImageDeleteManyArgs>(args?: SelectSubset<T, ProductImageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProductImages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductImageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ProductImages
     * const productImage = await prisma.productImage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProductImageUpdateManyArgs>(args: SelectSubset<T, ProductImageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ProductImage.
     * @param {ProductImageUpsertArgs} args - Arguments to update or create a ProductImage.
     * @example
     * // Update or create a ProductImage
     * const productImage = await prisma.productImage.upsert({
     *   create: {
     *     // ... data to create a ProductImage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ProductImage we want to update
     *   }
     * })
     */
    upsert<T extends ProductImageUpsertArgs>(args: SelectSubset<T, ProductImageUpsertArgs<ExtArgs>>): Prisma__ProductImageClient<$Result.GetResult<Prisma.$ProductImagePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ProductImages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductImageCountArgs} args - Arguments to filter ProductImages to count.
     * @example
     * // Count the number of ProductImages
     * const count = await prisma.productImage.count({
     *   where: {
     *     // ... the filter for the ProductImages we want to count
     *   }
     * })
    **/
    count<T extends ProductImageCountArgs>(
      args?: Subset<T, ProductImageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProductImageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ProductImage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductImageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProductImageAggregateArgs>(args: Subset<T, ProductImageAggregateArgs>): Prisma.PrismaPromise<GetProductImageAggregateType<T>>

    /**
     * Group by ProductImage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductImageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProductImageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProductImageGroupByArgs['orderBy'] }
        : { orderBy?: ProductImageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProductImageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProductImageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ProductImage model
   */
  readonly fields: ProductImageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ProductImage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProductImageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    product<T extends ProductDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProductDefaultArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ProductImage model
   */ 
  interface ProductImageFieldRefs {
    readonly id: FieldRef<"ProductImage", 'String'>
    readonly productId: FieldRef<"ProductImage", 'String'>
    readonly imageUrl: FieldRef<"ProductImage", 'String'>
    readonly sortOrder: FieldRef<"ProductImage", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * ProductImage findUnique
   */
  export type ProductImageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductImage
     */
    select?: ProductImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductImageInclude<ExtArgs> | null
    /**
     * Filter, which ProductImage to fetch.
     */
    where: ProductImageWhereUniqueInput
  }

  /**
   * ProductImage findUniqueOrThrow
   */
  export type ProductImageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductImage
     */
    select?: ProductImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductImageInclude<ExtArgs> | null
    /**
     * Filter, which ProductImage to fetch.
     */
    where: ProductImageWhereUniqueInput
  }

  /**
   * ProductImage findFirst
   */
  export type ProductImageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductImage
     */
    select?: ProductImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductImageInclude<ExtArgs> | null
    /**
     * Filter, which ProductImage to fetch.
     */
    where?: ProductImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProductImages to fetch.
     */
    orderBy?: ProductImageOrderByWithRelationInput | ProductImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProductImages.
     */
    cursor?: ProductImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProductImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProductImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProductImages.
     */
    distinct?: ProductImageScalarFieldEnum | ProductImageScalarFieldEnum[]
  }

  /**
   * ProductImage findFirstOrThrow
   */
  export type ProductImageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductImage
     */
    select?: ProductImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductImageInclude<ExtArgs> | null
    /**
     * Filter, which ProductImage to fetch.
     */
    where?: ProductImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProductImages to fetch.
     */
    orderBy?: ProductImageOrderByWithRelationInput | ProductImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProductImages.
     */
    cursor?: ProductImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProductImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProductImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProductImages.
     */
    distinct?: ProductImageScalarFieldEnum | ProductImageScalarFieldEnum[]
  }

  /**
   * ProductImage findMany
   */
  export type ProductImageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductImage
     */
    select?: ProductImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductImageInclude<ExtArgs> | null
    /**
     * Filter, which ProductImages to fetch.
     */
    where?: ProductImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProductImages to fetch.
     */
    orderBy?: ProductImageOrderByWithRelationInput | ProductImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ProductImages.
     */
    cursor?: ProductImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProductImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProductImages.
     */
    skip?: number
    distinct?: ProductImageScalarFieldEnum | ProductImageScalarFieldEnum[]
  }

  /**
   * ProductImage create
   */
  export type ProductImageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductImage
     */
    select?: ProductImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductImageInclude<ExtArgs> | null
    /**
     * The data needed to create a ProductImage.
     */
    data: XOR<ProductImageCreateInput, ProductImageUncheckedCreateInput>
  }

  /**
   * ProductImage createMany
   */
  export type ProductImageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ProductImages.
     */
    data: ProductImageCreateManyInput | ProductImageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProductImage createManyAndReturn
   */
  export type ProductImageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductImage
     */
    select?: ProductImageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ProductImages.
     */
    data: ProductImageCreateManyInput | ProductImageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductImageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ProductImage update
   */
  export type ProductImageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductImage
     */
    select?: ProductImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductImageInclude<ExtArgs> | null
    /**
     * The data needed to update a ProductImage.
     */
    data: XOR<ProductImageUpdateInput, ProductImageUncheckedUpdateInput>
    /**
     * Choose, which ProductImage to update.
     */
    where: ProductImageWhereUniqueInput
  }

  /**
   * ProductImage updateMany
   */
  export type ProductImageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ProductImages.
     */
    data: XOR<ProductImageUpdateManyMutationInput, ProductImageUncheckedUpdateManyInput>
    /**
     * Filter which ProductImages to update
     */
    where?: ProductImageWhereInput
  }

  /**
   * ProductImage upsert
   */
  export type ProductImageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductImage
     */
    select?: ProductImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductImageInclude<ExtArgs> | null
    /**
     * The filter to search for the ProductImage to update in case it exists.
     */
    where: ProductImageWhereUniqueInput
    /**
     * In case the ProductImage found by the `where` argument doesn't exist, create a new ProductImage with this data.
     */
    create: XOR<ProductImageCreateInput, ProductImageUncheckedCreateInput>
    /**
     * In case the ProductImage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProductImageUpdateInput, ProductImageUncheckedUpdateInput>
  }

  /**
   * ProductImage delete
   */
  export type ProductImageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductImage
     */
    select?: ProductImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductImageInclude<ExtArgs> | null
    /**
     * Filter which ProductImage to delete.
     */
    where: ProductImageWhereUniqueInput
  }

  /**
   * ProductImage deleteMany
   */
  export type ProductImageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProductImages to delete
     */
    where?: ProductImageWhereInput
  }

  /**
   * ProductImage without action
   */
  export type ProductImageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductImage
     */
    select?: ProductImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductImageInclude<ExtArgs> | null
  }


  /**
   * Model SiteSettings
   */

  export type AggregateSiteSettings = {
    _count: SiteSettingsCountAggregateOutputType | null
    _min: SiteSettingsMinAggregateOutputType | null
    _max: SiteSettingsMaxAggregateOutputType | null
  }

  export type SiteSettingsMinAggregateOutputType = {
    id: string | null
    companyName: string | null
    logoUrl: string | null
    address: string | null
    phone: string | null
    email: string | null
    mapIframeCode: string | null
    topbarShippingMsg: string | null
    topbarPhone: string | null
    copyrightText: string | null
    updatedAt: Date | null
  }

  export type SiteSettingsMaxAggregateOutputType = {
    id: string | null
    companyName: string | null
    logoUrl: string | null
    address: string | null
    phone: string | null
    email: string | null
    mapIframeCode: string | null
    topbarShippingMsg: string | null
    topbarPhone: string | null
    copyrightText: string | null
    updatedAt: Date | null
  }

  export type SiteSettingsCountAggregateOutputType = {
    id: number
    companyName: number
    logoUrl: number
    address: number
    phone: number
    email: number
    mapIframeCode: number
    topbarShippingMsg: number
    topbarPhone: number
    trustBadges: number
    partners: number
    footerLinks: number
    copyrightText: number
    updatedAt: number
    _all: number
  }


  export type SiteSettingsMinAggregateInputType = {
    id?: true
    companyName?: true
    logoUrl?: true
    address?: true
    phone?: true
    email?: true
    mapIframeCode?: true
    topbarShippingMsg?: true
    topbarPhone?: true
    copyrightText?: true
    updatedAt?: true
  }

  export type SiteSettingsMaxAggregateInputType = {
    id?: true
    companyName?: true
    logoUrl?: true
    address?: true
    phone?: true
    email?: true
    mapIframeCode?: true
    topbarShippingMsg?: true
    topbarPhone?: true
    copyrightText?: true
    updatedAt?: true
  }

  export type SiteSettingsCountAggregateInputType = {
    id?: true
    companyName?: true
    logoUrl?: true
    address?: true
    phone?: true
    email?: true
    mapIframeCode?: true
    topbarShippingMsg?: true
    topbarPhone?: true
    trustBadges?: true
    partners?: true
    footerLinks?: true
    copyrightText?: true
    updatedAt?: true
    _all?: true
  }

  export type SiteSettingsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SiteSettings to aggregate.
     */
    where?: SiteSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SiteSettings to fetch.
     */
    orderBy?: SiteSettingsOrderByWithRelationInput | SiteSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SiteSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SiteSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SiteSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SiteSettings
    **/
    _count?: true | SiteSettingsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SiteSettingsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SiteSettingsMaxAggregateInputType
  }

  export type GetSiteSettingsAggregateType<T extends SiteSettingsAggregateArgs> = {
        [P in keyof T & keyof AggregateSiteSettings]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSiteSettings[P]>
      : GetScalarType<T[P], AggregateSiteSettings[P]>
  }




  export type SiteSettingsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SiteSettingsWhereInput
    orderBy?: SiteSettingsOrderByWithAggregationInput | SiteSettingsOrderByWithAggregationInput[]
    by: SiteSettingsScalarFieldEnum[] | SiteSettingsScalarFieldEnum
    having?: SiteSettingsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SiteSettingsCountAggregateInputType | true
    _min?: SiteSettingsMinAggregateInputType
    _max?: SiteSettingsMaxAggregateInputType
  }

  export type SiteSettingsGroupByOutputType = {
    id: string
    companyName: string
    logoUrl: string | null
    address: string | null
    phone: string | null
    email: string | null
    mapIframeCode: string | null
    topbarShippingMsg: string | null
    topbarPhone: string | null
    trustBadges: JsonValue | null
    partners: JsonValue | null
    footerLinks: JsonValue | null
    copyrightText: string | null
    updatedAt: Date
    _count: SiteSettingsCountAggregateOutputType | null
    _min: SiteSettingsMinAggregateOutputType | null
    _max: SiteSettingsMaxAggregateOutputType | null
  }

  type GetSiteSettingsGroupByPayload<T extends SiteSettingsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SiteSettingsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SiteSettingsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SiteSettingsGroupByOutputType[P]>
            : GetScalarType<T[P], SiteSettingsGroupByOutputType[P]>
        }
      >
    >


  export type SiteSettingsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyName?: boolean
    logoUrl?: boolean
    address?: boolean
    phone?: boolean
    email?: boolean
    mapIframeCode?: boolean
    topbarShippingMsg?: boolean
    topbarPhone?: boolean
    trustBadges?: boolean
    partners?: boolean
    footerLinks?: boolean
    copyrightText?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["siteSettings"]>

  export type SiteSettingsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    companyName?: boolean
    logoUrl?: boolean
    address?: boolean
    phone?: boolean
    email?: boolean
    mapIframeCode?: boolean
    topbarShippingMsg?: boolean
    topbarPhone?: boolean
    trustBadges?: boolean
    partners?: boolean
    footerLinks?: boolean
    copyrightText?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["siteSettings"]>

  export type SiteSettingsSelectScalar = {
    id?: boolean
    companyName?: boolean
    logoUrl?: boolean
    address?: boolean
    phone?: boolean
    email?: boolean
    mapIframeCode?: boolean
    topbarShippingMsg?: boolean
    topbarPhone?: boolean
    trustBadges?: boolean
    partners?: boolean
    footerLinks?: boolean
    copyrightText?: boolean
    updatedAt?: boolean
  }


  export type $SiteSettingsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SiteSettings"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      companyName: string
      logoUrl: string | null
      address: string | null
      phone: string | null
      email: string | null
      mapIframeCode: string | null
      topbarShippingMsg: string | null
      topbarPhone: string | null
      trustBadges: Prisma.JsonValue | null
      partners: Prisma.JsonValue | null
      footerLinks: Prisma.JsonValue | null
      copyrightText: string | null
      updatedAt: Date
    }, ExtArgs["result"]["siteSettings"]>
    composites: {}
  }

  type SiteSettingsGetPayload<S extends boolean | null | undefined | SiteSettingsDefaultArgs> = $Result.GetResult<Prisma.$SiteSettingsPayload, S>

  type SiteSettingsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SiteSettingsFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SiteSettingsCountAggregateInputType | true
    }

  export interface SiteSettingsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SiteSettings'], meta: { name: 'SiteSettings' } }
    /**
     * Find zero or one SiteSettings that matches the filter.
     * @param {SiteSettingsFindUniqueArgs} args - Arguments to find a SiteSettings
     * @example
     * // Get one SiteSettings
     * const siteSettings = await prisma.siteSettings.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SiteSettingsFindUniqueArgs>(args: SelectSubset<T, SiteSettingsFindUniqueArgs<ExtArgs>>): Prisma__SiteSettingsClient<$Result.GetResult<Prisma.$SiteSettingsPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one SiteSettings that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SiteSettingsFindUniqueOrThrowArgs} args - Arguments to find a SiteSettings
     * @example
     * // Get one SiteSettings
     * const siteSettings = await prisma.siteSettings.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SiteSettingsFindUniqueOrThrowArgs>(args: SelectSubset<T, SiteSettingsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SiteSettingsClient<$Result.GetResult<Prisma.$SiteSettingsPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first SiteSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SiteSettingsFindFirstArgs} args - Arguments to find a SiteSettings
     * @example
     * // Get one SiteSettings
     * const siteSettings = await prisma.siteSettings.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SiteSettingsFindFirstArgs>(args?: SelectSubset<T, SiteSettingsFindFirstArgs<ExtArgs>>): Prisma__SiteSettingsClient<$Result.GetResult<Prisma.$SiteSettingsPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first SiteSettings that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SiteSettingsFindFirstOrThrowArgs} args - Arguments to find a SiteSettings
     * @example
     * // Get one SiteSettings
     * const siteSettings = await prisma.siteSettings.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SiteSettingsFindFirstOrThrowArgs>(args?: SelectSubset<T, SiteSettingsFindFirstOrThrowArgs<ExtArgs>>): Prisma__SiteSettingsClient<$Result.GetResult<Prisma.$SiteSettingsPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more SiteSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SiteSettingsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SiteSettings
     * const siteSettings = await prisma.siteSettings.findMany()
     * 
     * // Get first 10 SiteSettings
     * const siteSettings = await prisma.siteSettings.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const siteSettingsWithIdOnly = await prisma.siteSettings.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SiteSettingsFindManyArgs>(args?: SelectSubset<T, SiteSettingsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SiteSettingsPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a SiteSettings.
     * @param {SiteSettingsCreateArgs} args - Arguments to create a SiteSettings.
     * @example
     * // Create one SiteSettings
     * const SiteSettings = await prisma.siteSettings.create({
     *   data: {
     *     // ... data to create a SiteSettings
     *   }
     * })
     * 
     */
    create<T extends SiteSettingsCreateArgs>(args: SelectSubset<T, SiteSettingsCreateArgs<ExtArgs>>): Prisma__SiteSettingsClient<$Result.GetResult<Prisma.$SiteSettingsPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many SiteSettings.
     * @param {SiteSettingsCreateManyArgs} args - Arguments to create many SiteSettings.
     * @example
     * // Create many SiteSettings
     * const siteSettings = await prisma.siteSettings.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SiteSettingsCreateManyArgs>(args?: SelectSubset<T, SiteSettingsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SiteSettings and returns the data saved in the database.
     * @param {SiteSettingsCreateManyAndReturnArgs} args - Arguments to create many SiteSettings.
     * @example
     * // Create many SiteSettings
     * const siteSettings = await prisma.siteSettings.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SiteSettings and only return the `id`
     * const siteSettingsWithIdOnly = await prisma.siteSettings.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SiteSettingsCreateManyAndReturnArgs>(args?: SelectSubset<T, SiteSettingsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SiteSettingsPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a SiteSettings.
     * @param {SiteSettingsDeleteArgs} args - Arguments to delete one SiteSettings.
     * @example
     * // Delete one SiteSettings
     * const SiteSettings = await prisma.siteSettings.delete({
     *   where: {
     *     // ... filter to delete one SiteSettings
     *   }
     * })
     * 
     */
    delete<T extends SiteSettingsDeleteArgs>(args: SelectSubset<T, SiteSettingsDeleteArgs<ExtArgs>>): Prisma__SiteSettingsClient<$Result.GetResult<Prisma.$SiteSettingsPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one SiteSettings.
     * @param {SiteSettingsUpdateArgs} args - Arguments to update one SiteSettings.
     * @example
     * // Update one SiteSettings
     * const siteSettings = await prisma.siteSettings.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SiteSettingsUpdateArgs>(args: SelectSubset<T, SiteSettingsUpdateArgs<ExtArgs>>): Prisma__SiteSettingsClient<$Result.GetResult<Prisma.$SiteSettingsPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more SiteSettings.
     * @param {SiteSettingsDeleteManyArgs} args - Arguments to filter SiteSettings to delete.
     * @example
     * // Delete a few SiteSettings
     * const { count } = await prisma.siteSettings.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SiteSettingsDeleteManyArgs>(args?: SelectSubset<T, SiteSettingsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SiteSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SiteSettingsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SiteSettings
     * const siteSettings = await prisma.siteSettings.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SiteSettingsUpdateManyArgs>(args: SelectSubset<T, SiteSettingsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one SiteSettings.
     * @param {SiteSettingsUpsertArgs} args - Arguments to update or create a SiteSettings.
     * @example
     * // Update or create a SiteSettings
     * const siteSettings = await prisma.siteSettings.upsert({
     *   create: {
     *     // ... data to create a SiteSettings
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SiteSettings we want to update
     *   }
     * })
     */
    upsert<T extends SiteSettingsUpsertArgs>(args: SelectSubset<T, SiteSettingsUpsertArgs<ExtArgs>>): Prisma__SiteSettingsClient<$Result.GetResult<Prisma.$SiteSettingsPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of SiteSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SiteSettingsCountArgs} args - Arguments to filter SiteSettings to count.
     * @example
     * // Count the number of SiteSettings
     * const count = await prisma.siteSettings.count({
     *   where: {
     *     // ... the filter for the SiteSettings we want to count
     *   }
     * })
    **/
    count<T extends SiteSettingsCountArgs>(
      args?: Subset<T, SiteSettingsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SiteSettingsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SiteSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SiteSettingsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SiteSettingsAggregateArgs>(args: Subset<T, SiteSettingsAggregateArgs>): Prisma.PrismaPromise<GetSiteSettingsAggregateType<T>>

    /**
     * Group by SiteSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SiteSettingsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SiteSettingsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SiteSettingsGroupByArgs['orderBy'] }
        : { orderBy?: SiteSettingsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SiteSettingsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSiteSettingsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SiteSettings model
   */
  readonly fields: SiteSettingsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SiteSettings.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SiteSettingsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SiteSettings model
   */ 
  interface SiteSettingsFieldRefs {
    readonly id: FieldRef<"SiteSettings", 'String'>
    readonly companyName: FieldRef<"SiteSettings", 'String'>
    readonly logoUrl: FieldRef<"SiteSettings", 'String'>
    readonly address: FieldRef<"SiteSettings", 'String'>
    readonly phone: FieldRef<"SiteSettings", 'String'>
    readonly email: FieldRef<"SiteSettings", 'String'>
    readonly mapIframeCode: FieldRef<"SiteSettings", 'String'>
    readonly topbarShippingMsg: FieldRef<"SiteSettings", 'String'>
    readonly topbarPhone: FieldRef<"SiteSettings", 'String'>
    readonly trustBadges: FieldRef<"SiteSettings", 'Json'>
    readonly partners: FieldRef<"SiteSettings", 'Json'>
    readonly footerLinks: FieldRef<"SiteSettings", 'Json'>
    readonly copyrightText: FieldRef<"SiteSettings", 'String'>
    readonly updatedAt: FieldRef<"SiteSettings", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SiteSettings findUnique
   */
  export type SiteSettingsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SiteSettings
     */
    select?: SiteSettingsSelect<ExtArgs> | null
    /**
     * Filter, which SiteSettings to fetch.
     */
    where: SiteSettingsWhereUniqueInput
  }

  /**
   * SiteSettings findUniqueOrThrow
   */
  export type SiteSettingsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SiteSettings
     */
    select?: SiteSettingsSelect<ExtArgs> | null
    /**
     * Filter, which SiteSettings to fetch.
     */
    where: SiteSettingsWhereUniqueInput
  }

  /**
   * SiteSettings findFirst
   */
  export type SiteSettingsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SiteSettings
     */
    select?: SiteSettingsSelect<ExtArgs> | null
    /**
     * Filter, which SiteSettings to fetch.
     */
    where?: SiteSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SiteSettings to fetch.
     */
    orderBy?: SiteSettingsOrderByWithRelationInput | SiteSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SiteSettings.
     */
    cursor?: SiteSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SiteSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SiteSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SiteSettings.
     */
    distinct?: SiteSettingsScalarFieldEnum | SiteSettingsScalarFieldEnum[]
  }

  /**
   * SiteSettings findFirstOrThrow
   */
  export type SiteSettingsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SiteSettings
     */
    select?: SiteSettingsSelect<ExtArgs> | null
    /**
     * Filter, which SiteSettings to fetch.
     */
    where?: SiteSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SiteSettings to fetch.
     */
    orderBy?: SiteSettingsOrderByWithRelationInput | SiteSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SiteSettings.
     */
    cursor?: SiteSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SiteSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SiteSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SiteSettings.
     */
    distinct?: SiteSettingsScalarFieldEnum | SiteSettingsScalarFieldEnum[]
  }

  /**
   * SiteSettings findMany
   */
  export type SiteSettingsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SiteSettings
     */
    select?: SiteSettingsSelect<ExtArgs> | null
    /**
     * Filter, which SiteSettings to fetch.
     */
    where?: SiteSettingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SiteSettings to fetch.
     */
    orderBy?: SiteSettingsOrderByWithRelationInput | SiteSettingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SiteSettings.
     */
    cursor?: SiteSettingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SiteSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SiteSettings.
     */
    skip?: number
    distinct?: SiteSettingsScalarFieldEnum | SiteSettingsScalarFieldEnum[]
  }

  /**
   * SiteSettings create
   */
  export type SiteSettingsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SiteSettings
     */
    select?: SiteSettingsSelect<ExtArgs> | null
    /**
     * The data needed to create a SiteSettings.
     */
    data: XOR<SiteSettingsCreateInput, SiteSettingsUncheckedCreateInput>
  }

  /**
   * SiteSettings createMany
   */
  export type SiteSettingsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SiteSettings.
     */
    data: SiteSettingsCreateManyInput | SiteSettingsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SiteSettings createManyAndReturn
   */
  export type SiteSettingsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SiteSettings
     */
    select?: SiteSettingsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many SiteSettings.
     */
    data: SiteSettingsCreateManyInput | SiteSettingsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SiteSettings update
   */
  export type SiteSettingsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SiteSettings
     */
    select?: SiteSettingsSelect<ExtArgs> | null
    /**
     * The data needed to update a SiteSettings.
     */
    data: XOR<SiteSettingsUpdateInput, SiteSettingsUncheckedUpdateInput>
    /**
     * Choose, which SiteSettings to update.
     */
    where: SiteSettingsWhereUniqueInput
  }

  /**
   * SiteSettings updateMany
   */
  export type SiteSettingsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SiteSettings.
     */
    data: XOR<SiteSettingsUpdateManyMutationInput, SiteSettingsUncheckedUpdateManyInput>
    /**
     * Filter which SiteSettings to update
     */
    where?: SiteSettingsWhereInput
  }

  /**
   * SiteSettings upsert
   */
  export type SiteSettingsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SiteSettings
     */
    select?: SiteSettingsSelect<ExtArgs> | null
    /**
     * The filter to search for the SiteSettings to update in case it exists.
     */
    where: SiteSettingsWhereUniqueInput
    /**
     * In case the SiteSettings found by the `where` argument doesn't exist, create a new SiteSettings with this data.
     */
    create: XOR<SiteSettingsCreateInput, SiteSettingsUncheckedCreateInput>
    /**
     * In case the SiteSettings was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SiteSettingsUpdateInput, SiteSettingsUncheckedUpdateInput>
  }

  /**
   * SiteSettings delete
   */
  export type SiteSettingsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SiteSettings
     */
    select?: SiteSettingsSelect<ExtArgs> | null
    /**
     * Filter which SiteSettings to delete.
     */
    where: SiteSettingsWhereUniqueInput
  }

  /**
   * SiteSettings deleteMany
   */
  export type SiteSettingsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SiteSettings to delete
     */
    where?: SiteSettingsWhereInput
  }

  /**
   * SiteSettings without action
   */
  export type SiteSettingsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SiteSettings
     */
    select?: SiteSettingsSelect<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
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

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const ProductScalarFieldEnum: {
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

  export type ProductScalarFieldEnum = (typeof ProductScalarFieldEnum)[keyof typeof ProductScalarFieldEnum]


  export const PriceRuleScalarFieldEnum: {
    id: 'id',
    productId: 'productId',
    role: 'role',
    customPriceKgs: 'customPriceKgs'
  };

  export type PriceRuleScalarFieldEnum = (typeof PriceRuleScalarFieldEnum)[keyof typeof PriceRuleScalarFieldEnum]


  export const OrderScalarFieldEnum: {
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

  export type OrderScalarFieldEnum = (typeof OrderScalarFieldEnum)[keyof typeof OrderScalarFieldEnum]


  export const OrderItemScalarFieldEnum: {
    id: 'id',
    orderId: 'orderId',
    productId: 'productId',
    quantity: 'quantity',
    unitPriceKgs: 'unitPriceKgs',
    totalPriceKgs: 'totalPriceKgs'
  };

  export type OrderItemScalarFieldEnum = (typeof OrderItemScalarFieldEnum)[keyof typeof OrderItemScalarFieldEnum]


  export const TransactionScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    type: 'type',
    amount: 'amount',
    currency: 'currency',
    description: 'description',
    createdAt: 'createdAt'
  };

  export type TransactionScalarFieldEnum = (typeof TransactionScalarFieldEnum)[keyof typeof TransactionScalarFieldEnum]


  export const ExchangeRateScalarFieldEnum: {
    id: 'id',
    currency: 'currency',
    rateToKgs: 'rateToKgs',
    updatedAt: 'updatedAt'
  };

  export type ExchangeRateScalarFieldEnum = (typeof ExchangeRateScalarFieldEnum)[keyof typeof ExchangeRateScalarFieldEnum]


  export const SystemConfigScalarFieldEnum: {
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

  export type SystemConfigScalarFieldEnum = (typeof SystemConfigScalarFieldEnum)[keyof typeof SystemConfigScalarFieldEnum]


  export const WeeklyCycleScalarFieldEnum: {
    id: 'id',
    weekNumber: 'weekNumber',
    year: 'year',
    startDate: 'startDate',
    endDate: 'endDate',
    isClosed: 'isClosed'
  };

  export type WeeklyCycleScalarFieldEnum = (typeof WeeklyCycleScalarFieldEnum)[keyof typeof WeeklyCycleScalarFieldEnum]


  export const UserWeeklyStatsScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    cycleId: 'cycleId',
    personalVolume: 'personalVolume',
    teamVolume: 'teamVolume',
    carryOverVolume: 'carryOverVolume'
  };

  export type UserWeeklyStatsScalarFieldEnum = (typeof UserWeeklyStatsScalarFieldEnum)[keyof typeof UserWeeklyStatsScalarFieldEnum]


  export const HeroSlideScalarFieldEnum: {
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

  export type HeroSlideScalarFieldEnum = (typeof HeroSlideScalarFieldEnum)[keyof typeof HeroSlideScalarFieldEnum]


  export const CategoryScalarFieldEnum: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    iconEmoji: 'iconEmoji',
    imageUrl: 'imageUrl',
    sortOrder: 'sortOrder',
    isActive: 'isActive'
  };

  export type CategoryScalarFieldEnum = (typeof CategoryScalarFieldEnum)[keyof typeof CategoryScalarFieldEnum]


  export const ProductImageScalarFieldEnum: {
    id: 'id',
    productId: 'productId',
    imageUrl: 'imageUrl',
    sortOrder: 'sortOrder'
  };

  export type ProductImageScalarFieldEnum = (typeof ProductImageScalarFieldEnum)[keyof typeof ProductImageScalarFieldEnum]


  export const SiteSettingsScalarFieldEnum: {
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

  export type SiteSettingsScalarFieldEnum = (typeof SiteSettingsScalarFieldEnum)[keyof typeof SiteSettingsScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>
    


  /**
   * Reference to a field of type 'Role[]'
   */
  export type ListEnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'OrderType'
   */
  export type EnumOrderTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'OrderType'>
    


  /**
   * Reference to a field of type 'OrderType[]'
   */
  export type ListEnumOrderTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'OrderType[]'>
    


  /**
   * Reference to a field of type 'OrderStatus'
   */
  export type EnumOrderStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'OrderStatus'>
    


  /**
   * Reference to a field of type 'OrderStatus[]'
   */
  export type ListEnumOrderStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'OrderStatus[]'>
    


  /**
   * Reference to a field of type 'PaymentMethod'
   */
  export type EnumPaymentMethodFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentMethod'>
    


  /**
   * Reference to a field of type 'PaymentMethod[]'
   */
  export type ListEnumPaymentMethodFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentMethod[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'TransactionType'
   */
  export type EnumTransactionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TransactionType'>
    


  /**
   * Reference to a field of type 'TransactionType[]'
   */
  export type ListEnumTransactionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TransactionType[]'>
    


  /**
   * Reference to a field of type 'Currency'
   */
  export type EnumCurrencyFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Currency'>
    


  /**
   * Reference to a field of type 'Currency[]'
   */
  export type ListEnumCurrencyFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Currency[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    sponsorId?: StringNullableFilter<"User"> | string | null
    name?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    passwordHash?: StringFilter<"User"> | string
    walletBalanceKgs?: DecimalFilter<"User"> | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFilter<"User"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    sponsor?: XOR<UserNullableRelationFilter, UserWhereInput> | null
    sponsoredUsers?: UserListRelationFilter
    orders?: OrderListRelationFilter
    transactions?: TransactionListRelationFilter
    userWeeklyStats?: UserWeeklyStatsListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    role?: SortOrder
    sponsorId?: SortOrderInput | SortOrder
    name?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    walletBalanceKgs?: SortOrder
    walletBalanceUsd?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    sponsor?: UserOrderByWithRelationInput
    sponsoredUsers?: UserOrderByRelationAggregateInput
    orders?: OrderOrderByRelationAggregateInput
    transactions?: TransactionOrderByRelationAggregateInput
    userWeeklyStats?: UserWeeklyStatsOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    role?: EnumRoleFilter<"User"> | $Enums.Role
    sponsorId?: StringNullableFilter<"User"> | string | null
    name?: StringFilter<"User"> | string
    passwordHash?: StringFilter<"User"> | string
    walletBalanceKgs?: DecimalFilter<"User"> | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFilter<"User"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    sponsor?: XOR<UserNullableRelationFilter, UserWhereInput> | null
    sponsoredUsers?: UserListRelationFilter
    orders?: OrderListRelationFilter
    transactions?: TransactionListRelationFilter
    userWeeklyStats?: UserWeeklyStatsListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    role?: SortOrder
    sponsorId?: SortOrderInput | SortOrder
    name?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    walletBalanceKgs?: SortOrder
    walletBalanceUsd?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    role?: EnumRoleWithAggregatesFilter<"User"> | $Enums.Role
    sponsorId?: StringNullableWithAggregatesFilter<"User"> | string | null
    name?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    passwordHash?: StringWithAggregatesFilter<"User"> | string
    walletBalanceKgs?: DecimalWithAggregatesFilter<"User"> | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalWithAggregatesFilter<"User"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type ProductWhereInput = {
    AND?: ProductWhereInput | ProductWhereInput[]
    OR?: ProductWhereInput[]
    NOT?: ProductWhereInput | ProductWhereInput[]
    id?: StringFilter<"Product"> | string
    barcode?: StringFilter<"Product"> | string
    name?: StringFilter<"Product"> | string
    description?: StringNullableFilter<"Product"> | string | null
    basePriceKgs?: DecimalFilter<"Product"> | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFilter<"Product"> | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFilter<"Product"> | number
    minStockAlert?: IntFilter<"Product"> | number
    categoryId?: StringNullableFilter<"Product"> | string | null
    createdAt?: DateTimeFilter<"Product"> | Date | string
    updatedAt?: DateTimeFilter<"Product"> | Date | string
    category?: XOR<CategoryNullableRelationFilter, CategoryWhereInput> | null
    priceRules?: PriceRuleListRelationFilter
    orderItems?: OrderItemListRelationFilter
    images?: ProductImageListRelationFilter
  }

  export type ProductOrderByWithRelationInput = {
    id?: SortOrder
    barcode?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    basePriceKgs?: SortOrder
    basePriceUsd?: SortOrder
    stockQuantity?: SortOrder
    minStockAlert?: SortOrder
    categoryId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    category?: CategoryOrderByWithRelationInput
    priceRules?: PriceRuleOrderByRelationAggregateInput
    orderItems?: OrderItemOrderByRelationAggregateInput
    images?: ProductImageOrderByRelationAggregateInput
  }

  export type ProductWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    barcode?: string
    AND?: ProductWhereInput | ProductWhereInput[]
    OR?: ProductWhereInput[]
    NOT?: ProductWhereInput | ProductWhereInput[]
    name?: StringFilter<"Product"> | string
    description?: StringNullableFilter<"Product"> | string | null
    basePriceKgs?: DecimalFilter<"Product"> | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFilter<"Product"> | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFilter<"Product"> | number
    minStockAlert?: IntFilter<"Product"> | number
    categoryId?: StringNullableFilter<"Product"> | string | null
    createdAt?: DateTimeFilter<"Product"> | Date | string
    updatedAt?: DateTimeFilter<"Product"> | Date | string
    category?: XOR<CategoryNullableRelationFilter, CategoryWhereInput> | null
    priceRules?: PriceRuleListRelationFilter
    orderItems?: OrderItemListRelationFilter
    images?: ProductImageListRelationFilter
  }, "id" | "barcode">

  export type ProductOrderByWithAggregationInput = {
    id?: SortOrder
    barcode?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    basePriceKgs?: SortOrder
    basePriceUsd?: SortOrder
    stockQuantity?: SortOrder
    minStockAlert?: SortOrder
    categoryId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ProductCountOrderByAggregateInput
    _avg?: ProductAvgOrderByAggregateInput
    _max?: ProductMaxOrderByAggregateInput
    _min?: ProductMinOrderByAggregateInput
    _sum?: ProductSumOrderByAggregateInput
  }

  export type ProductScalarWhereWithAggregatesInput = {
    AND?: ProductScalarWhereWithAggregatesInput | ProductScalarWhereWithAggregatesInput[]
    OR?: ProductScalarWhereWithAggregatesInput[]
    NOT?: ProductScalarWhereWithAggregatesInput | ProductScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Product"> | string
    barcode?: StringWithAggregatesFilter<"Product"> | string
    name?: StringWithAggregatesFilter<"Product"> | string
    description?: StringNullableWithAggregatesFilter<"Product"> | string | null
    basePriceKgs?: DecimalWithAggregatesFilter<"Product"> | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalWithAggregatesFilter<"Product"> | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntWithAggregatesFilter<"Product"> | number
    minStockAlert?: IntWithAggregatesFilter<"Product"> | number
    categoryId?: StringNullableWithAggregatesFilter<"Product"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Product"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Product"> | Date | string
  }

  export type PriceRuleWhereInput = {
    AND?: PriceRuleWhereInput | PriceRuleWhereInput[]
    OR?: PriceRuleWhereInput[]
    NOT?: PriceRuleWhereInput | PriceRuleWhereInput[]
    id?: StringFilter<"PriceRule"> | string
    productId?: StringFilter<"PriceRule"> | string
    role?: EnumRoleFilter<"PriceRule"> | $Enums.Role
    customPriceKgs?: DecimalFilter<"PriceRule"> | Decimal | DecimalJsLike | number | string
    product?: XOR<ProductRelationFilter, ProductWhereInput>
  }

  export type PriceRuleOrderByWithRelationInput = {
    id?: SortOrder
    productId?: SortOrder
    role?: SortOrder
    customPriceKgs?: SortOrder
    product?: ProductOrderByWithRelationInput
  }

  export type PriceRuleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    productId_role?: PriceRuleProductIdRoleCompoundUniqueInput
    AND?: PriceRuleWhereInput | PriceRuleWhereInput[]
    OR?: PriceRuleWhereInput[]
    NOT?: PriceRuleWhereInput | PriceRuleWhereInput[]
    productId?: StringFilter<"PriceRule"> | string
    role?: EnumRoleFilter<"PriceRule"> | $Enums.Role
    customPriceKgs?: DecimalFilter<"PriceRule"> | Decimal | DecimalJsLike | number | string
    product?: XOR<ProductRelationFilter, ProductWhereInput>
  }, "id" | "productId_role">

  export type PriceRuleOrderByWithAggregationInput = {
    id?: SortOrder
    productId?: SortOrder
    role?: SortOrder
    customPriceKgs?: SortOrder
    _count?: PriceRuleCountOrderByAggregateInput
    _avg?: PriceRuleAvgOrderByAggregateInput
    _max?: PriceRuleMaxOrderByAggregateInput
    _min?: PriceRuleMinOrderByAggregateInput
    _sum?: PriceRuleSumOrderByAggregateInput
  }

  export type PriceRuleScalarWhereWithAggregatesInput = {
    AND?: PriceRuleScalarWhereWithAggregatesInput | PriceRuleScalarWhereWithAggregatesInput[]
    OR?: PriceRuleScalarWhereWithAggregatesInput[]
    NOT?: PriceRuleScalarWhereWithAggregatesInput | PriceRuleScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PriceRule"> | string
    productId?: StringWithAggregatesFilter<"PriceRule"> | string
    role?: EnumRoleWithAggregatesFilter<"PriceRule"> | $Enums.Role
    customPriceKgs?: DecimalWithAggregatesFilter<"PriceRule"> | Decimal | DecimalJsLike | number | string
  }

  export type OrderWhereInput = {
    AND?: OrderWhereInput | OrderWhereInput[]
    OR?: OrderWhereInput[]
    NOT?: OrderWhereInput | OrderWhereInput[]
    id?: StringFilter<"Order"> | string
    userId?: StringFilter<"Order"> | string
    orderType?: EnumOrderTypeFilter<"Order"> | $Enums.OrderType
    status?: EnumOrderStatusFilter<"Order"> | $Enums.OrderStatus
    totalKgs?: DecimalFilter<"Order"> | Decimal | DecimalJsLike | number | string
    totalUsd?: DecimalFilter<"Order"> | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFilter<"Order"> | $Enums.PaymentMethod
    customerName?: StringNullableFilter<"Order"> | string | null
    customerPhone?: StringNullableFilter<"Order"> | string | null
    address?: StringNullableFilter<"Order"> | string | null
    receiptImageUrl?: StringNullableFilter<"Order"> | string | null
    ocrResult?: JsonNullableFilter<"Order">
    verifiedAt?: DateTimeNullableFilter<"Order"> | Date | string | null
    createdAt?: DateTimeFilter<"Order"> | Date | string
    updatedAt?: DateTimeFilter<"Order"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    items?: OrderItemListRelationFilter
  }

  export type OrderOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    orderType?: SortOrder
    status?: SortOrder
    totalKgs?: SortOrder
    totalUsd?: SortOrder
    paymentMethod?: SortOrder
    customerName?: SortOrderInput | SortOrder
    customerPhone?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    receiptImageUrl?: SortOrderInput | SortOrder
    ocrResult?: SortOrderInput | SortOrder
    verifiedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    items?: OrderItemOrderByRelationAggregateInput
  }

  export type OrderWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: OrderWhereInput | OrderWhereInput[]
    OR?: OrderWhereInput[]
    NOT?: OrderWhereInput | OrderWhereInput[]
    userId?: StringFilter<"Order"> | string
    orderType?: EnumOrderTypeFilter<"Order"> | $Enums.OrderType
    status?: EnumOrderStatusFilter<"Order"> | $Enums.OrderStatus
    totalKgs?: DecimalFilter<"Order"> | Decimal | DecimalJsLike | number | string
    totalUsd?: DecimalFilter<"Order"> | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFilter<"Order"> | $Enums.PaymentMethod
    customerName?: StringNullableFilter<"Order"> | string | null
    customerPhone?: StringNullableFilter<"Order"> | string | null
    address?: StringNullableFilter<"Order"> | string | null
    receiptImageUrl?: StringNullableFilter<"Order"> | string | null
    ocrResult?: JsonNullableFilter<"Order">
    verifiedAt?: DateTimeNullableFilter<"Order"> | Date | string | null
    createdAt?: DateTimeFilter<"Order"> | Date | string
    updatedAt?: DateTimeFilter<"Order"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    items?: OrderItemListRelationFilter
  }, "id">

  export type OrderOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    orderType?: SortOrder
    status?: SortOrder
    totalKgs?: SortOrder
    totalUsd?: SortOrder
    paymentMethod?: SortOrder
    customerName?: SortOrderInput | SortOrder
    customerPhone?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    receiptImageUrl?: SortOrderInput | SortOrder
    ocrResult?: SortOrderInput | SortOrder
    verifiedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: OrderCountOrderByAggregateInput
    _avg?: OrderAvgOrderByAggregateInput
    _max?: OrderMaxOrderByAggregateInput
    _min?: OrderMinOrderByAggregateInput
    _sum?: OrderSumOrderByAggregateInput
  }

  export type OrderScalarWhereWithAggregatesInput = {
    AND?: OrderScalarWhereWithAggregatesInput | OrderScalarWhereWithAggregatesInput[]
    OR?: OrderScalarWhereWithAggregatesInput[]
    NOT?: OrderScalarWhereWithAggregatesInput | OrderScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Order"> | string
    userId?: StringWithAggregatesFilter<"Order"> | string
    orderType?: EnumOrderTypeWithAggregatesFilter<"Order"> | $Enums.OrderType
    status?: EnumOrderStatusWithAggregatesFilter<"Order"> | $Enums.OrderStatus
    totalKgs?: DecimalWithAggregatesFilter<"Order"> | Decimal | DecimalJsLike | number | string
    totalUsd?: DecimalWithAggregatesFilter<"Order"> | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodWithAggregatesFilter<"Order"> | $Enums.PaymentMethod
    customerName?: StringNullableWithAggregatesFilter<"Order"> | string | null
    customerPhone?: StringNullableWithAggregatesFilter<"Order"> | string | null
    address?: StringNullableWithAggregatesFilter<"Order"> | string | null
    receiptImageUrl?: StringNullableWithAggregatesFilter<"Order"> | string | null
    ocrResult?: JsonNullableWithAggregatesFilter<"Order">
    verifiedAt?: DateTimeNullableWithAggregatesFilter<"Order"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Order"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Order"> | Date | string
  }

  export type OrderItemWhereInput = {
    AND?: OrderItemWhereInput | OrderItemWhereInput[]
    OR?: OrderItemWhereInput[]
    NOT?: OrderItemWhereInput | OrderItemWhereInput[]
    id?: StringFilter<"OrderItem"> | string
    orderId?: StringFilter<"OrderItem"> | string
    productId?: StringFilter<"OrderItem"> | string
    quantity?: IntFilter<"OrderItem"> | number
    unitPriceKgs?: DecimalFilter<"OrderItem"> | Decimal | DecimalJsLike | number | string
    totalPriceKgs?: DecimalFilter<"OrderItem"> | Decimal | DecimalJsLike | number | string
    order?: XOR<OrderRelationFilter, OrderWhereInput>
    product?: XOR<ProductRelationFilter, ProductWhereInput>
  }

  export type OrderItemOrderByWithRelationInput = {
    id?: SortOrder
    orderId?: SortOrder
    productId?: SortOrder
    quantity?: SortOrder
    unitPriceKgs?: SortOrder
    totalPriceKgs?: SortOrder
    order?: OrderOrderByWithRelationInput
    product?: ProductOrderByWithRelationInput
  }

  export type OrderItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: OrderItemWhereInput | OrderItemWhereInput[]
    OR?: OrderItemWhereInput[]
    NOT?: OrderItemWhereInput | OrderItemWhereInput[]
    orderId?: StringFilter<"OrderItem"> | string
    productId?: StringFilter<"OrderItem"> | string
    quantity?: IntFilter<"OrderItem"> | number
    unitPriceKgs?: DecimalFilter<"OrderItem"> | Decimal | DecimalJsLike | number | string
    totalPriceKgs?: DecimalFilter<"OrderItem"> | Decimal | DecimalJsLike | number | string
    order?: XOR<OrderRelationFilter, OrderWhereInput>
    product?: XOR<ProductRelationFilter, ProductWhereInput>
  }, "id">

  export type OrderItemOrderByWithAggregationInput = {
    id?: SortOrder
    orderId?: SortOrder
    productId?: SortOrder
    quantity?: SortOrder
    unitPriceKgs?: SortOrder
    totalPriceKgs?: SortOrder
    _count?: OrderItemCountOrderByAggregateInput
    _avg?: OrderItemAvgOrderByAggregateInput
    _max?: OrderItemMaxOrderByAggregateInput
    _min?: OrderItemMinOrderByAggregateInput
    _sum?: OrderItemSumOrderByAggregateInput
  }

  export type OrderItemScalarWhereWithAggregatesInput = {
    AND?: OrderItemScalarWhereWithAggregatesInput | OrderItemScalarWhereWithAggregatesInput[]
    OR?: OrderItemScalarWhereWithAggregatesInput[]
    NOT?: OrderItemScalarWhereWithAggregatesInput | OrderItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"OrderItem"> | string
    orderId?: StringWithAggregatesFilter<"OrderItem"> | string
    productId?: StringWithAggregatesFilter<"OrderItem"> | string
    quantity?: IntWithAggregatesFilter<"OrderItem"> | number
    unitPriceKgs?: DecimalWithAggregatesFilter<"OrderItem"> | Decimal | DecimalJsLike | number | string
    totalPriceKgs?: DecimalWithAggregatesFilter<"OrderItem"> | Decimal | DecimalJsLike | number | string
  }

  export type TransactionWhereInput = {
    AND?: TransactionWhereInput | TransactionWhereInput[]
    OR?: TransactionWhereInput[]
    NOT?: TransactionWhereInput | TransactionWhereInput[]
    id?: StringFilter<"Transaction"> | string
    userId?: StringFilter<"Transaction"> | string
    type?: EnumTransactionTypeFilter<"Transaction"> | $Enums.TransactionType
    amount?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    currency?: EnumCurrencyFilter<"Transaction"> | $Enums.Currency
    description?: StringNullableFilter<"Transaction"> | string | null
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type TransactionOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    description?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type TransactionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TransactionWhereInput | TransactionWhereInput[]
    OR?: TransactionWhereInput[]
    NOT?: TransactionWhereInput | TransactionWhereInput[]
    userId?: StringFilter<"Transaction"> | string
    type?: EnumTransactionTypeFilter<"Transaction"> | $Enums.TransactionType
    amount?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    currency?: EnumCurrencyFilter<"Transaction"> | $Enums.Currency
    description?: StringNullableFilter<"Transaction"> | string | null
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
  }, "id">

  export type TransactionOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    description?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: TransactionCountOrderByAggregateInput
    _avg?: TransactionAvgOrderByAggregateInput
    _max?: TransactionMaxOrderByAggregateInput
    _min?: TransactionMinOrderByAggregateInput
    _sum?: TransactionSumOrderByAggregateInput
  }

  export type TransactionScalarWhereWithAggregatesInput = {
    AND?: TransactionScalarWhereWithAggregatesInput | TransactionScalarWhereWithAggregatesInput[]
    OR?: TransactionScalarWhereWithAggregatesInput[]
    NOT?: TransactionScalarWhereWithAggregatesInput | TransactionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Transaction"> | string
    userId?: StringWithAggregatesFilter<"Transaction"> | string
    type?: EnumTransactionTypeWithAggregatesFilter<"Transaction"> | $Enums.TransactionType
    amount?: DecimalWithAggregatesFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    currency?: EnumCurrencyWithAggregatesFilter<"Transaction"> | $Enums.Currency
    description?: StringNullableWithAggregatesFilter<"Transaction"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Transaction"> | Date | string
  }

  export type ExchangeRateWhereInput = {
    AND?: ExchangeRateWhereInput | ExchangeRateWhereInput[]
    OR?: ExchangeRateWhereInput[]
    NOT?: ExchangeRateWhereInput | ExchangeRateWhereInput[]
    id?: StringFilter<"ExchangeRate"> | string
    currency?: StringFilter<"ExchangeRate"> | string
    rateToKgs?: DecimalFilter<"ExchangeRate"> | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFilter<"ExchangeRate"> | Date | string
  }

  export type ExchangeRateOrderByWithRelationInput = {
    id?: SortOrder
    currency?: SortOrder
    rateToKgs?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExchangeRateWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    currency?: string
    AND?: ExchangeRateWhereInput | ExchangeRateWhereInput[]
    OR?: ExchangeRateWhereInput[]
    NOT?: ExchangeRateWhereInput | ExchangeRateWhereInput[]
    rateToKgs?: DecimalFilter<"ExchangeRate"> | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFilter<"ExchangeRate"> | Date | string
  }, "id" | "currency">

  export type ExchangeRateOrderByWithAggregationInput = {
    id?: SortOrder
    currency?: SortOrder
    rateToKgs?: SortOrder
    updatedAt?: SortOrder
    _count?: ExchangeRateCountOrderByAggregateInput
    _avg?: ExchangeRateAvgOrderByAggregateInput
    _max?: ExchangeRateMaxOrderByAggregateInput
    _min?: ExchangeRateMinOrderByAggregateInput
    _sum?: ExchangeRateSumOrderByAggregateInput
  }

  export type ExchangeRateScalarWhereWithAggregatesInput = {
    AND?: ExchangeRateScalarWhereWithAggregatesInput | ExchangeRateScalarWhereWithAggregatesInput[]
    OR?: ExchangeRateScalarWhereWithAggregatesInput[]
    NOT?: ExchangeRateScalarWhereWithAggregatesInput | ExchangeRateScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ExchangeRate"> | string
    currency?: StringWithAggregatesFilter<"ExchangeRate"> | string
    rateToKgs?: DecimalWithAggregatesFilter<"ExchangeRate"> | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeWithAggregatesFilter<"ExchangeRate"> | Date | string
  }

  export type SystemConfigWhereInput = {
    AND?: SystemConfigWhereInput | SystemConfigWhereInput[]
    OR?: SystemConfigWhereInput[]
    NOT?: SystemConfigWhereInput | SystemConfigWhereInput[]
    id?: StringFilter<"SystemConfig"> | string
    isMlmEnabled?: BoolFilter<"SystemConfig"> | boolean
    maxPayoutLimitPct?: DecimalFilter<"SystemConfig"> | Decimal | DecimalJsLike | number | string
    isFastStartActive?: BoolFilter<"SystemConfig"> | boolean
    fastStartRates?: JsonFilter<"SystemConfig">
    isUnilevelActive?: BoolFilter<"SystemConfig"> | boolean
    unilevelRates?: JsonFilter<"SystemConfig">
    isOverdriveActive?: BoolFilter<"SystemConfig"> | boolean
    overdrivePoolPct?: DecimalFilter<"SystemConfig"> | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFilter<"SystemConfig"> | Date | string
  }

  export type SystemConfigOrderByWithRelationInput = {
    id?: SortOrder
    isMlmEnabled?: SortOrder
    maxPayoutLimitPct?: SortOrder
    isFastStartActive?: SortOrder
    fastStartRates?: SortOrder
    isUnilevelActive?: SortOrder
    unilevelRates?: SortOrder
    isOverdriveActive?: SortOrder
    overdrivePoolPct?: SortOrder
    updatedAt?: SortOrder
  }

  export type SystemConfigWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SystemConfigWhereInput | SystemConfigWhereInput[]
    OR?: SystemConfigWhereInput[]
    NOT?: SystemConfigWhereInput | SystemConfigWhereInput[]
    isMlmEnabled?: BoolFilter<"SystemConfig"> | boolean
    maxPayoutLimitPct?: DecimalFilter<"SystemConfig"> | Decimal | DecimalJsLike | number | string
    isFastStartActive?: BoolFilter<"SystemConfig"> | boolean
    fastStartRates?: JsonFilter<"SystemConfig">
    isUnilevelActive?: BoolFilter<"SystemConfig"> | boolean
    unilevelRates?: JsonFilter<"SystemConfig">
    isOverdriveActive?: BoolFilter<"SystemConfig"> | boolean
    overdrivePoolPct?: DecimalFilter<"SystemConfig"> | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFilter<"SystemConfig"> | Date | string
  }, "id">

  export type SystemConfigOrderByWithAggregationInput = {
    id?: SortOrder
    isMlmEnabled?: SortOrder
    maxPayoutLimitPct?: SortOrder
    isFastStartActive?: SortOrder
    fastStartRates?: SortOrder
    isUnilevelActive?: SortOrder
    unilevelRates?: SortOrder
    isOverdriveActive?: SortOrder
    overdrivePoolPct?: SortOrder
    updatedAt?: SortOrder
    _count?: SystemConfigCountOrderByAggregateInput
    _avg?: SystemConfigAvgOrderByAggregateInput
    _max?: SystemConfigMaxOrderByAggregateInput
    _min?: SystemConfigMinOrderByAggregateInput
    _sum?: SystemConfigSumOrderByAggregateInput
  }

  export type SystemConfigScalarWhereWithAggregatesInput = {
    AND?: SystemConfigScalarWhereWithAggregatesInput | SystemConfigScalarWhereWithAggregatesInput[]
    OR?: SystemConfigScalarWhereWithAggregatesInput[]
    NOT?: SystemConfigScalarWhereWithAggregatesInput | SystemConfigScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SystemConfig"> | string
    isMlmEnabled?: BoolWithAggregatesFilter<"SystemConfig"> | boolean
    maxPayoutLimitPct?: DecimalWithAggregatesFilter<"SystemConfig"> | Decimal | DecimalJsLike | number | string
    isFastStartActive?: BoolWithAggregatesFilter<"SystemConfig"> | boolean
    fastStartRates?: JsonWithAggregatesFilter<"SystemConfig">
    isUnilevelActive?: BoolWithAggregatesFilter<"SystemConfig"> | boolean
    unilevelRates?: JsonWithAggregatesFilter<"SystemConfig">
    isOverdriveActive?: BoolWithAggregatesFilter<"SystemConfig"> | boolean
    overdrivePoolPct?: DecimalWithAggregatesFilter<"SystemConfig"> | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeWithAggregatesFilter<"SystemConfig"> | Date | string
  }

  export type WeeklyCycleWhereInput = {
    AND?: WeeklyCycleWhereInput | WeeklyCycleWhereInput[]
    OR?: WeeklyCycleWhereInput[]
    NOT?: WeeklyCycleWhereInput | WeeklyCycleWhereInput[]
    id?: StringFilter<"WeeklyCycle"> | string
    weekNumber?: IntFilter<"WeeklyCycle"> | number
    year?: IntFilter<"WeeklyCycle"> | number
    startDate?: DateTimeFilter<"WeeklyCycle"> | Date | string
    endDate?: DateTimeNullableFilter<"WeeklyCycle"> | Date | string | null
    isClosed?: BoolFilter<"WeeklyCycle"> | boolean
    userStats?: UserWeeklyStatsListRelationFilter
  }

  export type WeeklyCycleOrderByWithRelationInput = {
    id?: SortOrder
    weekNumber?: SortOrder
    year?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrderInput | SortOrder
    isClosed?: SortOrder
    userStats?: UserWeeklyStatsOrderByRelationAggregateInput
  }

  export type WeeklyCycleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: WeeklyCycleWhereInput | WeeklyCycleWhereInput[]
    OR?: WeeklyCycleWhereInput[]
    NOT?: WeeklyCycleWhereInput | WeeklyCycleWhereInput[]
    weekNumber?: IntFilter<"WeeklyCycle"> | number
    year?: IntFilter<"WeeklyCycle"> | number
    startDate?: DateTimeFilter<"WeeklyCycle"> | Date | string
    endDate?: DateTimeNullableFilter<"WeeklyCycle"> | Date | string | null
    isClosed?: BoolFilter<"WeeklyCycle"> | boolean
    userStats?: UserWeeklyStatsListRelationFilter
  }, "id">

  export type WeeklyCycleOrderByWithAggregationInput = {
    id?: SortOrder
    weekNumber?: SortOrder
    year?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrderInput | SortOrder
    isClosed?: SortOrder
    _count?: WeeklyCycleCountOrderByAggregateInput
    _avg?: WeeklyCycleAvgOrderByAggregateInput
    _max?: WeeklyCycleMaxOrderByAggregateInput
    _min?: WeeklyCycleMinOrderByAggregateInput
    _sum?: WeeklyCycleSumOrderByAggregateInput
  }

  export type WeeklyCycleScalarWhereWithAggregatesInput = {
    AND?: WeeklyCycleScalarWhereWithAggregatesInput | WeeklyCycleScalarWhereWithAggregatesInput[]
    OR?: WeeklyCycleScalarWhereWithAggregatesInput[]
    NOT?: WeeklyCycleScalarWhereWithAggregatesInput | WeeklyCycleScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WeeklyCycle"> | string
    weekNumber?: IntWithAggregatesFilter<"WeeklyCycle"> | number
    year?: IntWithAggregatesFilter<"WeeklyCycle"> | number
    startDate?: DateTimeWithAggregatesFilter<"WeeklyCycle"> | Date | string
    endDate?: DateTimeNullableWithAggregatesFilter<"WeeklyCycle"> | Date | string | null
    isClosed?: BoolWithAggregatesFilter<"WeeklyCycle"> | boolean
  }

  export type UserWeeklyStatsWhereInput = {
    AND?: UserWeeklyStatsWhereInput | UserWeeklyStatsWhereInput[]
    OR?: UserWeeklyStatsWhereInput[]
    NOT?: UserWeeklyStatsWhereInput | UserWeeklyStatsWhereInput[]
    id?: StringFilter<"UserWeeklyStats"> | string
    userId?: StringFilter<"UserWeeklyStats"> | string
    cycleId?: StringFilter<"UserWeeklyStats"> | string
    personalVolume?: DecimalFilter<"UserWeeklyStats"> | Decimal | DecimalJsLike | number | string
    teamVolume?: DecimalFilter<"UserWeeklyStats"> | Decimal | DecimalJsLike | number | string
    carryOverVolume?: DecimalFilter<"UserWeeklyStats"> | Decimal | DecimalJsLike | number | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    cycle?: XOR<WeeklyCycleRelationFilter, WeeklyCycleWhereInput>
  }

  export type UserWeeklyStatsOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    cycleId?: SortOrder
    personalVolume?: SortOrder
    teamVolume?: SortOrder
    carryOverVolume?: SortOrder
    user?: UserOrderByWithRelationInput
    cycle?: WeeklyCycleOrderByWithRelationInput
  }

  export type UserWeeklyStatsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId_cycleId?: UserWeeklyStatsUserIdCycleIdCompoundUniqueInput
    AND?: UserWeeklyStatsWhereInput | UserWeeklyStatsWhereInput[]
    OR?: UserWeeklyStatsWhereInput[]
    NOT?: UserWeeklyStatsWhereInput | UserWeeklyStatsWhereInput[]
    userId?: StringFilter<"UserWeeklyStats"> | string
    cycleId?: StringFilter<"UserWeeklyStats"> | string
    personalVolume?: DecimalFilter<"UserWeeklyStats"> | Decimal | DecimalJsLike | number | string
    teamVolume?: DecimalFilter<"UserWeeklyStats"> | Decimal | DecimalJsLike | number | string
    carryOverVolume?: DecimalFilter<"UserWeeklyStats"> | Decimal | DecimalJsLike | number | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    cycle?: XOR<WeeklyCycleRelationFilter, WeeklyCycleWhereInput>
  }, "id" | "userId_cycleId">

  export type UserWeeklyStatsOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    cycleId?: SortOrder
    personalVolume?: SortOrder
    teamVolume?: SortOrder
    carryOverVolume?: SortOrder
    _count?: UserWeeklyStatsCountOrderByAggregateInput
    _avg?: UserWeeklyStatsAvgOrderByAggregateInput
    _max?: UserWeeklyStatsMaxOrderByAggregateInput
    _min?: UserWeeklyStatsMinOrderByAggregateInput
    _sum?: UserWeeklyStatsSumOrderByAggregateInput
  }

  export type UserWeeklyStatsScalarWhereWithAggregatesInput = {
    AND?: UserWeeklyStatsScalarWhereWithAggregatesInput | UserWeeklyStatsScalarWhereWithAggregatesInput[]
    OR?: UserWeeklyStatsScalarWhereWithAggregatesInput[]
    NOT?: UserWeeklyStatsScalarWhereWithAggregatesInput | UserWeeklyStatsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"UserWeeklyStats"> | string
    userId?: StringWithAggregatesFilter<"UserWeeklyStats"> | string
    cycleId?: StringWithAggregatesFilter<"UserWeeklyStats"> | string
    personalVolume?: DecimalWithAggregatesFilter<"UserWeeklyStats"> | Decimal | DecimalJsLike | number | string
    teamVolume?: DecimalWithAggregatesFilter<"UserWeeklyStats"> | Decimal | DecimalJsLike | number | string
    carryOverVolume?: DecimalWithAggregatesFilter<"UserWeeklyStats"> | Decimal | DecimalJsLike | number | string
  }

  export type HeroSlideWhereInput = {
    AND?: HeroSlideWhereInput | HeroSlideWhereInput[]
    OR?: HeroSlideWhereInput[]
    NOT?: HeroSlideWhereInput | HeroSlideWhereInput[]
    id?: StringFilter<"HeroSlide"> | string
    title?: StringFilter<"HeroSlide"> | string
    subtitle?: StringNullableFilter<"HeroSlide"> | string | null
    buttonText?: StringNullableFilter<"HeroSlide"> | string | null
    buttonLink?: StringNullableFilter<"HeroSlide"> | string | null
    imageUrl?: StringFilter<"HeroSlide"> | string
    sortOrder?: IntFilter<"HeroSlide"> | number
    isActive?: BoolFilter<"HeroSlide"> | boolean
    createdAt?: DateTimeFilter<"HeroSlide"> | Date | string
  }

  export type HeroSlideOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    subtitle?: SortOrderInput | SortOrder
    buttonText?: SortOrderInput | SortOrder
    buttonLink?: SortOrderInput | SortOrder
    imageUrl?: SortOrder
    sortOrder?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
  }

  export type HeroSlideWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: HeroSlideWhereInput | HeroSlideWhereInput[]
    OR?: HeroSlideWhereInput[]
    NOT?: HeroSlideWhereInput | HeroSlideWhereInput[]
    title?: StringFilter<"HeroSlide"> | string
    subtitle?: StringNullableFilter<"HeroSlide"> | string | null
    buttonText?: StringNullableFilter<"HeroSlide"> | string | null
    buttonLink?: StringNullableFilter<"HeroSlide"> | string | null
    imageUrl?: StringFilter<"HeroSlide"> | string
    sortOrder?: IntFilter<"HeroSlide"> | number
    isActive?: BoolFilter<"HeroSlide"> | boolean
    createdAt?: DateTimeFilter<"HeroSlide"> | Date | string
  }, "id">

  export type HeroSlideOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    subtitle?: SortOrderInput | SortOrder
    buttonText?: SortOrderInput | SortOrder
    buttonLink?: SortOrderInput | SortOrder
    imageUrl?: SortOrder
    sortOrder?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    _count?: HeroSlideCountOrderByAggregateInput
    _avg?: HeroSlideAvgOrderByAggregateInput
    _max?: HeroSlideMaxOrderByAggregateInput
    _min?: HeroSlideMinOrderByAggregateInput
    _sum?: HeroSlideSumOrderByAggregateInput
  }

  export type HeroSlideScalarWhereWithAggregatesInput = {
    AND?: HeroSlideScalarWhereWithAggregatesInput | HeroSlideScalarWhereWithAggregatesInput[]
    OR?: HeroSlideScalarWhereWithAggregatesInput[]
    NOT?: HeroSlideScalarWhereWithAggregatesInput | HeroSlideScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"HeroSlide"> | string
    title?: StringWithAggregatesFilter<"HeroSlide"> | string
    subtitle?: StringNullableWithAggregatesFilter<"HeroSlide"> | string | null
    buttonText?: StringNullableWithAggregatesFilter<"HeroSlide"> | string | null
    buttonLink?: StringNullableWithAggregatesFilter<"HeroSlide"> | string | null
    imageUrl?: StringWithAggregatesFilter<"HeroSlide"> | string
    sortOrder?: IntWithAggregatesFilter<"HeroSlide"> | number
    isActive?: BoolWithAggregatesFilter<"HeroSlide"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"HeroSlide"> | Date | string
  }

  export type CategoryWhereInput = {
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    id?: StringFilter<"Category"> | string
    name?: StringFilter<"Category"> | string
    slug?: StringFilter<"Category"> | string
    iconEmoji?: StringNullableFilter<"Category"> | string | null
    imageUrl?: StringNullableFilter<"Category"> | string | null
    sortOrder?: IntFilter<"Category"> | number
    isActive?: BoolFilter<"Category"> | boolean
    products?: ProductListRelationFilter
  }

  export type CategoryOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    iconEmoji?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    sortOrder?: SortOrder
    isActive?: SortOrder
    products?: ProductOrderByRelationAggregateInput
  }

  export type CategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    slug?: string
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    iconEmoji?: StringNullableFilter<"Category"> | string | null
    imageUrl?: StringNullableFilter<"Category"> | string | null
    sortOrder?: IntFilter<"Category"> | number
    isActive?: BoolFilter<"Category"> | boolean
    products?: ProductListRelationFilter
  }, "id" | "name" | "slug">

  export type CategoryOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    iconEmoji?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    sortOrder?: SortOrder
    isActive?: SortOrder
    _count?: CategoryCountOrderByAggregateInput
    _avg?: CategoryAvgOrderByAggregateInput
    _max?: CategoryMaxOrderByAggregateInput
    _min?: CategoryMinOrderByAggregateInput
    _sum?: CategorySumOrderByAggregateInput
  }

  export type CategoryScalarWhereWithAggregatesInput = {
    AND?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    OR?: CategoryScalarWhereWithAggregatesInput[]
    NOT?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Category"> | string
    name?: StringWithAggregatesFilter<"Category"> | string
    slug?: StringWithAggregatesFilter<"Category"> | string
    iconEmoji?: StringNullableWithAggregatesFilter<"Category"> | string | null
    imageUrl?: StringNullableWithAggregatesFilter<"Category"> | string | null
    sortOrder?: IntWithAggregatesFilter<"Category"> | number
    isActive?: BoolWithAggregatesFilter<"Category"> | boolean
  }

  export type ProductImageWhereInput = {
    AND?: ProductImageWhereInput | ProductImageWhereInput[]
    OR?: ProductImageWhereInput[]
    NOT?: ProductImageWhereInput | ProductImageWhereInput[]
    id?: StringFilter<"ProductImage"> | string
    productId?: StringFilter<"ProductImage"> | string
    imageUrl?: StringFilter<"ProductImage"> | string
    sortOrder?: IntFilter<"ProductImage"> | number
    product?: XOR<ProductRelationFilter, ProductWhereInput>
  }

  export type ProductImageOrderByWithRelationInput = {
    id?: SortOrder
    productId?: SortOrder
    imageUrl?: SortOrder
    sortOrder?: SortOrder
    product?: ProductOrderByWithRelationInput
  }

  export type ProductImageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ProductImageWhereInput | ProductImageWhereInput[]
    OR?: ProductImageWhereInput[]
    NOT?: ProductImageWhereInput | ProductImageWhereInput[]
    productId?: StringFilter<"ProductImage"> | string
    imageUrl?: StringFilter<"ProductImage"> | string
    sortOrder?: IntFilter<"ProductImage"> | number
    product?: XOR<ProductRelationFilter, ProductWhereInput>
  }, "id">

  export type ProductImageOrderByWithAggregationInput = {
    id?: SortOrder
    productId?: SortOrder
    imageUrl?: SortOrder
    sortOrder?: SortOrder
    _count?: ProductImageCountOrderByAggregateInput
    _avg?: ProductImageAvgOrderByAggregateInput
    _max?: ProductImageMaxOrderByAggregateInput
    _min?: ProductImageMinOrderByAggregateInput
    _sum?: ProductImageSumOrderByAggregateInput
  }

  export type ProductImageScalarWhereWithAggregatesInput = {
    AND?: ProductImageScalarWhereWithAggregatesInput | ProductImageScalarWhereWithAggregatesInput[]
    OR?: ProductImageScalarWhereWithAggregatesInput[]
    NOT?: ProductImageScalarWhereWithAggregatesInput | ProductImageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ProductImage"> | string
    productId?: StringWithAggregatesFilter<"ProductImage"> | string
    imageUrl?: StringWithAggregatesFilter<"ProductImage"> | string
    sortOrder?: IntWithAggregatesFilter<"ProductImage"> | number
  }

  export type SiteSettingsWhereInput = {
    AND?: SiteSettingsWhereInput | SiteSettingsWhereInput[]
    OR?: SiteSettingsWhereInput[]
    NOT?: SiteSettingsWhereInput | SiteSettingsWhereInput[]
    id?: StringFilter<"SiteSettings"> | string
    companyName?: StringFilter<"SiteSettings"> | string
    logoUrl?: StringNullableFilter<"SiteSettings"> | string | null
    address?: StringNullableFilter<"SiteSettings"> | string | null
    phone?: StringNullableFilter<"SiteSettings"> | string | null
    email?: StringNullableFilter<"SiteSettings"> | string | null
    mapIframeCode?: StringNullableFilter<"SiteSettings"> | string | null
    topbarShippingMsg?: StringNullableFilter<"SiteSettings"> | string | null
    topbarPhone?: StringNullableFilter<"SiteSettings"> | string | null
    trustBadges?: JsonNullableFilter<"SiteSettings">
    partners?: JsonNullableFilter<"SiteSettings">
    footerLinks?: JsonNullableFilter<"SiteSettings">
    copyrightText?: StringNullableFilter<"SiteSettings"> | string | null
    updatedAt?: DateTimeFilter<"SiteSettings"> | Date | string
  }

  export type SiteSettingsOrderByWithRelationInput = {
    id?: SortOrder
    companyName?: SortOrder
    logoUrl?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    mapIframeCode?: SortOrderInput | SortOrder
    topbarShippingMsg?: SortOrderInput | SortOrder
    topbarPhone?: SortOrderInput | SortOrder
    trustBadges?: SortOrderInput | SortOrder
    partners?: SortOrderInput | SortOrder
    footerLinks?: SortOrderInput | SortOrder
    copyrightText?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
  }

  export type SiteSettingsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SiteSettingsWhereInput | SiteSettingsWhereInput[]
    OR?: SiteSettingsWhereInput[]
    NOT?: SiteSettingsWhereInput | SiteSettingsWhereInput[]
    companyName?: StringFilter<"SiteSettings"> | string
    logoUrl?: StringNullableFilter<"SiteSettings"> | string | null
    address?: StringNullableFilter<"SiteSettings"> | string | null
    phone?: StringNullableFilter<"SiteSettings"> | string | null
    email?: StringNullableFilter<"SiteSettings"> | string | null
    mapIframeCode?: StringNullableFilter<"SiteSettings"> | string | null
    topbarShippingMsg?: StringNullableFilter<"SiteSettings"> | string | null
    topbarPhone?: StringNullableFilter<"SiteSettings"> | string | null
    trustBadges?: JsonNullableFilter<"SiteSettings">
    partners?: JsonNullableFilter<"SiteSettings">
    footerLinks?: JsonNullableFilter<"SiteSettings">
    copyrightText?: StringNullableFilter<"SiteSettings"> | string | null
    updatedAt?: DateTimeFilter<"SiteSettings"> | Date | string
  }, "id">

  export type SiteSettingsOrderByWithAggregationInput = {
    id?: SortOrder
    companyName?: SortOrder
    logoUrl?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    mapIframeCode?: SortOrderInput | SortOrder
    topbarShippingMsg?: SortOrderInput | SortOrder
    topbarPhone?: SortOrderInput | SortOrder
    trustBadges?: SortOrderInput | SortOrder
    partners?: SortOrderInput | SortOrder
    footerLinks?: SortOrderInput | SortOrder
    copyrightText?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
    _count?: SiteSettingsCountOrderByAggregateInput
    _max?: SiteSettingsMaxOrderByAggregateInput
    _min?: SiteSettingsMinOrderByAggregateInput
  }

  export type SiteSettingsScalarWhereWithAggregatesInput = {
    AND?: SiteSettingsScalarWhereWithAggregatesInput | SiteSettingsScalarWhereWithAggregatesInput[]
    OR?: SiteSettingsScalarWhereWithAggregatesInput[]
    NOT?: SiteSettingsScalarWhereWithAggregatesInput | SiteSettingsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SiteSettings"> | string
    companyName?: StringWithAggregatesFilter<"SiteSettings"> | string
    logoUrl?: StringNullableWithAggregatesFilter<"SiteSettings"> | string | null
    address?: StringNullableWithAggregatesFilter<"SiteSettings"> | string | null
    phone?: StringNullableWithAggregatesFilter<"SiteSettings"> | string | null
    email?: StringNullableWithAggregatesFilter<"SiteSettings"> | string | null
    mapIframeCode?: StringNullableWithAggregatesFilter<"SiteSettings"> | string | null
    topbarShippingMsg?: StringNullableWithAggregatesFilter<"SiteSettings"> | string | null
    topbarPhone?: StringNullableWithAggregatesFilter<"SiteSettings"> | string | null
    trustBadges?: JsonNullableWithAggregatesFilter<"SiteSettings">
    partners?: JsonNullableWithAggregatesFilter<"SiteSettings">
    footerLinks?: JsonNullableWithAggregatesFilter<"SiteSettings">
    copyrightText?: StringNullableWithAggregatesFilter<"SiteSettings"> | string | null
    updatedAt?: DateTimeWithAggregatesFilter<"SiteSettings"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    role?: $Enums.Role
    name: string
    email: string
    passwordHash: string
    walletBalanceKgs?: Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    sponsor?: UserCreateNestedOneWithoutSponsoredUsersInput
    sponsoredUsers?: UserCreateNestedManyWithoutSponsorInput
    orders?: OrderCreateNestedManyWithoutUserInput
    transactions?: TransactionCreateNestedManyWithoutUserInput
    userWeeklyStats?: UserWeeklyStatsCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    role?: $Enums.Role
    sponsorId?: string | null
    name: string
    email: string
    passwordHash: string
    walletBalanceKgs?: Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    sponsoredUsers?: UserUncheckedCreateNestedManyWithoutSponsorInput
    orders?: OrderUncheckedCreateNestedManyWithoutUserInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutUserInput
    userWeeklyStats?: UserWeeklyStatsUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    walletBalanceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sponsor?: UserUpdateOneWithoutSponsoredUsersNestedInput
    sponsoredUsers?: UserUpdateManyWithoutSponsorNestedInput
    orders?: OrderUpdateManyWithoutUserNestedInput
    transactions?: TransactionUpdateManyWithoutUserNestedInput
    userWeeklyStats?: UserWeeklyStatsUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    sponsorId?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    walletBalanceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sponsoredUsers?: UserUncheckedUpdateManyWithoutSponsorNestedInput
    orders?: OrderUncheckedUpdateManyWithoutUserNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutUserNestedInput
    userWeeklyStats?: UserWeeklyStatsUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    role?: $Enums.Role
    sponsorId?: string | null
    name: string
    email: string
    passwordHash: string
    walletBalanceKgs?: Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    walletBalanceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    sponsorId?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    walletBalanceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductCreateInput = {
    id?: string
    barcode: string
    name: string
    description?: string | null
    basePriceKgs: Decimal | DecimalJsLike | number | string
    basePriceUsd: Decimal | DecimalJsLike | number | string
    stockQuantity?: number
    minStockAlert?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    category?: CategoryCreateNestedOneWithoutProductsInput
    priceRules?: PriceRuleCreateNestedManyWithoutProductInput
    orderItems?: OrderItemCreateNestedManyWithoutProductInput
    images?: ProductImageCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateInput = {
    id?: string
    barcode: string
    name: string
    description?: string | null
    basePriceKgs: Decimal | DecimalJsLike | number | string
    basePriceUsd: Decimal | DecimalJsLike | number | string
    stockQuantity?: number
    minStockAlert?: number
    categoryId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    priceRules?: PriceRuleUncheckedCreateNestedManyWithoutProductInput
    orderItems?: OrderItemUncheckedCreateNestedManyWithoutProductInput
    images?: ProductImageUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    barcode?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    basePriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFieldUpdateOperationsInput | number
    minStockAlert?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneWithoutProductsNestedInput
    priceRules?: PriceRuleUpdateManyWithoutProductNestedInput
    orderItems?: OrderItemUpdateManyWithoutProductNestedInput
    images?: ProductImageUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    barcode?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    basePriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFieldUpdateOperationsInput | number
    minStockAlert?: IntFieldUpdateOperationsInput | number
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    priceRules?: PriceRuleUncheckedUpdateManyWithoutProductNestedInput
    orderItems?: OrderItemUncheckedUpdateManyWithoutProductNestedInput
    images?: ProductImageUncheckedUpdateManyWithoutProductNestedInput
  }

  export type ProductCreateManyInput = {
    id?: string
    barcode: string
    name: string
    description?: string | null
    basePriceKgs: Decimal | DecimalJsLike | number | string
    basePriceUsd: Decimal | DecimalJsLike | number | string
    stockQuantity?: number
    minStockAlert?: number
    categoryId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProductUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    barcode?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    basePriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFieldUpdateOperationsInput | number
    minStockAlert?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    barcode?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    basePriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFieldUpdateOperationsInput | number
    minStockAlert?: IntFieldUpdateOperationsInput | number
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PriceRuleCreateInput = {
    id?: string
    role: $Enums.Role
    customPriceKgs: Decimal | DecimalJsLike | number | string
    product: ProductCreateNestedOneWithoutPriceRulesInput
  }

  export type PriceRuleUncheckedCreateInput = {
    id?: string
    productId: string
    role: $Enums.Role
    customPriceKgs: Decimal | DecimalJsLike | number | string
  }

  export type PriceRuleUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    customPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    product?: ProductUpdateOneRequiredWithoutPriceRulesNestedInput
  }

  export type PriceRuleUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    customPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type PriceRuleCreateManyInput = {
    id?: string
    productId: string
    role: $Enums.Role
    customPriceKgs: Decimal | DecimalJsLike | number | string
  }

  export type PriceRuleUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    customPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type PriceRuleUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    customPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type OrderCreateInput = {
    id?: string
    orderType: $Enums.OrderType
    status?: $Enums.OrderStatus
    totalKgs: Decimal | DecimalJsLike | number | string
    totalUsd: Decimal | DecimalJsLike | number | string
    paymentMethod: $Enums.PaymentMethod
    customerName?: string | null
    customerPhone?: string | null
    address?: string | null
    receiptImageUrl?: string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutOrdersInput
    items?: OrderItemCreateNestedManyWithoutOrderInput
  }

  export type OrderUncheckedCreateInput = {
    id?: string
    userId: string
    orderType: $Enums.OrderType
    status?: $Enums.OrderStatus
    totalKgs: Decimal | DecimalJsLike | number | string
    totalUsd: Decimal | DecimalJsLike | number | string
    paymentMethod: $Enums.PaymentMethod
    customerName?: string | null
    customerPhone?: string | null
    address?: string | null
    receiptImageUrl?: string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    items?: OrderItemUncheckedCreateNestedManyWithoutOrderInput
  }

  export type OrderUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderType?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    status?: EnumOrderStatusFieldUpdateOperationsInput | $Enums.OrderStatus
    totalKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    receiptImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutOrdersNestedInput
    items?: OrderItemUpdateManyWithoutOrderNestedInput
  }

  export type OrderUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderType?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    status?: EnumOrderStatusFieldUpdateOperationsInput | $Enums.OrderStatus
    totalKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    receiptImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: OrderItemUncheckedUpdateManyWithoutOrderNestedInput
  }

  export type OrderCreateManyInput = {
    id?: string
    userId: string
    orderType: $Enums.OrderType
    status?: $Enums.OrderStatus
    totalKgs: Decimal | DecimalJsLike | number | string
    totalUsd: Decimal | DecimalJsLike | number | string
    paymentMethod: $Enums.PaymentMethod
    customerName?: string | null
    customerPhone?: string | null
    address?: string | null
    receiptImageUrl?: string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type OrderUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderType?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    status?: EnumOrderStatusFieldUpdateOperationsInput | $Enums.OrderStatus
    totalKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    receiptImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OrderUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderType?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    status?: EnumOrderStatusFieldUpdateOperationsInput | $Enums.OrderStatus
    totalKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    receiptImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OrderItemCreateInput = {
    id?: string
    quantity: number
    unitPriceKgs: Decimal | DecimalJsLike | number | string
    totalPriceKgs: Decimal | DecimalJsLike | number | string
    order: OrderCreateNestedOneWithoutItemsInput
    product: ProductCreateNestedOneWithoutOrderItemsInput
  }

  export type OrderItemUncheckedCreateInput = {
    id?: string
    orderId: string
    productId: string
    quantity: number
    unitPriceKgs: Decimal | DecimalJsLike | number | string
    totalPriceKgs: Decimal | DecimalJsLike | number | string
  }

  export type OrderItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    order?: OrderUpdateOneRequiredWithoutItemsNestedInput
    product?: ProductUpdateOneRequiredWithoutOrderItemsNestedInput
  }

  export type OrderItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderId?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type OrderItemCreateManyInput = {
    id?: string
    orderId: string
    productId: string
    quantity: number
    unitPriceKgs: Decimal | DecimalJsLike | number | string
    totalPriceKgs: Decimal | DecimalJsLike | number | string
  }

  export type OrderItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type OrderItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderId?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type TransactionCreateInput = {
    id?: string
    type: $Enums.TransactionType
    amount: Decimal | DecimalJsLike | number | string
    currency: $Enums.Currency
    description?: string | null
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutTransactionsInput
  }

  export type TransactionUncheckedCreateInput = {
    id?: string
    userId: string
    type: $Enums.TransactionType
    amount: Decimal | DecimalJsLike | number | string
    currency: $Enums.Currency
    description?: string | null
    createdAt?: Date | string
  }

  export type TransactionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutTransactionsNestedInput
  }

  export type TransactionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionCreateManyInput = {
    id?: string
    userId: string
    type: $Enums.TransactionType
    amount: Decimal | DecimalJsLike | number | string
    currency: $Enums.Currency
    description?: string | null
    createdAt?: Date | string
  }

  export type TransactionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExchangeRateCreateInput = {
    id?: string
    currency?: string
    rateToKgs: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type ExchangeRateUncheckedCreateInput = {
    id?: string
    currency?: string
    rateToKgs: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type ExchangeRateUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    currency?: StringFieldUpdateOperationsInput | string
    rateToKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExchangeRateUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    currency?: StringFieldUpdateOperationsInput | string
    rateToKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExchangeRateCreateManyInput = {
    id?: string
    currency?: string
    rateToKgs: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type ExchangeRateUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    currency?: StringFieldUpdateOperationsInput | string
    rateToKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExchangeRateUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    currency?: StringFieldUpdateOperationsInput | string
    rateToKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SystemConfigCreateInput = {
    id?: string
    isMlmEnabled?: boolean
    maxPayoutLimitPct?: Decimal | DecimalJsLike | number | string
    isFastStartActive?: boolean
    fastStartRates?: JsonNullValueInput | InputJsonValue
    isUnilevelActive?: boolean
    unilevelRates?: JsonNullValueInput | InputJsonValue
    isOverdriveActive?: boolean
    overdrivePoolPct?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type SystemConfigUncheckedCreateInput = {
    id?: string
    isMlmEnabled?: boolean
    maxPayoutLimitPct?: Decimal | DecimalJsLike | number | string
    isFastStartActive?: boolean
    fastStartRates?: JsonNullValueInput | InputJsonValue
    isUnilevelActive?: boolean
    unilevelRates?: JsonNullValueInput | InputJsonValue
    isOverdriveActive?: boolean
    overdrivePoolPct?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type SystemConfigUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    isMlmEnabled?: BoolFieldUpdateOperationsInput | boolean
    maxPayoutLimitPct?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    isFastStartActive?: BoolFieldUpdateOperationsInput | boolean
    fastStartRates?: JsonNullValueInput | InputJsonValue
    isUnilevelActive?: BoolFieldUpdateOperationsInput | boolean
    unilevelRates?: JsonNullValueInput | InputJsonValue
    isOverdriveActive?: BoolFieldUpdateOperationsInput | boolean
    overdrivePoolPct?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SystemConfigUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    isMlmEnabled?: BoolFieldUpdateOperationsInput | boolean
    maxPayoutLimitPct?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    isFastStartActive?: BoolFieldUpdateOperationsInput | boolean
    fastStartRates?: JsonNullValueInput | InputJsonValue
    isUnilevelActive?: BoolFieldUpdateOperationsInput | boolean
    unilevelRates?: JsonNullValueInput | InputJsonValue
    isOverdriveActive?: BoolFieldUpdateOperationsInput | boolean
    overdrivePoolPct?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SystemConfigCreateManyInput = {
    id?: string
    isMlmEnabled?: boolean
    maxPayoutLimitPct?: Decimal | DecimalJsLike | number | string
    isFastStartActive?: boolean
    fastStartRates?: JsonNullValueInput | InputJsonValue
    isUnilevelActive?: boolean
    unilevelRates?: JsonNullValueInput | InputJsonValue
    isOverdriveActive?: boolean
    overdrivePoolPct?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type SystemConfigUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    isMlmEnabled?: BoolFieldUpdateOperationsInput | boolean
    maxPayoutLimitPct?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    isFastStartActive?: BoolFieldUpdateOperationsInput | boolean
    fastStartRates?: JsonNullValueInput | InputJsonValue
    isUnilevelActive?: BoolFieldUpdateOperationsInput | boolean
    unilevelRates?: JsonNullValueInput | InputJsonValue
    isOverdriveActive?: BoolFieldUpdateOperationsInput | boolean
    overdrivePoolPct?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SystemConfigUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    isMlmEnabled?: BoolFieldUpdateOperationsInput | boolean
    maxPayoutLimitPct?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    isFastStartActive?: BoolFieldUpdateOperationsInput | boolean
    fastStartRates?: JsonNullValueInput | InputJsonValue
    isUnilevelActive?: BoolFieldUpdateOperationsInput | boolean
    unilevelRates?: JsonNullValueInput | InputJsonValue
    isOverdriveActive?: BoolFieldUpdateOperationsInput | boolean
    overdrivePoolPct?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WeeklyCycleCreateInput = {
    id?: string
    weekNumber: number
    year: number
    startDate: Date | string
    endDate?: Date | string | null
    isClosed?: boolean
    userStats?: UserWeeklyStatsCreateNestedManyWithoutCycleInput
  }

  export type WeeklyCycleUncheckedCreateInput = {
    id?: string
    weekNumber: number
    year: number
    startDate: Date | string
    endDate?: Date | string | null
    isClosed?: boolean
    userStats?: UserWeeklyStatsUncheckedCreateNestedManyWithoutCycleInput
  }

  export type WeeklyCycleUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    weekNumber?: IntFieldUpdateOperationsInput | number
    year?: IntFieldUpdateOperationsInput | number
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isClosed?: BoolFieldUpdateOperationsInput | boolean
    userStats?: UserWeeklyStatsUpdateManyWithoutCycleNestedInput
  }

  export type WeeklyCycleUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    weekNumber?: IntFieldUpdateOperationsInput | number
    year?: IntFieldUpdateOperationsInput | number
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isClosed?: BoolFieldUpdateOperationsInput | boolean
    userStats?: UserWeeklyStatsUncheckedUpdateManyWithoutCycleNestedInput
  }

  export type WeeklyCycleCreateManyInput = {
    id?: string
    weekNumber: number
    year: number
    startDate: Date | string
    endDate?: Date | string | null
    isClosed?: boolean
  }

  export type WeeklyCycleUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    weekNumber?: IntFieldUpdateOperationsInput | number
    year?: IntFieldUpdateOperationsInput | number
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isClosed?: BoolFieldUpdateOperationsInput | boolean
  }

  export type WeeklyCycleUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    weekNumber?: IntFieldUpdateOperationsInput | number
    year?: IntFieldUpdateOperationsInput | number
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isClosed?: BoolFieldUpdateOperationsInput | boolean
  }

  export type UserWeeklyStatsCreateInput = {
    id?: string
    personalVolume?: Decimal | DecimalJsLike | number | string
    teamVolume?: Decimal | DecimalJsLike | number | string
    carryOverVolume?: Decimal | DecimalJsLike | number | string
    user: UserCreateNestedOneWithoutUserWeeklyStatsInput
    cycle: WeeklyCycleCreateNestedOneWithoutUserStatsInput
  }

  export type UserWeeklyStatsUncheckedCreateInput = {
    id?: string
    userId: string
    cycleId: string
    personalVolume?: Decimal | DecimalJsLike | number | string
    teamVolume?: Decimal | DecimalJsLike | number | string
    carryOverVolume?: Decimal | DecimalJsLike | number | string
  }

  export type UserWeeklyStatsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    personalVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    teamVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    carryOverVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    user?: UserUpdateOneRequiredWithoutUserWeeklyStatsNestedInput
    cycle?: WeeklyCycleUpdateOneRequiredWithoutUserStatsNestedInput
  }

  export type UserWeeklyStatsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    cycleId?: StringFieldUpdateOperationsInput | string
    personalVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    teamVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    carryOverVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type UserWeeklyStatsCreateManyInput = {
    id?: string
    userId: string
    cycleId: string
    personalVolume?: Decimal | DecimalJsLike | number | string
    teamVolume?: Decimal | DecimalJsLike | number | string
    carryOverVolume?: Decimal | DecimalJsLike | number | string
  }

  export type UserWeeklyStatsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    personalVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    teamVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    carryOverVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type UserWeeklyStatsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    cycleId?: StringFieldUpdateOperationsInput | string
    personalVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    teamVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    carryOverVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type HeroSlideCreateInput = {
    id?: string
    title: string
    subtitle?: string | null
    buttonText?: string | null
    buttonLink?: string | null
    imageUrl: string
    sortOrder?: number
    isActive?: boolean
    createdAt?: Date | string
  }

  export type HeroSlideUncheckedCreateInput = {
    id?: string
    title: string
    subtitle?: string | null
    buttonText?: string | null
    buttonLink?: string | null
    imageUrl: string
    sortOrder?: number
    isActive?: boolean
    createdAt?: Date | string
  }

  export type HeroSlideUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    subtitle?: NullableStringFieldUpdateOperationsInput | string | null
    buttonText?: NullableStringFieldUpdateOperationsInput | string | null
    buttonLink?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HeroSlideUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    subtitle?: NullableStringFieldUpdateOperationsInput | string | null
    buttonText?: NullableStringFieldUpdateOperationsInput | string | null
    buttonLink?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HeroSlideCreateManyInput = {
    id?: string
    title: string
    subtitle?: string | null
    buttonText?: string | null
    buttonLink?: string | null
    imageUrl: string
    sortOrder?: number
    isActive?: boolean
    createdAt?: Date | string
  }

  export type HeroSlideUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    subtitle?: NullableStringFieldUpdateOperationsInput | string | null
    buttonText?: NullableStringFieldUpdateOperationsInput | string | null
    buttonLink?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HeroSlideUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    subtitle?: NullableStringFieldUpdateOperationsInput | string | null
    buttonText?: NullableStringFieldUpdateOperationsInput | string | null
    buttonLink?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryCreateInput = {
    id?: string
    name: string
    slug: string
    iconEmoji?: string | null
    imageUrl?: string | null
    sortOrder?: number
    isActive?: boolean
    products?: ProductCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUncheckedCreateInput = {
    id?: string
    name: string
    slug: string
    iconEmoji?: string | null
    imageUrl?: string | null
    sortOrder?: number
    isActive?: boolean
    products?: ProductUncheckedCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    iconEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    products?: ProductUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    iconEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    products?: ProductUncheckedUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryCreateManyInput = {
    id?: string
    name: string
    slug: string
    iconEmoji?: string | null
    imageUrl?: string | null
    sortOrder?: number
    isActive?: boolean
  }

  export type CategoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    iconEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
  }

  export type CategoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    iconEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ProductImageCreateInput = {
    id?: string
    imageUrl: string
    sortOrder?: number
    product: ProductCreateNestedOneWithoutImagesInput
  }

  export type ProductImageUncheckedCreateInput = {
    id?: string
    productId: string
    imageUrl: string
    sortOrder?: number
  }

  export type ProductImageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    product?: ProductUpdateOneRequiredWithoutImagesNestedInput
  }

  export type ProductImageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type ProductImageCreateManyInput = {
    id?: string
    productId: string
    imageUrl: string
    sortOrder?: number
  }

  export type ProductImageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type ProductImageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type SiteSettingsCreateInput = {
    id?: string
    companyName?: string
    logoUrl?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    mapIframeCode?: string | null
    topbarShippingMsg?: string | null
    topbarPhone?: string | null
    trustBadges?: NullableJsonNullValueInput | InputJsonValue
    partners?: NullableJsonNullValueInput | InputJsonValue
    footerLinks?: NullableJsonNullValueInput | InputJsonValue
    copyrightText?: string | null
    updatedAt?: Date | string
  }

  export type SiteSettingsUncheckedCreateInput = {
    id?: string
    companyName?: string
    logoUrl?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    mapIframeCode?: string | null
    topbarShippingMsg?: string | null
    topbarPhone?: string | null
    trustBadges?: NullableJsonNullValueInput | InputJsonValue
    partners?: NullableJsonNullValueInput | InputJsonValue
    footerLinks?: NullableJsonNullValueInput | InputJsonValue
    copyrightText?: string | null
    updatedAt?: Date | string
  }

  export type SiteSettingsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyName?: StringFieldUpdateOperationsInput | string
    logoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    mapIframeCode?: NullableStringFieldUpdateOperationsInput | string | null
    topbarShippingMsg?: NullableStringFieldUpdateOperationsInput | string | null
    topbarPhone?: NullableStringFieldUpdateOperationsInput | string | null
    trustBadges?: NullableJsonNullValueInput | InputJsonValue
    partners?: NullableJsonNullValueInput | InputJsonValue
    footerLinks?: NullableJsonNullValueInput | InputJsonValue
    copyrightText?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SiteSettingsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyName?: StringFieldUpdateOperationsInput | string
    logoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    mapIframeCode?: NullableStringFieldUpdateOperationsInput | string | null
    topbarShippingMsg?: NullableStringFieldUpdateOperationsInput | string | null
    topbarPhone?: NullableStringFieldUpdateOperationsInput | string | null
    trustBadges?: NullableJsonNullValueInput | InputJsonValue
    partners?: NullableJsonNullValueInput | InputJsonValue
    footerLinks?: NullableJsonNullValueInput | InputJsonValue
    copyrightText?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SiteSettingsCreateManyInput = {
    id?: string
    companyName?: string
    logoUrl?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    mapIframeCode?: string | null
    topbarShippingMsg?: string | null
    topbarPhone?: string | null
    trustBadges?: NullableJsonNullValueInput | InputJsonValue
    partners?: NullableJsonNullValueInput | InputJsonValue
    footerLinks?: NullableJsonNullValueInput | InputJsonValue
    copyrightText?: string | null
    updatedAt?: Date | string
  }

  export type SiteSettingsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyName?: StringFieldUpdateOperationsInput | string
    logoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    mapIframeCode?: NullableStringFieldUpdateOperationsInput | string | null
    topbarShippingMsg?: NullableStringFieldUpdateOperationsInput | string | null
    topbarPhone?: NullableStringFieldUpdateOperationsInput | string | null
    trustBadges?: NullableJsonNullValueInput | InputJsonValue
    partners?: NullableJsonNullValueInput | InputJsonValue
    footerLinks?: NullableJsonNullValueInput | InputJsonValue
    copyrightText?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SiteSettingsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    companyName?: StringFieldUpdateOperationsInput | string
    logoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    mapIframeCode?: NullableStringFieldUpdateOperationsInput | string | null
    topbarShippingMsg?: NullableStringFieldUpdateOperationsInput | string | null
    topbarPhone?: NullableStringFieldUpdateOperationsInput | string | null
    trustBadges?: NullableJsonNullValueInput | InputJsonValue
    partners?: NullableJsonNullValueInput | InputJsonValue
    footerLinks?: NullableJsonNullValueInput | InputJsonValue
    copyrightText?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type UserNullableRelationFilter = {
    is?: UserWhereInput | null
    isNot?: UserWhereInput | null
  }

  export type UserListRelationFilter = {
    every?: UserWhereInput
    some?: UserWhereInput
    none?: UserWhereInput
  }

  export type OrderListRelationFilter = {
    every?: OrderWhereInput
    some?: OrderWhereInput
    none?: OrderWhereInput
  }

  export type TransactionListRelationFilter = {
    every?: TransactionWhereInput
    some?: TransactionWhereInput
    none?: TransactionWhereInput
  }

  export type UserWeeklyStatsListRelationFilter = {
    every?: UserWeeklyStatsWhereInput
    some?: UserWeeklyStatsWhereInput
    none?: UserWeeklyStatsWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type UserOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type OrderOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TransactionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserWeeklyStatsOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    role?: SortOrder
    sponsorId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    walletBalanceKgs?: SortOrder
    walletBalanceUsd?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    walletBalanceKgs?: SortOrder
    walletBalanceUsd?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    role?: SortOrder
    sponsorId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    walletBalanceKgs?: SortOrder
    walletBalanceUsd?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    role?: SortOrder
    sponsorId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    walletBalanceKgs?: SortOrder
    walletBalanceUsd?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    walletBalanceKgs?: SortOrder
    walletBalanceUsd?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type CategoryNullableRelationFilter = {
    is?: CategoryWhereInput | null
    isNot?: CategoryWhereInput | null
  }

  export type PriceRuleListRelationFilter = {
    every?: PriceRuleWhereInput
    some?: PriceRuleWhereInput
    none?: PriceRuleWhereInput
  }

  export type OrderItemListRelationFilter = {
    every?: OrderItemWhereInput
    some?: OrderItemWhereInput
    none?: OrderItemWhereInput
  }

  export type ProductImageListRelationFilter = {
    every?: ProductImageWhereInput
    some?: ProductImageWhereInput
    none?: ProductImageWhereInput
  }

  export type PriceRuleOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type OrderItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ProductImageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ProductCountOrderByAggregateInput = {
    id?: SortOrder
    barcode?: SortOrder
    name?: SortOrder
    description?: SortOrder
    basePriceKgs?: SortOrder
    basePriceUsd?: SortOrder
    stockQuantity?: SortOrder
    minStockAlert?: SortOrder
    categoryId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProductAvgOrderByAggregateInput = {
    basePriceKgs?: SortOrder
    basePriceUsd?: SortOrder
    stockQuantity?: SortOrder
    minStockAlert?: SortOrder
  }

  export type ProductMaxOrderByAggregateInput = {
    id?: SortOrder
    barcode?: SortOrder
    name?: SortOrder
    description?: SortOrder
    basePriceKgs?: SortOrder
    basePriceUsd?: SortOrder
    stockQuantity?: SortOrder
    minStockAlert?: SortOrder
    categoryId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProductMinOrderByAggregateInput = {
    id?: SortOrder
    barcode?: SortOrder
    name?: SortOrder
    description?: SortOrder
    basePriceKgs?: SortOrder
    basePriceUsd?: SortOrder
    stockQuantity?: SortOrder
    minStockAlert?: SortOrder
    categoryId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProductSumOrderByAggregateInput = {
    basePriceKgs?: SortOrder
    basePriceUsd?: SortOrder
    stockQuantity?: SortOrder
    minStockAlert?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type ProductRelationFilter = {
    is?: ProductWhereInput
    isNot?: ProductWhereInput
  }

  export type PriceRuleProductIdRoleCompoundUniqueInput = {
    productId: string
    role: $Enums.Role
  }

  export type PriceRuleCountOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    role?: SortOrder
    customPriceKgs?: SortOrder
  }

  export type PriceRuleAvgOrderByAggregateInput = {
    customPriceKgs?: SortOrder
  }

  export type PriceRuleMaxOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    role?: SortOrder
    customPriceKgs?: SortOrder
  }

  export type PriceRuleMinOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    role?: SortOrder
    customPriceKgs?: SortOrder
  }

  export type PriceRuleSumOrderByAggregateInput = {
    customPriceKgs?: SortOrder
  }

  export type EnumOrderTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.OrderType | EnumOrderTypeFieldRefInput<$PrismaModel>
    in?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumOrderTypeFilter<$PrismaModel> | $Enums.OrderType
  }

  export type EnumOrderStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.OrderStatus | EnumOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.OrderStatus[] | ListEnumOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.OrderStatus[] | ListEnumOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumOrderStatusFilter<$PrismaModel> | $Enums.OrderStatus
  }

  export type EnumPaymentMethodFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentMethod | EnumPaymentMethodFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentMethodFilter<$PrismaModel> | $Enums.PaymentMethod
  }
  export type JsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type UserRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type OrderCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    orderType?: SortOrder
    status?: SortOrder
    totalKgs?: SortOrder
    totalUsd?: SortOrder
    paymentMethod?: SortOrder
    customerName?: SortOrder
    customerPhone?: SortOrder
    address?: SortOrder
    receiptImageUrl?: SortOrder
    ocrResult?: SortOrder
    verifiedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type OrderAvgOrderByAggregateInput = {
    totalKgs?: SortOrder
    totalUsd?: SortOrder
  }

  export type OrderMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    orderType?: SortOrder
    status?: SortOrder
    totalKgs?: SortOrder
    totalUsd?: SortOrder
    paymentMethod?: SortOrder
    customerName?: SortOrder
    customerPhone?: SortOrder
    address?: SortOrder
    receiptImageUrl?: SortOrder
    verifiedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type OrderMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    orderType?: SortOrder
    status?: SortOrder
    totalKgs?: SortOrder
    totalUsd?: SortOrder
    paymentMethod?: SortOrder
    customerName?: SortOrder
    customerPhone?: SortOrder
    address?: SortOrder
    receiptImageUrl?: SortOrder
    verifiedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type OrderSumOrderByAggregateInput = {
    totalKgs?: SortOrder
    totalUsd?: SortOrder
  }

  export type EnumOrderTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.OrderType | EnumOrderTypeFieldRefInput<$PrismaModel>
    in?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumOrderTypeWithAggregatesFilter<$PrismaModel> | $Enums.OrderType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumOrderTypeFilter<$PrismaModel>
    _max?: NestedEnumOrderTypeFilter<$PrismaModel>
  }

  export type EnumOrderStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.OrderStatus | EnumOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.OrderStatus[] | ListEnumOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.OrderStatus[] | ListEnumOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumOrderStatusWithAggregatesFilter<$PrismaModel> | $Enums.OrderStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumOrderStatusFilter<$PrismaModel>
    _max?: NestedEnumOrderStatusFilter<$PrismaModel>
  }

  export type EnumPaymentMethodWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentMethod | EnumPaymentMethodFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentMethodWithAggregatesFilter<$PrismaModel> | $Enums.PaymentMethod
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentMethodFilter<$PrismaModel>
    _max?: NestedEnumPaymentMethodFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type OrderRelationFilter = {
    is?: OrderWhereInput
    isNot?: OrderWhereInput
  }

  export type OrderItemCountOrderByAggregateInput = {
    id?: SortOrder
    orderId?: SortOrder
    productId?: SortOrder
    quantity?: SortOrder
    unitPriceKgs?: SortOrder
    totalPriceKgs?: SortOrder
  }

  export type OrderItemAvgOrderByAggregateInput = {
    quantity?: SortOrder
    unitPriceKgs?: SortOrder
    totalPriceKgs?: SortOrder
  }

  export type OrderItemMaxOrderByAggregateInput = {
    id?: SortOrder
    orderId?: SortOrder
    productId?: SortOrder
    quantity?: SortOrder
    unitPriceKgs?: SortOrder
    totalPriceKgs?: SortOrder
  }

  export type OrderItemMinOrderByAggregateInput = {
    id?: SortOrder
    orderId?: SortOrder
    productId?: SortOrder
    quantity?: SortOrder
    unitPriceKgs?: SortOrder
    totalPriceKgs?: SortOrder
  }

  export type OrderItemSumOrderByAggregateInput = {
    quantity?: SortOrder
    unitPriceKgs?: SortOrder
    totalPriceKgs?: SortOrder
  }

  export type EnumTransactionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeFilter<$PrismaModel> | $Enums.TransactionType
  }

  export type EnumCurrencyFilter<$PrismaModel = never> = {
    equals?: $Enums.Currency | EnumCurrencyFieldRefInput<$PrismaModel>
    in?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    notIn?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    not?: NestedEnumCurrencyFilter<$PrismaModel> | $Enums.Currency
  }

  export type TransactionCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    description?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type TransactionMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    description?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    description?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type EnumTransactionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeWithAggregatesFilter<$PrismaModel> | $Enums.TransactionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTransactionTypeFilter<$PrismaModel>
    _max?: NestedEnumTransactionTypeFilter<$PrismaModel>
  }

  export type EnumCurrencyWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Currency | EnumCurrencyFieldRefInput<$PrismaModel>
    in?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    notIn?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    not?: NestedEnumCurrencyWithAggregatesFilter<$PrismaModel> | $Enums.Currency
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCurrencyFilter<$PrismaModel>
    _max?: NestedEnumCurrencyFilter<$PrismaModel>
  }

  export type ExchangeRateCountOrderByAggregateInput = {
    id?: SortOrder
    currency?: SortOrder
    rateToKgs?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExchangeRateAvgOrderByAggregateInput = {
    rateToKgs?: SortOrder
  }

  export type ExchangeRateMaxOrderByAggregateInput = {
    id?: SortOrder
    currency?: SortOrder
    rateToKgs?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExchangeRateMinOrderByAggregateInput = {
    id?: SortOrder
    currency?: SortOrder
    rateToKgs?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExchangeRateSumOrderByAggregateInput = {
    rateToKgs?: SortOrder
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type SystemConfigCountOrderByAggregateInput = {
    id?: SortOrder
    isMlmEnabled?: SortOrder
    maxPayoutLimitPct?: SortOrder
    isFastStartActive?: SortOrder
    fastStartRates?: SortOrder
    isUnilevelActive?: SortOrder
    unilevelRates?: SortOrder
    isOverdriveActive?: SortOrder
    overdrivePoolPct?: SortOrder
    updatedAt?: SortOrder
  }

  export type SystemConfigAvgOrderByAggregateInput = {
    maxPayoutLimitPct?: SortOrder
    overdrivePoolPct?: SortOrder
  }

  export type SystemConfigMaxOrderByAggregateInput = {
    id?: SortOrder
    isMlmEnabled?: SortOrder
    maxPayoutLimitPct?: SortOrder
    isFastStartActive?: SortOrder
    isUnilevelActive?: SortOrder
    isOverdriveActive?: SortOrder
    overdrivePoolPct?: SortOrder
    updatedAt?: SortOrder
  }

  export type SystemConfigMinOrderByAggregateInput = {
    id?: SortOrder
    isMlmEnabled?: SortOrder
    maxPayoutLimitPct?: SortOrder
    isFastStartActive?: SortOrder
    isUnilevelActive?: SortOrder
    isOverdriveActive?: SortOrder
    overdrivePoolPct?: SortOrder
    updatedAt?: SortOrder
  }

  export type SystemConfigSumOrderByAggregateInput = {
    maxPayoutLimitPct?: SortOrder
    overdrivePoolPct?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type WeeklyCycleCountOrderByAggregateInput = {
    id?: SortOrder
    weekNumber?: SortOrder
    year?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    isClosed?: SortOrder
  }

  export type WeeklyCycleAvgOrderByAggregateInput = {
    weekNumber?: SortOrder
    year?: SortOrder
  }

  export type WeeklyCycleMaxOrderByAggregateInput = {
    id?: SortOrder
    weekNumber?: SortOrder
    year?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    isClosed?: SortOrder
  }

  export type WeeklyCycleMinOrderByAggregateInput = {
    id?: SortOrder
    weekNumber?: SortOrder
    year?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    isClosed?: SortOrder
  }

  export type WeeklyCycleSumOrderByAggregateInput = {
    weekNumber?: SortOrder
    year?: SortOrder
  }

  export type WeeklyCycleRelationFilter = {
    is?: WeeklyCycleWhereInput
    isNot?: WeeklyCycleWhereInput
  }

  export type UserWeeklyStatsUserIdCycleIdCompoundUniqueInput = {
    userId: string
    cycleId: string
  }

  export type UserWeeklyStatsCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    cycleId?: SortOrder
    personalVolume?: SortOrder
    teamVolume?: SortOrder
    carryOverVolume?: SortOrder
  }

  export type UserWeeklyStatsAvgOrderByAggregateInput = {
    personalVolume?: SortOrder
    teamVolume?: SortOrder
    carryOverVolume?: SortOrder
  }

  export type UserWeeklyStatsMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    cycleId?: SortOrder
    personalVolume?: SortOrder
    teamVolume?: SortOrder
    carryOverVolume?: SortOrder
  }

  export type UserWeeklyStatsMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    cycleId?: SortOrder
    personalVolume?: SortOrder
    teamVolume?: SortOrder
    carryOverVolume?: SortOrder
  }

  export type UserWeeklyStatsSumOrderByAggregateInput = {
    personalVolume?: SortOrder
    teamVolume?: SortOrder
    carryOverVolume?: SortOrder
  }

  export type HeroSlideCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    subtitle?: SortOrder
    buttonText?: SortOrder
    buttonLink?: SortOrder
    imageUrl?: SortOrder
    sortOrder?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
  }

  export type HeroSlideAvgOrderByAggregateInput = {
    sortOrder?: SortOrder
  }

  export type HeroSlideMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    subtitle?: SortOrder
    buttonText?: SortOrder
    buttonLink?: SortOrder
    imageUrl?: SortOrder
    sortOrder?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
  }

  export type HeroSlideMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    subtitle?: SortOrder
    buttonText?: SortOrder
    buttonLink?: SortOrder
    imageUrl?: SortOrder
    sortOrder?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
  }

  export type HeroSlideSumOrderByAggregateInput = {
    sortOrder?: SortOrder
  }

  export type ProductListRelationFilter = {
    every?: ProductWhereInput
    some?: ProductWhereInput
    none?: ProductWhereInput
  }

  export type ProductOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CategoryCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    iconEmoji?: SortOrder
    imageUrl?: SortOrder
    sortOrder?: SortOrder
    isActive?: SortOrder
  }

  export type CategoryAvgOrderByAggregateInput = {
    sortOrder?: SortOrder
  }

  export type CategoryMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    iconEmoji?: SortOrder
    imageUrl?: SortOrder
    sortOrder?: SortOrder
    isActive?: SortOrder
  }

  export type CategoryMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    iconEmoji?: SortOrder
    imageUrl?: SortOrder
    sortOrder?: SortOrder
    isActive?: SortOrder
  }

  export type CategorySumOrderByAggregateInput = {
    sortOrder?: SortOrder
  }

  export type ProductImageCountOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    imageUrl?: SortOrder
    sortOrder?: SortOrder
  }

  export type ProductImageAvgOrderByAggregateInput = {
    sortOrder?: SortOrder
  }

  export type ProductImageMaxOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    imageUrl?: SortOrder
    sortOrder?: SortOrder
  }

  export type ProductImageMinOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    imageUrl?: SortOrder
    sortOrder?: SortOrder
  }

  export type ProductImageSumOrderByAggregateInput = {
    sortOrder?: SortOrder
  }

  export type SiteSettingsCountOrderByAggregateInput = {
    id?: SortOrder
    companyName?: SortOrder
    logoUrl?: SortOrder
    address?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    mapIframeCode?: SortOrder
    topbarShippingMsg?: SortOrder
    topbarPhone?: SortOrder
    trustBadges?: SortOrder
    partners?: SortOrder
    footerLinks?: SortOrder
    copyrightText?: SortOrder
    updatedAt?: SortOrder
  }

  export type SiteSettingsMaxOrderByAggregateInput = {
    id?: SortOrder
    companyName?: SortOrder
    logoUrl?: SortOrder
    address?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    mapIframeCode?: SortOrder
    topbarShippingMsg?: SortOrder
    topbarPhone?: SortOrder
    copyrightText?: SortOrder
    updatedAt?: SortOrder
  }

  export type SiteSettingsMinOrderByAggregateInput = {
    id?: SortOrder
    companyName?: SortOrder
    logoUrl?: SortOrder
    address?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    mapIframeCode?: SortOrder
    topbarShippingMsg?: SortOrder
    topbarPhone?: SortOrder
    copyrightText?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserCreateNestedOneWithoutSponsoredUsersInput = {
    create?: XOR<UserCreateWithoutSponsoredUsersInput, UserUncheckedCreateWithoutSponsoredUsersInput>
    connectOrCreate?: UserCreateOrConnectWithoutSponsoredUsersInput
    connect?: UserWhereUniqueInput
  }

  export type UserCreateNestedManyWithoutSponsorInput = {
    create?: XOR<UserCreateWithoutSponsorInput, UserUncheckedCreateWithoutSponsorInput> | UserCreateWithoutSponsorInput[] | UserUncheckedCreateWithoutSponsorInput[]
    connectOrCreate?: UserCreateOrConnectWithoutSponsorInput | UserCreateOrConnectWithoutSponsorInput[]
    createMany?: UserCreateManySponsorInputEnvelope
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type OrderCreateNestedManyWithoutUserInput = {
    create?: XOR<OrderCreateWithoutUserInput, OrderUncheckedCreateWithoutUserInput> | OrderCreateWithoutUserInput[] | OrderUncheckedCreateWithoutUserInput[]
    connectOrCreate?: OrderCreateOrConnectWithoutUserInput | OrderCreateOrConnectWithoutUserInput[]
    createMany?: OrderCreateManyUserInputEnvelope
    connect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
  }

  export type TransactionCreateNestedManyWithoutUserInput = {
    create?: XOR<TransactionCreateWithoutUserInput, TransactionUncheckedCreateWithoutUserInput> | TransactionCreateWithoutUserInput[] | TransactionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutUserInput | TransactionCreateOrConnectWithoutUserInput[]
    createMany?: TransactionCreateManyUserInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type UserWeeklyStatsCreateNestedManyWithoutUserInput = {
    create?: XOR<UserWeeklyStatsCreateWithoutUserInput, UserWeeklyStatsUncheckedCreateWithoutUserInput> | UserWeeklyStatsCreateWithoutUserInput[] | UserWeeklyStatsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserWeeklyStatsCreateOrConnectWithoutUserInput | UserWeeklyStatsCreateOrConnectWithoutUserInput[]
    createMany?: UserWeeklyStatsCreateManyUserInputEnvelope
    connect?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
  }

  export type UserUncheckedCreateNestedManyWithoutSponsorInput = {
    create?: XOR<UserCreateWithoutSponsorInput, UserUncheckedCreateWithoutSponsorInput> | UserCreateWithoutSponsorInput[] | UserUncheckedCreateWithoutSponsorInput[]
    connectOrCreate?: UserCreateOrConnectWithoutSponsorInput | UserCreateOrConnectWithoutSponsorInput[]
    createMany?: UserCreateManySponsorInputEnvelope
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type OrderUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<OrderCreateWithoutUserInput, OrderUncheckedCreateWithoutUserInput> | OrderCreateWithoutUserInput[] | OrderUncheckedCreateWithoutUserInput[]
    connectOrCreate?: OrderCreateOrConnectWithoutUserInput | OrderCreateOrConnectWithoutUserInput[]
    createMany?: OrderCreateManyUserInputEnvelope
    connect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
  }

  export type TransactionUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<TransactionCreateWithoutUserInput, TransactionUncheckedCreateWithoutUserInput> | TransactionCreateWithoutUserInput[] | TransactionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutUserInput | TransactionCreateOrConnectWithoutUserInput[]
    createMany?: TransactionCreateManyUserInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type UserWeeklyStatsUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<UserWeeklyStatsCreateWithoutUserInput, UserWeeklyStatsUncheckedCreateWithoutUserInput> | UserWeeklyStatsCreateWithoutUserInput[] | UserWeeklyStatsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserWeeklyStatsCreateOrConnectWithoutUserInput | UserWeeklyStatsCreateOrConnectWithoutUserInput[]
    createMany?: UserWeeklyStatsCreateManyUserInputEnvelope
    connect?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type UserUpdateOneWithoutSponsoredUsersNestedInput = {
    create?: XOR<UserCreateWithoutSponsoredUsersInput, UserUncheckedCreateWithoutSponsoredUsersInput>
    connectOrCreate?: UserCreateOrConnectWithoutSponsoredUsersInput
    upsert?: UserUpsertWithoutSponsoredUsersInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSponsoredUsersInput, UserUpdateWithoutSponsoredUsersInput>, UserUncheckedUpdateWithoutSponsoredUsersInput>
  }

  export type UserUpdateManyWithoutSponsorNestedInput = {
    create?: XOR<UserCreateWithoutSponsorInput, UserUncheckedCreateWithoutSponsorInput> | UserCreateWithoutSponsorInput[] | UserUncheckedCreateWithoutSponsorInput[]
    connectOrCreate?: UserCreateOrConnectWithoutSponsorInput | UserCreateOrConnectWithoutSponsorInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutSponsorInput | UserUpsertWithWhereUniqueWithoutSponsorInput[]
    createMany?: UserCreateManySponsorInputEnvelope
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutSponsorInput | UserUpdateWithWhereUniqueWithoutSponsorInput[]
    updateMany?: UserUpdateManyWithWhereWithoutSponsorInput | UserUpdateManyWithWhereWithoutSponsorInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type OrderUpdateManyWithoutUserNestedInput = {
    create?: XOR<OrderCreateWithoutUserInput, OrderUncheckedCreateWithoutUserInput> | OrderCreateWithoutUserInput[] | OrderUncheckedCreateWithoutUserInput[]
    connectOrCreate?: OrderCreateOrConnectWithoutUserInput | OrderCreateOrConnectWithoutUserInput[]
    upsert?: OrderUpsertWithWhereUniqueWithoutUserInput | OrderUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: OrderCreateManyUserInputEnvelope
    set?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    disconnect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    delete?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    connect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    update?: OrderUpdateWithWhereUniqueWithoutUserInput | OrderUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: OrderUpdateManyWithWhereWithoutUserInput | OrderUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: OrderScalarWhereInput | OrderScalarWhereInput[]
  }

  export type TransactionUpdateManyWithoutUserNestedInput = {
    create?: XOR<TransactionCreateWithoutUserInput, TransactionUncheckedCreateWithoutUserInput> | TransactionCreateWithoutUserInput[] | TransactionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutUserInput | TransactionCreateOrConnectWithoutUserInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutUserInput | TransactionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: TransactionCreateManyUserInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutUserInput | TransactionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutUserInput | TransactionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type UserWeeklyStatsUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserWeeklyStatsCreateWithoutUserInput, UserWeeklyStatsUncheckedCreateWithoutUserInput> | UserWeeklyStatsCreateWithoutUserInput[] | UserWeeklyStatsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserWeeklyStatsCreateOrConnectWithoutUserInput | UserWeeklyStatsCreateOrConnectWithoutUserInput[]
    upsert?: UserWeeklyStatsUpsertWithWhereUniqueWithoutUserInput | UserWeeklyStatsUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserWeeklyStatsCreateManyUserInputEnvelope
    set?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    disconnect?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    delete?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    connect?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    update?: UserWeeklyStatsUpdateWithWhereUniqueWithoutUserInput | UserWeeklyStatsUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserWeeklyStatsUpdateManyWithWhereWithoutUserInput | UserWeeklyStatsUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserWeeklyStatsScalarWhereInput | UserWeeklyStatsScalarWhereInput[]
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type UserUncheckedUpdateManyWithoutSponsorNestedInput = {
    create?: XOR<UserCreateWithoutSponsorInput, UserUncheckedCreateWithoutSponsorInput> | UserCreateWithoutSponsorInput[] | UserUncheckedCreateWithoutSponsorInput[]
    connectOrCreate?: UserCreateOrConnectWithoutSponsorInput | UserCreateOrConnectWithoutSponsorInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutSponsorInput | UserUpsertWithWhereUniqueWithoutSponsorInput[]
    createMany?: UserCreateManySponsorInputEnvelope
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutSponsorInput | UserUpdateWithWhereUniqueWithoutSponsorInput[]
    updateMany?: UserUpdateManyWithWhereWithoutSponsorInput | UserUpdateManyWithWhereWithoutSponsorInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type OrderUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<OrderCreateWithoutUserInput, OrderUncheckedCreateWithoutUserInput> | OrderCreateWithoutUserInput[] | OrderUncheckedCreateWithoutUserInput[]
    connectOrCreate?: OrderCreateOrConnectWithoutUserInput | OrderCreateOrConnectWithoutUserInput[]
    upsert?: OrderUpsertWithWhereUniqueWithoutUserInput | OrderUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: OrderCreateManyUserInputEnvelope
    set?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    disconnect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    delete?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    connect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    update?: OrderUpdateWithWhereUniqueWithoutUserInput | OrderUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: OrderUpdateManyWithWhereWithoutUserInput | OrderUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: OrderScalarWhereInput | OrderScalarWhereInput[]
  }

  export type TransactionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<TransactionCreateWithoutUserInput, TransactionUncheckedCreateWithoutUserInput> | TransactionCreateWithoutUserInput[] | TransactionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutUserInput | TransactionCreateOrConnectWithoutUserInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutUserInput | TransactionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: TransactionCreateManyUserInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutUserInput | TransactionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutUserInput | TransactionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type UserWeeklyStatsUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserWeeklyStatsCreateWithoutUserInput, UserWeeklyStatsUncheckedCreateWithoutUserInput> | UserWeeklyStatsCreateWithoutUserInput[] | UserWeeklyStatsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserWeeklyStatsCreateOrConnectWithoutUserInput | UserWeeklyStatsCreateOrConnectWithoutUserInput[]
    upsert?: UserWeeklyStatsUpsertWithWhereUniqueWithoutUserInput | UserWeeklyStatsUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserWeeklyStatsCreateManyUserInputEnvelope
    set?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    disconnect?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    delete?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    connect?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    update?: UserWeeklyStatsUpdateWithWhereUniqueWithoutUserInput | UserWeeklyStatsUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserWeeklyStatsUpdateManyWithWhereWithoutUserInput | UserWeeklyStatsUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserWeeklyStatsScalarWhereInput | UserWeeklyStatsScalarWhereInput[]
  }

  export type CategoryCreateNestedOneWithoutProductsInput = {
    create?: XOR<CategoryCreateWithoutProductsInput, CategoryUncheckedCreateWithoutProductsInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutProductsInput
    connect?: CategoryWhereUniqueInput
  }

  export type PriceRuleCreateNestedManyWithoutProductInput = {
    create?: XOR<PriceRuleCreateWithoutProductInput, PriceRuleUncheckedCreateWithoutProductInput> | PriceRuleCreateWithoutProductInput[] | PriceRuleUncheckedCreateWithoutProductInput[]
    connectOrCreate?: PriceRuleCreateOrConnectWithoutProductInput | PriceRuleCreateOrConnectWithoutProductInput[]
    createMany?: PriceRuleCreateManyProductInputEnvelope
    connect?: PriceRuleWhereUniqueInput | PriceRuleWhereUniqueInput[]
  }

  export type OrderItemCreateNestedManyWithoutProductInput = {
    create?: XOR<OrderItemCreateWithoutProductInput, OrderItemUncheckedCreateWithoutProductInput> | OrderItemCreateWithoutProductInput[] | OrderItemUncheckedCreateWithoutProductInput[]
    connectOrCreate?: OrderItemCreateOrConnectWithoutProductInput | OrderItemCreateOrConnectWithoutProductInput[]
    createMany?: OrderItemCreateManyProductInputEnvelope
    connect?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
  }

  export type ProductImageCreateNestedManyWithoutProductInput = {
    create?: XOR<ProductImageCreateWithoutProductInput, ProductImageUncheckedCreateWithoutProductInput> | ProductImageCreateWithoutProductInput[] | ProductImageUncheckedCreateWithoutProductInput[]
    connectOrCreate?: ProductImageCreateOrConnectWithoutProductInput | ProductImageCreateOrConnectWithoutProductInput[]
    createMany?: ProductImageCreateManyProductInputEnvelope
    connect?: ProductImageWhereUniqueInput | ProductImageWhereUniqueInput[]
  }

  export type PriceRuleUncheckedCreateNestedManyWithoutProductInput = {
    create?: XOR<PriceRuleCreateWithoutProductInput, PriceRuleUncheckedCreateWithoutProductInput> | PriceRuleCreateWithoutProductInput[] | PriceRuleUncheckedCreateWithoutProductInput[]
    connectOrCreate?: PriceRuleCreateOrConnectWithoutProductInput | PriceRuleCreateOrConnectWithoutProductInput[]
    createMany?: PriceRuleCreateManyProductInputEnvelope
    connect?: PriceRuleWhereUniqueInput | PriceRuleWhereUniqueInput[]
  }

  export type OrderItemUncheckedCreateNestedManyWithoutProductInput = {
    create?: XOR<OrderItemCreateWithoutProductInput, OrderItemUncheckedCreateWithoutProductInput> | OrderItemCreateWithoutProductInput[] | OrderItemUncheckedCreateWithoutProductInput[]
    connectOrCreate?: OrderItemCreateOrConnectWithoutProductInput | OrderItemCreateOrConnectWithoutProductInput[]
    createMany?: OrderItemCreateManyProductInputEnvelope
    connect?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
  }

  export type ProductImageUncheckedCreateNestedManyWithoutProductInput = {
    create?: XOR<ProductImageCreateWithoutProductInput, ProductImageUncheckedCreateWithoutProductInput> | ProductImageCreateWithoutProductInput[] | ProductImageUncheckedCreateWithoutProductInput[]
    connectOrCreate?: ProductImageCreateOrConnectWithoutProductInput | ProductImageCreateOrConnectWithoutProductInput[]
    createMany?: ProductImageCreateManyProductInputEnvelope
    connect?: ProductImageWhereUniqueInput | ProductImageWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type CategoryUpdateOneWithoutProductsNestedInput = {
    create?: XOR<CategoryCreateWithoutProductsInput, CategoryUncheckedCreateWithoutProductsInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutProductsInput
    upsert?: CategoryUpsertWithoutProductsInput
    disconnect?: CategoryWhereInput | boolean
    delete?: CategoryWhereInput | boolean
    connect?: CategoryWhereUniqueInput
    update?: XOR<XOR<CategoryUpdateToOneWithWhereWithoutProductsInput, CategoryUpdateWithoutProductsInput>, CategoryUncheckedUpdateWithoutProductsInput>
  }

  export type PriceRuleUpdateManyWithoutProductNestedInput = {
    create?: XOR<PriceRuleCreateWithoutProductInput, PriceRuleUncheckedCreateWithoutProductInput> | PriceRuleCreateWithoutProductInput[] | PriceRuleUncheckedCreateWithoutProductInput[]
    connectOrCreate?: PriceRuleCreateOrConnectWithoutProductInput | PriceRuleCreateOrConnectWithoutProductInput[]
    upsert?: PriceRuleUpsertWithWhereUniqueWithoutProductInput | PriceRuleUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: PriceRuleCreateManyProductInputEnvelope
    set?: PriceRuleWhereUniqueInput | PriceRuleWhereUniqueInput[]
    disconnect?: PriceRuleWhereUniqueInput | PriceRuleWhereUniqueInput[]
    delete?: PriceRuleWhereUniqueInput | PriceRuleWhereUniqueInput[]
    connect?: PriceRuleWhereUniqueInput | PriceRuleWhereUniqueInput[]
    update?: PriceRuleUpdateWithWhereUniqueWithoutProductInput | PriceRuleUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: PriceRuleUpdateManyWithWhereWithoutProductInput | PriceRuleUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: PriceRuleScalarWhereInput | PriceRuleScalarWhereInput[]
  }

  export type OrderItemUpdateManyWithoutProductNestedInput = {
    create?: XOR<OrderItemCreateWithoutProductInput, OrderItemUncheckedCreateWithoutProductInput> | OrderItemCreateWithoutProductInput[] | OrderItemUncheckedCreateWithoutProductInput[]
    connectOrCreate?: OrderItemCreateOrConnectWithoutProductInput | OrderItemCreateOrConnectWithoutProductInput[]
    upsert?: OrderItemUpsertWithWhereUniqueWithoutProductInput | OrderItemUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: OrderItemCreateManyProductInputEnvelope
    set?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    disconnect?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    delete?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    connect?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    update?: OrderItemUpdateWithWhereUniqueWithoutProductInput | OrderItemUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: OrderItemUpdateManyWithWhereWithoutProductInput | OrderItemUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: OrderItemScalarWhereInput | OrderItemScalarWhereInput[]
  }

  export type ProductImageUpdateManyWithoutProductNestedInput = {
    create?: XOR<ProductImageCreateWithoutProductInput, ProductImageUncheckedCreateWithoutProductInput> | ProductImageCreateWithoutProductInput[] | ProductImageUncheckedCreateWithoutProductInput[]
    connectOrCreate?: ProductImageCreateOrConnectWithoutProductInput | ProductImageCreateOrConnectWithoutProductInput[]
    upsert?: ProductImageUpsertWithWhereUniqueWithoutProductInput | ProductImageUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: ProductImageCreateManyProductInputEnvelope
    set?: ProductImageWhereUniqueInput | ProductImageWhereUniqueInput[]
    disconnect?: ProductImageWhereUniqueInput | ProductImageWhereUniqueInput[]
    delete?: ProductImageWhereUniqueInput | ProductImageWhereUniqueInput[]
    connect?: ProductImageWhereUniqueInput | ProductImageWhereUniqueInput[]
    update?: ProductImageUpdateWithWhereUniqueWithoutProductInput | ProductImageUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: ProductImageUpdateManyWithWhereWithoutProductInput | ProductImageUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: ProductImageScalarWhereInput | ProductImageScalarWhereInput[]
  }

  export type PriceRuleUncheckedUpdateManyWithoutProductNestedInput = {
    create?: XOR<PriceRuleCreateWithoutProductInput, PriceRuleUncheckedCreateWithoutProductInput> | PriceRuleCreateWithoutProductInput[] | PriceRuleUncheckedCreateWithoutProductInput[]
    connectOrCreate?: PriceRuleCreateOrConnectWithoutProductInput | PriceRuleCreateOrConnectWithoutProductInput[]
    upsert?: PriceRuleUpsertWithWhereUniqueWithoutProductInput | PriceRuleUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: PriceRuleCreateManyProductInputEnvelope
    set?: PriceRuleWhereUniqueInput | PriceRuleWhereUniqueInput[]
    disconnect?: PriceRuleWhereUniqueInput | PriceRuleWhereUniqueInput[]
    delete?: PriceRuleWhereUniqueInput | PriceRuleWhereUniqueInput[]
    connect?: PriceRuleWhereUniqueInput | PriceRuleWhereUniqueInput[]
    update?: PriceRuleUpdateWithWhereUniqueWithoutProductInput | PriceRuleUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: PriceRuleUpdateManyWithWhereWithoutProductInput | PriceRuleUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: PriceRuleScalarWhereInput | PriceRuleScalarWhereInput[]
  }

  export type OrderItemUncheckedUpdateManyWithoutProductNestedInput = {
    create?: XOR<OrderItemCreateWithoutProductInput, OrderItemUncheckedCreateWithoutProductInput> | OrderItemCreateWithoutProductInput[] | OrderItemUncheckedCreateWithoutProductInput[]
    connectOrCreate?: OrderItemCreateOrConnectWithoutProductInput | OrderItemCreateOrConnectWithoutProductInput[]
    upsert?: OrderItemUpsertWithWhereUniqueWithoutProductInput | OrderItemUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: OrderItemCreateManyProductInputEnvelope
    set?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    disconnect?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    delete?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    connect?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    update?: OrderItemUpdateWithWhereUniqueWithoutProductInput | OrderItemUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: OrderItemUpdateManyWithWhereWithoutProductInput | OrderItemUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: OrderItemScalarWhereInput | OrderItemScalarWhereInput[]
  }

  export type ProductImageUncheckedUpdateManyWithoutProductNestedInput = {
    create?: XOR<ProductImageCreateWithoutProductInput, ProductImageUncheckedCreateWithoutProductInput> | ProductImageCreateWithoutProductInput[] | ProductImageUncheckedCreateWithoutProductInput[]
    connectOrCreate?: ProductImageCreateOrConnectWithoutProductInput | ProductImageCreateOrConnectWithoutProductInput[]
    upsert?: ProductImageUpsertWithWhereUniqueWithoutProductInput | ProductImageUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: ProductImageCreateManyProductInputEnvelope
    set?: ProductImageWhereUniqueInput | ProductImageWhereUniqueInput[]
    disconnect?: ProductImageWhereUniqueInput | ProductImageWhereUniqueInput[]
    delete?: ProductImageWhereUniqueInput | ProductImageWhereUniqueInput[]
    connect?: ProductImageWhereUniqueInput | ProductImageWhereUniqueInput[]
    update?: ProductImageUpdateWithWhereUniqueWithoutProductInput | ProductImageUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: ProductImageUpdateManyWithWhereWithoutProductInput | ProductImageUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: ProductImageScalarWhereInput | ProductImageScalarWhereInput[]
  }

  export type ProductCreateNestedOneWithoutPriceRulesInput = {
    create?: XOR<ProductCreateWithoutPriceRulesInput, ProductUncheckedCreateWithoutPriceRulesInput>
    connectOrCreate?: ProductCreateOrConnectWithoutPriceRulesInput
    connect?: ProductWhereUniqueInput
  }

  export type ProductUpdateOneRequiredWithoutPriceRulesNestedInput = {
    create?: XOR<ProductCreateWithoutPriceRulesInput, ProductUncheckedCreateWithoutPriceRulesInput>
    connectOrCreate?: ProductCreateOrConnectWithoutPriceRulesInput
    upsert?: ProductUpsertWithoutPriceRulesInput
    connect?: ProductWhereUniqueInput
    update?: XOR<XOR<ProductUpdateToOneWithWhereWithoutPriceRulesInput, ProductUpdateWithoutPriceRulesInput>, ProductUncheckedUpdateWithoutPriceRulesInput>
  }

  export type UserCreateNestedOneWithoutOrdersInput = {
    create?: XOR<UserCreateWithoutOrdersInput, UserUncheckedCreateWithoutOrdersInput>
    connectOrCreate?: UserCreateOrConnectWithoutOrdersInput
    connect?: UserWhereUniqueInput
  }

  export type OrderItemCreateNestedManyWithoutOrderInput = {
    create?: XOR<OrderItemCreateWithoutOrderInput, OrderItemUncheckedCreateWithoutOrderInput> | OrderItemCreateWithoutOrderInput[] | OrderItemUncheckedCreateWithoutOrderInput[]
    connectOrCreate?: OrderItemCreateOrConnectWithoutOrderInput | OrderItemCreateOrConnectWithoutOrderInput[]
    createMany?: OrderItemCreateManyOrderInputEnvelope
    connect?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
  }

  export type OrderItemUncheckedCreateNestedManyWithoutOrderInput = {
    create?: XOR<OrderItemCreateWithoutOrderInput, OrderItemUncheckedCreateWithoutOrderInput> | OrderItemCreateWithoutOrderInput[] | OrderItemUncheckedCreateWithoutOrderInput[]
    connectOrCreate?: OrderItemCreateOrConnectWithoutOrderInput | OrderItemCreateOrConnectWithoutOrderInput[]
    createMany?: OrderItemCreateManyOrderInputEnvelope
    connect?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
  }

  export type EnumOrderTypeFieldUpdateOperationsInput = {
    set?: $Enums.OrderType
  }

  export type EnumOrderStatusFieldUpdateOperationsInput = {
    set?: $Enums.OrderStatus
  }

  export type EnumPaymentMethodFieldUpdateOperationsInput = {
    set?: $Enums.PaymentMethod
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type UserUpdateOneRequiredWithoutOrdersNestedInput = {
    create?: XOR<UserCreateWithoutOrdersInput, UserUncheckedCreateWithoutOrdersInput>
    connectOrCreate?: UserCreateOrConnectWithoutOrdersInput
    upsert?: UserUpsertWithoutOrdersInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutOrdersInput, UserUpdateWithoutOrdersInput>, UserUncheckedUpdateWithoutOrdersInput>
  }

  export type OrderItemUpdateManyWithoutOrderNestedInput = {
    create?: XOR<OrderItemCreateWithoutOrderInput, OrderItemUncheckedCreateWithoutOrderInput> | OrderItemCreateWithoutOrderInput[] | OrderItemUncheckedCreateWithoutOrderInput[]
    connectOrCreate?: OrderItemCreateOrConnectWithoutOrderInput | OrderItemCreateOrConnectWithoutOrderInput[]
    upsert?: OrderItemUpsertWithWhereUniqueWithoutOrderInput | OrderItemUpsertWithWhereUniqueWithoutOrderInput[]
    createMany?: OrderItemCreateManyOrderInputEnvelope
    set?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    disconnect?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    delete?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    connect?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    update?: OrderItemUpdateWithWhereUniqueWithoutOrderInput | OrderItemUpdateWithWhereUniqueWithoutOrderInput[]
    updateMany?: OrderItemUpdateManyWithWhereWithoutOrderInput | OrderItemUpdateManyWithWhereWithoutOrderInput[]
    deleteMany?: OrderItemScalarWhereInput | OrderItemScalarWhereInput[]
  }

  export type OrderItemUncheckedUpdateManyWithoutOrderNestedInput = {
    create?: XOR<OrderItemCreateWithoutOrderInput, OrderItemUncheckedCreateWithoutOrderInput> | OrderItemCreateWithoutOrderInput[] | OrderItemUncheckedCreateWithoutOrderInput[]
    connectOrCreate?: OrderItemCreateOrConnectWithoutOrderInput | OrderItemCreateOrConnectWithoutOrderInput[]
    upsert?: OrderItemUpsertWithWhereUniqueWithoutOrderInput | OrderItemUpsertWithWhereUniqueWithoutOrderInput[]
    createMany?: OrderItemCreateManyOrderInputEnvelope
    set?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    disconnect?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    delete?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    connect?: OrderItemWhereUniqueInput | OrderItemWhereUniqueInput[]
    update?: OrderItemUpdateWithWhereUniqueWithoutOrderInput | OrderItemUpdateWithWhereUniqueWithoutOrderInput[]
    updateMany?: OrderItemUpdateManyWithWhereWithoutOrderInput | OrderItemUpdateManyWithWhereWithoutOrderInput[]
    deleteMany?: OrderItemScalarWhereInput | OrderItemScalarWhereInput[]
  }

  export type OrderCreateNestedOneWithoutItemsInput = {
    create?: XOR<OrderCreateWithoutItemsInput, OrderUncheckedCreateWithoutItemsInput>
    connectOrCreate?: OrderCreateOrConnectWithoutItemsInput
    connect?: OrderWhereUniqueInput
  }

  export type ProductCreateNestedOneWithoutOrderItemsInput = {
    create?: XOR<ProductCreateWithoutOrderItemsInput, ProductUncheckedCreateWithoutOrderItemsInput>
    connectOrCreate?: ProductCreateOrConnectWithoutOrderItemsInput
    connect?: ProductWhereUniqueInput
  }

  export type OrderUpdateOneRequiredWithoutItemsNestedInput = {
    create?: XOR<OrderCreateWithoutItemsInput, OrderUncheckedCreateWithoutItemsInput>
    connectOrCreate?: OrderCreateOrConnectWithoutItemsInput
    upsert?: OrderUpsertWithoutItemsInput
    connect?: OrderWhereUniqueInput
    update?: XOR<XOR<OrderUpdateToOneWithWhereWithoutItemsInput, OrderUpdateWithoutItemsInput>, OrderUncheckedUpdateWithoutItemsInput>
  }

  export type ProductUpdateOneRequiredWithoutOrderItemsNestedInput = {
    create?: XOR<ProductCreateWithoutOrderItemsInput, ProductUncheckedCreateWithoutOrderItemsInput>
    connectOrCreate?: ProductCreateOrConnectWithoutOrderItemsInput
    upsert?: ProductUpsertWithoutOrderItemsInput
    connect?: ProductWhereUniqueInput
    update?: XOR<XOR<ProductUpdateToOneWithWhereWithoutOrderItemsInput, ProductUpdateWithoutOrderItemsInput>, ProductUncheckedUpdateWithoutOrderItemsInput>
  }

  export type UserCreateNestedOneWithoutTransactionsInput = {
    create?: XOR<UserCreateWithoutTransactionsInput, UserUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutTransactionsInput
    connect?: UserWhereUniqueInput
  }

  export type EnumTransactionTypeFieldUpdateOperationsInput = {
    set?: $Enums.TransactionType
  }

  export type EnumCurrencyFieldUpdateOperationsInput = {
    set?: $Enums.Currency
  }

  export type UserUpdateOneRequiredWithoutTransactionsNestedInput = {
    create?: XOR<UserCreateWithoutTransactionsInput, UserUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutTransactionsInput
    upsert?: UserUpsertWithoutTransactionsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutTransactionsInput, UserUpdateWithoutTransactionsInput>, UserUncheckedUpdateWithoutTransactionsInput>
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type UserWeeklyStatsCreateNestedManyWithoutCycleInput = {
    create?: XOR<UserWeeklyStatsCreateWithoutCycleInput, UserWeeklyStatsUncheckedCreateWithoutCycleInput> | UserWeeklyStatsCreateWithoutCycleInput[] | UserWeeklyStatsUncheckedCreateWithoutCycleInput[]
    connectOrCreate?: UserWeeklyStatsCreateOrConnectWithoutCycleInput | UserWeeklyStatsCreateOrConnectWithoutCycleInput[]
    createMany?: UserWeeklyStatsCreateManyCycleInputEnvelope
    connect?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
  }

  export type UserWeeklyStatsUncheckedCreateNestedManyWithoutCycleInput = {
    create?: XOR<UserWeeklyStatsCreateWithoutCycleInput, UserWeeklyStatsUncheckedCreateWithoutCycleInput> | UserWeeklyStatsCreateWithoutCycleInput[] | UserWeeklyStatsUncheckedCreateWithoutCycleInput[]
    connectOrCreate?: UserWeeklyStatsCreateOrConnectWithoutCycleInput | UserWeeklyStatsCreateOrConnectWithoutCycleInput[]
    createMany?: UserWeeklyStatsCreateManyCycleInputEnvelope
    connect?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
  }

  export type UserWeeklyStatsUpdateManyWithoutCycleNestedInput = {
    create?: XOR<UserWeeklyStatsCreateWithoutCycleInput, UserWeeklyStatsUncheckedCreateWithoutCycleInput> | UserWeeklyStatsCreateWithoutCycleInput[] | UserWeeklyStatsUncheckedCreateWithoutCycleInput[]
    connectOrCreate?: UserWeeklyStatsCreateOrConnectWithoutCycleInput | UserWeeklyStatsCreateOrConnectWithoutCycleInput[]
    upsert?: UserWeeklyStatsUpsertWithWhereUniqueWithoutCycleInput | UserWeeklyStatsUpsertWithWhereUniqueWithoutCycleInput[]
    createMany?: UserWeeklyStatsCreateManyCycleInputEnvelope
    set?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    disconnect?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    delete?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    connect?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    update?: UserWeeklyStatsUpdateWithWhereUniqueWithoutCycleInput | UserWeeklyStatsUpdateWithWhereUniqueWithoutCycleInput[]
    updateMany?: UserWeeklyStatsUpdateManyWithWhereWithoutCycleInput | UserWeeklyStatsUpdateManyWithWhereWithoutCycleInput[]
    deleteMany?: UserWeeklyStatsScalarWhereInput | UserWeeklyStatsScalarWhereInput[]
  }

  export type UserWeeklyStatsUncheckedUpdateManyWithoutCycleNestedInput = {
    create?: XOR<UserWeeklyStatsCreateWithoutCycleInput, UserWeeklyStatsUncheckedCreateWithoutCycleInput> | UserWeeklyStatsCreateWithoutCycleInput[] | UserWeeklyStatsUncheckedCreateWithoutCycleInput[]
    connectOrCreate?: UserWeeklyStatsCreateOrConnectWithoutCycleInput | UserWeeklyStatsCreateOrConnectWithoutCycleInput[]
    upsert?: UserWeeklyStatsUpsertWithWhereUniqueWithoutCycleInput | UserWeeklyStatsUpsertWithWhereUniqueWithoutCycleInput[]
    createMany?: UserWeeklyStatsCreateManyCycleInputEnvelope
    set?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    disconnect?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    delete?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    connect?: UserWeeklyStatsWhereUniqueInput | UserWeeklyStatsWhereUniqueInput[]
    update?: UserWeeklyStatsUpdateWithWhereUniqueWithoutCycleInput | UserWeeklyStatsUpdateWithWhereUniqueWithoutCycleInput[]
    updateMany?: UserWeeklyStatsUpdateManyWithWhereWithoutCycleInput | UserWeeklyStatsUpdateManyWithWhereWithoutCycleInput[]
    deleteMany?: UserWeeklyStatsScalarWhereInput | UserWeeklyStatsScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutUserWeeklyStatsInput = {
    create?: XOR<UserCreateWithoutUserWeeklyStatsInput, UserUncheckedCreateWithoutUserWeeklyStatsInput>
    connectOrCreate?: UserCreateOrConnectWithoutUserWeeklyStatsInput
    connect?: UserWhereUniqueInput
  }

  export type WeeklyCycleCreateNestedOneWithoutUserStatsInput = {
    create?: XOR<WeeklyCycleCreateWithoutUserStatsInput, WeeklyCycleUncheckedCreateWithoutUserStatsInput>
    connectOrCreate?: WeeklyCycleCreateOrConnectWithoutUserStatsInput
    connect?: WeeklyCycleWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutUserWeeklyStatsNestedInput = {
    create?: XOR<UserCreateWithoutUserWeeklyStatsInput, UserUncheckedCreateWithoutUserWeeklyStatsInput>
    connectOrCreate?: UserCreateOrConnectWithoutUserWeeklyStatsInput
    upsert?: UserUpsertWithoutUserWeeklyStatsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutUserWeeklyStatsInput, UserUpdateWithoutUserWeeklyStatsInput>, UserUncheckedUpdateWithoutUserWeeklyStatsInput>
  }

  export type WeeklyCycleUpdateOneRequiredWithoutUserStatsNestedInput = {
    create?: XOR<WeeklyCycleCreateWithoutUserStatsInput, WeeklyCycleUncheckedCreateWithoutUserStatsInput>
    connectOrCreate?: WeeklyCycleCreateOrConnectWithoutUserStatsInput
    upsert?: WeeklyCycleUpsertWithoutUserStatsInput
    connect?: WeeklyCycleWhereUniqueInput
    update?: XOR<XOR<WeeklyCycleUpdateToOneWithWhereWithoutUserStatsInput, WeeklyCycleUpdateWithoutUserStatsInput>, WeeklyCycleUncheckedUpdateWithoutUserStatsInput>
  }

  export type ProductCreateNestedManyWithoutCategoryInput = {
    create?: XOR<ProductCreateWithoutCategoryInput, ProductUncheckedCreateWithoutCategoryInput> | ProductCreateWithoutCategoryInput[] | ProductUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutCategoryInput | ProductCreateOrConnectWithoutCategoryInput[]
    createMany?: ProductCreateManyCategoryInputEnvelope
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
  }

  export type ProductUncheckedCreateNestedManyWithoutCategoryInput = {
    create?: XOR<ProductCreateWithoutCategoryInput, ProductUncheckedCreateWithoutCategoryInput> | ProductCreateWithoutCategoryInput[] | ProductUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutCategoryInput | ProductCreateOrConnectWithoutCategoryInput[]
    createMany?: ProductCreateManyCategoryInputEnvelope
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
  }

  export type ProductUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<ProductCreateWithoutCategoryInput, ProductUncheckedCreateWithoutCategoryInput> | ProductCreateWithoutCategoryInput[] | ProductUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutCategoryInput | ProductCreateOrConnectWithoutCategoryInput[]
    upsert?: ProductUpsertWithWhereUniqueWithoutCategoryInput | ProductUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: ProductCreateManyCategoryInputEnvelope
    set?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    disconnect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    delete?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    update?: ProductUpdateWithWhereUniqueWithoutCategoryInput | ProductUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: ProductUpdateManyWithWhereWithoutCategoryInput | ProductUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: ProductScalarWhereInput | ProductScalarWhereInput[]
  }

  export type ProductUncheckedUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<ProductCreateWithoutCategoryInput, ProductUncheckedCreateWithoutCategoryInput> | ProductCreateWithoutCategoryInput[] | ProductUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutCategoryInput | ProductCreateOrConnectWithoutCategoryInput[]
    upsert?: ProductUpsertWithWhereUniqueWithoutCategoryInput | ProductUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: ProductCreateManyCategoryInputEnvelope
    set?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    disconnect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    delete?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    update?: ProductUpdateWithWhereUniqueWithoutCategoryInput | ProductUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: ProductUpdateManyWithWhereWithoutCategoryInput | ProductUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: ProductScalarWhereInput | ProductScalarWhereInput[]
  }

  export type ProductCreateNestedOneWithoutImagesInput = {
    create?: XOR<ProductCreateWithoutImagesInput, ProductUncheckedCreateWithoutImagesInput>
    connectOrCreate?: ProductCreateOrConnectWithoutImagesInput
    connect?: ProductWhereUniqueInput
  }

  export type ProductUpdateOneRequiredWithoutImagesNestedInput = {
    create?: XOR<ProductCreateWithoutImagesInput, ProductUncheckedCreateWithoutImagesInput>
    connectOrCreate?: ProductCreateOrConnectWithoutImagesInput
    upsert?: ProductUpsertWithoutImagesInput
    connect?: ProductWhereUniqueInput
    update?: XOR<XOR<ProductUpdateToOneWithWhereWithoutImagesInput, ProductUpdateWithoutImagesInput>, ProductUncheckedUpdateWithoutImagesInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedEnumOrderTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.OrderType | EnumOrderTypeFieldRefInput<$PrismaModel>
    in?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumOrderTypeFilter<$PrismaModel> | $Enums.OrderType
  }

  export type NestedEnumOrderStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.OrderStatus | EnumOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.OrderStatus[] | ListEnumOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.OrderStatus[] | ListEnumOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumOrderStatusFilter<$PrismaModel> | $Enums.OrderStatus
  }

  export type NestedEnumPaymentMethodFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentMethod | EnumPaymentMethodFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentMethodFilter<$PrismaModel> | $Enums.PaymentMethod
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedEnumOrderTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.OrderType | EnumOrderTypeFieldRefInput<$PrismaModel>
    in?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumOrderTypeWithAggregatesFilter<$PrismaModel> | $Enums.OrderType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumOrderTypeFilter<$PrismaModel>
    _max?: NestedEnumOrderTypeFilter<$PrismaModel>
  }

  export type NestedEnumOrderStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.OrderStatus | EnumOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.OrderStatus[] | ListEnumOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.OrderStatus[] | ListEnumOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumOrderStatusWithAggregatesFilter<$PrismaModel> | $Enums.OrderStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumOrderStatusFilter<$PrismaModel>
    _max?: NestedEnumOrderStatusFilter<$PrismaModel>
  }

  export type NestedEnumPaymentMethodWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentMethod | EnumPaymentMethodFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentMethod[] | ListEnumPaymentMethodFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentMethodWithAggregatesFilter<$PrismaModel> | $Enums.PaymentMethod
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentMethodFilter<$PrismaModel>
    _max?: NestedEnumPaymentMethodFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumTransactionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeFilter<$PrismaModel> | $Enums.TransactionType
  }

  export type NestedEnumCurrencyFilter<$PrismaModel = never> = {
    equals?: $Enums.Currency | EnumCurrencyFieldRefInput<$PrismaModel>
    in?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    notIn?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    not?: NestedEnumCurrencyFilter<$PrismaModel> | $Enums.Currency
  }

  export type NestedEnumTransactionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeWithAggregatesFilter<$PrismaModel> | $Enums.TransactionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTransactionTypeFilter<$PrismaModel>
    _max?: NestedEnumTransactionTypeFilter<$PrismaModel>
  }

  export type NestedEnumCurrencyWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Currency | EnumCurrencyFieldRefInput<$PrismaModel>
    in?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    notIn?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    not?: NestedEnumCurrencyWithAggregatesFilter<$PrismaModel> | $Enums.Currency
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCurrencyFilter<$PrismaModel>
    _max?: NestedEnumCurrencyFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type UserCreateWithoutSponsoredUsersInput = {
    id?: string
    role?: $Enums.Role
    name: string
    email: string
    passwordHash: string
    walletBalanceKgs?: Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    sponsor?: UserCreateNestedOneWithoutSponsoredUsersInput
    orders?: OrderCreateNestedManyWithoutUserInput
    transactions?: TransactionCreateNestedManyWithoutUserInput
    userWeeklyStats?: UserWeeklyStatsCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSponsoredUsersInput = {
    id?: string
    role?: $Enums.Role
    sponsorId?: string | null
    name: string
    email: string
    passwordHash: string
    walletBalanceKgs?: Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    orders?: OrderUncheckedCreateNestedManyWithoutUserInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutUserInput
    userWeeklyStats?: UserWeeklyStatsUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSponsoredUsersInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSponsoredUsersInput, UserUncheckedCreateWithoutSponsoredUsersInput>
  }

  export type UserCreateWithoutSponsorInput = {
    id?: string
    role?: $Enums.Role
    name: string
    email: string
    passwordHash: string
    walletBalanceKgs?: Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    sponsoredUsers?: UserCreateNestedManyWithoutSponsorInput
    orders?: OrderCreateNestedManyWithoutUserInput
    transactions?: TransactionCreateNestedManyWithoutUserInput
    userWeeklyStats?: UserWeeklyStatsCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSponsorInput = {
    id?: string
    role?: $Enums.Role
    name: string
    email: string
    passwordHash: string
    walletBalanceKgs?: Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    sponsoredUsers?: UserUncheckedCreateNestedManyWithoutSponsorInput
    orders?: OrderUncheckedCreateNestedManyWithoutUserInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutUserInput
    userWeeklyStats?: UserWeeklyStatsUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSponsorInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSponsorInput, UserUncheckedCreateWithoutSponsorInput>
  }

  export type UserCreateManySponsorInputEnvelope = {
    data: UserCreateManySponsorInput | UserCreateManySponsorInput[]
    skipDuplicates?: boolean
  }

  export type OrderCreateWithoutUserInput = {
    id?: string
    orderType: $Enums.OrderType
    status?: $Enums.OrderStatus
    totalKgs: Decimal | DecimalJsLike | number | string
    totalUsd: Decimal | DecimalJsLike | number | string
    paymentMethod: $Enums.PaymentMethod
    customerName?: string | null
    customerPhone?: string | null
    address?: string | null
    receiptImageUrl?: string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    items?: OrderItemCreateNestedManyWithoutOrderInput
  }

  export type OrderUncheckedCreateWithoutUserInput = {
    id?: string
    orderType: $Enums.OrderType
    status?: $Enums.OrderStatus
    totalKgs: Decimal | DecimalJsLike | number | string
    totalUsd: Decimal | DecimalJsLike | number | string
    paymentMethod: $Enums.PaymentMethod
    customerName?: string | null
    customerPhone?: string | null
    address?: string | null
    receiptImageUrl?: string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    items?: OrderItemUncheckedCreateNestedManyWithoutOrderInput
  }

  export type OrderCreateOrConnectWithoutUserInput = {
    where: OrderWhereUniqueInput
    create: XOR<OrderCreateWithoutUserInput, OrderUncheckedCreateWithoutUserInput>
  }

  export type OrderCreateManyUserInputEnvelope = {
    data: OrderCreateManyUserInput | OrderCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type TransactionCreateWithoutUserInput = {
    id?: string
    type: $Enums.TransactionType
    amount: Decimal | DecimalJsLike | number | string
    currency: $Enums.Currency
    description?: string | null
    createdAt?: Date | string
  }

  export type TransactionUncheckedCreateWithoutUserInput = {
    id?: string
    type: $Enums.TransactionType
    amount: Decimal | DecimalJsLike | number | string
    currency: $Enums.Currency
    description?: string | null
    createdAt?: Date | string
  }

  export type TransactionCreateOrConnectWithoutUserInput = {
    where: TransactionWhereUniqueInput
    create: XOR<TransactionCreateWithoutUserInput, TransactionUncheckedCreateWithoutUserInput>
  }

  export type TransactionCreateManyUserInputEnvelope = {
    data: TransactionCreateManyUserInput | TransactionCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type UserWeeklyStatsCreateWithoutUserInput = {
    id?: string
    personalVolume?: Decimal | DecimalJsLike | number | string
    teamVolume?: Decimal | DecimalJsLike | number | string
    carryOverVolume?: Decimal | DecimalJsLike | number | string
    cycle: WeeklyCycleCreateNestedOneWithoutUserStatsInput
  }

  export type UserWeeklyStatsUncheckedCreateWithoutUserInput = {
    id?: string
    cycleId: string
    personalVolume?: Decimal | DecimalJsLike | number | string
    teamVolume?: Decimal | DecimalJsLike | number | string
    carryOverVolume?: Decimal | DecimalJsLike | number | string
  }

  export type UserWeeklyStatsCreateOrConnectWithoutUserInput = {
    where: UserWeeklyStatsWhereUniqueInput
    create: XOR<UserWeeklyStatsCreateWithoutUserInput, UserWeeklyStatsUncheckedCreateWithoutUserInput>
  }

  export type UserWeeklyStatsCreateManyUserInputEnvelope = {
    data: UserWeeklyStatsCreateManyUserInput | UserWeeklyStatsCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutSponsoredUsersInput = {
    update: XOR<UserUpdateWithoutSponsoredUsersInput, UserUncheckedUpdateWithoutSponsoredUsersInput>
    create: XOR<UserCreateWithoutSponsoredUsersInput, UserUncheckedCreateWithoutSponsoredUsersInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSponsoredUsersInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSponsoredUsersInput, UserUncheckedUpdateWithoutSponsoredUsersInput>
  }

  export type UserUpdateWithoutSponsoredUsersInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    walletBalanceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sponsor?: UserUpdateOneWithoutSponsoredUsersNestedInput
    orders?: OrderUpdateManyWithoutUserNestedInput
    transactions?: TransactionUpdateManyWithoutUserNestedInput
    userWeeklyStats?: UserWeeklyStatsUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSponsoredUsersInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    sponsorId?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    walletBalanceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    orders?: OrderUncheckedUpdateManyWithoutUserNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutUserNestedInput
    userWeeklyStats?: UserWeeklyStatsUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserUpsertWithWhereUniqueWithoutSponsorInput = {
    where: UserWhereUniqueInput
    update: XOR<UserUpdateWithoutSponsorInput, UserUncheckedUpdateWithoutSponsorInput>
    create: XOR<UserCreateWithoutSponsorInput, UserUncheckedCreateWithoutSponsorInput>
  }

  export type UserUpdateWithWhereUniqueWithoutSponsorInput = {
    where: UserWhereUniqueInput
    data: XOR<UserUpdateWithoutSponsorInput, UserUncheckedUpdateWithoutSponsorInput>
  }

  export type UserUpdateManyWithWhereWithoutSponsorInput = {
    where: UserScalarWhereInput
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyWithoutSponsorInput>
  }

  export type UserScalarWhereInput = {
    AND?: UserScalarWhereInput | UserScalarWhereInput[]
    OR?: UserScalarWhereInput[]
    NOT?: UserScalarWhereInput | UserScalarWhereInput[]
    id?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    sponsorId?: StringNullableFilter<"User"> | string | null
    name?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    passwordHash?: StringFilter<"User"> | string
    walletBalanceKgs?: DecimalFilter<"User"> | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFilter<"User"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
  }

  export type OrderUpsertWithWhereUniqueWithoutUserInput = {
    where: OrderWhereUniqueInput
    update: XOR<OrderUpdateWithoutUserInput, OrderUncheckedUpdateWithoutUserInput>
    create: XOR<OrderCreateWithoutUserInput, OrderUncheckedCreateWithoutUserInput>
  }

  export type OrderUpdateWithWhereUniqueWithoutUserInput = {
    where: OrderWhereUniqueInput
    data: XOR<OrderUpdateWithoutUserInput, OrderUncheckedUpdateWithoutUserInput>
  }

  export type OrderUpdateManyWithWhereWithoutUserInput = {
    where: OrderScalarWhereInput
    data: XOR<OrderUpdateManyMutationInput, OrderUncheckedUpdateManyWithoutUserInput>
  }

  export type OrderScalarWhereInput = {
    AND?: OrderScalarWhereInput | OrderScalarWhereInput[]
    OR?: OrderScalarWhereInput[]
    NOT?: OrderScalarWhereInput | OrderScalarWhereInput[]
    id?: StringFilter<"Order"> | string
    userId?: StringFilter<"Order"> | string
    orderType?: EnumOrderTypeFilter<"Order"> | $Enums.OrderType
    status?: EnumOrderStatusFilter<"Order"> | $Enums.OrderStatus
    totalKgs?: DecimalFilter<"Order"> | Decimal | DecimalJsLike | number | string
    totalUsd?: DecimalFilter<"Order"> | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFilter<"Order"> | $Enums.PaymentMethod
    customerName?: StringNullableFilter<"Order"> | string | null
    customerPhone?: StringNullableFilter<"Order"> | string | null
    address?: StringNullableFilter<"Order"> | string | null
    receiptImageUrl?: StringNullableFilter<"Order"> | string | null
    ocrResult?: JsonNullableFilter<"Order">
    verifiedAt?: DateTimeNullableFilter<"Order"> | Date | string | null
    createdAt?: DateTimeFilter<"Order"> | Date | string
    updatedAt?: DateTimeFilter<"Order"> | Date | string
  }

  export type TransactionUpsertWithWhereUniqueWithoutUserInput = {
    where: TransactionWhereUniqueInput
    update: XOR<TransactionUpdateWithoutUserInput, TransactionUncheckedUpdateWithoutUserInput>
    create: XOR<TransactionCreateWithoutUserInput, TransactionUncheckedCreateWithoutUserInput>
  }

  export type TransactionUpdateWithWhereUniqueWithoutUserInput = {
    where: TransactionWhereUniqueInput
    data: XOR<TransactionUpdateWithoutUserInput, TransactionUncheckedUpdateWithoutUserInput>
  }

  export type TransactionUpdateManyWithWhereWithoutUserInput = {
    where: TransactionScalarWhereInput
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyWithoutUserInput>
  }

  export type TransactionScalarWhereInput = {
    AND?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
    OR?: TransactionScalarWhereInput[]
    NOT?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
    id?: StringFilter<"Transaction"> | string
    userId?: StringFilter<"Transaction"> | string
    type?: EnumTransactionTypeFilter<"Transaction"> | $Enums.TransactionType
    amount?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    currency?: EnumCurrencyFilter<"Transaction"> | $Enums.Currency
    description?: StringNullableFilter<"Transaction"> | string | null
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
  }

  export type UserWeeklyStatsUpsertWithWhereUniqueWithoutUserInput = {
    where: UserWeeklyStatsWhereUniqueInput
    update: XOR<UserWeeklyStatsUpdateWithoutUserInput, UserWeeklyStatsUncheckedUpdateWithoutUserInput>
    create: XOR<UserWeeklyStatsCreateWithoutUserInput, UserWeeklyStatsUncheckedCreateWithoutUserInput>
  }

  export type UserWeeklyStatsUpdateWithWhereUniqueWithoutUserInput = {
    where: UserWeeklyStatsWhereUniqueInput
    data: XOR<UserWeeklyStatsUpdateWithoutUserInput, UserWeeklyStatsUncheckedUpdateWithoutUserInput>
  }

  export type UserWeeklyStatsUpdateManyWithWhereWithoutUserInput = {
    where: UserWeeklyStatsScalarWhereInput
    data: XOR<UserWeeklyStatsUpdateManyMutationInput, UserWeeklyStatsUncheckedUpdateManyWithoutUserInput>
  }

  export type UserWeeklyStatsScalarWhereInput = {
    AND?: UserWeeklyStatsScalarWhereInput | UserWeeklyStatsScalarWhereInput[]
    OR?: UserWeeklyStatsScalarWhereInput[]
    NOT?: UserWeeklyStatsScalarWhereInput | UserWeeklyStatsScalarWhereInput[]
    id?: StringFilter<"UserWeeklyStats"> | string
    userId?: StringFilter<"UserWeeklyStats"> | string
    cycleId?: StringFilter<"UserWeeklyStats"> | string
    personalVolume?: DecimalFilter<"UserWeeklyStats"> | Decimal | DecimalJsLike | number | string
    teamVolume?: DecimalFilter<"UserWeeklyStats"> | Decimal | DecimalJsLike | number | string
    carryOverVolume?: DecimalFilter<"UserWeeklyStats"> | Decimal | DecimalJsLike | number | string
  }

  export type CategoryCreateWithoutProductsInput = {
    id?: string
    name: string
    slug: string
    iconEmoji?: string | null
    imageUrl?: string | null
    sortOrder?: number
    isActive?: boolean
  }

  export type CategoryUncheckedCreateWithoutProductsInput = {
    id?: string
    name: string
    slug: string
    iconEmoji?: string | null
    imageUrl?: string | null
    sortOrder?: number
    isActive?: boolean
  }

  export type CategoryCreateOrConnectWithoutProductsInput = {
    where: CategoryWhereUniqueInput
    create: XOR<CategoryCreateWithoutProductsInput, CategoryUncheckedCreateWithoutProductsInput>
  }

  export type PriceRuleCreateWithoutProductInput = {
    id?: string
    role: $Enums.Role
    customPriceKgs: Decimal | DecimalJsLike | number | string
  }

  export type PriceRuleUncheckedCreateWithoutProductInput = {
    id?: string
    role: $Enums.Role
    customPriceKgs: Decimal | DecimalJsLike | number | string
  }

  export type PriceRuleCreateOrConnectWithoutProductInput = {
    where: PriceRuleWhereUniqueInput
    create: XOR<PriceRuleCreateWithoutProductInput, PriceRuleUncheckedCreateWithoutProductInput>
  }

  export type PriceRuleCreateManyProductInputEnvelope = {
    data: PriceRuleCreateManyProductInput | PriceRuleCreateManyProductInput[]
    skipDuplicates?: boolean
  }

  export type OrderItemCreateWithoutProductInput = {
    id?: string
    quantity: number
    unitPriceKgs: Decimal | DecimalJsLike | number | string
    totalPriceKgs: Decimal | DecimalJsLike | number | string
    order: OrderCreateNestedOneWithoutItemsInput
  }

  export type OrderItemUncheckedCreateWithoutProductInput = {
    id?: string
    orderId: string
    quantity: number
    unitPriceKgs: Decimal | DecimalJsLike | number | string
    totalPriceKgs: Decimal | DecimalJsLike | number | string
  }

  export type OrderItemCreateOrConnectWithoutProductInput = {
    where: OrderItemWhereUniqueInput
    create: XOR<OrderItemCreateWithoutProductInput, OrderItemUncheckedCreateWithoutProductInput>
  }

  export type OrderItemCreateManyProductInputEnvelope = {
    data: OrderItemCreateManyProductInput | OrderItemCreateManyProductInput[]
    skipDuplicates?: boolean
  }

  export type ProductImageCreateWithoutProductInput = {
    id?: string
    imageUrl: string
    sortOrder?: number
  }

  export type ProductImageUncheckedCreateWithoutProductInput = {
    id?: string
    imageUrl: string
    sortOrder?: number
  }

  export type ProductImageCreateOrConnectWithoutProductInput = {
    where: ProductImageWhereUniqueInput
    create: XOR<ProductImageCreateWithoutProductInput, ProductImageUncheckedCreateWithoutProductInput>
  }

  export type ProductImageCreateManyProductInputEnvelope = {
    data: ProductImageCreateManyProductInput | ProductImageCreateManyProductInput[]
    skipDuplicates?: boolean
  }

  export type CategoryUpsertWithoutProductsInput = {
    update: XOR<CategoryUpdateWithoutProductsInput, CategoryUncheckedUpdateWithoutProductsInput>
    create: XOR<CategoryCreateWithoutProductsInput, CategoryUncheckedCreateWithoutProductsInput>
    where?: CategoryWhereInput
  }

  export type CategoryUpdateToOneWithWhereWithoutProductsInput = {
    where?: CategoryWhereInput
    data: XOR<CategoryUpdateWithoutProductsInput, CategoryUncheckedUpdateWithoutProductsInput>
  }

  export type CategoryUpdateWithoutProductsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    iconEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
  }

  export type CategoryUncheckedUpdateWithoutProductsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    iconEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
  }

  export type PriceRuleUpsertWithWhereUniqueWithoutProductInput = {
    where: PriceRuleWhereUniqueInput
    update: XOR<PriceRuleUpdateWithoutProductInput, PriceRuleUncheckedUpdateWithoutProductInput>
    create: XOR<PriceRuleCreateWithoutProductInput, PriceRuleUncheckedCreateWithoutProductInput>
  }

  export type PriceRuleUpdateWithWhereUniqueWithoutProductInput = {
    where: PriceRuleWhereUniqueInput
    data: XOR<PriceRuleUpdateWithoutProductInput, PriceRuleUncheckedUpdateWithoutProductInput>
  }

  export type PriceRuleUpdateManyWithWhereWithoutProductInput = {
    where: PriceRuleScalarWhereInput
    data: XOR<PriceRuleUpdateManyMutationInput, PriceRuleUncheckedUpdateManyWithoutProductInput>
  }

  export type PriceRuleScalarWhereInput = {
    AND?: PriceRuleScalarWhereInput | PriceRuleScalarWhereInput[]
    OR?: PriceRuleScalarWhereInput[]
    NOT?: PriceRuleScalarWhereInput | PriceRuleScalarWhereInput[]
    id?: StringFilter<"PriceRule"> | string
    productId?: StringFilter<"PriceRule"> | string
    role?: EnumRoleFilter<"PriceRule"> | $Enums.Role
    customPriceKgs?: DecimalFilter<"PriceRule"> | Decimal | DecimalJsLike | number | string
  }

  export type OrderItemUpsertWithWhereUniqueWithoutProductInput = {
    where: OrderItemWhereUniqueInput
    update: XOR<OrderItemUpdateWithoutProductInput, OrderItemUncheckedUpdateWithoutProductInput>
    create: XOR<OrderItemCreateWithoutProductInput, OrderItemUncheckedCreateWithoutProductInput>
  }

  export type OrderItemUpdateWithWhereUniqueWithoutProductInput = {
    where: OrderItemWhereUniqueInput
    data: XOR<OrderItemUpdateWithoutProductInput, OrderItemUncheckedUpdateWithoutProductInput>
  }

  export type OrderItemUpdateManyWithWhereWithoutProductInput = {
    where: OrderItemScalarWhereInput
    data: XOR<OrderItemUpdateManyMutationInput, OrderItemUncheckedUpdateManyWithoutProductInput>
  }

  export type OrderItemScalarWhereInput = {
    AND?: OrderItemScalarWhereInput | OrderItemScalarWhereInput[]
    OR?: OrderItemScalarWhereInput[]
    NOT?: OrderItemScalarWhereInput | OrderItemScalarWhereInput[]
    id?: StringFilter<"OrderItem"> | string
    orderId?: StringFilter<"OrderItem"> | string
    productId?: StringFilter<"OrderItem"> | string
    quantity?: IntFilter<"OrderItem"> | number
    unitPriceKgs?: DecimalFilter<"OrderItem"> | Decimal | DecimalJsLike | number | string
    totalPriceKgs?: DecimalFilter<"OrderItem"> | Decimal | DecimalJsLike | number | string
  }

  export type ProductImageUpsertWithWhereUniqueWithoutProductInput = {
    where: ProductImageWhereUniqueInput
    update: XOR<ProductImageUpdateWithoutProductInput, ProductImageUncheckedUpdateWithoutProductInput>
    create: XOR<ProductImageCreateWithoutProductInput, ProductImageUncheckedCreateWithoutProductInput>
  }

  export type ProductImageUpdateWithWhereUniqueWithoutProductInput = {
    where: ProductImageWhereUniqueInput
    data: XOR<ProductImageUpdateWithoutProductInput, ProductImageUncheckedUpdateWithoutProductInput>
  }

  export type ProductImageUpdateManyWithWhereWithoutProductInput = {
    where: ProductImageScalarWhereInput
    data: XOR<ProductImageUpdateManyMutationInput, ProductImageUncheckedUpdateManyWithoutProductInput>
  }

  export type ProductImageScalarWhereInput = {
    AND?: ProductImageScalarWhereInput | ProductImageScalarWhereInput[]
    OR?: ProductImageScalarWhereInput[]
    NOT?: ProductImageScalarWhereInput | ProductImageScalarWhereInput[]
    id?: StringFilter<"ProductImage"> | string
    productId?: StringFilter<"ProductImage"> | string
    imageUrl?: StringFilter<"ProductImage"> | string
    sortOrder?: IntFilter<"ProductImage"> | number
  }

  export type ProductCreateWithoutPriceRulesInput = {
    id?: string
    barcode: string
    name: string
    description?: string | null
    basePriceKgs: Decimal | DecimalJsLike | number | string
    basePriceUsd: Decimal | DecimalJsLike | number | string
    stockQuantity?: number
    minStockAlert?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    category?: CategoryCreateNestedOneWithoutProductsInput
    orderItems?: OrderItemCreateNestedManyWithoutProductInput
    images?: ProductImageCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateWithoutPriceRulesInput = {
    id?: string
    barcode: string
    name: string
    description?: string | null
    basePriceKgs: Decimal | DecimalJsLike | number | string
    basePriceUsd: Decimal | DecimalJsLike | number | string
    stockQuantity?: number
    minStockAlert?: number
    categoryId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    orderItems?: OrderItemUncheckedCreateNestedManyWithoutProductInput
    images?: ProductImageUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutPriceRulesInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutPriceRulesInput, ProductUncheckedCreateWithoutPriceRulesInput>
  }

  export type ProductUpsertWithoutPriceRulesInput = {
    update: XOR<ProductUpdateWithoutPriceRulesInput, ProductUncheckedUpdateWithoutPriceRulesInput>
    create: XOR<ProductCreateWithoutPriceRulesInput, ProductUncheckedCreateWithoutPriceRulesInput>
    where?: ProductWhereInput
  }

  export type ProductUpdateToOneWithWhereWithoutPriceRulesInput = {
    where?: ProductWhereInput
    data: XOR<ProductUpdateWithoutPriceRulesInput, ProductUncheckedUpdateWithoutPriceRulesInput>
  }

  export type ProductUpdateWithoutPriceRulesInput = {
    id?: StringFieldUpdateOperationsInput | string
    barcode?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    basePriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFieldUpdateOperationsInput | number
    minStockAlert?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneWithoutProductsNestedInput
    orderItems?: OrderItemUpdateManyWithoutProductNestedInput
    images?: ProductImageUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateWithoutPriceRulesInput = {
    id?: StringFieldUpdateOperationsInput | string
    barcode?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    basePriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFieldUpdateOperationsInput | number
    minStockAlert?: IntFieldUpdateOperationsInput | number
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    orderItems?: OrderItemUncheckedUpdateManyWithoutProductNestedInput
    images?: ProductImageUncheckedUpdateManyWithoutProductNestedInput
  }

  export type UserCreateWithoutOrdersInput = {
    id?: string
    role?: $Enums.Role
    name: string
    email: string
    passwordHash: string
    walletBalanceKgs?: Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    sponsor?: UserCreateNestedOneWithoutSponsoredUsersInput
    sponsoredUsers?: UserCreateNestedManyWithoutSponsorInput
    transactions?: TransactionCreateNestedManyWithoutUserInput
    userWeeklyStats?: UserWeeklyStatsCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutOrdersInput = {
    id?: string
    role?: $Enums.Role
    sponsorId?: string | null
    name: string
    email: string
    passwordHash: string
    walletBalanceKgs?: Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    sponsoredUsers?: UserUncheckedCreateNestedManyWithoutSponsorInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutUserInput
    userWeeklyStats?: UserWeeklyStatsUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutOrdersInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutOrdersInput, UserUncheckedCreateWithoutOrdersInput>
  }

  export type OrderItemCreateWithoutOrderInput = {
    id?: string
    quantity: number
    unitPriceKgs: Decimal | DecimalJsLike | number | string
    totalPriceKgs: Decimal | DecimalJsLike | number | string
    product: ProductCreateNestedOneWithoutOrderItemsInput
  }

  export type OrderItemUncheckedCreateWithoutOrderInput = {
    id?: string
    productId: string
    quantity: number
    unitPriceKgs: Decimal | DecimalJsLike | number | string
    totalPriceKgs: Decimal | DecimalJsLike | number | string
  }

  export type OrderItemCreateOrConnectWithoutOrderInput = {
    where: OrderItemWhereUniqueInput
    create: XOR<OrderItemCreateWithoutOrderInput, OrderItemUncheckedCreateWithoutOrderInput>
  }

  export type OrderItemCreateManyOrderInputEnvelope = {
    data: OrderItemCreateManyOrderInput | OrderItemCreateManyOrderInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutOrdersInput = {
    update: XOR<UserUpdateWithoutOrdersInput, UserUncheckedUpdateWithoutOrdersInput>
    create: XOR<UserCreateWithoutOrdersInput, UserUncheckedCreateWithoutOrdersInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutOrdersInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutOrdersInput, UserUncheckedUpdateWithoutOrdersInput>
  }

  export type UserUpdateWithoutOrdersInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    walletBalanceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sponsor?: UserUpdateOneWithoutSponsoredUsersNestedInput
    sponsoredUsers?: UserUpdateManyWithoutSponsorNestedInput
    transactions?: TransactionUpdateManyWithoutUserNestedInput
    userWeeklyStats?: UserWeeklyStatsUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutOrdersInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    sponsorId?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    walletBalanceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sponsoredUsers?: UserUncheckedUpdateManyWithoutSponsorNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutUserNestedInput
    userWeeklyStats?: UserWeeklyStatsUncheckedUpdateManyWithoutUserNestedInput
  }

  export type OrderItemUpsertWithWhereUniqueWithoutOrderInput = {
    where: OrderItemWhereUniqueInput
    update: XOR<OrderItemUpdateWithoutOrderInput, OrderItemUncheckedUpdateWithoutOrderInput>
    create: XOR<OrderItemCreateWithoutOrderInput, OrderItemUncheckedCreateWithoutOrderInput>
  }

  export type OrderItemUpdateWithWhereUniqueWithoutOrderInput = {
    where: OrderItemWhereUniqueInput
    data: XOR<OrderItemUpdateWithoutOrderInput, OrderItemUncheckedUpdateWithoutOrderInput>
  }

  export type OrderItemUpdateManyWithWhereWithoutOrderInput = {
    where: OrderItemScalarWhereInput
    data: XOR<OrderItemUpdateManyMutationInput, OrderItemUncheckedUpdateManyWithoutOrderInput>
  }

  export type OrderCreateWithoutItemsInput = {
    id?: string
    orderType: $Enums.OrderType
    status?: $Enums.OrderStatus
    totalKgs: Decimal | DecimalJsLike | number | string
    totalUsd: Decimal | DecimalJsLike | number | string
    paymentMethod: $Enums.PaymentMethod
    customerName?: string | null
    customerPhone?: string | null
    address?: string | null
    receiptImageUrl?: string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutOrdersInput
  }

  export type OrderUncheckedCreateWithoutItemsInput = {
    id?: string
    userId: string
    orderType: $Enums.OrderType
    status?: $Enums.OrderStatus
    totalKgs: Decimal | DecimalJsLike | number | string
    totalUsd: Decimal | DecimalJsLike | number | string
    paymentMethod: $Enums.PaymentMethod
    customerName?: string | null
    customerPhone?: string | null
    address?: string | null
    receiptImageUrl?: string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type OrderCreateOrConnectWithoutItemsInput = {
    where: OrderWhereUniqueInput
    create: XOR<OrderCreateWithoutItemsInput, OrderUncheckedCreateWithoutItemsInput>
  }

  export type ProductCreateWithoutOrderItemsInput = {
    id?: string
    barcode: string
    name: string
    description?: string | null
    basePriceKgs: Decimal | DecimalJsLike | number | string
    basePriceUsd: Decimal | DecimalJsLike | number | string
    stockQuantity?: number
    minStockAlert?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    category?: CategoryCreateNestedOneWithoutProductsInput
    priceRules?: PriceRuleCreateNestedManyWithoutProductInput
    images?: ProductImageCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateWithoutOrderItemsInput = {
    id?: string
    barcode: string
    name: string
    description?: string | null
    basePriceKgs: Decimal | DecimalJsLike | number | string
    basePriceUsd: Decimal | DecimalJsLike | number | string
    stockQuantity?: number
    minStockAlert?: number
    categoryId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    priceRules?: PriceRuleUncheckedCreateNestedManyWithoutProductInput
    images?: ProductImageUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutOrderItemsInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutOrderItemsInput, ProductUncheckedCreateWithoutOrderItemsInput>
  }

  export type OrderUpsertWithoutItemsInput = {
    update: XOR<OrderUpdateWithoutItemsInput, OrderUncheckedUpdateWithoutItemsInput>
    create: XOR<OrderCreateWithoutItemsInput, OrderUncheckedCreateWithoutItemsInput>
    where?: OrderWhereInput
  }

  export type OrderUpdateToOneWithWhereWithoutItemsInput = {
    where?: OrderWhereInput
    data: XOR<OrderUpdateWithoutItemsInput, OrderUncheckedUpdateWithoutItemsInput>
  }

  export type OrderUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderType?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    status?: EnumOrderStatusFieldUpdateOperationsInput | $Enums.OrderStatus
    totalKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    receiptImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutOrdersNestedInput
  }

  export type OrderUncheckedUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderType?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    status?: EnumOrderStatusFieldUpdateOperationsInput | $Enums.OrderStatus
    totalKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    receiptImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductUpsertWithoutOrderItemsInput = {
    update: XOR<ProductUpdateWithoutOrderItemsInput, ProductUncheckedUpdateWithoutOrderItemsInput>
    create: XOR<ProductCreateWithoutOrderItemsInput, ProductUncheckedCreateWithoutOrderItemsInput>
    where?: ProductWhereInput
  }

  export type ProductUpdateToOneWithWhereWithoutOrderItemsInput = {
    where?: ProductWhereInput
    data: XOR<ProductUpdateWithoutOrderItemsInput, ProductUncheckedUpdateWithoutOrderItemsInput>
  }

  export type ProductUpdateWithoutOrderItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    barcode?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    basePriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFieldUpdateOperationsInput | number
    minStockAlert?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneWithoutProductsNestedInput
    priceRules?: PriceRuleUpdateManyWithoutProductNestedInput
    images?: ProductImageUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateWithoutOrderItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    barcode?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    basePriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFieldUpdateOperationsInput | number
    minStockAlert?: IntFieldUpdateOperationsInput | number
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    priceRules?: PriceRuleUncheckedUpdateManyWithoutProductNestedInput
    images?: ProductImageUncheckedUpdateManyWithoutProductNestedInput
  }

  export type UserCreateWithoutTransactionsInput = {
    id?: string
    role?: $Enums.Role
    name: string
    email: string
    passwordHash: string
    walletBalanceKgs?: Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    sponsor?: UserCreateNestedOneWithoutSponsoredUsersInput
    sponsoredUsers?: UserCreateNestedManyWithoutSponsorInput
    orders?: OrderCreateNestedManyWithoutUserInput
    userWeeklyStats?: UserWeeklyStatsCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutTransactionsInput = {
    id?: string
    role?: $Enums.Role
    sponsorId?: string | null
    name: string
    email: string
    passwordHash: string
    walletBalanceKgs?: Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    sponsoredUsers?: UserUncheckedCreateNestedManyWithoutSponsorInput
    orders?: OrderUncheckedCreateNestedManyWithoutUserInput
    userWeeklyStats?: UserWeeklyStatsUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutTransactionsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutTransactionsInput, UserUncheckedCreateWithoutTransactionsInput>
  }

  export type UserUpsertWithoutTransactionsInput = {
    update: XOR<UserUpdateWithoutTransactionsInput, UserUncheckedUpdateWithoutTransactionsInput>
    create: XOR<UserCreateWithoutTransactionsInput, UserUncheckedCreateWithoutTransactionsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutTransactionsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutTransactionsInput, UserUncheckedUpdateWithoutTransactionsInput>
  }

  export type UserUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    walletBalanceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sponsor?: UserUpdateOneWithoutSponsoredUsersNestedInput
    sponsoredUsers?: UserUpdateManyWithoutSponsorNestedInput
    orders?: OrderUpdateManyWithoutUserNestedInput
    userWeeklyStats?: UserWeeklyStatsUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    sponsorId?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    walletBalanceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sponsoredUsers?: UserUncheckedUpdateManyWithoutSponsorNestedInput
    orders?: OrderUncheckedUpdateManyWithoutUserNestedInput
    userWeeklyStats?: UserWeeklyStatsUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserWeeklyStatsCreateWithoutCycleInput = {
    id?: string
    personalVolume?: Decimal | DecimalJsLike | number | string
    teamVolume?: Decimal | DecimalJsLike | number | string
    carryOverVolume?: Decimal | DecimalJsLike | number | string
    user: UserCreateNestedOneWithoutUserWeeklyStatsInput
  }

  export type UserWeeklyStatsUncheckedCreateWithoutCycleInput = {
    id?: string
    userId: string
    personalVolume?: Decimal | DecimalJsLike | number | string
    teamVolume?: Decimal | DecimalJsLike | number | string
    carryOverVolume?: Decimal | DecimalJsLike | number | string
  }

  export type UserWeeklyStatsCreateOrConnectWithoutCycleInput = {
    where: UserWeeklyStatsWhereUniqueInput
    create: XOR<UserWeeklyStatsCreateWithoutCycleInput, UserWeeklyStatsUncheckedCreateWithoutCycleInput>
  }

  export type UserWeeklyStatsCreateManyCycleInputEnvelope = {
    data: UserWeeklyStatsCreateManyCycleInput | UserWeeklyStatsCreateManyCycleInput[]
    skipDuplicates?: boolean
  }

  export type UserWeeklyStatsUpsertWithWhereUniqueWithoutCycleInput = {
    where: UserWeeklyStatsWhereUniqueInput
    update: XOR<UserWeeklyStatsUpdateWithoutCycleInput, UserWeeklyStatsUncheckedUpdateWithoutCycleInput>
    create: XOR<UserWeeklyStatsCreateWithoutCycleInput, UserWeeklyStatsUncheckedCreateWithoutCycleInput>
  }

  export type UserWeeklyStatsUpdateWithWhereUniqueWithoutCycleInput = {
    where: UserWeeklyStatsWhereUniqueInput
    data: XOR<UserWeeklyStatsUpdateWithoutCycleInput, UserWeeklyStatsUncheckedUpdateWithoutCycleInput>
  }

  export type UserWeeklyStatsUpdateManyWithWhereWithoutCycleInput = {
    where: UserWeeklyStatsScalarWhereInput
    data: XOR<UserWeeklyStatsUpdateManyMutationInput, UserWeeklyStatsUncheckedUpdateManyWithoutCycleInput>
  }

  export type UserCreateWithoutUserWeeklyStatsInput = {
    id?: string
    role?: $Enums.Role
    name: string
    email: string
    passwordHash: string
    walletBalanceKgs?: Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    sponsor?: UserCreateNestedOneWithoutSponsoredUsersInput
    sponsoredUsers?: UserCreateNestedManyWithoutSponsorInput
    orders?: OrderCreateNestedManyWithoutUserInput
    transactions?: TransactionCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutUserWeeklyStatsInput = {
    id?: string
    role?: $Enums.Role
    sponsorId?: string | null
    name: string
    email: string
    passwordHash: string
    walletBalanceKgs?: Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    sponsoredUsers?: UserUncheckedCreateNestedManyWithoutSponsorInput
    orders?: OrderUncheckedCreateNestedManyWithoutUserInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutUserWeeklyStatsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutUserWeeklyStatsInput, UserUncheckedCreateWithoutUserWeeklyStatsInput>
  }

  export type WeeklyCycleCreateWithoutUserStatsInput = {
    id?: string
    weekNumber: number
    year: number
    startDate: Date | string
    endDate?: Date | string | null
    isClosed?: boolean
  }

  export type WeeklyCycleUncheckedCreateWithoutUserStatsInput = {
    id?: string
    weekNumber: number
    year: number
    startDate: Date | string
    endDate?: Date | string | null
    isClosed?: boolean
  }

  export type WeeklyCycleCreateOrConnectWithoutUserStatsInput = {
    where: WeeklyCycleWhereUniqueInput
    create: XOR<WeeklyCycleCreateWithoutUserStatsInput, WeeklyCycleUncheckedCreateWithoutUserStatsInput>
  }

  export type UserUpsertWithoutUserWeeklyStatsInput = {
    update: XOR<UserUpdateWithoutUserWeeklyStatsInput, UserUncheckedUpdateWithoutUserWeeklyStatsInput>
    create: XOR<UserCreateWithoutUserWeeklyStatsInput, UserUncheckedCreateWithoutUserWeeklyStatsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutUserWeeklyStatsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutUserWeeklyStatsInput, UserUncheckedUpdateWithoutUserWeeklyStatsInput>
  }

  export type UserUpdateWithoutUserWeeklyStatsInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    walletBalanceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sponsor?: UserUpdateOneWithoutSponsoredUsersNestedInput
    sponsoredUsers?: UserUpdateManyWithoutSponsorNestedInput
    orders?: OrderUpdateManyWithoutUserNestedInput
    transactions?: TransactionUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutUserWeeklyStatsInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    sponsorId?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    walletBalanceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sponsoredUsers?: UserUncheckedUpdateManyWithoutSponsorNestedInput
    orders?: OrderUncheckedUpdateManyWithoutUserNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutUserNestedInput
  }

  export type WeeklyCycleUpsertWithoutUserStatsInput = {
    update: XOR<WeeklyCycleUpdateWithoutUserStatsInput, WeeklyCycleUncheckedUpdateWithoutUserStatsInput>
    create: XOR<WeeklyCycleCreateWithoutUserStatsInput, WeeklyCycleUncheckedCreateWithoutUserStatsInput>
    where?: WeeklyCycleWhereInput
  }

  export type WeeklyCycleUpdateToOneWithWhereWithoutUserStatsInput = {
    where?: WeeklyCycleWhereInput
    data: XOR<WeeklyCycleUpdateWithoutUserStatsInput, WeeklyCycleUncheckedUpdateWithoutUserStatsInput>
  }

  export type WeeklyCycleUpdateWithoutUserStatsInput = {
    id?: StringFieldUpdateOperationsInput | string
    weekNumber?: IntFieldUpdateOperationsInput | number
    year?: IntFieldUpdateOperationsInput | number
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isClosed?: BoolFieldUpdateOperationsInput | boolean
  }

  export type WeeklyCycleUncheckedUpdateWithoutUserStatsInput = {
    id?: StringFieldUpdateOperationsInput | string
    weekNumber?: IntFieldUpdateOperationsInput | number
    year?: IntFieldUpdateOperationsInput | number
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isClosed?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ProductCreateWithoutCategoryInput = {
    id?: string
    barcode: string
    name: string
    description?: string | null
    basePriceKgs: Decimal | DecimalJsLike | number | string
    basePriceUsd: Decimal | DecimalJsLike | number | string
    stockQuantity?: number
    minStockAlert?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    priceRules?: PriceRuleCreateNestedManyWithoutProductInput
    orderItems?: OrderItemCreateNestedManyWithoutProductInput
    images?: ProductImageCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateWithoutCategoryInput = {
    id?: string
    barcode: string
    name: string
    description?: string | null
    basePriceKgs: Decimal | DecimalJsLike | number | string
    basePriceUsd: Decimal | DecimalJsLike | number | string
    stockQuantity?: number
    minStockAlert?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    priceRules?: PriceRuleUncheckedCreateNestedManyWithoutProductInput
    orderItems?: OrderItemUncheckedCreateNestedManyWithoutProductInput
    images?: ProductImageUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutCategoryInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutCategoryInput, ProductUncheckedCreateWithoutCategoryInput>
  }

  export type ProductCreateManyCategoryInputEnvelope = {
    data: ProductCreateManyCategoryInput | ProductCreateManyCategoryInput[]
    skipDuplicates?: boolean
  }

  export type ProductUpsertWithWhereUniqueWithoutCategoryInput = {
    where: ProductWhereUniqueInput
    update: XOR<ProductUpdateWithoutCategoryInput, ProductUncheckedUpdateWithoutCategoryInput>
    create: XOR<ProductCreateWithoutCategoryInput, ProductUncheckedCreateWithoutCategoryInput>
  }

  export type ProductUpdateWithWhereUniqueWithoutCategoryInput = {
    where: ProductWhereUniqueInput
    data: XOR<ProductUpdateWithoutCategoryInput, ProductUncheckedUpdateWithoutCategoryInput>
  }

  export type ProductUpdateManyWithWhereWithoutCategoryInput = {
    where: ProductScalarWhereInput
    data: XOR<ProductUpdateManyMutationInput, ProductUncheckedUpdateManyWithoutCategoryInput>
  }

  export type ProductScalarWhereInput = {
    AND?: ProductScalarWhereInput | ProductScalarWhereInput[]
    OR?: ProductScalarWhereInput[]
    NOT?: ProductScalarWhereInput | ProductScalarWhereInput[]
    id?: StringFilter<"Product"> | string
    barcode?: StringFilter<"Product"> | string
    name?: StringFilter<"Product"> | string
    description?: StringNullableFilter<"Product"> | string | null
    basePriceKgs?: DecimalFilter<"Product"> | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFilter<"Product"> | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFilter<"Product"> | number
    minStockAlert?: IntFilter<"Product"> | number
    categoryId?: StringNullableFilter<"Product"> | string | null
    createdAt?: DateTimeFilter<"Product"> | Date | string
    updatedAt?: DateTimeFilter<"Product"> | Date | string
  }

  export type ProductCreateWithoutImagesInput = {
    id?: string
    barcode: string
    name: string
    description?: string | null
    basePriceKgs: Decimal | DecimalJsLike | number | string
    basePriceUsd: Decimal | DecimalJsLike | number | string
    stockQuantity?: number
    minStockAlert?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    category?: CategoryCreateNestedOneWithoutProductsInput
    priceRules?: PriceRuleCreateNestedManyWithoutProductInput
    orderItems?: OrderItemCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateWithoutImagesInput = {
    id?: string
    barcode: string
    name: string
    description?: string | null
    basePriceKgs: Decimal | DecimalJsLike | number | string
    basePriceUsd: Decimal | DecimalJsLike | number | string
    stockQuantity?: number
    minStockAlert?: number
    categoryId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    priceRules?: PriceRuleUncheckedCreateNestedManyWithoutProductInput
    orderItems?: OrderItemUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutImagesInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutImagesInput, ProductUncheckedCreateWithoutImagesInput>
  }

  export type ProductUpsertWithoutImagesInput = {
    update: XOR<ProductUpdateWithoutImagesInput, ProductUncheckedUpdateWithoutImagesInput>
    create: XOR<ProductCreateWithoutImagesInput, ProductUncheckedCreateWithoutImagesInput>
    where?: ProductWhereInput
  }

  export type ProductUpdateToOneWithWhereWithoutImagesInput = {
    where?: ProductWhereInput
    data: XOR<ProductUpdateWithoutImagesInput, ProductUncheckedUpdateWithoutImagesInput>
  }

  export type ProductUpdateWithoutImagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    barcode?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    basePriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFieldUpdateOperationsInput | number
    minStockAlert?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneWithoutProductsNestedInput
    priceRules?: PriceRuleUpdateManyWithoutProductNestedInput
    orderItems?: OrderItemUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateWithoutImagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    barcode?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    basePriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFieldUpdateOperationsInput | number
    minStockAlert?: IntFieldUpdateOperationsInput | number
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    priceRules?: PriceRuleUncheckedUpdateManyWithoutProductNestedInput
    orderItems?: OrderItemUncheckedUpdateManyWithoutProductNestedInput
  }

  export type UserCreateManySponsorInput = {
    id?: string
    role?: $Enums.Role
    name: string
    email: string
    passwordHash: string
    walletBalanceKgs?: Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type OrderCreateManyUserInput = {
    id?: string
    orderType: $Enums.OrderType
    status?: $Enums.OrderStatus
    totalKgs: Decimal | DecimalJsLike | number | string
    totalUsd: Decimal | DecimalJsLike | number | string
    paymentMethod: $Enums.PaymentMethod
    customerName?: string | null
    customerPhone?: string | null
    address?: string | null
    receiptImageUrl?: string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TransactionCreateManyUserInput = {
    id?: string
    type: $Enums.TransactionType
    amount: Decimal | DecimalJsLike | number | string
    currency: $Enums.Currency
    description?: string | null
    createdAt?: Date | string
  }

  export type UserWeeklyStatsCreateManyUserInput = {
    id?: string
    cycleId: string
    personalVolume?: Decimal | DecimalJsLike | number | string
    teamVolume?: Decimal | DecimalJsLike | number | string
    carryOverVolume?: Decimal | DecimalJsLike | number | string
  }

  export type UserUpdateWithoutSponsorInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    walletBalanceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sponsoredUsers?: UserUpdateManyWithoutSponsorNestedInput
    orders?: OrderUpdateManyWithoutUserNestedInput
    transactions?: TransactionUpdateManyWithoutUserNestedInput
    userWeeklyStats?: UserWeeklyStatsUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSponsorInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    walletBalanceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sponsoredUsers?: UserUncheckedUpdateManyWithoutSponsorNestedInput
    orders?: OrderUncheckedUpdateManyWithoutUserNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutUserNestedInput
    userWeeklyStats?: UserWeeklyStatsUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateManyWithoutSponsorInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    walletBalanceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    walletBalanceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OrderUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderType?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    status?: EnumOrderStatusFieldUpdateOperationsInput | $Enums.OrderStatus
    totalKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    receiptImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: OrderItemUpdateManyWithoutOrderNestedInput
  }

  export type OrderUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderType?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    status?: EnumOrderStatusFieldUpdateOperationsInput | $Enums.OrderStatus
    totalKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    receiptImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: OrderItemUncheckedUpdateManyWithoutOrderNestedInput
  }

  export type OrderUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderType?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    status?: EnumOrderStatusFieldUpdateOperationsInput | $Enums.OrderStatus
    totalKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    paymentMethod?: EnumPaymentMethodFieldUpdateOperationsInput | $Enums.PaymentMethod
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    receiptImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ocrResult?: NullableJsonNullValueInput | InputJsonValue
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserWeeklyStatsUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    personalVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    teamVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    carryOverVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    cycle?: WeeklyCycleUpdateOneRequiredWithoutUserStatsNestedInput
  }

  export type UserWeeklyStatsUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    cycleId?: StringFieldUpdateOperationsInput | string
    personalVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    teamVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    carryOverVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type UserWeeklyStatsUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    cycleId?: StringFieldUpdateOperationsInput | string
    personalVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    teamVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    carryOverVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type PriceRuleCreateManyProductInput = {
    id?: string
    role: $Enums.Role
    customPriceKgs: Decimal | DecimalJsLike | number | string
  }

  export type OrderItemCreateManyProductInput = {
    id?: string
    orderId: string
    quantity: number
    unitPriceKgs: Decimal | DecimalJsLike | number | string
    totalPriceKgs: Decimal | DecimalJsLike | number | string
  }

  export type ProductImageCreateManyProductInput = {
    id?: string
    imageUrl: string
    sortOrder?: number
  }

  export type PriceRuleUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    customPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type PriceRuleUncheckedUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    customPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type PriceRuleUncheckedUpdateManyWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    customPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type OrderItemUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    order?: OrderUpdateOneRequiredWithoutItemsNestedInput
  }

  export type OrderItemUncheckedUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type OrderItemUncheckedUpdateManyWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type ProductImageUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type ProductImageUncheckedUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type ProductImageUncheckedUpdateManyWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
  }

  export type OrderItemCreateManyOrderInput = {
    id?: string
    productId: string
    quantity: number
    unitPriceKgs: Decimal | DecimalJsLike | number | string
    totalPriceKgs: Decimal | DecimalJsLike | number | string
  }

  export type OrderItemUpdateWithoutOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    product?: ProductUpdateOneRequiredWithoutOrderItemsNestedInput
  }

  export type OrderItemUncheckedUpdateWithoutOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type OrderItemUncheckedUpdateManyWithoutOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    unitPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalPriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type UserWeeklyStatsCreateManyCycleInput = {
    id?: string
    userId: string
    personalVolume?: Decimal | DecimalJsLike | number | string
    teamVolume?: Decimal | DecimalJsLike | number | string
    carryOverVolume?: Decimal | DecimalJsLike | number | string
  }

  export type UserWeeklyStatsUpdateWithoutCycleInput = {
    id?: StringFieldUpdateOperationsInput | string
    personalVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    teamVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    carryOverVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    user?: UserUpdateOneRequiredWithoutUserWeeklyStatsNestedInput
  }

  export type UserWeeklyStatsUncheckedUpdateWithoutCycleInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    personalVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    teamVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    carryOverVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type UserWeeklyStatsUncheckedUpdateManyWithoutCycleInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    personalVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    teamVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    carryOverVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type ProductCreateManyCategoryInput = {
    id?: string
    barcode: string
    name: string
    description?: string | null
    basePriceKgs: Decimal | DecimalJsLike | number | string
    basePriceUsd: Decimal | DecimalJsLike | number | string
    stockQuantity?: number
    minStockAlert?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProductUpdateWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    barcode?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    basePriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFieldUpdateOperationsInput | number
    minStockAlert?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    priceRules?: PriceRuleUpdateManyWithoutProductNestedInput
    orderItems?: OrderItemUpdateManyWithoutProductNestedInput
    images?: ProductImageUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    barcode?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    basePriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFieldUpdateOperationsInput | number
    minStockAlert?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    priceRules?: PriceRuleUncheckedUpdateManyWithoutProductNestedInput
    orderItems?: OrderItemUncheckedUpdateManyWithoutProductNestedInput
    images?: ProductImageUncheckedUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateManyWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    barcode?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    basePriceKgs?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    basePriceUsd?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stockQuantity?: IntFieldUpdateOperationsInput | number
    minStockAlert?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use UserCountOutputTypeDefaultArgs instead
     */
    export type UserCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ProductCountOutputTypeDefaultArgs instead
     */
    export type ProductCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ProductCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use OrderCountOutputTypeDefaultArgs instead
     */
    export type OrderCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = OrderCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use WeeklyCycleCountOutputTypeDefaultArgs instead
     */
    export type WeeklyCycleCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = WeeklyCycleCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CategoryCountOutputTypeDefaultArgs instead
     */
    export type CategoryCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CategoryCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserDefaultArgs instead
     */
    export type UserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ProductDefaultArgs instead
     */
    export type ProductArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ProductDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PriceRuleDefaultArgs instead
     */
    export type PriceRuleArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PriceRuleDefaultArgs<ExtArgs>
    /**
     * @deprecated Use OrderDefaultArgs instead
     */
    export type OrderArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = OrderDefaultArgs<ExtArgs>
    /**
     * @deprecated Use OrderItemDefaultArgs instead
     */
    export type OrderItemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = OrderItemDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TransactionDefaultArgs instead
     */
    export type TransactionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TransactionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ExchangeRateDefaultArgs instead
     */
    export type ExchangeRateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ExchangeRateDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SystemConfigDefaultArgs instead
     */
    export type SystemConfigArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SystemConfigDefaultArgs<ExtArgs>
    /**
     * @deprecated Use WeeklyCycleDefaultArgs instead
     */
    export type WeeklyCycleArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = WeeklyCycleDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserWeeklyStatsDefaultArgs instead
     */
    export type UserWeeklyStatsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserWeeklyStatsDefaultArgs<ExtArgs>
    /**
     * @deprecated Use HeroSlideDefaultArgs instead
     */
    export type HeroSlideArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = HeroSlideDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CategoryDefaultArgs instead
     */
    export type CategoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CategoryDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ProductImageDefaultArgs instead
     */
    export type ProductImageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ProductImageDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SiteSettingsDefaultArgs instead
     */
    export type SiteSettingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SiteSettingsDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}