import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/orpc-react";

export interface ExtendedEventDetails {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  locations: string[];
  minAge: number;
  maxAge: number;
  maxParticipants: number;
  currentParticipants: number;
  price?: string;
  status: "draft" | "open" | "closed" | "full" | "cancelled";
  imageUrl?: string;
  // Extended fields
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
  willTakePhotos?: boolean;
  additionalImages?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Organization data
  organization?: {
    id: string;
    name: string;
    photoVideoMinorsDeclaration?: string;
  };
}

// Hook for fetching extended event details
export const useEventDetailsExtended = (eventId: string) => {
  return useQuery({
    queryKey: ["events", "extended", eventId],
    queryFn: async () => {
      const response = await orpc.events.get({ id: eventId });
      const data = response.data;
      // Parse locations from JSON string to array
      const parsedData = {
        ...data,
        locations: data.locations ? JSON.parse(data.locations) : [],
      };
      return parsedData as ExtendedEventDetails;
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to check if event has extended information
export const useEventHasExtendedInfo = (event: ExtendedEventDetails | null) => {
  if (!event) return false;

  const extendedFields = [
    event.detailedDescription,
    event.program,
    event.requirements,
    event.whatToBring,
    event.parentNotes,
    event.emergencyContacts,
    event.meetingPoint,
    event.dropOffTime,
    event.pickUpTime,
    event.specialNotes,
    event.cancellationPolicy,
    event.additionalImages,
  ];

  const booleanFields = [
    event.includesLunch,
    event.includesSnack,
    event.transportProvided,
    event.weatherDependent,
    event.photographyConsent !== null && event.photographyConsent !== undefined,
  ];

  return (
    extendedFields.some((field) => field && field.trim() !== "") ||
    booleanFields.some((field) => field === true)
  );
};

// Hook to get formatted extended event data for display
export const useFormattedEventDetails = (
  event: ExtendedEventDetails | null,
) => {
  if (!event) return null;

  const parseAdditionalImages = () => {
    if (!event.additionalImages) return [];
    try {
      return JSON.parse(event.additionalImages);
    } catch {
      return [];
    }
  };

  return {
    ...event,
    additionalImagesList: parseAdditionalImages(),
    hasExtendedInfo: useEventHasExtendedInfo(event),
    servicesIncluded: {
      lunch: event.includesLunch,
      snack: event.includesSnack,
      transport: event.transportProvided,
      weatherDependent: event.weatherDependent,
      photographyConsent: event.photographyConsent,
    },
  };
};
