import { Routes } from '@angular/router';

import { canActivate, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';

import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login.component';
import { HomeComponent } from './components/home/home.component';
import { SignupComponent } from './components/signup.component';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(["/login"]);
const redirectLoggedInToHome = () => redirectLoggedInTo(["/home"]);

export const routes: Routes = [
    {
        path: '',
        pathMatch: "full",
        component: LandingComponent
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
    }
];
