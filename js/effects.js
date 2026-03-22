// Toggleable effects system

const DODGEBALL_RADIUS = 10;
const DODGEBALL_SPEED = 250;       // fall speed px/sec
const DODGEBALL_SPAWN_INTERVAL = 400; // ms between spawns
const HIT_STUN_DURATION = 800;     // ms the hurt animation plays

export class EffectsManager {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.activeEffects = new Set();

        // Dodgeball state
        this.dodgeballs = [];
        this.spawnTimer = 0;
    }

    toggle(effectName) {
        if (this.activeEffects.has(effectName)) {
            this.activeEffects.delete(effectName);
            if (effectName === 'dodgeball') this.dodgeballs = [];
        } else {
            this.activeEffects.add(effectName);
        }
        return this.activeEffects.has(effectName);
    }

    isActive(effectName) {
        return this.activeEffects.has(effectName);
    }

    update(deltaTime, player) {
        if (this.activeEffects.has('dodgeball')) {
            this._updateDodgeballs(deltaTime, player);
        }
    }

    draw(ctx) {
        if (this.activeEffects.has('dodgeball')) {
            this._drawDodgeballs(ctx);
        }
    }

    _updateDodgeballs(deltaTime, player) {
        const dt = deltaTime / 1000;

        // Spawn new balls
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = DODGEBALL_SPAWN_INTERVAL;
            this.dodgeballs.push({
                x: Math.random() * (this.canvasWidth - 40) + 20,
                y: Math.random() * (this.canvasHeight - 80) + 40, // landing spot on ground
                z: 200 + Math.random() * 100, // start high up
                speed: DODGEBALL_SPEED + Math.random() * 100,
                radius: DODGEBALL_RADIUS,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 12,
                landed: false,
                fadeTimer: 0,
            });
        }

        // Update balls
        for (let i = this.dodgeballs.length - 1; i >= 0; i--) {
            const ball = this.dodgeballs[i];

            if (!ball.landed) {
                // Fall down (z decreases toward ground)
                ball.z -= ball.speed * dt;
                ball.rotation += ball.rotSpeed * dt;

                // Shadow grows as ball gets closer to ground
                if (ball.z <= 0) {
                    ball.z = 0;
                    ball.landed = true;
                    ball.fadeTimer = 500; // fade out over 500ms

                    // Check hit on player
                    if (player.state !== 'hurt') {
                        const px = player.x + 32;
                        const py = player.y + 32;
                        const pz = player.z;
                        const dist = Math.hypot(ball.x - px, ball.y - py);

                        // Hit if close horizontally and player isn't high enough to dodge
                        if (dist < 30 && pz < 20) {
                            player.getHit(HIT_STUN_DURATION);
                        }
                    }
                }
            } else {
                ball.fadeTimer -= deltaTime;
                if (ball.fadeTimer <= 0) {
                    this.dodgeballs.splice(i, 1);
                }
            }
        }
    }

    _drawDodgeballs(ctx) {
        for (const ball of this.dodgeballs) {
            // Draw shadow on ground
            const shadowScale = Math.max(0.2, 1 - ball.z / 200);
            ctx.save();
            ctx.globalAlpha = 0.25 * shadowScale;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(ball.x, ball.y, 8 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Draw ball at visual height
            const ballDrawY = ball.y - ball.z;
            const alpha = ball.landed ? Math.max(0, ball.fadeTimer / 500) : 1;

            ctx.save();
            ctx.globalAlpha = alpha;

            // Ball body
            ctx.fillStyle = '#cc2222';
            ctx.beginPath();
            ctx.arc(ball.x, ballDrawY, ball.radius, 0, Math.PI * 2);
            ctx.fill();

            // White stripe (dodgeball style)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ball.x, ballDrawY, ball.radius - 1,
                -Math.PI / 2 + ball.rotation, Math.PI / 2 + ball.rotation, false);
            ctx.stroke();

            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(ball.x - 3, ballDrawY - 3, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }
}
