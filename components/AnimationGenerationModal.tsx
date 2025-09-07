
import React from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface AnimationGenerationModalProps {
  keyword: string;
  videoUrl: string | null;
  isLoading: boolean;
  statusMessage: string;
  error: string | null;
  onClose: () => void;
}

const AnimationGenerationModal: React.FC<AnimationGenerationModalProps> = ({ keyword, videoUrl, isLoading, statusMessage, error, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl flex flex-col m-4 animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-200">
            Animating: <span className="text-accent-green">{keyword}</span>
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Close animation modal"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-grow flex items-center justify-center p-4 relative aspect-video bg-black rounded-b-xl">
          {isLoading && (
            <div className="text-center text-gray-400 p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-r-2 border-accent-green mx-auto mb-6"></div>
              <p className="font-semibold text-lg text-gray-300 mb-2">{statusMessage || 'Initializing...'}</p>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">AI animation is a new technology and can take a few minutes. Thanks for your patience!</p>
            </div>
          )}
          {error && !isLoading && (
             <div className="text-center text-red-400 p-4 bg-red-900/20 rounded-lg">
                <p className='font-semibold'>Animation Failed</p>
                <p className="text-sm">{error}</p>
            </div>
          )}
          {!isLoading && videoUrl && (
            <video
              key={videoUrl}
              src={videoUrl}
              className="max-w-full max-h-full object-contain rounded-lg animate-fade-in"
              autoPlay
              loop
              muted
              playsInline
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default AnimationGenerationModal;
