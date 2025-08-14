import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/orpc-react";

export type ReportType =
  | "events_stats"
  | "user_analytics"
  | "financial_report"
  | "age_distribution";
export type ExportFormat = "csv" | "json";
export type ExportType = "events" | "users" | "registrations" | "children";

// Hook for getting advanced reports
export const useAdvancedReportsQuery = (
  reportType: ReportType,
  startDate?: string,
  endDate?: string,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["advanced-reports", reportType, startDate, endDate],
    queryFn: async () => {
      const res = await orpc.events.getAdvancedReports({
        reportType,
        startDate,
        endDate,
      });
      return res.data;
    },
    enabled,
    staleTime: 0, // Always fresh data
    gcTime: 0, // No caching
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

// Hook for exporting data
export const useExportDataMutation = () => {
  return useMutation({
    mutationFn: async ({
      exportType,
      format,
      startDate,
      endDate,
    }: {
      exportType: ExportType;
      format: ExportFormat;
      startDate?: string;
      endDate?: string;
    }) => {
      const res = await orpc.events.exportData({
        exportType,
        format,
        startDate,
        endDate,
      });
      return res.data;
    },
    onSuccess: (data) => {
      // Create and trigger download
      const blob = new Blob([data.data], { type: data.contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
};

// Utility hook for multiple report types
export const useMultipleReports = (
  reportTypes: ReportType[],
  startDate?: string,
  endDate?: string,
  enabled: boolean = true,
) => {
  const queries = reportTypes.map((type) =>
    useAdvancedReportsQuery(type, startDate, endDate, enabled),
  );

  return {
    data: queries.map((q) => q.data),
    isLoading: queries.some((q) => q.isLoading),
    error: queries.find((q) => q.error)?.error,
    refetch: () => queries.forEach((q) => q.refetch()),
  };
};

// Hook for events statistics report
export const useEventsStatsReport = (startDate?: string, endDate?: string) => {
  return useAdvancedReportsQuery("events_stats", startDate, endDate);
};

// Hook for user analytics report
export const useUserAnalyticsReport = (
  startDate?: string,
  endDate?: string,
) => {
  return useAdvancedReportsQuery("user_analytics", startDate, endDate);
};

// Hook for financial report
export const useFinancialReport = (startDate?: string, endDate?: string) => {
  return useAdvancedReportsQuery("financial_report", startDate, endDate);
};

// Hook for age distribution report
export const useAgeDistributionReport = (
  startDate?: string,
  endDate?: string,
) => {
  return useAdvancedReportsQuery("age_distribution", startDate, endDate);
};
