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
AccountSystem.init();

// Boot audio on first interaction — also start menu music
document.addEventListener('touchstart', () => { AudioEngine.boot(); AudioEngine.startMenuMusic(); }, { once: true, passive: true });
document.addEventListener('mousedown', () => { AudioEngine.boot(); AudioEngine.startMenuMusic(); }, { once: true });
// Показать обучение при первом запуске
if (TutorialSystem.shouldShow()) TutorialSystem.show();
