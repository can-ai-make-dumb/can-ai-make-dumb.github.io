const OPENROUTER_API_KEY = "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";

const MODEL = "google/gemma-4-31b-it:free";

const SEND_TO_AI_FILE = "SendToAI.txt";

// Sidebar quick-prompt buttons
const SIDEBAR_ITEMS = [
  { label: "What's AI?",               prompt: "What's AI?"                              },
  { label: "What can AI be used for?", prompt: "What can AI be used for?"                },
  { label: "Can AI make you dumb?",    prompt: "Can AI make you dumb?",    active: true  },
  { label: "What are AI hallucinations?", prompt: "What are AI hallucinations?"          },
  { label: "Why do AI systems have restrictions?", prompt: "Why do AI systems have restrictions?" },
  { label: "AI in School and Homework",prompt: "AI in School and Homework"               },
  { label: "Does AI know what it is doing?", prompt: "Does AI know what it is doing?"   },
  { label: "Conclusion",               prompt: "Give me a conclusion about AI.",
    sub: "Conclusion = Fazit",          active: true                                     },
];

// DOM References
const chatBox   = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn   = document.getElementById("sendBtn");
const sidebar   = document.getElementById("sidebar");

// Sidebar Buttons
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

// Helpers

function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

function buildAvatar() {
  const avatar = document.createElement("div");
  avatar.className = "ai-avatar";
  const dots = document.createElement("div");
  dots.className = "ai-avatar-dots";
  for (let i = 0; i < 3; i++) {
    dots.appendChild(document.createElement("span"));
  }
  avatar.appendChild(dots);
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
  const avatar = buildAvatar();
  avatar.querySelectorAll(".ai-avatar-dots span").forEach(d => {
    d.style.animation = "blink 1.2s infinite";
  });
  const label = document.createElement("span");
  label.className = "thinking-label";
  label.textContent = "Thinking...";
  row.appendChild(avatar);
  row.appendChild(label);
  chatBox.appendChild(row);
  scrollToBottom();
  return row;
}

function replaceThinkingWithAnswer(thinkingRow, text) {
  const row = document.createElement("div");
  row.className = "message-row ai";
  const avatar = buildAvatar();
  const bubble = document.createElement("div");
  bubble.className = "bubble-ai";
  bubble.textContent = text;
  row.appendChild(avatar);
  row.appendChild(bubble);
  chatBox.replaceChild(row, thinkingRow);
  scrollToBottom();
}

function showError(thinkingRow, message) {
  replaceThinkingWithAnswer(thinkingRow, "⚠️ " + message);
}

let systemContext = "";

async function loadContext() {
  if (!SEND_TO_AI_FILE) return;
  try {
    const res = await fetch(SEND_TO_AI_FILE);
    if (res.ok) {
      systemContext = await res.text();
    } else {
      console.warn("SendToAI.txt can't be loaded.");
    }
  } catch (e) {
    console.warn("SendToAI.txt can't be loaded:", e);
  }
}

async function sendToAI(userMessage) {
  const messages = [];

  if (systemContext) {
    messages.push({ role: "system", content: systemContext.trim() });
  }

  messages.push({ role: "user", content: userMessage });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + OPENROUTER_API_KEY,
      "HTTP-Referer": window.location.href,
      "X-Title": "TestAI"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData && errData.error && errData.error.message
      ? errData.error.message
      : "HTTP " + response.status;
    throw new Error(msg);
  }

  const data = await response.json();
  const text = data && data.choices && data.choices[0] &&
               data.choices[0].message && data.choices[0].message.content;
  if (!text) throw new Error("Empty response from the model.");
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
    showError(thinkingRow, "Error: " + err.message);
  } finally {
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}

sendBtn.addEventListener("click", handleSend);

userInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
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
  const buf  = await crypto.subtle.digest("SHA-256",
    new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
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
pwInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitPassword();
});

pwOverlay.addEventListener("click", (e) => {
  if (e.target === pwOverlay) pwOverlay.classList.remove("active");
});

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

adminClose.addEventListener("click", () => {
  adminOverlay.classList.remove("active");
});

adminOverlay.addEventListener("click", (e) => {
  if (e.target === adminOverlay) adminOverlay.classList.remove("active");
});

// start maintenance
adminStart.addEventListener("click", async () => {
  const mins = selectedMinutes || parseInt(customDuration.value, 10);
  if (!mins || mins < 1) {
    customDuration.style.borderColor = "#e74c3c";
    setTimeout(() => customDuration.style.borderColor = "", 1200);
    return;
  }

  const endTime = Date.now() + mins * 60 * 1000;

  await window.fbSet(
    window.fbRef(window.db, "maintenance"),
    {
      enabled: true,
      endTime: endTime
    }
  );

  adminOverlay.classList.remove("active");
  startMaintenanceUI(endTime);
});

// stop maintenance
adminStop.addEventListener("click", async () => {
  await window.fbSet(window.fbRef(window.db, "maintenance"), {
    enabled: false,
    endTime: 0
  });

  stopMaintenanceUI();
  adminOverlay.classList.remove("active");
});

// UI
function startMaintenanceUI(endTime) {
  const totalMs = endTime - Date.now();
  if (totalMs <= 0) {
    localStorage.removeItem(MAINTENANCE_KEY);
    return;
  }

  const totalSec = Math.ceil(totalMs / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;

  // Set ETA label
  etaDisplay.textContent = mins > 0
    ? (mins + " min" + (secs > 0 ? " " + secs + " sec" : ""))
    : (secs + " sec");

  maintenanceOverlay.classList.add("active");
  adminStart.style.display = "none";
  adminStop.style.display  = "block";

  // Animate progress bar and countdown
  clearInterval(maintenanceTimer);

  function tick() {
    const remaining = endTime - Date.now();
    if (remaining <= 0) {
      progressBar.style.width = "100%";
      clearInterval(maintenanceTimer);
      setTimeout(() => {
        localStorage.removeItem(MAINTENANCE_KEY);
        location.reload();
      }, 600);
      return;
    }

    const elapsed = (endTime - Date.now() - totalMs) + totalMs - remaining;
    const pct = Math.min(100, (elapsed / totalMs) * 100);
    progressBar.style.width = pct + "%";

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

// Check for maimtenance
async function checkOnLoad() {
  const snap = await window.fbGet(
  window.fbRef(window.db, "maintenance")
);

  if (!snap.exists()) return;

  const data = snap.val();

  if (data.enabled) {
    startMaintenanceUI(data.endTime);
  }
}

checkOnLoad();
