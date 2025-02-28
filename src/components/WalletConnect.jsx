import React, { useState, useEffect } from 'react';
import * as csl from '@emurgo/cardano-serialization-lib-browser';
import { Buffer } from 'buffer';
import { useAuth } from '../utils/AuthContext';
import MessageModal from '../components/ModalPopup';
import { WalletIcon } from "@heroicons/react/24/solid";

const wallets = [
    { name: 'Eternl', id: 'eternl' },
    { name: 'Lace', id: 'lace' },
    { name: 'Typhon', id: 'typhoncip30' },
    { name: 'Vespr', id: 'vespr' },
    { name: 'Nami', id: 'nami' },
];


const WalletAuth = () => {
    const [wallet, setWallet] = useState(null);
    const [stakeAddress, setStakeAddress] = useState('');
    const [message, setMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const { isAuthenticated, authenticateWallet, logout, checkAuthStatus } = useAuth();

    useEffect(() => {
        if (isAuthenticated && stakeAddress) {
            setIsDropdownOpen(false); 
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
    };

    const disconnect = async () => {
        setWallet(null);
        setStakeAddress('');
        await logout();
        showMessage('Disconnected');
        setIsDropdownOpen(false);
    };

    const toggleDropdown = () => {
        if (!isAuthenticated && !window.cardano) {
            showMessage('No Cardano wallet extension detected');
            return;
        }
        setIsDropdownOpen(!isDropdownOpen);
    };

    return (
        <div className="p-2 max-w-md">
            <div className="dropdown dropdown-end">
                <label
                    tabIndex={0}
                    className="btn btn-accent btn-primary w-full flex items-center gap-2"
                    onClick={toggleDropdown}
                >
                    {isAuthenticated ? (
                        <span className="truncate text-xs max-w-[140px]">
                            {stakeAddress || 'Connected'}
                        </span>
                    ) : (
                     <>
                          <WalletIcon className="w-5 h-5" /> Connect Wallet
                      </>
                    )}
                </label>

                <ul
                    tabIndex={0}
                    className={`dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mt-1 z-10 ${
                        isDropdownOpen ? 'block' : 'hidden'
                    }`}
                >
                    {!isAuthenticated ? (
                        wallets.map((w) => (
                            <li key={w.id}>
                                <button
                                    onClick={() => connectAndAuthenticate(w.id)}
                                    className="w-full text-left hover:bg-primary hover:text-white"
                                >
                                    {w.name}
                                </button>
                            </li>
                        ))
                    ) : (
                        <li>
                            <button
                                onClick={disconnect}
                                className="w-full text-left text-error hover:bg-error hover:text-white"
                            >
                                Disconnect
                            </button>
                        </li>
                    )}
                </ul>
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