import { computed } from 'vue';
import { useCurrentUser } from './useCurrentUser';
import { calculatePrice, formatPrice } from '../utils/PriceEngine';

export function useGamification() {
  const currentUser = useCurrentUser();

  const userDiscountRate = computed(() => currentUser.value?.dynamicDiscountRate ?? 0);
  const userLoyaltyLevel = computed(() => currentUser.value?.loyaltyLevel ?? 0);

  const getDiscountedKgs = (basePriceUsd: number | null | undefined) => {
    return calculatePrice(basePriceUsd, userDiscountRate.value);
  };

  const formatDiscountedPrice = (basePriceUsd: number | null | undefined) => {
    return formatPrice(getDiscountedKgs(basePriceUsd));
  };

  const getRetailKgs = (basePriceUsd: number | null | undefined) => {
    return calculatePrice(basePriceUsd, 0); // No discount
  };

  return {
    userDiscountRate,
    userLoyaltyLevel,
    getDiscountedKgs,
    formatDiscountedPrice,
    getRetailKgs
  };
}
