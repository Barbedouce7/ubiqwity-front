import React, { useState } from 'react';
import { useCardano } from '@cardano-foundation/cardano-connect-with-wallet';
import axios from 'axios';
import namiIcon from '/assets/nami.png';
import eternlIcon from '/assets/eternl.png';
import laceIcon from '/assets/lace.png';
import typhonIcon from '/assets/typhon.png';
import { API_CONFIG } from '../utils/apiConfig';



const WalletConnect = () => {
  const { isConnected, connect, disconnect, stakeAddress, signMessage } = useCardano();
  const [status, setStatus] = useState('');
  const [credit, setCredit] = useState(null);

  // Liste des wallets avec leurs icônes
  const wallets = [
    { name: 'Eternl', id: 'eternl', icon: eternlIcon },
    { name: 'Lace', id: 'lace', icon: laceIcon },
    { name: 'Typhon', id: 'typhon', icon: typhonIcon },
    { name: 'Nami', id: 'nami', icon: namiIcon },
  ];

  const handleConnect = (walletId) => {
    connect(walletId);
  };

  const handleDisconnect = () => {
    disconnect();
    setStatus('');
    setCredit(null);
  };

const handleAuthenticate = async () => {
  console.log('isConnected:', isConnected);
  if (!isConnected) {
    setStatus('Please connect your wallet.');
    return;
  }

  try {
    const message = `Authentication for daily credit - ${Date.now()}`;
    console.log('Message to sign:', message);

    if (typeof signMessage !== 'function') {
      throw new Error('This wallet does not support message signing.');
    }

    setStatus('Please sign the message in your wallet...');
    console.log('Calling signMessage...');

    // Vérification : Est-ce que signMessage est bien défini ?
    console.log('typeof signMessage:', typeof signMessage);

    const signature = await signMessage(message);

    // Vérifier ce que retourne exactement signMessage
    console.log('Raw signature result:', signature);

    if (!signature || typeof signature !== 'string' || signature.trim() === '') {
      setStatus('Signature was not provided. Please try again.');
      console.warn('No signature received. Possible wallet issue.');
      
      // 🔍 Vérification supplémentaire : Tester si le wallet peut signer
      if (stakeAddress) {
        console.warn('Wallet is connected but did not return a signature.');
      } else {
        console.warn('No stake address found. Wallet might not be fully connected.');
      }

      return;
    }

    console.log('Valid signature obtained:', signature);
    setStatus('Authentication in progress...');

    const response = await axios.post(
      `${API_CONFIG.baseUrl}authenticate`,
      {
        stakeAddress,
        signature,
        message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('Response received:', response.data);
    setCredit(response.data.credit);
    setStatus('Authentication successful!');
  } catch (error) {
    console.error('Authentication error:', error);
    setStatus(`Error: ${error.response?.data?.message || error.message || 'Authentication failed'}`);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">

          {/* Boutons de connexion/déconnexion */}
          {!isConnected ? (
            <div className="dropdown">
              <label tabIndex={0} className="btn btn-primary w-full">
                Connect Wallet
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full"
              >
                {wallets.map((wallet) => (
                  <li key={wallet.id}>
                    <button
                      className="btn btn-ghost justify-start flex items-center gap-2"
                      onClick={() => handleConnect(wallet.id)}
                    >
                      <img
                        src={wallet.icon}
                        alt={`${wallet.name} icon`}
                        className="w-6 h-6"
                      />
                      {wallet.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              <button className="btn btn-outline btn-error" onClick={handleDisconnect}>
                Disconnect
              </button>
              <div className="badge badge-success badge-lg w-full">
                Connected: {stakeAddress?.slice(0, 10)}...
              </div>
            </div>
          )}

          {/* Bouton d'authentification */}
          {isConnected && (
            <button
              className="btn btn-accent mt-4"
              onClick={handleAuthenticate}
            >
              Claim Daily Credit
            </button>
          )}

          {/* Messages d'état */}
          {status && (
            <div className={`alert ${status.includes('Error') ? 'alert-error' : 'alert-info'} mt-4`}>
              <span>{status}</span>
            </div>
          )}

          {/* Affichage du crédit */}
          {credit !== null && (
            <div className="stat bg-success text-success-content rounded-lg mt-4">
              <div className="stat-title">Credit Claimed</div>
              <div className="stat-value">{credit}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;