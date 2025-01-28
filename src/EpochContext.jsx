import { Card, CardContent, Typography, Divider } from "@mui/material";
const EpochContext = ({ data }) => {
  console.log(data);
  const formatNumber = (num) =>
    new Intl.NumberFormat("en-US").format(num);

  return (
    <div className="card bg-slate-800 shadow-xl text-white p-4">
      <h2 className="text-xl font-bold text-center mb-4">Epoch Information</h2>
      <div className="divider"></div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex justify-between">
          <span className="font-semibold">Epoch:</span>
          <span>{data.epoch}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Transaction Count:</span>
          <span>{formatNumber(data.tx_count)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Block Count:</span>
          <span>{formatNumber(data.block_count)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Fees:</span>
          <span>{formatNumber(data.fees)} Lovelaces</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Active Stake:</span>
          <span>{formatNumber(data.active_stake)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Start Time:</span>
          <span>{new Date(data.start_time * 1000).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default EpochContext;
