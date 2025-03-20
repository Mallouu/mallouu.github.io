// Mock data storage (would be replaced with real API)
import { BoatType, Course, LevelType } from '../../shared/models/course';
import { Booking } from '../../shared/models/booking';

let coursesList: Course[] = [
    {
        id: '1',
        title: 'Focus spy',
        date: new Date(Date.now() + 86400000),
        duration: 3,
        hour: '19:46',
        boatType: BoatType.J80,
        maxParticipants: 6,
        placeRestante: 3,
        instructor: 'Christophe LESUEUR',
        level: LevelType.Entrainement,
    },
    {
        id: '2',
        title: 'Préparation printemps 2',
        date: new Date(Date.now() + 172800000), // day after tomorrow
        duration: 4,
        hour: '16:30',
        boatType: BoatType.J70,
        maxParticipants: 4,
        placeRestante: 4,
        instructor: 'Christophe LESUEUR',
        level: LevelType.Entrainement,
    },
    {
        id: '3',
        title: 'Printemps 2',
        date: new Date(Date.now() + 259200000), // 3 days from now
        duration: 5,
        hour: '18:30',
        boatType: BoatType.J70,
        maxParticipants: 4,
        placeRestante: 1,
        instructor: 'Christophe LESUEUR',
        level: LevelType.Regate,
    },
    {
        id: '4',
        title: 'Découverte J70',
        date: new Date(Date.now() + 345600000), // 4 days from now
        hour: '14:30',
        duration: 3,
        boatType: BoatType.J70,
        maxParticipants: 4,
        placeRestante: 3,
        instructor: 'Christophe LESUEUR',
        level: LevelType.Initiation,
    },
    {
        id: '5',
        title: 'Balade en baie J80',
        date: new Date(Date.now() + 345600000), // 4 days from now
        hour: '14:30',
        duration: 3,
        boatType: BoatType.J80,
        maxParticipants: 6,
        placeRestante: 3,
        instructor: 'Alain LENOBLE',
        level: LevelType.Sortie,
    },
];

let bookings: Booking[] = [
    {
        id: '1',
        customerName: 'Jean Dupont',
        customerEmail: 'jean.dupont@example.com',
        customerPhone: '06 12 34 56 78',
        courseTitle: 'Découverte J70',
        bookingDate: new Date(),
        courseId: 4,
    },
    {
        id: '2',
        customerName: 'Alice Martin',
        customerEmail: 'alice.martin@example.com',
        customerPhone: '06 98 76 54 32',
        courseTitle: 'Balade en baie J80',
        bookingDate: new Date(),
        courseId: 5,
    },
];

// Data service functions
export const getCourses = (): Course[] => {
    return coursesList;
};

export const getCoursesByDate = (date: Date): Course[] => {
    return coursesList.filter(
        (course) =>
            course.date.getDate() === date.getDate() &&
            course.date.getMonth() === date.getMonth() &&
            course.date.getFullYear() === date.getFullYear(),
    );
};

export const getCoursesByBoatType = (boatType: BoatType): Course[] => {
    return coursesList.filter((course) => course.boatType === boatType);
};

export const getCoursesByLevelType = (levelType: LevelType): Course[] => {
    return coursesList.filter((course) => course.level === levelType);
};

export const getCoursesDate = (): Date[] => {
    return coursesList.map((course) => course.date);
};

export const getCourseById = (id: string): Course | undefined => {
    return coursesList.find((course) => course.id === id);
};

export const addCourse = (course: Omit<Course, 'id'>): Course => {
    const newCourse = { ...course, id: String(coursesList.length + 1) };
    coursesList = [...coursesList, newCourse];
    return newCourse;
};

export const updateCourse = (id: string, updates: Partial<Course>): Course | undefined => {
    const index = coursesList.findIndex((course) => course.id === id);
    if (index >= 0) {
        coursesList[index] = { ...coursesList[index], ...updates };
        return coursesList[index];
    }
    return undefined;
};

export const deleteCourse = (id: string): boolean => {
    const initialLength = coursesList.length;
    coursesList = coursesList.filter((course) => course.id !== id);
    return coursesList.length < initialLength;
};

export const getBookings = (): Booking[] => {
    return bookings;
};

export const getBookingsByCourse = (courseId: number): Booking[] => {
    return bookings.filter((booking) => booking.courseId === courseId);
};

export const addBooking = (booking: Omit<Booking, 'id'>): Booking => {
    const newBooking = { ...booking, id: String(bookings.length + 1), bookingDate: new Date() };
    bookings = [...bookings, newBooking];
    return newBooking;
};

export const validateAdmin = (username: string, password: string): boolean => {
    // In a real app, this would be a secure authentication system
    return username === 'admin' && password === 'admin';
};
