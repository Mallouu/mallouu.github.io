import { Component, EventEmitter, Output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-filter',
    imports: [NgClass],
    templateUrl: './filter.component.html',
    styleUrl: './filter.component.scss',
})
export class FilterComponent {
    filterBoatType: string | null | undefined;
    @Output() filterSelected = new EventEmitter<string | null>();

    setFilter(type: string | null) {
        this.filterBoatType = type;
        this.filterSelected.emit(this.filterBoatType);
        console.log('Filtre appliqué:', type);
    }
}
