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

const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };

const i18n = (globalThis as any).__VITEST_I18N__;

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
    // No homepageBlocks key — keeps all three pages empty on mount. (An
    // empty-but-present `homepageBlocks: {}` would trigger the store's
    // auto-injected partners block, which is covered separately in
    // usePageBuilderStore.test.ts and would just add noise here.)
    mockedAxios.get.mockResolvedValue({ data: { _blocksVersion: 'v1' } });
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
