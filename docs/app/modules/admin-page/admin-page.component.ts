import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { Course } from '../../shared/models/course';
import { Booking } from '../../shared/models/booking';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { AdminBookingListComponent } from './admin-booking-list/admin-booking-list.component';
import { AdminCourseListComponent } from './admin-course-list/admin-course-list.component';
import { AdminCardComponent } from './admin-card/admin-card.component';
import { MatDialog } from '@angular/material/dialog';
import { getBookings, getCourses } from '../../core/services/dataMock.services';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'app-admin-page',
    imports: [
        MatIcon,
        MatButton,
        MatTabGroup,
        MatTab,
        AdminBookingListComponent,
        AdminCourseListComponent,
        AdminCardComponent,
    ],
    templateUrl: './admin-page.component.html',
    styleUrl: './admin-page.component.scss',
})
export class AdminPageComponent implements OnInit {
    courses: Course[] = [];
    bookings: Booking[] = [];
    totalParticipants: number = 0;

    constructor(
        private authService: AuthService,
        private router: Router,
        private dialog: MatDialog,
        iconRegistry: MatIconRegistry,
        sanitizer: DomSanitizer,
    ) {
        iconRegistry.addSvgIcon(
            'event',
            sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/calendar.svg'),
        );
        iconRegistry.addSvgIcon(
            'list',
            sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/list.svg'),
        );
        iconRegistry.addSvgIcon(
            'people',
            sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/people.svg'),
        );
        iconRegistry.addSvgIcon(
            'add',
            sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/add.svg'),
        );
    }

    ngOnInit() {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
        }
        this.courses = getCourses();
        this.bookings = getBookings();
    }

    openCourseDialog() {
        this.router.navigate(['/building']);
        // const dialogRef = this.dialog.open(AdminCourseFormComponent);
        // dialogRef.afterClosed().subscribe((result) => {
        //     if (result) {
        //         this.courses.push(result);
        //     }
        // });
    }

    handleDeleteCourse(courseId: any) {
        this.courses = this.courses.filter((course) => course.id !== courseId);
    }
}
