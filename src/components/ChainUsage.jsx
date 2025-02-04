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
    <div className="bg-base-100">
            <h4 className="text-xl font-bold text-base-content">Network load :</h4>
      <div className="flex justify-between mb-4 text-base-content">
        {["average_5min", "average_1h", "average_24h"].map((timeframe, index) => (
          <div key={index} className="text-sm">
            <div>
              {timeframe === "average_5min" ? "5 Min" : 
               timeframe === "average_1h" ? "1 Hour" : "24 Hour"} : {data[timeframe]}%
            </div>
            {/* Barre de chargement */}
            <div className="w-full bg-base-300 h-1.5 rounded-sm mt-1">
              <div
                className={`h-full rounded-sm ${getColor(data[timeframe])}`}
                style={{ width: getBarWidth(data[timeframe]) }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChainUsage;