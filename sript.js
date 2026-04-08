const basePath = 'audio/';
const GITHUB_API = 'https://api.github.com/repos/jakobneukirchner/bsvg/contents/';

const destinationSelect = document.getElementById('destination');
const specialSelect     = document.getElementById('special');
const enableSpecial     = document.getElementById('enableSpecial');
const viaContainer      = document.getElementById('via-container');
const btnAddVia         = document.getElementById('btn-add-via');

let haltestellen = [];

function toLabel(name) {
  return name
    .replace(/\.mp3$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

enableSpecial.addEventListener('change', () => {
  specialSelect.disabled = !enableSpecial.checked;
});

window.onload = async () => {
  btnAddVia.addEventListener('click', addViaRow);
  await Promise.all([loadHaltestellen(), loadSonderansagen()]);
};

async function loadHaltestellen() {
  try {
    const res = await fetch(GITHUB_API + 'audio/Ziele');
    const files = await res.json();
    haltestellen = files
      .filter(f => f.type === 'file' && f.name.toLowerCase().endsWith('.mp3'))
      .map(f => f.name.replace(/\.mp3$/i, ''))
      .sort((a, b) => toLabel(a).localeCompare(toLabel(b), 'de'));

    destinationSelect.innerHTML = '<option value="">(keine)</option>';
    haltestellen.forEach(name => {
      destinationSelect.add(new Option(toLabel(name), name));
    });
  } catch (e) {
    console.error('Fehler beim Laden der Haltestellen:', e);
  }
}

async function loadSonderansagen() {
  const SCHNELLANSAGEN = ['einsteigen', 'zurueckbleiben', 'abfahrt'];
  try {
    const res = await fetch(GITHUB_API + 'audio/Hinweise');
    const files = await res.json();
    const sonder = files
      .filter(f =>
        f.type === 'file' &&
        f.name.toLowerCase().endsWith('.mp3') &&
        !SCHNELLANSAGEN.includes(f.name.replace(/\.mp3$/i, '').toLowerCase())
      )
      .map(f => f.name.replace(/\.mp3$/i, ''))
      .sort((a, b) => toLabel(a).localeCompare(toLabel(b), 'de'));

    specialSelect.innerHTML = '<option value="">(keine)</option>';
    sonder.forEach(name => {
      specialSelect.add(new Option(toLabel(name), name));
    });
  } catch (e) {
    console.error('Fehler beim Laden der Sonderansagen:', e);
  }
}

// ===== Via-Haltestellen =====

function buildViaSelect() {
  const sel = document.createElement('select');
  sel.className = 'form-select via-select';
  sel.add(new Option('(keine)', ''));
  haltestellen.forEach(name => sel.add(new Option(toLabel(name), name)));
  return sel;
}

function addViaRow() {
  const row = document.createElement('div');
  row.className = 'via-row';

  const wrapper = document.createElement('div');
  wrapper.className = 'select-wrapper via-select-wrapper';

  const sel = buildViaSelect();
  const arrow = document.createElement('span');
  arrow.className = 'material-icons select-arrow';
  arrow.textContent = 'expand_more';

  wrapper.appendChild(sel);
  wrapper.appendChild(arrow);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn-remove-via';
  removeBtn.innerHTML = '<span class="material-icons">close</span>';
  removeBtn.addEventListener('click', () => row.remove());

  row.appendChild(wrapper);
  row.appendChild(removeBtn);
  viaContainer.appendChild(row);
}

function getViaValues() {
  return Array.from(viaContainer.querySelectorAll('.via-select'))
    .map(s => s.value)
    .filter(v => v !== '');
}

// ===== Audio: Preload & Sequenz =====

function preloadAndPlay(files) {
  if (files.length === 0) return;

  const outputEl = document.getElementById('output');
  outputEl.textContent = 'Lade Ansage ...';

  const audios = files.map(src => {
    const a = new Audio();
    a.preload = 'auto';
    a.src = src;
    return a;
  });

  let loaded = 0;
  function onReady() {
    loaded++;
    if (loaded >= audios.length) {
      outputEl.textContent = 'Wiedergabe ...';
      playSequence(audios, () => { outputEl.textContent = ''; });
    }
  }

  audios.forEach(a => {
    if (a.readyState >= 3) {
      onReady();
    } else {
      a.addEventListener('canplaythrough', onReady, { once: true });
      a.addEventListener('error', onReady, { once: true });
    }
  });
}

function playSequence(audios, onDone) {
  let index = 0;
  function next() {
    if (index >= audios.length) { if (onDone) onDone(); return; }
    const a = audios[index];
    a.currentTime = 0;
    a.play().catch(() => {});
    a.addEventListener('ended', () => { index++; next(); }, { once: true });
  }
  next();
}

// ===== Ansage aufbauen =====

function generateAndPlay() {
  const files = [];

  const line        = document.getElementById('line').value;
  const destination = destinationSelect.value;
  const viaList     = getViaValues();
  const special     = specialSelect.value;

  // Linie oder "Zug"
  if (line) {
    files.push(`${basePath}Fragmente/linie.mp3`);
    files.push(`${basePath}Nummern/line_number_end/${line}.mp3`);
  } else {
    files.push(`${basePath}Fragmente/zug.mp3`);
  }

  // Ziel
  if (destination) {
    files.push(`${basePath}Fragmente/nach.mp3`);
    files.push(`${basePath}Ziele/${destination}.mp3`);
  }

  // Via: vor jeder Station "ueber.mp3" wiederholen
  // Ergebnis: "... ueber StationA ueber StationB ueber StationC"
  viaList.forEach(via => {
    files.push(`${basePath}Fragmente/ueber.mp3`);
    files.push(`${basePath}Ziele/${via}.mp3`);
  });

  // Sonderansage
  if (enableSpecial.checked && special) {
    files.push(`${basePath}Hinweise/${special}.mp3`);
  }

  preloadAndPlay(files);
}

function playSpecialOnly() {
  const special = specialSelect.value;
  if (!special) {
    alert('Bitte eine Sonderansage wählen');
    return;
  }
  preloadAndPlay([`${basePath}Hinweise/${special}.mp3`]);
}

function playQuick(src) {
  preloadAndPlay([src]);
}
