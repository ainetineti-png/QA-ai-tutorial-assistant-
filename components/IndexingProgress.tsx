
import React, { useState, useEffect } from 'react';

const steps = [
  { text: "Connecting to knowledge base...", duration: 1000, progress: 15 },
  { text: "Scanning 27 files recursively...", duration: 1500, progress: 40 },
  { text: "Found 3 new files to index...", duration: 1000, progress: 60 },
  { text: "Creating embeddings (incremental update)...", duration: 1500, progress: 90 },
  { text: "Finalizing knowledge base...", duration: 1000, progress: 100 },
];

const IndexingProgress: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setProgress(steps[currentStep].progress);
      }, steps[currentStep].duration);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);
  
  const currentText = currentStep < steps.length ? steps[currentStep].text : "Knowledge base ready!";

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
        <div className="relative w-24 h-24 mb-6">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                    className="text-gray-700"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                />
                <circle
                    className="text-accent-blue"
                    strokeWidth="10"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (progress / 100) * 283}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-200">
                {progress}%
            </span>
        </div>

      <h2 className="text-2xl font-semibold mb-2 text-gray-100">Preparing Your Knowledge Base</h2>
      <p className="text-gray-400 mb-8 max-w-md h-6">
        {currentText}
      </p>
      <div className="w-full max-w-md bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-accent-blue h-2.5 rounded-full" 
          style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}
        ></div>
      </div>
       <p className="text-xs text-gray-600 mt-6 max-w-md">
        This is a one-time process for new files. Subsequent loads will be faster.
      </p>
    </div>
  );
};

export default IndexingProgress;
