import * as THREE from 'three';
import {
  makeState, makeScene, makeCamera, makeRenderer,
  makeGrid, makeHologramMaterial,
  onResize, tickMaterialTime, loadJSON, getProjectId
} from './common.js';

const S = makeState();
let cameraPivot = null;
const targetPos = new THREE.Vector3(0, 1.5, 0);

const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
const hide = (id) => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };

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
        <span>Back to Home</span>
      </a>
    </div>
  `;
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

    // cameraPivot.rotation.y += 0.003; // Désactivé : le modèle ne tourne plus
  const h = Math.sin(Date.now() * 0.0003) * 1.5;
  cameraPivot.position.y = 2 + h;
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

  S.renderer.render(S.scene, S.camera);
};

const initThree = () => {
  const canvas = document.getElementById('webgl-canvas');
  S.scene = makeScene();

  cameraPivot = new THREE.Object3D();
  cameraPivot.position.set(0, 2, 0);
  S.scene.add(cameraPivot);

  S.camera = makeCamera();
  S.camera.position.set(0, 1, 10);
  S.camera.lookAt(0, 0, 0);
  cameraPivot.add(S.camera);

  S.renderer = makeRenderer(canvas);
  makeGrid(S.scene, 'static');

  window.addEventListener('resize', () => onResize(S));
};

const populate = (project) => {
  document.title = `${project.titre} - Styloxis`;
  const data = project.pageData;
  if (!data) {
    errorPage('Project details not available.');
    return;
  }
  const { paragraphs, images, customLink } = data;

  if (paragraphs && paragraphs.length >= 2) {
    setText('paragraph-1', paragraphs[0]);
    setText('paragraph-2', paragraphs[1]);
  }

  if (images && images.length >= 2) {
    const i1c = document.getElementById('image-1-container');
    const i2c = document.getElementById('image-2-container');
    const i1 = document.getElementById('image-1');
    const i2 = document.getElementById('image-2');

    const img1 = typeof images[0] === 'string' ? { url: images[0] } : images[0];
    const img2 = typeof images[1] === 'string' ? { url: images[1] } : images[1];

    i1.src = img1.url;
    i1.alt = `${project.titre} screenshot 1`;
    if (img1.placeholderText) {
      const o = document.createElement('div');
      o.className = 'image-placeholder-overlay';
      o.textContent = img1.placeholderText;
      i1c.appendChild(o);
    }

    i2.src = img2.url;
    i2.alt = `${project.titre} screenshot 2`;
    if (img2.placeholderText) {
      const o = document.createElement('div');
      o.className = 'image-placeholder-overlay';
      o.textContent = img2.placeholderText;
      i2c.appendChild(o);
    }
  } else {
    hide('image-1-container');
    hide('image-2-container');
  }

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
  }
};

const init = async () => {
  initThree();
  buildCenter();
  const id = getProjectId();
  if (!id) {
    errorPage('No project ID specified.');
    return;
  }
  const project = await loadJSON(`./data/projects/${id}.json`);
  if (!project) {
    errorPage(`Project "${id}" not found.`);
    return;
  }
  populate(project);
  animate();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
