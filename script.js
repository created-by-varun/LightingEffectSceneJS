let scene, camera, cameraCtrl, renderer;
let light, light1;
let width, height, cx, cy;
let rWidth, rHeight;
const TMath = THREE.Math;

let conf = {
  color: 0x9C1E15,
  objectWidth: 30,
  colWidth: 50,
  rowHeight: 50,
  noiseCoef: 50,
  mouseCoef: 0.1,
  lightIntensity: 1.5,
  ambientColor: 0x808080,
  light1Color: 0xffffff,
  light2Color: 0xffffff,
  light3Color: 0xffffff,
  light4Color: 0xffffff };


let objects;
const simplex = new SimplexNoise();

let mouseOver = false;
const mouse = new THREE.Vector2();
const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const mousePosition = new THREE.Vector3();
const raycaster = new THREE.Raycaster();

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 200;
  cameraCtrl = new THREE.OrbitControls(camera);
  cameraCtrl.enabled = false;

  let size = getRendererSize();
  rWidth = size[0];
  rHeight = size[1];

  initScene();
  initEventHandlers();

  camera.position.z = 300;
  animate();
};

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  initLights();
  initObjects();
}

function initLights() {
  light = new THREE.AmbientLight(conf.ambientColor);
  scene.add(light);

  light1 = new THREE.PointLight(conf.light1Color, conf.lightIntensity, 500);
  light1.position.z = 100;
  light1.castShadow = true;
  scene.add(light1);
}

function initObjects() {
  let geo = new THREE.PlaneBufferGeometry(rWidth * 2, rHeight * 2);
  let mat = new THREE.MeshPhongMaterial({ color: conf.color });
  let plane = new THREE.Mesh(geo, mat);
  plane.castShadow = false;
  plane.receiveShadow = true;
  scene.add(plane);

  objects = [];
  geo = new THREE.BoxGeometry(conf.objectWidth, conf.objectWidth, conf.objectWidth);
  mat = new THREE.MeshPhongMaterial({ color: conf.color });
  let nx = Math.round(rWidth / conf.colWidth) + 1;
  let ny = Math.round(rHeight / conf.rowHeight) + 1;
  let x, y, rx, ry, rz;
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      mesh = new THREE.Mesh(geo, mat);
      x = -rWidth / 2 + i * conf.colWidth;
      y = -rHeight / 2 + j * conf.rowHeight;
      mesh.position.set(x, y, conf.objectWidth);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      objects.push(mesh);
      scene.add(mesh);
    }
  }
}

function animateObjects() {
  const time = Date.now() * 0.00005;
  const mx = mouse.x * conf.mouseCoef;
  const my = mouse.y * conf.mouseCoef;
  const noise = conf.noiseCoef * 0.00001;
  let mesh;
  for (let i = 0; i < objects.length; i++) {
    mesh = objects[i];
    let nx = mesh.position.x * noise + mx + time;
    let ny = mesh.position.y * noise + my + time;
    rx = simplex.noise2D(nx, ny) * Math.PI;
    ry = simplex.noise2D(ny, nx) * Math.PI;
    mesh.rotation.set(rx, ry, 0);
  }
}

function initEventHandlers() {
  onWindowResize();
  window.addEventListener('resize', onWindowResize, false);

  document.body.addEventListener('mousemove', e => {
    const v = new THREE.Vector3();
    camera.getWorldDirection(v);
    v.normalize();
    mousePlane.normal = v;

    mouseOver = true;
    mouse.x = e.clientX / width * 2 - 1;
    mouse.y = -(e.clientY / height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(mousePlane, mousePosition);
    setMapValue(mousePosition.x, mousePosition.y, 50);
  });
  document.body.addEventListener('mouseout', e => {mouseOver = false;});
}

function animate() {
  requestAnimationFrame(animate);

  animateObjects();
  animateLights();

  renderer.render(scene, camera);
};

function animateLights() {
  if (mouseOver) {
    light1.position.x = mousePosition.x;
    light1.position.y = mousePosition.y;
  } else {
    const time = Date.now() * 0.001;
    light1.position.x = Math.sin(time * 0.1) * rWidth / 3;
    light1.position.y = Math.cos(time * 0.2) * rHeight / 3;
  }
}

function onWindowResize() {
  width = window.innerWidth;cx = width / 2;
  height = window.innerHeight;cy = height / 2;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function getRendererSize() {
  mouse.x = 1;mouse.y = 1;
  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), mousePosition);
  return [mousePosition.x * 2, mousePosition.y * 2];
}

function rnd(max, negative) {
  return negative ? Math.random() * 2 * max - max : Math.random() * max;
}

init();