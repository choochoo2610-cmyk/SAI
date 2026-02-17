const AnalyticsEngine=(function(){
let startTime;

function beginSession(){
  startTime=Date.now();
}

function endSession(){
  if(!startTime) return;
  const duration=(Date.now()-startTime)/1000;
  localStorage.setItem("lastSession",duration);
}

return {beginSession,endSession};
})();
