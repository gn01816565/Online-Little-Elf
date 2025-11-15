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

**預計開發時間**：
- 階段一：2-3 小時
- 階段二：2-3 小時
- 階段三：1-2 小時
- **總計**：5-8 小時（完整實作）

**建議實作方式**：
分階段實作並測試，每個階段完成後提交一次，確保功能穩定。
