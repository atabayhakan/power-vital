export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Power Vital - Kırgızistan Premium Sağlık',
      meta: [
        { name: 'description', content: 'Power Vital Pure Collagen ve Omega-3 ile sağlığınıza güç katın. Kırgızistan resmi satış mağazası.' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  }
})
