
import React from 'react';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { CloseIcon } from './icons/CloseIcon';
import { ImageIcon } from './icons/ImageIcon';
import { AnimationIcon } from './icons/AnimationIcon';

interface KeywordsSidebarProps {
  keywords: string[];
  onKeywordVisualize: (keyword: string) => void;
  onKeywordAnimate: (keyword: string) => void;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const SidebarContent: React.FC<Pick<KeywordsSidebarProps, 'isLoading' | 'keywords' | 'onKeywordVisualize' | 'onKeywordAnimate'>> = ({ isLoading, keywords, onKeywordVisualize, onKeywordAnimate }) => (
  <div className="p-4 flex-grow overflow-y-auto">
    {isLoading && (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-700 rounded-md animate-pulse"></div>
        ))}
      </div>
    )}
    {!isLoading && keywords.length === 0 && (
      <p className="text-sm text-gray-500 text-center mt-4">No key concepts identified in the last message.</p>
    )}
    {!isLoading && keywords.length > 0 && (
      <div className="flex flex-col space-y-2">
        {keywords.map((keyword, index) => (
           <div key={index} className="group flex items-center justify-between bg-gray-700 rounded-md text-sm text-gray-300 px-3 py-2">
            <span className="truncate pr-2">{keyword}</span>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => onKeywordVisualize(keyword)}
                className="p-1.5 rounded-full text-gray-400 hover:bg-accent-blue hover:text-white transition-colors"
                title={`Visualize ${keyword}`}
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onKeywordAnimate(keyword)}
                className="p-1.5 rounded-full text-gray-400 hover:bg-accent-green hover:text-white transition-colors"
                title={`Animate ${keyword}`}
              >
                <AnimationIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const KeywordsSidebar: React.FC<KeywordsSidebarProps> = ({ keywords, onKeywordVisualize, onKeywordAnimate, isLoading, isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Sidebar (Overlay) */}
      <div className="md:hidden">
        <div
          className={`fixed inset-0 bg-black bg-opacity-60 z-30 transition-opacity ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
          aria-hidden="true"
        />
        <aside
          className={`fixed top-0 right-0 h-full w-72 bg-gray-800 shadow-2xl border-l border-gray-700 z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sidebar-title"
        >
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
                <LightbulbIcon className="w-6 h-6 mr-3 text-accent-green" />
                <h2 id="sidebar-title" className="text-lg font-semibold text-gray-200">Key Concepts</h2>
            </div>
            <button 
                onClick={onClose} 
                className="p-1 rounded-full text-gray-400 hover:bg-gray-700" 
                aria-label="Close key concepts sidebar"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
          <SidebarContent isLoading={isLoading} keywords={keywords} onKeywordVisualize={onKeywordVisualize} onKeywordAnimate={onKeywordAnimate} />
        </aside>
      </div>

      {/* Desktop Sidebar (Static) */}
      <aside className="w-64 h-full flex-shrink-0 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 animate-fade-in hidden md:flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center">
          <LightbulbIcon className="w-6 h-6 mr-3 text-accent-green" />
          <h2 className="text-lg font-semibold text-gray-200">Key Concepts</h2>
        </div>
        <SidebarContent isLoading={isLoading} keywords={keywords} onKeywordVisualize={onKeywordVisualize} onKeywordAnimate={onKeywordAnimate} />
      </aside>
    </>
  );
};

export default KeywordsSidebar;
