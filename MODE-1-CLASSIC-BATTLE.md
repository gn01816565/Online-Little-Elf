# 🎮 模式一：經典對戰模式（Classic Battle Mode）

## 📝 模式概述

**核心概念**：經典小精靈玩法的多人對戰版本
- 🗺️ 大型迷宮地圖
- 👻 AI 幽靈敵人（會追殺玩家）
- 💎 能量豆（吃了可以反殺幽靈）
- ⚔️ 玩家互相攻擊搶分
- 🏆 3 分鐘後分數最高者獲勝

---

## 🎯 遊戲機制詳解

### 1️⃣ 地圖設計

#### 大型迷宮
```
地圖尺寸：80 x 60 格（比原本的 50 x 40 大很多）

地圖元素：
├─ 🧱 牆壁（不可通過）
├─ ⚪ 小豆子（10 分，約 400-500 個）
├─ 💎 能量豆（50 分 + 變身能力，4 個固定位置）
├─ 📦 寶箱（隨機出現，100-200 分）
├─ 🚪 傳送門（成對出現，快速移動）
└─ 🌟 復活點（10 個，玩家重生位置）
```

#### 地圖分區
```
將地圖分成 4 個大區域：

🟥 紅區（左上）
├─ 1 個能量豆
├─ 2 個復活點
└─ 初始 2 個幽靈

🟦 藍區（右上）
├─ 1 個能量豆
├─ 2 個復活點
└─ 初始 2 個幽靈

🟨 黃區（左下）
├─ 1 個能量豆
├─ 3 個復活點
└─ 初始 1 個幽靈

🟩 綠區（右下）
├─ 1 個能量豆
├─ 3 個復活點
└─ 初始 1 個幽靈

🟪 中央區域
├─ 開闊空間（高風險高回報）
├─ 最多豆子
└─ 寶箱刷新點
```

### 2️⃣ AI 幽靈系統

#### 幽靈種類（4 種）
```javascript
const ghostTypes = {
    // 紅色幽靈 - 追擊者
    blinky: {
        name: '追擊者',
        color: '#FF0000',
        speed: 0.9,        // 比玩家稍慢
        behavior: 'chase', // 直接追最近的玩家
        vision: 15         // 視野範圍 15 格
    },

    // 粉色幽靈 - 伏擊者
    pinky: {
        name: '伏擊者',
        color: '#FFB8FF',
        speed: 0.8,
        behavior: 'ambush', // 預測玩家位置
        vision: 12
    },

    // 青色幽靈 - 巡邏者
    inky: {
        name: '巡邏者',
        color: '#00FFFF',
        speed: 0.7,
        behavior: 'patrol', // 固定路線巡邏
        vision: 10
    },

    // 橙色幽靈 - 隨機者
    clyde: {
        name: '隨機者',
        color: '#FFB852',
        speed: 0.6,
        behavior: 'random', // 隨機移動
        vision: 8
    }
}
```

#### 幽靈數量與難度
```
遊戲開始：6 個幽靈（每種至少 1 個）

動態難度調整：
├─ 1 分鐘後：+2 個幽靈（總共 8 個）
├─ 2 分鐘後：+2 個幽靈（總共 10 個）
└─ 最後 30 秒：幽靈速度 +20%
```

#### 幽靈 AI 行為
```javascript
// 追擊者 AI（Blinky）
function blinkyAI(ghost) {
    // 找到最近的玩家
    const nearestPlayer = findNearestPlayer(ghost.x, ghost.y);

    if (nearestPlayer && distance(ghost, nearestPlayer) < ghost.vision) {
        // 使用 A* 路徑尋找追擊
        const path = findPath(ghost, nearestPlayer);
        moveAlongPath(ghost, path);
    } else {
        // 隨機遊蕩
        randomMove(ghost);
    }
}

// 伏擊者 AI（Pinky）
function pinkyAI(ghost) {
    const nearestPlayer = findNearestPlayer(ghost.x, ghost.y);

    if (nearestPlayer) {
        // 預測玩家 3 格後的位置
        const predictedPos = predictPlayerPosition(nearestPlayer, 3);

        // 移動到預測位置
        const path = findPath(ghost, predictedPos);
        moveAlongPath(ghost, path);
    } else {
        randomMove(ghost);
    }
}

// 巡邏者 AI（Inky）
function inkyAI(ghost) {
    // 沿著固定路線巡邏
    if (!ghost.patrolPath) {
        ghost.patrolPath = generatePatrolPath(ghost.zone);
        ghost.patrolIndex = 0;
    }

    const target = ghost.patrolPath[ghost.patrolIndex];
    moveTowards(ghost, target);

    // 到達巡邏點後前往下一個
    if (ghost.x === target.x && ghost.y === target.y) {
        ghost.patrolIndex = (ghost.patrolIndex + 1) % ghost.patrolPath.length;
    }
}

// 隨機者 AI（Clyde）
function clydeAI(ghost) {
    const nearestPlayer = findNearestPlayer(ghost.x, ghost.y);
    const dist = distance(ghost, nearestPlayer);

    if (dist < 5) {
        // 太近了，逃跑！
        runAway(ghost, nearestPlayer);
    } else if (dist > 15) {
        // 太遠了，追擊！
        moveTowards(ghost, nearestPlayer);
    } else {
        // 隨機移動
        randomMove(ghost);
    }
}
```

#### 被幽靈抓到的懲罰
```
玩家被幽靈抓到：
├─ 損失 30% 分數
├─ 在復活點重生
├─ 3 秒無敵時間（閃爍效果）
└─ 顯示「被幽靈抓到！-XXX 分」
```

### 3️⃣ 能量豆系統

#### 能量豆效果
```javascript
// 吃到能量豆
function eatPowerPellet(player) {
    player.powerMode = true;
    player.powerEndTime = Date.now() + 15000; // 持續 15 秒
    player.score += 50;

    // 所有幽靈變成逃跑模式
    ghosts.forEach(ghost => {
        ghost.mode = 'frightened';
        ghost.speed *= 0.5; // 速度減半
        ghost.color = '#0000FF'; // 變藍色
    });

    // 顯示特效
    showPowerUpEffect(player);
    playSound('power-up');

    // 15 秒後結束
    setTimeout(() => {
        endPowerMode(player);
    }, 15000);

    // 最後 5 秒警告（幽靈閃爍）
    setTimeout(() => {
        ghosts.forEach(ghost => {
            ghost.mode = 'warning'; // 開始閃爍白色
        });
        playSound('power-ending');
    }, 10000);
}
```

#### 能量豆狀態下
```
玩家能力：
├─ 可以吃掉幽靈（每隻 200 分）
├─ 移動速度 +10%
├─ 全身發光效果
└─ 背景音樂變快

幽靈狀態：
├─ 變成藍色
├─ 逃離玩家
├─ 速度減半
└─ 被吃掉後在巢穴重生（5 秒）

吃掉幽靈的連擊獎勵：
├─ 第 1 隻：200 分
├─ 第 2 隻：400 分
├─ 第 3 隻：800 分
└─ 第 4 隻：1600 分
```

### 4️⃣ 玩家對戰系統（整合攻防機制）

#### 三種狀態
```
🟡 普通狀態（預設）
├─ 金黃色
├─ 正常速度
├─ 碰到其他玩家：分數高者搶 10%
└─ 被幽靈抓到：扣 30% 分數

🗡️ 攻擊狀態（按 Q 鍵）
├─ 紅色 + 火焰特效
├─ 速度 +20%
├─ 持續 5 秒，冷卻 10 秒
├─ 碰到普通玩家：搶 30% 分數
├─ 碰到防禦玩家：被反彈，自己扣 10%
├─ 碰到攻擊玩家：雙方扣 15%
└─ 被幽靈抓到：扣 40% 分數（懲罰更重）

🛡️ 防禦狀態（按 E 鍵）
├─ 藍色 + 護盾特效
├─ 速度 -30%
├─ 持續 5 秒，冷卻 8 秒
├─ 碰到攻擊玩家：反彈，對方扣 10%
├─ 碰到普通/防禦玩家：無事
└─ 被幽靈抓到：只扣 15% 分數（保護效果）

💫 能量豆狀態（吃能量豆）
├─ 彩色發光 + 閃爍
├─ 速度 +10%
├─ 持續 15 秒
├─ 可以吃掉幽靈
├─ 碰到其他玩家：直接搶 50% 分數
└─ 免疫幽靈傷害
```

#### 玩家碰撞矩陣表

| 狀態1 ↓ \ 狀態2 → | 普通 | 攻擊 | 防禦 | 能量豆 |
|-----------------|------|------|------|-------|
| **普通** | 高分+10% | 被搶-30% | 無事 | 被搶-50% |
| **攻擊** | 搶+30% | 互扣-15% | 被反-10% | 被搶-50% |
| **防禦** | 無事 | 反彈+10% | 無事 | 被搶-50% |
| **能量豆** | 搶+50% | 搶+50% | 搶+50% | 無事 |

### 5️⃣ 得分系統

#### 分數來源
```
收集物品：
├─ 小豆子：10 分
├─ 能量豆：50 分
├─ 寶箱：100-200 分（隨機）
├─ 吃掉幽靈：200/400/800/1600 分（連擊）
└─ 傳送門獎勵：+20 分（使用傳送門）

玩家對戰：
├─ 普通碰撞獲勝：+10% 對方分數
├─ 攻擊成功：+30% 對方分數
├─ 防禦反彈：+10% 對方分數
└─ 能量豆碰撞：+50% 對方分數

懲罰：
├─ 被幽靈抓到：-30% 分數（普通）
├─ 被幽靈抓到：-40% 分數（攻擊狀態）
├─ 被幽靈抓到：-15% 分數（防禦狀態）
├─ 被玩家擊敗：-10% ~ -50% 分數
└─ 最低分數：0 分（不會變負數）
```

#### 排名與獎勵
```
即時排名顯示（右側面板）：
#1 🥇 玩家名 - 2500 分
#2 🥈 玩家名 - 2100 分
#3 🥉 玩家名 - 1800 分
...

3 分鐘結束後結算：
第 1 名：+300 經驗值 + 500 金幣
第 2 名：+200 經驗值 + 300 金幣
第 3 名：+150 經驗值 + 200 金幣
第 4-10 名：+100 經驗值 + 100 金幣
```

---

## 🎮 遊戲流程

### 完整流程圖
```
[玩家進入大廳]
    ↓
[房主開始遊戲]
    ↓
[5 秒倒數準備]
    ↓
[玩家隨機分配到 10 個復活點]
    ↓
[3 分鐘遊戲開始]
    ├─ 收集豆子
    ├─ 搶奪能量豆
    ├─ 躲避/吃掉幽靈
    ├─ 與其他玩家戰鬥
    └─ 開寶箱獲得高分
    ↓
[剩餘 1 分鐘] → 幽靈增加 2 個
    ↓
[剩餘 30 秒] → 警告音效 + 幽靈加速
    ↓
[時間結束]
    ↓
[結算畫面（15 秒）]
    ├─ 顯示前三名
    ├─ 詳細數據統計
    ├─ 精彩回放（可選）
    └─ 經驗值 + 金幣獎勵
    ↓
[返回大廳] 或 [再玩一局]
```

### 時間軸
```
00:00 - 遊戲開始
  ├─ 6 個幽靈
  ├─ 4 個能量豆
  └─ 所有豆子都在

01:00 - 第一波強化
  ├─ 新增 2 個幽靈（總共 8 個）
  └─ 已吃掉的能量豆重新刷新

02:00 - 第二波強化
  ├─ 新增 2 個幽靈（總共 10 個）
  ├─ 幽靈視野 +20%
  └─ 能量豆再次刷新

02:30 - 最後衝刺
  ├─ 背景音樂加快
  ├─ 幽靈速度 +20%
  ├─ 警告提示
  └─ 倒數計時顯示

03:00 - 遊戲結束
  └─ 進入結算畫面
```

---

## 🎨 視覺設計

### 1. 大型地圖顯示

#### 視角系統
```javascript
// 跟隨玩家的攝影機視角
const camera = {
    x: player.x,
    y: player.y,
    viewWidth: 25,   // 可見寬度 25 格
    viewHeight: 20,  // 可見高度 20 格
    zoom: 1.0        // 縮放等級
}

// 只繪製可見區域
function drawVisibleArea() {
    const startX = camera.x - camera.viewWidth / 2;
    const startY = camera.y - camera.viewHeight / 2;
    const endX = camera.x + camera.viewWidth / 2;
    const endY = camera.y + camera.viewHeight / 2;

    for (let y = startX; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            if (isInBounds(x, y)) {
                drawCell(x, y);
            }
        }
    }
}

// 平滑跟隨
function updateCamera(player) {
    camera.x += (player.x - camera.x) * 0.1;
    camera.y += (player.y - camera.y) * 0.1;
}
```

#### 小地圖（右上角）
```html
<div class="minimap">
    <canvas id="minimapCanvas" width="200" height="150"></canvas>
</div>

<style>
.minimap {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 200px;
    height: 150px;
    background: rgba(0, 0, 0, 0.8);
    border: 3px solid #FFD700;
    border-radius: 10px;
    padding: 5px;
}

#minimapCanvas {
    width: 100%;
    height: 100%;
}
</style>
```

```javascript
// 小地圖繪製（簡化版）
function drawMinimap() {
    const scale = 200 / MAP_WIDTH;

    // 繪製地圖輪廓
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 200, 150);

    // 繪製玩家（你自己是黃點）
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(myPlayer.x * scale, myPlayer.y * scale, 3, 3);

    // 繪製其他玩家（顏色點）
    otherPlayers.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x * scale, p.y * scale, 2, 2);
    });

    // 繪製幽靈（紅點）
    ghosts.forEach(g => {
        ctx.fillStyle = g.mode === 'frightened' ? '#0000FF' : '#FF0000';
        ctx.fillRect(g.x * scale, g.y * scale, 2, 2);
    });

    // 繪製能量豆（閃爍的大點）
    powerPellets.forEach(p => {
        if (!p.eaten) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(p.x * scale, p.y * scale, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}
```

### 2. HUD 界面設計

```html
<div class="game-hud">
    <!-- 左上：玩家資訊 -->
    <div class="player-info-panel">
        <div class="player-avatar" style="background: ${playerColor}"></div>
        <div class="player-details">
            <div class="player-name">玩家名稱</div>
            <div class="player-score">分數: <span id="myScore">0</span></div>
            <div class="player-rank">排名: #<span id="myRank">1</span></div>
        </div>
    </div>

    <!-- 正上方：倒數計時 -->
    <div class="game-timer">
        <span class="timer-label">剩餘時間</span>
        <span class="timer-value" id="timer">3:00</span>
    </div>

    <!-- 右上：小地圖 -->
    <div class="minimap">...</div>

    <!-- 右側：排行榜 -->
    <div class="ranking-panel">
        <h4>即時排名</h4>
        <div id="rankingList">...</div>
    </div>

    <!-- 左側：幽靈狀態 -->
    <div class="ghost-status">
        <h4>幽靈 (<span id="ghostCount">6</span>)</h4>
        <div class="ghost-indicators">
            <!-- 顯示附近幽靈的方向 -->
        </div>
    </div>

    <!-- 底部：技能按鈕 -->
    <div class="skill-bar">
        <button class="skill-btn attack" id="attackBtn">
            <span class="skill-icon">🗡️</span>
            <span class="skill-name">攻擊 (Q)</span>
            <div class="cooldown-circle"></div>
        </button>

        <button class="skill-btn defense" id="defenseBtn">
            <span class="skill-icon">🛡️</span>
            <span class="skill-name">防禦 (E)</span>
            <div class="cooldown-circle"></div>
        </button>
    </div>

    <!-- 中下：狀態提示 -->
    <div class="status-notifications" id="notifications">
        <!-- 動態顯示各種提示 -->
    </div>
</div>

<style>
.game-hud {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; /* 讓滑鼠穿透 */
    z-index: 100;
}

.game-hud > * {
    pointer-events: auto; /* 只有子元素可點擊 */
}

.player-info-panel {
    position: absolute;
    top: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.8);
    padding: 15px;
    border-radius: 10px;
    display: flex;
    gap: 15px;
    align-items: center;
    min-width: 250px;
}

.player-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 3px solid #FFD700;
}

.player-details {
    color: white;
}

.player-name {
    font-weight: bold;
    font-size: 1.1em;
    color: #FFD700;
}

.player-score {
    font-size: 1.3em;
    margin: 5px 0;
}

.player-rank {
    color: #AAA;
}

.game-timer {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    padding: 15px 40px;
    border-radius: 15px;
    text-align: center;
}

.timer-label {
    color: #AAA;
    font-size: 0.9em;
    display: block;
}

.timer-value {
    color: #FFD700;
    font-size: 2.5em;
    font-weight: bold;
}

.timer-value.warning {
    color: #FF4444;
    animation: pulse-timer 1s infinite;
}

@keyframes pulse-timer {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.ranking-panel {
    position: absolute;
    top: 20px;
    right: 240px; /* 在小地圖左邊 */
    background: rgba(0, 0, 0, 0.8);
    padding: 15px;
    border-radius: 10px;
    min-width: 200px;
    max-height: 400px;
    overflow-y: auto;
    color: white;
}

.ghost-status {
    position: absolute;
    top: 100px;
    left: 20px;
    background: rgba(0, 0, 0, 0.8);
    padding: 15px;
    border-radius: 10px;
    color: white;
}

.ghost-indicators {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 10px;
}

.ghost-indicator {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    position: relative;
}

.ghost-indicator.frightened {
    background: #0000FF;
    animation: ghost-blink 0.5s infinite;
}

@keyframes ghost-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.skill-bar {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
}

.skill-btn {
    width: 100px;
    height: 100px;
    border-radius: 15px;
    border: 4px solid;
    background: rgba(0, 0, 0, 0.7);
    cursor: pointer;
    position: relative;
    transition: all 0.3s;
}

.skill-btn.attack {
    border-color: #FF4444;
}

.skill-btn.defense {
    border-color: #4444FF;
}

.skill-btn:hover:not(.on-cooldown) {
    transform: scale(1.1);
    box-shadow: 0 0 30px currentColor;
}

.skill-btn.active {
    animation: skill-active 0.5s infinite;
}

@keyframes skill-active {
    0%, 100% {
        border-width: 4px;
        box-shadow: 0 0 20px currentColor;
    }
    50% {
        border-width: 6px;
        box-shadow: 0 0 40px currentColor;
    }
}

.skill-icon {
    font-size: 2.5em;
    display: block;
}

.skill-name {
    color: white;
    font-size: 0.9em;
    display: block;
    margin-top: 5px;
}

.cooldown-circle {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 15px;
    background: rgba(0, 0, 0, 0.8);
    display: none;
}

.skill-btn.on-cooldown .cooldown-circle {
    display: block;
}

.status-notifications {
    position: absolute;
    bottom: 180px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
}

.notification {
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 15px 30px;
    border-radius: 10px;
    font-size: 1.2em;
    font-weight: bold;
    animation: notification-appear 0.5s, notification-disappear 0.5s 2.5s;
}

@keyframes notification-appear {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes notification-disappear {
    from {
        opacity: 1;
        transform: translateY(0);
    }
    to {
        opacity: 0;
        transform: translateY(-20px);
    }
}
</style>
```

### 3. 特效動畫

#### 能量豆效果
```javascript
function showPowerUpEffect(player) {
    // 玩家周圍爆發光芒
    const particles = 30;
    for (let i = 0; i < particles; i++) {
        const angle = (i / particles) * Math.PI * 2;
        const speed = 5 + Math.random() * 3;
        createParticle({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#FFD700',
            size: 4,
            life: 40
        });
    }

    // 震動螢幕
    shakeScreen(10);

    // 全螢幕閃光
    flashScreen('#FFD700', 0.3);

    // 顯示提示
    showNotification('能量爆發！', '#FFD700');
}

// 螢幕閃光
function flashScreen(color, duration) {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: ${color};
        pointer-events: none;
        z-index: 9999;
        animation: flash-fade ${duration}s;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), duration * 1000);
}
```

**CSS 動畫**：
```css
@keyframes flash-fade {
    0% { opacity: 0.8; }
    100% { opacity: 0; }
}
```

#### 吃掉幽靈特效
```javascript
function ghostEatenEffect(ghostPos, score) {
    // 分數飛向玩家
    const scoreText = document.createElement('div');
    scoreText.className = 'ghost-score-text';
    scoreText.textContent = `+${score}`;
    scoreText.style.left = `${ghostPos.x * CELL_SIZE}px`;
    scoreText.style.top = `${ghostPos.y * CELL_SIZE}px`;
    document.body.appendChild(scoreText);

    setTimeout(() => scoreText.remove(), 2000);

    // 幽靈消失動畫（眼睛飛回巢穴）
    createGhostEyes(ghostPos);

    // 音效
    playSound('ghost-eaten');

    // 粒子爆炸
    for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * Math.PI * 2;
        createParticle({
            x: ghostPos.x,
            y: ghostPos.y,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            color: '#0000FF',
            size: 3,
            life: 30
        });
    }
}
```

---

## 💻 技術實作重點

### 1. 大地圖效能優化

```javascript
// 使用分塊渲染（Chunking）
const CHUNK_SIZE = 20;

// 只更新可見區域的分塊
function updateVisibleChunks() {
    const chunkX = Math.floor(camera.x / CHUNK_SIZE);
    const chunkY = Math.floor(camera.y / CHUNK_SIZE);

    const visibleChunks = [];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            visibleChunks.push({
                x: chunkX + dx,
                y: chunkY + dy
            });
        }
    }

    return visibleChunks;
}

// 只同步附近玩家的位置（不需要同步整個地圖的所有玩家）
function updateNearbyPlayers() {
    const nearbyPlayers = Object.values(gameState.players).filter(p => {
        const dist = distance(myPlayer, p);
        return dist < 30; // 只同步 30 格內的玩家
    });

    drawPlayers(nearbyPlayers);
}
```

### 2. AI 效能優化

```javascript
// 幽靈 AI 不需要每幀都計算
let aiUpdateCounter = 0;

function gameLoop() {
    // 每 5 幀更新一次 AI（降低計算量）
    aiUpdateCounter++;
    if (aiUpdateCounter >= 5) {
        updateGhostAI();
        aiUpdateCounter = 0;
    }

    // 其他更新...
    updatePlayers();
    updateParticles();
    render();

    requestAnimationFrame(gameLoop);
}

// 只計算視野內幽靈的 AI
function updateGhostAI() {
    const visibleGhosts = ghosts.filter(g => {
        return distance(g, camera) < 35; // 只更新視野附近的幽靈
    });

    visibleGhosts.forEach(ghost => {
        updateSingleGhostAI(ghost);
    });
}
```

### 3. Firebase 數據結構

```javascript
// 房間數據結構
{
    rooms: {
        "ABCD12": {
            code: "ABCD12",
            mode: "classic-battle",
            status: "playing",
            createdAt: 1234567890,
            startTime: 1234567890,
            duration: 180000, // 3 分鐘

            // 地圖狀態
            map: {
                width: 80,
                height: 60,
                dots: {
                    // 只儲存已吃掉的豆子位置（減少數據量）
                    eaten: [
                        {x: 10, y: 15},
                        {x: 11, y: 15},
                        // ...
                    ]
                },
                powerPellets: [
                    {x: 5, y: 5, eaten: false},
                    {x: 75, y: 5, eaten: true},
                    {x: 5, y: 55, eaten: false},
                    {x: 75, y: 55, eaten: false}
                ]
            },

            // 幽靈狀態（只有房主更新）
            ghosts: {
                "ghost_1": {
                    type: "blinky",
                    x: 40,
                    y: 30,
                    mode: "chase" // or "frightened"
                },
                // ... 其他幽靈
            },

            // 玩家狀態
            players: {
                "player_123": {
                    name: "玩家1",
                    color: "#FFD700",
                    x: 10,
                    y: 10,
                    score: 500,
                    mode: "normal", // "normal" | "attack" | "defense" | "power"
                    powerEndTime: 0,
                    alive: true
                },
                // ... 其他玩家
            }
        }
    }
}
```

---

## 📊 開發步驟（預估 5-7 天）

### Day 1: 大型地圖系統
- [ ] 生成 80x60 的大型迷宮
- [ ] 實作攝影機跟隨系統
- [ ] 實作小地圖
- [ ] 測試地圖渲染效能

### Day 2: AI 幽靈系統
- [ ] 實作 4 種幽靈 AI
- [ ] 幽靈追擊與碰撞檢測
- [ ] 被幽靈抓到的懲罰機制
- [ ] 幽靈動態增加系統

### Day 3: 能量豆系統
- [ ] 能量豆效果實作
- [ ] 能量豆狀態切換
- [ ] 吃掉幽靈機制
- [ ] 連擊計分系統

### Day 4: 玩家戰鬥系統
- [ ] 整合攻擊/防禦狀態
- [ ] 玩家碰撞判定
- [ ] 戰鬥特效與動畫
- [ ] 平衡性測試

### Day 5: HUD 與 UI
- [ ] 完整 HUD 界面
- [ ] 即時排名面板
- [ ] 技能冷卻顯示
- [ ] 通知系統

### Day 6: 音效與特效
- [ ] 所有音效實作
- [ ] 粒子特效系統
- [ ] 螢幕震動與閃光
- [ ] 能量豆爆發特效

### Day 7: 測試與優化
- [ ] 10 人同時測試
- [ ] 效能優化
- [ ] Bug 修正
- [ ] 數值平衡調整

---

## 🎯 總結

這個**經典對戰模式**結合了：
✅ 原始小精靈的經典玩法（迷宮 + 幽靈 + 能量豆）
✅ 多人競技要素（10 人搶分）
✅ 戰鬥系統（攻擊/防禦）
✅ 大型地圖探索
✅ 動態難度調整

**優點**：
- 🎮 玩法豐富，策略深度高
- 👥 適合多人遊玩
- 🔄 可重玩性強
- 🎨 視覺效果華麗

**挑戰**：
- 開發時間較長（5-7 天）
- 技術難度中等
- 需要仔細調整平衡性

---

## 💬 下一步？

這個模式是你想要的嗎？我可以：

1. **立即開始實作** 🚀
   - 從 Day 1 開始，逐步完成
   - 提供完整程式碼

2. **先做簡化版** ⚡
   - 先不加 AI 幽靈（3-4 天完成）
   - 之後再加入幽靈系統

3. **調整設計** ✏️
   - 修改某些機制
   - 增減功能

告訴我你的想法！🎮
