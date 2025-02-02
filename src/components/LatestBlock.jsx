import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_CONFIG } from '../utils/apiConfig';

const LatestBlock = () => {
  const [blockData, setBlockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestBlock = async () => {
      try {
        const response = await axios.get(`${API_CONFIG.baseUrl}latestblock`);
        console.log("API Response:", response.data);  // Debugging
        setBlockData(response.data);
      } catch (err) {
        setError("Failed to fetch block data");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestBlock();
  }, []);

  if (loading) return <div className="animate-spin rounded-full  mx-auto h-6 w-6 border-b-2 border-sky-500"></div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!blockData) return null;
  
  const MAX_BLOCK_SIZE = 88000; 

  const metadata = blockData?.metadata || {};
  const transactions = blockData?.transactions || [];
  const blockSize = metadata.size || 0;
  const progressPercentage = Math.min((blockSize / MAX_BLOCK_SIZE) * 100, 100);

  return (
    <div className="relative w-full text-base-content p-0">
      {/* Barre de progression */}
      <div className="absolute top-0 left-0 w-full h-2 rounded-lg text-right text-xs">
        <div
          className="h-full bg-sky-600 rounded-lg"
          style={{ width: `${progressPercentage}%` }}
        ></div>Size : {blockSize} bytes
      </div>



      <div className="mt-6">
      <h2 className="text-xl font-bold mt-4">Latest Block:</h2>
      <p className="text-sm break-all">{metadata.hash || "N/A"}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
        <p><strong>Transactions:</strong> {metadata.tx_count || "N/A"}</p>
        <p><strong>Output:</strong> {metadata.output ? (metadata.output / 1000000).toFixed(2) : "N/A"} ₳</p>
        <p><strong>Fees:</strong> {metadata.fees ? (metadata.fees / 1000000).toFixed(2) : "N/A"} ₳</p>
      </div>
      <p className="mt-4">
        <strong>Slot Leader:</strong>{" "}
        <Link to={`/pool/${metadata.slot_leader || ""}`} className="text-blue-500 underline">
          {metadata.slot_leader || "N/A"}
        </Link>
      </p>
    </div>

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
                      <Link to={`tx/${tx}`} className="text-sky-500">{tx}</Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-2 text-center text-gray-500">No data Available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LatestBlock;