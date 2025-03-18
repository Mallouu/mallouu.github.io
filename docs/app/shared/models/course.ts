export interface Course {
    id: string;
    title: string;
    description: string;
    date: Date;
    hour: string;
    duration: number; // in hours
    boatType: 'J70' | 'J80';
    maxParticipants: number;
    price: number;
    imageUrl?: string;
    instructor: string;
    level: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Régate';
}
