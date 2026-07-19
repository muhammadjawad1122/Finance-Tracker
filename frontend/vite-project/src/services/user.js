import api from "./api";

// backend: PATCH /api/users/me
export const updateMe = async (payload) => {
  const res = await api.patch("/users/me", payload);
  return res.data; // returns full ApiResponse -> { success, message, data: { user } }
};