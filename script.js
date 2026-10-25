let pointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  ndcX: 0,
  ndcY: 0,
};

function updatePointer(e) {
  if (e.touches && e.touches.length > 0) {
    pointer.x = e.touches[0].clientX;
    pointer.y = e.touches[0].clientY;
  } else {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  }
  pointer.ndcX = (pointer.x / window.innerWidth) * 2 - 1;
  pointer.ndcY = -(pointer.y / window.innerHeight) * 2 + 1;
}
window.addEventListener("mousemove", updatePointer);
window.addEventListener("touchmove", updatePointer);

// 1. CONTINUOUS FLOATING BACKGROUND PARTICLES ENGINE
const bgCanvas = document.getElementById("bgParticlesCanvas");
const bgCtx = bgCanvas.getContext("2d");
let particles = [];
const numParticles = Math.min(Math.floor(window.innerWidth / 25), 55);

function resizeBgCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeBgCanvas);
resizeBgCanvas();

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * bgCanvas.width;
    this.y = Math.random() * bgCanvas.height;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = (Math.random() - 0.5) * 0.6;
    this.radius = Math.random() * 2 + 1;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > bgCanvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > bgCanvas.height) this.vy *= -1;
  }
  draw() {
    const styles = getComputedStyle(document.documentElement);
    const pColor =
      styles.getPropertyValue("--particle-color").trim() ||
      "rgba(34, 211, 238, 0.4)";
    bgCtx.beginPath();
    bgCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    bgCtx.fillStyle = pColor;
    bgCtx.fill();
  }
}

for (let i = 0; i < numParticles; i++) {
  particles.push(new Particle());
}

function animateBgParticles() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  const styles = getComputedStyle(document.documentElement);
  const lineColor =
    styles.getPropertyValue("--particle-line").trim() ||
    "rgba(34, 211, 238, 0.12)";

  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();

    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 120) {
        bgCtx.beginPath();
        bgCtx.moveTo(particles[i].x, particles[i].y);
        bgCtx.lineTo(particles[j].x, particles[j].y);
        bgCtx.strokeStyle = lineColor;
        bgCtx.lineWidth = 0.8;
        bgCtx.stroke();
      }
    }
  }
  requestAnimationFrame(animateBgParticles);
}
animateBgParticles();

window.addEventListener("scroll", () => {
  const winScroll =
    document.body.scrollTop || document.documentElement.scrollTop;
  const height =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  document.getElementById("scrollProgress").style.width = scrolled + "%";
});

const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const html = document.documentElement;

function setTheme(isDark) {
  if (isDark) {
    html.classList.add("dark");
    themeIcon.className = "fa-solid fa-sun text-amber-400 text-xs";
    localStorage.setItem("theme", "dark");
  } else {
    html.classList.remove("dark");
    themeIcon.className = "fa-solid fa-moon text-slate-700 text-xs";
    localStorage.setItem("theme", "light");
  }
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") setTheme(false);
else setTheme(true);

themeToggleBtn.addEventListener("click", () =>
  setTheme(!html.classList.contains("dark")),
);

const scanlineToggleBtn = document.getElementById("scanlineToggleBtn");
const scanlineFilter = document.getElementById("scanlineFilter");
scanlineToggleBtn.addEventListener("click", () => {
  scanlineFilter.classList.toggle("hidden");
  scanlineToggleBtn.classList.toggle("text-rose-500");
  scanlineToggleBtn.classList.toggle("border-rose-500/50");
});

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileMenu = document.getElementById("mobileMenu");
mobileMenuBtn.addEventListener("click", () =>
  mobileMenu.classList.toggle("hidden"),
);
mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => mobileMenu.classList.add("hidden"));
});

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 },
);

document
  .querySelectorAll(".reveal")
  .forEach((el) => revealObserver.observe(el));

let scene, camera, renderer;
let robotGroup, headGroup, leftEyePupil, rightEyePupil;
const mouseWorldTarget = new THREE.Vector3(0, 0, 5);
const raycaster = new THREE.Raycaster();
const planeTarget = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

function init3DRobot() {
  const container = document.getElementById("threeRobotContainer");
  if (!container) return;

  const width = container.clientWidth || 300;
  const height = container.clientHeight || 300;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
  camera.position.set(0, 0.2, 5.2);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0x00f2fe, 1.3);
  mainLight.position.set(4, 5, 4);
  scene.add(mainLight);

  const rimLight = new THREE.DirectionalLight(0x58a6ff, 1.2);
  rimLight.position.set(-4, 3, -2);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0xffffff, 0.4);
  fillLight.position.set(0, -2, 3);
  scene.add(fillLight);

  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0xcfd8dc,
    metalness: 0.88,
    roughness: 0.2,
  });

  const porcelainMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.08,
    roughness: 0.12,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.45,
    roughness: 0.25,
  });

  const headsetMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.2,
  });

  const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
  const darkLensMat = new THREE.MeshStandardMaterial({
    color: 0x080c14,
    roughness: 0.08,
  });
  const glassLensMat = new THREE.MeshPhysicalMaterial({
    color: 0x58a6ff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.85,
  });

  robotGroup = new THREE.Group();
  headGroup = new THREE.Group();

  const headGeo = new THREE.SphereGeometry(0.82, 32, 32);
  headGeo.scale(1, 1.05, 0.95);
  const headMesh = new THREE.Mesh(headGeo, porcelainMat);
  headGroup.add(headMesh);

  const hairCapGeo = new THREE.SphereGeometry(
    0.85,
    32,
    24,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.42,
  );
  const hairCapMesh = new THREE.Mesh(hairCapGeo, hairMat);
  hairCapMesh.position.y = 0.08;
  headGroup.add(hairCapMesh);

  const earCapGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.1, 24);
  earCapGeo.rotateZ(Math.PI / 2);

  const earCapRingGeo = new THREE.TorusGeometry(0.22, 0.03, 16, 32);
  earCapRingGeo.rotateY(Math.PI / 2);

  const leftEarCap = new THREE.Mesh(earCapGeo, headsetMat);
  leftEarCap.position.set(-0.84, 0.12, 0);
  headGroup.add(leftEarCap);

  const leftEarRing = new THREE.Mesh(earCapRingGeo, cyanGlowMat);
  leftEarRing.position.set(-0.89, 0.12, 0);
  headGroup.add(leftEarRing);

  const rightEarCap = new THREE.Mesh(earCapGeo, headsetMat);
  rightEarCap.position.set(0.84, 0.12, 0);
  headGroup.add(rightEarCap);

  const rightEarRing = new THREE.Mesh(earCapRingGeo, cyanGlowMat);
  rightEarRing.position.set(0.89, 0.12, 0);
  headGroup.add(rightEarRing);

  const eyeSocketGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.08, 24);
  eyeSocketGeo.rotateX(Math.PI / 2);

  const leftSocket = new THREE.Mesh(eyeSocketGeo, darkLensMat);
  leftSocket.position.set(-0.32, 0.05, 0.75);
  headGroup.add(leftSocket);

  const rightSocket = new THREE.Mesh(eyeSocketGeo, darkLensMat);
  rightSocket.position.set(0.32, 0.05, 0.75);
  headGroup.add(rightSocket);

  const pupilGeo = new THREE.SphereGeometry(0.08, 16, 16);
  leftEyePupil = new THREE.Mesh(pupilGeo, cyanGlowMat);
  leftEyePupil.position.set(-0.32, 0.05, 0.79);
  headGroup.add(leftEyePupil);

  rightEyePupil = new THREE.Mesh(pupilGeo, cyanGlowMat);
  rightEyePupil.position.set(0.32, 0.05, 0.79);
  headGroup.add(rightEyePupil);

  const frameRingsGeo = new THREE.TorusGeometry(0.28, 0.035, 16, 32);

  const leftFrame = new THREE.Mesh(frameRingsGeo, titaniumMat);
  leftFrame.position.set(-0.32, 0.05, 0.82);
  headGroup.add(leftFrame);

  const rightFrame = new THREE.Mesh(frameRingsGeo, titaniumMat);
  rightFrame.position.set(0.32, 0.05, 0.82);
  headGroup.add(rightFrame);

  const bridgeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.22, 12);
  bridgeGeo.rotateZ(Math.PI / 2);
  const bridgeMesh = new THREE.Mesh(bridgeGeo, titaniumMat);
  bridgeMesh.position.set(0, 0.05, 0.83);
  headGroup.add(bridgeMesh);

  const glassLensGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.02, 24);
  glassLensGeo.rotateX(Math.PI / 2);

  const leftGlassLens = new THREE.Mesh(glassLensGeo, glassLensMat);
  leftGlassLens.position.set(-0.32, 0.05, 0.82);
  headGroup.add(leftGlassLens);

  const rightGlassLens = new THREE.Mesh(glassLensGeo, glassLensMat);
  rightGlassLens.position.set(0.32, 0.05, 0.82);
  headGroup.add(rightGlassLens);

  const smileGeo = new THREE.TorusGeometry(0.1, 0.015, 8, 16, Math.PI * 0.6);
  const smileMesh = new THREE.Mesh(smileGeo, darkLensMat);
  smileMesh.position.set(0, -0.32, 0.78);
  smileMesh.rotation.x = 0.15;
  smileMesh.rotation.z = Math.PI;
  headGroup.add(smileMesh);

  robotGroup.add(headGroup);
  scene.add(robotGroup);

  window.addEventListener("resize", () => {
    if (!container) return;
    const newW = container.clientWidth;
    const newH = container.clientHeight;
    camera.aspect = newW / newH;
    camera.updateProjectionMatrix();
    renderer.setSize(newW, newH);
  });
}

let clock = new THREE.Clock();

function animate3DRobot() {
  requestAnimationFrame(animate3DRobot);

  const elapsedTime = clock.getElapsedTime();

  if (robotGroup) {
    robotGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.06;
  }

  if (camera && headGroup) {
    raycaster.setFromCamera({ x: pointer.ndcX, y: pointer.ndcY }, camera);
    raycaster.ray.intersectPlane(planeTarget, mouseWorldTarget);

    const targetYaw =
      Math.atan2(mouseWorldTarget.x, mouseWorldTarget.z + 1.2) * 0.85;
    const targetPitch =
      -Math.atan2(mouseWorldTarget.y - 0.2, mouseWorldTarget.z + 1.2) * 0.65;

    const clampedYaw = THREE.MathUtils.clamp(targetYaw, -0.85, 0.85);
    const clampedPitch = THREE.MathUtils.clamp(targetPitch, -0.55, 0.55);

    headGroup.rotation.y += (clampedYaw - headGroup.rotation.y) * 0.08;
    headGroup.rotation.x += (clampedPitch - headGroup.rotation.x) * 0.08;

    if (leftEyePupil && rightEyePupil) {
      const pupilShiftX = THREE.MathUtils.clamp(
        pointer.ndcX * 0.045,
        -0.04,
        0.04,
      );
      const pupilShiftY = THREE.MathUtils.clamp(
        pointer.ndcY * 0.045,
        -0.04,
        0.04,
      );

      leftEyePupil.position.x = -0.32 + pupilShiftX;
      leftEyePupil.position.y = 0.05 + pupilShiftY;

      rightEyePupil.position.x = 0.32 + pupilShiftX;
      rightEyePupil.position.y = 0.05 + pupilShiftY;
    }
  }
  renderer.render(scene, camera);
}

window.addEventListener("load", () => {
  init3DRobot();
  animate3DRobot();
});

const filterBtns = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => {
      b.classList.remove("bg-[var(--accent-blue)]", "text-white");
      b.classList.add("glass-sub", "text-[var(--text-muted)]");
    });
    btn.classList.add("bg-[var(--accent-blue)]", "text-white");
    btn.classList.remove("glass-sub", "text-[var(--text-muted)]");

    const filter = btn.getAttribute("data-filter");
    projectCards.forEach((card) => {
      if (
        filter === "all" ||
        card.getAttribute("data-category").includes(filter)
      ) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  });
});

const gfilterBtns = document.querySelectorAll(".gfilter-btn");
const galleryCards = document.querySelectorAll(".gallery-card");

gfilterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    gfilterBtns.forEach((b) => {
      b.classList.remove("bg-[var(--accent-blue)]", "text-white");
      b.classList.add("glass-sub", "text-[var(--text-muted)]");
    });
    btn.classList.add("bg-[var(--accent-blue)]", "text-white");
    btn.classList.remove("glass-sub", "text-[var(--text-muted)]");

    const gfilter = btn.getAttribute("data-gfilter");
    galleryCards.forEach((card) => {
      if (gfilter === "all" || card.getAttribute("data-gcat") === gfilter) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  });
});

function openLightbox(src, title, tag, behanceUrl) {
  document.getElementById("lightboxImg").src = src;
  document.getElementById("lightboxTitle").textContent = title;
  document.getElementById("lightboxTag").textContent = tag;
  const behanceBtn = document.getElementById("lightboxBehanceBtn");
  if (behanceUrl) {
    behanceBtn.href = behanceUrl;
    behanceBtn.style.display = "inline-flex";
  } else {
    behanceBtn.style.display = "none";
  }
  document.getElementById("lightboxModal").classList.remove("hidden");
}

function closeLightbox() {
  document.getElementById("lightboxModal").classList.add("hidden");
}

function openAbstractModal(title, text) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalContent").textContent = text;
  document.getElementById("abstractModal").classList.remove("hidden");
}

function closeAbstractModal() {
  document.getElementById("abstractModal").classList.add("hidden");
}
