(() => {
  const supportedLanguages = ['en', 'fr'];
  const storageKey = 'styloxis-language';

  const normalizeLanguage = (language) => supportedLanguages.includes(language) ? language : 'en';

  const cacheDefaults = () => {
    document.querySelectorAll('[data-fr]').forEach((element) => {
      if (!element.hasAttribute('data-en')) element.dataset.en = element.textContent;
    });

    document.querySelectorAll('[data-fr-html]').forEach((element) => {
      if (!element.hasAttribute('data-en-html')) element.dataset.enHtml = element.innerHTML;
    });

    document.querySelectorAll('[data-fr-content]').forEach((element) => {
      if (!element.hasAttribute('data-en-content')) element.dataset.enContent = element.getAttribute('content') || '';
    });

    document.querySelectorAll('[data-fr-label]').forEach((element) => {
      if (!element.hasAttribute('data-en-label')) element.dataset.enLabel = element.getAttribute('aria-label') || '';
    });

    document.querySelectorAll('[data-fr-title]').forEach((element) => {
      if (!element.hasAttribute('data-en-title')) element.dataset.enTitle = element.textContent || document.title;
    });
  };

  const applyLanguage = (language) => {
    const activeLanguage = normalizeLanguage(language);
    document.documentElement.lang = activeLanguage;

    document.querySelectorAll('[data-fr]').forEach((element) => {
      const value = activeLanguage === 'fr' ? element.dataset.fr : element.dataset.en;
      if (value !== undefined) element.textContent = value;
    });

    document.querySelectorAll('[data-fr-html]').forEach((element) => {
      const value = activeLanguage === 'fr' ? element.dataset.frHtml : element.dataset.enHtml;
      if (value !== undefined) element.innerHTML = value;
    });

    document.querySelectorAll('[data-fr-content]').forEach((element) => {
      const value = activeLanguage === 'fr' ? element.dataset.frContent : element.dataset.enContent;
      if (value !== undefined) element.setAttribute('content', value);
    });

    document.querySelectorAll('[data-fr-label]').forEach((element) => {
      const value = activeLanguage === 'fr' ? element.dataset.frLabel : element.dataset.enLabel;
      if (value !== undefined) element.setAttribute('aria-label', value);
    });

    document.querySelectorAll('[data-fr-title]').forEach((element) => {
      const value = activeLanguage === 'fr' ? element.dataset.frTitle : element.dataset.enTitle;
      if (!value) return;
      if (element.tagName.toLowerCase() === 'title') {
        document.title = value;
      } else {
        element.setAttribute('title', value);
      }
    });

    document.querySelectorAll('[data-lang-option]').forEach((button) => {
      const isActive = button.dataset.langOption === activeLanguage;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    try {
      window.localStorage.setItem(storageKey, activeLanguage);
    } catch {
      // localStorage can be unavailable in restrictive browser contexts.
    }
  };

  cacheDefaults();

  const queryLanguage = new URLSearchParams(window.location.search).get('lang');
  let storedLanguage = 'en';

  try {
    storedLanguage = window.localStorage.getItem(storageKey) || 'en';
  } catch {
    storedLanguage = 'en';
  }

  applyLanguage(queryLanguage || storedLanguage);

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-lang-option]');
    if (!button) return;
    applyLanguage(button.dataset.langOption);
  });
})();

document.documentElement.classList.add('js');
document.body.classList.add('js-enabled');

const header = document.querySelector('[data-header]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const updateHeaderState = () => {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 12);
};

const revealElements = Array.from(document.querySelectorAll('.reveal'));

const revealVisibleElements = () => {
  revealElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      element.classList.add('is-visible');
    }
  });
};

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

revealVisibleElements();
window.setTimeout(revealVisibleElements, 80);

updateHeaderState();
window.addEventListener('scroll', updateHeaderState, { passive: true });

const canvas = document.querySelector('#terrain-canvas');
const canvasContext = canvas?.getContext('2d');
const stage = canvas?.closest('.hero');

if (canvas && canvasContext && stage) {
  let canvasWidth = 0;
  let canvasHeight = 0;
  let animationFrame = 0;

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = Math.max(1, rect.width);
    canvasHeight = Math.max(1, rect.height);
    canvas.width = Math.floor(canvasWidth * pixelRatio);
    canvas.height = Math.floor(canvasHeight * pixelRatio);
    canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  const drawCanvas = (time = 0) => {
    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
    const lineGap = Math.max(17, canvasHeight / 36);
    const amplitude = Math.max(24, canvasWidth / 48);
    const drift = reduceMotion ? 0 : time * 0.00018;

    for (let line = -4; line < canvasHeight / lineGap + 5; line += 1) {
      const baseY = line * lineGap + drift * 34;
      const alpha = line % 5 === 0 ? 0.27 : 0.135;

      canvasContext.beginPath();

      for (let x = -28; x <= canvasWidth + 28; x += 12) {
        const nx = x / canvasWidth;
        const ridge = Math.sin(nx * 7.2 + line * 0.42 + drift) * 0.95;
        const fold = Math.sin(nx * 15.5 - line * 0.22 - drift * 1.4) * 0.38;
        const detail = Math.sin(nx * 31 + line * 0.58 + drift * 0.7) * 0.18;
        const y = baseY + (ridge + fold + detail) * amplitude + nx * 10;

        if (x === -28) {
          canvasContext.moveTo(x, y);
        } else {
          canvasContext.lineTo(x, y);
        }
      }

      canvasContext.strokeStyle = `rgba(239, 236, 223, ${alpha})`;
      canvasContext.lineWidth = line % 5 === 0 ? 1.2 : 0.82;
      canvasContext.stroke();
    }

    if (!reduceMotion) {
      animationFrame = window.requestAnimationFrame(drawCanvas);
    }
  };

  resizeCanvas();
  drawCanvas();

  window.addEventListener('resize', () => {
    resizeCanvas();
    if (reduceMotion) drawCanvas();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
      return;
    }

    resizeCanvas();
    drawCanvas();
  });
}