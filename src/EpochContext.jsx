import { useEffect, useState } from "react";
import { LinearProgress, Box } from "@mui/material";

const EpochContext = ({ data }) => {
  const formatNumber = (num) => new Intl.NumberFormat("en-US").format(num);

  // Constante pour la durée totale d'une epoch (en secondes)
  const EPOCH_DURATION = 432000;

  // État pour le temps écoulé (live)
  const [timeElapsed, setTimeElapsed] = useState(
    Math.floor(Date.now() / 1000) - data.start_time
  );

  // Mettre à jour le temps écoulé toutes les secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor(Date.now() / 1000) - data.start_time);
    }, 1000);

    return () => clearInterval(interval); // Nettoyer l'interval à la fin
  }, [data.start_time]);

  // Calculer le pourcentage pour la barre de progression
  const progressPercentage = Math.min((timeElapsed / EPOCH_DURATION) * 100, 100);

  // Calculer le temps restant en secondes
  const timeRemaining = Math.max(EPOCH_DURATION - timeElapsed, 0);

  // Formater le temps sous la forme humaine : "1d 3h 22m 5s"
  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400); // 1 jour = 86400 secondes
    const hours = Math.floor((seconds % 86400) / 3600); // Heures restantes
    const minutes = Math.floor((seconds % 3600) / 60); // Minutes restantes
    const secs = seconds % 60; // Secondes restantes
  return `${days}d ${hours}h ${minutes}m ${secs}s`; 
  };

  // Convertir en milliards et formater avec le symbole "₳"
  const formatCirculatingSupply = (circulatingSupply) => {
    return (circulatingSupply / 1_000_000_000).toFixed(2); // En milliards
  };

  return (
    <div className="card bg-slate-950 shadow-xl text-white p-4">
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
            className="bg-slate-800"
            color="primary"
            style={{ height: "1.5rem", borderRadius: "0.375rem" }} // Barre plus grande et arrondie
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
        {/* Temps restant en humain */}
        <div className="text-center text-sm mt-2">
          <span>Time Remaining: {formatTime(timeRemaining)}</span>
        </div>
      </div>

      {/* Affichage de la Circulating Supply */}
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