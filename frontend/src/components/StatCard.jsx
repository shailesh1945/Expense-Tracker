import { Card, CardContent, Typography } from "@mui/material";

export default function StatCard({ label, value, hint, valueColor = "text.primary" }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={600} color={valueColor} sx={{ my: 0.5 }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="body2" color="text.secondary">
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}