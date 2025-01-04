import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CampaignLoadingOverlay from '../components/CampaignLoadingOverlay';

const CampaignContext = createContext();

export const CampaignProvider = ({ children }) => {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCampaignId, setPendingCampaignId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Initializing campaign...');
    const storedCampaignId = localStorage.getItem('selectedCampaignId');
    console.log('Initial localStorage campaign ID:', storedCampaignId);

    if (storedCampaignId) {
      console.log('Found stored campaign ID:', storedCampaignId);
      fetchCampaign(storedCampaignId);
    }
  }, []);

  const fetchCampaign = async (campaignId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/campaigns/${campaignId}`);
      console.log('Campaign fetch response:', response.status);
      
      if (response.ok) {
        const campaign = await response.json();
        console.log('Successfully loaded campaign:', campaign);
        setSelectedCampaign(campaign);
      } else {
        console.error('Failed to fetch campaign:', campaignId);
        setSelectedCampaign(null);
        localStorage.removeItem('selectedCampaignId');
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      setSelectedCampaign(null);
      localStorage.removeItem('selectedCampaignId');
    }
  };

  const selectCampaign = useCallback(async (campaign) => {
    console.log('Selected campaign changed:', campaign);
    
    if (campaign) {
      setIsLoading(true);
      localStorage.setItem('selectedCampaignId', campaign.id);
      setPendingCampaignId(campaign.id);
      
      // Actual campaign switch will happen after 1 second
      setTimeout(async () => {
        await fetchCampaign(campaign.id);
        navigate('/');
      }, 1000);
    } else {
      localStorage.removeItem('selectedCampaignId');
      setSelectedCampaign(null);
      setPendingCampaignId(null);
      navigate('/');
    }
  }, [navigate]);

  const handleLoadComplete = useCallback(() => {
    setIsLoading(false);
    setPendingCampaignId(null);
  }, []);

  return (
    <CampaignContext.Provider value={{ selectedCampaign, selectCampaign }}>
      {children}
      <CampaignLoadingOverlay 
        isVisible={isLoading} 
        onLoadComplete={handleLoadComplete}
      />
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};
