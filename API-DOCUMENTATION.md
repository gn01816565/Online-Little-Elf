# 📚 API 文檔

## 目錄

- [核心函數](#核心函數)
- [Firebase 資料結構](#firebase-資料結構)
- [事件系統](#事件系統)
- [常數與配置](#常數與配置)
- [工具函數](#工具函數)

---

## 核心函數

### 房間管理

#### `generateRoomCode()`

生成 6 位數房間代碼。

**語法**：
```javascript
function generateRoomCode(): string
```

**返回值**：
- `string` - 6 位數的大寫字母和數字組合（例如：`ABC123`）

**範例**：
```javascript
const roomCode = generateRoomCode();
console.log(roomCode); // 'K3X9M7'
```

---

#### `createRoom()`

建立新的遊戲房間。

**語法**：
```javascript
async function createRoom(): Promise<void>
```

**前置條件**：
- 用戶已輸入暱稱
- Firebase 已初始化（或進入演示模式）

**流程**：
1. 驗證暱稱
2. 生成房間代碼
3. 創建房間數據
4. 加入房主玩家
5. 設定斷線處理
6. 切換到等待室

**Firebase 寫入**：
```
rooms/{roomId}/
  ├─ code: string
  ├─ status: 'waiting'
  ├─ createdAt: number
  ├─ host: playerId
  ├─ maxPlayers: 10
  └─ players/{playerId}/
      ├─ name: string
      ├─ color: string
      ├─ score: 0
      ├─ x: number
      ├─ y: number
      └─ joinedAt: number
```

**錯誤處理**：
- 暱稱為空 → Alert 提示
- Firebase 未配置 → 演示模式 Alert
- 其他錯誤 → Console.error

---

#### `joinRoom()`

加入現有遊戲房間。

**語法**：
```javascript
async function joinRoom(): Promise<void>
```

**前置條件**：
- 用戶已輸入暱稱和房間代碼
- Firebase 已初始化

**驗證**：
- 房間是否存在
- 房間是否已滿（< 10 人）
- 遊戲是否已開始

**錯誤訊息**：
| 錯誤情況 | 訊息 |
|---------|------|
| 暱稱為空 | `請輸入你的暱稱` |
| 房間代碼錯誤 | `請輸入正確的6位數房間代碼` |
| 房間不存在 | `房間不存在，請檢查房間代碼` |
| 房間已滿 | `房間已滿 (最多10位玩家)` |
| 遊戲已開始 | `遊戲已經開始，無法加入` |

---

#### `startGame()`

啟動遊戲（僅房主）。

**語法**：
```javascript
async function startGame(): Promise<void>
```

**權限**：
- 只有房主（`isHost === true`）可以呼叫

**前置條件**：
- 至少 2 位玩家
- Firebase 已配置

**流程**：
1. 生成迷宮（`generateMaze()`）
2. 更新房間狀態為 `'playing'`
3. 記錄遊戲開始時間
4. 觸發所有玩家進入遊戲畫面

**Firebase 更新**：
```javascript
rooms/{roomId}/
  ├─ status: 'playing'
  ├─ maze: Array<Array<number>>
  └─ startedAt: number (Date.now())
```

---

#### `leaveRoom()`

離開房間。

**語法**：
```javascript
async function leaveRoom(): Promise<void>
```

**流程**：
1. 刪除玩家數據
2. 重新載入頁面

**Firebase 刪除**：
```
rooms/{roomId}/players/{currentPlayerId}
```

**特殊情況**：
- 房主離開 → 房間可能被解散（取決於 Firebase 規則）
- 最後一人離開 → 房間保留直到清理機制觸發

---

### 遊戲邏輯

#### `generateMaze()`

生成遊戲迷宮。

**語法**：
```javascript
function generateMaze(): Array<Array<number>>
```

**返回值**：
- `Array<Array<number>>` - 50 × 40 的二維陣列

**地圖元素**：
| 值 | 類型 | 說明 |
|----|------|------|
| `0` | 空地 | 可通行 |
| `1` | 牆壁 | 不可通行 |
| `2` | 小豆子 | +10 分 |
| `3` | 能量豆 | +50 分，15 秒變身 |

**生成邏輯**：
1. 建立邊界牆（地圖四周）
2. 隨機生成內部牆壁（12% 概率，網格狀分布）
3. 放置小豆子（65% 概率）
4. 清空玩家起始位置周圍（5×5 區域）
5. 固定放置 4 個能量豆在地圖四角
6. 清空能量豆周圍區域（3×3 區域）

**能量豆位置**：
```javascript
const powerPelletPositions = [
    { x: 5, y: 5 },           // 左上角
    { x: 44, y: 5 },          // 右上角
    { x: 5, y: 34 },          // 左下角
    { x: 44, y: 34 }          // 右下角
];
```

**範例輸出**：
```javascript
[
  [1, 1, 1, 1, 1, ...], // 第 0 行（邊界牆）
  [1, 2, 2, 0, 2, ...], // 第 1 行
  [1, 2, 1, 2, 2, ...], // 第 2 行
  ...
]
```

---

#### `checkCollision(myX, myY)`

檢查玩家碰撞並執行搶分。

**語法**：
```javascript
async function checkCollision(myX: number, myY: number): Promise<void>
```

**參數**：
- `myX` - 自己的 X 座標
- `myY` - 自己的 Y 座標

**碰撞條件**：
```javascript
const distance = Math.abs(myX - otherX) + Math.abs(myY - otherY);
if (distance <= 1) {
    // 觸發碰撞
}
```

**搶分規則**：

| 情況 | 搶分比例 | 計算公式 |
|-----|---------|---------|
| 能量豆 vs 普通 | 50% | `Math.floor(victim.score * 0.5)` |
| 普通 vs 普通（分數高） | 20% | `Math.floor(victim.score * 0.2)` |
| 能量豆 vs 能量豆 | 0% | 彈開，不搶分 |

**碰撞冷卻**：
- 同一對玩家 1 秒內只能碰撞一次
- 使用 `lastCollisionTime` 追蹤

**避免重複處理**：
```javascript
if (currentPlayerId > otherId) {
    // 只讓 ID 較小的玩家處理碰撞
    continue;
}
```

**範例**：
```javascript
// 玩家 A（能量豆狀態）：100 分
// 玩家 B（普通狀態）：200 分
// 碰撞後：
// 玩家 A：100 + 100 = 200 分
// 玩家 B：200 - 100 = 100 分
```

---

#### `gameLoop()`

主遊戲迴圈（60 FPS）。

**語法**：
```javascript
function gameLoop(): void
```

**執行頻率**：
- 約 60 FPS（使用 `requestAnimationFrame`）

**流程**：
1. 計算剩餘時間
2. 檢查遊戲是否結束
3. 播放倒數音效（最後 30 秒）
4. 清除過期的能量豆狀態
5. 清空 Canvas
6. 繪製迷宮
7. 繪製玩家
8. 繪製計時器
9. 繪製即時排名
10. 繪製飄字動畫
11. 請求下一幀

**計時邏輯**：
```javascript
const GAME_DURATION = 180 * 1000; // 3 分鐘
const elapsed = now - gameState.startedAt;
const remaining = Math.max(0, GAME_DURATION - elapsed);
const remainingSeconds = Math.ceil(remaining / 1000);
```

---

#### `showGameResults()`

顯示遊戲結算畫面。

**語法**：
```javascript
function showGameResults(): void
```

**流程**：
1. 播放遊戲結束音效
2. 停止遊戲迴圈
3. 計算排名
4. 繪製結算畫面
5. 15 秒後自動返回大廳
6. 20 秒後清理房間數據（僅房主）

**排名計算**：
```javascript
const rankings = Object.entries(finalPlayers)
    .map(([id, player]) => ({
        id,
        name: player.name,
        color: player.color,
        score: player.score || 0
    }))
    .sort((a, b) => b.score - a.score);
```

**房間清理**：
```javascript
if (isHost && database && roomIdToClean) {
    setTimeout(async () => {
        await database.ref(`rooms/${roomIdToClean}`).remove();
    }, 20000);
}
```

---

### 控制系統

#### `setupKeyboardControls()`

設定鍵盤控制。

**語法**：
```javascript
function setupKeyboardControls(): void
```

**支援按鍵**：
| 按鍵 | 方向 |
|-----|------|
| `↑` 或 `W` | 上 |
| `↓` 或 `S` | 下 |
| `←` 或 `A` | 左 |
| `→` 或 `D` | 右 |

**移動延遲**：
- 120ms（防止過快移動）

**流程**：
1. 檢查按鍵
2. 計算新位置
3. 檢查邊界和牆壁
4. 檢查豆子
5. 更新 Firebase
6. 檢查碰撞

**防止重複監聽**：
```javascript
let keyboardListenerAdded = false;
```

---

### 音效系統

#### `soundEatDot()`

播放吃小豆子音效。

**語法**：
```javascript
function soundEatDot(): void
```

**音效參數**：
- 類型：Square wave
- 頻率：800 Hz
- 持續時間：0.05 秒
- 音量：0.15

---

#### `soundEatPowerPellet()`

播放吃能量豆音效。

**語法**：
```javascript
function soundEatPowerPellet(): void
```

**音效參數**：
- 類型：Triangle wave
- 音階：C-E-G-C (523, 659, 784, 1047 Hz)
- 持續時間：每個音符 0.2 秒
- 音量：0.25

---

#### `soundPowerMode()`

播放進入能量模式音效。

**語法**：
```javascript
function soundPowerMode(): void
```

**音效參數**：
- 類型：Sawtooth wave
- 頻率：200-1000 Hz（上升音階）
- 音符數量：10 個
- 持續時間：每個 0.1 秒

---

#### `soundCollision()`

播放碰撞音效。

**語法**：
```javascript
function soundCollision(): void
```

**音效參數**：
- 類型：Sawtooth wave
- 頻率：150 Hz → 50 Hz（下降）
- 持續時間：0.1 秒
- 音量：0.3

---

#### `soundScore()`

播放得分音效。

**語法**：
```javascript
function soundScore(): void
```

**音效參數**：
- 類型：Sine wave
- 頻率：1200 Hz
- 持續時間：0.15 秒
- 音量：0.2

---

#### `soundPowerWarning()`

播放能量豆即將結束警告音。

**語法**：
```javascript
function soundPowerWarning(): void
```

**音效參數**：
- 類型：Square wave
- 頻率：600 Hz
- 重複：3 次
- 持續時間：每次 0.08 秒
- 音量：0.15

---

#### `soundTick()`

播放遊戲倒數音效。

**語法**：
```javascript
function soundTick(): void
```

**音效參數**：
- 類型：Square wave
- 頻率：800 Hz
- 持續時間：0.05 秒
- 音量：0.15

**觸發時機**：
- 最後 30 秒，每秒播放一次

---

#### `soundGameEnd()`

播放遊戲結束音效。

**語法**：
```javascript
function soundGameEnd(): void
```

**音效參數**：
- 類型：Sine wave
- 音階：C-E-G-C-G-C-E (523, 659, 784, 1047, 784, 1047, 1319 Hz)
- 持續時間：每個音符 0.3 秒
- 音量：0.25

---

### 雙語系統

#### `t(key)`

取得翻譯文字。

**語法**：
```javascript
function t(key: string): string
```

**參數**：
- `key` - 翻譯鍵值（例如：`'alertEnterNickname'`）

**返回值**：
- `string` - 當前語言的翻譯文字

**範例**：
```javascript
const text = t('btnCreate');
// 繁中：'🎯 建立遊戲房間'
// 英文：'🎯 Create Game Room'
```

---

#### `toggleLanguage()`

切換語言。

**語法**：
```javascript
function toggleLanguage(): void
```

**流程**：
1. 切換 `currentLanguage`（'zh-TW' ⇄ 'en'）
2. 儲存到 localStorage
3. 更新所有 UI 文字

**儲存**：
```javascript
localStorage.setItem('gameLanguage', currentLanguage);
```

---

#### `updateUILanguage()`

更新所有 UI 文字。

**語法**：
```javascript
function updateUILanguage(): void
```

**更新範圍**：
- 頁面標題
- 按鈕文字
- 標籤文字
- Placeholder
- 音效按鈕
- 語言切換按鈕

---

## Firebase 資料結構

### 房間數據

```typescript
interface Room {
    code: string;                  // 房間代碼（6 位數）
    status: 'waiting' | 'playing' | 'finished';
    createdAt: number;             // 建立時間戳
    host: string;                  // 房主玩家 ID
    maxPlayers: number;            // 最大玩家數（10）
    startedAt?: number;            // 遊戲開始時間戳
    finishedAt?: number;           // 遊戲結束時間戳
    maze?: number[][];             // 迷宮數據（只在遊戲中）
    players: {
        [playerId: string]: Player;
    };
}
```

### 玩家數據

```typescript
interface Player {
    name: string;                  // 暱稱
    color: string;                 // 顏色（Hex）
    score: number;                 // 分數
    x: number;                     // X 座標
    y: number;                     // Y 座標
    joinedAt: number;              // 加入時間戳
    powerMode?: boolean;           // 是否在能量豆狀態
    powerEndTime?: number;         // 能量豆結束時間戳
}
```

### Firebase 路徑

```
/rooms
  /{roomId}
    /code
    /status
    /createdAt
    /host
    /maxPlayers
    /startedAt (optional)
    /finishedAt (optional)
    /maze (optional)
    /players
      /{playerId}
        /name
        /color
        /score
        /x
        /y
        /joinedAt
        /powerMode (optional)
        /powerEndTime (optional)
```

---

## 事件系統

### Firebase 監聽

#### 房間狀態變化

```javascript
roomRef.on('value', (snapshot) => {
    const data = snapshot.val();
    // 處理房間數據更新
});
```

**觸發時機**：
- 玩家加入/離開
- 遊戲狀態變化
- 玩家移動
- 分數更新

---

#### 斷線處理

```javascript
playerRef.onDisconnect().remove();
```

**行為**：
- 玩家斷線時自動刪除玩家數據
- 其他玩家會看到該玩家離開

---

### 鍵盤事件

```javascript
document.addEventListener('keydown', async (e) => {
    // 處理按鍵
});
```

**事件處理**：
- 防止重複觸發（120ms 延遲）
- 檢查遊戲狀態
- 更新玩家位置
- 檢查豆子和碰撞

---

## 常數與配置

### 遊戲常數

```javascript
const CELL_SIZE = 20;              // 格子大小（像素）
const COLS = 50;                   // 地圖寬度（格）
const ROWS = 40;                   // 地圖高度（格）
const GAME_DURATION = 180000;      // 遊戲時長（毫秒）
const COLLISION_COOLDOWN = 1000;   // 碰撞冷卻（毫秒）
```

### Canvas 尺寸

```javascript
canvas.width = 1000;               // 50 * 20
canvas.height = 800;               // 40 * 20
```

### 玩家顏色

```javascript
const playerColors = [
    '#FFD700',  // 金黃色
    '#FF69B4',  // 粉紅色
    '#00CED1',  // 青藍色
    '#32CD32',  // 綠色
    '#FF6347',  // 番茄紅
    '#9370DB',  // 紫色
    '#FFA500',  // 橙色
    '#00FA9A',  // 中綠色
    '#FF1493',  // 深粉色
    '#4169E1'   // 皇家藍
];
```

### 起始位置

```javascript
const startPositions = [
    { x: 2, y: 2 },                 // 左上
    { x: COLS - 3, y: 2 },          // 右上
    { x: 2, y: ROWS - 3 },          // 左下
    { x: COLS - 3, y: ROWS - 3 },   // 右下
    { x: COLS / 2, y: 2 },          // 上中
    { x: COLS / 2, y: ROWS - 3 },   // 下中
    { x: 2, y: ROWS / 2 },          // 左中
    { x: COLS - 3, y: ROWS / 2 },   // 右中
    { x: COLS / 4, y: ROWS / 4 },   // 左上內
    { x: COLS * 3/4, y: ROWS * 3/4 } // 右下內
];
```

---

## 工具函數

### `showScoreFloating(x, y, text, color)`

顯示分數飄字動畫。

**語法**：
```javascript
function showScoreFloating(
    x: number,
    y: number,
    text: string,
    color: string
): void
```

**參數**：
- `x` - X 座標（格）
- `y` - Y 座標（格）
- `text` - 飄字內容（例如：`'+10'`, `'-50'`）
- `color` - 顏色（Hex，例如：`'#00FF00'`, `'#FF0000'`）

**動畫效果**：
- 向上飄動（每幀 -0.5 像素）
- 淡出效果（1.5 秒內從 1.0 → 0.0）
- 自動移除

---

### `updateInfoPanel(players)`

更新玩家資訊面板。

**語法**：
```javascript
function updateInfoPanel(players: Object): void
```

**參數**：
- `players` - 玩家對象（來自 Firebase）

**顯示內容**：
- 玩家暱稱
- 玩家顏色
- 當前分數

---

### `updatePlayersList(players)`

更新等待室玩家列表。

**語法**：
```javascript
function updatePlayersList(players: Object): void
```

**參數**：
- `players` - 玩家對象（來自 Firebase）

**顯示內容**：
- 玩家暱稱
- 玩家顏色點
- 是否為自己（標記 `(你)`）

---

### `updateGameState(data)`

更新遊戲狀態。

**語法**：
```javascript
function updateGameState(data: Object): void
```

**參數**：
- `data` - 房間數據（來自 Firebase）

**更新範圍**：
- 全局 `gameState`
- 玩家分數顯示

---

## 錯誤處理

### Try-Catch 包裹

所有 async 函數都應使用 try-catch：

```javascript
async function exampleFunction() {
    try {
        // 主要邏輯
    } catch (error) {
        console.error('Error in exampleFunction:', error);
        // 可選：顯示用戶友好的錯誤訊息
    }
}
```

### Console 日誌

重要操作應記錄日誌：

```javascript
console.log('Game started successfully');
console.log(`Room ${roomId} cleaned up successfully`);
console.log(`Collision processed: ${id1} vs ${id2}`);
```

---

## 版本資訊

- **版本**：v2.0
- **最後更新**：2025-01-16
- **作者**：Online Little Elf Team

---

## 相關文檔

- [README.md](README.md) - 專案說明
- [FIREBASE-SETUP-GUIDE.md](FIREBASE-SETUP-GUIDE.md) - Firebase 配置
- [TESTING-GUIDE.md](TESTING-GUIDE.md) - 測試指南
- [3-DAY-DEVELOPMENT-PLAN.md](3-DAY-DEVELOPMENT-PLAN.md) - 開發計劃
