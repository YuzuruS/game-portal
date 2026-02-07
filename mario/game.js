// ゲーム設定
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#5c94fc',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false
        }
    },
    input: {
        gamepad: true  // ゲームパッドを明示的に有効化
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// ゲーム変数
let player;
let platforms;
let bricks;
let questionBlocks;
let enemies;
let coins;
let cursors;
let gamepad;
let score = 0;
let scoreText;
let lives = 3;
let livesText;
let gameOver = false;
let powerUp = false;

// 効果音生成用のAudioContext
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// 効果音関数
function playSoundEffect(type) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
        case 'jump':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;

        case 'coin':
            oscillator.frequency.setValueAtTime(988, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1319, audioContext.currentTime + 0.05);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;

        case 'stomp':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;

        case 'powerup':
            const notes = [659, 784, 1047, 1319, 1568, 2093, 2349, 2637];
            notes.forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.05 + 0.1);
                osc.start(audioContext.currentTime + i * 0.05);
                osc.stop(audioContext.currentTime + i * 0.05 + 0.1);
            });
            return;

        case 'damage':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;

        case 'gameover':
            const gameOverNotes = [523, 493, 440, 392, 349, 330, 294];
            gameOverNotes.forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.2);
                osc.start(audioContext.currentTime + i * 0.15);
                osc.stop(audioContext.currentTime + i * 0.15 + 0.2);
            });
            return;

        case 'block':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
    }
}

function preload() {
    // プレイヤースプライトを描画で作成
    createPlayerSprite(this);
    createBrickSprite(this);
    createQuestionBlockSprite(this);
    createGroundSprite(this);
    createPipeSprite(this);
    createGoombaSprite(this);
    createCoinSprite(this);
    createMushroomSprite(this);
}

function createPlayerSprite(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

    // 小さいマリオ
    graphics.fillStyle(0xff0000);
    graphics.fillRect(2, 0, 12, 4);
    graphics.fillRect(0, 4, 16, 4);
    graphics.fillStyle(0xffa500);
    graphics.fillRect(2, 8, 12, 4);
    graphics.fillStyle(0x0000ff);
    graphics.fillRect(0, 12, 6, 4);
    graphics.fillRect(10, 12, 6, 4);
    graphics.fillStyle(0xffa500);
    graphics.fillRect(2, 16, 4, 8);
    graphics.fillRect(10, 16, 4, 8);
    graphics.fillStyle(0x8b4513);
    graphics.fillRect(0, 24, 6, 4);
    graphics.fillRect(10, 24, 6, 4);

    graphics.generateTexture('player', 16, 28);
    graphics.destroy();
}

function createBrickSprite(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xd2691e);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0x8b4513);
    graphics.fillRect(0, 0, 32, 2);
    graphics.fillRect(0, 0, 2, 32);
    graphics.fillStyle(0xa0522d);
    graphics.fillRect(8, 8, 6, 6);
    graphics.fillRect(18, 8, 6, 6);
    graphics.fillRect(8, 18, 6, 6);
    graphics.fillRect(18, 18, 6, 6);
    graphics.generateTexture('brick', 32, 32);
    graphics.destroy();
}

function createQuestionBlockSprite(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffa500);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0xffff00);
    graphics.fillRect(12, 8, 8, 16);
    graphics.fillRect(8, 12, 16, 8);
    graphics.generateTexture('questionBlock', 32, 32);
    graphics.destroy();
}

function createGroundSprite(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x8b4513);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0xa0522d);
    graphics.fillRect(0, 0, 32, 4);
    graphics.generateTexture('ground', 32, 32);
    graphics.destroy();
}

function createPipeSprite(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x00ff00);
    graphics.fillRect(0, 0, 64, 96);
    graphics.fillStyle(0x008000);
    graphics.fillRect(0, 0, 64, 16);
    graphics.fillRect(8, 16, 48, 80);
    graphics.generateTexture('pipe', 64, 96);
    graphics.destroy();
}

function createGoombaSprite(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x8b4513);
    graphics.fillRect(4, 0, 16, 8);
    graphics.fillStyle(0xffa500);
    graphics.fillRect(0, 8, 24, 12);
    graphics.fillStyle(0x000000);
    graphics.fillRect(6, 10, 3, 3);
    graphics.fillRect(15, 10, 3, 3);
    graphics.fillStyle(0x8b4513);
    graphics.fillRect(0, 20, 10, 8);
    graphics.fillRect(14, 20, 10, 8);
    graphics.generateTexture('goomba', 24, 28);
    graphics.destroy();
}

function createCoinSprite(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffd700);
    graphics.fillCircle(12, 12, 10);
    graphics.fillStyle(0xffff00);
    graphics.fillCircle(12, 12, 6);
    graphics.generateTexture('coin', 24, 24);
    graphics.destroy();
}

function createMushroomSprite(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xff0000);
    graphics.fillEllipse(16, 12, 28, 20);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(10, 10, 4);
    graphics.fillCircle(22, 10, 4);
    graphics.fillStyle(0xffa500);
    graphics.fillRect(10, 16, 12, 12);
    graphics.generateTexture('mushroom', 32, 28);
    graphics.destroy();
}

function create() {
    // ワールドサイズを拡張
    this.physics.world.setBounds(0, 0, 6400, 600);

    // 地面の作成
    platforms = this.physics.add.staticGroup();

    // 地面（0-6400まで、穴を開ける部分以外）
    for (let i = 0; i < 200; i++) {
        // 穴を作成（特定の位置）
        if ((i >= 35 && i <= 38) || (i >= 70 && i <= 74) || (i >= 120 && i <= 125)) {
            continue; // 穴
        }
        platforms.create(i * 32, 568, 'ground');
    }

    // レンガブロック
    bricks = this.physics.add.staticGroup();

    // エリア1: 最初のブロック群
    for (let i = 0; i < 4; i++) {
        bricks.create(320 + i * 32, 300, 'brick');
    }
    bricks.create(352, 200, 'brick');

    // エリア2: 階段状のブロック
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j <= i; j++) {
            bricks.create(800 + i * 32, 568 - j * 32, 'brick');
        }
    }

    // エリア3: 空中ブロック群
    for (let i = 0; i < 8; i++) {
        bricks.create(1200 + i * 32, 300, 'brick');
    }

    // エリア4: より多くのブロック
    for (let i = 0; i < 5; i++) {
        bricks.create(1600 + i * 32, 350, 'brick');
    }
    for (let i = 0; i < 3; i++) {
        bricks.create(1700 + i * 32, 250, 'brick');
    }

    // エリア5: 長い空中ブロック
    for (let i = 0; i < 10; i++) {
        bricks.create(2200 + i * 32, 300, 'brick');
    }

    // エリア6: 複数層のブロック
    for (let i = 0; i < 6; i++) {
        bricks.create(3000 + i * 32, 300, 'brick');
        if (i >= 2 && i <= 4) {
            bricks.create(3000 + i * 32, 200, 'brick');
        }
    }

    // エリア7: ゴール前のブロック
    for (let i = 0; i < 15; i++) {
        bricks.create(5000 + i * 32, 250, 'brick');
    }

    // はてなブロック
    questionBlocks = this.physics.add.staticGroup();

    // 各エリアにはてなブロック配置
    questionBlocks.create(384, 300, 'questionBlock').setData('hasItem', true);
    questionBlocks.create(500, 300, 'questionBlock').setData('hasItem', true);
    questionBlocks.create(900, 300, 'questionBlock').setData('hasItem', true);
    questionBlocks.create(1350, 300, 'questionBlock').setData('hasItem', true);
    questionBlocks.create(1750, 250, 'questionBlock').setData('hasItem', true);
    questionBlocks.create(2100, 200, 'questionBlock').setData('hasItem', true);
    questionBlocks.create(2400, 300, 'questionBlock').setData('hasItem', true);
    questionBlocks.create(2800, 300, 'questionBlock').setData('hasItem', true);
    questionBlocks.create(3100, 200, 'questionBlock').setData('hasItem', true);
    questionBlocks.create(3500, 300, 'questionBlock').setData('hasItem', true);
    questionBlocks.create(4000, 300, 'questionBlock').setData('hasItem', true);
    questionBlocks.create(4500, 250, 'questionBlock').setData('hasItem', true);
    questionBlocks.create(5200, 250, 'questionBlock').setData('hasItem', true);

    // 土管
    platforms.create(600, 504, 'pipe');
    platforms.create(1000, 504, 'pipe');
    platforms.create(1500, 504, 'pipe');
    platforms.create(2000, 504, 'pipe');
    platforms.create(2600, 504, 'pipe');
    platforms.create(3300, 504, 'pipe');
    platforms.create(4200, 504, 'pipe');
    platforms.create(4800, 504, 'pipe');

    // ゴールポール（レンガで代用）
    for (let i = 0; i < 12; i++) {
        bricks.create(5800, 568 - i * 32, 'brick');
    }

    // プレイヤー作成
    player = this.physics.add.sprite(100, 450, 'player');
    player.setBounce(0);
    player.setCollideWorldBounds(true);
    player.body.setSize(12, 24);

    // カメラ設定
    this.cameras.main.setBounds(0, 0, 6400, 600);
    this.cameras.main.startFollow(player);

    // 敵キャラクター（より多く配置）
    enemies = this.physics.add.group();

    const enemyPositions = [
        400, 550, 750, 950, 1150, 1300, 1450, 1650, 1850, 2050,
        2250, 2450, 2650, 2850, 3050, 3300, 3550, 3800, 4050, 4300,
        4550, 4800, 5050, 5300, 5550
    ];

    enemyPositions.forEach(x => {
        const goomba = enemies.create(x, 400, 'goomba');
        goomba.setBounce(0);
        goomba.setCollideWorldBounds(true);
        goomba.setVelocityX(-50);
        goomba.body.setSize(20, 24);
    });

    // コイン（より多く配置）
    coins = this.physics.add.group();

    // コイン群を複数配置
    const coinAreas = [
        { start: 250, count: 8 },
        { start: 700, count: 10 },
        { start: 1100, count: 12 },
        { start: 1550, count: 8 },
        { start: 2100, count: 15 },
        { start: 2700, count: 10 },
        { start: 3200, count: 12 },
        { start: 3700, count: 8 },
        { start: 4100, count: 10 },
        { start: 4600, count: 8 },
        { start: 5100, count: 15 }
    ];

    coinAreas.forEach(area => {
        for (let i = 0; i < area.count; i++) {
            const coin = coins.create(area.start + i * 40, 450, 'coin');
            coin.setBounce(0.3);
        }
    });

    // 衝突設定
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(player, bricks);
    this.physics.add.collider(enemies, platforms);
    this.physics.add.collider(enemies, bricks);
    this.physics.add.collider(coins, platforms);

    // プレイヤーとはてなブロックの衝突
    this.physics.add.collider(player, questionBlocks, hitQuestionBlock, null, this);

    // プレイヤーとコインの衝突
    this.physics.add.overlap(player, coins, collectCoin, null, this);

    // プレイヤーと敵の衝突
    this.physics.add.collider(player, enemies, hitEnemy, null, this);

    // 敵同士の衝突で方向転換
    this.physics.add.collider(enemies, enemies, function(enemy1, enemy2) {
        enemy1.setVelocityX(-enemy1.body.velocity.x);
        enemy2.setVelocityX(-enemy2.body.velocity.x);
    });

    // キーボード入力
    cursors = this.input.keyboard.createCursorKeys();

    // スコア表示
    scoreText = this.add.text(16, 16, 'SCORE: 0', {
        fontSize: '20px',
        fill: '#fff',
        fontFamily: 'Arial'
    });

    // ライフ表示
    livesText = this.add.text(16, 46, 'LIVES: 3', {
        fontSize: '20px',
        fill: '#fff',
        fontFamily: 'Arial'
    });

    // コントローラー接続状態表示
    const controllerText = this.add.text(16, 76, '', {
        fontSize: '14px',
        fill: '#fff',
        fontFamily: 'Arial'
    });

    const helpText = this.add.text(16, 96, 'Switch Pro: ボタンを押すと接続', {
        fontSize: '12px',
        fill: '#aaa',
        fontFamily: 'Arial'
    });

    // ゲームパッド入力の初期化
    if (this.input.gamepad) {
        // すでに接続されているゲームパッドをチェック
        this.input.gamepad.once('connected', function(pad) {
            gamepad = pad;
            controllerText.setText('🎮 接続: ' + pad.id);
            helpText.setText('');
            console.log('ゲームパッド接続:', pad.id);
        });

        // ゲームパッドマネージャーを開始
        this.input.gamepad.once('down', function(pad) {
            if (!gamepad) {
                gamepad = pad;
                controllerText.setText('🎮 接続: ' + pad.id);
                helpText.setText('');
                console.log('ゲームパッド検出:', pad.id);
            }
        });

        // 状態監視
        this.time.addEvent({
            delay: 500,
            callback: function() {
                if (gamepad) {
                    controllerText.setText('🎮 接続: ' + gamepad.id);
                    helpText.setText('');
                } else if (this.input.gamepad.total > 0) {
                    const pad = this.input.gamepad.getPad(0);
                    if (pad) {
                        gamepad = pad;
                        controllerText.setText('🎮 接続: ' + pad.id);
                        helpText.setText('');
                    } else {
                        controllerText.setText('⌨️ キーボード');
                    }
                } else {
                    controllerText.setText('⌨️ キーボード');
                }
            },
            callbackScope: this,
            loop: true
        });
    }
}

function update() {
    if (gameOver) {
        return;
    }

    // ゲームパッドを毎フレーム取得
    if (!gamepad && this.input.gamepad.total > 0) {
        gamepad = this.input.gamepad.getPad(0);
        console.log('ゲームパッド取得:', gamepad ? gamepad.id : 'なし');
    }

    // ゲームパッド入力の処理
    let moveLeft = cursors.left.isDown;
    let moveRight = cursors.right.isDown;
    let jump = cursors.up.isDown;

    if (gamepad) {
        // 左スティック
        const leftStickX = gamepad.leftStick.x;

        // 十字キー（Phaserのボタン配列）
        const dpadLeft = gamepad.left || (gamepad.buttons[14] && gamepad.buttons[14].pressed);
        const dpadRight = gamepad.right || (gamepad.buttons[15] && gamepad.buttons[15].pressed);
        const dpadUp = gamepad.up || (gamepad.buttons[12] && gamepad.buttons[12].pressed);

        // ボタン (Switch Pro: 0=B, 1=A, 2=Y, 3=X)
        const buttonB = gamepad.buttons[0] && gamepad.buttons[0].pressed; // ジャンプ
        const buttonA = gamepad.buttons[1] && gamepad.buttons[1].pressed; // 走る（将来的に使用）

        // 移動入力
        if (leftStickX < -0.3 || dpadLeft) {
            moveLeft = true;
        }
        if (leftStickX > 0.3 || dpadRight) {
            moveRight = true;
        }
        if (dpadUp || buttonB || buttonA) {
            jump = true;
        }
    }

    // プレイヤー操作
    if (moveLeft) {
        player.setVelocityX(-200);
    } else if (moveRight) {
        player.setVelocityX(200);
    } else {
        player.setVelocityX(0);
    }

    // ジャンプ
    if (jump && player.body.touching.down) {
        player.setVelocityY(-500);
        playSoundEffect('jump');
    }

    // 敵の動き
    enemies.children.entries.forEach(enemy => {
        if (enemy.body.blocked.right || enemy.body.blocked.left) {
            enemy.setVelocityX(-enemy.body.velocity.x);
        }
    });

    // ゴール判定
    if (player.x >= 5800 && !gameOver) {
        gameOver = true;
        player.setVelocity(0, 0);
        playSoundEffect('powerup');

        this.add.text(player.x, 250, 'STAGE CLEAR!', {
            fontSize: '64px',
            fill: '#ffff00',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(1);

        this.add.text(player.x, 330, 'SCORE: ' + score, {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setScrollFactor(1);

        this.time.delayedCall(3000, function() {
            this.scene.restart();
            score = 0;
            lives = 3;
            gameOver = false;
            powerUp = false;
        }, [], this);
    }

    // カメラがプレイヤーを追従（削除して代わりにstartFollowを使用）
}

function collectCoin(player, coin) {
    coin.disableBody(true, true);
    score += 100;
    scoreText.setText('SCORE: ' + score);
    playSoundEffect('coin');
}

function hitQuestionBlock(player, block) {
    if (player.body.velocity.y > 0 || !block.getData('hasItem')) {
        return;
    }

    block.setData('hasItem', false);
    block.setTint(0x888888);
    playSoundEffect('block');

    // アイテム出現
    const mushroom = this.physics.add.sprite(block.x, block.y - 32, 'mushroom');
    mushroom.setVelocityX(100);
    mushroom.setBounce(0);

    this.physics.add.collider(mushroom, platforms);
    this.physics.add.collider(mushroom, bricks);

    this.physics.add.overlap(player, mushroom, function(player, mushroom) {
        mushroom.disableBody(true, true);
        score += 1000;
        scoreText.setText('SCORE: ' + score);
        powerUp = true;
        player.setScale(1.2);
        playSoundEffect('powerup');
    }, null, this);

    score += 200;
    scoreText.setText('SCORE: ' + score);
}

function hitEnemy(player, enemy) {
    if (player.body.velocity.y > 0 && player.y < enemy.y) {
        // 敵を踏んだ
        enemy.disableBody(true, true);
        player.setVelocityY(-300);
        score += 200;
        scoreText.setText('SCORE: ' + score);
        playSoundEffect('stomp');
    } else {
        // ダメージを受けた
        if (powerUp) {
            powerUp = false;
            player.setScale(1);
            player.setTint(0xff0000);
            playSoundEffect('damage');
            this.time.delayedCall(1000, function() {
                player.clearTint();
            }, [], this);
        } else {
            lives--;
            livesText.setText('LIVES: ' + lives);
            playSoundEffect('damage');

            if (lives <= 0) {
                gameOver = true;
                player.setTint(0xff0000);
                player.setVelocity(0, 0);
                playSoundEffect('gameover');

                this.add.text(400, 300, 'GAME OVER', {
                    fontSize: '64px',
                    fill: '#fff',
                    fontFamily: 'Arial'
                }).setOrigin(0.5).setScrollFactor(0);

                this.time.delayedCall(3000, function() {
                    this.scene.restart();
                    score = 0;
                    lives = 3;
                    gameOver = false;
                    powerUp = false;
                }, [], this);
            } else {
                player.setPosition(100, 450);
                player.setTint(0xff0000);
                this.time.delayedCall(1000, function() {
                    player.clearTint();
                }, [], this);
            }
        }
    }
}
