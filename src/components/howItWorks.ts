export function renderHowItWorks(): string {
  return `
    <section class="section" id="how-it-works">
      <div class="container">
        <p class="section-eyebrow">How it works</p>
        <h2 class="section-title">Four steps. That's the whole thing.</h2>
        <div class="steps-grid">
          <div class="step-item">
            <div class="step-item__num">1</div>
            <p class="step-item__text">Pick an open spot.</p>
          </div>
          <div class="step-item">
            <div class="step-item__num">2</div>
            <p class="step-item__text">Slap your name or logo on it.</p>
          </div>
          <div class="step-item">
            <div class="step-item__num">3</div>
            <p class="step-item__text">Call dibs at today's price.</p>
          </div>
          <div class="step-item">
            <div class="step-item__num">4</div>
            <p class="step-item__text">It's yours. Price locked, forever.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}
