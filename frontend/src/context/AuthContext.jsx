import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("earnvoy_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("earnvoy_token"))
      .finally(() => setLoading(false));
  }, []);

  function persist(token, user) {
    localStorage.setItem("earnvoy_token", token);
    setUser(user);
  }

  async function login(emailOrUsername, password) {
    const res = await api.post("/auth/login", { emailOrUsername, password });
    persist(res.data.token, res.data.user);
    return res.data.user;
  }

  async function register(payload) {
    const res = await api.post("/auth/register", payload);
    persist(res.data.token, res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem("earnvoy_token");
    setUser(null);
  }

  async function refreshUser() {
    const res = await api.get("/auth/me");
    setUser(res.data.user);
    return res.data.user;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
