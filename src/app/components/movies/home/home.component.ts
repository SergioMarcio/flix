import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap, takeUntil } from 'rxjs';
import { Movie, MovieResponse, TmdbService } from '../../../services/tmdb.service';
import { MovieCardComponent } from '../card/card.component';

@Component({
  selector: 'app-movie-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MovieCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class MovieHomeComponent implements OnInit, OnDestroy {
  searchQuery = '';
  movies: Movie[] = [];
  trendingMovies: Movie[] = [];
  heroMovie: Movie | null = null;
  heroFading = false;
  heroIndex = 0;
  loading = false;
  loadingMore = false;
  isSearching = false;
  currentPage = 1;
  totalPages = 1;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private heroInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private tmdbService: TmdbService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadTrending();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query.trim()) {
          this.isSearching = false;
          return of(null);
        }
        this.loading = true;
        this.isSearching = true;
        return this.tmdbService.searchMovies(query, 1);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.loading = false;
        if (response) {
          this.movies = response.results;
          this.currentPage = response.page;
          this.totalPages = response.total_pages;
        } else {
          this.movies = [];
        }
      },
      error: () => { this.loading = false; }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.heroInterval) clearInterval(this.heroInterval);
  }

  loadTrending(): void {
    this.loading = true;
    this.tmdbService.getTrendingMovies().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: MovieResponse) => {
        this.trendingMovies = response.results;
        this.heroIndex = Math.floor(Math.random() * response.results.length);
        this.heroMovie = response.results[this.heroIndex] || null;
        this.loading = false;
        this.startHeroRotation();
      },
      error: () => { this.loading = false; }
    });
  }

  startHeroRotation(): void {
    if (this.heroInterval) clearInterval(this.heroInterval);
    this.heroInterval = setInterval(() => {
      this.heroFading = true;
      setTimeout(() => {
        this.heroIndex = (this.heroIndex + 1) % this.trendingMovies.length;
        this.heroMovie = this.trendingMovies[this.heroIndex];
        this.heroFading = false;
      }, 500);
    }, 5000);
  }

  setHero(index: number): void {
    if (index === this.heroIndex) return;
    this.heroFading = true;
    setTimeout(() => {
      this.heroIndex = index;
      this.heroMovie = this.trendingMovies[index];
      this.heroFading = false;
      this.startHeroRotation();
    }, 500);
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.isSearching = false;
    this.movies = [];
  }

  loadMoreSearch(): void {
    if (this.loadingMore || this.currentPage >= this.totalPages) return;
    this.loadingMore = true;
    this.tmdbService.searchMovies(this.searchQuery, this.currentPage + 1)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.movies = [...this.movies, ...response.results];
          this.currentPage = response.page;
          this.totalPages = response.total_pages;
          this.loadingMore = false;
        },
        error: () => { this.loadingMore = false; }
      });
  }

  goToMovie(movie: Movie): void {
    this.router.navigate(['/movie', movie.id]);
  }

  getBackdropUrl(movie: Movie): string {
    return this.tmdbService.getBackdropUrl(movie.backdrop_path);
  }

  getImageUrl(path: string): string {
    return this.tmdbService.getImageUrl(path, 'w342');
  }
}
