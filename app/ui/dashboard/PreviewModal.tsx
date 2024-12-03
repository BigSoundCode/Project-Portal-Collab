'use client';

import React from 'react';
import { DriveItem } from '@/app/lib/definitions';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem: DriveItem | null;
  folderImages: DriveItem[];
  onDownload: (id: string, name: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  currentItem,
  folderImages,
  onDownload,
  onNext,
  onPrevious
}) => {
  if (!isOpen || !currentItem) return null;

  const currentIndex = folderImages.findIndex(item => item.id === currentItem.id);
  const hasMultipleImages = folderImages.length > 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-4xl max-h-[90vh] w-full relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{currentItem.name}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onDownload(currentItem.id, currentItem.name)}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
              title="Download file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
              title="Close preview"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="relative">
          {hasMultipleImages && (
            <>
              <button
                onClick={onPrevious}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-r hover:bg-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentIndex === 0}
                title="Previous image"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={onNext}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-l hover:bg-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentIndex === folderImages.length - 1}
                title="Next image"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}
          
          <div className="overflow-auto max-h-[calc(90vh-120px)]">
            {currentItem.thumbnails?.[0]?.large?.url ? (
              <img 
                src={currentItem.thumbnails[0].large.url}
                alt={currentItem.name}
                className="max-w-full h-auto mx-auto"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <span className="text-gray-500">No preview available</span>
              </div>
            )}
          </div>
        </div>

        {hasMultipleImages && (
          <div className="mt-4 flex justify-center">
            <span className="text-sm text-gray-500">
              Image {currentIndex + 1} of {folderImages.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewModal;