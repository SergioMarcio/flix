import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SeriesStatus, SupabaseService, UserSeries } from '../../../services/supabase.service';
import { TmdbService } from '../../../services/tmdb.service';

@Component({
  selector: 'app-my-series-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-list.component.html',
  styleUrl: './my-list.component.scss'
})
export class MySeriesListComponent implements OnInit {
  allSeries: UserSeries[] = [];
  filteredSeries: UserSeries[] = [];
  activeFilter: SeriesStatus | 'all' = 'all';
  loading = true;
  stats = { watching: 0, watched: 0, want_to_watch: 0 };

  constructor(
    private supabaseService: SupabaseService,
    private tmdbService: TmdbService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadSeries();
  }

  async loadSeries(): Promise<void> {
    this.loading = true;
    try {
      this.allSeries = await this.supabaseService.getUserSeries();
      this.computeStats();
      this.applyFilter(this.activeFilter);
    } catch (err) {
      console.error('Erro ao carregar séries:', err);
    } finally {
      this.loading = false;
    }
  }

  private computeStats(): void {
    this.stats = { watching: 0, watched: 0, want_to_watch: 0 };
    this.allSeries.forEach(s => this.stats[s.status]++);
  }

  applyFilter(filter: SeriesStatus | 'all'): void {
    this.activeFilter = filter;
    this.filteredSeries = filter === 'all'
      ? [...this.allSeries]
      : this.allSeries.filter(s => s.status === filter);
  }

  getPosterUrl(path: string): string {
    return this.tmdbService.getImageUrl(path, 'w185');
  }

  getStatusLabel(status: SeriesStatus): string {
    switch (status) {
      case 'watching':     return '▶ Assistindo';
      case 'watched':      return '✅ Concluída';
      case 'want_to_watch': return '⭐ Quero Ver';
      default: return '';
    }
  }

  getYear(date: string): string {
    return date ? date.substring(0, 4) : '';
  }

  goToSeries(seriesId: number): void {
    this.router.navigate(['/series', seriesId]);
  }

  async removeSeries(event: Event, seriesId: number): Promise<void> {
    event.stopPropagation();
    try {
      await Promise.all([
        this.supabaseService.removeSeriesStatus(seriesId),
        this.supabaseService.removeAllSeriesEpisodes(seriesId),
      ]);
      this.allSeries = this.allSeries.filter(s => s.series_id !== seriesId);
      this.computeStats();
      this.applyFilter(this.activeFilter);
    } catch {}
  }
}
