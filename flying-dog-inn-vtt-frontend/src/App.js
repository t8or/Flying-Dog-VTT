import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import Maps from './components/Maps';
import Timeline from './components/Timeline';
import CombatLoot from './components/CombatLoot';
import Log from './components/Log';
import Sidebar from './components/Sidebar';
import { CampaignProvider } from './contexts/CampaignContext';
import './App.css';

function App() {
  const [mapChangeCounter, setMapChangeCounter] = useState(0);

  const handleMapChange = useCallback((change) => {
    console.log('Map changed:', change);
    setMapChangeCounter(prev => prev + 1);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <CampaignProvider>
          <div className="app-container">
            <Sidebar onMapChange={handleMapChange} />
            <div className="main-content">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />
                <Route path="/maps" element={
                  <ProtectedRoute>
                    <Maps onMapChange={handleMapChange} />
                  </ProtectedRoute>
                } />
                <Route path="/maps/:id" element={
                  <ProtectedRoute>
                    <Maps onMapChange={handleMapChange} />
                  </ProtectedRoute>
                } />
                <Route path="/timeline" element={
                  <ProtectedRoute>
                    <Timeline />
                  </ProtectedRoute>
                } />
                <Route path="/combat/loot" element={
                  <ProtectedRoute>
                    <CombatLoot />
                  </ProtectedRoute>
                } />
                <Route path="/log" element={
                  <ProtectedRoute>
                    <Log />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </CampaignProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
