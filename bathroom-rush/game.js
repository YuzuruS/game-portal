// ============================================
// トイレダッシュゲーム - Phase 1: プロジェクト基盤
// ============================================

// Web Audio Context（効果音用）
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// グローバル変数
let gamepad = null;

// ============================================
// 効果音関数
// ============================================

function playSoundEffect(type) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
        case 'footstepWalk':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(180, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;

        case 'footstepRun':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.08);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.08);
            break;

        case 'urgencyWarning':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;

        case 'urgencyCritical':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;

        case 'gameOver':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;

        case 'exhausted':
            // 疲労状態の効果音（ハァハァ）
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(120, audioContext.currentTime + 0.4);
            gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;

        case 'collision':
            // 障害物衝突音
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;

        case 'splash':
            // 水たまり音
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
    }
}

// ============================================
// BootScene - スプライト生成と初期化
// ============================================

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // プロシージャルスプライト生成
        this.createPlayerSprites();
        this.createGroundSprite();
        this.createObstacleSprites();
        // Phase 4以降で追加: NPC、アイテムスプライト
    }

    create() {
        // GameSceneに遷移
        this.scene.start('GameScene');
    }

    // プレイヤースプライト生成（複数フレーム）
    createPlayerSprites() {
        // アイドル状態
        this.createPlayerIdle();

        // 歩きアニメーション（2フレーム）
        this.createPlayerWalk1();
        this.createPlayerWalk2();

        // 走りアニメーション（2フレーム）
        this.createPlayerRun1();
        this.createPlayerRun2();
    }

    createPlayerIdle() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // 体
        g.fillStyle(0x4080ff);
        g.fillRect(6, 24, 20, 32);

        // 頭（大きめ）
        g.fillStyle(0xffc0a0);
        g.fillCircle(16, 14, 14);

        // 目（大きく焦った目）
        g.fillStyle(0xffffff);
        g.fillCircle(10, 12, 5);
        g.fillCircle(22, 12, 5);
        g.fillStyle(0x000000);
        g.fillCircle(11, 13, 3);
        g.fillCircle(23, 13, 3);

        // 眉毛（困った顔）
        g.lineStyle(2, 0x000000);
        g.beginPath();
        g.moveTo(6, 8);
        g.lineTo(12, 10);
        g.strokePath();
        g.beginPath();
        g.moveTo(20, 10);
        g.lineTo(26, 8);
        g.strokePath();

        // 口（焦り）
        g.lineStyle(2, 0x000000);
        g.beginPath();
        g.arc(16, 18, 4, 0.2, Math.PI - 0.2, false);
        g.strokePath();

        // 汗
        g.fillStyle(0x87CEEB);
        g.fillCircle(26, 10, 3);

        // 腕
        g.fillStyle(0xffc0a0);
        g.fillRect(2, 28, 6, 20);
        g.fillRect(24, 28, 6, 20);

        // 足
        g.fillStyle(0x2060cc);
        g.fillRect(8, 56, 8, 28);
        g.fillRect(16, 56, 8, 28);

        g.generateTexture('player_idle', 32, 84);
        g.destroy();
    }

    createPlayerWalk1() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // 体
        g.fillStyle(0x4080ff);
        g.fillRect(6, 24, 20, 32);

        // 頭
        g.fillStyle(0xffc0a0);
        g.fillCircle(16, 14, 14);

        // 目
        g.fillStyle(0xffffff);
        g.fillCircle(10, 12, 5);
        g.fillCircle(22, 12, 5);
        g.fillStyle(0x000000);
        g.fillCircle(11, 13, 3);
        g.fillCircle(23, 13, 3);

        // 眉毛
        g.lineStyle(2, 0x000000);
        g.beginPath();
        g.moveTo(6, 8);
        g.lineTo(12, 10);
        g.strokePath();
        g.beginPath();
        g.moveTo(20, 10);
        g.lineTo(26, 8);
        g.strokePath();

        // 口
        g.beginPath();
        g.arc(16, 18, 4, 0.2, Math.PI - 0.2, false);
        g.strokePath();

        // 汗
        g.fillStyle(0x87CEEB);
        g.fillCircle(26, 12, 3);

        // 腕（振っている）
        g.fillStyle(0xffc0a0);
        g.fillRect(0, 24, 6, 22);
        g.fillRect(26, 32, 6, 20);

        // 足（歩き・左足前）
        g.fillStyle(0x2060cc);
        g.fillRect(6, 56, 8, 28);   // 左足（前）
        g.fillRect(18, 58, 8, 26);  // 右足（後ろ）

        g.generateTexture('player_walk1', 32, 84);
        g.destroy();
    }

    createPlayerWalk2() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // 体
        g.fillStyle(0x4080ff);
        g.fillRect(6, 24, 20, 32);

        // 頭
        g.fillStyle(0xffc0a0);
        g.fillCircle(16, 14, 14);

        // 目
        g.fillStyle(0xffffff);
        g.fillCircle(10, 12, 5);
        g.fillCircle(22, 12, 5);
        g.fillStyle(0x000000);
        g.fillCircle(11, 13, 3);
        g.fillCircle(23, 13, 3);

        // 眉毛
        g.lineStyle(2, 0x000000);
        g.beginPath();
        g.moveTo(6, 8);
        g.lineTo(12, 10);
        g.strokePath();
        g.beginPath();
        g.moveTo(20, 10);
        g.lineTo(26, 8);
        g.strokePath();

        // 口
        g.beginPath();
        g.arc(16, 18, 4, 0.2, Math.PI - 0.2, false);
        g.strokePath();

        // 汗
        g.fillStyle(0x87CEEB);
        g.fillCircle(6, 12, 3);

        // 腕（振っている・逆）
        g.fillStyle(0xffc0a0);
        g.fillRect(26, 24, 6, 22);
        g.fillRect(0, 32, 6, 20);

        // 足（歩き・右足前）
        g.fillStyle(0x2060cc);
        g.fillRect(18, 56, 8, 28);  // 右足（前）
        g.fillRect(6, 58, 8, 26);   // 左足（後ろ）

        g.generateTexture('player_walk2', 32, 84);
        g.destroy();
    }

    createPlayerRun1() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // 体（少し前傾）
        g.fillStyle(0x4080ff);
        g.fillRect(8, 24, 20, 32);

        // 頭（少し前に）
        g.fillStyle(0xffc0a0);
        g.fillCircle(18, 14, 14);

        // 目（大きく開いて焦り）
        g.fillStyle(0xffffff);
        g.fillCircle(12, 12, 6);
        g.fillCircle(24, 12, 6);
        g.fillStyle(0x000000);
        g.fillCircle(13, 13, 4);
        g.fillCircle(25, 13, 4);

        // 眉毛（すごく困った顔）
        g.lineStyle(2, 0x000000);
        g.beginPath();
        g.moveTo(8, 6);
        g.lineTo(14, 9);
        g.strokePath();
        g.beginPath();
        g.moveTo(22, 9);
        g.lineTo(28, 6);
        g.strokePath();

        // 口（大きく開いて）
        g.lineStyle(2, 0x000000);
        g.strokeEllipse(18, 19, 10, 8);

        // 汗（複数）
        g.fillStyle(0x87CEEB);
        g.fillCircle(28, 8, 4);
        g.fillCircle(26, 14, 3);

        // 腕（大きく振る）
        g.fillStyle(0xffc0a0);
        // 左腕（後ろに振る）
        g.fillRect(0, 32, 6, 20);
        // 右腕（前に振る）
        g.fillRect(26, 20, 6, 24);

        // 足（大きく踏み出す）
        g.fillStyle(0x2060cc);
        g.fillRect(4, 56, 10, 28);   // 左足（大きく前）
        g.fillRect(20, 60, 8, 24);   // 右足（後ろ）

        g.generateTexture('player_run1', 32, 84);
        g.destroy();
    }

    createPlayerRun2() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // 体（少し前傾）
        g.fillStyle(0x4080ff);
        g.fillRect(8, 24, 20, 32);

        // 頭
        g.fillStyle(0xffc0a0);
        g.fillCircle(18, 14, 14);

        // 目（大きく開いて焦り）
        g.fillStyle(0xffffff);
        g.fillCircle(12, 12, 6);
        g.fillCircle(24, 12, 6);
        g.fillStyle(0x000000);
        g.fillCircle(13, 13, 4);
        g.fillCircle(25, 13, 4);

        // 眉毛
        g.lineStyle(2, 0x000000);
        g.beginPath();
        g.moveTo(8, 6);
        g.lineTo(14, 9);
        g.strokePath();
        g.beginPath();
        g.moveTo(22, 9);
        g.lineTo(28, 6);
        g.strokePath();

        // 口（大きく開いて）
        g.lineStyle(2, 0x000000);
        g.strokeEllipse(18, 19, 10, 8);

        // 汗（複数）
        g.fillStyle(0x87CEEB);
        g.fillCircle(8, 8, 4);
        g.fillCircle(6, 14, 3);

        // 腕（大きく振る・逆）
        g.fillStyle(0xffc0a0);
        // 右腕（後ろに振る）
        g.fillRect(26, 32, 6, 20);
        // 左腕（前に振る）
        g.fillRect(0, 20, 6, 24);

        // 足（大きく踏み出す・逆）
        g.fillStyle(0x2060cc);
        g.fillRect(20, 56, 10, 28);  // 右足（大きく前）
        g.fillRect(4, 60, 8, 24);    // 左足（後ろ）

        g.generateTexture('player_run2', 32, 84);
        g.destroy();
    }

    // 地面スプライト生成
    createGroundSprite() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // 歩道
        g.fillStyle(0xcccccc);
        g.fillRect(0, 0, 64, 32);

        // 歩道のタイル模様
        g.lineStyle(1, 0x999999);
        for (let i = 0; i < 64; i += 16) {
            g.lineBetween(i, 0, i, 32);
        }
        g.lineBetween(0, 16, 64, 16);

        g.generateTexture('ground', 64, 32);
        g.destroy();
    }

    // 障害物スプライト生成
    createObstacleSprites() {
        this.createTrafficLight();
        this.createDogWalker();
        this.createPuddle();
        this.createConstruction();
    }

    // 信号機（赤）
    createTrafficLight() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // 信号の柱
        g.fillStyle(0x333333);
        g.fillRect(12, 40, 8, 60);

        // 信号本体
        g.fillStyle(0x222222);
        g.fillRoundedRect(4, 10, 24, 35, 4);

        // 赤信号ライト
        g.fillStyle(0xFF0000);
        g.fillCircle(16, 20, 7);

        // 黄色ライト（消灯）
        g.fillStyle(0x444444);
        g.fillCircle(16, 32, 6);

        g.generateTexture('traffic_light_red', 32, 100);
        g.destroy();

        // 緑信号バージョンも作成
        const g2 = this.make.graphics({ x: 0, y: 0, add: false });

        // 信号の柱
        g2.fillStyle(0x333333);
        g2.fillRect(12, 40, 8, 60);

        // 信号本体
        g2.fillStyle(0x222222);
        g2.fillRoundedRect(4, 10, 24, 35, 4);

        // 赤ライト（消灯）
        g2.fillStyle(0x444444);
        g2.fillCircle(16, 20, 6);

        // 緑信号ライト
        g2.fillStyle(0x00FF00);
        g2.fillCircle(16, 32, 7);

        g2.generateTexture('traffic_light_green', 32, 100);
        g2.destroy();
    }

    // 犬の散歩
    createDogWalker() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // 犬（左側）
        g.fillStyle(0x8B4513); // 茶色
        // 体
        g.fillRect(4, 54, 20, 12);
        // 頭
        g.fillCircle(8, 56, 6);
        // 耳
        g.fillTriangle(4, 52, 2, 48, 6, 52);
        g.fillTriangle(10, 52, 12, 48, 8, 52);
        // 尻尾
        g.fillRect(22, 52, 8, 3);
        // 足
        g.fillRect(6, 66, 3, 8);
        g.fillRect(12, 66, 3, 8);
        g.fillRect(16, 66, 3, 8);
        g.fillRect(20, 66, 3, 8);

        // リード（紐）
        g.lineStyle(2, 0x666666);
        g.lineBetween(10, 54, 38, 30);

        // 飼い主（右側）
        g.fillStyle(0xFF6B9D); // ピンク（服）
        // 体
        g.fillRect(32, 30, 16, 24);
        // 頭
        g.fillStyle(0xFFDBB0);
        g.fillCircle(40, 20, 8);
        // 髪
        g.fillStyle(0x654321);
        g.fillCircle(40, 16, 9);
        // 腕
        g.fillStyle(0xFFDBB0);
        g.fillRect(28, 32, 4, 16);
        g.fillRect(48, 32, 4, 16);
        // 足
        g.fillStyle(0x2060cc);
        g.fillRect(34, 54, 6, 20);
        g.fillRect(42, 54, 6, 20);

        g.generateTexture('dog_walker', 56, 74);
        g.destroy();
    }

    // 水たまり
    createPuddle() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // 水たまり（不規則な形）
        g.fillStyle(0x4A90E2, 0.7);
        g.fillEllipse(32, 16, 50, 24);

        // ハイライト
        g.fillStyle(0xFFFFFF, 0.3);
        g.fillEllipse(24, 12, 20, 10);

        g.generateTexture('puddle', 64, 32);
        g.destroy();
    }

    // 工事現場バリア
    createConstruction() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // バリケード
        g.fillStyle(0xFF6600); // オレンジ
        g.fillRect(0, 40, 48, 8);
        g.fillRect(0, 60, 48, 8);

        // 支柱
        g.fillStyle(0x666666);
        g.fillRect(2, 48, 6, 20);
        g.fillRect(40, 48, 6, 20);

        // 警告ストライプ
        g.fillStyle(0xFFFFFF);
        for (let x = 0; x < 48; x += 12) {
            g.fillRect(x, 42, 6, 4);
            g.fillRect(x + 6, 62, 6, 4);
        }

        // 工事看板
        g.fillStyle(0xFFCC00);
        g.fillTriangle(24, 10, 12, 30, 36, 30);
        g.fillStyle(0x000000);
        g.fillRect(22, 16, 4, 8);
        g.fillRect(18, 20, 12, 4);

        g.generateTexture('construction', 48, 68);
        g.destroy();
    }
}

// ============================================
// GameScene - メインゲームプレイ
// ============================================

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // ワールドサイズ（Phase 1は2000px、後で拡張）
        const worldWidth = 2000;
        const worldHeight = 600;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // 背景色（午後の空）
        this.cameras.main.setBackgroundColor(0x87CEEB);

        // 地面作成
        this.createGround(worldWidth);

        // アニメーション作成
        this.createPlayerAnimations();

        // プレイヤー作成
        this.player = this.physics.add.sprite(100, 450, 'player_idle');
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(32, 84);
        this.player.play('idle');

        // プレイヤーと地面の衝突
        this.physics.add.collider(this.player, this.ground);

        // カメラ設定
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // 我慢ゲージ
        this.urgencyValue = 100;
        this.urgencyDecayRate = 0.1; // 基本減少速度（1秒あたり）
        this.lastFootstepTime = 0;

        // 体力ゲージ
        this.staminaValue = 100;
        this.staminaDrainRate = 15; // 走り時の減少速度（1秒あたり）
        this.staminaRegenRate = 8;  // 回復速度（1秒あたり）
        this.isExhausted = false;
        this.exhaustedTimer = 0;

        // ゲームオーバーフラグ
        this.gameOver = false;

        // UI作成
        this.createUI();

        // 入力設定
        this.cursors = this.input.keyboard.createCursorKeys();
        this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        // ゲームパッド設定
        this.setupGamepad();

        // デバッグ用テキスト
        this.debugText = this.add.text(10, 70, '', {
            fontSize: '12px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });
        this.debugText.setScrollFactor(0);

        // 障害物グループ作成
        this.obstacles = this.physics.add.group();

        // 障害物との衝突設定
        this.physics.add.overlap(this.player, this.obstacles, this.handleObstacleCollision, null, this);

        // SpawnManager初期化
        this.nextObstacleX = 400; // 最初の障害物出現位置
        this.obstacleSpawnInterval = 300; // 障害物間の最小距離

        // 初期障害物配置
        this.spawnInitialObstacles(worldWidth);
    }

    createGround(worldWidth) {
        this.ground = this.physics.add.staticGroup();

        // 歩道を敷き詰める
        const groundY = 550;
        for (let x = 0; x < worldWidth; x += 64) {
            this.ground.create(x + 32, groundY, 'ground');
        }
    }

    createPlayerAnimations() {
        // 歩きアニメーション
        this.anims.create({
            key: 'walk',
            frames: [
                { key: 'player_walk1' },
                { key: 'player_walk2' }
            ],
            frameRate: 8,
            repeat: -1
        });

        // 走りアニメーション
        this.anims.create({
            key: 'run',
            frames: [
                { key: 'player_run1' },
                { key: 'player_run2' }
            ],
            frameRate: 12,
            repeat: -1
        });

        // アイドル
        this.anims.create({
            key: 'idle',
            frames: [{ key: 'player_idle' }],
            frameRate: 1
        });
    }

    createUI() {
        // 我慢ゲージ背景
        this.urgencyBg = this.add.rectangle(400, 30, 304, 34, 0x666666);
        this.urgencyBg.setScrollFactor(0);

        // 我慢ゲージバー
        this.urgencyBar = this.add.rectangle(250, 30, 300, 30, 0x4CAF50);
        this.urgencyBar.setScrollFactor(0);

        // 我慢ゲージテキスト
        this.urgencyText = this.add.text(400, 30, '我慢ゲージ: 100%', {
            fontSize: '16px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        this.urgencyText.setOrigin(0.5);
        this.urgencyText.setScrollFactor(0);

        // 距離表示
        this.distanceText = this.add.text(400, 60, '距離: 0m / 2000m', {
            fontSize: '14px',
            fill: '#ffffff'
        });
        this.distanceText.setOrigin(0.5);
        this.distanceText.setScrollFactor(0);

        // 体力ゲージ背景
        this.staminaBg = this.add.rectangle(400, 90, 304, 24, 0x666666);
        this.staminaBg.setScrollFactor(0);

        // 体力ゲージバー
        this.staminaBar = this.add.rectangle(250, 90, 300, 20, 0x2196F3);
        this.staminaBar.setScrollFactor(0);

        // 体力ゲージテキスト
        this.staminaText = this.add.text(400, 90, '体力: 100%', {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        this.staminaText.setOrigin(0.5);
        this.staminaText.setScrollFactor(0);
    }

    setupGamepad() {
        if (this.input.gamepad) {
            this.input.gamepad.once('connected', (pad) => {
                console.log('ゲームパッド接続:', pad.id);
                gamepad = pad;
            });

            this.input.gamepad.once('down', (pad) => {
                if (!gamepad) {
                    gamepad = pad;
                    console.log('ゲームパッド検出:', pad.id);
                }
            });
        }
    }

    // 初期障害物配置
    spawnInitialObstacles(worldWidth) {
        const obstacleTypes = ['traffic_light', 'dog_walker', 'puddle', 'construction'];

        while (this.nextObstacleX < worldWidth - 200) {
            // ランダムに障害物タイプを選択
            const type = Phaser.Math.RND.pick(obstacleTypes);
            this.spawnObstacle(type, this.nextObstacleX);

            // 次の障害物位置（ランダムな間隔）
            this.nextObstacleX += Phaser.Math.Between(300, 600);
        }
    }

    // 障害物生成
    spawnObstacle(type, x) {
        let obstacle;
        const groundY = 550;

        switch (type) {
            case 'traffic_light':
                obstacle = this.obstacles.create(x, groundY - 100, 'traffic_light_red');
                obstacle.setImmovable(true);
                obstacle.body.setAllowGravity(false);
                obstacle.body.setSize(32, 100);
                obstacle.obstacleType = 'traffic_light';
                obstacle.stateTimer = 0;
                obstacle.isRed = true;
                break;

            case 'dog_walker':
                obstacle = this.obstacles.create(x, groundY - 74, 'dog_walker');
                obstacle.setImmovable(true);
                obstacle.body.setAllowGravity(false);
                obstacle.body.setSize(56, 74);
                obstacle.obstacleType = 'dog_walker';
                // 犬の散歩はゆっくり左右に移動
                obstacle.moveSpeed = Phaser.Math.Between(-30, 30);
                break;

            case 'puddle':
                obstacle = this.obstacles.create(x, groundY - 16, 'puddle');
                obstacle.setImmovable(true);
                obstacle.body.setAllowGravity(false);
                obstacle.body.setSize(64, 32);
                obstacle.obstacleType = 'puddle';
                break;

            case 'construction':
                obstacle = this.obstacles.create(x, groundY - 68, 'construction');
                obstacle.setImmovable(true);
                obstacle.body.setAllowGravity(false);
                obstacle.body.setSize(48, 68);
                obstacle.obstacleType = 'construction';
                break;
        }

        return obstacle;
    }

    // 障害物衝突処理
    handleObstacleCollision(player, obstacle) {
        if (obstacle.hasCollided) {
            return; // すでに衝突済み
        }

        obstacle.hasCollided = true;

        switch (obstacle.obstacleType) {
            case 'traffic_light':
                if (obstacle.isRed) {
                    // 赤信号で衝突 - 停止ペナルティ
                    this.player.setVelocityX(0);
                    this.urgencyValue -= 5;
                    playSoundEffect('collision');
                    console.log('🚦 赤信号！待たされた...');

                    // 2秒後に解除
                    this.time.delayedCall(2000, () => {
                        obstacle.hasCollided = false;
                    });
                }
                break;

            case 'dog_walker':
                // 犬にぶつかる - 転倒ペナルティ
                this.player.setVelocityX(this.player.body.velocity.x * -0.5);
                this.urgencyValue -= 8;
                playSoundEffect('collision');
                console.log('🐕 犬にぶつかった！');

                this.time.delayedCall(1000, () => {
                    obstacle.destroy();
                });
                break;

            case 'puddle':
                // 水たまりでスリップ
                this.player.setVelocityX(this.player.body.velocity.x * 1.3);
                this.urgencyValue -= 3;
                playSoundEffect('splash');
                console.log('💧 水たまりですべった！');

                this.time.delayedCall(500, () => {
                    obstacle.hasCollided = false;
                });
                break;

            case 'construction':
                // 工事現場 - 迂回が必要
                this.player.setVelocityX(0);
                this.urgencyValue -= 10;
                playSoundEffect('collision');
                console.log('🚧 工事中！迂回しないと...');

                this.time.delayedCall(3000, () => {
                    obstacle.destroy();
                });
                break;
        }
    }

    // 障害物更新
    updateObstacles(delta) {
        this.obstacles.children.entries.forEach(obstacle => {
            // 信号機の状態変化
            if (obstacle.obstacleType === 'traffic_light') {
                obstacle.stateTimer += delta;

                // 5秒ごとに赤⇔緑切り替え
                if (obstacle.stateTimer > 5000) {
                    obstacle.stateTimer = 0;
                    obstacle.isRed = !obstacle.isRed;

                    // テクスチャ切り替え
                    if (obstacle.isRed) {
                        obstacle.setTexture('traffic_light_red');
                    } else {
                        obstacle.setTexture('traffic_light_green');
                    }
                }
            }

            // 犬の散歩の移動
            if (obstacle.obstacleType === 'dog_walker' && obstacle.moveSpeed) {
                obstacle.x += obstacle.moveSpeed * (delta / 1000);

                // 画面外に出たら削除
                if (obstacle.x < -100 || obstacle.x > 2200) {
                    obstacle.destroy();
                }
            }

            // カメラの左外に出た障害物を削除（メモリ節約）
            if (obstacle.x < this.cameras.main.scrollX - 200) {
                obstacle.destroy();
            }
        });
    }

    update(time, delta) {
        if (this.gameOver) {
            return;
        }

        // ゲームパッド取得（遅延接続対応）
        if (!gamepad && this.input.gamepad && this.input.gamepad.total > 0) {
            gamepad = this.input.gamepad.getPad(0);
        }

        // プレイヤー移動処理
        this.handlePlayerMovement(time, delta);

        // 我慢ゲージ更新
        this.updateUrgencyGauge(delta);

        // UI更新
        this.updateUI();

        // ゲームオーバー判定
        this.checkGameOver();

        // 障害物更新
        this.updateObstacles(delta);

        // デバッグ情報
        this.updateDebugInfo();
    }

    handlePlayerMovement(time, delta) {
        const walkSpeed = 150;
        const runSpeed = 250;

        let moveX = 0;
        let isRunning = false;

        // キーボード入力
        if (this.cursors.left.isDown) {
            moveX = -1;
        } else if (this.cursors.right.isDown) {
            moveX = 1;
        }

        if (this.shiftKey.isDown) {
            isRunning = true;
        }

        // ゲームパッド入力
        if (gamepad) {
            const leftStickX = gamepad.leftStick.x;
            if (Math.abs(leftStickX) > 0.3) {
                moveX = leftStickX;
            }

            // Bボタン（index 0）で走る
            const runButton = gamepad.buttons[0];
            if (runButton && runButton.pressed) {
                isRunning = true;
            }
        }

        // 移動速度決定
        const speed = isRunning ? runSpeed : walkSpeed;

        if (moveX !== 0) {
            this.player.setVelocityX(moveX * speed);

            // アニメーション再生
            if (isRunning) {
                if (this.player.anims.currentAnim?.key !== 'run') {
                    this.player.play('run');
                }
            } else {
                if (this.player.anims.currentAnim?.key !== 'walk') {
                    this.player.play('walk');
                }
            }

            // 足音（0.3秒ごと）
            if (time > this.lastFootstepTime + 300) {
                playSoundEffect(isRunning ? 'footstepRun' : 'footstepWalk');
                this.lastFootstepTime = time;
            }

            // 我慢ゲージの減少速度調整
            this.urgencyDecayRate = isRunning ? 0.25 : 0.1;
        } else {
            this.player.setVelocityX(0);

            // アイドルアニメーション
            if (this.player.anims.currentAnim?.key !== 'idle') {
                this.player.play('idle');
            }

            // 立ち止まりは減少速度を少し遅く
            this.urgencyDecayRate = 0.07;
        }

        // プレイヤーの向き
        if (moveX > 0) {
            this.player.setFlipX(false);
        } else if (moveX < 0) {
            this.player.setFlipX(true);
        }

        // 体力ゲージの処理
        // 疲労状態チェック
        if (this.isExhausted) {
            this.exhaustedTimer -= delta;
            if (this.exhaustedTimer <= 0) {
                this.isExhausted = false;
            }
            // 疲労状態では走れない（強制的に歩き速度）
            return;
        }

        // 走っているときは体力を消費
        if (isRunning && moveX !== 0) {
            // 実際に走っている場合のみ体力を消費
            const actualSpeed = Math.abs(this.player.body.velocity.x);
            if (actualSpeed > walkSpeed * 1.2) {
                // 走り速度判定
                this.staminaValue -= this.staminaDrainRate * (delta / 1000);
            }
        } else {
            // 歩いているか停止中は体力回復
            this.staminaValue += this.staminaRegenRate * (delta / 1000);
        }

        // 体力の範囲制限
        if (this.staminaValue > 100) {
            this.staminaValue = 100;
        }

        // 体力が0になったら疲労状態に
        if (this.staminaValue <= 0 && !this.isExhausted) {
            this.staminaValue = 0;
            this.isExhausted = true;
            this.exhaustedTimer = 3000; // 3秒間疲労状態
            playSoundEffect('exhausted');

            // 強制的に歩き速度に
            if (this.player.body.velocity.x > 0) {
                this.player.setVelocityX(walkSpeed);
            } else if (this.player.body.velocity.x < 0) {
                this.player.setVelocityX(-walkSpeed);
            }
        }
    }

    updateUrgencyGauge(delta) {
        // ゲージ減少（delta は ms なので 1000 で割る）
        this.urgencyValue -= this.urgencyDecayRate * (delta / 1000);

        // 最小値制限
        if (this.urgencyValue < 0) {
            this.urgencyValue = 0;
        }

        // 警告音（閾値）
        if (this.urgencyValue < 40 && this.urgencyValue >= 39.9) {
            playSoundEffect('urgencyWarning');
        }

        if (this.urgencyValue < 20 && this.urgencyValue >= 19.9) {
            playSoundEffect('urgencyCritical');
        }
    }

    updateUI() {
        // 我慢ゲージ更新
        const urgencyPercent = Math.max(0, this.urgencyValue);
        this.urgencyBar.width = 300 * (urgencyPercent / 100);

        // ゲージの色変化
        if (urgencyPercent < 20) {
            this.urgencyBar.setFillStyle(0xF44336); // 赤
        } else if (urgencyPercent < 40) {
            this.urgencyBar.setFillStyle(0xFFC107); // 黄色
        } else {
            this.urgencyBar.setFillStyle(0x4CAF50); // 緑
        }

        this.urgencyText.setText(`我慢ゲージ: ${Math.floor(urgencyPercent)}%`);

        // 距離表示
        const distance = Math.floor(this.player.x);
        this.distanceText.setText(`距離: ${distance}m / 2000m`);

        // 体力ゲージ更新
        const staminaPercent = Math.max(0, this.staminaValue);
        this.staminaBar.width = 300 * (staminaPercent / 100);

        // ゲージの色変化
        if (staminaPercent === 0) {
            this.staminaBar.setFillStyle(0xF44336); // 赤（疲労）
        } else if (staminaPercent < 30) {
            this.staminaBar.setFillStyle(0xFFC107); // 黄色（低体力）
        } else {
            this.staminaBar.setFillStyle(0x2196F3); // 青（通常）
        }

        this.staminaText.setText(`体力: ${Math.floor(staminaPercent)}%`);
    }

    updateDebugInfo() {
        const gamepadInfo = gamepad ? `🎮 ${gamepad.id}` : '🎮 未接続';
        const exhaustedStatus = this.isExhausted ? ' [疲労]' : '';
        this.debugText.setText([
            gamepadInfo,
            `位置: ${Math.floor(this.player.x)}, ${Math.floor(this.player.y)}`,
            `速度: ${Math.floor(this.player.body.velocity.x)}`,
            `我慢: ${Math.floor(this.urgencyValue)}%`,
            `体力: ${Math.floor(this.staminaValue)}%${exhaustedStatus}`
        ]);
    }

    checkGameOver() {
        // 我慢ゲージが0になったらゲームオーバー
        if (this.urgencyValue <= 0) {
            this.triggerGameOver();
        }

        // ゴール到達（2000m地点）
        if (this.player.x >= 1950) {
            this.triggerVictory();
        }
    }

    triggerGameOver() {
        this.gameOver = true;
        this.player.setVelocity(0, 0);
        playSoundEffect('gameOver');

        // ゲームオーバー表示
        const gameOverText = this.add.text(400, 300, 'ゲームオーバー\n\n我慢できなかった...', {
            fontSize: '32px',
            fill: '#ff0000',
            fontStyle: 'bold',
            align: 'center'
        });
        gameOverText.setOrigin(0.5);
        gameOverText.setScrollFactor(0);

        const restartText = this.add.text(400, 400, 'F5キーでリスタート', {
            fontSize: '18px',
            fill: '#ffffff'
        });
        restartText.setOrigin(0.5);
        restartText.setScrollFactor(0);
    }

    triggerVictory() {
        this.gameOver = true;
        this.player.setVelocity(0, 0);

        // クリア表示
        const victoryText = this.add.text(400, 300, '🏠 クリア！\n\n無事に家に着いた！', {
            fontSize: '32px',
            fill: '#4CAF50',
            fontStyle: 'bold',
            align: 'center'
        });
        victoryText.setOrigin(0.5);
        victoryText.setScrollFactor(0);

        const restartText = this.add.text(400, 400, 'F5キーでリスタート', {
            fontSize: '18px',
            fill: '#ffffff'
        });
        restartText.setOrigin(0.5);
        restartText.setScrollFactor(0);
    }
}

// ============================================
// Phaser設定
// ============================================

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    input: {
        gamepad: true
    },
    scene: [BootScene, GameScene]
};

// ゲーム起動
const game = new Phaser.Game(config);
