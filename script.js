import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDLVWWpilLsFaTNa7AL_5MmoVTd8D89cZU",
  authDomain: "can-ai-make-us-dumb.firebaseapp.com",
  databaseURL: "https://can-ai-make-us-dumb-default-rtdb.firebaseio.com",
  projectId: "can-ai-make-us-dumb",
  storageBucket: "can-ai-make-us-dumb.firebasestorage.app",
  messagingSenderId: "259318533915",
  appId: "1:259318533915:web:a37555f55b165c2dd9cdbe",
  measurementId: "G-C279C7P7W9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ── Anonymous browser ID (used for flag → review tracking) ────────────
const USER_ID_KEY = "testai_user_id";
function getUserId() {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = "u_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}
const USER_ID = getUserId();

// ── Cloudflare Worker URL ──────────────────────────────────────────────
const WORKER_URL = "https://can-ai-make-dumb.rechts-glamour-0a.workers.dev";

const TEXT_MODEL  = "google/gemma-4-31b-it:free";
const IMAGE_MODEL = "google/gemini-2.5-flash-image-preview";

const SEND_TO_AI_FILE = "SendToAI.txt";

const SIDEBAR_ITEMS = [
  { label: "What's AI?",                        prompt: "What's AI?"                         },
  { label: "What can AI be used for?",           prompt: "What can AI be used for?"           },
  { label: "Can AI make you dumb?",              prompt: "Can AI make you dumb?", active: true},
  { label: "What are AI hallucinations?",        prompt: "What are AI hallucinations?"        },
  { label: "Why do AI systems have restrictions?", prompt: "Why do AI systems have restrictions?" },
  { label: "AI in School and Homework",          prompt: "AI in School and Homework"          },
  { label: "Does AI know what it is doing?",     prompt: "Does AI know what it is doing?"     },
  { label: "Conclusion", prompt: "Give me a conclusion about AI.", sub: "Conclusion = Fazit", active: true },
];

// ── DOM refs ───────────────────────────────────────────────────────────
const chatBox     = document.getElementById("chatBox");
const userInput   = document.getElementById("userInput");
const sendBtn     = document.getElementById("sendBtn");
const sidebar     = document.getElementById("sidebar");
const apiDot      = document.getElementById("apiDot");
const apiLabel    = document.getElementById("apiLabel");
const themeToggle = document.getElementById("themeToggle");
const modeToggle  = document.getElementById("modeToggle");
const modeLabelEl = document.getElementById("modeLabel");

// ════════════════════════════════════════════════════
// THEME
// ════════════════════════════════════════════════════
const THEME_KEY = "testai_theme";
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}
applyTheme(localStorage.getItem(THEME_KEY) || "light");
themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

// ════════════════════════════════════════════════════
// MODE TOGGLE (Text / Image)
// ════════════════════════════════════════════════════
let currentMode = "text"; // "text" | "image"

modeToggle.addEventListener("click", () => {
  currentMode = currentMode === "text" ? "image" : "text";
  updateModeUI();
});

function updateModeUI() {
  if (currentMode === "image") {
    modeToggle.classList.add("image-mode");
    modeLabelEl.textContent = "Image Mode";
    userInput.placeholder = "Describe an image...";
  } else {
    modeToggle.classList.remove("image-mode");
    modeLabelEl.textContent = "Text Mode";
    userInput.placeholder = "Ask me anything you want...";
  }
}

// ════════════════════════════════════════════════════
// API STATUS
// ════════════════════════════════════════════════════
async function checkApiStatus() {
  apiDot.className = "api-dot checking";
  apiLabel.textContent = "Checking...";
  try {
    const res = await fetch(WORKER_URL + "/status", { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}) });
    const data = await res.json();
    if (data.ok) {
      apiDot.className = "api-dot online";
      apiLabel.textContent = "Online";
    } else {
      apiDot.className = "api-dot offline";
      apiLabel.textContent = "API is not responding";
    }
  } catch {
    apiDot.className = "api-dot offline";
    apiLabel.textContent = "API is not responding";
  }
}
checkApiStatus();
setInterval(checkApiStatus, 60000);

// ════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════
SIDEBAR_ITEMS.forEach(item => {
  const btn = document.createElement("button");
  btn.className = "sidebar-btn" + (item.active ? " active" : "");
  btn.textContent = item.label;
  if (item.sub) {
    const sub = document.createElement("span");
    sub.className = "sub-label";
    sub.textContent = item.sub;
    btn.appendChild(sub);
  }
  btn.addEventListener("click", () => { userInput.value = item.prompt; userInput.focus(); });
  sidebar.appendChild(btn);
});

// ════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════
function scrollToBottom() { chatBox.scrollTop = chatBox.scrollHeight; }

function buildThinkingAvatar() {
  const avatar = document.createElement("div");
  avatar.className = "ai-avatar";
  const dots = document.createElement("div");
  dots.className = "ai-avatar-dots";
  for (let i = 0; i < 3; i++) {
    const d = document.createElement("span");
    if (i === 1) d.style.animationDelay = "0.2s";
    if (i === 2) d.style.animationDelay = "0.4s";
    d.style.animation = "blink 1.2s infinite";
    dots.appendChild(d);
  }
  avatar.appendChild(dots);
  return avatar;
}

function buildLogoAvatar() {
  const avatar = document.createElement("div");
  avatar.className = "ai-avatar ai-avatar-logo";
  avatar.innerHTML = '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 2 L23 17 L38 20 L23 23 L20 38 L17 23 L2 20 L17 17 Z" fill="url(#avGrad)"/><defs><linearGradient id="avGrad" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs></svg>';
  return avatar;
}

function appendUserMessage(text) {
  const row = document.createElement("div");
  row.className = "message-row user";
  const bubble = document.createElement("div");
  bubble.className = "bubble-user";
  bubble.textContent = text;
  row.appendChild(bubble);
  chatBox.appendChild(row);
  scrollToBottom();
}

function appendThinking() {
  const row = document.createElement("div");
  row.className = "message-row ai thinking-row";
  const avatar = buildThinkingAvatar();
  const label = document.createElement("span");
  label.className = "thinking-label";
  label.textContent = currentMode === "image" ? "Generating image..." : "Thinking...";
  row.appendChild(avatar);
  row.appendChild(label);
  chatBox.appendChild(row);
  scrollToBottom();
  return row;
}

// ── Feature 1: Markdown bold (**text**) renderer ──
function renderAIText(bubble, text) {
  bubble.innerHTML = "";
  const lines = text.split("\n");
  lines.forEach(line => {
    if (line.trim() === "") {
      const spacer = document.createElement("div");
      spacer.className = "ai-line-spacer";
      bubble.appendChild(spacer);
    } else {
      const p = document.createElement("p");
      p.className = "ai-line";
      // Parse **bold** and *italic*
      p.innerHTML = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g,     "<em>$1</em>")
        .replace(/`(.+?)`/g,       "<code>$1</code>");
      bubble.appendChild(p);
    }
  });
}

// ── Feature 3: Action buttons (Copy + Flag) ──────
function buildActionButtons(userPrompt, aiText) {
  const bar = document.createElement("div");
  bar.className = "action-bar";

  // Copy button
  const copyBtn = document.createElement("button");
  copyBtn.className = "action-btn";
  copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy`;
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(aiText).then(() => {
      copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
      copyBtn.classList.add("copied");
      setTimeout(() => {
        copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy`;
        copyBtn.classList.remove("copied");
      }, 2000);
    });
  });

  // Flag button
  const flagBtn = document.createElement("button");
  flagBtn.className = "action-btn flag-btn";
  flagBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> Flag`;
  flagBtn.addEventListener("click", async () => {
    flagBtn.disabled = true;
    flagBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> Sending...`;
    try {
      // 1) Write report to Firebase (for admin review)
      const reportId = "r_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 8);
      await set(ref(db, "reports/" + reportId), {
        userId: USER_ID,
        userMessage: userPrompt,
        aiResponse: aiText,
        status: "pending",
        seen: false,
        note: "",
        createdAt: Date.now()
      });

      // 2) Notify Discord via Worker
      const res = await fetch(WORKER_URL + "/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: userPrompt, aiResponse: aiText, reportId })
      });
      const data = await res.json();
      if (data.ok) {
        flagBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> Flagged ✓`;
        flagBtn.classList.add("flagged");
      } else {
        flagBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> Flagged ✓`;
        flagBtn.classList.add("flagged");
      }
    } catch {
      flagBtn.innerHTML = `Flag (error)`;
      flagBtn.disabled = false;
    }
  });

  bar.appendChild(copyBtn);
  bar.appendChild(flagBtn);
  return bar;
}

function replaceThinkingWithAnswer(thinkingRow, text, userPrompt, isImage = false) {
  const row = document.createElement("div");
  row.className = "message-row ai";
  const avatar = buildLogoAvatar();
  const wrapper = document.createElement("div");
  wrapper.className = "ai-bubble-wrapper";

  if (isImage) {
    // Feature 2: Image response
    const bubble = document.createElement("div");
    bubble.className = "bubble-ai bubble-ai-image";

    const img = document.createElement("img");
    img.className = "ai-generated-image";
    img.src = text; // text = image URL
    img.alt = "Generated image";
    img.loading = "lazy";
    bubble.appendChild(img);

    // Download button
    const dlBtn = document.createElement("a");
    dlBtn.className = "image-download-btn";
    dlBtn.href = text;
    dlBtn.download = "ai-image.png";
    dlBtn.target = "_blank";
    dlBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download`;
    bubble.appendChild(dlBtn);

    wrapper.appendChild(bubble);
  } else {
    const bubble = document.createElement("div");
    bubble.className = "bubble-ai";
    renderAIText(bubble, text);
    wrapper.appendChild(bubble);
  }

  wrapper.appendChild(buildActionButtons(userPrompt, text));

  row.appendChild(avatar);
  row.appendChild(wrapper);
  chatBox.replaceChild(row, thinkingRow);
  scrollToBottom();
}

function showError(thinkingRow, message) {
  const row = document.createElement("div");
  row.className = "message-row ai";
  const avatar = buildLogoAvatar();
  const wrapper = document.createElement("div");
  wrapper.className = "ai-bubble-wrapper";
  const bubble = document.createElement("div");
  bubble.className = "bubble-ai";
  bubble.textContent = "⚠️ " + message;
  wrapper.appendChild(bubble);
  row.appendChild(avatar);
  row.appendChild(wrapper);
  chatBox.replaceChild(row, thinkingRow);
  scrollToBottom();
}

// ════════════════════════════════════════════════════
// CONTEXT
// ════════════════════════════════════════════════════
let systemContext = "";
async function loadContext() {
  if (!SEND_TO_AI_FILE) return;
  try {
    const res = await fetch(SEND_TO_AI_FILE);
    if (res.ok) systemContext = await res.text();
  } catch {}
}

// ════════════════════════════════════════════════════
// AI CALLS (via Worker)
// ════════════════════════════════════════════════════
async function sendTextToAI(userMessage) {
  const messages = [];
  if (systemContext) messages.push({ role: "system", content: systemContext.trim() });
  messages.push({ role: "user", content: userMessage });

  const res = await fetch(WORKER_URL + "/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model: TEXT_MODEL })
  });

  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from model.");
  return text;
}

async function sendImageToAI(prompt) {
  const res = await fetch(WORKER_URL + "/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model: IMAGE_MODEL })
  });

  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();

  // Debug: log raw response so you can inspect the exact shape in DevTools
  console.log("Image API raw response:", data);

  const msg = data?.choices?.[0]?.message;
  if (!msg) {
    throw new Error(data?.error?.message || "No message in response.");
  }

  // Format 1: OpenRouter "images" array (Gemini/Imagen style)
  if (Array.isArray(msg.images) && msg.images.length > 0) {
    const img = msg.images[0];
    if (typeof img === "string") return img;
    if (img.image_url?.url) return img.image_url.url;
    if (img.url) return img.url;
  }

  // Format 2: content is a string URL or data URI
  if (typeof msg.content === "string" && msg.content.trim() !== "") {
    const c = msg.content.trim();
    if (c.startsWith("http") || c.startsWith("data:image")) return c;
  }

  // Format 3: content is an array of parts containing image_url
  if (Array.isArray(msg.content)) {
    const imgPart = msg.content.find(p => p.type === "image_url" || p.type === "image");
    if (imgPart) {
      if (imgPart.image_url?.url) return imgPart.image_url.url;
      if (imgPart.url) return imgPart.url;
    }
  }

  throw new Error("Unexpected image format from model. Check console for raw response.");
}

// ════════════════════════════════════════════════════
// SEND HANDLER
// ════════════════════════════════════════════════════
async function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  userInput.value = "";
  userInput.disabled = true;
  sendBtn.disabled = true;

  appendUserMessage(text);
  const thinkingRow = appendThinking();

  try {
    if (currentMode === "image") {
      const imageUrl = await sendImageToAI(text);
      replaceThinkingWithAnswer(thinkingRow, imageUrl, text, true);
    } else {
      const answer = await sendTextToAI(text);
      replaceThinkingWithAnswer(thinkingRow, answer, text, false);
    }
    apiDot.className = "api-dot online";
    apiLabel.textContent = "Online";
  } catch (err) {
    apiDot.className = "api-dot offline";
    apiLabel.textContent = "API is not responding";
    showError(thinkingRow, "Error: " + err.message);
  } finally {
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}

sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
});

loadContext();

// ════════════════════════════════════════════════════
// MAINTENANCE SYSTEM
// ════════════════════════════════════════════════════
const MAINTENANCE_KEY = "testai_maintenance";
const maintenanceOverlay = document.getElementById("maintenanceOverlay");
const adminOverlay       = document.getElementById("adminOverlay");
const adminClose         = document.getElementById("adminClose");
const adminStart         = document.getElementById("adminStart");
const adminStop          = document.getElementById("adminStop");
const etaDisplay         = document.getElementById("etaDisplay");
const countdownDisplay   = document.getElementById("countdownDisplay");
const progressBar        = document.getElementById("progressBar");
const customDuration     = document.getElementById("customDuration");
const durBtns            = document.querySelectorAll(".dur-btn");

let maintenanceTimer = null;
let selectedMinutes  = null;

durBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    durBtns.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedMinutes = parseInt(btn.dataset.val, 10);
    customDuration.value = "";
  });
});
customDuration.addEventListener("input", () => {
  durBtns.forEach(b => b.classList.remove("selected"));
  selectedMinutes = null;
});

// ── Admin tab switching ────────────────────────────
document.querySelectorAll(".admin-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const target = tab.dataset.tab;
    document.querySelectorAll(".admin-tab-content").forEach(content => {
      content.style.display = content.dataset.tabContent === target ? "flex" : "none";
    });
  });
});

const PW_HASH = "1eaec6de0931f1f929271e159ebc56a07c280cd46ed19909caf763a364e57497";
const pwOverlay = document.getElementById("pwOverlay");
const pwInput   = document.getElementById("pwInput");
const pwSubmit  = document.getElementById("pwSubmit");
const pwError   = document.getElementById("pwError");

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function openPasswordPrompt() {
  pwInput.value = ""; pwError.textContent = "";
  pwOverlay.classList.add("active");
  setTimeout(() => pwInput.focus(), 80);
}
async function submitPassword() {
  const entered = pwInput.value;
  if (!entered) return;
  const hash = await sha256(entered);
  if (hash === PW_HASH) {
    pwOverlay.classList.remove("active");
    adminOverlay.classList.add("active");
    pwInput.value = "";
  } else {
    pwError.textContent = "Wrong password.";
    pwInput.value = "";
    pwInput.classList.add("pw-shake");
    setTimeout(() => pwInput.classList.remove("pw-shake"), 500);
    pwInput.focus();
  }
}
pwSubmit.addEventListener("click", submitPassword);
pwInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submitPassword(); });
pwOverlay.addEventListener("click", (e) => { if (e.target === pwOverlay) pwOverlay.classList.remove("active"); });

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === "A") {
    e.preventDefault();
    adminOverlay.classList.contains("active")
      ? adminOverlay.classList.remove("active")
      : openPasswordPrompt();
  }
});
adminClose.addEventListener("click", () => adminOverlay.classList.remove("active"));
adminOverlay.addEventListener("click", (e) => { if (e.target === adminOverlay) adminOverlay.classList.remove("active"); });

adminStart.addEventListener("click", async () => {
  const mins = selectedMinutes || parseInt(customDuration.value, 10);
  if (!mins || mins < 1) {
    customDuration.style.borderColor = "#e74c3c";
    setTimeout(() => customDuration.style.borderColor = "", 1200);
    return;
  }
  const endTime = Date.now() + mins * 60 * 1000;
  await set(ref(db, "maintenance"), { enabled: true, endTime });
  adminOverlay.classList.remove("active");
  startMaintenanceUI(endTime);
});
adminStop.addEventListener("click", async () => {
  await set(ref(db, "maintenance"), { enabled: false, endTime: 0 });
  stopMaintenanceUI();
  adminOverlay.classList.remove("active");
});

function startMaintenanceUI(endTime) {
  const totalMs = endTime - Date.now();
  if (totalMs <= 0) { localStorage.removeItem(MAINTENANCE_KEY); return; }
  const totalSec = Math.ceil(totalMs / 1000);
  const mins = Math.floor(totalSec / 60), secs = totalSec % 60;
  etaDisplay.textContent = mins > 0 ? (mins + " min" + (secs > 0 ? " " + secs + " sec" : "")) : (secs + " sec");
  maintenanceOverlay.classList.add("active");
  adminStart.style.display = "none";
  adminStop.style.display  = "block";
  clearInterval(maintenanceTimer);
  function tick() {
    const remaining = endTime - Date.now();
    if (remaining <= 0) {
      progressBar.style.width = "100%";
      clearInterval(maintenanceTimer);
      setTimeout(() => { localStorage.removeItem(MAINTENANCE_KEY); location.reload(); }, 600);
      return;
    }
    progressBar.style.width = Math.min(100, ((totalMs - remaining) / totalMs) * 100) + "%";
    const remSec = Math.ceil(remaining / 1000), remMins = Math.floor(remSec / 60), remS = remSec % 60;
    countdownDisplay.textContent = remMins > 0 ? remMins + "m " + String(remS).padStart(2, "0") + "s" : remS + "s";
  }
  tick();
  maintenanceTimer = setInterval(tick, 1000);
}
function stopMaintenanceUI() {
  clearInterval(maintenanceTimer);
  maintenanceOverlay.classList.remove("active");
  progressBar.style.width = "0%";
  adminStart.style.display = "block";
  adminStop.style.display  = "none";
}
async function checkOnLoad() {
  const snap = await get(ref(db, "maintenance"));
  if (!snap.exists()) return;
  const data = snap.val();
  if (data.enabled) startMaintenanceUI(data.endTime);
}
checkOnLoad();

// ════════════════════════════════════════════════════
// REVIEWED-REPORT OVERLAY (shown to the user who flagged)
// ════════════════════════════════════════════════════
const reviewOverlay   = document.getElementById("reviewOverlay");
const reviewNoteEl    = document.getElementById("reviewNote");
const reviewMsgEl     = document.getElementById("reviewMessage");
const reviewCloseBtn  = document.getElementById("reviewClose");

async function checkForReviewedReports() {
  try {
    const snap = await get(ref(db, "reports"));
    if (!snap.exists()) return;
    const reports = snap.val();

    for (const [id, report] of Object.entries(reports)) {
      if (report.userId === USER_ID && report.status === "reviewed" && !report.seen) {
        // Show overlay
        reviewMsgEl.textContent = report.aiResponse.length > 240
          ? report.aiResponse.substring(0, 240) + "..."
          : report.aiResponse;
        reviewNoteEl.textContent = report.note && report.note.trim() !== ""
          ? report.note
          : "Thanks for helping us improve TestAI.";
        reviewOverlay.classList.add("active");

        // Mark as seen so it won't show again
        await update(ref(db, "reports/" + id), { seen: true });
        break; // only show one at a time
      }
    }
  } catch (e) {
    console.warn("Could not check reports:", e);
  }
}
checkForReviewedReports();

reviewCloseBtn.addEventListener("click", () => {
  reviewOverlay.classList.remove("active");
});

// ════════════════════════════════════════════════════
// ADMIN: REPORTS TAB
// ════════════════════════════════════════════════════
const reportsListEl = document.getElementById("reportsList");

function renderReports(reports) {
  reportsListEl.innerHTML = "";

  const entries = Object.entries(reports || {})
    .filter(([, r]) => r.status === "pending")
    .sort(([, a], [, b]) => b.createdAt - a.createdAt);

  if (entries.length === 0) {
    reportsListEl.innerHTML = `<p class="reports-empty">No pending reports 🎉</p>`;
    return;
  }

  entries.forEach(([id, report]) => {
    const card = document.createElement("div");
    card.className = "report-card";

    const userMsg = document.createElement("p");
    userMsg.className = "report-field";
    userMsg.innerHTML = `<strong>User:</strong> ${escapeHtml(report.userMessage)}`;

    const aiMsg = document.createElement("p");
    aiMsg.className = "report-field";
    aiMsg.innerHTML = `<strong>AI:</strong> ${escapeHtml(report.aiResponse)}`;

    const noteInput = document.createElement("textarea");
    noteInput.className = "report-note-input";
    noteInput.placeholder = "Note for the user (optional)...";

    const acceptBtn = document.createElement("button");
    acceptBtn.className = "report-accept-btn";
    acceptBtn.textContent = "✓ Accept & Notify User";
    acceptBtn.addEventListener("click", async () => {
      acceptBtn.disabled = true;
      acceptBtn.textContent = "Saving...";
      await update(ref(db, "reports/" + id), {
        status: "reviewed",
        note: noteInput.value.trim(),
        reviewedAt: Date.now()
      });
    });

    card.appendChild(userMsg);
    card.appendChild(aiMsg);
    card.appendChild(noteInput);
    card.appendChild(acceptBtn);
    reportsListEl.appendChild(card);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Live-update reports list whenever admin panel is open
onValue(ref(db, "reports"), (snap) => {
  renderReports(snap.val());
});
