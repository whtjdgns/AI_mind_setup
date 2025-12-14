// frontend/src/pages/SettingsPage.js
import React, { useState, useEffect } from 'react';

// 3. AI 설정 페이지 (4번 기능: '기본값' 설정 페이지로 변경)
const SettingsPage = () => {
  const [settings, setSettings] = useState({ ai_name: '', user_nickname: '', ai_tone: '', avoid_topics: '' });
  const [statusMessage, setStatusMessage] = useState('로딩 중...');

  // 설정 불러오기
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setSettings({
            ai_name: data.ai_name || '마음이',
            user_nickname: data.user_nickname || '당신',
            ai_tone: data.ai_tone || 'warm',
            avoid_topics: data.avoid_topics || ''
          });
          setStatusMessage(''); // 로딩 완료
        } else {
          setStatusMessage('설정을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        setStatusMessage('서버 오류로 설정을 불러오지 못했습니다.');
      }
    };
    fetchSettings();
  }, []);

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  // 저장 핸들러
  const handleSave = async () => {
    setStatusMessage('저장 중...');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          aiName: settings.ai_name,
          userNickname: settings.user_nickname,
          aiTone: settings.ai_tone,
          avoidTopics: settings.avoid_topics
        })
      });
      if (res.ok) {
        setStatusMessage('기본 설정이 성공적으로 저장되었습니다.');
      } else {
        setStatusMessage('저장에 실패했습니다.');
      }
    } catch (err) {
      setStatusMessage('서버 오류로 저장에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-6">AI 상담사 기본 설정</h1>
      {/* --- 4번 기능: 안내 문구 수정 --- */}
      <p className="mb-4 text-gray-600">
        여기서 설정한 값은 '+ 새 대화 시작' 시 팝업창의 기본값으로 사용됩니다.
      </p>
      
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">AI 이름 (기본값)</label>
        <input type="text" name="ai_name" value={settings.ai_name} onChange={handleChange} className="w-full p-2 border rounded-lg" />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">AI가 나를 부를 호칭 (기본값)</label>
        <input type="text" name="user_nickname" value={settings.user_nickname} onChange={handleChange} className="w-full p-2 border rounded-lg" />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">AI 말투 (기본값)</label>
        <div className="flex flex-wrap gap-2">
          {['warm', 'professional', 'friendly', 'calm'].map(tone => (
            <button key={tone} onClick={() => setSettings(prev => ({ ...prev, ai_tone: tone }))}
              className={`px-4 py-2 rounded-full ${settings.ai_tone === tone ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              {{ 'warm': '따뜻함', 'professional': '전문적', 'friendly': '친구 같음', 'calm': '차분함' }[tone]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2">언급 금지 주제 (기본값)</label>
        <input type="text" name="avoid_topics" value={settings.avoid_topics} onChange={handleChange} className="w-full p-2 border rounded-lg" />
      </div>

      <button onClick={handleSave} className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold">
        기본값으로 저장하기
      </button>

      {statusMessage && (<p className="text-center mt-4 text-gray-600">{statusMessage}</p>)}
    </div>
  );
};

export default SettingsPage;