import api from "./axios";

export const fetchPolls = (category) =>
  api.get("polls/", {
    params: category ? { category } : {},
  });

export const fetchPollDetail = (id) =>
  api.get(`polls/${id}/`);

export const createPoll = (data) =>
  api.post("polls/create/", data);

export const resolvePoll = (id, optionId) =>
  api.post(`polls/${id}/resolve/`, { winning_option_id: optionId });

export const suspendPoll = (id) =>
  api.post(`polls/${id}/suspend/`);
