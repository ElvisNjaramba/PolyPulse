import api from "./axios";

export const placeBet = (pollId, data) =>
  api.post(`polls/${pollId}/bet/`, data);
