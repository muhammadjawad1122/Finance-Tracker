import api from "./api";

export const register = async (payload) => {
  const res = await api.post("/auth/register", payload);
  return res.data.data; // { user }
};

export const login = async (payload) => {
  const res = await api.post("/auth/login", payload);
  return res.data.data; // { user }
};

export const me = async () => {
  const res = await api.get("/auth/me");
  return res.data.data; // user
};

export const logout = async () => {
  const res = await api.post("/auth/logout");
  return res.data;
};