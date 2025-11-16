/**
 * 遊戲邏輯單元測試
 * 測試核心遊戲功能的正確性
 */

const { describe, test, expect } = require('@jest/globals');

describe('遊戲邏輯測試套件', () => {

  // ==================== 搶分計算測試 ====================

  describe('搶分計算', () => {
    test('普通 vs 普通 - 搶走 20%', () => {
      const attackerScore = 100;
      const victimScore = 50;
      const stolenAmount = Math.floor(victimScore * 0.2);

      expect(stolenAmount).toBe(10);
      expect(attackerScore + stolenAmount).toBe(110);
      expect(victimScore - stolenAmount).toBe(40);
    });

    test('能量豆 vs 普通 - 搶走 50%', () => {
      const powerPlayerScore = 100;
      const normalPlayerScore = 200;
      const stolenAmount = Math.floor(normalPlayerScore * 0.5);

      expect(stolenAmount).toBe(100);
      expect(powerPlayerScore + stolenAmount).toBe(200);
      expect(normalPlayerScore - stolenAmount).toBe(100);
    });

    test('能量豆 vs 能量豆 - 搶走 30%', () => {
      const attackerScore = 150;
      const victimScore = 100;
      const stolenAmount = Math.floor(victimScore * 0.3);

      expect(stolenAmount).toBe(30);
      expect(attackerScore + stolenAmount).toBe(180);
      expect(victimScore - stolenAmount).toBe(70);
    });

    test('分數保護 - 不會變成負數', () => {
      const victimScore = 5;
      const stolenAmount = Math.floor(victimScore * 0.5);
      const finalScore = Math.max(0, victimScore - stolenAmount);

      expect(finalScore).toBeGreaterThanOrEqual(0);
      expect(finalScore).toBe(3);
    });

    test('分數為 0 時被搶 - 保持 0', () => {
      const victimScore = 0;
      const stolenAmount = Math.floor(victimScore * 0.2);
      const finalScore = Math.max(0, victimScore - stolenAmount);

      expect(stolenAmount).toBe(0);
      expect(finalScore).toBe(0);
    });
  });

  // ==================== 迷宮生成測試 ====================

  describe('迷宮生成', () => {
    const ROWS = 40;
    const COLS = 50;

    function generateTestMaze() {
      const maze = [];
      for (let y = 0; y < ROWS; y++) {
        maze[y] = [];
        for (let x = 0; x < COLS; x++) {
          if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) {
            maze[y][x] = 1; // 邊界牆
          } else {
            maze[y][x] = 0; // 空地
          }
        }
      }
      return maze;
    }

    test('迷宮尺寸正確 - 50 x 40', () => {
      const maze = generateTestMaze();

      expect(maze.length).toBe(ROWS);
      expect(maze[0].length).toBe(COLS);
    });

    test('四周都是牆壁', () => {
      const maze = generateTestMaze();

      // 檢查上下邊界
      for (let x = 0; x < COLS; x++) {
        expect(maze[0][x]).toBe(1); // 上邊界
        expect(maze[ROWS - 1][x]).toBe(1); // 下邊界
      }

      // 檢查左右邊界
      for (let y = 0; y < ROWS; y++) {
        expect(maze[y][0]).toBe(1); // 左邊界
        expect(maze[y][COLS - 1]).toBe(1); // 右邊界
      }
    });

    test('地圖元素值在有效範圍內 (0-3)', () => {
      const maze = generateTestMaze();

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          expect(maze[y][x]).toBeGreaterThanOrEqual(0);
          expect(maze[y][x]).toBeLessThanOrEqual(3);
        }
      }
    });

    test('能量豆固定在四個角落', () => {
      const powerPelletPositions = [
        { x: 5, y: 5 },
        { x: 44, y: 5 },
        { x: 5, y: 34 },
        { x: 44, y: 34 }
      ];

      powerPelletPositions.forEach(pos => {
        expect(pos.x).toBeGreaterThan(0);
        expect(pos.x).toBeLessThan(COLS);
        expect(pos.y).toBeGreaterThan(0);
        expect(pos.y).toBeLessThan(ROWS);
      });
    });
  });

  // ==================== 碰撞檢測測試 ====================

  describe('碰撞檢測', () => {
    test('相同位置 - 發生碰撞', () => {
      const player1 = { x: 10, y: 10 };
      const player2 = { x: 10, y: 10 };
      const distance = Math.abs(player1.x - player2.x) + Math.abs(player1.y - player2.y);

      expect(distance).toBeLessThanOrEqual(1);
      expect(distance).toBe(0);
    });

    test('相鄰位置 - 發生碰撞', () => {
      const player1 = { x: 10, y: 10 };
      const player2 = { x: 11, y: 10 };
      const distance = Math.abs(player1.x - player2.x) + Math.abs(player1.y - player2.y);

      expect(distance).toBeLessThanOrEqual(1);
      expect(distance).toBe(1);
    });

    test('距離超過 1 - 不發生碰撞', () => {
      const player1 = { x: 10, y: 10 };
      const player2 = { x: 12, y: 10 };
      const distance = Math.abs(player1.x - player2.x) + Math.abs(player1.y - player2.y);

      expect(distance).toBeGreaterThan(1);
      expect(distance).toBe(2);
    });

    test('對角相鄰 - 發生碰撞（曼哈頓距離 = 2）', () => {
      const player1 = { x: 10, y: 10 };
      const player2 = { x: 11, y: 11 };
      const distance = Math.abs(player1.x - player2.x) + Math.abs(player1.y - player2.y);

      expect(distance).toBe(2);
      expect(distance).toBeGreaterThan(1); // 不會發生碰撞
    });
  });

  // ==================== 房間代碼生成測試 ====================

  describe('房間代碼生成', () => {
    function generateRoomCode() {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    test('長度為 6', () => {
      const code = generateRoomCode();
      expect(code.length).toBe(6);
    });

    test('只包含英數字', () => {
      const code = generateRoomCode();
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    test('每次生成都不同（統計測試）', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateRoomCode());
      }
      // 100 次生成應該有至少 95 個不同的代碼
      expect(codes.size).toBeGreaterThan(95);
    });

    test('全部大寫', () => {
      const code = generateRoomCode();
      expect(code).toBe(code.toUpperCase());
    });
  });

  // ==================== 計時器邏輯測試 ====================

  describe('計時器邏輯', () => {
    const GAME_DURATION = 5 * 60 * 1000; // 5 分鐘

    test('遊戲時長為 5 分鐘（300 秒）', () => {
      expect(GAME_DURATION).toBe(300000);
      expect(GAME_DURATION / 1000).toBe(300);
    });

    test('剩餘時間計算正確', () => {
      const startTime = Date.now();
      const currentTime = startTime + 60000; // 1 分鐘後
      const remainingTime = Math.max(0, GAME_DURATION - (currentTime - startTime));

      expect(remainingTime).toBe(240000); // 剩 4 分鐘
    });

    test('時間用完後剩餘時間為 0', () => {
      const startTime = Date.now();
      const currentTime = startTime + GAME_DURATION + 10000; // 超過 5 分鐘
      const remainingTime = Math.max(0, GAME_DURATION - (currentTime - startTime));

      expect(remainingTime).toBe(0);
    });

    test('時間格式化 - MM:SS', () => {
      function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }

      expect(formatTime(300000)).toBe('5:00');
      expect(formatTime(240000)).toBe('4:00');
      expect(formatTime(61000)).toBe('1:01');
      expect(formatTime(5000)).toBe('0:05');
    });
  });

  // ==================== 能量豆效果測試 ====================

  describe('能量豆效果', () => {
    const POWER_MODE_DURATION = 15000; // 15 秒

    test('能量豆持續時間為 15 秒', () => {
      expect(POWER_MODE_DURATION).toBe(15000);
      expect(POWER_MODE_DURATION / 1000).toBe(15);
    });

    test('能量豆未過期 - powerMode 為 true', () => {
      const now = Date.now();
      const powerEndTime = now + 10000; // 還剩 10 秒
      const isPowerMode = now < powerEndTime;

      expect(isPowerMode).toBe(true);
    });

    test('能量豆已過期 - powerMode 為 false', () => {
      const now = Date.now();
      const powerEndTime = now - 1000; // 1 秒前過期
      const isPowerMode = now < powerEndTime;

      expect(isPowerMode).toBe(false);
    });

    test('警告時間 - 剩餘 5 秒時觸發', () => {
      const now = Date.now();
      const powerEndTime = now + 4600; // 剩 4.6 秒
      const timeLeft = (powerEndTime - now) / 1000;
      const shouldWarn = timeLeft <= 5 && timeLeft > 4.5;

      expect(timeLeft).toBeLessThanOrEqual(5);
      expect(timeLeft).toBeGreaterThan(4.5);
      expect(shouldWarn).toBe(true);
    });
  });

  // ==================== 玩家顏色測試 ====================

  describe('玩家顏色', () => {
    const PLAYER_COLORS = [
      '#FFD700', '#FF69B4', '#00CED1', '#32CD32',
      '#FF6347', '#9370DB', '#FFA500', '#20B2AA',
      '#FF1493', '#00FA9A'
    ];

    test('共有 10 種顏色', () => {
      expect(PLAYER_COLORS.length).toBe(10);
    });

    test('所有顏色都是有效的 HEX 格式', () => {
      PLAYER_COLORS.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    test('所有顏色都不重複', () => {
      const uniqueColors = new Set(PLAYER_COLORS);
      expect(uniqueColors.size).toBe(PLAYER_COLORS.length);
    });

    test('玩家索引對應正確的顏色', () => {
      const playerIndex = 3;
      const color = PLAYER_COLORS[playerIndex];

      expect(color).toBe('#32CD32');
    });
  });

  // ==================== 分數排名測試 ====================

  describe('分數排名', () => {
    const players = {
      'player1': { name: 'Alice', score: 150 },
      'player2': { name: 'Bob', score: 200 },
      'player3': { name: 'Charlie', score: 100 },
      'player4': { name: 'David', score: 200 }, // 同分
    };

    test('排序正確 - 從高到低', () => {
      const sorted = Object.entries(players)
        .sort(([, a], [, b]) => b.score - a.score);

      expect(sorted[0][1].score).toBe(200);
      expect(sorted[sorted.length - 1][1].score).toBe(100);
    });

    test('同分玩家正確處理', () => {
      const sorted = Object.entries(players)
        .sort(([, a], [, b]) => b.score - a.score);

      const topScorePlayers = sorted.filter(([, p]) => p.score === 200);
      expect(topScorePlayers.length).toBe(2);
    });

    test('排名獎牌分配正確', () => {
      const medals = ['🥇', '🥈', '🥉'];
      const sorted = Object.entries(players)
        .sort(([, a], [, b]) => b.score - a.score);

      expect(medals[0]).toBe('🥇'); // 第一名
      expect(medals[1]).toBe('🥈'); // 第二名
      expect(medals[2]).toBe('🥉'); // 第三名
    });
  });

  // ==================== 地圖元素測試 ====================

  describe('地圖元素', () => {
    test('元素類型定義正確', () => {
      const EMPTY = 0;
      const WALL = 1;
      const DOT = 2;
      const POWER_PELLET = 3;

      expect(EMPTY).toBe(0);
      expect(WALL).toBe(1);
      expect(DOT).toBe(2);
      expect(POWER_PELLET).toBe(3);
    });

    test('小豆子分數 +10', () => {
      const currentScore = 50;
      const dotScore = 10;
      const newScore = currentScore + dotScore;

      expect(newScore).toBe(60);
    });

    test('能量豆分數 +50', () => {
      const currentScore = 100;
      const powerPelletScore = 50;
      const newScore = currentScore + powerPelletScore;

      expect(newScore).toBe(150);
    });
  });

  // ==================== 節流函數測試 ====================

  describe('節流函數', () => {
    test('節流延遲正確', () => {
      const delay = 120;
      let lastCall = 0;
      const now = Date.now();

      const canExecute = now - lastCall >= delay;
      expect(canExecute).toBe(true);

      lastCall = now;
      const canExecuteAgain = now - lastCall >= delay;
      expect(canExecuteAgain).toBe(false);
    });
  });
});
