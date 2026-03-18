import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService, UserSeries, WatchedEpisode } from '../../../services/supabase.service';
import { TmdbService } from '../../../services/tmdb.service';

interface SeriesProgress {
  series: UserSeries;
  watchedEpisodes: number;
  totalMinutes: number;
}

@Component({
  selector: 'app-series-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class SeriesStatsComponent implements OnInit {
  loading = true;
  totalMinutes = 0;
  totalEpisodes = 0;
  watchingCount = 0;
  watchedCount = 0;
  wantToWatchCount = 0;
  seriesProgress: SeriesProgress[] = [];

  constructor(
    private supabase: SupabaseService,
    private tmdb: TmdbService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadStats();
  }

  async loadStats(): Promise<void> {
    this.loading = true;
    try {
      const [stats, allSeries, allEpisodes] = await Promise.all([
        this.supabase.getSeriesStats(),
        this.supabase.getUserSeries(),
        this.supabase.getWatchedEpisodes()
      ]);

      this.totalMinutes = stats.total_minutes;
      this.totalEpisodes = stats.total_episodes;
      this.watchingCount = stats.watching;
      this.watchedCount = stats.watched;
      this.wantToWatchCount = stats.want_to_watch;

      // Group episodes by series
      const epMap = new Map<number, WatchedEpisode[]>();
      allEpisodes.forEach(ep => {
        if (!epMap.has(ep.series_id)) epMap.set(ep.series_id, []);
        epMap.get(ep.series_id)!.push(ep);
      });

      this.seriesProgress = allSeries
        .filter(s => s.status === 'watching' || s.status === 'watched')
        .map(s => {
          const eps = epMap.get(s.series_id) || [];
          return {
            series: s,
            watchedEpisodes: eps.length,
            totalMinutes: eps.reduce((acc, e) => acc + (e.runtime || 0), 0)
          };
        })
        .filter(sp => sp.watchedEpisodes > 0)
        .sort((a, b) => b.watchedEpisodes - a.watchedEpisodes);

    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      this.loading = false;
    }
  }

  get totalSeriesCount(): number { return this.watchingCount + this.watchedCount; }
  get totalHours(): number { return Math.floor(this.totalMinutes / 60); }
  get remainingMinutes(): number { return this.totalMinutes % 60; }
  get totalDays(): number { return Math.floor(this.totalMinutes / 1440); }
  get averageRuntime(): number {
    if (!this.totalEpisodes) return 0;
    return Math.round(this.totalMinutes / this.totalEpisodes);
  }

  formatRuntime(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  getPosterUrl(path: string): string {
    return this.tmdb.getImageUrl(path, 'w185');
  }

  goToSeries(id: number): void {
    this.router.navigate(['/series', id]);
  }
}
