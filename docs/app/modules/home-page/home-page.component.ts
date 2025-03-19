import { Component } from '@angular/core';
import { FooterComponent } from '../../shared/footer/footer.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { MainCardComponent } from './main-card/main-card.component';
import { SideNavComponent } from './side-nav/side-nav.component';

@Component({
    selector: 'app-home-page',
    imports: [FooterComponent, HeaderComponent, MainCardComponent, SideNavComponent],
    templateUrl: './home-page.component.html',
    styleUrl: './home-page.component.scss',
})
export class HomePageComponent {}
