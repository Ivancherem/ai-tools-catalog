const express = require('express');
const router = express.Router();
const GameStat = require('../models/GameStat');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Сохранение результата игры
router.post('/save-score', auth, async (req, res) => {
  try {
    const { score, level, timePlayed, achievements } = req.body;
    
    const gameStat = new GameStat({
      userId: req.user.id,
      score,
      level,
      timePlayed,
      achievements,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    await gameStat.save();
    
    // Обновление рейтинга пользователя
    const user = await User.findById(req.user.id);
    user.gameStats = user.gameStats || {};
    user.gameStats.highScore = Math.max(user.gameStats.highScore || 0, score);
    user.gameStats.totalPlayTime = (user.gameStats.totalPlayTime || 0) + timePlayed;
    user.gameStats.lastPlayed = Date.now();
    await user.save();
    
    // Отправка в реал-тайм
    req.app.get('io').emit('game-score-update', {
      userId: req.user.id,
      username: user.name,
      score,
      avatar: user.avatar
    });
    
    res.json({ 
      success: true, 
      message: 'Результат сохранен',
      highScore: user.gameStats.highScore 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение таблицы лидеров
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await User.aggregate([
      {
        $match: {
          'gameStats.highScore': { $exists: true, $gt: 0 }
        }
      },
      {
        $project: {
          name: 1,
          avatar: 1,
          tier: 1,
          highScore: '$gameStats.highScore',
          totalPlayTime: '$gameStats.totalPlayTime'
        }
      },
      {
        $sort: { highScore: -1 }
      },
      {
        $limit: 100
      }
    ]);
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение игровых достижений
router.get('/achievements/:userId', auth, async (req, res) => {
  try {
    const achievements = await GameStat.aggregate([
      { $match: { userId: req.user.id } },
      { $unwind: '$achievements' },
      { $group: { 
        _id: '$achievements.name',
        count: { $sum: 1 },
        lastEarned: { $max: '$createdAt' }
      }},
      { $sort: { lastEarned: -1 } }
    ]);
    
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ежедневные награды
router.post('/daily-reward', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const today = new Date().toDateString();
    
    if (user.gameStats.lastDailyReward === today) {
      return res.status(400).json({ error: 'Награда уже получена сегодня' });
    }
    
    // Случайная награда
    const rewards = [50, 100, 150, 200, 300];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    
    user.balance += reward;
    user.gameStats.lastDailyReward = today;
    await user.save();
    
    res.json({
      success: true,
      reward,
      newBalance: user.balance,
      message: `Получена ежедневная награда: ${reward} ₽`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;