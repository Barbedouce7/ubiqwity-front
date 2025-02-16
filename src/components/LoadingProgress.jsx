import React, { useEffect, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/solid';

const LoadingProgress = ({ totalTransactions, nbAddresses }) => {
  const [stage, setStage] = useState('addresses'); // 'addresses', 'transactions', 'finishing'
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(0);
  const speed = 1.77;

  useEffect(() => {
    let duration, step, total;
    
    if (stage === 'addresses') {
      total = nbAddresses;
    } else if (stage === 'transactions') {
      total = totalTransactions;
    } else {
      return;
    }
    
    duration = total / speed;
    step = 100 / duration;
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          if (stage === 'addresses') {
            setStage('transactions');
            return 0;
          } else if (stage === 'transactions') {
            setStage('finishing');
          }
          return 100;
        }
        return prev + step;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [stage, totalTransactions, nbAddresses, speed]);

  useEffect(() => {
    if (stage === 'addresses') {
      setCount(Math.floor((progress / 100) * nbAddresses));
    } else if (stage === 'transactions') {
      setCount(Math.floor((progress / 100) * totalTransactions));
    }
  }, [progress, totalTransactions, nbAddresses, stage]);

  const renderText = () => {
    if (stage === 'finishing') {
      return (
        <div className="flex items-center gap-2">
          <span>Finishing...</span>
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
        </div>
      );
    }

    const total = stage === 'addresses' ? nbAddresses : totalTransactions;
    return (
      <div className="flex justify-between w-full">
        <span>
          {stage === 'addresses' ? 'Addresses' : 'Transactions'} {count.toLocaleString()} / {total.toLocaleString()}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
    );
  };

  return (
    <div className="card w-full max-w-md mx-auto mt-4 bg-base-100">
      <div className="card-body p-4">
        <div className="text-sm mb-2">
          {renderText()}
        </div>
        {stage !== 'finishing' && (
          <progress 
            className="progress progress-primary w-full" 
            value={progress} 
            max="100"
          />
        )}
      </div>
    </div>
  );
};

export default LoadingProgress;