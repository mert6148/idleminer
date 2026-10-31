"use strict";

const SAVE_KEY = "idle-miner-mobile-save-v1";
const OFFLINE_LIMIT_SECONDS = 8 * 60 * 60;
const MINES = [
  { name: "Bakır Ocağı", icon: "🪨", income: 1, unlockCost: 0 },
  { name: "Demir Ocağı", icon: "⛏️", income: 8, unlockCost: 500 },
  { name: "Altın Ocağı", icon: "🪙", income: 50, unlockCost: 5000 },
  { name: "Elmas Ocağı", icon: "💎", income: 350, unlockCost: 50000 },
  { name: "Kristal Ocağı", icon: "🔮", income: 2500, unlockCost: 500000 },
  { name: "Uranyum Ocağı", icon: "☢️", income: 18000, unlockCost: 5000000 },
  { name: "Obsidyen Ocağı", icon: "🌋", income: 125000, unlockCost: 50000000 },
  { name: "Kobalt Ocağı", icon: "🔷", income: 900000, unlockCost: 500000000 },
  { name: "Mitril Ocağı", icon: "⚒️", income: 6000000, unlockCost: 5000000000 },
  { name: "Antik Maden", icon: "🏺", income: 40000000, unlockCost: 50000000000 },
];
const currency = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const elements = {
  cash: document.querySelector("#cash"),
  income: document.querySelector("#income"),
  prestige: document.querySelector("#prestige-count"),
  multiplier: document.querySelector("#multiplier"),
  mineCount: document.querySelector("#mine-count"),
  mineList: document.querySelector("#mine-list"),
  cheatLabel: document.querySelector("#cheat-label"),
  cheatSwitch: document.querySelector("#cheat-switch"),
  saveStatus: document.querySelector("#save-status"),
  toast: document.querySelector("#toast"),
};

function newGame() {
  return {
    cash: 0,
    levels: [1, ...Array(MINES.length - 1).fill(0)],
    cheat_mode: true,
    prestige: 0,
    last_saved: Date.now() / 1000,
  };
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return newGame();

  const data = JSON.parse(raw);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Kayıt biçimi geçersiz.");
  }
  const levels = Array.isArray(data.levels) ? data.levels.slice(0, MINES.length) : [1];
  while (levels.length < MINES.length) levels.push(0);
  const safeLevels = levels.map((level) =>
    Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0
  );
  safeLevels[0] = Math.max(1, safeLevels[0]);
  const game = {
    cash: Number.isFinite(data.cash) ? Math.max(0, data.cash) : 0,
    levels: safeLevels,
    cheat_mode: typeof data.cheat_mode === "boolean" ? data.cheat_mode : true,
    prestige: Number.isFinite(data.prestige) ? Math.max(0, Math.floor(data.prestige)) : 0,
    last_saved: Number.isFinite(data.last_saved) ? data.last_saved : Date.now() / 1000,
  };
  const elapsed = Math.min(
    OFFLINE_LIMIT_SECONDS,
    Math.max(0, Date.now() / 1000 - game.last_saved)
  );
  const earnings = productionPerSecond(game) * elapsed;
  game.cash += earnings;
  if (earnings >= 0.01) {
    window.setTimeout(() => showToast(`Çevrimdışıyken ${formatCash(earnings)} kazandın.`), 150);
  }
  return game;
}

function formatCash(amount) {
  return currency.format(amount);
}

function productionPerSecond(game) {
  const base = MINES.reduce((sum, mine, index) => sum + mine.income * game.levels[index], 0);
  return base * (1 + 0.5 * game.prestige) * (game.cheat_mode ? 10 : 1);
}

function saveGame() {
  game.last_saved = Date.now() / 1000;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    elements.saveStatus.textContent = "Otomatik kayıt açık";
    return true;
  } catch (error) {
    elements.saveStatus.textContent = "Kayıt başarısız";
    showToast(`Kayıt yapılamadı: ${error.message}`, true);
    return false;
  }
}

function render() {
  elements.cash.textContent = formatCash(game.cash);
  elements.income.textContent = formatCash(productionPerSecond(game));
  elements.prestige.textContent = String(game.prestige);
  const totalMultiplier = (1 + 0.5 * game.prestige) * (game.cheat_mode ? 10 : 1);
  elements.multiplier.textContent = `${totalMultiplier.toLocaleString("tr-TR")}x`;
  elements.cheatLabel.textContent = game.cheat_mode ? "Açık · 10x kazanç" : "Kapalı";
  elements.cheatSwitch.classList.toggle("on", game.cheat_mode);
  elements.mineCount.textContent = `${game.levels.filter((level) => level > 0).length} / ${MINES.length} AÇIK`;
  renderMines();
}

function renderMines() {
  const nextLockedIndex = game.levels.findIndex((level) => level === 0);
  elements.mineList.replaceChildren();

  MINES.forEach((mine, index) => {
    const level = game.levels[index];
    const card = document.createElement("article");
    card.className = `mine-card${level === 0 ? " locked" : ""}`;

    const icon = document.createElement("span");
    icon.className = "mine-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = mine.icon;

    const info = document.createElement("span");
    info.className = "mine-info";
    const name = document.createElement("strong");
    name.className = "mine-name";
    name.textContent = mine.name;
    const detail = document.createElement("span");
    detail.className = "mine-detail";

    const button = document.createElement("button");
    button.className = "mine-action";
    button.type = "button";

    if (level > 0) {
      const cost = upgradeCost(index);
      detail.textContent = `Seviye ${level} · ${formatCash(mine.income * level)}/sn`;
      button.dataset.action = "upgrade";
      button.dataset.mine = String(index);
      button.textContent = "Geliştir";
      const price = document.createElement("span");
      price.className = "button-cost";
      price.textContent = game.cheat_mode ? "Ücretsiz" : formatCash(cost);
      button.append(price);
      button.disabled = !game.cheat_mode && game.cash < cost;
      button.setAttribute("aria-label", `${mine.name} madenini geliştir, ${game.cheat_mode ? "ücretsiz" : formatCash(cost)}`);
    } else {
      detail.textContent = `Kilitli · Açma bedeli ${formatCash(mine.unlockCost)}`;
      button.dataset.action = "unlock";
      button.textContent = "Kilidi aç";
      button.disabled = index !== nextLockedIndex || (!game.cheat_mode && game.cash < mine.unlockCost);
      button.setAttribute("aria-label", `${mine.name} kilidini aç`);
    }

    info.append(name, detail);
    card.append(icon, info, button);
    elements.mineList.append(card);
  });
}

let toastTimeout;
function showToast(message, isError = false) {
  window.clearTimeout(toastTimeout);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("error", isError);
  elements.toast.classList.add("visible");
  toastTimeout = window.setTimeout(() => elements.toast.classList.remove("visible"), 2600);
}

function upgradeMine(index) {
  const cost = upgradeCost(index);
  if (!game.cheat_mode && game.cash < cost) {
    showToast("Bu geliştirme için yeterli nakdin yok.");
    return;
  }
  if (!game.cheat_mode) game.cash -= cost;
  game.levels[index] += 1;
  showToast(`${MINES[index].name} geliştirildi!`);
  saveGame();
  render();
}

function upgradeCost(index) {
  return 50 * (game.levels[index] + 1) ** 1.6 * (index + 1);
}

function unlockMine() {
  const index = game.levels.findIndex((level) => level === 0);
  if (index < 0) {
    showToast("Bütün madenler açık.");
    return;
  }
  if (!game.cheat_mode && game.cash < MINES[index].unlockCost) {
    showToast("Bu madeni açmak için yeterli nakdin yok.");
    return;
  }
  if (!game.cheat_mode) game.cash -= MINES[index].unlockCost;
  game.levels[index] = 1;
  showToast(`${MINES[index].name} açıldı!`);
  saveGame();
  render();
}

function handleAction(action, button) {
  switch (action) {
    case "upgrade":
      upgradeMine(Number(button.dataset.mine));
      break;
    case "unlock":
      unlockMine();
      break;
    case "toggle-cheat":
      game.cheat_mode = !game.cheat_mode;
      showToast(`Hile modu ${game.cheat_mode ? "açık" : "kapalı"}.`);
      saveGame();
      render();
      break;
    case "bonus":
      if (!game.cheat_mode) {
        showToast("Bonus nakit için önce hile modunu aç.");
        return;
      }
      game.cash += 100_000;
      showToast("100.000 bonus nakit eklendi!");
      saveGame();
      render();
      break;
    case "prestige":
      if (game.cash < 1_000_000) {
        showToast(`Prestij için ${formatCash(1_000_000)} nakit gerekli.`);
        return;
      }
      if (!window.confirm("Prestij yapınca nakdin ve maden seviyelerin sıfırlanır. Devam edilsin mi?")) {
        return;
      }
      game.cash = 0;
      game.levels = [1, ...Array(MINES.length - 1).fill(0)];
      game.prestige += 1;
      showToast(`Prestij tamamlandı! Üretim çarpanın ${(1 + 0.5 * game.prestige).toLocaleString("tr-TR")}x.`);
      saveGame();
      render();
      break;
    case "reset":
      if (!window.confirm("Bu cihazdaki oyun kaydı kalıcı olarak silinsin mi?")) {
        return;
      }
      game = newGame();
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch (error) {
        showToast(`Kayıt silinemedi: ${error.message}`, true);
        return;
      }
      saveGame();
      render();
      showToast("Yeni oyun başladı.");
      break;
    default:
      showToast("Bilinmeyen oyun komutu.", true);
  }
}

let game;
try {
  game = loadGame();
} catch (error) {
  game = newGame();
  elements.saveStatus.textContent = "Kayıt okunamadı";
  showToast(`Kayıt yüklenemedi: ${error.message} Yeni oyun başlatıldı.`, true);
}

let lastTick = Date.now();
render();
saveGame();

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button && !button.disabled) handleAction(button.dataset.action, button);
});

window.setInterval(() => {
  const now = Date.now();
  game.cash += productionPerSecond(game) * ((now - lastTick) / 1000);
  lastTick = now;
  render();
  saveGame();
}, 1000);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    const now = Date.now();
    game.cash += productionPerSecond(game) * ((now - lastTick) / 1000);
    lastTick = now;
    saveGame();
  } else {
    lastTick = Date.now();
    render();
  }
});

window.addEventListener("pagehide", saveGame);
