import { isKeyDown, wasKeyPressed } from './input.js';

const WALK_SPEED = 200;
const RUN_SPEED = 350;
const SQRT2 = Math.SQRT2;
const SLASH_DURATION = 600;

// Jump physics
const JUMP_VELOCITY = -400; // initial upward velocity (pixels/sec)
const GRAVITY = 1200;       // gravity acceleration (pixels/sec^2)

export class Player {
    constructor(x, y, canvasWidth, canvasHeight) {
        this.x = x;
        this.y = y;         // ground position (foot level)
        this.z = 0;         // height above ground (0 = on ground)
        this.vz = 0;        // vertical velocity
        this.groundLevel = 0; // current ground elevation
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.direction = 'down';
        this.state = 'idle';
        this.actionTimer = 0;
        this.isGrounded = true;

        // Collision box (relative to x,y — feet area)
        this.hitWidth = 32;
        this.hitHeight = 16;
        this.hitOffsetX = 16; // center the 32px box in the 64px sprite
        this.hitOffsetY = 48; // near the feet
    }

    getHitbox() {
        return {
            x: this.x + this.hitOffsetX,
            y: this.y + this.hitOffsetY,
            w: this.hitWidth,
            h: this.hitHeight,
        };
    }

    update(deltaTime, objects) {
        const dt = deltaTime / 1000;

        // Handle slash lock
        if (this.state === 'slash') {
            this.actionTimer -= deltaTime;
            if (this.actionTimer <= 0) {
                this.state = 'idle';
            }
            // Still apply gravity while slashing in air
            if (!this.isGrounded) {
                this._applyGravity(dt, objects);
            }
            return;
        }

        // Jump trigger
        if (wasKeyPressed('Space') && this.isGrounded) {
            this.vz = JUMP_VELOCITY;
            this.isGrounded = false;
            this.state = 'jump';
        }

        // Slash trigger
        if ((wasKeyPressed('KeyE') || wasKeyPressed('Enter')) && this.isGrounded) {
            this.state = 'slash';
            this.actionTimer = SLASH_DURATION;
            return;
        }

        // Gravity
        if (!this.isGrounded) {
            this._applyGravity(dt, objects);
        }

        // Movement (can move while jumping)
        let dx = 0;
        let dy = 0;
        if (isKeyDown('KeyW') || isKeyDown('ArrowUp')) dy -= 1;
        if (isKeyDown('KeyS') || isKeyDown('ArrowDown')) dy += 1;
        if (isKeyDown('KeyA') || isKeyDown('ArrowLeft')) dx -= 1;
        if (isKeyDown('KeyD') || isKeyDown('ArrowRight')) dx += 1;

        const isMoving = dx !== 0 || dy !== 0;
        const isRunning = isKeyDown('ShiftLeft') || isKeyDown('ShiftRight');

        if (isMoving) {
            if (dy < 0) this.direction = 'up';
            else if (dy > 0) this.direction = 'down';
            if (dx < 0) this.direction = 'left';
            else if (dx > 0) this.direction = 'right';

            const speed = isRunning ? RUN_SPEED : WALK_SPEED;
            const magnitude = (dx !== 0 && dy !== 0) ? SQRT2 : 1;

            const newX = this.x + (dx / magnitude) * speed * dt;
            const newY = this.y + (dy / magnitude) * speed * dt;

            // Try moving, check collisions with objects
            const oldX = this.x;
            const oldY = this.y;

            // Try X movement
            this.x = newX;
            if (this._collidesWithWall(objects)) {
                this.x = oldX;
            }

            // Try Y movement
            this.y = newY;
            if (this._collidesWithWall(objects)) {
                this.y = oldY;
            }

            // Clamp to canvas
            this.x = Math.max(0, Math.min(this.canvasWidth - 64, this.x));
            this.y = Math.max(0, Math.min(this.canvasHeight - 64, this.y));

            if (this.isGrounded) {
                this.state = isRunning ? 'run' : 'walk';
            }
        } else if (this.isGrounded) {
            this.state = 'idle';
        }

        // Update ground level based on what we're standing on
        if (this.isGrounded) {
            this.groundLevel = this._getGroundLevel(objects);
            this.z = this.groundLevel;
        }
    }

    _applyGravity(dt, objects) {
        this.vz += GRAVITY * dt;
        this.z += this.vz * dt;

        const ground = this._getGroundLevel(objects);

        if (this.z >= ground && this.vz > 0) {
            // Landed
            this.z = ground;
            this.vz = 0;
            this.isGrounded = true;
            this.groundLevel = ground;
            if (this.state === 'jump') {
                this.state = 'idle';
            }
        }
    }

    _collidesWithWall(objects) {
        const hb = this.getHitbox();
        for (const obj of objects) {
            if (!obj.solid) continue;
            // Only collide with walls if we're at the same elevation
            // (player can walk on top of objects they've jumped onto)
            if (this.z < obj.height - 8) {
                if (rectsOverlap(hb, obj)) return true;
            }
        }
        return false;
    }

    _getGroundLevel(objects) {
        const hb = this.getHitbox();
        let highest = 0;

        for (const obj of objects) {
            if (!obj.standable) continue;

            // Check if player's feet are over this object
            if (rectsOverlap(hb, obj)) {
                if (obj.type === 'stairs') {
                    // Gradual height based on position on stairs
                    const progress = Math.max(0, Math.min(1,
                        (obj.y + obj.h - (hb.y + hb.h)) / obj.h
                    ));
                    const stairHeight = progress * obj.height;
                    if (stairHeight > highest) highest = stairHeight;
                } else {
                    if (obj.height > highest) highest = obj.height;
                }
            }
        }
        return highest;
    }

    // Visual Y position (sprite draws higher when elevated or jumping)
    get drawY() {
        return this.y - this.z;
    }
}

function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
}
