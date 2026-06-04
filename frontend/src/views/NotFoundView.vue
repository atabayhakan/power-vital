<script setup lang="ts">
</script>

<template>
  <div class="not-found">
    <div class="nf-card">
      <div class="nf-icon">🔍</div>
      <h1>404</h1>
      <h2>Страница не найдена</h2>
      <p>Запрашиваемая вами страница не существует или была перемещена.</p>
      <router-link to="/" class="nf-btn">🏠 Вернуться на главную</router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  font-family: 'Inter', sans-serif;
}
.nf-card {
  text-align: center;
  max-width: 440px;
  padding: 48px 40px;
}
.nf-icon { font-size: 64px; margin-bottom: 16px; }
h1 { font-size: 80px; font-weight: 900; color: #18181b; margin: 0; line-height: 1; }
h2 { font-size: 22px; font-weight: 700; color: #3f3f46; margin: 12px 0 8px; }
p { font-size: 14px; color: #71717a; line-height: 1.6; margin-bottom: 28px; }
.nf-btn {
  display: inline-block;
  padding: 14px 32px;
  background: #18181b;
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  transition: background .2s;
}
.nf-btn:hover { background: #16a34a; }
</style>
