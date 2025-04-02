import api from "./api";

export const getFeed = async (page: number) => {
  const res = await api.get(`/api/posts/newsfeed?page=${page}`);
  return res.data.posts;
};
