import document from "document";
import * as fs from "fs";

const SAVE_FILE = "cookie_clicker_save.json";
let state = { cookies: 0, cps: 0, autoClickerCost: 10 };
let timerId = null;

export function initCookieClickerApp() {
  loadSaveData();

  const countText = document.getElementById("cookie-count-text");
  const cpsText = document.getElementById("cookie-cps-text");
  const buyBtn = document.getElementById("cookie-btn-buy");
  const buyLabel = document.getElementById("cookie-buy-label");
  const cookieImg = document.getElementById("cookie-click-target");

  function updateUI() {
    countText.text = `${Math.floor(state.cookies)} Cookies`;
    cpsText.text = `per sec: ${state.cps}`;
    buyLabel.text = `Buy Auto (+1 CPS): ${state.autoClickerCost} C`;
  }

  cookieImg.onclick = () => {
    state.cookies += 1;
    updateUI();
    saveData();
  };

  buyBtn.onclick = () => {
    if (state.cookies >= state.autoClickerCost) {
      state.cookies -= state.autoClickerCost;
      state.cps += 1;
      state.autoClickerCost = Math.floor(state.autoClickerCost * 1.5);
      updateUI();
      saveData();
    }
  };

  if (!timerId) {
    timerId = setInterval(() => {
      if (state.cps > 0) {
        state.cookies += state.cps;
        updateUI();
        saveData();
      }
    }, 1000);
  }

  updateUI();
}

function saveData() {
  try {
    fs.writeFileSync(SAVE_FILE, state, "json");
  } catch (e) {}
}

function loadSaveData() {
  try {
    if (fs.existsSync(SAVE_FILE)) {
      state = fs.readFileSync(SAVE_FILE, "json");
    }
  } catch (e) {}
}