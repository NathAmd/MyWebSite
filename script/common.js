import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export const makeState = () => ({
  scene: null,
  camera: null,
  renderer: null,
  grids: [],
  gridCtrl: null,
  centerObject: null,
  hologramMaterial: null,
  mixer: null,
  clock: new THREE.Clock(),
  animationId: null
});

export const makeScene = () => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0e14, 10, 50);
  const ambient = new THREE.AmbientLight(0xffffff, 0.3);
  const dir = new THREE.DirectionalLight(0xffb400, 1);
  dir.position.set(5, 10, 5);
  const point = new THREE.PointLight(0x00d4ff, 2, 20);
  point.position.set(0, 2, 0);
  scene.add(ambient, dir, point);
  return scene;
};

export const makeCamera = () => {
  const cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  return cam;
};

export const makeRenderer = (canvas) => {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setSize(window.innerWidth, window.innerHeight);
  r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.2;
  return r;
};

export const makeGrid = (scene, mode = 'static') => {
  const gridSize = 200;
  const divisions = 800;
  const planeGeo = new THREE.PlaneGeometry(gridSize * 2, mode === 'infinite' ? gridSize * 4 : gridSize * 2);
  const planeMat = new THREE.MeshBasicMaterial({ color: 0x0a0e14, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -0.01;
  if (mode === 'infinite') plane.position.z = gridSize;
  scene.add(plane);

  if (mode === 'static') {
    const gh = new THREE.GridHelper(gridSize, divisions, 0xffffff, 0x888888);
    gh.position.y = 0;
    gh.material.opacity = 0.4;
    gh.material.transparent = true;
    scene.add(gh);
    return { grids: [gh], update: () => {} };
  } else {
    const arr = [];
    for (let i = 0; i < 3; i++) {
      const gh = new THREE.GridHelper(gridSize, divisions, 0xffffff, 0x888888);
      gh.position.y = 0;
      gh.position.z = i * gridSize;
      gh.material.opacity = 0.4;
      gh.material.transparent = true;
      scene.add(gh);
      arr.push(gh);
    }
    const speed = 5;
    const update = (delta) => {
      arr.forEach(g => {
        g.position.z -= speed * delta;
        if (g.position.z < -200) g.position.z += 600;
      });
    };
    return { grids: arr, update };
  }
};

export const makeHologramMaterial = () => {
  return new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, color: { value: new THREE.Color(0x6699cc) } },
    vertexShader: `
      #include <skinning_pars_vertex>
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        #include <skinbase_vertex>
        #include <begin_vertex>
        #include <skinning_vertex>
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vec3 viewDirection = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.5);
        float scale = 2.0;
        vec3 w = abs(vNormal);
        w = w / (w.x + w.y + w.z);
        float gxy = max(step(0.95, fract(vPosition.x * scale)), step(0.95, fract(vPosition.y * scale)));
        float gxz = max(step(0.95, fract(vPosition.x * scale)), step(0.95, fract(vPosition.z * scale)));
        float gyz = max(step(0.95, fract(vPosition.y * scale)), step(0.95, fract(vPosition.z * scale)));
        float grid3D = gxy * w.z + gxz * w.y + gyz * w.x;
        float gu = max(step(0.95, fract(vUv.x * 50.0)), step(0.95, fract(vUv.y * 50.0)));
        float scan = sin(vPosition.y * 0.8 + time * 1.5) * 0.2 + 0.8;
        float flick = sin(time * 4.0) * 0.03 + 0.97;
        float pat = max(gu * 0.3, grid3D * 0.8);
        vec3 col = color * (fresnel * 0.4 + scan * 0.15 + pat * 0.5 + 0.8) * flick;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    transparent: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    depthWrite: true,
    skinning: true
  });
};

export const makeFallbackCube = (material) => {
  const geo = new THREE.BoxGeometry(2, 2, 2);
  const mat = material || new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, color: { value: new THREE.Color(0x6699cc) } },
    vertexShader: `
      varying vec3 vNormal; varying vec3 vPosition; varying vec2 vUv;
      void main(){ vNormal = normalize(normalMatrix * normal); vPosition = position; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: `
      uniform float time; uniform vec3 color; varying vec3 vNormal; varying vec3 vPosition; varying vec2 vUv;
      void main(){
        vec3 viewDirection = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.5);
        float scan = sin(vPosition.y * 8.0 + time * 1.5) * 0.2 + 0.8;
        float flick = sin(time * 4.0) * 0.03 + 0.97;
        vec3 col = color * (fresnel * 0.4 + scan * 0.15) * flick;
        float a = (fresnel * 0.3 + 0.15) * flick;
        gl_FragColor = vec4(col, a);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 1.8, 0);
  return mesh;
};

export const loadFBXWithMaterial = async (url, material) => {
  const loader = new FBXLoader();
  try {
    const fbx = await loader.loadAsync(url);
    fbx.traverse((c) => { if (c.isMesh) { c.material = material; c.material.needsUpdate = true; } });
    return fbx;
  } catch {
    return null;
  }
};

export const onResize = (state) => {
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(window.innerWidth, window.innerHeight);
};

export const tickMaterialTime = (material) => {
  if (material && material.uniforms && material.uniforms.time) material.uniforms.time.value = Date.now() * 0.001;
};

export const loadJSON = async (url) => {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error();
    return await r.json();
  } catch {
    return null;
  }
};

export const getProjectId = () => new URLSearchParams(window.location.search).get('id');
