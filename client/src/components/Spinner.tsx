
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="mt-4 text-white text-lg font-semibold">Processing Transaction...</p>
      </div>
    </div>
  );
};

export default Spinner;
