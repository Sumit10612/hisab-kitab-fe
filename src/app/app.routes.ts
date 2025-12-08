import {
    canActivate,
    redirectLoggedInTo,
    redirectUnauthorizedTo,
} from "@angular/fire/auth-guard";
import { Routes } from "@angular/router";

import { ExpenseEditorComponent } from "./components/expense-editor.component";
import { GroupEditorComponent } from "./components/group/group-editor.component";
import { GroupExpensesComponent } from "./components/group-expenses/group-expesnses.component";
import { HomeComponent } from "./components/home/home.component";
import { LoginComponent } from "./components/login.component";
import { ProfileEditorComponent } from "./components/profile-editor.component";
import { SignupComponent } from "./components/signup.component";
import { GroupExpensesSummaryComponent } from "./components/group-expenses/group-expenses-summary.component";
import { GroupExpensesBalancesComponent } from "./components/group-expenses/group-expenses-balances.component";
import { RecordPaymentComponent } from "./components/record-payment.component";

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(["/login"]);
const redirectLoggedInToHome = () => redirectLoggedInTo(["/home"]);

export const routes: Routes = [
    {
        path: "",
        pathMatch: "full",
        component: LoginComponent,
        ...canActivate(redirectLoggedInToHome),
    },
    {
        path: "login",
        component: LoginComponent,
        ...canActivate(redirectLoggedInToHome),
    },
    {
        path: "sign-up",
        component: SignupComponent,
        ...canActivate(redirectLoggedInToHome),
    },
    {
        path: "home",
        component: HomeComponent,
        ...canActivate(redirectUnauthorizedToLogin),
    },
    {
        path: "profile",
        component: ProfileEditorComponent,
        ...canActivate(redirectUnauthorizedToLogin),
    },
    {
        path: "group",
        component: GroupEditorComponent,
        ...canActivate(redirectUnauthorizedToLogin),
    },
    {
        path: "group/:groupId",
        component: GroupEditorComponent,
        ...canActivate(redirectUnauthorizedToLogin),
    },
    {
        path: "group/:groupId/expenses",
        component: GroupExpensesComponent,
        ...canActivate(redirectUnauthorizedToLogin),
    },
    {
        path: "group/:groupId/payment",
        component: RecordPaymentComponent,
        ...canActivate(redirectUnauthorizedToLogin),
    },
    {
        path: "group/:groupId/expenses/summary",
        component: GroupExpensesSummaryComponent,
        ...canActivate(redirectUnauthorizedToLogin),
    },
    {
        path: "group/:groupId/expenses/balance",
        component: GroupExpensesBalancesComponent,
        ...canActivate(redirectUnauthorizedToLogin),
    },
    {
        path: "group/:groupId/expense",
        component: ExpenseEditorComponent,
        ...canActivate(redirectUnauthorizedToLogin),
    },
    {
        path: "group/:groupId/expense/:expenseId",
        component: ExpenseEditorComponent,
        ...canActivate(redirectUnauthorizedToLogin),
    },
];
