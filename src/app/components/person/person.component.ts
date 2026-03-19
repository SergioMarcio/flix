import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SupabaseService, WatchStatus, SeriesStatus } from '../../services/supabase.service';
import { PersonDetails, TmdbService } from '../../services/tmdb.service';

interface CombinedCredit {
  id: number;
  title: string;
  poster_path: string | null;
  date: string;
  character: string;
  vote_average: number;
  type: 'movie' | 'tv';
}

interface DirectedMovie {
  id: number;
  title: string;
  poster_path: string | null;
  date: string;
  vote_average: number;
}

interface PersonState {
  typeFilter: 'all' | 'movie' | 'tv' | 'directed';
  sortBy: 'name' | 'year';
  sortDir: 'asc' | 'desc';
  scrollY: number;
}

@Component({
  selector: 'app-person',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './person.component.html',
  styleUrl: './person.component.scss'
})
export class PersonComponent implements OnInit, OnDestroy {
  person: PersonDetails | null = null;
  credits: CombinedCredit[] = [];
  directedMovies: DirectedMovie[] = [];
  loading = false;
  typeFilter: 'all' | 'movie' | 'tv' | 'directed' = 'all';
  sortBy: 'name' | 'year' = 'year';
  sortDir: 'asc' | 'desc' = 'desc';

  private personId = 0;
  private movieStatusMap = new Map<number, WatchStatus>();
  private seriesStatusMap = new Map<number, SeriesStatus>();
  private savingState = true;

  constructor(
    private tmdb: TmdbService,
    private supabase: SupabaseService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) { }

  private get stateKey(): string { return `person_state_${this.personId}`; }

  ngOnInit(): void {
    this.personId = Number(this.route.snapshot.paramMap.get('id'));

    // Restaurar estado salvo
    const saved = sessionStorage.getItem(this.stateKey);
    if (saved) {
      const state: PersonState = JSON.parse(saved);
      this.typeFilter = state.typeFilter;
      this.sortBy     = state.sortBy;
      this.sortDir    = state.sortDir;
    }

    if (this.personId) this.load(this.personId);

    this.supabase.getUserMovies().then(movies => {
      this.movieStatusMap = new Map(movies.map(m => [m.movie_id, m.status]));
    });
    this.supabase.getUserSeries().then(series => {
      this.seriesStatusMap = new Map(series.map(s => [s.series_id, s.status]));
    });
  }

  ngOnDestroy(): void {
    if (this.savingState) {
      const state: PersonState = {
        typeFilter: this.typeFilter,
        sortBy: this.sortBy,
        sortDir: this.sortDir,
        scrollY: window.scrollY
      };
      sessionStorage.setItem(this.stateKey, JSON.stringify(state));
    }
  }

  load(id: number): void {
    this.loading = true;
    this.person = null;
    this.credits = [];
    this.directedMovies = [];

    forkJoin({
      person: this.tmdb.getPersonDetails(id),
      movieCredits: this.tmdb.getPersonMovieCredits(id),
      tvCredits: this.tmdb.getPersonTVCredits(id)
    }).subscribe({
      next: ({ person, movieCredits, tvCredits }) => {
        this.person = person;

        const movies: CombinedCredit[] = movieCredits.cast
          .filter(m => m.release_date)
          .map(m => ({
            id: m.id, title: m.title, poster_path: m.poster_path,
            date: m.release_date, character: m.character,
            vote_average: m.vote_average, type: 'movie' as const
          }));

        const series: CombinedCredit[] = tvCredits.cast
          .filter(t => t.first_air_date)
          .map(t => ({
            id: t.id, title: t.name, poster_path: t.poster_path,
            date: t.first_air_date, character: t.character,
            vote_average: t.vote_average, type: 'tv' as const
          }));

        this.credits = [...movies, ...series.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i)];

        const seen = new Set<number>();
        this.directedMovies = movieCredits.crew
          .filter(c => c.job === 'Director' && c.release_date && !seen.has(c.id) && seen.add(c.id))
          .map(c => ({
            id: c.id, title: c.title, poster_path: c.poster_path,
            date: c.release_date, vote_average: c.vote_average
          }));

        this.loading = false;

        // Restaurar scroll após renderização
        const saved = sessionStorage.getItem(this.stateKey);
        if (saved) {
          const { scrollY } = JSON.parse(saved) as PersonState;
          if (scrollY > 0) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => window.scrollTo({ top: scrollY }));
            });
          }
        }
      },
      error: () => { this.loading = false; }
    });
  }

  setSort(field: 'name' | 'year'): void {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDir = field === 'year' ? 'desc' : 'asc';
    }
  }

  get filteredCredits(): CombinedCredit[] {
    const base = (this.typeFilter === 'all' || this.typeFilter === 'directed')
      ? this.credits
      : this.credits.filter(c => c.type === this.typeFilter);

    return [...base].sort((a, b) => {
      const val = this.sortBy === 'name'
        ? a.title.localeCompare(b.title)
        : (a.date || '').localeCompare(b.date || '');
      return this.sortDir === 'asc' ? val : -val;
    });
  }

  get sortedDirectedMovies(): DirectedMovie[] {
    return [...this.directedMovies].sort((a, b) => {
      const val = this.sortBy === 'name'
        ? a.title.localeCompare(b.title)
        : (a.date || '').localeCompare(b.date || '');
      return this.sortDir === 'asc' ? val : -val;
    });
  }

  get movieCount(): number { return this.credits.filter(c => c.type === 'movie').length; }
  get tvCount(): number { return this.credits.filter(c => c.type === 'tv').length; }

  getStatus(credit: CombinedCredit): string | null {
    if (credit.type === 'movie') return this.movieStatusMap.get(credit.id) ?? null;
    return this.seriesStatusMap.get(credit.id) ?? null;
  }

  getDirectedStatus(id: number): string | null {
    return this.movieStatusMap.get(id) ?? null;
  }

  statusLabel(status: string | null): string {
    if (status === 'watched') return '✅ Assistido';
    if (status === 'watching') return '▶ Assistindo';
    if (status === 'want_to_watch') return '⭐ Quero Ver';
    return '';
  }

  getProfileUrl(path: string | null): string {
    return this.tmdb.getImageUrl(path || '', 'w342');
  }

  getPosterUrl(path: string | null): string {
    if (!path) return 'assets/no-poster.svg';
    return this.tmdb.getImageUrl(path, 'w185');
  }

  getYear(date: string): string {
    return date ? date.substring(0, 4) : '—';
  }

  goBack(): void {
    this.savingState = false;
    sessionStorage.removeItem(this.stateKey);
    this.location.back();
  }

  navigate(credit: CombinedCredit): void {
    // Save state now while scroll position is still correct,
    // and prevent ngOnDestroy from overwriting with scrollY=0
    this.savingState = false;
    sessionStorage.setItem(this.stateKey, JSON.stringify({
      typeFilter: this.typeFilter,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
      scrollY: window.scrollY
    } as PersonState));

    if (credit.type === 'movie') {
      this.router.navigate(['/movie', credit.id]);
    } else {
      this.router.navigate(['/series', credit.id]);
    }
  }
}
