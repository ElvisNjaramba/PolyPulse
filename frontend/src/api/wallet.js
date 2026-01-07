import api from "./axios";
export const fetchWalletHistory = () =>
  api.get("wallet/history/");

export const fetchWalletSummary = () =>
  api.get("wallet/summary/");