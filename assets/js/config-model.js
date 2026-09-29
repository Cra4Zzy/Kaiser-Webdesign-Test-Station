(function(root){
'use strict';
const packages={start:{name:'Start',price:349,pages:1,rounds:1,description:'Ein klarer Anfang.',detail:'Ein Onepager · bis zu 5 Abschnitte · Basislayout'},business:{name:'Business',price:879,pages:5,rounds:2,description:'Platz für dein Unternehmen.',detail:'Bis zu 5 Seiten · abgestimmte Gestaltung'},premium:{name:'Premium',price:1449,pages:5,rounds:2,description:'Ein Auftritt, der bewegt.',detail:'Bis zu 5 Seiten · 1 cineastische Scroll-Sequenz'}};
// Prices are euros. Variable and bespoke services remain clearly qualified.
const raw=[
['sections','Inhalte','Zusätzlicher Abschnitt',39,'Ein weiterer Inhaltsabschnitt auf einer bestehenden Seite.', 'qty'],
['gallery','Inhalte','Projekt- & Bildergalerie',79,'Bis zu 12 gelieferte Bilder mit Vergrößerungsansicht.'],
['filter','Inhalte','Filterbare Projektgalerie',159,'Bis zu 12 Projekte und 3 Kategorien. Ersetzt die einfache Galerie.'],
['case','Inhalte','Projekt-Detailseite',119,'Eine eigene Seite pro Projekt mit gelieferten Texten und Bildern. Die Seite ist im Aufpreis enthalten.','qty'],
['compare','Inhalte','Vorher / Nachher',79,'Bis zu 3 Bildpaare mit interaktivem Vergleich.'],
['downloads','Inhalte','Downloadbereich',79,'Bis zu 10 öffentliche Dokumente, übersichtlich gruppiert.'],
['team','Inhalte','Team-Detailansichten',119,'Bis zu 6 Profile mit gelieferten Bildern und Texten.'],
['career','Inhalte','Karriere-Seite',159,'Arbeitgebervorstellung und bis zu 3 statische Stellen. Eigene Seite bereits enthalten.'],
['locations','Inhalte','Standortübersicht',119,'Bis zu 5 Standorte mit Kontaktangaben und Routenlinks.'],
['catalog','Inhalte','Durchsuchbarer Leistungskatalog',239,'Bis zu 20 Einträge, Kategorien und Suche. Ohne Warenkorb.'],
['pricelist','Inhalte','Interaktive Preisliste',119,'Bis zu 30 Positionen, nach Kategorien gegliedert.'],
['faq','Inhalte','Durchsuchbare FAQ',119,'Bis zu 25 gelieferte Antworten mit Suche und Kategorien.'],
['reviews','Inhalte','Gestaltete Kundenstimmen',59,'Bis zu 6 gelieferte und freigegebene Bewertungen.'],
['reviewfeed','Inhalte','Externes Bewertungs-Widget',119,'Integration eines vorhandenen Dienstes. Dessen Lizenzkosten sind separat.'],
['video','Erlebnis','Video-Hero',119,'Einbindung und Optimierung eines gelieferten Videos. Keine Videoproduktion.'],
['cinema','Erlebnis','Weitere Scroll-Sequenz',279,'Eine definierte cineastische Sequenz mit gelieferten Medien; genauer Aufwand nach Abstimmung.','qty','min'],
['motion','Erlebnis','Dezente Scroll-Animationen',119,'Abgestimmte Einblendungen für bis zu 5 Bereiche. Bei Premium inklusive.'],
['model','Erlebnis','Interaktives 3D-Modell',399,'Ein geeignetes geliefertes Modell mit Drehung und Zoom. Keine Modellerstellung.','','min'],
['booking','Funktionen','Terminbuchung',119,'Einrichtung und Einbindung eines bestehenden Buchungsdienstes. Anbietergebühren separat.'],
['form','Funktionen','Mehrstufige Anfrage',199,'Bis zu 3 Schritte, 12 Felder und einfache bedingte Fragen. Ersetzt das Standardformular.'],
['application','Funktionen','Bewerbungsformular',199,'Bis zu 10 Felder und ein geschützter PDF-Upload. Ohne Bewerberverwaltung.'],
['newsletter','Funktionen','Newsletter-Anmeldung',119,'Vorhandenen Dienst anbinden, inklusive Bestätigungsprozess. Anbietergebühren separat.'],
['search','Funktionen','Website-Suche',159,'Suche in bis zu 20 öffentlichen Inhaltsseiten.'],
['calculator','Funktionen','Einfacher Preisrechner',279,'Bis zu 5 Eingaben und eine gemeinsam definierte Berechnungslogik.','','min'],
['blog','Funktionen','Blog / News',359,'Pflegbare Übersicht, Beitragsvorlage und kurze Einweisung. Redaktionssystem enthalten.'],
['events','Funktionen','Pflegbare Veranstaltungen',279,'Terminübersicht, Detailansicht und Bearbeitung im Redaktionssystem.'],
['member','Kundenbereich','Mitgliederbereich',799,'Login, Passwortzurücksetzung, eine Mitgliederrolle und gemeinsame geschützte Inhalte.','','min'],
['role','Kundenbereich','Zusätzliche Benutzerrolle',159,'Eine weitere Rolle mit festgelegten Zugriffsrechten.','qty','min','member'],
['documents','Kundenbereich','Persönliche Kundendokumente',479,'Dokumente einzelnen Kunden geschützt zuordnen und zum Download bereitstellen.','','min','member'],
['uploads','Kundenbereich','Kunden-Uploads',399,'Ein definierter Uploadablauf mit Dateigrenzen und geschützter Speicherung.','','min','member'],
['dashboard','Kundenbereich','Persönliches Dashboard',559,'Übersicht mit bis zu 3 vereinbarten Datenbereichen.','','min','member'],
['status','Kundenbereich','Projektstatus',479,'Projektphasen, Statusanzeige und Aktualisierung durch den Betreiber.','','min','member'],
['notifications','Kundenbereich','Automatische E-Mails',239,'Bis zu 3 festgelegte Auslöser und E-Mail-Vorlagen.','','min','member'],
['portal','Kundenbereich','Individuelles Kundenportal',0,'Besondere Abläufe, individuelle Rechte oder Verknüpfungen. Umfang und Preis im Gespräch.','','quote'],
['copy','Service','Texterstellung',99,'Bis zu 500 Wörter pro Seite nach Kundenbriefing, eine Korrekturrunde.','qty'],
['language','Service','Zusätzliche Sprache',159,'159 € Einrichtung + 39 € je Inhaltsseite. Gelieferte Übersetzungen; eine zusätzliche Sprache.'],
['migration','Service','Inhalte übernehmen',119,'Bis zu 5 einfache Seiten aus einer zugänglichen bestehenden Website.','','min'],
['shop','Individuell','Onlineshop',0,'Produkte, Zahlung, Versand und Verwaltung stimmen wir individuell ab.','','quote'],
['subscription','Individuell','Bezahlte Mitgliedschaft',0,'Abos, Zahlungsanbieter und Zugangsregeln erfordern eine eigene Kalkulation.','','quote'],
['integration','Individuell','Schnittstelle / Anbindung',0,'Zum Beispiel CRM, Warenwirtschaft oder ein externer Datenbestand.','','quote']
];
const extras=raw.map(([id,category,name,price,description,type='',kind='',requires=''])=>({id,category,name,price,description,type,kind,requires}));
const care=[{id:'none',name:'Keine Betreuung',price:0},{id:'basic',name:'Technische Pflege',price:29},{id:'care',name:'Pflege + 30 Min. Änderungen',price:59},{id:'active',name:'Betreuung + 90 Min. Änderungen',price:119}];
function initial(){return {package:'business',pages:5,extras:{},care:'none',name:'Dein Unternehmen',industry:'service',style:'clear',color:'#32d8f5',accent2:'#ae70ff',background:'#f7f8f9',palette:'kaiser',dark:false,goal:'leads',content:{text:'open',images:'open',logo:'open'},sectionTitles:{},sectionOrder:[]};}
function normalize(s){const p=packages[s.package]||packages.business;const out={...s,pages:Math.max(1,Math.min(30,Math.round(Number(s.pages)||p.pages))),extras:{}};for(const x of extras){const q=Math.min(x.type==='qty'?20:1,Math.max(0,Math.floor(Number(s.extras?.[x.id])||0)));if(q)out.extras[x.id]=q;}if(out.extras.filter)delete out.extras.gallery;for(const x of extras)if(out.extras[x.id]&&x.requires)out.extras[x.requires]=1;return out;}
function setExtra(s,id,value){const next={...s,extras:{...s.extras,[id]:value}};if(value&&id==='gallery')delete next.extras.filter;if(value&&id==='filter')delete next.extras.gallery;if(id==='member'&&!value)extras.filter(x=>x.requires==='member').forEach(x=>delete next.extras[x.id]);return normalize(next);}
function calculate(input){const s=normalize(input),p=packages[s.package]||packages.business;let lines=[{id:'package',name:p.name+' · Grundpaket',amount:p.price}],quotes=[];const extraPages=Math.max(0,s.pages-p.pages);if(extraPages)lines.push({id:'pages',name:extraPages+' zusätzliche Inhaltsseite'+(extraPages===1?'':'n'),amount:extraPages*119});const totalPages=s.pages+(s.extras.case||0)+(s.extras.career||0);for(const x of extras){const q=s.extras[x.id]||0;if(!q||(x.id==='motion'&&s.package==='premium'))continue;if(x.kind==='quote'){quotes.push(x.name);continue;}let amount=x.id==='language'?159+39*totalPages:x.price*q;lines.push({id:x.id,name:(q>1?q+' × ':'')+x.name,amount,min:x.kind==='min'});}const monthly=(care.find(c=>c.id===s.care)||care[0]).price;return {state:s,lines,quotes,total:lines.reduce((a,l)=>a+l.amount,0),monthly,totalPages,minimum:lines.some(l=>l.min),portalReview:!!(s.extras.dashboard&&s.extras.status),saving:s.package==='start'&&s.pages>=5?Math.max(0,349+(s.pages-1)*119-(879+Math.max(0,s.pages-5)*119)):0};}
const api={packages,extras,care,initial,normalize,setExtra,calculate};root.KaiserConfig=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
