let ctx;
let oscL, oscR;
let gainNode, masterGain;
let panner;
let lfo;
let heartbeatInterval;
let moveInterval;
let breathing = false;
let running = false;

const MAX_VOLUME = 0.4;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

startBtn.onclick = () => {
 if(running) return;

 ctx = new (window.AudioContext || window.webkitAudioContext)();

 masterGain = ctx.createGain();
 masterGain.gain.value = 0.25;
 masterGain.connect(ctx.destination);

 gainNode = ctx.createGain();
 gainNode.gain.value = 0.2;

 panner = ctx.createPanner();
 panner.panningModel = "HRTF";
 panner.distanceModel = "inverse";
 panner.setPosition(0,0,-1);

 gainNode.connect(panner);
 panner.connect(masterGain);

 createBinaural();
 startSpatialMovement();
 startHeartbeat();

 running = true;
};

stopBtn.onclick = () => {
 if(!running) return;
 ctx.close();
 running = false;
 clearInterval(moveInterval);
 clearInterval(heartbeatInterval);
};

function createBinaural(){
 const preset = parseFloat(document.getElementById("preset").value);
 const baseFreq = parseFloat(document.getElementById("baseFreq").value);
 const wave = document.getElementById("waveform").value;

 oscL = ctx.createOscillator();
 oscR = ctx.createOscillator();

 oscL.type = wave;
 oscR.type = wave;

 oscL.frequency.value = baseFreq;
 oscR.frequency.value = baseFreq + preset;

 oscL.connect(gainNode);
 oscR.connect(gainNode);

 oscL.start();
 oscR.start();
}

function startSpatialMovement(){
 let angle = 0;
 const speed = parseFloat(document.getElementById("moveSpeed").value);

 moveInterval = setInterval(()=>{
   angle += 0.02 * speed;
   const x = Math.sin(angle);
   const z = -1 + Math.cos(angle);
   panner.setPosition(x,0,z);
 }, 50);
}

function startHeartbeat(){
 const bpm = parseInt(document.getElementById("bpm").value);
 const interval = 60000 / bpm;

 heartbeatInterval = setInterval(()=>{
   masterGain.gain.setTargetAtTime(MAX_VOLUME, ctx.currentTime, 0.05);
   masterGain.gain.setTargetAtTime(0.25, ctx.currentTime + 0.1, 0.2);
 }, interval);
}

document.getElementById("breathBtn").onclick = ()=>{
 if(!running) return;
 breathing = !breathing;
 if(breathing){
   startBreathing();
 }
};

function startBreathing(){
 let phase = 0;
 const breathCycle = 4000;
 const breathLoop = setInterval(()=>{
   if(!breathing){
     clearInterval(breathLoop);
     return;
   }
   phase += 0.05;
   const mod = 0.2 + Math.sin(phase)*0.1;
   gainNode.gain.setTargetAtTime(mod, ctx.currentTime, 0.3);
 },100);
}
