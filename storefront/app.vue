<script setup lang="ts">
import { useCart } from '~/composables/useCart';
const { cart } = useCart();
</script>

<template>
  <div>
    <NuxtLayout>
      <header class="main-header glass-panel">
        <div class="container header-inner">
          <NuxtLink to="/" class="logo">
            <h1 class="text-gradient">Power Vital</h1>
          </NuxtLink>
          <nav class="nav-links">
            <NuxtLink to="/">Mağaza</NuxtLink>
            <NuxtLink to="/about">Hakkımızda</NuxtLink>
            <NuxtLink to="/checkout" class="btn-primary" style="text-decoration:none">
              Sepetim ({{ cart.length }})
            </NuxtLink>
          </nav>
        </div>
      </header>
      
      <main class="page-content">
        <NuxtPage />
      </main>

      <footer class="main-footer">
        <div class="container text-center">
          <p>© 2026 Power Vital Kırgızistan. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </NuxtLayout>
  </div>
</template>

<style scoped>
.main-header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
}

.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
}

.logo {
  text-decoration: none;
}

.logo h1 {
  font-size: 24px;
  font-weight: 800;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-links a {
  text-decoration: none;
  color: var(--color-text-main);
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: var(--color-primary);
}

.page-content {
  flex: 1;
  min-height: calc(100vh - 160px);
}

.main-footer {
  padding: 40px 0;
  color: var(--color-text-muted);
  border-top: 1px solid rgba(0,0,0,0.05);
  margin-top: 60px;
}

.text-center {
  text-align: center;
}
</style>
