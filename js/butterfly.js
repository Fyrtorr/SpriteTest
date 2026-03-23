// Butterfly catching mini-game mode

const FRAME_SIZE = 1250;       // source frame size in spritesheet
const FRAME_INSET = 100;       // crop inset to avoid edge artifacts
const DRAW_SIZE = 48;          // rendered size on screen
const FLAP_SPEED = 150;        // ms per frame
const MAX_BUTTERFLIES = 8;
const SPAWN_INTERVAL = 2000;
const MOVE_SPEED = 60;         // px/sec wander speed
const DIRECTION_CHANGE = 2000; // ms between direction changes
const CATCH_RANGE = 45;        // px distance to catch

// Clock powerup
const CLOCK_SIZE = 24;
const CLOCK_SPAWN_INTERVAL = 8000;
const CLOCK_FALL_SPEED = 80;
const CLOCK_BONUS = 10000;     // +10 seconds in ms
const MAX_CLOCKS = 3;

// Flap cycle: row 0 frames 0-3 (close) then row 3 frames 0-3 (open)
const FLAP_CYCLE = [
    { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
    { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 },
];

export class ButterflyMode {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.active = false;

        // Butterfly sprite
        this.image = new Image();
        this.imageLoaded = false;
        this.image.onload = () => { this.imageLoaded = true; };
        this.image.src = './assets/butterfly-blue-animation-sprite.png';

        this.butterflies = [];
        this.clocks = [];
        this.spawnTimer = 0;
        this.clockSpawnTimer = 0;

        // Game state
        this.timeRemaining = 60000; // 60 seconds in ms
        this.caught = 0;
        this.bestCaught = parseInt(localStorage.getItem('butterfly-best') || '0');
        this.gameOver = false;
        this.gameOverTimer = 0;
    }

    toggle() {
        this.active = !this.active;
        if (this.active) this._reset();
        return this.active;
    }

    _reset() {
        this.butterflies = [];
        this.clocks = [];
        this.spawnTimer = 0;
        this.clockSpawnTimer = 4000; // first clock after 4s
        this.timeRemaining = 60000;
        this.caught = 0;
        this.gameOver = false;
        this.gameOverTimer = 0;
    }

    update(deltaTime, player) {
        if (!this.active) return;

        if (this.gameOver) {
            this.gameOverTimer -= deltaTime;
            if (this.gameOverTimer <= 0) {
                this._reset(); // auto-restart
            }
            return;
        }

        // Countdown
        this.timeRemaining -= deltaTime;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.gameOver = true;
            this.gameOverTimer = 3000; // show results for 3s
            if (this.caught > this.bestCaught) {
                this.bestCaught = this.caught;
                localStorage.setItem('butterfly-best', this.bestCaught.toString());
            }
            return;
        }

        const dt = deltaTime / 1000;

        // Spawn butterflies
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0 && this.butterflies.length < MAX_BUTTERFLIES) {
            this.spawnTimer = SPAWN_INTERVAL;
            this._spawnButterfly();
        }

        // Spawn clocks
        this.clockSpawnTimer -= deltaTime;
        if (this.clockSpawnTimer <= 0 && this.clocks.length < MAX_CLOCKS) {
            this.clockSpawnTimer = CLOCK_SPAWN_INTERVAL;
            this.clocks.push({
                x: Math.random() * (this.canvasWidth - 40) + 20,
                y: -20,
                collected: false,
            });
        }

        // Update butterflies
        for (let i = this.butterflies.length - 1; i >= 0; i--) {
            const b = this.butterflies[i];

            // Animation
            b.animTimer += deltaTime;
            if (b.animTimer >= FLAP_SPEED) {
                b.animTimer -= FLAP_SPEED;
                b.frame = (b.frame + 1) % FLAP_CYCLE.length;
            }

            // Caught animation
            if (b.caught) {
                b.catchTimer -= deltaTime;
                b.y -= 80 * dt; // float up
                b.scale = Math.max(0, b.catchTimer / 500);
                if (b.catchTimer <= 0) {
                    this.butterflies.splice(i, 1);
                }
                continue;
            }

            // Wander movement
            b.dirTimer -= deltaTime;
            if (b.dirTimer <= 0) {
                b.dirTimer = DIRECTION_CHANGE + Math.random() * 1000;
                const angle = Math.random() * Math.PI * 2;
                b.vx = Math.cos(angle) * MOVE_SPEED;
                b.vy = Math.sin(angle) * MOVE_SPEED * 0.6;
            }

            b.x += b.vx * dt;
            b.y += b.vy * dt;
            // Gentle vertical bobbing
            b.bobPhase += dt * 3;
            const bob = Math.sin(b.bobPhase) * 0.5;
            b.y += bob;

            // Keep on screen
            if (b.x < 20) { b.x = 20; b.vx = Math.abs(b.vx); }
            if (b.x > this.canvasWidth - 20) { b.x = this.canvasWidth - 20; b.vx = -Math.abs(b.vx); }
            if (b.y < 40) { b.y = 40; b.vy = Math.abs(b.vy); }
            if (b.y > this.canvasHeight - 40) { b.y = this.canvasHeight - 40; b.vy = -Math.abs(b.vy); }
        }

        // Update clocks
        for (let i = this.clocks.length - 1; i >= 0; i--) {
            const c = this.clocks[i];
            c.y += CLOCK_FALL_SPEED * dt;

            // Collect on player contact
            const px = player.x + 32;
            const py = player.y + 32;
            if (Math.hypot(c.x - px, c.y - py) < 30) {
                this.timeRemaining += CLOCK_BONUS;
                this.clocks.splice(i, 1);
                continue;
            }

            // Remove if off screen
            if (c.y > this.canvasHeight + 20) {
                this.clocks.splice(i, 1);
            }
        }

        // Catch check (when player kicks/slashes)
        if (player.state === 'slash') {
            const kickZone = player.getKickZone();
            if (kickZone) {
                for (const b of this.butterflies) {
                    if (b.caught) continue;
                    if (b.x > kickZone.x && b.x < kickZone.x + kickZone.w &&
                        b.y > kickZone.y && b.y < kickZone.y + kickZone.h) {
                        b.caught = true;
                        b.catchTimer = 500;
                        b.scale = 1;
                        this.caught++;
                    }
                }
            }
        }
    }

    _spawnButterfly() {
        // Spawn from random edge
        const side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) { x = -20; y = Math.random() * this.canvasHeight; }
        else if (side === 1) { x = this.canvasWidth + 20; y = Math.random() * this.canvasHeight; }
        else if (side === 2) { x = Math.random() * this.canvasWidth; y = -20; }
        else { x = Math.random() * this.canvasWidth; y = this.canvasHeight + 20; }

        const angle = Math.atan2(this.canvasHeight / 2 - y, this.canvasWidth / 2 - x) + (Math.random() - 0.5);

        this.butterflies.push({
            x, y,
            vx: Math.cos(angle) * MOVE_SPEED,
            vy: Math.sin(angle) * MOVE_SPEED * 0.6,
            scale: 1,
            frame: Math.floor(Math.random() * FLAP_CYCLE.length),
            animTimer: 0,
            dirTimer: DIRECTION_CHANGE,
            bobPhase: Math.random() * Math.PI * 2,
            caught: false,
            catchTimer: 0,
            scale: 1,
        });
    }

    draw(ctx) {
        if (!this.active) return;

        // Draw clocks
        for (const c of this.clocks) {
            this._drawClock(ctx, c.x, c.y);
        }

        // Draw butterflies
        if (this.imageLoaded) {
            for (const b of this.butterflies) {
                const f = FLAP_CYCLE[b.frame];
                const sx = f.col * FRAME_SIZE + FRAME_INSET;
                const sy = f.row * FRAME_SIZE + FRAME_INSET;
                const srcSize = FRAME_SIZE - FRAME_INSET * 2;
                const size = DRAW_SIZE * b.scale;

                ctx.save();
                if (b.caught) ctx.globalAlpha = b.catchTimer / 500;
                ctx.drawImage(
                    this.image,
                    sx, sy, srcSize, srcSize,
                    b.x - size / 2, b.y - size / 2, size, size
                );
                ctx.restore();
            }
        }

        // Draw HUD
        this._drawHUD(ctx);
    }

    _drawClock(ctx, x, y) {
        ctx.save();
        // Clock body
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x, y, CLOCK_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#aa8800';
        ctx.lineWidth = 2;
        ctx.stroke();

        // +10 text
        ctx.fillStyle = '#553300';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+10', x, y);
        ctx.restore();
    }

    _drawHUD(ctx) {
        ctx.save();

        // Background bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.canvasWidth, 32);

        ctx.font = 'bold 16px monospace';
        ctx.textBaseline = 'middle';

        if (this.gameOver) {
            ctx.fillStyle = '#ff4444';
            ctx.textAlign = 'center';
            ctx.fillText(`Time's up! Caught: ${this.caught}  |  Best: ${this.bestCaught}`, this.canvasWidth / 2, 16);
        } else {
            // Timer
            const secs = Math.ceil(this.timeRemaining / 1000);
            ctx.fillStyle = secs <= 10 ? '#ff4444' : '#fff';
            ctx.fillText(`Time: ${secs}s`, 12, 16);

            // Caught count
            ctx.fillStyle = '#88ddff';
            ctx.fillText(`Caught: ${this.caught}`, this.canvasWidth / 2 - 50, 16);

            // Best
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`Best: ${this.bestCaught}`, this.canvasWidth - 130, 16);
        }

        ctx.restore();
    }
}
