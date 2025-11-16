# 🎮 極簡版小精靈 - 3天開發計劃表

## 📅 總覽

**開發週期**：3天（每天 6-8 小時）
**目標**：完成可測試的極簡版多人小精靈遊戲
**測試日期**：第4天開始測試

---

## 📊 Day 1 - 核心玩法實作（6-8小時）

### 上午時段（4小時）

#### ✅ 任務 1：能量豆變身系統（2小時）
**目標**：實作吃到能量豆後的變身效果

**待辦事項**：
- [ ] 在地圖固定4個角落放置能量豆
- [ ] 實作玩家吃到能量豆的檢測
- [ ] 玩家進入「能量豆狀態」持續15秒
- [ ] 視覺效果：
  - [ ] 玩家變大（1.2倍）
  - [ ] 閃爍彩色光暈
  - [ ] 其他玩家看到時會顯示「逃跑」動畫（可選）
- [ ] 剩餘5秒警告（閃爍加快）

**程式碼位置**：
```javascript
// 在現有的 online-multiplayer-pacman-bilingual.html 中修改

// 1. 新增能量豆檢測
function checkPowerPellet(player) {
    // 檢查是否吃到能量豆
    // 設定 player.powerMode = true
    // 設定 player.powerEndTime = Date.now() + 15000
}

// 2. 繪製能量豆狀態
function drawPowerMode(player) {
    // 畫玩家時檢查 powerMode
    // 如果是 true，畫得更大 + 閃爍
}
```

**測試標準**：
- ✅ 吃到能量豆後玩家會變大變色
- ✅ 15秒後恢復正常
- ✅ 最後5秒有警告提示

---

#### ✅ 任務 2：碰撞搶分機制（2小時）
**目標**：實作玩家互相碰撞時的搶分

**待辦事項**：
- [ ] 檢測兩個玩家位置重疊
- [ ] 判斷搶分規則：
  - [ ] 普通狀態 vs 普通狀態：分數高者搶走20%
  - [ ] 能量豆狀態 vs 普通狀態：能量豆玩家搶走50%
  - [ ] 能量豆狀態 vs 能量豆狀態：不搶分（彈開）
- [ ] 顯示搶分動畫（分數飄字）
- [ ] 播放碰撞音效
- [ ] 更新 Firebase 中的分數

**程式碼位置**：
```javascript
// 碰撞檢測
function checkPlayerCollision() {
    const players = Object.values(gameState.players);

    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            if (players[i].x === players[j].x &&
                players[i].y === players[j].y) {
                handleCollision(players[i], players[j]);
            }
        }
    }
}

// 處理碰撞
function handleCollision(p1, p2) {
    // 根據狀態決定誰搶誰的分
    // 更新分數到 Firebase
    // 顯示飄字動畫
}
```

**測試標準**：
- ✅ 普通玩家碰到：分數高者搶20%
- ✅ 能量豆玩家碰到普通玩家：搶50%
- ✅ 有飄字動畫顯示「+XXX」
- ✅ 分數即時更新

---

### 下午時段（4小時）

#### ✅ 任務 3：3分鐘倒數計時（1.5小時）
**目標**：實作遊戲時間限制

**待辦事項**：
- [ ] 遊戲開始時設定 startTime
- [ ] 顯示倒數計時（格式：2:30）
- [ ] 每秒更新時間顯示
- [ ] 最後30秒警告：
  - [ ] 計時器變紅色
  - [ ] 背景音樂加快（可選）
  - [ ] 顯示「⚠️ 最後30秒！」
- [ ] 時間到自動結束遊戲

**程式碼位置**：
```javascript
// 計時器
let gameStartTime = 0;
const GAME_DURATION = 180000; // 3分鐘

function updateTimer() {
    const elapsed = Date.now() - gameStartTime;
    const remaining = GAME_DURATION - elapsed;

    if (remaining <= 0) {
        endGame();
        return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    document.getElementById('timer').textContent =
        `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // 最後30秒警告
    if (remaining <= 30000 && remaining > 29000) {
        showWarning();
    }
}
```

**UI設計**：
```html
<!-- 頂部中央顯示計時器 -->
<div class="game-timer">
    <span id="timer">3:00</span>
</div>

<style>
.game-timer {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 3em;
    font-weight: bold;
    color: #FFD700;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    z-index: 100;
}

.game-timer.warning {
    color: #FF0000;
    animation: pulse 1s infinite;
}
</style>
```

**測試標準**：
- ✅ 計時器從3:00開始倒數
- ✅ 最後30秒變紅色並閃爍
- ✅ 時間到遊戲自動結束

---

#### ✅ 任務 4：即時排名顯示（1.5小時）
**目標**：顯示目前前3名玩家

**待辦事項**：
- [ ] 計算所有玩家排名（依分數降序）
- [ ] 顯示前3名在右上角
- [ ] 高亮顯示自己的排名
- [ ] 每秒更新排名

**UI設計**：
```html
<!-- 右上角排名面板 -->
<div class="ranking-panel">
    <h4>🏆 即時排名</h4>
    <div class="rank-item rank-1">
        🥇 <span class="player-name">玩家A</span>
        <span class="score">2500</span>
    </div>
    <div class="rank-item rank-2">
        🥈 <span class="player-name">玩家B</span>
        <span class="score">2100</span>
    </div>
    <div class="rank-item rank-3 my-rank">
        🥉 <span class="player-name">你</span>
        <span class="score">1800</span>
    </div>
</div>

<style>
.ranking-panel {
    position: fixed;
    top: 100px;
    right: 20px;
    background: rgba(0,0,0,0.8);
    padding: 15px;
    border-radius: 10px;
    min-width: 200px;
}

.rank-item {
    color: white;
    padding: 8px;
    margin: 5px 0;
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
}

.my-rank {
    background: rgba(255,215,0,0.3);
    border: 2px solid #FFD700;
}
</style>
```

**測試標準**：
- ✅ 顯示前3名玩家
- ✅ 自己的排名會高亮
- ✅ 分數變化時排名即時更新

---

#### ✅ 任務 5：基礎測試（1小時）
**待辦事項**：
- [ ] 自己測試所有功能
- [ ] 檢查是否有明顯Bug
- [ ] 記錄問題清單
- [ ] 快速修正嚴重Bug

---

## 📊 Day 2 - UI與音效（6-8小時）

### 上午時段（4小時）

#### ✅ 任務 6：結算畫面（2.5小時）
**目標**：遊戲結束後顯示完整排名

**待辦事項**：
- [ ] 時間到時停止遊戲
- [ ] 計算最終排名（所有玩家）
- [ ] 顯示結算畫面：
  - [ ] 冠軍特寫（大字顯示）
  - [ ] 前3名獎牌（🥇🥈🥉）
  - [ ] 完整排名列表（1-10名）
  - [ ] 自己的排名高亮
  - [ ] 數據統計（收集豆子數、碰撞次數等）
- [ ] 按鈕：「再來一局」「返回大廳」
- [ ] 15秒後自動返回大廳

**UI設計**：
```html
<div class="result-screen">
    <div class="result-container">
        <h1>🏆 遊戲結束 🏆</h1>

        <!-- 冠軍特寫 -->
        <div class="winner-section">
            <div class="winner-badge">冠軍</div>
            <h2 class="winner-name">玩家A</h2>
            <p class="winner-score">3200 分</p>
        </div>

        <!-- 前三名 -->
        <div class="top-three">
            <div class="podium">
                <div class="podium-2">🥈 玩家B<br>2800</div>
                <div class="podium-1">🥇 玩家A<br>3200</div>
                <div class="podium-3">🥉 玩家C<br>2400</div>
            </div>
        </div>

        <!-- 完整排名 -->
        <div class="full-ranking">
            <!-- 動態生成1-10名 -->
        </div>

        <div class="result-actions">
            <button onclick="playAgain()">再來一局</button>
            <button onclick="returnToLobby()">返回大廳</button>
        </div>

        <p class="countdown">15秒後自動返回</p>
    </div>
</div>
```

**CSS設計**：
```css
.result-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.podium {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 20px;
    margin: 30px 0;
}

.podium-1 {
    height: 150px;
    width: 120px;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    order: 2;
}

.podium-2 {
    height: 120px;
    width: 100px;
    background: linear-gradient(135deg, #C0C0C0, #808080);
    order: 1;
}

.podium-3 {
    height: 90px;
    width: 100px;
    background: linear-gradient(135deg, #CD7F32, #8B4513);
    order: 3;
}
```

**測試標準**：
- ✅ 時間到顯示結算畫面
- ✅ 冠軍名字和分數正確
- ✅ 前3名有獎牌顯示
- ✅ 可以再玩一局或返回大廳

---

#### ✅ 任務 7：音效系統（1.5小時）
**目標**：加入8個必要音效

**待辦事項**：
- [ ] 準備8個音效檔案（可用免費音效庫）：
  1. [ ] 吃豆子：wakawaka.mp3
  2. [ ] 吃能量豆：powerup.mp3
  3. [ ] 碰撞：collision.mp3
  4. [ ] 得分：score.mp3
  5. [ ] 警告（能量豆快結束）：warning.mp3
  6. [ ] 倒數計時：countdown.mp3
  7. [ ] 遊戲結束：gameover.mp3
  8. [ ] 勝利：victory.mp3

- [ ] 實作音效管理器：
```javascript
const sounds = {
    eatDot: new Audio('sounds/wakawaka.mp3'),
    powerUp: new Audio('sounds/powerup.mp3'),
    collision: new Audio('sounds/collision.mp3'),
    score: new Audio('sounds/score.mp3'),
    warning: new Audio('sounds/warning.mp3'),
    countdown: new Audio('sounds/countdown.mp3'),
    gameOver: new Audio('sounds/gameover.mp3'),
    victory: new Audio('sounds/victory.mp3')
};

function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => {
            console.log('音效播放失敗', e);
        });
    }
}
```

- [ ] 整合到遊戲各處：
  - [ ] 吃豆子時播放
  - [ ] 吃能量豆時播放
  - [ ] 碰撞時播放
  - [ ] 警告時播放
  - [ ] 遊戲結束時播放

**免費音效資源**：
- Freesound.org
- Zapsplat.com
- Mixkit.co

**測試標準**：
- ✅ 各種動作都有對應音效
- ✅ 音效不會重疊混亂
- ✅ 音量適中

---

### 下午時段（4小時）

#### ✅ 任務 8：UI優化與視覺特效（2小時）
**目標**：讓遊戲畫面更美觀

**待辦事項**：
- [ ] 優化玩家顯示：
  - [ ] 普通狀態：金黃色小精靈
  - [ ] 能量豆狀態：彩色閃爍 + 變大
  - [ ] 玩家名字顯示在頭上

- [ ] 特效動畫：
  - [ ] 吃豆子消失動畫
  - [ ] 分數飄字（+10, +50, +500...）
  - [ ] 碰撞震動效果
  - [ ] 能量豆閃爍動畫

- [ ] UI元素優化：
  - [ ] 計時器樣式美化
  - [ ] 排名面板美化
  - [ ] 按鈕 hover 效果
  - [ ] 過場動畫

**特效範例**：
```javascript
// 分數飄字動畫
function showFloatingScore(x, y, score) {
    const element = document.createElement('div');
    element.className = 'floating-score';
    element.textContent = `+${score}`;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;

    document.body.appendChild(element);

    setTimeout(() => element.remove(), 1000);
}
```

```css
.floating-score {
    position: absolute;
    color: #FFD700;
    font-size: 2em;
    font-weight: bold;
    pointer-events: none;
    animation: float-up 1s ease-out;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

@keyframes float-up {
    0% {
        opacity: 1;
        transform: translateY(0);
    }
    100% {
        opacity: 0;
        transform: translateY(-50px);
    }
}
```

**測試標準**：
- ✅ 動畫流暢不卡頓
- ✅ 視覺效果清晰易懂
- ✅ 顏色對比度好，易辨識

---

#### ✅ 任務 9：背景音樂（可選，1小時）
**待辦事項**：
- [ ] 找2首背景音樂：
  1. 遊戲中 BGM（輕快）
  2. 最後30秒 BGM（緊張）
- [ ] 實作背景音樂播放器
- [ ] 加入音量控制
- [ ] 加入靜音按鈕

**測試標準**：
- ✅ BGM循環播放
- ✅ 最後30秒音樂自動切換
- ✅ 可以靜音

---

#### ✅ 任務 10：整體測試（1小時）
**待辦事項**：
- [ ] 完整玩一局遊戲
- [ ] 檢查所有功能正常
- [ ] 記錄Bug清單
- [ ] 修正嚴重Bug

---

## 📊 Day 3 - 完成與測試（6-8小時）

### 上午時段（4小時）

#### ✅ 任務 11：雙語系統整合（2小時）
**目標**：整合繁體中文/英文切換

**待辦事項**：
- [ ] 整合已有的雙語系統
- [ ] 翻譯所有新增的文字：
  - [ ] 遊戲中提示
  - [ ] 結算畫面
  - [ ] 按鈕文字
  - [ ] 計時器標籤

- [ ] 測試兩種語言都正常顯示
- [ ] 確保切換語言時即時更新

**翻譯對照表**：
```javascript
const newTranslations = {
    zh: {
        gameTimer: '剩餘時間',
        lastWarning: '⚠️ 最後30秒！',
        gameEnd: '遊戲結束',
        winner: '冠軍',
        yourRank: '你的排名',
        playAgain: '再來一局',
        powerMode: '能量爆發！',
        scoreStolen: '搶到 {score} 分！',
        // ...
    },
    en: {
        gameTimer: 'Time Left',
        lastWarning: '⚠️ Last 30 Seconds!',
        gameEnd: 'Game Over',
        winner: 'Winner',
        yourRank: 'Your Rank',
        playAgain: 'Play Again',
        powerMode: 'Power Mode!',
        scoreStolen: 'Stole {score} Points!',
        // ...
    }
}
```

**測試標準**：
- ✅ 繁中/英文都能正常顯示
- ✅ 切換語言即時生效
- ✅ 沒有遺漏的翻譯

---

#### ✅ 任務 12：Bug 修正（2小時）
**待辦事項**：
- [ ] 檢查 Day 1-2 的 Bug 清單
- [ ] 逐一修正所有 Bug
- [ ] 優先修正：
  - [ ] 遊戲無法開始
  - [ ] 分數計算錯誤
  - [ ] 碰撞檢測失效
  - [ ] 計時器不準
  - [ ] 結算畫面顯示錯誤

**測試方法**：
```
1. 開啟瀏覽器 Console (F12)
2. 檢查是否有錯誤訊息
3. 記錄錯誤位置
4. 修正程式碼
5. 重新測試
```

---

### 下午時段（4小時）

#### ✅ 任務 13：效能優化（1.5小時）
**目標**：確保遊戲流暢運行

**待辦事項**：
- [ ] 檢查 FPS（目標：60fps）
- [ ] 優化遊戲迴圈：
  - [ ] 減少不必要的重繪
  - [ ] 只更新改變的部分
  - [ ] 使用 requestAnimationFrame

- [ ] 優化 Firebase 同步：
  - [ ] 減少寫入頻率（節流）
  - [ ] 只同步必要數據
  - [ ] 使用批次更新

```javascript
// 節流函數（限制更新頻率）
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 使用節流
const updatePlayerPosition = throttle((x, y) => {
    database.ref(`rooms/${roomId}/players/${playerId}`).update({x, y});
}, 100); // 每100ms最多更新一次
```

**測試標準**：
- ✅ 遊戲運行流暢，無卡頓
- ✅ 10人同時在線也穩定
- ✅ 網路延遲在可接受範圍

---

#### ✅ 任務 14：完整測試（2小時）
**目標**：模擬真實10人遊戲場景

**待辦事項**：
- [ ] 找3-5位朋友協助測試
- [ ] 每人用不同裝置（電腦、手機、平板）
- [ ] 測試項目：
  - [ ] 建立房間
  - [ ] 加入房間
  - [ ] 遊戲流程完整跑一遍
  - [ ] 各種功能都測試
  - [ ] 記錄任何問題

**測試檢查表**：
```
□ 可以建立房間
□ 可以用代碼加入
□ 玩家列表正確顯示
□ 可以開始遊戲
□ 計時器正常倒數
□ 可以收集豆子
□ 吃能量豆會變身
□ 碰撞會搶分
□ 分數即時更新
□ 排名正確顯示
□ 時間到遊戲結束
□ 結算畫面正確
□ 可以再玩一局
□ 可以返回大廳
□ 音效正常播放
□ 繁中/英文都正常
```

---

#### ✅ 任務 15：最終調整與打包（30分鐘）
**待辦事項**：
- [ ] 根據測試反饋做最後調整
- [ ] 清理 Console.log（移除除錯訊息）
- [ ] 確認 Firebase 配置指示清楚
- [ ] 寫 README 使用說明
- [ ] 準備部署

**README 內容**：
```markdown
# 線上多人小精靈 - 極簡版

## 遊戲玩法
10個人在迷宮中：
- 收集小豆子（10分）
- 搶能量豆（50分 + 變身15秒）
- 碰撞搶分（普通20%，能量豆50%）
- 3分鐘後分數最高獲勝

## 快速開始
1. 配置 Firebase（見 FIREBASE-SETUP-README.md）
2. 用瀏覽器開啟 HTML 檔案
3. 建立房間或輸入代碼加入
4. 邀請朋友一起玩！

## 操作方式
- 移動：方向鍵 ↑↓←→ 或 WASD
- 目標：吃豆子、搶能量豆、碰撞搶分

## 技術需求
- 現代瀏覽器（Chrome、Firefox、Edge）
- 穩定網路連線
- Firebase 帳號（免費）
```

---

## 📊 Day 4-5 - 測試週（選做）

### 測試階段
- [ ] 邀請10位朋友測試
- [ ] 收集反饋意見
- [ ] 記錄問題清單
- [ ] 評估調整優先級

### 調整階段
- [ ] 修正嚴重Bug
- [ ] 平衡性調整（搶分比例、時間等）
- [ ] UI/UX 微調
- [ ] 效能優化

---

## 📋 完成檢查清單

### 核心功能
- [ ] ✅ 能量豆變身（15秒）
- [ ] ✅ 碰撞搶分（20% / 50%）
- [ ] ✅ 3分鐘計時
- [ ] ✅ 最後30秒警告
- [ ] ✅ 即時排名顯示
- [ ] ✅ 結算畫面

### UI/UX
- [ ] ✅ 計時器顯示
- [ ] ✅ 排名面板
- [ ] ✅ 分數飄字動畫
- [ ] ✅ 能量豆閃爍效果
- [ ] ✅ 結算畫面美化
- [ ] ✅ 按鈕樣式優化

### 音效
- [ ] ✅ 8個基礎音效
- [ ] ✅ 背景音樂（可選）
- [ ] ✅ 音量控制

### 雙語
- [ ] ✅ 繁體中文完整
- [ ] ✅ 英文完整
- [ ] ✅ 語言切換功能

### 測試
- [ ] ✅ 單人測試通過
- [ ] ✅ 多人測試通過（3-5人）
- [ ] ✅ 10人測試通過
- [ ] ✅ 無嚴重Bug

### 文件
- [ ] ✅ README 完成
- [ ] ✅ Firebase 設定說明
- [ ] ✅ 使用說明

---

## 🎯 成功標準

### 遊戲品質
```
✅ 5秒內理解玩法
✅ 遊戲流暢不卡頓
✅ 10人同時遊玩穩定
✅ 視覺效果清晰
✅ 音效不刺耳
✅ 繁中英文都正常
```

### 玩家反饋（測試時詢問）
```
問題1：「你知道怎麼玩嗎？」
期望：100% 回答「知道」

問題2：「好玩嗎？」
期望：80%+ 回答「好玩」

問題3：「想再玩一局嗎？」
期望：80%+ 回答「想」

問題4：「會推薦給朋友嗎？」
期望：70%+ 回答「會」
```

---

## 📞 緊急聯絡與支援

### 遇到問題時
1. 檢查瀏覽器 Console（F12）
2. 查看錯誤訊息
3. 檢查 Firebase 連線狀態
4. 確認網路連線正常

### 常見問題
**Q: 按鈕點不了？**
A: 確認不是在 Claude Artifact 中運行，要用瀏覽器直接開啟檔案

**Q: Firebase 錯誤？**
A: 檢查配置是否正確，Realtime Database 是否已啟用

**Q: 其他玩家看不到？**
A: 確認房間代碼正確，網路連線正常

---

## 🎉 完成後

### 部署選項
1. **本地使用**：直接開啟 HTML 檔案
2. **Firebase Hosting**：免費託管
3. **GitHub Pages**：免費託管
4. **Netlify/Vercel**：免費託管

### 下一步
- [ ] 收集玩家反饋
- [ ] 決定是否加入更多功能
- [ ] 考慮加入 AI 幽靈（如果需要）
- [ ] 考慮新增其他遊戲模式

---

## 💡 溫馨提醒

**保持簡單**：如果某個功能太複雜，先跳過，之後再加
**專注核心**：確保「吃豆子、搶能量豆、碰撞搶分」好玩
**快速迭代**：做出來→測試→調整→再測試
**收集反饋**：朋友的意見很重要

**3天後，你會有一個可以玩的遊戲！** 🎮✨

---

**準備好了嗎？明天就開始 Day 1！** 🚀
