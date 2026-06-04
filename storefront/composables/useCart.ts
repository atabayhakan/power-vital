import { useState } from '#app'

export interface CartItem {
  id: number;
  name: string;
  price: string;
  image: string;
  quantity: number;
}

export const useCart = () => {
  const cart = useState<CartItem[]>('cart', () => [])

  const addToCart = (product: any) => {
    const existing = cart.value.find(item => item.id === product.id)
    if (existing) {
      existing.quantity++
    } else {
      cart.value.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      })
    }
  }

  const removeFromCart = (productId: number) => {
    cart.value = cart.value.filter(item => item.id !== productId)
  }

  const cartTotal = computed(() => {
    return cart.value.reduce((total, item) => {
      // price is expected as "3200 KGS" or similar, we extract the number
      const numericPrice = parseFloat(item.price) || 0
      return total + (numericPrice * item.quantity)
    }, 0)
  })

  return {
    cart,
    addToCart,
    removeFromCart,
    cartTotal
  }
}
