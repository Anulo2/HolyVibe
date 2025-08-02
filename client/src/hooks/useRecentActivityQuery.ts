import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/orpc-react";

export const useRecentActivityQuery = (limit: number = 10) => {
  return useQuery({
    queryKey: ["recent-activity", limit],
    queryFn: async () => {
      const res = await orpc.events.getRecentActivity({ limit });
      return res.data;
    },
  });
};
