const previousLogoKey = 'gentfossly-previous-logo';
const logo = document.querySelector('.site-logo');

if (logo) {
  fetch(new URL('logos.json', document.baseURI), { cache: 'no-cache' })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Logo manifest request failed with status ${response.status}.`);
      }
      return response.json();
    })
    .then(logos => {
      if (!Array.isArray(logos) || logos.length === 0 ||
          logos.some(path => typeof path !== 'string')) {
        throw new Error('Logo manifest must be a non-empty array of image paths.');
      }

      const previousLogo = sessionStorage.getItem(previousLogoKey);
      const candidates = logos.length > 1
        ? logos.filter(path => path !== previousLogo)
        : logos;
      const selectedLogo = candidates[Math.floor(Math.random() * candidates.length)];

      logo.addEventListener('load', () => {
        logo.hidden = false;
        requestAnimationFrame(() => logo.classList.add('is-visible'));
      }, { once: true });
      logo.addEventListener('error', () => {
        console.error(`Unable to load site logo: ${selectedLogo}`);
      }, { once: true });
      logo.src = selectedLogo;
      sessionStorage.setItem(previousLogoKey, selectedLogo);
    })
    .catch(error => {
      console.error('Unable to load a site logo.', error);
    });

  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-page-transition], a[data-cube-return]');
    if (link && !event.defaultPrevented && event.button === 0 &&
        !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      logo.classList.remove('is-visible');
    }
  });
}
