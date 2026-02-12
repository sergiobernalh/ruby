/* =========================
   FUNCIONES GLOBALES (onclick)
   + Música local con fade + volumen
   + Typewriter (se escribe sola) en LOVE
   + Árbol de corazones + partículas
   + Contador desde 29 Oct 2025
   + Sorpresa + razones + mensaje final
   + Álbumes flotando (solo en LOVE)
   + Optimización mobile (usa los valores)
   ========================= */

(() => {

  /* ========= 🎵 MÚSICA (play/pause + fade) ========= */
  function toggleSong() {
    const audio = document.getElementById("bgMusic");
    const btn = document.getElementById("musicBtn");
    const slider = document.getElementById("volumeSlider");
    if (!audio) return;

    const fadeTo = (target, ms = 700) => {
      clearInterval(audio._fadeTimer);
      const steps = 25;
      const stepMs = Math.max(10, Math.floor(ms / steps));
      const start = (typeof audio.volume === "number") ? audio.volume : 1;
      const delta = (target - start) / steps;
      let i = 0;

      audio._fadeTimer = setInterval(() => {
        i++;
        audio.volume = Math.min(1, Math.max(0, start + delta * i));
        if (i >= steps) {
          clearInterval(audio._fadeTimer);
          audio.volume = target;
        }
      }, stepMs);
    };

    if (audio.paused) {
      audio.volume = 0;
      audio.play().then(() => {
        const vol = slider ? (slider.value / 100) : 0.8;
        fadeTo(vol, 900);
        if (btn) btn.textContent = "⏸️ Pausar ❤️";
      }).catch(() => {
        // si el navegador bloquea, vuelve a tocar y listo
      });
    } else {
      fadeTo(0, 450);
      setTimeout(() => {
        audio.pause();
        if (btn) btn.textContent = "🎵 Dale play ❤️";
      }, 480);
    }
  }
  window.toggleSong = toggleSong;


  /* ========= ✍️ TYPEWRITER (LOVE) ========= */
  let typeTimer = null;
  let letterOriginalHTML = null;

  function typeHTML(el, html, speed = 12) {
    if (typeTimer) clearTimeout(typeTimer);

    const parts = html.split(/(<[^>]+>)/g).filter(Boolean);
    el.innerHTML = "";

    let i = 0; // parte
    let j = 0; // letra dentro de la parte

    function step() {
      if (i >= parts.length) return;

      const part = parts[i];

      if (part.startsWith("<")) {
        el.innerHTML += part;
        i++;
        typeTimer = setTimeout(step, speed);
        return;
      }

      el.innerHTML += part[j] ?? "";
      j++;

      if (j >= part.length) {
        i++;
        j = 0;
      }

      typeTimer = setTimeout(step, speed);
    }

    step();
  }

  function startLetterTypewriter() {
    const el = document.getElementById("letter");
    if (!el) return;

    if (letterOriginalHTML === null) {
      letterOriginalHTML = el.innerHTML;
    }

    const cleanHTML = letterOriginalHTML.replace(
      /<span[^>]*id=["']caret["'][^>]*>.*?<\/span>/i,
      ""
    );

    typeHTML(el, cleanHTML, 36);

    setTimeout(() => {
      const caret = document.getElementById("caret");
      if (caret) el.appendChild(caret);
    }, Math.max(600, cleanHTML.length * 12));
  }


  /* ========= 💌 MENSAJE FINAL ========= */
  function showFinalMessage() {
    const msg = document.getElementById("finalMsg");
    if (!msg) return;

    msg.classList.remove("hidden");

    setTimeout(() => {
      msg.classList.add("hidden");
    }, 1200);
  }


  /* ========= 🧭 NAVEGACIÓN ENTRE PANTALLAS ========= */
  let currentScreen = "start";

  function go(id) {
    // mostrar mensaje final solo cuando volvés desde LOVE → doors
    if (id === "doors" && currentScreen === "love") {
      showFinalMessage();
    }

    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    const target = document.getElementById(id);
    if (!target) return;
    target.classList.remove("hidden");

    if (id === "love") {
      stopTree();
      startLetterTypewriter();
      setTimeout(resetTree, 450);
      startAlbums(); // ✅ álbumes solo en LOVE
    } else {
      stopTree();
      stopAlbums();
    }

    currentScreen = id;
  }

  function lockedDoor() {
    const d = document.querySelector(".whiteDoor");
    if (!d) return;
    d.classList.remove("shake");
    void d.offsetWidth;
    d.classList.add("shake");
    setTimeout(() => go("locked"), 250);
  }

  function openDoor() {
    const d = document.querySelector(".redDoor");
    if (!d) return;
    d.classList.add("opening");
    setTimeout(() => {
      d.classList.remove("opening");
      go("love");
    }, 650);
  }

  window.go = go;
  window.lockedDoor = lockedDoor;
  window.openDoor = openDoor;


  /* ========= 🌳 ÁRBOL DE CORAZONES ========= */
  const r = (a, b) => Math.random() * (b - a) + a;
  const pick = a => a[Math.floor(Math.random() * a.length)];

  function heartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return { x, y };
  }

  function randomPointInHeart() {
    const t = r(0, Math.PI * 2);
    const p = heartPoint(t);
    const k = Math.sqrt(Math.random());
    return { x: p.x * k, y: p.y * k };
  }

  function spawnHeartUse(parent, x, y, scale, op, color) {
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#heartSym");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#heartSym");

    use.classList.add("leafHeart");
    use.setAttribute("fill", color);
    use.setAttribute("opacity", op);

    use.setAttribute("transform", `translate(${x} ${y}) scale(${scale}) translate(-10 -10)`);
    parent.appendChild(use);
    return use;
  }

  function buildCanopy(count = 1200) {
    const canopy = document.getElementById("canopy");
    if (!canopy) return;

    canopy.innerHTML = "";

    const centerX = 330;
    const centerY = 150;
    const sx = 8.8;
    const sy = 8.2;
    const base = 0.38;

    for (let i = 0; i < count; i++) {
      const p = randomPointInHeart();

      const edge = Math.random() < 0.55;
      const t = edge ? r(0.98, 1.10) : r(0.60, 1.02);

      const X = centerX + p.x * sx * t;
      const Y = centerY + p.y * sy * t;

      const scale = base * (edge ? r(0.24, 0.34) : r(0.18, 0.30));
      const op = edge ? r(0.75, 0.95) : r(0.40, 0.80);
      const col = pick(["#ff2b4d", "#ff6b81", "#ff9ecb", "#ffffff"]);

      spawnHeartUse(canopy, X, Y, scale, op, col);
    }
  }


  /* ========= 💞 CORAZONES QUE CAEN + PARTICULAS ========= */
  let fallInterval = null;

  function spawnFallingHeart() {
    const falling = document.getElementById("falling");
    if (!falling) return;

    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#heartSym");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#heartSym");

    const redPalette = ["#ff0a2f", "#ff2b4d", "#ff4d6d"];
    const whitePalette = ["#ffffff", "#ffe5ec"];

    if (Math.random() < 0.5) {
      use.setAttribute("fill", pick(redPalette));
      use.setAttribute("stroke", "rgba(255,255,255,.7)");
    } else {
      use.setAttribute("fill", pick(whitePalette));
      use.setAttribute("stroke", "rgba(190,0,35,.65)");
    }

    use.setAttribute("stroke-width", "1.2");
    use.setAttribute("paint-order", "stroke fill");

    const x0 = r(285, 405);
    const y0 = r(145, 175);
    const s = r(0.08, 0.14);

    const wind = r(40, 70);
    const swirl = r(-12, 12);
    const dx = wind + swirl;
    const dy = r(150, 230);

    const rot = r(-35, 35);
    const dur = r(5000, 9000);
    const t0 = performance.now();

    function tick(now) {
      const t = (now - t0) / dur;
      if (t >= 1) { use.remove(); return; }

      const ease = t * (2 - t);

      const x = x0 + dx * ease;
      const y = y0 + dy * ease;
      const a = rot * ease;

      const op =
        t < 0.12 ? (t / 0.12) :
        t > 0.85 ? (1 - (t - 0.85) / 0.15) :
        1;

      use.setAttribute("opacity", String(0.85 * op));
      use.setAttribute("transform", `translate(${x} ${y}) rotate(${a}) scale(${s}) translate(-10 -10)`);

      requestAnimationFrame(tick);
    }

    falling.appendChild(use);
    requestAnimationFrame(tick);
  }

  function spawnSpecialParticle() {
    const falling = document.getElementById("falling");
    if (!falling) return;

    const specials = ["⭐", "✨", "🎵", "HS", "Billie", "TPWK", "Love"];

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.textContent = pick(specials);

    const x0 = r(285, 405);
    const y0 = r(145, 175);

    const wind = r(45, 80);
    const swirl = r(-10, 10);
    const dx = wind + swirl;
    const dy = r(150, 230);

    const dur = r(6500, 10000);
    const rot = r(-12, 12);
    const size = r(11, 16);

    const t0 = performance.now();

    if (text.textContent === "⭐" || text.textContent === "✨") {
      text.setAttribute("fill", "#ffd166");
    } else if (text.textContent === "🎵") {
      text.setAttribute("fill", "#c77dff");
    } else if (text.textContent === "HS") {
      text.setAttribute("fill", "#ff2b4d");
    } else if (text.textContent === "Billie") {
      text.setAttribute("fill", "#80ed99");
    } else {
      text.setAttribute("fill", "#ff9ecb");
    }

    text.setAttribute("font-size", String(size));
    text.setAttribute("font-weight", "700");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.style.userSelect = "none";

    function tick(now) {
      const t = (now - t0) / dur;
      if (t >= 1) { text.remove(); return; }

      const ease = t * (2 - t);
      const x = x0 + dx * ease;
      const y = y0 + dy * ease;
      const a = rot * ease;

      const op =
        t < 0.12 ? (t / 0.12) :
        t > 0.85 ? (1 - (t - 0.85) / 0.15) :
        1;

      text.setAttribute("opacity", String(0.85 * op));
      text.setAttribute("transform", `translate(${x} ${y}) rotate(${a})`);

      requestAnimationFrame(tick);
    }

    falling.appendChild(text);
    requestAnimationFrame(tick);
  }

  function resetTree() {
    buildCanopy(window.__CANOPY_COUNT__ ?? 1100);

    if (fallInterval) clearInterval(fallInterval);

    fallInterval = setInterval(() => {
      spawnFallingHeart();
      if (Math.random() < (window.__SPECIAL_CHANCE__ ?? 0.20)) spawnSpecialParticle();
    }, window.__FALL_RATE__ ?? 420);

    spawnFallingHeart();
    spawnSpecialParticle();
  }

  function stopTree() {
    if (fallInterval) clearInterval(fallInterval);
    fallInterval = null;

    const falling = document.getElementById("falling");
    if (falling) falling.innerHTML = "";
  }


  /* ========= 🎚️ VOLUMEN (slider en vivo) ========= */
  document.addEventListener("DOMContentLoaded", () => {
    const audio = document.getElementById("bgMusic");
    const slider = document.getElementById("volumeSlider");
    if (!audio || !slider) return;

    audio.volume = slider.value / 100;

    slider.addEventListener("input", () => {
      audio.volume = slider.value / 100;
    });
  });


  /* ========= ⏳ CONTADOR ========= */
  function startCounter() {
    const startDate = new Date("2025-10-29T00:00:00");

    function update() {
      const now = new Date();
      const diff = now - startDate;

      const minutes = Math.floor(diff / 1000 / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      const h = hours % 24;
      const m = minutes % 60;

      const dEl = document.getElementById("days");
      const hEl = document.getElementById("hours");
      const mEl = document.getElementById("minutes");
      if (!dEl || !hEl || !mEl) return;

      dEl.textContent = days;
      hEl.textContent = h;
      mEl.textContent = m;
    }

    update();
    setInterval(update, 60000);
  }


  /* ========= 🎁 SORPRESA ========= */
  function openSurprise() {
    const m = document.getElementById("surpriseModal");
    if (m) m.classList.remove("hidden");
  }
  function closeSurprise() {
    const m = document.getElementById("surpriseModal");
    if (m) m.classList.add("hidden");
  }
  window.openSurprise = openSurprise;
  window.closeSurprise = closeSurprise;


  /* ========= 💭 RAZONES ========= */
  const reasons = [
    "Porque tu risa me calma.",
    "Porque hablar contigo mejora mi día.",
    "Porque sos vos.",
    "Porque me hacés sentir en casa.",
    "Porque me encanta escucharte.",
    "Porque me gusta cómo pensás.",
    "Porque me hacés sonreír sin darme cuenta.",
    "Porque con vos todo se siente más fácil.",
    "Porque sos mi persona favorita.",
    "Porque me gusta estar para vos.",
    "Porque me encantas.",
    "Porque sos hermosa.",
    "Porque cada segundo contigo estoy feliz."
  ];

  function newReason() {
    const box = document.getElementById("reasonBox");
    if (!box) return;

    const random = reasons[Math.floor(Math.random() * reasons.length)];
    box.classList.remove("hidden");
    box.textContent = random;
  }
  window.newReason = newReason;


  /* ========= 💿 ÁLBUMES FLOTANDO (solo LOVE) ========= */
  const albumCovers = [
    "https://files.catbox.moe/pl49dp.webp",
    "https://files.catbox.moe/02k1zj.jpg",
    "https://files.catbox.moe/66099e.webp"
  ];

  function spawnAlbum() {
    const layer = document.getElementById("albumsLayer");
    if (!layer || !albumCovers.length) return;

    const img = document.createElement("img");
    img.className = "albumFloat";

    img.src = albumCovers[Math.floor(Math.random() * albumCovers.length)];
    img.onerror = () => img.remove();
    img.alt = "";

    const left = Math.random() * 100;
    const size = 42 + Math.random() * 26;
    const dur = 14 + Math.random() * 10;
    const rot = (-12 + Math.random() * 24) + "deg";
    const scale = (0.85 + Math.random() * 0.6).toFixed(2);

    img.style.left = left + "vw";
    img.style.width = size + "px";
    img.style.height = size + "px";
    img.style.animationDuration = dur + "s";
    img.style.setProperty("--rot", rot);
    img.style.setProperty("--s", scale);

    img.addEventListener("animationend", () => img.remove());
    layer.appendChild(img);
  }

  let albumInterval = null;

  function startAlbums() {
    if (albumInterval) return;

    for (let i = 0; i < 6; i++) setTimeout(spawnAlbum, i * 350);

    albumInterval = setInterval(spawnAlbum, window.__ALBUM_RATE__ ?? 1500);
  }

  function stopAlbums() {
    if (albumInterval) clearInterval(albumInterval);
    albumInterval = null;

    const layer = document.getElementById("albumsLayer");
    if (layer) layer.innerHTML = "";
  }


  /* ========= 📱 OPTIMIZACIÓN MOBILE (se USA en resetTree/startAlbums) ========= */
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  if (isMobile) {
    window.__CANOPY_COUNT__ = 520;
    window.__FALL_RATE__ = 900;
    window.__SPECIAL_CHANCE__ = 0.10;
    window.__ALBUM_RATE__ = 2200;
  }


  /* ========= 🚀 ARRANQUES ========= */
  document.addEventListener("DOMContentLoaded", startCounter);
  document.addEventListener("DOMContentLoaded", () => go("start"));

})();