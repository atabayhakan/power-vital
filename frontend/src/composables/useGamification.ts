import { computed } from 'vue';
import { useCurrentUser } from './useCurrentUser';
import { calculatePrice, formatPrice } from '../utils/PriceEngine';

export function useGamification() {
  const currentUser = useCurrentUser();

  const userDiscountRate = computed(() => currentUser.value?.dynamicDiscountRate ?? 0);
  const userLoyaltyLevel = computed(() => currentUser.value?.loyaltyLevel ?? 0);

  const getDiscountedKgs = (basePriceKgs: number | null | undefined) => {
    return calculatePrice(basePriceKgs, userDiscountRate.value);
  };

  const formatDiscountedPrice = (basePriceKgs: number | null | undefined) => {
    return formatPrice(getDiscountedKgs(basePriceKgs));
  };

  const getRetailKgs = (basePriceKgs: number | null | undefined) => {
    return calculatePrice(basePriceKgs, 0); // No discount
  };

  return {
    userDiscountRate,
    userLoyaltyLevel,
    getDiscountedKgs,
    formatDiscountedPrice,
    getRetailKgs
  };
}
