import { Selector } from "@ngrx/store";

import { State } from "..";
import { User } from "../../models/user.model";

export namespace UserSelector {

	export const select: Selector<State, User | undefined> = state => state.user.user;
}