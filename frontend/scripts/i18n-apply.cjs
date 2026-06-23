// Auto-i18n replacer: scans admin view templates and replaces hard-coded
// Turkish strings with t('admin.<namespace>.<key>') calls.
// Heuristic: for each known key, locate the literal text in the template
// and wrap with t(). Falls back to skipping unknown strings.
//
// Run: node scripts/i18n-apply.cjs <File.vue>
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/i18n-apply.cjs <vue file>'); process.exit(1); }

const src = fs.readFileSync(file, 'utf-8');
const FILE_BASE = path.basename(file, '.vue');

// Map: Turkish literal → i18n key
const MAP = [
  // AdminBroadcastView
  ['Web Push API ile herhangi bir kullanıcıya özel bildirim gönder veya\\s*\\n\\s*geçmiş broadcast\\u0027ları denetle\\.', 'admin.broadcast.subtitle'],
  ['1\\. Hedef Kullanıcı', 'admin.broadcast.step1Title'],
  ['👥 Çoklu', 'admin.broadcast.tabMulti'],
  ['⏳ Aranıyor…', 'admin.broadcast.searching'],
  ['Sonuç bulunamadı', 'admin.broadcast.noResults'],
  ['Yukarıdan kullanıcı ekleyin \\(max 500\\)', 'admin.broadcast.addUserHint'],
  ['👤 Tüm müşteriler', 'admin.broadcast.segAllCustomers'],
  ['🤝 Tüm distribütörler', 'admin.broadcast.segAllDistributors'],
  ['💵 Tüm kasiyerler', 'admin.broadcast.segAllCashiers'],
  ['🏪 Tüm bayiler', 'admin.broadcast.segAllResellers'],
  ['👑 Tüm adminler', 'admin.broadcast.segAllAdmins'],
  ['⚠️ Segment broadcast, o roldeki TÜM kullanıcılara gider \\(max 500\\)\\.', 'admin.broadcast.segWarn'],
  ['⏳ Sayım hesaplanıyor…', 'admin.broadcast.counting'],
  ['2\\. Bildirim İçeriği', 'admin.broadcast.step2Title'],
  ['>Başlık<', 'admin.broadcast.fieldTitle'],
  ['📋 Hazır şablonlar', 'admin.broadcast.templates'],
  ['✅ Gönderildi:', 'admin.broadcast.sentLabel'],
  ['· 🗑️ Süresi dolmuş:', 'admin.broadcast.expiredLabel'],
  ['· ❌ Başarısız:', 'admin.broadcast.failedLabel'],
  ['· ⏭️ Atlandı:', 'admin.broadcast.skippedLabel'],
  ['🧪 Kendime test gönder', 'admin.broadcast.sendTest'],
  ['⏳ Gönderiliyor…', 'admin.broadcast.sending'],
  ['📣 Broadcast gönder', 'admin.broadcast.send'],
  ['>Tümü<', 'admin.broadcast.filterAll'],
  ['Target ID \\(alıcı\\)', 'admin.broadcast.targetId'],
  ['>Toplam Alıcı<', 'admin.broadcast.totalRecipients'],
  ['>✅ Gönderildi<', 'admin.broadcast.colSent'],
  ['>🗑️ Süresi Dolmuş<', 'admin.broadcast.colExpired'],
  ['>❌ Başarısız<', 'admin.broadcast.colFailed'],
  ['⏳ Geçmiş yükleniyor…', 'admin.broadcast.historyLoading'],
  ['Henüz broadcast geçmişi yok', 'admin.broadcast.historyEmpty'],
  ['İlk broadcast\\u0027ı Compose sekmesinden gönderin\\.', 'admin.broadcast.historyHint'],
  ['\\(silinmiş admin\\)', 'admin.broadcast.deletedAdmin'],
  ['>Alıcılar<', 'admin.broadcast.recipients'],
  ['>Sonuç<', 'admin.broadcast.historyCol'],
];

let updated = src;
let count = 0;
for (const [pattern, key] of MAP) {
  const re = new RegExp(`>${pattern}<`, 'g');
  updated = updated.replace(re, `>{{ t('${key}') }}<`);
  count++;
}
console.log(`${file}: applied ${MAP.length} patterns`);

// Inject useTranslate if not present
if (!updated.includes("useTranslate")) {
  updated = updated.replace(
    /<script setup lang="ts">/,
    `<script setup lang="ts">\nimport { useTranslate } from '../composables/useTranslate';\nconst { t } = useTranslate();`
  );
}

fs.writeFileSync(file, updated, 'utf-8');
console.log('Done');
