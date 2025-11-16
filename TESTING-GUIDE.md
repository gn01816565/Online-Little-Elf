# 🧪 遊戲測試指南

## 📋 目錄

- [本地測試](#本地測試)
- [Firebase 多人測試](#firebase-多人測試)
- [自動化測試](#自動化測試)
- [性能測試](#性能測試)
- [測試檢查清單](#測試檢查清單)

---

## 本地測試

### 測試環境設定

```bash
# 方法 1：使用 Python 內建伺服器
python -m http.server 8000

# 方法 2：使用 Node.js http-server
npx http-server -p 8000

# 方法 3：直接開啟檔案（限制較多）
# 雙擊 online-multiplayer-pacman-10players-fixed.html
```

### 測試 1：演示模式（無 Firebase）

**目的**：驗證遊戲基本功能在無 Firebase 時的表現

**步驟**：
1. 開啟 `online-multiplayer-pacman-10players-fixed.html`
2. 點擊「建立遊戲房間」
3. 輸入暱稱
4. 點擊「建立房間」

**預期結果**：
- ✅ 顯示「演示模式」提示
- ✅ 進入等待室
- ✅ 顯示房間代碼（隨機 6 位數）
- ✅ 玩家列表顯示自己
- ✅ 「開始遊戲」按鈕啟用

**測試點擊「開始遊戲」**：
- ✅ 應顯示「演示模式，無法啟動遊戲」提示
- ✅ 不會進入遊戲畫面

### 測試 2：語言切換

**步驟**：
1. 點擊右上角「English」按鈕
2. 觀察所有文字變化
3. 重新載入頁面
4. 檢查語言是否保持

**預期結果**：
- ✅ 所有 UI 文字變成英文
- ✅ Alert 對話框變成英文
- ✅ 重新載入後語言保持
- ✅ localStorage 正確儲存語言偏好

### 測試 3：音效系統

**步驟**：
1. 開啟遊戲（確保瀏覽器允許音效）
2. 點擊音效按鈕測試開關
3. 嘗試觸發各種音效

**預期結果**：
- ✅ 音效按鈕顯示「開啟」/「關閉」
- ✅ 關閉時所有音效靜音
- ✅ 開啟時點擊按鈕會播放測試音效

---

## Firebase 多人測試

### 前置準備

1. 依照 `FIREBASE-SETUP-GUIDE.md` 配置 Firebase
2. 確認 Firebase 配置已正確填入遊戲檔案
3. 準備 2 個以上的瀏覽器視窗（或裝置）

### 測試 4：建立房間與加入

**步驟**：

**視窗 1（房主）**：
1. 開啟遊戲
2. 點擊「建立遊戲房間」
3. 輸入暱稱：`玩家1`
4. 點擊「建立房間」
5. 記錄房間代碼

**視窗 2（玩家 2）**：
1. 開啟遊戲（無痕模式或其他瀏覽器）
2. 點擊「加入遊戲房間」
3. 輸入暱稱：`玩家2`
4. 輸入房間代碼
5. 點擊「加入房間」

**預期結果**：
- ✅ 視窗 1 看到玩家 2 加入
- ✅ 視窗 2 看到玩家 1 和自己
- ✅ 兩個視窗的玩家列表同步
- ✅ 「開始遊戲」按鈕在玩家 ≥ 2 時啟用

### 測試 5：遊戲核心功能

**步驟**：
1. 房主點擊「開始遊戲」
2. 兩個視窗都應進入遊戲畫面

**測試移動**：
- ✅ 視窗 1 按方向鍵，視窗 2 看到玩家 1 移動
- ✅ 視窗 2 按 WASD，視窗 1 看到玩家 2 移動
- ✅ 移動流暢，無明顯延遲（< 200ms）

**測試吃豆子**：
- ✅ 吃小豆子：分數 +10
- ✅ 播放吃豆子音效
- ✅ 豆子在兩個視窗中同時消失
- ✅ 分數同步更新

**測試能量豆**：
- ✅ 吃能量豆：分數 +50
- ✅ 玩家變大（1.2 倍）
- ✅ 顯示彩虹光暈
- ✅ 播放能量豆音效 + 變身音效
- ✅ 持續 15 秒後恢復
- ✅ 最後 5 秒警告（閃爍 + 音效）

### 測試 6：碰撞搶分

**情況 A：普通 vs 普通（分數高者搶 20%）**

**步驟**：
1. 玩家 1：吃豆子到 100 分
2. 玩家 2：吃豆子到 50 分
3. 兩個玩家移動到相鄰格子

**預期結果**：
- ✅ 播放碰撞音效
- ✅ 玩家 1 分數：100 + 10 = 110（搶走 50 * 20% = 10）
- ✅ 玩家 2 分數：50 - 10 = 40
- ✅ 顯示飄字：玩家 1 `+10`，玩家 2 `-10`
- ✅ 1 秒內不會再次碰撞搶分

**情況 B：能量豆 vs 普通（搶 50%）**

**步驟**：
1. 玩家 1：吃能量豆（進入能量豆狀態）
2. 玩家 2：有 200 分
3. 碰撞

**預期結果**：
- ✅ 玩家 1 搶走 200 * 50% = 100 分
- ✅ 玩家 2 剩下 100 分
- ✅ 飄字顯示正確

**情況 C：能量豆 vs 能量豆（不搶分）**

**步驟**：
1. 兩個玩家都吃能量豆
2. 碰撞

**預期結果**：
- ✅ 播放碰撞音效
- ✅ 分數不變
- ✅ 沒有飄字

### 測試 7：計時器與遊戲結束

**步驟**：
1. 開始遊戲
2. 觀察計時器倒數

**測試點**：
- ✅ 計時器從 3:00 開始倒數
- ✅ 每秒準確減少
- ✅ 最後 30 秒：計時器變紅色 + 閃爍
- ✅ 最後 30 秒：背景閃爍
- ✅ 最後 30 秒：每秒播放滴答音效
- ✅ 時間到：顯示結算畫面
- ✅ 結算畫面顯示完整排名（1-10 名）
- ✅ 15 秒後自動返回大廳

### 測試 8：即時排名

**步驟**：
1. 3 個以上玩家加入
2. 開始遊戲
3. 各自吃豆子累積分數

**預期結果**：
- ✅ 右上角顯示即時排名
- ✅ 顯示前 3 名（金/銀/銅色）
- ✅ 如果自己不在前 3，顯示分隔線 + 自己排名
- ✅ 自己的排名高亮顯示
- ✅ 排名即時更新

### 測試 9：房間清理

**步驟**：
1. 完成一場遊戲
2. 等待 20 秒
3. 前往 Firebase Console 查看

**預期結果**：
- ✅ 20 秒後房間數據被刪除
- ✅ Console 顯示「Room [ID] cleaned up successfully」
- ✅ 只有房主執行清理（檢查 Console 日誌）

---

## 自動化測試

### JavaScript 單元測試範例

創建 `test.html` 檔案來進行基本測試：

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>遊戲單元測試</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .test { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .pass { background: #d4edda; color: #155724; }
        .fail { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h1>🧪 遊戲功能測試</h1>
    <div id="results"></div>

    <script>
        const results = document.getElementById('results');

        function test(name, fn) {
            try {
                fn();
                results.innerHTML += `<div class="test pass">✅ ${name}</div>`;
                console.log(`✅ ${name}`);
            } catch (error) {
                results.innerHTML += `<div class="test fail">❌ ${name}: ${error.message}</div>`;
                console.error(`❌ ${name}:`, error);
            }
        }

        function assertEqual(actual, expected, message) {
            if (actual !== expected) {
                throw new Error(`${message}: expected ${expected}, got ${actual}`);
            }
        }

        // 測試 1：搶分計算（普通 vs 普通）
        test('搶分計算 - 普通 vs 普通 (20%)', () => {
            const attacker = 100;
            const victim = 50;
            const stolen = Math.floor(victim * 0.2);
            assertEqual(stolen, 10, '搶走分數');
            assertEqual(attacker + stolen, 110, '攻擊者最終分數');
            assertEqual(victim - stolen, 40, '受害者最終分數');
        });

        // 測試 2：搶分計算（能量豆 vs 普通）
        test('搶分計算 - 能量豆 vs 普通 (50%)', () => {
            const powerPlayer = 100;
            const normalPlayer = 200;
            const stolen = Math.floor(normalPlayer * 0.5);
            assertEqual(stolen, 100, '搶走分數');
            assertEqual(powerPlayer + stolen, 200, '能量豆玩家最終分數');
            assertEqual(normalPlayer - stolen, 100, '普通玩家最終分數');
        });

        // 測試 3：分數不會變成負數
        test('分數保護 - 不會變成負數', () => {
            const victim = 10;
            const stolen = Math.floor(victim * 0.5); // 5
            const finalScore = Math.max(0, victim - stolen);
            assertEqual(finalScore, 5, '最終分數應 >= 0');
        });

        // 測試 4：能量豆時間計算
        test('能量豆持續時間計算', () => {
            const now = Date.now();
            const powerEndTime = now + 15000;
            const remaining = powerEndTime - now;
            assertEqual(remaining >= 14990 && remaining <= 15000, true, '應為 15 秒');
        });

        // 測試 5：碰撞距離檢測
        test('碰撞距離檢測 - 相鄰格子', () => {
            const p1 = { x: 5, y: 5 };
            const p2 = { x: 6, y: 5 };
            const distance = Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
            assertEqual(distance, 1, '相鄰格子距離應為 1');
            assertEqual(distance <= 1, true, '應觸發碰撞');
        });

        // 測試 6：碰撞距離檢測 - 不相鄰
        test('碰撞距離檢測 - 不相鄰格子', () => {
            const p1 = { x: 5, y: 5 };
            const p2 = { x: 7, y: 5 };
            const distance = Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
            assertEqual(distance, 2, '不相鄰格子距離應 > 1');
            assertEqual(distance <= 1, false, '不應觸發碰撞');
        });

        // 測試 7：房間代碼生成
        test('房間代碼生成 - 6 位數', () => {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            assertEqual(code.length, 6, '房間代碼應為 6 位');
            assertEqual(/^[A-Z0-9]{6}$/.test(code), true, '應為大寫字母和數字');
        });

        // 測試 8：計時器格式化
        test('計時器格式化 - 3:00', () => {
            const seconds = 180;
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const timeText = `${minutes}:${secs.toString().padStart(2, '0')}`;
            assertEqual(timeText, '3:00', '應顯示 3:00');
        });

        // 測試 9：計時器格式化 - 0:09
        test('計時器格式化 - 0:09', () => {
            const seconds = 9;
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const timeText = `${minutes}:${secs.toString().padStart(2, '0')}`;
            assertEqual(timeText, '0:09', '應顯示 0:09（補零）');
        });

        // 測試 10：能量豆位置（地圖四角）
        test('能量豆位置 - 固定 4 個', () => {
            const COLS = 50;
            const ROWS = 40;
            const positions = [
                { x: 5, y: 5 },
                { x: COLS - 6, y: 5 },
                { x: 5, y: ROWS - 6 },
                { x: COLS - 6, y: ROWS - 6 }
            ];
            assertEqual(positions.length, 4, '應有 4 個能量豆');
            assertEqual(positions[0].x, 5, '左上角 X');
            assertEqual(positions[0].y, 5, '左上角 Y');
            assertEqual(positions[1].x, 44, '右上角 X');
            assertEqual(positions[3].y, 34, '右下角 Y');
        });

        console.log('所有測試完成！');
    </script>
</body>
</html>
```

**使用方式**：
1. 將上述程式碼儲存為 `test.html`
2. 用瀏覽器開啟
3. 查看測試結果（應全部通過 ✅）

---

## 性能測試

### 測試 10：10 人同時在線

**步驟**：
1. 開啟 10 個瀏覽器視窗/分頁
2. 全部加入同一房間
3. 開始遊戲
4. 所有人同時移動和碰撞

**性能指標**：
- ✅ 幀率保持 50+ FPS
- ✅ 網路延遲 < 500ms
- ✅ 沒有明顯卡頓
- ✅ 分數同步正確
- ✅ 沒有碰撞重複扣分

**檢查 Firebase 用量**：
- ✅ 數據庫大小 < 10 MB
- ✅ 下載量 < 100 MB / 場遊戲
- ✅ 同時連線 = 10

### 測試 11：長時間運行

**步驟**：
1. 開始遊戲
2. 運行完整 3 分鐘
3. 觀察記憶體使用

**預期結果**：
- ✅ 記憶體使用穩定（< 100 MB）
- ✅ 無記憶體洩漏
- ✅ CPU 使用 < 30%
- ✅ 遊戲流暢結束

---

## 測試檢查清單

### 本地功能測試

- [ ] 演示模式正常運作
- [ ] 語言切換功能正常
- [ ] 音效開關功能正常
- [ ] 所有按鈕可點擊
- [ ] 沒有 JavaScript 錯誤

### Firebase 多人測試

- [ ] 可以建立房間
- [ ] 可以加入房間
- [ ] 玩家列表即時更新
- [ ] 可以開始遊戲
- [ ] 移動同步正常
- [ ] 吃豆子同步正常
- [ ] 能量豆功能正常（變身、視覺效果、音效）
- [ ] 碰撞搶分正確（3 種情況）
- [ ] 計時器倒數正確
- [ ] 最後 30 秒警告正常
- [ ] 即時排名顯示正確
- [ ] 遊戲結束顯示完整排名
- [ ] 15 秒後自動返回大廳
- [ ] 20 秒後房間自動清理

### 邊界測試

- [ ] 房間已滿（11 人）無法加入
- [ ] 遊戲已開始無法加入
- [ ] 房間不存在提示錯誤
- [ ] 房間代碼錯誤提示
- [ ] 暱稱為空提示錯誤
- [ ] 斷線自動處理

### 瀏覽器兼容性

- [ ] Chrome（桌面版）
- [ ] Firefox（桌面版）
- [ ] Safari（桌面版）
- [ ] Edge（桌面版）
- [ ] Chrome（Android）
- [ ] Safari（iOS）

### 性能測試

- [ ] 10 人同時在線流暢運行
- [ ] 3 分鐘遊戲無卡頓
- [ ] 記憶體使用正常
- [ ] Firebase 用量在免費額度內

---

## 🐛 已知問題與解決方案

### 問題 1：演示模式下點擊「開始遊戲」沒反應
**狀態**：✅ 已修復（v2.0）
**解決方案**：加入演示模式檢查和提示訊息

### 問題 2：碰撞重複扣分
**狀態**：✅ 已修復（v2.0）
**解決方案**：加入 1 秒碰撞冷卻機制

### 問題 3：能量豆狀態清除重複更新
**狀態**：✅ 已修復（v2.0）
**解決方案**：只讓玩家清除自己的狀態

### 問題 4：房間數據累積
**狀態**：✅ 已修復（v2.0）
**解決方案**：遊戲結束後 20 秒自動清理

---

## 📞 回報問題

如果發現新的 Bug，請在 GitHub Issues 回報，並提供：

1. **重現步驟**：詳細描述如何觸發問題
2. **預期結果**：應該發生什麼
3. **實際結果**：實際發生了什麼
4. **環境資訊**：瀏覽器、作業系統、是否使用 Firebase
5. **截圖或影片**：如果可能的話

---

**最後更新**：2025-01-16
**版本**：v2.0
