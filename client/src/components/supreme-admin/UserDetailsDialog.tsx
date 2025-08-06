import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Calendar,
  Mail,
  Phone,
  Shield,
  User,
  Users,
  Building,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Globe,
} from "lucide-react";
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface SupremeAdminUser {
  id: string;
  name: string | null;
  email: string;
  phoneNumber: string | null;
  phoneNumberVerified: boolean | null;
  emailVerified: boolean;
  birthDate: string | null;
  role: "user" | "admin" | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserDetailsDialogProps {
  user: SupremeAdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
}: UserDetailsDialogProps) {
  if (!user) return null;

  const isAdmin = user.role === "admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Dettagli Utente Globali
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Header */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl">
                {user.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-semibold">
                {user.name || "Nome non specificato"}
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
                {user.phoneNumber && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {user.phoneNumber}
                    {user.phoneNumberVerified ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right space-y-2">
              {isAdmin ? (
                <Badge className="bg-purple-100 text-purple-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Supreme Admin
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <User className="h-3 w-3 mr-1" />
                  Utente
                </Badge>
              )}
              <div className="text-xs text-muted-foreground">ID: {user.id}</div>
            </div>
          </div>

          {/* Account Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Stato Account
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  {user.emailVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">
                  {user.emailVerified ? "Verificata" : "Non verificata"}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  {user.phoneNumberVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Telefono</p>
                <p className="text-sm font-medium">
                  {user.phoneNumber
                    ? user.phoneNumberVerified === true
                      ? "Verificato"
                      : "Non verificato"
                    : "Non fornito"}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Shield className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-xs text-muted-foreground">Ruolo</p>
                <p className="text-sm font-medium">
                  {user.role === "admin" ? "Supreme Admin" : "Utente"}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="h-5 w-5 text-gray-500" />
                </div>
                <p className="text-xs text-muted-foreground">Stato</p>
                <p className="text-sm font-medium text-green-600">Attivo</p>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informazioni Personali
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Nome Completo
                  </Label>
                  <p className="text-sm font-medium">
                    {user.name || "Non specificato"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Telefono
                  </Label>
                  <p className="text-sm font-medium">
                    {user.phoneNumber || "Non fornito"}
                  </p>
                </div>
                {user.birthDate && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Data di Nascita
                    </Label>
                    <p className="text-sm font-medium">
                      {format(new Date(user.birthDate), "dd MMMM yyyy", {
                        locale: it,
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date e Timestamp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Registrazione
                  </Label>
                  <p className="text-sm font-medium">
                    {format(user.createdAt, "dd MMMM yyyy 'alle' HH:mm", {
                      locale: it,
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Ultimo Aggiornamento
                  </Label>
                  <p className="text-sm font-medium">
                    {format(user.updatedAt, "dd MMMM yyyy 'alle' HH:mm", {
                      locale: it,
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Account ID
                  </Label>
                  <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    {user.id}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Privileges (if admin) */}
          {isAdmin && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                  <Shield className="h-4 w-4" />
                  Privilegi Supreme Admin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium text-purple-700">
                      Gestione Utenti:
                    </p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Visualizzazione tutti gli utenti</li>
                      <li>• Promozione/Rimozione admin</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-purple-700">
                      Controllo Sistema:
                    </p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Accesso pannello supremo</li>
                      <li>• Gestione globale organizzazioni</li>
                      <li>• Controllo configurazioni</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Informazioni Tecniche
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    User ID
                  </Label>
                  <p className="font-mono bg-muted px-2 py-1 rounded mt-1">
                    {user.id}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Created At
                  </Label>
                  <p className="font-mono bg-muted px-2 py-1 rounded mt-1">
                    {user.createdAt.toISOString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Updated At
                  </Label>
                  <p className="font-mono bg-muted px-2 py-1 rounded mt-1">
                    {user.updatedAt.toISOString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
