import api from "./api";

export const fetchSummary = async (params = {}) => {
  const { data } = await api.get("/stats/summary", { params });
  return data;
};

export const fetchByCategory = async (params = {}) => {
  const { data } = await api.get("/stats/by-category", { params });
  return data;
};

export const fetchMonthly = async (params = {}) => {
  const { data } = await api.get("/stats/monthly", { params });
  return data;
};