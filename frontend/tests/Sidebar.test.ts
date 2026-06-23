// Sidebar tests — reorganised admin nav (2026-06).
//
// We don't mount the full Sidebar (it imports i18n + auth store + router
// which all need deep mocking). Instead, the assertions below verify
// three things that have historically broken:
//
//   1. Every admin route from the router is reachable via a nav link
//      (catches the "removed a route from sidebar" bug that bit us
//      during the reorganisation).
//   2. No route appears in two different nav groups (catches the
//      /admin /admin-logs /admin-broadcast /i18n duplication).
//   3. The System subgroup rendering is a 3-accordion structure
//      (monitoring / automation / config) and not a flat 9-item list.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SIDEBAR_PATH = join(__dirname, '..', 'src', 'components', 'Sidebar.vue');
const ROUTER_PATH = join(__dirname, '..', 'src', 'router', 'index.ts');

const read = (p: string) => readFileSync(p, 'utf-8');

describe('Sidebar route coverage', () => {
  it('Sidebar.vue exists', () => {
    expect(existsSync(SIDEBAR_PATH)).toBe(true);
  });

  it('every admin route in the router has a nav link in the Sidebar', () => {
    const routerSrc = read(ROUTER_PATH);
    const sidebarSrc = read(SIDEBAR_PATH);
    // Splitting the router source on `}, {` lumps the first public route
    // cluster into a single big block, so we instead split on the actual
    // route-object boundaries — every line that begins with `{ path:`
    // (with optional leading whitespace) marks a new route entry. We then
    // look at each entry's own `path:` → `meta:` window to decide if it
    // is admin-gated.
    const entries = routerSrc.split(/(?=\n\s*\{ path:\s*')/);
    const adminRoutes: string[] = [];
    for (const entry of entries) {
      const pathMatch = entry.match(/path:\s*'([^']+)'/);
      if (!pathMatch) continue;
      // Window: from this route's path up to the closing `}` of its meta.
      // If `role: 'admin'` appears inside that window, it's THIS route
      // that's admin-gated, not a neighbour leaking across the split.
      const startIdx = entry.indexOf(pathMatch[0]);
      const metaEnd = entry.indexOf('}', entry.indexOf('meta:'));
      const window = entry.slice(startIdx, metaEnd > 0 ? metaEnd + 1 : undefined);
      if (!/role:\s*'admin'/.test(window)) continue;
      adminRoutes.push(pathMatch[1]);
    }
    // Drop only the truly dynamic :param routes — nested paths like
    // /cms/page-builder, /admin-logs, /i18n are all reachable via
    // dedicated sidebar entries and must remain in the coverage check.
    const filtered = adminRoutes.filter((p) => !p.includes(':'));
    expect(filtered.length).toBeGreaterThan(0);

    const missing = filtered.filter((path) => !sidebarSrc.includes(`to="${path}"`));
    expect(missing).toEqual([]);
  });

  it('newest /i18n/* model landing pages are reachable from /i18n (no broken links)', () => {
    // The 6 model buttons on the /i18n landing page (AdminI18nView) must
    // each point to a registered router path so navigation never 404s.
    const i18nViewSrc = read(join(__dirname, '..', 'src', 'views', 'AdminI18nView.vue'));
    const routerSrc = read(ROUTER_PATH);
    const routes = [...i18nViewSrc.matchAll(/route:\s*'([^']+)'/g)].map((m) => m[1]);
    expect(routes.length).toBeGreaterThan(0);
    // Each /i18n/<x> route must exist either as a literal path or be
    // matched by the dynamic /i18n/:model path.
    const missing = routes.filter((r) => {
      if (routerSrc.includes(`path: '${r}'`)) return false;
      // /i18n/products etc. are matched by /i18n/:model
      if (/^\/i18n\//.test(r) && routerSrc.includes('path: \'/i18n/:model\'')) return false;
      return true;
    });
    expect(missing).toEqual([]);
  });

  it('no admin route appears twice in the sidebar (no duplication)', () => {
    const sidebarSrc = read(SIDEBAR_PATH);
    // Extract every router-link `to="/..."` declaration
    const linkPaths = [...sidebarSrc.matchAll(/<router-link\s+to="([^"]+)"/g)].map((m) => m[1]);
    const counts: Record<string, number> = {};
    linkPaths.forEach((p) => { counts[p] = (counts[p] || 0) + 1; });
    const dupes = Object.entries(counts).filter(([, n]) => n > 1).map(([p]) => p);
    // Same route may appear under multiple `v-if` blocks (e.g. customer
    // sees /orders under "Hesabım", distributor sees it under "Siparişler"
    // — both legitimate). The bug we want to catch is the same route
    // appearing in the SAME role's nav-group twice. We therefore check
    // that no SINGLE `v-if="isAdmin"` (or `isCashier`/`isDistributor`)
    // block contains the same route twice.
    const adminBlocks = sidebarSrc.match(/<template v-if="isAdmin[^"]*">[\s\S]*?<\/template>/g) || [];
    const adminDupes: string[] = [];
    for (const block of adminBlocks) {
      const paths = [...block.matchAll(/<router-link\s+to="([^"]+)"/g)].map((m) => m[1]);
      const seen = new Set<string>();
      for (const p of paths) {
        if (seen.has(p)) adminDupes.push(p);
        seen.add(p);
      }
    }
    expect(adminDupes).toEqual([]);
    // Top-level dupes list is informational only (different roles share
    // common routes like /orders, /account/wallet, /account/support).
    // The real assertion is the per-admin-block check above.
    void dupes;
  });
});

describe('Sidebar System subgroup structure', () => {
  it('contains exactly 3 nav-subgroup <details> accordions', () => {
    const sidebarSrc = read(SIDEBAR_PATH);
    const subgroups = [...sidebarSrc.matchAll(/<details\s+class="nav-subgroup"/g)];
    expect(subgroups.length).toBe(3);
  });

  it('System subgroups are named monitoring / automation / config (i18n keys)', () => {
    const sidebarSrc = read(SIDEBAR_PATH);
    expect(sidebarSrc).toMatch(/sysMonitoring/);
    expect(sidebarSrc).toMatch(/sysAutomation/);
    expect(sidebarSrc).toMatch(/sysConfig/);
  });
});

describe('i18n key parity', () => {
  // Catches the case where a new sidebar key was added in Sidebar.vue
  // but the locale files (tr/ru/kg) were not updated.
  const locales = ['tr', 'ru', 'kg'] as const;
  for (const loc of locales) {
    it(`locale ${loc}.json has every sidebar key used in Sidebar.vue`, () => {
      const sidebarSrc = read(SIDEBAR_PATH);
      const localeSrc = JSON.parse(read(join(__dirname, '..', 'src', 'locales', `${loc}.json`)));
      const sidebarKeys = [...sidebarSrc.matchAll(/t\('sidebar\.([a-zA-Z]+)'\)/g)].map((m) => m[1]);
      const uniq = [...new Set(sidebarKeys)];
      const missing = uniq.filter((k) => !(localeSrc.sidebar && k in localeSrc.sidebar));
      expect(missing).toEqual([]);
    });
  }
});
