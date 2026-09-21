/* ============================================================
   Марианна Белькова — общие скрипты
   ============================================================ */

// год в подвале
document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

// мобильное меню
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
if (burger && nav) {
  const burgerTxt = burger.querySelector('.burger-txt');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (burgerTxt) burgerTxt.textContent = open ? 'Закрыть' : 'Меню';
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    if (burgerTxt) burgerTxt.textContent = 'Меню';
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
  }));
}

// scroll-reveal
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// CTA -> предзаполнение типа запроса в форме контактов:
// тип кладём в hash ссылки, страница контактов его читает
document.querySelectorAll('a[data-type]').forEach(a => {
  const u = a.getAttribute('href').split('#')[0];
  a.setAttribute('href', u + '#type=' + encodeURIComponent(a.dataset.type));
});
// на странице контактов читаем hash и подставляем в select
(function presetType() {
  const sel = document.getElementById('f-type');
  if (!sel) return;
  const m = location.hash.match(/type=([^&]+)/);
  if (m) {
    const val = decodeURIComponent(m[1]);
    [...sel.options].forEach(o => { if (o.value === val || o.text === val) sel.value = o.value || o.text; });
    document.getElementById('leadForm')?.scrollIntoView({ block: 'center' });
  }
})();

// форма: пока без бэкенда — открывает письмо с заполненными полями
const leadForm = document.getElementById('leadForm');
if (leadForm) {
  leadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const subject = encodeURIComponent('Заявка с сайта: ' + f.type.value);
    const body = encodeURIComponent(
      'Имя: ' + f.name.value + '\n' +
      'Компания / мероприятие: ' + f.company.value + '\n' +
      'Тип запроса: ' + f.type.value + '\n\n' +
      f.message.value
    );
    window.location.href = 'mailto:mariashka@gmail.com?subject=' + subject + '&body=' + body;
  });
}

/* ------------------------------------------------------------
   Фоновая «нейросеть»: частицы + линии в духе референса.
   Лёгкий canvas-эффект. Когда пришлёте 3D-эффекты (three.js
   и т.п.) — этот блок заменяется, точка монтирования ниже.
------------------------------------------------------------ */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fx = document.getElementById('fx-canvas');
if (fx && !prefersReduced) {
  const ctx = fx.getContext('2d');
  let W, H, pts = [];
  const N = 46, LINK = 150;

  function resize() {
    W = fx.width = fx.offsetWidth * devicePixelRatio;
    H = fx.height = fx.offsetHeight * devicePixelRatio;
  }
  function init() {
    pts = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .35 * devicePixelRatio,
      vy: (Math.random() - .5) * .35 * devicePixelRatio,
      r: (Math.random() * 1.6 + .8) * devicePixelRatio
    }));
  }
  function tick() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    }
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const a = pts[i], b = pts[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y) / devicePixelRatio;
      if (d < LINK) {
        ctx.strokeStyle = `rgba(62,211,242,${(1 - d / LINK) * .28})`;
        ctx.lineWidth = devicePixelRatio * .6;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    for (const p of pts) {
      ctx.fillStyle = 'rgba(92,242,166,.75)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  resize(); init(); tick();
  window.addEventListener('resize', () => { resize(); init(); });
}

/* ------------------------------------------------------------
   ТОЧКА ПОДКЛЮЧЕНИЯ 3D  (three.js / spline / rive)
   Когда подберёте эффекты — монтируйте сцену сюда:

   const mount = document.getElementById('scene3d');
   if (mount) {
     // renderer.setSize(mount.offsetWidth, mount.offsetHeight)
     // mount.prepend(renderer.domElement)
     // фото-портрет оставить поверх сцены или заменить 3D-персонажем
   }
------------------------------------------------------------ */
window.BELKOVA_3D_MOUNTS = {
  hero: document.getElementById('scene3d'),
  background: document.getElementById('fx-canvas')
};


/* ------------------------------------------------------------
   Галерея: кнопка воспроизведения на видео-плитках.
   Видео с preload="none" — трафик тратится только по клику.
------------------------------------------------------------ */
document.querySelectorAll('.gal-play').forEach(function (btn) {
  var fig = btn.parentElement;                 // .gal-vid / .award-media / .partner-vid / .moder-vid / .rev-video
  var vid = fig && fig.querySelector('video');
  if (!fig || !vid) return;
  function playIt(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    fig.classList.add('is-playing');
    vid.setAttribute('playsinline', '');
    vid.setAttribute('webkit-playsinline', '');
    vid.controls = true;                        // нативные контролы появляются после запуска
    try { vid.load(); } catch (_) {}            // preload="none" — подгружаем по требованию
    var pr = vid.play();
    if (pr && pr.catch) pr.catch(function () {  // если браузер заблокировал звук — играем без звука
      vid.muted = true;
      vid.play().catch(function () {});
    });
  }
  // и клик, и тап — на некоторых мобильных click по абсолютной кнопке приходит с задержкой
  btn.addEventListener('click', playIt);
  btn.addEventListener('touchend', playIt, { passive: false });
  vid.addEventListener('pause', function () {
    if (vid.currentTime === 0) fig.classList.remove('is-playing');
  });
});

/* фон-обложка: на мобильных iOS иногда блокирует автозапуск — «толкаем» её первым касанием/скроллом */
(function coverNudge() {
  var cov = document.getElementById('coverVideo');
  if (!cov) return;
  cov.muted = true; cov.setAttribute('playsinline', ''); cov.setAttribute('webkit-playsinline', '');
  var kick = function () {
    if (cov.paused) cov.play().catch(function () {});
    if (!cov.paused) { window.removeEventListener('touchstart', kick); window.removeEventListener('scroll', kick); }
  };
  cov.play().catch(function () {});
  window.addEventListener('touchstart', kick, { passive: true });
  window.addEventListener('scroll', kick, { passive: true });
})();

/* ------------------------------------------------------------
   Расписание: раскрытие архива + автоподхват фото/видео.
   Чтобы добавить картинку к событию, достаточно положить файл
   assets/media/schedule/eNN.webp (или .jpg / .mp4) — код найдёт сам.
------------------------------------------------------------ */
(function () {
  var btn  = document.getElementById('schedToggle');
  var past = document.getElementById('schedPast');
  if (btn && past) {
    var txt = btn.querySelector('.sched-toggle-txt');
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      past.hidden = open;
      if (txt) txt.textContent = open ? 'Показать архив выступлений' : 'Свернуть архив';
      if (open) {
        // свернули — возвращаем к началу блока, чтобы не оказаться в пустоте
        var top = document.getElementById('schedule');
        if (top) window.scrollTo({ top: top.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
      }
    });
  }

  document.querySelectorAll('.ev-media[data-media]').forEach(function (box) {
    var base = box.getAttribute('data-media');
    var pics = ['webp', 'jpg', 'jpeg', 'png'];
    var vids = ['mp4', 'webm'];

    function showImg(src) {
      var el = document.createElement('img');
      el.src = src; el.alt = ''; el.loading = 'lazy'; el.decoding = 'async';
      box.appendChild(el); box.classList.add('has-media');
    }
    function showVid(src, type) {
      var v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
      v.preload = 'metadata'; v.setAttribute('aria-hidden', 'true');
      var s = document.createElement('source'); s.src = src; s.type = type;
      v.appendChild(s); box.appendChild(v); box.classList.add('has-media');
      v.play().catch(function () {});
    }
    function tryVid(i) {
      if (i >= vids.length) return;                       // ничего нет — остаётся слот
      var v = document.createElement('video');
      v.preload = 'metadata';
      v.addEventListener('loadeddata', function () {
        showVid(base + '.' + vids[i], 'video/' + vids[i]);
      }, { once: true });
      v.addEventListener('error', function () { tryVid(i + 1); }, { once: true });
      v.src = base + '.' + vids[i];
    }
    function tryPic(i) {
      if (i >= pics.length) return tryVid(0);
      var img = new Image();
      img.onload  = function () { showImg(img.src); };
      img.onerror = function () { tryPic(i + 1); };
      img.src = base + '.' + pics[i];
    }
    tryPic(0);
  });
})();


/* ------------------------------------------------------------
   Расписание: автоперенос прошедших событий в архив по дате визита.
   Дата берётся из data-date у .ev-media. Прошедшие анонсы уезжают
   в начало архива, будущие (если вдруг оказались в архиве) — наверх.
------------------------------------------------------------ */
(function schedReflow(){
  var up=document.querySelector('.sched-up'), past=document.querySelector('.sched-scroll');
  if(!up||!past) return;
  var today=new Date(); today.setHours(0,0,0,0);
  function dateOf(li){ var m=li.querySelector('[data-date]'); return m ? new Date(m.getAttribute('data-date')+'T00:00:00') : null; }
  Array.prototype.slice.call(up.querySelectorAll('.ev')).forEach(function(li){
    var d=dateOf(li); if(d && d<today){
      var b=li.querySelector('.ev-badge'); if(b) b.remove();
      if(!li.querySelector('.ev-badge-empty')){ var e=document.createElement('div'); e.className='ev-badge-empty'; li.appendChild(e); }
      li.classList.remove('ev-soon');
      past.insertBefore(li, past.firstChild);
    }
  });
  Array.prototype.slice.call(past.querySelectorAll('.ev')).forEach(function(li){
    var d=dateOf(li); if(d && d>=today){ up.appendChild(li); }
  });
})();


/* ------------------------------------------------------------
   Cookie-уведомление: показывается один раз, согласие хранится
   в localStorage. Ссылка ведёт на политику обработки cookie.
------------------------------------------------------------ */
(function cookieBanner(){
  try { if (localStorage.getItem('mb-cookie-ok')) return; } catch (e) {}
  var atBlog = location.pathname.indexOf('/blog/') !== -1;
  var href = (atBlog ? '../' : '') + 'policyofcookies.html';
  var el = document.createElement('div');
  el.className = 'cookie-banner';
  el.innerHTML = '<p>Мы используем cookie-файлы для работы сайта и обезличенной статистики посещений. '
    + 'Продолжая пользоваться сайтом, вы соглашаетесь с <a href="' + href + '">Политикой обработки cookie-файлов</a>.</p>'
    + '<button type="button" class="btn btn-sm cookie-ok">Принять</button>';
  document.body.appendChild(el);
  el.querySelector('.cookie-ok').addEventListener('click', function () {
    try { localStorage.setItem('mb-cookie-ok', '1'); } catch (e) {}
    el.classList.add('cookie-hide');
    setTimeout(function () { el.remove(); }, 400);
  });
})();


/* ------------------------------------------------------------
   Сворачиваемый блок «Программы» на главной
------------------------------------------------------------ */
(function () {
  var btn = document.getElementById('progToggle');
  var body = document.getElementById('progGrid');
  if (!btn || !body) return;
  var txt = btn.querySelector('.fold-txt');
  var total = body.querySelectorAll('article').length;
  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    body.hidden = open;
    if (txt) txt.textContent = open ? ('Развернуть ' + total + ' программ') : 'Свернуть программы';
    if (!open) {
      // карточки были скрыты — показываем их сразу, не дожидаясь observer
      body.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('on'); });
    } else {
      var top = document.getElementById('programs');
      if (top) window.scrollTo({ top: top.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
    }
  });
})();
