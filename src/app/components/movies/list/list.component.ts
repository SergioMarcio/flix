import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Movie, MovieResponse, TmdbService } from '../../../services/tmdb.service';
import { MovieCardComponent } from '../card/card.component';

interface PageConfig {
  title: string;
  icon: string;
  loader: (page: number) => any;
}

interface ListState {
  type: string;
  movies: Movie[];
  currentPage: number;
  totalPages: number;
  scrollY: number;
}

const STATE_KEY = 'movie_list_state';

@Component({
  selector: 'app-movie-list',
  standalone: true,
  imports: [CommonModule, MovieCardComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class MovieListComponent implements OnInit, OnDestroy {
  movies: Movie[] = [];
  pageTitle = '';
  pageIcon = '';
  loading = false;
  currentPage = 1;
  totalPages = 1;

  private destroy$ = new Subject<void>();

  private configs: Record<string, PageConfig> = {
    popular: {
      title: 'Filmes Populares',
      icon: '🔥',
      loader: (p) => this.tmdbService.getPopularMovies(p)
    },
    'top-rated': {
      title: 'Filmes Mais Votados',
      icon: '🏆',
      loader: (p) => this.tmdbService.getTopRatedMovies(p)
    },
    'now-playing': {
      title: 'Filmes Em Cartaz',
      icon: '🎭',
      loader: (p) => this.tmdbService.getNowPlayingMovies(p)
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tmdbService: TmdbService
  ) { }

  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      const type = data['type'] as string;
      const config = this.configs[type];
      if (!config) return;

      this.pageTitle = config.title;
      this.pageIcon = config.icon;

      const saved = sessionStorage.getItem(STATE_KEY);
      if (saved) {
        const state: ListState = JSON.parse(saved);
        if (state.type === type) {
          sessionStorage.removeItem(STATE_KEY);
          this.movies = state.movies;
          this.currentPage = state.currentPage;
          this.totalPages = state.totalPages;
          setTimeout(() => window.scrollTo({ top: state.scrollY, behavior: 'instant' }), 0);
          return;
        }
      }

      this.loadMovies(config, 1);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMovies(config: PageConfig, page: number): void {
    this.loading = true;
    config.loader(page).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: MovieResponse) => {
        this.movies = page === 1 ? response.results : [...this.movies, ...response.results];
        this.currentPage = response.page;
        this.totalPages = response.total_pages;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadMore(): void {
    const type = this.route.snapshot.data['type'] as string;
    const config = this.configs[type];
    if (config && this.currentPage < this.totalPages) {
      this.loadMovies(config, this.currentPage + 1);
    }
  }

  goToMovie(movie: Movie): void {
    const type = this.route.snapshot.data['type'] as string;
    const state: ListState = {
      type,
      movies: this.movies,
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      scrollY: window.scrollY
    };
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    this.router.navigate(['/movie', movie.id]);
  }
}
