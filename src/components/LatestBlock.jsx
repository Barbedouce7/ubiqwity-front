import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_CONFIG } from '../utils/apiConfig';
import { shortener } from '../utils/utils';
import { FormatNumberWithSpaces } from '../utils/FormatNumberWithSpaces';

const LatestBlock = () => {
  const [blockData, setBlockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const fetchTime = useRef(0);

  const fetchLatestBlock = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.baseUrl}latestblock`);
      setBlockData(response.data);
      
      fetchTime.current = Math.floor(Date.now() / 1000);
      setTimeElapsed(0);
    } catch (err) {
      setError("Failed to fetch block data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestBlock();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (timeElapsed >= 20) {
      fetchLatestBlock();
    }
  }, [timeElapsed]);

  if (loading) return <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-30"></div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!blockData) return null;
  
  const MAX_BLOCK_SIZE = 88; 

  const metadata = blockData?.metadata || {};
  const transactions = blockData?.transactions || [];
  const blockSize = metadata.size / 1000 || 0;
  const progressPercentage = Math.min((blockSize / MAX_BLOCK_SIZE) * 100, 100);

  return (
    <div className="relative w-full text-base-content p-0">


      {/* Horloge circulaire de progression */}
      <div className="absolute top-3 right-0 flex items-center justify-center right-3">
        <svg width="24" height="24" viewBox="0 0 40 40" className="transform -rotate-90">
          <circle cx="20" cy="20" r="18" stroke="#ddd" strokeWidth="4" fill="none" />
          <circle
            cx="20"
            cy="20"
            r="18"
            stroke="#0284c7"
            strokeWidth="4"
            fill="none"
            strokeDasharray="113"  // Circonférence = 2 * PI * 18
            strokeDashoffset={`${113 - (timeElapsed / 20) * 113}`} // Remplissage progressif
            strokeLinecap="round"
            transition="stroke-dashoffset 1s linear"
          />
          <title>Trying to refresh each 20s</title>
        </svg>
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-bold">Latest Block:</h3>
        <p className="text-sm break-all">{shortener(metadata.hash) || "N/A"}</p>


      {/* Size affichée sous la progress bar */}
      <div className="text-xs font-semibold p-1 text-center mt-1 mt-4">
        {blockSize.toFixed(2)} KB / {MAX_BLOCK_SIZE} KB
      </div>
      {/* Barre de progression */}
      <div className="w-20 mx-auto bg-base-300 h-1.5 rounded-lg overflow-hidden">
        <div
          className="h-full bg-sky-500 h-1.5 rounded-lg"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>



        {metadata.tx_count > 0 ? (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <p><strong>Transactions:</strong> {metadata.tx_count}</p>
            <p><strong>Fees:</strong> <FormatNumberWithSpaces number={(metadata.fees / 1000000).toFixed(2)}/> ₳</p>
          </div>
          <p><strong>Output:</strong> <FormatNumberWithSpaces number={(metadata.output / 1000000).toFixed(2)}/> ₳</p>
          </>
        ) : (
          <p className="mt-4 text-base-content opacity-60">Empty block</p>
        )}

        <p className="mt-4">
          <strong>Slot Leader:</strong>{" "}
          <Link to={`/pool/${metadata.slot_leader || ""}`} className="text-sky-500 underline">
            {shortener(metadata.slot_leader) || "N/A"}
          </Link>
        </p>

        {/* Widget avec un tableau scrollable */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Transactions:</h3>
          <div className="max-h-60 overflow-y-auto rounded-lg shadow-sm">
            <table className="w-full border-collapse">
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx} className="border-t border-gray-500">
                      <td className="p-2 break-all">
                        <Link to={`tx/${tx}`} className="text-sky-500">{shortener(tx)}</Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-2 text-center text-base-content opacity-60">Empty block</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestBlock;
