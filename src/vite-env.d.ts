/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full production origin (e.g. "https://theinternetjersey.com") for share links, canonical URLs and OG tags. Unset in dev/GitHub Pages, where the app derives a base URL from window.location instead (see services/urls.ts). */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
