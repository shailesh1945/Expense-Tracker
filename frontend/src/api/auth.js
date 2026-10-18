import api from "./client";

export async function register({ fullName, email, password }) {
  const { data } = await api.post("/auth/register", {
    full_name: fullName,
    email,
    password,
  });
  return data;
}

export async function login(email, password) {
  // The backend uses OAuth2PasswordRequestForm, so it expects form data, not JSON
  const body = new URLSearchParams({ username: email, password });
  const { data } = await api.post("/auth/login", body);
  return data; // { access_token, token_type }
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}