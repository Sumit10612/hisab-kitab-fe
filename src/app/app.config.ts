import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, isDevMode } from "@angular/core";
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getAuth, provideAuth } from "@angular/fire/auth";
import { getFirestore, provideFirestore } from "@angular/fire/firestore";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";

import { routes } from "./app.routes";
import { PwaService } from "./services/pwa.service";

const firebaseConfig = {
	apiKey: "AIzaSyAMBjtKAO5RZXUggmiljSbKh_EQdzoPUBs",
	authDomain: "hisab-kitab-d6b5d.firebaseapp.com",
	projectId: "hisab-kitab-d6b5d",
	storageBucket: "hisab-kitab-d6b5d.appspot.com",
	messagingSenderId: "300743409801",
	appId: "1:300743409801:web:c65735e9941625fb7b8658"
};

const initializer = (pwaService: PwaService) => () => pwaService.initPwaPrompt();

export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter(routes, withComponentInputBinding()),
		provideAnimationsAsync(),
		importProvidersFrom([
			provideFirebaseApp(() => initializeApp(firebaseConfig)),
			provideAuth(() => getAuth()),
			provideFirestore(() => getFirestore())
		]),
		MatSnackBarModule,
		MatBottomSheetModule,
		provideServiceWorker("ngsw-worker.js", {
			enabled: !isDevMode(),
			registrationStrategy: "registerWhenStable:30000"
		}),
		{ provide: APP_INITIALIZER, useFactory: initializer, deps: [PwaService], multi: true },
	]
};
