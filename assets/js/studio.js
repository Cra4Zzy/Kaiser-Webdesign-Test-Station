(() => {
'use strict';
const $ = (s,root=document) => root.querySelector(s);
const $$ = (s,root=document) => [...root.querySelectorAll(s)];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const header = $('[data-header]');
let queued = false;
function paintScroll(){
 queued=false; header?.classList.toggle('is-fixed',scrollY>120);
 const hero=$('.hero');
 if(hero && !hero.classList.contains("hero-scroll") && scrollY<hero.offsetHeight && !motion.matches){hero.style.setProperty('--hero-y',`${Math.min(scrollY*.12,95)}px`);hero.style.setProperty('--hero-scale',String(1.02+Math.min(scrollY/15000,.04)));}
}
addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(paintScroll);}},{passive:true});paintScroll();
const menu=$('.menu-toggle'),nav=$('#mobile-nav');
function closeMenu(){if(!menu)return;menu.setAttribute('aria-expanded','false');nav.hidden=true;document.body.classList.remove('menu-open');$('main').inert=false;$('footer').inert=false;}
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true'; if(!open){closeMenu();return;}menu.setAttribute('aria-expanded','true');nav.hidden=false;document.body.classList.add('menu-open');$('main').inert=true;$('footer').inert=true;});
$$('a',nav).forEach(a=>a.addEventListener('click',()=>{closeMenu();const destination=$(a.getAttribute('href'));destination?.setAttribute('tabindex','-1');destination?.focus({preventScroll:true});}));
addEventListener('keydown',event=>{if(menu?.getAttribute('aria-expanded')!=='true')return;if(event.key==='Escape'){closeMenu();menu.focus();}if(event.key==='Tab'){const items=[menu,...$$('a',nav)];const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
matchMedia('(min-width:761px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
const projects={
 dv:{title:'DV Transporte',category:'KUNDENPROJEKT / SPEDITION & LOGISTIK',short:'SPEDITION & LOGISTIK',image:'assets/references/dv-transporte-current.webp',alt:'DV Transporte Website mit Fuhrpark, Leistungen und direkter Transportanfrage',caption:'Ein klarer, kraftvoller Auftritt für Transport, Fuhrpark und direkte Anfragen.',description:'Der neue Auftritt für DV Transporte verbindet eine prägnante Typografie mit großflächigen Fuhrparkbildern und einer klaren Leistungsstruktur. Internationale Verkehre, regionale Umfuhren und verfügbare Kapazitäten werden schnell erfassbar; die Transportanfrage bleibt dabei jederzeit nah.',scope:['Individuelles Webdesign für Spedition & Logistik','Leistungs-, Fuhrpark- und Galerieinszenierung','Direkte Wege zur Transportanfrage'],url:'https://www.dvtransporte.de/'},
 yacht:{title:'Aurelia Yachts',category:'KONZEPT-SHOWCASE / CINEASTISCHES WEBDESIGN',short:'SHOWCASE / SCROLL-ANIMATION',image:'assets/references/aurelia-yachts.webp',alt:'Aurelia Yachts Website mit Luxusyacht im Sonnenuntergang',caption:'Ein interaktiver Yacht-Showcase. Erlebe, wie Scrollen eine Geschichte erzählt.',description:'Eine Konzeptwebsite für eine fiktive Yachtmarke: Großflächige Bildwelten, bewusst gesetzte Typografie und cineastische Scroll-Sequenzen zeigen, wie ein Produkt digital erlebbar wird. Ein Gestaltungs-Showcase von Kaiser Webdesign, kein Auftrag eines Yachtunternehmens.',scope:['Cineastische Scroll-Inszenierung','Editoriales Design und Produktpräsentation','Interaktiver Konzept-Showcase'],url:'https://cra4zzy.github.io/Luxury-Yacht-/'},
 butz:{title:'Butz-Bauwelt',category:'KUNDENPROJEKT / BAU & WOHNEN',short:'BAU & WOHNEN',image:'assets/references/butz-bauwelt-hires.webp',alt:'Webdesign für Butz-Bauwelt mit Architekturmotiv und roten Akzenten',caption:'Ein Familienbetrieb. Ein klarer Auftritt. Raum für Leistungen, Projekte und Vertrauen.',description:'Die Bildwelt rückt das Ergebnis der Arbeit in den Mittelpunkt: ein Zuhause. Eine klare Hierarchie führt vom ersten Eindruck zu den Leistungen und zum persönlichen Kontakt. Rote Akzente verbinden Orientierung und Wiedererkennung.',scope:['Individuelle Websitegestaltung','Leistungs- und Projektpräsentation','Strukturierte Kontaktführung'],url:'https://www.butz-bauwelt.de/'},
 avanti:{title:'Avanti Haarstudio',category:'KUNDENPROJEKT / BEAUTY & LIFESTYLE',short:'BEAUTY & LIFESTYLE',image:'assets/references/ref-03-avanti-haarstudio-v8.webp',alt:'Avanti Haarstudio Website mit heller Fläche und editorialer Typografie',caption:'Persönlich statt beliebig. Ein ruhiger Auftritt, der Atmosphäre und Beratung zusammenbringt.',description:'Großzügige Abstände, ruhige Farben und eine bewusst gesetzte Typografie geben der Persönlichkeit des Salons Raum. Bilder und Inhalte arbeiten zusammen, damit Besucher ein Gefühl für den Salon und sein Angebot bekommen.',scope:['Visuelle Gestaltung','Salon- und Leistungsdarstellung','Ergänzender Social-Media-Content'],url:'https://haarstudio-avanti.de/'},
 andreas:{title:'Fahrschule Andreas',category:'KUNDENPROJEKT / SCHULUNG',short:'SCHULUNG & PRÜFSERVICE',image:'assets/references/ref-01-gabelstaplerfahrschule-v8.webp',alt:'Website der Gabelstaplerfahrschule Andreas mit dunklem Hintergrund und gelber Signalfarbe',caption:'Kompetenz auf den ersten Blick. Schulungen und Prüfservice verständlich präsentiert.',description:'Das Thema verlangt Klarheit und Verlässlichkeit. Eine kräftige Bildsprache, deutliche Überschriften und gelbe Akzente machen das Angebot schnell erfassbar und heben die nächsten Schritte hervor.',scope:['Individuelles Webdesign','Strukturierung des Leistungsangebots','Deutlich hervorgehobene Kontaktwege'],url:'https://gabelstaplerfahrschule-andreas.de/'},
 stern:{title:'Der Stern',category:'KUNDENPROJEKT / GASTRONOMIE',short:'GASTRONOMIE',image:'assets/references/ref-05-der-stern-v2.webp',alt:'Atmosphärische Website für die Bar Der Stern in Dinkelsbühl',caption:'Ein Vorgeschmack auf den Abend. Atmosphäre, Charakter und ein direkter Weg zum Besuch.',description:'Dunkle Töne und die Bildwelt der Bar vermitteln die Atmosphäre bereits vor dem Besuch. Eine prägnante Typografie und zurückhaltende Akzente führen durch das Angebot.',scope:['Websitegestaltung für Gastronomie','Atmosphärische Bildpräsentation','Klare Informationshierarchie'],url:'https://www.xn--stern-dinkelsbhl-wzb.de/'},
 kopp:{title:'Kopp-Dach',category:'KUNDENPROJEKT / DACHHANDWERK',short:'DACHHANDWERK',image:'assets/references/kopp-dach.png',alt:'Kopp-Dach Website mit Dacharbeiten und rot-weißer Typografie',description:'Ein prägnanter Webauftritt für Peter Kopp aus Mönchsroth. Eine dunkle Bildbühne, kräftige rote Akzente und große Typografie geben dem Dachhandwerk ein eigenständiges Gesicht. Die Navigation macht Leistungen, Projekte und Kontakt schnell zugänglich.',scope:['Markante Websitegestaltung','Klare Leistungs- und Projektnavigation','Direkte Kontaktwege'],url:'https://kopp-dach.de/'}
};
const keys=['dv','butz','avanti','andreas','stern'];
function selectProject(key){const p=projects[key];if(!p||!keys.includes(key))return;const img=$('[data-feature-image]');img.src=p.image;img.alt=p.alt;$('[data-feature-title]').textContent=p.title;$('[data-feature-description]').textContent=p.caption;$('[data-feature-category]').textContent=p.short;$('[data-feature-index]').textContent=`0${keys.indexOf(key)+1} / 05`;$('[data-feature-details]').dataset.openProject=key;$('[data-feature-details]').setAttribute('aria-label',`Details zu ${p.title}`);$('.project-image').dataset.openProject=key;$('.project-image').setAttribute('aria-label',`Projekt ${p.title} im Detail ansehen`);$$('[data-project]').forEach(b=>{const active=b.dataset.project===key;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});$('[data-project-status]').textContent=`Ausgewählt: ${p.title}`;}
$$('[data-project]').forEach(b=>b.addEventListener('click',()=>selectProject(b.dataset.project)));
const projectDialog=$('[data-project-dialog]'),reelDialog=$('[data-reel-dialog]');let previousFocus;
function showDialog(dialog){previousFocus=document.activeElement;dialog.showModal();document.body.classList.add('dialog-open');}
function releaseDialog(){document.body.classList.remove('dialog-open');previousFocus?.focus({preventScroll:true});}
function openProject(key){const p=projects[key];if(!p)return;$('#dialog-title').textContent=p.title;$('[data-dialog-category]').textContent=p.category;const img=$('[data-dialog-image]');img.src=p.image;img.alt=p.alt;$('[data-dialog-description]').textContent=p.description;const ul=$('[data-dialog-scope]');ul.replaceChildren(...p.scope.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));const link=$('[data-dialog-link]');link.hidden=!p.url;if(p.url){link.href=p.url;link.target='_blank';link.rel='noopener noreferrer';}showDialog(projectDialog);projectDialog.scrollTop=0;}
$$('[data-open-project]').forEach(b=>b.addEventListener('click',()=>openProject(b.dataset.openProject)));
$('[data-close-dialog]').addEventListener('click',()=>projectDialog.close());projectDialog.addEventListener('close',releaseDialog);
$$('[data-open-reel]').forEach(b=>b.addEventListener('click',()=>{showDialog(reelDialog);const v=$('video',reelDialog);v.play().catch(()=>{});}));
$('[data-close-reel]').addEventListener('click',()=>reelDialog.close());reelDialog.addEventListener('close',()=>{$('video',reelDialog).pause();releaseDialog();});
[projectDialog,reelDialog].forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}));
// Play visible reels silently; preserve deliberate pauses and reduced-motion preferences.
const inlineReels=$$('[data-inline-reel]');
const reelState=new Map(inlineReels.map(v=>[v,{visible:false,pausedByUser:false}]));
function syncReels(){inlineReels.forEach(v=>{const state=reelState.get(v);if(!state.visible||document.hidden||reelDialog.open||projectDialog.open){v.pause();return;}if(!motion.matches&&!state.pausedByUser)v.play().catch(()=>{});});}
inlineReels.forEach(v=>{
 v.muted=true;
 v.addEventListener('pause',()=>{const state=reelState.get(v);if(state.visible&&!document.hidden&&!reelDialog.open&&!projectDialog.open)state.pausedByUser=true;});
 v.addEventListener('play',()=>{reelState.get(v).pausedByUser=false;});
 v.addEventListener('volumechange',()=>{if(!v.muted)inlineReels.filter(other=>other!==v).forEach(other=>{other.muted=true;});});
});
if('IntersectionObserver' in window){const reelsObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{reelState.get(e.target).visible=e.isIntersecting;});syncReels();},{threshold:.2});inlineReels.forEach(v=>reelsObserver.observe(v));}
document.addEventListener('visibilitychange',syncReels);
motion.addEventListener('change',()=>{if(motion.matches)inlineReels.forEach(v=>v.pause());else syncReels();});
new MutationObserver(syncReels).observe(reelDialog,{attributes:true,attributeFilter:['open']});
new MutationObserver(syncReels).observe(projectDialog,{attributes:true,attributeFilter:['open']});
// Animate only nonessential movement, never hide the page pending JavaScript.
if('IntersectionObserver' in window && !motion.matches){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('reveal');observer.unobserve(e.target);}}),{threshold:.12});$$('.intro-grid,.section-heading,.motion-head,.motion-stage,.motion-notes article,.studio-copy,.process-grid article').forEach(el=>observer.observe(el));}
$$('[data-year]').forEach(el=>el.textContent=String(new Date().getFullYear()));
const form=$('[data-contact-form]');
const projectFields=form?.querySelector('[data-project-fields]');
const formSubject=form?.querySelector('[data-form-subject]');
const formDrafts=new Map();
const projectForms={
 'Neue Website':{
  subject:'Projektanfrage — Neue Website — Kaiser Webdesign',
  html:`<label>Unternehmen / Branche <span class="optional">optional</span><input name="company_industry" autocomplete="organization" placeholder="Was machst du / was macht dein Unternehmen?"></label><label>Bestehende Website / Domain <span class="optional">optional</span><input name="website_domain" inputmode="url" placeholder="Falls bereits vorhanden"></label><label>Was soll die neue Website für dich erreichen? <span aria-hidden="true">*</span><textarea name="message" required rows="3" placeholder="Zum Beispiel mehr Anfragen, Leistungen besser erklären oder professioneller auftreten."></textarea></label>`
 },
 'Relaunch':{
  subject:'Projektanfrage — Relaunch — Kaiser Webdesign',
  html:`<label>Deine aktuelle Website <span aria-hidden="true">*</span><input name="current_website" required inputmode="url" placeholder="z. B. deinunternehmen.de"></label><label>Was soll unbedingt erhalten bleiben? <span class="optional">optional</span><input name="keep_existing" placeholder="Inhalte, Funktionen, Farben oder etwas anderes?"></label><label>Was soll beim Relaunch besser werden? <span aria-hidden="true">*</span><textarea name="message" required rows="3" placeholder="Was stört dich aktuell und was soll die neue Website besser lösen?"></textarea></label>`
 },
 'Social Media':{
  subject:'Projektanfrage — Social Media — Kaiser Webdesign',
  html:`<label>Unternehmen / Social-Profil <span class="optional">optional</span><input name="social_profile" placeholder="Unternehmen, Instagram, TikTok oder LinkedIn"></label><label>Welche Plattformen sind relevant? <span aria-hidden="true">*</span><input name="social_platforms" required placeholder="z. B. Instagram & TikTok"></label><label>Was möchtest du mit deinem Content erreichen? <span aria-hidden="true">*</span><textarea name="message" required rows="3" placeholder="Zum Beispiel Reichweite, mehr Anfragen, Recruiting oder einen professionelleren Auftritt."></textarea></label>`
 },
 'Noch offen':{
  subject:'Projektanfrage — Noch offen — Kaiser Webdesign',
  html:`<label>Unternehmen / aktuelle Website <span class="optional">optional</span><input name="company_website" autocomplete="organization" placeholder="Falls vorhanden"></label><label>Wobei bist du dir noch unsicher? <span class="optional">optional</span><input name="open_question" placeholder="Website, Relaunch, Social Media oder etwas dazwischen?"></label><label>Erzähl mir kurz, wo du gerade stehst. <span aria-hidden="true">*</span><textarea name="message" required rows="3" placeholder="Was möchtest du verbessern oder erreichen? Ich helfe dir bei der Einordnung."></textarea></label>`
 }
};
function saveProjectDraft(type){if(!form||!projectFields||!type)return;const values={};projectFields.querySelectorAll('input,textarea').forEach(el=>values[el.name]=el.value);formDrafts.set(type,values);}
function renderProjectFields(type,{focus=false}={}){if(!projectFields)return;const config=projectForms[type]||projectForms['Noch offen'];projectFields.innerHTML=config.html;if(formSubject)formSubject.value=config.subject;const saved=formDrafts.get(type);if(saved)projectFields.querySelectorAll('input,textarea').forEach(el=>{if(Object.hasOwn(saved,el.name))el.value=saved[el.name];});if(focus)projectFields.querySelector('input,textarea')?.focus({preventScroll:true});}
if(form&&projectFields){let activeType=form.querySelector('input[name="project_type"]:checked')?.value||'Neue Website';renderProjectFields(activeType);form.querySelectorAll('input[name="project_type"]').forEach(input=>input.addEventListener('change',()=>{if(!input.checked)return;saveProjectDraft(activeType);activeType=input.value;renderProjectFields(activeType);}));}
form?.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity()||form.dataset.sending)return;const button=$('[type=submit]',form),label=$('[data-submit-label]',form),status=$('[data-form-status]',form);form.dataset.sending='true';form.setAttribute('aria-busy','true');button.disabled=true;label.textContent='Wird gesendet';status.textContent='Deine Anfrage wird übermittelt …';const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);try{const response=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'},signal:controller.signal});if(!response.ok)throw new Error('submission failed');location.assign(new URL('danke/',location.href).href);}catch(_){status.textContent='Der Versand konnte nicht bestätigt werden. Deine Eingaben bleiben erhalten. Versuche es erneut oder schreibe direkt an info@kaiser-webdesign.de.';}finally{clearTimeout(timeout);delete form.dataset.sending;form.removeAttribute('aria-busy');button.disabled=false;label.textContent='Anfrage senden';}});
})();
