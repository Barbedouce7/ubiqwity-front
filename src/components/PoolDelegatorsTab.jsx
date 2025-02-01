import React from 'react';
import GetHandle from './GetHandle';
import CopyButton from './CopyButton';
import { useParams, Link } from 'react-router-dom';


const PoolDelegatorsTab = ({ delegators }) => {
  // Trier les délégateurs par live stake en ordre décroissant
  const sortedDelegators = [...delegators].sort((a, b) => b.liveStake - a.liveStake);

  // Calculer le total du live stake
  const totalStake = sortedDelegators.reduce((sum, d) => sum + d.liveStake, 0);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Delegators Live Stake Distribution</h2>
      <div className="p-0">
        {sortedDelegators.map((delegator, index) => {
          const stakeKey = delegator.address;
          const stakePercentage = totalStake > 0 ? (delegator.liveStake / totalStake) * 100 : 0;
          return (
            <div key={index} className="mb-4 rounded-lg bg-slate-900 p-4 relative">
              {/* Barre de proportion du stake */}
              <div
                className="absolute top-0 left-0 h-2 bg-sky-600 rounded-lg"
                style={{ width: `${stakePercentage}%` }}
              ></div>
              <GetHandle stakekey={stakeKey} />
              <p className="text-lg">
                Address: <CopyButton text={stakeKey} /> <Link className="text-cyan-200 hover:text-cyan-100" to={`/wallet/${stakeKey}`}>{stakeKey}</Link>
              </p>
              <p className="text-sm">Live Stake: {delegator.liveStake} ₳</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PoolDelegatorsTab;
