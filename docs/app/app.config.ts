import { ApplicationConfig, Injectable, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import {
    DateAdapter,
    MAT_DATE_LOCALE,
    NativeDateAdapter,
    provideNativeDateAdapter,
} from '@angular/material/core';

@Injectable({ providedIn: 'root' })
export class CustomDateAdapter extends NativeDateAdapter {
    public override getFirstDayOfWeek(): number {
        return 1;
    }
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideAnimationsAsync(),
        provideHttpClient(),
        provideNativeDateAdapter(),
        { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
        { provide: DateAdapter, useClass: CustomDateAdapter },
    ],
};
