import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService, UserMovie, WatchStatus } from '../../services/supabase.service';
import { TmdbService } from '../../services/tmdb.service';

@Component({
  selector: 'app-my-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-list.component.html',
  styleUrl: './my-list.component.scss'
})
export class MyListComponent implements OnInit {
  allMovies: UserMovie[] = [];
  filteredMovies: UserMovie[] = [];
  activeFilter: WatchStatus | 'all' = 'all';
  loading = true;
  stats = { watched: 0, not_watched: 0, want_to_watch: 0 };

  constructor(
    private supabaseService: SupabaseService,
    private tmdbService: TmdbService,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.loadMovies();
  }

  async loadMovies(): Promise<void> {
    this.loading = true;
    try {
      this.allMovies = await this.supabaseService.getUserMovies();
      this.stats = await this.supabaseService.getStats();
      this.applyFilter(this.activeFilter);
    } catch (err) {
      console.error('Erro ao carregar filmes:', err);
    } finally {
      this.loading = false;
    }
  }

  applyFilter(filter: WatchStatus | 'all'): void {
    this.activeFilter = filter;
    if (filter === 'all') {
      this.filteredMovies = [...this.allMovies];
    } else {
      this.filteredMovies = this.allMovies.filter(m => m.status === filter);
    }
  }

  getPosterUrl(path: string): string {
    return this.tmdbService.getImageUrl(path, 'w185');
  }

  getStatusLabel(status: WatchStatus): string {
    switch (status) {
      case 'watched': return '✅ Vi';
      case 'not_watched': return '❌ Não Vi';
      case 'want_to_watch': return '⭐ Quero Ver';
    }
  }

  getYear(date: string): string {
    return date ? date.substring(0, 4) : '';
  }

  goToMovie(movieId: number): void {
    this.router.navigate(['/movie', movieId]);
  }

  async removeMovie(event: Event, movieId: number): Promise<void> {
    event.stopPropagation();
    try {
      await this.supabaseService.removeMovieStatus(movieId);
      this.allMovies = this.allMovies.filter(m => m.movie_id !== movieId);
      this.stats = await this.supabaseService.getStats();
      this.applyFilter(this.activeFilter);
    } catch { }
  }
}
