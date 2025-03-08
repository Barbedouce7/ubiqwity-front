import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../utils/AuthContext';
import MessageModal from '../components/ModalPopup';
import { WalletIcon } from "@heroicons/react/24/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { shortener } from '../utils/utils';
import Cookies from 'js-cookie';

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

const WalletAuth = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [walletApi, setWalletApi] = useState(null);
    const [stakeAddress, setStakeAddress] = useState('');

    const { isAuthenticated, authenticateWallet, logout, checkAuthStatus } = useAuth();

    // Restaurer l'état du wallet depuis les cookies
    useEffect(() => {
        const storedWalletId = Cookies.get('walletId');
        if (storedWalletId && !walletApi && isAuthenticated) {
            reconnectWallet(storedWalletId);
        }
    }, [isAuthenticated]);

    const showMessage = useCallback((msg) => {
        setMessage(msg);
        setIsModalOpen(true);
    }, []);

    const hideMessage = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    const reconnectWallet = async (walletId) => {
        try {
            if (window.cardano && window.cardano[walletId]) {
                const api = await window.cardano[walletId].enable();
                const rewardAddresses = await api.getRewardAddresses();
                setWalletApi(api);
                setStakeAddress(rewardAddresses[0]);
            }
        } catch (error) {
            console.error('Failed to reconnect wallet:', error);
            Cookies.remove('walletId');
            setWalletApi(null);
            setStakeAddress('');
        }
    };

    const signData = async (api, address, message) => {
        try {
            const result = await api.signData(address, message);
            return typeof result === 'string' ? {
                signature: result,
                key: await api.getExtendedPublicKey() || ''
            } : result;
        } catch (error) {
            console.error('Signing error:', error);
            throw error;
        }
    };

    const connectAndAuthenticate = async (walletId) => {
        try {
            if (!window.cardano || !window.cardano[walletId]) {
                throw new Error(`${walletId} wallet not installed`);
            }

            showMessage('Connecting to wallet...');
            const api = await window.cardano[walletId].enable();
            const rewardAddresses = await api.getRewardAddresses();
            const stakeAddr = rewardAddresses[0];

            if (!stakeAddr) {
                throw new Error('Unable to get stake address');
            }

            const authMessage = `account: ${stakeAddr}`;
            showMessage('Please sign the message in your wallet...');

            const { signature, key } = await signData(api, stakeAddr, authMessage);

            showMessage('Verifying signature...');
            const result = await authenticateWallet(
                stakeAddr,
                signature,
                authMessage,
                key
            );

            if (result.success) {
                setWalletApi(api);
                setStakeAddress(stakeAddr);
                Cookies.set('walletId', walletId, { expires: 7 });
                await checkAuthStatus();
                showMessage('Successfully connected');
            } else {
                throw new Error(result.message || 'Authentication failed');
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            showMessage(error.message.includes('declined') || error.message.includes('cancelled')
                ? 'Connection declined by user'
                : `Error: ${error.message}`);
            setWalletApi(null);
            setStakeAddress('');
            Cookies.remove('walletId');
        } finally {
            setIsWalletModalOpen(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            setWalletApi(null);
            setStakeAddress('');
            Cookies.remove('walletId');
            await logout();
            showMessage('Disconnected successfully');
        } catch (error) {
            console.error('Disconnect error:', error);
            showMessage('Error during disconnection');
        }
    };

    const getWalletLogoPath = (walletId) => `/assets/${walletId}.png`;

    return (
        <div className="p-2 max-w-md">
            <button
                className="btn-connect btn-primary w-full flex items-center gap-2 text-xs"
                onClick={() => setIsWalletModalOpen(true)}
            >
                {isAuthenticated && stakeAddress ? (
                    <span className="truncate">Connected</span>
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
                    />
                    <div className="relative z-10 bg-base-100 rounded-box shadow-xl p-4 w-64">
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
                                wallets.map((wallet) => (
                                    <li key={wallet.id} className="mb-1">
                                        <button
                                            onClick={() => connectAndAuthenticate(wallet.id)}
                                            className="w-full text-left py-2 px-3 rounded hover:bg-primary hover:text-white flex items-center gap-3"
                                        >
                                            <img
                                                src={getWalletLogoPath(wallet.id)}
                                                alt={`${wallet.name} logo`}
                                                className="w-6 h-6 object-contain"
                                                onError={(e) => e.target.src = '/assets/default-wallet.png'} // Fallback image
                                            />
                                            {wallet.name}
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <li>
                                    <button
                                        onClick={handleDisconnect}
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

            <MessageModal
                message={message}
                isOpen={isModalOpen}
                onClose={hideMessage}
            />
        </div>
    );
};

export default WalletAuth;