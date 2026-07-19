import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../services/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // cookie-only: just call /me once on load
  useEffect(() => {
    const init = async () => {
      try {
        const me = await authApi.me();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

  const register = async ({ name, email, password }) => {
    const { user } = await authApi.register({ name, email, password });
    setUser(user);
    return user;
  };

  const login = async ({ email, password }) => {
    const { user } = await authApi.login({ email, password });
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (_) {}
    setUser(null);
  };

  const refreshMe = async () => {
    const me = await authApi.me();
    setUser(me);
    return me;
  };

  const value = useMemo(
    () => ({ user, setUser, initializing, register, login, logout, refreshMe }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};