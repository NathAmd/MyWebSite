/* =========================
  Project Data
========================= */
const PROJECTS = [
  {
    id:"me",
    ring:0,
    angle:0,
    titre:"Me",
    image:"https://placehold.co/300x300/161b22/ffffff?text=Styloxis",
    description:"Curious and passionate, I love exploring every aspect of coding. No matter the challenge, I always finish what I start.",
    tags:["profile"],
    url:""
  },
  {
    id:"p1",
    ring:1,
    angle:0,
    titre:"MMO",
    image:"https://placehold.co/300x300/161b22/ffffff?text=MMO",
    description:"A turn-based tactical MMO, developed in C# for the server and Unity for the client.",
    tags:["Game"],
    url:"/game/mmo/index.html"
  },
  {
    id:"p2",
    ring:1,
    angle:60,
    titre:"Undead zone",
    image:"https://placehold.co/300x300/222a33/ffffff?text=UZ",
    description:"A game created years ago, which helped me learn from my mistakes—a source of motivation for my growth.",
    tags:["Game","Old"],
    url:"https://store.steampowered.com/app/2329930/Undead_zone/"
  },
  {
    id:"p3",
    ring:1,
    angle:120,
    titre:"CoD zombie VR",
    image:"https://placehold.co/300x300/192028/ffffff?text=VR",
    description:"A mod for a VR game on Unreal Engine, where I completely remade the map of a cult classic and its features. Over 300K downloads before an update to the original game made it obsolete.",
    tags:["Mods"],
    url:"https://mod.io/g/contractors/m/codzfive#description"
  },
  {
    id:"p4",
    ring:1,
    angle:180,
    titre:"Poker AI",
    image:"https://placehold.co/300x300/303e4b/ffffff?text=AI",
    description:"An AI that plays poker in an existing game: card detection with YOLO, data analysis in Python, and decision-making with GPT.",
    tags:["Fun","AI"],
    url:""
  },
  {
    id:"p5",
    ring:1,
    angle:240,
    titre:"Wordpress",
    image:"https://placehold.co/300x300/1f262e/ffffff?text=WP",
    description:"Creation of a complex theme with Three.js and a plugin to manage the theme and its database, for simple and efficient management.",
    tags:["Pro"],
    url:""
  },
  {
    id:"p6",
    ring:1,
    angle:300,
    titre:"Android/iOS App",
    image:"https://placehold.co/300x300/25313b/ffffff?text=MOBILE",
    description:"Creation and publication of various mobile apps: data list management, QR scanning, photo capture and sharing.",
    tags:["Pro"],
    url:""
  }
];

/* =========================
  DOM Construction
========================= */
const honeycombEl = document.getElementById('honeycomb');

function createHex(p) {
  const hex = document.createElement('div');
  hex.className = 'hex';
  hex.dataset.id = p.id;
  hex.dataset.ring = p.ring;
  hex.dataset.angle = p.angle;
  hex.setAttribute('tabindex','0');
  hex.setAttribute('role','button');
  hex.setAttribute('aria-label', p.titre + ' - flip for more info');

  // Build visit link: open in same tab for internal links, new tab only for external
  let linkHtml = '';
  if (p.url && p.url !== '#me') {
    const isAbsolute = /^https?:\/\//.test(p.url);
    const isExternal = isAbsolute && !p.url.startsWith(window.location.origin);
    linkHtml = `<a href="${p.url}" class="btn visit-btn" data-action="visit" ${isExternal ? 'target="_blank" rel="noopener"' : ''}>Visit</a>`;
  }

  hex.innerHTML = `
    <div class="face front">
      <img src="${p.image}" alt="${p.titre}">
      <h2>${p.titre}</h2>
      ${p.ring === 0 ? `<p class="desc">${p.description}</p>` : `
        <div class="tags">${p.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      `}
    </div>
    <div class="face back">
      <h3>${p.titre}</h3>
      <p class="desc">${p.description}</p>
      ${linkHtml}
    </div>
  `;

  // Add hover listeners for desktop only
  hex.addEventListener('mouseenter', () => {
    // Allow hover flip for all hexes on non-mobile (including center)
    if (!isMobileDevice()) {
      hex.classList.add('flipped');
    }
  });
  hex.addEventListener('mouseleave', () => {
    // Allow hover unflip for all hexes on non-mobile (including center)
    if (!isMobileDevice()) {
      hex.classList.remove('flipped');
    }
  });

  return hex;
}

function populate() {
  // Sort projects by ring then angle for display order
  PROJECTS.slice()
    .sort((a, b) => a.ring - b.ring || a.angle - b.angle)
    .forEach(p => honeycombEl.appendChild(createHex(p)));
}

populate();

// Force layout right after initial render
window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(layout);
});

/* =========================
  Global Variables
========================= */
let expanded = false;

/* =========================
  Dynamic Positioning
========================= */
function addMobilePlaceholder(cellSize, hexCount) {
  // Remove old placeholder if present
  const old = honeycombEl.querySelector('.hex.placeholder');
  if (old) old.remove();

  // Add a new invisible placeholder
  const placeholder = document.createElement('div');
  placeholder.className = 'hex placeholder';
  placeholder.setAttribute('aria-hidden', 'true');
  placeholder.style.width = cellSize + 'px';
  placeholder.style.height = cellSize + 'px';
  placeholder.style.opacity = '0';
  placeholder.style.pointerEvents = 'none';
  // Position below the last card
  const verticalSpacing = cellSize * 0.6;
  const baseY = cellSize * 2.2;
  const y = baseY + (hexCount * verticalSpacing);
  // Right column to keep grid
  placeholder.style.left = (window.innerWidth * 0.7) + 'px';
  placeholder.style.top = y + 'px';
  placeholder.style.transform = 'translate(-50%, -50%)';
  honeycombEl.appendChild(placeholder);
}

function layout() {
  const isMobile = window.innerWidth < window.innerHeight;
  
  // Responsive calculation based on screen size
  const vmin = Math.min(window.innerWidth, window.innerHeight);
  let cellSize;

  if (isMobile) {
    cellSize = window.innerWidth * 0.45; // 45vw on mobile
    // Enable scroll on mobile
    document.body.style.overflow = 'auto';
    honeycombEl.style.height = 'auto';
    honeycombEl.style.minHeight = '100vh';
  } else {
    cellSize = vmin * 0.25; // 25% on large screens
    // Disable scroll on desktop
    document.body.style.overflow = 'hidden';
    honeycombEl.style.height = '100vh';
    honeycombEl.style.minHeight = 'auto';
  }

  const ringDistance = cellSize * 1.3;

  const rect = honeycombEl.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // Count of mobile cards (excluding center)
  const hexMobiles = honeycombEl.querySelectorAll('.hex[data-ring]:not([data-ring="0"])');
  const hexCount = hexMobiles.length;

  honeycombEl.querySelectorAll('.hex').forEach((hex, index) => {
    const ring = +hex.dataset.ring;
    const angleDeg = +hex.dataset.angle;

    if (ring === 0) {
      // Center - slightly larger size
      const centerSize = cellSize * 1.4;
      hex.style.width = centerSize + 'px';
      hex.style.height = centerSize + 'px';
      
      if (isMobile) {
        // Move main hexagon to the right on mobile
        hex.style.left = '65%';
        hex.style.top = centerSize * 0.8 + 'px';
      } else {
        hex.style.left = centerX + 'px';
        hex.style.top = centerY + 'px';
      }
      hex.style.transform = 'translate(-50%, -50%)';
    } else {
      // Outer ring hexagons
      hex.style.width = cellSize + 'px';
      hex.style.height = cellSize + 'px';

      if (isMobile) {
        // Mobile layout: tight zigzag interlacing
        const projectIndex = index - 1; // -1 because index 0 is center
        const isLeftColumn = projectIndex % 2 === 0;
        
        const x = isLeftColumn ? window.innerWidth * 0.3 : window.innerWidth * 0.7;
        // Dynamic calculation for baseY and verticalSpacing
        const verticalSpacing = cellSize * 0.6;
        // Move first mobile hex below center, others follow
        const baseY = cellSize * 2.2;
        const y = baseY + (projectIndex * verticalSpacing);
        
        if (!expanded) {
          hex.style.left = '50%';
          hex.style.top = cellSize * 0.8 + 'px';
          hex.style.transform = 'translate(-50%, -50%) scale(0.3)';
          
          setTimeout(() => {
            hex.style.transition = 'left 0.8s ease-out, top 0.8s ease-out, transform 0.8s ease-out';
            hex.style.left = x + 'px';
            hex.style.top = y + 'px';
            hex.style.transform = 'translate(-50%, -50%)';
          }, index * 100 + 200);
        } else {
          hex.style.left = x + 'px';
          hex.style.top = y + 'px';
          hex.style.transform = 'translate(-50%, -50%)';
        }
      } else {
        // Desktop layout: circle
        const angleRad = angleDeg * Math.PI / 180;
        const r = ring * ringDistance;
        const x = Math.cos(angleRad) * r;
        const y = Math.sin(angleRad) * r;

        if (!expanded) {
          hex.style.left = centerX + 'px';
          hex.style.top = centerY + 'px';
          hex.style.transform = 'translate(-50%, -50%) scale(0.3)';
          
          setTimeout(() => {
            hex.style.transition = 'left 0.8s ease-out, top 0.8s ease-out, transform 0.8s ease-out';
            hex.style.left = (centerX + x) + 'px';
            hex.style.top = (centerY + y) + 'px';
            hex.style.transform = 'translate(-50%, -50%)';
          }, index * 100 + 200);
        } else {
          hex.style.left = (centerX + x) + 'px';
          hex.style.top = (centerY + y) + 'px';
          hex.style.transform = 'translate(-50%, -50%)';
        }
      }
    }
  });

  // On mobile, force honeycomb height so last card is visible
  if (isMobile && hexCount > 0) {
    const lastHex = hexMobiles[hexCount - 1];
    const lastTop = parseFloat(lastHex.style.top) || 0;
    const lastHeight = parseFloat(lastHex.style.height) || 0;
    // Add safety margin (footer + space)
    const minHeight = lastTop + lastHeight * 0.5 + 128;
    honeycombEl.style.height = minHeight + 'px';

    // Add invisible fake card to fill gap
    addMobilePlaceholder(cellSize, hexCount);
  } else if (!isMobile) {
    honeycombEl.style.height = '100vh';
    // Remove placeholder if present
    const old = honeycombEl.querySelector('.hex.placeholder');
    if (old) old.remove();
  }
}

window.addEventListener('resize', layout);
layout();

/* =========================
  Interactions
========================= */
function expandOnce() {
  if (expanded) return;
  expanded = true;
  honeycombEl.classList.add('expanded','parallax');
  honeycombEl.setAttribute('data-state','expanded');
  
  // Force recalculation for expansion with normal scale
  setTimeout(() => {
    honeycombEl.querySelectorAll('.hex[data-ring]:not([data-ring="0"])').forEach(hex => {
      hex.style.transform = 'translate(-50%, -50%)';
    });
  }, 100);
}

function toggleFlip(hex) {
  if (!hex || !hex.classList.contains('hex')) return;
  // If center: trigger expansion
  if (+hex.dataset.ring === 0 && !expanded) expandOnce();
  // Flip
  const isFlipped = hex.classList.toggle('flipped');
  hex.setAttribute('aria-pressed', isFlipped ? 'true':'false');
  
  if (isFlipped) {
    // Remove flip from others
    honeycombEl.querySelectorAll('.hex.flipped').forEach(h=>{
      if (h!==hex) {
        h.classList.remove('flipped');
      }
    });
  }
}

// Detect if on mobile for events
const isMobileDevice = () => window.innerWidth < window.innerHeight;

// Click handler: keep stopping propagation on visit clicks (prevents flipping)
honeycombEl.addEventListener('click', e => {
  const target = e.target.closest('.hex');
  if (target) {
    addRipple(e, honeycombEl);
    
    // On mobile: click to flip, on desktop: only for center
    if (isMobileDevice() || +target.dataset.ring === 0) {
      toggleFlip(target);
    }
  }
  if (e.target.matches('[data-action="visit"]')) {
    e.stopPropagation();
  }
});

honeycombEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    const hex = e.target.closest('.hex');
    if (hex) {
      e.preventDefault();
      toggleFlip(hex);
    }
  } else if (e.key === 'Escape') {
    honeycombEl.querySelectorAll('.hex.flipped').forEach(h=>h.classList.remove('flipped'));
  }
});

/* Global Ripple */
function addRipple(ev, container) {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const rect = container.getBoundingClientRect();
  ripple.style.left = (ev.clientX - rect.left) + 'px';
  ripple.style.top = (ev.clientY - rect.top) + 'px';
  container.appendChild(ripple);
  ripple.addEventListener('animationend', ()=>ripple.remove());
}

/* Mouse Parallax */
document.addEventListener('pointermove', e => {
  if (!expanded) return;
  const { innerWidth:w, innerHeight:h } = window;
  const x = (e.clientX / w - .5) * 14;
  const y = (e.clientY / h - .5) * 14;
  honeycombEl.style.transform = `translate3d(${x * .6}px, ${y * .6}px, 0) rotateX(${ -y * .15 }deg) rotateY(${ x * .25 }deg) scale(var(--spread-scale))`;
});

/* Auto expand center after delay */
setTimeout(()=>expandOnce(), 1200);

/* =========================
  Utilities
========================= */
document.getElementById('year').textContent = new Date().getFullYear();

/* Accessibilité: fermer flip en dehors */
document.addEventListener('click', e => {
  if (!e.target.closest('.hex')) {
    // Sur mobile ou si pas de hover actif
    if (isMobileDevice()) {
      honeycombEl.querySelectorAll('.hex.flipped').forEach(h=>h.classList.remove('flipped'));
    }
  }
}, { capture:true });