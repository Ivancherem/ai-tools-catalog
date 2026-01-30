const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const PartnerLink = require('../models/PartnerLink');
const Transaction = require('../models/Transaction');

// Получение общей статистики
router.get('/overview', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;
    
    // Рассчитываем дату начала периода
    const startDate = calculateStartDate(period);
    
    const stats = await PartnerLink.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: '$stats.totalClicks' },
          uniqueClicks: { $sum: '$stats.uniqueClicks' },
          conversions: { $sum: '$stats.conversions' },
          revenue: { $sum: '$stats.revenue' },
          linkCount: { $sum: 1 }
        }
      }
    ]);
    
    // Статистика по дням
    const dailyStats = await PartnerLink.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      { $unwind: '$clicks' },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$clicks.timestamp' }
          },
          clicks: { $sum: 1 },
          conversions: {
            $sum: { $cond: ['$clicks.converted', 1, 0] }
          },
          revenue: {
            $sum: { $cond: ['$clicks.converted', '$clicks.conversionValue', 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Топ сервисов
    const topServices = await PartnerLink.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$service',
          clicks: { $sum: '$stats.totalClicks' },
          conversions: { $sum: '$stats.conversions' },
          revenue: { $sum: '$stats.revenue' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);
    
    // География кликов
    const geoStats = await PartnerLink.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          'clinks.country': { $exists: true }
        }
      },
      { $unwind: '$clicks' },
      {
        $match: {
          'clicks.country': { $ne: null }
        }
      },
      {
        $group: {
          _id: '$clicks.country',
          clicks: { $sum: 1 },
          conversions: {
            $sum: { $cond: ['$clicks.converted', 1, 0] }
          }
        }
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      overview: stats[0] || {},
      dailyStats,
      topServices,
      geoStats,
      period
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Прогноз доходов
router.get('/forecast', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Получаем исторические данные за последние 90 дней
    const historicalData = await PartnerLink.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        }
      },
      { $unwind: '$clicks' },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$clicks.timestamp' }
          },
          revenue: {
            $sum: { $cond: ['$clicks.converted', '$clicks.conversionValue', 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Простой алгоритм прогнозирования (в реальном проекте использовался бы ML)
    const forecast = generateForecast(historicalData);
    
    res.json({
      historical: historicalData,
      forecast,
      confidence: 0.85 // Уверенность прогноза
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// A/B тестирование
router.post('/ab-test', auth, async (req, res) => {
  try {
    const { linkId, variations, testDuration, targetMetric } = req.body;
    
    // Создаем A/B тест
    const abTest = new ABTest({
      linkId,
      variations,
      testDuration,
      targetMetric,
      createdBy: req.user.id,
      status: 'active'
    });
    
    await abTest.save();
    
    // Генерируем уникальные ссылки для каждого варианта
    const variantLinks = variations.map((variant, index) => ({
      ...variant,
      shortCode: generateShortCode(),
      abTestId: abTest._id,
      variantIndex: index
    }));
    
    res.json({
      success: true,
      abTestId: abTest._id,
      variantLinks,
      message: 'A/B тест запущен'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Рекомендации на основе AI
router.get('/recommendations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Анализируем производительность пользователя
    const performance = await analyzeUserPerformance(userId);
    
    // Генерируем персонализированные рекомендации
    const recommendations = generateRecommendations(performance);
    
    res.json({
      recommendations,
      priority: recommendations.map(r => r.priority)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Вспомогательные функции
function calculateStartDate(period) {
  const now = new Date();
  switch(period) {
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '30d':
      return new Date(now.setDate(now.getDate() - 30));
    case '90d':
      return new Date(now.setDate(now.getDate() - 90));
    case '1y':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setDate(now.getDate() - 30));
  }
}

function generateForecast(historicalData) {
  // Простое прогнозирование на основе скользящего среднего
  const revenues = historicalData.map(d => d.revenue || 0);
  const window = 7;
  
  if (revenues.length < window) {
    return [];
  }
  
  const forecast = [];
  for (let i = 0; i < 30; i++) {
    const start = Math.max(0, revenues.length - window);
    const avg = revenues.slice(start).reduce((a, b) => a + b, 0) / window;
    const trend = avg * (1 + (Math.random() * 0.1 - 0.05)); // Небольшой случайный тренд
    forecast.push({
      date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      predictedRevenue: Math.max(0, trend)
    });
  }
  
  return forecast;
}

async function analyzeUserPerformance(userId) {
  // Анализ производительности пользователя
  const stats = await PartnerLink.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: null,
        avgConversionRate: { $avg: '$stats.conversionRate' },
        avgRevenuePerClick: {
          $avg: {
            $cond: [
              { $eq: ['$stats.totalClicks', 0] },
              0,
              { $divide: ['$stats.revenue', '$stats.totalClicks'] }
            ]
          }
        },
        totalRevenue: { $sum: '$stats.revenue' },
        linkCount: { $sum: 1 }
      }
    }
  ]);
  
  return stats[0] || {};
}

function generateRecommendations(performance) {
  const recommendations = [];
  
  if (performance.avgConversionRate < 2) {
    recommendations.push({
      type: 'conversion',
      title: 'Улучшите конверсию',
      description: 'Ваша конверсия ниже среднего. Попробуйте улучшить призывы к действию.',
      priority: 'high',
      actions: [
        'Добавьте видео-обзоры',
        'Используйте социальные доказательства',
        'Улучшите дизайн целевых страниц'
      ]
    });
  }
  
  if (performance.linkCount < 3) {
    recommendations.push({
      type: 'diversification',
      title: 'Диверсифицируйте источники',
      description: 'Вы используете слишком мало сервисов. Добавьте новые для снижения рисков.',
      priority: 'medium',
      actions: [
        'Добавьте DeepSeek API',
        'Попробуйте Midjourney',
        'Исследуйте новые AI инструменты'
      ]
    });
  }
  
  if (performance.totalRevenue > 10000 && !performance.advancedFeatures) {
    recommendations.push({
      type: 'growth',
      title: 'Масштабируйте активность',
      description: 'Вы достигли хорошего уровня дохода. Пора масштабироваться.',
      priority: 'medium',
      actions: [
        'Создайте Telegram канал',
        'Запустите email рассылки',
        'Используйте ретаргетинг'
      ]
    });
  }
  
  return recommendations;
}

module.exports = router;