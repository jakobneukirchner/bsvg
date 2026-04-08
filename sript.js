const basePath = 'audio/';

const destinationSelect = document.getElementById('destination');
const specialSelect = document.getElementById('special');
const enableSpecial = document.getElementById('enableSpecial');
const viaContainer = document.getElementById('via-container');
const btnAddVia = document.getElementById('btn-add-via');

// Liste aller Haltestellen (befüllt durch loadHaltestellen)
let haltestellen = [];

enableSpecial.addEventListener('change', () => {
  specialSelect.disabled = !enableSpecial.checked;
});

window.onload = () => {
  loadHaltestellen();
  loadSonderansagen();
  btnAddVia.addEventListener('click', addViaRow);
};

function loadHaltestellen() {
  // ✏️ Hier alle mp3-Dateinamen (ohne .mp3) aus /audio/Ziele eintragen
  haltestellen = ["heidberg", "hauptbahnhof", "broitzem"];

  haltestellen.forEach(name => {
    destinationSelect.add(new Option(name, name));
  });
}

function loadSonderansagen() {
  const sonderansagen = ["fahrt_auf_sicht.mp3", "wagen_defekt.mp3"];
  sonderansagen.forEach(name => {
    specialSelect.add(new Option(name, name));
  });
}

// ===== Via-Haltestellen (dynamisch, mehrere) =====

function buildViaSelect() {
  const sel = document.createElement('select');
  sel.className = 'form-select via-select';
  const emptyOpt = new Option('(keine)', '');
  sel.add(emptyOpt);
  haltestellen.forEach(name => sel.add(new Option(name, name)));
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

// ===== Audio =====

function playAudioSequence(files) {
  let index = 0;
  const audio = new Audio();

  function playNext() {
    if (index >= files.length) return;
    audio.src = files[index];
    audio.play().catch(() => {});
  }

  audio.addEventListener('ended', () => {
    index++;
    playNext();
  });

  playNext();
}

function generateAndPlay() {
  const files = [];

  const line = document.getElementById('line').value;
  const destination = destinationSelect.value;
  const viaList = getViaValues();
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

    if (viaList.length > 0) {
      files.push(`${basePath}Fragmente/ueber.mp3`);
      viaList.forEach(via => {
        files.push(`${basePath}Ziele/${via}.mp3`);
      });
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
    alert('Bitte eine Sonderansage wählen');
    return;
  }
  playAudioSequence([`${basePath}Hinweise/${special}`]);
}

function playQuick(src) {
  const a = new Audio(src);
  a.play().catch(() => {});
}
