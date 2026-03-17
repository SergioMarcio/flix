import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EpisodeCastMember, EpisodeCrewMember, TVEpisode, TmdbService } from '../../../services/tmdb.service';

@Component({
  selector: 'app-episode-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './episode-modal.component.html',
  styleUrl: './episode-modal.component.scss'
})
export class EpisodeModalComponent implements OnInit {
  @Input() episode!: TVEpisode;
  @Input() seriesId!: number;
  @Input() watched = false;
  @Output() close = new EventEmitter<void>();
  @Output() toggleWatched = new EventEmitter<void>();

  cast: EpisodeCastMember[] = [];
  directors: EpisodeCrewMember[] = [];
  writers: EpisodeCrewMember[] = [];
  stills: string[] = [];
  loadingCredits = true;
  loadingImages = true;

  constructor(private tmdb: TmdbService) { }

  ngOnInit(): void {
    this.tmdb.getEpisodeCredits(this.seriesId, this.episode.season_number, this.episode.episode_number)
      .subscribe({
        next: (credits) => {
          this.cast = credits.cast.slice(0, 10);
          this.directors = credits.crew.filter(c => c.job === 'Director');
          this.writers = credits.crew.filter(c => c.job === 'Writer' || c.job === 'Story' || c.job === 'Screenplay');
          this.loadingCredits = false;
        },
        error: () => { this.loadingCredits = false; }
      });

    this.tmdb.getEpisodeImages(this.seriesId, this.episode.season_number, this.episode.episode_number)
      .subscribe({
        next: (res) => {
          this.stills = res.stills.slice(0, 8).map(s => this.tmdb.getImageUrl(s.file_path, 'w780'));
          this.loadingImages = false;
        },
        error: () => { this.loadingImages = false; }
      });
  }

  getStillUrl(): string {
    if (!this.episode.still_path) return '';
    return this.tmdb.getImageUrl(this.episode.still_path, 'w780');
  }

  getProfileUrl(path: string | null): string {
    if (!path) return '';
    return this.tmdb.getImageUrl(path, 'w185');
  }

  formatRuntime(min: number | null): string {
    if (!min) return '';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}
