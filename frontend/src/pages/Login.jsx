import { useState } from "react";
import { Alert, Box, Button, Card, CardContent, Link, TextField, Typography } from "@mui/material";
import { Link as RouterLink, Navigate } from "react-router-dom";

import { getErrorMessage } from "../api/client";
import useAuth from "../hooks/useAuth";

export default function Login() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in? Go to the dashboard
  if (!loading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, bgcolor: "grey.100" }}>
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Welcome back
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Log in to track your expenses.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? "Logging in..." : "Log in"}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }}>
            New here?{" "}
            <Link component={RouterLink} to="/register">
              Create an account
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}