/*
  Kaiser Webdesign — hardware-decoded scroll film.
  Scroll controls a smoothed target time; the browser's native H.264 decoder
  presents the frames. No image sequence, no canvas uploads, no fetch-per-frame.
*/
(()=>{'use strict';
  const section=document.querySelector('.hero-scroll');
  if(!section)return;

  const stage=section.querySelector('.hero-sticky');
  const media=section.querySelector('.hero-media');
  const video=section.querySelector('.hero-video');
  const button=section.querySelector('#hero-motion-toggle');
  const chapter=section.querySelector('[data-hero-step]');
  if(!stage||!media||!video||!button||!chapter)return;

  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const saveData=Boolean(navigator.connection?.saveData);
  const mobile=matchMedia('(max-width: 900px)').matches;

  const SOURCE=mobile
    ? 'assets/video/hero/kaiser-scroll-desktop.mp4?v=mobile-ultra-1440-v85'
    : 'assets/video/hero/kaiser-scroll-desktop.mp4?v=desktop-v85';

  // Similar to a GSAP-style scrub: scroll defines the destination, but the
  // playhead glides toward it instead of inheriting the wheel's coarse steps.
  const SMOOTH_MS=mobile?105:85;
  const SNAP_PROGRESS=0.00035;
  const FRAME_COUNT=605;
  const LAST_FRAME=FRAME_COUNT-1;

  let active=!reduced.matches&&!saveData;
  let paused=false;
  let visible=true;
  let ready=false;
  let targetProgress=0;
  let playheadProgress=0;
  let duration=10.083333;
  let timelineEnd=Math.max(0,duration-1/60);
  let pendingSeek=false;
  let raf=0;
  let lastNow=0;
  let presentToken=0;
  let presentWatchdog=0;
  let lastRequestedFrame=-1;
  let sourceLoaded=false;

  video.muted=true;
  video.playsInline=true;
  video.preload='auto';
  video.setAttribute('playsinline','');
  video.setAttribute('webkit-playsinline','');
  try{video.fetchPriority='high';}catch{}

  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

  function updateMeta(){
    stage.style.setProperty('--hero-progress',String(playheadProgress));
    chapter.textContent=playheadProgress<.22?'01 / DEINE MARKE':playheadProgress<.67?'02 / DESIGN & ENTWICKLUNG':'03 / DEIN DIGITALER AUFTRITT';
    video.dataset.progress=playheadProgress.toFixed(4);
    video.dataset.target=targetProgress.toFixed(4);
    video.dataset.time=Number.isFinite(video.currentTime)?video.currentTime.toFixed(3):'0';
  }

  function markPresented(){
    clearTimeout(presentWatchdog);
    pendingSeek=false;
    if(ready)section.classList.add('has-video');
    pumpSeek();
  }

  function onSeeked(){
    // rVFC confirms that the decoded frame actually reached the compositor.
    if(typeof video.requestVideoFrameCallback==='function'){
      const token=++presentToken;
      video.requestVideoFrameCallback(()=>{
        if(token!==presentToken)return;
        markPresented();
      });
      // Some paused-video implementations can suppress rVFC when two seeks land
      // on the same decoded picture. Never let that stall the scrub pipeline.
      clearTimeout(presentWatchdog);
      presentWatchdog=setTimeout(()=>{
        if(token===presentToken)markPresented();
      },90);
    }else{
      markPresented();
    }
  }

  function pumpSeek(){
    if(!active||paused||!visible||document.hidden||!ready||pendingSeek)return;
    // Request exact source-frame timestamps. This avoids redundant sub-frame
    // seeks and keeps the browser aligned with the 60 fps encode.
    const wantedFrame=clamp(Math.round(playheadProgress*LAST_FRAME),0,LAST_FRAME);
    if(wantedFrame===lastRequestedFrame)return;
    const wanted=Math.min(timelineEnd,wantedFrame/60);
    pendingSeek=true;
    lastRequestedFrame=wantedFrame;
    try{
      video.currentTime=wanted;
    }catch{
      pendingSeek=false;
      lastRequestedFrame=-1;
    }
  }

  function schedule(){
    if(!raf&&active&&!paused&&!document.hidden&&visible)raf=requestAnimationFrame(tick);
  }

  function tick(now){
    raf=0;
    if(!active||paused||document.hidden||!visible){lastNow=0;return;}
    const dt=lastNow?clamp(now-lastNow,0,50):16.67;
    lastNow=now;

    const delta=targetProgress-playheadProgress;
    if(Math.abs(delta)<=SNAP_PROGRESS){
      playheadProgress=targetProgress;
    }else{
      const alpha=1-Math.exp(-dt/SMOOTH_MS);
      playheadProgress+=delta*alpha;
    }

    pumpSeek();
    updateMeta();

    if(Math.abs(targetProgress-playheadProgress)>SNAP_PROGRESS||pendingSeek)schedule();
    else lastNow=0;
  }

  function measure(){
    const rect=section.getBoundingClientRect();
    const travel=Math.max(0,section.offsetHeight-stage.offsetHeight);
    visible=rect.bottom>0&&rect.top<innerHeight;
    targetProgress=clamp(travel>0?-rect.top/travel:0,0,1);
    if(visible)schedule();
  }

  function sync(){
    section.classList.toggle('is-scrubbing',active);
    section.classList.toggle('user-motion',active&&reduced.matches);
    button.hidden=false;
    button.textContent=active?(paused?'Animation fortsetzen':'Animation anhalten'):'Animation aktivieren';
    button.setAttribute('aria-pressed',String(active&&!paused));

    if(!active){
      cancelAnimationFrame(raf);raf=0;lastNow=0;
      section.classList.remove('has-video');
      return;
    }
    measure();
    schedule();
  }

  function loadSource(){
    if(sourceLoaded)return;
    sourceLoaded=true;
    video.src=new URL(SOURCE,document.baseURI).href;
    video.load();
  }

  video.addEventListener('loadedmetadata',()=>{
    if(Number.isFinite(video.duration)&&video.duration>0){
      duration=video.duration;
      timelineEnd=Math.max(0,duration-1/60);
    }
    ready=true;
    // Prime a decoded frame without starting playback/autoplay.
    try{video.currentTime=Math.min(.001,timelineEnd);}catch{}
    measure();
    schedule();
  },{once:true});

  video.addEventListener('loadeddata',()=>{
    ready=true;
    section.classList.add('has-video');
    schedule();
  });

  video.addEventListener('seeked',onSeeked);
  video.addEventListener('error',()=>{
    // Keep poster visible if media cannot be decoded; don't leave a black hero.
    ready=false;
    pendingSeek=false;
    section.classList.remove('has-video');
  });

  button.addEventListener('click',()=>{
    if(!active){active=true;paused=false;loadSource();}
    else paused=!paused;
    lastNow=0;
    sync();
  });

  addEventListener('scroll',measure,{passive:true});
  addEventListener('resize',measure,{passive:true});
  addEventListener('pageshow',measure);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(raf);raf=0;lastNow=0;}
    else{measure();schedule();}
  });
  reduced.addEventListener?.('change',()=>{
    active=!reduced.matches&&!saveData;
    paused=false;
    lastNow=0;
    sync();
  });
  if('ResizeObserver'in window)new ResizeObserver(measure).observe(media);

  loadSource();
  sync();
})();
