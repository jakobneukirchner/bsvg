// Pfad zu den Audiodateien auf GitHub (raw)
const basePath = 'https://raw.githubusercontent.com/jakobneukirchner/bsvg/main/audio/';

const destinationSelect = document.getElementById('destination');
const viaSelect = document.getElementById('via');
const specialSelect = document.getElementById('special');
const enableSpecial = document.getElementById('enableSpecial');

enableSpecial.addEventListener('change', () => {
  specialSelect.disabled = !enableSpecial.checked;
});

window.onload = async () => {
  await loadHaltestellen();
  await loadSonderansagen();
};

async function loadHaltestellen() {
  const ziele = ["heidberg", "hauptbahnhof", "broitzem"]; // Anpassen, wenn du mehr hast
  ziele.forEach(name => {
    let opt = new Option(name, name);
    destinationSelect.add(opt.cloneNode(true));
    viaSelect.add(opt);
  });
}

async function loadSonderansagen() {
  const sonder = ["fahrt_auf_sicht.mp3", "wagen_defekt.mp3"]; // Auch hier ggf. anpassen
  sonder.forEach(name => specialSelect.add(new Option(name, name)));
}

function playAudioSequence(filepaths) {
  let index = 0;
  const audio = new Audio();
  audio.src = filepaths[index];
  audio.play();

  audio.addEventListener('ended', () => {
    index++;
    if (index < filepaths.length) {
      audio.src = filepaths[index];
      audio.play();
    }
  });
}

function generateAnnouncement() {
  const files = [];

  const line = document.getElementById('line').value;
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
    alert("Bitte eine Sonderansage wählen");
    return;
  }
  playAudioSequence([`${basePath}Hinweise/${special}`]);
}
