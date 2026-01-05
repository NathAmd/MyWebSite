import * as THREE from 'three';
import {
  makeState, makeScene, makeCamera, makeRenderer,
  makeGrid, makeHologramMaterial,
  onResize, tickMaterialTime, loadJSON, getProjectId
} from './common.js';

const S = makeState();
let cameraPivot = null;
const targetPos = new THREE.Vector3(0, 1.5, 0);
// Orbit settings
S.autoOrbit = true; // toggle automatic orbit
S.orbitSpeed = 0.25; // radians per second
// Camera constraints
S.minCameraZ = 6; // don't allow camera z to go below this (closer to object)

const hide = (id) => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };
const show = (id, display = '') => { const el = document.getElementById(id); if (el) el.style.display = display; };

const errorPage = (message) => {
  const c = document.querySelector('.project-container');
  c.innerHTML = `
    <div style="text-align:center;padding:4rem 2rem;">
      <h1 style="color:var(--fg,#e6edf3);margin-bottom:1rem;">Error</h1>
      <p style="color:var(--fg-dim,#7d8590);margin-bottom:2rem;">${message}</p>
      <a href="./index.html" class="back-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Back to portfolio</span>
      </a>
    </div>
  `;
};

const wrapIfNeeded = (html) => {
  const s = (html || '').trim();
  if (!s) return '';
  if (/<\/(p|ul|ol|div|h\d|section|article)\b/i.test(s)) return s;
  return `<p>${s}</p>`;
};

const setText = (id, text) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text || '';
};

const fitProjectTitle = () => {
  const el = document.getElementById('project-title');
  if (!el) return;
  el.style.fontSize = '';
  if (el.clientWidth <= 0) return;

  const minPx = 18;
  let size = parseFloat(window.getComputedStyle(el).fontSize || '0');
  if (!Number.isFinite(size) || size <= 0) return;

  let safety = 48;
  while (el.scrollWidth > el.clientWidth && size > minPx && safety-- > 0) {
    size -= 1;
    el.style.fontSize = `${size}px`;
  }
};

const initSideMenu = async (currentId) => {
  const sideMenu = document.getElementById('side-menu');
  const menuToggle = document.getElementById('project-menu-toggle');
  const projectsSubmenu = document.getElementById('projects-submenu');
  const submenuItems = document.getElementById('submenu-items');
  const projectCount = document.getElementById('project-count');

  if (!sideMenu || !menuToggle) return;

  const menuItems = sideMenu.querySelectorAll('.menu-item');
  const projectsButton = sideMenu.querySelector('.menu-item[data-section="projects"]');

  const openMenu = () => {
    sideMenu.classList.add('open');
    document.body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.classList.add('active');
    if (projectsSubmenu) projectsSubmenu.classList.add('open');
    if (projectsButton) projectsButton.classList.add('active');
  };

  const closeMenu = () => {
    sideMenu.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.classList.remove('active');
  };

  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = sideMenu.classList.contains('open');
    if (isOpen) closeMenu();
    else openMenu();
  };

  menuToggle.addEventListener('click', toggleMenu);

  document.addEventListener('click', (e) => {
    if (!sideMenu.classList.contains('open')) return;
    if (sideMenu.contains(e.target) || menuToggle.contains(e.target)) return;
    closeMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  menuItems.forEach((item) => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      if (section === 'projects') {
        projectsSubmenu?.classList.toggle('open');
        const open = Boolean(projectsSubmenu?.classList.contains('open'));
        menuItems.forEach((mi) => { if (mi.dataset.section !== 'projects') mi.classList.remove('active'); });
        item.classList.toggle('active', open);
      } else {
        menuItems.forEach((mi) => mi.classList.remove('active'));
        item.classList.add('active');
        projectsSubmenu?.classList.remove('open');
      }
    });
  });

  const cfg = await loadJSON('./data/projects.json');
  if (!cfg || !Array.isArray(cfg.projects) || !cfg.projects.length || !submenuItems || !projectCount) {
    menuToggle.style.display = 'none';
    return;
  }

  const projects = await Promise.all(cfg.projects.map((id) => loadJSON(`./data/projects/${id}.json`)));
  const list = projects.filter(Boolean).filter((p) => p.ring !== 0);

  submenuItems.innerHTML = '';
  list.forEach((p) => {
    const href = p.url || `project.html?id=${encodeURIComponent(p.id)}`;
    const isExternal = Boolean(p.url && /^https?:\/\//.test(p.url) && !p.url.startsWith(window.location.origin));

    const a = document.createElement('a');
    a.className = 'submenu-item';
    a.href = href;
    a.textContent = p.titre || p.id;
    if (p.id === currentId) a.setAttribute('aria-current', 'page');
    if (isExternal) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    }
    submenuItems.appendChild(a);
  });

  projectCount.textContent = String(list.length);
};

const normalizeImage = (img) => {
  if (!img) return null;
  if (typeof img === 'string') return { url: img };
  if (typeof img === 'object' && typeof img.url === 'string') return img;
  return null;
};

const createProjectSection = ({ title, content, image, reverse, callout }, projectTitle, index) => {
  const section = document.createElement('section');
  section.className = `project-section${reverse ? ' reverse' : ''}${callout ? ' callout' : ''}`;
  section.dataset.sectionIndex = String(index);

  if (title) {
    const h = document.createElement('h2');
    h.className = 'project-section-title';
    h.textContent = title;
    section.appendChild(h);
  }

  const body = document.createElement('div');
  body.className = 'project-text';
  body.innerHTML = wrapIfNeeded(content);
  section.appendChild(body);

  const normalizedImage = normalizeImage(image);
  if (normalizedImage && normalizedImage.url) {
    const container = document.createElement('div');
    container.className = 'image-container';

    const img = document.createElement('img');
    img.className = 'project-image';
    img.src = normalizedImage.url;
    img.alt = `${projectTitle} — capture ${index + 1}`;
    container.appendChild(img);

    if (normalizedImage.placeholderText) {
      const o = document.createElement('div');
      o.className = 'image-placeholder-overlay';
      o.textContent = normalizedImage.placeholderText;
      container.appendChild(o);
    }

    section.appendChild(container);
  }

  return section;
};

const buildCenter = () => {
  S.hologramMaterial = makeHologramMaterial();
  const g = new THREE.BoxGeometry(2, 2, 2);
  S.centerObject = new THREE.Mesh(g, S.hologramMaterial);
  S.centerObject.position.set(0, 1.5, 0);
  S.scene.add(S.centerObject);
};

const animate = () => {
  requestAnimationFrame(animate);
  const d = S.clock.getDelta();

  tickMaterialTime(S.hologramMaterial);

    // Orbit the pivot (camera is child of pivot) when enabled
  if (S.autoOrbit && window.innerWidth > 768) {
    cameraPivot.rotation.y += S.orbitSpeed * d;
  }
  const h = Math.sin(Date.now() * 0.0003) * 1.5;
  // keep pivot vertically offset relative to target, plus small oscillation
  cameraPivot.position.y = targetPos.y + 0.5 + h;
  cameraPivot.updateMatrixWorld();

  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    S.camera.lookAt(targetPos);
  } else {
    const camRight = new THREE.Vector3().setFromMatrixColumn(S.camera.matrixWorld, 0);
    const dist = S.camera.position.distanceTo(targetPos);
    const vFOV = S.camera.fov * Math.PI / 180;
    const viewH = 2 * Math.tan(vFOV / 2) * dist;
    const viewW = viewH * S.camera.aspect;
    const offset = -viewW * 0.20;
    const look = targetPos.clone().add(camRight.multiplyScalar(offset));
    S.camera.lookAt(look);
  }
  // Mouvement en arc de cercle, sans oscillation verticale
  const t = Date.now() * 0.001;
  const radius = 0.1;
  S.centerObject.position.x = Math.cos(t) * radius;
  S.centerObject.position.z = Math.sin(t) * radius;
  S.centerObject.position.y = 0;

  // Ensure camera doesn't get too close on the local Z axis
  if (S.camera.position.z < S.minCameraZ) {
    S.camera.position.z = S.minCameraZ;
  }

  S.renderer.render(S.scene, S.camera);
};

const initThree = () => {
  const canvas = document.getElementById('webgl-canvas');
  S.scene = makeScene();
  cameraPivot = new THREE.Object3D();
  // position pivot at target position (with a small upward offset) so rotation orbits the object
  cameraPivot.position.set(targetPos.x, targetPos.y + 0.5, targetPos.z);
  S.scene.add(cameraPivot);

  S.camera = makeCamera();
  S.camera.position.set(0, 1, 14);
  S.camera.lookAt(0, 0, 0);
  cameraPivot.add(S.camera);

  S.renderer = makeRenderer(canvas);
  makeGrid(S.scene, 'static');

  window.addEventListener('resize', () => onResize(S));
};

const populate = (project) => {
  document.title = `${project.titre} — Nathanaël A.`;
  setText('project-title', project.titre);
  requestAnimationFrame(fitProjectTitle);

  const description = typeof project.description === 'string' ? project.description.trim() : '';
  if (description) {
    setText('project-description', description);
    show('project-description');
  } else {
    hide('project-description');
  }

  const data = project.pageData;
  if (!data) {
    errorPage('Project details are unavailable.');
    return;
  }
  const { sections, paragraphs, images, customLink } = data;

  const root = document.getElementById('project-sections');
  if (!root) {
    errorPage('Structure de page invalide.');
    return;
  }
  root.innerHTML = '';

  const resolvedSections = [];
  if (Array.isArray(sections) && sections.length) {
    sections.forEach((s, idx) => {
      if (!s) return;
      resolvedSections.push({
        title: typeof s.title === 'string' ? s.title : '',
        content: typeof s.content === 'string' ? s.content : '',
        image: s.image,
        reverse: Boolean(s.reverse) || idx % 2 === 1,
        callout: Boolean(s.callout)
      });
    });
  } else if (Array.isArray(paragraphs) && paragraphs.length) {
    if (paragraphs[0]) resolvedSections.push({ content: paragraphs[0], image: images && images[0], reverse: false, callout: false });
    if (paragraphs[1]) resolvedSections.push({ content: paragraphs[1], image: images && images[1], reverse: true, callout: false });
    if (paragraphs[2]) resolvedSections.push({ content: paragraphs[2], reverse: false, callout: true });
  } else {
    errorPage('Contenu du projet indisponible.');
    return;
  }

  const isCompact = window.innerHeight < 640 || window.innerWidth < 420;
  const maxSections = isCompact ? 1 : 2;
  resolvedSections.slice(0, maxSections).forEach((s, idx) => {
    root.appendChild(createProjectSection(s, project.titre, idx));
  });

  if (customLink && customLink.url && customLink.text) {
    const section = document.getElementById('custom-link-section');
    const a = document.getElementById('custom-link');
    const t = document.getElementById('custom-link-text');
    a.href = customLink.url;
    t.textContent = customLink.text;
    section.style.display = 'block';
    const ext = /^https?:\/\//.test(customLink.url) && !customLink.url.startsWith(window.location.origin);
    if (ext) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    } else {
      a.removeAttribute('target');
      a.removeAttribute('rel');
    }
  } else {
    hide('custom-link-section');
  }
};

const init = async () => {
  initThree();
  buildCenter();
  window.addEventListener('resize', () => requestAnimationFrame(fitProjectTitle));
  const id = getProjectId();
  if (!id) {
    errorPage('No project specified.');
    return;
  }
  const project = await loadJSON(`./data/projects/${id}.json`);
  if (!project) {
    errorPage(`Project "${id}" not found.`);
    return;
  }
  populate(project);
  await initSideMenu(id);
  animate();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
