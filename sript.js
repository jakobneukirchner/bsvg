const basePath = 'audio/';
const GITHUB_API = 'https://api.github.com/repos/jakobneukirchner/bsvg/contents/';

const destinationSelect = document.getElementById('destination');
const specialSelect     = document.getElementById('special');
const gongSelect        = document.getElementById('gong');
const enableSpecial     = document.getElementById('enableSpecial');
const viaContainer      = document.getElementById('via-container');
const btnAddVia         = document.getElementById('btn-add-via');
const btnDownload       = document.getElementById('btn-download');
const outputEl          = document.getElementById('output');

let haltestellen = [];
let lastAudioBuffers = [];
let lastFiles = [];

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
  await Promise.all([loadHaltestellen(), loadSonderansagen(), loadGongs()]);
};

// ===== Daten laden per GitHub API =====

async function loadHaltestellen() {
  try {
    const res = await fetch(GITHUB_API + 'audio/Ziele');
    const files = await res.json();
    haltestellen = files
      .filter(f => f.type === 'file' && f.name.toLowerCase().endsWith('.mp3'))
      .map(f => f.name.replace(/\.mp3$/i, ''))
      .sort((a, b) => toLabel(a).localeCompare(toLabel(b), 'de'));
    destinationSelect.innerHTML = '<option value="">(keine)</option>';
    haltestellen.forEach(name =>
      destinationSelect.add(new Option(toLabel(name), name))
    );
  } catch (e) { console.error('Haltestellen:', e); }
}

async function loadSonderansagen() {
  const AUSSCHLIESSEN = ['einsteigen', 'zurueckbleiben', 'abfahrt'];
  try {
    const res = await fetch(GITHUB_API + 'audio/Hinweise');
    const files = await res.json();
    const sonder = files
      .filter(f =>
        f.type === 'file' &&
        f.name.toLowerCase().endsWith('.mp3') &&
        !AUSSCHLIESSEN.includes(f.name.replace(/\.mp3$/i, '').toLowerCase())
      )
      .map(f => f.name.replace(/\.mp3$/i, ''))
      .sort((a, b) => toLabel(a).localeCompare(toLabel(b), 'de'));
    specialSelect.innerHTML = '<option value="">(keine)</option>';
    sonder.forEach(name =>
      specialSelect.add(new Option(toLabel(name), name))
    );
  } catch (e) { console.error('Sonderansagen:', e); }
}

async function loadGongs() {
  try {
    const res = await fetch(GITHUB_API + 'audio/Gongs');
    const files = await res.json();
    const gongs = files
      .filter(f => f.type === 'file' && f.name.toLowerCase().endsWith('.mp3'))
      .map(f => f.name.replace(/\.mp3$/i, ''))
      .sort((a, b) => toLabel(a).localeCompare(toLabel(b), 'de'));
    if (gongs.length > 0) {
      gongSelect.innerHTML = '<option value="">(kein Gong)</option>';
      gongs.forEach(name =>
        gongSelect.add(new Option(toLabel(name), name))
      );
    } else {
      gongSelect.innerHTML = '<option value="">(kein Gong verfügbar)</option>';
    }
  } catch (e) {
    console.error('Gongs:', e);
    gongSelect.innerHTML = '<option value="">(kein Gong verfügbar)</option>';
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

// ===== Ansage-Dateiliste aufbauen =====

function buildFileList() {
  const files = [];
  const gong        = gongSelect.value;
  const line        = document.getElementById('line').value;
  const destination = destinationSelect.value;
  const viaList     = getViaValues();
  const special     = specialSelect.value;

  // Gong voranstellen (aus audio/Gongs/)
  if (gong) files.push(`${basePath}Gongs/${gong}.mp3`);

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

  // Via: über A, B und C
  if (viaList.length === 1) {
    files.push(`${basePath}Fragmente/ueber.mp3`);
    files.push(`${basePath}Ziele/${viaList[0]}.mp3`);
  } else if (viaList.length > 1) {
    for (let i = 0; i < viaList.length - 1; i++) {
      files.push(`${basePath}Fragmente/ueber.mp3`);
      files.push(`${basePath}Ziele/${viaList[i]}.mp3`);
    }
    // "und" vor letzter Station (wird übersprungen falls Datei fehlt)
    files.push(`${basePath}Fragmente/und.mp3`);
    files.push(`${basePath}Ziele/${viaList[viaList.length - 1]}.mp3`);
  }

  // Sonderansage
  if (enableSpecial.checked && special) {
    files.push(`${basePath}Hinweise/${special}.mp3`);
  }

  return files;
}

// ===== Audio: Vollständiges Preload per fetch + AudioContext =====

async function fetchAllBuffers(files, audioCtx) {
  return Promise.all(
    files.map(async src => {
      try {
        const res = await fetch(src);
        const arrayBuf = await res.arrayBuffer();
        return await audioCtx.decodeAudioData(arrayBuf);
      } catch (e) {
        console.warn('Datei nicht ladbar, übersprungen:', src, e);
        return null;
      }
    })
  );
}

async function preloadAndPlay(files) {
  if (files.length === 0) return;
  outputEl.textContent = 'Lade Ansage ...';
  btnDownload.disabled = true;

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const buffers = await fetchAllBuffers(files, audioCtx);
  const valid = buffers.filter(b => b !== null);

  if (valid.length === 0) {
    outputEl.textContent = 'Fehler: Keine Audiodateien geladen.';
    return;
  }

  lastAudioBuffers = valid;
  lastFiles = files;
  btnDownload.disabled = false;

  outputEl.textContent = 'Wiedergabe ...';
  playBufferSequence(audioCtx, valid, () => {
    outputEl.textContent = '';
  });
}

function playBufferSequence(audioCtx, buffers, onDone) {
  let offset = audioCtx.currentTime;
  buffers.forEach(buf => {
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.start(offset);
    offset += buf.duration;
  });
  setTimeout(onDone, (offset - audioCtx.currentTime) * 1000);
}

// ===== Download: Buffers zu WAV zusammenfügen =====

function downloadAnsage() {
  if (lastAudioBuffers.length === 0) return;

  const sampleRate = lastAudioBuffers[0].sampleRate;
  const channels   = lastAudioBuffers[0].numberOfChannels;
  const totalLen   = lastAudioBuffers.reduce((s, b) => s + b.length, 0);

  const offlineCtx = new OfflineAudioContext(channels, totalLen, sampleRate);
  let offset = 0;
  lastAudioBuffers.forEach(buf => {
    const src = offlineCtx.createBufferSource();
    src.buffer = buf;
    src.connect(offlineCtx.destination);
    src.start(offset);
    offset += buf.duration;
  });

  offlineCtx.startRendering().then(rendered => {
    const wav = audioBufferToWav(rendered);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ansage.wav';
    a.click();
    URL.revokeObjectURL(url);
  });
}

function audioBufferToWav(buffer) {
  const numCh  = buffer.numberOfChannels;
  const sr     = buffer.sampleRate;
  const len    = buffer.length;
  const bitsPS = 16;
  const blockAlign = numCh * (bitsPS / 8);
  const byteRate   = sr * blockAlign;
  const dataSize   = len * blockAlign;
  const wavBuf     = new ArrayBuffer(44 + dataSize);
  const view       = new DataView(wavBuf);

  function writeStr(off, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  }
  writeStr(0, 'RIFF');
  view.setUint32(4,  36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1,  true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sr,  true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPS, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(off, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      off += 2;
    }
  }
  return wavBuf;
}

// ===== Öffentliche Funktionen =====

function generateAndPlay() {
  preloadAndPlay(buildFileList());
}

function playSpecialOnly() {
  const special = specialSelect.value;
  if (!special) { alert('Bitte eine Sonderansage wählen'); return; }
  preloadAndPlay([`${basePath}Hinweise/${special}.mp3`]);
}

function playQuick(src) {
  preloadAndPlay([src]);
}
