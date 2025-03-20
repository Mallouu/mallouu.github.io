import { Component, EventEmitter, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { BoatType, LevelType } from '../../../../shared/models/course';

@Component({
    selector: 'app-filter',
    imports: [NgClass],
    templateUrl: './filter.component.html',
    styleUrl: './filter.component.scss',
})
export class FilterComponent {
    filterBoatType: BoatType | null | undefined = BoatType.Unset;
    filterLevelType: LevelType | null | undefined = LevelType.Unset;
    @Output() filterSelected = new EventEmitter<BoatType | null>();
    @Output() filterLevelSelected = new EventEmitter<LevelType | null>();
    protected readonly BoatType = BoatType;
    protected readonly LevelType = LevelType;

    setFilterBoat(type: BoatType | null) {
        this.filterBoatType = type;
        this.filterSelected.emit(this.filterBoatType);
        console.log('Filtre appliqué:', type);
    }

    setFilterLevel(type: LevelType | null) {
        this.filterLevelType = type;
        this.filterLevelSelected.emit(this.filterLevelType);
        console.log('Filtre appliqué:', type);
    }
}
