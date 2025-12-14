// frontend/src/pages/LoginPage.js
import React from 'react';
import { useAuth } from '../AuthContext';

// 1. 로그인 페이지 (UI/UX 개선)
const LoginPage = () => {
  const { login } = useAuth();

  return (
    // 전체 화면을 차지하는 그라데이션 배경
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
      
      {/* 로그인 카드 */}
      <div className="w-full max-w-md p-8 sm:p-12 bg-white rounded-2xl shadow-2xl text-center">
        
        {/* 아이콘 (간단한 '생각/대화' 아이콘 SVG) */}
        <svg 
          className="w-16 h-16 mx-auto text-indigo-500 mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          >
          </path>
        </svg>

        {/* 제목 */}
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          AI 마음 상담소
        </h1>
        
        {/* 부제목 */}
        <p className="text-lg text-gray-600 mb-8">
          로그인하고 나만의 AI 상담사를 만나보세요.
        </p>

        {/* Google 로그인 버튼 (로고 추가) */}
        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-gray-50 transition duration-300"
        >
          {/* Google 'G' 로고 SVG */}
          <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.64-3.657-11.303-8.662l-6.571 4.819C9.656 39.663 16.318 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C39.712 34.61 44 28.169 44 20c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Google 계정으로 로그인
        </button>
        
      </div>

      {/* 하단 저작권 */}
      <footer className="absolute bottom-6 text-gray-500 text-sm">
        © 2024 AI 마음 상담소. All rights reserved.
      </footer>
    </div>
  );
};

export default LoginPage;