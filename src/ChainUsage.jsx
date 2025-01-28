import { Card, CardContent, Typography } from "@mui/material";

const ChainUsage = ({ data }) => {
  const getColor = (value) => {
    if (value <= 30) {
      return "green";
    } else if (value >= 90) {
      return "red"; 
    } else {
      return "orange";  
    }
  };

  return (
    <Card>
      <CardContent>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <div>
            <Typography variant="body2" style={{ color: getColor(data.average_5min) }}>
              <strong>5 Min :</strong> {data.average_5min}%
            </Typography>
          </div>
          <div>
            <Typography variant="body2" style={{ color: getColor(data.average_1h) }}>
              <strong>1 Hour :</strong> {data.average_1h}%
            </Typography>
          </div>
          <div>
            <Typography variant="body2" style={{ color: getColor(data.average_24h) }}>
              <strong>24 Hour :</strong> {data.average_24h}%
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChainUsage;
