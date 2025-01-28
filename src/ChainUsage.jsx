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
    <div className="card bg-slate-950 shadow-xl p-4">
      <div className="flex justify-between mb-4">
        <div>
          <div className="text-sm text-white">
            5 Min : {data.average_5min}%
          </div>
          {/* Barre de chargement */}
          <div className="w-full bg-gray-600 h-1.5 rounded-sm mt-1">
            <div
              className={`${getColor(data.average_5min)} h-full rounded-sm`}
              style={{ width: getBarWidth(data.average_5min) }}
            ></div>
          </div>
        </div>
        <div>
          <div className="text-sm text-white">
            1 Hour : {data.average_1h}%
          </div>
          {/* Barre de chargement */}
          <div className="w-full bg-gray-600 h-1.5 rounded-sm mt-1">
            <div
              className={`${getColor(data.average_1h)} h-full rounded-sm`}
              style={{ width: getBarWidth(data.average_1h) }}
            ></div>
          </div>
        </div>
        <div>
          <div className="text-sm text-white">
            24 Hour : {data.average_24h}%
          </div>
          {/* Barre de chargement */}
          <div className="w-full bg-gray-600 h-1.5 rounded-sm mt-1">
            <div
              className={`${getColor(data.average_24h)} h-full rounded-sm`}
              style={{ width: getBarWidth(data.average_24h) }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChainUsage;
