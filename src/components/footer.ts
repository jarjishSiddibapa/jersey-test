export function renderFooter(): string {
  const devToolsLink = import.meta.env?.DEV
    ? `<button class="admin-toggle-link" data-action="toggle-admin">Dev tools</button>`
    : "";

  return `
    <footer class="site-footer">
      <div class="container site-footer__inner">
        <div>
          <div class="site-footer__brand">THE INTERNET JERSEY</div>
          <p class="site-footer__tag">One jersey. Limited spots.</p>
        </div>
        <div class="site-footer__links">
          <a href="#how-it-works">How it works</a>
          <a href="#/terms">Terms</a>
          <a href="#/privacy">Privacy</a>
          <a href="#/refunds">Refunds</a>
          <a href="#/content-policy">Content policy</a>
          <a href="#/contact">Contact</a>
          ${devToolsLink}
        </div>
      </div>
      <div class="container site-footer__bottom">Made on the internet.</div>
    </footer>
  `;
}
