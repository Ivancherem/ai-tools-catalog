// Простая обработка формы
document.getElementById('email-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = this.querySelector('input[type="email"]').value;
    
    if(email) {
        alert('Спасибо за подписку! На ' + email + ' отправили письмо с подборкой.');
        this.reset();
    }
});

// Консоль-сообщение

console.log('Каталог AI-инструментов загружен! 🚀');
// Отслеживание кликов по партнёрским ссылкам
function trackClick(service) {
    // Сохраняем в localStorage
    let clicks = JSON.parse(localStorage.getItem('affiliate_clicks') || '[]');
    clicks.push({
        service: service,
        timestamp: new Date().toISOString(),
        page: window.location.href
    });
    localStorage.setItem('affiliate_clicks', JSON.stringify(clicks));
    
    // Можно отправлять на сервер
    console.log(`Клик по ${service} зафиксирован`);
    
    // Обновляем статистику на странице
    updateStats();
}

function updateStats() {
    const clicks = JSON.parse(localStorage.getItem('affiliate_clicks') || '[]');
    document.getElementById('totalClicks').textContent = clicks.length;
}
