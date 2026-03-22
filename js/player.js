import { isKeyDown, wasKeyPressed } from './input.js';

const WALK_SPEED = 200;
const RUN_SPEED = 350;
const SQRT2 = Math.SQRT2;
const SLASH_DURATION = 600;

// Jump physics (z-axis: positive = up on screen)
const JUMP_VELOCITY = 400;
const GRAVITY = 1200;

export class Player {
    constructor(x, y, canvasWidth, canvasHeight) {
        this.x = x;
        this.y = y;         // ground position (foot level)
        this.z = 0;         // height above ground (positive = up)
        this.vz = 0;        // vertical velocity (positive = upward)
        this.groundLevel = 0; // elevation of surface we're standing on
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.direction = 'down';
        this.state = 'idle';
        this.actionTimer = 0;
        this.isGrounded = true;

        // Collision box (feet area relative to sprite x,y)
        this.hitWidth = 32;
        this.hitHeight = 16;
        this.hitOffsetX = 16;
        this.hitOffsetY = 48;
    }

    getHitbox() {
        return {
            x: this.x + this.hitOffsetX,
            y: this.y + this.hitOffsetY,
            w: this.hitWidth,
            h: this.hitHeight,
        };
    }

    getHit(duration) {
        this.state = 'hurt';
        this.actionTimer = duration;
    }

    getKickZone() {
        if (this.state !== 'slash') return null;
        const cx = this.x + 32;
        const cy = this.y + 32;
        const range = 40;
        switch (this.direction) {
            case 'right': return { x: cx, y: cy - 16, w: range, h: 32 };
            case 'left':  return { x: cx - range, y: cy - 16, w: range, h: 32 };
            case 'down':  return { x: cx - 16, y: cy, w: 32, h: range };
            case 'up':    return { x: cx - 16, y: cy - range, w: 32, h: range };
        }
    }

    update(deltaTime, objects) {
        const dt = deltaTime / 1000;

        // Handle hurt stun
        if (this.state === 'hurt') {
            this.actionTimer -= deltaTime;
            if (this.actionTimer <= 0) {
                this.state = 'idle';
            }
            if (!this.isGrounded) this._applyGravity(dt, objects);
            return;
        }

        // Handle slash lock
        if (this.state === 'slash') {
            this.actionTimer -= deltaTime;
            if (this.actionTimer <= 0) {
                this.state = 'idle';
            }
            if (!this.isGrounded) this._applyGravity(dt, objects);
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

        // Movement
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

            const oldX = this.x;
            const oldY = this.y;

            // Try X movement
            this.x += (dx / magnitude) * speed * dt;
            if (this._collidesWithWall(objects)) this.x = oldX;

            // Try Y movement
            this.y += (dy / magnitude) * speed * dt;
            if (this._collidesWithWall(objects)) this.y = oldY;

            // Clamp to canvas
            this.x = Math.max(0, Math.min(this.canvasWidth - 64, this.x));
            this.y = Math.max(0, Math.min(this.canvasHeight - 64, this.y));

            if (this.isGrounded) {
                this.state = isRunning ? 'run' : 'walk';
            }
        } else if (this.isGrounded) {
            this.state = 'idle';
        }

        // Update ground level when grounded
        if (this.isGrounded) {
            this.groundLevel = this._getGroundLevel(objects);
            this.z = this.groundLevel;
        }
    }

    _applyGravity(dt, objects) {
        this.vz -= GRAVITY * dt;  // gravity pulls velocity downward
        this.z += this.vz * dt;   // update height

        const ground = this._getGroundLevel(objects);

        // Landed when falling and z drops to ground level
        if (this.z <= ground && this.vz < 0) {
            this.z = ground;
            this.vz = 0;
            this.isGrounded = true;
            this.groundLevel = ground;
            if (this.state === 'jump') this.state = 'idle';
        }
    }

    _collidesWithWall(objects) {
        const hb = this.getHitbox();
        for (const obj of objects) {
            if (!obj.solid) continue;
            // Only block if player is below the top of the object
            if (this.z < obj.height) {
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
            if (!rectsOverlap(hb, obj)) continue;

            // Only land on objects if we're at or above their height
            if (this.z >= obj.height - 4) {
                if (obj.height > highest) highest = obj.height;
            }
        }
        return highest;
    }

    // Visual Y position (sprite draws higher when elevated)
    get drawY() {
        return this.y - this.z;
    }
}

function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
}
