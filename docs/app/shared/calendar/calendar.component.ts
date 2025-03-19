import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    OnInit,
    Output,
} from '@angular/core';
import { MatCard, MatCardContent, MatCardModule } from '@angular/material/card';
import { DateRange, MatCalendar, MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { getCoursesDate } from '../../core/services/dataMock.services';

@Component({
    selector: 'app-calendar',
    imports: [CommonModule, MatCard, MatCardContent, MatCardModule, MatCalendar],
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent implements OnInit {
    selectedDate: DateRange<Date> | Date | null = null;
    dateCourses: Date[] = [];
    selectedDates: Date[] = [];
    refreshCalendar = new Subject<boolean>();
    @Output() dateSelected = new EventEmitter<unknown>();

    constructor(private cdr: ChangeDetectorRef) {
        this.refreshCalendar.next(true);
    }

    ngOnInit() {
        this.dateCourses = getCoursesDate();
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
