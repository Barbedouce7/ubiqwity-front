import { useEffect, useState } from "react";
import { LinearProgress, Box } from "@mui/material";

const EpochContext = ({ data }) => {
  const formatNumber = (num) => new Intl.NumberFormat("en-US").format(num);

  const EPOCH_DURATION = 432000;
  const [timeElapsed, setTimeElapsed] = useState(
    Math.floor(Date.now() / 1000) - data.start_time
  );
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor(Date.now() / 1000) - data.start_time);
    }, 1000);

    return () => clearInterval(interval); 
  }, [data.start_time]);

  const progressPercentage = Math.min((timeElapsed / EPOCH_DURATION) * 100, 100);

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
    <div className="card bg-base-100  p-2 text-base-content">
      {/* Barre de progression de l'epoch */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Epoch {data.epoch} Progress</span>
          <span>{progressPercentage.toFixed(1)}%</span>
        </div>
        <Box position="relative">
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            className="bg-slate-900"
            color="primary"
            style={{ height: "1.5rem", borderRadius: "0.375rem" }} 
          />
          {/* Texte dans la barre de progression */}
          <Box
            position="absolute"
            top="50%"
            left="50%"
            style={{
              transform: "translate(-50%, -50%)",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: "bold",
            }}
          >
            {formatNumber(timeElapsed)}s / {formatNumber(EPOCH_DURATION)}s
          </Box>
        </Box>
        <div className="text-center text-sm mt-2">
          <span>Time Remaining: {formatTime(timeRemaining)}</span>
        </div>
      </div>

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