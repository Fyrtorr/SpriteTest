import { isKeyDown } from './input.js';

const SPEED = 200; // pixels per second
const SQRT2 = Math.SQRT2;

export class Player {
    constructor(x, y, canvasWidth, canvasHeight) {
        this.x = x;
        this.y = y;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.direction = 'down';
        this.isMoving = false;
    }

    update(deltaTime) {
        let dx = 0;
        let dy = 0;

        if (isKeyDown('KeyW') || isKeyDown('ArrowUp')) dy -= 1;
        if (isKeyDown('KeyS') || isKeyDown('ArrowDown')) dy += 1;
        if (isKeyDown('KeyA') || isKeyDown('ArrowLeft')) dx -= 1;
        if (isKeyDown('KeyD') || isKeyDown('ArrowRight')) dx += 1;

        this.isMoving = dx !== 0 || dy !== 0;

        if (this.isMoving) {
            // Set direction based on input
            if (dy < 0) this.direction = 'up';
            else if (dy > 0) this.direction = 'down';
            if (dx < 0) this.direction = 'left';
            else if (dx > 0) this.direction = 'right';

            // Normalize diagonal movement
            const magnitude = (dx !== 0 && dy !== 0) ? SQRT2 : 1;
            const dt = deltaTime / 1000;

            this.x += (dx / magnitude) * SPEED * dt;
            this.y += (dy / magnitude) * SPEED * dt;

            // Clamp to canvas bounds
            this.x = Math.max(0, Math.min(this.canvasWidth - 64, this.x));
            this.y = Math.max(0, Math.min(this.canvasHeight - 64, this.y));
        }
    }
}
