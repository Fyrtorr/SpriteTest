const FRAME_WIDTH = 64;
const FRAME_HEIGHT = 64;
const WALK_FRAMES = 9;
const FRAME_DURATION = 100; // ms per frame

// LPC spritesheet walk animation rows
const DIRECTION_ROW = {
    up: 8,
    left: 9,
    down: 10,
    right: 11
};

export class Sprite {
    constructor(imageSrc) {
        this.image = new Image();
        this.loaded = false;
        this.currentFrame = 0;
        this.elapsed = 0;

        this.image.onload = () => {
            this.loaded = true;
        };
        this.image.src = imageSrc;
    }

    update(deltaTime, isMoving) {
        if (!isMoving) {
            this.currentFrame = 0;
            this.elapsed = 0;
            return;
        }

        this.elapsed += deltaTime;
        if (this.elapsed >= FRAME_DURATION) {
            this.elapsed -= FRAME_DURATION;
            this.currentFrame = (this.currentFrame + 1) % WALK_FRAMES;
        }
    }

    draw(ctx, x, y, direction) {
        if (!this.loaded) return;

        const row = DIRECTION_ROW[direction] ?? DIRECTION_ROW.down;
        const srcX = this.currentFrame * FRAME_WIDTH;
        const srcY = row * FRAME_HEIGHT;

        ctx.drawImage(
            this.image,
            srcX, srcY, FRAME_WIDTH, FRAME_HEIGHT,
            x, y, FRAME_WIDTH, FRAME_HEIGHT
        );
    }
}
