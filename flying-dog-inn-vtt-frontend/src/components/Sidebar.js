import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  MagnifyingGlass, 
  MapTrifold, 
  Sword, 
  Scroll, 
  PlusCircle, 
  Gear, 
  CaretDown,
  BeerStein,
  CheckCircle,
  Warning,
  HouseLine,
  BookOpen
} from "@phosphor-icons/react";
import MapUploadDialog from './MapUploadDialog';
import './Sidebar.css';
import { useCampaign } from '../contexts/CampaignContext';

const ConnectionStatus = () => {
  const [lastSynced, setLastSynced] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    try {
      setIsChecking(true);
      const response = await fetch('http://localhost:3001/api/health');
      const data = await response.json();
      const isOk = response.ok && data.status === 'ok';
      setIsConnected(isOk);
      if (isOk) {
        setLastSynced(new Date(data.timestamp));
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkConnection();

    // Check every 5 seconds for the first minute
    const fastInterval = setInterval(checkConnection, 5000);

    // After 1 minute, switch to checking every 30 seconds
    const switchToSlowInterval = setTimeout(() => {
      clearInterval(fastInterval);
      const slowInterval = setInterval(checkConnection, 30000);
      return () => clearInterval(slowInterval);
    }, 60000);

    return () => {
      clearInterval(fastInterval);
      clearTimeout(switchToSlowInterval);
    };
  }, []);

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected from server';
    if (!lastSynced) return 'Never synced';
    
    const now = new Date();
    const diff = now - lastSynced;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 10) return 'Up to date';
    if (seconds < 60) return `Last synced ${seconds} seconds ago`;
    if (minutes === 1) return 'Last synced 1 minute ago';
    if (minutes < 60) return `Last synced ${minutes} minutes ago`;
    if (hours === 1) return 'Last synced 1 hour ago';
    return `Last synced ${hours} hours ago`;
  };

  return (
    <div className="connection-status">
      {isConnected ? (
        <CheckCircle 
          size={16} 
          weight="regular" 
          className={`connection-status-icon ${isChecking ? 'checking' : ''}`}
        />
      ) : (
        <Warning 
          size={16} 
          weight="regular" 
          className="connection-status-icon error" 
        />
      )}
      <span>
        {getStatusText()}
      </span>
    </div>
  );
};

const DraggableMapItem = ({ map, index, moveMap, onClick }) => {
  const location = useLocation();
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const [{ isDraggingMonitor }, drag] = useDrag({
    type: 'MAP',
    item: () => {
      setIsDragging(true);
      return { id: map.id, index };
    },
    collect: (monitor) => ({
      isDraggingMonitor: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      setIsDragging(false);
      if (monitor.didDrop()) {
        onClick();
      }
    }
  });

  const [, drop] = useDrop({
    accept: 'MAP',
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Get rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Get mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveMap(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  const handleClick = (e) => {
    if (isDragging) {
      e.preventDefault();
    }
  };

  return (
    <Link
      ref={ref}
      to={`/maps/${map.id}`}
      className={`nav-item ${location.pathname === `/maps/${map.id}` ? 'active' : ''} ${isDraggingMonitor ? 'dragging' : ''}`}
      style={{ opacity: isDraggingMonitor ? 0.5 : 1 }}
      onClick={handleClick}
    >
      {map.name}
    </Link>
  );
};

const CampaignSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedCampaign, selectCampaign } = useCampaign();

  const handleRenameCampaign = async () => {
    if (!selectedCampaign) return;
    
    const newName = prompt('Enter new campaign name:', selectedCampaign.name);
    if (!newName || newName === selectedCampaign.name) return;

    try {
      const response = await fetch(`http://localhost:3001/api/campaigns/${selectedCampaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) throw new Error('Failed to rename campaign');

      const updatedCampaign = await response.json();
      selectCampaign(updatedCampaign);
      setIsOpen(false);
    } catch (error) {
      console.error('Error renaming campaign:', error);
      alert('Failed to rename campaign');
    }
  };

  const handleDuplicateCampaign = async () => {
    if (!selectedCampaign) return;
    
    const newName = prompt('Enter name for the duplicate campaign:', `${selectedCampaign.name} (Copy)`);
    if (!newName) return;

    try {
      const response = await fetch('http://localhost:3001/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: newName,
          duplicate_from: selectedCampaign.id 
        }),
      });

      if (!response.ok) throw new Error('Failed to duplicate campaign');

      const newCampaign = await response.json();
      selectCampaign(newCampaign);
      setIsOpen(false);
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      alert('Failed to duplicate campaign');
    }
  };

  const handleDeleteCampaign = async () => {
    if (!selectedCampaign) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete the campaign "${selectedCampaign.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:3001/api/campaigns/${selectedCampaign.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete campaign');

      selectCampaign(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign');
    }
  };

  return (
    <>
      <div 
        className="nav-header" 
        onClick={() => setIsOpen(true)}
      >
        <div className="nav-header-content">
          <Gear size={16} weight="regular" className="nav-header-icon" />
          <span className="nav-header-text">Campaign Settings</span>
        </div>
      </div>

      {isOpen && selectedCampaign && (
        <div className="dialog-overlay" onClick={() => setIsOpen(false)}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Campaign Settings</h2>
              <button className="dialog-close" onClick={() => setIsOpen(false)}>×</button>
            </div>
            
            <div className="dialog-content">
              <div className="dialog-section">
                <h3>Campaign Name</h3>
                <p className="campaign-current-name">{selectedCampaign.name}</p>
                <button className="dialog-button" onClick={handleRenameCampaign}>
                  Rename Campaign
                </button>
              </div>

              <div className="dialog-section">
                <h3>Campaign Actions</h3>
                <button className="dialog-button" onClick={handleDuplicateCampaign}>
                  Duplicate Campaign
                </button>
                <button className="dialog-button delete" onClick={handleDeleteCampaign}>
                  Delete Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const CampaignSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef(null);
  const { selectedCampaign, selectCampaign } = useCampaign();

  // Wait for context to initialize before fetching campaigns
  useEffect(() => {
    console.log('Context initialized, fetching campaigns...');
    fetchCampaigns();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCampaigns = async () => {
    try {
      console.log('Fetching campaigns, current selected:', selectedCampaign);
      const response = await fetch('http://localhost:3001/api/campaigns');
      const data = await response.json();
      console.log('Fetched campaigns:', data);
      setCampaigns(data);
      
      // Only auto-select if we have no selection and no stored ID
      if (!selectedCampaign && !localStorage.getItem('selectedCampaignId') && data.length > 0) {
        console.log('No campaign selected, auto-selecting first campaign');
        selectCampaign(data[0]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setIsLoading(false);
    }
  };

  const handleNewCampaign = async () => {
    const name = prompt('Enter campaign name:');
    if (!name) return;

    try {
      const response = await fetch('http://localhost:3001/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      const newCampaign = await response.json();
      console.log('Created new campaign:', newCampaign);
      setCampaigns([...campaigns, newCampaign]);
      selectCampaign(newCampaign);
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    }
  };

  const handleSelectCampaign = (campaign) => {
    console.log('Selecting campaign:', campaign);
    selectCampaign(campaign);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="campaign-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className="campaign-name">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-selector" ref={dropdownRef}>
      <div 
        className="campaign-info" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className="campaign-name">
              {selectedCampaign ? selectedCampaign.name : 'Select Campaign'}
            </div>
          </div>
        </div>
        <CaretDown 
          size={20} 
          weight="regular" 
          style={{ 
            color: '#1F2937',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s'
          }} 
        />
      </div>
      
      {isOpen && (
        <div className="campaign-dropdown">
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              className={`campaign-option ${campaign.id === selectedCampaign?.id ? 'active' : ''}`}
              onClick={() => handleSelectCampaign(campaign)}
            >
              {campaign.name}
            </div>
          ))}
          <div 
            className="new-campaign-button"
            onClick={handleNewCampaign}
          >
            <PlusCircle size={16} weight="regular" />
            <span>New Campaign</span>
          </div>
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ onMapChange }) => {
  const [maps, setMaps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [mapsExpanded, setMapsExpanded] = useState(true);
  const [combatExpanded, setCombatExpanded] = useState(false);
  const location = useLocation();
  const { selectedCampaign } = useCampaign();

  useEffect(() => {
    if (selectedCampaign) {
      console.log('Fetching maps for campaign:', selectedCampaign.id);
      fetchMaps();
    } else {
      // Clear maps if no campaign is selected
      setMaps([]);
    }
  }, [selectedCampaign?.id]); // Add .id to ensure it updates when campaign changes

  const fetchMaps = async () => {
    if (!selectedCampaign) {
      console.log('No campaign selected, skipping map fetch');
      setMaps([]);
      return;
    }

    try {
      console.log('Fetching maps from API for campaign:', selectedCampaign.id);
      const response = await fetch(`http://localhost:3001/api/maps?campaign_id=${selectedCampaign.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch maps: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched maps for campaign', selectedCampaign.id + ':', data);
      setMaps(data);
    } catch (error) {
      console.error('Error fetching maps:', error);
      setMaps([]);
    }
  };

  const handleUploadSuccess = async () => {
    console.log('Map upload successful, refreshing maps list');
    try {
      // Add a longer delay to ensure the server has processed the upload
      console.log('Waiting before fetching maps...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Fetching maps after upload...');
      await fetchMaps();
      
      if (onMapChange) {
        console.log('Calling onMapChange callback');
        onMapChange();
      }
    } catch (error) {
      console.error('Error refreshing maps after upload:', error);
    }
  };

  const moveMap = (dragIndex, hoverIndex) => {
    const dragMap = maps[dragIndex];
    const newMaps = [...maps];
    newMaps.splice(dragIndex, 1);
    newMaps.splice(hoverIndex, 0, dragMap);
    setMaps(newMaps);
  };

  const handleDragEnd = async () => {
    if (!selectedCampaign) return;

    // Save the new order to the backend
    const orderedIds = maps.map(map => map.id);
    try {
      const response = await fetch('http://localhost:3001/api/maps/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderedIds,
          campaign_id: selectedCampaign.id
        }),
      });
      if (!response.ok) throw new Error('Failed to reorder maps');
    } catch (error) {
      console.error('Error saving map order:', error);
      // Refresh maps list to ensure correct order
      fetchMaps();
    }
  };

  const filteredMaps = maps.filter(map => 
    map.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMapChange = async (change) => {
    console.log('Map change:', change);
    if (change.type === 'delete') {
      // Remove the deleted map from the local state
      setMaps(prevMaps => prevMaps.filter(map => map.id !== change.id));
    } else if (change.type === 'create') {
      // Add the new map to the local state
      setMaps(prevMaps => [...prevMaps, change.map]);
    } else {
      // Refresh maps list for other changes
      await fetchMaps();
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="sidebar">
        <Link to="/" className="sidebar-header">
          <BeerStein weight="regular" size={24} style={{ color: '#111827' }} />
          <span className="sidebar-logo-text">Flying Dog Inn VTT</span>
        </Link>

        <div className="search-input-container">
          <MagnifyingGlass size={20} weight="regular" className="search-icon" />
          <input
            type="text"
            placeholder="Search"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="nav-section">
          <Link 
            to="/" 
            className={`nav-header ${location.pathname === '/' ? 'active' : ''}`}
          >
            <div className="nav-header-content">
              <HouseLine weight="regular" size={24} className="nav-header-icon" />
              <span className="nav-header-text">Home</span>
            </div>
          </Link>

          <div 
            className={`nav-header ${mapsExpanded ? 'expanded' : ''}`}
            onClick={() => setMapsExpanded(!mapsExpanded)}
          >
            <div className="nav-header-content">
              <MapTrifold weight="regular" size={24} className="nav-header-icon" />
              <span className="nav-header-text">Maps</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="nav-header-badge">{maps.length}</span>
              <CaretDown 
                size={20} 
                weight="regular"
                style={{ 
                  transform: mapsExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s'
                }}
              />
            </div>
          </div>

          {mapsExpanded && (
            <>
              {filteredMaps.map((map, index) => (
                <DraggableMapItem
                  key={map.id}
                  map={map}
                  index={index}
                  moveMap={moveMap}
                  onClick={handleDragEnd}
                />
              ))}
              <div 
                className="add-map-button" 
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Add map clicked');
                  setUploadDialogOpen(true);
                }}
              >
                <PlusCircle size={16} weight="regular" />
                <span>Add map</span>
              </div>
            </>
          )}

          <div 
            className={`nav-header ${combatExpanded ? 'expanded' : ''}`}
            onClick={() => setCombatExpanded(!combatExpanded)}
          >
            <div className="nav-header-content">
              <Sword weight="regular" size={24} className="nav-header-icon" />
              <span className="nav-header-text">Combat</span>
            </div>
            <CaretDown 
              size={20} 
              weight="regular"
              style={{ 
                transform: combatExpanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s'
              }}
            />
          </div>

          {combatExpanded && (
            <Link to="/combat/loot" className={`nav-item ${location.pathname === '/combat/loot' ? 'active' : ''}`}>
              Here be loot
            </Link>
          )}

          <Link 
            to="/timeline" 
            className={`nav-header ${location.pathname === '/timeline' ? 'active' : ''}`}
          >
            <div className="nav-header-content">
              <Scroll weight="regular" size={24} className="nav-header-icon" />
              <span className="nav-header-text">Timeline</span>
            </div>
          </Link>

          <Link 
            to="/log" 
            className={`nav-header ${location.pathname === '/log' ? 'active' : ''}`}
          >
            <div className="nav-header-content">
              <BookOpen weight="regular" size={24} className="nav-header-icon" />
              <span className="nav-header-text">Log</span>
            </div>
          </Link>
        </div>

        <div className="sidebar-footer">
          <CampaignSettings />
          <CampaignSelector />
          <ConnectionStatus />
        </div>

        <MapUploadDialog
          isOpen={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onUpload={handleMapChange}
          campaignId={selectedCampaign?.id}
        />
      </div>
    </DndProvider>
  );
};

export default Sidebar; 