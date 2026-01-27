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