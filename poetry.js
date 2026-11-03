const poemCard = document.querySelector('.poem-card');
const poemLoading = document.getElementById('poemLoading');
const poemContent = document.getElementById('poemContent');
const poemTitle = document.getElementById('poemTitle');
const poemDate = document.getElementById('poemDate');
const poemText = document.getElementById('poemText');
const poemForm = document.getElementById('poemForm');
const poemEditorStatus = document.getElementById('poemEditorStatus');
let poems = null;

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isPoemList(value) {
  return Array.isArray(value) && value.every(poem =>
    poem !== null &&
    typeof poem === 'object' &&
    typeof poem.title === 'string' &&
    poem.title.trim().length > 0 &&
    typeof poem.date === 'string' &&
    isValidDate(poem.date) &&
    typeof poem.body === 'string' &&
    poem.body.trim().length > 0
  );
}

function getDailyPoem(poems) {
  if (poems.length === 0) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);
  let hash = 2166136261;
  for (const character of today) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }

  return poems[(hash >>> 0) % poems.length];
}

function showPoem(poem) {
  poemLoading.hidden = true;
  poemContent.hidden = false;
  poemTitle.textContent = poem.title;
  poemDate.dateTime = poem.date;
  poemDate.textContent = new Date(`${poem.date}T00:00:00Z`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
  poemText.textContent = poem.body;
}

fetch(new URL('poems.json', document.baseURI), { cache: 'no-cache' })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Poem data request failed with status ${response.status}.`);
    }
    return response.json();
  })
  .then(loadedPoems => {
    if (!isPoemList(loadedPoems)) {
      throw new Error('Poem data must be an array of poems with title, date, and body fields.');
    }

    poems = loadedPoems;
    const poem = getDailyPoem(poems);
    poemLoading.textContent = poem
      ? 'Loading poem…'
      : 'No poems have been published yet.';
    if (poem) {
      showPoem(poem);
    }
    poemCard.setAttribute('aria-busy', 'false');
  })
  .catch(error => {
    poemLoading.textContent = 'Poems could not be loaded. Please try again later.';
    poemCard.setAttribute('aria-busy', 'false');
    poemEditorStatus.textContent = 'Poem data could not be loaded, so a new poems file cannot be created.';
    console.error('Unable to load poems.', error);
  });

poemForm.addEventListener('submit', event => {
  event.preventDefault();

  if (poems === null) {
    poemEditorStatus.textContent = 'Wait for the poem data to load before adding a poem.';
    return;
  }

  const formData = new FormData(poemForm);
  const title = String(formData.get('title')).trim();
  const date = String(formData.get('date'));
  const body = String(formData.get('body'));
  if (!title || !date || !body.trim()) {
    poemEditorStatus.textContent = 'Enter a title, creation date, and poem before downloading.';
    return;
  }

  poems.push({ title, date, body });

  const file = new Blob([`${JSON.stringify(poems, null, 2)}\n`], {
    type: 'application/json'
  });
  const downloadUrl = URL.createObjectURL(file);
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = 'poems.json';
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

  poemForm.reset();
  poemEditorStatus.textContent = 'Downloaded poems.json. Replace the website file and publish to share your poem.';
});
