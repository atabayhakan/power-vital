<script setup lang="ts">
defineProps<{
  node: {
    id: string;
    name: string;
    role?: string;
    walletBalanceUsd?: number | string;
    children?: any[];
  };
  isRoot?: boolean;
}>();

const initials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
};
</script>

<template>
  <li>
    <div class="tn-node" :class="{ 'tn-node--root': isRoot }">
      <div class="tn-avatar" :class="{ 'tn-avatar--root': isRoot }">{{ isRoot ? '👑' : initials(node.name) }}</div>
      <h4 class="tn-name">{{ node.name }}</h4>
      <span class="tn-role" :class="isRoot ? 'tn-role--root' : 'tn-role--outline'">{{ (node.role || 'user').toUpperCase() }}</span>
      <p class="tn-revenue">${{ Number(node.walletBalanceUsd || 0).toLocaleString() }}</p>
    </div>

    <ul v-if="node.children && node.children.length > 0">
      <NetworkTreeNode v-for="child in node.children" :key="child.id" :node="child" />
    </ul>
  </li>
</template>

<style scoped>
.tn-node {
  background: var(--surface-dark-card);
  border: 1px solid var(--surface-dark-border);
  box-shadow: var(--clay-dark-shadow-md);
  padding: 20px;
  border-radius: var(--radius-lg);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 160px;
  transition: transform var(--duration-normal) var(--ease-spring), box-shadow var(--duration-normal) var(--ease-smooth), border-color var(--duration-fast);
}

.tn-node:hover {
  transform: translateY(-5px);
  border-color: var(--pv-red-glow-strong);
  box-shadow: var(--clay-dark-shadow-lg);
}

.tn-node--root {
  background: linear-gradient(135deg, rgba(188, 74, 60, 0.16), rgba(212, 163, 115, 0.1));
  border-color: var(--pv-red-glow-strong);
  padding: 24px;
}

.tn-avatar {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--surface-dark-elevated);
  color: var(--text-on-dark);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.95rem;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.tn-avatar--root {
  font-size: 24px;
  background: var(--pv-gradient);
}

.tn-name {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--text-on-dark);
  margin-bottom: 8px;
}

.tn-role {
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.tn-role--root {
  background: var(--pv-gradient);
  color: var(--text-on-brand);
}

.tn-role--outline {
  border: 1px solid var(--text-on-dark-muted);
  color: var(--text-on-dark-secondary);
}

.tn-revenue {
  margin-top: 12px;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 800;
  color: var(--pv-red-light);
}

/* ── CSS Tree connector lines ── */
li {
  float: left;
  text-align: center;
  list-style-type: none;
  position: relative;
  padding: 20px 5px 0 5px;
  transition: all 0.5s;
}

ul {
  padding-top: 20px;
  position: relative;
  transition: all 0.5s;
  display: flex;
  justify-content: center;
  list-style-type: none;
}

li::before,
li::after {
  content: '';
  position: absolute;
  top: 0;
  right: 50%;
  border-top: 2px solid var(--pv-red-glow);
  width: 50%;
  height: 20px;
}
li::after {
  right: auto;
  left: 50%;
  border-left: 2px solid var(--pv-red-glow);
}

li:only-child::after,
li:only-child::before {
  display: none;
}
li:only-child {
  padding-top: 0;
}
li:first-child::before,
li:last-child::after {
  border: 0 none;
}
li:first-child::after {
  border-radius: 5px 0 0 0;
}
li:last-child::before {
  border-right: 2px solid var(--pv-red-glow);
  border-radius: 0 5px 0 0;
}

ul ul::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  border-left: 2px solid var(--pv-red-glow);
  width: 0;
  height: 20px;
}

@media (max-width: 768px) {
  .tn-node { min-width: 120px; padding: 14px; }
}
</style>
