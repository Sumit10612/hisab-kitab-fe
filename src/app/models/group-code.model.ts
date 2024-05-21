import { Timestamp } from "@angular/fire/firestore";

export interface GroupCode {
	code: number;
	timestamp: Timestamp;
}

export const toFirestore = (code: number): GroupCode => {
	return { code, timestamp: Timestamp.fromDate(new Date()) };
};

export const isExpired = (groupCode: GroupCode): boolean => {
	const date = groupCode.timestamp.toDate();
	date.setMinutes(date.getMinutes() + 5);
	return (new Date()).getTime() > date.getTime();
};