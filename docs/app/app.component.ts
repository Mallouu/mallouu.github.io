import { Component } from '@angular/core';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { SideNavComponent } from './user-page/side-nav/side-nav.component';
import { MainCardComponent } from './user-page/main-card/main-card.component';

@Component({
    selector: 'app-root',
    imports: [HeaderComponent, FooterComponent, SideNavComponent, MainCardComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    title = 'reservations-snv';
}
