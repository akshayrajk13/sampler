const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const masterGain = audioContext.createGain();
masterGain.gain.value = 0.5;
masterGain.connect(audioContext.destination);

const low = audioContext.createBiquadFilter();
low.type = "lowshelf";
low.frequency.value = 500;
low.gain.value = 0;

const mid = audioContext.createBiquadFilter();
mid.type = "peaking";
mid.frequency.value = 1000;
mid.gain.value = 0;

const high = audioContext.createBiquadFilter();
high.type = "highshelf";
high.frequency.value = 3000;
high.gain.value = 0;

low.connect(mid).connect(high).connect(masterGain);

const reverb = audioContext.createConvolver();
const reverbGain = audioContext.createGain();
reverbGain.gain.value = 0;

reverb.connect(reverbGain);
reverbGain.connect(masterGain);

async function loadReverbImpulse(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  reverb.buffer = await audioContext.decodeAudioData(arrayBuffer);
}

loadReverbImpulse("./impulses/reverb-impulse.wav");

const reverbControl = document.getElementById("reverb");
reverbControl.addEventListener("input", (event) => {
  const reverbAmount = event.target.value / 10;
  reverbGain.gain.value = reverbAmount;
});

const gridGain = {};

async function loadAudio(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

function playAudio(buffer, individualGain) {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  source.connect(individualGain);
  individualGain.connect(low);
  individualGain.connect(reverb);
  source.start();
}

const grids = document.querySelectorAll(".grid");

grids.forEach(async (grid) => {
  const soundUrl = grid.dataset.sound;
  const individualGain = audioContext.createGain();
  individualGain.gain.value = 1;
  gridGain[grid.dataset.sound] = individualGain;

  const audioBuffer = await loadAudio(soundUrl);
  grid.audioBuffer = audioBuffer;

  grid.addEventListener("click", () => {
    if (grid.audioBuffer) {
      playAudio(grid.audioBuffer, individualGain);
    }
    provideVisualFeedback(grid);
  });

  const fileInput = grid.querySelector(".file-upload");
  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const customBuffer = await audioContext.decodeAudioData(arrayBuffer);
      grid.audioBuffer = customBuffer;
    }
  });

  const volumeSlider = grid.querySelector(".grid-volume");
  volumeSlider.addEventListener("input", (event) => {
    const volume = event.target.value;
    individualGain.gain.value = volume;
  });
});

const volumeControl = document.getElementById("volume");
volumeControl.addEventListener("input", (event) => {
  masterGain.gain.value = event.target.value / 10;
});

document.getElementById("low").addEventListener("input", (event) => {
  low.gain.value = event.target.value;
});
document.getElementById("mid").addEventListener("input", (event) => {
  mid.gain.value = event.target.value;
});
document.getElementById("high").addEventListener("input", (event) => {
  high.gain.value = event.target.value;
});

const keyGridMapping = {
  q: 0,
  w: 1,
  e: 2,
  a: 3,
  s: 4,
  d: 5,
  z: 6,
  x: 7,
  c: 8,
};

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const gridIndex = keyGridMapping[key];

  if (gridIndex !== undefined) {
    const grid = grids[gridIndex];
    grid.click();
    provideVisualFeedback(grid);
  }
});

function provideVisualFeedback(grid) {
  grid.classList.add("active");
  setTimeout(() => grid.classList.remove("active"), 100);
}

document.querySelectorAll(".file-upload").forEach((fileInput) => {
  const fileNameSpan = fileInput
    .closest(".file-upload-container")
    .querySelector(".file-name");

  fileInput.addEventListener("change", (event) => {
    const fileName = event.target.files[0]?.name || "No file selected";
    fileNameSpan.textContent = fileName;
  });
});
