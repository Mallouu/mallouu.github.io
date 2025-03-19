import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    constructor() {}

    login(token: string) {
        localStorage.setItem('authToken', token);
    }

    logout() {
        localStorage.removeItem('authToken');
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('authToken'); // Vérifie si un token est stocké
    }
}
