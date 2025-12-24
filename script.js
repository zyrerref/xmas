const isTikTok = /TikTok/i.test(navigator.userAgent);

if (isTikTok) {
  document.addEventListener("DOMContentLoaded", () => {
    const sub = document.getElementById("subtitle");
    if (sub) {
      sub.textContent = "🎄 TikTok sent you here. Open the gift, then pass it on.";
    }
  });
}

// ====== Helpers ======
const $ = (id) => document.getElementById(id);

const state = {
  name: "",
  musicOn: false,
  audioCtx: null,
  musicTimer: null
};

function safeName(raw) {
  const s = (raw || "").trim();
  if (!s) return "";
  return s.replace(/[^\p{L}\p{N}\s._-]/gu, "").slice(0, 18);
}

function setText(el, text) { if (el) el.textContent = text; }

// ====== Snow ======
const canvas = $("snow");
const ctx = canvas.getContext("2d");
let W, H, flakes;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  flakes = Array.from({ length: Math.min(180, Math.floor(W / 6)) }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 1 + Math.random() * 3.2,
    v: 0.4 + Math.random() * 1.6,
    d: Math.random() * Math.PI * 2
  }));
}
window.addEventListener("resize", resize);
resize();

function drawSnow() {
  ctx.clearRect(0, 0, W, H);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = "white";

  for (const f of flakes) {
    f.d += 0.01;
    f.y += f.v;
    f.x += Math.sin(f.d) * 0.7;

    if (f.y > H + 10) { f.y = -10; f.x = Math.random() * W; }
    if (f.x < -10) f.x = W + 10;
    if (f.x > W + 10) f.x = -10;

    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(drawSnow);
}
drawSnow();

// ====== Confetti ======
function confettiBurst(count = 60) {
  const holder = $("confetti");
  for (let i = 0; i < count; i++) {
    const d = document.createElement("div");
    d.className = "confetti";
    d.style.left = Math.random() * 100 + "vw";
    d.style.top = (-10 - Math.random() * 20) + "px";
    d.style.transform = `rotate(${Math.random() * 360}deg)`;
    d.style.background = `hsl(${Math.floor(Math.random() * 360)}, 90%, 60%)`;
    d.style.animationDuration = (1.4 + Math.random() * 1.4) + "s";
    holder.appendChild(d);
    setTimeout(() => d.remove(), 2200);
  }
}

// ====== WebAudio tiny SFX (optional) ======
function ensureAudio() {
  if (!state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function beep(freq, duration = 0.12, gainVal = 0.03) {
  ensureAudio();
  const ac = state.audioCtx;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.value = gainVal;
  o.connect(g);
  g.connect(ac.destination);
  o.start();
  o.stop(ac.currentTime + duration);
}

function playSound(type) {
  if (!state.musicOn) return;
  if (type === "click") beep(800, 0.08, 0.02);
  if (type === "gift") {
    beep(523, 0.15, 0.04);
    setTimeout(() => beep(659, 0.15, 0.04), 100);
    setTimeout(() => beep(784, 0.2, 0.04), 200);
  }
  if (type === "success") {
    beep(523, 0.1, 0.03);
    setTimeout(() => beep(659, 0.1, 0.03), 80);
    setTimeout(() => beep(784, 0.15, 0.03), 160);
  }
}

// ====== REAL MP3 Music Toggle ======
function toggleMusic() {
  const audio = document.getElementById("bgMusic");
  if (!audio) return;

  state.musicOn = !state.musicOn;
  $("musicBtn").textContent = state.musicOn ? "🔈 Music" : "🔊 Music";

  if (state.musicOn) {
    audio.volume = 0.35;
    audio.play().catch(() => {
      alert("Tap Start first, then tap Music again.");
      state.musicOn = false;
      $("musicBtn").textContent = "🔊 Music";
    });
  } else {
    audio.pause();
  }
}

// ====== Personalized "from" on load ======
const params = new URLSearchParams(window.location.search);
const fromParam = params.get("from");
if (fromParam) {
  const cleanFrom = safeName(fromParam);
  if (cleanFrom) {
    $("subtitle").textContent = `🎁 A Christmas surprise from ${cleanFrom}`;
  }
}

// ====== Share-first (Option 2) ======
function buildShareUrl() {
  const base = `${location.origin}${location.pathname}`;
  const from = state.name ? state.name : "a friend";
  return `${base}?from=${encodeURIComponent(from)}`;
}

async function copyLink() {
  const url = buildShareUrl();
  try {
    await navigator.clipboard.writeText(url);
    alert("Link copied. Paste it on Facebook / Messenger.");
  } catch {
    prompt("Copy this link:", url);
  }
}

function openMessenger() {
  const url = buildShareUrl();
  const messengerDeepLink = `fb-messenger://share/?link=${encodeURIComponent(url)}`;
  const fbSharer = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = messengerDeepLink;
    setTimeout(() => window.open(fbSharer, "_blank", "noopener,noreferrer"), 600);
  } else {
    window.open(fbSharer, "_blank", "noopener,noreferrer");
  }
}

// ====== Progress bar (you used it but didn’t define it) ======
let progress = 0;
function updateProgress(step) {
  progress = Math.max(progress, step); // don’t go backwards
  const fill = $("progressFill");
  const text = $("progressText");

  if (fill) fill.style.width = (progress / 2) * 100 + "%";
  if (text) text.textContent = `${progress}/2 Complete`;

  if (progress >= 2) {
    playSound("success");
    confettiBurst(80);
    const who = state.name ? state.name : "friend";
    setText($("result"), `Nice, ${who}. Now pass the gift — don’t keep it to yourself.`);
    setText($("shareHint"), "Messenger works best on phone. Copy link for FB posts.");
  }
}

// ====== Main flow ======
const messages = [
  "Christmas is not about perfect gifts. It’s about showing up with a real heart.",
  "If you’re reading this, you matter to someone — even if you don’t realize it.",
  "This link is small, but the message is simple: I wish you peace, not just noise."
];

function start() {
  state.name = safeName($("nameInput").value);

  const who = state.name ? state.name : "my friend";
  setText($("greeting"), `Hi, ${who}! 🎄`);
  setText($("message"), `${messages[Math.floor(Math.random() * messages.length)]}

Now do 2 things:
1) Open the gift.
2) Choose your challenge.`);

  $("panel").hidden = false;
  $("giftArea").hidden = false;

  setText($("title"), "🎅 Christmas mode: ON");
  setText($("subtitle"), "Click around. It reacts. Don’t just scroll like a zombie.");
  confettiBurst(30);
}

function sparkle() {
  confettiBurst(90);
  const card = document.querySelector(".card");
  card.animate(
    [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }],
    { duration: 260, iterations: 1 }
  );
}

function openGift() {
  playSound("gift");

  const gift = $("gift");
  gift.classList.add("open");
  confettiBurst(120);

  $("reveal").hidden = false;
  $("progressBar").hidden = false;

  updateProgress(1);

  const who = state.name ? state.name : "friend";
  setText($("result"), `Alright ${who}. Do one challenge, then pass the gift.`);
  setText($("shareHint"), "Complete 1 challenge to unlock the best message.");
}

function handleChoice(btn) {
  playSound("click");
  confettiBurst(60);
  btn.disabled = true;
  btn.style.opacity = "0.75";
  btn.style.borderColor = "rgba(34,197,94,.55)";

  updateProgress(2);
}

function restart() {
  progress = 0;
  $("panel").hidden = true;
  $("giftArea").hidden = true;
  $("reveal").hidden = true;
  $("progressBar").hidden = true;

  const fill = $("progressFill");
  if (fill) fill.style.width = "0%";
  setText($("progressText"), "0/2 Complete");

  $("gift").classList.remove("open");
  $("nameInput").value = "";

  setText($("title"), "Tap the magic.");
  if (!fromParam) {
    setText($("subtitle"), "This is a tiny Christmas surprise for anyone. Enter your name so it feels personal.");
  }
}

// ====== Events ======
$("startBtn").addEventListener("click", start);
$("musicBtn").addEventListener("click", toggleMusic);
$("sparkBtn").addEventListener("click", sparkle);
$("giftBtn").addEventListener("click", openGift);
$("gift").addEventListener("click", openGift);

document.querySelectorAll(".choice").forEach(btn => {
  btn.addEventListener("click", () => handleChoice(btn));
});
document.querySelector(".hero").addEventListener("click", (e) => {
  // Don’t trigger if they clicked the input or buttons
  if (e.target.closest("button") || e.target.closest("input")) return;
  start();
});


$("messengerBtn").addEventListener("click", openMessenger);
$("copyBtn").addEventListener("click", copyLink);
$("restartBtn").addEventListener("click", restart);

$("nameInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") start();
});
