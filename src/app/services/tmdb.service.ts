import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
}

export interface MovieDetail extends Movie {
  genres: { id: number; name: string }[];
  runtime: number;
  tagline: string;
  status: string;
  budget: number;
  revenue: number;
  production_companies: { id: number; name: string; logo_path: string }[];
}

export interface MovieResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface MovieVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
}

export interface TVShowDetail extends TVShow {
  genres: { id: number; name: string }[];
  tagline: string;
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  seasons: TVSeason[];
  production_companies: { id: number; name: string }[];
}

export interface TVSeason {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  episode_count: number;
  poster_path: string;
  air_date: string;
}

export interface TVEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string;
  runtime: number | null;
  air_date: string;
  vote_average: number;
}

export interface TVSeasonDetail extends TVSeason {
  episodes: TVEpisode[];
}

export interface TVResponse {
  page: number;
  results: TVShow[];
  total_pages: number;
  total_results: number;
}

@Injectable({
  providedIn: 'root'
})
export class TmdbService {
  private baseUrl = environment.tmdbBaseUrl;
  private apiKey = environment.tmdbApiKey;
  private imageBaseUrl = environment.tmdbImageBaseUrl;

  constructor(private http: HttpClient) {}

  private buildParams(extra: Record<string, string> = {}): string {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      language: 'pt-BR',
      ...extra
    });
    return params.toString();
  }

  getImageUrl(path: string, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string {
    if (!path) return 'assets/no-poster.jpg';
    return `${this.imageBaseUrl}/${size}${path}`;
  }

  getBackdropUrl(path: string): string {
    if (!path) return '';
    return `${this.imageBaseUrl}/original${path}`;
  }

  searchMovies(query: string, page = 1): Observable<MovieResponse> {
    return this.http.get<MovieResponse>(
      `${this.baseUrl}/search/movie?${this.buildParams({ query, page: page.toString() })}`
    );
  }

  getPopularMovies(page = 1): Observable<MovieResponse> {
    return this.http.get<MovieResponse>(
      `${this.baseUrl}/movie/popular?${this.buildParams({ page: page.toString() })}`
    );
  }

  getTrendingMovies(): Observable<MovieResponse> {
    return this.http.get<MovieResponse>(
      `${this.baseUrl}/trending/movie/week?${this.buildParams()}`
    );
  }

  getTopRatedMovies(page = 1): Observable<MovieResponse> {
    return this.http.get<MovieResponse>(
      `${this.baseUrl}/movie/top_rated?${this.buildParams({ page: page.toString() })}`
    );
  }

  getNowPlayingMovies(page = 1): Observable<MovieResponse> {
    return this.http.get<MovieResponse>(
      `${this.baseUrl}/movie/now_playing?${this.buildParams({ page: page.toString() })}`
    );
  }

  getMovieDetail(id: number): Observable<MovieDetail> {
    return this.http.get<MovieDetail>(
      `${this.baseUrl}/movie/${id}?${this.buildParams()}`
    );
  }

  getMovieVideos(id: number): Observable<{ results: MovieVideo[] }> {
    return this.http.get<{ results: MovieVideo[] }>(
      `${this.baseUrl}/movie/${id}/videos?${this.buildParams()}`
    );
  }

  getSimilarMovies(id: number): Observable<MovieResponse> {
    return this.http.get<MovieResponse>(
      `${this.baseUrl}/movie/${id}/similar?${this.buildParams()}`
    );
  }

  getGenres(): Observable<{ genres: { id: number; name: string }[] }> {
    return this.http.get<{ genres: { id: number; name: string }[] }>(
      `${this.baseUrl}/genre/movie/list?${this.buildParams()}`
    );
  }

  getTrendingShows(): Observable<TVResponse> {
    return this.http.get<TVResponse>(
      `${this.baseUrl}/trending/tv/week?${this.buildParams()}`
    );
  }

  searchShows(query: string, page = 1): Observable<TVResponse> {
    return this.http.get<TVResponse>(
      `${this.baseUrl}/search/tv?${this.buildParams({ query, page: page.toString() })}`
    );
  }

  getShowDetail(id: number): Observable<TVShowDetail> {
    return this.http.get<TVShowDetail>(
      `${this.baseUrl}/tv/${id}?${this.buildParams()}`
    );
  }

  getSeasonDetail(showId: number, seasonNumber: number): Observable<TVSeasonDetail> {
    return this.http.get<TVSeasonDetail>(
      `${this.baseUrl}/tv/${showId}/season/${seasonNumber}?${this.buildParams()}`
    );
  }

  getShowVideos(id: number): Observable<{ results: MovieVideo[] }> {
    return this.http.get<{ results: MovieVideo[] }>(
      `${this.baseUrl}/tv/${id}/videos?${this.buildParams()}`
    );
  }
}
