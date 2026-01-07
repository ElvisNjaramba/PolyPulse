import api from "./axios";

export const fetchProfile = () =>
  api.get("auth/profile/");
