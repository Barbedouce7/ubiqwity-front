import React from 'react';
import GetHandle from './GetHandle';
import CopyButton from './CopyButton';
import { useParams, Link } from 'react-router-dom';
import { shortener } from '../utils/utils';
import { FormatNumberWithSpaces } from '../utils/FormatNumberWithSpaces';

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
            <div key={index} className="mb-4 rounded-lg bg-base-100 p-4 relative shadow-lg">
              {/* Barre de proportion du stake */}
              <div
                className="absolute top-0 left-0 h-full bg-sky-600 max-h-[10px] rounded-l-lg"
                style={{ width: `${stakePercentage}%` }}
              ></div>

              {/* Contenu de la carte */}
              <div className="relative z-10 flex justify-between items-center">
                <GetHandle stakekey={stakeKey} />
                <p className="text-sm font-semibold text-gray-700"><FormatNumberWithSpaces number={delegator.liveStake} /> ₳</p>
              </div>

              <p className="text-lg">
                <Link className="text-primary hover:text-cyan-100" to={`/wallet/${stakeKey}`}>
                  {shortener(stakeKey)}
                </Link>
                <CopyButton text={stakeKey} />
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PoolDelegatorsTab;
