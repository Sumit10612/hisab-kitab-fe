import { canActivate, redirectLoggedInTo, redirectUnauthorizedTo } from "@angular/fire/auth-guard";
import { Routes } from "@angular/router";

import { EditProfileComponent } from "./components/edit-profile.component";
import { ExpenseEditorComponent } from "./components/expense-editor.component";
import { GroupEditorComponent } from "./components/group-editor.component";
import { GroupExpenseDetailComponent } from "./components/group-expesnse-deatil.component";
import { HomeComponent } from "./components/home.component";
import { LoginComponent } from "./components/login.component";
import { ProfileComponent } from "./components/profile.component";
import { SignupComponent } from "./components/signup.component";

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(["/login"]);
const redirectLoggedInToHome = () => redirectLoggedInTo(["/home"]);

export const routes: Routes = [
	{
		path: "",
		pathMatch: "full",
		component: LoginComponent,
		...canActivate(redirectLoggedInToHome)
	},
	{
		path: "login",
		component: LoginComponent,
		...canActivate(redirectLoggedInToHome)
	},
	{
		path: "sign-up",
		component: SignupComponent,
		...canActivate(redirectLoggedInToHome)
	},
	{
		path: "home",
		component: HomeComponent,
		...canActivate(redirectUnauthorizedToLogin)
	},
	{
		path: "profile",
		component: ProfileComponent,
		...canActivate(redirectUnauthorizedToLogin)
	},
	{
		path: "edit-profile",
		component: EditProfileComponent,
		...canActivate(redirectUnauthorizedToLogin)
	},
	{
		path: "group-detail/:id",
		component: GroupExpenseDetailComponent,
		...canActivate(redirectUnauthorizedToLogin)
	},
	{
		path: "group",
		component: GroupEditorComponent,
		...canActivate(redirectUnauthorizedToLogin)
	},
	{
		path: "group/:id",
		component: GroupEditorComponent,
		...canActivate(redirectUnauthorizedToLogin)
	},
	{
		path: "group/:groupId/expense",
		component: ExpenseEditorComponent,
		...canActivate(redirectUnauthorizedToLogin)
	},
	{
		path: "group/:groupId/expense/:id",
		component: ExpenseEditorComponent,
		...canActivate(redirectUnauthorizedToLogin)
	}
];
