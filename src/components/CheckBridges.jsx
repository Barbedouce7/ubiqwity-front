import React from 'react';
import { useTheme } from '../utils/useTheme';
import { QuestionMarkCircleIcon, ArrowRightIcon } from "@heroicons/react/20/solid";
import { Tooltip } from 'react-tooltip';
import logoRosen from '/rosen-logo.svg';
import { Link } from 'react-router-dom'; 
import { shortener } from '../utils/utils';

const CheckBridges = ({ metadata }) => {
  if (!metadata || !Array.isArray(metadata) || metadata.length === 0) {
    return null;
  }

  const transactionData = metadata[0];
  
  if (!transactionData.json_metadata || transactionData.label !== "0") {
    return null;
  }
  const requiredFields = ['to', 'bridgeFee', 'networkFee', 'toAddress', 'fromAddress'];
  if (!requiredFields.every(field => field in transactionData.json_metadata)) {
    return null;
  }

  const sourceNetwork = 'Cardano';
  const { to, bridgeFee, networkFee, toAddress, fromAddress } = transactionData.json_metadata;
  const destinationNetwork = to.charAt(0).toUpperCase() + to.slice(1);

  // Format fees (assuming lovelaces for Cardano)
  const formatFee = (fee) => {
    return `${parseInt(fee)}`; // Conversion from lovelaces to ADA
  };

  const { colors } = useTheme();

  // Network badge color mapping
  const getNetworkColor = (network) => {
    switch (network.toLowerCase()) {
      case 'bitcoin': return 'badge-warning'; // Orange
      case 'ethereum': return 'badge-neutral'; // Dark gray
      case 'binance': return 'badge-accent'; // Yellow
      case 'ergo': return 'badge-error'; // Red
      case 'cardano': return 'badge-info'; // Blue
      default: return 'badge-primary'; // Fallback
    }
  };

 const needsLink = (address) => {
    const prefixes = ['addr', 'ddz', 'Ae'];
    return typeof address === 'string' && prefixes.some(prefix => address.startsWith(prefix));
  };
 const displayFromAddress = Array.isArray(fromAddress) ? fromAddress[0] : fromAddress;

  return (
    <div className="card w-full max-w-2xl bg-base-100 shadow-xl mx-auto">
      <div className="card-body p-4 sm:p-6">
        <h2 className="card-title flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <img src={logoRosen} className="w-10 mt-2" alt="RosenBridge logo" />
          RosenBridge Transaction
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${getNetworkColor(sourceNetwork)}`}>
              {sourceNetwork}
            </span>
            <ArrowRightIcon className="h-4 w-4 text-base-content" />
            <span className={`badge ${getNetworkColor(destinationNetwork)}`}>
              {destinationNetwork}
            </span>
          </div>
        </h2>
        
        <div className="space-y-4 mt-4">
          <div className="flex flex-col md:flex-row md:justify-between">
            <span className={`${colors.text} font-medium`}>From:</span>
            <p className="font-mono text-sm break-all mt-1 pt-1 md:mt-0">
              {needsLink(displayFromAddress) ? (
                <Link 
                  className="hover:opacity-90 transition-opacity text-primary" 
                  to={`/wallet/${displayFromAddress}`}
                >
                  {shortener(displayFromAddress)}
                </Link>
              ) : (
                displayFromAddress
              )}
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:justify-between">
            <span className={`${colors.text} font-medium`}>To:</span>
            <p className="font-mono text-sm break-all mt-1 pt-1 md:mt-0">
              {needsLink(toAddress) ? (
                <Link 
                  className="hover:opacity-90 transition-opacity" 
                  to={`/wallet/${toAddress}`}
                >
                  {shortener(toAddress)}
                </Link>
              ) : (
                toAddress
              )}
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:justify-between">
            <span className={`${colors.text} font-medium`}>Bridge Fee:</span>
            <p className="font-mono text-sm break-all mt-1 md:mt-0 md:max-w-[50%] flex items-center justify-center gap-1">
              {formatFee(bridgeFee)}
              <QuestionMarkCircleIcon 
                data-tooltip-id="fees-tooltip"
                data-tooltip-content="RosenBridge fees are deducted in the currency sent by the user. At this time we display the fees without decimal adjustments."
                className="h-5 w-5 text-base-content cursor-pointer"
              />
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:justify-between">
            <span className={`${colors.text} font-medium`}>Network Fee:</span>
            <p className="font-mono text-sm break-all mt-1 md:mt-0 md:max-w-[50%] flex items-center justify-center gap-1">
              {formatFee(networkFee)}
              <QuestionMarkCircleIcon 
                data-tooltip-id="fees-tooltip"
                data-tooltip-content="RosenBridge fees are deducted in the currency sent by the user. At this time we display the fees without decimal adjustments."
                className="h-5 w-5 text-base-content cursor-pointer"
              />
            </p>
          </div>
        </div>
      </div>
      <Tooltip id="fees-tooltip" place="top" effect="solid" />
    </div>
  );
};

export default CheckBridges;