// Mock data storage (would be replaced with real API)
import { Course } from '../shared/models/course';
import { Booking } from '../shared/models/booking';

let coursesList: Course[] = [
    {
        id: '1',
        title: 'Initiation à la Voile',
        description:
            'Un cours parfait pour les débutants qui souhaitent apprendre les bases de la navigation à voile sur un J70.',
        date: new Date(Date.now() + 86400000), // tomorrow
        duration: 3,
        hour: '19:46',
        boatType: 'J70',
        maxParticipants: 5,
        price: 120,
        imageUrl:
            'https://images.unsplash.com/photo-1540946485063-a40da27545f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
        instructor: 'Christophe LESUEUR',
        level: 'Débutant',
    },
    {
        id: '2',
        title: 'Navigation Côtière',
        description:
            'Perfectionnez vos compétences en navigation côtière sur un J80 avec notre instructeur expérimenté.',
        date: new Date(Date.now() + 172800000), // day after tomorrow
        duration: 4,
        hour: '16:30',
        boatType: 'J80',
        maxParticipants: 4,
        price: 150,
        imageUrl:
            'https://images.unsplash.com/photo-1531079997448-485eb7237621?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
        instructor: 'Christophe LESUEUR',
        level: 'Intermédiaire',
    },
    {
        id: '3',
        title: 'Techniques Avancées',
        description:
            'Maîtrisez les techniques avancées de navigation et de régate sur un J70 performant.',
        date: new Date(Date.now() + 259200000), // 3 days from now
        duration: 5,
        hour: '18:30',
        boatType: 'J70',
        maxParticipants: 4,
        price: 180,
        imageUrl:
            'https://images.unsplash.com/photo-1467987506553-8f3916508521?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
        instructor: 'Christophe LESUEUR',
        level: 'Régate',
    },
    {
        id: '4',
        title: 'Découverte J80',
        description:
            "Découvrez le J80, un bateau sportif idéal pour l'apprentissage et le perfectionnement.",
        date: new Date(Date.now() + 345600000), // 4 days from now
        hour: '14:30',
        duration: 3,
        boatType: 'J80',
        maxParticipants: 5,
        price: 130,
        imageUrl:
            'https://images.unsplash.com/photo-1593351415075-3bac9f45c877?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80',
        instructor: 'Christophe LESUEUR',
        level: 'Débutant',
    },
];

let bookings: Booking[] = [];

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

export const getBookingsByCourse = (courseId: string): Booking[] => {
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
