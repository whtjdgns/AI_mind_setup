// backend/routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// Google 로그인 요청 (기존 server.js [source: 140] 로직)
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google 로그인 콜백 처리 (기존 server.js [source: 142] 로직)
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=1` }),
  (req, res) => {
    // 성공 시 클라이언트 URL로 리디렉션
    res.redirect(process.env.CLIENT_URL);
  }
);

// 현재 로그인 상태 확인 (기존 server.js [source: 125] 로직)
router.get('/auth/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

// 로그아웃 (기존 server.js [source: 129] 로직)
router.post('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.session.destroy(() => {
      res.clearCookie('connect.sid'); // 세션 쿠키 삭제
      res.json({ message: '로그아웃 성공' });
    });
  });
});

module.exports = router;