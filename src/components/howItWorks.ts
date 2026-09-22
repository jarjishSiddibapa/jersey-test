export function renderHowItWorks(): string {
  return `
    <section class="section" id="how-it-works">
      <div class="container">
        <p class="section-eyebrow">How it works</p>
        <h2 class="section-title">Four steps. That's it.</h2>
        <div class="steps-grid">
          <div class="step-item">
            <div class="step-item__num">1</div>
            <p class="step-item__text">Pick a spot.</p>
          </div>
          <div class="step-item">
            <div class="step-item__num">2</div>
            <p class="step-item__text">Add your name or logo.</p>
          </div>
          <div class="step-item">
            <div class="step-item__num">3</div>
            <p class="step-item__text">Pay the current price.</p>
          </div>
          <div class="step-item">
            <div class="step-item__num">4</div>
            <p class="step-item__text">Your price is locked.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}
