const basePath = 'audio/';
const GITHUB_API = 'https://api.github.com/repos/jakobneukirchner/bsvg/contents/';

const destinationSelect  = document.getElementById('destination');
const specialSelect      = document.getElementById('special');
const gongSelect         = document.getElementById('gong');
const gongSpecialSelect  = document.getElementById('gong-special');
const viaContainer       = document.getElementById('via-container');
const btnAddVia          = document.getElementById('btn-add-via');
const btnDownload        = document.getElementById('btn-download');
const outputEl           = document.getElementById('output');

let haltestellen = [];
let lastAudioBuffers = [];

// ===== Hilfsfunktionen =====

function isAudio(name) {
  return /\.(mp3|wav|ogg|aac)$/i.test(name);
}

function toLabel(name) {
  return name
    .replace(/\.(mp3|wav|ogg|aac)$/i, '')
    .replace(/[+_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

// ===== Init =====

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
      .filter(f => f.type === 'file' && isAudio(f.name))
      .map(f => f.name)
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
      .filter(f => {
        if (f.type !== 'file' || !isAudio(f.name)) return false;
        const base = f.name.replace(/\.(mp3|wav|ogg|aac)$/i, '').toLowerCase();
        return !AUSSCHLIESSEN.includes(base);
      })
      .map(f => f.name)
      .sort((a, b) => toLabel(a).localeCompare(toLabel(b), 'de'));
    // Immer sichtbar, (keine) als erste Option
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
      .filter(f => f.type === 'file' && isAudio(f.name))
      .map(f => f.name)
      .sort((a, b) => toLabel(a).localeCompare(toLabel(b), 'de'));

    const emptyOpt = gongs.length > 0 ? '(kein Gong)' : '(kein Gong verf\u00fcgbar)';

    // Beide Gong-Selects befüllen
    [gongSelect, gongSpecialSelect].forEach(sel => {
      sel.innerHTML = `<option value="">${emptyOpt}</option>`;
      gongs.forEach(name => sel.add(new Option(toLabel(name), name)));
    });
  } catch (e) {
    [gongSelect, gongSpecialSelect].forEach(sel => {
      sel.innerHTML = '<option value="">(kein Gong verf\u00fcgbar)</option>';
    });
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
  const gongSpecial = gongSpecialSelect.value;
  const line        = document.getElementById('line').value;
  const destination = destinationSelect.value;
  const viaList     = getViaValues();
  const special     = specialSelect.value;

  // Gong vor Hauptansage
  if (gong) files.push(`${basePath}Gongs/${gong}`);

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
    files.push(`${basePath}Ziele/${destination}`);
  }

  // Via: über A [, B] und C
  if (viaList.length === 1) {
    files.push(`${basePath}Fragmente/ueber.mp3`);
    files.push(`${basePath}Ziele/${viaList[0]}`);
  } else if (viaList.length > 1) {
    for (let i = 0; i < viaList.length - 1; i++) {
      files.push(`${basePath}Fragmente/ueber.mp3`);
      files.push(`${basePath}Ziele/${viaList[i]}`);
    }
    files.push(`${basePath}Fragmente/und.mp3`);
    files.push(`${basePath}Ziele/${viaList[viaList.length - 1]}`);
  }

  // Gong vor Sonderansage + Sonderansage
  if (special) {
    if (gongSpecial) files.push(`${basePath}Gongs/${gongSpecial}`);
    files.push(`${basePath}Hinweise/${special}`);
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

// ===== Download =====

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
  const numCh = buffer.numberOfChannels;
  const sr    = buffer.sampleRate;
  const len   = buffer.length;
  const bPS   = 16;
  const bAlign = numCh * (bPS / 8);
  const bRate  = sr * bAlign;
  const dSize  = len * bAlign;
  const wavBuf = new ArrayBuffer(44 + dSize);
  const view   = new DataView(wavBuf);
  function ws(o, s) { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); }
  ws(0,'RIFF'); view.setUint32(4, 36+dSize, true); ws(8,'WAVE'); ws(12,'fmt ');
  view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,numCh,true);
  view.setUint32(24,sr,true); view.setUint32(28,bRate,true); view.setUint16(32,bAlign,true);
  view.setUint16(34,bPS,true); ws(36,'data'); view.setUint32(40,dSize,true);
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
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
  const special     = specialSelect.value;
  const gongSpecial = gongSpecialSelect.value;
  if (!special) { alert('Bitte eine Sonderansage wählen'); return; }
  const files = [];
  if (gongSpecial) files.push(`${basePath}Gongs/${gongSpecial}`);
  files.push(`${basePath}Hinweise/${special}`);
  preloadAndPlay(files);
}

function playQuick(src) {
  preloadAndPlay([src]);
}
