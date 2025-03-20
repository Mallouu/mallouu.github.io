export interface Course {
    id: string;
    title: string;
    date: Date;
    hour: string;
    duration: number; // in hours
    boatType: BoatType;
    maxParticipants: number;
    placeRestante: number;
    imageUrl?: string;
    instructor: string;
    level: LevelType;
}

export enum BoatType {
    J70 = 'J70',
    J80 = 'J80',
    Unset = '',
}

export enum LevelType {
    Debutant = 'Débutant',
    Intermediaire = 'Intermédiaire',
    Avance = 'Avancé',
    Regate = 'Régate',
    ToutNiveaux = 'Tous les niveaux',
    Sortie = 'Sortie',
    Unset = '',
}
