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
      console.log('Fetching campaign:', campaignId);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3334/api'}/campaigns/${campaignId}`);
      console.log('Campaign fetch response:', response.status, response.statusText);
      
      if (response.ok) {
        const campaign = await response.json();
        console.log('Successfully loaded campaign:', campaign);
        
        // Validate campaign data structure
        if (!campaign || typeof campaign.id === 'undefined') {
          console.error('Invalid campaign data received:', campaign);
          setSelectedCampaign(null);
          localStorage.removeItem('selectedCampaignId');
          return;
        }
        
        setSelectedCampaign(campaign);
      } else {
        console.error('Failed to fetch campaign:', campaignId, 'Status:', response.status);
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
      // Validate campaign object
      if (!campaign.id) {
        console.error('Invalid campaign object - missing id:', campaign);
        return;
      }
      
      setIsLoading(true);
      localStorage.setItem('selectedCampaignId', campaign.id);
      setPendingCampaignId(campaign.id);
      
      // Actual campaign switch will happen after 1 second
      setTimeout(async () => {
        await fetchCampaign(campaign.id);
        setIsLoading(false);
        setPendingCampaignId(null);
        navigate('/');
      }, 1000);
    } else {
      localStorage.removeItem('selectedCampaignId');
      setSelectedCampaign(null);
      setPendingCampaignId(null);
      setIsLoading(false);
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
