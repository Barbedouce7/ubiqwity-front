import React from 'react';

function JSONTab({ data }) {
  return (
    <pre className="p-4 rounded-lg overflow-auto text-left text-base-content bg-base-100 shadow-xl">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default JSONTab;