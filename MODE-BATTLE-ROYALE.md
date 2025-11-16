# 🔥 小精靈大逃殺模式（Pac-Man Battle Royale）

## 🌟 創新亮點

**全球首款小精靈大逃殺遊戲！**

結合：
- 🎮 經典小精靈玩法
- 🔥 吃雞大逃殺機制
- ⚔️ 多人競技對抗
- 📉 逐漸縮小的安全區

---

## 📝 模式概述

### 核心概念
```
🎯 目標：成為最後存活的小精靈

玩家數量：20-50 人（可擴展到 100 人）
遊戲時長：8-12 分鐘
勝利條件：最後存活者獲勝
```

### 基本流程
```
[等待大廳] 20-50 人集結
    ↓
[空投階段] 所有玩家隨機降落到地圖各處
    ↓
[搜刮階段] 收集豆子、道具、裝備
    ↓
[第一波縮圈] 安全區開始縮小（2分鐘後）
    ↓
[戰鬥階段] 玩家互相對抗，搶奪資源
    ↓
[持續縮圈] 每 1.5 分鐘縮圈一次（共 5 次）
    ↓
[決賽圈] 最後 3-5 人在小範圍內決戰
    ↓
[冠軍誕生] 🏆 吃雞成功！
```

---

## 🗺️ 地圖設計

### 超大型地圖
```
地圖尺寸：150 x 150 格（比經典模式大 2.5 倍）

地形分佈：
├─ 🏙️ 城市區域（30%）- 建築密集，掩體多
├─ 🌳 森林區域（25%）- 視野受限，迷宮複雜
├─ 🏜️ 沙漠平原（20%）- 開闊地帶，危險
├─ ⛰️ 山地區域（15%）- 高地優勢，狹窄通道
└─ 🌊 水域區域（10%）- 移動緩慢，但有特殊道具
```

### 地圖元素
```javascript
const mapElements = {
    // 資源點（豆子集中區）
    resourceZones: [
        {
            name: '中央城市',
            size: 'large',
            dots: 500,          // 豆子密度高
            powerPellets: 3,    // 能量豆數量
            chests: 10,         // 寶箱數量
            danger: 'very-high' // 競爭激烈
        },
        {
            name: '郊區小鎮',
            size: 'medium',
            dots: 300,
            powerPellets: 2,
            chests: 6,
            danger: 'medium'
        },
        {
            name: '偏遠農場',
            size: 'small',
            dots: 150,
            powerPellets: 1,
            chests: 3,
            danger: 'low' // 安全但資源少
        }
        // ... 共 12-15 個資源點
    ],

    // 特殊地點
    specialLocations: {
        // 空投區（隨機刷新）
        airdrops: {
            interval: 90000, // 每 90 秒一次空投
            loot: [
                '超級能量豆（持續 30 秒）',
                '無敵星星（10 秒）',
                '傳說武器',
                '稀有裝備'
            ]
        },

        // 高風險高回報區
        hotZones: [
            {
                name: '黃金神殿',
                reward: '大量分數 + 傳說道具',
                danger: '有 Boss 守衛'
            },
            {
                name: '武器庫',
                reward: '所有技能冷卻 -50%',
                danger: '陷阱密布'
            }
        ]
    }
}
```

### 安全區縮圈機制
```javascript
// 毒圈設定
const stormPhases = [
    {
        phase: 1,
        startTime: 120000,      // 2 分鐘後開始
        shrinkDuration: 60000,  // 花 60 秒縮圈
        waitDuration: 30000,    // 縮圈後等待 30 秒
        damagePerSecond: 5,     // 每秒扣 5% 生命值
        finalRadius: 120        // 最終半徑 120 格
    },
    {
        phase: 2,
        startTime: 210000,      // 3.5 分鐘
        shrinkDuration: 60000,
        waitDuration: 30000,
        damagePerSecond: 10,    // 傷害加重
        finalRadius: 80
    },
    {
        phase: 3,
        startTime: 300000,      // 5 分鐘
        shrinkDuration: 45000,
        waitDuration: 30000,
        damagePerSecond: 15,
        finalRadius: 50
    },
    {
        phase: 4,
        startTime: 375000,      // 6.25 分鐘
        shrinkDuration: 45000,
        waitDuration: 20000,
        damagePerSecond: 20,
        finalRadius: 25
    },
    {
        phase: 5,
        startTime: 440000,      // 7.3 分鐘
        shrinkDuration: 30000,
        waitDuration: 0,
        damagePerSecond: 30,    // 極高傷害
        finalRadius: 10         // 決賽圈
    }
]

// 繪製安全區
function drawSafeZone() {
    // 當前安全區（白圈）
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
        currentZone.x,
        currentZone.y,
        currentZone.radius,
        0, Math.PI * 2
    );
    ctx.stroke();

    // 下一個安全區（藍圈，提前顯示）
    if (nextZone) {
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(
            nextZone.x,
            nextZone.y,
            nextZone.radius,
            0, Math.PI * 2
        );
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // 毒圈效果（紫色霧氣）
    const gradient = ctx.createRadialGradient(
        currentZone.x, currentZone.y, currentZone.radius,
        currentZone.x, currentZone.y, currentZone.radius + 50
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, 'rgba(128, 0, 128, 0.5)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 檢測玩家是否在毒圈中
function checkStormDamage(player) {
    const distFromCenter = distance(
        player,
        {x: currentZone.x, y: currentZone.y}
    );

    if (distFromCenter > currentZone.radius) {
        // 在毒圈中，持續扣血
        player.health -= currentPhase.damagePerSecond * (deltaTime / 1000);

        // 視覺提示
        showStormDamageEffect(player);

        if (player.health <= 0) {
            eliminatePlayer(player, 'storm');
        }
    }
}
```

---

## 💪 生命值系統

### 生命值機制
```javascript
// 每位玩家有 100 生命值
const player = {
    health: 100,
    maxHealth: 100,
    shield: 0,      // 護盾值（額外血量）
    maxShield: 50
}

// 受傷來源
const damageSource = {
    playerAttack: 30,      // 被玩家攻擊
    ghostAttack: 25,       // 被幽靈攻擊（如果有）
    storm: 5-30,           // 毒圈傷害（依階段）
    trap: 15,              // 踩到陷阱
    fall: 20               // 掉落傷害（如果有高度差）
}

// 血量顯示
function drawHealthBar(player) {
    const barWidth = 40;
    const barHeight = 5;
    const x = player.x * CELL_SIZE - barWidth / 2;
    const y = player.y * CELL_SIZE - 15;

    // 背景（黑色）
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, barWidth, barHeight);

    // 血量（紅色）
    const healthWidth = (player.health / player.maxHealth) * barWidth;
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(x, y, healthWidth, barHeight);

    // 護盾（藍色）
    if (player.shield > 0) {
        const shieldWidth = (player.shield / player.maxShield) * barWidth;
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(x, y - 7, shieldWidth, barHeight);
    }

    // 邊框
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
}
```

### 治療系統
```javascript
// 治療道具
const healingItems = {
    smallPotion: {
        name: '小型治療藥水',
        healAmount: 25,
        useTime: 2000,      // 使用需要 2 秒
        rarity: 'common'
    },
    mediumPotion: {
        name: '中型治療藥水',
        healAmount: 50,
        useTime: 3000,
        rarity: 'uncommon'
    },
    largePotion: {
        name: '大型治療藥水',
        healAmount: 100,
        useTime: 5000,      // 需要 5 秒，高風險
        rarity: 'rare'
    },
    shieldCell: {
        name: '護盾電池',
        shieldAmount: 25,
        useTime: 2000,
        rarity: 'uncommon'
    },
    phoenixKit: {
        name: '鳳凰套裝',
        healAmount: 100,
        shieldAmount: 50,
        useTime: 8000,      // 全回復但需要 8 秒
        rarity: 'legendary'
    }
}

// 使用治療道具
async function useHealingItem(item) {
    if (player.isHealing) {
        showNotification('已經在治療中！', '#FF0000');
        return;
    }

    player.isHealing = true;
    player.canMove = false; // 治療時不能移動

    // 顯示進度條
    showHealingProgress(item.useTime);

    // 等待治療時間
    await sleep(item.useTime);

    // 治療完成
    if (item.healAmount) {
        player.health = Math.min(player.maxHealth, player.health + item.healAmount);
    }
    if (item.shieldAmount) {
        player.shield = Math.min(player.maxShield, player.shield + item.shieldAmount);
    }

    player.isHealing = false;
    player.canMove = true;

    playSound('heal-complete');
    showNotification(`+${item.healAmount} HP`, '#00FF00');
}
```

---

## 🎒 裝備與道具系統

### 裝備槽位
```javascript
const playerInventory = {
    // 武器槽（2 個）
    weapons: {
        primary: null,   // 主武器
        secondary: null  // 副武器
    },

    // 裝備槽
    equipment: {
        helmet: null,    // 頭盔（減少傷害 10-30%）
        armor: null,     // 護甲（增加護盾上限）
        boots: null      // 鞋子（增加移動速度）
    },

    // 消耗品槽（4 個快捷鍵）
    consumables: [
        null,  // 1 鍵
        null,  // 2 鍵
        null,  // 3 鍵
        null   // 4 鍵
    ],

    // 背包（儲存額外道具）
    backpack: {
        capacity: 8,     // 背包容量（可擴充）
        items: []
    }
}
```

### 武器系統
```javascript
const weapons = {
    // 近戰武器
    melee: {
        fork: {
            name: '叉子',
            damage: 20,
            attackSpeed: 1.5,  // 每秒攻擊次數
            range: 1,          // 攻擊範圍（格數）
            rarity: 'common'
        },
        sword: {
            name: '劍',
            damage: 35,
            attackSpeed: 1.2,
            range: 1.5,
            rarity: 'uncommon'
        },
        chainsaw: {
            name: '電鋸',
            damage: 50,
            attackSpeed: 2.0,
            range: 1,
            rarity: 'rare',
            special: '持續傷害'
        }
    },

    // 遠程武器
    ranged: {
        slingshot: {
            name: '彈弓',
            damage: 15,
            fireRate: 2.0,
            range: 8,
            ammo: 30,
            rarity: 'common'
        },
        bow: {
            name: '弓箭',
            damage: 40,
            fireRate: 0.8,
            range: 15,
            ammo: 20,
            rarity: 'uncommon'
        },
        crossbow: {
            name: '十字弓',
            damage: 60,
            fireRate: 0.5,
            range: 20,
            ammo: 15,
            rarity: 'rare',
            special: '靜音武器'
        },
        rocketLauncher: {
            name: '火箭筒',
            damage: 100,
            fireRate: 0.3,
            range: 25,
            ammo: 5,
            rarity: 'legendary',
            special: '範圍爆炸'
        }
    },

    // 特殊武器
    special: {
        freezeRay: {
            name: '冰凍射線',
            damage: 10,
            effect: '冰凍 2 秒',
            fireRate: 1.0,
            range: 10,
            ammo: 50,
            rarity: 'epic'
        },
        portalGun: {
            name: '傳送門槍',
            damage: 0,
            effect: '創建傳送門',
            fireRate: 0.5,
            range: 30,
            ammo: 10,
            rarity: 'legendary'
        }
    }
}
```

### 裝備效果
```javascript
const equipment = {
    helmets: {
        basic: {
            name: '基礎頭盔',
            damageReduction: 10,  // 減傷 10%
            rarity: 'common'
        },
        advanced: {
            name: '進階頭盔',
            damageReduction: 20,
            rarity: 'uncommon'
        },
        legendary: {
            name: '傳奇頭盔',
            damageReduction: 30,
            special: '免疫眩暈',
            rarity: 'legendary'
        }
    },

    armor: {
        light: {
            name: '輕型護甲',
            shieldBonus: 25,
            speedPenalty: 0,
            rarity: 'common'
        },
        medium: {
            name: '中型護甲',
            shieldBonus: 50,
            speedPenalty: -5,
            rarity: 'uncommon'
        },
        heavy: {
            name: '重型護甲',
            shieldBonus: 75,
            speedPenalty: -15,
            rarity: 'rare'
        }
    },

    boots: {
        running: {
            name: '跑步鞋',
            speedBonus: 15,
            rarity: 'common'
        },
        ninja: {
            name: '忍者鞋',
            speedBonus: 25,
            special: '移動無聲',
            rarity: 'rare'
        },
        rocket: {
            name: '火箭靴',
            speedBonus: 40,
            special: '短距離飛行',
            rarity: 'legendary'
        }
    }
}
```

### 戰利品系統
```javascript
// 寶箱稀有度
const chestTypes = {
    common: {
        color: '#AAAAAA',
        lootTable: {
            weapons: {chance: 50, tier: 'common'},
            equipment: {chance: 30, tier: 'common'},
            consumables: {chance: 80, quantity: 2-4},
            ammo: {chance: 100, quantity: 30-50}
        }
    },
    rare: {
        color: '#0070DD',
        lootTable: {
            weapons: {chance: 70, tier: 'uncommon-rare'},
            equipment: {chance: 60, tier: 'uncommon'},
            consumables: {chance: 90, quantity: 3-6},
            ammo: {chance: 100, quantity: 50-80}
        }
    },
    epic: {
        color: '#A335EE',
        lootTable: {
            weapons: {chance: 90, tier: 'rare-epic'},
            equipment: {chance: 80, tier: 'rare'},
            consumables: {chance: 100, quantity: 5-8},
            ammo: {chance: 100, quantity: 80-120}
        }
    },
    legendary: {
        color: '#FF8000',
        lootTable: {
            weapons: {chance: 100, tier: 'epic-legendary'},
            equipment: {chance: 100, tier: 'epic-legendary'},
            consumables: {chance: 100, quantity: 8-12},
            special: {chance: 50, item: 'phoenixKit'}
        }
    }
}

// 打開寶箱
function openChest(chest) {
    const loot = generateLoot(chest.type);

    // 顯示戰利品
    showLootUI(loot);

    // 發光特效
    createChestOpenEffect(chest);

    playSound('chest-open');
}
```

---

## ⚔️ 戰鬥機制

### 攻擊系統
```javascript
// 近戰攻擊
function meleeAttack(attacker, weapon) {
    // 檢測攻擊範圍內的敵人
    const targets = findTargetsInRange(attacker, weapon.range);

    targets.forEach(target => {
        // 計算傷害
        let damage = weapon.damage;

        // 暴擊（10% 機率）
        if (Math.random() < 0.1) {
            damage *= 2;
            showCriticalHit(target);
        }

        // 套用護甲減傷
        if (target.equipment.helmet) {
            damage *= (1 - target.equipment.helmet.damageReduction / 100);
        }

        // 扣血
        dealDamage(target, damage, attacker);

        // 擊退效果
        knockback(target, attacker.direction, 2);

        // 特效
        createMeleeHitEffect(target);
        playSound('melee-hit');
    });

    // 攻擊動畫
    showAttackAnimation(attacker, weapon);
}

// 遠程攻擊
function rangedAttack(attacker, weapon, direction) {
    // 消耗彈藥
    if (weapon.ammo <= 0) {
        playSound('click'); // 沒子彈
        showNotification('彈藥不足！', '#FF0000');
        return;
    }

    weapon.ammo--;

    // 創建子彈
    const projectile = {
        x: attacker.x,
        y: attacker.y,
        vx: direction.x * weapon.projectileSpeed,
        vy: direction.y * weapon.projectileSpeed,
        damage: weapon.damage,
        range: weapon.range,
        owner: attacker,
        weapon: weapon
    };

    projectiles.push(projectile);

    // 射擊特效
    createMuzzleFlash(attacker);
    playSound('shoot-' + weapon.type);
}

// 子彈更新
function updateProjectiles() {
    projectiles.forEach((proj, index) => {
        // 移動子彈
        proj.x += proj.vx;
        proj.y += proj.vy;

        // 檢測碰撞
        const hit = checkProjectileCollision(proj);

        if (hit) {
            if (hit.type === 'player') {
                // 擊中玩家
                dealDamage(hit.target, proj.damage, proj.owner);
                createBulletImpact(proj.x, proj.y);

                // 特殊效果
                if (proj.weapon.special === '冰凍') {
                    freezePlayer(hit.target, 2000);
                }
            } else if (hit.type === 'wall') {
                // 擊中牆壁
                createBulletImpact(proj.x, proj.y);
            }

            // 移除子彈
            projectiles.splice(index, 1);
        }

        // 超出範圍
        if (distance(proj, proj.owner) > proj.range) {
            projectiles.splice(index, 1);
        }
    });
}
```

### 擊殺與淘汰
```javascript
// 擊殺玩家
function eliminatePlayer(victim, killer) {
    victim.alive = false;
    victim.eliminatedAt = Date.now();

    // 擊殺者獲得獎勵
    if (killer && killer !== 'storm') {
        killer.kills++;
        killer.score += 500; // 擊殺獎勵

        // 顯示擊殺提示
        showKillNotification(killer, victim);
        playSound('elimination');

        // 擊殺者可以拾取受害者的道具
        dropLoot(victim);
    }

    // 受害者變成觀戰模式
    victim.spectating = true;

    // 更新存活人數
    updateAliveCount();

    // 全服通知
    broadcastElimination(killer, victim);

    // 如果只剩 1 人，遊戲結束
    if (getAliveCount() === 1) {
        endGame();
    }
}

// 擊殺播報
function showKillFeed(killer, victim, weapon) {
    const feed = document.createElement('div');
    feed.className = 'kill-feed-item';
    feed.innerHTML = `
        <span class="killer" style="color: ${killer.color}">${killer.name}</span>
        <img src="weapons/${weapon.icon}" class="weapon-icon">
        <span class="victim" style="color: ${victim.color}">${victim.name}</span>
    `;

    document.getElementById('killFeed').appendChild(feed);

    // 3 秒後淡出
    setTimeout(() => {
        feed.classList.add('fade-out');
        setTimeout(() => feed.remove(), 500);
    }, 3000);
}

// 掉落戰利品
function dropLoot(player) {
    // 掉落所有裝備和道具
    const lootBox = {
        x: player.x,
        y: player.y,
        items: [
            ...player.inventory.weapons,
            ...player.inventory.equipment,
            ...player.inventory.consumables,
            ...player.inventory.backpack.items
        ].filter(item => item !== null)
    };

    // 在地圖上顯示掉落物
    createDeathBox(lootBox);
}
```

---

## 📊 HUD 與 UI

### 遊戲 HUD
```html
<div class="battle-royale-hud">
    <!-- 左上：玩家狀態 -->
    <div class="player-status">
        <div class="health-bar">
            <div class="health-fill"></div>
            <div class="health-text">100</div>
        </div>
        <div class="shield-bar">
            <div class="shield-fill"></div>
            <div class="shield-text">50</div>
        </div>
        <div class="ammo-counter">
            <span class="current-ammo">30</span> / <span class="total-ammo">90</span>
        </div>
    </div>

    <!-- 右上：小地圖 + 存活人數 -->
    <div class="map-area">
        <div class="alive-counter">
            <span class="alive-icon">👤</span>
            <span class="alive-number">23</span> / 50
        </div>
        <canvas id="minimap"></canvas>
        <div class="storm-timer">
            ⚠️ 縮圈倒數: <span id="stormTimer">1:30</span>
        </div>
    </div>

    <!-- 中上：擊殺播報 -->
    <div class="kill-feed" id="killFeed"></div>

    <!-- 底部：物品欄 -->
    <div class="inventory-bar">
        <!-- 武器槽 -->
        <div class="weapon-slots">
            <div class="weapon-slot primary">
                <div class="slot-number">1</div>
                <div class="weapon-icon"></div>
                <div class="ammo-count">30</div>
            </div>
            <div class="weapon-slot secondary">
                <div class="slot-number">2</div>
                <div class="weapon-icon"></div>
                <div class="ammo-count">15</div>
            </div>
        </div>

        <!-- 消耗品槽 -->
        <div class="consumable-slots">
            <div class="consumable-slot" data-key="3">
                <div class="slot-number">3</div>
                <div class="item-icon"></div>
                <div class="item-count">2</div>
            </div>
            <div class="consumable-slot" data-key="4">
                <div class="slot-number">4</div>
                <div class="item-icon"></div>
                <div class="item-count">1</div>
            </div>
        </div>
    </div>

    <!-- 中央：準星 -->
    <div class="crosshair"></div>

    <!-- 右側：擊殺數 -->
    <div class="stats-panel">
        <div class="stat-item">
            <span class="stat-icon">💀</span>
            <span class="stat-value" id="killCount">0</span>
        </div>
        <div class="stat-item">
            <span class="stat-icon">💰</span>
            <span class="stat-value" id="scoreValue">0</span>
        </div>
    </div>
</div>

<style>
.battle-royale-hud {
    position: fixed;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.player-status {
    position: absolute;
    top: 20px;
    left: 20px;
    width: 300px;
}

.health-bar, .shield-bar {
    height: 30px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 5px;
    margin-bottom: 5px;
    position: relative;
    overflow: hidden;
}

.health-fill {
    height: 100%;
    background: linear-gradient(90deg, #FF0000, #FF6666);
    transition: width 0.3s;
}

.shield-fill {
    height: 100%;
    background: linear-gradient(90deg, #00FFFF, #66FFFF);
    transition: width 0.3s;
}

.health-text, .shield-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-weight: bold;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.ammo-counter {
    color: white;
    font-size: 1.5em;
    font-weight: bold;
    text-align: center;
    margin-top: 10px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.map-area {
    position: absolute;
    top: 20px;
    right: 20px;
}

.alive-counter {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    text-align: center;
    font-weight: bold;
    margin-bottom: 10px;
}

.alive-number {
    color: #FFD700;
    font-size: 1.5em;
}

.storm-timer {
    background: rgba(128, 0, 128, 0.9);
    color: white;
    padding: 8px;
    border-radius: 5px;
    text-align: center;
    margin-top: 10px;
    font-weight: bold;
    animation: pulse-warning 1s infinite;
}

@keyframes pulse-warning {
    0%, 100% { background: rgba(128, 0, 128, 0.9); }
    50% { background: rgba(180, 0, 180, 0.9); }
}

.kill-feed {
    position: absolute;
    top: 80px;
    right: 50%;
    transform: translateX(50%);
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: center;
}

.kill-feed-item {
    background: rgba(0, 0, 0, 0.8);
    padding: 8px 15px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slide-in 0.3s;
}

@keyframes slide-in {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.kill-feed-item.fade-out {
    animation: fade-out 0.5s;
}

@keyframes fade-out {
    to {
        opacity: 0;
        transform: translateY(-10px);
    }
}

.weapon-icon {
    width: 20px;
    height: 20px;
}

.inventory-bar {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
}

.weapon-slots, .consumable-slots {
    display: flex;
    gap: 10px;
}

.weapon-slot, .consumable-slot {
    width: 80px;
    height: 80px;
    background: rgba(0, 0, 0, 0.8);
    border: 3px solid #666;
    border-radius: 10px;
    position: relative;
    pointer-events: auto;
    cursor: pointer;
    transition: all 0.3s;
}

.weapon-slot:hover, .consumable-slot:hover {
    border-color: #FFD700;
    transform: scale(1.1);
}

.weapon-slot.active {
    border-color: #00FF00;
    box-shadow: 0 0 20px #00FF00;
}

.slot-number {
    position: absolute;
    top: -10px;
    left: -10px;
    background: rgba(0, 0, 0, 0.9);
    color: #FFD700;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

.crosshair {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 30px;
}

.crosshair::before,
.crosshair::after {
    content: '';
    position: absolute;
    background: #00FF00;
}

.crosshair::before {
    width: 2px;
    height: 100%;
    left: 50%;
    transform: translateX(-50%);
}

.crosshair::after {
    width: 100%;
    height: 2px;
    top: 50%;
    transform: translateY(-50%);
}

.stats-panel {
    position: absolute;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
}

.stat-item {
    background: rgba(0, 0, 0, 0.8);
    padding: 15px;
    border-radius: 10px;
    margin-bottom: 15px;
    text-align: center;
    color: white;
    font-size: 1.5em;
    font-weight: bold;
}
</style>
```

---

## 🏆 勝利與排名

### 吃雞結算
```javascript
function endGame() {
    const winner = getLastAlivePlayer();

    // 停止遊戲
    gameState.status = 'ended';

    // 顯示勝利畫面
    showVictoryScreen(winner);

    // 計算所有玩家排名
    const rankings = calculateFinalRankings();

    // 獎勵發放
    distributeRewards(rankings);
}

// 勝利畫面
function showVictoryScreen(winner) {
    const screen = document.createElement('div');
    screen.className = 'victory-screen';
    screen.innerHTML = `
        <div class="victory-container">
            <h1 class="victory-title">🏆 大吉大利，今晚吃雞！🏆</h1>

            <div class="winner-showcase">
                <div class="winner-avatar" style="background: ${winner.color}">
                    <!-- 3D 小精靈動畫 -->
                </div>
                <h2 class="winner-name">${winner.name}</h2>
                <p class="winner-stats">
                    擊殺數: ${winner.kills} | 存活時間: ${formatTime(winner.survivalTime)}
                </p>
            </div>

            <div class="victory-stats">
                <div class="stat-box">
                    <div class="stat-number">#1</div>
                    <div class="stat-label">排名</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${winner.kills}</div>
                    <div class="stat-label">擊殺</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${winner.damage}</div>
                    <div class="stat-label">傷害</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${winner.score}</div>
                    <div class="stat-label">分數</div>
                </div>
            </div>

            <div class="rewards">
                <h3>獎勵</h3>
                <div class="reward-items">
                    <div class="reward-item">
                        <span class="reward-icon">⭐</span>
                        <span class="reward-text">+1000 經驗值</span>
                    </div>
                    <div class="reward-item">
                        <span class="reward-icon">💰</span>
                        <span class="reward-text">+2000 金幣</span>
                    </div>
                    <div class="reward-item">
                        <span class="reward-icon">🏆</span>
                        <span class="reward-text">吃雞成就解鎖</span>
                    </div>
                </div>
            </div>

            <button onclick="returnToLobby()">返回大廳</button>
            <button onclick="playAgain()">再來一局</button>
        </div>
    `;

    document.body.appendChild(screen);

    // 播放勝利音樂
    playSound('victory-theme');

    // 煙火特效
    launchFireworks();
}

// 排名獎勵
const rankingRewards = {
    1: {xp: 1000, coins: 2000, title: '吃雞王'},
    2: {xp: 750, coins: 1500},
    3: {xp: 600, coins: 1200},
    4-10: {xp: 400, coins: 800},
    11-20: {xp: 250, coins: 500},
    21-30: {xp: 150, coins: 300},
    '31+': {xp: 100, coins: 200}
}
```

---

## 📈 統計與數據

### 遊戲統計
```javascript
// 記錄詳細數據
const playerStats = {
    // 基礎數據
    rank: 1,
    kills: 5,
    assists: 2,
    damage: 1250,
    survivalTime: 720000, // 12 分鐘

    // 戰鬥數據
    shotsHired: 150,
    shotsHit: 45,
    headshots: 3,
    longestKill: 25, // 最遠擊殺距離

    // 收集數據
    dotsCollected: 230,
    chestsOpened: 8,
    itemsLooted: 45,

    // 移動數據
    distanceTraveled: 1200, // 移動距離
    jumps: 50,

    // 特殊數據
    revives: 1, // 復活隊友（如果有組隊模式）
    timesInStorm: 3,
    stormDamage: 150
}

// 數據展示
function showDetailedStats(stats) {
    // 精確度
    const accuracy = (stats.shotsHit / stats.shotsFired * 100).toFixed(1);

    // 場均傷害
    const dpm = (stats.damage / (stats.survivalTime / 60000)).toFixed(0);

    // ... 更多數據分析
}
```

---

## 🎯 總結

### 開發複雜度
```
預估開發時間：2-3 週

技術挑戰：
├─ 🔥 高難度：大型地圖 + 50 人同步
├─ ⚡ 中難度：複雜的裝備系統
├─ 🎨 中難度：豐富的視覺特效
└─ 🎮 低難度：基礎戰鬥機制（已有基礎）

優先級：Phase 2-3（做好經典模式後再考慮）
```

### 特色亮點
✅ **全球首創**：小精靈大逃殺
✅ **高競技性**：策略 + 槍法 + 資源管理
✅ **觀賞性強**：適合直播
✅ **商業潛力大**：可舉辦電競賽事

---

## 💬 下一步

現在你有**兩個完整的模式設計**：

1. **經典對戰模式** (MODE-1-CLASSIC-BATTLE.md)
   - 10 人，3 分鐘
   - 有 AI 幽靈
   - 開發時間：5-7 天

2. **大逃殺模式** (MODE-BATTLE-ROYALE.md)
   - 20-50 人，8-12 分鐘
   - 縮圈、裝備、吃雞
   - 開發時間：2-3 週

**你想先做哪一個？** 🤔

我的建議：
1. 先做**經典對戰模式**（較簡單，快速上線）
2. 測試、優化、收集反饋
3. 再做**大逃殺模式**（作為重大更新）

告訴我你的決定，我立即開始實作！🚀
