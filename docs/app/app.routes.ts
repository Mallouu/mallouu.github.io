import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// import { AuthGuard } from './core/guards/auth.guard'; // Guard pour protéger /administration

export const routes: Routes = [
    { path: '', redirectTo: '/reservation', pathMatch: 'full' },
    {
        path: 'reservation',
        loadComponent: () =>
            import('./modules/home-page/home-page.component').then((m) => m.HomePageComponent),
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./modules/login-page/login-page.component').then((m) => m.LoginPageComponent),
    },
    {
        path: 'administration',
        loadComponent: () =>
            import('./modules/admin-page/admin-page.component').then((m) => m.AdminPageComponent),
        //canActivate: [AuthGuard],
    },
    {
        path: 'building',
        loadComponent: () =>
            import('./modules/construction-page/construction-page.component').then(
                (m) => m.ConstructionPageComponent,
            ),
    },
    { path: '**', redirectTo: '/reservation' }, // Rediriger vers la page d'accueil si route inconnue
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
