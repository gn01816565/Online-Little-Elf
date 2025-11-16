# 🔥 Firebase 配置指南

## 📋 目錄
1. [建立 Firebase 專案](#1-建立-firebase-專案)
2. [啟用 Realtime Database](#2-啟用-realtime-database)
3. [取得配置資訊](#3-取得配置資訊)
4. [更新遊戲檔案](#4-更新遊戲檔案)
5. [測試連線](#5-測試連線)
6. [常見問題](#6-常見問題)

---

## 1. 建立 Firebase 專案

### 步驟 1.1：前往 Firebase Console
1. 開啟瀏覽器，前往 [Firebase Console](https://console.firebase.google.com/)
2. 使用你的 Google 帳號登入
3. 如果這是第一次使用，會看到歡迎畫面

### 步驟 1.2：建立新專案
1. 點擊 **「新增專案」** (Add project)
2. 輸入專案名稱，例如：`online-pacman-game`
3. 點擊 **「繼續」**
4. **Google Analytics**：可以選擇關閉（這個遊戲不需要）
5. 點擊 **「建立專案」**
6. 等待 30 秒～1 分鐘，專案建立完成
7. 點擊 **「繼續」**

---

## 2. 啟用 Realtime Database

### 步驟 2.1：建立 Realtime Database
1. 在左側選單找到 **「建構」** → **「Realtime Database」**
2. 點擊 **「建立資料庫」**
3. 選擇資料庫位置：
   - 🇺🇸 **美國**：`us-central1`（推薦，延遲較低）
   - 🇸🇬 **新加坡**：`asia-southeast1`（亞洲用戶較近）
   - 🇪🇺 **歐洲**：`europe-west1`
4. 點擊 **「下一步」**

### 步驟 2.2：設定安全規則
1. 選擇 **「以測試模式啟動」** (Start in test mode)
   - ⚠️ 注意：測試模式的資料庫 **30 天後會自動關閉寫入權限**
   - 適合開發和測試使用
2. 點擊 **「啟用」**
3. 等待幾秒鐘，資料庫建立完成

### 步驟 2.3：（重要）調整安全規則
**為了避免 30 天後失效，請手動設定規則：**

1. 點擊頂部的 **「規則」** (Rules) 分頁
2. 將規則改為以下內容：

```json
{
  "rules": {
    ".read": "auth == null",
    ".write": "auth == null"
  }
}
```

**或者更安全的版本（限制房間數量）：**

```json
{
  "rules": {
    "rooms": {
      ".read": true,
      "$roomId": {
        ".write": true,
        ".validate": "newData.hasChildren(['gameStarted', 'players'])"
      }
    }
  }
}
```

3. 點擊 **「發布」** (Publish)

⚠️ **安全提醒**：
- 這個規則允許任何人讀寫資料庫（適合小型遊戲）
- 如果需要更高安全性，建議啟用 Firebase Authentication
- 正式部署時，建議設定更嚴格的規則

---

## 3. 取得配置資訊

### 步驟 3.1：新增網頁應用程式
1. 回到專案總覽頁面（點擊左上角的「專案總覽」）
2. 在專案名稱下方，點擊 **「網頁」** 圖示（`</>`）
3. 輸入應用程式暱稱，例如：`Pacman Web`
4. **不需要** 勾選「Firebase Hosting」
5. 點擊 **「註冊應用程式」**

### 步驟 3.2：複製配置物件
你會看到類似以下的程式碼：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**重要欄位說明：**
- `apiKey`：API 金鑰（公開的，可以放在前端）
- `authDomain`：認證域名
- `databaseURL`：**最重要！** Realtime Database 的網址
- `projectId`：專案 ID
- `appId`：應用程式 ID

### 步驟 3.3：保存配置資訊
1. **複製整個 `firebaseConfig` 物件**
2. 暫時貼到記事本或其他地方保存
3. 點擊 **「繼續前往主控台」**

---

## 4. 更新遊戲檔案

### 步驟 4.1：找到配置區域
1. 開啟 `online-multiplayer-pacman-10players-fixed.html`
2. 找到以下程式碼（大約在第 296-304 行）：

```javascript
// Firebase 配置 - 請替換為你自己的配置
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 步驟 4.2：替換配置
將上面的配置 **完整替換** 為你在步驟 3.2 複製的配置。

**範例（替換後）：**
```javascript
// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "online-pacman-game.firebaseapp.com",
    databaseURL: "https://online-pacman-game-default-rtdb.firebaseio.com",
    projectId: "online-pacman-game",
    storageBucket: "online-pacman-game.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};
```

### 步驟 4.3：儲存檔案
1. 按 `Ctrl + S`（Windows）或 `Cmd + S`（Mac）儲存
2. 關閉編輯器

---

## 5. 測試連線

### 步驟 5.1：開啟遊戲
1. 用瀏覽器開啟 `online-multiplayer-pacman-10players-fixed.html`
2. 按 `F12` 開啟開發者工具
3. 切換到 **「Console」** 分頁

### 步驟 5.2：建立測試房間
1. 輸入你的暱稱，例如：`測試玩家`
2. 點擊 **「建立遊戲房間」**
3. 如果配置正確，你會看到：
   - 房間代碼（6 位數字）
   - 玩家列表中出現你的名字
   - Console 中 **沒有** 紅色錯誤訊息

### 步驟 5.3：檢查 Firebase Console
1. 回到 Firebase Console
2. 進入 **「Realtime Database」**
3. 你應該會看到 `rooms` 節點下出現資料：

```
rooms
  └─ ABC123
      ├─ gameStarted: false
      ├─ hostId: "xxxxx"
      └─ players
          └─ xxxxx
              ├─ name: "測試玩家"
              ├─ color: "#FFD700"
              ├─ x: 5
              └─ y: 5
```

### 步驟 5.4：測試多人連線
1. **方法 A**：用無痕視窗開啟同一個 HTML 檔案
   - Chrome：`Ctrl + Shift + N`
   - Firefox：`Ctrl + Shift + P`
2. **方法 B**：用手機開啟（需要先部署到網路上）
3. 輸入剛才的房間代碼加入
4. 兩個視窗應該都能看到彼此

### 步驟 5.5：開始遊戲測試
1. 等待至少 2 位玩家加入
2. 點擊 **「開始遊戲」**
3. 測試以下功能：
   - ✅ 可以移動（方向鍵或 WASD）
   - ✅ 可以吃小豆子（+10 分）
   - ✅ 可以吃能量豆（+50 分，變大）
   - ✅ 碰撞會搶分
   - ✅ 計時器倒數
   - ✅ 即時排名更新
   - ✅ 3 分鐘後遊戲結束

---

## 6. 常見問題

### ❓ Q1：Console 顯示 "Firebase configuration error"
**A1：** 檢查以下項目：
1. 是否正確複製所有配置欄位？
2. `databaseURL` 是否正確？（最重要）
3. 是否有多餘的空格或逗號？
4. 是否使用正確的引號（`"` 而非 `'`）？

### ❓ Q2：點擊「建立房間」沒反應
**A2：**
1. 檢查瀏覽器 Console 是否有錯誤訊息
2. 確認 Realtime Database 已啟用
3. 確認安全規則已設定為允許讀寫
4. 嘗試重新整理頁面（`F5`）

### ❓ Q3：可以建立房間，但其他人加入失敗
**A3：**
1. 確認房間代碼輸入正確（大小寫敏感）
2. 檢查房間是否已滿（最多 10 人）
3. 檢查遊戲是否已經開始
4. 確認兩個裝置的網路都正常

### ❓ Q4：資料庫顯示「權限被拒絕」(Permission Denied)
**A4：**
1. 回到 Firebase Console
2. 進入 **Realtime Database** → **規則**
3. 確認規則設定為：
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
4. 點擊 **「發布」**
5. 等待幾秒鐘，重新載入遊戲

### ❓ Q5：測試模式 30 天後會怎樣？
**A5：**
- 30 天後，寫入權限會自動關閉
- 遊戲將無法建立新房間或更新資料
- **解決方案**：重新發布安全規則（參考步驟 2.3）

### ❓ Q6：遊戲可以玩，但很慢/卡頓
**A6：**
1. 檢查網路連線速度
2. 選擇離你較近的資料庫位置（亞洲用戶建議用新加坡）
3. 減少同時在線人數（從 10 人減到 5 人）
4. 關閉其他佔用網路的應用程式

### ❓ Q7：手機上無法開啟遊戲
**A7：**
- 本地 HTML 檔案無法直接在手機上執行
- **解決方案**：部署到網路上
  - 選項 1：Firebase Hosting（免費）
  - 選項 2：GitHub Pages（免費）
  - 選項 3：Netlify（免費）
  - 選項 4：Vercel（免費）

### ❓ Q8：想要更高的安全性怎麼辦？
**A8：** 啟用 Firebase Authentication
1. 在 Firebase Console 啟用「Authentication」
2. 選擇登入方式（例如：匿名登入）
3. 更新安全規則：
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```
4. 在遊戲中加入登入程式碼

---

## 📊 Firebase 免費配額

### Realtime Database 免費額度
- **儲存空間**：1 GB
- **下載量**：10 GB/月
- **同時連線**：100 個

### 對這個遊戲來說
- 10 人房間 × 100 場遊戲/月 = **綽綽有餘**
- 每場遊戲約 3 分鐘 × 10 人 = 約 5 MB 流量
- 1000 場遊戲才會用掉 5 GB（遠低於 10 GB 限額）

**結論：** 免費版完全夠用！🎉

---

## 🚀 部署到網路（選做）

### 方法 1：Firebase Hosting（推薦）

1. 安裝 Firebase CLI
```bash
npm install -g firebase-tools
```

2. 登入 Firebase
```bash
firebase login
```

3. 初始化專案
```bash
firebase init hosting
```

4. 選擇剛建立的專案
5. 設定 public 目錄為當前目錄（或輸入 `.`）
6. 單頁應用程式：選 **No**
7. 部署
```bash
firebase deploy --only hosting
```

8. 完成！你會得到一個網址：
```
https://your-project-id.web.app
```

### 方法 2：GitHub Pages

1. 建立 GitHub 儲存庫
2. 上傳 HTML 檔案
3. 在儲存庫設定中啟用 GitHub Pages
4. 選擇 `main` 分支
5. 儲存後等待幾分鐘
6. 網址：`https://your-username.github.io/repository-name/`

### 方法 3：Netlify Drop

1. 前往 [Netlify Drop](https://app.netlify.com/drop)
2. 直接拖曳 HTML 檔案到頁面
3. 等待上傳完成
4. 自動產生網址：`https://random-name.netlify.app`

---

## ✅ 檢查清單

完成以下所有項目，即代表 Firebase 配置成功：

- [ ] ✅ 建立 Firebase 專案
- [ ] ✅ 啟用 Realtime Database
- [ ] ✅ 設定安全規則
- [ ] ✅ 取得配置資訊
- [ ] ✅ 更新遊戲檔案
- [ ] ✅ 可以建立房間
- [ ] ✅ 可以加入房間
- [ ] ✅ Firebase Console 可以看到資料
- [ ] ✅ 兩個視窗可以互相看到
- [ ] ✅ 遊戲功能正常運作

---

## 🎉 恭喜！

如果你完成了所有步驟，你的遊戲現在可以真正多人連線了！

**下一步：**
1. 邀請朋友一起測試
2. 收集反饋意見
3. 繼續優化遊戲
4. 享受遊戲樂趣！🎮

**需要幫助？**
- 查看 Firebase 官方文件：https://firebase.google.com/docs
- 檢查遊戲的 README.md 檔案
- 開啟瀏覽器 Console 查看錯誤訊息

---

**最後更新：2025-01-16**
