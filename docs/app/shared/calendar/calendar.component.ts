import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Output,
} from '@angular/core';
import { MatCard, MatCardContent, MatCardModule } from '@angular/material/card';
import { DateRange, MatCalendar, MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-calendar',
    imports: [CommonModule, MatCard, MatCardContent, MatCardModule, MatCalendar],
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent {
    selectedDate: DateRange<Date> | Date | null = null;
    dateCourses: Date[] = [new Date(2025, 2, 3), new Date(2025, 2, 15), new Date(2025, 2, 30)];
    selectedDates: Date[] = [];
    refreshCalendar = new Subject<boolean>();
    @Output() dateSelected = new EventEmitter<unknown>();

    constructor(private cdr: ChangeDetectorRef) {
        this.refreshCalendar.next(true);
    }

    dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
        if (view === 'month') {
            const coursesAvailable = this.dateCourses.some(
                (d) => this.format(cellDate) === this.format(d),
            );
            const selected = this.selectedDates.some(
                (d) => this.format(cellDate) === this.format(d),
            );

            if (selected && coursesAvailable) {
                return 'cours-disponibles selected';
            }

            if (coursesAvailable) {
                return 'cours-disponibles';
            }

            if (selected) {
                return 'selected';
            }
        }
        return '';
    };

    protected format(date: Date | null | DateRange<Date>) {
        if (date instanceof Date) {
            return date ? date.toLocaleDateString() : '';
        }
        return '';
    }
}
