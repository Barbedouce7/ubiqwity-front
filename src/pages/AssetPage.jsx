import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import CopyButton from '../components/CopyButton';
import { useParams, useLocation, Link } from 'react-router-dom';

import { shortener } from '../utils/utils';
import { 
  ArrowTopRightOnSquareIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';

const AssetExplorer = () => {
  const params = useParams();
  const location = useLocation();
  const [assetData, setAssetData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoadingError, setImageLoadingError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const assetIdFromPath = pathParts.length >= 3 ? pathParts[2] : null;
    
    if (assetIdFromPath) {
      fetchAssetData(assetIdFromPath);
    } else {
      console.warn("No assetId found in URL path");
      setError("No asset ID found in the URL path. Please check the URL format.");
    }
  }, [location.pathname]);

  const fetchAssetData = async (id) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiUrl = `${API_CONFIG.baseUrl}assets/${id}`;
      const response = await axios.get(apiUrl);
      setAssetData(response.data);
      // Load image in a separate effect
      loadImage(response.data);
    } catch (error) {
      console.error("Error fetching asset data:", error);
      setError(`Failed to load asset data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadImage = async (data) => {
    setIsImageLoading(true);
    if (data.metadata?.logo) {
      setImageUrl(`data:image/png;base64,${data.metadata.logo}`);
      console.log('Using base64 logo from metadata');
      setIsImageLoading(false);
      return;
    } 
    
    if (data.onchain_metadata?.image) {
      const cid = data.onchain_metadata.image.replace('ipfs://', '');
      const gateways = [
        `https://ipfs.io/ipfs/${cid}`,
        `https://dweb.link/ipfs/${cid}`,
        `https://cloudflare-ipfs.com/ipfs/${cid}`
      ];

      for (const gatewayUrl of gateways) {
        try {
          console.log(`Attempting to load image from: ${gatewayUrl}`);
          const response = await fetch(gatewayUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const blob = await response.blob();
          const reader = new FileReader();
          return new Promise((resolve) => {
            reader.onloadend = () => {
              setImageUrl(reader.result);
              setImageLoadingError(false);
              console.log(`Image successfully loaded from ${gatewayUrl} as data URL`);
              setIsImageLoading(false);
              resolve();
            };
            reader.onerror = () => {
              console.error(`Failed to read blob from ${gatewayUrl}`);
              resolve();
            };
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.warn(`Failed to load image from ${gatewayUrl}:`, err);
          continue;
        }
      }
      
      setImageUrl(gateways[0]);
      setImageLoadingError(true);
      setIsImageLoading(false);
      console.error('All attempts to load image failed');
    }
  };

  const renderMetadataTable = (metadata) => {
    if (!metadata || Object.keys(metadata).length === 0) {
      return <p className="text-gray-500">No metadata available</p>;
    }

    // Filter out image and files which are handled separately
    const filteredEntries = Object.entries(metadata).filter(
      ([key]) => !['image', 'files'].includes(key)
    );

    return (
      <table className="w-full">
        <tbody>
          {filteredEntries.map(([key, value]) => (
            <tr key={key} className="border-b border-base-300 last:border-none">
              <td className="py-2 font-bold">{key}</td>
              <td className="py-2 break-words">
                {typeof value === 'string' && value.startsWith('http') ? (
                  <a 
                    href={value} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="link link-primary flex items-center justify-center gap-1"
                  >
                    {value}
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </a>
                ) : (
                  <span>{value.toString()}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-error">
        <XMarkIcon className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }
  
  if (!assetData && !isLoading && !error) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No asset selected. Please ensure the asset ID in the URL is correct.</p>
      </div>
    );
  }

  // Check if it's an NFT based on quantity = 1
  const isNFT = Number(assetData?.quantity) === 1;
  // Get decimals with fallback to 0
  const decimals = assetData?.metadata?.decimals || 0;

  return (
    <div className="flex flex-col gap-6 text-base-content">
      {assetData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Metadata Card */}
          <div className="card shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <span>Metadata</span>
                {assetData.metadata?.ticker && (
                  <div className="badge badge-secondary">{assetData.metadata.ticker}</div>
                )}
                {assetData.onchain_metadata_standard && (
                  <div className="badge badge-primary">CIP-{assetData.onchain_metadata_standard?.replace('CIP', '')}</div>
                )}
              </h2>
              
              {imageUrl && (
                <div className="flex flex-col items-center mt-4 mb-4">
                  {isImageLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="loading loading-spinner loading-md text-primary"></div>
                    </div>
                  ) : !imageLoadingError ? (
                    <img 
                      src={imageUrl}
                      alt={`${assetData.metadata?.name || assetData.onchain_metadata?.name || 'Asset'} logo`}
                      className="max-w-50 max-h-50 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        IPFS CID: {assetData.onchain_metadata?.image}
                      </p>
                      <p className="text-sm text-error">
                        Unable to load image
                      </p>
                      <a 
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm link link-primary"
                      >
                        Try opening directly
                      </a>
                    </div>
                  )}
                </div>
              )}
              
              {assetData.metadata?.description && (
                <div className="p-3 rounded-box mb-4">
                  <p>{assetData.metadata.description}</p>
                </div>
              )}
              
              {assetData.metadata?.url && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-bold">URL:</span>
                  <a 
                    href={assetData.metadata.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="link link-primary flex items-center gap-1"
                  >
                    {assetData.metadata.url}
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </a>
                </div>
              )}
              
              {/* On-chain metadata displayed as key-value pairs */}
              {assetData.onchain_metadata && (
                <div className="mt-4">
                  {renderMetadataTable(assetData.onchain_metadata)}
                </div>
              )}
            </div>
          </div>
          
          {/* Basic Info Card */}
          <div>
            <div className="card shadow-xl mb-6">
              <div className="card-body">
                <h2 className="card-title">Basic Information</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="font-bold py-2">Asset Name</td>
                        <td className="flex items-center justify-center py-2">
                          <span>{assetData.metadata?.name || assetData.onchain_metadata?.name || assetData.asset_name}</span>
                          <CopyButton text={assetData.metadata?.name || assetData.onchain_metadata?.name || assetData.asset_name} />
                        </td>
                      </tr>
                      <tr>
                        <td className="font-bold py-2">Fingerprint</td>
                        <td className="flex items-center justify-center py-2">
                          <span className="text-xs md:text-sm font-mono">{shortener(assetData.fingerprint)}</span>
                          <CopyButton text={assetData.fingerprint} />
                        </td>
                      </tr>
                      <tr>
                        <td className="font-bold py-2">Policy ID</td>
                        <td className="flex items-center justify-center py-2">
                          <span className="text-xs md:text-sm font-mono max-w-32 md:max-w-56">{shortener(assetData.policy_id)}</span>
                          <CopyButton text={assetData.policy_id} />
                        </td>
                      </tr>
                      <tr>
                        <td className="font-bold py-2">Quantity</td>
                        <td className="py-2">{Number(assetData.quantity).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-2">Decimals</td>
                        <td className="py-2">{decimals}</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-2">Type</td>
                        <td className="py-2">
                          {isNFT ? (
                            <div className="badge badge-outline">NFT</div>
                          ) : (
                            <div className="badge badge-outline">Fungible Token</div>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Transaction Details Card */}
            <div className="card shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Transaction Details</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="font-bold py-2">Mint Transaction</td>
                        <td className="py-2">
                          <div className="flex items-center justify-center">
                            <span className="text-primary max-w-32 md:max-w-56 text-xs"><Link to={`/tx/${assetData.initial_mint_tx_hash}`} className="p-1 hover:bg-gray-100 rounded transition-colors">{shortener(assetData.initial_mint_tx_hash)}</Link></span>
                            <CopyButton text={assetData.initial_mint_tx_hash} />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="font-bold py-2">Mint/Burn Count</td>
                        <td className="py-2">{assetData.mint_or_burn_count}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetExplorer;