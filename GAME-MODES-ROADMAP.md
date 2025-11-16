# 🎮 遊戲模式開發路線圖

## 📋 模式總覽（依開發難度排序）

| 模式 | 難度 | 開發時間 | 技術重點 | 優先級 |
|------|------|---------|---------|--------|
| 1️⃣ 計時競速賽 | ⭐ 簡單 | 1-2天 | 倒數計時、排名系統 | **Phase 1 (立即開始)** |
| 2️⃣ 生存淘汰賽 | ⭐⭐ 中等 | 2-3天 | 生命值、淘汰機制 | **Phase 2** |
| 3️⃣ 團隊對抗賽 | ⭐⭐ 中等 | 3-4天 | 隊伍分組、團隊計分 | **Phase 3** |
| 4️⃣ 寶箱爭奪戰 | ⭐⭐ 中等 | 2-3天 | 隨機生成、特殊道具 | **Phase 4** |
| 5️⃣ 國王模式 | ⭐⭐⭐ 困難 | 4-5天 | 陣營分配、特殊能力 | **Phase 5** |
| 6️⃣ 追逐模式 | ⭐⭐⭐ 困難 | 4-5天 | AI幽靈、能量豆變身 | **Phase 6** |
| 7️⃣ 領地爭奪戰 | ⭐⭐⭐ 困難 | 5-6天 | 區域控制、持續計分 | **Phase 7（選做）** |
| 8️⃣ 自訂模式 | ⭐⭐⭐⭐ 很難 | 7-10天 | 參數配置、規則引擎 | **Phase 8（選做）** |

---

## 1️⃣ 模式一：計時競速賽（Time Attack）

### 📝 模式說明
**核心概念**：在限定時間內收集最多分數，時間結束後分數最高者獲勝

**遊戲流程**：
```
1. 遊戲開始前 5 秒倒數
2. 正式開始，計時 3 分鐘
3. 剩餘 30 秒時警告（音效+視覺提示）
4. 時間到，遊戲結束
5. 顯示排名與詳細數據
6. 15 秒後返回大廳
```

**勝利條件**：時間結束時分數最高的玩家獲勝

**得分規則**：
- 小豆子：10 分
- 能量豆：50 分
- 碰撞搶分：奪取對手 20% 分數
- 連擊加成：連續吃豆 x1.5 / x2.0 倍率

### 🎯 為什麼先做這個？
✅ **技術最簡單**：只需加計時器和排名系統
✅ **復用現有程式碼**：90% 功能已存在
✅ **容易測試**：規則清晰，容易平衡
✅ **玩家易懂**：直覺的玩法，無需教學

### 🛠️ 技術實作重點

#### 需要新增的功能：
```javascript
1. 遊戲計時器
   - 倒數計時（3分鐘 → 0）
   - 顯示剩餘時間
   - 時間到觸發結束

2. 排名系統
   - 即時排名（右側面板）
   - 排名變化動畫
   - 結算畫面

3. 連擊系統（可選）
   - 追蹤連續吃豆
   - 分數倍率
   - 視覺反饋

4. 音效（可選）
   - 倒數音效
   - 30秒警告音效
   - 遊戲結束音效
```

### 📊 詳細實作步驟（預估 1-2 天）

#### **步驟 1：遊戲計時器（2-3 小時）**
```javascript
// 需要加入的程式碼

// 在遊戲狀態加入時間
gameState = {
    ...existing,
    startTime: Date.now(),
    duration: 180000, // 3分鐘 = 180秒 = 180000毫秒
    endTime: Date.now() + 180000
}

// 計時器顯示
function updateTimer() {
    const now = Date.now();
    const remaining = gameState.endTime - now;

    if (remaining <= 0) {
        endGame();
        return;
    }

    // 顯示剩餘時間
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    document.getElementById('timer').textContent =
        `${minutes}:${secs.toString().padStart(2, '0')}`;

    // 最後30秒警告
    if (remaining <= 30000 && remaining > 29000) {
        showWarning('最後 30 秒！');
        playSound('warning');
    }
}
```

**UI 設計**：
```html
<!-- 遊戲畫面上方加入計時器 -->
<div id="gameTimer" class="timer">
    <span class="timer-label">剩餘時間</span>
    <span class="timer-value" id="timer">3:00</span>
</div>

<style>
.timer {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: #FFD700;
    padding: 15px 30px;
    border-radius: 15px;
    font-size: 2em;
    font-weight: bold;
    z-index: 100;
}

.timer.warning {
    animation: pulse 1s infinite;
    color: #FF4444;
}

@keyframes pulse {
    0%, 100% { transform: translateX(-50%) scale(1); }
    50% { transform: translateX(-50%) scale(1.1); }
}
</style>
```

#### **步驟 2：即時排名系統（3-4 小時）**
```javascript
// 排名計算
function updateRankings() {
    const players = Object.entries(gameState.players)
        .map(([id, player]) => ({
            id,
            name: player.name,
            score: player.score || 0,
            color: player.color
        }))
        .sort((a, b) => b.score - a.score); // 依分數降序排列

    // 顯示排名
    displayRankings(players);
}

// 排名顯示
function displayRankings(players) {
    const rankingPanel = document.getElementById('rankingPanel');
    rankingPanel.innerHTML = '';

    players.forEach((player, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

        const div = document.createElement('div');
        div.className = 'ranking-item';
        div.innerHTML = `
            <span class="rank">${medal} #${rank}</span>
            <span class="name" style="color: ${player.color}">${player.name}</span>
            <span class="score">${player.score}</span>
        `;

        // 如果是自己，高亮顯示
        if (player.id === currentPlayerId) {
            div.classList.add('my-rank');
        }

        rankingPanel.appendChild(div);
    });
}
```

**UI 設計**：
```html
<!-- 遊戲畫面右側加入排名面板 -->
<div id="rankingPanel" class="ranking-panel">
    <!-- 動態生成排名 -->
</div>

<style>
.ranking-panel {
    position: absolute;
    top: 100px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    padding: 15px;
    border-radius: 10px;
    min-width: 200px;
    max-height: 400px;
    overflow-y: auto;
}

.ranking-item {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    margin: 5px 0;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    color: white;
    transition: all 0.3s;
}

.ranking-item.my-rank {
    background: rgba(255, 215, 0, 0.3);
    border: 2px solid #FFD700;
}

.rank { font-weight: bold; }
.score { color: #FFD700; }
</style>
```

#### **步驟 3：遊戲結束與結算（3-4 小時）**
```javascript
// 遊戲結束
async function endGame() {
    gameState.status = 'ended';

    // 停止遊戲循環
    cancelAnimationFrame(gameLoopId);

    // 計算最終排名
    const finalRankings = calculateFinalRankings();

    // 更新 Firebase
    await database.ref(`rooms/${currentRoomId}`).update({
        status: 'ended',
        finalRankings: finalRankings,
        endedAt: Date.now()
    });

    // 顯示結算畫面
    showResultScreen(finalRankings);

    // 15秒後返回大廳
    setTimeout(() => {
        returnToLobby();
    }, 15000);
}

// 結算畫面
function showResultScreen(rankings) {
    const resultScreen = document.getElementById('resultScreen');
    resultScreen.classList.add('active');

    const winner = rankings[0];

    // 顯示冠軍
    document.getElementById('winnerName').textContent = winner.name;
    document.getElementById('winnerScore').textContent = winner.score;

    // 顯示詳細排名
    const rankingList = document.getElementById('finalRankingList');
    rankingList.innerHTML = '';

    rankings.forEach((player, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

        const div = document.createElement('div');
        div.className = 'final-ranking-item';
        div.innerHTML = `
            <div class="medal">${medal}</div>
            <div class="player-avatar" style="background: ${player.color}"></div>
            <div class="player-name">${player.name}</div>
            <div class="player-score">${player.score} 分</div>
            <div class="player-stats">
                收集豆子: ${player.dotsCollected || 0} |
                擊殺: ${player.kills || 0}
            </div>
        `;

        if (player.id === currentPlayerId) {
            div.classList.add('my-result');
        }

        rankingList.appendChild(div);
    });

    // 播放勝利/失敗音效
    if (winner.id === currentPlayerId) {
        playSound('victory');
        showConfetti(); // 撒彩帶動畫
    } else {
        playSound('defeat');
    }
}
```

**UI 設計**：
```html
<!-- 結算畫面（遮罩層） -->
<div id="resultScreen" class="result-screen">
    <div class="result-container">
        <h1 class="result-title">🏆 遊戲結束 🏆</h1>

        <div class="winner-section">
            <div class="winner-badge">冠軍</div>
            <div class="winner-info">
                <h2 id="winnerName">玩家名稱</h2>
                <p class="winner-score"><span id="winnerScore">0</span> 分</p>
            </div>
        </div>

        <div class="ranking-section">
            <h3>完整排名</h3>
            <div id="finalRankingList"></div>
        </div>

        <div class="result-actions">
            <button onclick="returnToLobby()">返回大廳</button>
            <button onclick="playAgain()">再玩一局</button>
        </div>

        <p class="countdown">15 秒後自動返回大廳</p>
    </div>
</div>

<style>
.result-screen {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 1000;
    align-items: center;
    justify-content: center;
}

.result-screen.active {
    display: flex;
    animation: fadeIn 0.5s;
}

.result-container {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    padding: 40px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    text-align: center;
}

.result-title {
    color: white;
    font-size: 2.5em;
    margin-bottom: 30px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.winner-section {
    background: white;
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 30px;
}

.winner-badge {
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: white;
    padding: 10px 30px;
    border-radius: 25px;
    display: inline-block;
    font-weight: bold;
    font-size: 1.2em;
    margin-bottom: 15px;
}

.winner-info h2 {
    color: #333;
    font-size: 2em;
    margin: 10px 0;
}

.winner-score {
    color: #FFD700;
    font-size: 2.5em;
    font-weight: bold;
}

.ranking-section {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 20px;
}

.ranking-section h3 {
    color: #333;
    margin-bottom: 15px;
}

.final-ranking-item {
    display: grid;
    grid-template-columns: 60px 50px 1fr 100px;
    gap: 10px;
    align-items: center;
    padding: 15px;
    margin: 10px 0;
    background: #f5f5f5;
    border-radius: 10px;
    transition: all 0.3s;
}

.final-ranking-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.final-ranking-item.my-result {
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: white;
    border: 3px solid #FFD700;
}

.medal {
    font-size: 2em;
}

.player-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

.player-name {
    font-weight: bold;
    text-align: left;
}

.player-score {
    font-size: 1.2em;
    font-weight: bold;
    color: #667eea;
}

.player-stats {
    grid-column: 2 / 5;
    font-size: 0.85em;
    color: #666;
    text-align: left;
    padding-left: 10px;
}

.result-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 20px;
}

.result-actions button {
    flex: 1;
    max-width: 200px;
}

.countdown {
    color: rgba(255, 255, 255, 0.7);
    margin-top: 15px;
    font-size: 0.9em;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
</style>
```

#### **步驟 4：碰撞搶分機制（2-3 小時）**
```javascript
// 檢測玩家碰撞
function checkPlayerCollisions() {
    const players = Object.entries(gameState.players);

    for (let i = 0; i < players.length; i++) {
        const [id1, player1] = players[i];

        // 只檢測自己的碰撞（避免重複計算）
        if (id1 !== currentPlayerId) continue;

        for (let j = 0; j < players.length; j++) {
            if (i === j) continue;

            const [id2, player2] = players[j];

            // 檢測位置相同
            if (player1.x === player2.x && player1.y === player2.y) {
                handleCollision(id1, player1, id2, player2);
            }
        }
    }
}

// 處理碰撞
async function handleCollision(myId, myPlayer, otherId, otherPlayer) {
    // 計算搶奪分數（對方分數的20%）
    const stolenScore = Math.floor(otherPlayer.score * 0.2);

    if (stolenScore > 0) {
        // 更新雙方分數
        const myNewScore = myPlayer.score + stolenScore;
        const otherNewScore = Math.max(0, otherPlayer.score - stolenScore);

        await database.ref(`rooms/${currentRoomId}/players/${myId}`).update({
            score: myNewScore
        });

        await database.ref(`rooms/${currentRoomId}/players/${otherId}`).update({
            score: otherNewScore
        });

        // 視覺反饋
        showScoreSteal(stolenScore, myPlayer.x, myPlayer.y);
        playSound('collision');

        // 螢幕震動效果
        shakeScreen();
    }
}

// 分數飄字動畫
function showScoreSteal(score, x, y) {
    const floatText = document.createElement('div');
    floatText.className = 'float-score';
    floatText.textContent = `+${score}`;
    floatText.style.left = `${x * CELL_SIZE}px`;
    floatText.style.top = `${y * CELL_SIZE}px`;

    document.getElementById('gameCanvas').parentElement.appendChild(floatText);

    setTimeout(() => floatText.remove(), 1000);
}
```

**CSS 動畫**：
```css
.float-score {
    position: absolute;
    color: #FF4444;
    font-size: 1.5em;
    font-weight: bold;
    pointer-events: none;
    animation: floatUp 1s ease-out forwards;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

@keyframes floatUp {
    0% {
        opacity: 1;
        transform: translateY(0);
    }
    100% {
        opacity: 0;
        transform: translateY(-50px);
    }
}

/* 螢幕震動 */
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

.shake {
    animation: shake 0.3s;
}
```

#### **步驟 5：音效系統（選做，1-2 小時）**
```javascript
// 音效管理
const sounds = {
    countdown: new Audio('sounds/countdown.mp3'),
    warning: new Audio('sounds/warning.mp3'),
    gameEnd: new Audio('sounds/game-end.mp3'),
    victory: new Audio('sounds/victory.mp3'),
    defeat: new Audio('sounds/defeat.mp3'),
    collision: new Audio('sounds/collision.mp3'),
    eatDot: new Audio('sounds/eat-dot.mp3'),
    eatPowerDot: new Audio('sounds/eat-power.mp3')
};

function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => console.log('音效播放失敗', e));
    }
}

// 背景音樂
const bgm = new Audio('sounds/game-bgm.mp3');
bgm.loop = true;
bgm.volume = 0.3;

function startBGM() {
    bgm.play().catch(e => console.log('BGM 播放失敗', e));
}

function stopBGM() {
    bgm.pause();
    bgm.currentTime = 0;
}
```

### 📦 完整檢查清單

#### ✅ 必做功能
- [ ] 遊戲計時器（3分鐘倒數）
- [ ] 即時排名面板（右側顯示）
- [ ] 遊戲結束判定（時間到）
- [ ] 結算畫面（顯示最終排名）
- [ ] 碰撞搶分機制（20%分數）
- [ ] 返回大廳功能

#### ⭐ 進階功能（可選）
- [ ] 最後30秒警告
- [ ] 音效系統
- [ ] 分數飄字動畫
- [ ] 排名變化動畫
- [ ] 連擊系統（x1.5 / x2.0）
- [ ] 勝利彩帶動畫

---

## 2️⃣ 模式二：生存淘汰賽（Survival Mode）

### 📝 模式說明
**核心概念**：每位玩家有3條命，被擊敗扣1條命，命數歸零淘汰，最後存活者獲勝

**遊戲流程**：
```
1. 每位玩家開始時有 3 條命
2. 碰撞失敗扣 1 條命
3. 命數歸零立即淘汰
4. 剩餘 1 位玩家時遊戲結束
5. 或時間到（5分鐘），依存活順序排名
```

**勝利條件**：最後存活的玩家獲勝

### 🛠️ 新增技術要點
- 生命值系統
- 淘汰機制（變成觀戰者）
- 碰撞判定（誰贏誰輸？）
- 復活點機制

### 📊 開發步驟
1. 加入生命值顯示（血條）
2. 碰撞勝負判定（高分者獲勝）
3. 淘汰動畫與觀戰模式
4. 最後存活者判定

---

## 3️⃣ 模式三：團隊對抗賽（Team Battle）

### 📝 模式說明
**核心概念**：玩家分成紅隊 vs 藍隊，團隊總分較高者獲勝

**遊戲流程**：
```
1. 自動分隊（或手動選隊）
2. 收集豆子為團隊加分
3. 擊敗對手為團隊加分
4. 3分鐘後計算團隊總分
5. 總分高的隊伍獲勝
```

**勝利條件**：團隊總分較高

### 🛠️ 新增技術要點
- 隊伍分配系統
- 團隊計分
- 隊伍顏色區分
- 團隊聊天（可選）

---

## 4️⃣ 模式四：寶箱爭奪戰（Treasure Hunt）

### 📝 模式說明
**核心概念**：地圖隨機刷新寶箱，開啟寶箱獲得高分，先達到目標分數獲勝

**遊戲流程**：
```
1. 地圖每 30 秒刷新 3 個寶箱
2. 開啟寶箱獲得 200-500 分
3. 先達到 2000 分者獲勝
4. 或 5 分鐘後分數最高者獲勝
```

**勝利條件**：先達到 2000 分或時間到分數最高

### 🛠️ 新增技術要點
- 隨機生成寶箱
- 寶箱動畫
- 目標分數判定
- 即時分數進度條

---

## 5️⃣ 模式五：國王模式（King Mode）

### 📝 模式說明
**核心概念**：1 位國王 vs 9 位刺客，國王存活則勝，國王被殺則刺客勝

**遊戲流程**：
```
1. 隨機選出 1 位國王
2. 國王血量 3 倍，分數獲得 2 倍
3. 其他玩家成為刺客
4. 刺客目標：擊殺國王
5. 國王目標：存活 5 分鐘
```

**勝利條件**：
- 國王存活到時間結束 → 國王勝
- 國王被擊殺 → 刺客勝

### 🛠️ 新增技術要點
- 角色分配（國王/刺客）
- 特殊能力（國王強化）
- 陣營勝利判定
- 追殺提示（刺客看到國王位置）

---

## 6️⃣ 模式六：追逐模式（Chase Mode）

### 📝 模式說明
**核心概念**：經典小精靈玩法，吃能量豆可以追殺幽靈/其他玩家

**遊戲流程**：
```
1. 地圖有 4 個能量豆
2. 吃到能量豆進入「無敵狀態」30 秒
3. 無敵狀態可追殺其他玩家
4. 被追殺的玩家扣分並復活
5. 3 分鐘後分數最高者獲勝
```

**勝利條件**：分數最高

### 🛠️ 新增技術要點
- 能量豆狀態切換
- 追殺/逃跑狀態
- 視覺效果（無敵狀態閃爍）
- 追殺計分

---

## 7️⃣ 模式七：領地爭奪戰（Territory War）

### 📝 模式說明
**核心概念**：地圖分成多個區域，佔領區域可持續得分

**遊戲流程**：
```
1. 地圖劃分 6 個區域
2. 在區域停留 3 秒即佔領
3. 佔領區域每秒 +10 分
4. 其他玩家可搶奪領地
5. 5 分鐘後分數最高者獲勝
```

**勝利條件**：分數最高

### 🛠️ 新增技術要點
- 區域劃分與顯示
- 佔領計時
- 持續計分
- 區域顏色標記

---

## 8️⃣ 模式八：自訂模式（Custom Mode）

### 📝 模式說明
**核心概念**：房主可自訂遊戲規則

**可自訂選項**：
```
- 遊戲時長：1-10 分鐘
- 初始生命值：1-5 條
- 豆子分數：10-100 分
- 移動速度：慢/正常/快
- 技能冷卻：正常/加快/關閉
- 特殊規則：開啟/關閉
```

### 🛠️ 新增技術要點
- 規則配置介面
- 參數驗證
- 規則引擎（依配置調整遊戲）

---

## 🎯 開發優先順序建議

### **Phase 1：必做模式（2週內）**
```
1️⃣ 計時競速賽 ← 立即開始！
   ↓ 完成後
2️⃣ 團隊對抗賽 ← 增加社交性
   ↓ 完成後
3️⃣ 生存淘汰賽 ← 增加刺激性
```

### **Phase 2：進階模式（1個月內）**
```
4️⃣ 寶箱爭奪戰
5️⃣ 追逐模式
6️⃣ 國王模式
```

### **Phase 3：長期目標（3個月內）**
```
7️⃣ 領地爭奪戰
8️⃣ 自訂模式
```

---

## 💡 開發建議

### 策略 1：模組化設計
```javascript
// 每個模式都是獨立模組
const gameModes = {
    timeAttack: {
        name: '計時競速賽',
        init: initTimeAttack,
        update: updateTimeAttack,
        end: endTimeAttack
    },
    survival: {
        name: '生存淘汰賽',
        init: initSurvival,
        update: updateSurvival,
        end: endSurvival
    }
    // ... 其他模式
}

// 啟動遊戲時選擇模式
function startGame(modeId) {
    const mode = gameModes[modeId];
    mode.init();
    // ...
}
```

### 策略 2：復用程式碼
```
核心功能（所有模式共用）：
├─ 玩家移動
├─ 豆子收集
├─ 地圖繪製
└─ Firebase 同步

模式專屬功能：
├─ 勝負判定
├─ 計分規則
├─ 特殊機制
└─ UI 顯示
```

### 策略 3：測試驅動開發
```
每個模式完成後：
1. 自己測試 10 次
2. 找 2-3 位朋友一起測試
3. 記錄 Bug 和改進建議
4. 修正後才開發下一個模式
```

---

## 🎮 下一步行動

**我的建議**：
1. ✅ 立即開始實作「模式一：計時競速賽」
2. ✅ 按照上面的步驟 1-5 逐步完成
3. ✅ 完成後測試、修正
4. ✅ 再開始做「模式二或模式三」

**需要我現在就幫你實作「計時競速賽」的完整程式碼嗎？** 🚀

我可以：
- 📝 寫出完整的 HTML + JavaScript
- 🎨 包含所有 UI 和動畫
- 🔊 加入音效系統（可選）
- ✅ 確保可以直接執行
