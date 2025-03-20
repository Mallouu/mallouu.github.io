import { Component, OnInit } from '@angular/core';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { MainCardComponent } from './main-card/main-card.component';
import { SideNavComponent } from './side-nav/side-nav.component';
import {
    getCourses,
    getCoursesByBoatType,
    getCoursesByDate,
    getCoursesByLevelType,
} from '../../core/services/dataMock.services';
import { BoatType, Course, LevelType } from '../../shared/models/course';

@Component({
    selector: 'app-home-page',
    imports: [FooterComponent, MainCardComponent, SideNavComponent],
    templateUrl: './home-page.component.html',
    styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit {
    listeCours: Course[] | undefined;
    filterBoatType: BoatType | null = null;
    filterLevelType: LevelType | null = null;

    ngOnInit() {
        this.listeCours = getCourses();
    }

    selectFilter(boatType: BoatType | null) {
        this.filterBoatType = boatType;
        if (this.filterBoatType === null || this.filterBoatType === BoatType.Unset) {
            this.listeCours = getCourses();
        } else {
            this.listeCours = getCoursesByBoatType(this.filterBoatType);
        }
    }

    selectLevelFilter(levelType: LevelType | null) {
        this.filterLevelType = levelType;
        if (this.filterLevelType === null || this.filterLevelType === LevelType.Unset) {
            this.listeCours = getCourses();
        } else {
            this.listeCours = getCoursesByLevelType(this.filterLevelType);
        }
    }

    selectDate($event: Date | null) {
        if ($event === null) {
            this.listeCours = getCourses();
        } else {
            this.listeCours = getCoursesByDate($event);
        }
    }
}
