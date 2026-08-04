/*
 * Service Worker لموقع "عود & مقامات" (East-West Maqamat)
 * ==========================================================
 * الاستراتيجية المتبعة (بعد الموازنة بين حجم التخزين وتجربة الأوفلاين):
 *
 * 1) PRECACHE (تخزين فوري عند أول زيارة):
 *    - هيكل الصفحة (index.html) + المانيفست + الأيقونات
 *    - صور دليل السلالم الغربية (48 صورة، ثابتة وصغيرة نسبياً)
 *    - عينات نغمات العود الأساسية الـ34 (sounds/oud/*.wav) — هذي هي
 *      العينات الجذرية اللي يُبنى عليها صوت أي نغمة على الزند (نغمة فردية
 *      بالضغط + تشغيل أي مقام عربي)، فوجودها أوفلاين من أول زيارة
 *      يفعّل مية بالمية من التفاعل الأساسي مع العود حتى بدون نت.
 *
 * 2) RUNTIME CACHE (تخزين تدريجي عند أول استخدام فعلي):
 *    - تسجيلات المقامات الكاملة (sounds/<فصيلة>/<مقام>/<حرف>.mp3)
 *      لأن عددها الإجمالي يتجاوز الآلاف (٤٧ مقام × عشرات الحروف لكل
 *      مقام)، فتخزينها كلها من البداية غير عملي إطلاقاً (حجم ضخم +
 *      وقت تحميل أولي طويل جداً). بدلاً من ذلك: أي مقام يشغّله
 *      المستخدم فعلياً يتخزّن تلقائياً، وبالتالي المقامات اللي
 *      "زارها" المستخدم قبل تشتغل أوفلاين، والباقي يحتاج نت أول مرة.
 *
 * لتحديث أي ملف مخزّن مستقبلاً (تعديل index.html مثلاً): غيّر رقم
 * CACHE_VERSION بالأسفل، وهذا يجبر كل الأجهزة تحمّل نسخة جديدة.
 */

const CACHE_VERSION = 'v1';
const PRECACHE_NAME = `maqamat-precache-${CACHE_VERSION}`;
const RUNTIME_AUDIO_CACHE = `maqamat-runtime-audio-${CACHE_VERSION}`;

// --- قائمة الملفات اللي تتخزن فوراً عند أول تثبيت ---
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './images/2030_vision.png',

  // صور دليل السلالم الغربية (48 صورة)
  "images/western-guide/harmonicMinor_0.png",
  "images/western-guide/harmonicMinor_1.png",
  "images/western-guide/harmonicMinor_10.png",
  "images/western-guide/harmonicMinor_11.png",
  "images/western-guide/harmonicMinor_2.png",
  "images/western-guide/harmonicMinor_3.png",
  "images/western-guide/harmonicMinor_4.png",
  "images/western-guide/harmonicMinor_5.png",
  "images/western-guide/harmonicMinor_6.png",
  "images/western-guide/harmonicMinor_7.png",
  "images/western-guide/harmonicMinor_8.png",
  "images/western-guide/harmonicMinor_9.png",
  "images/western-guide/major_0.png",
  "images/western-guide/major_1.png",
  "images/western-guide/major_10.png",
  "images/western-guide/major_11.png",
  "images/western-guide/major_2.png",
  "images/western-guide/major_3.png",
  "images/western-guide/major_4.png",
  "images/western-guide/major_5.png",
  "images/western-guide/major_6.png",
  "images/western-guide/major_7.png",
  "images/western-guide/major_8.png",
  "images/western-guide/major_9.png",
  "images/western-guide/melodicMinor_0.png",
  "images/western-guide/melodicMinor_1.png",
  "images/western-guide/melodicMinor_10.png",
  "images/western-guide/melodicMinor_11.png",
  "images/western-guide/melodicMinor_2.png",
  "images/western-guide/melodicMinor_3.png",
  "images/western-guide/melodicMinor_4.png",
  "images/western-guide/melodicMinor_5.png",
  "images/western-guide/melodicMinor_6.png",
  "images/western-guide/melodicMinor_7.png",
  "images/western-guide/melodicMinor_8.png",
  "images/western-guide/melodicMinor_9.png",
  "images/western-guide/naturalMinor_0.png",
  "images/western-guide/naturalMinor_1.png",
  "images/western-guide/naturalMinor_10.png",
  "images/western-guide/naturalMinor_11.png",
  "images/western-guide/naturalMinor_2.png",
  "images/western-guide/naturalMinor_3.png",
  "images/western-guide/naturalMinor_4.png",
  "images/western-guide/naturalMinor_5.png",
  "images/western-guide/naturalMinor_6.png",
  "images/western-guide/naturalMinor_7.png",
  "images/western-guide/naturalMinor_8.png",
  "images/western-guide/naturalMinor_9.png",

  // عينات نغمات العود الأساسية (34 عينة — أساس كل تفاعل صوتي بالزند)
  "sounds/oud/La0.wav",
  "sounds/oud/La0J.wav",
  "sounds/oud/La0JJ.wav",
  "sounds/oud/La2.wav",
  "sounds/oud/La2J.wav",
  "sounds/oud/La4.wav",
  "sounds/oud/La4J.wav",
  "sounds/oud/La4JJ.wav",
  "sounds/oud/La6.wav",
  "sounds/oud/La6J.wav",
  "sounds/oud/La6JJ.wav",
  "sounds/oud/La8.wav",
  "sounds/oud/La8J.wav",
  "sounds/oud/La8JJ.wav",
  "sounds/oud/Me6.wav",
  "sounds/oud/Re0.wav",
  "sounds/oud/Re0J.wav",
  "sounds/oud/Re0JJ.wav",
  "sounds/oud/Re2.wav",
  "sounds/oud/Re2J.wav",
  "sounds/oud/Re2JJ.wav",
  "sounds/oud/Re4.wav",
  "sounds/oud/Re4J.wav",
  "sounds/oud/Re4JJ.wav",
  "sounds/oud/Re6.wav",
  "sounds/oud/Re6J.wav",
  "sounds/oud/Re6JJ.wav",
  "sounds/oud/Re8.wav",
  "sounds/oud/Re8J.wav",
  "sounds/oud/Re8JJ.wav",
  "sounds/oud/Re9.wav",
  "sounds/oud/Re9J.wav",
  "sounds/oud/Sol0.wav",
  "sounds/oud/Sol0J.wav"
];

// ============================================================
// INSTALL: نحمّل ونخزن كل ملفات PRECACHE_ASSETS
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE_NAME).then((cache) => {
      // addAll تفشل كلها لو فشل ملف واحد بس — نستخدم طريقة أكثر تسامحاً
      // عشان لو ملف واحد ناقص أو تغير اسمه، باقي الملفات تتخزن بنجاح
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] فشل تخزين:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ============================================================
// ACTIVATE: تنظيف أي نسخ كاش قديمة من إصدارات سابقة
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== PRECACHE_NAME && name !== RUNTIME_AUDIO_CACHE)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// ============================================================
// FETCH: التعامل مع كل طلب حسب نوعه
// ============================================================
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // نتجاهل أي طلب مو GET (مثلاً طلبات Firebase/Firestore الخاصة بالتقييمات)
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // نتجاهل الطلبات لنطاقات خارجية (Firebase وغيرها) — نخليها تروح للنت مباشرة
  if (url.origin !== self.location.origin) return;

  // تسجيلات المقامات الكاملة (sounds/*/*.mp3) — تخزين تدريجي عند أول تشغيل فعلي
  if (url.pathname.includes('/sounds/') && url.pathname.endsWith('.mp3')) {
    event.respondWith(cacheFirstRuntime(req));
    return;
  }

  // كل شي ثاني (الصفحة، الصور، عينات العود الأساسية): كاش أولاً، ولو مو موجود نروح للنت
  event.respondWith(cacheFirstPrecache(req));
});

// كاش-أولاً لملفات PRECACHE (سريع، وهذي الملفات ثابتة وما تتغير كثير)
async function cacheFirstPrecache(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // نخزن نسخة من أي ملف جديد نجحنا بجلبه (مثلاً لو المستخدم زار صفحة
    // ما كانت بالقائمة الأساسية) عشان يشتغل أوفلاين المرة الجاية
    if (response && response.status === 200) {
      const cache = await caches.open(PRECACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // ما فيه نت وما فيه نسخة مخزنة — نرجع خطأ واضح بدل ما يعلق الطلب
    return new Response('غير متاح بدون اتصال بالإنترنت', {
      status: 503,
      statusText: 'Offline'
    });
  }
}

// كاش-أولاً لملفات الصوت الكبيرة (تسجيلات المقامات) — نخزنها بكاش منفصل
async function cacheFirstRuntime(request) {
  const cache = await caches.open(RUNTIME_AUDIO_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('هذا المقام يحتاج اتصال بالإنترنت أول مرة تشغّله', {
      status: 503,
      statusText: 'Offline'
    });
  }
}
