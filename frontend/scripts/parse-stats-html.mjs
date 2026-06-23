#!/usr/bin/env node
// DEPRECATED — see `parse-stats.mjs`.
//
// This script used to parse dist/stats.html via a brittle regex against
// the visualizer's treemap template. The visualizer template has been
// switched to `template: 'json'`, which writes dist/stats.json directly.
// Run `node scripts/parse-stats.mjs` instead.
console.error('parse-stats-html.mjs is deprecated. Use parse-stats.mjs.');
process.exit(1);