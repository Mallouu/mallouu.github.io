export interface Booking {
    id: string;
    courseId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    bookingDate: Date;
    participants: number;
}
