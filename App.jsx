import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import io from 'socket.io-client';

// Компоненты
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import PartnerLinks from './pages/PartnerLinks';
import Game from './pages/Game';
import Analytics from './pages/Analytics';
import AffiliateNetwork from './pages/AffiliateNetwork';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

// Стили
import './App.css';

// Контекст
import { useAuthStore } from './stores/authStore';
import { useSocketStore } from './stores/socketStore';

// Настройка axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

function App() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();
  
  useEffect(() => {
    // Подключение WebSocket при авторизации
    if (isAuthenticated && user) {
      const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: { token: localStorage.getItem('token') }
      });
      
      connectSocket(socket);
      
      socket.on('click-updated', (data) => {
        // Обработка обновлений в реальном времени
        console.log('Новый клик:', data);
      });
      
      socket.on('game-score-update', (data) => {
        // Обновление таблицы лидеров
        console.log('Новый рекорд:', data);
      });
      
      return () => {
        disconnectSocket();
      };
    }
  }, [isAuthenticated, user]);
  
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              border: '1px solid #374151',
            },
          }}
        />
        
        <AnimatePresence mode="wait">
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
            
            {/* Приватные маршруты */}
            <Route path="/" element={
              isAuthenticated ? (
                <div className="flex">
                  <Sidebar />
                  <div className="flex-1 ml-64">
                    <Navbar />
                    <main className="p-6">
                      <Dashboard />
                    </main>
                  </div>
                </div>
              ) : <Navigate to="/login" />
            } />
            
            <Route path="/links" element={
              isAuthenticated ? (
                <div className="flex">
                  <Sidebar />
                  <div className="flex-1 ml-64">
                    <Navbar />
                    <main className="p-6">
                      <PartnerLinks />
                    </main>
                  </div>
                </div>
              ) : <Navigate to="/login" />
            } />
            
            <Route path="/game" element={
              isAuthenticated ? (
                <div className="flex">
                  <Sidebar />
                  <div className="flex-1 ml-64">
                    <Navbar />
                    <main className="p-6">
                      <Game />
                    </main>
                  </div>
                </div>
              ) : <Navigate to="/login" />
            } />
            
            <Route path="/analytics" element={
              isAuthenticated ? (
                <div className="flex">
                  <Sidebar />
                  <div className="flex-1 ml-64">
                    <Navbar />
                    <main className="p-6">
                      <Analytics />
                    </main>
                  </div>
                </div>
              ) : <Navigate to="/login" />
            } />
            
            <Route path="/affiliate" element={
              isAuthenticated ? (
                <div className="flex">
                  <Sidebar />
                  <div className="flex-1 ml-64">
                    <Navbar />
                    <main className="p-6">
                      <AffiliateNetwork />
                    </main>
                  </div>
                </div>
              ) : <Navigate to="/login" />
            } />
            
            <Route path="/settings" element={
              isAuthenticated ? (
                <div className="flex">
                  <Sidebar />
                  <div className="flex-1 ml-64">
                    <Navbar />
                    <main className="p-6">
                      <Settings />
                    </main>
                  </div>
                </div>
              ) : <Navigate to="/login" />
            } />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;