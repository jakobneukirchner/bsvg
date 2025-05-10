const basePath = 'audio/';

const destinationSelect = document.getElementById('destination');
const viaSelect = document.getElementById('via');
const specialSelect = document.getElementById('special');
const enableSpecial = document.getElementById('enableSpecial');
const lineInput = document.getElementById('line');

enableSpecial.addEventListener('change', () => {
  specialSelect.disabled = !enableSpecial.checked;
});

window.onload = () => {
  loadHaltestellen();
  loadSonderansagen();
};

function loadHaltestellen() {
  const haltestellen = ["heidberg", "hauptbahnhof", "broitzem"]; // Hier kannst du eigene einfügen
  haltestellen.forEach(name => {
    const option1 = new Option(name, name);
    const option2 = new Option(name, name);
    destinationSelect.add(option1);
    viaSelect.add(option2);
  });
}

function loadSonderansagen() {
  const sonderansagen = ["fahrt_auf_sicht.mp3", "wagen_defekt.mp3"]; // Hier kannst du eigene einfügen
  sonderansagen.forEach(name => {
    const option = new Option(name, name);
    specialSelect.add(option);
  });
}

function playAudioSequence(files) {
  let index = 0;
  const audio = new Audio(files[index]);
  audio.play();

  audio.addEventListener('ended', () => {
    index++;
    if (index < files.length) {
      audio.src = files[index];
      audio.play();
    }
  });
}

function generateAnnouncement() {
  const files = [];
  const line = lineInput.value.trim();
  const destination = destinationSelect.value;
  const via = viaSelect.value;
  const special = specialSelect.value;

  // Liniennummer
  if (line) {
    files.push(`${basePath}Fragmente/linie.mp3`);
    files.push(`${basePath}Nummern/line_number_end/${line}.mp3`);
  } else {
    files.push(`${basePath}Fragmente/zug.mp3`);
  }

  // Ziel + optional Via
  if (destination) {
    files.push(`${basePath}Fragmente/nach.mp3`);
    files.push(`${basePath}Ziele/${destination}.mp3`);
    if (via) {
      files.push(`${basePath}Fragmente/ueber.mp3`);
      files.push(`${basePath}Ziele/${via}.mp3`);
    }
  }

  // Sonderansage
  if (enableSpecial.checked && special) {
    files.push(`${basePath}Hinweise/${special}`);
  }

  playAudioSequence(files);
}

function playSpecialOnly() {
  const special = specialSelect.value;
  if (!special) {
    alert("Bitte eine Sonderansage auswählen.");
    return;
  }
  playAudioSequence([`${basePath}Hinweise/${special}`]);
}
