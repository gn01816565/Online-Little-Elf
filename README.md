# 🎮 線上多人小精靈遊戲（極簡版）

<div align="center">

**10 人同時在線，搶豆子、吃能量、碰撞搶分！**

[🎯 立即開始](#快速開始) | [📖 遊戲玩法](#遊戲玩法) | [⚙️ Firebase 設定](#firebase-設定) | [🚀 部署](#部署)

</div>

---

## 📝 目錄

- [遊戲簡介](#遊戲簡介)
- [遊戲玩法](#遊戲玩法)
- [核心機制](#核心機制)
- [快速開始](#快速開始)
- [Firebase 設定](#firebase-設定)
- [操作方式](#操作方式)
- [遊戲功能](#遊戲功能)
- [技術架構](#技術架構)
- [部署](#部署)
- [常見問題](#常見問題)
- [開發計劃](#開發計劃)
- [授權](#授權)

---

## 🎮 遊戲簡介

這是一款**極簡版線上多人小精靈遊戲**，最多支援 **10 人同時在線**。

### ✨ 特色

- 🌐 **真正的多人連線**：使用 Firebase Realtime Database，即時同步所有玩家狀態
- ⚡ **極簡設計**：3 分鐘一局，快速上手，策略豐富
- 🎨 **雙語支援**：繁體中文 / English 隨時切換
- 🔊 **8-bit 音效**：復古遊戲風格，Web Audio API 動態生成
- 📱 **跨平台**：電腦、平板、手機都能玩（需部署到網路）
- 🏆 **即時排名**：遊戲中隨時查看自己的排名

### 🎯 遊戲目標

在 **3 分鐘** 內：
1. 🔵 收集小豆子（+10 分）
2. 🟡 搶奪能量豆（+50 分，變身 15 秒）
3. 💥 碰撞搶分（普通 20%，能量豆 50%）
4. 🏆 **分數最高者獲勝！**

---

## 📖 遊戲玩法

### 地圖配置

- **迷宮大小**：50 × 40 格（1000 × 800 像素）
- **小豆子**：散佈在空地上（+10 分）
- **能量豆**：固定 **4 個**，位於地圖四個角落（+50 分）
- **玩家數**：2-10 人

### 三大核心玩法

#### 1️⃣ 收集豆子
- 🔵 **小豆子**：每個 +10 分
- 🟡 **能量豆**：每個 +50 分 + 進入「能量豆狀態」15 秒

#### 2️⃣ 能量豆變身
吃到能量豆後：
- 玩家變大（1.2 倍）
- 彩虹光暈閃爍
- 持續 **15 秒**
- 最後 5 秒會有警告提示（光暈加速閃爍）
- 可以搶其他普通玩家 **50%** 的分數

#### 3️⃣ 碰撞搶分
當兩個玩家碰撞時：

| 情況 | 規則 |
|------|------|
| 普通 vs 普通 | 分數高者搶走低者 **20%** 分數 |
| 能量豆 vs 普通 | 能量豆玩家搶走普通玩家 **50%** 分數 |
| 能量豆 vs 能量豆 | 互相彈開，**不搶分** |

**搶分計算範例：**
```
玩家 A：1000 分（普通狀態）
玩家 B：500 分（能量豆狀態）

碰撞後：
玩家 A：1000 - 500 = 500 分
玩家 B：500 + 500 = 1000 分

（玩家 B 搶走玩家 A 的 50%，即 500 分）
```

### 遊戲時間

- ⏱️ **總時長**：3 分鐘（180 秒）
- ⚠️ **最後 30 秒**：計時器變紅色，背景閃爍，音效提示
- 🏁 **時間到**：自動結算，顯示排名

---

## 🎯 核心機制

### 能量豆機制

```
吃到能量豆
    ↓
+50 分
    ↓
進入能量豆狀態（15 秒）
    ↓
視覺效果：變大 + 彩虹光暈
    ↓
碰撞搶分能力：50%（超強！）
    ↓
剩餘 5 秒警告
    ↓
恢復普通狀態
```

### 碰撞搶分決策樹

```
碰撞發生
    ↓
檢測雙方狀態
    ├─ 雙方都是能量豆？
    │   └─ 是 → 彈開，不搶分
    │   └─ 否 → 繼續
    ├─ 其中一方是能量豆？
    │   └─ 是 → 能量豆玩家搶 50%
    │   └─ 否 → 比較分數
    └─ 比較分數
        └─ 分數高者搶低者 20%
```

### 計時系統

```
遊戲開始（3:00）
    ↓
每秒倒數
    ↓
2:30 → 正常顯示（金色）
    ↓
0:30 → 警告狀態（紅色閃爍 + 音效）
    ↓
0:00 → 遊戲結束 → 結算畫面
    ↓
顯示完整排名（1-10 名）
    ↓
15 秒後自動返回大廳
```

---

## 🚀 快速開始

### 方法 1：本地測試（無需 Firebase）

1. **下載檔案**
   ```bash
   git clone https://github.com/gn01816565/Online-Little-Elf.git
   cd Online-Little-Elf
   ```

2. **開啟遊戲**
   - 直接用瀏覽器開啟 `online-multiplayer-pacman-10players-fixed.html`

3. **進入演示模式**
   - 點擊「建立遊戲房間」
   - 會顯示「演示模式」提示
   - 可以單人體驗遊戲機制（無法真正多人連線）

### 方法 2：完整多人連線（需 Firebase）

1. **設定 Firebase**
   - 詳細步驟請參考 [FIREBASE-SETUP-GUIDE.md](FIREBASE-SETUP-GUIDE.md)
   - 大約需要 **5-10 分鐘**

2. **更新配置**
   - 開啟 `online-multiplayer-pacman-10players-fixed.html`
   - 找到第 296-304 行的 Firebase 配置
   - 替換為你自己的配置

3. **開始遊戲**
   - 開啟檔案
   - 建立房間或加入房間
   - 邀請朋友一起玩！

---

## ⚙️ Firebase 設定

### 為什麼需要 Firebase？

Firebase Realtime Database 提供：
- ✅ 即時同步所有玩家位置和分數
- ✅ 房間管理（建立、加入、離開）
- ✅ 斷線自動處理
- ✅ **完全免費**（免費配額綽綽有餘）

### 設定步驟（簡化版）

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 建立新專案
3. 啟用 Realtime Database（選擇測試模式）
4. 複製配置資訊
5. 貼到遊戲檔案中

📚 **完整教學**：[FIREBASE-SETUP-GUIDE.md](FIREBASE-SETUP-GUIDE.md)

---

## 🎮 操作方式

### 鍵盤控制

- **移動**：
  - ⬆️ 上：`↑` 或 `W`
  - ⬇️ 下：`↓` 或 `S`
  - ⬅️ 左：`←` 或 `A`
  - ➡️ 右：`→` 或 `D`

### 按鈕

- 🔊 **音效開關**：遊戲中右上角
- 🌐 **語言切換**：頁面右上角（繁中 ⇄ English）

### 遊戲流程

```
開啟遊戲
    ↓
選擇「建立房間」或「加入房間」
    ↓
輸入暱稱
    ↓
（如果加入）輸入 6 位數房間代碼
    ↓
等待室（至少 2 人才能開始）
    ↓
房主點擊「開始遊戲」
    ↓
3 分鐘遊戲時間
    ↓
時間到 → 結算畫面
    ↓
選擇「再來一局」或「返回大廳」
```

---

## 🎨 遊戲功能

### ✅ 已實作功能

#### Day 1 核心機制
- [x] 能量豆變身系統（15 秒）
- [x] 碰撞搶分機制（20% / 50%）
- [x] 3 分鐘倒數計時
- [x] 最後 30 秒警告
- [x] 固定 4 個能量豆位置

#### Day 2 UI/UX
- [x] 即時排名顯示（右上角）
- [x] 結算畫面與完整排名
- [x] 分數飄字動畫
- [x] 8 個 8-bit 復古音效
- [x] 音效開關按鈕
- [x] 彩虹光暈視覺特效

#### Day 3 完善
- [x] 雙語系統（繁體中文 / English）
- [x] 語言切換按鈕
- [x] localStorage 儲存偏好
- [x] Firebase 配置指南
- [x] 完整文件（README + 教學）

### 📊 遊戲數據

- **玩家數量**：2-10 人
- **遊戲時長**：3 分鐘
- **地圖大小**：50 × 40 格
- **小豆子分數**：+10 分
- **能量豆分數**：+50 分
- **能量豆持續時間**：15 秒
- **能量豆警告**：最後 5 秒
- **普通碰撞搶分**：20%
- **能量豆碰撞搶分**：50%
- **倒數警告**：最後 30 秒
- **自動返回大廳**：結算後 15 秒

---

## 💻 技術架構

### 技術棧

- **前端**：純 HTML + CSS + JavaScript（無框架）
- **後端**：Firebase Realtime Database
- **渲染**：HTML5 Canvas (1000×800)
- **音效**：Web Audio API（動態生成，無外部檔案）
- **儲存**：localStorage（語言偏好）

### 程式架構

```
online-multiplayer-pacman-10players-fixed.html
├─ HTML 結構
│  ├─ 主選單
│  ├─ 等待室
│  └─ 遊戲畫面
├─ CSS 樣式
│  ├─ 響應式設計
│  ├─ 動畫效果
│  └─ 按鈕樣式
└─ JavaScript 邏輯
   ├─ Firebase 初始化
   ├─ 房間管理
   ├─ 遊戲迴圈（requestAnimationFrame）
   ├─ 碰撞檢測
   ├─ 能量豆系統
   ├─ 計時器
   ├─ 音效系統
   ├─ 排名計算
   └─ 雙語系統
```

### 核心函數

| 函數名稱 | 功能 |
|---------|------|
| `generateMaze()` | 生成迷宮、放置豆子 |
| `gameLoop()` | 主遊戲迴圈（60 FPS） |
| `checkCollision()` | 碰撞檢測與搶分計算 |
| `updateTimer()` | 計時器更新 |
| `showGameResults()` | 結算畫面 |
| `drawGame()` | Canvas 渲染 |
| `toggleLanguage()` | 切換語言 |
| `soundXXX()` | 8 個音效函數 |

### Firebase 資料結構

```json
{
  "rooms": {
    "ABC123": {
      "gameStarted": false,
      "hostId": "player1_id",
      "startTime": 1234567890,
      "maze": [ [...], [...], ... ],
      "players": {
        "player1_id": {
          "name": "玩家一",
          "color": "#FFD700",
          "x": 5,
          "y": 5,
          "score": 250,
          "powerMode": true,
          "powerEndTime": 1234567905
        },
        "player2_id": { ... }
      }
    }
  }
}
```

---

## 🚀 部署

### 選項 1：Firebase Hosting（推薦）

```bash
# 安裝 Firebase CLI
npm install -g firebase-tools

# 登入
firebase login

# 初始化
firebase init hosting

# 部署
firebase deploy --only hosting
```

完成後得到網址：`https://your-project-id.web.app`

### 選項 2：GitHub Pages

1. 建立 GitHub 儲存庫
2. 上傳 `online-multiplayer-pacman-10players-fixed.html`
3. 在設定中啟用 GitHub Pages
4. 網址：`https://your-username.github.io/repo-name/online-multiplayer-pacman-10players-fixed.html`

### 選項 3：Netlify Drop

1. 前往 [Netlify Drop](https://app.netlify.com/drop)
2. 拖曳 HTML 檔案
3. 自動生成網址：`https://random-name.netlify.app`

### 選項 4：Vercel

```bash
# 安裝 Vercel CLI
npm install -g vercel

# 部署
vercel
```

---

## ❓ 常見問題

### Q1：本地開啟遊戲，點擊按鈕沒反應？

**A：** 確認不是在 Claude Artifact 或 CodePen 中運行。請：
1. 下載 HTML 檔案到本地
2. 用瀏覽器**直接開啟檔案**（雙擊檔案）
3. 或使用本地伺服器（如 `python -m http.server`）

### Q2：建立房間後出現「Firebase 配置錯誤」？

**A：** 這是正常的！代表進入「演示模式」，可以單人體驗。要啟用真正多人連線：
1. 參考 [FIREBASE-SETUP-GUIDE.md](FIREBASE-SETUP-GUIDE.md)
2. 設定 Firebase Realtime Database
3. 替換配置資訊

### Q3：手機可以玩嗎？

**A：** 可以！但需要先部署到網路上（Firebase Hosting / GitHub Pages / Netlify）。本地 HTML 檔案無法直接在手機上多人連線。

### Q4：遊戲很慢/卡頓？

**A：** 檢查以下項目：
- 網路連線速度
- Firebase 資料庫位置（選擇離你較近的）
- 減少同時在線人數
- 關閉其他佔用網路的應用程式

### Q5：能量豆只有 4 個嗎？會不會太少？

**A：** 這是極簡版的設計！4 個能量豆：
- 位於地圖四角，容易記憶
- 稀缺性 → 增加策略性
- 避免「滿場都是能量豆玩家」的混亂
- 測試後可自行調整（修改 `generateMaze()` 函數）

### Q6：可以改遊戲時間嗎（例如 5 分鐘）？

**A：** 可以！開啟 HTML 檔案，找到：
```javascript
const GAME_DURATION = 180000; // 3分鐘
```
改成：
```javascript
const GAME_DURATION = 300000; // 5分鐘
```

### Q7：想加入 AI 幽靈可以嗎？

**A：** 可以！這是簡化版，沒有 AI 幽靈。如果想加入：
1. 參考原版小精靈遊戲的幽靈 AI
2. 修改 `gameLoop()` 函數
3. 加入幽靈的移動邏輯（追逐/逃跑/巡邏）

### Q8：可以改搶分比例嗎（例如 30% 和 60%）？

**A：** 可以！開啟 HTML 檔案，找到 `checkCollision()` 函數：
```javascript
const stolenScore = Math.floor(otherPlayer.score * 0.5); // 改這裡
```

---

## 📅 開發計劃

本專案按照 3 天開發計劃完成：

### ✅ Day 1：核心玩法實作
- [x] 能量豆變身系統
- [x] 碰撞搶分機制
- [x] 3 分鐘倒數計時
- [x] 即時排名顯示

### ✅ Day 2：UI 與音效
- [x] 結算畫面與排名
- [x] 8 個 8-bit 音效
- [x] UI 優化與視覺特效
- [x] 分數飄字動畫

### ✅ Day 3：完成與測試
- [x] 雙語系統整合
- [x] Bug 修正
- [x] 效能優化
- [x] 完整測試
- [x] 文件撰寫

詳細計劃請參考：[3-DAY-DEVELOPMENT-PLAN.md](3-DAY-DEVELOPMENT-PLAN.md)

---

## 🎯 後續可能的功能

### 🔮 未來可加入

- [ ] 更多地圖（迷宮樣式）
- [ ] AI 幽靈（追逐玩家）
- [ ] 道具系統（加速、護盾、炸彈）
- [ ] 成就系統（吃 100 顆豆子、搶分 10 次）
- [ ] 排行榜（歷史最高分）
- [ ] 觀戰模式
- [ ] 語音聊天
- [ ] 更多語言（日文、韓文、西班牙文）
- [ ] 手機觸控操作（虛擬搖桿）
- [ ] 暗黑模式

---

## 📜 授權

本專案採用 **MIT License**。

```
MIT License

Copyright (c) 2025 Online Little Elf

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 致謝

- **Firebase**：提供免費的即時資料庫服務
- **Web Audio API**：讓我們可以動態生成 8-bit 音效
- **經典小精靈**：遊戲靈感來源

---

## 📞 聯絡與支援

- **Issues**：[GitHub Issues](https://github.com/gn01816565/Online-Little-Elf/issues)
- **討論**：[GitHub Discussions](https://github.com/gn01816565/Online-Little-Elf/discussions)

---

<div align="center">

**⭐ 如果你喜歡這個專案，請給我們一個 Star！⭐**

**🎮 邀請朋友一起玩吧！🎮**

Made with ❤️ by Online Little Elf Team

</div>
