<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useCart } from '~/composables/useCart';

const { addToCart } = useCart();

// Fallback products
const products = ref([
  {
    id: 1,
    name: 'Power Vital Pure Collagen',
    price: '3200 KGS',
    description: 'Eklem, cilt ve saç sağlığı için yüksek emilimli hidrolize kolajen.',
    image: 'https://images.unsplash.com/photo-1629824637682-12797e8dc830?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 2,
    name: 'Omega-3 Saf Balık Yağı',
    price: '2100 KGS',
    description: 'Kalp ve damar sağlığını destekleyen yüksek EPA/DHA oranlı.',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop'
  }
]);

const fetchProducts = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/v1/products');
    if(res.data && res.data.length > 0) {
      products.value = res.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: `${p.basePriceKgs} KGS`,
        description: p.description,
        image: products.value[0].image // Placeholder image for now
      }));
    }
  } catch (e) {
    console.log('Using fallback products, backend might be offline.');
  }
};

onMounted(() => {
  fetchProducts();
});
</script>

<template>
  <div class="animate-fade-in">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container hero-inner">
        <div class="hero-text">
          <h1 class="text-gradient">Doğanın Gücüyle <br>Yeniden Doğ.</h1>
          <p class="subtitle">Kırgızistan'ın 1 numaralı premium gıda takviyesi markası Power Vital ile hücresel düzeyde yenilenin.</p>
          <button class="btn-primary hero-btn">Ürünleri Keşfet</button>
        </div>
      </div>
    </section>

    <!-- Product Listing -->
    <section class="products-section container">
      <h2 class="section-title">En Çok Satanlar</h2>
      
      <div class="product-grid">
        <div v-for="product in products" :key="product.id" class="product-card glass-panel">
          <div class="product-image" :style="{ backgroundImage: `url(${product.image})` }"></div>
          <div class="product-info">
            <h3>{{ product.name }}</h3>
            <p class="desc">{{ product.description }}</p>
            <div class="price-row">
              <span class="price text-gradient">{{ product.price }}</span>
              <button class="btn-outline" @click="addToCart(product)">Sepete Ekle</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero-section {
  padding: 100px 0;
  text-align: center;
  background: radial-gradient(circle at top right, rgba(0,210,255,0.05) 0%, transparent 50%);
}

.hero-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.hero-text h1 {
  font-size: 56px;
  line-height: 1.1;
  font-weight: 900;
  margin-bottom: 24px;
}

.hero-text .subtitle {
  font-size: 18px;
  color: var(--color-text-muted);
  max-width: 600px;
  margin: 0 auto 40px auto;
  line-height: 1.6;
}

.hero-btn {
  font-size: 18px;
  padding: 16px 40px;
}

.section-title {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 40px;
  text-align: center;
}

.products-section {
  padding: 60px 24px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
}

.product-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
}

.product-card:hover {
  transform: translateY(-8px);
}

.product-image {
  height: 240px;
  background-size: cover;
  background-position: center;
  background-color: rgba(0,0,0,0.02);
}

.product-info {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-info h3 {
  font-size: 20px;
  margin-bottom: 12px;
}

.desc {
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 24px;
  flex: 1;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.price {
  font-size: 24px;
  font-weight: 800;
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: var(--color-primary);
  color: white;
}
</style>
