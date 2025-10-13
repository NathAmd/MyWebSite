import * as THREE from 'three';
import {
  makeState, makeScene, makeCamera, makeRenderer,
  makeGrid, makeHologramMaterial, makeFallbackCube,
  loadFBXWithMaterial, onResize, tickMaterialTime, loadJSON
} from './common.js';

const CONFIG = { dataPath: './data/projects.json', projectsFolder: './data/projects/' };
const S = makeState();

const ui = {
  submenu: null,
  projectCount: null,
  menuToggle: null,
  sideMenu: null,
  menuItems: null,
  projectsSubmenu: null
};

const initUI = () => {
  ui.submenu = document.getElementById('submenu-items');
  ui.projectCount = document.getElementById('project-count');
  ui.menuToggle = document.getElementById('menu-toggle');
  ui.sideMenu = document.getElementById('side-menu');
  ui.menuItems = document.querySelectorAll('.menu-item');
  ui.projectsSubmenu = document.getElementById('projects-submenu');

  ui.menuToggle.addEventListener('click', () => {
    ui.sideMenu.classList.toggle('open');
    ui.menuToggle.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!ui.sideMenu.contains(e.target) && !ui.menuToggle.contains(e.target)) {
      ui.sideMenu.classList.remove('open');
      ui.menuToggle.classList.remove('active');
    }
  });

  ui.menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      if (section === 'projects') {
        ui.projectsSubmenu.classList.toggle('open');
        const open = ui.projectsSubmenu.classList.contains('open');
        ui.menuItems.forEach(mi => { if (mi.dataset.section !== 'projects') mi.classList.remove('active'); });
        item.classList.toggle('active', open);
      } else {
        ui.menuItems.forEach(mi => mi.classList.remove('active'));
        item.classList.add('active');
        ui.projectsSubmenu.classList.remove('open');
      }
    });
  });
};

const populateProjects = (projects) => {
  const list = projects.filter(p => p.ring !== 0);
  ui.submenu.innerHTML = list.map(p => {
    const isExternal = p.url && /^https?:\/\//.test(p.url) && !p.url.startsWith(window.location.origin);
    const href = p.url || `project.html?id=${p.id}`;
    return `<a href="${href}" class="submenu-item" ${isExternal ? 'target="_blank" rel="noopener"' : ''}>${p.titre}</a>`;
  }).join('');
  ui.projectCount.textContent = list.length;
};

const createCenter = async () => {
  S.hologramMaterial = makeHologramMaterial();
  const fbx = await loadFBXWithMaterial('./fbx/Player.fbx', S.hologramMaterial);
  if (fbx) {
    S.centerObject = fbx;
    fbx.scale.setScalar(0.045);
    fbx.position.set(0, 0, 0);
    S.mixer = new THREE.AnimationMixer(fbx);
    const clips = (fbx.animations || []).filter(c => c.duration > 0);
    clips.forEach(c => { const a = S.mixer.clipAction(c); a.setLoop(THREE.LoopRepeat); a.play(); });
    S.scene.add(fbx);
  } else {
    S.centerObject = makeFallbackCube(S.hologramMaterial);
    S.scene.add(S.centerObject);
  }
};

const animate = () => {
  S.animationId = requestAnimationFrame(animate);
  const d = S.clock.getDelta();
  if (S.mixer) S.mixer.update(d);
  tickMaterialTime(S.hologramMaterial);

  if (S.centerObject) {
    if (S.centerObject.geometry) {
      S.centerObject.rotation.y += 0.01;
      S.centerObject.rotation.x += 0.005;
      S.centerObject.position.y = 1.8 + Math.sin(Date.now() * 0.001) * 0.12;
    } else if (S.centerObject.userData && S.centerObject.userData.needsRotation) {
      S.centerObject.rotation.y += 0.005;
    }
  }

  if (S.gridCtrl) S.gridCtrl.update(d);
  S.camera.position.x = Math.sin(Date.now() * 0.0002) * 0.5;
  S.camera.lookAt(0, 4, 0);
  S.renderer.render(S.scene, S.camera);
};

const initThree = () => {
  const canvas = document.getElementById('webgl-canvas');
  S.scene = makeScene();
  S.camera = makeCamera();
  S.camera.position.set(0, 5, 8);
  S.camera.lookAt(0, 1.5, 0);
  S.renderer = makeRenderer(canvas);
  const { grids, update } = makeGrid(S.scene, 'infinite');
  S.grids = grids;
  S.gridCtrl = { update };
  window.addEventListener('resize', () => onResize(S));
};

const loadProjects = async () => {
  const cfg = await loadJSON(CONFIG.dataPath);
  if (!cfg || !Array.isArray(cfg.projects)) return [];
  const out = await Promise.all(cfg.projects.map(id => loadJSON(`${CONFIG.projectsFolder}${id}.json`)));
  return out.filter(Boolean);
};

const init = async () => {
  initThree();
  await createCenter();
  const projects = await loadProjects();
  if (projects.length) {
    initUI();
    populateProjects(projects);
  }
  animate();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
