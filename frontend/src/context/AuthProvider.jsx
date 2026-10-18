import { useCallback, useEffect, useMemo, useState } from "react";

import { getMe, login as apiLogin, register as apiRegister } from "../api/auth";
import { TOKEN_KEY } from "../api/client";
import { AuthContext } from "./authContext";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // If a token is saved, we must check it before deciding who is logged in
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  // On first load: restore the session from the saved token
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  // The Axios interceptor fires this when the backend returns 401
  useEffect(() => {
    const onExpired = () => {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const { access_token } = await apiLogin(email, password);
    localStorage.setItem(TOKEN_KEY, access_token);
    try {
      setUser(await getMe());
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      throw error;
    }
  }, []);

  const register = useCallback(
    async (details) => {
      await apiRegister(details);
      await login(details.email, details.password); // log in right after signing up
    },
    [login]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}