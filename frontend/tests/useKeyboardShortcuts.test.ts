// Composable tests for useKeyboardShortcuts — verifies the shortcut
// map handles typing-target exclusion, modifier exclusion, the
// g-prefix navigation sequence, and Escape always-on behaviour.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useKeyboardShortcuts } from '../src/composables/useKeyboardShortcuts';

const mountWith = (handlers: Parameters<typeof useKeyboardShortcuts>[0]) => {
  const TestComp = defineComponent({
    setup() {
      useKeyboardShortcuts(handlers);
      return () => h('div');
    },
  });
  return mount(TestComp);
};

const dispatchKey = (key: string, opts: Partial<KeyboardEventInit> = {}) => {
  // Default target is document.body (not an input), so handlers fire.
  const target = opts.target ?? document.body;
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts });
  Object.defineProperty(event, 'target', { value: target, writable: false });
  document.dispatchEvent(event);
};

describe('useKeyboardShortcuts', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('fires onNext for j and ArrowDown outside text inputs', async () => {
    const onNext = vi.fn();
    const w = mountWith({ onNext });
    dispatchKey('j');
    dispatchKey('ArrowDown');
    expect(onNext).toHaveBeenCalledTimes(2);
    w.unmount();
  });

  it('fires onPrev for k and ArrowUp', async () => {
    const onPrev = vi.fn();
    const w = mountWith({ onPrev });
    dispatchKey('k');
    dispatchKey('ArrowUp');
    expect(onPrev).toHaveBeenCalledTimes(2);
    w.unmount();
  });

  it('does NOT fire navigation shortcuts while typing in an <input>', async () => {
    const onNext = vi.fn();
    const w = mountWith({ onNext });
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    dispatchKey('j', { target: input });
    dispatchKey('ArrowDown', { target: input });
    expect(onNext).not.toHaveBeenCalled();
    document.body.removeChild(input);
    w.unmount();
  });

  it('does NOT fire navigation shortcuts while typing in a <textarea>', async () => {
    const onNext = vi.fn();
    const w = mountWith({ onNext });
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    ta.focus();
    dispatchKey('j', { target: ta });
    expect(onNext).not.toHaveBeenCalled();
    document.body.removeChild(ta);
    w.unmount();
  });

  it('does NOT fire navigation shortcuts when Ctrl is held', async () => {
    const onNext = vi.fn();
    const w = mountWith({ onNext });
    dispatchKey('j', { ctrlKey: true });
    dispatchKey('j', { metaKey: true });
    expect(onNext).not.toHaveBeenCalled();
    w.unmount();
  });

  it('fires onFocusSearch for / key', async () => {
    const onFocusSearch = vi.fn();
    const w = mountWith({ onFocusSearch });
    dispatchKey('/');
    expect(onFocusSearch).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('does NOT fire onFocusSearch while typing', async () => {
    const onFocusSearch = vi.fn();
    const w = mountWith({ onFocusSearch });
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    dispatchKey('/', { target: input });
    expect(onFocusSearch).not.toHaveBeenCalled();
    document.body.removeChild(input);
    w.unmount();
  });

  it('fires onHelp for ? key even while typing', async () => {
    const onHelp = vi.fn();
    const w = mountWith({ onHelp });
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    dispatchKey('?', { target: input, shiftKey: true });
    expect(onHelp).toHaveBeenCalledTimes(1);
    document.body.removeChild(input);
    w.unmount();
  });

  it('fires onEscape for Escape key in any context', async () => {
    const onEscape = vi.fn();
    const w = mountWith({ onEscape });
    dispatchKey('Escape');
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    dispatchKey('Escape', { target: input });
    expect(onEscape).toHaveBeenCalledTimes(2);
    document.body.removeChild(input);
    w.unmount();
  });

  it('handles g-prefix navigation within 1 second', async () => {
    const onNavigate = vi.fn();
    const w = mountWith({ onNavigate });
    dispatchKey('g');
    vi.advanceTimersByTime(500);
    dispatchKey('d');
    expect(onNavigate).toHaveBeenCalledWith('dashboard');
    vi.advanceTimersByTime(2000);
    dispatchKey('p'); // Too late — g-prefix expired
    expect(onNavigate).toHaveBeenCalledTimes(1); // still just the 'd' call
    w.unmount();
  });

  it('maps g+p → products, g+u → users, etc.', async () => {
    const onNavigate = vi.fn();
    const w = mountWith({ onNavigate });
    const cases: Array<[string, string]> = [
      ['d', 'dashboard'], ['o', 'orders'], ['p', 'products'],
      ['u', 'users'], ['w', 'withdrawals'], ['i', 'inventory'],
    ];
    for (const [key] of cases) {
      dispatchKey('g');
      vi.advanceTimersByTime(100);
      dispatchKey(key);
    }
    expect(onNavigate).toHaveBeenCalledTimes(cases.length);
    for (let i = 0; i < cases.length; i++) {
      expect(onNavigate).toHaveBeenNthCalledWith(i + 1, cases[i][1]);
    }
    w.unmount();
  });

  it('removes listener on unmount', async () => {
    const onNext = vi.fn();
    const w = mountWith({ onNext });
    w.unmount();
    dispatchKey('j');
    expect(onNext).not.toHaveBeenCalled();
  });
});