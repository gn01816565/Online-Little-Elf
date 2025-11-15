# 🎮 遊戲增強計劃 - 3A級別改進

## 📋 總體目標

將當前的基礎多人小精靈遊戲提升到 3A 遊戲品質，增加遊戲深度、玩家互動和遊戲感。

---

## 🔥 階段一：核心遊戲循環（高優先級）

### 1. ⏰ 遊戲倒數計時器
**問題**：遊戲沒有明確的結束條件，缺乏緊張感

**解決方案**：
- 添加 3 分鐘倒數計時器
- 倒數最後 30 秒時顯示警告動畫（紅色閃爍）
- 時間到自動結束遊戲並顯示結果

**技術實作**：
```javascript
// 遊戲狀態添加
let gameTimer = 180; // 3分鐘 = 180秒
let timerInterval = null;

// 開始遊戲時啟動計時器
function startGameTimer() {
    timerInterval = setInterval(() => {
        gameTimer--;
        updateTimerDisplay();

        if (gameTimer <= 30) {
            // 最後30秒警告
            document.getElementById('timer').classList.add('warning');
        }

        if (gameTimer <= 0) {
            endGame();
        }
    }, 1000);
}

// 顯示計時器
function updateTimerDisplay() {
    const minutes = Math.floor(gameTimer / 60);
    const seconds = gameTimer % 60;
    document.getElementById('timer').textContent =
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
```

**UI 設計**：
- 位置：畫面正上方居中
- 樣式：大號數字，黑底金邊
- 動畫：最後 30 秒紅色脈衝動畫

---

### 2. 🏆 勝利/失敗畫面
**問題**：遊戲結束沒有任何反饋

**解決方案**：
- 全螢幕遮罩顯示最終結果
- 顯示完整排行榜（1-10名）
- 前三名特殊視覺效果（金銀銅）
- 顯示個人統計（總分、收集豆子數、排名變化）

**UI 設計**：
```
┌──────────────────────────────┐
│   🎉 遊戲結束！               │
│                               │
│   🏆 最終排行榜               │
│                               │
│   🥇 1st - 玩家A - 450分      │
│   🥈 2nd - 玩家B - 380分      │
│   🥉 3rd - 你 - 320分 ⬆️      │
│   4th - 玩家D - 280分         │
│   ...                         │
│                               │
│   [再來一局] [離開遊戲]       │
└──────────────────────────────┘
```

**技術實作**：
```javascript
function endGame() {
    clearInterval(timerInterval);

    // 獲取最終排名
    const rankings = getRankedPlayers();

    // 顯示勝利畫面
    showVictoryScreen(rankings);

    // 更新 Firebase（遊戲狀態改為 'ended'）
    if (isHost && database) {
        database.ref(`rooms/${currentRoomId}`).update({
            status: 'ended',
            endedAt: Date.now(),
            finalRankings: rankings
        });
    }
}

function getRankedPlayers() {
    const players = Object.entries(gameState.players);
    return players
        .sort((a, b) => (b[1].score || 0) - (a[1].score || 0))
        .map(([id, player], index) => ({
            rank: index + 1,
            id: id,
            name: player.name,
            score: player.score || 0,
            color: player.color
        }));
}
```

---

### 3. 📊 實時排行榜
**問題**：玩家不知道自己的即時排名

**解決方案**：
- 遊戲畫面右側顯示即時排名（前5名）
- 當前玩家高亮顯示
- 排名變化動畫（上升/下降箭頭）
- 前三名特殊標記（🥇🥈🥉）

**UI 位置**：
```
畫面右上角固定位置
┌─────────────────┐
│  📊 排行榜      │
├─────────────────┤
│ 🥇 玩家A  450  │
│ 🥈 你 ⬆️  380  │
│ 🥉 玩家C  320  │
│ 4  玩家D  280  │
│ 5  玩家E  250  │
└─────────────────┘
```

**技術實作**：
```javascript
function updateLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');
    const rankings = getRankedPlayers().slice(0, 5); // 只顯示前5名

    leaderboard.innerHTML = rankings.map((player, index) => {
        const medals = ['🥇', '🥈', '🥉'];
        const medal = index < 3 ? medals[index] : (index + 1);
        const isCurrentPlayer = player.id === currentPlayerId;

        return `
            <div class="leaderboard-item ${isCurrentPlayer ? 'current-player' : ''}">
                <span class="rank rank-${index + 1}">${medal}</span>
                <span class="name">${player.name}</span>
                <span class="score">${player.score}</span>
            </div>
        `;
    }).join('');
}

// 在 updateGameState 中調用
function updateGameState(data) {
    gameState = data;
    updateLeaderboard(); // 每次狀態更新時刷新排行榜
    // ... 其他更新
}
```

---

### 4. 🔊 音效系統
**問題**：遊戲完全靜音，缺乏沉浸感

**解決方案**：
使用 Web Audio API 或簡單的 HTML5 Audio

**音效列表**：
1. 背景音樂（循環播放，8-bit 風格）
2. 吃小豆子音效（"嗶"聲）
3. 吃能量豆音效（更響亮的音效）
4. 玩家碰撞音效
5. 倒數計時"滴答"聲（最後10秒）
6. 勝利音效
7. 失敗音效

**技術實作**：
```javascript
// 音效管理器
const SoundManager = {
    sounds: {},
    muted: false,

    // 初始化（使用數據URL或外部文件）
    init() {
        // 選項1：使用簡單的beep音效（純代碼生成）
        this.createBeepSound('dot', 200, 0.1);
        this.createBeepSound('powerup', 400, 0.2);
        this.createBeepSound('collision', 100, 0.3);

        // 選項2：使用外部音效文件
        // this.sounds.bgm = new Audio('bgm.mp3');
        // this.sounds.bgm.loop = true;
    },

    // 使用 Web Audio API 創建簡單音效
    createBeepSound(name, frequency, duration) {
        this.sounds[name] = () => {
            if (this.muted) return;

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'square';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
    },

    play(soundName) {
        if (this.sounds[soundName] && !this.muted) {
            if (typeof this.sounds[soundName] === 'function') {
                this.sounds[soundName]();
            } else {
                this.sounds[soundName].currentTime = 0;
                this.sounds[soundName].play();
            }
        }
    },

    toggleMute() {
        this.muted = !this.muted;
    }
};

// 使用示例
// 吃豆子時
if (gameState.maze[newY][newX] === 2) {
    updates.score = (player.score || 0) + 10;
    SoundManager.play('dot'); // 播放音效
    await database.ref(`rooms/${currentRoomId}/maze/${newY}/${newX}`).set(0);
}
```

---

### 5. ✨ 視覺反饋
**問題**：收集豆子沒有視覺反饋，缺乏滿足感

**解決方案**：
1. **分數彈出動畫**：收集豆子時彈出"+10"、"+50"
2. **粒子效果**：收集能量豆時的爆炸粒子
3. **畫面震動**：重要事件時的輕微震動
4. **連擊顯示**：連續收集豆子時顯示"2x COMBO!"

**技術實作**：

**分數彈出**：
```javascript
function showScorePopup(x, y, score) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${score}`;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;

    document.body.appendChild(popup);

    // 1秒後移除
    setTimeout(() => popup.remove(), 1000);
}

// 在收集豆子時調用
if (gameState.maze[newY][newX] === 2) {
    const screenX = newX * CELL_SIZE + canvas.offsetLeft;
    const screenY = newY * CELL_SIZE + canvas.offsetTop;
    showScorePopup(screenX, screenY, 10);
}
```

**粒子效果**：
```javascript
function createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.background = color;

        // 隨機方向
        const angle = (Math.PI * 2 * i) / count;
        const distance = 30 + Math.random() * 20;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);

        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
    }
}
```

**連擊系統**：
```javascript
let comboCount = 0;
let comboTimer = null;

function handleDotCollection() {
    comboCount++;

    // 重置連擊計時器
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
        comboCount = 0;
    }, 2000); // 2秒內沒收集，連擊重置

    // 顯示連擊
    if (comboCount >= 3) {
        showComboText(comboCount);
        // 連擊獎勵：基礎分數 * 連擊數
        bonusScore = 10 * comboCount;
    }
}

function showComboText(combo) {
    const comboElement = document.createElement('div');
    comboElement.className = 'combo-display';
    comboElement.textContent = `${combo}x COMBO!`;
    document.body.appendChild(comboElement);
    setTimeout(() => comboElement.remove(), 1000);
}
```

---

## 💥 階段二：玩家互動（中優先級）

### 6. 💥 玩家碰撞機制
**問題**：玩家之間沒有任何互動

**解決方案**：
- 玩家碰撞時，分數較低的失去 20 分（最低為0）
- 分數較高的獲得 10 分獎勵
- 碰撞時產生視覺效果（閃光、震動）
- 短暫的無敵時間（1秒）避免連續碰撞

**技術實作**：
```javascript
function checkPlayerCollision(newX, newY, currentPlayer) {
    const otherPlayers = Object.entries(gameState.players)
        .filter(([id, p]) => id !== currentPlayerId);

    for (const [otherId, otherPlayer] of otherPlayers) {
        if (otherPlayer.x === newX && otherPlayer.y === newY) {
            // 檢查是否在無敵時間內
            if (currentPlayer.invincible || otherPlayer.invincible) continue;

            // 比較分數
            handleCollision(currentPlayerId, currentPlayer, otherId, otherPlayer);
            return true;
        }
    }
    return false;
}

async function handleCollision(id1, player1, id2, player2) {
    const score1 = player1.score || 0;
    const score2 = player2.score || 0;

    let updates = {};

    if (score1 > score2) {
        // player1 獲勝
        updates[`players/${id1}/score`] = score1 + 10;
        updates[`players/${id2}/score`] = Math.max(0, score2 - 20);
        updates[`players/${id2}/invincible`] = Date.now() + 1000; // 1秒無敵
    } else {
        // player2 獲勝
        updates[`players/${id2}/score`] = score2 + 10;
        updates[`players/${id1}/score`] = Math.max(0, score1 - 20);
        updates[`players/${id1}/invincible`] = Date.now() + 1000;
    }

    await database.ref(`rooms/${currentRoomId}`).update(updates);

    // 視覺效果
    SoundManager.play('collision');
    screenShake();
}

function screenShake() {
    canvas.style.transform = 'translate(5px, 5px)';
    setTimeout(() => {
        canvas.style.transform = 'translate(-5px, -5px)';
        setTimeout(() => {
            canvas.style.transform = 'translate(0, 0)';
        }, 50);
    }, 50);
}
```

---

### 7. 🎁 道具系統
**問題**：遊戲缺乏策略性和變化

**解決方案**：
在迷宮中隨機刷新3種道具（替換部分能量豆）：

1. **⚡ 加速道具**（綠色）
   - 效果：移動速度 +50%，持續 5 秒
   - 視覺：玩家周圍綠色光環

2. **🛡️ 護盾道具**（藍色）
   - 效果：免疫碰撞，持續 5 秒
   - 視覺：玩家周圍藍色護盾

3. **💣 炸彈道具**（紫色）
   - 效果：炸毀周圍 3x3 範圍的牆壁
   - 視覺：爆炸動畫

**技術實作**：
```javascript
// 在生成迷宮時添加道具
function generateMaze() {
    // ... 原有代碼

    // 隨機添加道具
    const powerUpCount = 3;
    for (let i = 0; i < powerUpCount; i++) {
        const x = Math.floor(Math.random() * (COLS - 2)) + 1;
        const y = Math.floor(Math.random() * (ROWS - 2)) + 1;
        if (maze[y][x] === 0 || maze[y][x] === 2) {
            maze[y][x] = 4 + (i % 3); // 4=加速, 5=護盾, 6=炸彈
        }
    }

    return maze;
}

// 繪製道具
if (gameState.maze[y][x] === 4) {
    // 加速（綠色星星）
    ctx.fillStyle = '#00FF00';
    // ... 繪製星星
} else if (gameState.maze[y][x] === 5) {
    // 護盾（藍色盾牌）
    ctx.fillStyle = '#00FFFF';
    // ... 繪製盾牌
} else if (gameState.maze[y][x] === 6) {
    // 炸彈（紫色炸彈）
    ctx.fillStyle = '#FF00FF';
    // ... 繪製炸彈
}

// 收集道具
if (gameState.maze[newY][newX] >= 4 && gameState.maze[newY][newX] <= 6) {
    const powerUpType = gameState.maze[newY][newX];
    activatePowerUp(powerUpType);
    await database.ref(`rooms/${currentRoomId}/maze/${newY}/${newX}`).set(0);
}

function activatePowerUp(type) {
    switch(type) {
        case 4: // 加速
            player.speedBoost = Date.now() + 5000;
            showPowerUpIndicator('⚡ 加速！', 'speed');
            break;
        case 5: // 護盾
            player.shield = Date.now() + 5000;
            showPowerUpIndicator('🛡️ 護盾！', 'shield');
            break;
        case 6: // 炸彈
            explodeBomb(player.x, player.y);
            showPowerUpIndicator('💣 爆炸！', 'bomb');
            break;
    }
}
```

---

## 🚀 階段三：技術優化（低優先級）

### 8. ⚡ 客戶端預測
**問題**：等待 Firebase 響應造成延遲感

**解決方案**：
- 玩家移動先在本地執行（立即反饋）
- 後台同步到 Firebase
- 如果服務器拒絕（碰撞等），回滾本地狀態

**技術實作**：
```javascript
// 客戶端預測版本的移動
async function movePlayerWithPrediction(newX, newY) {
    // 1. 立即更新本地狀態
    const oldX = localPlayer.x;
    const oldY = localPlayer.y;
    localPlayer.x = newX;
    localPlayer.y = newY;

    // 2. 後台同步到服務器
    try {
        const result = await playerRef.update({ x: newX, y: newY });
        // 成功，保持本地狀態
    } catch (error) {
        // 失敗，回滾
        localPlayer.x = oldX;
        localPlayer.y = oldY;
    }
}

// 其他玩家的位置使用插值
function interpolatePlayerPosition(player) {
    if (!player.targetX) return;

    const dx = player.targetX - player.displayX;
    const dy = player.targetY - player.displayY;

    // 平滑移動（10% 每幀）
    player.displayX += dx * 0.1;
    player.displayY += dy * 0.1;
}
```

---

## 📈 預期改進效果

### 遊戲體驗提升
| 項目 | 改進前 | 改進後 |
|------|--------|--------|
| 遊戲目標 | ❌ 不明確 | ✅ 3分鐘內得最高分 |
| 玩家互動 | ❌ 沒有 | ✅ 碰撞、道具競爭 |
| 視覺反饋 | ❌ 基本 | ✅ 豐富（粒子、動畫） |
| 聽覺反饋 | ❌ 沒有 | ✅ 完整音效系統 |
| 策略性 | ❌ 純手速 | ✅ 道具、碰撞策略 |
| 競爭性 | ❌ 弱 | ✅ 實時排名、碰撞 |
| 滿足感 | ⭐⭐ | ⭐⭐⭐⭐⭐ |

### 技術指標
- **延遲感**：從 ~200ms 降低到 <50ms（客戶端預測）
- **視覺吸引力**：+300%（粒子、動畫、效果）
- **遊戲時長**：固定 3 分鐘（可調整）
- **重玩性**：+500%（更多變化和策略）

---

## 🎯 實作優先級建議

**第一批（必須）**：
1. 倒數計時器
2. 勝利畫面
3. 實時排行榜

**第二批（重要）**：
4. 音效系統
5. 視覺反饋

**第三批（提升）**：
6. 玩家碰撞
7. 道具系統

**第四批（優化）**：
8. 客戶端預測

---

## 📝 實作注意事項

1. **向後兼容**：確保增強版仍可在未配置 Firebase 時以演示模式運行
2. **性能優化**：粒子效果不超過 50 個同時存在
3. **移動端適配**：觸控按鈕（在道具系統階段添加）
4. **錯誤處理**：所有 Firebase 操作都有 try-catch
5. **代碼組織**：將新功能模塊化（SoundManager、ParticleSystem 等）

---

## 🎨 美術資源需求

### 最小化版本（純代碼實現）
- 使用 Canvas 繪製所有圖形
- 使用 Web Audio API 生成音效
- 使用 CSS 動畫實現特效

### 完整版本（可選）
- 音效文件（.mp3 或 .wav）
- 背景音樂
- 粒子貼圖
- 道具圖標
- UI 美化素材

---

## ⚔️ 階段四：戰鬥系統（高優先級 - 新增）

### 設計理念
**核心問題**：玩家間只有分數競爭，缺乏直接對抗和策略深度

**解決方案**：引入完整的攻擊/防禦/技能系統，將遊戲從「單純收集」升級為「戰術對抗」

---

### 1. ⚔️ 角色定位系統

#### 🗡️ 攻擊型 (Attacker)
**特性**：
- 基礎移速：100%
- 基礎血量：2 HP
- 定位：高爆發刺客

**主動技能「衝刺攻擊」**：
```javascript
按鍵：E
冷卻：10秒
效果：
- 向前衝刺3格
- 碰到敵人造成1傷害並偷取20分
- 視覺：紅色殘影
- 音效：劍斬音效

技術實作：
async function dashAttack(playerId) {
    const player = gameState.players[playerId];
    if (player.dashCooldown > Date.now()) return;

    const direction = player.facing;
    const targetX = player.x + direction.x * 3;
    const targetY = player.y + direction.y * 3;

    // 檢查路徑上的敵人
    for (let i = 1; i <= 3; i++) {
        const checkX = player.x + direction.x * i;
        const checkY = player.y + direction.y * i;

        const enemy = findPlayerAt(checkX, checkY);
        if (enemy) {
            await dealDamage(enemy.id, 1, playerId);
            await stealScore(enemy.id, playerId, 20);
            break;
        }
    }

    // 移動到目標位置
    player.x = targetX;
    player.y = targetY;
    player.dashCooldown = Date.now() + 10000;

    // 視覺效果
    createDashTrail(player);
    SoundManager.play('dash');
}
```

**被動技能「掠奪者」**：
- 收集豆子時額外獲得 20% 分數

---

#### 🛡️ 防禦型 (Defender)
**特性**：
- 基礎移速：80%
- 基礎血量：4 HP
- 定位：坦克保護

**主動技能「護盾展開」**：
```javascript
按鍵：E
冷卻：15秒
效果：
- 5秒內免疫所有傷害
- 反彈30%傷害給攻擊者
- 視覺：藍色光盾環繞

技術實作：
function activateShield(playerId) {
    const player = gameState.players[playerId];
    if (player.shieldCooldown > Date.now()) return;

    player.hasShield = true;
    player.shieldEndTime = Date.now() + 5000;
    player.shieldCooldown = Date.now() + 15000;

    // 視覺效果
    createShieldEffect(player);
    SoundManager.play('shield');

    // 5秒後移除
    setTimeout(() => {
        player.hasShield = false;
        removeShieldEffect(player);
    }, 5000);
}

// 修改傷害處理
async function dealDamage(targetId, damage, attackerId) {
    const target = gameState.players[targetId];

    if (target.hasShield) {
        // 反彈傷害
        const reflectDamage = Math.ceil(damage * 0.3);
        await dealDamage(attackerId, reflectDamage, targetId);

        SoundManager.play('reflect');
        createReflectEffect(target);
        return;
    }

    // 正常傷害處理
    target.hp -= damage;
    // ...
}
```

**被動技能「堅韌」**：
- 被攻擊時只損失一半分數
- 收集能量豆時獲得短暫加速（+30%，3秒）

---

#### ⚡ 輔助型 (Support)
**特性**：
- 基礎移速：120%
- 基礎血量：3 HP
- 定位：機動輔助

**主動技能「煙霧彈」**：
```javascript
按鍵：E
冷卻：12秒
效果：
- 在當前位置放置煙霧（3x3範圍）
- 敵人進入減速50%並迷霧2秒
- 持續8秒

技術實作：
function deploySmokeGrenade(playerId) {
    const player = gameState.players[playerId];
    if (player.smokeCooldown > Date.now()) return;

    const smoke = {
        id: `smoke_${Date.now()}`,
        x: player.x,
        y: player.y,
        radius: 1.5, // 3x3範圍
        owner: playerId,
        endTime: Date.now() + 8000
    };

    gameState.smokes.push(smoke);
    player.smokeCooldown = Date.now() + 12000;

    // 視覺效果
    createSmokeEffect(smoke);
    SoundManager.play('smoke');

    // 8秒後移除
    setTimeout(() => {
        removeSmokeEffect(smoke);
        gameState.smokes = gameState.smokes.filter(s => s.id !== smoke.id);
    }, 8000);
}

// 每幀檢查玩家是否在煙霧中
function updateSmokeEffects() {
    gameState.smokes.forEach(smoke => {
        Object.entries(gameState.players).forEach(([id, player]) => {
            if (id === smoke.owner) return;

            const dist = Math.sqrt((player.x - smoke.x)**2 + (player.y - smoke.y)**2);
            if (dist <= smoke.radius) {
                player.inSmoke = true;
                player.moveSpeed = 0.5; // 減速50%
                player.fogOfWar = true; // 迷霧效果
            }
        });
    });
}
```

**被動技能「敏捷」**：
- 連續收集5個豆子後觸發加速（+40%，3秒）

---

### 2. 🎯 攻擊系統

#### 攻擊方式清單

**A. 遠程投擲（通用）**
```javascript
按鍵：空白鍵 (Space)
冷卻：5秒
傷害：1 HP + 偷取10分
射程：5格
效果：向面朝方向投擲豆子彈

class Projectile {
    constructor(owner, x, y, direction) {
        this.owner = owner;
        this.x = x;
        this.y = y;
        this.dx = direction.x * 0.5;
        this.dy = direction.y * 0.5;
        this.damage = 1;
        this.maxRange = 5;
        this.traveled = 0;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.traveled += 0.5;

        // 檢查碰撞牆壁
        const gridX = Math.floor(this.x);
        const gridY = Math.floor(this.y);
        if (gameState.maze[gridY][gridX] === 1) {
            this.explode();
            return false; // 移除投擲物
        }

        // 檢查命中玩家
        for (const [id, player] of Object.entries(gameState.players)) {
            if (id === this.owner) continue;
            if (player.isInvincible) continue;

            if (this.isHit(player)) {
                this.hitPlayer(id);
                return false;
            }
        }

        // 檢查範圍
        return this.traveled < this.maxRange;
    }

    isHit(player) {
        const dist = Math.sqrt(
            (player.x - Math.floor(this.x))**2 +
            (player.y - Math.floor(this.y))**2
        );
        return dist < 0.5;
    }

    async hitPlayer(playerId) {
        await dealDamage(playerId, this.damage, this.owner);
        await stealScore(playerId, this.owner, 10);

        // 暈眩0.5秒
        gameState.players[playerId].stunned = Date.now() + 500;

        SoundManager.play('hit');
        createHitEffect(this.x, this.y);
    }

    explode() {
        createExplosionEffect(this.x, this.y);
    }
}
```

**B. 範圍炸彈**
```javascript
按鍵：Q
消耗：30分
冷卻：20秒
傷害：2 HP（3x3範圍）
特殊：炸毀周圍牆壁

function placeBomb(playerId) {
    const player = gameState.players[playerId];

    // 檢查消耗
    if (player.score < 30) {
        showMessage('分數不足！需要30分');
        return;
    }

    if (player.bombCooldown > Date.now()) return;

    // 扣除分數
    player.score -= 30;

    const bomb = {
        x: player.x,
        y: player.y,
        owner: playerId,
        explodeTime: Date.now() + 3000, // 3秒後爆炸
        radius: 1.5 // 3x3範圍
    };

    gameState.bombs.push(bomb);
    player.bombCooldown = Date.now() + 20000;

    // 視覺：閃爍倒數
    createBombVisual(bomb);
    SoundManager.play('bombPlace');

    // 3秒後爆炸
    setTimeout(() => {
        explodeBomb(bomb);
    }, 3000);
}

async function explodeBomb(bomb) {
    // 傷害玩家
    for (const [id, player] of Object.entries(gameState.players)) {
        const dist = Math.sqrt(
            (player.x - bomb.x)**2 +
            (player.y - bomb.y)**2
        );

        if (dist <= bomb.radius && id !== bomb.owner) {
            await dealDamage(id, 2, bomb.owner);
        }
    }

    // 炸毀牆壁
    const cx = Math.floor(bomb.x);
    const cy = Math.floor(bomb.y);
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (gameState.maze[ny][nx] === 1) {
                gameState.maze[ny][nx] = 0; // 移除牆壁
            }
        }
    }

    // 視覺效果
    createExplosionEffect(bomb.x, bomb.y, bomb.radius);
    screenShake(10);
    SoundManager.play('explosion');

    // 移除炸彈
    gameState.bombs = gameState.bombs.filter(b => b !== bomb);
}
```

**C. 閃電鏈（能量豆獎勵）**
```javascript
觸發：收集能量豆自動施放
效果：攻擊最近3個敵人，每人1傷害
距離：最遠8格
無法防禦（除護盾外）

async function triggerLightningChain(playerId) {
    const player = gameState.players[playerId];

    // 找出最近的3個敵人
    const enemies = Object.entries(gameState.players)
        .filter(([id, p]) => id !== playerId)
        .map(([id, p]) => ({
            id,
            player: p,
            distance: Math.sqrt((p.x - player.x)**2 + (p.y - player.y)**2)
        }))
        .filter(e => e.distance <= 8)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);

    // 逐個攻擊
    for (const enemy of enemies) {
        await dealDamage(enemy.id, 1, playerId);

        // 視覺：電弧連接
        createLightningArc(player, enemy.player);
        await sleep(200); // 延遲200ms看清楚電弧
    }

    SoundManager.play('lightning');
}

function createLightningArc(from, to) {
    // Canvas繪製閃電
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();

    // 閃電效果（鋸齒線）
    const steps = 10;
    let x = from.x * CELL_SIZE;
    let y = from.y * CELL_SIZE;
    ctx.moveTo(x, y);

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        x = (from.x + (to.x - from.x) * t) * CELL_SIZE;
        y = (from.y + (to.y - from.y) * t) * CELL_SIZE;

        // 隨機偏移
        x += (Math.random() - 0.5) * 10;
        y += (Math.random() - 0.5) * 10;

        ctx.lineTo(x, y);
    }

    ctx.stroke();
}
```

**D. 旋風斬**
```javascript
按鍵：R
冷卻：30秒
效果：周圍1格範圍全部攻擊，擊退2格

async function whirlwindSlash(playerId) {
    const player = gameState.players[playerId];
    if (player.whirlwindCooldown > Date.now()) return;

    // 找出周圍1格內的所有敵人
    const targets = [];
    for (const [id, p] of Object.entries(gameState.players)) {
        if (id === playerId) continue;

        const dist = Math.sqrt((p.x - player.x)**2 + (p.y - player.y)**2);
        if (dist <= 1.5) { // 1格範圍（對角線約1.4）
            targets.push({ id, player: p, dist });
        }
    }

    // 攻擊並擊退
    for (const target of targets) {
        // 傷害
        await dealDamage(target.id, 1, playerId);

        // 擊退方向
        const dx = target.player.x - player.x;
        const dy = target.player.y - player.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length > 0) {
            const knockbackX = Math.round((dx / length) * 2);
            const knockbackY = Math.round((dy / length) * 2);

            // 應用擊退
            const newX = target.player.x + knockbackX;
            const newY = target.player.y + knockbackY;

            // 檢查新位置是否合法
            if (gameState.maze[newY][newX] !== 1) {
                target.player.x = newX;
                target.player.y = newY;
            }
        }
    }

    player.whirlwindCooldown = Date.now() + 30000;

    // 視覺效果：旋轉動畫
    createWhirlwindEffect(player);
    screenShake(5);
    SoundManager.play('whirlwind');
}
```

---

### 3. 🛡️ 防禦系統

#### 防禦方式清單

**A. 閃避翻滾（通用）**
```javascript
按鍵：Shift + 方向鍵
冷卻：3秒
效果：
- 快速移動2格
- 0.5秒無敵
- 可穿過敵人
- 穿牆消耗20分

function dodge(playerId, direction) {
    const player = gameState.players[playerId];
    if (player.dodgeCooldown > Date.now()) return;

    // 計算新位置
    const newX = player.x + direction.x * 2;
    const newY = player.y + direction.y * 2;

    // 檢查是否穿牆
    let wallPenalty = 0;
    if (gameState.maze[newY][newX] === 1) {
        wallPenalty = 20;
        if (player.score < 20) {
            showMessage('分數不足以穿牆！');
            return;
        }
    }

    // 應用移動
    player.x = newX;
    player.y = newY;
    player.score -= wallPenalty;

    // 無敵狀態
    player.isInvincible = true;
    player.dodgeAnimation = true;

    setTimeout(() => {
        player.isInvincible = false;
        player.dodgeAnimation = false;
    }, 500);

    player.dodgeCooldown = Date.now() + 3000;

    // 視覺效果
    createDodgeTrail(player);
    SoundManager.play('dodge');
}
```

**B. 分身術**
```javascript
按鍵：C
消耗：50分
冷卻：25秒
效果：創造3個假分身，持續10秒

function createClones(playerId) {
    const player = gameState.players[playerId];

    if (player.score < 50) {
        showMessage('分數不足！需要50分');
        return;
    }
    if (player.cloneCooldown > Date.now()) return;

    player.score -= 50;

    // 創建3個分身
    for (let i = 0; i < 3; i++) {
        const clone = {
            id: `clone_${playerId}_${i}`,
            x: player.x,
            y: player.y,
            color: player.color,
            name: player.name,
            isClone: true,
            owner: playerId,
            ai: new CloneAI()
        };

        gameState.clones.push(clone);

        // 分身AI：隨機移動
        clone.ai.start(clone);
    }

    player.cloneCooldown = Date.now() + 25000;

    // 10秒後移除
    setTimeout(() => {
        gameState.clones = gameState.clones.filter(c => c.owner !== playerId);
    }, 10000);

    SoundManager.play('clone');
}

class CloneAI {
    start(clone) {
        this.interval = setInterval(() => {
            // 隨機方向移動
            const directions = [
                {x: 0, y: -1}, {x: 0, y: 1},
                {x: -1, y: 0}, {x: 1, y: 0}
            ];

            const dir = directions[Math.floor(Math.random() * 4)];
            const newX = clone.x + dir.x;
            const newY = clone.y + dir.y;

            // 檢查碰撞
            if (gameState.maze[newY][newX] !== 1) {
                clone.x = newX;
                clone.y = newY;
            }
        }, 300); // 每0.3秒移動一次
    }

    stop() {
        clearInterval(this.interval);
    }
}
```

**C. 築牆術**
```javascript
按鍵：W
消耗：40分
冷卻：15秒
效果：建造3格牆壁，持續15秒

function buildWall(playerId) {
    const player = gameState.players[playerId];

    if (player.score < 40) {
        showMessage('分數不足！需要40分');
        return;
    }
    if (player.wallCooldown > Date.now()) return;

    // 檢查是否已有2堵牆
    const existingWalls = gameState.walls.filter(w => w.owner === playerId);
    if (existingWalls.length >= 2) {
        showMessage('最多同時存在2堵牆！');
        return;
    }

    player.score -= 40;

    const direction = player.facing;
    const wallBlocks = [];

    // 建造3格牆
    for (let i = 1; i <= 3; i++) {
        const wx = player.x + direction.x * i;
        const wy = player.y + direction.y * i;

        // 檢查位置是否合法
        if (gameState.maze[wy][wx] === 0 || gameState.maze[wy][wx] === 2) {
            wallBlocks.push({x: wx, y: wy});
            gameState.maze[wy][wx] = 5; // 臨時牆壁標記
        }
    }

    const wall = {
        id: `wall_${Date.now()}`,
        owner: playerId,
        blocks: wallBlocks,
        endTime: Date.now() + 15000
    };

    gameState.walls.push(wall);
    player.wallCooldown = Date.now() + 15000;

    // 視覺效果
    createWallEffect(wall);
    SoundManager.play('wall');

    // 15秒後移除
    setTimeout(() => {
        removeWall(wall);
    }, 15000);
}

function removeWall(wall) {
    wall.blocks.forEach(block => {
        if (gameState.maze[block.y][block.x] === 5) {
            gameState.maze[block.y][block.x] = 0;
        }
    });

    gameState.walls = gameState.walls.filter(w => w.id !== wall.id);
    removeWallEffect(wall);
}
```

**D. 隱形術**
```javascript
按鍵：F
消耗：60分
冷卻：40秒
效果：隱形5秒，收集豆子會顯示位置

function activateInvisibility(playerId) {
    const player = gameState.players[playerId];

    if (player.score < 60) {
        showMessage('分數不足！需要60分');
        return;
    }
    if (player.invisCooldown > Date.now()) return;

    player.score -= 60;
    player.isInvisible = true;
    player.invisEndTime = Date.now() + 5000;
    player.invisCooldown = Date.now() + 40000;

    // 視覺效果
    createInvisEffect(player);
    SoundManager.play('invisible');

    // 5秒後解除
    setTimeout(() => {
        player.isInvisible = false;
        removeInvisEffect(player);
    }, 5000);
}

// 修改繪製邏輯
function drawPlayers() {
    Object.entries(gameState.players).forEach(([id, player]) => {
        // 如果是其他玩家且隱形，跳過
        if (player.isInvisible && id !== currentPlayerId) {
            return;
        }

        // 如果是自己且隱形，半透明顯示
        if (player.isInvisible && id === currentPlayerId) {
            ctx.globalAlpha = 0.3;
        }

        // 正常繪製
        drawPlayer(player);

        ctx.globalAlpha = 1.0;
    });
}
```

---

### 4. 💫 特殊機制

#### A. 連擊系統
```javascript
let playerCombos = {}; // {playerId: {count, lastTime}}

function handleDotCollection(playerId) {
    const now = Date.now();

    if (!playerCombos[playerId]) {
        playerCombos[playerId] = {count: 0, lastTime: 0};
    }

    const combo = playerCombos[playerId];

    // 檢查是否在2秒內
    if (now - combo.lastTime < 2000) {
        combo.count++;
    } else {
        combo.count = 1;
    }

    combo.lastTime = now;

    // 觸發連擊獎勵
    if (combo.count === 3) {
        applyComboBonus(playerId, '3連擊！攻擊傷害+50%');
        gameState.players[playerId].damageBonus = 1.5;
    } else if (combo.count === 5) {
        applyComboBonus(playerId, '5連擊！移動速度+20%');
        gameState.players[playerId].speedBonus = 1.2;
    } else if (combo.count === 8) {
        applyComboBonus(playerId, '8連擊！技能冷卻減半');
        gameState.players[playerId].cooldownReduction = 0.5;
    } else if (combo.count === 10) {
        applyComboBonus(playerId, '10連擊！無敵1秒！');
        gameState.players[playerId].isInvincible = true;
        setTimeout(() => {
            gameState.players[playerId].isInvincible = false;
        }, 1000);
    }

    // 顯示連擊數
    if (combo.count >= 3) {
        showComboDisplay(playerId, combo.count);
    }
}

function showComboDisplay(playerId, count) {
    const player = gameState.players[playerId];

    const comboEl = document.createElement('div');
    comboEl.className = 'combo-display';
    comboEl.textContent = `${count}x COMBO!`;
    comboEl.style.left = `${player.x * CELL_SIZE}px`;
    comboEl.style.top = `${player.y * CELL_SIZE - 50}px`;

    document.body.appendChild(comboEl);

    SoundManager.play('combo');

    setTimeout(() => comboEl.remove(), 1000);
}

// 重置連擊（被攻擊時）
function resetCombo(playerId) {
    if (playerCombos[playerId]) {
        playerCombos[playerId].count = 0;
    }

    // 移除所有獎勵
    const player = gameState.players[playerId];
    player.damageBonus = 1;
    player.speedBonus = 1;
    player.cooldownReduction = 1;
}
```

#### B. 復仇機制
```javascript
let revengeTargets = {}; // {playerId: {target, killCount}}

async function handleKill(killerId, victimId) {
    // 記錄擊殺
    if (!revengeTargets[victimId]) {
        revengeTargets[victimId] = {};
    }

    if (!revengeTargets[victimId][killerId]) {
        revengeTargets[victimId][killerId] = 0;
    }

    revengeTargets[victimId][killerId]++;

    // 檢查是否觸發復仇模式
    if (revengeTargets[victimId][killerId] >= 2) {
        activateRevengeMode(victimId, killerId);
    }
}

function activateRevengeMode(playerId, targetId) {
    const player = gameState.players[playerId];

    player.revengeTarget = targetId;
    player.revengeDamageBonus = 2.0; // 對該玩家傷害x2

    // 視覺效果：紅色憤怒光環
    createRevengeAura(player);

    showMessage(`${player.name} 進入復仇模式！目標：${gameState.players[targetId].name}`);
    SoundManager.play('revenge');
}

// 修改傷害計算
function calculateDamage(damage, attackerId, targetId) {
    let finalDamage = damage;

    const attacker = gameState.players[attackerId];

    // 檢查復仇加成
    if (attacker.revengeTarget === targetId) {
        finalDamage *= attacker.revengeDamageBonus;
    }

    // 檢查連擊加成
    if (attacker.damageBonus) {
        finalDamage *= attacker.damageBonus;
    }

    return Math.ceil(finalDamage);
}

// 成功復仇後
async function successfulRevenge(playerId, targetId) {
    const player = gameState.players[playerId];

    // 獲得雙倍分數
    const bonus = (gameState.players[targetId].score || 0) * 0.5;
    player.score += bonus;

    // 解除復仇模式
    player.revengeTarget = null;
    player.revengeDamageBonus = 1;
    removeRevengeAura(player);

    // 重置擊殺記錄
    if (revengeTargets[playerId]) {
        revengeTargets[playerId][targetId] = 0;
    }

    showMessage(`${player.name} 復仇成功！獲得雙倍分數！`);
    SoundManager.play('revengeSuccess');
}
```

#### C. 生命系統
```javascript
// 初始化玩家時設定HP
function initializePlayer(player, roleType) {
    const roles = {
        attacker: { maxHp: 2, speed: 1.0 },
        defender: { maxHp: 4, speed: 0.8 },
        support: { maxHp: 3, speed: 1.2 }
    };

    const role = roles[roleType];
    player.maxHp = role.maxHp;
    player.hp = role.maxHp;
    player.baseSpeed = role.speed;
}

// 死亡處理
async function handleDeath(playerId, killerId) {
    const player = gameState.players[playerId];
    const killer = gameState.players[killerId];

    // 分數分配
    const lostScore = Math.floor((player.score || 0) * 0.5);
    player.score = (player.score || 0) - lostScore;

    // 擊殺者獲得50%
    const killerBonus = Math.floor(lostScore * 0.5);
    killer.score = (killer.score || 0) + killerBonus;
    killer.kills = (killer.kills || 0) + 1;

    // 其他玩家平分剩餘50%
    const otherPlayers = Object.keys(gameState.players).filter(
        id => id !== playerId && id !== killerId
    );
    const sharedScore = Math.floor(lostScore * 0.5 / otherPlayers.length);
    otherPlayers.forEach(id => {
        gameState.players[id].score = (gameState.players[id].score || 0) + sharedScore;
    });

    // 死亡狀態
    player.isDead = true;
    player.deathTime = Date.now();
    player.deaths = (player.deaths || 0) + 1;

    // 重置連擊
    resetCombo(playerId);

    // 視覺效果
    createDeathEffect(player);
    showKillFeed(killer.name, player.name);
    SoundManager.play('death');

    // 檢查復仇
    await handleKill(killerId, playerId);

    // 15秒後復活
    setTimeout(() => {
        respawnPlayer(playerId);
    }, 15000);
}

// 復活
function respawnPlayer(playerId) {
    const player = gameState.players[playerId];

    // 找到起始位置
    const spawnIndex = Object.keys(gameState.players).indexOf(playerId);
    const spawn = startPositions[spawnIndex % startPositions.length];

    player.x = spawn.x;
    player.y = spawn.y;
    player.hp = player.maxHp;
    player.isDead = false;
    player.isInvincible = true; // 3秒無敵

    setTimeout(() => {
        player.isInvincible = false;
    }, 3000);

    // 視覺效果
    createRespawnEffect(player);
    SoundManager.play('respawn');
}
```

---

### 5. 🎮 UI設計

#### 玩家HUD
```html
<!-- 左上角玩家狀態 -->
<div class="player-hud">
    <div class="hp-bar">
        <div class="hp-fill" style="width: 66%"></div>
        <span class="hp-text">❤️ 4/6</span>
    </div>

    <div class="skills-bar">
        <div class="skill-icon" data-cooldown="0">
            <img src="skill1.png">
            <div class="cooldown-overlay">5s</div>
        </div>
        <div class="skill-icon" data-cooldown="0">
            <img src="skill2.png">
            <span class="skill-cost">30分</span>
        </div>
    </div>
</div>
```

#### 技能冷卻顯示
```javascript
function updateSkillCooldowns() {
    const player = gameState.players[currentPlayerId];
    const now = Date.now();

    const skills = [
        {key: 'Space', cooldown: player.throwCooldown, element: 'skill-throw'},
        {key: 'Q', cooldown: player.bombCooldown, element: 'skill-bomb'},
        {key: 'E', cooldown: player.dashCooldown, element: 'skill-dash'},
        {key: 'R', cooldown: player.whirlwindCooldown, element: 'skill-whirlwind'}
    ];

    skills.forEach(skill => {
        const remaining = Math.max(0, (skill.cooldown - now) / 1000);
        const element = document.getElementById(skill.element);

        if (remaining > 0) {
            element.classList.add('on-cooldown');
            element.querySelector('.cooldown-text').textContent = `${Math.ceil(remaining)}s`;
        } else {
            element.classList.remove('on-cooldown');
            element.querySelector('.cooldown-text').textContent = 'Ready';
        }
    });
}

// 每幀更新
requestAnimationFrame(updateSkillCooldowns);
```

#### 玩家頭上信息
```javascript
function drawPlayerOverhead(player) {
    const x = player.x * CELL_SIZE + CELL_SIZE / 2;
    const y = player.y * CELL_SIZE - 30;

    // 名字
    ctx.fillStyle = player.color;
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(player.name, x, y);
    ctx.fillText(player.name, x, y);

    // HP條
    const hpBarWidth = 30;
    const hpBarHeight = 4;
    const hpPercent = player.hp / player.maxHp;

    // 背景
    ctx.fillStyle = '#000';
    ctx.fillRect(x - hpBarWidth/2, y + 5, hpBarWidth, hpBarHeight);

    // HP填充
    ctx.fillStyle = hpPercent > 0.5 ? '#00FF00' : (hpPercent > 0.25 ? '#FFFF00' : '#FF0000');
    ctx.fillRect(x - hpBarWidth/2, y + 5, hpBarWidth * hpPercent, hpBarHeight);

    // HP數字
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 8px Arial';
    ctx.fillText(`${player.hp}/${player.maxHp}`, x, y + 15);

    // 分數
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`${player.score}`, x, y + 25);
}
```

---

### 6. ⚖️ 平衡性數據

#### 傷害表
| 攻擊方式 | 基礎傷害 | 冷卻時間 | 消耗 | 射程/範圍 |
|---------|---------|---------|------|-----------|
| 投擲 | 1 HP | 5s | 0 | 5格直線 |
| 衝刺攻擊 | 1 HP | 10s | 0 | 3格直線 |
| 炸彈 | 2 HP | 20s | 30分 | 3x3範圍 |
| 閃電鏈 | 1 HP x3 | - | 能量豆 | 8格x3目標 |
| 旋風斬 | 1 HP + 擊退 | 30s | 0 | 周圍1格 |

#### 防禦能力表
| 防禦方式 | 效果 | 冷卻時間 | 消耗 | 持續時間 |
|---------|------|---------|------|----------|
| 閃避 | 無敵0.5s | 3s | 0(穿牆20) | 瞬間 |
| 護盾 | 免疫+反彈30% | 15s | 0 | 5s |
| 分身 | 3個假分身 | 25s | 50分 | 10s |
| 築牆 | 3格牆壁 | 15s | 40分 | 15s |
| 隱形 | 完全隱身 | 40s | 60分 | 5s |

#### 角色平衡
| 角色 | HP | 移速 | 優勢 | 劣勢 |
|------|-------|------|------|------|
| 攻擊型 | 2 | 100% | 高爆發、搶分快 | 脆皮、易死 |
| 防禦型 | 4 | 80% | 高生存、反彈傷害 | 慢速、追不上 |
| 輔助型 | 3 | 120% | 高機動、控場 | 中庸、需技巧 |

#### 克制關係
```
攻擊型 ─(爆發)→ 輔助型 ─(機動)→ 防禦型 ─(坦度)→ 攻擊型
```

---

### 7. 🎯 實作優先級

**核心（必須）**：
1. 角色選擇系統
2. 生命系統（HP）
3. 基礎攻擊（投擲）
4. 基礎防禦（閃避）
5. 傷害/死亡/復活機制

**重要（強烈建議）**：
6. 角色主動技能（衝刺/護盾/煙霧）
7. 炸彈系統
8. 連擊系統
9. UI顯示（HP條、技能冷卻）

**進階（提升體驗）**：
10. 復仇機制
11. 分身術
12. 築牆術
13. 隱形術
14. 閃電鏈
15. 旋風斬

---

## 🗺️ 關卡系統（補充）

### 10個精心設計的關卡

詳見獨立文檔：`LEVEL-DESIGN.md`

關卡將影響戰鬥策略：
- **競技場**：強化碰撞戰鬥
- **螺旋迷宮**：考驗突進技能
- **河流**：控橋權爭奪
- **閃電戰**：快節奏對決

---

**預計開發時間（更新）**：
- 階段一（核心循環）：2-3 小時
- 階段二（玩家互動）：2-3 小時
- 階段三（技術優化）：1-2 小時
- **階段四（戰鬥系統）**：**5-8 小時**
- 關卡系統：3-4 小時
- **總計**：**13-20 小時**（完整3A級實作）

**建議實作方式**：
分階段實作並測試，每個階段完成後提交一次，確保功能穩定。優先實作核心戰鬥功能，再逐步添加進階技能。
