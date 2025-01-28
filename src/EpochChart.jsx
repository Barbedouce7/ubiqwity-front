import React from "react";
import { Chart } from "@mui/x-charts";
import { Card, CardContent } from "@/components/ui/card";

const EpochChart = ({ epochLabels, txCounts, activeStakes }) => {
  return (
    <Card className="bg-gray-900 text-white shadow-lg rounded-2xl">
      <CardContent>
        <h2 className="text-xl font-semibold text-center mb-4">Epoch Data Overview</h2>
        <div className="h-96">
          <Chart
            series={[
              {
                type: "bar",
                id: "txCounts",
                data: txCounts,
                xAxisKey: "epochs",
                yAxisKey: "transactions",
                label: "Transactions",
              },
              {
                type: "line",
                id: "activeStakes",
                data: activeStakes,
                xAxisKey: "epochs",
                yAxisKey: "stake",
                label: "Active Stakes",
              },
            ]}
            xAxis={[
              {
                id: "epochs",
                data: epochLabels,
                label: "Epoch Numbers",
              },
            ]}
            yAxis={[
              {
                id: "transactions",
                label: "Transaction Counts",
              },
              {
                id: "stake",
                label: "Active Stake (M)",
                position: "right",
              },
            ]}
            colors={["#3b82f6", "#f59e0b"]}
            darkMode
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default EpochChart;
