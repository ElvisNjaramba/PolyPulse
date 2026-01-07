import api from "./axios";

export const fetchAllPolls = () =>
  api.get("admin/polls/");

export const resolvePoll = (pollId, optionId) =>
  api.post(`admin/polls/${pollId}/resolve/`, { option_id: optionId });

export const suspendPoll = (pollId) =>
  api.post(`admin/polls/${pollId}/suspend/`);

export const fetchUsers = () =>
  api.get("admin/users/");

export const fetchWalletLogs = () =>
  api.get("admin/wallet/");
