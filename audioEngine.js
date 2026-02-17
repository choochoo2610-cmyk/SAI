const AudioEngine=(function(){

let ctx,leftOsc,rightOsc,masterGain,noiseGain,noiseNode,lfo;
let limiter,running=false,sessionTimer;

const phases=[
  {duration:180,targetDiff:10},
  {duration:300,targetDiff:8},
  {duration:420,targetDiff:6},
  {duration:180,targetDiff:5},
  {duration:120,targetDiff:9}
];

function createPinkNoise(ctx){
  const bufferSize=4096;
  const node=ctx.createScriptProcessor(bufferSize,1,1);
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  node.onaudioprocess=function(e){
    const output=e.outputBuffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++){
      const white=Math.random()*2-1;
      b0=0.99886*b0+white*0.0555179;
      b1=0.99332*b1+white*0.0750759;
      b2=0.96900*b2+white*0.1538520;
      b3=0.86650*b3+white*0.3104856;
      b4=0.55000*b4+white*0.5329522;
      b5=-0.7616*b5-white*0.0168980;
      output[i]=b0+b1+b2+b3+b4+b5+b6+white*0.5362;
      output[i]*=0.11;
      b6=white*0.115926;
    }
  };
  return node;
}

function startPhaseControl(base){
  let total=0;
  phases.forEach(p=>{
    const endTime=ctx.currentTime+total+p.duration;
    rightOsc.frequency.linearRampToValueAtTime(base+p.targetDiff,endTime);
    total+=p.duration;
  });
  sessionTimer=setTimeout(stop,total*1000);
}

function start(){
  if(running) return;
  running=true;

  ctx=new (window.AudioContext||window.webkitAudioContext)();

  leftOsc=ctx.createOscillator();
  rightOsc=ctx.createOscillator();
  masterGain=ctx.createGain();
  noiseGain=ctx.createGain();
  limiter=ctx.createDynamicsCompressor();

  leftOsc.type="sine";
  rightOsc.type="sine";

  const base=parseFloat(document.getElementById("baseFreq").value);

  leftOsc.frequency.value=base;
  rightOsc.frequency.value=base+10;

  noiseGain.gain.value=document.getElementById("noiseAmt").value;

  limiter.threshold.value=-10;
  limiter.ratio.value=20;

  const panL=ctx.createStereoPanner();
  const panR=ctx.createStereoPanner();
  panL.pan.value=-1;
  panR.pan.value=1;

  noiseNode=createPinkNoise(ctx);

  lfo=ctx.createOscillator();
  const lfoGain=ctx.createGain();
  lfo.frequency.value=0.05;
  lfoGain.gain.value=3;
  lfo.connect(lfoGain);
  lfoGain.connect(leftOsc.frequency);
  lfoGain.connect(rightOsc.frequency);

  leftOsc.connect(panL);
  rightOsc.connect(panR);
  panL.connect(masterGain);
  panR.connect(masterGain);

  noiseNode.connect(noiseGain);
  noiseGain.connect(masterGain);

  masterGain.connect(limiter);
  limiter.connect(ctx.destination);

  leftOsc.start();
  rightOsc.start();
  lfo.start();

  masterGain.gain.setValueAtTime(0,ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.4,ctx.currentTime+3);

  startPhaseControl(base);
}

function stop(){
  if(!running) return;
  clearTimeout(sessionTimer);
  masterGain.gain.linearRampToValueAtTime(0,ctx.currentTime+2);
  setTimeout(()=>ctx.close(),2500);
  running=false;
}

return {start,stop};

})();
