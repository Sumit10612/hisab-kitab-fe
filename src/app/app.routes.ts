import { canActivate, redirectLoggedInTo, redirectUnauthorizedTo } from "@angular/fire/auth-guard";
import { Routes } from "@angular/router";

import { ExpenseEditorComponent } from "./components/expense-editor.component";
import { GroupEditorComponent } from "./components/group-editor/group-editor.component";
import { GroupExpenseDetailComponent } from "./components/group-expesnse-deatil/group-expesnse-deatil.component";
import { HomeComponent } from "./components/home.component";
import { LoginComponent } from "./components/login.component";
import { ProfileEditorComponent } from "./components/profile-editor.component";
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
		component: ProfileEditorComponent,
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
