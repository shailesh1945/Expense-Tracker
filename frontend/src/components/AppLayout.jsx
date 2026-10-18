import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { NavLink, Outlet } from "react-router-dom";

import useAuth from "../hooks/useAuth";

const navSx = { "&.active": { bgcolor: "rgba(255, 255, 255, 0.18)" } };

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.100" }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 1, flexWrap: "wrap" }}>
          <Typography variant="h6" sx={{ mr: 2 }}>
            Smart Expense Tracker
          </Typography>

          <Button color="inherit" component={NavLink} to="/" end sx={navSx}>
            Dashboard
          </Button>
          <Button color="inherit" component={NavLink} to="/expenses" sx={navSx}>
            Expenses
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <Typography sx={{ display: { xs: "none", sm: "block" } }}>{user.full_name}</Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}