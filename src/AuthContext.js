// frontend/src/AuthContext.js
// (이 이름으로 새 파일 만들기)

import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Context 생성
const AuthContext = createContext(null);

// 2. AuthProvider 컴포넌트 (로그인 로직의 핵심)
export const AuthProvider = ({ children }) => {
    // user 상태: null (로딩 중), false (비로그인), {..} (로그인)
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 앱이 처음 로드될 때, 백엔드에 로그인 상태를 확인
    useEffect(() => {
        // '/api/auth/me' API를 호출 (프록시가 :5000으로 넘겨줌)
        fetch('/api/auth/me')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(data => {
                setUser(data.user || false); // user 객체가 있으면 로그인, 없으면 false
            })
            .catch(err => {
                console.error("로그인 상태 확인 실패:", err);
                setUser(false); // 에러 발생 시 비로그인 처리
            })
            .finally(() => {
                setLoading(false); // 로딩 완료
            });
    }, []);

    // Google 로그인 함수 (버튼 클릭 시 호출)
    const login = () => {
        // 백엔드의 Google 로그인 API로 페이지 이동
        // (프록시가 :5000으로 넘겨줌)
        window.location.href = '/api/auth/google';
    };

    // 로그아웃 함수
    const logout = async () => {
        try {
            // 백엔드에 로그아웃 요청
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(false); // 프론트엔드 상태를 비로그인으로 변경
        } catch (err) {
            console.error("로그아웃 실패:", err);
        }
    };

    // 로딩 중일 때
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <h1 className="text-2xl font-semibold">로그인 상태 확인 중...</h1>
            </div>
        );
    }

    // Context.Provider로 user 정보와 login/logout 함수를 하위 컴포넌트에 제공
    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. useAuth 커스텀 훅 (다른 컴포넌트에서 쉽게 user 정보 사용)
export const useAuth = () => {
    return useContext(AuthContext);
};