export const APP_VERSION = '1.0.0';

export interface VersionEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: VersionEntry[] = [
  {
    version: '1.0.0',
    date: '2026-03-17',
    changes: [
      'Lançamento inicial do FLIX',
      'Catálogo de filmes e séries com dados do TMDB',
      'Autenticação com Supabase',
      'Minha Lista de Filmes e Séries',
      'Estatísticas detalhadas com tempo de tela',
      'Ficha técnica de episódios',
      'Modo PWA — instalável no celular',
      'Layout responsivo para mobile',
    ],
  },
];
