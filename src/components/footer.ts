export function renderFooter(): string {
  return `
    <footer class="site-footer">
      <div class="container site-footer__inner">
        <div>
          <div class="site-footer__brand">THE INTERNET JERSEY</div>
          <p class="site-footer__tag">One jersey. Limited spots.</p>
        </div>
        <div class="site-footer__links">
          <a href="#how-it-works">How it works</a>
          <a href="#" data-action="noop">Terms</a>
          <a href="#" data-action="noop">Privacy</a>
          <a href="#" data-action="noop">Contact</a>
          <button class="admin-toggle-link" data-action="toggle-admin">Prototype Mode</button>
        </div>
      </div>
      <div class="container site-footer__bottom">Made on the internet.</div>
    </footer>
  `;
}
