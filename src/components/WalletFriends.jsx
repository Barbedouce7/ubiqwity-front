import React, { useState, useEffect } from "react";
import { useParams, Link } from 'react-router-dom';
import { shortener } from '../utils/utils';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';


const WalletFriends = ({ stakekey, friendsData }) => {
  if (!friendsData) {
    return <p>No data available.</p>;
  }

  const sortedStakeKeys = Object.entries(friendsData.stakeKeyFrequency).sort(
    (a, b) => b[1] - a[1]
  );

  const maxFrequency = sortedStakeKeys[0]?.[1] || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {sortedStakeKeys.map(([stakeKey, frequency]) => (
        <div key={stakeKey} className="relative bg-base-100 shadow-lg rounded-xl p-4">
          <div
            className="absolute top-0 left-0 h-2 rounded-t-xl bg-primary"
            style={{ width: `${(frequency / maxFrequency) * 100}%` }}
          ></div>

          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-800 break-all">
              <Link className="text-primary hover:text-cyan-100" to={`/wallet/${stakeKey}`}>
                {shortener(stakeKey)}
              </Link>
            </h3>
            <p className="text-gray-600">Frequency : {frequency}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WalletFriends;