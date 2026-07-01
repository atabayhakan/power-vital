// PageBuilderView — component tests for the save-status state machine
// (idle/pending/saving/saved/error/conflict) and the undo/redo controls.
// Block-mutation logic itself is covered by usePageBuilderStore.test.ts;
// here we only care about how the VIEW reacts to store state and to
// saveBlocks() resolving/rejecting.
//
// vuedraggable and ProductPickerModal are stubbed — neither is exercised
// by these scenarios and vuedraggable needs real DOM drag internals that
// happy-dom doesn't provide.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('axios', () => ({
  default: { get: vi.fn(), put: vi.fn() }
}));

vi.mock('../src/utils/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() }
}));

import axios from 'axios';
import PageBuilderView from '../src/views/PageBuilderView.vue';
import { usePageBuilderStore } from '../src/stores/usePageBuilderStore';

const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };

const i18n = (globalThis as any).__VITEST_I18N__;

// The store's cross-tab sync opens a real BroadcastChannel('pb_sync_channel')
// so multiple admin tabs stay in sync in production — but that channel is
// process-global, not scoped to a Pinia instance. Every test in this file
// mounts a fresh store, yet they'd all share the SAME channel, so a
// debounced broadcast queued by an earlier test can land on a later test's
// store and inject stale blocks. Stub it to a no-op so tests stay isolated;
// the real cross-tab behavior isn't what's under test here.
class FakeBroadcastChannel {
  onmessage: ((ev: any) => void) | null = null;
  constructor(_name: string) {}
  postMessage(_data: any) {}
  close() {}
}
vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);

const mountView = () => {
  setActivePinia(createPinia());
  return mount(PageBuilderView, {
    global: {
      plugins: [i18n],
      stubs: { draggable: true, ProductPickerModal: true, RouterLink: true }
    }
  });
};

describe('PageBuilderView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Adding a block to the canvas mounts its REAL component (this view
    // renders live block previews, not mocks), and several blocks
    // (HeroSlider, CategoryGrid, PartnersBlock, ...) fetch their own data
    // on mount expecting an array. A single blanket mock response would
    // make those `.filter()`/`.map()` calls throw, so branch on the URL:
    // the settings endpoint returns the object these tests care about,
    // everything else gets an empty array (closest thing to "no data yet").
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === '/api/v1/settings') return Promise.resolve({ data: { _blocksVersion: 'v1' } });
      return Promise.resolve({ data: [] });
    });
    mockedAxios.put.mockResolvedValue({ data: { _blocksVersion: 'v2' } });
  });

  it('fetches blocks on mount and starts in the idle state', async () => {
    const w = mountView();
    await flushPromises();

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/settings');
    expect(w.find('.pb-save').classes()).toContain('is-idle');
    expect(w.text()).toContain('Hazır');
  });

  it('manual save calls saveBlocks and shows the saved state with a timestamp', async () => {
    const w = mountView();
    await flushPromises();

    await w.find('.pb-save__btn').trigger('click');
    await flushPromises();

    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    expect(w.find('.pb-save').classes()).toContain('is-saved');
    expect(w.text()).toContain('Kaydedildi');
  });

  it('shows the conflict banner and a reload button when saveBlocks 409s', async () => {
    const conflict = Object.assign(new Error('conflict'), { response: { status: 409 } });
    mockedAxios.put.mockRejectedValueOnce(conflict);
    const w = mountView();
    await flushPromises();

    await w.find('.pb-save__btn').trigger('click');
    await flushPromises();

    expect(w.find('.pb-save').classes()).toContain('is-conflict');
    expect(w.text()).toContain('başka bir yönetici tarafından güncellendi');
    // The warn/reload button also carries the base .pb-save__btn class, so
    // assert on its distinguishing modifier + label rather than absence of
    // the base class.
    expect(w.find('.pb-save__btn--warn').text()).toContain('Yeniden Yükle');
    expect(w.text()).not.toContain('Kaydediliyor');
  });

  it('reload after a conflict re-fetches blocks and returns to idle', async () => {
    const conflict = Object.assign(new Error('conflict'), { response: { status: 409 } });
    mockedAxios.put.mockRejectedValueOnce(conflict);
    const w = mountView();
    await flushPromises();
    await w.find('.pb-save__btn').trigger('click');
    await flushPromises();
    expect(w.find('.pb-save').classes()).toContain('is-conflict');

    mockedAxios.get.mockClear();
    await w.find('.pb-save__btn--warn').trigger('click');
    await flushPromises();

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/settings');
    expect(w.find('.pb-save').classes()).toContain('is-idle');
    expect(w.find('.pb-save__btn--warn').exists()).toBe(false);
  });

  it('shows a generic error state for a non-conflict save failure', async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error('network down'));
    const w = mountView();
    await flushPromises();

    await w.find('.pb-save__btn').trigger('click');
    await flushPromises();

    expect(w.find('.pb-save').classes()).toContain('is-error');
    expect(w.text()).toContain('Kayıt başarısız');
  });

  it('mutations mark the state pending but never call the network on their own — only Kaydet does', async () => {
    const w = mountView();
    await flushPromises();

    await w.find('.pb-add-btn').trigger('click');
    const addButtons = w.findAll('.pb-modal-overlay button').filter(b => b.text().includes('Ekle') && b.text() !== '');
    await addButtons[0].trigger('click');
    await flushPromises();

    // Regression guard: this view used to auto-save 800ms after every
    // mutation. The admin explicitly asked for manual-save-only, so no
    // PUT should ever fire without clicking Kaydet — verify that holds
    // even after waiting well past the old debounce window.
    await new Promise(r => setTimeout(r, 100));
    expect(mockedAxios.put).not.toHaveBeenCalled();
    expect(w.find('.pb-save').classes()).toContain('is-pending');
    expect(w.text()).toContain('Kaydedilmemiş değişiklikler var');

    await w.find('.pb-save__btn').trigger('click');
    await flushPromises();
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
  });

  it('dragging reorders the block list via the change event (not update:model-value)', async () => {
    // Seed two blocks directly through the store rather than the "Blok
    // Ekle" UI flow: real block types render their actual component in
    // the canvas (this view previews live, not mocks), and most of them
    // fetch their own data + call useRouter() on mount — noise that has
    // nothing to do with what this test checks. Only the layer list
    // (left panel) and the drag handler are under test here.
    // Note: draggable is NOT stubbed here (unlike the other tests) — its
    // items render via a scoped slot, and a shallow `true` stub skips
    // slot content entirely, so the .pb-card elements under test would
    // never appear. We aren't exercising real Sortable.js drag physics,
    // just emitting the `change` event it would fire, so the real
    // component mounting (without actual pointer interaction) is safe.
    setActivePinia(createPinia());
    const w = mount(PageBuilderView, {
      global: { plugins: [i18n], stubs: { ProductPickerModal: true, RouterLink: true } }
    });
    await flushPromises();
    const store = usePageBuilderStore();
    store.addBlock('storefront', 'unknown_test_block_a');
    store.addBlock('storefront', 'unknown_test_block_b');
    await flushPromises();

    const namesBefore = w.findAll('.pb-card__meta').map(n => n.text());
    expect(namesBefore).toHaveLength(2);

    // vuedraggable reports reorders on `change` as { moved: { oldIndex,
    // newIndex } } — NOT on update:model-value (that only carries the
    // already-spliced array). Simulate exactly that contract.
    const draggableStub = w.findComponent({ name: 'draggable' });
    await draggableStub.vm.$emit('change', { moved: { oldIndex: 0, newIndex: 1 } });
    await flushPromises();

    expect(store.storefrontBlocks.map(b => b.type)).toEqual(['unknown_test_block_b', 'unknown_test_block_a']);
    expect(w.find('.pb-save').classes()).toContain('is-pending');
  });

  it('undo/redo buttons are disabled until there is history, and undo removes the last added block', async () => {
    const w = mountView();
    await flushPromises();

    const [undoBtn, redoBtn] = w.findAll('.pb-undo-group button');
    expect(undoBtn.attributes('disabled')).toBeDefined();
    expect(redoBtn.attributes('disabled')).toBeDefined();

    await w.find('.pb-add-btn').trigger('click'); // opens the block library
    const addButtons = w.findAll('.pb-modal-overlay button').filter(b => b.text().includes('Ekle') && b.text() !== '');
    await addButtons[0].trigger('click');
    await flushPromises();

    expect(w.find('.pb-count').text()).toBe('1');
    const [undoAfterAdd] = w.findAll('.pb-undo-group button');
    expect(undoAfterAdd.attributes('disabled')).toBeUndefined();

    await undoAfterAdd.trigger('click');
    await flushPromises();

    expect(w.find('.pb-count').text()).toBe('0');
  });
});
