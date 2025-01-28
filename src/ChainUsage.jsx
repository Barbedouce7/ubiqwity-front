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
      <CardContent className="bg-slate-900">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <div>
            <Typography variant="body2" style={{ color: getColor(data.average_5min) }}>
              5 Min : {data.average_5min}%
            </Typography>
          </div>
          <div>
            <Typography variant="body2" style={{ color: getColor(data.average_1h) }}>
              1 Hour : {data.average_1h}%
            </Typography>
          </div>
          <div>
            <Typography variant="body2" style={{ color: getColor(data.average_24h) }}>
              24 Hour : {data.average_24h}%
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChainUsage;
