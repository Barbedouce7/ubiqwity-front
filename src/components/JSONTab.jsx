import React from 'react';

function JSONTab({ data }) {
  return (
    <pre className="p-4 rounded-lg overflow-auto text-left bg-gray-900 text-green-400">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default JSONTab;