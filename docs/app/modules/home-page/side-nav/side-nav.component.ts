import { Component, EventEmitter, Output } from '@angular/core';
import { CalendarComponent } from '../../../shared/components/calendar/calendar.component';
import { FilterComponent } from './filter/filter.component';
import { BoatType, LevelType } from '../../../shared/models/course';

@Component({
    selector: 'app-side-nav',
    imports: [CalendarComponent, FilterComponent],
    templateUrl: './side-nav.component.html',
    styleUrl: './side-nav.component.scss',
})
export class SideNavComponent {
    filterBoatType: BoatType | null = null;
    selectedDate: Date | null = null;
    @Output() onFilterChange = new EventEmitter<BoatType | null>();
    @Output() onDateChange = new EventEmitter<Date | null>();
    @Output() onFilterLevelChange = new EventEmitter<LevelType | null>();

    onDateSelect(date: Date | null) {
        this.selectedDate = date;
        this.onDateChange.emit(date);
        console.log('Date sélectionnée:', date);
    }

    onFilterSelected($event: BoatType | null): void {
        this.filterBoatType = $event;
        this.onFilterChange.emit($event);
        console.log('filterBoatType:', $event);
    }

    onFilterLevelSelected($event: LevelType | null): void {
        this.onFilterLevelChange.emit($event);
        console.log('filterBoatType:', $event);
    }
}
