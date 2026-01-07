import api from "./axios";

export const fetchComments = (pollId) =>
  api.get(`polls/${pollId}/comments/`);

export const addComment = (pollId, data) =>
  api.post(`polls/${pollId}/comments/`, data);

export const toggleLike = (commentId) =>
  api.post(`comments/${commentId}/like/`);

export const moderateComment = (commentId, action) =>
  api.post(`comments/${commentId}/moderate/`, { action });
