import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { MatFabButton } from '@angular/material/button';

@Component({
    selector: 'app-header',
    imports: [MatToolbarModule, MatIcon, MatFabButton],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
})
export class HeaderComponent {
    constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
        iconRegistry.addSvgIcon(
            'boat',
            sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/boat.svg'),
        );
        iconRegistry.addSvgIcon(
            'private',
            sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/lock.svg'),
        );
    }
}
