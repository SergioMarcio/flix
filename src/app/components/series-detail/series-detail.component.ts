import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TVShowDetail, TVSeason, TmdbService, MovieVideo } from '../../services/tmdb.service';
import { SupabaseService, SeriesStatus } from '../../services/supabase.service';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

@Component({
  selector: 'app-series-detail',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './series-detail.component.html',
  styleUrl: './series-detail.component.scss'
})
export class SeriesDetailComponent implements OnInit {
  show: TVShowDetail | null = null;
  trailer: MovieVideo | null = null;
  status: SeriesStatus | null = null;
  loading = true;
  saving = false;
  showTrailer = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tmdb: TmdbService,
    private supabase: SupabaseService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.loadShow(+params['id']);
    });
  }

  loadShow(id: number): void {
    this.loading = true;
    forkJoin({
      detail: this.tmdb.getShowDetail(id),
      videos: this.tmdb.getShowVideos(id)
    }).subscribe({
      next: ({ detail, videos }) => {
        this.show = detail;
        this.trailer = videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || null;
        this.loading = false;
        this.loadStatus(id);
        window.scrollTo(0, 0);
      },
      error: () => { this.loading = false; }
    });
  }

  async loadStatus(id: number): Promise<void> {
    try {
      this.status = await this.supabase.getSeriesStatus(id);
    } catch {}
  }

  async setStatus(newStatus: SeriesStatus): Promise<void> {
    if (!this.show) return;
    this.saving = true;
    try {
      await this.supabase.setSeriesStatus({
        series_id: this.show.id,
        series_name: this.show.name,
        poster_path: this.show.poster_path,
        first_air_date: this.show.first_air_date,
        vote_average: this.show.vote_average,
        status: newStatus
      });
      this.status = newStatus;
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      this.saving = false;
    }
  }

  async removeStatus(): Promise<void> {
    if (!this.show) return;
    this.saving = true;
    try {
      await this.supabase.removeSeriesStatus(this.show.id);
      this.status = null;
    } catch {}
    this.saving = false;
  }

  goToSeason(season: TVSeason): void {
    this.router.navigate(['/series', this.show!.id, 'season', season.season_number]);
  }

  getBackdropUrl(): string {
    return this.tmdb.getBackdropUrl(this.show?.backdrop_path || '');
  }

  getPosterUrl(): string {
    return this.tmdb.getImageUrl(this.show?.poster_path || '', 'w500');
  }

  getSeasonPoster(path: string): string {
    return this.tmdb.getImageUrl(path, 'w185');
  }

  getYear(): string {
    return this.show?.first_air_date?.substring(0, 4) || '';
  }

  getRating(): string {
    return this.show?.vote_average.toFixed(1) || '0.0';
  }

  getRuntime(): string {
    const rt = this.show?.episode_run_time?.[0];
    if (!rt) return '';
    const h = Math.floor(rt / 60);
    const m = rt % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  getStatusLabel(s: SeriesStatus): string {
    const labels: Record<SeriesStatus, string> = {
      watching: '▶ Assistindo',
      watched: '✅ Concluída',
      want_to_watch: '⭐ Quero Ver',
      not_watched: '❌ Não Assisti'
    };
    return labels[s];
  }

  get visibleSeasons(): TVSeason[] {
    return (this.show?.seasons || []).filter(s => s.season_number > 0);
  }

  goBack(): void { this.router.navigate(['/series']); }
  openTrailer(): void { this.showTrailer = true; }
  closeTrailer(): void { this.showTrailer = false; }
}
