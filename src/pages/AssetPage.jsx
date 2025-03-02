import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import CopyButton from '../components/CopyButton';
import { useParams, useLocation } from 'react-router-dom';
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
      // Chargement de l'image dans un effet séparé
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

  return (
    <div className="flex flex-col gap-6">
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
              </h2>
              
              {assetData.metadata?.description && (
                <div className="p-3 rounded-box">
                  <p>{assetData.metadata.description}</p>
                </div>
              )}
              
              {assetData.metadata?.url && (
                <div className="flex items-center gap-2">
                  <span className="font-bold mx-auto">URL:</span>
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
              
              {imageUrl && (
                <div className="flex flex-col items-center mt-4">
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
              
              <div className="mt-4">
                <h3 className="font-bold mb-2">Transaction Details</h3>
                <div className="p-3 rounded-box overflow-x-auto text-xs">
                  <div className="font-bold">Mint Transaction:</div>
                  <div className="font-mono truncate">{assetData.initial_mint_tx_hash}</div>
                  <div className="flex items-center justify-end">
                    <CopyButton text={assetData.initial_mint_tx_hash} />
                  </div>
                  <div className="mt-2">
                    <span className="font-bold">Mint/Burn Count:</span> {assetData.mint_or_burn_count}
                  </div>
                </div>
              </div>
              
              {assetData.onchain_metadata && (
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">On-chain Metadata</h3>
                    <span className="badge">{assetData.onchain_metadata_standard || "Unknown"}</span>
                  </div>
                  <div className="p-3 rounded-box mt-2 overflow-x-auto">
                    <pre className="text-xs">
                      {JSON.stringify(assetData.onchain_metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Basic Info Card */}
          <div className="text-base-content rounded-lg shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex justify-between">
                <span>Basic Information</span>
                <div className="badge badge-primary">CIP-{assetData.onchain_metadata_standard?.replace('CIP', '')}</div>
              </h2>
              
              <div className="overflow-x-auto">
                <table className="">
                  <tbody>
                    <tr>
                      <td className="font-bold">Asset Name</td>
                      <td className="flex items-center justify-between">
                        <span>{assetData.metadata?.name || assetData.onchain_metadata?.name || assetData.asset_name}</span>
                        <CopyButton text={assetData.metadata?.name || assetData.onchain_metadata?.name || assetData.asset_name} />
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold">Fingerprint</td>
                      <td className="flex items-center justify-between">
                        <span className="text-xs md:text-sm font-mono">{assetData.fingerprint}</span>
                        <CopyButton text={assetData.fingerprint} />
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold">Policy ID</td>
                      <td className="flex items-center justify-between">
                        <span className="text-xs md:text-sm font-mono truncate max-w-32 md:max-w-56">{assetData.policy_id}</span>
                        <CopyButton text={assetData.policy_id} />
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold">Quantity</td>
                      <td>{Number(assetData.quantity).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">Decimals</td>
                      <td>{assetData.metadata?.decimals || "N/A"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetExplorer;