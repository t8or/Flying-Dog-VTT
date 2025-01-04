import React, { useState, useEffect } from 'react';
import { BeerStein, MapTrifold, Sword, Clock, Users, CalendarCheck, Scroll } from '@phosphor-icons/react';
import { useCampaign } from '../contexts/CampaignContext';
import './Home.css';

const Home = () => {
  const [stats, setStats] = useState({
    totalMaps: 0,
    lastTimelineEvent: null,
    timelineEventCount: 0,
    lastActive: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const { selectedCampaign } = useCampaign();

  useEffect(() => {
    setIsLoading(true);
    if (selectedCampaign) {
      console.log('Fetching stats for campaign:', selectedCampaign.id);
      fetchStats();
    } else {
      setStats({
        totalMaps: 0,
        lastTimelineEvent: null,
        timelineEventCount: 0,
        lastActive: null
      });
      setIsLoading(false);
    }
  }, [selectedCampaign?.id]);

  const fetchStats = async () => {
    if (!selectedCampaign) return;
    
    try {
      console.log('Fetching campaign stats...');
      
      const mapsResponse = await fetch(`http://localhost:3001/api/maps?campaign_id=${selectedCampaign.id}`);
      if (!mapsResponse.ok) throw new Error('Failed to fetch maps');
      const maps = await mapsResponse.json();
      console.log('Found maps:', maps);
      
      const timelineResponse = await fetch(`http://localhost:3001/api/timeline?campaign_id=${selectedCampaign.id}`);
      if (!timelineResponse.ok) throw new Error('Failed to fetch timeline events');
      const timelineEvents = await timelineResponse.json();
      console.log('Found timeline events:', timelineEvents);
      
      const lastEvent = timelineEvents.length > 0 
        ? timelineEvents.reduce((latest, event) => 
            event.timestamp > latest.timestamp ? event : latest
          )
        : null;

      setStats({
        totalMaps: maps.length,
        lastTimelineEvent: lastEvent,
        timelineEventCount: timelineEvents.length,
        lastActive: lastEvent ? new Date(parseInt(lastEvent.timestamp)) : null
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalMaps: 0,
        lastTimelineEvent: null,
        timelineEventCount: 0,
        lastActive: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'No activity';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getRelativeTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (minutes < 60) return `${minutes} minutes ago at ${timeStr}`;
    if (hours < 24) return `${hours} hours ago at ${timeStr}`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const StatCard = ({ icon: Icon, title, value, date }) => (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={24} weight="regular" />
      </div>
      <div className="stat-content">
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
        {date && (
          <small className="stat-date">
            {getRelativeTime(date)}
          </small>
        )}
      </div>
    </div>
  );

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-header">
          <BeerStein size={48} weight="regular" style={{ color: '#111827' }} />
          <div>
            <h1 className="home-title">
              {selectedCampaign ? selectedCampaign.name : 'Welcome to Flying Dog Inn VTT'}
            </h1>
            <p className="home-subtitle">
              {selectedCampaign ? 'Campaign Overview' : 'Please select a campaign to get started'}
            </p>
          </div>
        </div>

        {selectedCampaign ? (
          <>
            <div className="stats-section">
              <h2 className="stats-title">Campaign Stats</h2>
              <div className="stats-grid">
                <StatCard 
                  icon={MapTrifold}
                  title="Total Maps"
                  value={isLoading ? 'Loading...' : stats.totalMaps}
                />
                <StatCard 
                  icon={Scroll}
                  title="Timeline Events"
                  value={isLoading ? 'Loading...' : stats.timelineEventCount}
                />
                <StatCard 
                  icon={CalendarCheck}
                  title="Last Activity"
                  value={isLoading ? 'Loading...' : (stats.lastActive ? formatDate(stats.lastActive) : 'No activity')}
                  date={stats.lastActive}
                />
              </div>
            </div>

            {stats.lastTimelineEvent && (
              <div className="latest-event">
                <h2 className="latest-event-title">Latest Timeline Event</h2>
                <div className="event-card">
                  <h3 className="event-name">{stats.lastTimelineEvent.event}</h3>
                  <p className="event-details" style={{ whiteSpace: 'pre-wrap' }}>{stats.lastTimelineEvent.details}</p>
                  <small className="event-date">
                    {new Date(parseInt(stats.lastTimelineEvent.timestamp)).toLocaleDateString()}
                  </small>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="no-campaign">
            Please select a campaign from the sidebar to view stats and information.
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 