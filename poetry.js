const poemCard = document.querySelector('.poem-card');
const poemLoading = document.getElementById('poemLoading');
const poemContent = document.getElementById('poemContent');
const poemTitle = document.getElementById('poemTitle');
const poemDate = document.getElementById('poemDate');
const poemText = document.getElementById('poemText');

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

fetch(new URL('poetry.json', document.baseURI), { cache: 'no-cache' })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Poetry data request failed with status ${response.status}.`);
    }
    return response.json();
  })
  .then(loadedPoems => {
    if (!isPoemList(loadedPoems)) {
      throw new Error('Poetry data must be an array of poems with title, date, and body fields.');
    }

    const poem = getDailyPoem(loadedPoems);
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
    console.error('Unable to load poems.', error);
  });
