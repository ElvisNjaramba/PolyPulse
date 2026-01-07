import api from "./axios";

export const fetchNotifications = () =>
  api.get("notifications/");

export const markRead = (id) =>
  api.post(`notifications/${id}/read/`);

export const markAllRead = () =>
  api.post("notifications/read-all/");
