import { useState } from "react";
import { useEventsQuery } from "./hooks/useEventsQuery";
import {
  useCreateFamilyMutation,
  useFamiliesQuery,
} from "./hooks/useFamilyQuery";

function App() {
  const [showEvents, setShowEvents] = useState(false);

  // Test families query
  const {
    data: families,
    isLoading: familiesLoading,
    error: familiesError,
  } = useFamiliesQuery();
  const createFamilyMutation = useCreateFamilyMutation();

  // Test events query
  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
  } = useEventsQuery();

  const handleCreateFamily = async () => {
    try {
      await createFamilyMutation.mutateAsync({
        name: "Test Family",
        description: "This is a test family",
      });
    } catch (error) {
      console.error("Failed to create family:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          oRPC Test Application
        </h1>

        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Families</h2>

            {familiesLoading && <p>Loading families...</p>}
            {familiesError && (
              <p className="text-destructive">
                Error loading families: {familiesError.message}
              </p>
            )}

            {families && (
              <div>
                <p className="mb-4">Found {families.length} families</p>
                {families.length > 0 ? (
                  <ul className="space-y-2">
                    {families.map((family: any) => (
                      <li key={family.id} className="bg-muted p-3 rounded">
                        <strong>{family.name}</strong>
                        {family.description && (
                          <p className="text-muted-foreground">
                            {family.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No families found</p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateFamily}
              disabled={createFamilyMutation.isPending}
              className="mt-4 bg-primary hover:bg-primary/80 text-primary-foreground font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {createFamilyMutation.isPending
                ? "Creating..."
                : "Create Test Family"}
            </button>
          </div>

          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Events</h2>

            <button
              type="button"
              onClick={() => setShowEvents(!showEvents)}
              className="mb-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-2 px-4 rounded"
            >
              {showEvents ? "Hide Events" : "Show Events"}
            </button>

            {showEvents && (
              <div>
                {eventsLoading && <p>Loading events...</p>}
                {eventsError && (
                  <p className="text-destructive">
                    Error loading events: {eventsError.message}
                  </p>
                )}

                {events && (
                  <div>
                    <p className="mb-4">Found {events.data.length} events</p>
                    {events.data.length > 0 ? (
                      <ul className="space-y-2">
                        {events.data.map((event: any) => (
                          <li key={event.id} className="bg-muted p-3 rounded">
                            <strong>{event.title}</strong>
                            {event.description && (
                              <p className="text-muted-foreground">
                                {event.description}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              Start: {event.startDate}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No events found</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
