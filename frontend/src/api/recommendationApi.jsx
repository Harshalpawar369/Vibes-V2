import axiosClient from "./axiosClient";

const recommendationApi = {
  // GET /api/recommendations
  getRecommendations: () =>
    axiosClient.get("/recommendations").then((r) => r.data),
};

export default recommendationApi;