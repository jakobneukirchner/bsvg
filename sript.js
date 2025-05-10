const basePath = 'audio/';

const lineInput = document.getElementById('line');
const destinationSelect = document.getElementById('destination');
const viaSelect = document.getElementById('via');
const enableSpecial = document.getElementById('enableSpecial');
const specialSelect = document.getElementById('special');

enableSpecial.addEventListener('change', () => {
  specialSelect.disabled = !enableSpecial.checked;
});

window.onload = () => {
  loadHaltestellen();
  loadSonderansagen();
};

function loadHaltestellen() {
  const haltestellen = ["heidberg.mp3", "haup.mp3", "broitzem.mp3"]; // Anpassen
  haltestellen.forEach(name => {
    destinationSelect.add(new Option(name, name));
    viaSelect.add(new Option(name, name));
  });
}

function loadSonderansagen() {
  const sonderansagen = ["ne.mp3", "sonder_ne.mp3"]; // Anpassen
  sonderansagen.forEach(name => {
    specialSelect.add(new Option(name, name));
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

  if (line) {
    files.push(`${basePath}Fragmente/linie.mp3`);
    files.push(`${basePath}Nummern/line_number_end/${line}.mp3`);
  } else {
    files.push(`${basePath}Fragmente/zug.mp3`);
  }

  if (destination) {
    files.push(`${basePath}Fragmente/nach.mp3`);
    files.push(`${basePath}Ziele/${destination}.mp3`);

    if (via) {
      files.push(`${basePath}Fragmente/ueber.mp3`);
      files.push(`${basePath}Ziele/${via}.mp3`);
    }
  }

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
