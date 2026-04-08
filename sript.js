const basePath = 'audio/';

const destinationSelect = document.getElementById('destination');
const specialSelect     = document.getElementById('special');
const enableSpecial     = document.getElementById('enableSpecial');
const viaContainer      = document.getElementById('via-container');
const btnAddVia         = document.getElementById('btn-add-via');

let haltestellen = [];

// Hilfsfunktion: Dateiname -> lesbarer Titel
// z.B. "fahrt_auf_sicht" -> "Fahrt auf Sicht"
function toLabel(filename) {
  return filename
    .replace(/\.mp3$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

enableSpecial.addEventListener('change', () => {
  specialSelect.disabled = !enableSpecial.checked;
});

window.onload = () => {
  loadHaltestellen();
  loadSonderansagen();
  btnAddVia.addEventListener('click', addViaRow);
};

function loadHaltestellen() {
  // ✏️ Dateinamen (ohne .mp3) aus /audio/Ziele eintragen
  haltestellen = ["heidberg", "hauptbahnhof", "broitzem"];

  haltestellen.forEach(name => {
    destinationSelect.add(new Option(toLabel(name), name));
  });
}

function loadSonderansagen() {
  // ✏️ Dateinamen (ohne .mp3) aus /audio/Hinweise eintragen
  const sonderansagen = ["fahrt_auf_sicht", "wagen_defekt"];
  sonderansagen.forEach(name => {
    specialSelect.add(new Option(toLabel(name), name));
  });
}

// ===== Via-Haltestellen (dynamisch, mehrere) =====

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

/**
 * Lädt alle Audiodateien in den Speicher und spielt sie
 * danach der Reihe nach ab (flüssig, kein Nachladen).
 */
function preloadAndPlay(files) {
  if (files.length === 0) return;

  const outputEl = document.getElementById('output');
  outputEl.textContent = 'Lade Ansage ...';

  // Alle Dateien als Audio-Objekte vorladen
  const audios = files.map(src => {
    const a = new Audio();
    a.preload = 'auto';
    a.src = src;
    return a;
  });

  // Warten bis alle canplaythrough-Events gefeuert haben
  let loaded = 0;
  const total = audios.length;

  function onReady() {
    loaded++;
    if (loaded >= total) {
      outputEl.textContent = 'Wiedergabe ...';
      playSequence(audios, () => {
        outputEl.textContent = '';
      });
    }
  }

  audios.forEach(a => {
    if (a.readyState >= 3) {
      onReady();
    } else {
      a.addEventListener('canplaythrough', onReady, { once: true });
      // Fallback: nach 3 Sekunden trotzdem starten
      a.addEventListener('error', onReady, { once: true });
    }
  });
}

function playSequence(audios, onDone) {
  let index = 0;

  function next() {
    if (index >= audios.length) {
      if (onDone) onDone();
      return;
    }
    const a = audios[index];
    a.currentTime = 0;
    a.play().catch(() => {});
    a.addEventListener('ended', () => {
      index++;
      next();
    }, { once: true });
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

  // Via-Haltestellen mit "und" vor der letzten
  if (viaList.length > 0) {
    files.push(`${basePath}Fragmente/ueber.mp3`);
    viaList.forEach((via, i) => {
      files.push(`${basePath}Ziele/${via}.mp3`);
      // "und" zwischen vorletzter und letzter Station
      if (i < viaList.length - 1) {
        files.push(`${basePath}Fragmente/und.mp3`);
      }
    });
  }

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
