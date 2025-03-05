import { Selector } from "@ngrx/store";

import { State } from "..";
import { User } from "../../models/user.model";
import { ErrorCode } from "../../utilities/error-codes";

export namespace UserSelector {

	export const select: Selector<State, User> = state => {
		if(!state.user.user) {
			throw ErrorCode.NOT_FOUND;
		}
		
		return state.user.user;
	};
}