// ご褒美用のスクリプト
const STORAGE_KEY = "gamified-task-app-v1";

let points = 0;
let tasks = [];
let rewards = [];         // 所持中ご褒美
let rewardHistory = [];   // 使用済みご褒美
let templateRewards = []; // テンプレご褒美
let templateTasks = [];   // タスクテンプレも消さないよう保持
let missions = null;      // タスク側で使うミッション状態
let level = 1; // ★追加
let exp = 0;   // ★追加



// ---- 状態の読み込み・保存 ----
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);

    if (typeof data.points === "number") points = data.points;
    if (typeof data.level === "number") level = data.level;
if (typeof data.exp === "number") exp = data.exp;


    if (Array.isArray(data.tasks)) {
      tasks = data.tasks.map(t => {
        let createdAt = t.createdAt;
        if (!createdAt && typeof t.id === "number") {
          createdAt = new Date(t.id).toLocaleDateString("ja-JP");
        }
        return {
          ...t,
          archived: !!t.archived,
          createdAt
        };
      });
    }

    if (Array.isArray(data.rewards)) {
      rewards = data.rewards;
    }

    if (Array.isArray(data.rewardHistory)) {
      rewardHistory = data.rewardHistory;
    }

    if (Array.isArray(data.templateRewards)) {
      templateRewards = data.templateRewards;
    }

    if (Array.isArray(data.templateTasks)) {
      templateTasks = data.templateTasks;
    }

    if (data.missions) {
      missions = data.missions;
    } else {
      missions = null;
    }
  } catch (e) {
    console.error("状態の読み込み失敗:", e);
  }
}

function saveState() {
const data = {
  points,
  level,   // ★追加
  exp,     // ★追加
  tasks,
  rewards,
  rewardHistory,
  templateRewards,
  templateTasks,
  missions
};

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---- DOM 取得 ----
const pointsEl         = document.getElementById("points");
const templateForm     = document.getElementById("template-form");
const templateNameInput = document.getElementById("template-name");
const templateCostInput = document.getElementById("template-cost");
const templateList     = document.getElementById("template-reward-list");
const ownedList        = document.getElementById("owned-reward-list");

// ---- テンプレ一覧（購入＋削除ボタン付き）----
function renderTemplateRewards() {
  templateList.innerHTML = "";

  if (templateRewards.length === 0) {
    const li = document.createElement("li");
    li.textContent = "テンプレご褒美はまだありません。";
    templateList.appendChild(li);
    return;
  }

  templateRewards.forEach(tpl => {
    const li = document.createElement("li");

    const info = document.createElement("span");
    info.textContent = `${tpl.name}（${tpl.cost}pt）`;

    const buyBtn = document.createElement("button");
    buyBtn.textContent = "購入";
    buyBtn.style.marginLeft = "8px";

    // ポイントが足りないと購入できない
    if (points < tpl.cost) {
      buyBtn.disabled = true;
    }

    buyBtn.addEventListener("click", () => {
      if (points < tpl.cost) {
        alert("ポイントが足りません。");
        return;
      }

      const ok = confirm(
        `"${tpl.name}" を ${tpl.cost}pt で購入しますか？`
      );
      if (!ok) return;

      buyRewardFromTemplate(tpl);
    });

    // テンプレ削除ボタン
    const delBtn = document.createElement("button");
    delBtn.textContent = "テンプレ削除";
    delBtn.style.marginLeft = "8px";
    delBtn.addEventListener("click", () => {
      const ok = confirm(`「${tpl.name}」のテンプレを削除しますか？`);
      if (!ok) return;
      templateRewards = templateRewards.filter(t => t.id !== tpl.id);
      saveState();
      renderTemplateRewards();
    });

    li.appendChild(info);
    li.appendChild(buyBtn);
    li.appendChild(delBtn);
    templateList.appendChild(li);
  });
}

// ---- 所持中ご褒美の表示（使用ボタン付き）----
function renderOwnedRewards() {
  ownedList.innerHTML = "";

  if (rewards.length === 0) {
    const li = document.createElement("li");
    li.textContent = "所持しているご褒美はありません。";
    ownedList.appendChild(li);
    return;
  }

  rewards.forEach(reward => {
    const li = document.createElement("li");
    const dateLabel = reward.createdAt ? ` / 購入日: ${reward.createdAt}` : "";
    const info = document.createElement("span");
    info.textContent = `${reward.name}（${reward.cost}pt${dateLabel}）`;

    const btn = document.createElement("button");
    btn.textContent = "使用";
    btn.style.marginLeft = "8px";

    btn.addEventListener("click", () => {
      const ok = confirm(`「${reward.name}」の権利を使用しますか？`);
      if (!ok) return;

      useReward(reward.id);
    });

    li.appendChild(info);
    li.appendChild(btn);
    ownedList.appendChild(li);
  });
}

// ---- テンプレから購入して所持中に追加 ----
function buyRewardFromTemplate(tpl) {
  // ポイント消費
  points -= tpl.cost;
  if (pointsEl) pointsEl.textContent = points;

  const now = new Date();
  const createdAt = now.toLocaleDateString("ja-JP");

  const reward = {
    id: Date.now(),
    name: tpl.name,
    cost: tpl.cost,
    createdAt
  };

  rewards.push(reward);
  saveState();
  renderTemplateRewards(); // ポイントが変わるので購入可否が変わる
  renderOwnedRewards();
}

// ---- ご褒美を使用して rewardHistory に移動 ＋ ミッション更新 ----
function useReward(id) {
  const index = rewards.findIndex(r => r.id === id);
  if (index === -1) return;

  const reward = rewards[index];

  // 所持中から削除
  rewards.splice(index, 1);

  const now = new Date();
  const usedAt = now.toLocaleDateString("ja-JP");

  // 履歴に追加
  rewardHistory.push({
    id: reward.id,
    name: reward.name,
    cost: reward.cost,
    createdAt: reward.createdAt,
    usedAt
  });

  // ミッション側のご褒美使用回数を更新（あれば）
  if (missions && missions.daily && missions.weekly) {
    missions.daily.rewardsUsed += 1;
    missions.weekly.rewardsUsed += 1;
  }

  saveState();
  renderOwnedRewards();

  alert(`「${reward.name}」を実際に楽しんできてください！🎉`);
}

// ---- テンプレ追加フォーム ----
if (templateForm) {
  templateForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = templateNameInput.value.trim();
    const cost = Number(templateCostInput.value);

    if (!name || !cost || cost <= 0) {
      alert("ご褒美名と必要ポイントを正しく入力してね！");
      return;
    }

    const tpl = {
      id: Date.now(),
      name,
      cost
    };

    templateRewards.push(tpl);
    saveState();
    renderTemplateRewards();

    templateNameInput.value = "";
    templateCostInput.value = "";
  });
}

// ---- 初期表示 ----
loadState();
if (pointsEl) pointsEl.textContent = points;
renderTemplateRewards();
renderOwnedRewards();

