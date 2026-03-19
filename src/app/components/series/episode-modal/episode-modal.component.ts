import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { EpisodeComment, SupabaseService } from '../../../services/supabase.service';
import { EpisodeCastMember, EpisodeCrewMember, TVEpisode, TmdbService } from '../../../services/tmdb.service';

@Component({
  selector: 'app-episode-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Comments
  comments: EpisodeComment[] = [];
  newComment = '';
  savingComment = false;
  editingId: string | null = null;
  editingText = '';
  showEmojiPicker = false;
  showEditEmojiPicker = false;
  showGifPicker = false;
  showEditGifPicker = false;
  gifQuery = '';
  gifResults: { thumb: string; full: string }[] = [];
  selectedGif: string | null = null;
  editSelectedGif: string | null = null;
  private gifTimer: ReturnType<typeof setTimeout> | null = null;

  @ViewChild('newCommentRef') newCommentRef!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('editCommentRef') editCommentRef!: ElementRef<HTMLTextAreaElement>;

  readonly emojis = [
    '😀','😂','😍','🥰','😎','🤩','😢','😭','😡','🤯',
    '👍','👎','❤️','🔥','⭐','💯','🎬','🎭','🎥','🍿',
    '😱','🤔','🙄','😴','🤣','😏','🥹','😤','🤦','🙌',
    '👏','💪','🤝','✌️','🫶','💀','👻','🎉','🏆','💎',
  ];

  constructor(private tmdb: TmdbService, private supabase: SupabaseService) { }

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

    this.loadComments();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.emoji-panel') && !target.closest('.emoji-trigger')) {
      this.showEmojiPicker = false;
      this.showEditEmojiPicker = false;
    }
    if (!target.closest('.gif-panel') && !target.closest('.gif-trigger')) {
      this.showGifPicker = false;
      this.showEditGifPicker = false;
    }
  }

  async loadComments(): Promise<void> {
    try {
      this.comments = await this.supabase.getEpisodeComments(
        this.seriesId, this.episode.season_number, this.episode.episode_number
      );
    } catch { }
  }

  async submitComment(): Promise<void> {
    if (!this.newComment.trim() && !this.selectedGif) return;
    this.savingComment = true;
    try {
      const added = await this.supabase.addEpisodeComment(
        this.seriesId, this.episode.season_number, this.episode.episode_number,
        this.newComment.trim(), this.selectedGif
      );
      this.comments = [added, ...this.comments];
      this.newComment = '';
      this.selectedGif = null;
    } catch { }
    this.savingComment = false;
  }

  startEdit(c: EpisodeComment): void {
    this.editingId = c.id;
    this.editingText = c.comment;
    this.editSelectedGif = c.gif_url ?? null;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editingText = '';
    this.editSelectedGif = null;
    this.showEditEmojiPicker = false;
    this.showEditGifPicker = false;
  }

  async saveEdit(c: EpisodeComment): Promise<void> {
    if (!this.editingText.trim() && !this.editSelectedGif) return;
    this.savingComment = true;
    try {
      await this.supabase.updateEpisodeComment(c.id, this.editingText.trim(), this.editSelectedGif);
      c.comment = this.editingText.trim();
      c.gif_url = this.editSelectedGif;
      c.updated_at = new Date().toISOString();
      this.cancelEdit();
    } catch { }
    this.savingComment = false;
  }

  async deleteComment(id: string): Promise<void> {
    try {
      await this.supabase.deleteEpisodeComment(id);
      this.comments = this.comments.filter(c => c.id !== id);
    } catch { }
  }

  isOwnComment(c: EpisodeComment): boolean {
    return c.user_id === this.supabase.currentUser?.id;
  }

  insertEmoji(emoji: string, target: 'new' | 'edit'): void {
    const ref = target === 'new' ? this.newCommentRef : this.editCommentRef;
    const el = ref?.nativeElement;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const newVal = el.value.substring(0, start) + emoji + el.value.substring(end);
    if (target === 'new') this.newComment = newVal;
    else this.editingText = newVal;
    setTimeout(() => { el.focus(); el.setSelectionRange(start + emoji.length, start + emoji.length); });
  }

  onGifQueryChange(query: string): void {
    if (this.gifTimer) clearTimeout(this.gifTimer);
    this.gifTimer = setTimeout(() => this.searchGifs(query), 450);
  }

  async searchGifs(query: string): Promise<void> {
    if (!query.trim()) { this.gifResults = []; return; }
    const key = environment.giphyApiKey;
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(query)}&limit=12&rating=g`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      this.gifResults = (json.data ?? []).map((g: any) => ({
        thumb: g.images?.fixed_height_small?.url ?? g.images?.original?.url,
        full: g.images?.fixed_height?.url ?? g.images?.original?.url
      }));
    } catch { this.gifResults = []; }
  }

  selectGif(gif: { thumb: string; full: string }, mode: 'new' | 'edit'): void {
    if (mode === 'new') { this.selectedGif = gif.full; this.showGifPicker = false; }
    else { this.editSelectedGif = gif.full; this.showEditGifPicker = false; }
  }

  removeGif(mode: 'new' | 'edit'): void {
    if (mode === 'new') this.selectedGif = null;
    else this.editSelectedGif = null;
  }

  formatCommentDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getEmailUser(email: string): string {
    return email.split('@')[0];
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
