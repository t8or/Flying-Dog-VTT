import React, { useState } from 'react';
import { useCampaign } from '../contexts/CampaignContext';

const MapUploadDialog = ({ isOpen, onClose, onUpload }) => {
  const [mapName, setMapName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { selectedCampaign } = useCampaign();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Please select a valid image file');
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !mapName || !selectedCampaign.id) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('name', mapName);
    formData.append('campaign_id', selectedCampaign.id);

    try {
      const response = await fetch('http://localhost:3001/api/maps', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload map');
      }

      const newMap = await response.json();
      onClose();
      if (onUpload) {
        onUpload({ type: 'create', map: newMap });
      }
    } catch (error) {
      console.error('Error uploading map:', error);
      setError('Failed to upload map: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-header">
          <h2>Add New Map to {selectedCampaign?.name || 'Campaign'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="dialog-content">
            {!selectedCampaign && (
              <div className="warning-message">Please select a campaign before uploading a map.</div>
            )}
            <div className="form-group">
              <label>Map Name</label>
              <input
                type="text"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                placeholder="Enter map name"
                disabled={isUploading || !selectedCampaign}
              />
            </div>
            <div className="form-group">
              <label>Map Image</label>
              <input
                type="file"
                id="mapFile"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading || !selectedCampaign}
              />
              <label htmlFor="mapFile" className="button secondary">Choose File</label>
              <span className="file-info">
                {selectedFile ? selectedFile.name : 'No file chosen'}
              </span>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
          <div className="dialog-footer">
            <button 
              type="button" 
              className="button secondary" 
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="button primary"
              disabled={isUploading || !selectedCampaign}
            >
              {isUploading ? 'Uploading...' : 'Upload Map'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MapUploadDialog; 