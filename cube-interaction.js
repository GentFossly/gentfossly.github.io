const cubeScene = document.getElementById('cubeScene');
const siteCube = document.getElementById('siteCube');
const reduceCubeMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const savedRotation = sessionStorage.getItem('gentfossly-cube-rotation');
const isReturningToCube = document.documentElement.classList.contains('is-returning');

let rotationX = -18;
let rotationY = -18;
let pointerStartX = 0;
let pointerStartY = 0;
let previousPointerX = 0;
let previousPointerY = 0;
let activePointerId = null;
let hasDragged = false;
let suppressNextClick = false;
let draggedPointerX = 0;
let draggedPointerY = 0;
let clickSuppressionTimeout = 0;

if (savedRotation) {
  const [savedX, savedY] = savedRotation.split(',').map(Number);
  if (Number.isFinite(savedX) && Number.isFinite(savedY)) {
    rotationX = savedX;
    rotationY = savedY;
  }
}

function setCubeRotation() {
  siteCube.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
  siteCube.dataset.rotationX = String(rotationX);
  siteCube.dataset.rotationY = String(rotationY);
  sessionStorage.setItem('gentfossly-cube-rotation', `${rotationX},${rotationY}`);
}

if (!isReturningToCube && !savedRotation) {
  if (reduceCubeMotion.matches) {
    rotationX = -12;
    rotationY = 16;
    setCubeRotation();
  } else {
    requestAnimationFrame(() => {
      siteCube.style.transition = 'transform 3.2s cubic-bezier(0.18, 0.72, 0.22, 1)';
      rotationX = -12;
      rotationY = 16;
      setCubeRotation();
    });
  }
} else {
  setCubeRotation();
}

siteCube.addEventListener('transitionend', (event) => {
  if (event.propertyName === 'transform') {
    siteCube.style.transition = '';
  }
});

document.addEventListener('pointerdown', (event) => {
  if (activePointerId !== null || !event.isPrimary ||
      (event.pointerType === 'mouse' && event.button !== 0) ||
      event.target.closest('button, input, video, [data-cube-return]')) {
    return;
  }

  activePointerId = event.pointerId;
  pointerStartX = previousPointerX = event.clientX;
  pointerStartY = previousPointerY = event.clientY;
  hasDragged = false;
});

window.addEventListener('pointermove', (event) => {
  if (event.pointerId !== activePointerId) {
    return;
  }

  const totalMovement = Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY);
  if (!hasDragged && totalMovement < 4) {
    return;
  }

  if (!hasDragged) {
    hasDragged = true;
    suppressNextClick = true;
    window.clearTimeout(clickSuppressionTimeout);
    siteCube.style.transition = 'none';
  }

  rotationY += (event.clientX - previousPointerX) * 0.55;
  rotationX -= (event.clientY - previousPointerY) * 0.55;
  previousPointerX = event.clientX;
  previousPointerY = event.clientY;
  setCubeRotation();
});

function endCubePointer(event) {
  if (event.pointerId !== activePointerId) {
    return;
  }

  if (event.type === 'pointerup' && hasDragged) {
    rotationY += (event.clientX - previousPointerX) * 0.55;
    rotationX -= (event.clientY - previousPointerY) * 0.55;
    setCubeRotation();
  }

  activePointerId = null;
  if (hasDragged) {
    draggedPointerX = event.clientX;
    draggedPointerY = event.clientY;
    clickSuppressionTimeout = window.setTimeout(() => {
      suppressNextClick = false;
    }, 150);
  } else {
    suppressNextClick = false;
  }
  hasDragged = false;
  siteCube.style.transition = '';
}

window.addEventListener('pointerup', endCubePointer);
window.addEventListener('pointercancel', endCubePointer);
cubeScene.addEventListener('click', (event) => {
  const isDragClick = suppressNextClick &&
    event.detail > 0 &&
    Math.hypot(event.clientX - draggedPointerX, event.clientY - draggedPointerY) < 12;

  if (isDragClick) {
    event.preventDefault();
    event.stopPropagation();
    suppressNextClick = false;
    window.clearTimeout(clickSuppressionTimeout);
  }
}, true);
