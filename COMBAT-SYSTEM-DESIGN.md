# ⚔️ 戰鬥系統設計文件 - 攻擊與防禦機制

## 🎯 設計理念

讓小精靈遊戲不只是「吃豆子」，而是加入**策略性的戰鬥元素**：
- 🗡️ 攻擊：主動出擊搶奪對手分數
- 🛡️ 防禦：保護自己避免被攻擊
- 🎲 策略：何時攻擊、何時防守的決策

---

## 💥 核心碰撞機制

### 基礎規則：石頭剪刀布系統

```
攻擊狀態（紅色） > 普通狀態（黃色） > 防禦狀態（藍色） > 攻擊狀態（紅色）

🗡️ 攻擊狀態 → 對付普通玩家
   - 碰到普通玩家：搶走 30% 分數
   - 碰到防禦玩家：自己被反彈，扣 10% 分數
   - 碰到攻擊玩家：雙方扣 15% 分數（互相傷害）

🟡 普通狀態 → 靈活移動
   - 碰到攻擊玩家：被搶走 30% 分數
   - 碰到防禦玩家：沒事發生
   - 碰到普通玩家：搶走 10% 分數（看誰分數高）

🛡️ 防禦狀態 → 保護自己
   - 碰到攻擊玩家：反彈攻擊，對方扣 10% 分數
   - 碰到普通玩家：沒事發生
   - 碰到防禦玩家：沒事發生
   - 代價：移動速度 -30%
```

### 對照表

| 碰撞組合 | 攻擊方結果 | 防守方結果 | 視覺效果 |
|---------|----------|----------|---------|
| 攻擊 vs 普通 | +30%分數 | -30%分數 | 紅色閃光 + 擊飛動畫 |
| 攻擊 vs 防禦 | -10%分數 | 0 | 藍色護盾反彈 |
| 攻擊 vs 攻擊 | -15%分數 | -15%分數 | 雙方爆炸效果 |
| 普通 vs 普通 | 分高者 +10% | 分低者 -10% | 小碰撞動畫 |
| 普通 vs 防禦 | 0 | 0 | 彈開 |
| 防禦 vs 防禦 | 0 | 0 | 碰撞彈開 |

---

## 🎮 狀態切換機制

### 三種狀態與切換方式

```javascript
// 玩家狀態
playerState = {
    mode: 'normal',  // 'normal' | 'attack' | 'defense'
    modeDuration: 0, // 狀態持續時間（毫秒）
    cooldown: 0      // 冷卻時間
}

// 狀態配置
const stateConfig = {
    normal: {
        color: '#FFD700',      // 金黃色
        speed: 1.0,            // 正常速度
        canSwitch: true        // 可以切換狀態
    },
    attack: {
        color: '#FF4444',      // 紅色
        speed: 1.2,            // 速度 +20%
        duration: 5000,        // 持續 5 秒
        cooldown: 10000,       // 冷卻 10 秒
        visual: 'flame'        // 火焰特效
    },
    defense: {
        color: '#4444FF',      // 藍色
        speed: 0.7,            // 速度 -30%
        duration: 5000,        // 持續 5 秒
        cooldown: 8000,        // 冷卻 8 秒
        visual: 'shield'       // 護盾特效
    }
}
```

### 操作方式

```
鍵盤控制：
- 移動：方向鍵 / WASD
- 攻擊狀態：按 Q 鍵（持續 5 秒，冷卻 10 秒）
- 防禦狀態：按 E 鍵（持續 5 秒，冷卻 8 秒）
- 快速切回普通：按 空白鍵

手機控制：
- 移動：虛擬搖桿
- 攻擊/防禦：螢幕左右兩側大按鈕
```

---

## 🎨 視覺設計

### 1. 狀態顯示

#### 玩家外觀變化
```javascript
// 普通狀態
{
    body: '#FFD700',        // 金黃色身體
    outline: 'none',        // 無外框
    size: 1.0,              // 正常大小
    effect: 'none'          // 無特效
}

// 攻擊狀態
{
    body: '#FF4444',        // 紅色身體
    outline: '#FF0000',     // 深紅外框
    size: 1.1,              // 稍微變大
    effect: 'flame',        // 火焰粒子環繞
    aura: 'red-glow'        // 紅色光暈
}

// 防禦狀態
{
    body: '#4444FF',        // 藍色身體
    outline: '#0000FF',     // 深藍外框
    size: 1.0,              // 正常大小
    effect: 'shield',       // 六邊形護盾
    aura: 'blue-glow'       // 藍色光暈
}
```

#### Canvas 繪製程式碼
```javascript
function drawPlayer(player) {
    const x = player.x * CELL_SIZE + CELL_SIZE / 2;
    const y = player.y * CELL_SIZE + CELL_SIZE / 2;
    const radius = CELL_SIZE / 2 - 2;

    // 繪製光暈（依狀態）
    if (player.mode === 'attack') {
        drawGlow(x, y, radius * 1.5, 'rgba(255, 68, 68, 0.3)');
    } else if (player.mode === 'defense') {
        drawGlow(x, y, radius * 1.3, 'rgba(68, 68, 255, 0.3)');
    }

    // 繪製粒子特效
    if (player.mode === 'attack') {
        drawFlameParticles(x, y, radius);
    } else if (player.mode === 'defense') {
        drawShield(x, y, radius);
    }

    // 繪製主體
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 繪製外框（攻擊/防禦狀態）
    if (player.mode !== 'normal') {
        ctx.strokeStyle = player.mode === 'attack' ? '#FF0000' : '#0000FF';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    // 繪製眼睛
    drawEyes(x, y, radius);
}

// 光暈效果
function drawGlow(x, y, radius, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

// 火焰粒子
function drawFlameParticles(x, y, radius) {
    const particles = 8;
    const time = Date.now() / 100;

    for (let i = 0; i < particles; i++) {
        const angle = (i / particles) * Math.PI * 2 + time;
        const distance = radius + 5 + Math.sin(time + i) * 3;
        const px = x + Math.cos(angle) * distance;
        const py = y + Math.sin(angle) * distance;

        ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, 0.7)`;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 護盾效果（六邊形）
function drawShield(x, y, radius) {
    const sides = 6;
    const shieldRadius = radius + 8;
    const time = Date.now() / 1000;

    ctx.strokeStyle = '#4444FF';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6 + Math.sin(time * 3) * 0.2;

    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * Math.PI * 2 - Math.PI / 2 + time;
        const px = x + Math.cos(angle) * shieldRadius;
        const py = y + Math.sin(angle) * shieldRadius;

        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
    ctx.stroke();

    ctx.globalAlpha = 1.0;
}
```

### 2. UI 狀態指示器

```html
<!-- 玩家血條與技能冷卻 -->
<div class="player-status-bar">
    <div class="player-info">
        <span class="player-name">玩家名稱</span>
        <span class="player-score">1500</span>
    </div>

    <div class="skill-buttons">
        <!-- 攻擊技能 -->
        <button class="skill-btn attack" id="attackBtn">
            <div class="skill-icon">🗡️</div>
            <div class="skill-name">攻擊</div>
            <div class="cooldown-overlay" id="attackCooldown"></div>
            <div class="cooldown-text">10s</div>
        </button>

        <!-- 防禦技能 -->
        <button class="skill-btn defense" id="defenseBtn">
            <div class="skill-icon">🛡️</div>
            <div class="skill-name">防禦</div>
            <div class="cooldown-overlay" id="defenseCooldown"></div>
            <div class="cooldown-text">8s</div>
        </button>
    </div>

    <!-- 當前狀態顯示 -->
    <div class="current-state" id="currentState">
        <span class="state-icon">🟡</span>
        <span class="state-name">普通</span>
        <div class="state-timer">-</div>
    </div>
</div>

<style>
.player-status-bar {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    border-radius: 15px;
    padding: 15px 30px;
    display: flex;
    align-items: center;
    gap: 30px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
}

.player-info {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.player-name {
    color: #FFD700;
    font-weight: bold;
}

.player-score {
    color: white;
    font-size: 1.5em;
}

.skill-buttons {
    display: flex;
    gap: 15px;
}

.skill-btn {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 10px;
    border: 3px solid;
    background: rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: all 0.3s;
    overflow: hidden;
}

.skill-btn.attack {
    border-color: #FF4444;
}

.skill-btn.defense {
    border-color: #4444FF;
}

.skill-btn:hover:not(.on-cooldown) {
    transform: scale(1.1);
    box-shadow: 0 0 20px currentColor;
}

.skill-btn.active {
    animation: pulse 0.5s infinite;
}

.skill-icon {
    font-size: 2em;
}

.skill-name {
    font-size: 0.8em;
    color: white;
    margin-top: 5px;
}

.cooldown-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 0%;
    background: rgba(0, 0, 0, 0.7);
    transition: height 0.1s linear;
}

.skill-btn.on-cooldown {
    opacity: 0.5;
    cursor: not-allowed;
}

.cooldown-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-weight: bold;
    font-size: 1.2em;
    display: none;
}

.skill-btn.on-cooldown .cooldown-text {
    display: block;
}

.current-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    min-width: 100px;
}

.state-icon {
    font-size: 2em;
}

.state-name {
    color: white;
    font-weight: bold;
}

.state-timer {
    color: #FFD700;
    font-size: 1.2em;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}
</style>
```

---

## 💥 碰撞效果動畫

### 1. 攻擊成功（搶分）
```javascript
function showAttackEffect(attackerPos, defenderPos, stolenScore) {
    // 擊中特效
    createImpactEffect(defenderPos, '#FF4444');

    // 分數飛向攻擊者
    createScoreFly(defenderPos, attackerPos, stolenScore);

    // 被攻擊者擊退
    knockback(defenderPos, attackerPos);

    // 音效
    playSound('attack-hit');

    // 螢幕震動
    shakeScreen(5);
}

// 撞擊特效
function createImpactEffect(pos, color) {
    const particles = 12;
    for (let i = 0; i < particles; i++) {
        const angle = (i / particles) * Math.PI * 2;
        const particle = {
            x: pos.x,
            y: pos.y,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            life: 30,
            color: color
        };
        gameParticles.push(particle);
    }
}

// 分數飛行動畫
function createScoreFly(from, to, score) {
    const element = document.createElement('div');
    element.className = 'score-fly';
    element.textContent = `+${score}`;
    element.style.left = `${from.x * CELL_SIZE}px`;
    element.style.top = `${from.y * CELL_SIZE}px`;

    document.getElementById('gameCanvas').parentElement.appendChild(element);

    // 使用 CSS 動畫飛向目標
    setTimeout(() => {
        element.style.left = `${to.x * CELL_SIZE}px`;
        element.style.top = `${to.y * CELL_SIZE}px`;
        element.style.opacity = '0';
    }, 10);

    setTimeout(() => element.remove(), 1000);
}

// 擊退效果
function knockback(targetPos, sourcePos) {
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
        const knockbackDistance = 2;
        const newX = targetPos.x + Math.round((dx / distance) * knockbackDistance);
        const newY = targetPos.y + Math.round((dy / distance) * knockbackDistance);

        // 檢查新位置是否有效
        if (isValidPosition(newX, newY)) {
            // 更新位置（帶動畫）
            animateMove(targetPos, {x: newX, y: newY}, 200);
        }
    }
}
```

**CSS 動畫**：
```css
.score-fly {
    position: absolute;
    color: #FF4444;
    font-size: 2em;
    font-weight: bold;
    pointer-events: none;
    transition: all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    z-index: 1000;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

/* 螢幕震動 */
@keyframes screen-shake {
    0%, 100% { transform: translate(0, 0); }
    10% { transform: translate(-5px, 2px); }
    20% { transform: translate(5px, -2px); }
    30% { transform: translate(-3px, -3px); }
    40% { transform: translate(3px, 3px); }
    50% { transform: translate(-2px, -1px); }
    60% { transform: translate(2px, 1px); }
    70% { transform: translate(-1px, -2px); }
    80% { transform: translate(1px, 2px); }
    90% { transform: translate(-1px, 1px); }
}

.shake {
    animation: screen-shake 0.3s;
}
```

### 2. 防禦成功（反彈）
```javascript
function showDefenseEffect(defenderPos, attackerPos) {
    // 護盾閃光
    createShieldFlash(defenderPos);

    // 反彈波紋
    createReflectWave(defenderPos);

    // 攻擊者被彈開
    knockback(attackerPos, defenderPos);

    // 音效
    playSound('shield-block');

    // 護盾震動
    shakeElement(defenderElement, 3);
}

// 護盾閃光
function createShieldFlash(pos) {
    const flash = document.createElement('div');
    flash.className = 'shield-flash';
    flash.style.left = `${pos.x * CELL_SIZE - 20}px`;
    flash.style.top = `${pos.y * CELL_SIZE - 20}px`;

    document.getElementById('gameCanvas').parentElement.appendChild(flash);

    setTimeout(() => flash.remove(), 500);
}

// 反彈波紋
function createReflectWave(pos) {
    const wave = document.createElement('div');
    wave.className = 'reflect-wave';
    wave.style.left = `${pos.x * CELL_SIZE}px`;
    wave.style.top = `${pos.y * CELL_SIZE}px`;

    document.getElementById('gameCanvas').parentElement.appendChild(wave);

    setTimeout(() => wave.remove(), 600);
}
```

**CSS 動畫**：
```css
.shield-flash {
    position: absolute;
    width: 60px;
    height: 60px;
    background: radial-gradient(circle, rgba(68, 68, 255, 0.8), transparent);
    border-radius: 50%;
    animation: flash-expand 0.5s ease-out;
    pointer-events: none;
    z-index: 999;
}

@keyframes flash-expand {
    0% {
        transform: scale(0.5);
        opacity: 1;
    }
    100% {
        transform: scale(2);
        opacity: 0;
    }
}

.reflect-wave {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 3px solid #4444FF;
    border-radius: 50%;
    animation: wave-expand 0.6s ease-out;
    pointer-events: none;
    z-index: 998;
}

@keyframes wave-expand {
    0% {
        transform: translate(-10px, -10px) scale(1);
        opacity: 1;
    }
    100% {
        transform: translate(-50px, -50px) scale(5);
        opacity: 0;
    }
}
```

### 3. 雙方攻擊碰撞（互相傷害）
```javascript
function showMutualDamage(pos1, pos2) {
    // 中點爆炸
    const midX = (pos1.x + pos2.x) / 2;
    const midY = (pos1.y + pos2.y) / 2;

    createExplosion({x: midX, y: midY});

    // 雙方震動
    shakeScreen(8);

    // 音效
    playSound('clash');

    // 雙方擊退
    knockback(pos1, pos2);
    knockback(pos2, pos1);
}

// 爆炸效果
function createExplosion(pos) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = `${pos.x * CELL_SIZE}px`;
    explosion.style.top = `${pos.y * CELL_SIZE}px`;

    document.getElementById('gameCanvas').parentElement.appendChild(explosion);

    // 粒子爆炸
    const particles = 20;
    for (let i = 0; i < particles; i++) {
        const angle = (i / particles) * Math.PI * 2;
        const speed = 4 + Math.random() * 3;
        const particle = {
            x: pos.x,
            y: pos.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 40,
            color: ['#FF4444', '#FF6600', '#FFAA00'][Math.floor(Math.random() * 3)]
        };
        gameParticles.push(particle);
    }

    setTimeout(() => explosion.remove(), 800);
}
```

**CSS 動畫**：
```css
.explosion {
    position: absolute;
    width: 40px;
    height: 40px;
    background: radial-gradient(circle, #FF4444, #FF6600, transparent);
    border-radius: 50%;
    animation: explode 0.8s ease-out;
    pointer-events: none;
    z-index: 1000;
}

@keyframes explode {
    0% {
        transform: translate(-20px, -20px) scale(0);
        opacity: 1;
    }
    50% {
        transform: translate(-40px, -40px) scale(2);
        opacity: 0.8;
    }
    100% {
        transform: translate(-60px, -60px) scale(3);
        opacity: 0;
    }
}
```

---

## 🎮 完整實作程式碼

### 玩家狀態管理
```javascript
class PlayerState {
    constructor() {
        this.mode = 'normal';
        this.modeStartTime = 0;
        this.attackCooldown = 0;
        this.defenseCooldown = 0;
    }

    // 切換攻擊狀態
    switchToAttack() {
        if (this.mode !== 'normal' || this.attackCooldown > 0) {
            return false;
        }

        this.mode = 'attack';
        this.modeStartTime = Date.now();
        this.attackCooldown = 10000; // 10秒冷卻

        // 更新視覺
        updatePlayerVisual('attack');

        // 5秒後自動切回普通
        setTimeout(() => {
            if (this.mode === 'attack') {
                this.switchToNormal();
            }
        }, 5000);

        return true;
    }

    // 切換防禦狀態
    switchToDefense() {
        if (this.mode !== 'normal' || this.defenseCooldown > 0) {
            return false;
        }

        this.mode = 'defense';
        this.modeStartTime = Date.now();
        this.defenseCooldown = 8000; // 8秒冷卻

        // 更新視覺
        updatePlayerVisual('defense');

        // 5秒後自動切回普通
        setTimeout(() => {
            if (this.mode === 'defense') {
                this.switchToNormal();
            }
        }, 5000);

        return true;
    }

    // 切回普通狀態
    switchToNormal() {
        this.mode = 'normal';
        this.modeStartTime = 0;

        // 更新視覺
        updatePlayerVisual('normal');
    }

    // 更新冷卻時間
    updateCooldowns(deltaTime) {
        if (this.attackCooldown > 0) {
            this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
            updateCooldownUI('attack', this.attackCooldown);
        }

        if (this.defenseCooldown > 0) {
            this.defenseCooldown = Math.max(0, this.defenseCooldown - deltaTime);
            updateCooldownUI('defense', this.defenseCooldown);
        }
    }

    // 獲取當前速度倍率
    getSpeedMultiplier() {
        const config = stateConfig[this.mode];
        return config ? config.speed : 1.0;
    }
}

// 全局玩家狀態
const myPlayerState = new PlayerState();
```

### 碰撞檢測與處理
```javascript
// 檢測並處理碰撞
async function handleCollisions() {
    const players = Object.entries(gameState.players);

    for (let i = 0; i < players.length; i++) {
        const [id1, player1] = players[i];

        // 只處理自己的碰撞
        if (id1 !== currentPlayerId) continue;

        for (let j = 0; j < players.length; j++) {
            if (i === j) continue;

            const [id2, player2] = players[j];

            // 檢測位置重疊
            if (player1.x === player2.x && player1.y === player2.y) {
                await processCollision(id1, player1, id2, player2);
            }
        }
    }
}

// 處理碰撞邏輯
async function processCollision(id1, p1, id2, p2) {
    const mode1 = p1.mode || 'normal';
    const mode2 = p2.mode || 'normal';

    let result = null;

    // 攻擊 vs 普通
    if (mode1 === 'attack' && mode2 === 'normal') {
        result = {
            winner: id1,
            loser: id2,
            scoreChange: Math.floor(p2.score * 0.3),
            effect: 'attack-hit'
        };
    }
    // 攻擊 vs 防禦
    else if (mode1 === 'attack' && mode2 === 'defense') {
        result = {
            winner: id2,
            loser: id1,
            scoreChange: Math.floor(p1.score * 0.1),
            effect: 'defense-reflect'
        };
    }
    // 攻擊 vs 攻擊
    else if (mode1 === 'attack' && mode2 === 'attack') {
        result = {
            winner: null,
            loser: null,
            scoreChange1: Math.floor(p1.score * 0.15),
            scoreChange2: Math.floor(p2.score * 0.15),
            effect: 'mutual-damage'
        };
    }
    // 普通 vs 普通（分數高者獲勝）
    else if (mode1 === 'normal' && mode2 === 'normal') {
        if (p1.score > p2.score) {
            result = {
                winner: id1,
                loser: id2,
                scoreChange: Math.floor(p2.score * 0.1),
                effect: 'normal-collision'
            };
        } else if (p2.score > p1.score) {
            result = {
                winner: id2,
                loser: id1,
                scoreChange: Math.floor(p1.score * 0.1),
                effect: 'normal-collision'
            };
        }
    }
    // 其他情況（防禦 vs 普通、防禦 vs 防禦）
    else {
        result = {
            effect: 'bounce' // 彈開
        };
    }

    // 應用結果
    if (result) {
        await applyCollisionResult(result, p1, p2);
    }
}

// 應用碰撞結果
async function applyCollisionResult(result, p1, p2) {
    const updates = {};

    if (result.winner && result.loser) {
        // 單方獲勝
        const winnerRef = database.ref(`rooms/${currentRoomId}/players/${result.winner}`);
        const loserRef = database.ref(`rooms/${currentRoomId}/players/${result.loser}`);

        const winnerPlayer = result.winner === id1 ? p1 : p2;
        const loserPlayer = result.loser === id1 ? p1 : p2;

        await winnerRef.update({
            score: winnerPlayer.score + result.scoreChange
        });

        await loserRef.update({
            score: Math.max(0, loserPlayer.score - result.scoreChange)
        });

        // 顯示效果
        if (result.effect === 'attack-hit') {
            showAttackEffect(
                {x: winnerPlayer.x, y: winnerPlayer.y},
                {x: loserPlayer.x, y: loserPlayer.y},
                result.scoreChange
            );
        } else if (result.effect === 'defense-reflect') {
            showDefenseEffect(
                {x: p2.x, y: p2.y},
                {x: p1.x, y: p1.y}
            );
        }
    } else if (result.effect === 'mutual-damage') {
        // 雙方傷害
        await database.ref(`rooms/${currentRoomId}/players/${id1}`).update({
            score: Math.max(0, p1.score - result.scoreChange1)
        });

        await database.ref(`rooms/${currentRoomId}/players/${id2}`).update({
            score: Math.max(0, p2.score - result.scoreChange2)
        });

        showMutualDamage({x: p1.x, y: p1.y}, {x: p2.x, y: p2.y});
    } else if (result.effect === 'bounce') {
        // 彈開
        playSound('bounce');
    }
}
```

### 鍵盤控制整合
```javascript
document.addEventListener('keydown', (e) => {
    // 攻擊狀態
    if (e.key === 'q' || e.key === 'Q') {
        if (myPlayerState.switchToAttack()) {
            playSound('attack-activate');
            showNotification('攻擊模式啟動！', '#FF4444');
        } else {
            showNotification('技能冷卻中...', '#999');
        }
    }

    // 防禦狀態
    if (e.key === 'e' || e.key === 'E') {
        if (myPlayerState.switchToDefense()) {
            playSound('defense-activate');
            showNotification('防禦模式啟動！', '#4444FF');
        } else {
            showNotification('技能冷卻中...', '#999');
        }
    }

    // 快速切回普通
    if (e.key === ' ') {
        myPlayerState.switchToNormal();
        showNotification('取消狀態', '#FFD700');
    }
});
```

---

## 📊 平衡性調整

### 數值配置表

| 參數 | 初始值 | 說明 | 可調整範圍 |
|-----|-------|------|----------|
| 攻擊持續時間 | 5秒 | 攻擊狀態維持時間 | 3-8秒 |
| 攻擊冷卻時間 | 10秒 | 攻擊後需等待時間 | 8-15秒 |
| 攻擊速度加成 | +20% | 攻擊狀態移動速度 | +10% ~ +30% |
| 攻擊搶分比例 | 30% | 擊中普通玩家搶分 | 20% ~ 50% |
| 防禦持續時間 | 5秒 | 防禦狀態維持時間 | 3-8秒 |
| 防禦冷卻時間 | 8秒 | 防禦後需等待時間 | 6-12秒 |
| 防禦速度減少 | -30% | 防禦狀態移動速度 | -20% ~ -50% |
| 防禦反彈傷害 | 10% | 反彈給攻擊者的傷害 | 5% ~ 20% |
| 互撞傷害 | 15% | 雙方攻擊碰撞損失 | 10% ~ 25% |

### 建議測試流程
```
1. 使用初始值測試 20 局
2. 記錄各狀態使用頻率
3. 記錄勝率數據
4. 依數據調整：
   - 如果攻擊太強 → 增加冷卻或減少搶分
   - 如果防禦太弱 → 增加反彈傷害或減少速度懲罰
   - 如果互撞太少 → 增加攻擊獎勵或減少冷卻
5. 重複測試直到平衡
```

---

## 🎯 與遊戲模式整合

### 適用模式

✅ **計時競速賽**：完美契合，增加競爭性
✅ **生存淘汰賽**：攻擊更致命（直接扣命）
✅ **團隊對抗賽**：可以保護隊友（防禦擋刀）
✅ **寶箱爭奪戰**：搶寶箱時攻防博弈
❌ **追逐模式**：已有能量豆機制，不需要

### 模式專屬調整

**生存淘汰賽版本**：
```javascript
// 攻擊成功直接扣命
if (mode1 === 'attack' && mode2 === 'normal') {
    result = {
        winner: id1,
        loser: id2,
        livesLost: 1,  // 扣1條命
        effect: 'attack-kill'
    };
}
```

**團隊對抗賽版本**：
```javascript
// 隊友之間無法傷害
if (p1.team === p2.team) {
    return; // 不處理碰撞
}

// 防禦可以保護隊友
if (mode1 === 'defense' && p2.team === p1.team) {
    // p1 在 p2 旁邊時，p2 也獲得護盾效果
    applyTeammateShield(p2);
}
```

---

## 💡 進階功能（未來擴展）

### 1. 連擊系統
```
連續攻擊成功可獲得連擊加成：
- 2連擊：搶分 +10%
- 3連擊：搶分 +20% + 速度 +10%
- 5連擊：搶分 +50% + 無敵1秒
- 連擊中斷：被攻擊或10秒內未攻擊
```

### 2. 技能升級
```
玩家等級提升解鎖技能強化：
- Lv 10：攻擊冷卻 -1秒
- Lv 20：防禦持續時間 +1秒
- Lv 30：攻擊範圍 +1格（可遠程攻擊）
- Lv 40：防禦反彈傷害 +5%
```

### 3. 特殊道具
```
地圖隨機刷新特殊道具：
- 🔥 狂暴藥水：攻擊冷卻 -50%，持續30秒
- 🛡️ 鐵壁藥水：防禦無速度懲罰，持續20秒
- ⚡ 閃電手套：攻擊範圍 +2格，持續15秒
- 💫 無敵星星：10秒無敵
```

---

## 📝 總結

這個戰鬥系統：
✅ **簡單易懂**：石頭剪刀布邏輯，新手秒懂
✅ **策略深度**：何時攻擊、何時防守需要判斷
✅ **視覺華麗**：豐富的特效和動畫
✅ **易於平衡**：所有數值可調整
✅ **擴展性強**：未來可加入更多變化

**下一步**：要不要我幫你把這個戰鬥系統整合進第一個模式「計時競速賽」中？🎮
