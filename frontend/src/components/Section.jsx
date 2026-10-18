import { Box, Paper, Typography } from "@mui/material";

export default function Section({ title, action, children }) {
  return (
    // minWidth: 0 stops charts from overflowing their grid column
    <Paper sx={{ p: 3, minWidth: 0 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </Paper>
  );
}