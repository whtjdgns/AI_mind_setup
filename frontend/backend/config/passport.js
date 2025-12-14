// backend/config/passport.js
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('../db');

module.exports = function(passport) {
  // Google OAuth 전략 설정 (기존 server.js [source: 72] 로직)
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const displayName = profile.displayName;
    let connection;

    try {
      connection = await pool.getConnection();
      // 1. 기존 사용자 확인
      const [rows] = await connection.query('SELECT * FROM `Users` WHERE `google_id` = ?', [googleId]);

      if (rows.length > 0) {
        const user = rows[0];
        console.log('기존 사용자 로그인 (DB):', user);
        return done(null, user);
      } else {
        // 2. 신규 사용자 가입
        const [insertResult] = await connection.query('INSERT INTO `Users` (`google_id`, `email`, `display_name`) VALUES (?, ?, ?)', [googleId, email, displayName]);
        const newUserId = insertResult.insertId;

        // 2-1. 신규 사용자를 위한 기본 설정값 생성
        await connection.query('INSERT INTO `PromptSettings` (`user_id`) VALUES (?)', [newUserId]);

        const newUser = { user_id: newUserId, google_id: googleId, email: email, display_name: displayName };
        console.log('신규 사용자 가입 (DB):', newUser);
        return done(null, newUser);
      }
    } catch (err) {
      console.error('Google Strategy DB Error:', err);
      return done(err, null);
    } finally {
      if (connection) connection.release();
    }
  }));

  // 세션 직렬화 (기존 server.js [source: 104] 로직)
  passport.serializeUser((user, done) => {
    done(null, user.user_id);
  });

  // 세션 역직렬화 (기존 server.js [source: 108] 로직)
  passport.deserializeUser(async (userId, done) => {
    let connection;
    try {
      connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT * FROM `Users` WHERE `user_id` = ?', [userId]);

      if (rows.length > 0) {
        done(null, rows[0]); // req.user에 저장됨
      } else {
        done(new Error('User not found'), null);
      }
    } catch (err) {
      done(err, null);
    } finally {
      if (connection) connection.release();
    }
  });
};