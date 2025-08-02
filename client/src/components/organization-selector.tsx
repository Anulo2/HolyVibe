import { useState } from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useActiveOrganization } from "@/hooks/useSettings";

export function OrganizationSelector() {
  const [open, setOpen] = useState(false);
  const {
    activeOrganizationId,
    setActiveOrganizationId,
    organizations,
    isLoadingOrganizations,
  } = useActiveOrganization();

  const activeOrganization = organizations.find(
    (org) => org.id === activeOrganizationId,
  );

  if (isLoadingOrganizations) {
    return (
      <div className="flex items-center space-x-2">
        <Building2 className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">Caricamento...</span>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <Building2 className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">
          Nessuna organizzazione
        </span>
      </div>
    );
  }

  if (organizations.length === 1) {
    return (
      <div className="flex items-center space-x-2">
        <Building2 className="h-4 w-4" />
        <span className="text-sm font-medium">{organizations[0].name}</span>
        <Badge variant="secondary" className="text-xs">
          {organizations[0].role}
        </Badge>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">
              {activeOrganization
                ? activeOrganization.name
                : "Seleziona organizzazione..."}
            </span>
            {activeOrganization && (
              <Badge variant="secondary" className="text-xs">
                {activeOrganization.role}
              </Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Cerca organizzazione..." />
          <CommandList>
            <CommandEmpty>Nessuna organizzazione trovata.</CommandEmpty>
            <CommandGroup>
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.id}
                  onSelect={(currentValue) => {
                    setActiveOrganizationId(
                      currentValue === activeOrganizationId
                        ? null
                        : currentValue,
                    );
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <Check
                        className={cn(
                          "h-4 w-4",
                          activeOrganizationId === org.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <div className="flex items-center space-x-2">
                        {org.image && (
                          <img
                            src={org.image}
                            alt={org.name}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        )}
                        <span className="truncate">{org.name}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {org.role}
                    </Badge>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
