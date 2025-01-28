import { Card, CardContent, Typography } from "@mui/material";

const ChainUsage = ({ data }) => {
  // Fonction pour déterminer la couleur en fonction de la valeur de l'average
  const getColor = (value) => {
    if (value <= 30) {
      return "green";  // Petite valeur
    } else if (value >= 90) {
      return "red";  // Grande valeur proche de 100%
    } else {
      return "yellow";  // Valeurs intermédiaires
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" align="center" style={{ marginBottom: "12px" }}>
          Average Statistics
        </Typography>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <div>
            <Typography variant="body2" style={{ color: getColor(data.average_5min) }}>
              <strong>5 Min Average:</strong> {data.average_5min}%
            </Typography>
          </div>
          <div>
            <Typography variant="body2" style={{ color: getColor(data.average_1h) }}>
              <strong>1 Hour Average:</strong> {data.average_1h}%
            </Typography>
          </div>
          <div>
            <Typography variant="body2" style={{ color: getColor(data.average_24h) }}>
              <strong>24 Hour Average:</strong> {data.average_24h}%
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChainUsage;
