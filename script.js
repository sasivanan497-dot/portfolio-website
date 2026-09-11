/* ============================================================
   Scroll-driven canvas animation + section overlay controller
   ============================================================ */

const FRAME_COUNT = 120;
const FRAME_PATH  = (i) => `frames/frame_${String(i + 1).padStart(3, "0")}.webp`;

const canvas      = document.getElementById("hero-canvas");
const ctx         = canvas.getContext("2d", { alpha: false });
const sequence    = document.getElementById("sequence");
const progressBar = document.getElementById("progress-bar");

/* ── Section visibility map ──────────────────────────────────
   Each entry defines at what scroll progress (0–1) the section
   fades in and fades back out.
   from: fade-in starts | peak: fully visible | drop: fade-out starts | to: fully hidden
   ─────────────────────────────────────────────────────────── */
const SECTIONS = [
  { id: "sec-hero",           from: 0.00, peak: 0.02, drop: 0.09, to: 0.11 },
  { id: "sec-about",          from: 0.12, peak: 0.14, drop: 0.20, to: 0.22 },
  { id: "sec-education",      from: 0.23, peak: 0.25, drop: 0.31, to: 0.33 },
  { id: "sec-skills",         from: 0.34, peak: 0.36, drop: 0.42, to: 0.44 },
  { id: "sec-experience",     from: 0.45, peak: 0.47, drop: 0.53, to: 0.55 },
  { id: "sec-projects",       from: 0.56, peak: 0.58, drop: 0.64, to: 0.66 },
  { id: "sec-certifications", from: 0.67, peak: 0.69, drop: 0.75, to: 0.77 },
  { id: "sec-services",       from: 0.78, peak: 0.80, drop: 0.86, to: 0.88 },
  { id: "sec-contact",        from: 0.89, peak: 0.92, drop: 0.99, to: 1.00 },
];

/* pre-resolve DOM references once */
SECTIONS.forEach(s => { s.el = document.getElementById(s.id); });

/* ── Typing Animation ─────────────────────────────────────── */
const typingRoles = [
  "Software Developer",
  "Java Developer",
  "Backend Developer",
  "Python Developer"
];
let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
  const target = document.getElementById("typing-text");
  if (target) {
    const currentRole = typingRoles[roleIndex];
    if (isDeleting) {
      target.textContent = currentRole.substring(0, charIndex - 1);
      charIndex--;
    } else {
      target.textContent = currentRole.substring(0, charIndex + 1);
      charIndex++;
    }

    let delay = isDeleting ? 35 : 85;

    if (!isDeleting && charIndex === currentRole.length) {
      delay = 1800; // pause at complete word
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % typingRoles.length;
      delay = 350; // pause before starting next word
    }

    setTimeout(typeEffect, delay);
  } else {
    setTimeout(typeEffect, 200);
  }
}

typeEffect();

/* ── Frame state ─────────────────────────────────────────── */
const images = new Array(FRAME_COUNT).fill(null);
let targetFrame    = 0;
let displayFrame   = 0;
let lastDrawnFrame = -1;

/* ── Canvas resize ───────────────────────────────────────── */
function resizeCanvas() {
  canvas.width  = Math.round(window.innerWidth);
  canvas.height = Math.round(window.innerHeight);
  lastDrawnFrame = -1;
  drawFrame(Math.round(displayFrame));
}

/* ── Draw one frame (contain = full portrait, black background) ── */
function drawFrame(index) {
  index = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(index)));
  const img = images[index];

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!img || !img.complete || !img.naturalWidth) return;

  const cw = canvas.width, ch = canvas.height;
  const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
  const w = img.naturalWidth  * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  lastDrawnFrame = index;
}

/* ── Load one frame ──────────────────────────────────────── */
function loadFrame(i) {
  if (images[i]) return;
  const img = new Image();
  images[i] = img;
  img.src = FRAME_PATH(i);
  img.onload  = () => { if (i === 0 || Math.round(displayFrame) === i) drawFrame(i); };
  img.onerror = () => console.error("Failed to load frame:", img.src);
}

/* ── Preload: first 20 eager, rest on idle ───────────────── */
function preloadFrames() {
  for (let i = 0; i < Math.min(20, FRAME_COUNT); i++) loadFrame(i);
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 80));
  idle(() => { for (let i = 20; i < FRAME_COUNT; i++) loadFrame(i); });
}

/* ── Compute opacity for a section at given progress ──────── */
function sectionOpacity(s, p) {
  if (p < s.from || p > s.to) return 0;
  if (p < s.peak) return (p - s.from) / (s.peak - s.from);
  if (p > s.drop) return 1 - (p - s.drop) / (s.to - s.drop);
  return 1;
}

/* ── Update sections visibility ──────────────────────────── */
function updateSections(progress) {
  SECTIONS.forEach(s => {
    if (!s.el) return;
    const op = sectionOpacity(s, progress);
    s.el.style.opacity = op;
    if (op > 0.01) {
      s.el.style.visibility = "visible";
      s.el.classList.add("active");
    } else {
      s.el.style.visibility = "hidden";
      s.el.classList.remove("active");
    }
  });
}

/* ── Map scroll position → frame + sections ──────────────── */
function updateScrollTarget() {
  const rect       = sequence.getBoundingClientRect();
  const scrollable = sequence.offsetHeight - window.innerHeight;
  const travelled  = Math.min(scrollable, Math.max(0, -rect.top));
  const progress   = scrollable > 0 ? travelled / scrollable : 0;

  targetFrame = progress * (FRAME_COUNT - 1);
  progressBar.style.transform = `scaleX(${progress})`;

  updateSections(progress);

  // warm frames near current position
  const center = Math.round(targetFrame);
  for (let off = -4; off <= 8; off++) {
    const i = center + off;
    if (i >= 0 && i < FRAME_COUNT) loadFrame(i);
  }
}

/* ── RAF loop with eased interpolation ───────────────────── */
function animate() {
  displayFrame += (targetFrame - displayFrame) * 0.16;
  if (Math.abs(targetFrame - displayFrame) < 0.01) displayFrame = targetFrame;
  const frame = Math.round(displayFrame);
  if (frame !== lastDrawnFrame) drawFrame(frame);
  requestAnimationFrame(animate);
}

/* ── Init ────────────────────────────────────────────────── */
window.addEventListener("scroll", updateScrollTarget, { passive: true });
window.addEventListener("resize", () => { resizeCanvas(); updateScrollTarget(); });

/* ── Contact Form Submission to Google Apps Script ───────── */
const contactForm = document.getElementById("contact-form");
// Paste your Google Apps Script Web App URL here after deployment:
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzRRWY3cvMpTjvsXDGrmId-Y1lVKHhxBaKOAUzsMYSI0xiiGbkB8yW5bu1Haw0_lPpdKg/exec";

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-submit-form");
    const name = document.getElementById("form-name").value.trim();
    const email = document.getElementById("form-email").value.trim();
    const subject = document.getElementById("form-subject").value.trim();
    const message = document.getElementById("form-message").value.trim();

    if (btn) {
      btn.disabled = true;
      btn.textContent = "SENDING... ⏳";
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("subject", subject);
      formData.append("message", message);
      formData.append("timestamp", new Date().toLocaleString());

      if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          body: formData,
          mode: "no-cors",
        });
      }

      alert(`Thank you, ${name}! Your message has been sent successfully to Sasivanan S.`);
      contactForm.reset();
    } catch (err) {
      console.error("Submission error:", err);
      alert("There was an issue sending your message. Please try again or email directly to sasivanan.s@email.com.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "SEND MESSAGE →";
      }
    }
  });
}

resizeCanvas();
preloadFrames();
updateScrollTarget();
requestAnimationFrame(animate);

