// shim for npm packages without @types/* definitions
// these packages ship their own typings or are runtime-only
declare module 'web-push' {
  export interface PushSubscription { endpoint: string; keys: { p256dh: string; auth: string } }
  export interface VapidKeys { publicKey: string; privateKey: string; subject: string }
  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void
  export function generateVAPIDKeys(): VapidKeys
  export function sendNotification(subscription: PushSubscription | string, payload: string | Buffer, options?: any): Promise<any>
  const _default: { setVapidDetails: typeof setVapidDetails; generateVAPIDKeys: typeof generateVAPIDKeys; sendNotification: typeof sendNotification }
  export default _default
}

declare module 'jsonwebtoken' {
  export interface SignOptions { expiresIn?: string | number; [k: string]: any }
  export function sign(payload: object, secret: string, options?: SignOptions): string
  export function verify<T = any>(token: string, secret: string): T
  const _default: { sign: typeof sign; verify: typeof verify }
  export default _default
}

declare module 'xml2js' {
  export interface ParserOptions { explicitArray?: boolean; mergeAttrs?: boolean; [k: string]: any }
  export interface BuilderOptions { [k: string]: any }
  export function parseString(xml: string, options: ParserOptions, callback: (err: Error | null, result: any) => void): void
  export function parseStringPromise(xml: string, options?: ParserOptions): Promise<any>
  export const Parser: any
  const _default: { parseString: typeof parseString; parseStringPromise: typeof parseStringPromise; Parser: any }
  export default _default
}
