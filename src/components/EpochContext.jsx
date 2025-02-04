import { useEffect, useState } from "react";

const EpochContext = ({ data }) => {
  const formatNumber = (num) => new Intl.NumberFormat("en-US").format(num);

  const EPOCH_DURATION = 432000;
  const [timeElapsed, setTimeElapsed] = useState(
    Math.floor(Date.now() / 1000) - data.start_time
  );

  const getBarWidth = (percentage) => {
    return `${Math.min(percentage, 100)}%`; // Ensure the bar doesn't exceed 100%
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor(Date.now() / 1000) - data.start_time);
    }, 1000);

    return () => clearInterval(interval);
  }, [data.start_time]);

  const progressPercentage = (timeElapsed / EPOCH_DURATION) * 100;
  const timeRemaining = Math.max(EPOCH_DURATION - timeElapsed, 0);

  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  const formatCirculatingSupply = (circulatingSupply) => {
    return (circulatingSupply / 1_000_000_000).toFixed(2);
  };

  return (
    <div className="card bg-base-100 p-2 text-base-content">
      {/* Epoch Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Epoch {data.epoch} Progress</span>
          <span>{progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-base-300 h-1.5 rounded-sm">
          <div 
            className="h-full rounded-sm bg-primary" 
            style={{ width: getBarWidth(progressPercentage) }}
          ></div>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span>{formatNumber(timeElapsed)}s / {formatNumber(EPOCH_DURATION)}s</span>
          <span>Time Remaining: {formatTime(timeRemaining)}</span>
        </div>
      </div>

      {/* Circulating Supply */}
      <div className="flex justify-between mt-4 text-sm">
        <span>Circulating Supply:</span>
        <span>
          ₳ {formatCirculatingSupply(data.circulating_supply)}B (
          {data.circulating_proportion ? data.circulating_proportion.toFixed(2) : "N/A"}%)
        </span>
      </div>
    </div>
  );
};

export default EpochContext;