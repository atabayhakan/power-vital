<template>
  <div class="placeholder-content animate-fade-in">
    <div class="glass-panel message-box">
      <h2>🛠 Yapım Aşamasında</h2>
      <p>Bu sayfa henüz sisteme bağlanmadı veya yapım aşamasında.</p>
    </div>
  </div>
</template>

<style scoped>
.placeholder-content {
  flex: 1;
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-box {
  padding: 40px;
  text-align: center;
}

.message-box h2 {
  color: var(--color-primary);
  margin-bottom: 12px;
}
</style>
