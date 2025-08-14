import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/orpc-react";

// Hook for fetching events
export const useEventsQuery = (params?: {
  search?: string;
  limit?: number;
  offset?: number;
  minAge?: number;
  maxAge?: number;
}) => {
  return useQuery({
    queryKey: ["events", "list", params],
    queryFn: async () => {
      const response = await orpc.events.list({
        limit: params?.limit || 20,
        offset: params?.offset || 0,
        ...(params?.search && { search: params.search }),
        ...(params?.minAge !== undefined && { minAge: params.minAge }),
        ...(params?.maxAge !== undefined && { maxAge: params.maxAge }),
      });
      // Parse locations from JSON string to array for each event
      const parsedData = {
        ...response,
        data: response.data.map((event: any) => ({
          ...event,
          locations: event.locations ? JSON.parse(event.locations) : [],
        })),
      };
      return parsedData;
    },
    staleTime: 0, // Always fresh data
    gcTime: 0, // No caching
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Hook for fetching a single event
export const useEventQuery = (eventId: string) => {
  return useQuery({
    queryKey: ["events", eventId],
    queryFn: async () => {
      const response = await orpc.events.get({ id: eventId });
      // Parse locations from JSON string to array
      const parsedData = {
        ...response,
        data: {
          ...response.data,
          locations: response.data.locations
            ? JSON.parse(response.data.locations)
            : [],
        },
      };
      return parsedData;
    },
    enabled: !!eventId,
  });
};

// Hook for creating a new event
export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      startDate: string;
      endDate?: string;
      locations: string[];
      minAge: number;
      maxAge: number;
      maxParticipants: number;
      organizationId?: string;
      price?: string;
      imageUrl?: string;
      imageFile?: File;
      // Extended information fields
      detailedDescription?: string;
      program?: string;
      requirements?: string;
      whatToBring?: string;
      parentNotes?: string;
      emergencyContacts?: string;
      meetingPoint?: string;
      dropOffTime?: string;
      pickUpTime?: string;
      includesLunch?: boolean;
      includesSnack?: boolean;
      transportProvided?: boolean;
      weatherDependent?: boolean;
      specialNotes?: string;
      cancellationPolicy?: string;
      photographyConsent?: boolean;
      additionalImages?: string;
    }) => orpc.events.create(data),
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

// Hook for updating an event
export const useUpdateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      title?: string;
      description?: string;
      startDate?: string;
      endDate?: string | null;
      locations?: string[];
      minAge?: number;
      maxAge?: number;
      maxParticipants?: number;
      price?: string;
      status?: "draft" | "open" | "closed" | "full" | "cancelled";
      imageUrl?: string;
      imageFile?: File;
      // Extended information fields
      detailedDescription?: string;
      program?: string;
      requirements?: string;
      whatToBring?: string;
      parentNotes?: string;
      emergencyContacts?: string;
      meetingPoint?: string;
      dropOffTime?: string;
      pickUpTime?: string;
      includesLunch?: boolean;
      includesSnack?: boolean;
      transportProvided?: boolean;
      weatherDependent?: boolean;
      specialNotes?: string;
      cancellationPolicy?: string;
      photographyConsent?: boolean;
      additionalImages?: string;
      organizationId?: string;
    }) => orpc.events.update(data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ["events"] });
      // Invalidate specific event
      queryClient.invalidateQueries({ queryKey: ["events", variables.id] });
    },
  });
};

// Hook for assigning event to organization
export const useAssignEventToOrganizationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { eventId: string; organizationId: string | null }) =>
      orpc.events.assignToOrganization(data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ["events"] });
      // Invalidate specific event
      queryClient.invalidateQueries({
        queryKey: ["events", variables.eventId],
      });
    },
  });
};
