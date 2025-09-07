import React from 'react';

interface LoadingKnowledgeBaseProps {
    folderUrl: string;
}

const LoadingKnowledgeBase: React.FC<LoadingKnowledgeBaseProps> = ({ folderUrl }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
        <div className="relative w-24 h-24 mb-6">
            <svg className="w-full h-full animate-spin-slow" viewBox="0 0 100 100">
                <circle
                    className="text-gray-700"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                />
                <circle
                    className="text-accent-blue"
                    strokeWidth="8"
                    strokeDasharray="141.3" // 2 * pi * 45 / 2
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
            </svg>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gray-800 shadow-inner"></div>
            </div>
        </div>

      <h2 className="text-2xl font-semibold mb-2 text-gray-100">Loading Knowledge Base</h2>
      <p className="text-gray-400 mb-8 max-w-md h-6">
        Please wait while we connect to the shared knowledge base...
      </p>
      
      {folderUrl && (
         <div className="text-xs text-gray-500 mt-6 max-w-md truncate px-4">
            Source: {folderUrl}
        </div>
      )}
    </div>
  );
};

export default LoadingKnowledgeBase;
