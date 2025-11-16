/**
 * AI Player System for Online Little Elf
 * 支援三種難度等級的 AI 玩家
 *
 * @version 3.1.0
 * @author Claude Code
 */

// ==================== AI 難度常數 ====================

const AI_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

const AI_CONFIG = {
  // 簡單 AI
  easy: {
    moveDelay: 300,           // 移動延遲（毫秒）
    thinkingTime: 200,        // 思考時間
    randomMoveChance: 0.3,    // 隨機移動機率
    chaseChance: 0.2,         // 追擊機率
    escapeChance: 0.5,        // 逃跑機率
    usePowerPelletChance: 0.3 // 使用能量豆機率
  },
  // 中等 AI
  medium: {
    moveDelay: 200,
    thinkingTime: 100,
    randomMoveChance: 0.1,
    chaseChance: 0.6,
    escapeChance: 0.8,
    usePowerPelletChance: 0.6
  },
  // 困難 AI
  hard: {
    moveDelay: 150,
    thinkingTime: 50,
    randomMoveChance: 0.05,
    chaseChance: 0.9,
    escapeChance: 0.95,
    usePowerPelletChance: 0.85
  }
};

// ==================== AI 玩家類別 ====================

class AIPlayer {
  /**
   * @param {string} id - AI 玩家 ID
   * @param {string} name - AI 名稱
   * @param {string} difficulty - 難度等級 (easy/medium/hard)
   * @param {Object} gameState - 遊戲狀態參考
   */
  constructor(id, name, difficulty = 'medium', gameState) {
    this.id = id;
    this.name = name;
    this.difficulty = difficulty;
    this.config = AI_CONFIG[difficulty];
    this.gameState = gameState;

    this.x = 0;
    this.y = 0;
    this.score = 0;
    this.powerMode = false;
    this.powerEndTime = 0;
    this.isAI = true;

    this.thinkingInterval = null;
    this.moveQueue = [];
  }

  /**
   * 啟動 AI 思考循環
   */
  start() {
    this.stop(); // 先停止舊的
    this.thinkingInterval = setInterval(() => {
      this.think();
    }, this.config.thinkingTime);
  }

  /**
   * 停止 AI
   */
  stop() {
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }
  }

  /**
   * AI 思考主邏輯
   */
  think() {
    if (!this.gameState || !this.gameState.maze) return;

    // 1. 評估當前狀態
    const situation = this.analyzeSituation();

    // 2. 根據情況決定行動
    let direction = null;

    if (situation.inDanger && Math.random() < this.config.escapeChance) {
      // 逃跑模式
      direction = this.findEscapeRoute(situation.threats);
    } else if (this.powerMode && Math.random() < this.config.chaseChance) {
      // 追擊模式（有能量豆時）
      direction = this.findChaseTarget(situation.targets);
    } else if (situation.nearbyPowerPellet && Math.random() < this.config.usePowerPelletChance) {
      // 尋找能量豆
      direction = this.findPathTo(situation.nearbyPowerPellet.x, situation.nearbyPowerPellet.y);
    } else if (situation.nearbyDot) {
      // 吃豆子
      direction = this.findPathTo(situation.nearbyDot.x, situation.nearbyDot.y);
    } else if (Math.random() < this.config.randomMoveChance) {
      // 隨機移動
      direction = this.getRandomValidDirection();
    } else {
      // 探索地圖
      direction = this.exploreMap();
    }

    // 3. 執行移動
    if (direction) {
      this.moveQueue.push(direction);
    }
  }

  /**
   * 分析當前情況
   */
  analyzeSituation() {
    const situation = {
      inDanger: false,
      threats: [],
      targets: [],
      nearbyDot: null,
      nearbyPowerPellet: null
    };

    const players = this.gameState.players || {};
    const maze = this.gameState.maze || [];

    // 檢查威脅（其他能量模式的玩家）
    for (const [pid, player] of Object.entries(players)) {
      if (pid === this.id) continue;

      const distance = this.getDistance(this.x, this.y, player.x, player.y);

      // 威脅：對方有能量豆且距離近
      if (player.powerMode && !this.powerMode && distance < 5) {
        situation.inDanger = true;
        situation.threats.push({ player, distance });
      }

      // 目標：自己有能量豆，對方沒有
      if (this.powerMode && !player.powerMode && distance < 8) {
        situation.targets.push({ player, distance });
      }
    }

    // 尋找最近的豆子
    situation.nearbyDot = this.findNearestDot();

    // 尋找最近的能量豆
    situation.nearbyPowerPellet = this.findNearestPowerPellet();

    return situation;
  }

  /**
   * 尋找逃跑路線
   */
  findEscapeRoute(threats) {
    const directions = ['up', 'down', 'left', 'right'];
    let bestDirection = null;
    let maxDistance = -1;

    for (const dir of directions) {
      const newPos = this.getNewPosition(this.x, this.y, dir);
      if (!this.isValidMove(newPos.x, newPos.y)) continue;

      // 計算移動後與所有威脅的平均距離
      let totalDistance = 0;
      for (const threat of threats) {
        totalDistance += this.getDistance(newPos.x, newPos.y, threat.player.x, threat.player.y);
      }
      const avgDistance = totalDistance / threats.length;

      if (avgDistance > maxDistance) {
        maxDistance = avgDistance;
        bestDirection = dir;
      }
    }

    return bestDirection || this.getRandomValidDirection();
  }

  /**
   * 尋找追擊目標
   */
  findChaseTarget(targets) {
    if (targets.length === 0) return null;

    // 根據難度選擇目標
    let target;
    if (this.difficulty === 'hard') {
      // 困難 AI：追擊分數最高的
      target = targets.reduce((max, t) =>
        t.player.score > max.player.score ? t : max
      );
    } else {
      // 中等/簡單 AI：追擊最近的
      target = targets.reduce((min, t) =>
        t.distance < min.distance ? t : min
      );
    }

    return this.findPathTo(target.player.x, target.player.y);
  }

  /**
   * 尋找最近的豆子
   */
  findNearestDot() {
    const maze = this.gameState.maze || [];
    let nearest = null;
    let minDistance = Infinity;

    const searchRadius = this.difficulty === 'hard' ? 15 :
                        this.difficulty === 'medium' ? 10 : 5;

    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[0].length; x++) {
        if (maze[y][x] === 2) { // 豆子
          const distance = this.getDistance(this.x, this.y, x, y);
          if (distance < minDistance && distance < searchRadius) {
            minDistance = distance;
            nearest = { x, y, distance };
          }
        }
      }
    }

    return nearest;
  }

  /**
   * 尋找最近的能量豆
   */
  findNearestPowerPellet() {
    const maze = this.gameState.maze || [];
    let nearest = null;
    let minDistance = Infinity;

    const searchRadius = this.difficulty === 'hard' ? 20 : 15;

    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[0].length; x++) {
        if (maze[y][x] === 3) { // 能量豆
          const distance = this.getDistance(this.x, this.y, x, y);
          if (distance < minDistance && distance < searchRadius) {
            minDistance = distance;
            nearest = { x, y, distance };
          }
        }
      }
    }

    return nearest;
  }

  /**
   * A* 尋路算法（簡化版）
   */
  findPathTo(targetX, targetY) {
    // 簡單版本：只看相鄰格子，選擇最接近目標的方向
    const directions = ['up', 'down', 'left', 'right'];
    let bestDirection = null;
    let minDistance = Infinity;

    for (const dir of directions) {
      const newPos = this.getNewPosition(this.x, this.y, dir);
      if (!this.isValidMove(newPos.x, newPos.y)) continue;

      const distance = this.getDistance(newPos.x, newPos.y, targetX, targetY);

      // 困難 AI 會預測前方是否有障礙
      if (this.difficulty === 'hard') {
        const nextPos = this.getNewPosition(newPos.x, newPos.y, dir);
        if (!this.isValidMove(nextPos.x, nextPos.y)) {
          continue; // 跳過會導致卡住的方向
        }
      }

      if (distance < minDistance) {
        minDistance = distance;
        bestDirection = dir;
      }
    }

    return bestDirection;
  }

  /**
   * 探索地圖（走向未探索的區域）
   */
  exploreMap() {
    // 尋找有最多豆子的方向
    const directions = ['up', 'down', 'left', 'right'];
    let bestDirection = null;
    let maxDots = -1;

    for (const dir of directions) {
      const newPos = this.getNewPosition(this.x, this.y, dir);
      if (!this.isValidMove(newPos.x, newPos.y)) continue;

      // 計算該方向 3 格內的豆子數量
      const dotCount = this.countDotsInDirection(newPos.x, newPos.y, dir, 3);

      if (dotCount > maxDots) {
        maxDots = dotCount;
        bestDirection = dir;
      }
    }

    return bestDirection || this.getRandomValidDirection();
  }

  /**
   * 計算方向上的豆子數量
   */
  countDotsInDirection(x, y, direction, steps) {
    let count = 0;
    const maze = this.gameState.maze || [];

    for (let i = 1; i <= steps; i++) {
      const pos = this.getNewPosition(x, y, direction);
      if (pos.y >= 0 && pos.y < maze.length &&
          pos.x >= 0 && pos.x < maze[0].length) {
        if (maze[pos.y][pos.x] === 2 || maze[pos.y][pos.x] === 3) {
          count++;
        }
      }
      x = pos.x;
      y = pos.y;
    }

    return count;
  }

  /**
   * 獲取隨機有效方向
   */
  getRandomValidDirection() {
    const directions = ['up', 'down', 'left', 'right'];
    const validDirections = directions.filter(dir => {
      const newPos = this.getNewPosition(this.x, this.y, dir);
      return this.isValidMove(newPos.x, newPos.y);
    });

    if (validDirections.length === 0) return null;
    return validDirections[Math.floor(Math.random() * validDirections.length)];
  }

  /**
   * 檢查移動是否有效
   */
  isValidMove(x, y) {
    const maze = this.gameState.maze || [];

    // 邊界檢查
    if (y < 0 || y >= maze.length || x < 0 || x >= maze[0].length) {
      return false;
    }

    // 牆壁檢查
    if (maze[y][x] === 1) {
      return false;
    }

    return true;
  }

  /**
   * 根據方向計算新位置
   */
  getNewPosition(x, y, direction) {
    switch (direction) {
      case 'up': return { x, y: y - 1 };
      case 'down': return { x, y: y + 1 };
      case 'left': return { x: x - 1, y };
      case 'right': return { x: x + 1, y };
      default: return { x, y };
    }
  }

  /**
   * 計算兩點距離（曼哈頓距離）
   */
  getDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  /**
   * 獲取下一個移動指令
   */
  getNextMove() {
    return this.moveQueue.shift() || null;
  }

  /**
   * 更新 AI 狀態
   */
  update(playerData) {
    this.x = playerData.x;
    this.y = playerData.y;
    this.score = playerData.score;
    this.powerMode = playerData.powerMode || false;
    this.powerEndTime = playerData.powerEndTime || 0;
  }
}

// ==================== AI 管理器 ====================

class AIManager {
  constructor() {
    this.aiPlayers = new Map();
    this.gameState = null;
  }

  /**
   * 設置遊戲狀態參考
   */
  setGameState(gameState) {
    this.gameState = gameState;
  }

  /**
   * 創建 AI 玩家
   */
  createAI(id, name, difficulty = 'medium') {
    const ai = new AIPlayer(id, name, difficulty, this.gameState);
    this.aiPlayers.set(id, ai);
    return ai;
  }

  /**
   * 移除 AI 玩家
   */
  removeAI(id) {
    const ai = this.aiPlayers.get(id);
    if (ai) {
      ai.stop();
      this.aiPlayers.delete(id);
    }
  }

  /**
   * 啟動所有 AI
   */
  startAll() {
    for (const ai of this.aiPlayers.values()) {
      ai.start();
    }
  }

  /**
   * 停止所有 AI
   */
  stopAll() {
    for (const ai of this.aiPlayers.values()) {
      ai.stop();
    }
  }

  /**
   * 獲取 AI 玩家
   */
  getAI(id) {
    return this.aiPlayers.get(id);
  }

  /**
   * 更新所有 AI 狀態
   */
  updateAll(playersData) {
    for (const [id, playerData] of Object.entries(playersData)) {
      const ai = this.aiPlayers.get(id);
      if (ai) {
        ai.update(playerData);
      }
    }
  }

  /**
   * 獲取所有 AI 的移動指令
   */
  getAllMoves() {
    const moves = {};
    for (const [id, ai] of this.aiPlayers.entries()) {
      const move = ai.getNextMove();
      if (move) {
        moves[id] = move;
      }
    }
    return moves;
  }
}

// ==================== 導出 ====================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AIPlayer,
    AIManager,
    AI_DIFFICULTY,
    AI_CONFIG
  };
}
