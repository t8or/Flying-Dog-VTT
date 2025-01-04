import React, { useState, useEffect } from 'react';

const History = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Fetch history data from the backend
    fetch('/api/history')
      .then(response => response.json())
      .then(data => setHistory(data));
  }, []);

  return (
    <div>
      <h2>History Page</h2>
      <ul>
        {history.map((action, index) => (
          <li key={index}>
            <strong>User ID:</strong> {action.userId} <br />
            <strong>Action:</strong> {action.action} <br />
            <strong>Timestamp:</strong> {action.timestamp}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default History;
