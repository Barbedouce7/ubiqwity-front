const ChainUsage = ({ data }) => {
  const getColor = (value) => {
    if (value <= 10) return "bg-green-500";
    if (value <= 30) return "bg-green-400";
    if (value <= 50) return "bg-yellow-400";
    if (value <= 70) return "bg-yellow-300";
    if (value <= 85) return "bg-orange-400";
    if (value <= 95) return "bg-orange-500";
    return "bg-red-500";
  };

  const getBarWidth = (percentage) => {
    return `${Math.min(percentage, 100)}%`; // Assurer que la barre ne dépasse pas 100%
  };

  return (
<div className="card bg-base-100 shadow-xl p-4 mt-6 mb-6">
  <div className="flex justify-between mb-4 text-base-content">
    <div>
      <div className="text-sm">
        5 Min : {data.average_5min}%
      </div>
      {/* Barre de chargement */}
      <div className="w-full bg-base-300 h-1.5 rounded-sm mt-1">
        <div
          className={`h-full rounded-sm ${getColor(data.average_5min)}`}
          style={{ width: getBarWidth(data.average_5min) }}
        ></div>
      </div>
    </div>
    <div>
      <div className="text-sm">
        1 Hour : {data.average_1h}%
      </div>
      {/* Barre de chargement */}
      <div className="w-full bg-base-300 h-1.5 rounded-sm mt-1">
        <div
          className={`h-full rounded-sm ${getColor(data.average_1h)}`}
          style={{ width: getBarWidth(data.average_1h) }}
        ></div>
      </div>
    </div>
    <div>
      <div className="text-sm">
        24 Hour : {data.average_24h}%
      </div>
      {/* Barre de chargement */}
      <div className="w-full bg-base-300 h-1.5 rounded-sm mt-1">
        <div
          className={`h-full rounded-sm ${getColor(data.average_24h)}`}
          style={{ width: getBarWidth(data.average_24h) }}
        ></div>
      </div>
    </div>
  </div>
</div>
  );
};

export default ChainUsage;
