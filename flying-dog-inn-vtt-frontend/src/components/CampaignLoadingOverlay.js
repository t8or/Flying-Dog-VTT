import React, { useState, useEffect, useRef } from 'react';
import { BeerStein } from "@phosphor-icons/react";
import './CampaignLoadingOverlay.css';

const loadingPhrases = [
  'Swapping campaigns',
  'Preparing maps and logs',
  'Retreiving treasure',
  'How do you want to do this?'
];

// Box-Muller transform for normal distribution
const normalRandom = (min, max) => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  
  // Convert to range [0,1]
  num = (num + 2.5) / 5;
  // Clamp to [0,1]
  num = Math.min(Math.max(num, 0), 1);
  
  // Scale to our desired range
  return min + (num * (max - min));
};

const generateStepDurations = () => {
  return loadingPhrases.map(() => {
    // Generate a duration between 1000ms and 3000ms with normal distribution
    return Math.round(normalRandom(1000, 3000));
  });
};

const CampaignLoadingOverlay = ({ isVisible, onLoadComplete }) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const timeoutRef = useRef(null);
  const stepDurationsRef = useRef([]);

  useEffect(() => {
    if (!isVisible) {
      setCurrentPhraseIndex(0);
      setProgress(0);
      setIsExiting(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Generate new random durations when overlay becomes visible
    stepDurationsRef.current = generateStepDurations();
    const totalDuration = stepDurationsRef.current.reduce((a, b) => a + b, 0);
    
    // Progress per phrase (leaving last bit for final state)
    const progressPerPhrase = 90 / loadingPhrases.length;
    setProgress(progressPerPhrase);

    const runNextStep = (index) => {
      if (index >= loadingPhrases.length) {
        // Final progress push
        setProgress(100);
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(onLoadComplete, 1000);
        }, 500);
        return;
      }

      timeoutRef.current = setTimeout(() => {
        if (index < loadingPhrases.length - 1) {
          setCurrentPhraseIndex(index + 1);
          setProgress((index + 2) * progressPerPhrase);
          runNextStep(index + 1);
        } else {
          runNextStep(loadingPhrases.length); // Trigger final state
        }
      }, stepDurationsRef.current[index]);
    };

    // Start the sequence
    runNextStep(0);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, onLoadComplete]);

  if (!isVisible) return null;

  return (
    <div className={`campaign-loading-overlay ${isExiting ? 'exiting' : ''}`}>
      <div className="campaign-loading-content">
        <BeerStein 
          weight="regular" 
          size={64} 
          className="campaign-loading-icon"
        />
        
        <div className="campaign-loading-phrases">
          {loadingPhrases.map((phrase, index) => (
            <div
              key={phrase}
              className={`campaign-loading-phrase ${index === currentPhraseIndex ? 'active' : ''}`}
            >
              {phrase}
            </div>
          ))}
        </div>

        <div className="campaign-loading-progress-container">
          <div 
            className="campaign-loading-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default CampaignLoadingOverlay; 