// backend/middleware/auth.js

// 로그인 확인 미들웨어 (기존 server.js [source: 64] 로직)
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // 로그인 상태면 다음 단계로
  }
  // 로그인 상태가 아니면 401 Unauthorized 응답
  res.status(401).json({ message: '인증이 필요합니다.' });
};

module.exports = { isAuthenticated };