const FRAME_WIDTH = 64;
const FRAME_HEIGHT = 64;
const FRAME_DURATION = 100; // ms per frame

// LPC spritesheet animation definitions: { startRow, frames (cycle indices) }
const ANIMATIONS = {
    idle:   { startRow: 22, cycle: [0, 0, 1] },
    walk:   { startRow: 8,  cycle: [1, 2, 3, 4, 5, 6, 7, 8] },
    run:    { startRow: 38, cycle: [0, 1, 2, 3, 4, 5, 6, 7] },
    jump:   { startRow: 26, cycle: [0, 1, 2, 3, 4, 1] },
    slash:  { startRow: 12, cycle: [0, 1, 2, 3, 4, 5] },
    hurt:   { startRow: 20, cycle: [0, 1, 2, 3, 4, 5], directional: false },
};

// Direction offsets from the animation's start row
const DIRECTION_OFFSET = { up: 0, left: 1, down: 2, right: 3 };

export class Sprite {
    constructor(imageSrc) {
        this.image = new Image();
        this.loaded = false;
        this.currentFrame = 0;
        this.elapsed = 0;
        this.currentAnimation = 'idle';
        this.previousAnimation = 'idle';

        this.image.onload = () => {
            this.loaded = true;
        };
        this.image.src = imageSrc;
    }

    setAnimation(name) {
        if (name !== this.currentAnimation) {
            this.previousAnimation = this.currentAnimation;
            this.currentAnimation = name;
            this.currentFrame = 0;
            this.elapsed = 0;
        }
    }

    update(deltaTime) {
        const anim = ANIMATIONS[this.currentAnimation];
        if (!anim) return;

        this.elapsed += deltaTime;
        if (this.elapsed >= FRAME_DURATION) {
            this.elapsed -= FRAME_DURATION;
            this.currentFrame = (this.currentFrame + 1) % anim.cycle.length;
        }
    }

    isAnimationComplete() {
        const anim = ANIMATIONS[this.currentAnimation];
        return this.currentFrame === anim.cycle.length - 1;
    }

    draw(ctx, x, y, direction) {
        if (!this.loaded) return;

        const anim = ANIMATIONS[this.currentAnimation];
        if (!anim) return;

        const dirOffset = anim.directional === false ? 0 : (DIRECTION_OFFSET[direction] ?? 2);
        const row = anim.startRow + dirOffset;
        const col = anim.cycle[this.currentFrame];

        ctx.drawImage(
            this.image,
            col * FRAME_WIDTH, row * FRAME_HEIGHT, FRAME_WIDTH, FRAME_HEIGHT,
            x, y, FRAME_WIDTH, FRAME_HEIGHT
        );
    }
}
