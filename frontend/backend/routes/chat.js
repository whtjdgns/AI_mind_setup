// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const openai = require('../utils/openai'); // DALL-E 3 사용
const { isAuthenticated } = require('../middleware/auth');

// --- 이미지 생성 헬퍼 함수 ---
// (DALL-E 3 호출)
const generateBackgroundImage = async (prompt) => {
  if (!prompt || prompt.trim() === "") {
    return null; // 프롬프트가 없으면 null 반환
  }
  
  console.log(`DALL-E 3 이미지 생성 시작: "${prompt}"`);
  try {
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      // 프롬프트를 더 구체화하여 품질 향상
      prompt: `A calm, peaceful, digital art background for a counseling session. Mood: serene. Theme: ${prompt}`,
      n: 1,
      size: "1024x1024", // 1:1 비율
      response_format: "b64_json", // base64로 받음
    });

    const b64Json = imageResponse.data[0].b64_json;
    console.log("DALL-E 3 이미지 생성 완료.");
    return `data:image/png;base64,${b64Json}`; // 데이터 URL 형식으로 반환
  } catch (err) {
    console.error("DALL-E 3 API 에러:", err.message);
    return null; // 실패 시 null
  }
};

// [POST] /api/sessions - 새 대화 시작 (배경 생성 추가)
router.post('/sessions', isAuthenticated, async (req, res) => {
  const userId = req.user.user_id;
  const { 
    session_title = "새 대화", 
    ai_name = "마음이", 
    user_nickname = "당신", 
    ai_tone = "warm", 
    avoid_topics = "",
    place_prompt = "" // 1. 장소 프롬프트 받기
  } = req.body;

  let connection;
  try {
    // 2. 이미지 생성 (시간이 걸릴 수 있음)
    const imageDataUrl = await generateBackgroundImage(place_prompt);

    // 3. DB에 저장
    connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO `ChatSessions` (`user_id`, `session_title`, `ai_name`, `user_nickname`, `ai_tone`, `avoid_topics`, `place_prompt`, `background_image_data`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, session_title, ai_name, user_nickname, ai_tone, avoid_topics, place_prompt, imageDataUrl]
    );
    const newSessionId = result.insertId;
    
    const [newSessionRows] = await connection.query('SELECT * FROM `ChatSessions` WHERE `session_id` = ?', [newSessionId]);
    
    res.json(newSessionRows[0]);
  } catch (err) {
    console.error('POST /api/sessions Error:', err);
    res.status(500).json({ message: '새 대화 생성 실패' });
  } finally {
    if (connection) connection.release();
  }
});

// [GET] /api/sessions - 대화 목록 (기존)
router.get('/sessions', isAuthenticated, async (req, res) => {
  // ... (기존 코드와 동일) ...
  const userId = req.user.user_id;
  let connection;
  try {
    connection = await pool.getConnection();
    const [sessions] = await connection.query('SELECT * FROM `ChatSessions` WHERE `user_id` = ? ORDER BY `created_at` DESC', [userId]);
    res.json(sessions);
  } catch (err) {
    console.error('GET /api/sessions Error:', err);
    res.status(500).json({ message: '대화 목록 로드 실패' });
  } finally {
    if (connection) connection.release();
  }
});

// [GET] /api/sessions/:sessionld - 특정 세션 정보 (기존)
router.get('/sessions/:sessionld', isAuthenticated, async (req, res) => {
  // ... (기존 코드와 동일) ...
  const userId = req.user.user_id;
  const { sessionld } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM `ChatSessions` WHERE `session_id` = ? AND `user_id` = ?',
      [sessionld, userId]
    );
    if (rows.length === 0) {
      return res.status(403).json({ message: '접근 권한이 없습니다.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/sessions/:sessionld Error:', err);
    res.status(500).json({ message: '세션 정보 로드 실패' });
  } finally {
    if (connection) connection.release();
  }
});


// [PUT] /api/sessions/:sessionld - 채팅방 설정 수정 (배경 생성 추가)
router.put('/sessions/:sessionld', isAuthenticated, async (req, res) => {
  const userId = req.user.user_id;
  const { sessionld } = req.params;
  const { 
    session_title, 
    ai_name, 
    user_nickname, 
    ai_tone, 
    avoid_topics,
    place_prompt // 1. 새 장소 프롬프트 받기
  } = req.body;

  if (!session_title) {
    return res.status(400).json({ message: '제목이 필요합니다.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // 2. 기존 장소 프롬프트와 비교
    const [rows] = await connection.query('SELECT `place_prompt`, `background_image_data` FROM `ChatSessions` WHERE `session_id` = ? AND `user_id` = ?', [sessionld, userId]);
    
    if (rows.length === 0) {
      return res.status(403).json({ message: '수정 권한이 없습니다.' });
    }

    let imageDataUrl = rows[0].background_image_data; // 기본값은 기존 이미지

    // 3. 장소 프롬프트가 변경되었으면, 새 이미지 생성
    if (place_prompt !== rows[0].place_prompt) {
      imageDataUrl = await generateBackgroundImage(place_prompt);
    }

    // 4. DB 업데이트 (새 이미지 데이터 또는 기존 이미지 데이터)
    await connection.query(
      'UPDATE `ChatSessions` SET `session_title` = ?, `ai_name` = ?, `user_nickname` = ?, `ai_tone` = ?, `avoid_topics` = ?, `place_prompt` = ?, `background_image_data` = ? WHERE `session_id` = ? AND `user_id` = ?',
      [session_title, ai_name, user_nickname, ai_tone, avoid_topics, place_prompt, imageDataUrl, sessionld, userId]
    );

    res.json({ message: '채팅방 설정이 성공적으로 수정되었습니다.' });
  } catch (err) {
    console.error('PUT /api/sessions Error:', err);
    res.status(500).json({ message: '서버 오류로 수정에 실패했습니다.' });
  } finally {
    if (connection) connection.release();
  }
});

// [DELETE] /api/sessions/:sessionld - 채팅방 삭제 (기존)
router.delete('/sessions/:sessionld', isAuthenticated, async (req, res) => {
  // ... (기존 코드와 동일) ...
  const userId = req.user.user_id;
  const { sessionld } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.query(
      'DELETE FROM `ChatSessions` WHERE `session_id` = ? AND `user_id` = ?',
      [sessionld, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    }
    res.json({ message: '채팅방이 성공적으로 삭제되었습니다.' });
  } catch (err) {
    console.error('DELETE /api/sessions Error:', err);
    res.status(500).json({ message: '서버 오류로 삭제에 실패했습니다.' });
  } finally {
    if (connection) connection.release();
  }
});

// [GET] /api/chat/:sessionld - 메시지 불러오기 (기존)
router.get('/chat/:sessionld', isAuthenticated, async (req, res) => {
  // ... (기존 코드와 동일) ...
  const userId = req.user.user_id;
  const { sessionld } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    const [sessionRows] = await connection.query('SELECT * FROM `ChatSessions` WHERE `session_id` = ? AND `user_id` = ?', [sessionld, userId]);
    if (sessionRows.length === 0) {
      return res.status(403).json({ message: '접근 권한이 없습니다.' });
    }
    const [messages] = await connection.query('SELECT * FROM `ChatMessages` WHERE `session_id` = ? ORDER BY `timestamp` ASC', [sessionld]);
    res.json(messages);
  } catch (err) {
    console.error('GET /api/chat/:sessionId Error:', err);
    res.status(500).json({ message: '메시지 로드 실패' });
  } finally {
    if (connection) connection.release();
  }
});

// [POST] /api/chat - AI에게 메시지 전송 (기존)
router.post('/chat', isAuthenticated, async (req, res) => {
  // ... (기존 코드와 동일, 이름 불러주기 프롬프트 포함) ...
  const userId = req.user.user_id;
  const { sessionld, message } = req.body;

  if (!sessionld || !message) {
    return res.status(400).json({ message: '필수 정보 누락' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [sessionRows] = await connection.query('SELECT * FROM `ChatSessions` WHERE `session_id` = ? AND `user_id` = ?', [sessionld, userId]);
    if (sessionRows.length === 0) {
      return res.status(403).json({ message: '접근 권한이 없습니다.' });
    }
    const settings = sessionRows[0]; 

    await connection.query(
      'INSERT INTO `ChatMessages` (`session_id`, `sender`, `content`) VALUES (?, ?, ?)',
      [sessionld, 'user', message]
    );

    const [historyRows] = await connection.query(
      'SELECT * FROM `ChatMessages` WHERE `session_id` = ? ORDER BY `timestamp` DESC LIMIT 10',
      [sessionld]
    );
    const recentHistory = historyRows.reverse();

    let toneInstruction;
    switch (settings.ai_tone) {
      case 'professional':
        toneInstruction = "너의 말투는 전문 심리 상담가처럼 전문적이고 분석적이며, **반드시 존댓말을 사용해야 해.**";
        break;
      case 'friendly':
        toneInstruction = "너의 말투는 친한 친구처럼 **반드시 반말을 사용해야 하며**, 유쾌하고 편안하게 대화해야 해. **절대로 존댓말을 쓰지 마.**";
        break;
      case 'calm':
        toneInstruction = "너의 말투는 매우 차분하고 명상적이이며, 짧고 간결하게 답해야 해. **존댓말을 사용해.**";
        break;
      case 'warm':
      default:
        toneInstruction = "너의 말투는 다정하고 따뜻하며, 상대방의 감정을 우선적으로 공감해주는 상냥한 **존댓말을 사용해야 해.**";
    }

    const userNickname = settings.user_nickname || '당신';
    const systemPrompt = `
# 역할
너는 AI 심리 상담사 '${settings.ai_name || '마음이'}'이다. 너의 유일한 임무는 사용자와 대화하며 심리적인 안정과 공감을 제공하는 것이다.
${settings.place_prompt ? `현재 대화 장소는 '${settings.place_prompt}' 테마의 공간이다. 이 분위기를 인지하고 대화하라.` : ''}

# 사용자 정보
- (중요) 너는 사용자를 '${userNickname}'(이)라고 불러야 한다.
- 친근감을 표현하기 위해, 너의 모든 답변에서 최소 한 번 이상 '${userNickname}'님의 이름을 부르도록 노력해라. 특히 대화의 시작이나 끝에 부르는 것이 좋다.
- 사용자가 너를 '${userNickname}'(이)라고 불러야 한다는 의미가 아니다. *너가* 사용자를 그렇게 불러야 한다.

# 대화 규칙
- ${toneInstruction}
- 너의 역할은 공감과 위로이며, 절대 의학적 진단을 내리거나 약물을 추천해서는 안 된다.
- 대화는 항상 사용자의 감정을 중심으로 진행해야 한다.

# 금지 사항
- 다음 주제에 대해서는 조언하거나 언급을 피해야 한다: '${settings.avoid_topics || '없음'}'
- 너가 AI라는 사실을 먼저 밝히지 마라.
`;

    const messagesForAPI = [
      { role: "system", content: systemPrompt },
      ...recentHistory.map(msg => ({
        role: (msg.sender === 'user' ? 'user' : 'assistant'),
        content: msg.content
      })),
      { role: "system", content: "이제 대화를 시작합니다." }, // AI가 장소 인지 후 대답 시작
      { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messagesForAPI,
    });
    const aiResponse = completion.choices[0].message.content;

    await connection.query(
      'INSERT INTO `ChatMessages` (`session_id`, `sender`, `content`) VALUES (?, ?, ?)',
      [sessionld, 'ai', aiResponse]
    );

    res.json({ message: aiResponse });

  } catch (err) {
    console.error('POST /api/chat Error:', err);
    res.status(500).json({ message: 'AI 응답 생성 실패' });
  } finally {
    if (connection) connection.release();
  }
});


module.exports = router;