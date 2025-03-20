import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatTable,
} from '@angular/material/table';
import { MatButton } from '@angular/material/button';
import { DatePipe, NgIf } from '@angular/common';
import { Course } from '../../../shared/models/course';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-admin-course-list',
    imports: [
        MatTable,
        MatColumnDef,
        MatHeaderCell,
        MatCell,
        MatCellDef,
        MatHeaderCellDef,
        MatButton,
        MatHeaderRowDef,
        MatHeaderRow,
        MatRow,
        MatRowDef,
        DatePipe,
        MatIcon,
        NgIf,
    ],
    templateUrl: './admin-course-list.component.html',
    styleUrl: './admin-course-list.component.scss',
})
export class AdminCourseListComponent {
    @Output() deleteCourse = new EventEmitter<unknown>();
    @Input() courses: Course[] = [];
}
