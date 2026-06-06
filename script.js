import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

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

const OPENROUTER_API_KEY = "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";
const MODEL = "google/gemma-4-31b-it:free";
const SEND_TO_AI_FILE = "SendToAI.txt";

const SIDEBAR_ITEMS = [
  { label: "What's AI?",                       prompt: "What's AI?"                         },
  { label: "What can AI be used for?",          prompt: "What can AI be used for?"           },
  { label: "Can AI make you dumb?",             prompt: "Can AI make you dumb?", active: true},
  { label: "What are AI hallucinations?",       prompt: "What are AI hallucinations?"        },
  { label: "Why do AI systems have restrictions?", prompt: "Why do AI systems have restrictions?" },
  { label: "AI in School and Homework",         prompt: "AI in School and Homework"          },
  { label: "Does AI know what it is doing?",    prompt: "Does AI know what it is doing?"     },
  { label: "Conclusion", prompt: "Give me a conclusion about AI.", sub: "Conclusion = Fazit", active: true },
];

const chatBox      = document.getElementById("chatBox");
const userInput    = document.getElementById("userInput");
const sendBtn      = document.getElementById("sendBtn");
const sidebar      = document.getElementById("sidebar");
const apiDot       = document.getElementById("apiDot");
const apiLabel     = document.getElementById("apiLabel");
const themeToggle  = document.getElementById("themeToggle");

const THEME_KEY = "testai_theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

applyTheme(localStorage.getItem(THEME_KEY) || "light");

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

async function checkApiStatus() {
  apiDot.className = "api-dot checking";
  apiLabel.textContent = "Checking...";

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + OPENROUTER_API_KEY,
        "HTTP-Referer": window.location.href,
        "X-Title": "TestAI"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }]
      })
    });

    if (res.ok || res.status === 200) {
      apiDot.className = "api-dot online";
      apiLabel.textContent = "Online";
    } else {
      apiDot.className = "api-dot offline";
      apiLabel.textContent = "API is not responding";
    }
  } catch (e) {
    apiDot.className = "api-dot offline";
    apiLabel.textContent = "API is not responding";
  }
}

checkApiStatus();

setInterval(checkApiStatus, 60000);

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
  btn.addEventListener("click", () => {
    userInput.value = item.prompt;
    userInput.focus();
  });
  sidebar.appendChild(btn);
});

function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

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
  label.textContent = "Thinking...";
  row.appendChild(avatar);
  row.appendChild(label);
  chatBox.appendChild(row);
  scrollToBottom();
  return row;
}

function renderAIText(bubble, text) {

  bubble.innerHTML = "";
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (line.trim() === "") {

      const spacer = document.createElement("div");
      spacer.className = "ai-line-spacer";
      bubble.appendChild(spacer);
    } else {
      const p = document.createElement("p");
      p.className = "ai-line";
      p.textContent = line;
      bubble.appendChild(p);
    }
  });
}

function replaceThinkingWithAnswer(thinkingRow, text) {
  const row = document.createElement("div");
  row.className = "message-row ai";
  const avatar = buildLogoAvatar();
  const bubble = document.createElement("div");
  bubble.className = "bubble-ai";
  renderAIText(bubble, text);
  row.appendChild(avatar);
  row.appendChild(bubble);
  chatBox.replaceChild(row, thinkingRow);
  scrollToBottom();
}

function showError(thinkingRow, message) {
  const row = document.createElement("div");
  row.className = "message-row ai";
  const avatar = buildLogoAvatar();
  const bubble = document.createElement("div");
  bubble.className = "bubble-ai";
  bubble.textContent = "⚠️ " + message;
  row.appendChild(avatar);
  row.appendChild(bubble);
  chatBox.replaceChild(row, thinkingRow);
  scrollToBottom();
}

let systemContext = "";

async function loadContext() {
  if (!SEND_TO_AI_FILE) return;
  try {
    const res = await fetch(SEND_TO_AI_FILE);
    if (res.ok) systemContext = await res.text();
    else console.warn("SendToAI.txt can't be loaded.");
  } catch (e) {
    console.warn("SendToAI.txt can't be loaded:", e);
  }
}

async function sendToAI(userMessage) {
  const messages = [];
  if (systemContext) messages.push({ role: "system", content: systemContext.trim() });
  messages.push({ role: "user", content: userMessage });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + OPENROUTER_API_KEY,
      "HTTP-Referer": window.location.href,
      "X-Title": "TestAI"
    },
    body: JSON.stringify({ model: MODEL, messages })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData?.error?.message || "HTTP " + response.status;
    throw new Error(msg);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from the model.");

  apiDot.className = "api-dot online";
  apiLabel.textContent = "Online";

  return text;
}

async function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  userInput.value = "";
  userInput.disabled = true;
  sendBtn.disabled = true;

  appendUserMessage(text);
  const thinkingRow = appendThinking();

  try {
    const answer = await sendToAI(text);
    replaceThinkingWithAnswer(thinkingRow, answer);
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
  pwInput.value = "";
  pwError.textContent = "";
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
    if (adminOverlay.classList.contains("active")) {
      adminOverlay.classList.remove("active");
    } else {
      openPasswordPrompt();
    }
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
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  etaDisplay.textContent = mins > 0
    ? (mins + " min" + (secs > 0 ? " " + secs + " sec" : ""))
    : (secs + " sec");

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
    const elapsed = totalMs - remaining;
    progressBar.style.width = Math.min(100, (elapsed / totalMs) * 100) + "%";
    const remSec  = Math.ceil(remaining / 1000);
    const remMins = Math.floor(remSec / 60);
    const remS    = remSec % 60;
    countdownDisplay.textContent = remMins > 0
      ? remMins + "m " + String(remS).padStart(2, "0") + "s"
      : remS + "s";
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
