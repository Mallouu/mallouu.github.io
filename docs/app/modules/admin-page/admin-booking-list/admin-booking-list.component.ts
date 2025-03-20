import { Component, Input } from '@angular/core';
import { Booking } from '../../../shared/models/booking';
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
import { DatePipe, NgIf } from '@angular/common';

@Component({
    selector: 'app-admin-booking-list',
    imports: [
        MatTable,
        MatColumnDef,
        MatHeaderCell,
        MatCell,
        MatHeaderCellDef,
        MatCellDef,
        DatePipe,
        MatHeaderRow,
        MatRow,
        MatRowDef,
        MatHeaderRowDef,
        NgIf,
    ],
    templateUrl: './admin-booking-list.component.html',
    styleUrl: './admin-booking-list.component.scss',
})
export class AdminBookingListComponent {
    @Input() bookings!: Booking[];
    displayedColumns: string[] = [
        'courseTitle',
        'customerName',
        'customerEmail',
        'customerPhone',
        'bookingDate',
    ];
}
