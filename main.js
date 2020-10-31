// Make an instance of two and place it on the page.
const elem = document.getElementById('draw-shapes');
const sampleRate = 44000;
const samples = 44000;

let height = document.body.clientHeight;
let width = document.body.clientWidth;
let params = { width: width, height: height };
let two = new Two(params).appendTo(elem);
let context;
let analyzer;
let modal = document.getElementById("myModal");
let freq = 440;

let smallest = width < height ? width : height;
let dial_radius = smallest * 0.3;
let center_x = width / 2;
let center_y = height / 2 + dial_radius * 0.5;

window.onresize = function () {
  init();
}


function draw_ticks(two, cx, cy, r, n) {
  let f = function(n, o, l) {
    for (let i = 0; i < n; i++) {
      let a = i * (Math.PI - 2 * o ) / (n - 1);
      console.log(i);
      let x = Math.cos(a + o);
      let y = Math.sin(a  + o);
      line = two.makeLine(cx + x * r - x * l, cy - y * r + y * l, cx + x * r, cy - y * r);
    }
  }
  f(n, 0, r * 0.2);
  f(n - 1, Math.PI / 20, r * 0.1);
}

function draw_dial(two) {

  let arc = two.makeArcSegment(
      center_x,
      center_y,
      dial_radius,
      dial_radius * 1.01,
      0,
      -Math.PI)
  arc.stroke = 'black';
  arc.fill = '#333';

  let dial_width = smallest * 0.02;
  let dial = two.makePath(
      center_x - dial_width,
      center_y,
      center_x,
      center_y - dial_radius,
      center_x + dial_width,
      center_y,
      true);

  dial.stroke = '#333';
  dial.linewidth = 3;
  dial.fill = '#f26430';
  let circle = two.makeCircle(center_x, center_y, smallest * 0.03)
  circle.stroke = '#333';
  circle.fill = '#333';

  draw_ticks(two, center_x, center_y, dial_radius, 11);

  return dial;
}

function rotateDial(dial, cents) {
  let a = Math.PI / 2 / 50 * cents;
  dial.translation.set(center_x, center_y);
  dial.rotation = a;
  dial.translation.set(center_x - Math.cos(a + Math.PI / 2) * dial_radius / 2, center_y - Math.sin(a + Math.PI / 2) * dial_radius /2 );
}

function analyze() {
  if(analyzer === undefined) {
    return 0;
  }
  let data = new Uint8Array(analyzer.frequencyBinCount);
  analyzer.getByteFrequencyData(data);
  let n = 0;
  for(let i = 0; i < analyzer.frequencyBinCount; i++) {
    if (data[i] > 150) {
      n = i;
      break;
    }
  }

  let lower = (n * sampleRate / 2 / analyzer.frequencyBinCount);
  let upper = ((n + 1) * sampleRate / 2 / analyzer.frequencyBinCount);

  freq = (upper + lower) / 2;

  return freq;
}

const notes = ['C', 'C#', 'D', 'Eb', 'E', 'F',
               'F#', 'G', 'G#', 'A', 'Bb', 'B']
function freq_to_note(freq) {
  const A4 = 440;
  let n;
  n = Math.log(freq / A4) / Math.log(Math.pow(2, 1 / 12));
  let tone_freq = 440 * Math.pow(Math.pow(2, 1/12), Math.round(n));
  let cents = Math.log(freq / tone_freq) / Math.log(Math.pow(Math.pow(2, 1/12), 1/100));
  console.log(n);
  console.log(freq);
  console.log(cents);
  let step = Math.round(n) + 9;
  if(notes[step < 0 ? 11 + step % 12 : step % 12] === undefined) {
    console.log(step);
  }
  return [notes[step < 0 ? 11 + step % 12 : step % 12] + (4 + parseInt((step < 0 ? step - 12 : step) /12)).toString(), cents];
}

function start_music() {
  context = new AudioContext({sampleRate: sampleRate});
  analyzer = context.createAnalyser()
  analyzer.fftSize = samples;

  navigator.mediaDevices.getUserMedia(
      {audio: true}
  ).then(function (stream) {
    var source = new MediaStreamAudioSourceNode(
        context,
        {mediaStream: stream}
    );
    source.connect(analyzer);
  });

  window.setInterval(analyze,10);
}

document.querySelector('#start').addEventListener('click', function () {
  console.log('starting');
  start_music();
  modal.style.display = 'none';
})



function init() {
  two.clear();
  width = document.body.clientWidth;
  height = document.body.clientHeight;
  two.renderer.setSize(width, height);

  var styles = {
    family: 'proxima-nova, sans-serif',
    size: 50,
    leading: 50,
    weight: 900
  };

  let toneText = two.makeText(
      'A4',
      center_x,
      center_y - dial_radius - 40,
      styles);
  let freqText = two.makeText(
      0,
      center_x,
      center_y  + 80,
      styles);

  let dial = draw_dial(two, 0, 'A4', freq);

  two.bind('update', function(frameCount) {
    let note = freq_to_note(freq);
    rotateDial(dial, note[1]);
    toneText.value = note[0];
    freqText.value = Math.round(freq);
  }).play();

  two.update();
}
init();
