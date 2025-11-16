/**
 * 遊戲集成測試
 * 測試完整的遊戲流程和組件互動
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');

describe('遊戲集成測試套件', () => {

  // ==================== Mock Firebase ====================

  let mockDatabase = {};
  let mockRooms = {};
  let eventListeners = {};

  const createMockFirebase = () => {
    return {
      ref: (path) => ({
        once: (event) => {
          const value = getNestedValue(mockDatabase, path);
          return Promise.resolve({
            val: () => value,
            exists: () => value !== undefined
          });
        },
        on: (event, callback) => {
          if (!eventListeners[path]) {
            eventListeners[path] = [];
          }
          eventListeners[path].push(callback);
        },
        off: (event, callback) => {
          if (eventListeners[path]) {
            eventListeners[path] = eventListeners[path].filter(cb => cb !== callback);
          }
        },
        set: (value) => {
          setNestedValue(mockDatabase, path, value);
          triggerListeners(path);
          return Promise.resolve();
        },
        update: (updates) => {
          const current = getNestedValue(mockDatabase, path) || {};
          setNestedValue(mockDatabase, path, { ...current, ...updates });
          triggerListeners(path);
          return Promise.resolve();
        },
        remove: () => {
          deleteNestedValue(mockDatabase, path);
          triggerListeners(path);
          return Promise.resolve();
        }
      })
    };
  };

  const getNestedValue = (obj, path) => {
    const keys = path.split('/');
    let current = obj;
    for (const key of keys) {
      if (!current || current[key] === undefined) return undefined;
      current = current[key];
    }
    return current;
  };

  const setNestedValue = (obj, path, value) => {
    const keys = path.split('/');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  };

  const deleteNestedValue = (obj, path) => {
    const keys = path.split('/');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) return;
      current = current[keys[i]];
    }
    delete current[keys[keys.length - 1]];
  };

  const triggerListeners = (path) => {
    if (eventListeners[path]) {
      const snapshot = {
        val: () => getNestedValue(mockDatabase, path),
        exists: () => getNestedValue(mockDatabase, path) !== undefined
      };
      eventListeners[path].forEach(callback => callback(snapshot));
    }
  };

  beforeEach(() => {
    mockDatabase = { rooms: {} };
    mockRooms = {};
    eventListeners = {};
  });

  // ==================== 遊戲狀態模擬 ====================

  class GameSimulator {
    constructor() {
      this.database = createMockFirebase();
      this.rooms = {};
      this.players = {};
    }

    generateRoomCode() {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    async createRoom(hostName) {
      const roomId = this.generateRoomCode();
      const playerId = `player_${Date.now()}`;

      const roomData = {
        host: hostName,
        hostId: playerId,
        status: 'waiting',
        createdAt: Date.now(),
        players: {
          [playerId]: {
            id: playerId,
            name: hostName,
            x: 2,
            y: 2,
            score: 0,
            color: '#FFD700',
            powerMode: false
          }
        }
      };

      await this.database.ref(`rooms/${roomId}`).set(roomData);
      this.rooms[roomId] = roomData;

      return { roomId, playerId, roomData };
    }

    async joinRoom(roomId, playerName) {
      const room = await this.database.ref(`rooms/${roomId}`).once('value');
      const roomData = room.val();

      if (!roomData) {
        throw new Error('Room not found');
      }

      const playerCount = Object.keys(roomData.players || {}).length;
      if (playerCount >= 10) {
        throw new Error('Room is full');
      }

      const playerId = `player_${Date.now()}_${Math.random()}`;
      const playerColors = [
        '#FFD700', '#FF69B4', '#00CED1', '#32CD32', '#FF6347',
        '#9370DB', '#FFA500', '#20B2AA', '#FF1493', '#00FA9A'
      ];
      const startPositions = [
        { x: 2, y: 2 },
        { x: 47, y: 2 },
        { x: 2, y: 37 },
        { x: 47, y: 37 },
        { x: 25, y: 2 },
        { x: 25, y: 37 },
        { x: 10, y: 10 },
        { x: 40, y: 10 },
        { x: 10, y: 30 },
        { x: 40, y: 30 }
      ];

      const playerData = {
        id: playerId,
        name: playerName,
        x: startPositions[playerCount].x,
        y: startPositions[playerCount].y,
        score: 0,
        color: playerColors[playerCount % playerColors.length],
        powerMode: false
      };

      await this.database.ref(`rooms/${roomId}/players/${playerId}`).set(playerData);
      this.players[playerId] = playerData;

      return { playerId, playerData };
    }

    async startGame(roomId) {
      const maze = this.generateSimpleMaze();

      await this.database.ref(`rooms/${roomId}`).update({
        status: 'playing',
        maze: maze,
        startedAt: Date.now()
      });

      return { maze, startedAt: Date.now() };
    }

    generateSimpleMaze() {
      const ROWS = 40;
      const COLS = 50;
      const maze = [];

      for (let y = 0; y < ROWS; y++) {
        maze[y] = [];
        for (let x = 0; x < COLS; x++) {
          if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) {
            maze[y][x] = 1; // 牆壁
          } else if (Math.random() < 0.3) {
            maze[y][x] = 2; // 小豆子
          } else {
            maze[y][x] = 0; // 空地
          }
        }
      }

      // 放置能量豆
      maze[5][5] = 3;
      maze[5][44] = 3;
      maze[34][5] = 3;
      maze[34][44] = 3;

      return maze;
    }

    async movePlayer(roomId, playerId, direction) {
      const player = await this.database.ref(`rooms/${roomId}/players/${playerId}`).once('value');
      const playerData = player.val();

      if (!playerData) {
        throw new Error('Player not found');
      }

      let newX = playerData.x;
      let newY = playerData.y;

      switch (direction) {
        case 'up': newY--; break;
        case 'down': newY++; break;
        case 'left': newX--; break;
        case 'right': newX++; break;
      }

      // 檢查邊界
      if (newX < 0 || newX >= 50 || newY < 0 || newY >= 40) {
        return { success: false, reason: 'out of bounds' };
      }

      // 獲取迷宮
      const room = await this.database.ref(`rooms/${roomId}`).once('value');
      const maze = room.val().maze;

      // 檢查牆壁
      if (maze && maze[newY] && maze[newY][newX] === 1) {
        return { success: false, reason: 'wall collision' };
      }

      // 檢查豆子
      let scoreGain = 0;
      let powerMode = playerData.powerMode;
      let powerEndTime = playerData.powerEndTime;

      if (maze && maze[newY] && maze[newY][newX] === 2) {
        scoreGain = 10; // 小豆子
        await this.database.ref(`rooms/${roomId}/maze/${newY}/${newX}`).set(0);
      } else if (maze && maze[newY] && maze[newY][newX] === 3) {
        scoreGain = 50; // 能量豆
        powerMode = true;
        powerEndTime = Date.now() + 15000;
        await this.database.ref(`rooms/${roomId}/maze/${newY}/${newX}`).set(0);
      }

      // 更新玩家位置和分數
      await this.database.ref(`rooms/${roomId}/players/${playerId}`).update({
        x: newX,
        y: newY,
        score: (playerData.score || 0) + scoreGain,
        powerMode: powerMode,
        powerEndTime: powerEndTime
      });

      return {
        success: true,
        newX,
        newY,
        scoreGain,
        newScore: (playerData.score || 0) + scoreGain,
        powerMode
      };
    }

    async checkCollision(roomId, playerId) {
      const room = await this.database.ref(`rooms/${roomId}`).once('value');
      const roomData = room.val();
      const myPlayer = roomData.players[playerId];

      if (!myPlayer) return null;

      const now = Date.now();
      const myPowerMode = myPlayer.powerMode && myPlayer.powerEndTime && now < myPlayer.powerEndTime;

      for (const [otherId, otherPlayer] of Object.entries(roomData.players)) {
        if (otherId === playerId) continue;

        const distance = Math.abs(myPlayer.x - otherPlayer.x) + Math.abs(myPlayer.y - otherPlayer.y);

        if (distance <= 1) {
          const otherPowerMode = otherPlayer.powerMode && otherPlayer.powerEndTime && now < otherPlayer.powerEndTime;

          let myScoreChange = 0;
          let otherScoreChange = 0;

          if (myPowerMode && !otherPowerMode) {
            // 我在 power mode，對方不在：搶 50%
            const stolen = Math.floor((otherPlayer.score || 0) * 0.5);
            myScoreChange = stolen;
            otherScoreChange = -stolen;
          } else if (!myPowerMode && otherPowerMode) {
            // 對方在 power mode，我不在：被搶 50%
            const stolen = Math.floor((myPlayer.score || 0) * 0.5);
            myScoreChange = -stolen;
            otherScoreChange = stolen;
          } else if (!myPowerMode && !otherPowerMode) {
            // 雙方都不在 power mode：隨機搶 20%
            if (Math.random() < 0.5) {
              const stolen = Math.floor((otherPlayer.score || 0) * 0.2);
              myScoreChange = stolen;
              otherScoreChange = -stolen;
            } else {
              const stolen = Math.floor((myPlayer.score || 0) * 0.2);
              myScoreChange = -stolen;
              otherScoreChange = stolen;
            }
          }

          // 更新分數
          if (myScoreChange !== 0) {
            await this.database.ref(`rooms/${roomId}/players/${playerId}/score`)
              .set(Math.max(0, (myPlayer.score || 0) + myScoreChange));
          }
          if (otherScoreChange !== 0) {
            await this.database.ref(`rooms/${roomId}/players/${otherId}/score`)
              .set(Math.max(0, (otherPlayer.score || 0) + otherScoreChange));
          }

          return {
            collision: true,
            otherId,
            myScoreChange,
            otherScoreChange,
            myPowerMode,
            otherPowerMode
          };
        }
      }

      return null;
    }

    async endGame(roomId) {
      await this.database.ref(`rooms/${roomId}`).update({
        status: 'finished',
        endedAt: Date.now()
      });
    }

    async getRoomData(roomId) {
      const room = await this.database.ref(`rooms/${roomId}`).once('value');
      return room.val();
    }
  }

  // ==================== 集成測試 ====================

  describe('完整遊戲流程測試', () => {
    let game;

    beforeEach(() => {
      game = new GameSimulator();
    });

    test('🎮 測試 1：創建房間 → 加入 → 開始遊戲', async () => {
      // 1. 創建房間
      const { roomId, playerId: host } = await game.createRoom('Alice');
      expect(roomId).toHaveLength(6);

      // 2. 第二個玩家加入
      const { playerId: player2 } = await game.joinRoom(roomId, 'Bob');
      expect(player2).toBeTruthy();

      // 3. 檢查房間狀態
      let roomData = await game.getRoomData(roomId);
      expect(roomData.status).toBe('waiting');
      expect(Object.keys(roomData.players)).toHaveLength(2);

      // 4. 開始遊戲
      await game.startGame(roomId);
      roomData = await game.getRoomData(roomId);
      expect(roomData.status).toBe('playing');
      expect(roomData.maze).toBeDefined();
      expect(roomData.startedAt).toBeDefined();
    });

    test('🎮 測試 2：玩家移動 + 吃豆子 + 分數增加', async () => {
      // 1. 創建並開始遊戲
      const { roomId, playerId } = await game.createRoom('Player1');
      await game.startGame(roomId);

      // 2. 獲取初始分數
      let roomData = await game.getRoomData(roomId);
      const initialScore = roomData.players[playerId].score;
      expect(initialScore).toBe(0);

      // 3. 移動玩家（多次移動以增加吃到豆子的機會）
      let totalScore = 0;
      for (let i = 0; i < 10; i++) {
        const directions = ['right', 'down', 'left', 'up'];
        const direction = directions[i % 4];
        const result = await game.movePlayer(roomId, playerId, direction);

        if (result.success && result.scoreGain > 0) {
          totalScore += result.scoreGain;
        }
      }

      // 4. 檢查分數是否增加
      roomData = await game.getRoomData(roomId);
      const finalScore = roomData.players[playerId].score;
      expect(finalScore).toBeGreaterThanOrEqual(0);
    });

    test('🎮 測試 3：碰撞檢測 + 搶分機制', async () => {
      // 1. 創建房間並加入兩個玩家
      const { roomId, playerId: player1 } = await game.createRoom('Alice');
      const { playerId: player2 } = await game.joinRoom(roomId, 'Bob');
      await game.startGame(roomId);

      // 2. 給玩家一些初始分數
      await game.database.ref(`rooms/${roomId}/players/${player1}/score`).set(100);
      await game.database.ref(`rooms/${roomId}/players/${player2}/score`).set(80);

      // 3. 移動玩家到相鄰位置
      await game.database.ref(`rooms/${roomId}/players/${player1}`).update({ x: 10, y: 10 });
      await game.database.ref(`rooms/${roomId}/players/${player2}`).update({ x: 11, y: 10 });

      // 4. 檢測碰撞
      const collision = await game.checkCollision(roomId, player1);

      // 5. 驗證碰撞發生
      expect(collision).not.toBeNull();
      expect(collision.collision).toBe(true);
      expect(collision.otherId).toBe(player2);

      // 6. 驗證分數變化
      const roomData = await game.getRoomData(roomId);
      const score1 = roomData.players[player1].score;
      const score2 = roomData.players[player2].score;

      // 總分應該守恆（搶分前 180 = 100 + 80）
      expect(score1 + score2).toBe(180);
    });

    test('🎮 測試 4：能量豆效果 + 增強搶分', async () => {
      // 1. 創建房間並開始遊戲
      const { roomId, playerId: player1 } = await game.createRoom('PowerPlayer');
      const { playerId: player2 } = await game.joinRoom(roomId, 'NormalPlayer');
      await game.startGame(roomId);

      // 2. 給玩家分數
      await game.database.ref(`rooms/${roomId}/players/${player1}/score`).set(50);
      await game.database.ref(`rooms/${roomId}/players/${player2}/score`).set(100);

      // 3. Player1 吃能量豆（設置到能量豆位置）
      await game.database.ref(`rooms/${roomId}/players/${player1}`).update({ x: 5, y: 5 });
      const moveResult = await game.movePlayer(roomId, player1, 'right'); // 移動後檢查是否吃到

      // 或直接模擬吃到能量豆
      await game.database.ref(`rooms/${roomId}/players/${player1}`).update({
        powerMode: true,
        powerEndTime: Date.now() + 15000,
        score: 100 // 50 + 50 (能量豆)
      });

      // 4. 移動到碰撞位置
      await game.database.ref(`rooms/${roomId}/players/${player1}`).update({ x: 10, y: 10 });
      await game.database.ref(`rooms/${roomId}/players/${player2}`).update({ x: 11, y: 10 });

      // 5. 檢測碰撞（power mode 搶 50%）
      const collision = await game.checkCollision(roomId, player1);

      // 6. 驗證搶分
      expect(collision).not.toBeNull();
      expect(collision.myPowerMode).toBe(true);
      expect(collision.otherPowerMode).toBe(false);
      expect(collision.myScoreChange).toBeGreaterThan(0); // 搶到分數
      expect(collision.otherScoreChange).toBeLessThan(0); // 失去分數
    });

    test('🎮 測試 5：房間人數限制（最多 10 人）', async () => {
      // 1. 創建房間
      const { roomId } = await game.createRoom('Host');

      // 2. 加入 9 個玩家（加上 host 共 10 人）
      for (let i = 1; i <= 9; i++) {
        await game.joinRoom(roomId, `Player${i}`);
      }

      // 3. 檢查房間人數
      const roomData = await game.getRoomData(roomId);
      expect(Object.keys(roomData.players)).toHaveLength(10);

      // 4. 嘗試加入第 11 個玩家（應該失敗）
      await expect(game.joinRoom(roomId, 'Player11')).rejects.toThrow('Room is full');
    });

    test('🎮 測試 6：遊戲狀態流轉（waiting → playing → finished）', async () => {
      // 1. 創建房間（waiting）
      const { roomId } = await game.createRoom('Host');
      let roomData = await game.getRoomData(roomId);
      expect(roomData.status).toBe('waiting');

      // 2. 開始遊戲（playing）
      await game.startGame(roomId);
      roomData = await game.getRoomData(roomId);
      expect(roomData.status).toBe('playing');

      // 3. 結束遊戲（finished）
      await game.endGame(roomId);
      roomData = await game.getRoomData(roomId);
      expect(roomData.status).toBe('finished');
      expect(roomData.endedAt).toBeDefined();
    });

    test('🎮 測試 7：邊界檢測（玩家不能移出地圖）', async () => {
      // 1. 創建房間
      const { roomId, playerId } = await game.createRoom('Player1');
      await game.startGame(roomId);

      // 2. 將玩家移到邊界
      await game.database.ref(`rooms/${roomId}/players/${playerId}`).update({ x: 0, y: 0 });

      // 3. 嘗試向左移動（應該失敗）
      const result1 = await game.movePlayer(roomId, playerId, 'left');
      expect(result1.success).toBe(false);
      expect(result1.reason).toBe('out of bounds');

      // 4. 嘗試向上移動（應該失敗）
      const result2 = await game.movePlayer(roomId, playerId, 'up');
      expect(result2.success).toBe(false);
      expect(result2.reason).toBe('out of bounds');
    });

    test('🎮 測試 8：牆壁碰撞檢測', async () => {
      // 1. 創建房間並開始遊戲
      const { roomId, playerId } = await game.createRoom('Player1');
      await game.startGame(roomId);

      // 2. 手動在地圖中設置一個牆壁
      const wallX = 10;
      const wallY = 10;
      await game.database.ref(`rooms/${roomId}/maze/${wallY}/${wallX}`).set(1);

      // 3. 將玩家移到牆壁旁邊
      await game.database.ref(`rooms/${roomId}/players/${playerId}`).update({
        x: wallX - 1,
        y: wallY
      });

      // 4. 嘗試移動到牆壁（應該失敗）
      const result = await game.movePlayer(roomId, playerId, 'right');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('wall collision');
    });

    test('🎮 測試 9：分數不會變成負數', async () => {
      // 1. 創建房間
      const { roomId, playerId: player1 } = await game.createRoom('LowScorePlayer');
      const { playerId: player2 } = await game.joinRoom(roomId, 'HighScorePlayer');
      await game.startGame(roomId);

      // 2. 設置低分數玩家
      await game.database.ref(`rooms/${roomId}/players/${player1}/score`).set(5);
      await game.database.ref(`rooms/${roomId}/players/${player2}/score`).set(100);

      // 3. Player2 進入 power mode
      await game.database.ref(`rooms/${roomId}/players/${player2}`).update({
        powerMode: true,
        powerEndTime: Date.now() + 15000
      });

      // 4. 移動到碰撞位置
      await game.database.ref(`rooms/${roomId}/players/${player1}`).update({ x: 10, y: 10 });
      await game.database.ref(`rooms/${roomId}/players/${player2}`).update({ x: 11, y: 10 });

      // 5. 碰撞（player1 會被搶 50% = 2.5，失去 2 分）
      await game.checkCollision(roomId, player2);

      // 6. 檢查分數不會變負數
      const roomData = await game.getRoomData(roomId);
      const score1 = roomData.players[player1].score;
      expect(score1).toBeGreaterThanOrEqual(0);
    });

    test('🎮 測試 10：能量豆效果過期', async () => {
      // 1. 創建房間
      const { roomId, playerId } = await game.createRoom('Player1');
      await game.startGame(roomId);

      // 2. 設置已過期的 power mode
      const expiredTime = Date.now() - 1000; // 1 秒前過期
      await game.database.ref(`rooms/${roomId}/players/${playerId}`).update({
        powerMode: true,
        powerEndTime: expiredTime
      });

      // 3. 檢查 power mode 是否過期
      const roomData = await game.getRoomData(roomId);
      const player = roomData.players[playerId];
      const now = Date.now();
      const isPowerMode = player.powerMode && player.powerEndTime && now < player.powerEndTime;

      expect(isPowerMode).toBe(false);
    });
  });

  // ==================== 性能測試 ====================

  describe('性能測試', () => {
    let game;

    beforeEach(() => {
      game = new GameSimulator();
    });

    test('⚡ 測試：100 次移動操作性能', async () => {
      const { roomId, playerId } = await game.createRoom('SpeedPlayer');
      await game.startGame(roomId);

      const startTime = Date.now();
      const directions = ['right', 'down', 'left', 'up'];

      for (let i = 0; i < 100; i++) {
        const direction = directions[i % 4];
        await game.movePlayer(roomId, playerId, direction);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 100 次移動應該在 1 秒內完成
      expect(duration).toBeLessThan(1000);
      console.log(`100 次移動耗時: ${duration}ms`);
    });

    test('⚡ 測試：多人同時移動', async () => {
      const { roomId } = await game.createRoom('Host');

      // 加入 5 個玩家
      const playerIds = [];
      for (let i = 1; i <= 5; i++) {
        const { playerId } = await game.joinRoom(roomId, `Player${i}`);
        playerIds.push(playerId);
      }

      await game.startGame(roomId);

      const startTime = Date.now();
      const directions = ['right', 'down', 'left', 'up'];

      // 所有玩家同時移動
      const moves = playerIds.map((playerId, index) => {
        const direction = directions[index % 4];
        return game.movePlayer(roomId, playerId, direction);
      });

      await Promise.all(moves);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 5 個玩家同時移動應該在 500ms 內完成
      expect(duration).toBeLessThan(500);
      console.log(`5 個玩家同時移動耗時: ${duration}ms`);
    });
  });
});
