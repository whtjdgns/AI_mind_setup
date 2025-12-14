// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './AuthContext';

// --- 페이지 컴포넌트 임포트 ---
import LoginPage from './pages/LoginPage';
import MainChatPage from './pages/MainChatPage';
import SettingsPage from './pages/SettingsPage';

// --- 라우팅 및 레이아웃 ---
// (기존 App.js [source: 622] 로직)
const AppContent = () => {
  const { user, logout, loading } = useAuth();

  // AuthContext에서 로딩 중일 때는 아무것도 렌더링하지 않음 (AuthContext.js [source: 686] 로직)
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-semibold">로그인 상태 확인 중...</h1>
    </div>
  );

  return (
    <div className="flex flex-col h-screen">
      {/* 1. 네비게이션 바 (로그인 상태일 때만 보임) */}
      {user && (
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/chat" className="text-xl font-bold">AI 마음 상담소</Link>
            <div>
              <span className="mr-4">환영합니다, {user.display_name || '사용자'}님</span>
              <Link to="/settings" className="mr-4 hover:text-gray-300">설정</Link>
              <button onClick={logout} className="hover:text-gray-300">로그아웃</button>
            </div>
          </div>
        </nav>
      )}

      {/* 2. 페이지 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto">
        <Routes>
          {/* /chat/:sessionld : 특정 채팅방
            /chat : 채팅방 목록 (MainChatPage가 알아서 최신 방으로 리디렉션)
          */}
          <Route 
            path="/chat/:sessionld" 
            element={user ? <MainChatPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/chat" 
            element={user ? <MainChatPage /> : <Navigate to="/login" />} 
          />
          
          {/* 설정 페이지 */}
          <Route 
            path="/settings" 
            element={user ? <SettingsPage /> : <Navigate to="/login" />} 
          />
          
          {/* 로그인 페이지 */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/chat" /> : <LoginPage />} 
          />
          
          {/* 루트 경로 (/) */}
          <Route 
            path="/" 
            element={user ? <Navigate to="/chat" /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </div>
  );
};

// 최상위 App 컴포넌트 (기존 App.js [source: 663] 로직)
const App = () => {
  return (
    // AuthProvider가 AppContent보다 상위에 있어야 useAuth() 사용 가능
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;