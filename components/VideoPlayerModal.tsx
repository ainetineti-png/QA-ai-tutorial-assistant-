
import React from 'react';
import { YouTubeVideo } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface VideoPlayerModalProps {
  video: YouTubeVideo | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, isLoading, error, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-3xl flex flex-col m-4 animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-200 truncate pr-4">
            {isLoading && !video?.title.startsWith("Searching") ? "Finding Video..." : (video?.title || "Video Explainer")}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors flex-shrink-0"
            aria-label="Close video player"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-grow flex items-center justify-center p-1 sm:p-4 bg-black rounded-b-xl aspect-video">
          {isLoading && (
            <div className="text-center text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-r-2 border-accent-blue mx-auto mb-4"></div>
              <p>Finding the best video for you...</p>
              <p className="text-sm text-gray-500">{video?.title}</p>
            </div>
          )}
          {error && !isLoading && (
             <div className="text-center text-red-400 p-4 bg-red-900/20 rounded-lg">
                <p className='font-semibold'>Video Search Failed</p>
                <p className="text-sm">{error}</p>
            </div>
          )}
          {!isLoading && video && video.videoId && (
            <iframe
              className="w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          )}
        </main>
      </div>
    </div>
  );
};

export default VideoPlayerModal;
