import { Component, OnInit } from '@angular/core';
import { CoursesCardComponent } from '../../shared/courses-card/courses-card.component';
import { NgForOf } from '@angular/common';
import { Course } from '../../shared/models/course';
import { getCourses } from '../../services/dataMock.services';

@Component({
    selector: 'app-main-card',
    imports: [CoursesCardComponent, NgForOf],
    templateUrl: './main-card.component.html',
    styleUrl: './main-card.component.scss',
})
export class MainCardComponent implements OnInit {
    courses: Course[] | undefined;

    ngOnInit() {
        this.courses = getCourses();
    }
}
