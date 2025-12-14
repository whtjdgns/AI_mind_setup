
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api', // '/api'로 시작하는 모든 요청을
    createProxyMiddleware({
      target: 'http://localhost:5000', // 백엔드 서버(localhost:5000)로 전달
      changeOrigin: true,
    })
  );
};