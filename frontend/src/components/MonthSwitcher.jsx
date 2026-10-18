import { Box, Button, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { currentMonth, formatMonth, shiftMonth } from "../utils/format";

export default function MonthSwitcher({ month, onChange }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <IconButton aria-label="Previous month" onClick={() => onChange(shiftMonth(month, -1))}>
        <ChevronLeftIcon />
      </IconButton>
      <Typography fontWeight={500} sx={{ minWidth: 140, textAlign: "center" }}>
        {formatMonth(month)}
      </Typography>
      <IconButton aria-label="Next month" onClick={() => onChange(shiftMonth(month, 1))}>
        <ChevronRightIcon />
      </IconButton>
      {month !== currentMonth() && (
        <Button size="small" onClick={() => onChange(currentMonth())}>
          This month
        </Button>
      )}
    </Box>
  );
}