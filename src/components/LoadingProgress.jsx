import React, { useEffect, useState } from 'react';

const LoadingProgress = ({ totalTransactions }) => {
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(0);
  const speed = 1.777; // Vitesse de base, peut être ajustée manuellement

  useEffect(() => {
    let duration = totalTransactions / speed; // Calcul de la durée en fonction du total et de la vitesse
    let step = 100 / duration; // Calcul de l'augmentation de progression par intervalle

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + step;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [totalTransactions, speed]);

  useEffect(() => {
    setCount(Math.floor((progress / 100) * totalTransactions));
  }, [progress, totalTransactions]);

  return (
    <div className="w-full max-w-md mx-auto mt-4">
      <div className="mb-2 flex justify-between text-sm">
        <span>{count.toLocaleString()} / {totalTransactions.toLocaleString()} transactions</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-sky-500 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default LoadingProgress;