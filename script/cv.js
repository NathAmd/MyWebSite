const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const setScale = (value) => {
  document.documentElement.style.setProperty('--cv-font-scale', String(value));
};

const fitCvToPage = () => {
  const page = document.querySelector('.cv-page');
  if (!page) return;

  const MIN_SCALE = 0.8;

  setScale(1);

  const candidates = [
    page,
    page.querySelector('.cv-main'),
    page.querySelector('.cv-aside'),
    page.querySelector('.cv-grid')
  ].filter(Boolean);

  const isOverflowing = () => candidates.some((el) => el.scrollHeight > el.clientHeight + 1);

  // Reduce slightly if anything overflows the A4 page.
  if (!isOverflowing()) return;

  const ratios = candidates
    .map((el) => (el.scrollHeight > 0 ? el.clientHeight / el.scrollHeight : 1))
    .filter((r) => Number.isFinite(r) && r > 0);

  const ratio = Math.min(...ratios, 1);
  let scale = clamp(ratio * 0.992, MIN_SCALE, 1);
  setScale(Number(scale.toFixed(2)));

  for (let i = 0; i < 24 && isOverflowing() && scale > MIN_SCALE; i += 1) {
    scale = clamp(scale - 0.01, MIN_SCALE, 1);
    setScale(Number(scale.toFixed(2)));
  }
};

window.addEventListener('load', fitCvToPage);
window.addEventListener('resize', () => {
  window.requestAnimationFrame(fitCvToPage);
});
window.addEventListener('beforeprint', fitCvToPage);

const printMq = window.matchMedia?.('print');
if (printMq) {
  const onChange = (e) => {
    if (e.matches) fitCvToPage();
  };
  if (typeof printMq.addEventListener === 'function') printMq.addEventListener('change', onChange);
  else if (typeof printMq.addListener === 'function') printMq.addListener(onChange);
}
