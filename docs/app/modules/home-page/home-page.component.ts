import { Component } from '@angular/core';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { MainCardComponent } from './main-card/main-card.component';
import { SideNavComponent } from './side-nav/side-nav.component';

@Component({
    selector: 'app-home-page',
    imports: [FooterComponent, MainCardComponent, SideNavComponent],
    templateUrl: './home-page.component.html',
    styleUrl: './home-page.component.scss',
})
export class HomePageComponent {}
