const AudioEngine = (function(){

let ctx;
let leftOsc,rightOsc;
let masterGain,noiseGain,limiter;
let lfo,lfoGain;
let noiseNode;
let panL,panR;
let running=false;
let sessionTimer;

const phases=[
  {duration:180,targetDiff:10},
  {duration:300,targetDiff:8},
  {duration:420,targetDiff:6},
  {duration:180,targetDiff:5},
  {duration:120,targetDiff:9}
];

async function start(){

  if(running) return;
  running=true;

  ctx=new (window.AudioContext||window.webkitAudioContext)();

  await ctx.audioWorklet.addModule("pinkNoiseProcessor.js");

  /* Oscillators */
  leftOsc=ctx.createOscillator();
  rightOsc=ctx.createOscillator();
  leftOsc.type="sine";
  rightOsc.type="sine";

  /* Gain */
  masterGain=ctx.createGain();
  noiseGain=ctx.createGain();
  masterGain.gain.value=0;

  /* Limiter */
  limiter=ctx.createDynamicsCompressor();
  limiter.threshold.value=-10;
  limiter.ratio.value=20;
  limiter.attack.value=0.003;
  limiter.release.value=0.25;

  /* Stereo */
  panL=ctx.createStereoPanner();
  panR=ctx.createStereoPanner();
  panL.pan.value=-1;
  panR.pan.value=1;

  /* Base frequency */
  const base=parseFloat(document.getElementById("baseFreq").value);
  leftOsc.frequency.setValueAtTime(base,ctx.currentTime);
  rightOsc.frequency.setValueAtTime(base+10,ctx.currentTime);

  /* Pink Noise Worklet */
  noiseNode=new AudioWorkletNode(ctx,'pink-noise-processor');
  noiseGain.gain.value=parseFloat(document.getElementById("noiseAmt").value);

  /* 1/f LFO */
  lfo=ctx.createOscillator();
  lfoGain=ctx.createGain();
  lfo.frequency.value=0.05;
  lfoGain.gain.value=3;
  lfo.connect(lfoGain);
  lfoGain.connect(leftOsc.frequency);
  lfoGain.connect(rightOsc.frequency);

  /* Routing */
  leftOsc.connect(panL);
  rightOsc.connect(panR);
  panL.connect(masterGain);
  panR.connect(masterGain);

  noiseNode.connect(noiseGain);
  noiseGain.connect(masterGain);

  masterGain.connect(limiter);
  limiter.connect(ctx.destination);

  /* Start */
  leftOsc.start();
  rightOsc.start();
  lfo.start();

  masterGain.gain.linearRampToValueAtTime(0.4,ctx.currentTime+3);

  startPhaseControl(base);
}

function startPhaseControl(base){
  let total=0;

  phases.forEach(p=>{
    const end=ctx.currentTime+total+p.duration;
    rightOsc.frequency.linearRampToValueAtTime(base+p.targetDiff,end);
    total+=p.duration;
  });

  sessionTimer=setTimeout(stop,total*1000);
}

function stop(){
  if(!running) return;
  clearTimeout(sessionTimer);

  masterGain.gain.linearRampToValueAtTime(0,ctx.currentTime+2);

  setTimeout(()=>{
    ctx.close();
    running=false;
  },2500);
}

return {start,stop};

})();
