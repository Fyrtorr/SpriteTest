import { isKeyDown, wasKeyPressed } from './input.js';

const WALK_SPEED = 200;
const RUN_SPEED = 350;
const SQRT2 = Math.SQRT2;
const JUMP_DURATION = 600; // ms for full jump animation
const SLASH_DURATION = 600; // ms for slash animation

export class Player {
    constructor(x, y, canvasWidth, canvasHeight) {
        this.x = x;
        this.y = y;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.direction = 'down';
        this.state = 'idle'; // idle, walk, run, jump, slash
        this.actionTimer = 0;
    }

    update(deltaTime) {
        // Handle action animations (jump/slash) — lock movement until complete
        if (this.state === 'jump' || this.state === 'slash') {
            this.actionTimer -= deltaTime;
            if (this.actionTimer <= 0) {
                this.state = 'idle';
            }
            return;
        }

        // Check for action triggers
        if (wasKeyPressed('Space')) {
            this.state = 'jump';
            this.actionTimer = JUMP_DURATION;
            return;
        }

        if (wasKeyPressed('KeyE') || wasKeyPressed('Enter')) {
            this.state = 'slash';
            this.actionTimer = SLASH_DURATION;
            return;
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
            const dt = deltaTime / 1000;

            this.x += (dx / magnitude) * speed * dt;
            this.y += (dy / magnitude) * speed * dt;

            this.x = Math.max(0, Math.min(this.canvasWidth - 64, this.x));
            this.y = Math.max(0, Math.min(this.canvasHeight - 64, this.y));

            this.state = isRunning ? 'run' : 'walk';
        } else {
            this.state = 'idle';
        }
    }
}
