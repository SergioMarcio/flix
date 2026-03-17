import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { MovieDetailComponent } from './components/movie-detail/movie-detail.component';
import { MyListComponent } from './components/my-list/my-list.component';
import { MovieListComponent } from './components/movie-list/movie-list.component';
import { StatsComponent } from './components/stats/stats.component';
import { LoginComponent } from './components/login/login.component';
import { SeriesHomeComponent } from './components/series-home/series-home.component';
import { SeriesDetailComponent } from './components/series-detail/series-detail.component';
import { SeasonDetailComponent } from './components/season-detail/season-detail.component';
import { SeriesStatsComponent } from './components/series-stats/series-stats.component';
import { SobreComponent } from './components/sobre/sobre.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  // Filmes
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'movie/:id', component: MovieDetailComponent, canActivate: [authGuard] },
  { path: 'my-list', component: MyListComponent, canActivate: [authGuard] },
  { path: 'stats', component: StatsComponent, canActivate: [authGuard] },
  { path: 'popular', component: MovieListComponent, data: { type: 'popular' }, canActivate: [authGuard] },
  { path: 'top-rated', component: MovieListComponent, data: { type: 'top-rated' }, canActivate: [authGuard] },
  { path: 'now-playing', component: MovieListComponent, data: { type: 'now-playing' }, canActivate: [authGuard] },

  // Séries
  { path: 'series', component: SeriesHomeComponent, canActivate: [authGuard] },
  { path: 'series-stats', component: SeriesStatsComponent, canActivate: [authGuard] },
  { path: 'series/:id', component: SeriesDetailComponent, canActivate: [authGuard] },
  { path: 'series/:id/season/:season', component: SeasonDetailComponent, canActivate: [authGuard] },

  { path: 'sobre', component: SobreComponent },
  { path: '**', redirectTo: '' }
];
