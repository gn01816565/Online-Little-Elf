# 🎮 線上多人小精靈遊戲

一個支援多達 10 位玩家同時遊玩的線上多人小精靈遊戲，使用 Firebase Realtime Database 實現即時同步。

![遊戲預覽](https://img.shields.io/badge/遊戲類型-多人線上-brightgreen) ![玩家數量](https://img.shields.io/badge/玩家數量-2--10人-blue) ![技術](https://img.shields.io/badge/技術-HTML5%20%7C%20Canvas%20%7C%20Firebase-orange)

## ✨ 特色功能

- 🎯 **真正的線上多人遊戲**：支援 2-10 位玩家同時在不同裝置上遊玩
- 🏠 **房間系統**：建立私人房間或使用 6 位數代碼加入朋友的遊戲
- ⚡ **即時同步**：所有玩家的位置、分數即時更新
- 🎨 **10 種顏色**：每位玩家擁有獨特的顏色識別
- 🗺️ **動態迷宮**：每次遊戲隨機生成不同的迷宮地圖
- 📱 **跨平台**：支援電腦、平板、手機（需配置 Firebase）
- 🎭 **演示模式**：未配置 Firebase 時可體驗介面（無實際連線功能）

## 🎮 遊戲玩法

### 基本規則
- 使用方向鍵（↑↓←→）或 WASD 控制角色移動
- 收集白色小豆子獲得 **10 分**
- 收集金色能量豆獲得 **50 分**
- 避免撞到藍色牆壁
- 分數最高的玩家獲勝

### 遊戲流程
1. **建立或加入房間**
   - 一位玩家建立房間，獲得 6 位數房間代碼
   - 其他玩家使用代碼加入房間

2. **等待玩家**
   - 在等待室查看已加入的玩家
   - 至少需要 2 位玩家才能開始

3. **開始遊戲**
   - 房主點擊「開始遊戲」
   - 所有玩家進入遊戲畫面

4. **遊玩**
   - 在迷宮中移動收集豆子
   - 即時查看所有玩家的位置和分數

## 🚀 快速開始

### 方法一：本地遊玩（最簡單）

1. **下載檔案**
   ```bash
   git clone https://github.com/你的用戶名/Online-Little-Elf.git
   cd Online-Little-Elf
   ```

2. **用瀏覽器開啟**
   - 直接雙擊 `online-multiplayer-pacman-10players-fixed.html`
   - 或右鍵選擇「用瀏覽器開啟」

3. **配置 Firebase**（必須，否則只能使用演示模式）
   - 參考下方「Firebase 設定」章節

### 方法二：部署到網路

將遊戲部署到網路上，讓任何人都能透過網址訪問：

#### 使用 GitHub Pages（推薦）
```bash
# 1. 上傳到 GitHub
git add .
git commit -m "Add multiplayer pacman game"
git push

# 2. 在 GitHub repository 設定中啟用 Pages
# Settings → Pages → Source: main branch → Save

# 3. 訪問: https://你的用戶名.github.io/Online-Little-Elf/online-multiplayer-pacman-10players-fixed.html
```

#### 使用 Netlify（最簡單）
1. 前往 [Netlify](https://www.netlify.com)
2. 拖曳整個專案資料夾到網站
3. 立即獲得一個網址

#### 使用 Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy --only hosting
```

## 🔧 Firebase 設定（重要！）

要啟用真正的線上多人功能，必須配置 Firebase：

### 步驟 1：建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com)
2. 點選「新增專案」
3. 輸入專案名稱（例如：pacman-multiplayer）
4. 完成建立

### 步驟 2：啟用 Realtime Database

1. 在左側選單選擇「Build」→「Realtime Database」
2. 點選「建立資料庫」
3. 選擇資料庫位置（建議選擇 asia-southeast1）
4. 安全性規則選擇「測試模式」（開發用）

### 步驟 3：設定安全性規則

在 Realtime Database 頁面的「規則」標籤，貼上：

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        ".indexOn": ["status", "createdAt"]
      }
    }
  }
}
```

⚠️ **注意**：這個規則允許所有人讀寫，僅適合開發測試。正式環境建議加入身份驗證。

### 步驟 4：取得配置並更新程式碼

1. Firebase Console → 專案設定（齒輪圖示）
2. 往下捲到「你的應用程式」
3. 點選網頁圖示（</>）
4. 複製 `firebaseConfig`

5. 開啟 `online-multiplayer-pacman-10players-fixed.html`
6. 找到第 296-304 行：
```javascript
const firebaseConfig = {
    apiKey: "你的-API-KEY",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```
7. 替換成你的配置
8. 儲存檔案

完成！現在可以真正的線上多人遊玩了 🎉

## 📁 專案結構

```
Online-Little-Elf/
├── online-multiplayer-pacman-10players-fixed.html  # 主遊戲檔案
├── FIREBASE-SETUP-README.md                        # Firebase 詳細設定說明
├── HOW-TO-USE.md                                   # 使用說明
└── README.md                                       # 本檔案
```

## 🛠️ 技術細節

### 使用技術
- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **渲染**: Canvas API
- **後端**: Firebase Realtime Database
- **即時通訊**: Firebase SDK

### 主要功能實現

#### 1. 房間系統
- 隨機生成 6 位數房間代碼
- 支援最多 10 位玩家
- 房主離開自動關閉房間

#### 2. 玩家同步
- 使用 Firebase Realtime Database 的 `on('value')` 監聽變化
- 玩家位置、分數即時更新
- 斷線自動移除玩家

#### 3. 遊戲邏輯
- Canvas 繪製遊戲畫面（60 FPS）
- 隨機生成迷宮演算法
- 碰撞檢測系統
- 分數計算系統

#### 4. 錯誤處理
- 完整的 try-catch 錯誤處理
- Null reference 檢查
- 網路錯誤提示
- 斷線重連機制

### 已修復的問題

✅ **鍵盤事件重複監聽**：每次進入遊戲都會移除舊的監聽器再添加新的
✅ **錯誤處理缺失**：所有 async 函數都加入 try-catch
✅ **Null reference 錯誤**：所有可能為 null 的對象都加入檢查
✅ **玩家資料驗證**：繪製前檢查玩家位置和顏色是否存在
✅ **Database 空值檢查**：避免 Firebase 未初始化時的錯誤

## 🎯 適用場景

### 1. 派對遊戲
在聚會時讓大家一起玩，一台電腦接大螢幕顯示，每個人用手機控制。

### 2. 線上聚會
朋友在不同地方也能一起玩，只需分享房間代碼。

### 3. 學校活動
適合作為校園活動、攤位遊戲，吸引人群參與。

### 4. 學習專案
適合學習 Firebase、Canvas、即時通訊的範例專案。

## 📱 推薦配置（攤位使用）

### 硬體設置
- **主螢幕**：1 台電腦/平板接大螢幕或投影機
- **玩家設備**：玩家用自己的手機/平板

### 操作流程
1. 主螢幕建立房間，顯示房間代碼
2. 玩家用手機掃 QR code 或輸入網址
3. 輸入代碼加入房間
4. 開始遊戲，主螢幕顯示遊戲畫面
5. 玩家在手機上控制角色

## ❓ 常見問題

### Q: 為什麼顯示「Firebase 配置錯誤」？
A: 請確認已正確替換 Firebase 配置資訊，並且已啟用 Realtime Database。

### Q: 可以不配置 Firebase 就玩嗎？
A: 可以進入演示模式查看介面，但無法真正進行線上多人遊戲。

### Q: 房間代碼在哪裡看？
A: 建立房間後會顯示在等待室的大字區域。

### Q: 為什麼無法加入房間？
A: 檢查：
- 房間代碼是否正確（6 位數）
- 房主是否已離開（房主離開會關閉房間）
- 房間是否已滿（最多 10 人）
- 遊戲是否已開始（開始後無法加入）

### Q: 遊戲很延遲怎麼辦？
A:
- 選擇離你較近的 Firebase 區域
- 檢查網路連線品質
- 減少同時線上玩家數量

### Q: 可以在手機上玩嗎？
A: 可以！只要瀏覽器支援 Canvas 和鍵盤輸入。建議使用虛擬鍵盤或外接鍵盤。

### Q: 這個遊戲收費嗎？
A: 完全免費！Firebase 免費方案足夠一般使用。

## 💡 進階功能建議

想要擴展遊戲？可以考慮：

- 🔐 **身份驗證**：加入 Firebase Authentication
- 🏆 **排行榜**：記錄歷史最高分
- 💬 **聊天功能**：玩家間即時聊天
- 🎁 **道具系統**：加速、無敵等特殊道具
- 👻 **怪物系統**：加入 AI 控制的敵人
- 🗺️ **多種地圖**：不同主題的迷宮
- 🎵 **音效**：背景音樂和音效
- 📊 **統計數據**：遊戲時間、勝率等

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

### 開發建議
1. Fork 此專案
2. 建立你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

此專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案

## 📞 聯絡方式

如有問題或建議，歡迎：
- 開啟 [Issue](https://github.com/你的用戶名/Online-Little-Elf/issues)
- 發送 Pull Request

## 🎉 致謝

感謝所有測試和提供反饋的玩家！

---

**祝遊戲愉快！** 🎮✨

Made with ❤️ by [你的名字]
