import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap, takeUntil } from 'rxjs';
import { TVShow, TVResponse, TmdbService } from '../../services/tmdb.service';

@Component({
  selector: 'app-series-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './series-home.component.html',
  styleUrl: './series-home.component.scss'
})
export class SeriesHomeComponent implements OnInit, OnDestroy {
  searchQuery = '';
  shows: TVShow[] = [];
  trendingShows: TVShow[] = [];
  heroShow: TVShow | null = null;
  loading = false;
  isSearching = false;
  currentPage = 1;
  totalPages = 1;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private tmdb: TmdbService, private router: Router) {}

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
        return this.tmdb.searchShows(query, 1);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.loading = false;
        if (response) {
          this.shows = response.results;
          this.currentPage = response.page;
          this.totalPages = response.total_pages;
        } else {
          this.shows = [];
        }
      },
      error: () => { this.loading = false; }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTrending(): void {
    this.loading = true;
    this.tmdb.getTrendingShows().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: TVResponse) => {
        this.trendingShows = response.results;
        const idx = Math.floor(Math.random() * response.results.length);
        this.heroShow = response.results[idx] || null;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.isSearching = false;
    this.shows = [];
  }

  goToShow(show: TVShow): void {
    this.router.navigate(['/series', show.id]);
  }

  getBackdropUrl(path: string): string {
    return this.tmdb.getBackdropUrl(path);
  }

  getImageUrl(path: string): string {
    return this.tmdb.getImageUrl(path, 'w342');
  }

  getYear(date: string): string {
    return date ? date.substring(0, 4) : '';
  }
}
