import { eventsRouter } from "./events.router";
import { familyRouter } from "./family.router";
import { fileUploadRouter } from "./file-upload.router";
import { registrationsRouter } from "./registrations.router";
import { os } from "./server";
import { settingsRouter } from "./settings.router";
import { userRouter } from "./user.router";

export const appRouter = os.router({
  family: familyRouter,
  events: eventsRouter,
  user: userRouter,
  registrations: registrationsRouter,
  fileUpload: fileUploadRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
