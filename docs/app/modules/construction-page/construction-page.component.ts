import { Component } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { NgOptimizedImage } from '@angular/common';

@Component({
    selector: 'app-construction-page',
    imports: [MatCard, NgOptimizedImage],
    templateUrl: './construction-page.component.html',
    styleUrl: './construction-page.component.scss',
})
export class ConstructionPageComponent {}
