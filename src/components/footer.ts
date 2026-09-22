export function renderFooter(): string {
  const devToolsLink = import.meta.env?.DEV
    ? `<button class="admin-toggle-link" data-action="toggle-admin">Dev tools</button>`
    : "";

  return `
    <footer class="site-footer">
      <div class="container site-footer__inner">
        <div>
          <div class="site-footer__brand">claim.lol</div>
          <p class="site-footer__tag">Claim a spot on the jersey.</p>
        </div>
        <div class="site-footer__links">
          <a href="#how-it-works">How it works</a>
          <a href="#/rules">Rules</a>
          ${devToolsLink}
        </div>
      </div>
      <div class="container site-footer__bottom">Made on the internet.</div>
    </footer>
  `;
}
