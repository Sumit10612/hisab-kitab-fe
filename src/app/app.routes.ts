import { Routes } from '@angular/router';

import { canActivate, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';

import { LoginComponent } from './components/login.component';
import { HomeComponent } from './components/home/home.component';
import { SignupComponent } from './components/signup.component';
import { ProfileComponent } from './components/profile.component';
import { EditProfileComponent } from './components/edit-profile.component';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(["/login"]);
const redirectLoggedInToHome = () => redirectLoggedInTo(["/home"]);

export const routes: Routes = [
    {
        path: '',
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
    }
];
