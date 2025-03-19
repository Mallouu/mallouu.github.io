export interface Course {
    id: string;
    title: string;
    date: Date;
    hour: string;
    duration: number; // in hours
    boatType: 'J70' | 'J80';
    maxParticipants: number;
    placeRestante: number;
    imageUrl?: string;
    instructor: string;
    level: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Régate';
}
