import { defineStore } from 'pinia';
import { shallowRef } from 'vue';
import axios from 'axios';

export interface PageBlock {
  id: string;
  type: string;
  position: number;
  visible: boolean;
  data: Record<string, any>;
}

export const usePageBuilderStore = defineStore('pageBuilder', () => {
  // Global State for the Dynamic Blocks (CMS Schema)
  // Initial state is empty — blocks are loaded from /api/v1/settings on StorefrontView mount.
  // DO NOT hardcode default deals here, as they would override the real DB-backed
  // product on first render (before fetchBlocks resolves). Real data wins.
  const storefrontBlocks = shallowRef<PageBlock[]>([]);
  const productBlocks = shallowRef<PageBlock[]>([]);
  const cartBlocks = shallowRef<PageBlock[]>([]);
  const isPageBuilderLoading = shallowRef<boolean>(false);
  // Server-computed hash of the homepageBlocks column at last fetch/save.
  // Sent back on the next save as x-blocks-base-version so the backend can
  // detect another admin having saved in between (see settings.ts).
  const blocksVersion = shallowRef<string | null>(null);

  // --- Undo / Redo (session-only, not persisted) ---
  // Snapshots cover all three pages together so undo is a single
  // chronological timeline regardless of which tab is active when it's
  // triggered — matches how most editors treat undo history.
  interface BlocksSnapshot {
    storefront: PageBlock[];
    product: PageBlock[];
    cart: PageBlock[];
  }
  const MAX_HISTORY = 50;
  // Rapid edits to the SAME field (every keystroke calls updateBlockData)
  // are coalesced into one undo step instead of one per character —
  // matches the 800ms autosave debounce in PageBuilderView with margin.
  const COALESCE_WINDOW_MS = 1500;
  const undoStack: BlocksSnapshot[] = [];
  const redoStack: BlocksSnapshot[] = [];
  let lastActionKey: string | null = null;
  let lastActionTime = 0;
  const canUndo = shallowRef(false);
  const canRedo = shallowRef(false);

  const snapshot = (): BlocksSnapshot => ({
    storefront: JSON.parse(JSON.stringify(storefrontBlocks.value)),
    product: JSON.parse(JSON.stringify(productBlocks.value)),
    cart: JSON.parse(JSON.stringify(cartBlocks.value))
  });

  const syncHistoryFlags = () => {
    canUndo.value = undoStack.length > 0;
    canRedo.value = redoStack.length > 0;
  };

  /** Call BEFORE a discrete, deliberate mutation (add/remove/reorder/toggle). */
  const pushHistory = () => {
    undoStack.push(snapshot());
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack.length = 0; // a new action invalidates any redo timeline
    lastActionKey = null;
    syncHistoryFlags();
  };

  /** Call before a coalescing mutation (continuous field edits). */
  const pushHistoryCoalesced = (actionKey: string) => {
    const now = Date.now();
    if (actionKey === lastActionKey && now - lastActionTime < COALESCE_WINDOW_MS) {
      lastActionTime = now;
      return;
    }
    undoStack.push(snapshot());
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack.length = 0;
    lastActionKey = actionKey;
    lastActionTime = now;
    syncHistoryFlags();
  };

  const restore = (snap: BlocksSnapshot) => {
    storefrontBlocks.value = snap.storefront;
    productBlocks.value = snap.product;
    cartBlocks.value = snap.cart;
    if (typeof broadcastSync !== 'undefined') broadcastSync();
  };

  const undo = (): boolean => {
    const snap = undoStack.pop();
    if (!snap) return false;
    redoStack.push(snapshot());
    restore(snap);
    lastActionKey = null;
    syncHistoryFlags();
    return true;
  };

  const redo = (): boolean => {
    const snap = redoStack.pop();
    if (!snap) return false;
    undoStack.push(snapshot());
    restore(snap);
    lastActionKey = null;
    syncHistoryFlags();
    return true;
  };

  const fetchBlocks = async () => {
    isPageBuilderLoading.value = true;
    // A fresh sync from the server invalidates any local undo history —
    // it no longer corresponds to a state the server can round-trip to.
    undoStack.length = 0;
    redoStack.length = 0;
    lastActionKey = null;
    syncHistoryFlags();
    try {
      const res = await axios.get('/api/v1/settings');
      if (res.data && typeof res.data._blocksVersion === 'string') {
        blocksVersion.value = res.data._blocksVersion;
      }
      if (res.data && res.data.homepageBlocks) {
        let blocks = res.data.homepageBlocks;
        if (typeof blocks === 'string') {
          try { blocks = JSON.parse(blocks); } catch { console.warn('homepageBlocks parse failed'); return; }
        }
        if (blocks && typeof blocks === 'object') {
          // --- Inject Missing Default Fields for God Mode ---
          const defaultData: Record<string, any> = {
            'hero_slider_block': { bgColor: '#16120E' },
            'categorygridblock': { showCategoryText: 'true' },
            'productgridblock': {
              title: 'Çok Satan Ürünler',
              limit: '8',
              categoryId: ''
            }
          };

          const injectDefaults = (arr: PageBlock[]) => {
            if (!Array.isArray(arr)) return [];
            return arr.map(b => {
              if (defaultData[b.type]) {
                b.data = { ...defaultData[b.type], ...(b.data || {}) };
              }
              return b;
            });
          };

          const sfBlocks = Array.isArray(blocks.storefront) ? [...blocks.storefront] : [];
          // Ensure partners block exists
          if (!sfBlocks.find((b: any) => b.type === 'partners')) {
            sfBlocks.push({
              id: 'partners_1',
              type: 'partners',
              position: sfBlocks.length,
              visible: true,
              data: {}
            });
          }

          if (sfBlocks.length > 0) storefrontBlocks.value = injectDefaults(sfBlocks);
          if (blocks.product) productBlocks.value = injectDefaults(blocks.product);
          if (blocks.cart) cartBlocks.value = injectDefaults(blocks.cart);
        }
      }
    } catch (e) {
      console.error('Failed to fetch blocks:', e);
    } finally {
      isPageBuilderLoading.value = false;
    }
  };

  const saveBlocks = async () => {
    // Rethrows on failure (including 409 conflicts) — callers such as
    // PageBuilderView's flushSave() need to see this to surface a
    // save-error / conflict state instead of silently doing nothing.
    const res = await axios.put('/api/v1/settings', {
      homepageBlocks: {
        storefront: storefrontBlocks.value,
        product: productBlocks.value,
        cart: cartBlocks.value
      }
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        ...(blocksVersion.value ? { 'x-blocks-base-version': blocksVersion.value } : {})
      }
    });
    if (res.data && typeof res.data._blocksVersion === 'string') {
      blocksVersion.value = res.data._blocksVersion;
    }
  };

  // --- BroadcastChannel Sync ---
  let broadcastSync: () => void = () => {};

  if (typeof window !== 'undefined') {
    const channel = new BroadcastChannel('pb_sync_channel');
    
    // Listen for changes from other tabs/iframes
    channel.onmessage = (event) => {
      if (event.data.type === 'SYNC_STATE') {
        storefrontBlocks.value = event.data.payload.storefront;
        productBlocks.value = event.data.payload.product;
        cartBlocks.value = event.data.payload.cart;
      }
    };

    // Debounced Broadcast
    let syncTimeout: any = null;
    broadcastSync = () => {
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        channel.postMessage({
          type: 'SYNC_STATE',
          payload: {
            storefront: JSON.parse(JSON.stringify(storefrontBlocks.value)),
            product: JSON.parse(JSON.stringify(productBlocks.value)),
            cart: JSON.parse(JSON.stringify(cartBlocks.value))
          }
        });
      }, 100); // 100ms debounce saves ~90% CPU cycles on drag
    };
  }

  // --- Admin Drag-and-Drop Control Simulator Methods ---

  const getTargetArray = (page: 'storefront' | 'product' | 'cart') => {
    if (page === 'storefront') return storefrontBlocks;
    if (page === 'product') return productBlocks;
    return cartBlocks;
  };

  const reorderBlocks = (page: 'storefront' | 'product' | 'cart', startIndex: number, endIndex: number) => {
    pushHistory();
    const target = getTargetArray(page);
    const result = Array.from(target.value);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    // Update positions
    result.forEach((block, index) => {
      block.position = index + 1;
    });
    
    target.value = result;
    if (typeof broadcastSync !== 'undefined') broadcastSync();
  };

  const toggleVisibility = (page: 'storefront' | 'product' | 'cart', blockId: string) => {
    const target = getTargetArray(page);
    const block = target.value.find(b => b.id === blockId);
    if (block) {
      pushHistory();
      block.visible = !block.visible;
      target.value = [...target.value]; // Trigger shallowRef reactivity
      if (typeof broadcastSync !== 'undefined') broadcastSync();
    }
  };

  const updateBlockData = (page: 'storefront' | 'product' | 'cart', blockId: string, newData: Record<string, any>) => {
    const target = getTargetArray(page);
    const block = target.value.find(b => b.id === blockId);
    if (block) {
      pushHistoryCoalesced('updateBlockData:' + page + ':' + blockId);
      block.data = { ...block.data, ...newData };
      target.value = [...target.value]; // Trigger shallowRef reactivity
      if (typeof broadcastSync !== 'undefined') broadcastSync();
    }
  };

  const genId = () => `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  const renumber = (arr: PageBlock[]) => arr.forEach((b, i) => { b.position = i + 1; });

  /** Append a fresh block of the given type with its default data. Returns the new id. */
  const addBlock = (page: 'storefront' | 'product' | 'cart', type: string, defaultData: Record<string, any> = {}): string => {
    pushHistory();
    const target = getTargetArray(page);
    const id = genId();
    const result = [...target.value, {
      id,
      type,
      position: target.value.length + 1,
      visible: true,
      data: JSON.parse(JSON.stringify(defaultData)),
    }];
    renumber(result);
    target.value = result;
    if (typeof broadcastSync !== 'undefined') broadcastSync();
    return id;
  };

  /** Remove a block by id. */
  const removeBlock = (page: 'storefront' | 'product' | 'cart', blockId: string) => {
    pushHistory();
    const target = getTargetArray(page);
    const result = target.value.filter(b => b.id !== blockId);
    renumber(result);
    target.value = result;
    if (typeof broadcastSync !== 'undefined') broadcastSync();
  };

  /** Duplicate a block, inserting the copy directly after the original. Returns the new id. */
  const duplicateBlock = (page: 'storefront' | 'product' | 'cart', blockId: string): string | null => {
    const target = getTargetArray(page);
    const idx = target.value.findIndex(b => b.id === blockId);
    if (idx === -1) return null;
    pushHistory();
    const src = target.value[idx];
    const id = genId();
    const copy = { id, type: src.type, position: 0, visible: src.visible, data: JSON.parse(JSON.stringify(src.data || {})) };
    const result = [...target.value];
    result.splice(idx + 1, 0, copy);
    renumber(result);
    target.value = result;
    if (typeof broadcastSync !== 'undefined') broadcastSync();
    return id;
  };

  /** Move a block one slot up (-1) or down (+1). */
  const moveBlock = (page: 'storefront' | 'product' | 'cart', blockId: string, dir: -1 | 1) => {
    const target = getTargetArray(page);
    const idx = target.value.findIndex(b => b.id === blockId);
    if (idx === -1) return;
    const next = idx + dir;
    if (next < 0 || next >= target.value.length) return;
    reorderBlocks(page, idx, next);
  };

  return {
    storefrontBlocks,
    productBlocks,
    cartBlocks,
    isPageBuilderLoading,
    blocksVersion,
    fetchBlocks,
    saveBlocks,
    reorderBlocks,
    toggleVisibility,
    updateBlockData,
    addBlock,
    removeBlock,
    duplicateBlock,
    moveBlock,
    undo,
    redo,
    canUndo,
    canRedo
  };
});
