import React, { useState, useEffect } from 'react';
import * as csl from '@emurgo/cardano-serialization-lib-browser';
import { Buffer } from 'buffer';
import { useAuth } from '../utils/AuthContext';
import MessageModal from '../components/ModalPopup';
import { WalletIcon } from "@heroicons/react/24/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";

const wallets = [
    { name: 'Eternl', id: 'eternl' },
    { name: 'Lace', id: 'lace' },
    { name: 'Typhon', id: 'typhoncip30' },
    { name: 'Vespr', id: 'vespr' },
    { name: 'Nami', id: 'nami' },
    { name: 'Gero', id: 'gerowallet' },
    { name: 'Nufi', id: 'nufi' },
];

const WalletAuth = () => {
    const [wallet, setWallet] = useState(null);
    const [stakeAddress, setStakeAddress] = useState('');
    const [message, setMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    
    const { isAuthenticated, authenticateWallet, logout, checkAuthStatus } = useAuth();

    useEffect(() => {
        if (isAuthenticated && stakeAddress) {
            setIsWalletModalOpen(false);
        }
    }, [isAuthenticated, stakeAddress]);

    const getStakeAddress = async (walletApi) => {
        if (!walletApi) return ['', ''];
        try {
            const networkId = await walletApi.getNetworkId();
            const changeAddrHex = await walletApi.getChangeAddress();
            const changeAddress = csl.Address.from_bytes(Buffer.from(changeAddrHex, 'hex'));
            const stakeCredential = csl.BaseAddress.from_address(changeAddress).stake_cred();
            const stakeAddress = csl.RewardAddress.new(networkId, stakeCredential).to_address();
            return [
                Buffer.from(stakeAddress.to_bytes()).toString('hex'),
                stakeAddress.to_bech32()
            ];
        } catch (error) {
            showMessage(`Stake address error: ${error.message}`);
            return ['', ''];
        }
    };

    const showMessage = (msg) => {
        setMessage(msg);
        setIsModalOpen(true);
    };

    const hideMessage = () => {
        setIsModalOpen(false);
    };
   
    const connectAndAuthenticate = async (walletId) => {
        if (!window.cardano) {
            showMessage('No Cardano wallet extension found. Please install one.');
            return;
        }

        if (!window.cardano[walletId]) {
            showMessage(`Wallet ${walletId} not detected. Try another wallet.`);
            return;
        }

        try {
            const walletApi = await window.cardano[walletId].enable();
            setWallet(walletApi);

            const [stakeAddrHex, stakeAddrBech32] = await getStakeAddress(walletApi);
            if (!stakeAddrBech32) throw new Error('Failed to get stake address');
            setStakeAddress(stakeAddrBech32);

            const authMessage = `account: ${stakeAddrBech32}`;
            const messageHex = Buffer.from(authMessage).toString('hex');
            const sigData = await walletApi.signData(stakeAddrHex, messageHex);

            showMessage('Signature generated, sending to backend...');

            const result = await authenticateWallet(stakeAddrBech32, sigData, authMessage);
            
            if (result.success) {
                await checkAuthStatus(); // Force la mise à jour du statut
                showMessage('Connected successfully');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Connection error:', error);
            showMessage(`Error: ${error.response?.data?.message || error.message}`);
            setWallet(null);
            setStakeAddress('');
        }
        
        setIsWalletModalOpen(false);
    };

    const disconnect = async () => {
        setWallet(null);
        setStakeAddress('');
        await logout();
        showMessage('Disconnected');
        setIsWalletModalOpen(false);
    };

    const toggleWalletModal = () => {
        if (!isAuthenticated && !window.cardano) {
            showMessage('No Cardano wallet extension detected');
            return;
        }
        setIsWalletModalOpen(!isWalletModalOpen);
    };

    // Helper function to get the correct logo path
    const getWalletLogoPath = (walletId) => {
        return `/assets/${walletId}.png`;
    };

    return (
        <div className="p-2 max-w-md">
            <div className="text-xs">
                <button
                    className="btn-connect btn-primary w-full flex items-center gap-2"
                    onClick={toggleWalletModal}
                >
                    {isAuthenticated ? (
                        <span className="truncate max-w-[120px]">
                            {stakeAddress || 'Connected'}
                        </span>
                    ) : (
                     <>
                          <WalletIcon className="w-5 h-5" /> Log in
                      </>
                    )}
                </button>
                
                {/* Modal with backdrop overlay */}
                {isWalletModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Blurred backdrop overlay */}
                        <div 
                            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                            onClick={() => setIsWalletModalOpen(false)}
                        ></div>
                        
                        {/* Modal content */}
                        <div className="relative z-10 bg-base-100 rounded-box shadow-xl p-4 w-64 max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">
                                    {isAuthenticated ? 'Wallet Options' : 'Select Wallet'}
                                </h3>
                                <button 
                                    onClick={() => setIsWalletModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                            
                            <ul className="p-2 w-full">
                                {!isAuthenticated ? (
                                    wallets.map((w) => (
                                        <li key={w.id} className="mb-1">
                                            <button
                                                onClick={() => connectAndAuthenticate(w.id)}
                                                className="w-full text-left py-2 px-3 rounded hover:bg-primary hover:text-white flex items-center gap-3"
                                            >
                                                <img 
                                                    src={getWalletLogoPath(w.id)} 
                                                    alt={`${w.name} logo`} 
                                                    className="w-6 h-6 object-contain"
                                                />
                                                {w.name}
                                            </button>
                                        </li>
                                    ))
                                ) : (
                                    <li>
                                        <button
                                            onClick={disconnect}
                                            className="w-full text-left py-2 px-3 rounded text-error hover:bg-error hover:text-white flex items-center gap-3"
                                        >
                                            <WalletIcon className="w-5 h-5" />
                                            Disconnect
                                        </button>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <MessageModal 
                message={message} 
                isOpen={isModalOpen} 
                onClose={hideMessage} 
            />
        </div>
    );
};

export default WalletAuth;