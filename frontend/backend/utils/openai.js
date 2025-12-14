const OpenAI = require('openai');
require('dotenv').config(); // .env 파일 로드

// OpenAI 클라이언트를 초기화합니다.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 초기화된 인스턴스를 내보냅니다.
module.exports = openai;