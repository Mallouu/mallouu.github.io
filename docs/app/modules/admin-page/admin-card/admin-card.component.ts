import { Component, Input } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-admin-card',
    imports: [MatCardContent, MatCardTitle, MatIcon, MatCard, MatCardHeader],
    templateUrl: './admin-card.component.html',
    styleUrl: './admin-card.component.scss',
})
export class AdminCardComponent {
    @Input() count: number = 0;
    @Input() title: string = '';
    @Input() icon: string = '';
}
