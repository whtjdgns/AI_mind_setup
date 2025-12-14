// frontend/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// 1. AuthContext.js에서 AuthProvider를 import 합니다.
import { AuthProvider } from './AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 2. AuthProvider가 App 컴포넌트 전체를 감싸도록 수정합니다. */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);