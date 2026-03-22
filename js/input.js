const keysPressed = new Set();

window.addEventListener('keydown', (e) => {
    keysPressed.add(e.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keysPressed.delete(e.code);
});

export function isKeyDown(code) {
    return keysPressed.has(code);
}
