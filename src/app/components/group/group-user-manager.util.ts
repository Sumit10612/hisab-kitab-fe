import { GroupMember, MemberRole } from "../../models/group.model";

export namespace GroupUserManager {
	export const isAdmin = (member: GroupMember | undefined): boolean => {
		return !!(member && member.role === MemberRole.admin);
	};
	
	export const isCurrentUser = (member: GroupMember | undefined): boolean => {
		return !!(member && member.name === "You");
	};

	export const isVirtualMember = (member: GroupMember | undefined): boolean => {
		return !!(member && member.isVirtual);
	};
	
	export const getCurrentUser = (members: Record<string, GroupMember> | undefined): GroupMember | undefined => {
		return Object.values(members ?? {}).find(member => isCurrentUser(member));
	};
}