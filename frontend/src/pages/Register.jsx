import { useState } from "react";
import { Alert, Box, Button, Card, CardContent, Link, TextField, Typography } from "@mui/material";
import { Link as RouterLink, Navigate } from "react-router-dom";

import { getErrorMessage } from "../api/client";
import useAuth from "../hooks/useAuth";

export default function Register() {
  const { user, loading, register } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const handleChange = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
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
            Create your account
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Start tracking where your money goes.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
            <TextField label="Full name" value={form.fullName} onChange={handleChange("fullName")} required autoFocus fullWidth />
            <TextField label="Email" type="email" value={form.email} onChange={handleChange("email")} required fullWidth />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              helperText="At least 8 characters"
              required
              fullWidth
            />
            <TextField label="Confirm password" type="password" value={form.confirm} onChange={handleChange("confirm")} required fullWidth />
            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? "Creating account..." : "Sign up"}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }}>
            Already have an account?{" "}
            <Link component={RouterLink} to="/login">
              Log in
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}