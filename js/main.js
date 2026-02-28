// ============================================================
// MAIN — App initialization, boot audio, apply layout
// ============================================================

// Инициализация приложения — запускается после загрузки всех модулей
resizeCanvas();
ctx.fillStyle = "#202028";
ctx.fillRect(0, 0, canvas.width, canvas.height);

document.getElementById('btn-lang').innerText = currentLang.toUpperCase();
updateAllTexts();
updatePlayerModeUI();
showMenu();

// Восстановить сохранённое расположение мобильных кнопок
applyLayout(loadLayout());

// Обновить кошелёк в UI (функция из networking.js — теперь точно загружена)
updateFishUI();

// Boot audio on first interaction
document.addEventListener('touchstart', () => AudioEngine.boot(), { once: true, passive: true });
document.addEventListener('mousedown', () => AudioEngine.boot(), { once: true });
