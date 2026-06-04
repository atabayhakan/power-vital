<script setup lang="ts">
import { ref } from 'vue';
import { useCart } from '~/composables/useCart';
import axios from 'axios';
import { useRouter } from 'vue-router';

const { cart, cartTotal, removeFromCart } = useCart();
const router = useRouter();

const customer = ref({
  name: '',
  phone: '',
  address: '',
  sponsorId: '' // The Network Marketing magic
});

const isSubmitting = ref(false);
const orderSuccess = ref(false);

const placeOrder = async () => {
  if (cart.value.length === 0) return;
  isSubmitting.value = true;
  
  try {
    const res = await axios.post('http://localhost:3000/api/v1/orders/checkout', {
      customerName: customer.value.name,
      customerPhone: customer.value.phone,
      address: customer.value.address,
      sponsorId: customer.value.sponsorId,
      cart: cart.value
    });

    if (res.data.orderId) {
      orderSuccess.value = true;
      cart.value = []; // Clear cart on success
    }
  } catch (e) {
    alert('Sipariş oluşturulurken bir hata oluştu.');
    console.error(e);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="checkout-page container animate-fade-in">
    
    <div v-if="orderSuccess" class="success-message glass-panel">
      <h2>🎉 Siparişiniz Alındı!</h2>
      <p>Siparişiniz başarıyla oluşturuldu. Kapıda ödeme seçeneği ile kargoya verilecektir.</p>
      <NuxtLink to="/" class="btn-primary mt-4" style="display:inline-block;text-decoration:none;">Alışverişe Dön</NuxtLink>
    </div>

    <div v-else class="checkout-grid">
      <!-- Order Form -->
      <div class="form-section glass-panel">
        <h2>Teslimat Bilgileri</h2>
        <form @submit.prevent="placeOrder" class="checkout-form">
          <div class="form-group">
            <label>Ad Soyad</label>
            <input v-model="customer.name" type="text" required placeholder="Örn: Nurlan B." />
          </div>
          <div class="form-group">
            <label>Telefon</label>
            <input v-model="customer.phone" type="text" required placeholder="+996..." />
          </div>
          <div class="form-group">
            <label>Teslimat Adresi</label>
            <textarea v-model="customer.address" required rows="3" placeholder="Bishkek..."></textarea>
          </div>
          <div class="form-group sponsor-group">
            <label>Distribütör Kodu / Sponsor ID (Opsiyonel) 🎁</label>
            <input v-model="customer.sponsorId" type="text" placeholder="Sizi öneren kişinin ID'si" />
            <small>Bu alışveriş, sponsorunuzun ağına (Network) prim olarak yansıyacaktır!</small>
          </div>
          
          <button type="submit" class="btn-primary submit-btn" :disabled="cart.length === 0 || isSubmitting">
            {{ isSubmitting ? 'İşleniyor...' : 'Siparişi Tamamla (Kapıda Ödeme)' }}
          </button>
        </form>
      </div>

      <!-- Cart Summary -->
      <div class="summary-section glass-panel">
        <h2>Sepet Özeti</h2>
        <div v-if="cart.length === 0" class="empty-cart">
          Sepetiniz şu an boş.
        </div>
        <div v-else>
          <ul class="cart-items">
            <li v-for="item in cart" :key="item.id" class="cart-item">
              <div class="item-info">
                <h4>{{ item.name }}</h4>
                <p>{{ item.price }} x {{ item.quantity }}</p>
              </div>
              <button @click="removeFromCart(item.id)" class="remove-btn">Sil</button>
            </li>
          </ul>
          <div class="total-row">
            <span>Toplam Tutar:</span>
            <span class="total-price text-gradient">{{ cartTotal }} KGS</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.checkout-page {
  padding: 60px 24px;
}

.checkout-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 40px;
}

.form-section, .summary-section, .success-message {
  padding: 32px;
}

h2 {
  margin-bottom: 24px;
  font-size: 24px;
}

.form-group {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: var(--color-text-main);
}

.form-group input, .form-group textarea {
  padding: 12px 16px;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  font-family: inherit;
  outline: none;
  background: rgba(255,255,255,0.8);
}

.form-group input:focus, .form-group textarea:focus {
  border-color: var(--color-primary);
}

.sponsor-group {
  background: rgba(14, 165, 233, 0.05);
  padding: 16px;
  border-radius: 8px;
  border: 1px dashed var(--color-primary);
}

.sponsor-group small {
  color: var(--color-primary);
  font-weight: 500;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  font-size: 18px;
  margin-top: 16px;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cart-items {
  list-style: none;
  margin-bottom: 24px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.item-info h4 {
  margin-bottom: 4px;
}

.item-info p {
  color: var(--color-text-muted);
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-weight: 600;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  padding-top: 16px;
}

.success-message {
  text-align: center;
  padding: 60px;
}

.success-message p {
  margin: 16px 0;
  color: var(--color-text-muted);
}

.mt-4 {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
}
</style>
