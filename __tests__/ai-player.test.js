/**
 * AI Player System Tests
 * 測試 AI 玩家的行為、決策和整合功能
 *
 * @version 3.1.0
 */

const { AIPlayer, AIManager, AI_DIFFICULTY, AI_CONFIG } = require('../ai-player.js');

describe('🤖 AI Player System Tests', () => {

  // ==================== AI 配置測試 ====================

  describe('AI 配置', () => {
    test('應該有三種難度等級', () => {
      expect(AI_DIFFICULTY).toHaveProperty('EASY');
      expect(AI_DIFFICULTY).toHaveProperty('MEDIUM');
      expect(AI_DIFFICULTY).toHaveProperty('HARD');
    });

    test('每種難度應該有對應的配置', () => {
      expect(AI_CONFIG).toHaveProperty('easy');
      expect(AI_CONFIG).toHaveProperty('medium');
      expect(AI_CONFIG).toHaveProperty('hard');
    });

    test('困難 AI 應該比簡單 AI 反應更快', () => {
      expect(AI_CONFIG.hard.moveDelay).toBeLessThan(AI_CONFIG.easy.moveDelay);
      expect(AI_CONFIG.hard.thinkingTime).toBeLessThan(AI_CONFIG.easy.thinkingTime);
    });

    test('困難 AI 應該有更高的追擊機率', () => {
      expect(AI_CONFIG.hard.chaseChance).toBeGreaterThan(AI_CONFIG.easy.chaseChance);
    });

    test('困難 AI 應該有更低的隨機移動機率', () => {
      expect(AI_CONFIG.hard.randomMoveChance).toBeLessThan(AI_CONFIG.easy.randomMoveChance);
    });
  });

  // ==================== AIPlayer 類別測試 ====================

  describe('AIPlayer 類別', () => {
    let gameState;
    let aiPlayer;

    beforeEach(() => {
      // 創建測試用的遊戲狀態
      gameState = {
        maze: createTestMaze(),
        players: {
          'ai_1': { x: 10, y: 10, score: 100, powerMode: false },
          'player_1': { x: 15, y: 10, score: 200, powerMode: false }
        }
      };

      aiPlayer = new AIPlayer('ai_1', 'TestAI', 'medium', gameState);
      aiPlayer.x = 10;
      aiPlayer.y = 10;
      aiPlayer.score = 100;
    });

    test('應該正確創建 AI 玩家', () => {
      expect(aiPlayer.id).toBe('ai_1');
      expect(aiPlayer.name).toBe('TestAI');
      expect(aiPlayer.difficulty).toBe('medium');
      expect(aiPlayer.isAI).toBe(true);
    });

    test('應該根據難度使用正確的配置', () => {
      const easyAI = new AIPlayer('ai_2', 'EasyAI', 'easy', gameState);
      const hardAI = new AIPlayer('ai_3', 'HardAI', 'hard', gameState);

      expect(easyAI.config).toEqual(AI_CONFIG.easy);
      expect(hardAI.config).toEqual(AI_CONFIG.hard);
    });

    test('應該能夠啟動和停止 AI', () => {
      aiPlayer.start();
      expect(aiPlayer.thinkingInterval).not.toBeNull();

      aiPlayer.stop();
      expect(aiPlayer.thinkingInterval).toBeNull();
    });

    test('應該能夠計算兩點之間的距離（曼哈頓距離）', () => {
      const distance = aiPlayer.getDistance(0, 0, 3, 4);
      expect(distance).toBe(7); // |3-0| + |4-0| = 7
    });

    test('應該能夠檢查移動是否有效', () => {
      // 空地 - 有效
      expect(aiPlayer.isValidMove(10, 11)).toBe(true);

      // 牆壁 - 無效
      expect(aiPlayer.isValidMove(0, 0)).toBe(false);

      // 邊界外 - 無效
      expect(aiPlayer.isValidMove(-1, 10)).toBe(false);
      expect(aiPlayer.isValidMove(10, 100)).toBe(false);
    });

    test('應該能夠根據方向計算新位置', () => {
      expect(aiPlayer.getNewPosition(10, 10, 'up')).toEqual({ x: 10, y: 9 });
      expect(aiPlayer.getNewPosition(10, 10, 'down')).toEqual({ x: 10, y: 11 });
      expect(aiPlayer.getNewPosition(10, 10, 'left')).toEqual({ x: 9, y: 10 });
      expect(aiPlayer.getNewPosition(10, 10, 'right')).toEqual({ x: 11, y: 10 });
    });

    test('應該能夠更新 AI 狀態', () => {
      const newData = {
        x: 15,
        y: 20,
        score: 250,
        powerMode: true,
        powerEndTime: Date.now() + 15000
      };

      aiPlayer.update(newData);

      expect(aiPlayer.x).toBe(15);
      expect(aiPlayer.y).toBe(20);
      expect(aiPlayer.score).toBe(250);
      expect(aiPlayer.powerMode).toBe(true);
    });
  });

  // ==================== AI 決策測試 ====================

  describe('AI 決策邏輯', () => {
    let gameState;
    let aiPlayer;

    beforeEach(() => {
      gameState = {
        maze: createTestMaze(),
        players: {
          'ai_1': { x: 10, y: 10, score: 100, powerMode: false },
          'player_1': { x: 12, y: 10, score: 200, powerMode: true }
        }
      };

      aiPlayer = new AIPlayer('ai_1', 'TestAI', 'medium', gameState);
      aiPlayer.x = 10;
      aiPlayer.y = 10;
    });

    test('應該能夠分析當前情況', () => {
      const situation = aiPlayer.analyzeSituation();

      expect(situation).toHaveProperty('inDanger');
      expect(situation).toHaveProperty('threats');
      expect(situation).toHaveProperty('targets');
      expect(situation).toHaveProperty('nearbyDot');
      expect(situation).toHaveProperty('nearbyPowerPellet');
    });

    test('應該能夠偵測威脅（附近有能量豆模式的玩家）', () => {
      const situation = aiPlayer.analyzeSituation();

      expect(situation.inDanger).toBe(true);
      expect(situation.threats.length).toBeGreaterThan(0);
      expect(situation.threats[0].player.powerMode).toBe(true);
    });

    test('應該能夠找到最近的豆子', () => {
      // 在地圖上放置豆子
      gameState.maze[11][10] = 2; // 豆子在下方一格

      const nearbyDot = aiPlayer.findNearestDot();

      expect(nearbyDot).not.toBeNull();
      expect(nearbyDot.x).toBe(10);
      expect(nearbyDot.y).toBe(11);
    });

    test('應該能夠找到最近的能量豆', () => {
      // 在地圖上放置能量豆
      gameState.maze[15][15] = 3; // 能量豆

      const nearbyPowerPellet = aiPlayer.findNearestPowerPellet();

      expect(nearbyPowerPellet).not.toBeNull();
      expect(nearbyPowerPellet.x).toBe(15);
      expect(nearbyPowerPellet.y).toBe(15);
    });

    test('應該能夠獲取隨機有效方向', () => {
      const direction = aiPlayer.getRandomValidDirection();

      expect(direction).toMatch(/^(up|down|left|right)$/);

      // 驗證方向是有效的
      const newPos = aiPlayer.getNewPosition(aiPlayer.x, aiPlayer.y, direction);
      expect(aiPlayer.isValidMove(newPos.x, newPos.y)).toBe(true);
    });

    test('應該能夠找到通往目標的路徑', () => {
      const targetX = 12;
      const targetY = 10;

      const direction = aiPlayer.findPathTo(targetX, targetY);

      expect(direction).not.toBeNull();
      expect(direction).toMatch(/^(up|down|left|right)$/);

      // 驗證這個方向會讓 AI 更接近目標
      const newPos = aiPlayer.getNewPosition(aiPlayer.x, aiPlayer.y, direction);
      const currentDistance = aiPlayer.getDistance(aiPlayer.x, aiPlayer.y, targetX, targetY);
      const newDistance = aiPlayer.getDistance(newPos.x, newPos.y, targetX, targetY);

      expect(newDistance).toBeLessThanOrEqual(currentDistance);
    });
  });

  // ==================== AIManager 類別測試 ====================

  describe('AIManager 類別', () => {
    let aiManager;
    let gameState;

    beforeEach(() => {
      gameState = {
        maze: createTestMaze(),
        players: {}
      };

      aiManager = new AIManager();
      aiManager.setGameState(gameState);
    });

    test('應該能夠創建 AI 玩家', () => {
      const ai = aiManager.createAI('ai_1', 'TestAI', 'medium');

      expect(ai).toBeInstanceOf(AIPlayer);
      expect(ai.id).toBe('ai_1');
      expect(ai.name).toBe('TestAI');
      expect(ai.difficulty).toBe('medium');
      expect(aiManager.getAI('ai_1')).toBe(ai);
    });

    test('應該能夠移除 AI 玩家', () => {
      const ai = aiManager.createAI('ai_1', 'TestAI', 'medium');
      ai.start();

      aiManager.removeAI('ai_1');

      expect(aiManager.getAI('ai_1')).toBeUndefined();
      expect(ai.thinkingInterval).toBeNull();
    });

    test('應該能夠啟動所有 AI', () => {
      const ai1 = aiManager.createAI('ai_1', 'AI1', 'easy');
      const ai2 = aiManager.createAI('ai_2', 'AI2', 'medium');

      aiManager.startAll();

      expect(ai1.thinkingInterval).not.toBeNull();
      expect(ai2.thinkingInterval).not.toBeNull();

      aiManager.stopAll();
    });

    test('應該能夠停止所有 AI', () => {
      const ai1 = aiManager.createAI('ai_1', 'AI1', 'easy');
      const ai2 = aiManager.createAI('ai_2', 'AI2', 'medium');

      aiManager.startAll();
      aiManager.stopAll();

      expect(ai1.thinkingInterval).toBeNull();
      expect(ai2.thinkingInterval).toBeNull();
    });

    test('應該能夠更新所有 AI 的狀態', () => {
      const ai1 = aiManager.createAI('ai_1', 'AI1', 'easy');
      const ai2 = aiManager.createAI('ai_2', 'AI2', 'medium');

      const playersData = {
        'ai_1': { x: 5, y: 5, score: 100 },
        'ai_2': { x: 10, y: 10, score: 200 }
      };

      aiManager.updateAll(playersData);

      expect(ai1.x).toBe(5);
      expect(ai1.y).toBe(5);
      expect(ai1.score).toBe(100);

      expect(ai2.x).toBe(10);
      expect(ai2.y).toBe(10);
      expect(ai2.score).toBe(200);
    });

    test('應該能夠獲取所有 AI 的移動指令', () => {
      const ai1 = aiManager.createAI('ai_1', 'AI1', 'easy');
      const ai2 = aiManager.createAI('ai_2', 'AI2', 'medium');

      ai1.x = 10;
      ai1.y = 10;
      ai2.x = 20;
      ai2.y = 20;

      // 手動添加移動到佇列
      ai1.moveQueue.push('up');
      ai2.moveQueue.push('right');

      const moves = aiManager.getAllMoves();

      expect(moves).toHaveProperty('ai_1');
      expect(moves).toHaveProperty('ai_2');
      expect(moves['ai_1']).toBe('up');
      expect(moves['ai_2']).toBe('right');
    });
  });

  // ==================== AI 策略測試 ====================

  describe('AI 策略行為', () => {
    let gameState;

    beforeEach(() => {
      gameState = {
        maze: createTestMaze(),
        players: {}
      };
    });

    test('簡單 AI 應該有較高的隨機移動機率', () => {
      const easyAI = new AIPlayer('ai_easy', 'EasyAI', 'easy', gameState);
      expect(easyAI.config.randomMoveChance).toBeGreaterThanOrEqual(0.3);
    });

    test('中等 AI 應該平衡隨機性和策略性', () => {
      const mediumAI = new AIPlayer('ai_medium', 'MediumAI', 'medium', gameState);
      expect(mediumAI.config.randomMoveChance).toBeGreaterThan(0);
      expect(mediumAI.config.randomMoveChance).toBeLessThan(0.3);
      expect(mediumAI.config.chaseChance).toBeGreaterThanOrEqual(0.5);
    });

    test('困難 AI 應該有高追擊機率和低隨機性', () => {
      const hardAI = new AIPlayer('ai_hard', 'HardAI', 'hard', gameState);
      expect(hardAI.config.randomMoveChance).toBeLessThanOrEqual(0.1);
      expect(hardAI.config.chaseChance).toBeGreaterThanOrEqual(0.8);
    });

    test('有能量豆的 AI 應該能夠識別追擊目標', () => {
      gameState.players = {
        'ai_1': { x: 10, y: 10, score: 100, powerMode: true },
        'player_1': { x: 12, y: 10, score: 200, powerMode: false }
      };

      const aiPlayer = new AIPlayer('ai_1', 'TestAI', 'hard', gameState);
      aiPlayer.x = 10;
      aiPlayer.y = 10;
      aiPlayer.powerMode = true;

      const situation = aiPlayer.analyzeSituation();

      expect(situation.targets.length).toBeGreaterThan(0);
      expect(situation.targets[0].player.powerMode).toBe(false);
    });

    test('困難 AI 應該優先追擊高分玩家', () => {
      gameState.players = {
        'ai_1': { x: 10, y: 10, score: 100, powerMode: true },
        'player_1': { x: 12, y: 10, score: 300, powerMode: false },
        'player_2': { x: 13, y: 10, score: 150, powerMode: false }
      };

      const hardAI = new AIPlayer('ai_1', 'HardAI', 'hard', gameState);
      hardAI.x = 10;
      hardAI.y = 10;
      hardAI.powerMode = true;

      const situation = hardAI.analyzeSituation();
      const direction = hardAI.findChaseTarget(situation.targets);

      // 應該朝向高分玩家 (player_1) 移動
      expect(direction).not.toBeNull();
    });
  });

  // ==================== 輔助函數 ====================

  /**
   * 創建測試用的迷宮
   */
  function createTestMaze() {
    const maze = [];
    const ROWS = 40;
    const COLS = 50;

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
});
