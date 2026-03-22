// Toggleable effects system

const DODGEBALL_RADIUS = 10;
const DODGEBALL_GRAVITY = 600;      // gravity for bounce physics
const DODGEBALL_BOUNCE_DAMPING = 0.65; // energy kept per bounce
const DODGEBALL_FRICTION = 0.98;    // horizontal slowdown per frame
const HIT_STUN_DURATION = 800;
const MAX_DODGEBALLS = 60;          // cap to avoid performance issues
const SPAWN_INTERVALS = [800, 400, 150, 60]; // ms per intensity level

export class EffectsManager {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.activeEffects = new Set();

        // Dodgeball state
        this.dodgeballs = [];
        this.spawnTimer = 0;
        this.dodgeballIntensity = 0; // 0=off, 1=low, 2=med, 3=high
    }

    cycleDodgeballIntensity() {
        this.dodgeballIntensity = (this.dodgeballIntensity + 1) % 4;
        if (this.dodgeballIntensity === 0) {
            this.activeEffects.delete('dodgeball');
            this.dodgeballs = [];
        } else {
            this.activeEffects.add('dodgeball');
        }
        return this.dodgeballIntensity;
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
        const interval = SPAWN_INTERVALS[this.dodgeballIntensity] || 400;

        // Spawn new balls
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0 && this.dodgeballs.length < MAX_DODGEBALLS) {
            this.spawnTimer = interval;
            const angle = Math.random() * Math.PI * 2;
            const hSpeed = 40 + Math.random() * 80;
            this.dodgeballs.push({
                x: Math.random() * (this.canvasWidth - 40) + 20,
                y: Math.random() * (this.canvasHeight - 80) + 40,
                z: 250 + Math.random() * 100,
                vx: Math.cos(angle) * hSpeed, // horizontal velocity
                vy: Math.sin(angle) * hSpeed * 0.5,
                vz: 0,                         // vertical velocity (gravity applied)
                radius: DODGEBALL_RADIUS,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 12,
                bounces: 0,
                alive: true,
            });
        }

        // Update balls
        for (let i = this.dodgeballs.length - 1; i >= 0; i--) {
            const ball = this.dodgeballs[i];

            // Apply gravity
            ball.vz -= DODGEBALL_GRAVITY * dt;
            ball.z += ball.vz * dt;

            // Horizontal movement
            ball.x += ball.vx * dt;
            ball.y += ball.vy * dt;
            ball.vx *= DODGEBALL_FRICTION;
            ball.vy *= DODGEBALL_FRICTION;
            ball.rotation += ball.rotSpeed * dt;

            // Bounce off ground
            if (ball.z <= 0) {
                ball.z = 0;
                ball.bounces++;

                // Check hit on player at bounce point
                if (player.state !== 'hurt') {
                    const px = player.x + 32;
                    const py = player.y + 32;
                    const dist = Math.hypot(ball.x - px, ball.y - py);
                    if (dist < 30 && player.z < 20) {
                        player.getHit(HIT_STUN_DURATION);
                    }
                }

                if (ball.bounces >= 5 || Math.abs(ball.vz) < 20) {
                    // Done bouncing — remove
                    this.dodgeballs.splice(i, 1);
                    continue;
                }

                ball.vz = Math.abs(ball.vz) * DODGEBALL_BOUNCE_DAMPING;
                // Add some random horizontal kick on bounce
                ball.vx += (Math.random() - 0.5) * 60;
                ball.vy += (Math.random() - 0.5) * 30;
                ball.rotSpeed = (Math.random() - 0.5) * 15;
            }

            // Bounce off walls
            if (ball.x < ball.radius) {
                ball.x = ball.radius;
                ball.vx = Math.abs(ball.vx) * 0.8;
            } else if (ball.x > this.canvasWidth - ball.radius) {
                ball.x = this.canvasWidth - ball.radius;
                ball.vx = -Math.abs(ball.vx) * 0.8;
            }
            if (ball.y < ball.radius + 20) {
                ball.y = ball.radius + 20;
                ball.vy = Math.abs(ball.vy) * 0.8;
            } else if (ball.y > this.canvasHeight - ball.radius) {
                ball.y = this.canvasHeight - ball.radius;
                ball.vy = -Math.abs(ball.vy) * 0.8;
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

            ctx.save();

            // Ball body
            ctx.fillStyle = '#cc2222';
            ctx.beginPath();
            ctx.arc(ball.x, ballDrawY, ball.radius, 0, Math.PI * 2);
            ctx.fill();

            // White stripe
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
