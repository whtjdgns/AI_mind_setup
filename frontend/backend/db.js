
const mysql = require('mysql2/promise'); // 'mysql2/promise'를 사용 (async/await 지원)
require('dotenv').config(); // .env 파일의 환경 변수를 불러옴

// .env 파일에서 DB 정보를 읽어와 커넥션 풀(Pool)을 생성합니다.
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    
    // Pool 옵션
    waitForConnections: true, // 사용 가능한 커넥션이 없을 때 대기
    connectionLimit: 10,      // 최대 10개의 커넥션 유지
    queueLimit: 0             // 대기열 제한 없음
});

// 테스트 쿼리 함수 (서버 시작 시 DB 연결 확인용)
async function testConnection() {
    try {
        const connection = await pool.getConnection(); // 풀에서 커넥션 1개 가져오기
        console.log('🎉 로컬 MySQL 데이터베이스에 성공적으로 연결되었습니다.');
        console.log(`(연결된 데이터베이스: ${process.env.DB_NAME})`);
        connection.release(); // 커넥션 반환
    } catch (err) {
        console.error('❌ MySQL 데이터베이스 연결 실패:', err.message);
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('>> .env 파일의 DB_USER 또는 DB_PASSWORD가 올바르지 않습니다.');
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            console.error(`>> '${process.env.DB_NAME}' 데이터베이스가 존재하지 않습니다.`);
            console.error(`>> 4단계(schema.sql)의 테이블 생성을 완료했는지 확인하세요.`);
        } else {
            console.error('>> DB 호스트(DB_HOST) 주소나 포트(DB_PORT)가 올바른지 확인하세요.');
        }
    }
}

// 다른 파일(server.js)에서 이 'pool'을 가져다 쓸 수 있도록 내보냅니다.
module.exports = {
    pool,
    testConnection
};