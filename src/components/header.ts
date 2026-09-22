export function renderHeader(): string {
  return `
    <header class="site-header">
      <div class="container site-header__inner">
        <a href="#top" class="site-logo">
          <span class="site-logo__mark">C</span>
          claim.lol
        </a>
        <nav class="site-nav" aria-label="Primary">
          <a href="#how-it-works">How it works</a>
          <a href="#leaderboard">Leaderboard</a>
          <a href="#/rules">Rules</a>
        </nav>
        <button class="site-nav-toggle" data-action="toggle-mobile-nav" aria-label="Menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </header>
  `;
}
