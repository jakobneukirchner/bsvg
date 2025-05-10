// Basis-Pfad zu den Audiodateien (im Repository unter /audio/)
const BASE_PATH = 'audio';

// Dummy-Daten für Ziele und Hinweise (ersetze durch dynamisches Laden, wenn du die Dateien im Repo hast)
const haltestellen = [
  "hauptbahnhof", "stadtpark", "museum", "bahnhof", "markt", "uni"
];
const sonderdateien = [
  "maskenpflicht.mp3", "baustelle.mp3", "verspaetung.mp3"
];

// Dropdowns befüllen
window.onload = function() {
  const dest = document.getElementById('combo_destination');
  const via = document.getElementById('combo_via');
  haltestellen.forEach(h => {
    let opt1 = document.createElement('option');
    opt1.value = h;
    opt1.text = h.charAt(0).toUpperCase() + h.slice(1);
    dest.add(opt1.cloneNode(true));
    via.add(opt1);
  });

  const special = document.getElementById('combo_special');
  sonderdateien.forEach(f => {
    let opt = document.createElement('option');
    opt.value = f;
    opt.text = f.replace('.mp3','');
    special.add(opt);
  });
};

function getAudioPath(category, filename) {
  return `${BASE_PATH}/${category}/${filename}`;
}

function playAudioSequence(filepaths, index = 0) {
  if (index >= filepaths.length) return;
  const audio = document.getElementById('audioPlayer');
  audio.src = filepaths[index];
  audio.play();
  audio.onended = function() {
    // 0.5s Pause vor Sonderansage
    if (
      index + 1 < filepaths.length &&
      filepaths[index + 1].includes("Hinweise")
    ) {
      setTimeout(() => playAudioSequence(filepaths, index + 1), 500);
    } else {
      playAudioSequence(filepaths, index + 1);
    }
  };
  audio.onerror = function() {
    document.getElementById('output').textContent = "Fehler: " + filepaths[index] + " nicht gefunden!";
    playAudioSequence(filepaths, index + 1);
  };
}

function generateAndPlay() {
  const line = document.getElementById('combo_line').value;
  const destination = document.getElementById('combo_destination').value;
  const via = document.getElementById('combo_via').value;
  const isSpecial = document.getElementById('check_special').checked;
  const selectedSpecial = document.getElementById('combo_special').value;

  let files = [];

  if (line) {
    files.push(getAudioPath("Fragmente", "linie.mp3"));
    files.push(getAudioPath("Nummern/line_number_end", `${line}.mp3`));
  } else {
    files.push(getAudioPath("Fragmente", "zug.mp3"));
  }

  if (destination) {
    files.push(getAudioPath("Fragmente", "nach.mp3"));
    files.push(getAudioPath("Ziele", `${destination}.mp3`));
  }

  if (via) {
    files.push(getAudioPath("Fragmente", "ueber.mp3"));
    files.push(getAudioPath("Ziele", `${via}.mp3`));
  }

  if (isSpecial && selectedSpecial) {
    files.push(getAudioPath("Hinweise", selectedSpecial));
  }

  if (files.length === 0) {
    document.getElementById('output').textContent = "Bitte mindestens Linie oder Ziel auswählen!";
    return;
  }

  document.getElementById('output').textContent = "Spiele Ansage ab...";
  playAudioSequence(files);
}

function playSpecialOnly() {
  const selectedSpecial = document.getElementById('combo_special').value;
  if (!selectedSpecial) {
    document.getElementById('output').textContent = "Bitte eine Sonderansage auswählen!";
    return;
  }
  const filepath = getAudioPath("Hinweise", selectedSpecial);
  document.getElementById('output').textContent = "Spiele Sonderansage ab...";
  playAudioSequence([filepath]);
}

