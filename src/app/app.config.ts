import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideServiceWorker } from '@angular/service-worker';

import { getFirestore, provideFirestore } from '@angular/fire/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAMBjtKAO5RZXUggmiljSbKh_EQdzoPUBs",
  authDomain: "hisab-kitab-d6b5d.firebaseapp.com",
  projectId: "hisab-kitab-d6b5d",
  storageBucket: "hisab-kitab-d6b5d.appspot.com",
  messagingSenderId: "300743409801",
  appId: "1:300743409801:web:c65735e9941625fb7b8658"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    importProvidersFrom([
        provideFirebaseApp(() => initializeApp(firebaseConfig)),
        provideAuth(() => getAuth()),
        provideFirestore(() => getFirestore())
    ]),
    MatSnackBarModule,
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    })
]
};
