import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/orpc-react";

export const useDashboardStatsQuery = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await orpc.events.getDashboardStats();
      return res.data;
    },
  });
};
