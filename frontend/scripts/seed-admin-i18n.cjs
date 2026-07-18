// Auto-generates locale JSON keys for admin.* from a source-of-truth list.
// Source = English, then translate to TR / RU / KG.
// Run: node scripts/seed-admin-i18n.cjs tr
//      node scripts/seed-admin-i18n.cjs ru
//      node scripts/seed-admin-i18n.cjs kg

const fs = require('fs');
const path = require('path');

const LOCALE = process.argv[2];
if (!['tr', 'ru', 'kg'].includes(LOCALE)) {
  console.error('Usage: node scripts/seed-admin-i18n.cjs <tr|ru|kg>');
  process.exit(1);
}

// Source-of-truth translations per locale. Any key not listed here
// will fall back to the English string. Edit THIS file to add or
// change any admin translation.
const I18N = {
  // ─── Admin Login ──────────────────────────────────────────────────────
  'admin.login.systemControl':   { tr: 'Sistem Kontrol Odası',         ru: 'Системная панель',                    kg: 'Системанын көзөмөл бөлмөсү' },
  'admin.login.authorizedStaff':{ tr: 'Yetkilendirilmiş personel girişi.', ru: 'Вход для авторизованного персонала.', kg: 'Ырасталган кызматкерлер кирип жатат.' },
  'admin.login.idOrEmail':       { tr: 'Yönetici ID / E-Posta',         ru: 'ID администратора / E-mail',          kg: 'Админ ID / E-mail' },
  'admin.login.password':        { tr: 'Güvenlik Anahtarı (Şifre)',     ru: 'Пароль безопасности',                 kg: 'Коопсуздук ачкычы (сырсөз)' },
  'admin.login.secureSubmit':    { tr: 'GÜVENLİ GİRİŞ',                 ru: 'БЕЗОПАСНЫЙ ВХОД',                     kg: 'КООПСУЗ КИРҮҮ' },
  'admin.login.verifying':       { tr: 'DOĞRULANIYOR...',               ru: 'ПРОВЕРКА...',                         kg: 'ТАСТЫКТУУДА...' },
  'admin.login.backToStore':     { tr: '← Mağazaya Dön',                ru: '← Вернуться в магазин',               kg: '← Дүкөнгө кайтуу' },

  // ─── Admin I18n (Çeviri Merkezi) ──────────────────────────────────────
  'admin.i18n.title':            { tr: 'Çeviri Merkezi',                ru: 'Центр переводов',                     kg: 'Котормо борбору' },
  'admin.i18n.subtitle':         { tr: 'TR içerik kaynaktır. Aşağıdan bir kategori seç — RU / KG / EN sütunlarını kendin doldur. Boş hücreler müşteriye TR metni olarak gösterilir, hiçbir hata oluşmaz.',
                                    ru: 'TR — исходный контент. Выберите категорию ниже и заполните столбцы RU / KG / EN. Пустые ячейки показываются клиенту как TR, без ошибок.',
                                    kg: 'TR — баштапкы текст. Төмөндөн категория тандап, RU / KG / EN тилкелерин өзүң толтур. Бош уячалар кардарга TR катары көрсөтүлөт, ката болбойт.' },
  'admin.i18n.refresh':          { tr: 'Yenile',                         ru: 'Обновить',                            kg: 'Жаңыртуу' },
  'admin.i18n.overallCoverage':  { tr: 'Genel Kapsam',                  ru: 'Общее покрытие',                      kg: 'Жалпы камтуу' },
  'admin.i18n.statusExcellent':  { tr: 'Mükemmel ✅',                    ru: 'Отлично ✅',                          kg: 'Мыкты ✅' },
  'admin.i18n.statusGood':       { tr: 'İyi 🟡',                        ru: 'Хорошо 🟡',                           kg: 'Жакшы 🟡' },
  'admin.i18n.statusLow':        { tr: 'Eksik 🔴',                      ru: 'Недостаточно 🔴',                     kg: 'Жетишсиз 🔴' },
  'admin.i18n.openCta':          { tr: 'Aç →',                          ru: 'Открыть →',                           kg: 'Ачуу →' },
  'admin.i18n.uiStringsTitle':   { tr: 'Arayüz Metinleri',              ru: 'UI строки',                           kg: 'UI саптар' },
  'admin.i18n.uiStringsBadge':   { tr: 'YENİ',                          ru: 'НОВОЕ',                               kg: 'ЖАҢЫ' },
  'admin.i18n.uiStringsDesc1':   { tr: 'Butonlar, menüler, sistem mesajları', ru: 'Кнопки, меню, системные сообщения', kg: 'Баскычтар, меню, системалык билдирүүлөр' },
  'admin.i18n.uiStringsDesc2':   { tr: 'Sitedeki tüm sabit yazılar — sepete ekle, satın al, menü, uyarılar…',
                                    ru: 'Все статические тексты сайта — добавить в корзину, купить, меню, уведомления…',
                                    kg: 'Сайттагы бардык туруктуу тексттер — себетке кошуу, сатып алуу, меню, эскертүүлөр…' },
  'admin.i18n.loading':          { tr: 'Yükleniyor…',                   ru: 'Загрузка…',                           kg: 'Жүктөлүүдө…' },

  // ─── I18n Model (4-kolon editor) ──────────────────────────────────────
  'admin.i18nModel.totalRecords':{ tr: 'Toplam {n} kayıt.',             ru: 'Всего {n} записей.',                  kg: 'Бардыгы {n} жазуу.' },
  'admin.i18nModel.missingCells':{ tr: '· {n} boş hücre',               ru: '· {n} пустых ячеек',                  kg: '· {n} бош уяча' },
  'admin.i18nModel.allFilled':   { tr: '· tüm hücreler dolu ✓',         ru: '· все ячейки заполнены ✓',            kg: '· бардык уячалар толтурулган ✓' },
  'admin.i18nModel.loading':     { tr: 'Yükleniyor…',                   ru: 'Загрузка…',                           kg: 'Жүктөлүүдө…' },
  'admin.i18nModel.noRecords':   { tr: 'Henüz {model} yok',             ru: 'Пока нет {model}',                    kg: 'Азырынча {model} жок' },
  'admin.i18nModel.noMissing':   { tr: 'Bu modelde eksik çeviri yok',  ru: 'В этой модели нет пропущенных переводов', kg: 'Бул моделде которулбаган текст жок' },
  'admin.i18nModel.onlyMissingHint': { tr: '"Sadece eksik" filtresi açık.', ru: 'Включён фильтр «Только недостающие».', kg: '«Жетишсиз» гана чыптамасы ачык.' },
  'admin.i18nModel.showAll':     { tr: 'Tümünü göster',                 ru: 'Показать все',                        kg: 'Баарын көрсөтүү' },
  'admin.i18nModel.noSearchResults': { tr: '"{q}" için sonuç yok.',      ru: 'Нет результатов для «{q}».',         kg: '"{q}" үчүн натыйжа жок.' },
  'admin.i18nModel.clearSearch': { tr: 'Aramayı temizle',               ru: 'Очистить поиск',                      kg: 'Издөөнү тазалоо' },
  'admin.i18nModel.fieldsChanged':{ tr: '⚠️ {n} alan güncellendi',      ru: '⚠️ обновлено {n} полей',              kg: '⚠️ {n} талаа жаңыртылды' },
  'admin.i18nModel.saved':       { tr: 'Güncellendi',                   ru: 'Обновлено',                           kg: 'Жаңыртылды' },
  'admin.i18nModel.empty':       { tr: '• Boş',                          ru: '• Пусто',                              kg: '• Бош' },
  'admin.i18nModel.noArrays':    { tr: 'Bu üründe çevrilecek dizi alanı yok.',
                                    ru: 'В этом продукте нет массивов для перевода.',
                                    kg: 'Бул продуктта которулуучу массив талаалары жок.' },

  // ─── I18n UI Strings ──────────────────────────────────────────────────
  'admin.i18nUi.title':          { tr: 'Arayüz Metinleri',              ru: 'UI строки',                           kg: 'UI саптар' },
  'admin.i18nUi.subtitle':       { tr: 'Butonlar, menüler, sistem mesajları — sitedeki tüm sabit yazılar. Düzenle, çık (otomatik kaydedilir). Varsayılana eşitlersen geri döner.',
                                    ru: 'Кнопки, меню, системные сообщения — все статические тексты сайта. Измените и закройте (сохраняется автоматически). Если установить значение по умолчанию, восстанавливается.',
                                    kg: 'Баскычтар, меню, системалык билдирүүлөр — сайттагы бардык туруктуу тексттер. Түзөтүп, чык (автоматтык сакталат). Демейкиге барабар кылсаңыз, кайра кайтат.' },
  'admin.i18nUi.overridden':     { tr: '· {n} değiştirildi',            ru: '· {n} изменено',                      kg: '· {n} өзгөртүлдү' },
  'admin.i18nUi.sameAsTr':       { tr: '· {n} TR ile aynı',             ru: '· {n} совпадает с TR',                kg: '· {n} TR менен бирдей' },
  'admin.i18nUi.modified':       { tr: '✎ Değişen',                     ru: '✎ Изменено',                          kg: '✎ Өзгөртүлгөн' },
  'admin.i18nUi.loading':        { tr: 'Yükleniyor…',                   ru: 'Загрузка…',                           kg: 'Жүктөлүүдө…' },
  'admin.i18nUi.noResults':      { tr: 'Sonuç yok',                     ru: 'Нет результатов',                     kg: 'Натыйжа жок' },

  // ─── Broadcast (admin.broadcast.*) ────────────────────────────────────
  'admin.broadcast.subtitle':    { tr: 'Web Push API ile herhangi bir kullanıcıya özel bildirim gönder veya geçmiş broadcast\'ları denetle.',
                                    ru: 'Отправьте push-уведомление любому пользователю через Web Push API или просмотрите историю рассылок.',
                                    kg: 'Web Push API аркылуу каалаган колдонуучуга жеке билдирүү жөнөтүңүз же өткөн таратууларды текшериңиз.' },
  'admin.broadcast.step1Title':  { tr: '1. Hedef Kullanıcı',            ru: '1. Получатель',                       kg: '1. Максаттуу колдонуучу' },
  'admin.broadcast.tabMulti':    { tr: '👥 Çoklu',                      ru: '👥 Несколько',                        kg: '👥 Бир нече' },
  'admin.broadcast.searching':   { tr: '⏳ Aranıyor…',                  ru: '⏳ Поиск…',                           kg: '⏳ Изделүүдө…' },
  'admin.broadcast.noResults':   { tr: 'Sonuç bulunamadı',              ru: 'Результаты не найдены',               kg: 'Натыйжа табылган жок' },
  'admin.broadcast.searchPlaceholder': { tr: 'İsim veya e-posta ile ara…', ru: 'Поиск по имени или e-mail…',       kg: 'Аты же e-mail менен издөө…' },
  'admin.broadcast.addUserHint': { tr: 'Yukarıdan kullanıcı ekleyin (max 500)', ru: 'Добавьте пользователей выше (макс. 500)', kg: 'Үстүнөн колдонуучу кошуңуз (макс. 500)' },
  'admin.broadcast.segAllCustomers': { tr: '👤 Tüm müşteriler',         ru: '👤 Все клиенты',                       kg: '👤 Бардык кардарлар' },
  'admin.broadcast.segAllDistributors': { tr: '🤝 Tüm distribütörler', ru: '🤝 Все дистрибьюторы',                kg: '🤝 Бардык дистрибьютёрлор' },
  'admin.broadcast.segAllCashiers': { tr: '💵 Tüm kasiyerler',          ru: '💵 Все кассиры',                       kg: '💵 Бардык кассирлер' },
  'admin.broadcast.segAllResellers': { tr: '🏪 Tüm bayiler',           ru: '🏪 Все реселлеры',                     kg: '🏪 Бардык дилерлер' },
  'admin.broadcast.segAllAdmins': { tr: '👑 Tüm adminler',              ru: '👑 Все админы',                        kg: '👑 Бардык админдер' },
  'admin.broadcast.segWarn':     { tr: '⚠️ Segment broadcast, o roldeki TÜM kullanıcılara gider (max 500).',
                                    ru: '⚠️ Рассылка по сегменту идёт ВСЕМ пользователям этой роли (макс. 500).',
                                    kg: '⚠️ Сегменттик таратуу ошол ролдогу БАРДЫК колдонуучуларга жөнөтүлөт (макс. 500).' },
  'admin.broadcast.counting':    { tr: '⏳ Sayım hesaplanıyor…',        ru: '⏳ Считаем…',                          kg: '⏳ Эсептелүүдө…' },
  'admin.broadcast.step2Title':  { tr: '2. Bildirim İçeriği',           ru: '2. Содержимое уведомления',           kg: '2. Билдирүүнүн мазмуну' },
  'admin.broadcast.fieldTitle':  { tr: 'Başlık',                         ru: 'Заголовок',                           kg: 'Аталышы' },
  'admin.broadcast.templates':   { tr: '📋 Hazır şablonlar',             ru: '📋 Готовые шаблоны',                   kg: '📋 Даяр шаблондор' },
  'admin.broadcast.recipientsCompleted': { tr: '{n} alıcıya tamamlandı', ru: '{n} получателям завершено',          kg: '{n} алуучуга аяктады' },
  'admin.broadcast.sentLabel':   { tr: '✅ Gönderildi:',                 ru: '✅ Отправлено:',                       kg: '✅ Жөнөтүлдү:' },
  'admin.broadcast.expiredLabel':{ tr: '· 🗑️ Süresi dolmuş:',            ru: '· 🗑️ Истёк срок:',                    kg: '· 🗑️ Мөөнөтү бүттү:' },
  'admin.broadcast.failedLabel': { tr: '· ❌ Başarısız:',                 ru: '· ❌ Ошибка:',                          kg: '· ❌ Ийгиликсиз:' },
  'admin.broadcast.skippedLabel':{ tr: '· ⏭️ Atlandı:',                  ru: '· ⏭️ Пропущено:',                     kg: '· ⏭️ Өткөрүлдү:' },
  'admin.broadcast.sendTest':    { tr: '🧪 Kendime test gönder',         ru: '🧪 Отправить тест себе',              kg: '🧪 Өзүмө сыноо жөнөтүү' },
  'admin.broadcast.sending':     { tr: '⏳ Gönderiliyor…',               ru: '⏳ Отправка…',                         kg: '⏳ Жөнөтүлүүдө…' },
  'admin.broadcast.send':        { tr: '📣 Broadcast gönder',             ru: '📣 Отправить рассылку',                kg: '📣 Таратуу жөнөтүү' },
  'admin.broadcast.filterAll':   { tr: 'Tümü',                            ru: 'Все',                                  kg: 'Баары' },
  'admin.broadcast.targetId':    { tr: 'Target ID (alıcı)',              ru: 'Target ID (получатель)',               kg: 'Target ID (алуучу)' },
  'admin.broadcast.rowSingle':   { tr: '📋 Düz ({n} satır)',              ru: '📋 Прямая ({n} строк)',                kg: '📋 Тик ({n} сап)' },
  'admin.broadcast.totalRecipients': { tr: 'Toplam Alıcı',                 ru: 'Всего получателей',                   kg: 'Бардык алуучу' },
  'admin.broadcast.historyCol':  { tr: 'Sonuç',                            ru: 'Результат',                           kg: 'Натыйжа' },
  'admin.broadcast.colSent':     { tr: '✅ Gönderildi',                    ru: '✅ Отправлено',                        kg: '✅ Жөнөтүлдү' },
  'admin.broadcast.colExpired':  { tr: '🗑️ Süresi Dolmuş',                  ru: '🗑️ Истёк срок',                       kg: '🗑️ Мөөнөтү бүттү' },
  'admin.broadcast.colFailed':   { tr: '❌ Başarısız',                      ru: '❌ Ошибка',                            kg: '❌ Ийгиликсиз' },
  'admin.broadcast.historyLoading': { tr: '⏳ Geçmiş yükleniyor…',           ru: '⏳ Загрузка истории…',                 kg: '⏳ Тарых жүктөлүүдө…' },
  'admin.broadcast.historyEmpty':{ tr: 'Henüz broadcast geçmişi yok',     ru: 'Истории рассылок пока нет',           kg: 'Таратуу тарыхы азырынча жок' },
  'admin.broadcast.historyHint': { tr: 'İlk broadcast\'ı Compose sekmesinden gönderin.',
                                    ru: 'Отправьте первую рассылку во вкладке «Создать».',
                                    kg: 'Биринчи таратууну «Түзүү» өтмөгүнөн жөнөтүңүз.' },
  'admin.broadcast.deletedAdmin':{ tr: '(silinmiş admin)',                ru: '(удалённый админ)',                    kg: '(өчүрүлгөн админ)' },
  'admin.broadcast.recipients':  { tr: 'Alıcılar',                        ru: 'Получатели',                          kg: 'Алуучулар' },

  // ─── Scheduled (admin.scheduled.*) ────────────────────────────────────
  'admin.scheduled.title':       { tr: '⏰ Planlı Broadcast\'lar',        ru: '⏰ Запланированные рассылки',          kg: '⏰ Пландалган таратуулар' },
  'admin.scheduled.subtitle':    { tr: 'İleri tarihli push bildirimleri. Scheduler her dakika pending job\'ları dispatch eder.',
                                    ru: 'Push-уведомления на будущее. Планировщик каждую минуту отправляет ожидающие задачи.',
                                    kg: 'Келечекте жөнөтүлө турган push билдирүүлөр. Пландоочу ар бир мүнөт күтүүдөгү тапшырмаларды аткарат.' },
  'admin.scheduled.newJobTitle': { tr: '📅 Yeni Planlı Broadcast',         ru: '📅 Новая запланированная рассылка',   kg: '📅 Жаңы пландалган таратуу' },
  'admin.scheduled.jobPlanned':  { tr: '✅ Job planlandı:',                ru: '✅ Задача запланирована:',             kg: '✅ Тапшырма пландалды:' },
  'admin.scheduled.recipientsAt':{ tr: '({n} alıcı, {when})',             ru: '({n} получателей, {when})',            kg: '({n} алуучу, {when})' },
  'admin.scheduled.scheduling':  { tr: '⏳ Planlanıyor…',                  ru: '⏳ Планирование…',                     kg: '⏳ Пландалууда…' },
  'admin.scheduled.scheduleCta': { tr: '⏰ Broadcast\'ı planla',            ru: '⏰ Запланировать рассылку',             kg: '⏰ Таратууну пландоо' },
  'admin.scheduled.jobsListTitle':{ tr: '📋 Planlanan İşler ({n})',         ru: '📋 Запланированные задачи ({n})',      kg: '📋 Пландалган тапшырмалар ({n})' },
  'admin.scheduled.filterAll':   { tr: 'Tümü',                             ru: 'Все',                                  kg: 'Баары' },
  'admin.scheduled.colSent':     { tr: '✅ Gönderildi',                    ru: '✅ Отправлено',                        kg: '✅ Жөнөтүлдү' },
  'admin.scheduled.colCancelled':{ tr: '❌ İptal',                          ru: '❌ Отменено',                          kg: '❌ Жокко чыгарылды' },
  'admin.scheduled.colFailed':   { tr: '⚠️ Başarısız',                      ru: '⚠️ Ошибка',                            kg: '⚠️ Ийгиликсиз' },
  'admin.scheduled.loading':     { tr: '⏳ Yükleniyor…',                   ru: '⏳ Загрузка…',                         kg: '⏳ Жүктөлүүдө…' },
  'admin.scheduled.empty':       { tr: 'Henüz planlı job yok.',             ru: 'Запланированных задач пока нет.',      kg: 'Пландалган тапшырмалар жок.' },
  'admin.scheduled.emptyHint':   { tr: 'Yukarıdaki form\'dan ilk planlı broadcast\'ı oluşturun.',
                                    ru: 'Создайте первую запланированную рассылку через форму выше.',
                                    kg: 'Үстүнкү формадан биринчи пландалган таратууну түзүңүз.' },
  'admin.scheduled.pastDue':     { tr: '⚠️ Süresi geçmiş, bir sonraki tick\'i bekliyor',
                                    ru: '⚠️ Просрочено, ожидает следующего тика',
                                    kg: '⚠️ Мөөнөтү өтүп кетти, кийинки тикти күтүүдө' },
  'admin.scheduled.deletedUser': { tr: '(silinmiş)',                       ru: '(удалён)',                             kg: '(өчүрүлгөн)' },
  'admin.scheduled.cancelCta':   { tr: 'İptal',                             ru: 'Отменить',                             kg: 'Жокко чыгаруу' },
  'admin.scheduled.viewResult':  { tr: 'Sonuç →',                           ru: 'Результат →',                          kg: 'Натыйжа →' },

  // ─── Push Analytics (admin.pushAnalytics.*) ──────────────────────────
  'admin.pushAnalytics.subtitle':{ tr: 'Web Push bildirim performansı — event bazlı breakdown, 14 günlük trend, en aktif adminler.',
                                    ru: 'Производительность Web Push — разбивка по событиям, тренд за 14 дней, самые активные админы.',
                                    kg: 'Web Push билдирүү аткаруусу — ивент боюнча бөлүү, 14 күндүк тренд, эң активдүү админдер.' },
  'admin.pushAnalytics.paused':  { tr: '⏸️ duraklatıldı',                   ru: '⏸️ приостановлено',                   kg: '⏸️ тындытылды' },
  'admin.pushAnalytics.deliveryRate': { tr: 'Teslim Oranı',                  ru: 'Доставлено',                           kg: 'Жеткирилди' },
  'admin.pushAnalytics.errorRate':{ tr: 'Hata Oranı',                       ru: 'Ошибки',                                kg: 'Ката' },
  'admin.pushAnalytics.chartTitle':{ tr: '📈 Son 14 Gün — Günlük Teslim Edilen Push',
                                    ru: '📈 Последние 14 дней — ежедневно доставленные push',
                                    kg: '📈 Акыркы 14 күн — күнүнө жеткирилген push' },
  'admin.pushAnalytics.chartLegend':{ tr: 'Her satır bir gün · █ = push sayısı (max\'a göre normalize) · sayılar toplam teslim',
                                    ru: 'Каждая строка — день · █ = количество push (нормализовано по max) · числа — всего доставлено',
                                    kg: 'Ар бир сап бир күн · █ = push саны (макс. боюнча нормалдаштырылган) · сандар — жалпы жеткирилген' },
  'admin.pushAnalytics.byEvent': { tr: '🎯 Event Bazlı Breakdown',         ru: '🎯 Разбивка по событиям',              kg: '🎯 Ивент боюнча бөлүү' },
  'admin.pushAnalytics.colSuccess':{ tr: 'Başarı %',                         ru: 'Успех %',                              kg: 'Ийгилик %' },
  'admin.pushAnalytics.topAdmins':{ tr: '👑 En Aktif Adminler (Son 30 gün)', ru: '👑 Самые активные админы (за 30 дней)', kg: '👑 Эң активдүү админдер (акыркы 30 күн)' },
  'admin.pushAnalytics.empty':   { tr: 'Henüz broadcast verisi yok.',       ru: 'Данных рассылок пока нет.',            kg: 'Таратуу дайындары жок.' },
  'admin.pushAnalytics.emptyHint':{ tr: 'Compose sekmesinden ilk broadcast\'ı gönderin.',
                                    ru: 'Отправьте первую рассылку во вкладке «Создать».',
                                    kg: 'Биринчи таратууну «Түзүү» өтмөгүнөн жөнөтүңүз.' },
  'admin.pushAnalytics.timeRange':{ tr: 'Zaman aralığı:',                    ru: 'Диапазон:',                             kg: 'Убакыт аралыгы:' },
  'admin.pushAnalytics.loading': { tr: '⏳ Yükleniyor…',                    ru: '⏳ Загрузка…',                          kg: '⏳ Жүктөлүүдө…' },
  'admin.pushAnalytics.topErrors':{ tr: '⚠️ En Sık Hata Sebepleri',          ru: '⚠️ Самые частые причины ошибок',        kg: '⚠️ Эң көп ката себептери' },

  // ─── Finance (admin.finance.*) ───────────────────────────────────────
  'admin.finance.title':         { tr: '⚙️ Akıllı Kur & Fiyatlandırma',   ru: '⚙️ Умный курс и ценообразование',      kg: '⚙️ Акылдуу курс жана баалоо' },
  'admin.finance.subtitle':      { tr: 'Tüm mağazadaki ürün fiyatlarını tek noktadan yönetin ve psikolojik fiyatlama taktiklerini uygulayın.',
                                    ru: 'Управляйте ценами всех товаров из одного места и применяйте психологическое ценообразование.',
                                    kg: 'Дүкөндөгү бардык продуктулардын бааларын бир жерден башкарыңыз жана психологиялык баалоо ыкмаларын колдонуңуз.' },
  'admin.finance.engineSection':{ tr: 'Finans Motoru Ayarları',           ru: 'Настройки финансового движка',          kg: 'Финанс кыймылдаткычынын жөндөөлөрү' },
  'admin.finance.exchangeRate':  { tr: 'Güncel Kur (1 USD = X KGS)',       ru: 'Текущий курс (1 USD = X KGS)',          kg: 'Учурдагы курс (1 USD = X KGS)' },
  'admin.finance.fetchFailed':   { tr: '⚠ Kur çekilemedi:',                 ru: '⚠ Не удалось получить курс:',          kg: '⚠ Курс алынган жок:' },
  'admin.finance.smoothingMode': { tr: 'Fiyat Pürüzsüzleştirme Modu (Smoothing Mode)', ru: 'Режим сглаживания цен', kg: 'Бааны жылмакайлоо режими' },
  'admin.finance.smoothNone':    { tr: 'Kusursuz Çeviri — Yuvarlama Yok',  ru: 'Без округления',                       kg: 'Тегеректөөсүз — так которуу' },
  'admin.finance.smooth50':      { tr: 'En Yakın 50\'ye Yuvarla (sonu 50 veya 00)', ru: 'Округлять до 50 (конец 50 или 00)', kg: 'Эң жакын 50\'ге чейин тегеректөө' },
  'admin.finance.smooth100':     { tr: 'En Yakın 100\'e Yuvarla (sonu 00)', ru: 'Округлять до 100 (конец 00)',         kg: 'Эң жакын 100\'гө чейин тегеректөө' },
  'admin.finance.autoFetch':     { tr: 'Otomatik Kur Çekme',               ru: 'Автоматическое получение курса',       kg: 'Автоматтык курс алуу' },
  'admin.finance.autoFetchHint': { tr: 'Açıkken sistem her 24 saatte NBKR/exchangerate-api\'den güncel kuru otomatik çeker.',
                                    ru: 'Если включено, система автоматически получает курс с NBKR/exchangerate-api каждые 24 часа.',
                                    kg: 'Күйгүзүлгөндө система ар 24 саат сайын NBKR/exchangerate-api\'ден учурдагы курсту автоматтык алат.' },
  'admin.finance.manualPaySection':{ tr: 'Manuel Ödeme ve QR Ayarları',    ru: 'Ручная оплата и QR-настройки',         kg: 'Кол менен төлөм жана QR жөндөөлөрү' },
  'admin.finance.manualPayHint': { tr: 'Müşterilerin ödeme sayfasında hızlıca kopyalayıp uygulamayı açabileceği numaraları belirleyin.',
                                    ru: 'Укажите номера, которые клиенты смогут быстро скопировать и открыть в приложении на странице оплаты.',
                                    kg: 'Кардарлар төлөм баракчасынан тез көчүрүп, колдонмону ача ала турган номерлерди көрсөтүңүз.' },
  'admin.finance.mbankAccount':  { tr: 'MBank Numarası / Hesabı',          ru: 'Номер / счёт MBank',                   kg: 'MBank номери / эсеби' },
  'admin.finance.kaspiAccount':  { tr: 'Kaspi Bank Numarası / Hesabı',     ru: 'Номер / счёт Kaspi Bank',              kg: 'Kaspi Bank номери / эсеби' },
  'admin.finance.optimaAccount': { tr: 'Optima Bank Numarası / Hesabı',    ru: 'Номер / счёт Optima Bank',             kg: 'Optima Bank номери / эсеби' },
  'admin.finance.customQr':      { tr: 'Özel QR Kod URL\'i (Opsiyonel)',    ru: 'URL своего QR-кода (необязательно)',   kg: 'Өз QR кодуңуздун URL\'и (милдеттүү эмес)' },
  'admin.finance.customQrHint':  { tr: 'Eğer buraya bir resim linki girerseniz, ödeme sayfasında otomatik oluşturulan QR yerine bu resim gösterilir.',
                                    ru: 'Если указать ссылку на изображение, на странице оплаты вместо автоматического QR будет показано это изображение.',
                                    kg: 'Эгерде сүрөт шилтемесин киргизсеңиз, төлөм баракчасында автоматтык түзүлгөн QR ордуна ушул сүрөт көрсөтүлөт.' },
  'admin.finance.shippingSection':{ tr: 'Ödeme Ekranı Kargo & Alt Limit Ayarları', ru: 'Настройки доставки и нижнего лимита', kg: 'Жеткирүү жана төмөнкү чек жөндөөлөрү' },
  'admin.finance.shippingHint':  { tr: 'Sepet toplamı belirli bir limitin altında kalan kullanıcılara uyarı gösterin.',
                                    ru: 'Показывайте предупреждение пользователям, чей заказ ниже определённого лимита.',
                                    kg: 'Себеттин жалпы суммасы белгилүү бир чектен төмөн болгон колдонуучуларга эскертүү көрсөтүңүз.' },
  'admin.finance.thresholdUsd':  { tr: 'Kargo Ücreti Alt Limiti (USD)',    ru: 'Нижний лимит доставки (USD)',         kg: 'Жеткирүү акысынын төмөнкү чек (USD)' },
  'admin.finance.continueText':  { tr: 'Uyarı / Alışverişe Devam Et Buton Yazısı', ru: 'Текст предупреждения / кнопки «Продолжить покупки»', kg: 'Эскертүү / «Сатып алууну улантуу» баскычынын тексти' },
  'admin.finance.checkboxText': { tr: 'Kargo Kabul Onay Kutusu (Checkbox) Yazısı', ru: 'Текст флажка подтверждения доставки', kg: 'Жеткирүүнү ырастоо кутучасынын тексти' },
  'admin.finance.freeShippingText':{ tr: 'Ücretsiz Kargo Tebrik Mesajı (Limit üstü siparişler için)', ru: 'Поздравление с бесплатной доставкой (для заказов выше лимита)', kg: 'Акысыз жеткирүү куттуктоо билдирүүсү' },
  'admin.finance.savedToast':   { tr: '✅ Finans kuralları başarıyla kaydedildi! (Tüm fiyatlar güncellendi)', ru: '✅ Финансовые правила сохранены! (Все цены обновлены)', kg: '✅ Финанс эрежелери ийгиликтүү сакталды! (Баардык баалар жаңыртылды)' },
  'admin.finance.simSection':   { tr: 'Sistem Simülasyonu',                ru: 'Симуляция системы',                   kg: 'Система симуляциясы' },
  'admin.finance.simHint':      { tr: 'Canlı sistemin fiyatları nasıl göstereceğini test edin.', ru: 'Проверьте, как система отобразит цены.', kg: 'Тизим бааларды кантип көрсөтөрүн текшериңиз.' },
  'admin.finance.testPrice':    { tr: 'Test Edilecek Ürün Fiyatı (USD)',  ru: 'Тестовая цена (USD)',                  kg: 'Сыноо баасы (USD)' },
  'admin.finance.simRaw':       { tr: 'Ham Çeviri:',                       ru: 'Сырой перевод:',                        kg: 'Чийки которуу:' },
  'admin.finance.simFinal':     { tr: 'Müşterinin Göreceği Fiyat:',        ru: 'Цена для клиента:',                     kg: 'Кардар көрө турган баа:' },

  // ─── Category (admin.category.*) ─────────────────────────────────────
  'admin.category.title':        { tr: '📦 Dinamik Kategori Yönetimi',     ru: '📦 Управление динамическими категориями', kg: '📦 Динамикалык категория башкаруу' },
  'admin.category.subtitle':     { tr: 'Kategorilerinizi ekleyin, gizleyin ve sırasını değiştirin.', ru: 'Добавляйте, скрывайте и меняйте порядок категорий.', kg: 'Категорияларды кошуңуз, жашырыңыз жана тартибин өзгөртүңүз.' },
  'admin.category.name':         { tr: 'Kategori Adı',                      ru: 'Название категории',                    kg: 'Категория аталышы' },
  'admin.category.imageTitle':   { tr: 'Kategori Görseli (Vitrin Kartı için)', ru: 'Изображение категории (для витрины)', kg: 'Категория сүрөтү (витрина карточкасы үчүн)' },
  'admin.category.choose':       { tr: '📁 K. Seç',                          ru: '📁 Выбрать',                             kg: '📁 Тандоо' },
  'admin.category.imageHint':    { tr: 'Yeni görsel yükleyebilir veya Medya Kütüphanesi\'nden seçebilirsiniz.', ru: 'Загрузите новое изображение или выберите из Медиа-библиотеки.', kg: 'Жаңы сүрөт жүктөй аласыз же Медиа китепканасынан тандай аласыз.' },
  'admin.category.cancel':       { tr: 'İptal',                              ru: 'Отмена',                                kg: 'Жокко чыгаруу' },
  'admin.category.ordering':     { tr: 'Kategori Sıralaması',                ru: 'Порядок категорий',                     kg: 'Категория тартиби' },
  'admin.category.orderingHint': { tr: 'Kalem ile düzenle, oklarla sırayı değiştir, göz ile vitrinde gizle.', ru: 'Карандаш — изменить, стрелки — порядок, глаз — скрыть.', kg: 'Калем менен түзөтүү, жебелер менен тартип, көз менен жашыруу.' },

  // ─── Review (admin.review.*) ─────────────────────────────────────────
  'admin.review.subtitle':       { tr: 'Müşteri ve mağaza yorumlarını yönetin.', ru: 'Управляйте отзывами клиентов и магазина.', kg: 'Кардар жана дүкөн сын-пикирлерин башкарыңыз.' },
  'admin.review.tabProduct':     { tr: 'Ürün Yorumları',                    ru: 'Отзывы о товарах',                     kg: 'Продукт сын-пикирлери' },
  'admin.review.tabStore':       { tr: 'Mağaza Genel Yorumları',            ru: 'Отзывы о магазине',                    kg: 'Дүкөн жөнүндө сын-пикирлер' },
  'admin.review.filterAll':      { tr: 'Tümü',                              ru: 'Все',                                   kg: 'Баары' },
  'admin.review.loading':        { tr: 'Yorumlar yükleniyor...',             ru: 'Отзывы загружаются...',                 kg: 'Сын-пикирлер жүктөлүүдө...' },
  'admin.review.empty':          { tr: 'Hiç yorum bulunamadı.',              ru: 'Отзывов не найдено.',                   kg: 'Сын-пикирлер табылган жок.' },
  'admin.review.product':        { tr: 'Ürün:',                              ru: 'Товар:',                                 kg: 'Продукт:' },
  'admin.review.type':           { tr: 'Türü: Mağaza Yorumu',                ru: 'Тип: отзыв о магазине',                  kg: 'Түрү: дүкөн сын-пикири' },

  // ─── Media (admin.media.*) ──────────────────────────────────────────
  'admin.media.title':           { tr: 'Medya Kütüphanesi',                  ru: 'Медиа-библиотека',                     kg: 'Медиа китепканасы' },
  'admin.media.subtitle':        { tr: 'Görsellerinizi klasörleyerek daha düzenli çalışın.', ru: 'Организуйте изображения по папкам.', kg: 'Сүрөттөрдү папкаларга бөлүп, ирети менен иштегиле.' },
  'admin.media.folders':         { tr: '📁 Klasörler',                        ru: '📁 Папки',                              kg: '📁 Папкалар' },
  'admin.media.create':          { tr: 'Oluştur',                             ru: 'Создать',                               kg: 'Түзүү' },
  'admin.media.empty':           { tr: 'Bu klasörde henüz görsel yok. Yukarıya dosya sürükleyin veya tıklayıp seçin.', ru: 'В этой папке пока нет изображений. Перетащите файл или нажмите, чтобы выбрать.', kg: 'Бул папкада азырынча сүрөт жок. Файлды сүйрөңүз же басып тандаңыз.' },

  // ─── Logs (admin.logs.*) ────────────────────────────────────────────
  'admin.logs.title':            { tr: '📜 Canlı Log Tail',                   ru: '📜 Живой лог',                          kg: '📜 Тирүү лог' },
  'admin.logs.subtitle':         { tr: 'Pino structured JSON log\'ları — requestId, err, userId, route alanları otomatik yakalanır.', ru: 'Структурированные JSON-логи pino — requestId, err, userId, route подхватываются автоматически.', kg: 'Pino структураланган JSON логдору — requestId, err, userId, route автоматтык кармалат.' },
};

// Read existing locale JSON
const localePath = path.join(__dirname, '..', 'src', 'locales', `${LOCALE}.json`);
const locale = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
if (!locale.admin) locale.admin = {};

let added = 0;
for (const [key, translations] of Object.entries(I18N)) {
  const value = translations[LOCALE];
  if (!value) continue;
  // Set nested: 'admin.broadcast.title' → admin.broadcast.title
  const parts = key.split('.');
  let cur = locale.admin;
  for (let i = 1; i < parts.length - 1; i++) {
    if (!cur[parts[i]]) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
  added++;
}

fs.writeFileSync(localePath, JSON.stringify(locale, null, 2) + '\n', 'utf-8');
console.log(`✓ ${LOCALE}.json: ${added} keys added/updated`);
