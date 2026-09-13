// ============ КОНФИГУРАЦИЯ ============
const AFFILIATE_CONFIG = {
    // Ваши реальные партнёрские ссылки (замените на свои!)
    links: {
        jasper: "https://www.jasper.ai/become-a-partner",
        copyai: "https://www.copy.ai?via=IvanCheremnykh", // замените на свою ссылку
        writesonic: "https://writesonic.com?via=cherem7", // замените
        surfer: "https://surferseo.com?ref=cherem7", // замените
        yandexMarket: "https://partner.yandex.ru?ref=ВАШ_ID", // ваш ID Яндекс
        yandexSearch: "https://ya.ru/search/?clid=ВАШ_ID" // ваш ID
    },
    
    // Промокоды
    promocodes: {
        yandexMarket: "MARKET_ВАШ_ID",
        copyai: "CHEREM10" // если есть
    },
    
    // Контакты
    contacts: {
        telegram: "https://t.me/ai_toolkit_partner09",
        vk: "https://vk.com/ai_promokody",
        email: "cherem.7@yandex.ru"
    }
};

// ============ ОБРАБОТКА ФОРМЫ ============
document.addEventListener('DOMContentLoaded', function() {
    const emailForm = document.getElementById('email-form');
    
    if(emailForm) {
        emailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            const name = this.querySelector('input[name="name"]')?.value || '';
            
            if(email) {
                // Сохраняем лида локально
                saveLead({email, name, source: 'website_form'});
                
                // Показываем успех
                showSuccessMessage(email, name);
                
                // Отправляем данные (если есть сервер)
                // sendToTelegram(email, name);
                
                this.reset();
            }
        });
    }
    
    // Инициализация статистики
    initStats();
    
    // Автоматически обновляем ссылки
    updateAffiliateLinks();
});

// ============ СОХРАНЕНИЕ ЛИДОВ ============
function saveLead(data) {
    try {
        let leads = JSON.parse(localStorage.getItem('ai_affiliate_leads') || '[]');
        
        // Добавляем дату
        data.date = new Date().toISOString();
        data.id = Date.now();
        
        leads.push(data);
        localStorage.setItem('ai_affiliate_leads', JSON.stringify(leads));
        
        console.log('✅ Лид сохранён:', data.email);
        
        // Обновляем счетчик
        updateLeadsCounter();
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка сохранения лида:', error);
        return false;
    }
}

// ============ ТРЕКИНГ КЛИКОВ ============
function trackAffiliateClick(serviceName, linkType = 'partner') {
    try {
        const clickData = {
            service: serviceName,
            type: linkType,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        // Сохраняем клик
        let clicks = JSON.parse(localStorage.getItem('affiliate_clicks') || '[]');
        clicks.push(clickData);
        localStorage.setItem('affiliate_clicks', JSON.stringify(clicks));
        
        // Обновляем статистику
        updateStats();
        
        // Отправляем в Telegram (опционально)
        // sendClickToTelegram(clickData);
        
        console.log(`🖱️ Клик по ${serviceName} зафиксирован`);
        
        return clickData;
    } catch (error) {
        console.error('❌ Ошибка трекинга:', error);
    }
}

// ============ ОБНОВЛЕНИЕ СТАТИСТИКИ ============
function updateStats() {
    try {
        const clicks = JSON.parse(localStorage.getItem('affiliate_clicks') || '[]');
        const leads = JSON.parse(localStorage.getItem('ai_affiliate_leads') || '[]');
        
        // Обновляем счетчики на странице
        const totalClicksElement = document.getElementById('totalClicks');
        const totalLeadsElement = document.getElementById('totalLeads');
        const todayClicksElement = document.getElementById('todayClicks');
        
        if(totalClicksElement) {
            totalClicksElement.textContent = clicks.length;
        }
        
        if(totalLeadsElement) {
            totalLeadsElement.textContent = leads.length;
        }
        
        if(todayClicksElement) {
            const today = new Date().toDateString();
            const todayClicks = clicks.filter(click => 
                new Date(click.timestamp).toDateString() === today
            ).length;
            todayClicksElement.textContent = todayClicks;
        }
        
    } catch (error) {
        console.error('❌ Ошибка обновления статистики:', error);
    }
}

function updateLeadsCounter() {
    const leads = JSON.parse(localStorage.getItem('ai_affiliate_leads') || '[]');
    const counter = document.getElementById('totalLeads');
    if(counter) {
        counter.textContent = leads.length;
    }
}

// ============ ПОКАЗ УСПЕШНОГО СООБЩЕНИЯ ============
function showSuccessMessage(email, name = '') {
    // Создаем или находим модальное окно
    let modal = document.getElementById('successModal');
    
    if(!modal) {
        modal = document.createElement('div');
        modal.id = 'successModal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1e293b, #0f172a);
            padding: 40px;
            border-radius: 20px;
            border: 2px solid #7c3aed;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            z-index: 10000;
            max-width: 500px;
            width: 90%;
            text-align: center;
            animation: fadeIn 0.3s ease;
        `;
        
        document.body.appendChild(modal);
        
        // Стиль для анимации
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -60%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }
        `;
        document.head.appendChild(style);
    }
    
    const firstName = name.split(' ')[0] || 'Друг';
    
    modal.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #7c3aed, #10b981); 
                 border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                 margin: 0 auto 20px; font-size: 2.5rem; color: white;">
                <i class="fas fa-check"></i>
            </div>
            <h3 style="color: white; margin-bottom: 10px;">Спасибо, ${firstName}!</h3>
            <p style="color: #94a3b8; margin-bottom: 25px;">
                На ${email} отправлено письмо с партнёрскими материалами.
            </p>
        </div>
        
        <div style="background: rgba(124, 58, 237, 0.1); padding: 20px; border-radius: 15px; 
             margin-bottom: 20px; border: 1px solid rgba(124, 58, 237, 0.3);">
            <p style="color: white; margin-bottom: 15px; font-weight: bold;">
                <i class="fas fa-gift"></i> Ваши быстрые ссылки:
            </p>
            <button onclick="openPartnerLink('copyai')" 
                    style="width: 100%; padding: 12px; background: rgba(16, 185, 129, 0.1); 
                           border: 1px solid #10b981; color: #10b981; border-radius: 10px; 
                           margin-bottom: 10px; cursor: pointer; font-weight: bold;">
                <i class="fas fa-external-link-alt"></i> Copy.ai (30% комиссия)
            </button>
            <button onclick="openPartnerLink('writesonic')" 
                    style="width: 100%; padding: 12px; background: rgba(245, 158, 11, 0.1); 
                           border: 1px solid #f59e0b; color: #f59e0b; border-radius: 10px; 
                           margin-bottom: 10px; cursor: pointer; font-weight: bold;">
                <i class="fas fa-external-link-alt"></i> Writesonic (30% комиссия)
            </button>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button onclick="window.open('${AFFILIATE_CONFIG.contacts.telegram}', '_blank')" 
                    style="padding: 10px 20px; background: #0088cc; color: white; 
                           border: none; border-radius: 10px; cursor: pointer;">
                <i class="fab fa-telegram"></i> Telegram
            </button>
            <button onclick="closeSuccessModal()" 
                    style="padding: 10px 20px; background: #64748b; color: white; 
                           border: none; border-radius: 10px; cursor: pointer;">
                Закрыть
            </button>
        </div>
    `;
    
    // Добавляем затемнение фона
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
    `;
    overlay.id = 'modalOverlay';
    overlay.onclick = closeSuccessModal;
    document.body.appendChild(overlay);
    
    // Автоматически закрываем через 30 секунд
    setTimeout(closeSuccessModal, 30000);
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    const overlay = document.getElementById('modalOverlay');
    
    if(modal) modal.remove();
    if(overlay) overlay.remove();
}

// ============ ОТКРЫТИЕ ПАРТНЁРСКИХ ССЫЛОК ============
function openPartnerLink(service) {
    const link = AFFILIATE_CONFIG.links[service];
    
    if(link) {
        // Трекинг клика
        trackAffiliateClick(service, 'partner_link');
        
        // Открываем в новой вкладке
        window.open(link, '_blank', 'noopener,noreferrer');
        
        // Показываем уведомление
        showClickNotification(service);
    } else {
        console.error(`❌ Ссылка для ${service} не найдена`);
        alert('Ссылка временно недоступна. Пожалуйста, попробуйте позже.');
    }
}

function showClickNotification(service) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #7c3aed, #10b981);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: bold;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-external-link-alt"></i> 
        Переход на ${service} зафиксирован!
    `;
    
    document.body.appendChild(notification);
    
    // Автоматическое удаление через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    // Добавляем стили для анимаций
    if(!document.getElementById('notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ============ ОБНОВЛЕНИЕ ССЫЛОК НА СТРАНИЦЕ ============
function updateAffiliateLinks() {
    // Находим все партнёрские кнопки и обновляем их ссылки
    document.querySelectorAll('[data-affiliate-service]').forEach(button => {
        const service = button.getAttribute('data-affiliate-service');
        const link = AFFILIATE_CONFIG.links[service];
        
        if(link && button.tagName === 'A') {
            button.href = link;
            button.onclick = function(e) {
                trackAffiliateClick(service);
                // Открываем в новой вкладке
                window.open(link, '_blank', 'noopener,noreferrer');
                e.preventDefault();
            };
        }
    });
    
    // Обновляем контакты в футере
    updateContactLinks();
}

function updateContactLinks() {
    // Telegram
    document.querySelectorAll('a[href*="t.me/"]').forEach(link => {
        link.href = AFFILIATE_CONFIG.contacts.telegram;
    });
    
    // VK
    document.querySelectorAll('a[href*="vk.com/"]').forEach(link => {
        link.href = AFFILIATE_CONFIG.contacts.vk;
    });
    
    // Email
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        link.href = `mailto:${AFFILIATE_CONFIG.contacts.email}`;
    });
}

// ============ ИНИЦИАЛИЗАЦИЯ СТАТИСТИКИ ============
function initStats() {
    // Создаем панель статистики если её нет
    if(!document.getElementById('statsPanel')) {
        const statsPanel = document.createElement('div');
        statsPanel.id = 'statsPanel';
        statsPanel.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: rgba(30, 41, 59, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(124, 58, 237, 0.3);
            border-radius: 15px;
            padding: 15px;
            color: white;
            font-size: 0.9rem;
            z-index: 9998;
            min-width: 200px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        statsPanel.innerHTML = `
            <div style="margin-bottom: 10px; color: #7c3aed; font-weight: bold;">
                <i class="fas fa-chart-line"></i> Статистика
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Клики:</span>
                <span id="totalClicks" style="color: #10b981; font-weight: bold;">0</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Лиды:</span>
                <span id="totalLeads" style="color: #f59e0b; font-weight: bold;">0</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Сегодня:</span>
                <span id="todayClicks" style="color: #3b82f6; font-weight: bold;">0</span>
            </div>
            <button onclick="exportStats()" style="width: 100%; padding: 8px; background: rgba(124, 58, 237, 0.2); 
                    border: 1px solid #7c3aed; color: #7c3aed; border-radius: 8px; margin-top: 10px; cursor: pointer;">
                <i class="fas fa-download"></i> Экспорт
            </button>
        `;
        
        document.body.appendChild(statsPanel);
    }
    
    // Первоначальное обновление статистики
    updateStats();
}

// ============ ЭКСПОРТ СТАТИСТИКИ ============
function exportStats() {
    try {
        const clicks = JSON.parse(localStorage.getItem('affiliate_clicks') || '[]');
        const leads = JSON.parse(localStorage.getItem('ai_affiliate_leads') || '[]');
        
        const data = {
            clicks: clicks,
            leads: leads,
            exportDate: new Date().toISOString(),
            totalClicks: clicks.length,
            totalLeads: leads.length
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `affiliate-stats-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        alert('✅ Статистика экспортирована!');
        
    } catch (error) {
        console.error('❌ Ошибка экспорта:', error);
        alert('❌ Ошибка при экспорте статистики');
    }
}

// ============ ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ============
console.log('🚀 AI Affiliate Platform Ивана Черемных загружен!');
console.log('📊 Конфигурация:', AFFILIATE_CONFIG);

// Добавляем глобальные функции
window.openPartnerLink = openPartnerLink;
window.trackAffiliateClick = trackAffiliateClick;
window.exportStats = exportStats;
window.closeSuccessModal = closeSuccessModal;
const AFFILIATE_CONFIG = {
    links: {
        copyai: "https://www.copy.ai?via=IvanCheremnykh", // ← Ваша ссылка после регистрации
        writesonic: "https://writesonic.com?via=cherem7", // ← Ваша ссылка
        surfer: "https://surferseo.com?ref=cherem7", // ← Ваша ссылка
        yandexMarket: "https://partner.yandex.ru?ref=ВАШ_ID", // ← Ваш ID Яндекс
        yandexSearch: "https://ya.ru/search/?clid=ВАШ_ID" // ← Ваш ID
    },
    contacts: {
        telegram: "https://t.me/ai_toolkit_partner09", // ← Проверьте работает ли
        vk: "https://vk.com/ai_cherem7", // ← Проверьте работает ли
        email: "cherem.7@yandex.ru" // ← Ваша почта
    }
};
