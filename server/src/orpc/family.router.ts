import { os } from "@orpc/server";
import { authorizedPersonsRouter } from "./family/authorizedPersons.router";
import { childrenRouter } from "./family/children.router";
import { coreRouter } from "./family/core.router";
import { invitationsRouter } from "./family/invitations.router";

export const familyRouter = os.router({
	// Core family operations
	list: coreRouter.list,
	create: coreRouter.create,
	updateFamily: coreRouter.updateFamily,

	// Children operations
	getChildren: childrenRouter.getChildren,
	addChild: childrenRouter.addChild,
	updateChild: childrenRouter.updateChild,

	// Authorized persons operations
	getAuthorizedPersons: authorizedPersonsRouter.getAuthorizedPersons,
	addAuthorizedPerson: authorizedPersonsRouter.addAuthorizedPerson,
	updateAuthorizedPerson: authorizedPersonsRouter.updateAuthorizedPerson,

	// Invitations operations
	getInvitations: invitationsRouter.getInvitations,
	sendInvitation: invitationsRouter.sendInvitation,
	getInvitationDetails: invitationsRouter.getInvitationDetails,
	acceptInvitation: invitationsRouter.acceptInvitation,
	cancelInvitation: invitationsRouter.cancelInvitation,
	checkPhoneInvitations: invitationsRouter.checkPhoneInvitations,
});
