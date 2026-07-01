// usePageBuilderStore — unit tests for the Page Builder's Pinia store.
//
// Covers:
//   1. Block CRUD (add/remove/duplicate/reorder/move/toggle/update)
//   2. Undo/redo, including coalescing of rapid field edits and history
//      invalidation on fetch / new mutations
//   3. fetchBlocks (default-data injection, forced partners block)
//   4. saveBlocks (request shape, blocksVersion round-trip, error propagation)
//
// axios is mocked directly (usePageBuilderStore imports it, not the
// openapi-client wrapper), matching the pattern used by
// AdminFinanceSettings.test.ts and friends.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('axios', () => ({
  default: { get: vi.fn(), put: vi.fn() }
}));

import axios from 'axios';
import { usePageBuilderStore } from '../src/stores/usePageBuilderStore';

const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };

describe('usePageBuilderStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('block CRUD', () => {
    it('addBlock appends a block with sequential position and returns its id', () => {
      const store = usePageBuilderStore();
      const id1 = store.addBlock('storefront', 'partners', {});
      const id2 = store.addBlock('storefront', 'certificatesblock', { foo: 'bar' });

      expect(store.storefrontBlocks).toHaveLength(2);
      expect(store.storefrontBlocks[0]).toMatchObject({ id: id1, type: 'partners', position: 1, visible: true });
      expect(store.storefrontBlocks[1]).toMatchObject({ id: id2, type: 'certificatesblock', position: 2, data: { foo: 'bar' } });
      expect(id1).not.toBe(id2);
    });

    it('removeBlock removes by id and renumbers remaining positions', () => {
      const store = usePageBuilderStore();
      const id1 = store.addBlock('storefront', 'a');
      const id2 = store.addBlock('storefront', 'b');
      store.addBlock('storefront', 'c');

      store.removeBlock('storefront', id2);

      expect(store.storefrontBlocks.map(b => b.id)).toEqual([id1, store.storefrontBlocks[1].id]);
      expect(store.storefrontBlocks.map(b => b.position)).toEqual([1, 2]);
    });

    it('duplicateBlock inserts a copy directly after the original with a new id', () => {
      const store = usePageBuilderStore();
      const id1 = store.addBlock('storefront', 'promobanner', { productName: 'X' });
      store.addBlock('storefront', 'partners');

      const copyId = store.duplicateBlock('storefront', id1);

      expect(copyId).not.toBeNull();
      expect(store.storefrontBlocks.map(b => b.id)).toEqual([id1, copyId, store.storefrontBlocks[2].id]);
      expect(store.storefrontBlocks[1]).toMatchObject({ type: 'promobanner', data: { productName: 'X' } });
      // Data must be a deep copy, not a shared reference.
      store.updateBlockData('storefront', id1, { productName: 'Y' });
      expect(store.storefrontBlocks[1].data.productName).toBe('X');
    });

    it('duplicateBlock returns null for an id that does not exist', () => {
      const store = usePageBuilderStore();
      expect(store.duplicateBlock('storefront', 'missing')).toBeNull();
    });

    it('toggleVisibility flips the visible flag', () => {
      const store = usePageBuilderStore();
      const id = store.addBlock('storefront', 'partners');
      expect(store.storefrontBlocks[0].visible).toBe(true);
      store.toggleVisibility('storefront', id);
      expect(store.storefrontBlocks[0].visible).toBe(false);
      store.toggleVisibility('storefront', id);
      expect(store.storefrontBlocks[0].visible).toBe(true);
    });

    it('updateBlockData merges new fields without clobbering existing ones', () => {
      const store = usePageBuilderStore();
      const id = store.addBlock('storefront', 'promobanner', { productName: 'A', oldPrice: '100' });
      store.updateBlockData('storefront', id, { productName: 'B' });
      expect(store.storefrontBlocks[0].data).toEqual({ productName: 'B', oldPrice: '100' });
    });

    it('reorderBlocks moves a block and renumbers positions', () => {
      const store = usePageBuilderStore();
      const id1 = store.addBlock('storefront', 'a');
      const id2 = store.addBlock('storefront', 'b');
      const id3 = store.addBlock('storefront', 'c');

      store.reorderBlocks('storefront', 0, 2); // move first block to the end

      expect(store.storefrontBlocks.map(b => b.id)).toEqual([id2, id3, id1]);
      expect(store.storefrontBlocks.map(b => b.position)).toEqual([1, 2, 3]);
    });

    it('moveBlock nudges a block up/down and no-ops at the boundaries', () => {
      const store = usePageBuilderStore();
      const id1 = store.addBlock('storefront', 'a');
      const id2 = store.addBlock('storefront', 'b');

      store.moveBlock('storefront', id1, -1); // already first — no-op
      expect(store.storefrontBlocks.map(b => b.id)).toEqual([id1, id2]);

      store.moveBlock('storefront', id2, 1); // already last — no-op
      expect(store.storefrontBlocks.map(b => b.id)).toEqual([id1, id2]);

      store.moveBlock('storefront', id1, 1); // swap
      expect(store.storefrontBlocks.map(b => b.id)).toEqual([id2, id1]);
    });

    it('pages (storefront/product/cart) are independent arrays', () => {
      const store = usePageBuilderStore();
      store.addBlock('storefront', 'a');
      store.addBlock('product', 'b');
      store.addBlock('cart', 'cart_settings');
      expect(store.storefrontBlocks).toHaveLength(1);
      expect(store.productBlocks).toHaveLength(1);
      expect(store.cartBlocks).toHaveLength(1);
    });
  });

  describe('undo / redo', () => {
    it('canUndo/canRedo both start false', () => {
      const store = usePageBuilderStore();
      expect(store.canUndo).toBe(false);
      expect(store.canRedo).toBe(false);
    });

    it('undo reverts the last discrete mutation and flips the flags', () => {
      const store = usePageBuilderStore();
      store.addBlock('storefront', 'a');
      expect(store.canUndo).toBe(true);

      const undone = store.undo();

      expect(undone).toBe(true);
      expect(store.storefrontBlocks).toHaveLength(0);
      expect(store.canUndo).toBe(false);
      expect(store.canRedo).toBe(true);
    });

    it('undo on an empty history is a no-op and returns false', () => {
      const store = usePageBuilderStore();
      expect(store.undo()).toBe(false);
      expect(store.canUndo).toBe(false);
    });

    it('redo re-applies an undone mutation', () => {
      const store = usePageBuilderStore();
      const id = store.addBlock('storefront', 'a');
      store.undo();
      expect(store.storefrontBlocks).toHaveLength(0);

      const redone = store.redo();

      expect(redone).toBe(true);
      expect(store.storefrontBlocks.map(b => b.id)).toEqual([id]);
      expect(store.canRedo).toBe(false);
      expect(store.canUndo).toBe(true);
    });

    it('a new mutation after undo discards the redo timeline', () => {
      const store = usePageBuilderStore();
      store.addBlock('storefront', 'a');
      store.undo();
      expect(store.canRedo).toBe(true);

      store.addBlock('storefront', 'b');

      expect(store.canRedo).toBe(false);
      expect(store.redo()).toBe(false);
    });

    it('undo walks back multiple discrete mutations one at a time', () => {
      const store = usePageBuilderStore();
      store.addBlock('storefront', 'a');
      store.addBlock('storefront', 'b');
      store.addBlock('storefront', 'c');
      expect(store.storefrontBlocks).toHaveLength(3);

      store.undo();
      expect(store.storefrontBlocks).toHaveLength(2);
      store.undo();
      expect(store.storefrontBlocks).toHaveLength(1);
      store.undo();
      expect(store.storefrontBlocks).toHaveLength(0);
      expect(store.canUndo).toBe(false);
    });

    it('coalesces rapid updateBlockData calls on the same block into one undo step', () => {
      const store = usePageBuilderStore();
      const id = store.addBlock('storefront', 'promobanner', { productName: '' });

      store.updateBlockData('storefront', id, { productName: 'A' });
      store.updateBlockData('storefront', id, { productName: 'AB' });
      store.updateBlockData('storefront', id, { productName: 'ABC' });
      expect(store.storefrontBlocks[0].data.productName).toBe('ABC');

      // One undo should jump straight back to the pre-typing state, not
      // step through 'AB' first — otherwise a keystroke apart would each
      // need their own undo.
      store.undo();
      expect(store.storefrontBlocks[0].data.productName).toBe('');
    });

    it('does not coalesce updateBlockData calls once the coalesce window elapses', () => {
      vi.useFakeTimers();
      try {
        const store = usePageBuilderStore();
        const id = store.addBlock('storefront', 'promobanner', { productName: '' });

        store.updateBlockData('storefront', id, { productName: 'A' });
        vi.advanceTimersByTime(2000); // past COALESCE_WINDOW_MS
        store.updateBlockData('storefront', id, { productName: 'AB' });

        store.undo();
        expect(store.storefrontBlocks[0].data.productName).toBe('A');
        store.undo();
        expect(store.storefrontBlocks[0].data.productName).toBe('');
      } finally {
        vi.useRealTimers();
      }
    });

    it('coalescing is scoped per block — editing a different block starts a new step', () => {
      const store = usePageBuilderStore();
      const id1 = store.addBlock('storefront', 'promobanner', { productName: '' });
      const id2 = store.addBlock('storefront', 'promobanner', { productName: '' });

      store.updateBlockData('storefront', id1, { productName: 'A' });
      store.updateBlockData('storefront', id2, { productName: 'B' });

      store.undo();
      expect(store.storefrontBlocks[1].data.productName).toBe('');
      expect(store.storefrontBlocks[0].data.productName).toBe('A');
    });

    it('fetchBlocks clears any existing undo/redo history', async () => {
      mockedAxios.get.mockResolvedValue({ data: {} });
      const store = usePageBuilderStore();
      store.addBlock('storefront', 'a');
      store.undo();
      expect(store.canRedo).toBe(true);

      await store.fetchBlocks();

      expect(store.canUndo).toBe(false);
      expect(store.canRedo).toBe(false);
    });
  });

  describe('fetchBlocks', () => {
    it('populates all three pages from the response', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          _blocksVersion: 'v1',
          homepageBlocks: {
            storefront: [{ id: 's1', type: 'partners', position: 1, visible: true, data: {} }],
            product: [{ id: 'p1', type: 'reviewsection', position: 1, visible: true, data: {} }],
            cart: [{ id: 'c1', type: 'cart_settings', position: 1, visible: true, data: {} }]
          }
        }
      });
      const store = usePageBuilderStore();

      await store.fetchBlocks();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/settings');
      expect(store.storefrontBlocks.map(b => b.id)).toEqual(['s1']);
      expect(store.productBlocks.map(b => b.id)).toEqual(['p1']);
      expect(store.cartBlocks.map(b => b.id)).toEqual(['c1']);
      expect(store.blocksVersion).toBe('v1');
    });

    it('injects default data for known block types when fields are missing', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          homepageBlocks: {
            storefront: [{ id: 's1', type: 'productgridblock', position: 1, visible: true, data: {} }]
          }
        }
      });
      const store = usePageBuilderStore();

      await store.fetchBlocks();

      const block = store.storefrontBlocks.find(b => b.type === 'productgridblock');
      expect(block?.data).toMatchObject({ title: 'Çok Satan Ürünler', limit: '8', categoryId: '' });
    });

    it('existing data wins over injected defaults', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          homepageBlocks: {
            storefront: [{ id: 's1', type: 'productgridblock', position: 1, visible: true, data: { title: 'Custom Title' } }]
          }
        }
      });
      const store = usePageBuilderStore();

      await store.fetchBlocks();

      expect(store.storefrontBlocks[0].data.title).toBe('Custom Title');
      expect(store.storefrontBlocks[0].data.limit).toBe('8'); // still injected
    });

    it('auto-adds a partners block to storefront when none exists', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { homepageBlocks: { storefront: [{ id: 's1', type: 'reviewsection', position: 1, visible: true, data: {} }] } }
      });
      const store = usePageBuilderStore();

      await store.fetchBlocks();

      expect(store.storefrontBlocks.some(b => b.type === 'partners')).toBe(true);
    });

    it('does not duplicate the partners block if one already exists', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { homepageBlocks: { storefront: [{ id: 's1', type: 'partners', position: 1, visible: true, data: {} }] } }
      });
      const store = usePageBuilderStore();

      await store.fetchBlocks();

      expect(store.storefrontBlocks.filter(b => b.type === 'partners')).toHaveLength(1);
    });

    it('sets isPageBuilderLoading during the fetch and clears it after', async () => {
      let resolveFetch: (v: any) => void = () => {};
      mockedAxios.get.mockReturnValue(new Promise(res => { resolveFetch = res; }));
      const store = usePageBuilderStore();

      const promise = store.fetchBlocks();
      expect(store.isPageBuilderLoading).toBe(true);
      resolveFetch({ data: {} });
      await promise;
      expect(store.isPageBuilderLoading).toBe(false);
    });

    it('does not throw when the request fails, and still clears the loading flag', async () => {
      mockedAxios.get.mockRejectedValue(new Error('network down'));
      const store = usePageBuilderStore();

      await expect(store.fetchBlocks()).resolves.toBeUndefined();
      expect(store.isPageBuilderLoading).toBe(false);
    });
  });

  describe('saveBlocks', () => {
    it('PUTs all three page arrays to /api/v1/settings with the auth header', async () => {
      mockedAxios.put.mockResolvedValue({ data: {} });
      localStorage.setItem('token', 'tok-123');
      const store = usePageBuilderStore();
      store.addBlock('storefront', 'partners');

      await store.saveBlocks();

      expect(mockedAxios.put).toHaveBeenCalledWith(
        '/api/v1/settings',
        {
          homepageBlocks: {
            storefront: store.storefrontBlocks,
            product: [],
            cart: []
          }
        },
        { headers: { Authorization: 'Bearer tok-123' } }
      );
    });

    it('includes x-blocks-base-version once a version has been captured', async () => {
      mockedAxios.get.mockResolvedValue({ data: { _blocksVersion: 'v-init' } });
      mockedAxios.put.mockResolvedValue({ data: { _blocksVersion: 'v-next' } });
      const store = usePageBuilderStore();
      await store.fetchBlocks();

      await store.saveBlocks();

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ headers: expect.objectContaining({ 'x-blocks-base-version': 'v-init' }) })
      );
      expect(store.blocksVersion).toBe('v-next');
    });

    it('rethrows on failure instead of swallowing it (e.g. a 409 conflict)', async () => {
      const conflict = Object.assign(new Error('conflict'), { response: { status: 409 } });
      mockedAxios.put.mockRejectedValue(conflict);
      const store = usePageBuilderStore();

      await expect(store.saveBlocks()).rejects.toBe(conflict);
    });
  });
});
