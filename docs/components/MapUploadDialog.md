# MapUploadDialog Component Documentation

## Overview

The MapUploadDialog component provides a user interface for uploading and managing map images, supporting drag-and-drop functionality and progress tracking.

## Component Location

```
src/components/MapUploadDialog.js
```

## Core Features

### File Upload Interface

1. Drag and Drop Zone
```javascript
<DropZone
  onDrop={handleFileDrop}
  accept="image/*"
  maxSize={10485760} // 10MB
>
  <div className="upload-prompt">
    <UploadIcon />
    <p>Drag and drop a map image or click to select</p>
  </div>
</DropZone>
```

2. File Selection
```javascript
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (validateFile(file)) {
    setSelectedFile(file);
    handleUpload(file);
  }
};
```

## Component Architecture

### Main Components

1. **UploadDialog**
   - Modal container
   - Upload interface
   - Progress tracking
   - Error display

2. **DropZone**
   - Drag and drop area
   - File type validation
   - Size restrictions
   - Visual feedback

3. **ProgressBar**
   - Upload progress
   - Status indication
   - Cancel option

## State Management

### Upload State
```javascript
const [selectedFile, setSelectedFile] = useState(null);
const [uploadProgress, setUploadProgress] = useState(0);
const [isUploading, setIsUploading] = useState(false);
const [error, setError] = useState(null);
```

### Dialog State
```javascript
const [isOpen, setIsOpen] = useState(false);
const [mapName, setMapName] = useState('');
const [campaign, setCampaign] = useState(null);
```

## API Integration

### Upload Operations

1. File Upload
```javascript
const handleUpload = async (file) => {
  const formData = new FormData();
  formData.append('map', file);
  formData.append('name', mapName);
  formData.append('campaign_id', campaign.id);

  try {
    const response = await axios.post(
      'http://localhost:3001/api/maps',
      formData,
      {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        }
      }
    );
    onUploadSuccess(response.data);
  } catch (error) {
    handleUploadError(error);
  }
};
```

2. Validation
```javascript
const validateFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    setError('Invalid file type. Please upload an image file.');
    return false;
  }
  if (file.size > 10485760) {
    setError('File too large. Maximum size is 10MB.');
    return false;
  }
  return true;
};
```

## Event Handling

### Upload Events

1. File Drop
```javascript
const handleFileDrop = (acceptedFiles) => {
  const file = acceptedFiles[0];
  if (validateFile(file)) {
    setSelectedFile(file);
    handleUpload(file);
  }
};
```

2. Upload Cancel
```javascript
const handleCancel = () => {
  if (uploadController) {
    uploadController.abort();
  }
  setIsUploading(false);
  setUploadProgress(0);
};
```

## Styling System

### Dialog Layout
```css
.upload-dialog {
  width: 500px;
  padding: 24px;
  border-radius: 8px;
  background: white;
}
```

### Drop Zone Styling
```css
.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  transition: border-color 0.3s ease;
}

.drop-zone.active {
  border-color: #2196f3;
}
```

## Error Handling

1. Upload Errors
```javascript
const handleUploadError = (error) => {
  setError(error.response?.data?.message || 'Upload failed');
  setIsUploading(false);
  setUploadProgress(0);
};
```

2. Validation Errors
```javascript
const handleValidationError = (message) => {
  setError(message);
  setSelectedFile(null);
};
```

## Performance Optimization

1. File Processing
   - Image compression
   - Chunk upload
   - Progress tracking

2. UI Responsiveness
   - Debounced inputs
   - Optimistic updates
   - Loading states

## Integration Points

1. Campaign Integration
   - Campaign selection
   - Permission validation
   - Map organization

2. Map Management
   - Map metadata
   - Preview generation
   - Grid configuration

## Development Notes

1. Upload Process
   - File validation
   - Progress tracking
   - Error recovery

2. UI/UX Considerations
   - Drag and drop feedback
   - Progress indication
   - Error messaging

## Testing Considerations

1. Component Tests
   - File validation
   - Upload process
   - Error handling

2. Integration Tests
   - API integration
   - Campaign integration
   - Error scenarios 