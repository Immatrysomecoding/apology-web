
      // ── Login gate ──────────────────────────────────────
      const LOGIN_DRINK = 'coldbrewkimquat';
      const LOGIN_BOOK = 'therainbowtroops';
      const normalize = (s) => s.trim().toLowerCase().replace(/\s+/g, '');

      document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const drinkEl = document.getElementById('login-drink');
        const bookEl = document.getElementById('login-book');
        const errEl = document.getElementById('login-error');
        const drinkOk = normalize(drinkEl.value) === LOGIN_DRINK;
        const bookOk = normalize(bookEl.value) === LOGIN_BOOK;
        if (drinkOk && bookOk) {
          document.getElementById('login-gate').style.display = 'none';
          document.getElementById('page1').style.display = 'flex';
        } else {
          errEl.textContent = 'E hèm, thân ai nấy lo hồn ai tự giữ nghe chưa :[';
          errEl.classList.remove('shake');
          void errEl.offsetWidth;
          errEl.classList.add('shake');
          drinkEl.value = '';
          bookEl.value = '';
          drinkEl.focus();
        }
      });

      // ── Page history stack ─────────────────────────────
      const pageHistory = [];

      function showBackBtn(show) {
        const btn = document.getElementById('back-btn');
        btn.style.display = show ? 'flex' : 'none';
      }

      function hidePage(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = 'none';
        el.classList.remove('active');
      }

      function showPage(id) {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === 'page2' || id === 'page4') {
          el.style.display = 'block';
          el.classList.add('active');
        } else {
          el.style.display = 'flex';
        }
        if (id === 'page2') document.getElementById('ticker').style.display = 'block';
        else document.getElementById('ticker').style.display = 'none';
      }

      function goBack() {
        if (pageHistory.length === 0) return;
        const prev = pageHistory.pop();
        ['page1','page2','page3','page4','final-msg'].forEach(hidePage);
        showPage(prev);
        showBackBtn(pageHistory.length > 0);
        // restore correct soundtrack
        const trackMap = {
          'page1': 'aud-gymno',
          'page2': 'aud-shooting',
          'page3': 'aud-einaudi',
          'page4': 'aud-shooting',
          'final-msg': 'aud-clair',
        };
        if (trackMap[prev]) playBg(trackMap[prev]);
      }

      function navigateTo(from, to) {
        pageHistory.push(from);
        hidePage(from);
        showPage(to);
        showBackBtn(true);
      }


      // ── AUDIO ENGINE ──────────────────────────────────────────────────
      let activeBg  = null;   // currently playing background track
      let isMuted   = false;

      function playBg(id) {
        // stop whatever is playing
        if (activeBg && activeBg !== document.getElementById(id)) {
          activeBg.pause();
          activeBg.currentTime = 0;
        }
        activeBg = document.getElementById(id);
        if (isMuted) return;
        activeBg.volume = 0.5;
        activeBg.play().catch(() => {});
      }

      function playSfx(id) {
        if (isMuted) return;
        const el = document.getElementById(id);
        el.currentTime = 0;
        el.volume = 1.0;
        el.play().catch(() => {});
      }

      // quiet one-shot used for button hover previews
      function playHover(id) {
        if (isMuted || !audioUnlocked) return;
        const el = document.getElementById(id);
        el.pause();
        el.currentTime = 0;
        el.volume = 0.35;
        el.play().catch(() => {});
      }

      function toggleMute() {
        isMuted = !isMuted;
        document.getElementById('mute-btn').textContent = isMuted ? '🔇' : '🔊';
        if (activeBg) {
          if (isMuted) activeBg.pause();
          else { activeBg.volume = 0.5; activeBg.play().catch(() => {}); }
        }
      }

      // Unlock audio on first user gesture, then start Gymnopedie immediately.
      // IMPORTANT: playBg('aud-gymno') must run synchronously inside the gesture
      // (no setTimeout) — Safari/iOS revokes autoplay permission once the call
      // stack returns to a timer callback, which was why music never started.
      let audioUnlocked = false;

      function unlockAudio() {
        if (audioUnlocked) return;
        audioUnlocked = true;
        // prime every other track/sfx (play+pause at volume 0) so later
        // script-triggered playback is allowed on strict mobile browsers
        const rest = ['aud-shooting','aud-einaudi','aud-clair','aud-yeah','aud-fart','aud-shatter'];
        rest.forEach(id => {
          const el = document.getElementById(id);
          el.volume = 0;
          el.play().then(() => { el.pause(); el.currentTime = 0; el.volume = 1; }).catch(() => {});
        });
        playBg('aud-gymno');
      }

      // Unlock on ANY first interaction. capture:true makes this run before
      // a button's own onclick handler, so the very first click is guaranteed
      // to have audio unlocked already.
      ['pointerdown', 'keydown', 'touchstart'].forEach(evt =>
        document.addEventListener(evt, unlockAudio, { once: true, capture: true })
      );

      // ── Hover sound effects ─────────────────────────────────────────────
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.btn-forgive, .btn-rainbow, .btn-forgive-p4')
          .forEach(btn => btn.addEventListener('mouseenter', () => playHover('aud-yeah')));
        document.querySelectorAll('.btn-chaos, .btn-getout')
          .forEach(btn => btn.addEventListener('mouseenter', () => playHover('aud-fart')));
      });
      // ──────────────────────────────────────────────────────────────────

      const canvas = document.getElementById("bg");
      const ctx = canvas.getContext("2d");
      let W,
        H,
        particles = [],
        mouse = { x: -999, y: -999 };
      function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
      }
      function Particle() {
        this.reset();
      }
      Particle.prototype.reset = function () {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.r = Math.random() * 1.2 + 0.3;
        this.alpha = Math.random() * 0.4 + 0.05;
        this.vx = (Math.random() - 0.5) * 0.18;
        this.vy = (Math.random() - 0.5) * 0.18;
        this.life = Math.random() * 400 + 200;
        this.age = 0;
      };
      function init() {
        resize();
        particles = [];
        for (let i = 0; i < 140; i++) {
          const p = new Particle();
          p.age = Math.random() * p.life;
          particles.push(p);
        }
      }
      function draw() {
        ctx.clearRect(0, 0, W, H);
        const grd = ctx.createRadialGradient(
          W / 2,
          H / 2,
          0,
          W / 2,
          H / 2,
          W * 0.6,
        );
        grd.addColorStop(0, "rgba(60,45,80,0.18)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            const dx = a.x - b.x,
              dy = a.y - b.y,
              dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 90) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(255,255,255,${0.04 * (1 - dist / 90)})`;
              ctx.lineWidth = 0.4;
              ctx.stroke();
            }
          }
        }
        for (const p of particles) {
          const fi = Math.min(1, p.age / 60),
            fo = Math.min(1, (p.life - p.age) / 60);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${p.alpha * fi * fo})`;
          ctx.fill();
          const mdx = p.x - mouse.x,
            mdy = p.y - mouse.y,
            md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < 100) {
            p.x += (mdx / md) * 0.6;
            p.y += (mdy / md) * 0.6;
          }
          p.x += p.vx;
          p.y += p.vy;
          p.age++;
          if (
            p.age > p.life ||
            p.x < -10 ||
            p.x > W + 10 ||
            p.y < -10 ||
            p.y > H + 10
          )
            p.reset();
        }
        requestAnimationFrame(draw);
      }
      window.addEventListener("resize", resize);
      window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      });
      init();
      draw();

      function goForgiven() {
        playSfx('aud-yeah');
        setTimeout(() => playBg('aud-einaudi'), 600);
        // figure out which page we're coming from
        const from = ['page1','page2','page4','final-msg'].find(id => {
          const el = document.getElementById(id);
          return el && (el.style.display === 'flex' || el.style.display === 'block' || el.classList.contains('active'));
        }) || 'page1';
        navigateTo(from, 'page3');
        document.getElementById("final-msg").classList.remove("active");
        document.getElementById("shatter-overlay").classList.remove("active");
      }

      function goChaos() {
        playSfx('aud-fart');
        setTimeout(() => playBg('aud-shooting'), 500);
        navigateTo('page1', 'page2');
        const pool = [
          "💀",
          "😭",
          "🗿",
          "🤡",
          "✨",
          "🥺",
          "💔",
          "🙏",
          "😤",
          "🫠",
          "💫",
          "🤧",
          "😩",
          "🫶",
        ];
        for (let i = 0; i < 18; i++) {
          const el = document.createElement("div");
          el.className = "floater";
          el.textContent = pool[Math.floor(Math.random() * pool.length)];
          el.style.left = Math.random() * 100 + "vw";
          el.style.animationDuration = 6 + Math.random() * 10 + "s";
          el.style.animationDelay = -Math.random() * 12 + "s";
          el.style.fontSize = 1.2 + Math.random() * 2 + "rem";
          document.body.appendChild(el);
        }
      }

      function goPage4() {
        navigateTo('page2', 'page4');
        const p4 = document.getElementById("page4");
        const imgDog = document.getElementById("img-dog");
        const imgBrain = document.getElementById("img-brain");
        setTimeout(() => {
          imgDog.classList.add("spin-in");
          imgBrain.classList.add("spin-in");
          setTimeout(() => {
            imgDog.classList.remove("spin-in");
            imgBrain.classList.remove("spin-in");
            imgDog.classList.add("spin-loop");
            imgBrain.classList.add("spin-loop");
          }, 1400);
        }, 200);
        setTimeout(() => {
          p4.style.animation = "screenShake 0.5s ease";
          setTimeout(() => (p4.style.animation = ""), 500);
        }, 1300);
      }

      function explodeOut() {
        playSfx('aud-shatter');
        document.getElementById("btn-getout").style.display = "none";
        document.querySelector(".btn-forgive-p4").style.display = "none";
        const canvas2 = document.getElementById("shard-canvas");
        canvas2.style.display = "block";
        canvas2.width = window.innerWidth;
        canvas2.height = window.innerHeight;
        const ctx2 = canvas2.getContext("2d");
        function drawShards(t) {
          ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
          for (let i = 0; i < 28; i++) {
            const cx = Math.random() * canvas2.width,
              cy = Math.random() * canvas2.height;
            const size = 40 + Math.random() * 120,
              pts = 3 + Math.floor(Math.random() * 3);
            ctx2.beginPath();
            for (let j = 0; j < pts; j++) {
              const angle = (j / pts) * Math.PI * 2 + Math.random() * 0.5;
              const r = size * (0.5 + Math.random() * 0.5);
              const x =
                cx + Math.cos(angle) * r + (Math.random() - 0.5) * t * 60;
              const y = cy + Math.sin(angle) * r + Math.random() * t * 80;
              j === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
            }
            ctx2.closePath();
            const alpha = Math.max(0, 0.6 - t * 0.6);
            ctx2.fillStyle = `rgba(${180 + Math.random() * 75},${180 + Math.random() * 75},${200 + Math.random() * 55},${alpha})`;
            ctx2.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx2.lineWidth = 1.5;
            ctx2.fill();
            ctx2.stroke();
          }
        }
        const overlay = document.getElementById("shatter-overlay");
        overlay.classList.add("active");
        let start2 = null;
        function animShards(ts) {
          if (!start2) start2 = ts;
          const t = Math.min(1, (ts - start2) / 2000);
          drawShards(t);
          if (t < 1) requestAnimationFrame(animShards);
          else {
            canvas2.style.display = "none";
            overlay.classList.remove("active");
          }
        }
        requestAnimationFrame(animShards);
        document.body.style.animation = "screenShake 0.3s ease infinite";
        setTimeout(() => {
          document.body.style.animation = "";
          navigateTo('page4', 'final-msg');
          document.getElementById("final-msg").classList.add("active");
          setTimeout(() => playBg('aud-clair'), 400);
        }, 2200);
      }
