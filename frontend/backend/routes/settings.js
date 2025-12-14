// backend/routes/settings.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { isAuthenticated } = require('../middleware/auth');

// [GET] /api/settings - 현재 설정 불러오기 (기존 server.js [source: 161] 로직)
router.get('/settings', isAuthenticated, async (req, res) => {
  const userId = req.user.user_id;
  let connection;

  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM `PromptSettings` WHERE `user_id` = ?', [userId]);

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      //  혹시 모를 누락 방지 (passport.js에서 생성하지만)
      await connection.query('INSERT INTO `PromptSettings` (`user_id`) VALUES (?)', [userId]);
      const [newRows] = await connection.query('SELECT * FROM `PromptSettings` WHERE `user_id` = ?', [userId]);
      res.json(newRows[0]);
    }
  } catch (err) {
    console.error('GET /api/settings Error:', err);
    res.status(500).json({ message: '서버 에러' });
  } finally {
    if (connection) connection.release();
  }
});

// [POST] /api/settings - 설정 저장하기 (기존 server.js [source: 171] 로직)
router.post('/settings', isAuthenticated, async (req, res) => {
  const userId = req.user.user_id;
  const { aiName, userNickname, aiTone, avoidTopics } = req.body;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.query(
      'UPDATE `PromptSettings` SET `ai_name` = ?, `user_nickname` = ?, `ai_tone` = ?, `avoid_topics` = ? WHERE `user_id` = ?',
      [aiName, userNickname, aiTone, avoidTopics, userId]
    );
    res.json({ message: '설정이 성공적으로 저장되었습니다.' });
  } catch (err) {
    console.error('POST /api/settings Error:', err);
    res.status(500).json({ message: '서버 에러' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;