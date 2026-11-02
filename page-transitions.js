const transitionKey = 'gentfossly-transition';
const transitionMode = sessionStorage.getItem(transitionKey);
sessionStorage.removeItem(transitionKey);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const whiteFaceDuration = reduceMotion ? 1 : 100;
const cubeScaleDuration = reduceMotion ? 1 : 1300;
const returnDuration = reduceMotion ? 1 : 500;

function navigateWithTransition(link, mode) {
  if (mode === 'enter') {
    const cube = document.getElementById('siteCube');
    const scene = document.getElementById('cubeScene');

    if (cube && scene) {
      sessionStorage.setItem(
        'gentfossly-cube-rotation',
        `${cube.dataset.rotationX || -12},${cube.dataset.rotationY || 16}`
      );
      cube.classList.add('is-transforming');
      sessionStorage.setItem(transitionKey, 'enter');

      window.setTimeout(() => {
        scene.classList.add('is-shrinking');
      }, whiteFaceDuration);
      window.setTimeout(() => {
        window.location.assign(link.href);
      }, whiteFaceDuration + cubeScaleDuration);
    } else {
      sessionStorage.setItem(transitionKey, 'enter');
      window.location.assign(link.href);
    }
    return;
  }

  sessionStorage.setItem(transitionKey, 'return');
  document.body.classList.add('is-leaving');
  window.setTimeout(() => window.location.assign(link.href), reduceMotion ? 1 : 250);
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-page-transition], a[data-cube-return]');
  if (!link || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();
  navigateWithTransition(link, link.hasAttribute('data-cube-return') ? 'return' : 'enter');
});

if (transitionMode === 'enter') {
  document.documentElement.classList.add('is-entering');
  window.setTimeout(() => {
    document.documentElement.classList.remove('is-entering');
  }, 900);
}

if (transitionMode === 'return') {
  document.getElementById('siteCube')?.classList.add('is-reforming');
  window.setTimeout(() => {
    document.getElementById('siteCube')?.classList.remove('is-reforming');
    document.documentElement.classList.remove('is-returning');
  }, returnDuration);
}
