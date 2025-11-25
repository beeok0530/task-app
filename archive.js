const STORAGE_KEY = "gamified-task-app-v1";

let tasks = [];
let rewardHistory = [];

// 状態読み込み
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);

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

    if (Array.isArray(data.rewardHistory)) {
      rewardHistory = data.rewardHistory;
    }
  } catch (e) {
    console.error("アーカイブ読み込み失敗:", e);
  }
}

// DOM
const taskArchiveList   = document.getElementById("task-archive-list");
const rewardArchiveList = document.getElementById("reward-archive-list");

// タスクのアーカイブ表示
function renderTaskArchive() {
  taskArchiveList.innerHTML = "";

  const archivedTasks = tasks.filter(t => t.archived);

  if (archivedTasks.length === 0) {
    taskArchiveList.innerHTML = "<li>アーカイブされたタスクはありません。</li>";
    return;
  }

  archivedTasks.forEach(task => {
    const li = document.createElement("li");
    const dateLabel = task.createdAt ? ` / 作成日: ${task.createdAt}` : "";
    const categoryLabel = task.category ? ` / カテゴリ: ${task.category}` : "";
li.textContent = `${task.title}（${task.minutes}分${dateLabel}${categoryLabel}）`;

    taskArchiveList.appendChild(li);
  });
}

// ご褒美のアーカイブ表示
function renderRewardArchive() {
  rewardArchiveList.innerHTML = "";

  if (rewardHistory.length === 0) {
    rewardArchiveList.innerHTML = "<li>使用済みのご褒美はありません。</li>";
    return;
  }

  rewardHistory.forEach(item => {
    const dateGet  = item.createdAt ? ` / 購入日: ${item.createdAt}` : "";
    const dateUse  = item.usedAt ?   ` / 使用日: ${item.usedAt}`   : "";
    const li = document.createElement("li");
    li.textContent = `${item.name}（${item.cost}pt${dateGet}${dateUse}）`;
    rewardArchiveList.appendChild(li);
  });
}

// 初期描画
loadState();
renderTaskArchive();
renderRewardArchive();
