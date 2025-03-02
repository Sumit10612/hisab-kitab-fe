import { APP_INITIALIZER, ApplicationConfig, isDevMode } from "@angular/core";
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getAuth, provideAuth } from "@angular/fire/auth";
import { getFirestore, provideFirestore } from "@angular/fire/firestore";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import { provideEffects } from "@ngrx/effects";
import { provideRouterStore } from "@ngrx/router-store";
import { provideStore } from "@ngrx/store";
import { provideStoreDevtools } from "@ngrx/store-devtools";

import { routes } from "./app.routes";
import { PwaService } from "./services/pwa.service";
import { effects, metaReducers, reducers } from "./store";
import { AppRouterStateSerializer } from "./store/app.serializer";

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
		provideFirebaseApp(() => initializeApp(firebaseConfig)),
		provideAuth(() => getAuth()),
		provideFirestore(() => getFirestore()),
		MatSnackBarModule,
		MatBottomSheetModule,
		provideServiceWorker("ngsw-worker.js", {
			enabled: !isDevMode(),
			registrationStrategy: "registerWhenStable:30000"
		}),
		{ provide: APP_INITIALIZER, useFactory: initializer, deps: [PwaService], multi: true },
		{ provide: MatDialogRef, useValue: {} },
		{ provide: MAT_DIALOG_DATA, useValue: {} },
		provideStore(reducers, { metaReducers }),
		provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
		provideEffects(effects),
		provideRouterStore({ serializer: AppRouterStateSerializer }),
	]
};
