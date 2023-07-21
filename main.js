import './tailwind.css';
import gsap from 'gsap';
import * as THREE from 'three';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

import atmosphereVertexShader from './shaders/atmosphereVertex.glsl';
import atmosphereFragmentShader from './shaders/atmosphereFragment.glsl';

const canvasContainer = document.querySelector('#canvasContainer');

const scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  75,
  canvasContainer.offsetWidth / canvasContainer.offsetHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: document.querySelector('canvas')
});
renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// create a sphere
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      globeTexture: {
        value: new THREE.TextureLoader().load('./img/globe.jpeg')
      }
    }
  })
);

// create atmosphere
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  })
);

atmosphere.scale.set(1.1, 1.1, 1.1);

scene.add(atmosphere);

const group = new THREE.Group();
group.add(sphere);
scene.add(group);

const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff
});

const starVertices = [];
for (let i = 0; i < 10000; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = -Math.random() * 3000;
  starVertices.push(x, y, z);
}

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

camera.position.z = 15;

sphere.rotation.y = -Math.PI / 2;

group.rotation.offset = {
  x: 0,
  y: 0
};

const mouse = {
  x: undefined,
  y: undefined,
  down: false,
  xPrev: undefined,
  yPrev: undefined
};

console.log(group.children);

const raycaster = new THREE.Raycaster();

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(
    group.children.filter((mesh) => {
      return mesh.geometry.type === 'BoxGeometry';
    })
  );

  group.children.forEach((mesh) => {
    mesh.material.opacity = 0.4;
  });

  for (let i = 0; i < intersects.length; i++) {
    const box = intersects[i].object;
    box.material.opacity = 1;
  }

  renderer.render(scene, camera);
}
animate();

canvasContainer.addEventListener('mousedown', ({ clientX, clientY }) => {
  mouse.down = true;
  mouse.xPrev = clientX;
  mouse.yPrev = clientY;
});

addEventListener('mousemove', (event) => {
  if (innerWidth >= 1280) {
    mouse.x = ((event.clientX - innerWidth / 2) / (innerWidth / 2)) * 2 - 1;
    mouse.y = -(event.clientY / innerHeight) * 2 + 1;
  } else {
    const offset = canvasContainer.getBoundingClientRect().top;
    mouse.x = (event.clientX / innerWidth) * 2 - 1;
    mouse.y = -((event.clientY - offset) / innerHeight) * 2 + 1;
    console.log(mouse.y);
  }

  if (mouse.down) {
    event.preventDefault();
    // console.log('turn the earth')
    const deltaX = event.clientX - mouse.xPrev;
    const deltaY = event.clientY - mouse.yPrev;

    group.rotation.offset.x += deltaY * 0.005;
    group.rotation.offset.y += deltaX * 0.005;

    gsap.to(group.rotation, {
      y: group.rotation.offset.y,
      x: group.rotation.offset.x,
      duration: 2
    });
    mouse.xPrev = event.clientX;
    mouse.yPrev = event.clientY;
  }

  // console.log(mouse)
});

addEventListener('mouseup', (event) => {
  mouse.down = false;
});

addEventListener('resize', () => {
  renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
  camera = new THREE.PerspectiveCamera(
    75,
    canvasContainer.offsetWidth / canvasContainer.offsetHeight,
    0.1,
    1000
  );

  camera.position.z = 15;
});

addEventListener(
  'touchmove',
  (event) => {
    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;

    const doesIntersect = raycaster.intersectObject(sphere);
    console.log(doesIntersect);
    if (doesIntersect.length > 0) mouse.down = true;

    if (mouse.down) {
      const offset = canvasContainer.getBoundingClientRect().top;
      mouse.x = (event.clientX / innerWidth) * 2 - 1;
      mouse.y = -((event.clientY - offset) / innerHeight) * 2 + 1;
      console.log(mouse.y);

      event.preventDefault();
      // console.log('turn the earth')
      const deltaX = event.clientX - mouse.xPrev;
      const deltaY = event.clientY - mouse.yPrev;

      group.rotation.offset.x += deltaY * 0.005;
      group.rotation.offset.y += deltaX * 0.005;

      gsap.to(group.rotation, {
        y: group.rotation.offset.y,
        x: group.rotation.offset.x,
        duration: 2
      });
      mouse.xPrev = event.clientX;
      mouse.yPrev = event.clientY;
    }

    // console.log(mouse)
  },
  { passive: false }
);

addEventListener('touchend', (event) => {
  mouse.down = false;
});
