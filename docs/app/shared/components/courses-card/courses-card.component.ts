import { Component, Input } from '@angular/core';
import { MatCard, MatCardActions, MatCardContent, MatCardImage } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { Course } from '../../models/course';
import { DatePipe, NgIf, NgOptimizedImage } from '@angular/common';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { MatChip } from '@angular/material/chips';

@Component({
    selector: 'app-courses-card',
    imports: [
        MatCard,
        MatCardImage,
        MatCardContent,
        MatCardActions,
        MatButton,
        DatePipe,
        NgIf,
        NgOptimizedImage,
        MatIcon,
        MatChip,
    ],
    templateUrl: './courses-card.component.html',
    styleUrl: './courses-card.component.scss',
})
export class CoursesCardComponent {
    @Input() course!: Course;

    constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
        iconRegistry.addSvgIcon(
            'date',
            sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/calendar.svg'),
        );
        iconRegistry.addSvgIcon(
            'time',
            sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/time.svg'),
        );
        iconRegistry.addSvgIcon(
            'boatType',
            sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/boat-type.svg'),
        );
        iconRegistry.addSvgIcon(
            'people',
            sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/people.svg'),
        );
        iconRegistry.addSvgIcon(
            'capitain',
            sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/captain.svg'),
        );
    }

    onReserve() {
        console.log('Réserve');
    }
}
