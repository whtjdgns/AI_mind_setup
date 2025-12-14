// frontend/src/pages/MainChatPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
// --- (수정) react-router-dom에서 Link, useParams, useNavigate를 가져옵니다. ---
import { Link, useParams, useNavigate } from 'react-router-dom';

// (4번 기능) 재사용 가능한 설정 모달 (배경 프롬프트 추가)
const ChatSettingsModal = ({ mode, show, onClose, onSave, sessionData, setSessionData, isLoading, modalStatus }) => {
  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSessionData(prev => ({ ...prev, [name]: value }));
  };

  const title = mode === 'new' ? '새 대화 시작' : '채팅방 설정 수정';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        
        {/* (기존) 채팅방 제목 */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">채팅방 제목</label>
          <input 
            type="text" 
            name="session_title" 
            value={sessionData.session_title || ''} 
            onChange={handleChange} 
            className="w-full p-2 border rounded-lg" 
          />
        </div>
        
        {/* (신규) 상담 장소 (배경) */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">상담 장소 (배경)</label>
          <input 
            type="text" 
            name="place_prompt" 
            placeholder="예: 조용한 숲 속, 아늑한 카페"
            value={sessionData.place_prompt || ''} 
            onChange={handleChange} 
            className="w-full p-2 border rounded-lg" 
          />
          <p className="text-xs text-gray-500 mt-1">
            입력한 장소로 AI가 배경 이미지를 생성합니다. (비워두면 기본 배경)
          </p>
        </div>

        {/* (기존) AI 이름 */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">AI 이름</label>
          <input 
            type="text" 
            name="ai_name" 
            value={sessionData.ai_name || ''} 
            onChange={handleChange} 
            className="w-full p-2 border rounded-lg" 
          />
        </div>

        {/* (기존) AI가 나를 부를 호칭 */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">AI가 나를 부를 호칭</label>
          <input 
            type="text" 
            name="user_nickname" 
            value={sessionData.user_nickname || ''} 
            onChange={handleChange} 
            className="w-full p-2 border rounded-lg" 
          />
        </div>

        {/* (기존) AI 말투 */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">AI 말투</label>
          <div className="flex flex-wrap gap-2">
            {['warm', 'professional', 'friendly', 'calm'].map(tone => (
              <button 
                key={tone} 
                onClick={() => setSessionData(prev => ({ ...prev, ai_tone: tone }))}
                className={`px-4 py-2 rounded-full ${sessionData.ai_tone === tone ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                {{ 'warm': '따뜻함', 'professional': '전문적', 'friendly': '친구 같음', 'calm': '차분함' }[tone]}
              </button>
            ))}
          </div>
        </div>

        {/* (기존) 언급 금지 주제 */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">언급 금지 주제</label>
          <input 
            type="text" 
            name="avoid_topics" 
            value={sessionData.avoid_topics || ''} 
            onChange={handleChange} 
            className="w-full p-2 border rounded-lg" 
          />
        </div>

        {/* (기존) 버튼 + 로딩 상태 표시 */}
        <div className="flex justify-between items-center">
          {/* 로딩 상태 텍스트 */}
          <span className="text-sm text-blue-600">
            {isLoading ? modalStatus : ''}
          </span>
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={onSave}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300"
            >
              {isLoading ? "처리 중..." : (mode === 'new' ? '생성하기' : '저장하기')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// 메인 채팅 페이지
const MainChatPage = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState(null);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showEditChatModal, setShowEditChatModal] = useState(false);
  const [modalSettings, setModalSettings] = useState({});
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalStatus, setModalStatus] = useState("");

  const navigate = useNavigate();
  const { sessionld } = useParams();
  const messagesEndRef = useRef(null);

  const currentSessionData = sessions.find(s => s.session_id === currentSessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSessions = useCallback(async () => {
    setIsSessionLoading(true);
    try {
      const res = await fetch('/api/sessions', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      } else {
        console.error('대화 목록 로드 실패');
      }
    } catch (err) {
      console.error('대화 목록 로드 실패:', err);
    } finally {
      setIsSessionLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }
    if (sessionld) {
      const id = Number(sessionld);
      if (sessions.some(s => s.session_id === id)) {
        setCurrentSessionId(id);
      } else if (sessions.length > 0) {
        navigate(`/chat/${sessions[0].session_id}`, { replace: true });
      } else {
        setCurrentSessionId(null);
      }
    } else {
      if (sessions.length > 0) {
        navigate(`/chat/${sessions[0].session_id}`, { replace: true });
      } else {
        setCurrentSessionId(null);
      }
    }
  }, [sessionld, sessions, isSessionLoading, navigate]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentSessionId) {
        setMessages([]);
        return;
      }
      setIsMessageLoading(true);
      try {
        const res = await fetch(`/api/chat/${currentSessionId}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        } else {
          console.error('메시지 로드 실패');
          setMessages([]);
        }
      } catch (err) {
        console.error('메시지 로드 에러:', err);
      } finally {
        setIsMessageLoading(false);
      }
    };
    fetchMessages();
  }, [currentSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isMessageLoading]);

  const handleNewSessionClick = async () => {
    setIsModalLoading(true);
    setModalStatus("기본 설정을 불러오는 중...");
    try {
      const res = await fetch('/api/settings', { credentials: 'include' });
      if (res.ok) {
        const defaultSettings = await res.json();
        setModalSettings({
          session_title: "새 대화",
          ai_name: defaultSettings.ai_name,
          user_nickname: defaultSettings.user_nickname,
          ai_tone: defaultSettings.ai_tone,
          avoid_topics: defaultSettings.avoid_topics,
          place_prompt: ""
        });
        setShowNewChatModal(true);
      } else {
        console.error("기본 설정 로드 실패");
      }
    } catch (err) {
      console.error("기본 설정 로드 에러:", err);
    } finally {
      setIsModalLoading(false);
      setModalStatus("");
    }
  };

  const handleCreateSession = async () => {
    setIsModalLoading(true);
    if (modalSettings.place_prompt) {
      setModalStatus("AI가 배경을 그리고 있습니다... (최대 10초)");
    } else {
      setModalStatus("채팅방을 생성하는 중...");
    }

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(modalSettings)
      });
      if (res.ok) {
        const newSession = await res.json();
        setSessions([newSession, ...sessions]);
        navigate(`/chat/${newSession.session_id}`);
        setShowNewChatModal(false);
      } else {
        console.error("새 대화 생성 실패");
        alert("새 대화 생성에 실패했습니다.");
      }
    } catch (err) {
      console.error('새 대화 생성 API 에러:', err);
      alert("서버 오류로 새 대화 생성에 실패했습니다.");
    } finally {
      setIsModalLoading(false);
      setModalStatus("");
    }
  };

  const handleEditSessionClick = () => {
    if (!currentSessionData) return;
    setModalSettings({
      session_title: currentSessionData.session_title,
      ai_name: currentSessionData.ai_name,
      user_nickname: currentSessionData.user_nickname,
      ai_tone: currentSessionData.ai_tone,
      avoid_topics: currentSessionData.avoid_topics,
      place_prompt: currentSessionData.place_prompt || ""
    });
    setShowEditChatModal(true);
  };

  const handleUpdateSession = async () => {
    if (!currentSessionId || !currentSessionData) return;
    
    setIsModalLoading(true);
    if (modalSettings.place_prompt !== (currentSessionData.place_prompt || "")) {
      setModalStatus("AI가 새 배경을 그리고 있습니다... (최대 10초)");
    } else {
      setModalStatus("설정을 저장하는 중...");
    }

    try {
      const res = await fetch(`/api/sessions/${currentSessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(modalSettings)
      });
      if (res.ok) {
        await fetchSessions();
        setShowEditChatModal(false);
      } else {
        console.error("채팅방 설정 수정 실패");
        alert("설정 수정에 실패했습니다.");
      }
    } catch (err) {
      console.error('채팅방 설정 수정 API 에러:', err);
      alert("서버 오류로 설정 수정에 실패했습니다.");
    } finally {
      setIsModalLoading(false);
      setModalStatus("");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentSessionId || isMessageLoading) return;
    const userMessage = input;
    setInput('');
    setIsMessageLoading(true);

    setMessages(prev => [...prev, { sender: 'user', content: userMessage, timestamp: new Date().toISOString() }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionld: currentSessionId,
          message: userMessage
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { sender: 'ai', content: data.message, timestamp: new Date().toISOString() }]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', content: '죄송합니다. 오류가 발생했습니다.', timestamp: new Date().toISOString() }]);
      }
    } catch (err) {
      console.error('AI 응답 에러:', err);
      setMessages(prev => [...prev, { sender: 'ai', content: '서버에 연결할 수 없습니다.', timestamp: new Date().toISOString() }]);
    } finally {
      setIsMessageLoading(false);
    }
  };

  const handleEditClick = (session) => {
    setEditingSessionId(session.session_id);
    setEditingTitle(session.session_title);
  };

  const handleTitleSave = async (e, sessionId) => {
    if (e.key === 'Enter') {
      if (!editingTitle.trim()) {
        alert("제목을 입력하세요.");
        return;
      }
      
      const sessionToEdit = sessions.find(s => s.session_id === sessionId);
      const updateData = { ...sessionToEdit, session_title: editingTitle.trim() };
      
      setEditingSessionId(null); 
      setIsSessionLoading(true);

      try {
        const res = await fetch(`/api/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updateData)
        });

        if (res.ok) {
          await fetchSessions();
        } else {
          console.error('제목 수정 실패');
          alert("제목 수정에 실패했습니다.");
        }
      } catch (err) {
        console.error('제목 수정 API 에러:', err);
      } finally {
        setIsSessionLoading(false);
      }
    }
  };

  const handleDeleteClick = (sessionId) => {
    setDeletingSessionId(sessionId);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingSessionId(null);
  };

  const confirmDelete = async () => {
    if (!deletingSessionId) return;
    try {
      const res = await fetch(`/api/sessions/${deletingSessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setSessions(prevSessions =>
          prevSessions.filter(s => s.session_id !== deletingSessionId)
        );
        if (currentSessionId === deletingSessionId) {
          const remainingSessions = sessions.filter(s => s.session_id !== deletingSessionId);
          if (remainingSessions.length > 0) {
            navigate(`/chat/${remainingSessions[0].session_id}`);
          } else {
            navigate('/chat');
          }
        }
      } else {
        console.error('삭제 실패');
      }
    } catch (err) {
      console.error('삭제 API 에러:', err);
    } finally {
      cancelDelete();
    }
  };
  
  const isLoading = isSessionLoading || isMessageLoading || isModalLoading;

  const chatAreaStyle = {
    backgroundImage: currentSessionData?.background_image_data 
      ? `url(${currentSessionData.background_image_data})` 
      : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <>
      <ChatSettingsModal
        mode="new"
        show={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSave={handleCreateSession}
        sessionData={modalSettings}
        setSessionData={setModalSettings}
        isLoading={isModalLoading}
        modalStatus={modalStatus}
      />
      
      <ChatSettingsModal
        mode="edit"
        show={showEditChatModal}
        onClose={() => setShowEditChatModal(false)}
        onSave={handleUpdateSession}
        sessionData={modalSettings}
        setSessionData={setModalSettings}
        isLoading={isModalLoading}
        modalStatus={modalStatus}
      />

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">삭제 확인</h3>
            <p className="mb-6">이 채팅방을 정말 삭제하시겠습니까?<br/>대화 내역이 모두 사라지며 복구할 수 없습니다.</p>
            <div className="flex justify-end gap-4">
              <button onClick={cancelDelete} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">취소</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">삭제</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-full">
        <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto flex flex-col">
          <h2 className="text-xl font-semibold mb-4">대화 목록</h2>
          <button
            onClick={handleNewSessionClick}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 mb-4"
            disabled={isLoading}
          >
            + 새 대화 시작
          </button>
          <div className="flex-1">
            {isSessionLoading ? (
              <p className="text-gray-500">대화 목록 로딩 중...</p>
            ) : sessions.length === 0 ? (
              <p className="text-gray-500">대화가 없습니다.</p>
            ) : (
              sessions.map(session => (
                <div 
                  key={session.session_id} 
                  className={`group relative p-3 rounded-lg cursor-pointer mb-2 ${session.session_id === currentSessionId ? 'bg-gray-300 font-semibold' : 'hover:bg-gray-200'}`}
                >
                  {editingSessionId === session.session_id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyPress={(e) => handleTitleSave(e, session.session_id)}
                      onBlur={() => setEditingSessionId(null)}
                      className="w-full p-0 border-b-2 border-blue-500 outline-none"
                      autoFocus
                    />
                  ) : (
                    <>
                      <Link to={`/chat/${session.session_id}`} className="block overflow-hidden whitespace-nowrap text-ellipsis">
                        {session.session_title || '새 대화'}
                      </Link>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(session)} className="p-1 hover:bg-gray-300 rounded">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteClick(session.session_id)} className="p-1 hover:bg-gray-300 rounded">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-3/4 flex flex-col h-full">
          <div className="p-4 bg-white border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {currentSessionData ? currentSessionData.session_title : "대화를 선택하세요"}
            </h2>
            {currentSessionId && (
              <button 
                onClick={handleEditSessionClick} 
                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM17 4a1 1 0 10-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4z" />
                </svg>
              </button>
            )}
          </div>

          <div 
            className="flex-1 p-6 overflow-y-auto relative"
            style={chatAreaStyle}
          >
            {currentSessionData?.background_image_data && (
              <div className="absolute inset-0 bg-black opacity-30"></div>
            )}

            <div className="relative z-10">
              {isMessageLoading && messages.length === 0 ? (
                <p className="text-gray-200 text-center">메시지를 불러오는 중입니다...</p>
              ) : !currentSessionId && !isSessionLoading ? (
                <p className="text-gray-200 text-center">왼쪽에서 대화를 선택하거나 '새 대화'를 시작하세요.</p>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span className={`inline-block p-3 rounded-lg max-w-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}>
                      {msg.content}
                    </span>
                  </div>
                ))
              )}

              {isMessageLoading && messages.length > 0 && (
                <div className="mb-4 flex justify-start">
                  <span className="inline-block p-3 rounded-lg bg-white text-black">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
                    </div>
                  </span>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-gray-50 border-t">
            <div className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={isLoading ? "AI가 응답 중입니다..." : (currentSessionId ? "메시지를 입력하세요..." : "대화를 시작해주세요.")}
                disabled={isLoading || !currentSessionId}
              />
              <button
                onClick={handleSend}
                className="bg-blue-500 text-white px-6 py-3 rounded-r-lg hover:bg-blue-600 disabled:bg-gray-400"
                disabled={isLoading || !currentSessionId || !input.trim()}
              >
                전송
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainChatPage;