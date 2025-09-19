import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useCampaign } from './CampaignContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { selectedCampaign } = useCampaign();
  const currentCampaignRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3334', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Handle campaign changes
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Leave previous campaign room
    if (currentCampaignRef.current) {
      console.log('Leaving campaign room:', currentCampaignRef.current.id);
      socket.emit('leave-campaign', currentCampaignRef.current.id);
    }

    // Join new campaign room
    if (selectedCampaign) {
      console.log('Joining campaign room:', selectedCampaign.id);
      socket.emit('join-campaign', selectedCampaign.id);
      currentCampaignRef.current = selectedCampaign;
    }
  }, [socket, isConnected, selectedCampaign]);

  const value = {
    socket,
    isConnected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
