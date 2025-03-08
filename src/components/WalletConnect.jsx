import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import MessageModal from '../components/ModalPopup';
import { WalletIcon } from "@heroicons/react/24/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { shortener } from '../utils/utils';

const wallets = [
    { name: 'Eternl', id: 'eternl' },
    { name: 'Lace', id: 'lace' },
    { name: 'Typhon', id: 'typhoncip30' },
    { name: 'Vespr', id: 'vespr' },
    { name: 'Nami', id: 'nami' },
    { name: 'GeroWallet', id: 'gerowallet' },
    { name: 'NuFi', id: 'nufi' },
    { name: 'Begin', id: 'begin' },
];

// Utility function to convert hex to bytes
function hexToBytes(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }
    return bytes;
}

// Utility function to convert bytes to hex
function bytesToHex(bytes) {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

const WalletAuth = () => {
    const [message, setMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [walletApi, setWalletApi] = useState(null);
    const [currentWalletId, setCurrentWalletId] = useState(null);

    const { isAuthenticated, authenticateWallet, logout, checkAuthStatus } = useAuth();

    useEffect(() => {
        if (isAuthenticated && walletApi) {
            setIsWalletModalOpen(false);
        }
    }, [isAuthenticated, walletApi]);

    const showMessage = (msg) => {
        setMessage(msg);
        setIsModalOpen(true);
    };

    const hideMessage = () => {
        setIsModalOpen(false);
    };

    // Function to directly use the binary API instead of signData to avoid CBOR issues
const getSignatureDirect = async (api, address, message) => {
    console.log(`Signing with wallet: ${currentWalletId}`);
    
    try {
        // Log for debugging
        console.log("Address to sign with:", address);
        console.log("Message to sign:", message);
        
        // Standard approach that should work with most wallets
        const result = await api.signData(address, message);
        
        console.log("Raw signature result:", result);
        
        // Normaliser le résultat en fonction des différentes implémentations des wallets
        if (typeof result === 'string') {
            // Certains wallets renvoient directement la signature en hex
            return {
                signature: result,
                key: await api.getExtendedPublicKey() // Essayer d'obtenir la clé publique séparément
            };
        } else if (result && result.signature && result.key) {
            // Format standard qui contient signature et clé
            return result;
        } else if (result && result.signature) {
            // Seulement la signature, besoin d'obtenir la clé séparément
            return {
                signature: result.signature,
                key: await api.getExtendedPublicKey() || ''
            };
        } else {
            // Format inconnu, essayons de l'adapter
            console.warn("Format de signature inconnu:", result);
            return {
                signature: typeof result === 'object' ? JSON.stringify(result) : result,
                key: await api.getExtendedPublicKey() || ''
            };
        }
    } catch (error) {
        console.error(`Error signing with ${currentWalletId}:`, error);
        throw error;
    }
};

    const connectAndAuthenticate = async (walletId) => {
        try {
            // Store current wallet ID for wallet-specific logic
            setCurrentWalletId(walletId);
            
            // Check if the wallet extension is available
            if (!window.cardano || !window.cardano[walletId]) {
                throw new Error(`Wallet ${walletId} not installed`);
            }

            // Enable the wallet
            const api = await window.cardano[walletId].enable();
            if (!api) throw new Error(`Failed to enable ${walletId}`);
            setWalletApi(api);

            //console.log('Wallet API:', api);

            // Get the reward addresses
            const rewardAddresses = await api.getRewardAddresses();
            const stakeAddrBech32 = rewardAddresses[0];
            if (!stakeAddrBech32) throw new Error('Stake address not available');

            // Create an authentication message that includes the stake address
            const authMessage = `account: ${stakeAddrBech32}`;
            //console.log('Message to sign:', authMessage);

            showMessage('Requesting signature from wallet...');

            // Get the signature using our wallet-specific function
            const signatureResult = await getSignatureDirect(api, stakeAddrBech32, authMessage);
            //console.log('Signature result:', signatureResult);

            const signature = typeof signatureResult.signature === 'string' 
                ? signatureResult.signature 
                : JSON.stringify(signatureResult.signature);

            const publicKey = typeof signatureResult.key === 'string'
                ? signatureResult.key
                : JSON.stringify(signatureResult.key);


            showMessage('Signature generated, authenticating...');

            // Send to backend for verification
            const result = await authenticateWallet(
                stakeAddrBech32,
                signature,
                authMessage,
                publicKey
            );

            if (result.success) {
                await checkAuthStatus();
                showMessage('Connected successfully');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Connection error:', error);
            if (error.message.includes('user declined') || error.message.includes('cancelled')) {
                showMessage('Signing was declined. Please approve the signature in your wallet to proceed.');
            } else {
                showMessage(`Error: ${error.message}`);
            }
            setWalletApi(null);
        }

        setIsWalletModalOpen(false);
    };

    const disconnect = async () => {
        setWalletApi(null);
        setCurrentWalletId(null);
        await logout();
        showMessage('Disconnected');
    };

    const toggleWalletModal = () => {
        setIsWalletModalOpen(!isWalletModalOpen);
    };

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
                    {isAuthenticated && walletApi ? (
                        <span className="truncate">
                            {shortener(walletApi.stakeAddress) || 'Connected'}
                        </span>
                    ) : (
                        <>
                            <WalletIcon className="w-5 h-5" /> Connect Wallet
                        </>
                    )}
                </button>

                {isWalletModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                            onClick={() => setIsWalletModalOpen(false)}
                        ></div>

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