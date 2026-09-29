/*
  Kaiser Webdesign — resilient scroll hero.
  Uses the native H.264 scroll film when available. If the media asset is
  missing or cannot be decoded, the existing HQ poster becomes a smooth,
  scroll-driven cinematic fallback instead of leaving a dead hero.
*/
(()=>{'use strict';
  const section=document.querySelector('.hero-scroll');
  if(!section)return;

  const stage=section.querySelector('.hero-sticky');
  const media=section.querySelector('.hero-media');
  const poster=section.querySelector('.hero-poster');
  const video=section.querySelector('.hero-video');
  const button=section.querySelector('#hero-motion-toggle');
  const chapter=section.querySelector('[data-hero-step]');
  if(!stage||!media||!poster||!video||!button||!chapter)return;

  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const saveData=Boolean(navigator.connection?.saveData);
  const mobile=matchMedia('(max-width: 900px)').matches;

  const SOURCE='assets/video/kaiser-scroll-desktop.mp4?v=github-scroll-v2';
  const SMOOTH_MS=mobile?115:90;
  const SNAP_PROGRESS=0.00035;
  const FRAME_COUNT=605;
  const LAST_FRAME=FRAME_COUNT-1;

  let active=!reduced.matches&&!saveData;
  let paused=false;
  let visible=true;
  let ready=false;
  let fallback=false;
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
  const smooth=(p)=>p*p*(3-2*p);

  function updateMeta(){
    stage.style.setProperty('--hero-progress',String(playheadProgress));
    chapter.textContent=playheadProgress<.22?'01 / DEINE MARKE':playheadProgress<.67?'02 / DESIGN & ENTWICKLUNG':'03 / DEIN DIGITALER AUFTRITT';
    video.dataset.progress=playheadProgress.toFixed(4);
    video.dataset.target=targetProgress.toFixed(4);
    video.dataset.time=Number.isFinite(video.currentTime)?video.currentTime.toFixed(3):'0';
  }

  function renderFallback(){
    if(!fallback)return;
    const p=smooth(playheadProgress);
    const zoom=1+(mobile ? .075 : .13)*p;
    const x=(mobile?-1.2:-2.8)*p;
    const y=(mobile?0.6:1.25)*(p-.45);
    const rotate=(mobile ? .18 : .32)*(p-.5);
    const brightness=.86+.14*Math.sin(Math.PI*p);
    const glow=.18+.42*Math.sin(Math.PI*p);

    poster.style.transform=`translate3d(${x.toFixed(3)}%,${y.toFixed(3)}%,0) scale(${zoom.toFixed(4)}) rotate(${rotate.toFixed(3)}deg)`;
    poster.style.filter=`brightness(${brightness.toFixed(3)}) contrast(${(1.03+.06*p).toFixed(3)}) saturate(${(.92+.12*p).toFixed(3)})`;
    media.style.setProperty('--fallback-glow',glow.toFixed(3));
    media.style.setProperty('--fallback-shift',`${(p*100).toFixed(2)}%`);
  }

  function activateFallback(reason){
    if(fallback)return;
    fallback=true;
    ready=true;
    pendingSeek=false;
    lastRequestedFrame=-1;
    clearTimeout(presentWatchdog);
    section.classList.remove('has-video');
    section.classList.add('hero-fallback-motion');
    video.pause();
    try{video.removeAttribute('src');video.load();}catch{}
    renderFallback();
    measure();
    schedule();
    if(reason)console.info('Kaiser Webdesign: Scroll-Fallback aktiv.',reason);
  }

  function markPresented(){
    clearTimeout(presentWatchdog);
    pendingSeek=false;
    if(ready&&!fallback)section.classList.add('has-video');
    pumpSeek();
  }

  function onSeeked(){
    if(fallback)return;
    if(typeof video.requestVideoFrameCallback==='function'){
      const token=++presentToken;
      video.requestVideoFrameCallback(()=>{
        if(token!==presentToken)return;
        markPresented();
      });
      clearTimeout(presentWatchdog);
      presentWatchdog=setTimeout(()=>{
        if(token===presentToken)markPresented();
      },90);
    }else{
      markPresented();
    }
  }

  function pumpSeek(){
    if(fallback||!active||paused||!visible||document.hidden||!ready||pendingSeek)return;
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

    if(fallback)renderFallback();
    else pumpSeek();

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
      if(!fallback)section.classList.remove('has-video');
      return;
    }
    measure();
    schedule();
  }

  async function loadSource(){
    if(sourceLoaded)return;
    sourceLoaded=true;

    // GitHub Pages can silently publish the page without a large media file.
    // Probe first; on any miss we immediately switch to the local scroll fallback.
    try{
      const response=await fetch(new URL(SOURCE,document.baseURI).href,{
        method:'HEAD',
        cache:'no-store',
        credentials:'same-origin'
      });
      if(!response.ok)throw new Error(`Video HTTP ${response.status}`);
      video.src=new URL(SOURCE,document.baseURI).href;
      video.load();
    }catch(error){
      activateFallback(error?.message||'Video nicht erreichbar');
    }
  }

  video.addEventListener('loadedmetadata',()=>{
    if(fallback)return;
    if(Number.isFinite(video.duration)&&video.duration>0){
      duration=video.duration;
      timelineEnd=Math.max(0,duration-1/60);
    }
    ready=true;
    try{video.currentTime=Math.min(.001,timelineEnd);}catch{}
    measure();
    schedule();
  },{once:true});

  video.addEventListener('loadeddata',()=>{
    if(fallback)return;
    ready=true;
    section.classList.add('has-video');
    schedule();
  });

  video.addEventListener('seeked',onSeeked);
  video.addEventListener('error',()=>activateFallback('Video konnte nicht dekodiert werden'));

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