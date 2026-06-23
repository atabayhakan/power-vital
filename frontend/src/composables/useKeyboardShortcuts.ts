// useKeyboardShortcuts — global keyboard shortcuts for the admin panel.
//
// Why a composable?
//   - One central place to define shortcuts (J/K navigation, / focus
//     search, ? help). Adding a new shortcut is a single entry in the
//     map below.
//   - Each shortcut is matched against the active focused element so
//     we don't intercept keystrokes when the user is typing in an
//     <input>, <textarea>, or contenteditable region. The "?" key
//     always works (it's not used for typing).
//
// Usage in App.vue or admin layout:
//   useKeyboardShortcuts({
//     onNext: () => nextRow(),
//     onPrev: () => prevRow(),
//     onFocusSearch: () => focusSearchInput(),
//     onHelp: () => showHelpModal()
//   });

import { onMounted, onUnmounted } from 'vue';

export interface KeyboardShortcutHandlers {
  /** J / ArrowDown — select the next row in a list/table. */
  onNext?: () => void;
  /** K / ArrowUp — select the previous row in a list/table. */
  onPrev?: () => void;
  /** "/" — focus the first search input on the page. */
  onFocusSearch?: () => void;
  /** "?" — open the keyboard shortcuts help modal. */
  onHelp?: () => void;
  /** "g" then "d/o/p/u/w/i" — quick navigation between admin pages. */
  onNavigate?: (page: 'dashboard' | 'orders' | 'products' | 'users' | 'withdrawals' | 'inventory') => void;
  /** Escape — close the active modal/overlay. */
  onEscape?: () => void;
}

/** True when the active element accepts text input — we leave those
 *  keys alone to avoid hijacking the user's typing. */
function isTypingTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers): void {
  // g-prefix: capture the first 'g' and wait up to 1s for the next key.
  // This is the GitHub-style "type g+d to go to dashboard" pattern.
  let gPrefixTimestamp = 0;

  const onKeyDown = (e: KeyboardEvent) => {
    // Always allow Escape — it's never useful inside a text field.
    if (e.key === 'Escape' && handlers.onEscape) {
      handlers.onEscape();
      return;
    }

    // Help shortcut works even while typing — users expect ? to open
    // docs in any context.
    if (e.key === '?' && handlers.onHelp) {
      e.preventDefault();
      handlers.onHelp();
      return;
    }

    // If the user is typing, skip everything else.
    if (isTypingTarget(e.target)) return;

    // Don't intercept when a modifier is pressed (Ctrl+J is browser
    // download dialog in some setups; Ctrl+K is address bar focus).
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // Row navigation
    if ((e.key === 'j' || e.key === 'ArrowDown') && handlers.onNext) {
      e.preventDefault();
      handlers.onNext();
      return;
    }
    if ((e.key === 'k' || e.key === 'ArrowUp') && handlers.onPrev) {
      e.preventDefault();
      handlers.onPrev();
      return;
    }

    // Focus search
    if (e.key === '/' && handlers.onFocusSearch) {
      e.preventDefault();
      handlers.onFocusSearch();
      return;
    }

    // g-prefix navigation: type 'g' then within 1s press the page letter.
    if (e.key === 'g' && handlers.onNavigate) {
      gPrefixTimestamp = Date.now();
      return;
    }
    if (gPrefixTimestamp && Date.now() - gPrefixTimestamp < 1000 && handlers.onNavigate) {
      type Page = 'dashboard' | 'orders' | 'products' | 'users' | 'withdrawals' | 'inventory';
      const map: Record<string, Page> = {
        d: 'dashboard',
        o: 'orders',
        p: 'products',
        u: 'users',
        w: 'withdrawals',
        i: 'inventory',
      };
      const page: Page | undefined = map[e.key.toLowerCase()];
      if (page) {
        e.preventDefault();
        handlers.onNavigate(page);
        gPrefixTimestamp = 0;
      }
    }
  };

  onMounted(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', onKeyDown);
  });
  onUnmounted(() => {
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', onKeyDown);
  });
}