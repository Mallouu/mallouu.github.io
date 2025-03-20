import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatCard, MatCardContent, MatCardModule } from '@angular/material/card';
import { MatCalendar, MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { getCoursesDate } from '../../../core/services/dataMock.services';

@Component({
    selector: 'app-calendar',
    imports: [CommonModule, MatCard, MatCardContent, MatCardModule, MatCalendar],
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent implements OnInit {
    selectedDate: Date | null = null;
    dateCourses: Date[] = [];
    selectedDates: Date[] = [];
    refreshCalendar = new Subject<boolean>();
    @Output() dateSelected = new EventEmitter<Date | null>();

    constructor() {
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

    onSelectedDate(selectedDate: Date | null) {
        this.selectedDate = selectedDate;
        this.dateSelected.emit(selectedDate);
    }

    protected format(date: Date | null) {
        if (date instanceof Date) {
            return date ? date.toLocaleDateString() : '';
        }
        return '';
    }
}
