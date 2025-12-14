// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const path = require('path'); // [추가] 경로 모듈

// --- 1. DB 모듈 ---
const { pool } = require('./db');

// --- 2. 라우트 파일 ---
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const settingsRoutes = require('./routes/settings');

// --- 3. Passport 설정 ---
require('./config/passport')(passport);

const app = express();
// AWS EB는 기본적으로 8080 포트를 선호하지만, 환경 변수 PORT를 따릅니다.
const PORT = process.env.PORT || 8080;

// --- 4. 미들웨어 ---
app.use(cors({
  // 이제 같은 도메인에서 서빙되므로 origin 설정이 유연해집니다.
  origin: true, 
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 5. 세션 ---
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// --- 6. Passport ---
app.use(passport.initialize());
app.use(passport.session());

// --- 7. API 라우트 ---
app.use('/api', authRoutes);
app.use('/api', chatRoutes);
app.use('/api', settingsRoutes);

// --- [중요] 8. React 정적 파일 서빙 (배포용 설정) ---
// 'build' 폴더가 존재하는 경우 (배포 환경)
if (process.env.NODE_ENV === 'production' || require('fs').existsSync(path.join(__dirname, 'build'))) {
  // build 폴더의 정적 파일들을 제공
  app.use(express.static(path.join(__dirname, 'build')));

  // 그 외의 모든 요청(*)은 React의 index.html로 보냄 (클라이언트 사이드 라우팅 지원)
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// --- 9. 서버 시작 ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});