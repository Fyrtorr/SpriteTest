const keysDown = new Set();
const keysJustPressed = new Set();

window.addEventListener('keydown', (e) => {
    if (!keysDown.has(e.code)) {
        keysJustPressed.add(e.code);
    }
    keysDown.add(e.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keysDown.delete(e.code);
});

export function isKeyDown(code) {
    return keysDown.has(code);
}

export function wasKeyPressed(code) {
    return keysJustPressed.has(code);
}

export function clearPressedKeys() {
    keysJustPressed.clear();
}
