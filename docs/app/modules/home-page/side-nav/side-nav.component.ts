import { Component } from '@angular/core';
import { CalendarComponent } from '../../../shared/calendar/calendar.component';
import { FilterComponent } from './filter/filter.component';

@Component({
    selector: 'app-side-nav',
    imports: [CalendarComponent, FilterComponent],
    templateUrl: './side-nav.component.html',
    styleUrl: './side-nav.component.scss',
})
export class SideNavComponent {
    filterBoatType: string | null = null;
    selectedDate: unknown = null;

    onDateSelect(date: unknown) {
        this.selectedDate = date;
        console.log('Date sélectionnée:', date);
    }

    onFilterSelected($event: string | null): void {
        this.filterBoatType = $event;
        console.log('filterBoatType:', $event);
    }
}
