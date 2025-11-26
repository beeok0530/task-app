// ==============================
// 定数・グローバル状態
// ==============================
const STORAGE_KEY = "gamified-task-app-v1";

// デイリー目標・報酬
const DAILY_TASK_TARGET = 3;
const DAILY_TASK_REWARD = 10;

const DAILY_MINUTES_TARGET = 60;
const DAILY_MINUTES_REWARD = 15;

const DAILY_REWARD_USE_TARGET = 1;
const DAILY_REWARD_USE_REWARD = 5;

const DAILY_FULL_BONUS_REWARD = 20;

// ウィークリー目標・報酬（デイリーの5倍目標・2倍報酬）
const WEEKLY_TASK_TARGET = 15;        // 3 × 5
const WEEKLY_TASK_REWARD = 20;        // 10 × 2

const WEEKLY_MINUTES_TARGET = 300;    // 60 × 5
const WEEKLY_MINUTES_REWARD = 30;     // 15 × 2

const WEEKLY_REWARD_USE_TARGET = 5;   // 1 × 5
const WEEKLY_REWARD_USE_REWARD = 10;  // 5 × 2

const WEEKLY_FULL_BONUS_REWARD = 50;

// 状態
let points = 0;
const LEVEL_EXP_BASE = 100; // レベルごとの基礎必要経験値
let level = 1;
let exp = 0;
let tasks = [];
let rewards = [];         // 所持中ご褒美
let rewardHistory = [];   // 使用済みご褒美
let templateRewards = []; // ご褒美テンプレ
let templateTasks = [];   // タスクテンプレ ★追加

let missions = {
  daily: {
    date: null,
    tasksDone: 0,
    minutes: 0,
    rewardsUsed: 0,
    taskRewardClaimed: false,
    minutesRewardClaimed: false,
    rewardUseRewardClaimed: false,
    fullBonusClaimed: false
  },
  weekly: {
    weekStart: null,
    tasksDone: 0,
    minutes: 0,
    rewardsUsed: 0,
    taskRewardClaimed: false,
    minutesRewardClaimed: false,
    rewardUseRewardClaimed: false,
    fullBonusClaimed: false
  }
};

// ==============================
// ユーティリティ（日付関係）
// ==============================
function getTodayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getWeekStartKey() {
  const d = new Date();
  const day = d.getDay(); // 0(日)〜6(土)
  const diff = (day + 6) % 7; // 月曜=0になるよう調整
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

function resetDailyIfNeeded() {
  const todayKey = getTodayKey();
  if (missions.daily.date !== todayKey) {
    missions.daily = {
      date: todayKey,
      tasksDone: 0,
      minutes: 0,
      rewardsUsed: 0,
      taskRewardClaimed: false,
      minutesRewardClaimed: false,
      rewardUseRewardClaimed: false,
      fullBonusClaimed: false
    };
  }
}

function resetWeeklyIfNeeded() {
  const weekKey = getWeekStartKey();
  if (missions.weekly.weekStart !== weekKey) {
    missions.weekly = {
      weekStart: weekKey,
      tasksDone: 0,
      minutes: 0,
      rewardsUsed: 0,
      taskRewardClaimed: false,
      minutesRewardClaimed: false,
      rewardUseRewardClaimed: false,
      fullBonusClaimed: false
    };
  }
}

// ==============================
// 状態の保存・読み込み
// ==============================
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
  console.log("状態を保存:", data);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    console.log("保存された状態なし。初期状態。");
    resetDailyIfNeeded();
    resetWeeklyIfNeeded();
    return;
  }
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
    createdAt,
    category: t.category || "" // ★追加
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
  templateTasks = data.templateTasks.map(t => ({
    ...t,
    category: t.category || ""
  }));
}


    if (data.missions && data.missions.daily && data.missions.weekly) {
      missions = data.missions;
    }

    // 日付・週のリセット
    resetDailyIfNeeded();
    resetWeeklyIfNeeded();

    console.log("状態を読み込み:", data);
  } catch (e) {
    console.error("読み込み失敗:", e);
    resetDailyIfNeeded();
    resetWeeklyIfNeeded();
  }
}

// ==============================
// DOM取得
// ==============================
console.log("app.js 読み込まれたよ！");

const pointsEl = document.getElementById("points");
const levelEl  = document.getElementById("level"); // ★追加
const expEl    = document.getElementById("exp");   // ★追加

// タスク関係
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskTime = document.getElementById("task-time");
const taskList = document.getElementById("task-list");
const taskCategory = document.getElementById("task-category"); // ★追加


// タスクテンプレ関係 ★追加
const taskTemplateForm = document.getElementById("task-template-form");
const taskTemplateNameInput = document.getElementById("task-template-name");
const taskTemplateTimeInput = document.getElementById("task-template-time");
const taskTemplateList = document.getElementById("task-template-list");
const taskTemplateCategoryInput = document.getElementById("task-template-category"); // ★追加

// ミッション表示用
const dailyMissionList = document.getElementById("daily-mission-list");
const weeklyMissionList = document.getElementById("weekly-mission-list");
const dailyBonusButton = document.getElementById("daily-bonus-button");
const weeklyBonusButton = document.getElementById("weekly-bonus-button");

// 初期読み込み
loadState();
if (pointsEl) pointsEl.textContent = points;
if (levelEl) levelEl.textContent = level; // ★追加
if (expEl) expEl.textContent = exp;       // ★追加

// 初期表示
renderTasks();
renderTaskTemplates();
renderMissions();

function getExpNeededForNextLevel() {
  return LEVEL_EXP_BASE * level;
}

function addExperience(amount) {
  exp += amount;
  let leveledUp = false;

  while (exp >= getExpNeededForNextLevel()) {
    exp -= getExpNeededForNextLevel();
    level += 1;
    leveledUp = true;
  }

  if (expEl) expEl.textContent = exp;
  if (levelEl) levelEl.textContent = level;

  if (leveledUp) {
    alert(`レベル ${level} に上がった！🎉`);
  }
}

function addPointsAndExp(amount) {
  points += amount;
  if (pointsEl) pointsEl.textContent = points;
  addExperience(amount);
  saveState();
}

// ==============================
// ポイント計算（タスク）
// ==============================
function addPointsForTask(minutes) {
  const BASE_RATE = 1;
  const MAX_PER_TASK = 100;
  const base = minutes * BASE_RATE;
  const gained = Math.min(base, MAX_PER_TASK);

  addPointsAndExp(gained); // ★ここでポイント＆経験値をまとめて付与

  alert(`タスク完了！ +${gained}pt 獲得しました 🎉`);
}


// ==============================
// タスクテンプレ関連 ★追加
// ==============================

// テンプレ一覧描画
function renderTaskTemplates() {
  if (!taskTemplateList) return;

  taskTemplateList.innerHTML = "";

  if (!templateTasks || templateTasks.length === 0) {
    const li = document.createElement("li");
    li.textContent = "タスクテンプレはまだありません。";
    taskTemplateList.appendChild(li);
    return;
  }

  templateTasks.forEach(tpl => {
    const li = document.createElement("li");
    const info = document.createElement("span");
   info.textContent = `${tpl.title}（${tpl.minutes}分 / ${tpl.category || "カテゴリなし"}）`;

    li.appendChild(info);

    // このテンプレからタスクを追加
    const addBtn = document.createElement("button");
    addBtn.textContent = "このタスクを追加";
    addBtn.style.marginLeft = "8px";
    addBtn.addEventListener("click", () => {
      addTaskFromTemplate(tpl);
    });
    li.appendChild(addBtn);

    // テンプレ削除
    const delBtn = document.createElement("button");
    delBtn.textContent = "テンプレ削除";
    delBtn.style.marginLeft = "8px";
    delBtn.addEventListener("click", () => {
      const ok = confirm(`「${tpl.title}」のテンプレを削除しますか？`);
      if (!ok) return;
      templateTasks = templateTasks.filter(t => t.id !== tpl.id);
      saveState();
      renderTaskTemplates();
    });
    li.appendChild(delBtn);

    taskTemplateList.appendChild(li);
  });
}

// テンプレ追加フォーム
if (taskTemplateForm) {
  taskTemplateForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = taskTemplateNameInput.value.trim();
    const minutes = Number(taskTemplateTimeInput.value);
    const category = taskTemplateCategoryInput.value.trim(); // ★追加

    if (!title || !minutes || minutes <= 0) {
      alert("タスク名と時間(分)を正しく入力してね！");
      return;
    }

    const tpl = {
      id: Date.now(),
      title,
      minutes,
      category // ★追加
    };

    templateTasks.push(tpl);
    saveState();
    renderTaskTemplates();

    taskTemplateNameInput.value = "";
    taskTemplateTimeInput.value = "";
    taskTemplateCategoryInput.value = ""; // ★追加
  });
}


// テンプレからタスクを生成
function addTaskFromTemplate(tpl) {
  const now = new Date();
  const createdAt = now.toLocaleDateString("ja-JP");

const task = {
  id: Date.now(),
  title: tpl.title,
  minutes: tpl.minutes,
  category: tpl.category || "", // ★追加
  done: false,
  archived: false,
  createdAt
};


  tasks.push(task);
  saveState();
  renderTasks();
  renderMissions();
}

// ==============================
// タスク関連（通常追加・完了・アーカイブ）
// ==============================

// 通常のタスク追加フォーム
if (taskForm) {
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = taskInput.value.trim();
    const minutes = Number(taskTime.value);
    const category = taskCategory.value.trim(); // ★追加

    if (!title || !minutes) {
      alert("タスク名と時間を入れてね！");
      return;
    }

    const now = new Date();
    const createdAt = now.toLocaleDateString("ja-JP");

    const task = {
      id: Date.now(),
      title,
      minutes,
      category, // ★追加
      done: false,
      archived: false,
      createdAt
    };

    tasks.push(task);
    saveState();
    renderTasks();
    renderMissions();

    taskInput.value = "";
    taskTime.value = "";
    taskCategory.value = ""; // ★追加
  });
}


// タスク一覧描画（未アーカイブだけ）
function renderTasks() {
  if (!taskList) return;

  taskList.innerHTML = "";

  const activeTasks = tasks.filter(t => !t.archived);

  if (activeTasks.length === 0) {
    const li = document.createElement("li");
    li.textContent = "タスクはまだありません。";
    taskList.appendChild(li);
    return;
  }

  activeTasks.forEach(task => {
    const li = document.createElement("li");
    const dateLabel = task.createdAt ? ` / ${task.createdAt}` : "";
const categoryLabel = task.category ? ` / カテゴリ: ${task.category}` : "";
const statusLabel = task.done ? " ✅ 完了" : "";
const text = `${task.title}（${task.minutes}分${dateLabel}${categoryLabel}）${statusLabel}`;

    const span = document.createElement("span");
    span.textContent = text;

    li.appendChild(span);

    if (!task.done) {
      const doneBtn = document.createElement("button");
      doneBtn.textContent = "完了";
      doneBtn.style.marginLeft = "8px";
      doneBtn.addEventListener("click", () => completeTask(task.id));
      li.appendChild(doneBtn);
    } else {
      li.style.textDecoration = "line-through";

      const archiveBtn = document.createElement("button");
      archiveBtn.textContent = "アーカイブ";
      archiveBtn.style.marginLeft = "8px";
      archiveBtn.addEventListener("click", () => archiveTask(task.id));
      li.appendChild(archiveBtn);
    }

    taskList.appendChild(li);
  });
}

// 完了処理
function completeTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task || task.done) return;

  task.done = true;

  // タスクポイント付与
  addPointsForTask(task.minutes);

  // ミッション進捗更新（タスク数 & 時間）
  updateMissionsOnTaskComplete(task.minutes);

  saveState();
  renderTasks();
  renderMissions();
}

// アーカイブ処理（完了タスクのみ）
function archiveTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  if (!task.done) {
    alert("完了していないタスクはアーカイブできません。");
    return;
  }

  task.archived = true;
  trimTaskArchive(1000); // タスクのアーカイブ上限
  saveState();
  renderTasks();
}

// アーカイブが増えすぎたら古いものから削除
function trimTaskArchive(limit = 1000) {
  const archivedTasks = tasks.filter(t => t.archived);
  if (archivedTasks.length <= limit) return;

  const sorted = archivedTasks.sort((a, b) => a.id - b.id);
  const removeCount = archivedTasks.length - limit;
  const removeIds = new Set(sorted.slice(0, removeCount).map(t => t.id));

  tasks = tasks.filter(t => !removeIds.has(t.id));
  console.log(`タスクアーカイブが多すぎたので ${removeCount} 件削除しました`);
}

// ==============================
// ミッション進捗更新
// ==============================
function updateMissionsOnTaskComplete(minutes) {
  // デイリー
  missions.daily.tasksDone += 1;
  missions.daily.minutes += minutes;

  // ウィークリー
  missions.weekly.tasksDone += 1;
  missions.weekly.minutes += minutes;

  saveState();
}

// ==============================
// ミッション表示
// ==============================
function renderMissions() {
  if (!dailyMissionList || !weeklyMissionList) return;

  dailyMissionList.innerHTML = "";
  weeklyMissionList.innerHTML = "";

  // ---- デイリー ----
  // 1. タスク数
  const d1 = document.createElement("li");
  const d1Cleared = missions.daily.tasksDone >= DAILY_TASK_TARGET;
  const d1Rewarded = missions.daily.taskRewardClaimed;

  d1.textContent = `タスク ${DAILY_TASK_TARGET}件 完了：${missions.daily.tasksDone} / ${DAILY_TASK_TARGET}`;
  if (d1Cleared && !d1Rewarded) {
    const btn = document.createElement("button");
    btn.textContent = `受け取る (+${DAILY_TASK_REWARD}pt)`;
    btn.style.marginLeft = "8px";
    btn.addEventListener("click", () => {
      if (!missions.daily.taskRewardClaimed && missions.daily.tasksDone >= DAILY_TASK_TARGET) {
  addPointsAndExp(DAILY_TASK_REWARD);  // ★変更
  missions.daily.taskRewardClaimed = true;
  renderMissions();
}

    });
    d1.appendChild(btn);
  } else if (d1Rewarded) {
    const span = document.createElement("span");
    span.textContent = " 受取済み";
    span.style.marginLeft = "8px";
    d1.appendChild(span);
  }
  dailyMissionList.appendChild(d1);

  // 2. 時間
  const d2 = document.createElement("li");
  const d2Cleared = missions.daily.minutes >= DAILY_MINUTES_TARGET;
  const d2Rewarded = missions.daily.minutesRewardClaimed;

  d2.textContent = `合計 ${DAILY_MINUTES_TARGET}分 達成：${missions.daily.minutes} / ${DAILY_MINUTES_TARGET}`;
  if (d2Cleared && !d2Rewarded) {
    const btn = document.createElement("button");
    btn.textContent = `受け取る (+${DAILY_MINUTES_REWARD}pt)`;
    btn.style.marginLeft = "8px";
    btn.addEventListener("click", () => {
      if (!missions.daily.minutesRewardClaimed && missions.daily.minutes >= DAILY_MINUTES_TARGET) {
       addPointsAndExp(DAILY_MINUTES_REWARD); // ★ここだけ置き換える！
        missions.daily.minutesRewardClaimed = true;
        renderMissions();
      }
    });
    d2.appendChild(btn);
  } else if (d2Rewarded) {
    const span = document.createElement("span");
    span.textContent = " 受取済み";
    span.style.marginLeft = "8px";
    d2.appendChild(span);
  }
  dailyMissionList.appendChild(d2);

  // 3. ご褒美使用
  const d3 = document.createElement("li");
  const d3Cleared = missions.daily.rewardsUsed >= DAILY_REWARD_USE_TARGET;
  const d3Rewarded = missions.daily.rewardUseRewardClaimed;

  d3.textContent = `ご褒美使用 ${DAILY_REWARD_USE_TARGET}回：${missions.daily.rewardsUsed} / ${DAILY_REWARD_USE_TARGET}`;
  if (d3Cleared && !d3Rewarded) {
    const btn = document.createElement("button");
    btn.textContent = `受け取る (+${DAILY_REWARD_USE_REWARD}pt)`;
    btn.style.marginLeft = "8px";
    btn.addEventListener("click", () => {
      if (!missions.daily.rewardUseRewardClaimed && missions.daily.rewardsUsed >= DAILY_REWARD_USE_TARGET) {
       addPointsAndExp(DAILY_REWARD_USE_REWARD);
        missions.daily.rewardUseRewardClaimed = true;
        renderMissions();
      }
    });
    d3.appendChild(btn);
  } else if (d3Rewarded) {
    const span = document.createElement("span");
    span.textContent = " 受取済み";
    span.style.marginLeft = "8px";
    d3.appendChild(span);
  }
  dailyMissionList.appendChild(d3);

  const allDailyCleared =
    d1Cleared && d2Cleared && d3Cleared &&
    missions.daily.taskRewardClaimed &&
    missions.daily.minutesRewardClaimed &&
    missions.daily.rewardUseRewardClaimed;

  if (dailyBonusButton) {
    dailyBonusButton.disabled = !allDailyCleared || missions.daily.fullBonusClaimed;
    dailyBonusButton.onclick = () => {
      if (!allDailyCleared || missions.daily.fullBonusClaimed) return;
      points += DAILY_FULL_BONUS_REWARD;
      missions.daily.fullBonusClaimed = true;
      if (pointsEl) pointsEl.textContent = points;
      saveState();
      renderMissions();
      alert(`デイリーミッション全クリア！ +${DAILY_FULL_BONUS_REWARD}pt 🎉`);
    };
  }

  // ---- ウィークリー ----
  const w1 = document.createElement("li");
  const w1Cleared = missions.weekly.tasksDone >= WEEKLY_TASK_TARGET;
  const w1Rewarded = missions.weekly.taskRewardClaimed;

  w1.textContent = `タスク ${WEEKLY_TASK_TARGET}件 完了：${missions.weekly.tasksDone} / ${WEEKLY_TASK_TARGET}`;
  if (w1Cleared && !w1Rewarded) {
    const btn = document.createElement("button");
    btn.textContent = `受け取る (+${WEEKLY_TASK_REWARD}pt)`;
    btn.style.marginLeft = "8px";
    btn.addEventListener("click", () => {
      if (!missions.weekly.taskRewardClaimed && missions.weekly.tasksDone >= WEEKLY_TASK_TARGET) {
        addPointsAndExp(WEEKLY_TASK_REWARD);
        missions.weekly.taskRewardClaimed = true;
        renderMissions();
      }
    });
    w1.appendChild(btn);
  } else if (w1Rewarded) {
    const span = document.createElement("span");
    span.textContent = " 受取済み";
    span.style.marginLeft = "8px";
    w1.appendChild(span);
  }
  weeklyMissionList.appendChild(w1);

  const w2 = document.createElement("li");
  const w2Cleared = missions.weekly.minutes >= WEEKLY_MINUTES_TARGET;
  const w2Rewarded = missions.weekly.minutesRewardClaimed;

  w2.textContent = `合計 ${WEEKLY_MINUTES_TARGET}分 達成：${missions.weekly.minutes} / ${WEEKLY_MINUTES_TARGET}`;
  if (w2Cleared && !w2Rewarded) {
    const btn = document.createElement("button");
    btn.textContent = `受け取る (+${WEEKLY_MINUTES_REWARD}pt)`;
    btn.style.marginLeft = "8px";
    btn.addEventListener("click", () => {
      if (!missions.weekly.minutesRewardClaimed && missions.weekly.minutes >= WEEKLY_MINUTES_TARGET) {
        addPointsAndExp(WEEKLY_MINUTES_REWARD);
        missions.weekly.minutesRewardClaimed = true;
        renderMissions();
      }
    });
    w2.appendChild(btn);
  } else if (w2Rewarded) {
    const span = document.createElement("span");
    span.textContent = " 受取済み";
    span.style.marginLeft = "8px";
    w2.appendChild(span);
  }
  weeklyMissionList.appendChild(w2);

  const w3 = document.createElement("li");
  const w3Cleared = missions.weekly.rewardsUsed >= WEEKLY_REWARD_USE_TARGET;
  const w3Rewarded = missions.weekly.rewardUseRewardClaimed;

  w3.textContent = `ご褒美使用 ${WEEKLY_REWARD_USE_TARGET}回：${missions.weekly.rewardsUsed} / ${WEEKLY_REWARD_USE_TARGET}`;
  if (w3Cleared && !w3Rewarded) {
    const btn = document.createElement("button");
    btn.textContent = `受け取る (+${WEEKLY_REWARD_USE_REWARD}pt)`;
    btn.style.marginLeft = "8px";
    btn.addEventListener("click", () => {
      if (!missions.weekly.rewardUseRewardClaimed && missions.weekly.rewardsUsed >= WEEKLY_REWARD_USE_TARGET) {
        addPointsAndExp(WEEKLY_REWARD_USE_REWARD);
        missions.weekly.rewardUseRewardClaimed = true;
        renderMissions();
      }
    });
    w3.appendChild(btn);
  } else if (w3Rewarded) {
    const span = document.createElement("span");
    span.textContent = " 受取済み";
    span.style.marginLeft = "8px";
    w3.appendChild(span);
  }
  weeklyMissionList.appendChild(w3);

  const allWeeklyCleared =
    w1Cleared && w2Cleared && w3Cleared &&
    missions.weekly.taskRewardClaimed &&
    missions.weekly.minutesRewardClaimed &&
    missions.weekly.rewardUseRewardClaimed;

  if (weeklyBonusButton) {
    weeklyBonusButton.disabled = !allWeeklyCleared || missions.weekly.fullBonusClaimed;
    weeklyBonusButton.onclick = () => {
      if (!allWeeklyCleared || missions.weekly.fullBonusClaimed) return;
      points += WEEKLY_FULL_BONUS_REWARD;
      missions.weekly.fullBonusClaimed = true;
      if (pointsEl) pointsEl.textContent = points;
      saveState();
      renderMissions();
      alert(`ウィークリーミッション全クリア！ +${WEEKLY_FULL_BONUS_REWARD}pt 🎉`);
    };
  }
}
