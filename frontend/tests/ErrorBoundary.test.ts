// Unit tests for ErrorBoundary — verifies the boundary catches render
// errors from child components and shows the recovery UI.
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import ErrorBoundary from '../src/components/ErrorBoundary';

// Mock useAuthStore so we don't pull in axios + the full store module.
// Tests don't exercise auth; they only need .user?.id to not throw.
vi.mock('../src/stores/useAuthStore', () => ({
  useAuthStore: () => ({ user: null })
}));

// Mock the router hook — ErrorBoundary reads route.fullPath for the
// error context. In unit tests we don't mount a router, so we provide
// a fake useRoute() that returns a plain object.
vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router');
  return {
    ...actual,
    useRoute: () => ({ fullPath: '/test/route' })
  };
});

setActivePinia(createPinia());

const CrashingChild = defineComponent({
  name: 'CrashingChild',
  setup() {
    const shouldThrow = ref(true);
    return () => {
      // Trigger the error during render so onErrorCaptured fires.
      if (shouldThrow.value) {
        throw new Error('boom from child');
      }
      return h('div', 'should not render');
    };
  }
});

const SafeChild = defineComponent({
  name: 'SafeChild',
  render() {
    return h('div', { class: 'safe-child' }, 'I am fine');
  }
});

describe('ErrorBoundary', () => {
  it('renders children when they do not throw', () => {
    const wrapper = mount(ErrorBoundary, {
      slots: { default: () => h(SafeChild) }
    });
    expect(wrapper.find('.safe-child').exists()).toBe(true);
    expect(wrapper.find('.error-boundary').exists()).toBe(false);
  });

  it('shows fallback UI when a child component throws during render', async () => {
    // We attach a global error handler so the throw doesn't crash the
    // test runner, then verify the boundary's fallback rendered.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(ErrorBoundary, {
      slots: { default: () => h(CrashingChild) }
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.error-boundary').exists()).toBe(true);
    expect(wrapper.text()).toContain('Bir şeyler ters gitti');
    consoleError.mockRestore();
  });

  it('exposes the error message in the details disclosure', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(ErrorBoundary, {
      slots: { default: () => h(CrashingChild) }
    });
    await wrapper.vm.$nextTick();
    const details = wrapper.find('.eb-stack');
    expect(details.exists()).toBe(true);
    expect(details.text()).toContain('boom from child');
    consoleError.mockRestore();
  });

  it('emits "error" event with the error and info', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(ErrorBoundary, {
      slots: { default: () => h(CrashingChild) }
    });
    await wrapper.vm.$nextTick();
    const events = wrapper.emitted('error');
    expect(events).toBeTruthy();
    expect(events!.length).toBe(1);
    const [err, info] = events![0];
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe('boom from child');
    expect(typeof info).toBe('string');
    consoleError.mockRestore();
  });

  it('clears the error and re-renders children after the retry button is clicked', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const shouldThrow = ref(true);
    const ToggleChild = defineComponent({
      name: 'ToggleChild',
      setup() {
        return () => shouldThrow.value
          ? (() => { throw new Error('toggling error'); })()
          : h('div', { class: 'safe-child' }, 'recovered');
      }
    });
    const wrapper = mount(ErrorBoundary, {
      slots: { default: () => h(ToggleChild) }
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.error-boundary').exists()).toBe(true);
    shouldThrow.value = false;
    await wrapper.find('.eb-btn--primary').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.error-boundary').exists()).toBe(false);
    consoleError.mockRestore();
  });

  it('renders nothing in silent mode even when children throw', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(ErrorBoundary, {
      props: { silent: true },
      slots: { default: () => h(CrashingChild) }
    });
    await wrapper.vm.$nextTick();
    // Silent boundary should never show the fallback UI — only emit.
    expect(wrapper.find('.error-boundary').exists()).toBe(false);
    consoleError.mockRestore();
  });

  it('uses custom title and message when provided', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(ErrorBoundary, {
      props: {
        fallbackTitle: 'Custom Title',
        fallbackMessage: 'Custom message here.'
      },
      slots: { default: () => h(CrashingChild) }
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Custom Title');
    expect(wrapper.text()).toContain('Custom message here.');
    consoleError.mockRestore();
  });
});