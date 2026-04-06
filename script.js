document.addEventListener("DOMContentLoaded", () => {

const home = document.getElementById("homePage");
const editor = document.getElementById("editorPage");
const settingsPage = document.getElementById("settingsPage");

const startBtn = document.getElementById("startBtn");
const backBtn = document.getElementById("backBtn");
const settingsBtn = document.getElementById("settingsBtn");
const closeSettings = document.getElementById("closeSettings");
const saveSettings = document.getElementById("saveSettings");

const textarea = document.getElementById("code");
const output = document.getElementById("output");
const runBtn = document.getElementById("runBtn");

const tabContainer = document.getElementById("tabContainer");
const addTabBtn = document.getElementById("addTab");

const themeColor = document.getElementById("themeColor");
const fontSize = document.getElementById("fontSize");
const maxTabsInput = document.getElementById("maxTabs");

/* SETTINGS */
let settings = JSON.parse(localStorage.getItem("slay_settings")) || {
  color: "#00ff88",
  fontSize: 16,
  maxTabs: 5
};

function applySettings() {
  document.body.style.color = settings.color;
  document.body.style.fontSize = settings.fontSize + "px";
}

applySettings();

/* NAV */
startBtn.onclick = () => {
  home.classList.remove("active");
  editor.classList.add("active");
};

backBtn.onclick = () => {
  editor.classList.remove("active");
  home.classList.add("active");
};

settingsBtn.onclick = () => {
  home.classList.remove("active");
  settingsPage.classList.add("active");

  themeColor.value = settings.color;
  fontSize.value = settings.fontSize;
  maxTabsInput.value = settings.maxTabs;
};

closeSettings.onclick = () => {
  settingsPage.classList.remove("active");
  home.classList.add("active");
};

saveSettings.onclick = () => {
  settings.color = themeColor.value;
  settings.fontSize = fontSize.value;
  settings.maxTabs = Number(maxTabsInput.value);

  localStorage.setItem("slay_settings", JSON.stringify(settings));
  applySettings();
};

/* TABS */
let tabs = JSON.parse(localStorage.getItem("slay_tabs")) || [
  { code: "", output: "" }
];

let activeTab = 0;

function saveTabs() {
  localStorage.setItem("slay_tabs", JSON.stringify(tabs));
}

function renderTabs() {
  tabContainer.innerHTML = "";

  tabs.forEach((t, i) => {
    const tab = document.createElement("div");
    tab.className = "tab" + (i === activeTab ? " active" : "");
    tab.textContent = "Tab " + (i + 1);

    tab.onclick = () => {
      tabs[activeTab].code = textarea.value;
      tabs[activeTab].output = output.textContent;

      activeTab = i;

      textarea.value = tabs[i].code;
      output.textContent = tabs[i].output;

      saveTabs();
      renderTabs();
    };

    tabContainer.appendChild(tab);
  });
}

addTabBtn.onclick = () => {
  if (tabs.length >= settings.maxTabs) {
    output.textContent = "Max tabs reached";
    return;
  }

  tabs.push({ code: "", output: "" });
  activeTab = tabs.length - 1;

  textarea.value = "";
  output.textContent = "";

  saveTabs();
  renderTabs();
};

textarea.addEventListener("input", () => {
  tabs[activeTab].code = textarea.value;
  saveTabs();
});

/* RUN */
runBtn.onclick = run;

textarea.addEventListener("keydown", e => {
  if (e.ctrlKey && e.key === "Enter") run();
});

async function run() {
  output.textContent = "";
  const lines = textarea.value.split("\n");
  const vars = {};

  const getVal = v => (!isNaN(v) ? Number(v) : vars[v] ?? 0);

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const p = line.split(" ");
    const cmd = p[0];

    if (cmd === "say") {
      let text = p.slice(1).join(" ");
      text = text.replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? 0);
      output.textContent += text + "\n";
    }

    else if (cmd === "set") vars[p[1]] = getVal(p[2]);
    else if (cmd === "add") output.textContent += getVal(p[1]) + getVal(p[2]) + "\n";
    else if (cmd === "sub") output.textContent += getVal(p[1]) - getVal(p[2]) + "\n";
    else if (cmd === "mul") output.textContent += getVal(p[1]) * getVal(p[2]) + "\n";
    else if (cmd === "div") output.textContent += getVal(p[1]) / getVal(p[2]) + "\n";
    else if (cmd === "wait") await new Promise(r => setTimeout(r, getVal(p[1])));
    else output.textContent += "Unknown: " + cmd + "\n";
  }

  tabs[activeTab].output = output.textContent;
  saveTabs();
}

/* INIT */
textarea.value = tabs[0].code;
output.textContent = tabs[0].output;

renderTabs();

/* FILE SYSTEM (ELECTRON) */
async function saveFile() {
  await window.slay.saveFile(textarea.value);
  alert("Saved .sy file!");
}

async function loadFile() {
  const data = await window.slay.loadFile();
  if (data) {
    textarea.value = data;
    tabs[activeTab].code = data;
    saveTabs();
  }
}

});