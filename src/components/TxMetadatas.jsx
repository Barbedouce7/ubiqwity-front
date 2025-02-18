import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const TxMetadatas = ({ data = [] }) => {
  const [expandedItems, setExpandedItems] = React.useState({});

  const toggleExpand = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const renderMetadataContent = (metadata) => {
    if (Array.isArray(metadata)) {
      return (
        <div className="pl-4">
          {metadata.map((item, idx) => (
            <div key={idx} className="text-sm py-1">
              {typeof item === 'object' 
                ? JSON.stringify(item, null, 2)
                : item}
            </div>
          ))}
        </div>
      );
    }
    
    if (typeof metadata === 'object') {
      return (
        <div className="pl-4">
          {Object.entries(metadata).map(([key, value], idx) => (
            <div key={idx} className="py-1">
              <span className="font-medium">{key}: </span>
              <span className="opacity-80">
                {Array.isArray(value) 
                  ? value.join(', ')
                  : JSON.stringify(value)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return <div className="pl-4 opacity-80">{metadata}</div>;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">      
      {data.map((item, index) => (
        <div 
          key={index}
          className="border border-gray-500 rounded-lg overflow-hidden"
        >
          <div className="p-4">
            {item.label && (
              <div className="font-medium text-gray-700 mb-2">
                <span className="mr-2 px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {item.label}
                </span>
                {item.label === "message" && <span>674</span>}
              </div>
            )}
            {renderMetadataContent(item.json_metadata)}
          </div>

          <div
            onClick={() => toggleExpand(index)}
            className="flex justify-between items-center p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-500">JSON Details</span>
            {expandedItems[index] ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            )}
          </div>

          {expandedItems[index] && (
            <div className="p-4 bg-white">
              <pre className="text-xs text-gray-500 overflow-x-auto">
                {JSON.stringify(item, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TxMetadatas;