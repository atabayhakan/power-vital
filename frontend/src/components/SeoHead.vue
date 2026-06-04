<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
  title?: string;
  description?: string;
  image?: string;
  type?: string;
}>();

const route = useRoute();

const SEO_DEFAULTS: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Power Vital — Здоровые витамины и натуральные пищевые добавки | Кыргызстан',
    description: 'Power Vital — лидер в области здоровых витаминов, натуральных пищевых добавок и дермокосметики в Кыргызстане. Бишкек. Доставка по всей стране. powervital.kg'
  },
  '/contact': {
    title: 'Контакты — Power Vital | Бишкек, Кыргызстан',
    description: 'Свяжитесь с Power Vital: адрес в Бишкеке, телефон, электронная почта. Натуральные пищевые добавки и здоровые витамины от проверенного производителя.'
  },
  '/about': {
    title: 'О компании Power Vital — Натуральные добавки и дермокосметика',
    description: 'Power Vital — инновационная платформа здоровых витаминов, натуральных пищевых добавок и дермокосметики. Наша миссия — здоровье Центральной Азии.'
  },
  '/checkout': {
    title: 'Оформление заказа — Power Vital',
    description: 'Быстрое и безопасное оформление заказа. Оплата через MBank, O!Money, MegaPay, Kaspi. Доставка здоровых витаминов по всему Кыргызстану.'
  },
  '/login': {
    title: 'Вход — Power Vital',
    description: 'Войдите в личный кабинет Power Vital для управления заказами, бонусами и партнёрской сетью.'
  },
  '/register': {
    title: 'Регистрация — Power Vital | Стать партнёром',
    description: 'Зарегистрируйтесь как клиент или дистрибьютор Power Vital. Здоровые витамины, натуральные пищевые добавки и бизнес-возможности в Кыргызстане.'
  }
};

const applyMeta = () => {
  const path = route.path;
  const defaults = SEO_DEFAULTS[path] || SEO_DEFAULTS['/'];

  const title = props.title || defaults.title;
  const description = props.description || defaults.description;
  const image = props.image || '/favicon.svg';
  const type = props.type || 'website';
  const url = `https://powervital.kg${path}`;

  // Title
  document.title = title;

  // Meta tags
  setMeta('description', description);
  setMeta('keywords', 'здоровые витамины, натуральные пищевые добавки, дермокосметика, Кыргызстан, Бишкек, Power Vital, powervital.kg, витамины Бишкек, БАД Кыргызстан');
  setMeta('author', 'Power Vital LLC');

  // Open Graph
  setMeta('og:title', title, 'property');
  setMeta('og:description', description, 'property');
  setMeta('og:image', image, 'property');
  setMeta('og:url', url, 'property');
  setMeta('og:type', type, 'property');
  setMeta('og:site_name', 'Power Vital', 'property');
  setMeta('og:locale', 'ru_KG', 'property');

  // Twitter Cards
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
  setMeta('twitter:image', image);
};

const setMeta = (name: string, content: string, attr: string = 'name') => {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

onMounted(applyMeta);
watch(() => route.path, applyMeta);
watch(() => props.title, applyMeta);
</script>

<template>
  <!-- SEO Head — renders nothing visible -->
</template>
