/**
 * Offline-First IndexedDB Service for POS Module
 * Ensures the app can handle cart and barcode scanning even without internet.
 */

const DB_NAME = 'PowerVital_POS_DB';
const DB_VERSION = 1;

export class POSDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Offline Orders Store
        if (!db.objectStoreNames.contains('offline_orders')) {
          db.createObjectStore('offline_orders', { keyPath: 'id', autoIncrement: true });
        }
        
        // Cached Products Store (for barcode scanning offline)
        if (!db.objectStoreNames.contains('cached_products')) {
          const productStore = db.createObjectStore('cached_products', { keyPath: 'barcode' });
          productStore.createIndex('name', 'name', { unique: false });
        }
      };

      request.onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('[POS DB] IndexedDB initialized for offline-first support.');
        resolve();
      };

      request.onerror = (event: Event) => {
        console.error('[POS DB] IndexedDB initialization failed', event);
        reject('Error initializing IndexedDB');
      };
    });
  }

  async saveOfflineOrder(order: any): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const tx = this.db.transaction('offline_orders', 'readwrite');
      const store = tx.objectStore('offline_orders');
      
      const request = store.add({ ...order, syncStatus: 'pending', timestamp: new Date().toISOString() });
      
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheProduct(product: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const tx = this.db.transaction('cached_products', 'readwrite');
      const store = tx.objectStore('cached_products');
      
      const request = store.put(product);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getProductByBarcode(barcode: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const tx = this.db.transaction('cached_products', 'readonly');
      const store = tx.objectStore('cached_products');
      
      const request = store.get(barcode);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const posDb = new POSDatabase();
