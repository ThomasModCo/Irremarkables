(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function e(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=e(i);fetch(i.href,s)}})();const ce=(r,t)=>r+Math.random()*(t-r),od=.3,ad={click:1.5,coin:1.4,punch:.6,kill:.55,hurt:1,whoosh:1.1,teleport:1.3,flame:.7,freeze:1.1,shatter:.8,tk:.55,slam:.75,invis:1.4,xray:1.3,morph:1.2,dupe:1,pickup:1.1,potion:1,fireball:1.6,explosion:1,landing:.95,grow:.8,nemesis:.8,death:.8,worldshift:1.2,cashout:.8};class cd{constructor(){this.ctx=null,this.enabled=(()=>{try{return localStorage.getItem("irr_sound")!=="0"}catch{return!0}})(),this.noiseBuf=null,this.last={},this._k=1,this._dk=1;for(const[t,e]of Object.entries(ad)){const n=this[t];this[t]=(...i)=>{this._k=e;try{n.apply(this,i)}finally{this._k=1}}}}unlock(){if(this.ctx){this.ctx.state==="suspended"&&this.ctx.resume(),this.startMusic();return}try{this.attach(new(window.AudioContext||window.webkitAudioContext))}catch{}this.startMusic()}async loadMusic(t){try{const e=await fetch(t);if(!e.ok)return;const n=await e.json();let i;if(n.uri.startsWith("data:")){const s=atob(n.uri.slice(n.uri.indexOf(",")+1));i=new Uint8Array(s.length);for(let o=0;o<s.length;o++)i[o]=s.charCodeAt(o)}else i=new Uint8Array(await(await fetch(new URL(n.uri,new URL(t,location.href)))).arrayBuffer());this.musicBytes=i.buffer,this.musicLoop=[n.loopStart??null,n.loopEnd??null],this.startMusic()}catch(e){console.warn("music unavailable",e)}}async startMusic(){if(!(!this.ctx||!this.enabled||this.musicSrc||this._musicBusy)&&!(!this.musicBuf&&!this.musicBytes)){this._musicBusy=!0;try{if(this.musicBuf||(this.musicBuf=await this.ctx.decodeAudioData(this.musicBytes.slice(0))),!this.enabled||this.musicSrc)return;const t=this.musicBuf,e=t.getChannelData(0);let n=0,i=e.length-1;for(;n<6e3&&Math.abs(e[n])<1e-4;)n++;for(;i>e.length-6e3&&Math.abs(e[i])<1e-4;)i--;const s=this.ctx.createBufferSource();s.buffer=t,s.loop=!0;const o=n/t.sampleRate,[a,c]=this.musicLoop||[];s.loopStart=a!=null?o+a:o,s.loopEnd=c!=null?Math.min(o+c,(i+1)/t.sampleRate):(i+1)/t.sampleRate;const l=this.ctx.createGain(),h=this.ctx.currentTime;l.gain.setValueAtTime(1e-4,h),l.gain.exponentialRampToValueAtTime(od,h+3),s.connect(l).connect(this.master),s.start(h,o),this.musicSrc=s,this.musicGain=l}catch(t){console.warn("music decode failed",t)}finally{this._musicBusy=!1}}}stopMusic(){if(!this.musicSrc)return;const t=this.musicSrc,e=this.musicGain,n=this.ctx.currentTime;e.gain.cancelScheduledValues(n),e.gain.setValueAtTime(Math.max(e.gain.value,1e-4),n),e.gain.exponentialRampToValueAtTime(1e-4,n+.6),t.stop(n+.7),this.musicSrc=null,this.musicGain=null}attach(t){this.ctx=t;const e=t.sampleRate;this.noiseBuf=t.createBuffer(1,e*2,e);const n=this.noiseBuf.getChannelData(0);for(let u=0;u<n.length;u++)n[u]=Math.random()*2-1;this.master=t.createGain(),this.master.gain.value=.62;const i=t.createDynamicsCompressor();i.threshold.value=-14,i.knee.value=10,i.ratio.value=4,i.attack.value=.004,i.release.value=.18,this.master.connect(i).connect(t.destination),this.dry=t.createGain();const s=t.createWaveShaper(),o=new Float32Array(1024);for(let u=0;u<o.length;u++){const d=u/511.5-1;o[u]=Math.tanh(d*1.6)/Math.tanh(1.6)}s.curve=o,s.oversample="2x",this.dry.connect(s).connect(this.master),this.wet=t.createGain();const a=t.createConvolver(),c=Math.floor(e*1.8),l=t.createBuffer(2,c,e);for(let u=0;u<2;u++){const d=l.getChannelData(u);let f=0;for(let g=0;g<c;g++){const _=g/e,p=.043+u*.004,m=_%p/p;f+=2*Math.PI*(3200*(1-m)*(1-m)+250)/e,d[g]=(Math.random()*2-1)*.55*Math.exp(-_*3.4)+Math.sin(f)*.35*Math.exp(-_*4.2)}}a.buffer=l;const h=t.createGain();h.gain.value=.32,this.wet.connect(a).connect(h).connect(this.master)}play(t,e=1,...n){if(!(!this.on||e<=.02)){this._dk=e;try{this[t](...n)}finally{this._dk=1}}}setEnabled(t){this.enabled=t,this.ctx&&(t?this.startMusic():this.stopMusic());try{localStorage.setItem("irr_sound",t?"1":"0")}catch{}}get t(){return this.ctx.currentTime+.005}get on(){return!!this.ctx&&this.enabled}gate(t,e){const n=this.ctx.currentTime;return(this.last[t]??-1)+e>n?!1:(this.last[t]=n,!0)}out(t,{a:e=.005,peak:n=.3,hold:i=0,d:s=.2,send:o=.1,pan:a=0}){n*=this._k*this._dk;const c=this.ctx.createGain();c.gain.setValueAtTime(1e-4,t),c.gain.exponentialRampToValueAtTime(Math.max(n,2e-4),t+e),i&&c.gain.setValueAtTime(Math.max(n,2e-4),t+e+i),c.gain.exponentialRampToValueAtTime(1e-4,t+e+i+s);let l=c;if(a&&this.ctx.createStereoPanner){const h=this.ctx.createStereoPanner();h.pan.value=a,c.connect(h),l=h}if(l.connect(this.dry),o){const h=this.ctx.createGain();h.gain.value=o,l.connect(h).connect(this.wet)}return{g:c,end:t+e+i+s+.05}}vibrato(t,e,n,i,s,o=0){const a=this.ctx.createOscillator(),c=this.ctx.createGain();a.frequency.value=n,c.gain.setValueAtTime(0,e),c.gain.linearRampToValueAtTime(i,e+o+.05),a.connect(c).connect(t),a.start(e),a.stop(s)}osc({t=this.t,type:e="sine",f:n=440,f2:i=n,glide:s="exp",curve:o=null,dur:a=.2,a:c=.005,peak:l=.2,hold:h=0,d:u=null,lp:d=null,lp2:f=null,q:g=.7,vib:_=null,detune:p=0,send:m=.1,pan:x=0}){const y=this.ctx,v=y.createOscillator();v.type=e,v.detune.value=p,o?v.frequency.setValueCurveAtTime(Float32Array.from(o,b=>Math.max(1,n*b)),t,a):(v.frequency.setValueAtTime(n,t),i!==n&&(s==="lin"?v.frequency.linearRampToValueAtTime(i,t+a):v.frequency.exponentialRampToValueAtTime(Math.max(i,1),t+a)));const R=this.out(t,{a:c,peak:l,hold:h,d:u??Math.max(.01,a-c-h),send:m,pan:x});let T=v;if(d){const b=y.createBiquadFilter();b.type="lowpass",b.Q.value=g,b.frequency.setValueAtTime(d,t),f&&b.frequency.exponentialRampToValueAtTime(f,t+a),v.connect(b),T=b}return T.connect(R.g),_&&this.vibrato(v.frequency,t,_[0],_[1],R.end,_[2]||0),v.start(t),v.stop(R.end),v}noise({t=this.t,dur:e=.3,a:n=.004,peak:i=.3,hold:s=0,d:o=null,type:a="bandpass",f:c=1e3,f2:l=c,fcurve:h=null,q:u=1,send:d=.08,pan:f=0}){const g=this.ctx,_=g.createBufferSource();_.buffer=this.noiseBuf,_.loop=!0,_.playbackRate.value=ce(.9,1.1);const p=g.createBiquadFilter();p.type=a,p.Q.value=u,h?p.frequency.setValueCurveAtTime(Float32Array.from(h),t,e):(p.frequency.setValueAtTime(c,t),l!==c&&p.frequency.exponentialRampToValueAtTime(Math.max(l,20),t+e));const m=this.out(t,{a:n,peak:i,hold:s,d:o??Math.max(.01,e-n-s),send:d,pan:f});_.connect(p).connect(m.g),_.start(t,Math.random()*1.5),_.stop(m.end)}thump(t,e=.5,n=100){this.osc({t,type:"sine",f:n*2.4,f2:n*.5,dur:.16,a:.002,peak:e,send:.05}),this.noise({t,dur:.025,peak:e*.5,type:"lowpass",f:3e3,send:0})}timp(t,e,n=.4,i=1){this.osc({t:e,type:"sine",f:t*1.45,f2:t,dur:.05,a:.002,peak:n,hold:0,d:i,send:.25}),this.osc({t:e,type:"triangle",f:t*2.2,f2:t*1.5,dur:.05,a:.002,peak:n*.25,d:i*.6,send:.2}),this.noise({t:e,dur:.07,peak:n*.45,type:"lowpass",f:900,send:.1})}crash(t,e=.15,n=1.2){this.noise({t,dur:n,a:.002,peak:e,type:"highpass",f:5200,f2:3200,q:.5,send:.3}),this.noise({t,dur:n*.6,a:.002,peak:e*.6,type:"bandpass",f:7800,q:2.5,send:.2})}brass(t,e,n=.3,i=.12,{fall:s=0,vib:o=!1,wah:a=!1}={}){const c=this.ctx;for(const l of t)for(const h of[-9,7]){const u=c.createOscillator();u.type="sawtooth",u.detune.value=h,u.frequency.setValueAtTime(l,e),s&&u.frequency.exponentialRampToValueAtTime(l*s,e+n);const d=c.createBiquadFilter();d.type="lowpass",d.Q.value=1.2,d.frequency.setValueAtTime(320,e),d.frequency.exponentialRampToValueAtTime(a?1600:3200,e+(a?n*.35:.035)),d.frequency.exponentialRampToValueAtTime(a?380:1300,e+n);const f=this.out(e,{a:.018,peak:i/t.length,hold:n*.55,d:n*.45+.08,send:.22});u.connect(d).connect(f.g),o&&this.vibrato(u.frequency,e,5.5,l*.025,f.end,n*.3),u.start(e),u.stop(f.end)}}bell(t,e,n=.1,i=.4,s=3.5,o=.2){const a=this.ctx,c=a.createOscillator(),l=a.createOscillator(),h=a.createGain();c.frequency.value=t,l.frequency.value=t*s,h.gain.setValueAtTime(t*2.2,e),h.gain.exponentialRampToValueAtTime(t*.05,e+i),l.connect(h).connect(c.frequency);const u=this.out(e,{a:.002,peak:n,d:i,send:o});c.connect(u.g),c.start(e),l.start(e),c.stop(u.end),l.stop(u.end)}boing(t,e,n=.2,i=.55,s="triangle"){const a=[];for(let c=0;c<64;c++){const l=c/63;a.push(1+.55*Math.sin(l*i*2*Math.PI*13)*Math.exp(-l*4)+l*.15)}this.osc({t:e,type:s,f:t,curve:a,dur:i,a:.004,peak:n,send:.25})}slide(t,e,n,i,s=.1){this.osc({t:n,type:"sine",f:t,f2:e,glide:"lin",dur:i,a:.03,peak:s,vib:[6.5,t*.025,.05],send:.25})}click(){if(!this.on)return;const t=this.t;this.osc({t,type:"sine",f:1900,f2:1500,dur:.045,peak:.12,send:0}),this.noise({t,dur:.02,peak:.07,f:2600,q:6,send:0})}step(t=1,e=!1,n=!1){if(!this.on||!this.gate(n?"stepP":"step",n?.12:.07))return;const i=this.t,s=ce(.9,1.12)*(e?.6:1);this.osc({t:i,type:"sine",f:150*s,f2:70*s,dur:.06,a:.002,peak:e?.22:.1,send:.02,pan:t*.15}),this.noise({t:i+.004,dur:.045,peak:e?.08:.06,type:"lowpass",f:ce(900,1300)*s,f2:300,q:.6,send:.02,pan:t*.15})}coin(){if(!this.on||!this.gate("coin",.04))return;const t=this.t,e=ce(.98,1.03);this.bell(1568*e,t,.12,.22,2,.12),this.bell(2093*e,t+.07,.11,.38,2,.15)}punch(){if(!this.on||!this.gate("punch",.09))return;const t=this.t,e=ce(.88,1.12);this.osc({t,type:"sine",f:190*e,f2:70*e,dur:.11,a:.003,peak:.45,send:.04}),this.noise({t,dur:.05,peak:.16,type:"lowpass",f:1600*e,f2:500,q:.7,send:.04})}kill(){if(!this.on||!this.gate("kill",.12))return;const t=this.t,e=ce(.9,1.1);this.osc({t,type:"sine",f:170*e,f2:60*e,dur:.16,a:.003,peak:.45,send:.06}),this.timp(104*e,t,.3,.5),this.osc({t:t+.03,type:"triangle",f:1100*e,f2:260,dur:.16,peak:.07,send:.2})}hurt(){if(!this.on||!this.gate("hurt",.08))return;const t=this.t;this.thump(t,.35,85),this.osc({t,type:"square",f:330,f2:150,dur:.24,peak:.12,lp:1400,vib:[22,25],send:.12})}whoosh(){if(!this.on||!this.gate("whoosh",.11))return;const t=this.t,e=ce(.22,.32),n=ce(280,420),i=ce(1900,3e3);this.noise({t,dur:e,a:e*.45,peak:.28,d:e*.55,fcurve:[n,i,i*.9,n*1.5],q:1.8,send:.1,pan:ce(-.4,.4)})}teleport(){if(!this.on)return;const t=this.t;[880,1320,1760,2640].forEach((e,n)=>this.bell(e,t+n*.035,.07,.25,1.5,.3)),this.osc({t,type:"sine",f:220,f2:2600,dur:.26,peak:.1,vib:[32,90],send:.3}),this.noise({t,dur:.18,peak:.08,type:"highpass",f:4e3,send:.2})}flame(){if(!this.on)return;const t=this.t;this.noise({t,dur:1.6,a:.12,peak:.42,hold:1.1,d:.35,type:"lowpass",f:650,f2:900,q:.8,send:.08}),this.noise({t,dur:1.6,a:.1,peak:.1,hold:1.1,d:.4,f:2600,q:.7,send:.05}),this.osc({t,type:"sawtooth",f:52,f2:60,dur:1.6,a:.1,peak:.12,hold:1.1,d:.4,lp:180,send:0});for(let e=0;e<16;e++)this.noise({t:t+ce(.05,1.5),dur:.012,peak:ce(.08,.18),f:ce(2500,6e3),q:3,send:0})}freeze(){if(!this.on)return;const t=this.t;for(let e=0;e<11;e++)this.bell(ce(4800,6200)-e*300,t+e*.045,ce(.04,.07),ce(.15,.35),2.7,.35);this.noise({t,dur:.8,a:.02,peak:.12,type:"highpass",f:6500,f2:2600,q:.7,send:.2}),this.osc({t,type:"sine",f:1800,f2:620,dur:.7,peak:.06,vib:[9,40],send:.3})}shatter(){if(!this.on||!this.gate("shatter",.05))return;const t=this.t;this.thump(t,.25,140),this.crash(t,.22,.45);for(let e=0;e<14;e++)this.bell(ce(3e3,9e3),t+ce(0,.16),ce(.04,.08),ce(.06,.22),ce(1.3,3.1),.2)}tk(){if(!this.on)return;const t=this.t;this.osc({t,type:"sine",f:330,f2:560,glide:"lin",dur:1.3,a:.2,peak:.12,hold:.7,d:.4,vib:[6,14,.1],send:.4}),this.osc({t,type:"sine",f:495,f2:840,glide:"lin",dur:1.3,a:.3,peak:.04,hold:.6,d:.4,vib:[6.3,20,.1],send:.4}),this.osc({t,type:"triangle",f:82,f2:110,dur:1.3,a:.15,peak:.08,hold:.8,d:.35,send:.1})}slam(){if(!this.on||!this.gate("slam",.06))return;const t=this.t;this.thump(t,.7,62),this.timp(65,t,.45,1.1),this.noise({t,dur:.42,peak:.48,type:"lowpass",f:500,f2:60,q:.6,send:.12}),this.crash(t+.01,.14,.9)}invis(){if(!this.on)return;const t=this.t;this.noise({t,dur:.48,a:.03,peak:.24,f:3200,f2:280,q:3,send:.35}),this.osc({t,type:"sine",f:1300,f2:140,dur:.48,peak:.1,vib:[18,60],send:.35})}xray(){if(!this.on)return;const t=this.t,e=[];for(let n=0;n<48;n++)e.push(1+.45*Math.sign(Math.sin(n/47*Math.PI*2*4)));this.osc({t,type:"square",f:620,curve:e,dur:.5,a:.01,peak:.07,lp:2400,send:.25}),this.bell(2490,t+.5,.08,.5,1.5,.35)}morph(){if(!this.on)return;const t=this.t;this.boing(220,t,.18,.6),this.osc({t:t+.05,type:"sine",f:420,curve:[1,1.8,2.2,1.4,.7,.8],dur:.5,peak:.08,send:.25})}dupe(){if(!this.on)return;const t=this.t;[0,.11,.22].forEach((e,n)=>this.osc({t:t+e,type:"sine",f:300+n*120,f2:950+n*300,dur:.08,peak:.2,send:.15})),this.bell(1760,t+.3,.06,.3,2,.3)}pickup(){if(!this.on||!this.gate("pickup",.05))return;const t=this.t;[1047,1319,1568,2093].forEach((e,n)=>this.bell(e,t+n*.05,.09,.3,2,.2))}potion(){if(!this.on)return;const t=this.t;[0,.09,.18].forEach(e=>this.osc({t:t+e,type:"sine",f:ce(230,280),f2:ce(480,560),dur:.07,peak:.2,send:.1})),this.slide(620,1900,t+.26,.34,.08),[2093,2637].forEach((e,n)=>this.bell(e,t+.55+n*.06,.06,.35,2,.3))}fireball(){if(!this.on)return;const t=this.t;this.noise({t,dur:.6,a:.04,peak:.45,type:"lowpass",fcurve:[200,1600,900,500],q:.9,send:.12}),this.osc({t,type:"sawtooth",f:70,f2:150,dur:.5,peak:.14,lp:300,send:0});for(let e=0;e<8;e++)this.noise({t:t+ce(.05,.5),dur:.012,peak:ce(.08,.15),f:ce(2500,6e3),q:3,send:0})}explosion(){if(!this.on||!this.gate("explosion",.08))return;const t=this.t;this.thump(t,.85,52),this.noise({t,dur:1.4,a:.003,peak:.62,type:"lowpass",f:1400,f2:70,q:.7,send:.25}),this.timp(55,t,.45,1.5),this.crash(t+.01,.2,1.4);for(let e=0;e<10;e++)this.noise({t:t+ce(.1,.9),dur:.015,peak:ce(.06,.12),f:ce(1500,4500),q:2,send:.05})}landing(){if(!this.on)return;const t=this.t;this.thump(t,.85,48),this.noise({t,dur:.95,peak:.5,type:"lowpass",f:900,f2:55,q:.7,send:.22}),this.timp(62,t,.55,1.3),this.crash(t+.01,.2,1.3),this.brass([98,147,196],t+.02,.38,.16)}grow(){if(!this.on)return;const t=this.t;this.slide(280,1150,t,.8,.09),this.osc({t,type:"sawtooth",f:55,f2:110,dur:.8,a:.05,peak:.16,lp:420,vib:[5,2],send:.1}),this.timp(73,t+.78,.35,.8)}nemesis(){if(!this.on)return;const t=this.t;this.brass([110,131,156],t,.13,.2),this.timp(55,t,.35,.5),this.brass([110,131,156],t+.2,.13,.2),this.timp(55,t+.2,.35,.5),this.brass([104,123,147,175],t+.46,1.05,.26,{vib:!0}),this.timp(52,t+.46,.5,1.4),this.crash(t+.46,.14,1.4)}death(){if(!this.on)return;const t=this.t;[233,220,208].forEach((e,n)=>this.brass([e],t+n*.36,.3,.2,{wah:!0})),this.brass([196],t+1.08,.95,.22,{wah:!0,vib:!0,fall:.94})}worldshift(){if(!this.on)return;const t=this.t;this.noise({t,dur:1.4,a:.3,peak:.14,fcurve:[300,900,2400,4200,2e3],q:4,send:.3}),this.osc({t,type:"sawtooth",f:110,f2:220,dur:1.3,a:.2,peak:.1,lp:300,lp2:2600,q:4,send:.3}),this.bell(1760,t+1.2,.08,.6,1.5,.4)}cashout(){if(!this.on)return;const t=this.t;[523,659,784].forEach((e,n)=>this.brass([e],t+n*.1,.09,.15)),this.brass([523,659,784,1047],t+.32,.7,.24,{vib:!0}),this.timp(131,t+.32,.35,.9),this.crash(t+.32,.1,1),[2093,2637,3136].forEach((e,n)=>this.bell(e,t+.36+n*.07,.05,.4,2,.35))}}const Rt=new cd,qe=[{id:"flight",name:"Flight",color:9358335,rare:!1,desc:"Take to the sky. Toggle to soar above the city and dive back down.",cooldown:1.2,counter:"telekinesis"},{id:"speed",name:"Super Speed",color:16770140,rare:!1,desc:"A blinding burst of speed. Cross whole blocks before anyone reacts.",cooldown:5,counter:"cryo"},{id:"invisibility",name:"Invisibility",color:12568542,rare:!1,desc:"Fade out completely. Enemies lose track of you while you stalk them.",cooldown:10,counter:"xray"},{id:"telekinesis",name:"Telekinesis",color:12614655,rare:!1,desc:"HOLD to seize the nearest enemy or object, reel it in, and hurl it where you aim. Release early to drop it.",cooldown:6,counter:"teleport"},{id:"pyro",name:"Pyrokinesis",color:16742972,rare:!0,desc:"Channel a roaring cone of flame that incinerates everything ahead.",cooldown:6,counter:"cryo"},{id:"cryo",name:"Cryokinesis",color:10351359,rare:!0,desc:"Release a freezing nova. Frozen enemies shatter with a single hit.",cooldown:9,counter:"pyro"},{id:"teleport",name:"Teleportation",color:8257482,rare:!1,desc:"Blink instantly through space in the direction you are moving.",cooldown:3,counter:"speed"},{id:"xray",name:"X-Ray Vision",color:13696860,rare:!1,desc:"See through the city itself. Enemies and loot glow behind every wall.",cooldown:8,counter:"invisibility"},{id:"shapeshift",name:"Shapeshifting",color:16752098,rare:!1,desc:"Become a piece of scenery. Nobody looks twice at a bin — until it moves. Strike from cover for an instant kill.",cooldown:12,counter:"xray"},{id:"duplication",name:"Duplication",color:16757373,rare:!1,desc:"Split into a squad of clones that hunt everything around you.",cooldown:15,counter:"pyro"}],Qc=r=>qe.find(t=>t.id===r);function ld(r){const t=Qc(r);return Qc(t?.counter)||qe[Math.floor(Math.random()*qe.length)]}/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const xc="166",hd=0,tl=1,ud=2,Kh=1,jh=2,Fn=3,Wn=0,Ve=1,Ye=2,hi=0,cs=1,el=2,nl=3,il=4,dd=5,Si=100,fd=101,pd=102,md=103,gd=104,_d=200,xd=201,vd=202,yd=203,Pa=204,Ia=205,Md=206,Sd=207,bd=208,wd=209,Td=210,Ad=211,Ed=212,Rd=213,Cd=214,Ld=0,Pd=1,Id=2,oo=3,Dd=4,Ud=5,Nd=6,kd=7,vc=0,Od=1,Fd=2,Gn=0,Bd=1,zd=2,Hd=3,$h=4,Vd=5,Gd=6,Wd=7,sl="attached",Xd="detached",Zh=300,fs=301,ps=302,Da=303,Ua=304,Mo=306,Ti=1e3,ai=1001,ao=1002,He=1003,Jh=1004,zs=1005,Ke=1006,Qr=1007,Hn=1008,Xn=1009,Qh=1010,tu=1011,Ks=1012,yc=1013,Ai=1014,yn=1015,tr=1016,Mc=1017,Sc=1018,ms=1020,eu=35902,nu=1021,iu=1022,en=1023,su=1024,ru=1025,ls=1026,gs=1027,bc=1028,wc=1029,ou=1030,Tc=1031,Ac=1033,to=33776,eo=33777,no=33778,io=33779,Na=35840,ka=35841,Oa=35842,Fa=35843,Ba=36196,za=37492,Ha=37496,Va=37808,Ga=37809,Wa=37810,Xa=37811,qa=37812,Ya=37813,Ka=37814,ja=37815,$a=37816,Za=37817,Ja=37818,Qa=37819,tc=37820,ec=37821,so=36492,nc=36494,ic=36495,au=36283,sc=36284,rc=36285,oc=36286,cu=2200,ac=2201,qd=2202,js=2300,$s=2301,Oo=2302,ss=2400,rs=2401,co=2402,Ec=2500,Yd=2501,Kd=0,lu=1,cc=2,jd=3200,$d=3201,So=0,Zd=1,ri="",_e="srgb",Oe="srgb-linear",Rc="display-p3",bo="display-p3-linear",lo="linear",fe="srgb",ho="rec709",uo="p3",Ui=7680,rl=519,Jd=512,Qd=513,tf=514,hu=515,ef=516,nf=517,sf=518,rf=519,lc=35044,Fo=35048,ol="300 es",Vn=2e3,fo=2001;class Pi{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const i=this._listeners[t];if(i!==void 0){const s=i.indexOf(e);s!==-1&&i.splice(s,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const i=n.slice(0);for(let s=0,o=i.length;s<o;s++)i[s].call(this,t);t.target=null}}}const Fe=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let al=1234567;const hs=Math.PI/180,_s=180/Math.PI;function Mn(){const r=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Fe[r&255]+Fe[r>>8&255]+Fe[r>>16&255]+Fe[r>>24&255]+"-"+Fe[t&255]+Fe[t>>8&255]+"-"+Fe[t>>16&15|64]+Fe[t>>24&255]+"-"+Fe[e&63|128]+Fe[e>>8&255]+"-"+Fe[e>>16&255]+Fe[e>>24&255]+Fe[n&255]+Fe[n>>8&255]+Fe[n>>16&255]+Fe[n>>24&255]).toLowerCase()}function Re(r,t,e){return Math.max(t,Math.min(e,r))}function Cc(r,t){return(r%t+t)%t}function of(r,t,e,n,i){return n+(r-t)*(i-n)/(e-t)}function af(r,t,e){return r!==t?(e-r)/(t-r):0}function Gs(r,t,e){return(1-e)*r+e*t}function cf(r,t,e,n){return Gs(r,t,1-Math.exp(-e*n))}function lf(r,t=1){return t-Math.abs(Cc(r,t*2)-t)}function hf(r,t,e){return r<=t?0:r>=e?1:(r=(r-t)/(e-t),r*r*(3-2*r))}function uf(r,t,e){return r<=t?0:r>=e?1:(r=(r-t)/(e-t),r*r*r*(r*(r*6-15)+10))}function df(r,t){return r+Math.floor(Math.random()*(t-r+1))}function ff(r,t){return r+Math.random()*(t-r)}function pf(r){return r*(.5-Math.random())}function mf(r){r!==void 0&&(al=r);let t=al+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function gf(r){return r*hs}function _f(r){return r*_s}function xf(r){return(r&r-1)===0&&r!==0}function vf(r){return Math.pow(2,Math.ceil(Math.log(r)/Math.LN2))}function yf(r){return Math.pow(2,Math.floor(Math.log(r)/Math.LN2))}function Mf(r,t,e,n,i){const s=Math.cos,o=Math.sin,a=s(e/2),c=o(e/2),l=s((t+n)/2),h=o((t+n)/2),u=s((t-n)/2),d=o((t-n)/2),f=s((n-t)/2),g=o((n-t)/2);switch(i){case"XYX":r.set(a*h,c*u,c*d,a*l);break;case"YZY":r.set(c*d,a*h,c*u,a*l);break;case"ZXZ":r.set(c*u,c*d,a*h,a*l);break;case"XZX":r.set(a*h,c*g,c*f,a*l);break;case"YXY":r.set(c*f,a*h,c*g,a*l);break;case"ZYZ":r.set(c*g,c*f,a*h,a*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function vn(r,t){switch(t.constructor){case Float32Array:return r;case Uint32Array:return r/4294967295;case Uint16Array:return r/65535;case Uint8Array:return r/255;case Int32Array:return Math.max(r/2147483647,-1);case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("Invalid component type.")}}function le(r,t){switch(t.constructor){case Float32Array:return r;case Uint32Array:return Math.round(r*4294967295);case Uint16Array:return Math.round(r*65535);case Uint8Array:return Math.round(r*255);case Int32Array:return Math.round(r*2147483647);case Int16Array:return Math.round(r*32767);case Int8Array:return Math.round(r*127);default:throw new Error("Invalid component type.")}}const uu={DEG2RAD:hs,RAD2DEG:_s,generateUUID:Mn,clamp:Re,euclideanModulo:Cc,mapLinear:of,inverseLerp:af,lerp:Gs,damp:cf,pingpong:lf,smoothstep:hf,smootherstep:uf,randInt:df,randFloat:ff,randFloatSpread:pf,seededRandom:mf,degToRad:gf,radToDeg:_f,isPowerOfTwo:xf,ceilPowerOfTwo:vf,floorPowerOfTwo:yf,setQuaternionFromProperEuler:Mf,normalize:le,denormalize:vn};class at{constructor(t=0,e=0){at.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Re(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),i=Math.sin(e),s=this.x-t.x,o=this.y-t.y;return this.x=s*n-o*i+t.x,this.y=s*i+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Gt{constructor(t,e,n,i,s,o,a,c,l){Gt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,o,a,c,l)}set(t,e,n,i,s,o,a,c,l){const h=this.elements;return h[0]=t,h[1]=i,h[2]=a,h[3]=e,h[4]=s,h[5]=c,h[6]=n,h[7]=o,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,s=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],h=n[4],u=n[7],d=n[2],f=n[5],g=n[8],_=i[0],p=i[3],m=i[6],x=i[1],y=i[4],v=i[7],R=i[2],T=i[5],b=i[8];return s[0]=o*_+a*x+c*R,s[3]=o*p+a*y+c*T,s[6]=o*m+a*v+c*b,s[1]=l*_+h*x+u*R,s[4]=l*p+h*y+u*T,s[7]=l*m+h*v+u*b,s[2]=d*_+f*x+g*R,s[5]=d*p+f*y+g*T,s[8]=d*m+f*v+g*b,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8];return e*o*h-e*a*l-n*s*h+n*a*c+i*s*l-i*o*c}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8],u=h*o-a*l,d=a*c-h*s,f=l*s-o*c,g=e*u+n*d+i*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return t[0]=u*_,t[1]=(i*l-h*n)*_,t[2]=(a*n-i*o)*_,t[3]=d*_,t[4]=(h*e-i*c)*_,t[5]=(i*s-a*e)*_,t[6]=f*_,t[7]=(n*c-l*e)*_,t[8]=(o*e-n*s)*_,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,s,o,a){const c=Math.cos(s),l=Math.sin(s);return this.set(n*c,n*l,-n*(c*o+l*a)+o+t,-i*l,i*c,-i*(-l*o+c*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(Bo.makeScale(t,e)),this}rotate(t){return this.premultiply(Bo.makeRotation(-t)),this}translate(t,e){return this.premultiply(Bo.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Bo=new Gt;function du(r){for(let t=r.length-1;t>=0;--t)if(r[t]>=65535)return!0;return!1}function Zs(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}function Sf(){const r=Zs("canvas");return r.style.display="block",r}const cl={};function Lc(r){r in cl||(cl[r]=!0,console.warn(r))}function bf(r,t,e){return new Promise(function(n,i){function s(){switch(r.clientWaitSync(t,r.SYNC_FLUSH_COMMANDS_BIT,0)){case r.WAIT_FAILED:i();break;case r.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:n()}}setTimeout(s,e)})}const ll=new Gt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),hl=new Gt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),ar={[Oe]:{transfer:lo,primaries:ho,toReference:r=>r,fromReference:r=>r},[_e]:{transfer:fe,primaries:ho,toReference:r=>r.convertSRGBToLinear(),fromReference:r=>r.convertLinearToSRGB()},[bo]:{transfer:lo,primaries:uo,toReference:r=>r.applyMatrix3(hl),fromReference:r=>r.applyMatrix3(ll)},[Rc]:{transfer:fe,primaries:uo,toReference:r=>r.convertSRGBToLinear().applyMatrix3(hl),fromReference:r=>r.applyMatrix3(ll).convertLinearToSRGB()}},wf=new Set([Oe,bo]),te={enabled:!0,_workingColorSpace:Oe,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(r){if(!wf.has(r))throw new Error(`Unsupported working color space, "${r}".`);this._workingColorSpace=r},convert:function(r,t,e){if(this.enabled===!1||t===e||!t||!e)return r;const n=ar[t].toReference,i=ar[e].fromReference;return i(n(r))},fromWorkingColorSpace:function(r,t){return this.convert(r,this._workingColorSpace,t)},toWorkingColorSpace:function(r,t){return this.convert(r,t,this._workingColorSpace)},getPrimaries:function(r){return ar[r].primaries},getTransfer:function(r){return r===ri?lo:ar[r].transfer}};function us(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function zo(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}let Ni;class Tf{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Ni===void 0&&(Ni=Zs("canvas")),Ni.width=t.width,Ni.height=t.height;const n=Ni.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=Ni}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Zs("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const i=n.getImageData(0,0,t.width,t.height),s=i.data;for(let o=0;o<s.length;o++)s[o]=us(s[o]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(us(e[n]/255)*255):e[n]=us(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Af=0;class fu{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Af++}),this.uuid=Mn(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let o=0,a=i.length;o<a;o++)i[o].isDataTexture?s.push(Ho(i[o].image)):s.push(Ho(i[o]))}else s=Ho(i);n.url=s}return e||(t.images[this.uuid]=n),n}}function Ho(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?Tf.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Ef=0;class Ee extends Pi{constructor(t=Ee.DEFAULT_IMAGE,e=Ee.DEFAULT_MAPPING,n=ai,i=ai,s=Ke,o=Hn,a=en,c=Xn,l=Ee.DEFAULT_ANISOTROPY,h=ri){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ef++}),this.uuid=Mn(),this.name="",this.source=new fu(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new at(0,0),this.repeat=new at(1,1),this.center=new at(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Gt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Zh)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Ti:t.x=t.x-Math.floor(t.x);break;case ai:t.x=t.x<0?0:1;break;case ao:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Ti:t.y=t.y-Math.floor(t.y);break;case ai:t.y=t.y<0?0:1;break;case ao:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Ee.DEFAULT_IMAGE=null;Ee.DEFAULT_MAPPING=Zh;Ee.DEFAULT_ANISOTROPY=1;class he{constructor(t=0,e=0,n=0,i=1){he.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,s=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*i+o[12]*s,this.y=o[1]*e+o[5]*n+o[9]*i+o[13]*s,this.z=o[2]*e+o[6]*n+o[10]*i+o[14]*s,this.w=o[3]*e+o[7]*n+o[11]*i+o[15]*s,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,s;const c=t.elements,l=c[0],h=c[4],u=c[8],d=c[1],f=c[5],g=c[9],_=c[2],p=c[6],m=c[10];if(Math.abs(h-d)<.01&&Math.abs(u-_)<.01&&Math.abs(g-p)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+_)<.1&&Math.abs(g+p)<.1&&Math.abs(l+f+m-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const y=(l+1)/2,v=(f+1)/2,R=(m+1)/2,T=(h+d)/4,b=(u+_)/4,L=(g+p)/4;return y>v&&y>R?y<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(y),i=T/n,s=b/n):v>R?v<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(v),n=T/i,s=L/i):R<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt(R),n=b/s,i=L/s),this.set(n,i,s,e),this}let x=Math.sqrt((p-g)*(p-g)+(u-_)*(u-_)+(d-h)*(d-h));return Math.abs(x)<.001&&(x=1),this.x=(p-g)/x,this.y=(u-_)/x,this.z=(d-h)/x,this.w=Math.acos((l+f+m-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Rf extends Pi{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new he(0,0,t,e),this.scissorTest=!1,this.viewport=new he(0,0,t,e);const i={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ke,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const s=new Ee(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);s.flipY=!1,s.generateMipmaps=n.generateMipmaps,s.internalFormat=n.internalFormat,this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=s.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let i=0,s=this.textures.length;i<s;i++)this.textures[i].image.width=t,this.textures[i].image.height=e,this.textures[i].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new fu(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Ei extends Rf{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class pu extends Ee{constructor(t=null,e=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=He,this.minFilter=He,this.wrapR=ai,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Cf extends Ee{constructor(t=null,e=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=He,this.minFilter=He,this.wrapR=ai,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class xe{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,s,o,a){let c=n[i+0],l=n[i+1],h=n[i+2],u=n[i+3];const d=s[o+0],f=s[o+1],g=s[o+2],_=s[o+3];if(a===0){t[e+0]=c,t[e+1]=l,t[e+2]=h,t[e+3]=u;return}if(a===1){t[e+0]=d,t[e+1]=f,t[e+2]=g,t[e+3]=_;return}if(u!==_||c!==d||l!==f||h!==g){let p=1-a;const m=c*d+l*f+h*g+u*_,x=m>=0?1:-1,y=1-m*m;if(y>Number.EPSILON){const R=Math.sqrt(y),T=Math.atan2(R,m*x);p=Math.sin(p*T)/R,a=Math.sin(a*T)/R}const v=a*x;if(c=c*p+d*v,l=l*p+f*v,h=h*p+g*v,u=u*p+_*v,p===1-a){const R=1/Math.sqrt(c*c+l*l+h*h+u*u);c*=R,l*=R,h*=R,u*=R}}t[e]=c,t[e+1]=l,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,i,s,o){const a=n[i],c=n[i+1],l=n[i+2],h=n[i+3],u=s[o],d=s[o+1],f=s[o+2],g=s[o+3];return t[e]=a*g+h*u+c*f-l*d,t[e+1]=c*g+h*d+l*u-a*f,t[e+2]=l*g+h*f+a*d-c*u,t[e+3]=h*g-a*u-c*d-l*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,i=t._y,s=t._z,o=t._order,a=Math.cos,c=Math.sin,l=a(n/2),h=a(i/2),u=a(s/2),d=c(n/2),f=c(i/2),g=c(s/2);switch(o){case"XYZ":this._x=d*h*u+l*f*g,this._y=l*f*u-d*h*g,this._z=l*h*g+d*f*u,this._w=l*h*u-d*f*g;break;case"YXZ":this._x=d*h*u+l*f*g,this._y=l*f*u-d*h*g,this._z=l*h*g-d*f*u,this._w=l*h*u+d*f*g;break;case"ZXY":this._x=d*h*u-l*f*g,this._y=l*f*u+d*h*g,this._z=l*h*g+d*f*u,this._w=l*h*u-d*f*g;break;case"ZYX":this._x=d*h*u-l*f*g,this._y=l*f*u+d*h*g,this._z=l*h*g-d*f*u,this._w=l*h*u+d*f*g;break;case"YZX":this._x=d*h*u+l*f*g,this._y=l*f*u+d*h*g,this._z=l*h*g-d*f*u,this._w=l*h*u-d*f*g;break;case"XZY":this._x=d*h*u-l*f*g,this._y=l*f*u-d*h*g,this._z=l*h*g+d*f*u,this._w=l*h*u+d*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],i=e[4],s=e[8],o=e[1],a=e[5],c=e[9],l=e[2],h=e[6],u=e[10],d=n+a+u;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-c)*f,this._y=(s-l)*f,this._z=(o-i)*f}else if(n>a&&n>u){const f=2*Math.sqrt(1+n-a-u);this._w=(h-c)/f,this._x=.25*f,this._y=(i+o)/f,this._z=(s+l)/f}else if(a>u){const f=2*Math.sqrt(1+a-n-u);this._w=(s-l)/f,this._x=(i+o)/f,this._y=.25*f,this._z=(c+h)/f}else{const f=2*Math.sqrt(1+u-n-a);this._w=(o-i)/f,this._x=(s+l)/f,this._y=(c+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Re(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,i=t._y,s=t._z,o=t._w,a=e._x,c=e._y,l=e._z,h=e._w;return this._x=n*h+o*a+i*l-s*c,this._y=i*h+o*c+s*a-n*l,this._z=s*h+o*l+n*c-i*a,this._w=o*h-n*a-i*c-s*l,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,i=this._y,s=this._z,o=this._w;let a=o*t._w+n*t._x+i*t._y+s*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=i,this._z=s,this;const c=1-a*a;if(c<=Number.EPSILON){const f=1-e;return this._w=f*o+e*this._w,this._x=f*n+e*this._x,this._y=f*i+e*this._y,this._z=f*s+e*this._z,this.normalize(),this}const l=Math.sqrt(c),h=Math.atan2(l,a),u=Math.sin((1-e)*h)/l,d=Math.sin(e*h)/l;return this._w=o*u+this._w*d,this._x=n*u+this._x*d,this._y=i*u+this._y*d,this._z=s*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class A{constructor(t=0,e=0,n=0){A.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(ul.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(ul.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*i,this.y=s[1]*e+s[4]*n+s[7]*i,this.z=s[2]*e+s[5]*n+s[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,s=t.elements,o=1/(s[3]*e+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*i+s[12])*o,this.y=(s[1]*e+s[5]*n+s[9]*i+s[13])*o,this.z=(s[2]*e+s[6]*n+s[10]*i+s[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,i=this.z,s=t.x,o=t.y,a=t.z,c=t.w,l=2*(o*i-a*n),h=2*(a*e-s*i),u=2*(s*n-o*e);return this.x=e+c*l+o*u-a*h,this.y=n+c*h+a*l-s*u,this.z=i+c*u+s*h-o*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*i,this.y=s[1]*e+s[5]*n+s[9]*i,this.z=s[2]*e+s[6]*n+s[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,i=t.y,s=t.z,o=e.x,a=e.y,c=e.z;return this.x=i*c-s*a,this.y=s*o-n*c,this.z=n*a-i*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Vo.copy(this).projectOnVector(t),this.sub(Vo)}reflect(t){return this.sub(Vo.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Re(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Vo=new A,ul=new xe;class Yn{constructor(t=new A(1/0,1/0,1/0),e=new A(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(mn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(mn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=mn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const s=n.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,mn):mn.fromBufferAttribute(s,o),mn.applyMatrix4(t.matrixWorld),this.expandByPoint(mn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),cr.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),cr.copy(n.boundingBox)),cr.applyMatrix4(t.matrixWorld),this.union(cr)}const i=t.children;for(let s=0,o=i.length;s<o;s++)this.expandByObject(i[s],e);return this}containsPoint(t){return!(t.x<this.min.x||t.x>this.max.x||t.y<this.min.y||t.y>this.max.y||t.z<this.min.z||t.z>this.max.z)}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return!(t.max.x<this.min.x||t.min.x>this.max.x||t.max.y<this.min.y||t.min.y>this.max.y||t.max.z<this.min.z||t.min.z>this.max.z)}intersectsSphere(t){return this.clampPoint(t.center,mn),mn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Ts),lr.subVectors(this.max,Ts),ki.subVectors(t.a,Ts),Oi.subVectors(t.b,Ts),Fi.subVectors(t.c,Ts),$n.subVectors(Oi,ki),Zn.subVectors(Fi,Oi),di.subVectors(ki,Fi);let e=[0,-$n.z,$n.y,0,-Zn.z,Zn.y,0,-di.z,di.y,$n.z,0,-$n.x,Zn.z,0,-Zn.x,di.z,0,-di.x,-$n.y,$n.x,0,-Zn.y,Zn.x,0,-di.y,di.x,0];return!Go(e,ki,Oi,Fi,lr)||(e=[1,0,0,0,1,0,0,0,1],!Go(e,ki,Oi,Fi,lr))?!1:(hr.crossVectors($n,Zn),e=[hr.x,hr.y,hr.z],Go(e,ki,Oi,Fi,lr))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,mn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(mn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Ln[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Ln[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Ln[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Ln[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Ln[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Ln[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Ln[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Ln[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Ln),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Ln=[new A,new A,new A,new A,new A,new A,new A,new A],mn=new A,cr=new Yn,ki=new A,Oi=new A,Fi=new A,$n=new A,Zn=new A,di=new A,Ts=new A,lr=new A,hr=new A,fi=new A;function Go(r,t,e,n,i){for(let s=0,o=r.length-3;s<=o;s+=3){fi.fromArray(r,s);const a=i.x*Math.abs(fi.x)+i.y*Math.abs(fi.y)+i.z*Math.abs(fi.z),c=t.dot(fi),l=e.dot(fi),h=n.dot(fi);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>a)return!1}return!0}const Lf=new Yn,As=new A,Wo=new A;class fn{constructor(t=new A,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Lf.setFromPoints(t).getCenter(n);let i=0;for(let s=0,o=t.length;s<o;s++)i=Math.max(i,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;As.subVectors(t,this.center);const e=As.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(As,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Wo.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(As.copy(t.center).add(Wo)),this.expandByPoint(As.copy(t.center).sub(Wo))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Pn=new A,Xo=new A,ur=new A,Jn=new A,qo=new A,dr=new A,Yo=new A;class wo{constructor(t=new A,e=new A(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Pn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=Pn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Pn.copy(this.origin).addScaledVector(this.direction,e),Pn.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){Xo.copy(t).add(e).multiplyScalar(.5),ur.copy(e).sub(t).normalize(),Jn.copy(this.origin).sub(Xo);const s=t.distanceTo(e)*.5,o=-this.direction.dot(ur),a=Jn.dot(this.direction),c=-Jn.dot(ur),l=Jn.lengthSq(),h=Math.abs(1-o*o);let u,d,f,g;if(h>0)if(u=o*c-a,d=o*a-c,g=s*h,u>=0)if(d>=-g)if(d<=g){const _=1/h;u*=_,d*=_,f=u*(u+o*d+2*a)+d*(o*u+d+2*c)+l}else d=s,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*c)+l;else d=-s,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*c)+l;else d<=-g?(u=Math.max(0,-(-o*s+a)),d=u>0?-s:Math.min(Math.max(-s,-c),s),f=-u*u+d*(d+2*c)+l):d<=g?(u=0,d=Math.min(Math.max(-s,-c),s),f=d*(d+2*c)+l):(u=Math.max(0,-(o*s+a)),d=u>0?s:Math.min(Math.max(-s,-c),s),f=-u*u+d*(d+2*c)+l);else d=o>0?-s:s,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(Xo).addScaledVector(ur,d),f}intersectSphere(t,e){Pn.subVectors(t.center,this.origin);const n=Pn.dot(this.direction),i=Pn.dot(Pn)-n*n,s=t.radius*t.radius;if(i>s)return null;const o=Math.sqrt(s-i),a=n-o,c=n+o;return c<0?null:a<0?this.at(c,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,s,o,a,c;const l=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return l>=0?(n=(t.min.x-d.x)*l,i=(t.max.x-d.x)*l):(n=(t.max.x-d.x)*l,i=(t.min.x-d.x)*l),h>=0?(s=(t.min.y-d.y)*h,o=(t.max.y-d.y)*h):(s=(t.max.y-d.y)*h,o=(t.min.y-d.y)*h),n>o||s>i||((s>n||isNaN(n))&&(n=s),(o<i||isNaN(i))&&(i=o),u>=0?(a=(t.min.z-d.z)*u,c=(t.max.z-d.z)*u):(a=(t.max.z-d.z)*u,c=(t.min.z-d.z)*u),n>c||a>i)||((a>n||n!==n)&&(n=a),(c<i||i!==i)&&(i=c),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,Pn)!==null}intersectTriangle(t,e,n,i,s){qo.subVectors(e,t),dr.subVectors(n,t),Yo.crossVectors(qo,dr);let o=this.direction.dot(Yo),a;if(o>0){if(i)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Jn.subVectors(this.origin,t);const c=a*this.direction.dot(dr.crossVectors(Jn,dr));if(c<0)return null;const l=a*this.direction.dot(qo.cross(Jn));if(l<0||c+l>o)return null;const h=-a*Jn.dot(Yo);return h<0?null:this.at(h/o,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Bt{constructor(t,e,n,i,s,o,a,c,l,h,u,d,f,g,_,p){Bt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,o,a,c,l,h,u,d,f,g,_,p)}set(t,e,n,i,s,o,a,c,l,h,u,d,f,g,_,p){const m=this.elements;return m[0]=t,m[4]=e,m[8]=n,m[12]=i,m[1]=s,m[5]=o,m[9]=a,m[13]=c,m[2]=l,m[6]=h,m[10]=u,m[14]=d,m[3]=f,m[7]=g,m[11]=_,m[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Bt().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,i=1/Bi.setFromMatrixColumn(t,0).length(),s=1/Bi.setFromMatrixColumn(t,1).length(),o=1/Bi.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,i=t.y,s=t.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(i),l=Math.sin(i),h=Math.cos(s),u=Math.sin(s);if(t.order==="XYZ"){const d=o*h,f=o*u,g=a*h,_=a*u;e[0]=c*h,e[4]=-c*u,e[8]=l,e[1]=f+g*l,e[5]=d-_*l,e[9]=-a*c,e[2]=_-d*l,e[6]=g+f*l,e[10]=o*c}else if(t.order==="YXZ"){const d=c*h,f=c*u,g=l*h,_=l*u;e[0]=d+_*a,e[4]=g*a-f,e[8]=o*l,e[1]=o*u,e[5]=o*h,e[9]=-a,e[2]=f*a-g,e[6]=_+d*a,e[10]=o*c}else if(t.order==="ZXY"){const d=c*h,f=c*u,g=l*h,_=l*u;e[0]=d-_*a,e[4]=-o*u,e[8]=g+f*a,e[1]=f+g*a,e[5]=o*h,e[9]=_-d*a,e[2]=-o*l,e[6]=a,e[10]=o*c}else if(t.order==="ZYX"){const d=o*h,f=o*u,g=a*h,_=a*u;e[0]=c*h,e[4]=g*l-f,e[8]=d*l+_,e[1]=c*u,e[5]=_*l+d,e[9]=f*l-g,e[2]=-l,e[6]=a*c,e[10]=o*c}else if(t.order==="YZX"){const d=o*c,f=o*l,g=a*c,_=a*l;e[0]=c*h,e[4]=_-d*u,e[8]=g*u+f,e[1]=u,e[5]=o*h,e[9]=-a*h,e[2]=-l*h,e[6]=f*u+g,e[10]=d-_*u}else if(t.order==="XZY"){const d=o*c,f=o*l,g=a*c,_=a*l;e[0]=c*h,e[4]=-u,e[8]=l*h,e[1]=d*u+_,e[5]=o*h,e[9]=f*u-g,e[2]=g*u-f,e[6]=a*h,e[10]=_*u+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Pf,t,If)}lookAt(t,e,n){const i=this.elements;return Je.subVectors(t,e),Je.lengthSq()===0&&(Je.z=1),Je.normalize(),Qn.crossVectors(n,Je),Qn.lengthSq()===0&&(Math.abs(n.z)===1?Je.x+=1e-4:Je.z+=1e-4,Je.normalize(),Qn.crossVectors(n,Je)),Qn.normalize(),fr.crossVectors(Je,Qn),i[0]=Qn.x,i[4]=fr.x,i[8]=Je.x,i[1]=Qn.y,i[5]=fr.y,i[9]=Je.y,i[2]=Qn.z,i[6]=fr.z,i[10]=Je.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,s=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],h=n[1],u=n[5],d=n[9],f=n[13],g=n[2],_=n[6],p=n[10],m=n[14],x=n[3],y=n[7],v=n[11],R=n[15],T=i[0],b=i[4],L=i[8],w=i[12],S=i[1],P=i[5],U=i[9],O=i[13],q=i[2],Y=i[6],W=i[10],$=i[14],X=i[3],dt=i[7],_t=i[11],St=i[15];return s[0]=o*T+a*S+c*q+l*X,s[4]=o*b+a*P+c*Y+l*dt,s[8]=o*L+a*U+c*W+l*_t,s[12]=o*w+a*O+c*$+l*St,s[1]=h*T+u*S+d*q+f*X,s[5]=h*b+u*P+d*Y+f*dt,s[9]=h*L+u*U+d*W+f*_t,s[13]=h*w+u*O+d*$+f*St,s[2]=g*T+_*S+p*q+m*X,s[6]=g*b+_*P+p*Y+m*dt,s[10]=g*L+_*U+p*W+m*_t,s[14]=g*w+_*O+p*$+m*St,s[3]=x*T+y*S+v*q+R*X,s[7]=x*b+y*P+v*Y+R*dt,s[11]=x*L+y*U+v*W+R*_t,s[15]=x*w+y*O+v*$+R*St,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],i=t[8],s=t[12],o=t[1],a=t[5],c=t[9],l=t[13],h=t[2],u=t[6],d=t[10],f=t[14],g=t[3],_=t[7],p=t[11],m=t[15];return g*(+s*c*u-i*l*u-s*a*d+n*l*d+i*a*f-n*c*f)+_*(+e*c*f-e*l*d+s*o*d-i*o*f+i*l*h-s*c*h)+p*(+e*l*u-e*a*f-s*o*u+n*o*f+s*a*h-n*l*h)+m*(-i*a*h-e*c*u+e*a*d+i*o*u-n*o*d+n*c*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8],u=t[9],d=t[10],f=t[11],g=t[12],_=t[13],p=t[14],m=t[15],x=u*p*l-_*d*l+_*c*f-a*p*f-u*c*m+a*d*m,y=g*d*l-h*p*l-g*c*f+o*p*f+h*c*m-o*d*m,v=h*_*l-g*u*l+g*a*f-o*_*f-h*a*m+o*u*m,R=g*u*c-h*_*c-g*a*d+o*_*d+h*a*p-o*u*p,T=e*x+n*y+i*v+s*R;if(T===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const b=1/T;return t[0]=x*b,t[1]=(_*d*s-u*p*s-_*i*f+n*p*f+u*i*m-n*d*m)*b,t[2]=(a*p*s-_*c*s+_*i*l-n*p*l-a*i*m+n*c*m)*b,t[3]=(u*c*s-a*d*s-u*i*l+n*d*l+a*i*f-n*c*f)*b,t[4]=y*b,t[5]=(h*p*s-g*d*s+g*i*f-e*p*f-h*i*m+e*d*m)*b,t[6]=(g*c*s-o*p*s-g*i*l+e*p*l+o*i*m-e*c*m)*b,t[7]=(o*d*s-h*c*s+h*i*l-e*d*l-o*i*f+e*c*f)*b,t[8]=v*b,t[9]=(g*u*s-h*_*s-g*n*f+e*_*f+h*n*m-e*u*m)*b,t[10]=(o*_*s-g*a*s+g*n*l-e*_*l-o*n*m+e*a*m)*b,t[11]=(h*a*s-o*u*s-h*n*l+e*u*l+o*n*f-e*a*f)*b,t[12]=R*b,t[13]=(h*_*i-g*u*i+g*n*d-e*_*d-h*n*p+e*u*p)*b,t[14]=(g*a*i-o*_*i-g*n*c+e*_*c+o*n*p-e*a*p)*b,t[15]=(o*u*i-h*a*i+h*n*c-e*u*c-o*n*d+e*a*d)*b,this}scale(t){const e=this.elements,n=t.x,i=t.y,s=t.z;return e[0]*=n,e[4]*=i,e[8]*=s,e[1]*=n,e[5]*=i,e[9]*=s,e[2]*=n,e[6]*=i,e[10]*=s,e[3]*=n,e[7]*=i,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),i=Math.sin(e),s=1-n,o=t.x,a=t.y,c=t.z,l=s*o,h=s*a;return this.set(l*o+n,l*a-i*c,l*c+i*a,0,l*a+i*c,h*a+n,h*c-i*o,0,l*c-i*a,h*c+i*o,s*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,s,o){return this.set(1,n,s,0,t,1,o,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){const i=this.elements,s=e._x,o=e._y,a=e._z,c=e._w,l=s+s,h=o+o,u=a+a,d=s*l,f=s*h,g=s*u,_=o*h,p=o*u,m=a*u,x=c*l,y=c*h,v=c*u,R=n.x,T=n.y,b=n.z;return i[0]=(1-(_+m))*R,i[1]=(f+v)*R,i[2]=(g-y)*R,i[3]=0,i[4]=(f-v)*T,i[5]=(1-(d+m))*T,i[6]=(p+x)*T,i[7]=0,i[8]=(g+y)*b,i[9]=(p-x)*b,i[10]=(1-(d+_))*b,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){const i=this.elements;let s=Bi.set(i[0],i[1],i[2]).length();const o=Bi.set(i[4],i[5],i[6]).length(),a=Bi.set(i[8],i[9],i[10]).length();this.determinant()<0&&(s=-s),t.x=i[12],t.y=i[13],t.z=i[14],gn.copy(this);const l=1/s,h=1/o,u=1/a;return gn.elements[0]*=l,gn.elements[1]*=l,gn.elements[2]*=l,gn.elements[4]*=h,gn.elements[5]*=h,gn.elements[6]*=h,gn.elements[8]*=u,gn.elements[9]*=u,gn.elements[10]*=u,e.setFromRotationMatrix(gn),n.x=s,n.y=o,n.z=a,this}makePerspective(t,e,n,i,s,o,a=Vn){const c=this.elements,l=2*s/(e-t),h=2*s/(n-i),u=(e+t)/(e-t),d=(n+i)/(n-i);let f,g;if(a===Vn)f=-(o+s)/(o-s),g=-2*o*s/(o-s);else if(a===fo)f=-o/(o-s),g=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=l,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=h,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=f,c[14]=g,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,i,s,o,a=Vn){const c=this.elements,l=1/(e-t),h=1/(n-i),u=1/(o-s),d=(e+t)*l,f=(n+i)*h;let g,_;if(a===Vn)g=(o+s)*u,_=-2*u;else if(a===fo)g=s*u,_=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=2*l,c[4]=0,c[8]=0,c[12]=-d,c[1]=0,c[5]=2*h,c[9]=0,c[13]=-f,c[2]=0,c[6]=0,c[10]=_,c[14]=-g,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Bi=new A,gn=new Bt,Pf=new A(0,0,0),If=new A(1,1,1),Qn=new A,fr=new A,Je=new A,dl=new Bt,fl=new xe;class Ce{constructor(t=0,e=0,n=0,i=Ce.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const i=t.elements,s=i[0],o=i[4],a=i[8],c=i[1],l=i[5],h=i[9],u=i[2],d=i[6],f=i[10];switch(e){case"XYZ":this._y=Math.asin(Re(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Re(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(Re(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-Re(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(Re(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-Re(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return dl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(dl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return fl.setFromEuler(this),this.setFromQuaternion(fl,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Ce.DEFAULT_ORDER="XYZ";class mu{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Df=0;const pl=new A,zi=new xe,In=new Bt,pr=new A,Es=new A,Uf=new A,Nf=new xe,ml=new A(1,0,0),gl=new A(0,1,0),_l=new A(0,0,1),xl={type:"added"},kf={type:"removed"},Hi={type:"childadded",child:null},Ko={type:"childremoved",child:null};class pe extends Pi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Df++}),this.uuid=Mn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=pe.DEFAULT_UP.clone();const t=new A,e=new Ce,n=new xe,i=new A(1,1,1);function s(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(s),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Bt},normalMatrix:{value:new Gt}}),this.matrix=new Bt,this.matrixWorld=new Bt,this.matrixAutoUpdate=pe.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=pe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new mu,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return zi.setFromAxisAngle(t,e),this.quaternion.multiply(zi),this}rotateOnWorldAxis(t,e){return zi.setFromAxisAngle(t,e),this.quaternion.premultiply(zi),this}rotateX(t){return this.rotateOnAxis(ml,t)}rotateY(t){return this.rotateOnAxis(gl,t)}rotateZ(t){return this.rotateOnAxis(_l,t)}translateOnAxis(t,e){return pl.copy(t).applyQuaternion(this.quaternion),this.position.add(pl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(ml,t)}translateY(t){return this.translateOnAxis(gl,t)}translateZ(t){return this.translateOnAxis(_l,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(In.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?pr.copy(t):pr.set(t,e,n);const i=this.parent;this.updateWorldMatrix(!0,!1),Es.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?In.lookAt(Es,pr,this.up):In.lookAt(pr,Es,this.up),this.quaternion.setFromRotationMatrix(In),i&&(In.extractRotation(i.matrixWorld),zi.setFromRotationMatrix(In),this.quaternion.premultiply(zi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(xl),Hi.child=t,this.dispatchEvent(Hi),Hi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(kf),Ko.child=t,this.dispatchEvent(Ko),Ko.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),In.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),In.multiply(t.parent.matrixWorld)),t.applyMatrix4(In),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(xl),Hi.child=t,this.dispatchEvent(Hi),Hi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const i=this.children;for(let s=0,o=i.length;s<o;s++)i[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Es,t,Uf),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Es,Nf,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const i=this.children;for(let s=0,o=i.length;s<o;s++)i[s].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.visibility=this._visibility,i.active=this._active,i.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.geometryCount=this._geometryCount,i.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere={center:i.boundingSphere.center.toArray(),radius:i.boundingSphere.radius}),this.boundingBox!==null&&(i.boundingBox={min:i.boundingBox.min.toArray(),max:i.boundingBox.max.toArray()}));function s(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const c=a.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){const u=c[l];s(t.shapes,u)}else s(t.shapes,c)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(s(t.materials,this.material[c]));i.material=a}else i.material=s(t.materials,this.material);if(this.children.length>0){i.children=[];for(let a=0;a<this.children.length;a++)i.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let a=0;a<this.animations.length;a++){const c=this.animations[a];i.animations.push(s(t.animations,c))}}if(e){const a=o(t.geometries),c=o(t.materials),l=o(t.textures),h=o(t.images),u=o(t.shapes),d=o(t.skeletons),f=o(t.animations),g=o(t.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=i,n;function o(a){const c=[];for(const l in a){const h=a[l];delete h.metadata,c.push(h)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const i=t.children[n];this.add(i.clone())}return this}}pe.DEFAULT_UP=new A(0,1,0);pe.DEFAULT_MATRIX_AUTO_UPDATE=!0;pe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const _n=new A,Dn=new A,jo=new A,Un=new A,Vi=new A,Gi=new A,vl=new A,$o=new A,Zo=new A,Jo=new A;class un{constructor(t=new A,e=new A,n=new A){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),_n.subVectors(t,e),i.cross(_n);const s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(t,e,n,i,s){_n.subVectors(i,e),Dn.subVectors(n,e),jo.subVectors(t,e);const o=_n.dot(_n),a=_n.dot(Dn),c=_n.dot(jo),l=Dn.dot(Dn),h=Dn.dot(jo),u=o*l-a*a;if(u===0)return s.set(0,0,0),null;const d=1/u,f=(l*c-a*h)*d,g=(o*h-a*c)*d;return s.set(1-f-g,g,f)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,Un)===null?!1:Un.x>=0&&Un.y>=0&&Un.x+Un.y<=1}static getInterpolation(t,e,n,i,s,o,a,c){return this.getBarycoord(t,e,n,i,Un)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,Un.x),c.addScaledVector(o,Un.y),c.addScaledVector(a,Un.z),c)}static isFrontFacing(t,e,n,i){return _n.subVectors(n,e),Dn.subVectors(t,e),_n.cross(Dn).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return _n.subVectors(this.c,this.b),Dn.subVectors(this.a,this.b),_n.cross(Dn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return un.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return un.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,s){return un.getInterpolation(t,this.a,this.b,this.c,e,n,i,s)}containsPoint(t){return un.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return un.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,i=this.b,s=this.c;let o,a;Vi.subVectors(i,n),Gi.subVectors(s,n),$o.subVectors(t,n);const c=Vi.dot($o),l=Gi.dot($o);if(c<=0&&l<=0)return e.copy(n);Zo.subVectors(t,i);const h=Vi.dot(Zo),u=Gi.dot(Zo);if(h>=0&&u<=h)return e.copy(i);const d=c*u-h*l;if(d<=0&&c>=0&&h<=0)return o=c/(c-h),e.copy(n).addScaledVector(Vi,o);Jo.subVectors(t,s);const f=Vi.dot(Jo),g=Gi.dot(Jo);if(g>=0&&f<=g)return e.copy(s);const _=f*l-c*g;if(_<=0&&l>=0&&g<=0)return a=l/(l-g),e.copy(n).addScaledVector(Gi,a);const p=h*g-f*u;if(p<=0&&u-h>=0&&f-g>=0)return vl.subVectors(s,i),a=(u-h)/(u-h+(f-g)),e.copy(i).addScaledVector(vl,a);const m=1/(p+_+d);return o=_*m,a=d*m,e.copy(n).addScaledVector(Vi,o).addScaledVector(Gi,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const gu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ti={h:0,s:0,l:0},mr={h:0,s:0,l:0};function Qo(r,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?r+(t-r)*6*e:e<1/2?t:e<2/3?r+(t-r)*6*(2/3-e):r}class nt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=_e){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,te.toWorkingColorSpace(this,e),this}setRGB(t,e,n,i=te.workingColorSpace){return this.r=t,this.g=e,this.b=n,te.toWorkingColorSpace(this,i),this}setHSL(t,e,n,i=te.workingColorSpace){if(t=Cc(t,1),e=Re(e,0,1),n=Re(n,0,1),e===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+e):n+e-n*e,o=2*n-s;this.r=Qo(o,s,t+1/3),this.g=Qo(o,s,t),this.b=Qo(o,s,t-1/3)}return te.toWorkingColorSpace(this,i),this}setStyle(t,e=_e){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const o=i[1],a=i[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=i[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(s,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=_e){const n=gu[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=us(t.r),this.g=us(t.g),this.b=us(t.b),this}copyLinearToSRGB(t){return this.r=zo(t.r),this.g=zo(t.g),this.b=zo(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=_e){return te.fromWorkingColorSpace(Be.copy(this),t),Math.round(Re(Be.r*255,0,255))*65536+Math.round(Re(Be.g*255,0,255))*256+Math.round(Re(Be.b*255,0,255))}getHexString(t=_e){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=te.workingColorSpace){te.fromWorkingColorSpace(Be.copy(this),e);const n=Be.r,i=Be.g,s=Be.b,o=Math.max(n,i,s),a=Math.min(n,i,s);let c,l;const h=(a+o)/2;if(a===o)c=0,l=0;else{const u=o-a;switch(l=h<=.5?u/(o+a):u/(2-o-a),o){case n:c=(i-s)/u+(i<s?6:0);break;case i:c=(s-n)/u+2;break;case s:c=(n-i)/u+4;break}c/=6}return t.h=c,t.s=l,t.l=h,t}getRGB(t,e=te.workingColorSpace){return te.fromWorkingColorSpace(Be.copy(this),e),t.r=Be.r,t.g=Be.g,t.b=Be.b,t}getStyle(t=_e){te.fromWorkingColorSpace(Be.copy(this),t);const e=Be.r,n=Be.g,i=Be.b;return t!==_e?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(ti),this.setHSL(ti.h+t,ti.s+e,ti.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(ti),t.getHSL(mr);const n=Gs(ti.h,mr.h,e),i=Gs(ti.s,mr.s,e),s=Gs(ti.l,mr.l,e);return this.setHSL(n,i,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,i=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*i,this.g=s[1]*e+s[4]*n+s[7]*i,this.b=s[2]*e+s[5]*n+s[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Be=new nt;nt.NAMES=gu;let Of=0;class nn extends Pi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Of++}),this.uuid=Mn(),this.name="",this.type="Material",this.blending=cs,this.side=Wn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Pa,this.blendDst=Ia,this.blendEquation=Si,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new nt(0,0,0),this.blendAlpha=0,this.depthFunc=oo,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=rl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ui,this.stencilZFail=Ui,this.stencilZPass=Ui,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const i=this[e];if(i===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==cs&&(n.blending=this.blending),this.side!==Wn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Pa&&(n.blendSrc=this.blendSrc),this.blendDst!==Ia&&(n.blendDst=this.blendDst),this.blendEquation!==Si&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==oo&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==rl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ui&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ui&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ui&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(s){const o=[];for(const a in s){const c=s[a];delete c.metadata,o.push(c)}return o}if(e){const s=i(t.textures),o=i(t.images);s.length>0&&(n.textures=s),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const i=e.length;n=new Array(i);for(let s=0;s!==i;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}onBeforeRender(){console.warn("Material: onBeforeRender() has been removed.")}}class ke extends nn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new nt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ce,this.combine=vc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Ae=new A,gr=new at;class ue{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=lc,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=yn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return Lc("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,s=this.itemSize;i<s;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)gr.fromBufferAttribute(this,e),gr.applyMatrix3(t),this.setXY(e,gr.x,gr.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Ae.fromBufferAttribute(this,e),Ae.applyMatrix3(t),this.setXYZ(e,Ae.x,Ae.y,Ae.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Ae.fromBufferAttribute(this,e),Ae.applyMatrix4(t),this.setXYZ(e,Ae.x,Ae.y,Ae.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Ae.fromBufferAttribute(this,e),Ae.applyNormalMatrix(t),this.setXYZ(e,Ae.x,Ae.y,Ae.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Ae.fromBufferAttribute(this,e),Ae.transformDirection(t),this.setXYZ(e,Ae.x,Ae.y,Ae.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=vn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=le(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=vn(e,this.array)),e}setX(t,e){return this.normalized&&(e=le(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=vn(e,this.array)),e}setY(t,e){return this.normalized&&(e=le(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=vn(e,this.array)),e}setZ(t,e){return this.normalized&&(e=le(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=vn(e,this.array)),e}setW(t,e){return this.normalized&&(e=le(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=le(e,this.array),n=le(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=le(e,this.array),n=le(n,this.array),i=le(i,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,s){return t*=this.itemSize,this.normalized&&(e=le(e,this.array),n=le(n,this.array),i=le(i,this.array),s=le(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==lc&&(t.usage=this.usage),t}}class To extends ue{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class _u extends ue{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class ee extends ue{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Ff=0;const rn=new Bt,ta=new pe,Wi=new A,Qe=new Yn,Rs=new Yn,Ie=new A;class Me extends Pi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Ff++}),this.uuid=Mn(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(du(t)?_u:To)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new Gt().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return rn.makeRotationFromQuaternion(t),this.applyMatrix4(rn),this}rotateX(t){return rn.makeRotationX(t),this.applyMatrix4(rn),this}rotateY(t){return rn.makeRotationY(t),this.applyMatrix4(rn),this}rotateZ(t){return rn.makeRotationZ(t),this.applyMatrix4(rn),this}translate(t,e,n){return rn.makeTranslation(t,e,n),this.applyMatrix4(rn),this}scale(t,e,n){return rn.makeScale(t,e,n),this.applyMatrix4(rn),this}lookAt(t){return ta.lookAt(t),ta.updateMatrix(),this.applyMatrix4(ta.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Wi).negate(),this.translate(Wi.x,Wi.y,Wi.z),this}setFromPoints(t){const e=[];for(let n=0,i=t.length;n<i;n++){const s=t[n];e.push(s.x,s.y,s.z||0)}return this.setAttribute("position",new ee(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Yn);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new A(-1/0,-1/0,-1/0),new A(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){const s=e[n];Qe.setFromBufferAttribute(s),this.morphTargetsRelative?(Ie.addVectors(this.boundingBox.min,Qe.min),this.boundingBox.expandByPoint(Ie),Ie.addVectors(this.boundingBox.max,Qe.max),this.boundingBox.expandByPoint(Ie)):(this.boundingBox.expandByPoint(Qe.min),this.boundingBox.expandByPoint(Qe.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new fn);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new A,1/0);return}if(t){const n=this.boundingSphere.center;if(Qe.setFromBufferAttribute(t),e)for(let s=0,o=e.length;s<o;s++){const a=e[s];Rs.setFromBufferAttribute(a),this.morphTargetsRelative?(Ie.addVectors(Qe.min,Rs.min),Qe.expandByPoint(Ie),Ie.addVectors(Qe.max,Rs.max),Qe.expandByPoint(Ie)):(Qe.expandByPoint(Rs.min),Qe.expandByPoint(Rs.max))}Qe.getCenter(n);let i=0;for(let s=0,o=t.count;s<o;s++)Ie.fromBufferAttribute(t,s),i=Math.max(i,n.distanceToSquared(Ie));if(e)for(let s=0,o=e.length;s<o;s++){const a=e[s],c=this.morphTargetsRelative;for(let l=0,h=a.count;l<h;l++)Ie.fromBufferAttribute(a,l),c&&(Wi.fromBufferAttribute(t,l),Ie.add(Wi)),i=Math.max(i,n.distanceToSquared(Ie))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,i=e.normal,s=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new ue(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],c=[];for(let L=0;L<n.count;L++)a[L]=new A,c[L]=new A;const l=new A,h=new A,u=new A,d=new at,f=new at,g=new at,_=new A,p=new A;function m(L,w,S){l.fromBufferAttribute(n,L),h.fromBufferAttribute(n,w),u.fromBufferAttribute(n,S),d.fromBufferAttribute(s,L),f.fromBufferAttribute(s,w),g.fromBufferAttribute(s,S),h.sub(l),u.sub(l),f.sub(d),g.sub(d);const P=1/(f.x*g.y-g.x*f.y);isFinite(P)&&(_.copy(h).multiplyScalar(g.y).addScaledVector(u,-f.y).multiplyScalar(P),p.copy(u).multiplyScalar(f.x).addScaledVector(h,-g.x).multiplyScalar(P),a[L].add(_),a[w].add(_),a[S].add(_),c[L].add(p),c[w].add(p),c[S].add(p))}let x=this.groups;x.length===0&&(x=[{start:0,count:t.count}]);for(let L=0,w=x.length;L<w;++L){const S=x[L],P=S.start,U=S.count;for(let O=P,q=P+U;O<q;O+=3)m(t.getX(O+0),t.getX(O+1),t.getX(O+2))}const y=new A,v=new A,R=new A,T=new A;function b(L){R.fromBufferAttribute(i,L),T.copy(R);const w=a[L];y.copy(w),y.sub(R.multiplyScalar(R.dot(w))).normalize(),v.crossVectors(T,w);const P=v.dot(c[L])<0?-1:1;o.setXYZW(L,y.x,y.y,y.z,P)}for(let L=0,w=x.length;L<w;++L){const S=x[L],P=S.start,U=S.count;for(let O=P,q=P+U;O<q;O+=3)b(t.getX(O+0)),b(t.getX(O+1)),b(t.getX(O+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new ue(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);const i=new A,s=new A,o=new A,a=new A,c=new A,l=new A,h=new A,u=new A;if(t)for(let d=0,f=t.count;d<f;d+=3){const g=t.getX(d+0),_=t.getX(d+1),p=t.getX(d+2);i.fromBufferAttribute(e,g),s.fromBufferAttribute(e,_),o.fromBufferAttribute(e,p),h.subVectors(o,s),u.subVectors(i,s),h.cross(u),a.fromBufferAttribute(n,g),c.fromBufferAttribute(n,_),l.fromBufferAttribute(n,p),a.add(h),c.add(h),l.add(h),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(_,c.x,c.y,c.z),n.setXYZ(p,l.x,l.y,l.z)}else for(let d=0,f=e.count;d<f;d+=3)i.fromBufferAttribute(e,d+0),s.fromBufferAttribute(e,d+1),o.fromBufferAttribute(e,d+2),h.subVectors(o,s),u.subVectors(i,s),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Ie.fromBufferAttribute(t,e),Ie.normalize(),t.setXYZ(e,Ie.x,Ie.y,Ie.z)}toNonIndexed(){function t(a,c){const l=a.array,h=a.itemSize,u=a.normalized,d=new l.constructor(c.length*h);let f=0,g=0;for(let _=0,p=c.length;_<p;_++){a.isInterleavedBufferAttribute?f=c[_]*a.data.stride+a.offset:f=c[_]*h;for(let m=0;m<h;m++)d[g++]=l[f++]}return new ue(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new Me,n=this.index.array,i=this.attributes;for(const a in i){const c=i[a],l=t(c,n);e.setAttribute(a,l)}const s=this.morphAttributes;for(const a in s){const c=[],l=s[a];for(let h=0,u=l.length;h<u;h++){const d=l[h],f=t(d,n);c.push(f)}e.morphAttributes[a]=c}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,c=o.length;a<c;a++){const l=o[a];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const c in n){const l=n[c];t.data.attributes[c]=l.toJSON(t.data)}const i={};let s=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],h=[];for(let u=0,d=l.length;u<d;u++){const f=l[u];h.push(f.toJSON(t.data))}h.length>0&&(i[c]=h,s=!0)}s&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const i=t.attributes;for(const l in i){const h=i[l];this.setAttribute(l,h.clone(e))}const s=t.morphAttributes;for(const l in s){const h=[],u=s[l];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(e));this.morphAttributes[l]=h}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let l=0,h=o.length;l<h;l++){const u=o[l];this.addGroup(u.start,u.count,u.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const yl=new Bt,pi=new wo,_r=new fn,Ml=new A,Xi=new A,qi=new A,Yi=new A,ea=new A,xr=new A,vr=new at,yr=new at,Mr=new at,Sl=new A,bl=new A,wl=new A,Sr=new A,br=new A;class jt extends pe{constructor(t=new Me,e=new ke){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=i.length;s<o;s++){const a=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(t,e){const n=this.geometry,i=n.attributes.position,s=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(i,t);const a=this.morphTargetInfluences;if(s&&a){xr.set(0,0,0);for(let c=0,l=s.length;c<l;c++){const h=a[c],u=s[c];h!==0&&(ea.fromBufferAttribute(u,t),o?xr.addScaledVector(ea,h):xr.addScaledVector(ea.sub(e),h))}e.add(xr)}return e}raycast(t,e){const n=this.geometry,i=this.material,s=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),_r.copy(n.boundingSphere),_r.applyMatrix4(s),pi.copy(t.ray).recast(t.near),!(_r.containsPoint(pi.origin)===!1&&(pi.intersectSphere(_r,Ml)===null||pi.origin.distanceToSquared(Ml)>(t.far-t.near)**2))&&(yl.copy(s).invert(),pi.copy(t.ray).applyMatrix4(yl),!(n.boundingBox!==null&&pi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,pi)))}_computeIntersections(t,e,n){let i;const s=this.geometry,o=this.material,a=s.index,c=s.attributes.position,l=s.attributes.uv,h=s.attributes.uv1,u=s.attributes.normal,d=s.groups,f=s.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,_=d.length;g<_;g++){const p=d[g],m=o[p.materialIndex],x=Math.max(p.start,f.start),y=Math.min(a.count,Math.min(p.start+p.count,f.start+f.count));for(let v=x,R=y;v<R;v+=3){const T=a.getX(v),b=a.getX(v+1),L=a.getX(v+2);i=wr(this,m,t,n,l,h,u,T,b,L),i&&(i.faceIndex=Math.floor(v/3),i.face.materialIndex=p.materialIndex,e.push(i))}}else{const g=Math.max(0,f.start),_=Math.min(a.count,f.start+f.count);for(let p=g,m=_;p<m;p+=3){const x=a.getX(p),y=a.getX(p+1),v=a.getX(p+2);i=wr(this,o,t,n,l,h,u,x,y,v),i&&(i.faceIndex=Math.floor(p/3),e.push(i))}}else if(c!==void 0)if(Array.isArray(o))for(let g=0,_=d.length;g<_;g++){const p=d[g],m=o[p.materialIndex],x=Math.max(p.start,f.start),y=Math.min(c.count,Math.min(p.start+p.count,f.start+f.count));for(let v=x,R=y;v<R;v+=3){const T=v,b=v+1,L=v+2;i=wr(this,m,t,n,l,h,u,T,b,L),i&&(i.faceIndex=Math.floor(v/3),i.face.materialIndex=p.materialIndex,e.push(i))}}else{const g=Math.max(0,f.start),_=Math.min(c.count,f.start+f.count);for(let p=g,m=_;p<m;p+=3){const x=p,y=p+1,v=p+2;i=wr(this,o,t,n,l,h,u,x,y,v),i&&(i.faceIndex=Math.floor(p/3),e.push(i))}}}}function Bf(r,t,e,n,i,s,o,a){let c;if(t.side===Ve?c=n.intersectTriangle(o,s,i,!0,a):c=n.intersectTriangle(i,s,o,t.side===Wn,a),c===null)return null;br.copy(a),br.applyMatrix4(r.matrixWorld);const l=e.ray.origin.distanceTo(br);return l<e.near||l>e.far?null:{distance:l,point:br.clone(),object:r}}function wr(r,t,e,n,i,s,o,a,c,l){r.getVertexPosition(a,Xi),r.getVertexPosition(c,qi),r.getVertexPosition(l,Yi);const h=Bf(r,t,e,n,Xi,qi,Yi,Sr);if(h){i&&(vr.fromBufferAttribute(i,a),yr.fromBufferAttribute(i,c),Mr.fromBufferAttribute(i,l),h.uv=un.getInterpolation(Sr,Xi,qi,Yi,vr,yr,Mr,new at)),s&&(vr.fromBufferAttribute(s,a),yr.fromBufferAttribute(s,c),Mr.fromBufferAttribute(s,l),h.uv1=un.getInterpolation(Sr,Xi,qi,Yi,vr,yr,Mr,new at)),o&&(Sl.fromBufferAttribute(o,a),bl.fromBufferAttribute(o,c),wl.fromBufferAttribute(o,l),h.normal=un.getInterpolation(Sr,Xi,qi,Yi,Sl,bl,wl,new A),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const u={a,b:c,c:l,normal:new A,materialIndex:0};un.getNormal(Xi,qi,Yi,u.normal),h.face=u}return h}class wn extends Me{constructor(t=1,e=1,n=1,i=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:s,depthSegments:o};const a=this;i=Math.floor(i),s=Math.floor(s),o=Math.floor(o);const c=[],l=[],h=[],u=[];let d=0,f=0;g("z","y","x",-1,-1,n,e,t,o,s,0),g("z","y","x",1,-1,n,e,-t,o,s,1),g("x","z","y",1,1,t,n,e,i,o,2),g("x","z","y",1,-1,t,n,-e,i,o,3),g("x","y","z",1,-1,t,e,n,i,s,4),g("x","y","z",-1,-1,t,e,-n,i,s,5),this.setIndex(c),this.setAttribute("position",new ee(l,3)),this.setAttribute("normal",new ee(h,3)),this.setAttribute("uv",new ee(u,2));function g(_,p,m,x,y,v,R,T,b,L,w){const S=v/b,P=R/L,U=v/2,O=R/2,q=T/2,Y=b+1,W=L+1;let $=0,X=0;const dt=new A;for(let _t=0;_t<W;_t++){const St=_t*P-O;for(let Xt=0;Xt<Y;Xt++){const ne=Xt*S-U;dt[_]=ne*x,dt[p]=St*y,dt[m]=q,l.push(dt.x,dt.y,dt.z),dt[_]=0,dt[p]=0,dt[m]=T>0?1:-1,h.push(dt.x,dt.y,dt.z),u.push(Xt/b),u.push(1-_t/L),$+=1}}for(let _t=0;_t<L;_t++)for(let St=0;St<b;St++){const Xt=d+St+Y*_t,ne=d+St+Y*(_t+1),Z=d+(St+1)+Y*(_t+1),st=d+(St+1)+Y*_t;c.push(Xt,ne,st),c.push(ne,Z,st),X+=6}a.addGroup(f,X,w),f+=X,d+=$}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new wn(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function xs(r){const t={};for(const e in r){t[e]={};for(const n in r[e]){const i=r[e][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone():Array.isArray(i)?t[e][n]=i.slice():t[e][n]=i}}return t}function We(r){const t={};for(let e=0;e<r.length;e++){const n=xs(r[e]);for(const i in n)t[i]=n[i]}return t}function zf(r){const t=[];for(let e=0;e<r.length;e++)t.push(r[e].clone());return t}function xu(r){const t=r.getRenderTarget();return t===null?r.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:te.workingColorSpace}const Hf={clone:xs,merge:We};var Vf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Gf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Tn extends nn{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Vf,this.fragmentShader=Gf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=xs(t.uniforms),this.uniformsGroups=zf(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const i in this.uniforms){const o=this.uniforms[i].value;o&&o.isTexture?e.uniforms[i]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[i]={type:"m4",value:o.toArray()}:e.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class vu extends pe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Bt,this.projectionMatrix=new Bt,this.projectionMatrixInverse=new Bt,this.coordinateSystem=Vn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const ei=new A,Tl=new at,Al=new at;class Xe extends vu{constructor(t=50,e=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=_s*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(hs*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return _s*2*Math.atan(Math.tan(hs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){ei.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(ei.x,ei.y).multiplyScalar(-t/ei.z),ei.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ei.x,ei.y).multiplyScalar(-t/ei.z)}getViewSize(t,e){return this.getViewBounds(t,Tl,Al),e.subVectors(Al,Tl)}setViewOffset(t,e,n,i,s,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(hs*.5*this.fov)/this.zoom,n=2*e,i=this.aspect*n,s=-.5*i;const o=this.view;if(this.view!==null&&this.view.enabled){const c=o.fullWidth,l=o.fullHeight;s+=o.offsetX*i/c,e-=o.offsetY*n/l,i*=o.width/c,n*=o.height/l}const a=this.filmOffset;a!==0&&(s+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+i,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const Ki=-90,ji=1;class Wf extends pe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new Xe(Ki,ji,t,e);i.layers=this.layers,this.add(i);const s=new Xe(Ki,ji,t,e);s.layers=this.layers,this.add(s);const o=new Xe(Ki,ji,t,e);o.layers=this.layers,this.add(o);const a=new Xe(Ki,ji,t,e);a.layers=this.layers,this.add(a);const c=new Xe(Ki,ji,t,e);c.layers=this.layers,this.add(c);const l=new Xe(Ki,ji,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,i,s,o,a,c]=e;for(const l of e)this.remove(l);if(t===Vn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===fo)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,o,a,c,l,h]=this.children,u=t.getRenderTarget(),d=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,i),t.render(e,s),t.setRenderTarget(n,1,i),t.render(e,o),t.setRenderTarget(n,2,i),t.render(e,a),t.setRenderTarget(n,3,i),t.render(e,c),t.setRenderTarget(n,4,i),t.render(e,l),n.texture.generateMipmaps=_,t.setRenderTarget(n,5,i),t.render(e,h),t.setRenderTarget(u,d,f),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class yu extends Ee{constructor(t,e,n,i,s,o,a,c,l,h){t=t!==void 0?t:[],e=e!==void 0?e:fs,super(t,e,n,i,s,o,a,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Xf extends Ei{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},i=[n,n,n,n,n,n];this.texture=new yu(i,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Ke}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new wn(5,5,5),s=new Tn({name:"CubemapFromEquirect",uniforms:xs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ve,blending:hi});s.uniforms.tEquirect.value=e;const o=new jt(i,s),a=e.minFilter;return e.minFilter===Hn&&(e.minFilter=Ke),new Wf(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,i){const s=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,i);t.setRenderTarget(s)}}const na=new A,qf=new A,Yf=new Gt;class yi{constructor(t=new A(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const i=na.subVectors(n,e).cross(qf.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(na),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const s=-(t.start.dot(this.normal)+this.constant)/i;return s<0||s>1?null:e.copy(t.start).addScaledVector(n,s)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||Yf.getNormalMatrix(t),i=this.coplanarPoint(na).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const mi=new fn,Tr=new A;class Pc{constructor(t=new yi,e=new yi,n=new yi,i=new yi,s=new yi,o=new yi){this.planes=[t,e,n,i,s,o]}set(t,e,n,i,s,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(i),a[4].copy(s),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Vn){const n=this.planes,i=t.elements,s=i[0],o=i[1],a=i[2],c=i[3],l=i[4],h=i[5],u=i[6],d=i[7],f=i[8],g=i[9],_=i[10],p=i[11],m=i[12],x=i[13],y=i[14],v=i[15];if(n[0].setComponents(c-s,d-l,p-f,v-m).normalize(),n[1].setComponents(c+s,d+l,p+f,v+m).normalize(),n[2].setComponents(c+o,d+h,p+g,v+x).normalize(),n[3].setComponents(c-o,d-h,p-g,v-x).normalize(),n[4].setComponents(c-a,d-u,p-_,v-y).normalize(),e===Vn)n[5].setComponents(c+a,d+u,p+_,v+y).normalize();else if(e===fo)n[5].setComponents(a,u,_,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),mi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),mi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(mi)}intersectsSprite(t){return mi.center.set(0,0,0),mi.radius=.7071067811865476,mi.applyMatrix4(t.matrixWorld),this.intersectsSphere(mi)}intersectsSphere(t){const e=this.planes,n=t.center,i=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(n)<i)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const i=e[n];if(Tr.x=i.normal.x>0?t.max.x:t.min.x,Tr.y=i.normal.y>0?t.max.y:t.min.y,Tr.z=i.normal.z>0?t.max.z:t.min.z,i.distanceToPoint(Tr)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Mu(){let r=null,t=!1,e=null,n=null;function i(s,o){e(s,o),n=r.requestAnimationFrame(i)}return{start:function(){t!==!0&&e!==null&&(n=r.requestAnimationFrame(i),t=!0)},stop:function(){r.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){r=s}}}function Kf(r){const t=new WeakMap;function e(a,c){const l=a.array,h=a.usage,u=l.byteLength,d=r.createBuffer();r.bindBuffer(c,d),r.bufferData(c,l,h),a.onUploadCallback();let f;if(l instanceof Float32Array)f=r.FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?f=r.HALF_FLOAT:f=r.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=r.SHORT;else if(l instanceof Uint32Array)f=r.UNSIGNED_INT;else if(l instanceof Int32Array)f=r.INT;else if(l instanceof Int8Array)f=r.BYTE;else if(l instanceof Uint8Array)f=r.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=r.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,c,l){const h=c.array,u=c._updateRange,d=c.updateRanges;if(r.bindBuffer(l,a),u.count===-1&&d.length===0&&r.bufferSubData(l,0,h),d.length!==0){for(let f=0,g=d.length;f<g;f++){const _=d[f];r.bufferSubData(l,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}c.clearUpdateRanges()}u.count!==-1&&(r.bufferSubData(l,u.offset*h.BYTES_PER_ELEMENT,h,u.offset,u.count),u.count=-1),c.onUploadCallback()}function i(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);const c=t.get(a);c&&(r.deleteBuffer(c.buffer),t.delete(a))}function o(a,c){if(a.isGLBufferAttribute){const h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}a.isInterleavedBufferAttribute&&(a=a.data);const l=t.get(a);if(l===void 0)t.set(a,e(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,a,c),l.version=a.version}}return{get:i,remove:s,update:o}}class Ri extends Me{constructor(t=1,e=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:i};const s=t/2,o=e/2,a=Math.floor(n),c=Math.floor(i),l=a+1,h=c+1,u=t/a,d=e/c,f=[],g=[],_=[],p=[];for(let m=0;m<h;m++){const x=m*d-o;for(let y=0;y<l;y++){const v=y*u-s;g.push(v,-x,0),_.push(0,0,1),p.push(y/a),p.push(1-m/c)}}for(let m=0;m<c;m++)for(let x=0;x<a;x++){const y=x+l*m,v=x+l*(m+1),R=x+1+l*(m+1),T=x+1+l*m;f.push(y,v,T),f.push(v,R,T)}this.setIndex(f),this.setAttribute("position",new ee(g,3)),this.setAttribute("normal",new ee(_,3)),this.setAttribute("uv",new ee(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ri(t.width,t.height,t.widthSegments,t.heightSegments)}}var jf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,$f=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Zf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Jf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Qf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,tp=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,ep=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,np=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,ip=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,sp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,rp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,op=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,ap=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,cp=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,lp=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,hp=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,up=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,dp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,fp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,pp=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,mp=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,gp=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,_p=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,xp=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,vp=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,yp=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Mp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Sp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,bp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,wp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Tp="gl_FragColor = linearToOutputTexel( gl_FragColor );",Ap=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,Ep=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Rp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Cp=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Lp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Pp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Ip=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Dp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Up=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Np=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,kp=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Op=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Fp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Bp=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,zp=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Hp=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Vp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Gp=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Wp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Xp=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,qp=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Yp=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Kp=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,jp=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,$p=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Zp=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Jp=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Qp=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,tm=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,em=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,nm=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,im=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,sm=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,rm=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,om=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,am=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,cm=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,lm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,hm=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,um=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,dm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,fm=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,pm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,mm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,gm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,_m=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,xm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,vm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,ym=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Mm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Sm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,bm=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,wm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Tm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Am=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Em=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Rm=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Cm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Lm=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Pm=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Im=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Dm=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Um=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Nm=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,km=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Om=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Fm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Bm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,zm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Hm=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Vm=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Gm=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Wm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Xm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,qm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Ym=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Km=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,jm=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,$m=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Zm=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Jm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Qm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,t0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,e0=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,n0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,i0=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,s0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,r0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,o0=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,a0=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,c0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,l0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,h0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,u0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,d0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,f0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,p0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,m0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,g0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,_0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,x0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,v0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,y0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,M0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,S0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,b0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,w0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,T0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,A0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,E0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Vt={alphahash_fragment:jf,alphahash_pars_fragment:$f,alphamap_fragment:Zf,alphamap_pars_fragment:Jf,alphatest_fragment:Qf,alphatest_pars_fragment:tp,aomap_fragment:ep,aomap_pars_fragment:np,batching_pars_vertex:ip,batching_vertex:sp,begin_vertex:rp,beginnormal_vertex:op,bsdfs:ap,iridescence_fragment:cp,bumpmap_pars_fragment:lp,clipping_planes_fragment:hp,clipping_planes_pars_fragment:up,clipping_planes_pars_vertex:dp,clipping_planes_vertex:fp,color_fragment:pp,color_pars_fragment:mp,color_pars_vertex:gp,color_vertex:_p,common:xp,cube_uv_reflection_fragment:vp,defaultnormal_vertex:yp,displacementmap_pars_vertex:Mp,displacementmap_vertex:Sp,emissivemap_fragment:bp,emissivemap_pars_fragment:wp,colorspace_fragment:Tp,colorspace_pars_fragment:Ap,envmap_fragment:Ep,envmap_common_pars_fragment:Rp,envmap_pars_fragment:Cp,envmap_pars_vertex:Lp,envmap_physical_pars_fragment:Hp,envmap_vertex:Pp,fog_vertex:Ip,fog_pars_vertex:Dp,fog_fragment:Up,fog_pars_fragment:Np,gradientmap_pars_fragment:kp,lightmap_pars_fragment:Op,lights_lambert_fragment:Fp,lights_lambert_pars_fragment:Bp,lights_pars_begin:zp,lights_toon_fragment:Vp,lights_toon_pars_fragment:Gp,lights_phong_fragment:Wp,lights_phong_pars_fragment:Xp,lights_physical_fragment:qp,lights_physical_pars_fragment:Yp,lights_fragment_begin:Kp,lights_fragment_maps:jp,lights_fragment_end:$p,logdepthbuf_fragment:Zp,logdepthbuf_pars_fragment:Jp,logdepthbuf_pars_vertex:Qp,logdepthbuf_vertex:tm,map_fragment:em,map_pars_fragment:nm,map_particle_fragment:im,map_particle_pars_fragment:sm,metalnessmap_fragment:rm,metalnessmap_pars_fragment:om,morphinstance_vertex:am,morphcolor_vertex:cm,morphnormal_vertex:lm,morphtarget_pars_vertex:hm,morphtarget_vertex:um,normal_fragment_begin:dm,normal_fragment_maps:fm,normal_pars_fragment:pm,normal_pars_vertex:mm,normal_vertex:gm,normalmap_pars_fragment:_m,clearcoat_normal_fragment_begin:xm,clearcoat_normal_fragment_maps:vm,clearcoat_pars_fragment:ym,iridescence_pars_fragment:Mm,opaque_fragment:Sm,packing:bm,premultiplied_alpha_fragment:wm,project_vertex:Tm,dithering_fragment:Am,dithering_pars_fragment:Em,roughnessmap_fragment:Rm,roughnessmap_pars_fragment:Cm,shadowmap_pars_fragment:Lm,shadowmap_pars_vertex:Pm,shadowmap_vertex:Im,shadowmask_pars_fragment:Dm,skinbase_vertex:Um,skinning_pars_vertex:Nm,skinning_vertex:km,skinnormal_vertex:Om,specularmap_fragment:Fm,specularmap_pars_fragment:Bm,tonemapping_fragment:zm,tonemapping_pars_fragment:Hm,transmission_fragment:Vm,transmission_pars_fragment:Gm,uv_pars_fragment:Wm,uv_pars_vertex:Xm,uv_vertex:qm,worldpos_vertex:Ym,background_vert:Km,background_frag:jm,backgroundCube_vert:$m,backgroundCube_frag:Zm,cube_vert:Jm,cube_frag:Qm,depth_vert:t0,depth_frag:e0,distanceRGBA_vert:n0,distanceRGBA_frag:i0,equirect_vert:s0,equirect_frag:r0,linedashed_vert:o0,linedashed_frag:a0,meshbasic_vert:c0,meshbasic_frag:l0,meshlambert_vert:h0,meshlambert_frag:u0,meshmatcap_vert:d0,meshmatcap_frag:f0,meshnormal_vert:p0,meshnormal_frag:m0,meshphong_vert:g0,meshphong_frag:_0,meshphysical_vert:x0,meshphysical_frag:v0,meshtoon_vert:y0,meshtoon_frag:M0,points_vert:S0,points_frag:b0,shadow_vert:w0,shadow_frag:T0,sprite_vert:A0,sprite_frag:E0},ft={common:{diffuse:{value:new nt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Gt},alphaMap:{value:null},alphaMapTransform:{value:new Gt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Gt}},envmap:{envMap:{value:null},envMapRotation:{value:new Gt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Gt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Gt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Gt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Gt},normalScale:{value:new at(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Gt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Gt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Gt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Gt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new nt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new nt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Gt},alphaTest:{value:0},uvTransform:{value:new Gt}},sprite:{diffuse:{value:new nt(16777215)},opacity:{value:1},center:{value:new at(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Gt},alphaMap:{value:null},alphaMapTransform:{value:new Gt},alphaTest:{value:0}}},bn={basic:{uniforms:We([ft.common,ft.specularmap,ft.envmap,ft.aomap,ft.lightmap,ft.fog]),vertexShader:Vt.meshbasic_vert,fragmentShader:Vt.meshbasic_frag},lambert:{uniforms:We([ft.common,ft.specularmap,ft.envmap,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.fog,ft.lights,{emissive:{value:new nt(0)}}]),vertexShader:Vt.meshlambert_vert,fragmentShader:Vt.meshlambert_frag},phong:{uniforms:We([ft.common,ft.specularmap,ft.envmap,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.fog,ft.lights,{emissive:{value:new nt(0)},specular:{value:new nt(1118481)},shininess:{value:30}}]),vertexShader:Vt.meshphong_vert,fragmentShader:Vt.meshphong_frag},standard:{uniforms:We([ft.common,ft.envmap,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.roughnessmap,ft.metalnessmap,ft.fog,ft.lights,{emissive:{value:new nt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Vt.meshphysical_vert,fragmentShader:Vt.meshphysical_frag},toon:{uniforms:We([ft.common,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.gradientmap,ft.fog,ft.lights,{emissive:{value:new nt(0)}}]),vertexShader:Vt.meshtoon_vert,fragmentShader:Vt.meshtoon_frag},matcap:{uniforms:We([ft.common,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.fog,{matcap:{value:null}}]),vertexShader:Vt.meshmatcap_vert,fragmentShader:Vt.meshmatcap_frag},points:{uniforms:We([ft.points,ft.fog]),vertexShader:Vt.points_vert,fragmentShader:Vt.points_frag},dashed:{uniforms:We([ft.common,ft.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Vt.linedashed_vert,fragmentShader:Vt.linedashed_frag},depth:{uniforms:We([ft.common,ft.displacementmap]),vertexShader:Vt.depth_vert,fragmentShader:Vt.depth_frag},normal:{uniforms:We([ft.common,ft.bumpmap,ft.normalmap,ft.displacementmap,{opacity:{value:1}}]),vertexShader:Vt.meshnormal_vert,fragmentShader:Vt.meshnormal_frag},sprite:{uniforms:We([ft.sprite,ft.fog]),vertexShader:Vt.sprite_vert,fragmentShader:Vt.sprite_frag},background:{uniforms:{uvTransform:{value:new Gt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Vt.background_vert,fragmentShader:Vt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Gt}},vertexShader:Vt.backgroundCube_vert,fragmentShader:Vt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Vt.cube_vert,fragmentShader:Vt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Vt.equirect_vert,fragmentShader:Vt.equirect_frag},distanceRGBA:{uniforms:We([ft.common,ft.displacementmap,{referencePosition:{value:new A},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Vt.distanceRGBA_vert,fragmentShader:Vt.distanceRGBA_frag},shadow:{uniforms:We([ft.lights,ft.fog,{color:{value:new nt(0)},opacity:{value:1}}]),vertexShader:Vt.shadow_vert,fragmentShader:Vt.shadow_frag}};bn.physical={uniforms:We([bn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Gt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Gt},clearcoatNormalScale:{value:new at(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Gt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Gt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Gt},sheen:{value:0},sheenColor:{value:new nt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Gt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Gt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Gt},transmissionSamplerSize:{value:new at},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Gt},attenuationDistance:{value:0},attenuationColor:{value:new nt(0)},specularColor:{value:new nt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Gt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Gt},anisotropyVector:{value:new at},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Gt}}]),vertexShader:Vt.meshphysical_vert,fragmentShader:Vt.meshphysical_frag};const Ar={r:0,b:0,g:0},gi=new Ce,R0=new Bt;function C0(r,t,e,n,i,s,o){const a=new nt(0);let c=s===!0?0:1,l,h,u=null,d=0,f=null;function g(x){let y=x.isScene===!0?x.background:null;return y&&y.isTexture&&(y=(x.backgroundBlurriness>0?e:t).get(y)),y}function _(x){let y=!1;const v=g(x);v===null?m(a,c):v&&v.isColor&&(m(v,1),y=!0);const R=r.xr.getEnvironmentBlendMode();R==="additive"?n.buffers.color.setClear(0,0,0,1,o):R==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(r.autoClear||y)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),r.clear(r.autoClearColor,r.autoClearDepth,r.autoClearStencil))}function p(x,y){const v=g(y);v&&(v.isCubeTexture||v.mapping===Mo)?(h===void 0&&(h=new jt(new wn(1,1,1),new Tn({name:"BackgroundCubeMaterial",uniforms:xs(bn.backgroundCube.uniforms),vertexShader:bn.backgroundCube.vertexShader,fragmentShader:bn.backgroundCube.fragmentShader,side:Ve,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(R,T,b){this.matrixWorld.copyPosition(b.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(h)),gi.copy(y.backgroundRotation),gi.x*=-1,gi.y*=-1,gi.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(gi.y*=-1,gi.z*=-1),h.material.uniforms.envMap.value=v,h.material.uniforms.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(R0.makeRotationFromEuler(gi)),h.material.toneMapped=te.getTransfer(v.colorSpace)!==fe,(u!==v||d!==v.version||f!==r.toneMapping)&&(h.material.needsUpdate=!0,u=v,d=v.version,f=r.toneMapping),h.layers.enableAll(),x.unshift(h,h.geometry,h.material,0,0,null)):v&&v.isTexture&&(l===void 0&&(l=new jt(new Ri(2,2),new Tn({name:"BackgroundMaterial",uniforms:xs(bn.background.uniforms),vertexShader:bn.background.vertexShader,fragmentShader:bn.background.fragmentShader,side:Wn,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=v,l.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,l.material.toneMapped=te.getTransfer(v.colorSpace)!==fe,v.matrixAutoUpdate===!0&&v.updateMatrix(),l.material.uniforms.uvTransform.value.copy(v.matrix),(u!==v||d!==v.version||f!==r.toneMapping)&&(l.material.needsUpdate=!0,u=v,d=v.version,f=r.toneMapping),l.layers.enableAll(),x.unshift(l,l.geometry,l.material,0,0,null))}function m(x,y){x.getRGB(Ar,xu(r)),n.buffers.color.setClear(Ar.r,Ar.g,Ar.b,y,o)}return{getClearColor:function(){return a},setClearColor:function(x,y=1){a.set(x),c=y,m(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(x){c=x,m(a,c)},render:_,addToRenderList:p}}function L0(r,t){const e=r.getParameter(r.MAX_VERTEX_ATTRIBS),n={},i=d(null);let s=i,o=!1;function a(S,P,U,O,q){let Y=!1;const W=u(O,U,P);s!==W&&(s=W,l(s.object)),Y=f(S,O,U,q),Y&&g(S,O,U,q),q!==null&&t.update(q,r.ELEMENT_ARRAY_BUFFER),(Y||o)&&(o=!1,v(S,P,U,O),q!==null&&r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,t.get(q).buffer))}function c(){return r.createVertexArray()}function l(S){return r.bindVertexArray(S)}function h(S){return r.deleteVertexArray(S)}function u(S,P,U){const O=U.wireframe===!0;let q=n[S.id];q===void 0&&(q={},n[S.id]=q);let Y=q[P.id];Y===void 0&&(Y={},q[P.id]=Y);let W=Y[O];return W===void 0&&(W=d(c()),Y[O]=W),W}function d(S){const P=[],U=[],O=[];for(let q=0;q<e;q++)P[q]=0,U[q]=0,O[q]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:U,attributeDivisors:O,object:S,attributes:{},index:null}}function f(S,P,U,O){const q=s.attributes,Y=P.attributes;let W=0;const $=U.getAttributes();for(const X in $)if($[X].location>=0){const _t=q[X];let St=Y[X];if(St===void 0&&(X==="instanceMatrix"&&S.instanceMatrix&&(St=S.instanceMatrix),X==="instanceColor"&&S.instanceColor&&(St=S.instanceColor)),_t===void 0||_t.attribute!==St||St&&_t.data!==St.data)return!0;W++}return s.attributesNum!==W||s.index!==O}function g(S,P,U,O){const q={},Y=P.attributes;let W=0;const $=U.getAttributes();for(const X in $)if($[X].location>=0){let _t=Y[X];_t===void 0&&(X==="instanceMatrix"&&S.instanceMatrix&&(_t=S.instanceMatrix),X==="instanceColor"&&S.instanceColor&&(_t=S.instanceColor));const St={};St.attribute=_t,_t&&_t.data&&(St.data=_t.data),q[X]=St,W++}s.attributes=q,s.attributesNum=W,s.index=O}function _(){const S=s.newAttributes;for(let P=0,U=S.length;P<U;P++)S[P]=0}function p(S){m(S,0)}function m(S,P){const U=s.newAttributes,O=s.enabledAttributes,q=s.attributeDivisors;U[S]=1,O[S]===0&&(r.enableVertexAttribArray(S),O[S]=1),q[S]!==P&&(r.vertexAttribDivisor(S,P),q[S]=P)}function x(){const S=s.newAttributes,P=s.enabledAttributes;for(let U=0,O=P.length;U<O;U++)P[U]!==S[U]&&(r.disableVertexAttribArray(U),P[U]=0)}function y(S,P,U,O,q,Y,W){W===!0?r.vertexAttribIPointer(S,P,U,q,Y):r.vertexAttribPointer(S,P,U,O,q,Y)}function v(S,P,U,O){_();const q=O.attributes,Y=U.getAttributes(),W=P.defaultAttributeValues;for(const $ in Y){const X=Y[$];if(X.location>=0){let dt=q[$];if(dt===void 0&&($==="instanceMatrix"&&S.instanceMatrix&&(dt=S.instanceMatrix),$==="instanceColor"&&S.instanceColor&&(dt=S.instanceColor)),dt!==void 0){const _t=dt.normalized,St=dt.itemSize,Xt=t.get(dt);if(Xt===void 0)continue;const ne=Xt.buffer,Z=Xt.type,st=Xt.bytesPerElement,pt=Z===r.INT||Z===r.UNSIGNED_INT||dt.gpuType===yc;if(dt.isInterleavedBufferAttribute){const Mt=dt.data,Ct=Mt.stride,Pt=dt.offset;if(Mt.isInstancedInterleavedBuffer){for(let Wt=0;Wt<X.locationSize;Wt++)m(X.location+Wt,Mt.meshPerAttribute);S.isInstancedMesh!==!0&&O._maxInstanceCount===void 0&&(O._maxInstanceCount=Mt.meshPerAttribute*Mt.count)}else for(let Wt=0;Wt<X.locationSize;Wt++)p(X.location+Wt);r.bindBuffer(r.ARRAY_BUFFER,ne);for(let Wt=0;Wt<X.locationSize;Wt++)y(X.location+Wt,St/X.locationSize,Z,_t,Ct*st,(Pt+St/X.locationSize*Wt)*st,pt)}else{if(dt.isInstancedBufferAttribute){for(let Mt=0;Mt<X.locationSize;Mt++)m(X.location+Mt,dt.meshPerAttribute);S.isInstancedMesh!==!0&&O._maxInstanceCount===void 0&&(O._maxInstanceCount=dt.meshPerAttribute*dt.count)}else for(let Mt=0;Mt<X.locationSize;Mt++)p(X.location+Mt);r.bindBuffer(r.ARRAY_BUFFER,ne);for(let Mt=0;Mt<X.locationSize;Mt++)y(X.location+Mt,St/X.locationSize,Z,_t,St*st,St/X.locationSize*Mt*st,pt)}}else if(W!==void 0){const _t=W[$];if(_t!==void 0)switch(_t.length){case 2:r.vertexAttrib2fv(X.location,_t);break;case 3:r.vertexAttrib3fv(X.location,_t);break;case 4:r.vertexAttrib4fv(X.location,_t);break;default:r.vertexAttrib1fv(X.location,_t)}}}}x()}function R(){L();for(const S in n){const P=n[S];for(const U in P){const O=P[U];for(const q in O)h(O[q].object),delete O[q];delete P[U]}delete n[S]}}function T(S){if(n[S.id]===void 0)return;const P=n[S.id];for(const U in P){const O=P[U];for(const q in O)h(O[q].object),delete O[q];delete P[U]}delete n[S.id]}function b(S){for(const P in n){const U=n[P];if(U[S.id]===void 0)continue;const O=U[S.id];for(const q in O)h(O[q].object),delete O[q];delete U[S.id]}}function L(){w(),o=!0,s!==i&&(s=i,l(s.object))}function w(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:a,reset:L,resetDefaultState:w,dispose:R,releaseStatesOfGeometry:T,releaseStatesOfProgram:b,initAttributes:_,enableAttribute:p,disableUnusedAttributes:x}}function P0(r,t,e){let n;function i(l){n=l}function s(l,h){r.drawArrays(n,l,h),e.update(h,n,1)}function o(l,h,u){u!==0&&(r.drawArraysInstanced(n,l,h,u),e.update(h,n,u))}function a(l,h,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,h,0,u);let f=0;for(let g=0;g<u;g++)f+=h[g];e.update(f,n,1)}function c(l,h,u,d){if(u===0)return;const f=t.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<l.length;g++)o(l[g],h[g],d[g]);else{f.multiDrawArraysInstancedWEBGL(n,l,0,h,0,d,0,u);let g=0;for(let _=0;_<u;_++)g+=h[_];for(let _=0;_<d.length;_++)e.update(g,n,d[_])}}this.setMode=i,this.render=s,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=c}function I0(r,t,e,n){let i;function s(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){const T=t.get("EXT_texture_filter_anisotropic");i=r.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(T){return!(T!==en&&n.convert(T)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(T){const b=T===tr&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(T!==Xn&&n.convert(T)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==yn&&!b)}function c(T){if(T==="highp"){if(r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.MEDIUM_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=e.precision!==void 0?e.precision:"highp";const h=c(l);h!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);const u=e.logarithmicDepthBuffer===!0,d=r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS),f=r.getParameter(r.MAX_VERTEX_TEXTURE_IMAGE_UNITS),g=r.getParameter(r.MAX_TEXTURE_SIZE),_=r.getParameter(r.MAX_CUBE_MAP_TEXTURE_SIZE),p=r.getParameter(r.MAX_VERTEX_ATTRIBS),m=r.getParameter(r.MAX_VERTEX_UNIFORM_VECTORS),x=r.getParameter(r.MAX_VARYING_VECTORS),y=r.getParameter(r.MAX_FRAGMENT_UNIFORM_VECTORS),v=f>0,R=r.getParameter(r.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:u,maxTextures:d,maxVertexTextures:f,maxTextureSize:g,maxCubemapSize:_,maxAttributes:p,maxVertexUniforms:m,maxVaryings:x,maxFragmentUniforms:y,vertexTextures:v,maxSamples:R}}function D0(r){const t=this;let e=null,n=0,i=!1,s=!1;const o=new yi,a=new Gt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){const f=u.length!==0||d||n!==0||i;return i=d,n=u.length,f},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(u,d){e=h(u,d,0)},this.setState=function(u,d,f){const g=u.clippingPlanes,_=u.clipIntersection,p=u.clipShadows,m=r.get(u);if(!i||g===null||g.length===0||s&&!p)s?h(null):l();else{const x=s?0:n,y=x*4;let v=m.clippingState||null;c.value=v,v=h(g,d,y,f);for(let R=0;R!==y;++R)v[R]=e[R];m.clippingState=v,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=x}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(u,d,f,g){const _=u!==null?u.length:0;let p=null;if(_!==0){if(p=c.value,g!==!0||p===null){const m=f+_*4,x=d.matrixWorldInverse;a.getNormalMatrix(x),(p===null||p.length<m)&&(p=new Float32Array(m));for(let y=0,v=f;y!==_;++y,v+=4)o.copy(u[y]).applyMatrix4(x,a),o.normal.toArray(p,v),p[v+3]=o.constant}c.value=p,c.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,p}}function U0(r){let t=new WeakMap;function e(o,a){return a===Da?o.mapping=fs:a===Ua&&(o.mapping=ps),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===Da||a===Ua)if(t.has(o)){const c=t.get(o).texture;return e(c,o.mapping)}else{const c=o.image;if(c&&c.height>0){const l=new Xf(c.height);return l.fromEquirectangularTexture(r,o),t.set(o,l),o.addEventListener("dispose",i),e(l.texture,o.mapping)}else return null}}return o}function i(o){const a=o.target;a.removeEventListener("dispose",i);const c=t.get(a);c!==void 0&&(t.delete(a),c.dispose())}function s(){t=new WeakMap}return{get:n,dispose:s}}class Ic extends vu{constructor(t=-1,e=1,n=1,i=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=i,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,i,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let s=n-t,o=n+t,a=i+e,c=i-e;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=l*this.view.offsetX,o=s+l*this.view.width,a-=h*this.view.offsetY,c=a-h*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,c,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const os=4,El=[.125,.215,.35,.446,.526,.582],bi=20,ia=new Ic,Rl=new nt;let sa=null,ra=0,oa=0,aa=!1;const Mi=(1+Math.sqrt(5))/2,$i=1/Mi,Cl=[new A(-Mi,$i,0),new A(Mi,$i,0),new A(-$i,0,Mi),new A($i,0,Mi),new A(0,Mi,-$i),new A(0,Mi,$i),new A(-1,1,-1),new A(1,1,-1),new A(-1,1,1),new A(1,1,1)];class Ll{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,i=100){sa=this._renderer.getRenderTarget(),ra=this._renderer.getActiveCubeFace(),oa=this._renderer.getActiveMipmapLevel(),aa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(t,n,i,s),e>0&&this._blur(s,0,0,e),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Dl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Il(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(sa,ra,oa),this._renderer.xr.enabled=aa,t.scissorTest=!1,Er(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===fs||t.mapping===ps?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),sa=this._renderer.getRenderTarget(),ra=this._renderer.getActiveCubeFace(),oa=this._renderer.getActiveMipmapLevel(),aa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Ke,minFilter:Ke,generateMipmaps:!1,type:tr,format:en,colorSpace:Oe,depthBuffer:!1},i=Pl(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Pl(t,e,n);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=N0(s)),this._blurMaterial=k0(s,t,e)}return i}_compileMaterial(t){const e=new jt(this._lodPlanes[0],t);this._renderer.compile(e,ia)}_sceneToCubeUV(t,e,n,i){const a=new Xe(90,1,e,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,d=h.toneMapping;h.getClearColor(Rl),h.toneMapping=Gn,h.autoClear=!1;const f=new ke({name:"PMREM.Background",side:Ve,depthWrite:!1,depthTest:!1}),g=new jt(new wn,f);let _=!1;const p=t.background;p?p.isColor&&(f.color.copy(p),t.background=null,_=!0):(f.color.copy(Rl),_=!0);for(let m=0;m<6;m++){const x=m%3;x===0?(a.up.set(0,c[m],0),a.lookAt(l[m],0,0)):x===1?(a.up.set(0,0,c[m]),a.lookAt(0,l[m],0)):(a.up.set(0,c[m],0),a.lookAt(0,0,l[m]));const y=this._cubeSize;Er(i,x*y,m>2?y:0,y,y),h.setRenderTarget(i),_&&h.render(g,a),h.render(t,a)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=d,h.autoClear=u,t.background=p}_textureToCubeUV(t,e){const n=this._renderer,i=t.mapping===fs||t.mapping===ps;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Dl()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Il());const s=i?this._cubemapMaterial:this._equirectMaterial,o=new jt(this._lodPlanes[0],s),a=s.uniforms;a.envMap.value=t;const c=this._cubeSize;Er(e,0,0,3*c,2*c),n.setRenderTarget(e),n.render(o,ia)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const i=this._lodPlanes.length;for(let s=1;s<i;s++){const o=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=Cl[(i-s-1)%Cl.length];this._blur(t,s-1,s,o,a)}e.autoClear=n}_blur(t,e,n,i,s){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,i,"latitudinal",s),this._halfBlur(o,t,n,n,i,"longitudinal",s)}_halfBlur(t,e,n,i,s,o,a){const c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,u=new jt(this._lodPlanes[i],l),d=l.uniforms,f=this._sizeLods[n]-1,g=isFinite(s)?Math.PI/(2*f):2*Math.PI/(2*bi-1),_=s/g,p=isFinite(s)?1+Math.floor(h*_):bi;p>bi&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${bi}`);const m=[];let x=0;for(let b=0;b<bi;++b){const L=b/_,w=Math.exp(-L*L/2);m.push(w),b===0?x+=w:b<p&&(x+=2*w)}for(let b=0;b<m.length;b++)m[b]=m[b]/x;d.envMap.value=t.texture,d.samples.value=p,d.weights.value=m,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);const{_lodMax:y}=this;d.dTheta.value=g,d.mipInt.value=y-n;const v=this._sizeLods[i],R=3*v*(i>y-os?i-y+os:0),T=4*(this._cubeSize-v);Er(e,R,T,3*v,2*v),c.setRenderTarget(e),c.render(u,ia)}}function N0(r){const t=[],e=[],n=[];let i=r;const s=r-os+1+El.length;for(let o=0;o<s;o++){const a=Math.pow(2,i);e.push(a);let c=1/a;o>r-os?c=El[o-r+os-1]:o===0&&(c=0),n.push(c);const l=1/(a-2),h=-l,u=1+l,d=[h,h,u,h,u,u,h,h,u,u,h,u],f=6,g=6,_=3,p=2,m=1,x=new Float32Array(_*g*f),y=new Float32Array(p*g*f),v=new Float32Array(m*g*f);for(let T=0;T<f;T++){const b=T%3*2/3-1,L=T>2?0:-1,w=[b,L,0,b+2/3,L,0,b+2/3,L+1,0,b,L,0,b+2/3,L+1,0,b,L+1,0];x.set(w,_*g*T),y.set(d,p*g*T);const S=[T,T,T,T,T,T];v.set(S,m*g*T)}const R=new Me;R.setAttribute("position",new ue(x,_)),R.setAttribute("uv",new ue(y,p)),R.setAttribute("faceIndex",new ue(v,m)),t.push(R),i>os&&i--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Pl(r,t,e){const n=new Ei(r,t,e);return n.texture.mapping=Mo,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Er(r,t,e,n,i){r.viewport.set(t,e,n,i),r.scissor.set(t,e,n,i)}function k0(r,t,e){const n=new Float32Array(bi),i=new A(0,1,0);return new Tn({name:"SphericalGaussianBlur",defines:{n:bi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:Dc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:hi,depthTest:!1,depthWrite:!1})}function Il(){return new Tn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Dc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:hi,depthTest:!1,depthWrite:!1})}function Dl(){return new Tn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Dc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:hi,depthTest:!1,depthWrite:!1})}function Dc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function O0(r){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const c=a.mapping,l=c===Da||c===Ua,h=c===fs||c===ps;if(l||h){let u=t.get(a);const d=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return e===null&&(e=new Ll(r)),u=l?e.fromEquirectangular(a,u):e.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),u.texture;if(u!==void 0)return u.texture;{const f=a.image;return l&&f&&f.height>0||h&&f&&i(f)?(e===null&&(e=new Ll(r)),u=l?e.fromEquirectangular(a):e.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),a.addEventListener("dispose",s),u.texture):null}}}return a}function i(a){let c=0;const l=6;for(let h=0;h<l;h++)a[h]!==void 0&&c++;return c===l}function s(a){const c=a.target;c.removeEventListener("dispose",s);const l=t.get(c);l!==void 0&&(t.delete(c),l.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function F0(r){const t={};function e(n){if(t[n]!==void 0)return t[n];let i;switch(n){case"WEBGL_depth_texture":i=r.getExtension("WEBGL_depth_texture")||r.getExtension("MOZ_WEBGL_depth_texture")||r.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=r.getExtension("EXT_texture_filter_anisotropic")||r.getExtension("MOZ_EXT_texture_filter_anisotropic")||r.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=r.getExtension("WEBGL_compressed_texture_s3tc")||r.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=r.getExtension("WEBGL_compressed_texture_pvrtc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=r.getExtension(n)}return t[n]=i,i}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const i=e(n);return i===null&&Lc("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function B0(r,t,e,n){const i={},s=new WeakMap;function o(u){const d=u.target;d.index!==null&&t.remove(d.index);for(const g in d.attributes)t.remove(d.attributes[g]);for(const g in d.morphAttributes){const _=d.morphAttributes[g];for(let p=0,m=_.length;p<m;p++)t.remove(_[p])}d.removeEventListener("dispose",o),delete i[d.id];const f=s.get(d);f&&(t.remove(f),s.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function a(u,d){return i[d.id]===!0||(d.addEventListener("dispose",o),i[d.id]=!0,e.memory.geometries++),d}function c(u){const d=u.attributes;for(const g in d)t.update(d[g],r.ARRAY_BUFFER);const f=u.morphAttributes;for(const g in f){const _=f[g];for(let p=0,m=_.length;p<m;p++)t.update(_[p],r.ARRAY_BUFFER)}}function l(u){const d=[],f=u.index,g=u.attributes.position;let _=0;if(f!==null){const x=f.array;_=f.version;for(let y=0,v=x.length;y<v;y+=3){const R=x[y+0],T=x[y+1],b=x[y+2];d.push(R,T,T,b,b,R)}}else if(g!==void 0){const x=g.array;_=g.version;for(let y=0,v=x.length/3-1;y<v;y+=3){const R=y+0,T=y+1,b=y+2;d.push(R,T,T,b,b,R)}}else return;const p=new(du(d)?_u:To)(d,1);p.version=_;const m=s.get(u);m&&t.remove(m),s.set(u,p)}function h(u){const d=s.get(u);if(d){const f=u.index;f!==null&&d.version<f.version&&l(u)}else l(u);return s.get(u)}return{get:a,update:c,getWireframeAttribute:h}}function z0(r,t,e){let n;function i(d){n=d}let s,o;function a(d){s=d.type,o=d.bytesPerElement}function c(d,f){r.drawElements(n,f,s,d*o),e.update(f,n,1)}function l(d,f,g){g!==0&&(r.drawElementsInstanced(n,f,s,d*o,g),e.update(f,n,g))}function h(d,f,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,s,d,0,g);let p=0;for(let m=0;m<g;m++)p+=f[m];e.update(p,n,1)}function u(d,f,g,_){if(g===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let m=0;m<d.length;m++)l(d[m]/o,f[m],_[m]);else{p.multiDrawElementsInstancedWEBGL(n,f,0,s,d,0,_,0,g);let m=0;for(let x=0;x<g;x++)m+=f[x];for(let x=0;x<_.length;x++)e.update(m,n,_[x])}}this.setMode=i,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function H0(r){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,o,a){switch(e.calls++,o){case r.TRIANGLES:e.triangles+=a*(s/3);break;case r.LINES:e.lines+=a*(s/2);break;case r.LINE_STRIP:e.lines+=a*(s-1);break;case r.LINE_LOOP:e.lines+=a*s;break;case r.POINTS:e.points+=a*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function i(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:i,update:n}}function V0(r,t,e){const n=new WeakMap,i=new he;function s(o,a,c){const l=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0;let d=n.get(a);if(d===void 0||d.count!==u){let S=function(){L.dispose(),n.delete(a),a.removeEventListener("dispose",S)};var f=S;d!==void 0&&d.texture.dispose();const g=a.morphAttributes.position!==void 0,_=a.morphAttributes.normal!==void 0,p=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],x=a.morphAttributes.normal||[],y=a.morphAttributes.color||[];let v=0;g===!0&&(v=1),_===!0&&(v=2),p===!0&&(v=3);let R=a.attributes.position.count*v,T=1;R>t.maxTextureSize&&(T=Math.ceil(R/t.maxTextureSize),R=t.maxTextureSize);const b=new Float32Array(R*T*4*u),L=new pu(b,R,T,u);L.type=yn,L.needsUpdate=!0;const w=v*4;for(let P=0;P<u;P++){const U=m[P],O=x[P],q=y[P],Y=R*T*4*P;for(let W=0;W<U.count;W++){const $=W*w;g===!0&&(i.fromBufferAttribute(U,W),b[Y+$+0]=i.x,b[Y+$+1]=i.y,b[Y+$+2]=i.z,b[Y+$+3]=0),_===!0&&(i.fromBufferAttribute(O,W),b[Y+$+4]=i.x,b[Y+$+5]=i.y,b[Y+$+6]=i.z,b[Y+$+7]=0),p===!0&&(i.fromBufferAttribute(q,W),b[Y+$+8]=i.x,b[Y+$+9]=i.y,b[Y+$+10]=i.z,b[Y+$+11]=q.itemSize===4?i.w:1)}}d={count:u,texture:L,size:new at(R,T)},n.set(a,d),a.addEventListener("dispose",S)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(r,"morphTexture",o.morphTexture,e);else{let g=0;for(let p=0;p<l.length;p++)g+=l[p];const _=a.morphTargetsRelative?1:1-g;c.getUniforms().setValue(r,"morphTargetBaseInfluence",_),c.getUniforms().setValue(r,"morphTargetInfluences",l)}c.getUniforms().setValue(r,"morphTargetsTexture",d.texture,e),c.getUniforms().setValue(r,"morphTargetsTextureSize",d.size)}return{update:s}}function G0(r,t,e,n){let i=new WeakMap;function s(c){const l=n.render.frame,h=c.geometry,u=t.get(c,h);if(i.get(u)!==l&&(t.update(u),i.set(u,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),i.get(c)!==l&&(e.update(c.instanceMatrix,r.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,r.ARRAY_BUFFER),i.set(c,l))),c.isSkinnedMesh){const d=c.skeleton;i.get(d)!==l&&(d.update(),i.set(d,l))}return u}function o(){i=new WeakMap}function a(c){const l=c.target;l.removeEventListener("dispose",a),e.remove(l.instanceMatrix),l.instanceColor!==null&&e.remove(l.instanceColor)}return{update:s,dispose:o}}class Su extends Ee{constructor(t,e,n,i,s,o,a,c,l,h=ls){if(h!==ls&&h!==gs)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===ls&&(n=Ai),n===void 0&&h===gs&&(n=ms),super(null,i,s,o,a,c,h,n,l),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:He,this.minFilter=c!==void 0?c:He,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const bu=new Ee,Ul=new Su(1,1),wu=new pu,Tu=new Cf,Au=new yu,Nl=[],kl=[],Ol=new Float32Array(16),Fl=new Float32Array(9),Bl=new Float32Array(4);function Ms(r,t,e){const n=r[0];if(n<=0||n>0)return r;const i=t*e;let s=Nl[i];if(s===void 0&&(s=new Float32Array(i),Nl[i]=s),t!==0){n.toArray(s,0);for(let o=1,a=0;o!==t;++o)a+=e,r[o].toArray(s,a)}return s}function Le(r,t){if(r.length!==t.length)return!1;for(let e=0,n=r.length;e<n;e++)if(r[e]!==t[e])return!1;return!0}function Pe(r,t){for(let e=0,n=t.length;e<n;e++)r[e]=t[e]}function Ao(r,t){let e=kl[t];e===void 0&&(e=new Int32Array(t),kl[t]=e);for(let n=0;n!==t;++n)e[n]=r.allocateTextureUnit();return e}function W0(r,t){const e=this.cache;e[0]!==t&&(r.uniform1f(this.addr,t),e[0]=t)}function X0(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Le(e,t))return;r.uniform2fv(this.addr,t),Pe(e,t)}}function q0(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(r.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Le(e,t))return;r.uniform3fv(this.addr,t),Pe(e,t)}}function Y0(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Le(e,t))return;r.uniform4fv(this.addr,t),Pe(e,t)}}function K0(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(Le(e,t))return;r.uniformMatrix2fv(this.addr,!1,t),Pe(e,t)}else{if(Le(e,n))return;Bl.set(n),r.uniformMatrix2fv(this.addr,!1,Bl),Pe(e,n)}}function j0(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(Le(e,t))return;r.uniformMatrix3fv(this.addr,!1,t),Pe(e,t)}else{if(Le(e,n))return;Fl.set(n),r.uniformMatrix3fv(this.addr,!1,Fl),Pe(e,n)}}function $0(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(Le(e,t))return;r.uniformMatrix4fv(this.addr,!1,t),Pe(e,t)}else{if(Le(e,n))return;Ol.set(n),r.uniformMatrix4fv(this.addr,!1,Ol),Pe(e,n)}}function Z0(r,t){const e=this.cache;e[0]!==t&&(r.uniform1i(this.addr,t),e[0]=t)}function J0(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Le(e,t))return;r.uniform2iv(this.addr,t),Pe(e,t)}}function Q0(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Le(e,t))return;r.uniform3iv(this.addr,t),Pe(e,t)}}function tg(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Le(e,t))return;r.uniform4iv(this.addr,t),Pe(e,t)}}function eg(r,t){const e=this.cache;e[0]!==t&&(r.uniform1ui(this.addr,t),e[0]=t)}function ng(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Le(e,t))return;r.uniform2uiv(this.addr,t),Pe(e,t)}}function ig(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Le(e,t))return;r.uniform3uiv(this.addr,t),Pe(e,t)}}function sg(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Le(e,t))return;r.uniform4uiv(this.addr,t),Pe(e,t)}}function rg(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i);let s;this.type===r.SAMPLER_2D_SHADOW?(Ul.compareFunction=hu,s=Ul):s=bu,e.setTexture2D(t||s,i)}function og(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTexture3D(t||Tu,i)}function ag(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTextureCube(t||Au,i)}function cg(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTexture2DArray(t||wu,i)}function lg(r){switch(r){case 5126:return W0;case 35664:return X0;case 35665:return q0;case 35666:return Y0;case 35674:return K0;case 35675:return j0;case 35676:return $0;case 5124:case 35670:return Z0;case 35667:case 35671:return J0;case 35668:case 35672:return Q0;case 35669:case 35673:return tg;case 5125:return eg;case 36294:return ng;case 36295:return ig;case 36296:return sg;case 35678:case 36198:case 36298:case 36306:case 35682:return rg;case 35679:case 36299:case 36307:return og;case 35680:case 36300:case 36308:case 36293:return ag;case 36289:case 36303:case 36311:case 36292:return cg}}function hg(r,t){r.uniform1fv(this.addr,t)}function ug(r,t){const e=Ms(t,this.size,2);r.uniform2fv(this.addr,e)}function dg(r,t){const e=Ms(t,this.size,3);r.uniform3fv(this.addr,e)}function fg(r,t){const e=Ms(t,this.size,4);r.uniform4fv(this.addr,e)}function pg(r,t){const e=Ms(t,this.size,4);r.uniformMatrix2fv(this.addr,!1,e)}function mg(r,t){const e=Ms(t,this.size,9);r.uniformMatrix3fv(this.addr,!1,e)}function gg(r,t){const e=Ms(t,this.size,16);r.uniformMatrix4fv(this.addr,!1,e)}function _g(r,t){r.uniform1iv(this.addr,t)}function xg(r,t){r.uniform2iv(this.addr,t)}function vg(r,t){r.uniform3iv(this.addr,t)}function yg(r,t){r.uniform4iv(this.addr,t)}function Mg(r,t){r.uniform1uiv(this.addr,t)}function Sg(r,t){r.uniform2uiv(this.addr,t)}function bg(r,t){r.uniform3uiv(this.addr,t)}function wg(r,t){r.uniform4uiv(this.addr,t)}function Tg(r,t,e){const n=this.cache,i=t.length,s=Ao(e,i);Le(n,s)||(r.uniform1iv(this.addr,s),Pe(n,s));for(let o=0;o!==i;++o)e.setTexture2D(t[o]||bu,s[o])}function Ag(r,t,e){const n=this.cache,i=t.length,s=Ao(e,i);Le(n,s)||(r.uniform1iv(this.addr,s),Pe(n,s));for(let o=0;o!==i;++o)e.setTexture3D(t[o]||Tu,s[o])}function Eg(r,t,e){const n=this.cache,i=t.length,s=Ao(e,i);Le(n,s)||(r.uniform1iv(this.addr,s),Pe(n,s));for(let o=0;o!==i;++o)e.setTextureCube(t[o]||Au,s[o])}function Rg(r,t,e){const n=this.cache,i=t.length,s=Ao(e,i);Le(n,s)||(r.uniform1iv(this.addr,s),Pe(n,s));for(let o=0;o!==i;++o)e.setTexture2DArray(t[o]||wu,s[o])}function Cg(r){switch(r){case 5126:return hg;case 35664:return ug;case 35665:return dg;case 35666:return fg;case 35674:return pg;case 35675:return mg;case 35676:return gg;case 5124:case 35670:return _g;case 35667:case 35671:return xg;case 35668:case 35672:return vg;case 35669:case 35673:return yg;case 5125:return Mg;case 36294:return Sg;case 36295:return bg;case 36296:return wg;case 35678:case 36198:case 36298:case 36306:case 35682:return Tg;case 35679:case 36299:case 36307:return Ag;case 35680:case 36300:case 36308:case 36293:return Eg;case 36289:case 36303:case 36311:case 36292:return Rg}}class Lg{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=lg(e.type)}}class Pg{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Cg(e.type)}}class Ig{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const i=this.seq;for(let s=0,o=i.length;s!==o;++s){const a=i[s];a.setValue(t,e[a.id],n)}}}const ca=/(\w+)(\])?(\[|\.)?/g;function zl(r,t){r.seq.push(t),r.map[t.id]=t}function Dg(r,t,e){const n=r.name,i=n.length;for(ca.lastIndex=0;;){const s=ca.exec(n),o=ca.lastIndex;let a=s[1];const c=s[2]==="]",l=s[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===i){zl(e,l===void 0?new Lg(a,r,t):new Pg(a,r,t));break}else{let u=e.map[a];u===void 0&&(u=new Ig(a),zl(e,u)),e=u}}}class ro{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){const s=t.getActiveUniform(e,i),o=t.getUniformLocation(e,s.name);Dg(s,o,this)}}setValue(t,e,n,i){const s=this.map[e];s!==void 0&&s.setValue(t,n,i)}setOptional(t,e,n){const i=e[n];i!==void 0&&this.setValue(t,n,i)}static upload(t,e,n,i){for(let s=0,o=e.length;s!==o;++s){const a=e[s],c=n[a.id];c.needsUpdate!==!1&&a.setValue(t,c.value,i)}}static seqWithValue(t,e){const n=[];for(let i=0,s=t.length;i!==s;++i){const o=t[i];o.id in e&&n.push(o)}return n}}function Hl(r,t,e){const n=r.createShader(t);return r.shaderSource(n,e),r.compileShader(n),n}const Ug=37297;let Ng=0;function kg(r,t){const e=r.split(`
`),n=[],i=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let o=i;o<s;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}function Og(r){const t=te.getPrimaries(te.workingColorSpace),e=te.getPrimaries(r);let n;switch(t===e?n="":t===uo&&e===ho?n="LinearDisplayP3ToLinearSRGB":t===ho&&e===uo&&(n="LinearSRGBToLinearDisplayP3"),r){case Oe:case bo:return[n,"LinearTransferOETF"];case _e:case Rc:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",r),[n,"LinearTransferOETF"]}}function Vl(r,t,e){const n=r.getShaderParameter(t,r.COMPILE_STATUS),i=r.getShaderInfoLog(t).trim();if(n&&i==="")return"";const s=/ERROR: 0:(\d+)/.exec(i);if(s){const o=parseInt(s[1]);return e.toUpperCase()+`

`+i+`

`+kg(r.getShaderSource(t),o)}else return i}function Fg(r,t){const e=Og(t);return`vec4 ${r}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function Bg(r,t){let e;switch(t){case Bd:e="Linear";break;case zd:e="Reinhard";break;case Hd:e="OptimizedCineon";break;case $h:e="ACESFilmic";break;case Gd:e="AgX";break;case Wd:e="Neutral";break;case Vd:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+r+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}function zg(r){return[r.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",r.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Hs).join(`
`)}function Hg(r){const t=[];for(const e in r){const n=r[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Vg(r,t){const e={},n=r.getProgramParameter(t,r.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const s=r.getActiveAttrib(t,i),o=s.name;let a=1;s.type===r.FLOAT_MAT2&&(a=2),s.type===r.FLOAT_MAT3&&(a=3),s.type===r.FLOAT_MAT4&&(a=4),e[o]={type:s.type,location:r.getAttribLocation(t,o),locationSize:a}}return e}function Hs(r){return r!==""}function Gl(r,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return r.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Wl(r,t){return r.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const Gg=/^[ \t]*#include +<([\w\d./]+)>/gm;function hc(r){return r.replace(Gg,Xg)}const Wg=new Map;function Xg(r,t){let e=Vt[t];if(e===void 0){const n=Wg.get(t);if(n!==void 0)e=Vt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return hc(e)}const qg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Xl(r){return r.replace(qg,Yg)}function Yg(r,t,e,n){let i="";for(let s=parseInt(t);s<parseInt(e);s++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return i}function ql(r){let t=`precision ${r.precision} float;
	precision ${r.precision} int;
	precision ${r.precision} sampler2D;
	precision ${r.precision} samplerCube;
	precision ${r.precision} sampler3D;
	precision ${r.precision} sampler2DArray;
	precision ${r.precision} sampler2DShadow;
	precision ${r.precision} samplerCubeShadow;
	precision ${r.precision} sampler2DArrayShadow;
	precision ${r.precision} isampler2D;
	precision ${r.precision} isampler3D;
	precision ${r.precision} isamplerCube;
	precision ${r.precision} isampler2DArray;
	precision ${r.precision} usampler2D;
	precision ${r.precision} usampler3D;
	precision ${r.precision} usamplerCube;
	precision ${r.precision} usampler2DArray;
	`;return r.precision==="highp"?t+=`
#define HIGH_PRECISION`:r.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:r.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Kg(r){let t="SHADOWMAP_TYPE_BASIC";return r.shadowMapType===Kh?t="SHADOWMAP_TYPE_PCF":r.shadowMapType===jh?t="SHADOWMAP_TYPE_PCF_SOFT":r.shadowMapType===Fn&&(t="SHADOWMAP_TYPE_VSM"),t}function jg(r){let t="ENVMAP_TYPE_CUBE";if(r.envMap)switch(r.envMapMode){case fs:case ps:t="ENVMAP_TYPE_CUBE";break;case Mo:t="ENVMAP_TYPE_CUBE_UV";break}return t}function $g(r){let t="ENVMAP_MODE_REFLECTION";if(r.envMap)switch(r.envMapMode){case ps:t="ENVMAP_MODE_REFRACTION";break}return t}function Zg(r){let t="ENVMAP_BLENDING_NONE";if(r.envMap)switch(r.combine){case vc:t="ENVMAP_BLENDING_MULTIPLY";break;case Od:t="ENVMAP_BLENDING_MIX";break;case Fd:t="ENVMAP_BLENDING_ADD";break}return t}function Jg(r){const t=r.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function Qg(r,t,e,n){const i=r.getContext(),s=e.defines;let o=e.vertexShader,a=e.fragmentShader;const c=Kg(e),l=jg(e),h=$g(e),u=Zg(e),d=Jg(e),f=zg(e),g=Hg(s),_=i.createProgram();let p,m,x=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Hs).join(`
`),p.length>0&&(p+=`
`),m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Hs).join(`
`),m.length>0&&(m+=`
`)):(p=[ql(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Hs).join(`
`),m=[ql(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Gn?"#define TONE_MAPPING":"",e.toneMapping!==Gn?Vt.tonemapping_pars_fragment:"",e.toneMapping!==Gn?Bg("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Vt.colorspace_pars_fragment,Fg("linearToOutputTexel",e.outputColorSpace),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Hs).join(`
`)),o=hc(o),o=Gl(o,e),o=Wl(o,e),a=hc(a),a=Gl(a,e),a=Wl(a,e),o=Xl(o),a=Xl(a),e.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,m=["#define varying in",e.glslVersion===ol?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===ol?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const y=x+p+o,v=x+m+a,R=Hl(i,i.VERTEX_SHADER,y),T=Hl(i,i.FRAGMENT_SHADER,v);i.attachShader(_,R),i.attachShader(_,T),e.index0AttributeName!==void 0?i.bindAttribLocation(_,0,e.index0AttributeName):e.morphTargets===!0&&i.bindAttribLocation(_,0,"position"),i.linkProgram(_);function b(P){if(r.debug.checkShaderErrors){const U=i.getProgramInfoLog(_).trim(),O=i.getShaderInfoLog(R).trim(),q=i.getShaderInfoLog(T).trim();let Y=!0,W=!0;if(i.getProgramParameter(_,i.LINK_STATUS)===!1)if(Y=!1,typeof r.debug.onShaderError=="function")r.debug.onShaderError(i,_,R,T);else{const $=Vl(i,R,"vertex"),X=Vl(i,T,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(_,i.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+U+`
`+$+`
`+X)}else U!==""?console.warn("THREE.WebGLProgram: Program Info Log:",U):(O===""||q==="")&&(W=!1);W&&(P.diagnostics={runnable:Y,programLog:U,vertexShader:{log:O,prefix:p},fragmentShader:{log:q,prefix:m}})}i.deleteShader(R),i.deleteShader(T),L=new ro(i,_),w=Vg(i,_)}let L;this.getUniforms=function(){return L===void 0&&b(this),L};let w;this.getAttributes=function(){return w===void 0&&b(this),w};let S=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return S===!1&&(S=i.getProgramParameter(_,Ug)),S},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(_),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Ng++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=R,this.fragmentShader=T,this}let t_=0;class e_{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,i=this._getShaderStage(e),s=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(i)===!1&&(o.add(i),i.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new n_(t),e.set(t,n)),n}}class n_{constructor(t){this.id=t_++,this.code=t,this.usedTimes=0}}function i_(r,t,e,n,i,s,o){const a=new mu,c=new e_,l=new Set,h=[],u=i.logarithmicDepthBuffer,d=i.vertexTextures;let f=i.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(w){return l.add(w),w===0?"uv":`uv${w}`}function p(w,S,P,U,O){const q=U.fog,Y=O.geometry,W=w.isMeshStandardMaterial?U.environment:null,$=(w.isMeshStandardMaterial?e:t).get(w.envMap||W),X=$&&$.mapping===Mo?$.image.height:null,dt=g[w.type];w.precision!==null&&(f=i.getMaxPrecision(w.precision),f!==w.precision&&console.warn("THREE.WebGLProgram.getParameters:",w.precision,"not supported, using",f,"instead."));const _t=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,St=_t!==void 0?_t.length:0;let Xt=0;Y.morphAttributes.position!==void 0&&(Xt=1),Y.morphAttributes.normal!==void 0&&(Xt=2),Y.morphAttributes.color!==void 0&&(Xt=3);let ne,Z,st,pt;if(dt){const ie=bn[dt];ne=ie.vertexShader,Z=ie.fragmentShader}else ne=w.vertexShader,Z=w.fragmentShader,c.update(w),st=c.getVertexShaderID(w),pt=c.getFragmentShaderID(w);const Mt=r.getRenderTarget(),Ct=O.isInstancedMesh===!0,Pt=O.isBatchedMesh===!0,Wt=!!w.map,me=!!w.matcap,D=!!$,de=!!w.aoMap,$t=!!w.lightMap,Qt=!!w.bumpMap,At=!!w.normalMap,ve=!!w.displacementMap,Nt=!!w.emissiveMap,z=!!w.metalnessMap,C=!!w.roughnessMap,M=w.anisotropy>0,F=w.clearcoat>0,j=w.dispersion>0,et=w.iridescence>0,Q=w.sheen>0,Tt=w.transmission>0,ut=M&&!!w.anisotropyMap,xt=F&&!!w.clearcoatMap,Ot=F&&!!w.clearcoatNormalMap,it=F&&!!w.clearcoatRoughnessMap,H=et&&!!w.iridescenceMap,vt=et&&!!w.iridescenceThicknessMap,Lt=Q&&!!w.sheenColorMap,yt=Q&&!!w.sheenRoughnessMap,zt=!!w.specularMap,qt=!!w.specularColorMap,ye=!!w.specularIntensityMap,N=Tt&&!!w.transmissionMap,rt=Tt&&!!w.thicknessMap,J=!!w.gradientMap,tt=!!w.alphaMap,ct=w.alphaTest>0,Dt=!!w.alphaHash,Zt=!!w.extensions;let we=Gn;w.toneMapped&&(Mt===null||Mt.isXRRenderTarget===!0)&&(we=r.toneMapping);const Ue={shaderID:dt,shaderType:w.type,shaderName:w.name,vertexShader:ne,fragmentShader:Z,defines:w.defines,customVertexShaderID:st,customFragmentShaderID:pt,isRawShaderMaterial:w.isRawShaderMaterial===!0,glslVersion:w.glslVersion,precision:f,batching:Pt,batchingColor:Pt&&O._colorsTexture!==null,instancing:Ct,instancingColor:Ct&&O.instanceColor!==null,instancingMorph:Ct&&O.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:Mt===null?r.outputColorSpace:Mt.isXRRenderTarget===!0?Mt.texture.colorSpace:Oe,alphaToCoverage:!!w.alphaToCoverage,map:Wt,matcap:me,envMap:D,envMapMode:D&&$.mapping,envMapCubeUVHeight:X,aoMap:de,lightMap:$t,bumpMap:Qt,normalMap:At,displacementMap:d&&ve,emissiveMap:Nt,normalMapObjectSpace:At&&w.normalMapType===Zd,normalMapTangentSpace:At&&w.normalMapType===So,metalnessMap:z,roughnessMap:C,anisotropy:M,anisotropyMap:ut,clearcoat:F,clearcoatMap:xt,clearcoatNormalMap:Ot,clearcoatRoughnessMap:it,dispersion:j,iridescence:et,iridescenceMap:H,iridescenceThicknessMap:vt,sheen:Q,sheenColorMap:Lt,sheenRoughnessMap:yt,specularMap:zt,specularColorMap:qt,specularIntensityMap:ye,transmission:Tt,transmissionMap:N,thicknessMap:rt,gradientMap:J,opaque:w.transparent===!1&&w.blending===cs&&w.alphaToCoverage===!1,alphaMap:tt,alphaTest:ct,alphaHash:Dt,combine:w.combine,mapUv:Wt&&_(w.map.channel),aoMapUv:de&&_(w.aoMap.channel),lightMapUv:$t&&_(w.lightMap.channel),bumpMapUv:Qt&&_(w.bumpMap.channel),normalMapUv:At&&_(w.normalMap.channel),displacementMapUv:ve&&_(w.displacementMap.channel),emissiveMapUv:Nt&&_(w.emissiveMap.channel),metalnessMapUv:z&&_(w.metalnessMap.channel),roughnessMapUv:C&&_(w.roughnessMap.channel),anisotropyMapUv:ut&&_(w.anisotropyMap.channel),clearcoatMapUv:xt&&_(w.clearcoatMap.channel),clearcoatNormalMapUv:Ot&&_(w.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:it&&_(w.clearcoatRoughnessMap.channel),iridescenceMapUv:H&&_(w.iridescenceMap.channel),iridescenceThicknessMapUv:vt&&_(w.iridescenceThicknessMap.channel),sheenColorMapUv:Lt&&_(w.sheenColorMap.channel),sheenRoughnessMapUv:yt&&_(w.sheenRoughnessMap.channel),specularMapUv:zt&&_(w.specularMap.channel),specularColorMapUv:qt&&_(w.specularColorMap.channel),specularIntensityMapUv:ye&&_(w.specularIntensityMap.channel),transmissionMapUv:N&&_(w.transmissionMap.channel),thicknessMapUv:rt&&_(w.thicknessMap.channel),alphaMapUv:tt&&_(w.alphaMap.channel),vertexTangents:!!Y.attributes.tangent&&(At||M),vertexColors:w.vertexColors,vertexAlphas:w.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!Y.attributes.uv&&(Wt||tt),fog:!!q,useFog:w.fog===!0,fogExp2:!!q&&q.isFogExp2,flatShading:w.flatShading===!0,sizeAttenuation:w.sizeAttenuation===!0,logarithmicDepthBuffer:u,skinning:O.isSkinnedMesh===!0,morphTargets:Y.morphAttributes.position!==void 0,morphNormals:Y.morphAttributes.normal!==void 0,morphColors:Y.morphAttributes.color!==void 0,morphTargetsCount:St,morphTextureStride:Xt,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:w.dithering,shadowMapEnabled:r.shadowMap.enabled&&P.length>0,shadowMapType:r.shadowMap.type,toneMapping:we,decodeVideoTexture:Wt&&w.map.isVideoTexture===!0&&te.getTransfer(w.map.colorSpace)===fe,premultipliedAlpha:w.premultipliedAlpha,doubleSided:w.side===Ye,flipSided:w.side===Ve,useDepthPacking:w.depthPacking>=0,depthPacking:w.depthPacking||0,index0AttributeName:w.index0AttributeName,extensionClipCullDistance:Zt&&w.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Zt&&w.extensions.multiDraw===!0||Pt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:w.customProgramCacheKey()};return Ue.vertexUv1s=l.has(1),Ue.vertexUv2s=l.has(2),Ue.vertexUv3s=l.has(3),l.clear(),Ue}function m(w){const S=[];if(w.shaderID?S.push(w.shaderID):(S.push(w.customVertexShaderID),S.push(w.customFragmentShaderID)),w.defines!==void 0)for(const P in w.defines)S.push(P),S.push(w.defines[P]);return w.isRawShaderMaterial===!1&&(x(S,w),y(S,w),S.push(r.outputColorSpace)),S.push(w.customProgramCacheKey),S.join()}function x(w,S){w.push(S.precision),w.push(S.outputColorSpace),w.push(S.envMapMode),w.push(S.envMapCubeUVHeight),w.push(S.mapUv),w.push(S.alphaMapUv),w.push(S.lightMapUv),w.push(S.aoMapUv),w.push(S.bumpMapUv),w.push(S.normalMapUv),w.push(S.displacementMapUv),w.push(S.emissiveMapUv),w.push(S.metalnessMapUv),w.push(S.roughnessMapUv),w.push(S.anisotropyMapUv),w.push(S.clearcoatMapUv),w.push(S.clearcoatNormalMapUv),w.push(S.clearcoatRoughnessMapUv),w.push(S.iridescenceMapUv),w.push(S.iridescenceThicknessMapUv),w.push(S.sheenColorMapUv),w.push(S.sheenRoughnessMapUv),w.push(S.specularMapUv),w.push(S.specularColorMapUv),w.push(S.specularIntensityMapUv),w.push(S.transmissionMapUv),w.push(S.thicknessMapUv),w.push(S.combine),w.push(S.fogExp2),w.push(S.sizeAttenuation),w.push(S.morphTargetsCount),w.push(S.morphAttributeCount),w.push(S.numDirLights),w.push(S.numPointLights),w.push(S.numSpotLights),w.push(S.numSpotLightMaps),w.push(S.numHemiLights),w.push(S.numRectAreaLights),w.push(S.numDirLightShadows),w.push(S.numPointLightShadows),w.push(S.numSpotLightShadows),w.push(S.numSpotLightShadowsWithMaps),w.push(S.numLightProbes),w.push(S.shadowMapType),w.push(S.toneMapping),w.push(S.numClippingPlanes),w.push(S.numClipIntersection),w.push(S.depthPacking)}function y(w,S){a.disableAll(),S.supportsVertexTextures&&a.enable(0),S.instancing&&a.enable(1),S.instancingColor&&a.enable(2),S.instancingMorph&&a.enable(3),S.matcap&&a.enable(4),S.envMap&&a.enable(5),S.normalMapObjectSpace&&a.enable(6),S.normalMapTangentSpace&&a.enable(7),S.clearcoat&&a.enable(8),S.iridescence&&a.enable(9),S.alphaTest&&a.enable(10),S.vertexColors&&a.enable(11),S.vertexAlphas&&a.enable(12),S.vertexUv1s&&a.enable(13),S.vertexUv2s&&a.enable(14),S.vertexUv3s&&a.enable(15),S.vertexTangents&&a.enable(16),S.anisotropy&&a.enable(17),S.alphaHash&&a.enable(18),S.batching&&a.enable(19),S.dispersion&&a.enable(20),S.batchingColor&&a.enable(21),w.push(a.mask),a.disableAll(),S.fog&&a.enable(0),S.useFog&&a.enable(1),S.flatShading&&a.enable(2),S.logarithmicDepthBuffer&&a.enable(3),S.skinning&&a.enable(4),S.morphTargets&&a.enable(5),S.morphNormals&&a.enable(6),S.morphColors&&a.enable(7),S.premultipliedAlpha&&a.enable(8),S.shadowMapEnabled&&a.enable(9),S.doubleSided&&a.enable(10),S.flipSided&&a.enable(11),S.useDepthPacking&&a.enable(12),S.dithering&&a.enable(13),S.transmission&&a.enable(14),S.sheen&&a.enable(15),S.opaque&&a.enable(16),S.pointsUvs&&a.enable(17),S.decodeVideoTexture&&a.enable(18),S.alphaToCoverage&&a.enable(19),w.push(a.mask)}function v(w){const S=g[w.type];let P;if(S){const U=bn[S];P=Hf.clone(U.uniforms)}else P=w.uniforms;return P}function R(w,S){let P;for(let U=0,O=h.length;U<O;U++){const q=h[U];if(q.cacheKey===S){P=q,++P.usedTimes;break}}return P===void 0&&(P=new Qg(r,S,w,s),h.push(P)),P}function T(w){if(--w.usedTimes===0){const S=h.indexOf(w);h[S]=h[h.length-1],h.pop(),w.destroy()}}function b(w){c.remove(w)}function L(){c.dispose()}return{getParameters:p,getProgramCacheKey:m,getUniforms:v,acquireProgram:R,releaseProgram:T,releaseShaderCache:b,programs:h,dispose:L}}function s_(){let r=new WeakMap;function t(s){let o=r.get(s);return o===void 0&&(o={},r.set(s,o)),o}function e(s){r.delete(s)}function n(s,o,a){r.get(s)[o]=a}function i(){r=new WeakMap}return{get:t,remove:e,update:n,dispose:i}}function r_(r,t){return r.groupOrder!==t.groupOrder?r.groupOrder-t.groupOrder:r.renderOrder!==t.renderOrder?r.renderOrder-t.renderOrder:r.material.id!==t.material.id?r.material.id-t.material.id:r.z!==t.z?r.z-t.z:r.id-t.id}function Yl(r,t){return r.groupOrder!==t.groupOrder?r.groupOrder-t.groupOrder:r.renderOrder!==t.renderOrder?r.renderOrder-t.renderOrder:r.z!==t.z?t.z-r.z:r.id-t.id}function Kl(){const r=[];let t=0;const e=[],n=[],i=[];function s(){t=0,e.length=0,n.length=0,i.length=0}function o(u,d,f,g,_,p){let m=r[t];return m===void 0?(m={id:u.id,object:u,geometry:d,material:f,groupOrder:g,renderOrder:u.renderOrder,z:_,group:p},r[t]=m):(m.id=u.id,m.object=u,m.geometry=d,m.material=f,m.groupOrder=g,m.renderOrder=u.renderOrder,m.z=_,m.group=p),t++,m}function a(u,d,f,g,_,p){const m=o(u,d,f,g,_,p);f.transmission>0?n.push(m):f.transparent===!0?i.push(m):e.push(m)}function c(u,d,f,g,_,p){const m=o(u,d,f,g,_,p);f.transmission>0?n.unshift(m):f.transparent===!0?i.unshift(m):e.unshift(m)}function l(u,d){e.length>1&&e.sort(u||r_),n.length>1&&n.sort(d||Yl),i.length>1&&i.sort(d||Yl)}function h(){for(let u=t,d=r.length;u<d;u++){const f=r[u];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:e,transmissive:n,transparent:i,init:s,push:a,unshift:c,finish:h,sort:l}}function o_(){let r=new WeakMap;function t(n,i){const s=r.get(n);let o;return s===void 0?(o=new Kl,r.set(n,[o])):i>=s.length?(o=new Kl,s.push(o)):o=s[i],o}function e(){r=new WeakMap}return{get:t,dispose:e}}function a_(){const r={};return{get:function(t){if(r[t.id]!==void 0)return r[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new A,color:new nt};break;case"SpotLight":e={position:new A,direction:new A,color:new nt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new A,color:new nt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new A,skyColor:new nt,groundColor:new nt};break;case"RectAreaLight":e={color:new nt,position:new A,halfWidth:new A,halfHeight:new A};break}return r[t.id]=e,e}}}function c_(){const r={};return{get:function(t){if(r[t.id]!==void 0)return r[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new at};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new at};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new at,shadowCameraNear:1,shadowCameraFar:1e3};break}return r[t.id]=e,e}}}let l_=0;function h_(r,t){return(t.castShadow?2:0)-(r.castShadow?2:0)+(t.map?1:0)-(r.map?1:0)}function u_(r){const t=new a_,e=c_(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new A);const i=new A,s=new Bt,o=new Bt;function a(l){let h=0,u=0,d=0;for(let w=0;w<9;w++)n.probe[w].set(0,0,0);let f=0,g=0,_=0,p=0,m=0,x=0,y=0,v=0,R=0,T=0,b=0;l.sort(h_);for(let w=0,S=l.length;w<S;w++){const P=l[w],U=P.color,O=P.intensity,q=P.distance,Y=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)h+=U.r*O,u+=U.g*O,d+=U.b*O;else if(P.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(P.sh.coefficients[W],O);b++}else if(P.isDirectionalLight){const W=t.get(P);if(W.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const $=P.shadow,X=e.get(P);X.shadowIntensity=$.intensity,X.shadowBias=$.bias,X.shadowNormalBias=$.normalBias,X.shadowRadius=$.radius,X.shadowMapSize=$.mapSize,n.directionalShadow[f]=X,n.directionalShadowMap[f]=Y,n.directionalShadowMatrix[f]=P.shadow.matrix,x++}n.directional[f]=W,f++}else if(P.isSpotLight){const W=t.get(P);W.position.setFromMatrixPosition(P.matrixWorld),W.color.copy(U).multiplyScalar(O),W.distance=q,W.coneCos=Math.cos(P.angle),W.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),W.decay=P.decay,n.spot[_]=W;const $=P.shadow;if(P.map&&(n.spotLightMap[R]=P.map,R++,$.updateMatrices(P),P.castShadow&&T++),n.spotLightMatrix[_]=$.matrix,P.castShadow){const X=e.get(P);X.shadowIntensity=$.intensity,X.shadowBias=$.bias,X.shadowNormalBias=$.normalBias,X.shadowRadius=$.radius,X.shadowMapSize=$.mapSize,n.spotShadow[_]=X,n.spotShadowMap[_]=Y,v++}_++}else if(P.isRectAreaLight){const W=t.get(P);W.color.copy(U).multiplyScalar(O),W.halfWidth.set(P.width*.5,0,0),W.halfHeight.set(0,P.height*.5,0),n.rectArea[p]=W,p++}else if(P.isPointLight){const W=t.get(P);if(W.color.copy(P.color).multiplyScalar(P.intensity),W.distance=P.distance,W.decay=P.decay,P.castShadow){const $=P.shadow,X=e.get(P);X.shadowIntensity=$.intensity,X.shadowBias=$.bias,X.shadowNormalBias=$.normalBias,X.shadowRadius=$.radius,X.shadowMapSize=$.mapSize,X.shadowCameraNear=$.camera.near,X.shadowCameraFar=$.camera.far,n.pointShadow[g]=X,n.pointShadowMap[g]=Y,n.pointShadowMatrix[g]=P.shadow.matrix,y++}n.point[g]=W,g++}else if(P.isHemisphereLight){const W=t.get(P);W.skyColor.copy(P.color).multiplyScalar(O),W.groundColor.copy(P.groundColor).multiplyScalar(O),n.hemi[m]=W,m++}}p>0&&(r.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ft.LTC_FLOAT_1,n.rectAreaLTC2=ft.LTC_FLOAT_2):(n.rectAreaLTC1=ft.LTC_HALF_1,n.rectAreaLTC2=ft.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;const L=n.hash;(L.directionalLength!==f||L.pointLength!==g||L.spotLength!==_||L.rectAreaLength!==p||L.hemiLength!==m||L.numDirectionalShadows!==x||L.numPointShadows!==y||L.numSpotShadows!==v||L.numSpotMaps!==R||L.numLightProbes!==b)&&(n.directional.length=f,n.spot.length=_,n.rectArea.length=p,n.point.length=g,n.hemi.length=m,n.directionalShadow.length=x,n.directionalShadowMap.length=x,n.pointShadow.length=y,n.pointShadowMap.length=y,n.spotShadow.length=v,n.spotShadowMap.length=v,n.directionalShadowMatrix.length=x,n.pointShadowMatrix.length=y,n.spotLightMatrix.length=v+R-T,n.spotLightMap.length=R,n.numSpotLightShadowsWithMaps=T,n.numLightProbes=b,L.directionalLength=f,L.pointLength=g,L.spotLength=_,L.rectAreaLength=p,L.hemiLength=m,L.numDirectionalShadows=x,L.numPointShadows=y,L.numSpotShadows=v,L.numSpotMaps=R,L.numLightProbes=b,n.version=l_++)}function c(l,h){let u=0,d=0,f=0,g=0,_=0;const p=h.matrixWorldInverse;for(let m=0,x=l.length;m<x;m++){const y=l[m];if(y.isDirectionalLight){const v=n.directional[u];v.direction.setFromMatrixPosition(y.matrixWorld),i.setFromMatrixPosition(y.target.matrixWorld),v.direction.sub(i),v.direction.transformDirection(p),u++}else if(y.isSpotLight){const v=n.spot[f];v.position.setFromMatrixPosition(y.matrixWorld),v.position.applyMatrix4(p),v.direction.setFromMatrixPosition(y.matrixWorld),i.setFromMatrixPosition(y.target.matrixWorld),v.direction.sub(i),v.direction.transformDirection(p),f++}else if(y.isRectAreaLight){const v=n.rectArea[g];v.position.setFromMatrixPosition(y.matrixWorld),v.position.applyMatrix4(p),o.identity(),s.copy(y.matrixWorld),s.premultiply(p),o.extractRotation(s),v.halfWidth.set(y.width*.5,0,0),v.halfHeight.set(0,y.height*.5,0),v.halfWidth.applyMatrix4(o),v.halfHeight.applyMatrix4(o),g++}else if(y.isPointLight){const v=n.point[d];v.position.setFromMatrixPosition(y.matrixWorld),v.position.applyMatrix4(p),d++}else if(y.isHemisphereLight){const v=n.hemi[_];v.direction.setFromMatrixPosition(y.matrixWorld),v.direction.transformDirection(p),_++}}}return{setup:a,setupView:c,state:n}}function jl(r){const t=new u_(r),e=[],n=[];function i(h){l.camera=h,e.length=0,n.length=0}function s(h){e.push(h)}function o(h){n.push(h)}function a(){t.setup(e)}function c(h){t.setupView(e,h)}const l={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:i,state:l,setupLights:a,setupLightsView:c,pushLight:s,pushShadow:o}}function d_(r){let t=new WeakMap;function e(i,s=0){const o=t.get(i);let a;return o===void 0?(a=new jl(r),t.set(i,[a])):s>=o.length?(a=new jl(r),o.push(a)):a=o[s],a}function n(){t=new WeakMap}return{get:e,dispose:n}}class f_ extends nn{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=jd,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class p_ extends nn{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const m_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,g_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function __(r,t,e){let n=new Pc;const i=new at,s=new at,o=new he,a=new f_({depthPacking:$d}),c=new p_,l={},h=e.maxTextureSize,u={[Wn]:Ve,[Ve]:Wn,[Ye]:Ye},d=new Tn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new at},radius:{value:4}},vertexShader:m_,fragmentShader:g_}),f=d.clone();f.defines.HORIZONTAL_PASS=1;const g=new Me;g.setAttribute("position",new ue(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new jt(g,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Kh;let m=this.type;this.render=function(T,b,L){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||T.length===0)return;const w=r.getRenderTarget(),S=r.getActiveCubeFace(),P=r.getActiveMipmapLevel(),U=r.state;U.setBlending(hi),U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);const O=m!==Fn&&this.type===Fn,q=m===Fn&&this.type!==Fn;for(let Y=0,W=T.length;Y<W;Y++){const $=T[Y],X=$.shadow;if(X===void 0){console.warn("THREE.WebGLShadowMap:",$,"has no shadow.");continue}if(X.autoUpdate===!1&&X.needsUpdate===!1)continue;i.copy(X.mapSize);const dt=X.getFrameExtents();if(i.multiply(dt),s.copy(X.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(s.x=Math.floor(h/dt.x),i.x=s.x*dt.x,X.mapSize.x=s.x),i.y>h&&(s.y=Math.floor(h/dt.y),i.y=s.y*dt.y,X.mapSize.y=s.y)),X.map===null||O===!0||q===!0){const St=this.type!==Fn?{minFilter:He,magFilter:He}:{};X.map!==null&&X.map.dispose(),X.map=new Ei(i.x,i.y,St),X.map.texture.name=$.name+".shadowMap",X.camera.updateProjectionMatrix()}r.setRenderTarget(X.map),r.clear();const _t=X.getViewportCount();for(let St=0;St<_t;St++){const Xt=X.getViewport(St);o.set(s.x*Xt.x,s.y*Xt.y,s.x*Xt.z,s.y*Xt.w),U.viewport(o),X.updateMatrices($,St),n=X.getFrustum(),v(b,L,X.camera,$,this.type)}X.isPointLightShadow!==!0&&this.type===Fn&&x(X,L),X.needsUpdate=!1}m=this.type,p.needsUpdate=!1,r.setRenderTarget(w,S,P)};function x(T,b){const L=t.update(_);d.defines.VSM_SAMPLES!==T.blurSamples&&(d.defines.VSM_SAMPLES=T.blurSamples,f.defines.VSM_SAMPLES=T.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new Ei(i.x,i.y)),d.uniforms.shadow_pass.value=T.map.texture,d.uniforms.resolution.value=T.mapSize,d.uniforms.radius.value=T.radius,r.setRenderTarget(T.mapPass),r.clear(),r.renderBufferDirect(b,null,L,d,_,null),f.uniforms.shadow_pass.value=T.mapPass.texture,f.uniforms.resolution.value=T.mapSize,f.uniforms.radius.value=T.radius,r.setRenderTarget(T.map),r.clear(),r.renderBufferDirect(b,null,L,f,_,null)}function y(T,b,L,w){let S=null;const P=L.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(P!==void 0)S=P;else if(S=L.isPointLight===!0?c:a,r.localClippingEnabled&&b.clipShadows===!0&&Array.isArray(b.clippingPlanes)&&b.clippingPlanes.length!==0||b.displacementMap&&b.displacementScale!==0||b.alphaMap&&b.alphaTest>0||b.map&&b.alphaTest>0){const U=S.uuid,O=b.uuid;let q=l[U];q===void 0&&(q={},l[U]=q);let Y=q[O];Y===void 0&&(Y=S.clone(),q[O]=Y,b.addEventListener("dispose",R)),S=Y}if(S.visible=b.visible,S.wireframe=b.wireframe,w===Fn?S.side=b.shadowSide!==null?b.shadowSide:b.side:S.side=b.shadowSide!==null?b.shadowSide:u[b.side],S.alphaMap=b.alphaMap,S.alphaTest=b.alphaTest,S.map=b.map,S.clipShadows=b.clipShadows,S.clippingPlanes=b.clippingPlanes,S.clipIntersection=b.clipIntersection,S.displacementMap=b.displacementMap,S.displacementScale=b.displacementScale,S.displacementBias=b.displacementBias,S.wireframeLinewidth=b.wireframeLinewidth,S.linewidth=b.linewidth,L.isPointLight===!0&&S.isMeshDistanceMaterial===!0){const U=r.properties.get(S);U.light=L}return S}function v(T,b,L,w,S){if(T.visible===!1)return;if(T.layers.test(b.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&S===Fn)&&(!T.frustumCulled||n.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(L.matrixWorldInverse,T.matrixWorld);const O=t.update(T),q=T.material;if(Array.isArray(q)){const Y=O.groups;for(let W=0,$=Y.length;W<$;W++){const X=Y[W],dt=q[X.materialIndex];if(dt&&dt.visible){const _t=y(T,dt,w,S);T.onBeforeShadow(r,T,b,L,O,_t,X),r.renderBufferDirect(L,null,O,_t,T,X),T.onAfterShadow(r,T,b,L,O,_t,X)}}}else if(q.visible){const Y=y(T,q,w,S);T.onBeforeShadow(r,T,b,L,O,Y,null),r.renderBufferDirect(L,null,O,Y,T,null),T.onAfterShadow(r,T,b,L,O,Y,null)}}const U=T.children;for(let O=0,q=U.length;O<q;O++)v(U[O],b,L,w,S)}function R(T){T.target.removeEventListener("dispose",R);for(const L in l){const w=l[L],S=T.target.uuid;S in w&&(w[S].dispose(),delete w[S])}}}function x_(r){function t(){let N=!1;const rt=new he;let J=null;const tt=new he(0,0,0,0);return{setMask:function(ct){J!==ct&&!N&&(r.colorMask(ct,ct,ct,ct),J=ct)},setLocked:function(ct){N=ct},setClear:function(ct,Dt,Zt,we,Ue){Ue===!0&&(ct*=we,Dt*=we,Zt*=we),rt.set(ct,Dt,Zt,we),tt.equals(rt)===!1&&(r.clearColor(ct,Dt,Zt,we),tt.copy(rt))},reset:function(){N=!1,J=null,tt.set(-1,0,0,0)}}}function e(){let N=!1,rt=null,J=null,tt=null;return{setTest:function(ct){ct?pt(r.DEPTH_TEST):Mt(r.DEPTH_TEST)},setMask:function(ct){rt!==ct&&!N&&(r.depthMask(ct),rt=ct)},setFunc:function(ct){if(J!==ct){switch(ct){case Ld:r.depthFunc(r.NEVER);break;case Pd:r.depthFunc(r.ALWAYS);break;case Id:r.depthFunc(r.LESS);break;case oo:r.depthFunc(r.LEQUAL);break;case Dd:r.depthFunc(r.EQUAL);break;case Ud:r.depthFunc(r.GEQUAL);break;case Nd:r.depthFunc(r.GREATER);break;case kd:r.depthFunc(r.NOTEQUAL);break;default:r.depthFunc(r.LEQUAL)}J=ct}},setLocked:function(ct){N=ct},setClear:function(ct){tt!==ct&&(r.clearDepth(ct),tt=ct)},reset:function(){N=!1,rt=null,J=null,tt=null}}}function n(){let N=!1,rt=null,J=null,tt=null,ct=null,Dt=null,Zt=null,we=null,Ue=null;return{setTest:function(ie){N||(ie?pt(r.STENCIL_TEST):Mt(r.STENCIL_TEST))},setMask:function(ie){rt!==ie&&!N&&(r.stencilMask(ie),rt=ie)},setFunc:function(ie,Cn,Sn){(J!==ie||tt!==Cn||ct!==Sn)&&(r.stencilFunc(ie,Cn,Sn),J=ie,tt=Cn,ct=Sn)},setOp:function(ie,Cn,Sn){(Dt!==ie||Zt!==Cn||we!==Sn)&&(r.stencilOp(ie,Cn,Sn),Dt=ie,Zt=Cn,we=Sn)},setLocked:function(ie){N=ie},setClear:function(ie){Ue!==ie&&(r.clearStencil(ie),Ue=ie)},reset:function(){N=!1,rt=null,J=null,tt=null,ct=null,Dt=null,Zt=null,we=null,Ue=null}}}const i=new t,s=new e,o=new n,a=new WeakMap,c=new WeakMap;let l={},h={},u=new WeakMap,d=[],f=null,g=!1,_=null,p=null,m=null,x=null,y=null,v=null,R=null,T=new nt(0,0,0),b=0,L=!1,w=null,S=null,P=null,U=null,O=null;const q=r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let Y=!1,W=0;const $=r.getParameter(r.VERSION);$.indexOf("WebGL")!==-1?(W=parseFloat(/^WebGL (\d)/.exec($)[1]),Y=W>=1):$.indexOf("OpenGL ES")!==-1&&(W=parseFloat(/^OpenGL ES (\d)/.exec($)[1]),Y=W>=2);let X=null,dt={};const _t=r.getParameter(r.SCISSOR_BOX),St=r.getParameter(r.VIEWPORT),Xt=new he().fromArray(_t),ne=new he().fromArray(St);function Z(N,rt,J,tt){const ct=new Uint8Array(4),Dt=r.createTexture();r.bindTexture(N,Dt),r.texParameteri(N,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(N,r.TEXTURE_MAG_FILTER,r.NEAREST);for(let Zt=0;Zt<J;Zt++)N===r.TEXTURE_3D||N===r.TEXTURE_2D_ARRAY?r.texImage3D(rt,0,r.RGBA,1,1,tt,0,r.RGBA,r.UNSIGNED_BYTE,ct):r.texImage2D(rt+Zt,0,r.RGBA,1,1,0,r.RGBA,r.UNSIGNED_BYTE,ct);return Dt}const st={};st[r.TEXTURE_2D]=Z(r.TEXTURE_2D,r.TEXTURE_2D,1),st[r.TEXTURE_CUBE_MAP]=Z(r.TEXTURE_CUBE_MAP,r.TEXTURE_CUBE_MAP_POSITIVE_X,6),st[r.TEXTURE_2D_ARRAY]=Z(r.TEXTURE_2D_ARRAY,r.TEXTURE_2D_ARRAY,1,1),st[r.TEXTURE_3D]=Z(r.TEXTURE_3D,r.TEXTURE_3D,1,1),i.setClear(0,0,0,1),s.setClear(1),o.setClear(0),pt(r.DEPTH_TEST),s.setFunc(oo),Qt(!1),At(tl),pt(r.CULL_FACE),de(hi);function pt(N){l[N]!==!0&&(r.enable(N),l[N]=!0)}function Mt(N){l[N]!==!1&&(r.disable(N),l[N]=!1)}function Ct(N,rt){return h[N]!==rt?(r.bindFramebuffer(N,rt),h[N]=rt,N===r.DRAW_FRAMEBUFFER&&(h[r.FRAMEBUFFER]=rt),N===r.FRAMEBUFFER&&(h[r.DRAW_FRAMEBUFFER]=rt),!0):!1}function Pt(N,rt){let J=d,tt=!1;if(N){J=u.get(rt),J===void 0&&(J=[],u.set(rt,J));const ct=N.textures;if(J.length!==ct.length||J[0]!==r.COLOR_ATTACHMENT0){for(let Dt=0,Zt=ct.length;Dt<Zt;Dt++)J[Dt]=r.COLOR_ATTACHMENT0+Dt;J.length=ct.length,tt=!0}}else J[0]!==r.BACK&&(J[0]=r.BACK,tt=!0);tt&&r.drawBuffers(J)}function Wt(N){return f!==N?(r.useProgram(N),f=N,!0):!1}const me={[Si]:r.FUNC_ADD,[fd]:r.FUNC_SUBTRACT,[pd]:r.FUNC_REVERSE_SUBTRACT};me[md]=r.MIN,me[gd]=r.MAX;const D={[_d]:r.ZERO,[xd]:r.ONE,[vd]:r.SRC_COLOR,[Pa]:r.SRC_ALPHA,[Td]:r.SRC_ALPHA_SATURATE,[bd]:r.DST_COLOR,[Md]:r.DST_ALPHA,[yd]:r.ONE_MINUS_SRC_COLOR,[Ia]:r.ONE_MINUS_SRC_ALPHA,[wd]:r.ONE_MINUS_DST_COLOR,[Sd]:r.ONE_MINUS_DST_ALPHA,[Ad]:r.CONSTANT_COLOR,[Ed]:r.ONE_MINUS_CONSTANT_COLOR,[Rd]:r.CONSTANT_ALPHA,[Cd]:r.ONE_MINUS_CONSTANT_ALPHA};function de(N,rt,J,tt,ct,Dt,Zt,we,Ue,ie){if(N===hi){g===!0&&(Mt(r.BLEND),g=!1);return}if(g===!1&&(pt(r.BLEND),g=!0),N!==dd){if(N!==_||ie!==L){if((p!==Si||y!==Si)&&(r.blendEquation(r.FUNC_ADD),p=Si,y=Si),ie)switch(N){case cs:r.blendFuncSeparate(r.ONE,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case el:r.blendFunc(r.ONE,r.ONE);break;case nl:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case il:r.blendFuncSeparate(r.ZERO,r.SRC_COLOR,r.ZERO,r.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}else switch(N){case cs:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case el:r.blendFunc(r.SRC_ALPHA,r.ONE);break;case nl:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case il:r.blendFunc(r.ZERO,r.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}m=null,x=null,v=null,R=null,T.set(0,0,0),b=0,_=N,L=ie}return}ct=ct||rt,Dt=Dt||J,Zt=Zt||tt,(rt!==p||ct!==y)&&(r.blendEquationSeparate(me[rt],me[ct]),p=rt,y=ct),(J!==m||tt!==x||Dt!==v||Zt!==R)&&(r.blendFuncSeparate(D[J],D[tt],D[Dt],D[Zt]),m=J,x=tt,v=Dt,R=Zt),(we.equals(T)===!1||Ue!==b)&&(r.blendColor(we.r,we.g,we.b,Ue),T.copy(we),b=Ue),_=N,L=!1}function $t(N,rt){N.side===Ye?Mt(r.CULL_FACE):pt(r.CULL_FACE);let J=N.side===Ve;rt&&(J=!J),Qt(J),N.blending===cs&&N.transparent===!1?de(hi):de(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),s.setFunc(N.depthFunc),s.setTest(N.depthTest),s.setMask(N.depthWrite),i.setMask(N.colorWrite);const tt=N.stencilWrite;o.setTest(tt),tt&&(o.setMask(N.stencilWriteMask),o.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),o.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),Nt(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?pt(r.SAMPLE_ALPHA_TO_COVERAGE):Mt(r.SAMPLE_ALPHA_TO_COVERAGE)}function Qt(N){w!==N&&(N?r.frontFace(r.CW):r.frontFace(r.CCW),w=N)}function At(N){N!==hd?(pt(r.CULL_FACE),N!==S&&(N===tl?r.cullFace(r.BACK):N===ud?r.cullFace(r.FRONT):r.cullFace(r.FRONT_AND_BACK))):Mt(r.CULL_FACE),S=N}function ve(N){N!==P&&(Y&&r.lineWidth(N),P=N)}function Nt(N,rt,J){N?(pt(r.POLYGON_OFFSET_FILL),(U!==rt||O!==J)&&(r.polygonOffset(rt,J),U=rt,O=J)):Mt(r.POLYGON_OFFSET_FILL)}function z(N){N?pt(r.SCISSOR_TEST):Mt(r.SCISSOR_TEST)}function C(N){N===void 0&&(N=r.TEXTURE0+q-1),X!==N&&(r.activeTexture(N),X=N)}function M(N,rt,J){J===void 0&&(X===null?J=r.TEXTURE0+q-1:J=X);let tt=dt[J];tt===void 0&&(tt={type:void 0,texture:void 0},dt[J]=tt),(tt.type!==N||tt.texture!==rt)&&(X!==J&&(r.activeTexture(J),X=J),r.bindTexture(N,rt||st[N]),tt.type=N,tt.texture=rt)}function F(){const N=dt[X];N!==void 0&&N.type!==void 0&&(r.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function j(){try{r.compressedTexImage2D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function et(){try{r.compressedTexImage3D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Q(){try{r.texSubImage2D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Tt(){try{r.texSubImage3D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function ut(){try{r.compressedTexSubImage2D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function xt(){try{r.compressedTexSubImage3D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Ot(){try{r.texStorage2D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function it(){try{r.texStorage3D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function H(){try{r.texImage2D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function vt(){try{r.texImage3D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Lt(N){Xt.equals(N)===!1&&(r.scissor(N.x,N.y,N.z,N.w),Xt.copy(N))}function yt(N){ne.equals(N)===!1&&(r.viewport(N.x,N.y,N.z,N.w),ne.copy(N))}function zt(N,rt){let J=c.get(rt);J===void 0&&(J=new WeakMap,c.set(rt,J));let tt=J.get(N);tt===void 0&&(tt=r.getUniformBlockIndex(rt,N.name),J.set(N,tt))}function qt(N,rt){const tt=c.get(rt).get(N);a.get(rt)!==tt&&(r.uniformBlockBinding(rt,tt,N.__bindingPointIndex),a.set(rt,tt))}function ye(){r.disable(r.BLEND),r.disable(r.CULL_FACE),r.disable(r.DEPTH_TEST),r.disable(r.POLYGON_OFFSET_FILL),r.disable(r.SCISSOR_TEST),r.disable(r.STENCIL_TEST),r.disable(r.SAMPLE_ALPHA_TO_COVERAGE),r.blendEquation(r.FUNC_ADD),r.blendFunc(r.ONE,r.ZERO),r.blendFuncSeparate(r.ONE,r.ZERO,r.ONE,r.ZERO),r.blendColor(0,0,0,0),r.colorMask(!0,!0,!0,!0),r.clearColor(0,0,0,0),r.depthMask(!0),r.depthFunc(r.LESS),r.clearDepth(1),r.stencilMask(4294967295),r.stencilFunc(r.ALWAYS,0,4294967295),r.stencilOp(r.KEEP,r.KEEP,r.KEEP),r.clearStencil(0),r.cullFace(r.BACK),r.frontFace(r.CCW),r.polygonOffset(0,0),r.activeTexture(r.TEXTURE0),r.bindFramebuffer(r.FRAMEBUFFER,null),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.bindFramebuffer(r.READ_FRAMEBUFFER,null),r.useProgram(null),r.lineWidth(1),r.scissor(0,0,r.canvas.width,r.canvas.height),r.viewport(0,0,r.canvas.width,r.canvas.height),l={},X=null,dt={},h={},u=new WeakMap,d=[],f=null,g=!1,_=null,p=null,m=null,x=null,y=null,v=null,R=null,T=new nt(0,0,0),b=0,L=!1,w=null,S=null,P=null,U=null,O=null,Xt.set(0,0,r.canvas.width,r.canvas.height),ne.set(0,0,r.canvas.width,r.canvas.height),i.reset(),s.reset(),o.reset()}return{buffers:{color:i,depth:s,stencil:o},enable:pt,disable:Mt,bindFramebuffer:Ct,drawBuffers:Pt,useProgram:Wt,setBlending:de,setMaterial:$t,setFlipSided:Qt,setCullFace:At,setLineWidth:ve,setPolygonOffset:Nt,setScissorTest:z,activeTexture:C,bindTexture:M,unbindTexture:F,compressedTexImage2D:j,compressedTexImage3D:et,texImage2D:H,texImage3D:vt,updateUBOMapping:zt,uniformBlockBinding:qt,texStorage2D:Ot,texStorage3D:it,texSubImage2D:Q,texSubImage3D:Tt,compressedTexSubImage2D:ut,compressedTexSubImage3D:xt,scissor:Lt,viewport:yt,reset:ye}}function $l(r,t,e,n){const i=v_(n);switch(e){case nu:return r*t;case su:return r*t;case ru:return r*t*2;case bc:return r*t/i.components*i.byteLength;case wc:return r*t/i.components*i.byteLength;case ou:return r*t*2/i.components*i.byteLength;case Tc:return r*t*2/i.components*i.byteLength;case iu:return r*t*3/i.components*i.byteLength;case en:return r*t*4/i.components*i.byteLength;case Ac:return r*t*4/i.components*i.byteLength;case to:case eo:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*8;case no:case io:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case ka:case Fa:return Math.max(r,16)*Math.max(t,8)/4;case Na:case Oa:return Math.max(r,8)*Math.max(t,8)/2;case Ba:case za:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*8;case Ha:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case Va:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case Ga:return Math.floor((r+4)/5)*Math.floor((t+3)/4)*16;case Wa:return Math.floor((r+4)/5)*Math.floor((t+4)/5)*16;case Xa:return Math.floor((r+5)/6)*Math.floor((t+4)/5)*16;case qa:return Math.floor((r+5)/6)*Math.floor((t+5)/6)*16;case Ya:return Math.floor((r+7)/8)*Math.floor((t+4)/5)*16;case Ka:return Math.floor((r+7)/8)*Math.floor((t+5)/6)*16;case ja:return Math.floor((r+7)/8)*Math.floor((t+7)/8)*16;case $a:return Math.floor((r+9)/10)*Math.floor((t+4)/5)*16;case Za:return Math.floor((r+9)/10)*Math.floor((t+5)/6)*16;case Ja:return Math.floor((r+9)/10)*Math.floor((t+7)/8)*16;case Qa:return Math.floor((r+9)/10)*Math.floor((t+9)/10)*16;case tc:return Math.floor((r+11)/12)*Math.floor((t+9)/10)*16;case ec:return Math.floor((r+11)/12)*Math.floor((t+11)/12)*16;case so:case nc:case ic:return Math.ceil(r/4)*Math.ceil(t/4)*16;case au:case sc:return Math.ceil(r/4)*Math.ceil(t/4)*8;case rc:case oc:return Math.ceil(r/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function v_(r){switch(r){case Xn:case Qh:return{byteLength:1,components:1};case Ks:case tu:case tr:return{byteLength:2,components:1};case Mc:case Sc:return{byteLength:2,components:4};case Ai:case yc:case yn:return{byteLength:4,components:1};case eu:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${r}.`)}function y_(r,t,e,n,i,s,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new at,h=new WeakMap;let u;const d=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(C,M){return f?new OffscreenCanvas(C,M):Zs("canvas")}function _(C,M,F){let j=1;const et=z(C);if((et.width>F||et.height>F)&&(j=F/Math.max(et.width,et.height)),j<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){const Q=Math.floor(j*et.width),Tt=Math.floor(j*et.height);u===void 0&&(u=g(Q,Tt));const ut=M?g(Q,Tt):u;return ut.width=Q,ut.height=Tt,ut.getContext("2d").drawImage(C,0,0,Q,Tt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+et.width+"x"+et.height+") to ("+Q+"x"+Tt+")."),ut}else return"data"in C&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+et.width+"x"+et.height+")."),C;return C}function p(C){return C.generateMipmaps&&C.minFilter!==He&&C.minFilter!==Ke}function m(C){r.generateMipmap(C)}function x(C,M,F,j,et=!1){if(C!==null){if(r[C]!==void 0)return r[C];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let Q=M;if(M===r.RED&&(F===r.FLOAT&&(Q=r.R32F),F===r.HALF_FLOAT&&(Q=r.R16F),F===r.UNSIGNED_BYTE&&(Q=r.R8)),M===r.RED_INTEGER&&(F===r.UNSIGNED_BYTE&&(Q=r.R8UI),F===r.UNSIGNED_SHORT&&(Q=r.R16UI),F===r.UNSIGNED_INT&&(Q=r.R32UI),F===r.BYTE&&(Q=r.R8I),F===r.SHORT&&(Q=r.R16I),F===r.INT&&(Q=r.R32I)),M===r.RG&&(F===r.FLOAT&&(Q=r.RG32F),F===r.HALF_FLOAT&&(Q=r.RG16F),F===r.UNSIGNED_BYTE&&(Q=r.RG8)),M===r.RG_INTEGER&&(F===r.UNSIGNED_BYTE&&(Q=r.RG8UI),F===r.UNSIGNED_SHORT&&(Q=r.RG16UI),F===r.UNSIGNED_INT&&(Q=r.RG32UI),F===r.BYTE&&(Q=r.RG8I),F===r.SHORT&&(Q=r.RG16I),F===r.INT&&(Q=r.RG32I)),M===r.RGB&&F===r.UNSIGNED_INT_5_9_9_9_REV&&(Q=r.RGB9_E5),M===r.RGBA){const Tt=et?lo:te.getTransfer(j);F===r.FLOAT&&(Q=r.RGBA32F),F===r.HALF_FLOAT&&(Q=r.RGBA16F),F===r.UNSIGNED_BYTE&&(Q=Tt===fe?r.SRGB8_ALPHA8:r.RGBA8),F===r.UNSIGNED_SHORT_4_4_4_4&&(Q=r.RGBA4),F===r.UNSIGNED_SHORT_5_5_5_1&&(Q=r.RGB5_A1)}return(Q===r.R16F||Q===r.R32F||Q===r.RG16F||Q===r.RG32F||Q===r.RGBA16F||Q===r.RGBA32F)&&t.get("EXT_color_buffer_float"),Q}function y(C,M){let F;return C?M===null||M===Ai||M===ms?F=r.DEPTH24_STENCIL8:M===yn?F=r.DEPTH32F_STENCIL8:M===Ks&&(F=r.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):M===null||M===Ai||M===ms?F=r.DEPTH_COMPONENT24:M===yn?F=r.DEPTH_COMPONENT32F:M===Ks&&(F=r.DEPTH_COMPONENT16),F}function v(C,M){return p(C)===!0||C.isFramebufferTexture&&C.minFilter!==He&&C.minFilter!==Ke?Math.log2(Math.max(M.width,M.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?M.mipmaps.length:1}function R(C){const M=C.target;M.removeEventListener("dispose",R),b(M),M.isVideoTexture&&h.delete(M)}function T(C){const M=C.target;M.removeEventListener("dispose",T),w(M)}function b(C){const M=n.get(C);if(M.__webglInit===void 0)return;const F=C.source,j=d.get(F);if(j){const et=j[M.__cacheKey];et.usedTimes--,et.usedTimes===0&&L(C),Object.keys(j).length===0&&d.delete(F)}n.remove(C)}function L(C){const M=n.get(C);r.deleteTexture(M.__webglTexture);const F=C.source,j=d.get(F);delete j[M.__cacheKey],o.memory.textures--}function w(C){const M=n.get(C);if(C.depthTexture&&C.depthTexture.dispose(),C.isWebGLCubeRenderTarget)for(let j=0;j<6;j++){if(Array.isArray(M.__webglFramebuffer[j]))for(let et=0;et<M.__webglFramebuffer[j].length;et++)r.deleteFramebuffer(M.__webglFramebuffer[j][et]);else r.deleteFramebuffer(M.__webglFramebuffer[j]);M.__webglDepthbuffer&&r.deleteRenderbuffer(M.__webglDepthbuffer[j])}else{if(Array.isArray(M.__webglFramebuffer))for(let j=0;j<M.__webglFramebuffer.length;j++)r.deleteFramebuffer(M.__webglFramebuffer[j]);else r.deleteFramebuffer(M.__webglFramebuffer);if(M.__webglDepthbuffer&&r.deleteRenderbuffer(M.__webglDepthbuffer),M.__webglMultisampledFramebuffer&&r.deleteFramebuffer(M.__webglMultisampledFramebuffer),M.__webglColorRenderbuffer)for(let j=0;j<M.__webglColorRenderbuffer.length;j++)M.__webglColorRenderbuffer[j]&&r.deleteRenderbuffer(M.__webglColorRenderbuffer[j]);M.__webglDepthRenderbuffer&&r.deleteRenderbuffer(M.__webglDepthRenderbuffer)}const F=C.textures;for(let j=0,et=F.length;j<et;j++){const Q=n.get(F[j]);Q.__webglTexture&&(r.deleteTexture(Q.__webglTexture),o.memory.textures--),n.remove(F[j])}n.remove(C)}let S=0;function P(){S=0}function U(){const C=S;return C>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+i.maxTextures),S+=1,C}function O(C){const M=[];return M.push(C.wrapS),M.push(C.wrapT),M.push(C.wrapR||0),M.push(C.magFilter),M.push(C.minFilter),M.push(C.anisotropy),M.push(C.internalFormat),M.push(C.format),M.push(C.type),M.push(C.generateMipmaps),M.push(C.premultiplyAlpha),M.push(C.flipY),M.push(C.unpackAlignment),M.push(C.colorSpace),M.join()}function q(C,M){const F=n.get(C);if(C.isVideoTexture&&ve(C),C.isRenderTargetTexture===!1&&C.version>0&&F.__version!==C.version){const j=C.image;if(j===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(j.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{ne(F,C,M);return}}e.bindTexture(r.TEXTURE_2D,F.__webglTexture,r.TEXTURE0+M)}function Y(C,M){const F=n.get(C);if(C.version>0&&F.__version!==C.version){ne(F,C,M);return}e.bindTexture(r.TEXTURE_2D_ARRAY,F.__webglTexture,r.TEXTURE0+M)}function W(C,M){const F=n.get(C);if(C.version>0&&F.__version!==C.version){ne(F,C,M);return}e.bindTexture(r.TEXTURE_3D,F.__webglTexture,r.TEXTURE0+M)}function $(C,M){const F=n.get(C);if(C.version>0&&F.__version!==C.version){Z(F,C,M);return}e.bindTexture(r.TEXTURE_CUBE_MAP,F.__webglTexture,r.TEXTURE0+M)}const X={[Ti]:r.REPEAT,[ai]:r.CLAMP_TO_EDGE,[ao]:r.MIRRORED_REPEAT},dt={[He]:r.NEAREST,[Jh]:r.NEAREST_MIPMAP_NEAREST,[zs]:r.NEAREST_MIPMAP_LINEAR,[Ke]:r.LINEAR,[Qr]:r.LINEAR_MIPMAP_NEAREST,[Hn]:r.LINEAR_MIPMAP_LINEAR},_t={[Jd]:r.NEVER,[rf]:r.ALWAYS,[Qd]:r.LESS,[hu]:r.LEQUAL,[tf]:r.EQUAL,[sf]:r.GEQUAL,[ef]:r.GREATER,[nf]:r.NOTEQUAL};function St(C,M){if(M.type===yn&&t.has("OES_texture_float_linear")===!1&&(M.magFilter===Ke||M.magFilter===Qr||M.magFilter===zs||M.magFilter===Hn||M.minFilter===Ke||M.minFilter===Qr||M.minFilter===zs||M.minFilter===Hn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),r.texParameteri(C,r.TEXTURE_WRAP_S,X[M.wrapS]),r.texParameteri(C,r.TEXTURE_WRAP_T,X[M.wrapT]),(C===r.TEXTURE_3D||C===r.TEXTURE_2D_ARRAY)&&r.texParameteri(C,r.TEXTURE_WRAP_R,X[M.wrapR]),r.texParameteri(C,r.TEXTURE_MAG_FILTER,dt[M.magFilter]),r.texParameteri(C,r.TEXTURE_MIN_FILTER,dt[M.minFilter]),M.compareFunction&&(r.texParameteri(C,r.TEXTURE_COMPARE_MODE,r.COMPARE_REF_TO_TEXTURE),r.texParameteri(C,r.TEXTURE_COMPARE_FUNC,_t[M.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(M.magFilter===He||M.minFilter!==zs&&M.minFilter!==Hn||M.type===yn&&t.has("OES_texture_float_linear")===!1)return;if(M.anisotropy>1||n.get(M).__currentAnisotropy){const F=t.get("EXT_texture_filter_anisotropic");r.texParameterf(C,F.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,i.getMaxAnisotropy())),n.get(M).__currentAnisotropy=M.anisotropy}}}function Xt(C,M){let F=!1;C.__webglInit===void 0&&(C.__webglInit=!0,M.addEventListener("dispose",R));const j=M.source;let et=d.get(j);et===void 0&&(et={},d.set(j,et));const Q=O(M);if(Q!==C.__cacheKey){et[Q]===void 0&&(et[Q]={texture:r.createTexture(),usedTimes:0},o.memory.textures++,F=!0),et[Q].usedTimes++;const Tt=et[C.__cacheKey];Tt!==void 0&&(et[C.__cacheKey].usedTimes--,Tt.usedTimes===0&&L(M)),C.__cacheKey=Q,C.__webglTexture=et[Q].texture}return F}function ne(C,M,F){let j=r.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(j=r.TEXTURE_2D_ARRAY),M.isData3DTexture&&(j=r.TEXTURE_3D);const et=Xt(C,M),Q=M.source;e.bindTexture(j,C.__webglTexture,r.TEXTURE0+F);const Tt=n.get(Q);if(Q.version!==Tt.__version||et===!0){e.activeTexture(r.TEXTURE0+F);const ut=te.getPrimaries(te.workingColorSpace),xt=M.colorSpace===ri?null:te.getPrimaries(M.colorSpace),Ot=M.colorSpace===ri||ut===xt?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,M.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,M.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ot);let it=_(M.image,!1,i.maxTextureSize);it=Nt(M,it);const H=s.convert(M.format,M.colorSpace),vt=s.convert(M.type);let Lt=x(M.internalFormat,H,vt,M.colorSpace,M.isVideoTexture);St(j,M);let yt;const zt=M.mipmaps,qt=M.isVideoTexture!==!0,ye=Tt.__version===void 0||et===!0,N=Q.dataReady,rt=v(M,it);if(M.isDepthTexture)Lt=y(M.format===gs,M.type),ye&&(qt?e.texStorage2D(r.TEXTURE_2D,1,Lt,it.width,it.height):e.texImage2D(r.TEXTURE_2D,0,Lt,it.width,it.height,0,H,vt,null));else if(M.isDataTexture)if(zt.length>0){qt&&ye&&e.texStorage2D(r.TEXTURE_2D,rt,Lt,zt[0].width,zt[0].height);for(let J=0,tt=zt.length;J<tt;J++)yt=zt[J],qt?N&&e.texSubImage2D(r.TEXTURE_2D,J,0,0,yt.width,yt.height,H,vt,yt.data):e.texImage2D(r.TEXTURE_2D,J,Lt,yt.width,yt.height,0,H,vt,yt.data);M.generateMipmaps=!1}else qt?(ye&&e.texStorage2D(r.TEXTURE_2D,rt,Lt,it.width,it.height),N&&e.texSubImage2D(r.TEXTURE_2D,0,0,0,it.width,it.height,H,vt,it.data)):e.texImage2D(r.TEXTURE_2D,0,Lt,it.width,it.height,0,H,vt,it.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){qt&&ye&&e.texStorage3D(r.TEXTURE_2D_ARRAY,rt,Lt,zt[0].width,zt[0].height,it.depth);for(let J=0,tt=zt.length;J<tt;J++)if(yt=zt[J],M.format!==en)if(H!==null)if(qt){if(N)if(M.layerUpdates.size>0){const ct=$l(yt.width,yt.height,M.format,M.type);for(const Dt of M.layerUpdates){const Zt=yt.data.subarray(Dt*ct/yt.data.BYTES_PER_ELEMENT,(Dt+1)*ct/yt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,J,0,0,Dt,yt.width,yt.height,1,H,Zt,0,0)}M.clearLayerUpdates()}else e.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,J,0,0,0,yt.width,yt.height,it.depth,H,yt.data,0,0)}else e.compressedTexImage3D(r.TEXTURE_2D_ARRAY,J,Lt,yt.width,yt.height,it.depth,0,yt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else qt?N&&e.texSubImage3D(r.TEXTURE_2D_ARRAY,J,0,0,0,yt.width,yt.height,it.depth,H,vt,yt.data):e.texImage3D(r.TEXTURE_2D_ARRAY,J,Lt,yt.width,yt.height,it.depth,0,H,vt,yt.data)}else{qt&&ye&&e.texStorage2D(r.TEXTURE_2D,rt,Lt,zt[0].width,zt[0].height);for(let J=0,tt=zt.length;J<tt;J++)yt=zt[J],M.format!==en?H!==null?qt?N&&e.compressedTexSubImage2D(r.TEXTURE_2D,J,0,0,yt.width,yt.height,H,yt.data):e.compressedTexImage2D(r.TEXTURE_2D,J,Lt,yt.width,yt.height,0,yt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):qt?N&&e.texSubImage2D(r.TEXTURE_2D,J,0,0,yt.width,yt.height,H,vt,yt.data):e.texImage2D(r.TEXTURE_2D,J,Lt,yt.width,yt.height,0,H,vt,yt.data)}else if(M.isDataArrayTexture)if(qt){if(ye&&e.texStorage3D(r.TEXTURE_2D_ARRAY,rt,Lt,it.width,it.height,it.depth),N)if(M.layerUpdates.size>0){const J=$l(it.width,it.height,M.format,M.type);for(const tt of M.layerUpdates){const ct=it.data.subarray(tt*J/it.data.BYTES_PER_ELEMENT,(tt+1)*J/it.data.BYTES_PER_ELEMENT);e.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,tt,it.width,it.height,1,H,vt,ct)}M.clearLayerUpdates()}else e.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,0,it.width,it.height,it.depth,H,vt,it.data)}else e.texImage3D(r.TEXTURE_2D_ARRAY,0,Lt,it.width,it.height,it.depth,0,H,vt,it.data);else if(M.isData3DTexture)qt?(ye&&e.texStorage3D(r.TEXTURE_3D,rt,Lt,it.width,it.height,it.depth),N&&e.texSubImage3D(r.TEXTURE_3D,0,0,0,0,it.width,it.height,it.depth,H,vt,it.data)):e.texImage3D(r.TEXTURE_3D,0,Lt,it.width,it.height,it.depth,0,H,vt,it.data);else if(M.isFramebufferTexture){if(ye)if(qt)e.texStorage2D(r.TEXTURE_2D,rt,Lt,it.width,it.height);else{let J=it.width,tt=it.height;for(let ct=0;ct<rt;ct++)e.texImage2D(r.TEXTURE_2D,ct,Lt,J,tt,0,H,vt,null),J>>=1,tt>>=1}}else if(zt.length>0){if(qt&&ye){const J=z(zt[0]);e.texStorage2D(r.TEXTURE_2D,rt,Lt,J.width,J.height)}for(let J=0,tt=zt.length;J<tt;J++)yt=zt[J],qt?N&&e.texSubImage2D(r.TEXTURE_2D,J,0,0,H,vt,yt):e.texImage2D(r.TEXTURE_2D,J,Lt,H,vt,yt);M.generateMipmaps=!1}else if(qt){if(ye){const J=z(it);e.texStorage2D(r.TEXTURE_2D,rt,Lt,J.width,J.height)}N&&e.texSubImage2D(r.TEXTURE_2D,0,0,0,H,vt,it)}else e.texImage2D(r.TEXTURE_2D,0,Lt,H,vt,it);p(M)&&m(j),Tt.__version=Q.version,M.onUpdate&&M.onUpdate(M)}C.__version=M.version}function Z(C,M,F){if(M.image.length!==6)return;const j=Xt(C,M),et=M.source;e.bindTexture(r.TEXTURE_CUBE_MAP,C.__webglTexture,r.TEXTURE0+F);const Q=n.get(et);if(et.version!==Q.__version||j===!0){e.activeTexture(r.TEXTURE0+F);const Tt=te.getPrimaries(te.workingColorSpace),ut=M.colorSpace===ri?null:te.getPrimaries(M.colorSpace),xt=M.colorSpace===ri||Tt===ut?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,M.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,M.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,xt);const Ot=M.isCompressedTexture||M.image[0].isCompressedTexture,it=M.image[0]&&M.image[0].isDataTexture,H=[];for(let tt=0;tt<6;tt++)!Ot&&!it?H[tt]=_(M.image[tt],!0,i.maxCubemapSize):H[tt]=it?M.image[tt].image:M.image[tt],H[tt]=Nt(M,H[tt]);const vt=H[0],Lt=s.convert(M.format,M.colorSpace),yt=s.convert(M.type),zt=x(M.internalFormat,Lt,yt,M.colorSpace),qt=M.isVideoTexture!==!0,ye=Q.__version===void 0||j===!0,N=et.dataReady;let rt=v(M,vt);St(r.TEXTURE_CUBE_MAP,M);let J;if(Ot){qt&&ye&&e.texStorage2D(r.TEXTURE_CUBE_MAP,rt,zt,vt.width,vt.height);for(let tt=0;tt<6;tt++){J=H[tt].mipmaps;for(let ct=0;ct<J.length;ct++){const Dt=J[ct];M.format!==en?Lt!==null?qt?N&&e.compressedTexSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ct,0,0,Dt.width,Dt.height,Lt,Dt.data):e.compressedTexImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ct,zt,Dt.width,Dt.height,0,Dt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):qt?N&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ct,0,0,Dt.width,Dt.height,Lt,yt,Dt.data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ct,zt,Dt.width,Dt.height,0,Lt,yt,Dt.data)}}}else{if(J=M.mipmaps,qt&&ye){J.length>0&&rt++;const tt=z(H[0]);e.texStorage2D(r.TEXTURE_CUBE_MAP,rt,zt,tt.width,tt.height)}for(let tt=0;tt<6;tt++)if(it){qt?N&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,0,0,H[tt].width,H[tt].height,Lt,yt,H[tt].data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,zt,H[tt].width,H[tt].height,0,Lt,yt,H[tt].data);for(let ct=0;ct<J.length;ct++){const Zt=J[ct].image[tt].image;qt?N&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ct+1,0,0,Zt.width,Zt.height,Lt,yt,Zt.data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ct+1,zt,Zt.width,Zt.height,0,Lt,yt,Zt.data)}}else{qt?N&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,0,0,Lt,yt,H[tt]):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,zt,Lt,yt,H[tt]);for(let ct=0;ct<J.length;ct++){const Dt=J[ct];qt?N&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ct+1,0,0,Lt,yt,Dt.image[tt]):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+tt,ct+1,zt,Lt,yt,Dt.image[tt])}}}p(M)&&m(r.TEXTURE_CUBE_MAP),Q.__version=et.version,M.onUpdate&&M.onUpdate(M)}C.__version=M.version}function st(C,M,F,j,et,Q){const Tt=s.convert(F.format,F.colorSpace),ut=s.convert(F.type),xt=x(F.internalFormat,Tt,ut,F.colorSpace);if(!n.get(M).__hasExternalTextures){const it=Math.max(1,M.width>>Q),H=Math.max(1,M.height>>Q);et===r.TEXTURE_3D||et===r.TEXTURE_2D_ARRAY?e.texImage3D(et,Q,xt,it,H,M.depth,0,Tt,ut,null):e.texImage2D(et,Q,xt,it,H,0,Tt,ut,null)}e.bindFramebuffer(r.FRAMEBUFFER,C),At(M)?a.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,j,et,n.get(F).__webglTexture,0,Qt(M)):(et===r.TEXTURE_2D||et>=r.TEXTURE_CUBE_MAP_POSITIVE_X&&et<=r.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&r.framebufferTexture2D(r.FRAMEBUFFER,j,et,n.get(F).__webglTexture,Q),e.bindFramebuffer(r.FRAMEBUFFER,null)}function pt(C,M,F){if(r.bindRenderbuffer(r.RENDERBUFFER,C),M.depthBuffer){const j=M.depthTexture,et=j&&j.isDepthTexture?j.type:null,Q=y(M.stencilBuffer,et),Tt=M.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,ut=Qt(M);At(M)?a.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,ut,Q,M.width,M.height):F?r.renderbufferStorageMultisample(r.RENDERBUFFER,ut,Q,M.width,M.height):r.renderbufferStorage(r.RENDERBUFFER,Q,M.width,M.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,Tt,r.RENDERBUFFER,C)}else{const j=M.textures;for(let et=0;et<j.length;et++){const Q=j[et],Tt=s.convert(Q.format,Q.colorSpace),ut=s.convert(Q.type),xt=x(Q.internalFormat,Tt,ut,Q.colorSpace),Ot=Qt(M);F&&At(M)===!1?r.renderbufferStorageMultisample(r.RENDERBUFFER,Ot,xt,M.width,M.height):At(M)?a.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,Ot,xt,M.width,M.height):r.renderbufferStorage(r.RENDERBUFFER,xt,M.width,M.height)}}r.bindRenderbuffer(r.RENDERBUFFER,null)}function Mt(C,M){if(M&&M.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(r.FRAMEBUFFER,C),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(M.depthTexture).__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),q(M.depthTexture,0);const j=n.get(M.depthTexture).__webglTexture,et=Qt(M);if(M.depthTexture.format===ls)At(M)?a.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,j,0,et):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,j,0);else if(M.depthTexture.format===gs)At(M)?a.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,j,0,et):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,j,0);else throw new Error("Unknown depthTexture format")}function Ct(C){const M=n.get(C),F=C.isWebGLCubeRenderTarget===!0;if(C.depthTexture&&!M.__autoAllocateDepthBuffer){if(F)throw new Error("target.depthTexture not supported in Cube render targets");Mt(M.__webglFramebuffer,C)}else if(F){M.__webglDepthbuffer=[];for(let j=0;j<6;j++)e.bindFramebuffer(r.FRAMEBUFFER,M.__webglFramebuffer[j]),M.__webglDepthbuffer[j]=r.createRenderbuffer(),pt(M.__webglDepthbuffer[j],C,!1)}else e.bindFramebuffer(r.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer=r.createRenderbuffer(),pt(M.__webglDepthbuffer,C,!1);e.bindFramebuffer(r.FRAMEBUFFER,null)}function Pt(C,M,F){const j=n.get(C);M!==void 0&&st(j.__webglFramebuffer,C,C.texture,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,0),F!==void 0&&Ct(C)}function Wt(C){const M=C.texture,F=n.get(C),j=n.get(M);C.addEventListener("dispose",T);const et=C.textures,Q=C.isWebGLCubeRenderTarget===!0,Tt=et.length>1;if(Tt||(j.__webglTexture===void 0&&(j.__webglTexture=r.createTexture()),j.__version=M.version,o.memory.textures++),Q){F.__webglFramebuffer=[];for(let ut=0;ut<6;ut++)if(M.mipmaps&&M.mipmaps.length>0){F.__webglFramebuffer[ut]=[];for(let xt=0;xt<M.mipmaps.length;xt++)F.__webglFramebuffer[ut][xt]=r.createFramebuffer()}else F.__webglFramebuffer[ut]=r.createFramebuffer()}else{if(M.mipmaps&&M.mipmaps.length>0){F.__webglFramebuffer=[];for(let ut=0;ut<M.mipmaps.length;ut++)F.__webglFramebuffer[ut]=r.createFramebuffer()}else F.__webglFramebuffer=r.createFramebuffer();if(Tt)for(let ut=0,xt=et.length;ut<xt;ut++){const Ot=n.get(et[ut]);Ot.__webglTexture===void 0&&(Ot.__webglTexture=r.createTexture(),o.memory.textures++)}if(C.samples>0&&At(C)===!1){F.__webglMultisampledFramebuffer=r.createFramebuffer(),F.__webglColorRenderbuffer=[],e.bindFramebuffer(r.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let ut=0;ut<et.length;ut++){const xt=et[ut];F.__webglColorRenderbuffer[ut]=r.createRenderbuffer(),r.bindRenderbuffer(r.RENDERBUFFER,F.__webglColorRenderbuffer[ut]);const Ot=s.convert(xt.format,xt.colorSpace),it=s.convert(xt.type),H=x(xt.internalFormat,Ot,it,xt.colorSpace,C.isXRRenderTarget===!0),vt=Qt(C);r.renderbufferStorageMultisample(r.RENDERBUFFER,vt,H,C.width,C.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+ut,r.RENDERBUFFER,F.__webglColorRenderbuffer[ut])}r.bindRenderbuffer(r.RENDERBUFFER,null),C.depthBuffer&&(F.__webglDepthRenderbuffer=r.createRenderbuffer(),pt(F.__webglDepthRenderbuffer,C,!0)),e.bindFramebuffer(r.FRAMEBUFFER,null)}}if(Q){e.bindTexture(r.TEXTURE_CUBE_MAP,j.__webglTexture),St(r.TEXTURE_CUBE_MAP,M);for(let ut=0;ut<6;ut++)if(M.mipmaps&&M.mipmaps.length>0)for(let xt=0;xt<M.mipmaps.length;xt++)st(F.__webglFramebuffer[ut][xt],C,M,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+ut,xt);else st(F.__webglFramebuffer[ut],C,M,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0);p(M)&&m(r.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Tt){for(let ut=0,xt=et.length;ut<xt;ut++){const Ot=et[ut],it=n.get(Ot);e.bindTexture(r.TEXTURE_2D,it.__webglTexture),St(r.TEXTURE_2D,Ot),st(F.__webglFramebuffer,C,Ot,r.COLOR_ATTACHMENT0+ut,r.TEXTURE_2D,0),p(Ot)&&m(r.TEXTURE_2D)}e.unbindTexture()}else{let ut=r.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(ut=C.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),e.bindTexture(ut,j.__webglTexture),St(ut,M),M.mipmaps&&M.mipmaps.length>0)for(let xt=0;xt<M.mipmaps.length;xt++)st(F.__webglFramebuffer[xt],C,M,r.COLOR_ATTACHMENT0,ut,xt);else st(F.__webglFramebuffer,C,M,r.COLOR_ATTACHMENT0,ut,0);p(M)&&m(ut),e.unbindTexture()}C.depthBuffer&&Ct(C)}function me(C){const M=C.textures;for(let F=0,j=M.length;F<j;F++){const et=M[F];if(p(et)){const Q=C.isWebGLCubeRenderTarget?r.TEXTURE_CUBE_MAP:r.TEXTURE_2D,Tt=n.get(et).__webglTexture;e.bindTexture(Q,Tt),m(Q),e.unbindTexture()}}}const D=[],de=[];function $t(C){if(C.samples>0){if(At(C)===!1){const M=C.textures,F=C.width,j=C.height;let et=r.COLOR_BUFFER_BIT;const Q=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,Tt=n.get(C),ut=M.length>1;if(ut)for(let xt=0;xt<M.length;xt++)e.bindFramebuffer(r.FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+xt,r.RENDERBUFFER,null),e.bindFramebuffer(r.FRAMEBUFFER,Tt.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+xt,r.TEXTURE_2D,null,0);e.bindFramebuffer(r.READ_FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),e.bindFramebuffer(r.DRAW_FRAMEBUFFER,Tt.__webglFramebuffer);for(let xt=0;xt<M.length;xt++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(et|=r.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(et|=r.STENCIL_BUFFER_BIT)),ut){r.framebufferRenderbuffer(r.READ_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.RENDERBUFFER,Tt.__webglColorRenderbuffer[xt]);const Ot=n.get(M[xt]).__webglTexture;r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,Ot,0)}r.blitFramebuffer(0,0,F,j,0,0,F,j,et,r.NEAREST),c===!0&&(D.length=0,de.length=0,D.push(r.COLOR_ATTACHMENT0+xt),C.depthBuffer&&C.resolveDepthBuffer===!1&&(D.push(Q),de.push(Q),r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,de)),r.invalidateFramebuffer(r.READ_FRAMEBUFFER,D))}if(e.bindFramebuffer(r.READ_FRAMEBUFFER,null),e.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),ut)for(let xt=0;xt<M.length;xt++){e.bindFramebuffer(r.FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+xt,r.RENDERBUFFER,Tt.__webglColorRenderbuffer[xt]);const Ot=n.get(M[xt]).__webglTexture;e.bindFramebuffer(r.FRAMEBUFFER,Tt.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+xt,r.TEXTURE_2D,Ot,0)}e.bindFramebuffer(r.DRAW_FRAMEBUFFER,Tt.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&c){const M=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,[M])}}}function Qt(C){return Math.min(i.maxSamples,C.samples)}function At(C){const M=n.get(C);return C.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function ve(C){const M=o.render.frame;h.get(C)!==M&&(h.set(C,M),C.update())}function Nt(C,M){const F=C.colorSpace,j=C.format,et=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||F!==Oe&&F!==ri&&(te.getTransfer(F)===fe?(j!==en||et!==Xn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",F)),M}function z(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(l.width=C.naturalWidth||C.width,l.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(l.width=C.displayWidth,l.height=C.displayHeight):(l.width=C.width,l.height=C.height),l}this.allocateTextureUnit=U,this.resetTextureUnits=P,this.setTexture2D=q,this.setTexture2DArray=Y,this.setTexture3D=W,this.setTextureCube=$,this.rebindTextures=Pt,this.setupRenderTarget=Wt,this.updateRenderTargetMipmap=me,this.updateMultisampleRenderTarget=$t,this.setupDepthRenderbuffer=Ct,this.setupFrameBufferTexture=st,this.useMultisampledRTT=At}function M_(r,t){function e(n,i=ri){let s;const o=te.getTransfer(i);if(n===Xn)return r.UNSIGNED_BYTE;if(n===Mc)return r.UNSIGNED_SHORT_4_4_4_4;if(n===Sc)return r.UNSIGNED_SHORT_5_5_5_1;if(n===eu)return r.UNSIGNED_INT_5_9_9_9_REV;if(n===Qh)return r.BYTE;if(n===tu)return r.SHORT;if(n===Ks)return r.UNSIGNED_SHORT;if(n===yc)return r.INT;if(n===Ai)return r.UNSIGNED_INT;if(n===yn)return r.FLOAT;if(n===tr)return r.HALF_FLOAT;if(n===nu)return r.ALPHA;if(n===iu)return r.RGB;if(n===en)return r.RGBA;if(n===su)return r.LUMINANCE;if(n===ru)return r.LUMINANCE_ALPHA;if(n===ls)return r.DEPTH_COMPONENT;if(n===gs)return r.DEPTH_STENCIL;if(n===bc)return r.RED;if(n===wc)return r.RED_INTEGER;if(n===ou)return r.RG;if(n===Tc)return r.RG_INTEGER;if(n===Ac)return r.RGBA_INTEGER;if(n===to||n===eo||n===no||n===io)if(o===fe)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===to)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===eo)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===no)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===io)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===to)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===eo)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===no)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===io)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Na||n===ka||n===Oa||n===Fa)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===Na)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ka)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Oa)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Fa)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ba||n===za||n===Ha)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(n===Ba||n===za)return o===fe?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===Ha)return o===fe?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Va||n===Ga||n===Wa||n===Xa||n===qa||n===Ya||n===Ka||n===ja||n===$a||n===Za||n===Ja||n===Qa||n===tc||n===ec)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(n===Va)return o===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Ga)return o===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Wa)return o===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Xa)return o===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===qa)return o===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Ya)return o===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Ka)return o===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ja)return o===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===$a)return o===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Za)return o===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Ja)return o===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Qa)return o===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===tc)return o===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===ec)return o===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===so||n===nc||n===ic)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(n===so)return o===fe?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===nc)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===ic)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===au||n===sc||n===rc||n===oc)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(n===so)return s.COMPRESSED_RED_RGTC1_EXT;if(n===sc)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===rc)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===oc)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ms?r.UNSIGNED_INT_24_8:r[n]!==void 0?r[n]:null}return{convert:e}}class S_ extends Xe{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class je extends pe{constructor(){super(),this.isGroup=!0,this.type="Group"}}const b_={type:"move"};class la{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new je,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new je,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new A,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new A),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new je,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new A,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new A),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let i=null,s=null,o=null;const a=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){o=!0;for(const _ of t.hand.values()){const p=e.getJointPose(_,n),m=this._getHandJoint(l,_);p!==null&&(m.matrix.fromArray(p.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=p.radius),m.visible=p!==null}const h=l.joints["index-finger-tip"],u=l.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,g=.005;l.inputState.pinching&&d>f+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&d<=f-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,n),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,s.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=!1,s.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(i=e.getPose(t.targetRaySpace,n),i===null&&s!==null&&(i=s),i!==null&&(a.matrix.fromArray(i.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,i.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(i.linearVelocity)):a.hasLinearVelocity=!1,i.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(i.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(b_)))}return a!==null&&(a.visible=i!==null),c!==null&&(c.visible=s!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new je;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const w_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,T_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class A_{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const i=new Ee,s=t.properties.get(i);s.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Tn({vertexShader:w_,fragmentShader:T_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new jt(new Ri(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class E_ extends Pi{constructor(t,e){super();const n=this;let i=null,s=1,o=null,a="local-floor",c=1,l=null,h=null,u=null,d=null,f=null,g=null;const _=new A_,p=e.getContextAttributes();let m=null,x=null;const y=[],v=[],R=new at;let T=null;const b=new Xe;b.layers.enable(1),b.viewport=new he;const L=new Xe;L.layers.enable(2),L.viewport=new he;const w=[b,L],S=new S_;S.layers.enable(1),S.layers.enable(2);let P=null,U=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let st=y[Z];return st===void 0&&(st=new la,y[Z]=st),st.getTargetRaySpace()},this.getControllerGrip=function(Z){let st=y[Z];return st===void 0&&(st=new la,y[Z]=st),st.getGripSpace()},this.getHand=function(Z){let st=y[Z];return st===void 0&&(st=new la,y[Z]=st),st.getHandSpace()};function O(Z){const st=v.indexOf(Z.inputSource);if(st===-1)return;const pt=y[st];pt!==void 0&&(pt.update(Z.inputSource,Z.frame,l||o),pt.dispatchEvent({type:Z.type,data:Z.inputSource}))}function q(){i.removeEventListener("select",O),i.removeEventListener("selectstart",O),i.removeEventListener("selectend",O),i.removeEventListener("squeeze",O),i.removeEventListener("squeezestart",O),i.removeEventListener("squeezeend",O),i.removeEventListener("end",q),i.removeEventListener("inputsourceschange",Y);for(let Z=0;Z<y.length;Z++){const st=v[Z];st!==null&&(v[Z]=null,y[Z].disconnect(st))}P=null,U=null,_.reset(),t.setRenderTarget(m),f=null,d=null,u=null,i=null,x=null,ne.stop(),n.isPresenting=!1,t.setPixelRatio(T),t.setSize(R.width,R.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){s=Z,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){a=Z,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(Z){l=Z},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function(Z){if(i=Z,i!==null){if(m=t.getRenderTarget(),i.addEventListener("select",O),i.addEventListener("selectstart",O),i.addEventListener("selectend",O),i.addEventListener("squeeze",O),i.addEventListener("squeezestart",O),i.addEventListener("squeezeend",O),i.addEventListener("end",q),i.addEventListener("inputsourceschange",Y),p.xrCompatible!==!0&&await e.makeXRCompatible(),T=t.getPixelRatio(),t.getSize(R),i.renderState.layers===void 0){const st={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(i,e,st),i.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),x=new Ei(f.framebufferWidth,f.framebufferHeight,{format:en,type:Xn,colorSpace:t.outputColorSpace,stencilBuffer:p.stencil})}else{let st=null,pt=null,Mt=null;p.depth&&(Mt=p.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,st=p.stencil?gs:ls,pt=p.stencil?ms:Ai);const Ct={colorFormat:e.RGBA8,depthFormat:Mt,scaleFactor:s};u=new XRWebGLBinding(i,e),d=u.createProjectionLayer(Ct),i.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),x=new Ei(d.textureWidth,d.textureHeight,{format:en,type:Xn,depthTexture:new Su(d.textureWidth,d.textureHeight,pt,void 0,void 0,void 0,void 0,void 0,void 0,st),stencilBuffer:p.stencil,colorSpace:t.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await i.requestReferenceSpace(a),ne.setContext(i),ne.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function Y(Z){for(let st=0;st<Z.removed.length;st++){const pt=Z.removed[st],Mt=v.indexOf(pt);Mt>=0&&(v[Mt]=null,y[Mt].disconnect(pt))}for(let st=0;st<Z.added.length;st++){const pt=Z.added[st];let Mt=v.indexOf(pt);if(Mt===-1){for(let Pt=0;Pt<y.length;Pt++)if(Pt>=v.length){v.push(pt),Mt=Pt;break}else if(v[Pt]===null){v[Pt]=pt,Mt=Pt;break}if(Mt===-1)break}const Ct=y[Mt];Ct&&Ct.connect(pt)}}const W=new A,$=new A;function X(Z,st,pt){W.setFromMatrixPosition(st.matrixWorld),$.setFromMatrixPosition(pt.matrixWorld);const Mt=W.distanceTo($),Ct=st.projectionMatrix.elements,Pt=pt.projectionMatrix.elements,Wt=Ct[14]/(Ct[10]-1),me=Ct[14]/(Ct[10]+1),D=(Ct[9]+1)/Ct[5],de=(Ct[9]-1)/Ct[5],$t=(Ct[8]-1)/Ct[0],Qt=(Pt[8]+1)/Pt[0],At=Wt*$t,ve=Wt*Qt,Nt=Mt/(-$t+Qt),z=Nt*-$t;st.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(z),Z.translateZ(Nt),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert();const C=Wt+Nt,M=me+Nt,F=At-z,j=ve+(Mt-z),et=D*me/M*C,Q=de*me/M*C;Z.projectionMatrix.makePerspective(F,j,et,Q,C,M),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}function dt(Z,st){st===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(st.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(i===null)return;_.texture!==null&&(Z.near=_.depthNear,Z.far=_.depthFar),S.near=L.near=b.near=Z.near,S.far=L.far=b.far=Z.far,(P!==S.near||U!==S.far)&&(i.updateRenderState({depthNear:S.near,depthFar:S.far}),P=S.near,U=S.far,b.near=P,b.far=U,L.near=P,L.far=U,b.updateProjectionMatrix(),L.updateProjectionMatrix(),Z.updateProjectionMatrix());const st=Z.parent,pt=S.cameras;dt(S,st);for(let Mt=0;Mt<pt.length;Mt++)dt(pt[Mt],st);pt.length===2?X(S,b,L):S.projectionMatrix.copy(b.projectionMatrix),_t(Z,S,st)};function _t(Z,st,pt){pt===null?Z.matrix.copy(st.matrixWorld):(Z.matrix.copy(pt.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(st.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(st.projectionMatrix),Z.projectionMatrixInverse.copy(st.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=_s*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return S},this.getFoveation=function(){if(!(d===null&&f===null))return c},this.setFoveation=function(Z){c=Z,d!==null&&(d.fixedFoveation=Z),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Z)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(S)};let St=null;function Xt(Z,st){if(h=st.getViewerPose(l||o),g=st,h!==null){const pt=h.views;f!==null&&(t.setRenderTargetFramebuffer(x,f.framebuffer),t.setRenderTarget(x));let Mt=!1;pt.length!==S.cameras.length&&(S.cameras.length=0,Mt=!0);for(let Pt=0;Pt<pt.length;Pt++){const Wt=pt[Pt];let me=null;if(f!==null)me=f.getViewport(Wt);else{const de=u.getViewSubImage(d,Wt);me=de.viewport,Pt===0&&(t.setRenderTargetTextures(x,de.colorTexture,d.ignoreDepthValues?void 0:de.depthStencilTexture),t.setRenderTarget(x))}let D=w[Pt];D===void 0&&(D=new Xe,D.layers.enable(Pt),D.viewport=new he,w[Pt]=D),D.matrix.fromArray(Wt.transform.matrix),D.matrix.decompose(D.position,D.quaternion,D.scale),D.projectionMatrix.fromArray(Wt.projectionMatrix),D.projectionMatrixInverse.copy(D.projectionMatrix).invert(),D.viewport.set(me.x,me.y,me.width,me.height),Pt===0&&(S.matrix.copy(D.matrix),S.matrix.decompose(S.position,S.quaternion,S.scale)),Mt===!0&&S.cameras.push(D)}const Ct=i.enabledFeatures;if(Ct&&Ct.includes("depth-sensing")){const Pt=u.getDepthInformation(pt[0]);Pt&&Pt.isValid&&Pt.texture&&_.init(t,Pt,i.renderState)}}for(let pt=0;pt<y.length;pt++){const Mt=v[pt],Ct=y[pt];Mt!==null&&Ct!==void 0&&Ct.update(Mt,st,l||o)}St&&St(Z,st),st.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:st}),g=null}const ne=new Mu;ne.setAnimationLoop(Xt),this.setAnimationLoop=function(Z){St=Z},this.dispose=function(){}}}const _i=new Ce,R_=new Bt;function C_(r,t){function e(p,m){p.matrixAutoUpdate===!0&&p.updateMatrix(),m.value.copy(p.matrix)}function n(p,m){m.color.getRGB(p.fogColor.value,xu(r)),m.isFog?(p.fogNear.value=m.near,p.fogFar.value=m.far):m.isFogExp2&&(p.fogDensity.value=m.density)}function i(p,m,x,y,v){m.isMeshBasicMaterial||m.isMeshLambertMaterial?s(p,m):m.isMeshToonMaterial?(s(p,m),u(p,m)):m.isMeshPhongMaterial?(s(p,m),h(p,m)):m.isMeshStandardMaterial?(s(p,m),d(p,m),m.isMeshPhysicalMaterial&&f(p,m,v)):m.isMeshMatcapMaterial?(s(p,m),g(p,m)):m.isMeshDepthMaterial?s(p,m):m.isMeshDistanceMaterial?(s(p,m),_(p,m)):m.isMeshNormalMaterial?s(p,m):m.isLineBasicMaterial?(o(p,m),m.isLineDashedMaterial&&a(p,m)):m.isPointsMaterial?c(p,m,x,y):m.isSpriteMaterial?l(p,m):m.isShadowMaterial?(p.color.value.copy(m.color),p.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function s(p,m){p.opacity.value=m.opacity,m.color&&p.diffuse.value.copy(m.color),m.emissive&&p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(p.map.value=m.map,e(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,e(m.alphaMap,p.alphaMapTransform)),m.bumpMap&&(p.bumpMap.value=m.bumpMap,e(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===Ve&&(p.bumpScale.value*=-1)),m.normalMap&&(p.normalMap.value=m.normalMap,e(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===Ve&&p.normalScale.value.negate()),m.displacementMap&&(p.displacementMap.value=m.displacementMap,e(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias),m.emissiveMap&&(p.emissiveMap.value=m.emissiveMap,e(m.emissiveMap,p.emissiveMapTransform)),m.specularMap&&(p.specularMap.value=m.specularMap,e(m.specularMap,p.specularMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest);const x=t.get(m),y=x.envMap,v=x.envMapRotation;y&&(p.envMap.value=y,_i.copy(v),_i.x*=-1,_i.y*=-1,_i.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(_i.y*=-1,_i.z*=-1),p.envMapRotation.value.setFromMatrix4(R_.makeRotationFromEuler(_i)),p.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio),m.lightMap&&(p.lightMap.value=m.lightMap,p.lightMapIntensity.value=m.lightMapIntensity,e(m.lightMap,p.lightMapTransform)),m.aoMap&&(p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,e(m.aoMap,p.aoMapTransform))}function o(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map&&(p.map.value=m.map,e(m.map,p.mapTransform))}function a(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function c(p,m,x,y){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*x,p.scale.value=y*.5,m.map&&(p.map.value=m.map,e(m.map,p.uvTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,e(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function l(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map&&(p.map.value=m.map,e(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,e(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function h(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,1e-4)}function u(p,m){m.gradientMap&&(p.gradientMap.value=m.gradientMap)}function d(p,m){p.metalness.value=m.metalness,m.metalnessMap&&(p.metalnessMap.value=m.metalnessMap,e(m.metalnessMap,p.metalnessMapTransform)),p.roughness.value=m.roughness,m.roughnessMap&&(p.roughnessMap.value=m.roughnessMap,e(m.roughnessMap,p.roughnessMapTransform)),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)}function f(p,m,x){p.ior.value=m.ior,m.sheen>0&&(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(p.sheenColorMap.value=m.sheenColorMap,e(m.sheenColorMap,p.sheenColorMapTransform)),m.sheenRoughnessMap&&(p.sheenRoughnessMap.value=m.sheenRoughnessMap,e(m.sheenRoughnessMap,p.sheenRoughnessMapTransform))),m.clearcoat>0&&(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(p.clearcoatMap.value=m.clearcoatMap,e(m.clearcoatMap,p.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,e(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(p.clearcoatNormalMap.value=m.clearcoatNormalMap,e(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Ve&&p.clearcoatNormalScale.value.negate())),m.dispersion>0&&(p.dispersion.value=m.dispersion),m.iridescence>0&&(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(p.iridescenceMap.value=m.iridescenceMap,e(m.iridescenceMap,p.iridescenceMapTransform)),m.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,e(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),m.transmission>0&&(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=x.texture,p.transmissionSamplerSize.value.set(x.width,x.height),m.transmissionMap&&(p.transmissionMap.value=m.transmissionMap,e(m.transmissionMap,p.transmissionMapTransform)),p.thickness.value=m.thickness,m.thicknessMap&&(p.thicknessMap.value=m.thicknessMap,e(m.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(p.anisotropyMap.value=m.anisotropyMap,e(m.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap&&(p.specularColorMap.value=m.specularColorMap,e(m.specularColorMap,p.specularColorMapTransform)),m.specularIntensityMap&&(p.specularIntensityMap.value=m.specularIntensityMap,e(m.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,m){m.matcap&&(p.matcap.value=m.matcap)}function _(p,m){const x=t.get(m).light;p.referencePosition.value.setFromMatrixPosition(x.matrixWorld),p.nearDistance.value=x.shadow.camera.near,p.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function L_(r,t,e,n){let i={},s={},o=[];const a=r.getParameter(r.MAX_UNIFORM_BUFFER_BINDINGS);function c(x,y){const v=y.program;n.uniformBlockBinding(x,v)}function l(x,y){let v=i[x.id];v===void 0&&(g(x),v=h(x),i[x.id]=v,x.addEventListener("dispose",p));const R=y.program;n.updateUBOMapping(x,R);const T=t.render.frame;s[x.id]!==T&&(d(x),s[x.id]=T)}function h(x){const y=u();x.__bindingPointIndex=y;const v=r.createBuffer(),R=x.__size,T=x.usage;return r.bindBuffer(r.UNIFORM_BUFFER,v),r.bufferData(r.UNIFORM_BUFFER,R,T),r.bindBuffer(r.UNIFORM_BUFFER,null),r.bindBufferBase(r.UNIFORM_BUFFER,y,v),v}function u(){for(let x=0;x<a;x++)if(o.indexOf(x)===-1)return o.push(x),x;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(x){const y=i[x.id],v=x.uniforms,R=x.__cache;r.bindBuffer(r.UNIFORM_BUFFER,y);for(let T=0,b=v.length;T<b;T++){const L=Array.isArray(v[T])?v[T]:[v[T]];for(let w=0,S=L.length;w<S;w++){const P=L[w];if(f(P,T,w,R)===!0){const U=P.__offset,O=Array.isArray(P.value)?P.value:[P.value];let q=0;for(let Y=0;Y<O.length;Y++){const W=O[Y],$=_(W);typeof W=="number"||typeof W=="boolean"?(P.__data[0]=W,r.bufferSubData(r.UNIFORM_BUFFER,U+q,P.__data)):W.isMatrix3?(P.__data[0]=W.elements[0],P.__data[1]=W.elements[1],P.__data[2]=W.elements[2],P.__data[3]=0,P.__data[4]=W.elements[3],P.__data[5]=W.elements[4],P.__data[6]=W.elements[5],P.__data[7]=0,P.__data[8]=W.elements[6],P.__data[9]=W.elements[7],P.__data[10]=W.elements[8],P.__data[11]=0):(W.toArray(P.__data,q),q+=$.storage/Float32Array.BYTES_PER_ELEMENT)}r.bufferSubData(r.UNIFORM_BUFFER,U,P.__data)}}}r.bindBuffer(r.UNIFORM_BUFFER,null)}function f(x,y,v,R){const T=x.value,b=y+"_"+v;if(R[b]===void 0)return typeof T=="number"||typeof T=="boolean"?R[b]=T:R[b]=T.clone(),!0;{const L=R[b];if(typeof T=="number"||typeof T=="boolean"){if(L!==T)return R[b]=T,!0}else if(L.equals(T)===!1)return L.copy(T),!0}return!1}function g(x){const y=x.uniforms;let v=0;const R=16;for(let b=0,L=y.length;b<L;b++){const w=Array.isArray(y[b])?y[b]:[y[b]];for(let S=0,P=w.length;S<P;S++){const U=w[S],O=Array.isArray(U.value)?U.value:[U.value];for(let q=0,Y=O.length;q<Y;q++){const W=O[q],$=_(W),X=v%R;X!==0&&R-X<$.boundary&&(v+=R-X),U.__data=new Float32Array($.storage/Float32Array.BYTES_PER_ELEMENT),U.__offset=v,v+=$.storage}}}const T=v%R;return T>0&&(v+=R-T),x.__size=v,x.__cache={},this}function _(x){const y={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(y.boundary=4,y.storage=4):x.isVector2?(y.boundary=8,y.storage=8):x.isVector3||x.isColor?(y.boundary=16,y.storage=12):x.isVector4?(y.boundary=16,y.storage=16):x.isMatrix3?(y.boundary=48,y.storage=48):x.isMatrix4?(y.boundary=64,y.storage=64):x.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",x),y}function p(x){const y=x.target;y.removeEventListener("dispose",p);const v=o.indexOf(y.__bindingPointIndex);o.splice(v,1),r.deleteBuffer(i[y.id]),delete i[y.id],delete s[y.id]}function m(){for(const x in i)r.deleteBuffer(i[x]);o=[],i={},s={}}return{bind:c,update:l,dispose:m}}class P_{constructor(t={}){const{canvas:e=Sf(),context:n=null,depth:i=!0,stencil:s=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=t;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=o;const f=new Uint32Array(4),g=new Int32Array(4);let _=null,p=null;const m=[],x=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=_e,this.toneMapping=Gn,this.toneMappingExposure=1;const y=this;let v=!1,R=0,T=0,b=null,L=-1,w=null;const S=new he,P=new he;let U=null;const O=new nt(0);let q=0,Y=e.width,W=e.height,$=1,X=null,dt=null;const _t=new he(0,0,Y,W),St=new he(0,0,Y,W);let Xt=!1;const ne=new Pc;let Z=!1,st=!1;const pt=new Bt,Mt=new A,Ct=new he,Pt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Wt=!1;function me(){return b===null?$:1}let D=n;function de(E,k){return e.getContext(E,k)}try{const E={alpha:!0,depth:i,stencil:s,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${xc}`),e.addEventListener("webglcontextlost",J,!1),e.addEventListener("webglcontextrestored",tt,!1),e.addEventListener("webglcontextcreationerror",ct,!1),D===null){const k="webgl2";if(D=de(k,E),D===null)throw de(k)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(E){throw console.error("THREE.WebGLRenderer: "+E.message),E}let $t,Qt,At,ve,Nt,z,C,M,F,j,et,Q,Tt,ut,xt,Ot,it,H,vt,Lt,yt,zt,qt,ye;function N(){$t=new F0(D),$t.init(),zt=new M_(D,$t),Qt=new I0(D,$t,t,zt),At=new x_(D),ve=new H0(D),Nt=new s_,z=new y_(D,$t,At,Nt,Qt,zt,ve),C=new U0(y),M=new O0(y),F=new Kf(D),qt=new L0(D,F),j=new B0(D,F,ve,qt),et=new G0(D,j,F,ve),vt=new V0(D,Qt,z),Ot=new D0(Nt),Q=new i_(y,C,M,$t,Qt,qt,Ot),Tt=new C_(y,Nt),ut=new o_,xt=new d_($t),H=new C0(y,C,M,At,et,d,c),it=new __(y,et,Qt),ye=new L_(D,ve,Qt,At),Lt=new P0(D,$t,ve),yt=new z0(D,$t,ve),ve.programs=Q.programs,y.capabilities=Qt,y.extensions=$t,y.properties=Nt,y.renderLists=ut,y.shadowMap=it,y.state=At,y.info=ve}N();const rt=new E_(y,D);this.xr=rt,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){const E=$t.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){const E=$t.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return $},this.setPixelRatio=function(E){E!==void 0&&($=E,this.setSize(Y,W,!1))},this.getSize=function(E){return E.set(Y,W)},this.setSize=function(E,k,V=!0){if(rt.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}Y=E,W=k,e.width=Math.floor(E*$),e.height=Math.floor(k*$),V===!0&&(e.style.width=E+"px",e.style.height=k+"px"),this.setViewport(0,0,E,k)},this.getDrawingBufferSize=function(E){return E.set(Y*$,W*$).floor()},this.setDrawingBufferSize=function(E,k,V){Y=E,W=k,$=V,e.width=Math.floor(E*V),e.height=Math.floor(k*V),this.setViewport(0,0,E,k)},this.getCurrentViewport=function(E){return E.copy(S)},this.getViewport=function(E){return E.copy(_t)},this.setViewport=function(E,k,V,G){E.isVector4?_t.set(E.x,E.y,E.z,E.w):_t.set(E,k,V,G),At.viewport(S.copy(_t).multiplyScalar($).round())},this.getScissor=function(E){return E.copy(St)},this.setScissor=function(E,k,V,G){E.isVector4?St.set(E.x,E.y,E.z,E.w):St.set(E,k,V,G),At.scissor(P.copy(St).multiplyScalar($).round())},this.getScissorTest=function(){return Xt},this.setScissorTest=function(E){At.setScissorTest(Xt=E)},this.setOpaqueSort=function(E){X=E},this.setTransparentSort=function(E){dt=E},this.getClearColor=function(E){return E.copy(H.getClearColor())},this.setClearColor=function(){H.setClearColor.apply(H,arguments)},this.getClearAlpha=function(){return H.getClearAlpha()},this.setClearAlpha=function(){H.setClearAlpha.apply(H,arguments)},this.clear=function(E=!0,k=!0,V=!0){let G=0;if(E){let B=!1;if(b!==null){const ot=b.texture.format;B=ot===Ac||ot===Tc||ot===wc}if(B){const ot=b.texture.type,mt=ot===Xn||ot===Ai||ot===Ks||ot===ms||ot===Mc||ot===Sc,bt=H.getClearColor(),wt=H.getClearAlpha(),Ut=bt.r,kt=bt.g,It=bt.b;mt?(f[0]=Ut,f[1]=kt,f[2]=It,f[3]=wt,D.clearBufferuiv(D.COLOR,0,f)):(g[0]=Ut,g[1]=kt,g[2]=It,g[3]=wt,D.clearBufferiv(D.COLOR,0,g))}else G|=D.COLOR_BUFFER_BIT}k&&(G|=D.DEPTH_BUFFER_BIT),V&&(G|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),D.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",J,!1),e.removeEventListener("webglcontextrestored",tt,!1),e.removeEventListener("webglcontextcreationerror",ct,!1),ut.dispose(),xt.dispose(),Nt.dispose(),C.dispose(),M.dispose(),et.dispose(),qt.dispose(),ye.dispose(),Q.dispose(),rt.dispose(),rt.removeEventListener("sessionstart",Sn),rt.removeEventListener("sessionend",qc),ui.stop()};function J(E){E.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),v=!0}function tt(){console.log("THREE.WebGLRenderer: Context Restored."),v=!1;const E=ve.autoReset,k=it.enabled,V=it.autoUpdate,G=it.needsUpdate,B=it.type;N(),ve.autoReset=E,it.enabled=k,it.autoUpdate=V,it.needsUpdate=G,it.type=B}function ct(E){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function Dt(E){const k=E.target;k.removeEventListener("dispose",Dt),Zt(k)}function Zt(E){we(E),Nt.remove(E)}function we(E){const k=Nt.get(E).programs;k!==void 0&&(k.forEach(function(V){Q.releaseProgram(V)}),E.isShaderMaterial&&Q.releaseShaderCache(E))}this.renderBufferDirect=function(E,k,V,G,B,ot){k===null&&(k=Pt);const mt=B.isMesh&&B.matrixWorld.determinant()<0,bt=nd(E,k,V,G,B);At.setMaterial(G,mt);let wt=V.index,Ut=1;if(G.wireframe===!0){if(wt=j.getWireframeAttribute(V),wt===void 0)return;Ut=2}const kt=V.drawRange,It=V.attributes.position;let se=kt.start*Ut,Se=(kt.start+kt.count)*Ut;ot!==null&&(se=Math.max(se,ot.start*Ut),Se=Math.min(Se,(ot.start+ot.count)*Ut)),wt!==null?(se=Math.max(se,0),Se=Math.min(Se,wt.count)):It!=null&&(se=Math.max(se,0),Se=Math.min(Se,It.count));const be=Se-se;if(be<0||be===1/0)return;qt.setup(B,G,bt,V,wt);let $e,re=Lt;if(wt!==null&&($e=F.get(wt),re=yt,re.setIndex($e)),B.isMesh)G.wireframe===!0?(At.setLineWidth(G.wireframeLinewidth*me()),re.setMode(D.LINES)):re.setMode(D.TRIANGLES);else if(B.isLine){let Et=G.linewidth;Et===void 0&&(Et=1),At.setLineWidth(Et*me()),B.isLineSegments?re.setMode(D.LINES):B.isLineLoop?re.setMode(D.LINE_LOOP):re.setMode(D.LINE_STRIP)}else B.isPoints?re.setMode(D.POINTS):B.isSprite&&re.setMode(D.TRIANGLES);if(B.isBatchedMesh)if(B._multiDrawInstances!==null)re.renderMultiDrawInstances(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount,B._multiDrawInstances);else if($t.get("WEBGL_multi_draw"))re.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else{const Et=B._multiDrawStarts,Ne=B._multiDrawCounts,oe=B._multiDrawCount,pn=wt?F.get(wt).bytesPerElement:1,Di=Nt.get(G).currentProgram.getUniforms();for(let Ze=0;Ze<oe;Ze++)Di.setValue(D,"_gl_DrawID",Ze),re.render(Et[Ze]/pn,Ne[Ze])}else if(B.isInstancedMesh)re.renderInstances(se,be,B.count);else if(V.isInstancedBufferGeometry){const Et=V._maxInstanceCount!==void 0?V._maxInstanceCount:1/0,Ne=Math.min(V.instanceCount,Et);re.renderInstances(se,be,Ne)}else re.render(se,be)};function Ue(E,k,V){E.transparent===!0&&E.side===Ye&&E.forceSinglePass===!1?(E.side=Ve,E.needsUpdate=!0,or(E,k,V),E.side=Wn,E.needsUpdate=!0,or(E,k,V),E.side=Ye):or(E,k,V)}this.compile=function(E,k,V=null){V===null&&(V=E),p=xt.get(V),p.init(k),x.push(p),V.traverseVisible(function(B){B.isLight&&B.layers.test(k.layers)&&(p.pushLight(B),B.castShadow&&p.pushShadow(B))}),E!==V&&E.traverseVisible(function(B){B.isLight&&B.layers.test(k.layers)&&(p.pushLight(B),B.castShadow&&p.pushShadow(B))}),p.setupLights();const G=new Set;return E.traverse(function(B){const ot=B.material;if(ot)if(Array.isArray(ot))for(let mt=0;mt<ot.length;mt++){const bt=ot[mt];Ue(bt,V,B),G.add(bt)}else Ue(ot,V,B),G.add(ot)}),x.pop(),p=null,G},this.compileAsync=function(E,k,V=null){const G=this.compile(E,k,V);return new Promise(B=>{function ot(){if(G.forEach(function(mt){Nt.get(mt).currentProgram.isReady()&&G.delete(mt)}),G.size===0){B(E);return}setTimeout(ot,10)}$t.get("KHR_parallel_shader_compile")!==null?ot():setTimeout(ot,10)})};let ie=null;function Cn(E){ie&&ie(E)}function Sn(){ui.stop()}function qc(){ui.start()}const ui=new Mu;ui.setAnimationLoop(Cn),typeof self<"u"&&ui.setContext(self),this.setAnimationLoop=function(E){ie=E,rt.setAnimationLoop(E),E===null?ui.stop():ui.start()},rt.addEventListener("sessionstart",Sn),rt.addEventListener("sessionend",qc),this.render=function(E,k){if(k!==void 0&&k.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(v===!0)return;if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),k.parent===null&&k.matrixWorldAutoUpdate===!0&&k.updateMatrixWorld(),rt.enabled===!0&&rt.isPresenting===!0&&(rt.cameraAutoUpdate===!0&&rt.updateCamera(k),k=rt.getCamera()),E.isScene===!0&&E.onBeforeRender(y,E,k,b),p=xt.get(E,x.length),p.init(k),x.push(p),pt.multiplyMatrices(k.projectionMatrix,k.matrixWorldInverse),ne.setFromProjectionMatrix(pt),st=this.localClippingEnabled,Z=Ot.init(this.clippingPlanes,st),_=ut.get(E,m.length),_.init(),m.push(_),rt.enabled===!0&&rt.isPresenting===!0){const ot=y.xr.getDepthSensingMesh();ot!==null&&Do(ot,k,-1/0,y.sortObjects)}Do(E,k,0,y.sortObjects),_.finish(),y.sortObjects===!0&&_.sort(X,dt),Wt=rt.enabled===!1||rt.isPresenting===!1||rt.hasDepthSensing()===!1,Wt&&H.addToRenderList(_,E),this.info.render.frame++,Z===!0&&Ot.beginShadows();const V=p.state.shadowsArray;it.render(V,E,k),Z===!0&&Ot.endShadows(),this.info.autoReset===!0&&this.info.reset();const G=_.opaque,B=_.transmissive;if(p.setupLights(),k.isArrayCamera){const ot=k.cameras;if(B.length>0)for(let mt=0,bt=ot.length;mt<bt;mt++){const wt=ot[mt];Kc(G,B,E,wt)}Wt&&H.render(E);for(let mt=0,bt=ot.length;mt<bt;mt++){const wt=ot[mt];Yc(_,E,wt,wt.viewport)}}else B.length>0&&Kc(G,B,E,k),Wt&&H.render(E),Yc(_,E,k);b!==null&&(z.updateMultisampleRenderTarget(b),z.updateRenderTargetMipmap(b)),E.isScene===!0&&E.onAfterRender(y,E,k),qt.resetDefaultState(),L=-1,w=null,x.pop(),x.length>0?(p=x[x.length-1],Z===!0&&Ot.setGlobalState(y.clippingPlanes,p.state.camera)):p=null,m.pop(),m.length>0?_=m[m.length-1]:_=null};function Do(E,k,V,G){if(E.visible===!1)return;if(E.layers.test(k.layers)){if(E.isGroup)V=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(k);else if(E.isLight)p.pushLight(E),E.castShadow&&p.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||ne.intersectsSprite(E)){G&&Ct.setFromMatrixPosition(E.matrixWorld).applyMatrix4(pt);const mt=et.update(E),bt=E.material;bt.visible&&_.push(E,mt,bt,V,Ct.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||ne.intersectsObject(E))){const mt=et.update(E),bt=E.material;if(G&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),Ct.copy(E.boundingSphere.center)):(mt.boundingSphere===null&&mt.computeBoundingSphere(),Ct.copy(mt.boundingSphere.center)),Ct.applyMatrix4(E.matrixWorld).applyMatrix4(pt)),Array.isArray(bt)){const wt=mt.groups;for(let Ut=0,kt=wt.length;Ut<kt;Ut++){const It=wt[Ut],se=bt[It.materialIndex];se&&se.visible&&_.push(E,mt,se,V,Ct.z,It)}}else bt.visible&&_.push(E,mt,bt,V,Ct.z,null)}}const ot=E.children;for(let mt=0,bt=ot.length;mt<bt;mt++)Do(ot[mt],k,V,G)}function Yc(E,k,V,G){const B=E.opaque,ot=E.transmissive,mt=E.transparent;p.setupLightsView(V),Z===!0&&Ot.setGlobalState(y.clippingPlanes,V),G&&At.viewport(S.copy(G)),B.length>0&&rr(B,k,V),ot.length>0&&rr(ot,k,V),mt.length>0&&rr(mt,k,V),At.buffers.depth.setTest(!0),At.buffers.depth.setMask(!0),At.buffers.color.setMask(!0),At.setPolygonOffset(!1)}function Kc(E,k,V,G){if((V.isScene===!0?V.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[G.id]===void 0&&(p.state.transmissionRenderTarget[G.id]=new Ei(1,1,{generateMipmaps:!0,type:$t.has("EXT_color_buffer_half_float")||$t.has("EXT_color_buffer_float")?tr:Xn,minFilter:Hn,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:te.workingColorSpace}));const ot=p.state.transmissionRenderTarget[G.id],mt=G.viewport||S;ot.setSize(mt.z,mt.w);const bt=y.getRenderTarget();y.setRenderTarget(ot),y.getClearColor(O),q=y.getClearAlpha(),q<1&&y.setClearColor(16777215,.5),Wt?H.render(V):y.clear();const wt=y.toneMapping;y.toneMapping=Gn;const Ut=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),p.setupLightsView(G),Z===!0&&Ot.setGlobalState(y.clippingPlanes,G),rr(E,V,G),z.updateMultisampleRenderTarget(ot),z.updateRenderTargetMipmap(ot),$t.has("WEBGL_multisampled_render_to_texture")===!1){let kt=!1;for(let It=0,se=k.length;It<se;It++){const Se=k[It],be=Se.object,$e=Se.geometry,re=Se.material,Et=Se.group;if(re.side===Ye&&be.layers.test(G.layers)){const Ne=re.side;re.side=Ve,re.needsUpdate=!0,jc(be,V,G,$e,re,Et),re.side=Ne,re.needsUpdate=!0,kt=!0}}kt===!0&&(z.updateMultisampleRenderTarget(ot),z.updateRenderTargetMipmap(ot))}y.setRenderTarget(bt),y.setClearColor(O,q),Ut!==void 0&&(G.viewport=Ut),y.toneMapping=wt}function rr(E,k,V){const G=k.isScene===!0?k.overrideMaterial:null;for(let B=0,ot=E.length;B<ot;B++){const mt=E[B],bt=mt.object,wt=mt.geometry,Ut=G===null?mt.material:G,kt=mt.group;bt.layers.test(V.layers)&&jc(bt,k,V,wt,Ut,kt)}}function jc(E,k,V,G,B,ot){E.onBeforeRender(y,k,V,G,B,ot),E.modelViewMatrix.multiplyMatrices(V.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),B.transparent===!0&&B.side===Ye&&B.forceSinglePass===!1?(B.side=Ve,B.needsUpdate=!0,y.renderBufferDirect(V,k,G,B,E,ot),B.side=Wn,B.needsUpdate=!0,y.renderBufferDirect(V,k,G,B,E,ot),B.side=Ye):y.renderBufferDirect(V,k,G,B,E,ot),E.onAfterRender(y,k,V,G,B,ot)}function or(E,k,V){k.isScene!==!0&&(k=Pt);const G=Nt.get(E),B=p.state.lights,ot=p.state.shadowsArray,mt=B.state.version,bt=Q.getParameters(E,B.state,ot,k,V),wt=Q.getProgramCacheKey(bt);let Ut=G.programs;G.environment=E.isMeshStandardMaterial?k.environment:null,G.fog=k.fog,G.envMap=(E.isMeshStandardMaterial?M:C).get(E.envMap||G.environment),G.envMapRotation=G.environment!==null&&E.envMap===null?k.environmentRotation:E.envMapRotation,Ut===void 0&&(E.addEventListener("dispose",Dt),Ut=new Map,G.programs=Ut);let kt=Ut.get(wt);if(kt!==void 0){if(G.currentProgram===kt&&G.lightsStateVersion===mt)return Zc(E,bt),kt}else bt.uniforms=Q.getUniforms(E),E.onBeforeCompile(bt,y),kt=Q.acquireProgram(bt,wt),Ut.set(wt,kt),G.uniforms=bt.uniforms;const It=G.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(It.clippingPlanes=Ot.uniform),Zc(E,bt),G.needsLights=sd(E),G.lightsStateVersion=mt,G.needsLights&&(It.ambientLightColor.value=B.state.ambient,It.lightProbe.value=B.state.probe,It.directionalLights.value=B.state.directional,It.directionalLightShadows.value=B.state.directionalShadow,It.spotLights.value=B.state.spot,It.spotLightShadows.value=B.state.spotShadow,It.rectAreaLights.value=B.state.rectArea,It.ltc_1.value=B.state.rectAreaLTC1,It.ltc_2.value=B.state.rectAreaLTC2,It.pointLights.value=B.state.point,It.pointLightShadows.value=B.state.pointShadow,It.hemisphereLights.value=B.state.hemi,It.directionalShadowMap.value=B.state.directionalShadowMap,It.directionalShadowMatrix.value=B.state.directionalShadowMatrix,It.spotShadowMap.value=B.state.spotShadowMap,It.spotLightMatrix.value=B.state.spotLightMatrix,It.spotLightMap.value=B.state.spotLightMap,It.pointShadowMap.value=B.state.pointShadowMap,It.pointShadowMatrix.value=B.state.pointShadowMatrix),G.currentProgram=kt,G.uniformsList=null,kt}function $c(E){if(E.uniformsList===null){const k=E.currentProgram.getUniforms();E.uniformsList=ro.seqWithValue(k.seq,E.uniforms)}return E.uniformsList}function Zc(E,k){const V=Nt.get(E);V.outputColorSpace=k.outputColorSpace,V.batching=k.batching,V.batchingColor=k.batchingColor,V.instancing=k.instancing,V.instancingColor=k.instancingColor,V.instancingMorph=k.instancingMorph,V.skinning=k.skinning,V.morphTargets=k.morphTargets,V.morphNormals=k.morphNormals,V.morphColors=k.morphColors,V.morphTargetsCount=k.morphTargetsCount,V.numClippingPlanes=k.numClippingPlanes,V.numIntersection=k.numClipIntersection,V.vertexAlphas=k.vertexAlphas,V.vertexTangents=k.vertexTangents,V.toneMapping=k.toneMapping}function nd(E,k,V,G,B){k.isScene!==!0&&(k=Pt),z.resetTextureUnits();const ot=k.fog,mt=G.isMeshStandardMaterial?k.environment:null,bt=b===null?y.outputColorSpace:b.isXRRenderTarget===!0?b.texture.colorSpace:Oe,wt=(G.isMeshStandardMaterial?M:C).get(G.envMap||mt),Ut=G.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,kt=!!V.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),It=!!V.morphAttributes.position,se=!!V.morphAttributes.normal,Se=!!V.morphAttributes.color;let be=Gn;G.toneMapped&&(b===null||b.isXRRenderTarget===!0)&&(be=y.toneMapping);const $e=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,re=$e!==void 0?$e.length:0,Et=Nt.get(G),Ne=p.state.lights;if(Z===!0&&(st===!0||E!==w)){const sn=E===w&&G.id===L;Ot.setState(G,E,sn)}let oe=!1;G.version===Et.__version?(Et.needsLights&&Et.lightsStateVersion!==Ne.state.version||Et.outputColorSpace!==bt||B.isBatchedMesh&&Et.batching===!1||!B.isBatchedMesh&&Et.batching===!0||B.isBatchedMesh&&Et.batchingColor===!0&&B.colorTexture===null||B.isBatchedMesh&&Et.batchingColor===!1&&B.colorTexture!==null||B.isInstancedMesh&&Et.instancing===!1||!B.isInstancedMesh&&Et.instancing===!0||B.isSkinnedMesh&&Et.skinning===!1||!B.isSkinnedMesh&&Et.skinning===!0||B.isInstancedMesh&&Et.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&Et.instancingColor===!1&&B.instanceColor!==null||B.isInstancedMesh&&Et.instancingMorph===!0&&B.morphTexture===null||B.isInstancedMesh&&Et.instancingMorph===!1&&B.morphTexture!==null||Et.envMap!==wt||G.fog===!0&&Et.fog!==ot||Et.numClippingPlanes!==void 0&&(Et.numClippingPlanes!==Ot.numPlanes||Et.numIntersection!==Ot.numIntersection)||Et.vertexAlphas!==Ut||Et.vertexTangents!==kt||Et.morphTargets!==It||Et.morphNormals!==se||Et.morphColors!==Se||Et.toneMapping!==be||Et.morphTargetsCount!==re)&&(oe=!0):(oe=!0,Et.__version=G.version);let pn=Et.currentProgram;oe===!0&&(pn=or(G,k,B));let Di=!1,Ze=!1,Uo=!1;const Te=pn.getUniforms(),jn=Et.uniforms;if(At.useProgram(pn.program)&&(Di=!0,Ze=!0,Uo=!0),G.id!==L&&(L=G.id,Ze=!0),Di||w!==E){Te.setValue(D,"projectionMatrix",E.projectionMatrix),Te.setValue(D,"viewMatrix",E.matrixWorldInverse);const sn=Te.map.cameraPosition;sn!==void 0&&sn.setValue(D,Mt.setFromMatrixPosition(E.matrixWorld)),Qt.logarithmicDepthBuffer&&Te.setValue(D,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&Te.setValue(D,"isOrthographic",E.isOrthographicCamera===!0),w!==E&&(w=E,Ze=!0,Uo=!0)}if(B.isSkinnedMesh){Te.setOptional(D,B,"bindMatrix"),Te.setOptional(D,B,"bindMatrixInverse");const sn=B.skeleton;sn&&(sn.boneTexture===null&&sn.computeBoneTexture(),Te.setValue(D,"boneTexture",sn.boneTexture,z))}B.isBatchedMesh&&(Te.setOptional(D,B,"batchingTexture"),Te.setValue(D,"batchingTexture",B._matricesTexture,z),Te.setOptional(D,B,"batchingIdTexture"),Te.setValue(D,"batchingIdTexture",B._indirectTexture,z),Te.setOptional(D,B,"batchingColorTexture"),B._colorsTexture!==null&&Te.setValue(D,"batchingColorTexture",B._colorsTexture,z));const No=V.morphAttributes;if((No.position!==void 0||No.normal!==void 0||No.color!==void 0)&&vt.update(B,V,pn),(Ze||Et.receiveShadow!==B.receiveShadow)&&(Et.receiveShadow=B.receiveShadow,Te.setValue(D,"receiveShadow",B.receiveShadow)),G.isMeshGouraudMaterial&&G.envMap!==null&&(jn.envMap.value=wt,jn.flipEnvMap.value=wt.isCubeTexture&&wt.isRenderTargetTexture===!1?-1:1),G.isMeshStandardMaterial&&G.envMap===null&&k.environment!==null&&(jn.envMapIntensity.value=k.environmentIntensity),Ze&&(Te.setValue(D,"toneMappingExposure",y.toneMappingExposure),Et.needsLights&&id(jn,Uo),ot&&G.fog===!0&&Tt.refreshFogUniforms(jn,ot),Tt.refreshMaterialUniforms(jn,G,$,W,p.state.transmissionRenderTarget[E.id]),ro.upload(D,$c(Et),jn,z)),G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&(ro.upload(D,$c(Et),jn,z),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&Te.setValue(D,"center",B.center),Te.setValue(D,"modelViewMatrix",B.modelViewMatrix),Te.setValue(D,"normalMatrix",B.normalMatrix),Te.setValue(D,"modelMatrix",B.matrixWorld),G.isShaderMaterial||G.isRawShaderMaterial){const sn=G.uniformsGroups;for(let ko=0,rd=sn.length;ko<rd;ko++){const Jc=sn[ko];ye.update(Jc,pn),ye.bind(Jc,pn)}}return pn}function id(E,k){E.ambientLightColor.needsUpdate=k,E.lightProbe.needsUpdate=k,E.directionalLights.needsUpdate=k,E.directionalLightShadows.needsUpdate=k,E.pointLights.needsUpdate=k,E.pointLightShadows.needsUpdate=k,E.spotLights.needsUpdate=k,E.spotLightShadows.needsUpdate=k,E.rectAreaLights.needsUpdate=k,E.hemisphereLights.needsUpdate=k}function sd(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return T},this.getRenderTarget=function(){return b},this.setRenderTargetTextures=function(E,k,V){Nt.get(E.texture).__webglTexture=k,Nt.get(E.depthTexture).__webglTexture=V;const G=Nt.get(E);G.__hasExternalTextures=!0,G.__autoAllocateDepthBuffer=V===void 0,G.__autoAllocateDepthBuffer||$t.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),G.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(E,k){const V=Nt.get(E);V.__webglFramebuffer=k,V.__useDefaultFramebuffer=k===void 0},this.setRenderTarget=function(E,k=0,V=0){b=E,R=k,T=V;let G=!0,B=null,ot=!1,mt=!1;if(E){const wt=Nt.get(E);wt.__useDefaultFramebuffer!==void 0?(At.bindFramebuffer(D.FRAMEBUFFER,null),G=!1):wt.__webglFramebuffer===void 0?z.setupRenderTarget(E):wt.__hasExternalTextures&&z.rebindTextures(E,Nt.get(E.texture).__webglTexture,Nt.get(E.depthTexture).__webglTexture);const Ut=E.texture;(Ut.isData3DTexture||Ut.isDataArrayTexture||Ut.isCompressedArrayTexture)&&(mt=!0);const kt=Nt.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(kt[k])?B=kt[k][V]:B=kt[k],ot=!0):E.samples>0&&z.useMultisampledRTT(E)===!1?B=Nt.get(E).__webglMultisampledFramebuffer:Array.isArray(kt)?B=kt[V]:B=kt,S.copy(E.viewport),P.copy(E.scissor),U=E.scissorTest}else S.copy(_t).multiplyScalar($).floor(),P.copy(St).multiplyScalar($).floor(),U=Xt;if(At.bindFramebuffer(D.FRAMEBUFFER,B)&&G&&At.drawBuffers(E,B),At.viewport(S),At.scissor(P),At.setScissorTest(U),ot){const wt=Nt.get(E.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+k,wt.__webglTexture,V)}else if(mt){const wt=Nt.get(E.texture),Ut=k||0;D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,wt.__webglTexture,V||0,Ut)}L=-1},this.readRenderTargetPixels=function(E,k,V,G,B,ot,mt){if(!(E&&E.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let bt=Nt.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&mt!==void 0&&(bt=bt[mt]),bt){At.bindFramebuffer(D.FRAMEBUFFER,bt);try{const wt=E.texture,Ut=wt.format,kt=wt.type;if(!Qt.textureFormatReadable(Ut)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Qt.textureTypeReadable(kt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}k>=0&&k<=E.width-G&&V>=0&&V<=E.height-B&&D.readPixels(k,V,G,B,zt.convert(Ut),zt.convert(kt),ot)}finally{const wt=b!==null?Nt.get(b).__webglFramebuffer:null;At.bindFramebuffer(D.FRAMEBUFFER,wt)}}},this.readRenderTargetPixelsAsync=async function(E,k,V,G,B,ot,mt){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let bt=Nt.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&mt!==void 0&&(bt=bt[mt]),bt){At.bindFramebuffer(D.FRAMEBUFFER,bt);try{const wt=E.texture,Ut=wt.format,kt=wt.type;if(!Qt.textureFormatReadable(Ut))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Qt.textureTypeReadable(kt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(k>=0&&k<=E.width-G&&V>=0&&V<=E.height-B){const It=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,It),D.bufferData(D.PIXEL_PACK_BUFFER,ot.byteLength,D.STREAM_READ),D.readPixels(k,V,G,B,zt.convert(Ut),zt.convert(kt),0),D.flush();const se=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);await bf(D,se,4);try{D.bindBuffer(D.PIXEL_PACK_BUFFER,It),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,ot)}finally{D.deleteBuffer(It),D.deleteSync(se)}return ot}}finally{const wt=b!==null?Nt.get(b).__webglFramebuffer:null;At.bindFramebuffer(D.FRAMEBUFFER,wt)}}},this.copyFramebufferToTexture=function(E,k=null,V=0){E.isTexture!==!0&&(console.warn("WebGLRenderer: copyFramebufferToTexture function signature has changed."),k=arguments[0]||null,E=arguments[1]);const G=Math.pow(2,-V),B=Math.floor(E.image.width*G),ot=Math.floor(E.image.height*G),mt=k!==null?k.x:0,bt=k!==null?k.y:0;z.setTexture2D(E,0),D.copyTexSubImage2D(D.TEXTURE_2D,V,0,0,mt,bt,B,ot),At.unbindTexture()},this.copyTextureToTexture=function(E,k,V=null,G=null,B=0){E.isTexture!==!0&&(console.warn("WebGLRenderer: copyTextureToTexture function signature has changed."),G=arguments[0]||null,E=arguments[1],k=arguments[2],B=arguments[3]||0,V=null);let ot,mt,bt,wt,Ut,kt;V!==null?(ot=V.max.x-V.min.x,mt=V.max.y-V.min.y,bt=V.min.x,wt=V.min.y):(ot=E.image.width,mt=E.image.height,bt=0,wt=0),G!==null?(Ut=G.x,kt=G.y):(Ut=0,kt=0);const It=zt.convert(k.format),se=zt.convert(k.type);z.setTexture2D(k,0),D.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,k.flipY),D.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),D.pixelStorei(D.UNPACK_ALIGNMENT,k.unpackAlignment);const Se=D.getParameter(D.UNPACK_ROW_LENGTH),be=D.getParameter(D.UNPACK_IMAGE_HEIGHT),$e=D.getParameter(D.UNPACK_SKIP_PIXELS),re=D.getParameter(D.UNPACK_SKIP_ROWS),Et=D.getParameter(D.UNPACK_SKIP_IMAGES),Ne=E.isCompressedTexture?E.mipmaps[B]:E.image;D.pixelStorei(D.UNPACK_ROW_LENGTH,Ne.width),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,Ne.height),D.pixelStorei(D.UNPACK_SKIP_PIXELS,bt),D.pixelStorei(D.UNPACK_SKIP_ROWS,wt),E.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,B,Ut,kt,ot,mt,It,se,Ne.data):E.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,B,Ut,kt,Ne.width,Ne.height,It,Ne.data):D.texSubImage2D(D.TEXTURE_2D,B,Ut,kt,ot,mt,It,se,Ne),D.pixelStorei(D.UNPACK_ROW_LENGTH,Se),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,be),D.pixelStorei(D.UNPACK_SKIP_PIXELS,$e),D.pixelStorei(D.UNPACK_SKIP_ROWS,re),D.pixelStorei(D.UNPACK_SKIP_IMAGES,Et),B===0&&k.generateMipmaps&&D.generateMipmap(D.TEXTURE_2D),At.unbindTexture()},this.copyTextureToTexture3D=function(E,k,V=null,G=null,B=0){E.isTexture!==!0&&(console.warn("WebGLRenderer: copyTextureToTexture3D function signature has changed."),V=arguments[0]||null,G=arguments[1]||null,E=arguments[2],k=arguments[3],B=arguments[4]||0);let ot,mt,bt,wt,Ut,kt,It,se,Se;const be=E.isCompressedTexture?E.mipmaps[B]:E.image;V!==null?(ot=V.max.x-V.min.x,mt=V.max.y-V.min.y,bt=V.max.z-V.min.z,wt=V.min.x,Ut=V.min.y,kt=V.min.z):(ot=be.width,mt=be.height,bt=be.depth,wt=0,Ut=0,kt=0),G!==null?(It=G.x,se=G.y,Se=G.z):(It=0,se=0,Se=0);const $e=zt.convert(k.format),re=zt.convert(k.type);let Et;if(k.isData3DTexture)z.setTexture3D(k,0),Et=D.TEXTURE_3D;else if(k.isDataArrayTexture||k.isCompressedArrayTexture)z.setTexture2DArray(k,0),Et=D.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}D.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,k.flipY),D.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),D.pixelStorei(D.UNPACK_ALIGNMENT,k.unpackAlignment);const Ne=D.getParameter(D.UNPACK_ROW_LENGTH),oe=D.getParameter(D.UNPACK_IMAGE_HEIGHT),pn=D.getParameter(D.UNPACK_SKIP_PIXELS),Di=D.getParameter(D.UNPACK_SKIP_ROWS),Ze=D.getParameter(D.UNPACK_SKIP_IMAGES);D.pixelStorei(D.UNPACK_ROW_LENGTH,be.width),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,be.height),D.pixelStorei(D.UNPACK_SKIP_PIXELS,wt),D.pixelStorei(D.UNPACK_SKIP_ROWS,Ut),D.pixelStorei(D.UNPACK_SKIP_IMAGES,kt),E.isDataTexture||E.isData3DTexture?D.texSubImage3D(Et,B,It,se,Se,ot,mt,bt,$e,re,be.data):k.isCompressedArrayTexture?D.compressedTexSubImage3D(Et,B,It,se,Se,ot,mt,bt,$e,be.data):D.texSubImage3D(Et,B,It,se,Se,ot,mt,bt,$e,re,be),D.pixelStorei(D.UNPACK_ROW_LENGTH,Ne),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,oe),D.pixelStorei(D.UNPACK_SKIP_PIXELS,pn),D.pixelStorei(D.UNPACK_SKIP_ROWS,Di),D.pixelStorei(D.UNPACK_SKIP_IMAGES,Ze),B===0&&k.generateMipmaps&&D.generateMipmap(Et),At.unbindTexture()},this.initRenderTarget=function(E){Nt.get(E).__webglFramebuffer===void 0&&z.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?z.setTextureCube(E,0):E.isData3DTexture?z.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?z.setTexture2DArray(E,0):z.setTexture2D(E,0),At.unbindTexture()},this.resetState=function(){R=0,T=0,b=null,At.reset(),qt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Vn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=t===Rc?"display-p3":"srgb",e.unpackColorSpace=te.workingColorSpace===bo?"display-p3":"srgb"}}class Uc{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new nt(t),this.near=e,this.far=n}clone(){return new Uc(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class I_ extends pe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ce,this.environmentIntensity=1,this.environmentRotation=new Ce,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class Eu{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=lc,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.version=0,this.uuid=Mn()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return Lc("THREE.InterleavedBuffer: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,n){t*=this.stride,n*=e.stride;for(let i=0,s=this.stride;i<s;i++)this.array[t+i]=e.array[n+i];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Mn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(e,this.stride);return n.setUsage(this.usage),n}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Mn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const Ge=new A;class Js{constructor(t,e,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)Ge.fromBufferAttribute(this,e),Ge.applyMatrix4(t),this.setXYZ(e,Ge.x,Ge.y,Ge.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Ge.fromBufferAttribute(this,e),Ge.applyNormalMatrix(t),this.setXYZ(e,Ge.x,Ge.y,Ge.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Ge.fromBufferAttribute(this,e),Ge.transformDirection(t),this.setXYZ(e,Ge.x,Ge.y,Ge.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=vn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=le(n,this.array)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=le(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=le(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=le(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=le(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=vn(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=vn(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=vn(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=vn(e,this.array)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=le(e,this.array),n=le(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,i){return t=t*this.data.stride+this.offset,this.normalized&&(e=le(e,this.array),n=le(n,this.array),i=le(i,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=i,this}setXYZW(t,e,n,i,s){return t=t*this.data.stride+this.offset,this.normalized&&(e=le(e,this.array),n=le(n,this.array),i=le(i,this.array),s=le(s,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=i,this.data.array[t+3]=s,this}clone(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)e.push(this.data.array[i+s])}return new ue(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new Js(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)e.push(this.data.array[i+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class vs extends nn{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new nt(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}let Zi;const Cs=new A,Ji=new A,Qi=new A,ts=new at,Ls=new at,Ru=new Bt,Rr=new A,Ps=new A,Cr=new A,Zl=new at,ha=new at,Jl=new at;class Qs extends pe{constructor(t=new vs){if(super(),this.isSprite=!0,this.type="Sprite",Zi===void 0){Zi=new Me;const e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new Eu(e,5);Zi.setIndex([0,1,2,0,2,3]),Zi.setAttribute("position",new Js(n,3,0,!1)),Zi.setAttribute("uv",new Js(n,2,3,!1))}this.geometry=Zi,this.material=t,this.center=new at(.5,.5)}raycast(t,e){t.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Ji.setFromMatrixScale(this.matrixWorld),Ru.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),Qi.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Ji.multiplyScalar(-Qi.z);const n=this.material.rotation;let i,s;n!==0&&(s=Math.cos(n),i=Math.sin(n));const o=this.center;Lr(Rr.set(-.5,-.5,0),Qi,o,Ji,i,s),Lr(Ps.set(.5,-.5,0),Qi,o,Ji,i,s),Lr(Cr.set(.5,.5,0),Qi,o,Ji,i,s),Zl.set(0,0),ha.set(1,0),Jl.set(1,1);let a=t.ray.intersectTriangle(Rr,Ps,Cr,!1,Cs);if(a===null&&(Lr(Ps.set(-.5,.5,0),Qi,o,Ji,i,s),ha.set(0,1),a=t.ray.intersectTriangle(Rr,Cr,Ps,!1,Cs),a===null))return;const c=t.ray.origin.distanceTo(Cs);c<t.near||c>t.far||e.push({distance:c,point:Cs.clone(),uv:un.getInterpolation(Cs,Rr,Ps,Cr,Zl,ha,Jl,new at),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}}function Lr(r,t,e,n,i,s){ts.subVectors(r,e).addScalar(.5).multiply(n),i!==void 0?(Ls.x=s*ts.x-i*ts.y,Ls.y=i*ts.x+s*ts.y):Ls.copy(ts),r.copy(t),r.x+=Ls.x,r.y+=Ls.y,r.applyMatrix4(Ru)}const Ql=new A,th=new he,eh=new he,D_=new A,nh=new Bt,Pr=new A,ua=new fn,ih=new Bt,da=new wo;class Eo extends jt{constructor(t,e){super(t,e),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=sl,this.bindMatrix=new Bt,this.bindMatrixInverse=new Bt,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const t=this.geometry;this.boundingBox===null&&(this.boundingBox=new Yn),this.boundingBox.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,Pr),this.boundingBox.expandByPoint(Pr)}computeBoundingSphere(){const t=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new fn),this.boundingSphere.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,Pr),this.boundingSphere.expandByPoint(Pr)}copy(t,e){return super.copy(t,e),this.bindMode=t.bindMode,this.bindMatrix.copy(t.bindMatrix),this.bindMatrixInverse.copy(t.bindMatrixInverse),this.skeleton=t.skeleton,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}raycast(t,e){const n=this.material,i=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ua.copy(this.boundingSphere),ua.applyMatrix4(i),t.ray.intersectsSphere(ua)!==!1&&(ih.copy(i).invert(),da.copy(t.ray).applyMatrix4(ih),!(this.boundingBox!==null&&da.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(t,e,da)))}getVertexPosition(t,e){return super.getVertexPosition(t,e),this.applyBoneTransform(t,e),e}bind(t,e){this.skeleton=t,e===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),e=this.matrixWorld),this.bindMatrix.copy(e),this.bindMatrixInverse.copy(e).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const t=new he,e=this.geometry.attributes.skinWeight;for(let n=0,i=e.count;n<i;n++){t.fromBufferAttribute(e,n);const s=1/t.manhattanLength();s!==1/0?t.multiplyScalar(s):t.set(1,0,0,0),e.setXYZW(n,t.x,t.y,t.z,t.w)}}updateMatrixWorld(t){super.updateMatrixWorld(t),this.bindMode===sl?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Xd?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(t,e){const n=this.skeleton,i=this.geometry;th.fromBufferAttribute(i.attributes.skinIndex,t),eh.fromBufferAttribute(i.attributes.skinWeight,t),Ql.copy(e).applyMatrix4(this.bindMatrix),e.set(0,0,0);for(let s=0;s<4;s++){const o=eh.getComponent(s);if(o!==0){const a=th.getComponent(s);nh.multiplyMatrices(n.bones[a].matrixWorld,n.boneInverses[a]),e.addScaledVector(D_.copy(Ql).applyMatrix4(nh),o)}}return e.applyMatrix4(this.bindMatrixInverse)}}class Ro extends pe{constructor(){super(),this.isBone=!0,this.type="Bone"}}class Nc extends Ee{constructor(t=null,e=1,n=1,i,s,o,a,c,l=He,h=He,u,d){super(null,o,a,c,l,h,i,s,u,d),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const sh=new Bt,U_=new Bt;class er{constructor(t=[],e=[]){this.uuid=Mn(),this.bones=t.slice(0),this.boneInverses=e,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const t=this.bones,e=this.boneInverses;if(this.boneMatrices=new Float32Array(t.length*16),e.length===0)this.calculateInverses();else if(t.length!==e.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new Bt)}}calculateInverses(){this.boneInverses.length=0;for(let t=0,e=this.bones.length;t<e;t++){const n=new Bt;this.bones[t]&&n.copy(this.bones[t].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&n.matrixWorld.copy(this.boneInverses[t]).invert()}for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const t=this.bones,e=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let s=0,o=t.length;s<o;s++){const a=t[s]?t[s].matrixWorld:U_;sh.multiplyMatrices(a,e[s]),sh.toArray(n,s*16)}i!==null&&(i.needsUpdate=!0)}clone(){return new er(this.bones,this.boneInverses)}computeBoneTexture(){let t=Math.sqrt(this.bones.length*4);t=Math.ceil(t/4)*4,t=Math.max(t,4);const e=new Float32Array(t*t*4);e.set(this.boneMatrices);const n=new Nc(e,t,t,en,yn);return n.needsUpdate=!0,this.boneMatrices=e,this.boneTexture=n,this}getBoneByName(t){for(let e=0,n=this.bones.length;e<n;e++){const i=this.bones[e];if(i.name===t)return i}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(t,e){this.uuid=t.uuid;for(let n=0,i=t.bones.length;n<i;n++){const s=t.bones[n];let o=e[s];o===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",s),o=new Ro),this.bones.push(o),this.boneInverses.push(new Bt().fromArray(t.boneInverses[n]))}return this.init(),this}toJSON(){const t={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};t.uuid=this.uuid;const e=this.bones,n=this.boneInverses;for(let i=0,s=e.length;i<s;i++){const o=e[i];t.bones.push(o.uuid);const a=n[i];t.boneInverses.push(a.toArray())}return t}}class uc extends ue{constructor(t,e,n,i=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const es=new Bt,rh=new Bt,Ir=[],oh=new Yn,N_=new Bt,Is=new jt,Ds=new fn;class Cu extends jt{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new uc(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,N_)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Yn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,es),oh.copy(t.boundingBox).applyMatrix4(es),this.boundingBox.union(oh)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new fn),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,es),Ds.copy(t.boundingSphere).applyMatrix4(es),this.boundingSphere.union(Ds)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,i=this.morphTexture.source.data.data,s=n.length+1,o=t*s+1;for(let a=0;a<n.length;a++)n[a]=i[o+a]}raycast(t,e){const n=this.matrixWorld,i=this.count;if(Is.geometry=this.geometry,Is.material=this.material,Is.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ds.copy(this.boundingSphere),Ds.applyMatrix4(n),t.ray.intersectsSphere(Ds)!==!1))for(let s=0;s<i;s++){this.getMatrixAt(s,es),rh.multiplyMatrices(n,es),Is.matrixWorld=rh,Is.raycast(t,Ir);for(let o=0,a=Ir.length;o<a;o++){const c=Ir[o];c.instanceId=s,c.object=this,e.push(c)}Ir.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new uc(new Float32Array(this.instanceMatrix.count*3),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new Nc(new Float32Array(i*this.count),i,this.count,bc,yn));const s=this.morphTexture.source.data.data;let o=0;for(let l=0;l<n.length;l++)o+=n[l];const a=this.geometry.morphTargetsRelative?1:1-o,c=i*t;s[c]=a,s.set(n,c+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class kc extends nn{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new nt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const po=new A,mo=new A,ah=new Bt,Us=new wo,Dr=new fn,fa=new A,ch=new A;class Oc extends pe{constructor(t=new Me,e=new kc){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let i=1,s=e.count;i<s;i++)po.fromBufferAttribute(e,i-1),mo.fromBufferAttribute(e,i),n[i]=n[i-1],n[i]+=po.distanceTo(mo);t.setAttribute("lineDistance",new ee(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,s=t.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Dr.copy(n.boundingSphere),Dr.applyMatrix4(i),Dr.radius+=s,t.ray.intersectsSphere(Dr)===!1)return;ah.copy(i).invert(),Us.copy(t.ray).applyMatrix4(ah);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=this.isLineSegments?2:1,h=n.index,d=n.attributes.position;if(h!==null){const f=Math.max(0,o.start),g=Math.min(h.count,o.start+o.count);for(let _=f,p=g-1;_<p;_+=l){const m=h.getX(_),x=h.getX(_+1),y=Ur(this,t,Us,c,m,x);y&&e.push(y)}if(this.isLineLoop){const _=h.getX(g-1),p=h.getX(f),m=Ur(this,t,Us,c,_,p);m&&e.push(m)}}else{const f=Math.max(0,o.start),g=Math.min(d.count,o.start+o.count);for(let _=f,p=g-1;_<p;_+=l){const m=Ur(this,t,Us,c,_,_+1);m&&e.push(m)}if(this.isLineLoop){const _=Ur(this,t,Us,c,g-1,f);_&&e.push(_)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=i.length;s<o;s++){const a=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}function Ur(r,t,e,n,i,s){const o=r.geometry.attributes.position;if(po.fromBufferAttribute(o,i),mo.fromBufferAttribute(o,s),e.distanceSqToSegment(po,mo,fa,ch)>n)return;fa.applyMatrix4(r.matrixWorld);const c=t.ray.origin.distanceTo(fa);if(!(c<t.near||c>t.far))return{distance:c,point:ch.clone().applyMatrix4(r.matrixWorld),index:i,face:null,faceIndex:null,object:r}}const lh=new A,hh=new A;class Lu extends Oc{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let i=0,s=e.count;i<s;i+=2)lh.fromBufferAttribute(e,i),hh.fromBufferAttribute(e,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+lh.distanceTo(hh);t.setAttribute("lineDistance",new ee(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class k_ extends Oc{constructor(t,e){super(t,e),this.isLineLoop=!0,this.type="LineLoop"}}class Pu extends nn{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new nt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const uh=new Bt,dc=new wo,Nr=new fn,kr=new A;class Iu extends pe{constructor(t=new Me,e=new Pu){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,s=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Nr.copy(n.boundingSphere),Nr.applyMatrix4(i),Nr.radius+=s,t.ray.intersectsSphere(Nr)===!1)return;uh.copy(i).invert(),dc.copy(t.ray).applyMatrix4(uh);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=n.index,u=n.attributes.position;if(l!==null){const d=Math.max(0,o.start),f=Math.min(l.count,o.start+o.count);for(let g=d,_=f;g<_;g++){const p=l.getX(g);kr.fromBufferAttribute(u,p),dh(kr,p,c,i,t,e,this)}}else{const d=Math.max(0,o.start),f=Math.min(u.count,o.start+o.count);for(let g=d,_=f;g<_;g++)kr.fromBufferAttribute(u,g),dh(kr,g,c,i,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=i.length;s<o;s++){const a=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}function dh(r,t,e,n,i,s,o){const a=dc.distanceSqToPoint(r);if(a<e){const c=new A;dc.closestPointToPoint(r,c),c.applyMatrix4(n);const l=i.ray.origin.distanceTo(c);if(l<i.near||l>i.far)return;s.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:t,face:null,object:o})}}class Ii extends Ee{constructor(t,e,n,i,s,o,a,c,l){super(t,e,n,i,s,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class An{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,i=this.getPoint(0),s=0;e.push(0);for(let o=1;o<=t;o++)n=this.getPoint(o/t),s+=n.distanceTo(i),e.push(s),i=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const n=this.getLengths();let i=0;const s=n.length;let o;e?o=e:o=t*n[s-1];let a=0,c=s-1,l;for(;a<=c;)if(i=Math.floor(a+(c-a)/2),l=n[i]-o,l<0)a=i+1;else if(l>0)c=i-1;else{c=i;break}if(i=c,n[i]===o)return i/(s-1);const h=n[i],d=n[i+1]-h,f=(o-h)/d;return(i+f)/(s-1)}getTangent(t,e){let i=t-1e-4,s=t+1e-4;i<0&&(i=0),s>1&&(s=1);const o=this.getPoint(i),a=this.getPoint(s),c=e||(o.isVector2?new at:new A);return c.copy(a).sub(o).normalize(),c}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){const n=new A,i=[],s=[],o=[],a=new A,c=new Bt;for(let f=0;f<=t;f++){const g=f/t;i[f]=this.getTangentAt(g,new A)}s[0]=new A,o[0]=new A;let l=Number.MAX_VALUE;const h=Math.abs(i[0].x),u=Math.abs(i[0].y),d=Math.abs(i[0].z);h<=l&&(l=h,n.set(1,0,0)),u<=l&&(l=u,n.set(0,1,0)),d<=l&&n.set(0,0,1),a.crossVectors(i[0],n).normalize(),s[0].crossVectors(i[0],a),o[0].crossVectors(i[0],s[0]);for(let f=1;f<=t;f++){if(s[f]=s[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(i[f-1],i[f]),a.length()>Number.EPSILON){a.normalize();const g=Math.acos(Re(i[f-1].dot(i[f]),-1,1));s[f].applyMatrix4(c.makeRotationAxis(a,g))}o[f].crossVectors(i[f],s[f])}if(e===!0){let f=Math.acos(Re(s[0].dot(s[t]),-1,1));f/=t,i[0].dot(a.crossVectors(s[0],s[t]))>0&&(f=-f);for(let g=1;g<=t;g++)s[g].applyMatrix4(c.makeRotationAxis(i[g],f*g)),o[g].crossVectors(i[g],s[g])}return{tangents:i,normals:s,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class Fc extends An{constructor(t=0,e=0,n=1,i=1,s=0,o=Math.PI*2,a=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=i,this.aStartAngle=s,this.aEndAngle=o,this.aClockwise=a,this.aRotation=c}getPoint(t,e=new at){const n=e,i=Math.PI*2;let s=this.aEndAngle-this.aStartAngle;const o=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=i;for(;s>i;)s-=i;s<Number.EPSILON&&(o?s=0:s=i),this.aClockwise===!0&&!o&&(s===i?s=-i:s=s-i);const a=this.aStartAngle+t*s;let c=this.aX+this.xRadius*Math.cos(a),l=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){const h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=c-this.aX,f=l-this.aY;c=d*h-f*u+this.aX,l=d*u+f*h+this.aY}return n.set(c,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class O_ extends Fc{constructor(t,e,n,i,s,o){super(t,e,n,n,i,s,o),this.isArcCurve=!0,this.type="ArcCurve"}}function Bc(){let r=0,t=0,e=0,n=0;function i(s,o,a,c){r=s,t=a,e=-3*s+3*o-2*a-c,n=2*s-2*o+a+c}return{initCatmullRom:function(s,o,a,c,l){i(o,a,l*(a-s),l*(c-o))},initNonuniformCatmullRom:function(s,o,a,c,l,h,u){let d=(o-s)/l-(a-s)/(l+h)+(a-o)/h,f=(a-o)/h-(c-o)/(h+u)+(c-a)/u;d*=h,f*=h,i(o,a,d,f)},calc:function(s){const o=s*s,a=o*s;return r+t*s+e*o+n*a}}}const Or=new A,pa=new Bc,ma=new Bc,ga=new Bc;class F_ extends An{constructor(t=[],e=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=i}getPoint(t,e=new A){const n=e,i=this.points,s=i.length,o=(s-(this.closed?0:1))*t;let a=Math.floor(o),c=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/s)+1)*s:c===0&&a===s-1&&(a=s-2,c=1);let l,h;this.closed||a>0?l=i[(a-1)%s]:(Or.subVectors(i[0],i[1]).add(i[0]),l=Or);const u=i[a%s],d=i[(a+1)%s];if(this.closed||a+2<s?h=i[(a+2)%s]:(Or.subVectors(i[s-1],i[s-2]).add(i[s-1]),h=Or),this.curveType==="centripetal"||this.curveType==="chordal"){const f=this.curveType==="chordal"?.5:.25;let g=Math.pow(l.distanceToSquared(u),f),_=Math.pow(u.distanceToSquared(d),f),p=Math.pow(d.distanceToSquared(h),f);_<1e-4&&(_=1),g<1e-4&&(g=_),p<1e-4&&(p=_),pa.initNonuniformCatmullRom(l.x,u.x,d.x,h.x,g,_,p),ma.initNonuniformCatmullRom(l.y,u.y,d.y,h.y,g,_,p),ga.initNonuniformCatmullRom(l.z,u.z,d.z,h.z,g,_,p)}else this.curveType==="catmullrom"&&(pa.initCatmullRom(l.x,u.x,d.x,h.x,this.tension),ma.initCatmullRom(l.y,u.y,d.y,h.y,this.tension),ga.initCatmullRom(l.z,u.z,d.z,h.z,this.tension));return n.set(pa.calc(c),ma.calc(c),ga.calc(c)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(i.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const i=this.points[e];t.points.push(i.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(new A().fromArray(i))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function fh(r,t,e,n,i){const s=(n-t)*.5,o=(i-e)*.5,a=r*r,c=r*a;return(2*e-2*n+s+o)*c+(-3*e+3*n-2*s-o)*a+s*r+e}function B_(r,t){const e=1-r;return e*e*t}function z_(r,t){return 2*(1-r)*r*t}function H_(r,t){return r*r*t}function Ws(r,t,e,n){return B_(r,t)+z_(r,e)+H_(r,n)}function V_(r,t){const e=1-r;return e*e*e*t}function G_(r,t){const e=1-r;return 3*e*e*r*t}function W_(r,t){return 3*(1-r)*r*r*t}function X_(r,t){return r*r*r*t}function Xs(r,t,e,n,i){return V_(r,t)+G_(r,e)+W_(r,n)+X_(r,i)}class Du extends An{constructor(t=new at,e=new at,n=new at,i=new at){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new at){const n=e,i=this.v0,s=this.v1,o=this.v2,a=this.v3;return n.set(Xs(t,i.x,s.x,o.x,a.x),Xs(t,i.y,s.y,o.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class q_ extends An{constructor(t=new A,e=new A,n=new A,i=new A){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new A){const n=e,i=this.v0,s=this.v1,o=this.v2,a=this.v3;return n.set(Xs(t,i.x,s.x,o.x,a.x),Xs(t,i.y,s.y,o.y,a.y),Xs(t,i.z,s.z,o.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Uu extends An{constructor(t=new at,e=new at){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new at){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new at){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Y_ extends An{constructor(t=new A,e=new A){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new A){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new A){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Nu extends An{constructor(t=new at,e=new at,n=new at){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new at){const n=e,i=this.v0,s=this.v1,o=this.v2;return n.set(Ws(t,i.x,s.x,o.x),Ws(t,i.y,s.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class K_ extends An{constructor(t=new A,e=new A,n=new A){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new A){const n=e,i=this.v0,s=this.v1,o=this.v2;return n.set(Ws(t,i.x,s.x,o.x),Ws(t,i.y,s.y,o.y),Ws(t,i.z,s.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class ku extends An{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new at){const n=e,i=this.points,s=(i.length-1)*t,o=Math.floor(s),a=s-o,c=i[o===0?o:o-1],l=i[o],h=i[o>i.length-2?i.length-1:o+1],u=i[o>i.length-3?i.length-1:o+2];return n.set(fh(a,c.x,l.x,h.x,u.x),fh(a,c.y,l.y,h.y,u.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(i.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const i=this.points[e];t.points.push(i.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(new at().fromArray(i))}return this}}var ph=Object.freeze({__proto__:null,ArcCurve:O_,CatmullRomCurve3:F_,CubicBezierCurve:Du,CubicBezierCurve3:q_,EllipseCurve:Fc,LineCurve:Uu,LineCurve3:Y_,QuadraticBezierCurve:Nu,QuadraticBezierCurve3:K_,SplineCurve:ku});class j_ extends An{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new ph[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),i=this.getCurveLengths();let s=0;for(;s<i.length;){if(i[s]>=n){const o=i[s]-n,a=this.curves[s],c=a.getLength(),l=c===0?0:1-o/c;return a.getPointAt(l,e)}s++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,i=this.curves.length;n<i;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let i=0,s=this.curves;i<s.length;i++){const o=s[i],a=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,c=o.getPoints(a);for(let l=0;l<c.length;l++){const h=c[l];n&&n.equals(h)||(e.push(h),n=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const i=t.curves[e];this.curves.push(i.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const i=this.curves[e];t.curves.push(i.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const i=t.curves[e];this.curves.push(new ph[i.type]().fromJSON(i))}return this}}class $_ extends j_{constructor(t){super(),this.type="Path",this.currentPoint=new at,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new Uu(this.currentPoint.clone(),new at(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,i){const s=new Nu(this.currentPoint.clone(),new at(t,e),new at(n,i));return this.curves.push(s),this.currentPoint.set(n,i),this}bezierCurveTo(t,e,n,i,s,o){const a=new Du(this.currentPoint.clone(),new at(t,e),new at(n,i),new at(s,o));return this.curves.push(a),this.currentPoint.set(s,o),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new ku(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,i,s,o){const a=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(t+a,e+c,n,i,s,o),this}absarc(t,e,n,i,s,o){return this.absellipse(t,e,n,n,i,s,o),this}ellipse(t,e,n,i,s,o,a,c){const l=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+l,e+h,n,i,s,o,a,c),this}absellipse(t,e,n,i,s,o,a,c){const l=new Fc(t,e,n,i,s,o,a,c);if(this.curves.length>0){const u=l.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(l);const h=l.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class zc extends Me{constructor(t=[new at(0,-.5),new at(.5,0),new at(0,.5)],e=12,n=0,i=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:i},e=Math.floor(e),i=Re(i,0,Math.PI*2);const s=[],o=[],a=[],c=[],l=[],h=1/e,u=new A,d=new at,f=new A,g=new A,_=new A;let p=0,m=0;for(let x=0;x<=t.length-1;x++)switch(x){case 0:p=t[x+1].x-t[x].x,m=t[x+1].y-t[x].y,f.x=m*1,f.y=-p,f.z=m*0,_.copy(f),f.normalize(),c.push(f.x,f.y,f.z);break;case t.length-1:c.push(_.x,_.y,_.z);break;default:p=t[x+1].x-t[x].x,m=t[x+1].y-t[x].y,f.x=m*1,f.y=-p,f.z=m*0,g.copy(f),f.x+=_.x,f.y+=_.y,f.z+=_.z,f.normalize(),c.push(f.x,f.y,f.z),_.copy(g)}for(let x=0;x<=e;x++){const y=n+x*h*i,v=Math.sin(y),R=Math.cos(y);for(let T=0;T<=t.length-1;T++){u.x=t[T].x*v,u.y=t[T].y,u.z=t[T].x*R,o.push(u.x,u.y,u.z),d.x=x/e,d.y=T/(t.length-1),a.push(d.x,d.y);const b=c[3*T+0]*v,L=c[3*T+1],w=c[3*T+0]*R;l.push(b,L,w)}}for(let x=0;x<e;x++)for(let y=0;y<t.length-1;y++){const v=y+x*t.length,R=v,T=v+t.length,b=v+t.length+1,L=v+1;s.push(R,T,L),s.push(b,L,T)}this.setIndex(s),this.setAttribute("position",new ee(o,3)),this.setAttribute("uv",new ee(a,2)),this.setAttribute("normal",new ee(l,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new zc(t.points,t.segments,t.phiStart,t.phiLength)}}class go extends zc{constructor(t=1,e=1,n=4,i=8){const s=new $_;s.absarc(0,-e/2,t,Math.PI*1.5,0),s.absarc(0,e/2,t,0,Math.PI*.5),super(s.getPoints(n),i),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:n,radialSegments:i}}static fromJSON(t){return new go(t.radius,t.length,t.capSegments,t.radialSegments)}}class nr extends Me{constructor(t=1,e=32,n=0,i=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:i},e=Math.max(3,e);const s=[],o=[],a=[],c=[],l=new A,h=new at;o.push(0,0,0),a.push(0,0,1),c.push(.5,.5);for(let u=0,d=3;u<=e;u++,d+=3){const f=n+u/e*i;l.x=t*Math.cos(f),l.y=t*Math.sin(f),o.push(l.x,l.y,l.z),a.push(0,0,1),h.x=(o[d]/t+1)/2,h.y=(o[d+1]/t+1)/2,c.push(h.x,h.y)}for(let u=1;u<=e;u++)s.push(u,u+1,0);this.setIndex(s),this.setAttribute("position",new ee(o,3)),this.setAttribute("normal",new ee(a,3)),this.setAttribute("uv",new ee(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new nr(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class qn extends Me{constructor(t=1,e=1,n=1,i=32,s=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:i,heightSegments:s,openEnded:o,thetaStart:a,thetaLength:c};const l=this;i=Math.floor(i),s=Math.floor(s);const h=[],u=[],d=[],f=[];let g=0;const _=[],p=n/2;let m=0;x(),o===!1&&(t>0&&y(!0),e>0&&y(!1)),this.setIndex(h),this.setAttribute("position",new ee(u,3)),this.setAttribute("normal",new ee(d,3)),this.setAttribute("uv",new ee(f,2));function x(){const v=new A,R=new A;let T=0;const b=(e-t)/n;for(let L=0;L<=s;L++){const w=[],S=L/s,P=S*(e-t)+t;for(let U=0;U<=i;U++){const O=U/i,q=O*c+a,Y=Math.sin(q),W=Math.cos(q);R.x=P*Y,R.y=-S*n+p,R.z=P*W,u.push(R.x,R.y,R.z),v.set(Y,b,W).normalize(),d.push(v.x,v.y,v.z),f.push(O,1-S),w.push(g++)}_.push(w)}for(let L=0;L<i;L++)for(let w=0;w<s;w++){const S=_[w][L],P=_[w+1][L],U=_[w+1][L+1],O=_[w][L+1];h.push(S,P,O),h.push(P,U,O),T+=6}l.addGroup(m,T,0),m+=T}function y(v){const R=g,T=new at,b=new A;let L=0;const w=v===!0?t:e,S=v===!0?1:-1;for(let U=1;U<=i;U++)u.push(0,p*S,0),d.push(0,S,0),f.push(.5,.5),g++;const P=g;for(let U=0;U<=i;U++){const q=U/i*c+a,Y=Math.cos(q),W=Math.sin(q);b.x=w*W,b.y=p*S,b.z=w*Y,u.push(b.x,b.y,b.z),d.push(0,S,0),T.x=Y*.5+.5,T.y=W*.5*S+.5,f.push(T.x,T.y),g++}for(let U=0;U<i;U++){const O=R+U,q=P+U;v===!0?h.push(q,q+1,O):h.push(q+1,q,O),L+=3}l.addGroup(m,L,v===!0?1:2),m+=L}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new qn(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class ir extends qn{constructor(t=1,e=1,n=32,i=1,s=!1,o=0,a=Math.PI*2){super(0,t,e,n,i,s,o,a),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:i,openEnded:s,thetaStart:o,thetaLength:a}}static fromJSON(t){return new ir(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Hc extends Me{constructor(t=[],e=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:i};const s=[],o=[];a(i),l(n),h(),this.setAttribute("position",new ee(s,3)),this.setAttribute("normal",new ee(s.slice(),3)),this.setAttribute("uv",new ee(o,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function a(x){const y=new A,v=new A,R=new A;for(let T=0;T<e.length;T+=3)f(e[T+0],y),f(e[T+1],v),f(e[T+2],R),c(y,v,R,x)}function c(x,y,v,R){const T=R+1,b=[];for(let L=0;L<=T;L++){b[L]=[];const w=x.clone().lerp(v,L/T),S=y.clone().lerp(v,L/T),P=T-L;for(let U=0;U<=P;U++)U===0&&L===T?b[L][U]=w:b[L][U]=w.clone().lerp(S,U/P)}for(let L=0;L<T;L++)for(let w=0;w<2*(T-L)-1;w++){const S=Math.floor(w/2);w%2===0?(d(b[L][S+1]),d(b[L+1][S]),d(b[L][S])):(d(b[L][S+1]),d(b[L+1][S+1]),d(b[L+1][S]))}}function l(x){const y=new A;for(let v=0;v<s.length;v+=3)y.x=s[v+0],y.y=s[v+1],y.z=s[v+2],y.normalize().multiplyScalar(x),s[v+0]=y.x,s[v+1]=y.y,s[v+2]=y.z}function h(){const x=new A;for(let y=0;y<s.length;y+=3){x.x=s[y+0],x.y=s[y+1],x.z=s[y+2];const v=p(x)/2/Math.PI+.5,R=m(x)/Math.PI+.5;o.push(v,1-R)}g(),u()}function u(){for(let x=0;x<o.length;x+=6){const y=o[x+0],v=o[x+2],R=o[x+4],T=Math.max(y,v,R),b=Math.min(y,v,R);T>.9&&b<.1&&(y<.2&&(o[x+0]+=1),v<.2&&(o[x+2]+=1),R<.2&&(o[x+4]+=1))}}function d(x){s.push(x.x,x.y,x.z)}function f(x,y){const v=x*3;y.x=t[v+0],y.y=t[v+1],y.z=t[v+2]}function g(){const x=new A,y=new A,v=new A,R=new A,T=new at,b=new at,L=new at;for(let w=0,S=0;w<s.length;w+=9,S+=6){x.set(s[w+0],s[w+1],s[w+2]),y.set(s[w+3],s[w+4],s[w+5]),v.set(s[w+6],s[w+7],s[w+8]),T.set(o[S+0],o[S+1]),b.set(o[S+2],o[S+3]),L.set(o[S+4],o[S+5]),R.copy(x).add(y).add(v).divideScalar(3);const P=p(R);_(T,S+0,x,P),_(b,S+2,y,P),_(L,S+4,v,P)}}function _(x,y,v,R){R<0&&x.x===1&&(o[y]=x.x-1),v.x===0&&v.z===0&&(o[y]=R/2/Math.PI+.5)}function p(x){return Math.atan2(x.z,-x.x)}function m(x){return Math.atan2(-x.y,Math.sqrt(x.x*x.x+x.z*x.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Hc(t.vertices,t.indices,t.radius,t.details)}}const Fr=new A,Br=new A,_a=new A,zr=new un;class Z_ extends Me{constructor(t=null,e=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:t,thresholdAngle:e},t!==null){const i=Math.pow(10,4),s=Math.cos(hs*e),o=t.getIndex(),a=t.getAttribute("position"),c=o?o.count:a.count,l=[0,0,0],h=["a","b","c"],u=new Array(3),d={},f=[];for(let g=0;g<c;g+=3){o?(l[0]=o.getX(g),l[1]=o.getX(g+1),l[2]=o.getX(g+2)):(l[0]=g,l[1]=g+1,l[2]=g+2);const{a:_,b:p,c:m}=zr;if(_.fromBufferAttribute(a,l[0]),p.fromBufferAttribute(a,l[1]),m.fromBufferAttribute(a,l[2]),zr.getNormal(_a),u[0]=`${Math.round(_.x*i)},${Math.round(_.y*i)},${Math.round(_.z*i)}`,u[1]=`${Math.round(p.x*i)},${Math.round(p.y*i)},${Math.round(p.z*i)}`,u[2]=`${Math.round(m.x*i)},${Math.round(m.y*i)},${Math.round(m.z*i)}`,!(u[0]===u[1]||u[1]===u[2]||u[2]===u[0]))for(let x=0;x<3;x++){const y=(x+1)%3,v=u[x],R=u[y],T=zr[h[x]],b=zr[h[y]],L=`${v}_${R}`,w=`${R}_${v}`;w in d&&d[w]?(_a.dot(d[w].normal)<=s&&(f.push(T.x,T.y,T.z),f.push(b.x,b.y,b.z)),d[w]=null):L in d||(d[L]={index0:l[x],index1:l[y],normal:_a.clone()})}}for(const g in d)if(d[g]){const{index0:_,index1:p}=d[g];Fr.fromBufferAttribute(a,_),Br.fromBufferAttribute(a,p),f.push(Fr.x,Fr.y,Fr.z),f.push(Br.x,Br.y,Br.z)}this.setAttribute("position",new ee(f,3))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}}class Co extends Hc{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,i=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(i,s,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Co(t.radius,t.detail)}}class _o extends Me{constructor(t=.5,e=1,n=32,i=1,s=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:i,thetaStart:s,thetaLength:o},n=Math.max(3,n),i=Math.max(1,i);const a=[],c=[],l=[],h=[];let u=t;const d=(e-t)/i,f=new A,g=new at;for(let _=0;_<=i;_++){for(let p=0;p<=n;p++){const m=s+p/n*o;f.x=u*Math.cos(m),f.y=u*Math.sin(m),c.push(f.x,f.y,f.z),l.push(0,0,1),g.x=(f.x/e+1)/2,g.y=(f.y/e+1)/2,h.push(g.x,g.y)}u+=d}for(let _=0;_<i;_++){const p=_*(n+1);for(let m=0;m<n;m++){const x=m+p,y=x,v=x+n+1,R=x+n+2,T=x+1;a.push(y,v,T),a.push(v,R,T)}}this.setIndex(a),this.setAttribute("position",new ee(c,3)),this.setAttribute("normal",new ee(l,3)),this.setAttribute("uv",new ee(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new _o(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class Lo extends Me{constructor(t=1,e=32,n=16,i=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:i,phiLength:s,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const c=Math.min(o+a,Math.PI);let l=0;const h=[],u=new A,d=new A,f=[],g=[],_=[],p=[];for(let m=0;m<=n;m++){const x=[],y=m/n;let v=0;m===0&&o===0?v=.5/e:m===n&&c===Math.PI&&(v=-.5/e);for(let R=0;R<=e;R++){const T=R/e;u.x=-t*Math.cos(i+T*s)*Math.sin(o+y*a),u.y=t*Math.cos(o+y*a),u.z=t*Math.sin(i+T*s)*Math.sin(o+y*a),g.push(u.x,u.y,u.z),d.copy(u).normalize(),_.push(d.x,d.y,d.z),p.push(T+v,1-y),x.push(l++)}h.push(x)}for(let m=0;m<n;m++)for(let x=0;x<e;x++){const y=h[m][x+1],v=h[m][x],R=h[m+1][x],T=h[m+1][x+1];(m!==0||o>0)&&f.push(y,v,T),(m!==n-1||c<Math.PI)&&f.push(v,R,T)}this.setIndex(f),this.setAttribute("position",new ee(g,3)),this.setAttribute("normal",new ee(_,3)),this.setAttribute("uv",new ee(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Lo(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class Po extends nn{constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new nt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new nt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=So,this.normalScale=new at(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ce,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class En extends Po{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new at(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Re(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new nt(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new nt(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new nt(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}}class Ou extends nn{constructor(t){super(),this.isMeshToonMaterial=!0,this.defines={TOON:""},this.type="MeshToonMaterial",this.color=new nt(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new nt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=So,this.normalScale=new at(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.gradientMap=t.gradientMap,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.alphaMap=t.alphaMap,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}class dn extends nn{constructor(t){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new nt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new nt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=So,this.normalScale=new at(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ce,this.combine=vc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}function Hr(r,t,e){return!r||!e&&r.constructor===t?r:typeof t.BYTES_PER_ELEMENT=="number"?new t(r):Array.prototype.slice.call(r)}function J_(r){return ArrayBuffer.isView(r)&&!(r instanceof DataView)}function Q_(r){function t(i,s){return r[i]-r[s]}const e=r.length,n=new Array(e);for(let i=0;i!==e;++i)n[i]=i;return n.sort(t),n}function mh(r,t,e){const n=r.length,i=new r.constructor(n);for(let s=0,o=0;o!==n;++s){const a=e[s]*t;for(let c=0;c!==t;++c)i[o++]=r[a+c]}return i}function Fu(r,t,e,n){let i=1,s=r[0];for(;s!==void 0&&s[n]===void 0;)s=r[i++];if(s===void 0)return;let o=s[n];if(o!==void 0)if(Array.isArray(o))do o=s[n],o!==void 0&&(t.push(s.time),e.push.apply(e,o)),s=r[i++];while(s!==void 0);else if(o.toArray!==void 0)do o=s[n],o!==void 0&&(t.push(s.time),o.toArray(e,e.length)),s=r[i++];while(s!==void 0);else do o=s[n],o!==void 0&&(t.push(s.time),e.push(o)),s=r[i++];while(s!==void 0)}class sr{constructor(t,e,n,i){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){const e=this.parameterPositions;let n=this._cachedIndex,i=e[n],s=e[n-1];t:{e:{let o;n:{i:if(!(t<i)){for(let a=n+2;;){if(i===void 0){if(t<s)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(s=i,i=e[++n],t<i)break e}o=e.length;break n}if(!(t>=s)){const a=e[1];t<a&&(n=2,s=a);for(let c=n-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(i=s,s=e[--n-1],t>=s)break e}o=n,n=0;break n}break t}for(;n<o;){const a=n+o>>>1;t<e[a]?o=a:n=a+1}if(i=e[n],s=e[n-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,s,i)}return this.interpolate_(n,s,t,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){const e=this.resultBuffer,n=this.sampleValues,i=this.valueSize,s=t*i;for(let o=0;o!==i;++o)e[o]=n[s+o];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}}class tx extends sr{constructor(t,e,n,i){super(t,e,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:ss,endingEnd:ss}}intervalChanged_(t,e,n){const i=this.parameterPositions;let s=t-2,o=t+1,a=i[s],c=i[o];if(a===void 0)switch(this.getSettings_().endingStart){case rs:s=t,a=2*e-n;break;case co:s=i.length-2,a=e+i[s]-i[s+1];break;default:s=t,a=n}if(c===void 0)switch(this.getSettings_().endingEnd){case rs:o=t,c=2*n-e;break;case co:o=1,c=n+i[1]-i[0];break;default:o=t-1,c=e}const l=(n-e)*.5,h=this.valueSize;this._weightPrev=l/(e-a),this._weightNext=l/(c-n),this._offsetPrev=s*h,this._offsetNext=o*h}interpolate_(t,e,n,i){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=t*a,l=c-a,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,g=(n-e)/(i-e),_=g*g,p=_*g,m=-d*p+2*d*_-d*g,x=(1+d)*p+(-1.5-2*d)*_+(-.5+d)*g+1,y=(-1-f)*p+(1.5+f)*_+.5*g,v=f*p-f*_;for(let R=0;R!==a;++R)s[R]=m*o[h+R]+x*o[l+R]+y*o[c+R]+v*o[u+R];return s}}class Bu extends sr{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=t*a,l=c-a,h=(n-e)/(i-e),u=1-h;for(let d=0;d!==a;++d)s[d]=o[l+d]*u+o[c+d]*h;return s}}class ex extends sr{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t){return this.copySampleValue_(t-1)}}class Rn{constructor(t,e,n,i){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Hr(e,this.TimeBufferType),this.values=Hr(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(t){const e=t.constructor;let n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Hr(t.times,Array),values:Hr(t.values,Array)};const i=t.getInterpolation();i!==t.DefaultInterpolation&&(n.interpolation=i)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new ex(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Bu(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new tx(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case js:e=this.InterpolantFactoryMethodDiscrete;break;case $s:e=this.InterpolantFactoryMethodLinear;break;case Oo:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){const n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return js;case this.InterpolantFactoryMethodLinear:return $s;case this.InterpolantFactoryMethodSmooth:return Oo}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){const e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]+=t}return this}scale(t){if(t!==1){const e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]*=t}return this}trim(t,e){const n=this.times,i=n.length;let s=0,o=i-1;for(;s!==i&&n[s]<t;)++s;for(;o!==-1&&n[o]>e;)--o;if(++o,s!==0||o!==i){s>=o&&(o=Math.max(o,1),s=o-1);const a=this.getValueSize();this.times=n.slice(s,o),this.values=this.values.slice(s*a,o*a)}return this}validate(){let t=!0;const e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);const n=this.times,i=this.values,s=n.length;s===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let o=null;for(let a=0;a!==s;a++){const c=n[a];if(typeof c=="number"&&isNaN(c)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,c),t=!1;break}if(o!==null&&o>c){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,c,o),t=!1;break}o=c}if(i!==void 0&&J_(i))for(let a=0,c=i.length;a!==c;++a){const l=i[a];if(isNaN(l)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,l),t=!1;break}}return t}optimize(){const t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===Oo,s=t.length-1;let o=1;for(let a=1;a<s;++a){let c=!1;const l=t[a],h=t[a+1];if(l!==h&&(a!==1||l!==t[0]))if(i)c=!0;else{const u=a*n,d=u-n,f=u+n;for(let g=0;g!==n;++g){const _=e[u+g];if(_!==e[d+g]||_!==e[f+g]){c=!0;break}}}if(c){if(a!==o){t[o]=t[a];const u=a*n,d=o*n;for(let f=0;f!==n;++f)e[d+f]=e[u+f]}++o}}if(s>0){t[o]=t[s];for(let a=s*n,c=o*n,l=0;l!==n;++l)e[c+l]=e[a+l];++o}return o!==t.length?(this.times=t.slice(0,o),this.values=e.slice(0,o*n)):(this.times=t,this.values=e),this}clone(){const t=this.times.slice(),e=this.values.slice(),n=this.constructor,i=new n(this.name,t,e);return i.createInterpolant=this.createInterpolant,i}}Rn.prototype.TimeBufferType=Float32Array;Rn.prototype.ValueBufferType=Float32Array;Rn.prototype.DefaultInterpolation=$s;class Ss extends Rn{constructor(t,e,n){super(t,e,n)}}Ss.prototype.ValueTypeName="bool";Ss.prototype.ValueBufferType=Array;Ss.prototype.DefaultInterpolation=js;Ss.prototype.InterpolantFactoryMethodLinear=void 0;Ss.prototype.InterpolantFactoryMethodSmooth=void 0;class zu extends Rn{}zu.prototype.ValueTypeName="color";class ys extends Rn{}ys.prototype.ValueTypeName="number";class nx extends sr{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(n-e)/(i-e);let l=t*a;for(let h=l+a;l!==h;l+=4)xe.slerpFlat(s,0,o,l-a,o,l,c);return s}}class Ci extends Rn{InterpolantFactoryMethodLinear(t){return new nx(this.times,this.values,this.getValueSize(),t)}}Ci.prototype.ValueTypeName="quaternion";Ci.prototype.InterpolantFactoryMethodSmooth=void 0;class bs extends Rn{constructor(t,e,n){super(t,e,n)}}bs.prototype.ValueTypeName="string";bs.prototype.ValueBufferType=Array;bs.prototype.DefaultInterpolation=js;bs.prototype.InterpolantFactoryMethodLinear=void 0;bs.prototype.InterpolantFactoryMethodSmooth=void 0;class Li extends Rn{}Li.prototype.ValueTypeName="vector";class xo{constructor(t="",e=-1,n=[],i=Ec){this.name=t,this.tracks=n,this.duration=e,this.blendMode=i,this.uuid=Mn(),this.duration<0&&this.resetDuration()}static parse(t){const e=[],n=t.tracks,i=1/(t.fps||1);for(let o=0,a=n.length;o!==a;++o)e.push(sx(n[o]).scale(i));const s=new this(t.name,t.duration,e,t.blendMode);return s.uuid=t.uuid,s}static toJSON(t){const e=[],n=t.tracks,i={name:t.name,duration:t.duration,tracks:e,uuid:t.uuid,blendMode:t.blendMode};for(let s=0,o=n.length;s!==o;++s)e.push(Rn.toJSON(n[s]));return i}static CreateFromMorphTargetSequence(t,e,n,i){const s=e.length,o=[];for(let a=0;a<s;a++){let c=[],l=[];c.push((a+s-1)%s,a,(a+1)%s),l.push(0,1,0);const h=Q_(c);c=mh(c,1,h),l=mh(l,1,h),!i&&c[0]===0&&(c.push(s),l.push(l[0])),o.push(new ys(".morphTargetInfluences["+e[a].name+"]",c,l).scale(1/n))}return new this(t,-1,o)}static findByName(t,e){let n=t;if(!Array.isArray(t)){const i=t;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===e)return n[i];return null}static CreateClipsFromMorphTargetSequences(t,e,n){const i={},s=/^([\w-]*?)([\d]+)$/;for(let a=0,c=t.length;a<c;a++){const l=t[a],h=l.name.match(s);if(h&&h.length>1){const u=h[1];let d=i[u];d||(i[u]=d=[]),d.push(l)}}const o=[];for(const a in i)o.push(this.CreateFromMorphTargetSequence(a,i[a],e,n));return o}static parseAnimation(t,e){if(!t)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;const n=function(u,d,f,g,_){if(f.length!==0){const p=[],m=[];Fu(f,p,m,g),p.length!==0&&_.push(new u(d,p,m))}},i=[],s=t.name||"default",o=t.fps||30,a=t.blendMode;let c=t.length||-1;const l=t.hierarchy||[];for(let u=0;u<l.length;u++){const d=l[u].keys;if(!(!d||d.length===0))if(d[0].morphTargets){const f={};let g;for(g=0;g<d.length;g++)if(d[g].morphTargets)for(let _=0;_<d[g].morphTargets.length;_++)f[d[g].morphTargets[_]]=-1;for(const _ in f){const p=[],m=[];for(let x=0;x!==d[g].morphTargets.length;++x){const y=d[g];p.push(y.time),m.push(y.morphTarget===_?1:0)}i.push(new ys(".morphTargetInfluence["+_+"]",p,m))}c=f.length*o}else{const f=".bones["+e[u].name+"]";n(Li,f+".position",d,"pos",i),n(Ci,f+".quaternion",d,"rot",i),n(Li,f+".scale",d,"scl",i)}}return i.length===0?null:new this(s,c,i,a)}resetDuration(){const t=this.tracks;let e=0;for(let n=0,i=t.length;n!==i;++n){const s=this.tracks[n];e=Math.max(e,s.times[s.times.length-1])}return this.duration=e,this}trim(){for(let t=0;t<this.tracks.length;t++)this.tracks[t].trim(0,this.duration);return this}validate(){let t=!0;for(let e=0;e<this.tracks.length;e++)t=t&&this.tracks[e].validate();return t}optimize(){for(let t=0;t<this.tracks.length;t++)this.tracks[t].optimize();return this}clone(){const t=[];for(let e=0;e<this.tracks.length;e++)t.push(this.tracks[e].clone());return new this.constructor(this.name,this.duration,t,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}}function ix(r){switch(r.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return ys;case"vector":case"vector2":case"vector3":case"vector4":return Li;case"color":return zu;case"quaternion":return Ci;case"bool":case"boolean":return Ss;case"string":return bs}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+r)}function sx(r){if(r.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const t=ix(r.type);if(r.times===void 0){const e=[],n=[];Fu(r.keys,e,n,"value"),r.times=e,r.values=n}return t.parse!==void 0?t.parse(r):new t(r.name,r.times,r.values,r.interpolation)}const ci={enabled:!1,files:{},add:function(r,t){this.enabled!==!1&&(this.files[r]=t)},get:function(r){if(this.enabled!==!1)return this.files[r]},remove:function(r){delete this.files[r]},clear:function(){this.files={}}};class rx{constructor(t,e,n){const i=this;let s=!1,o=0,a=0,c;const l=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this.itemStart=function(h){a++,s===!1&&i.onStart!==void 0&&i.onStart(h,o,a),s=!0},this.itemEnd=function(h){o++,i.onProgress!==void 0&&i.onProgress(h,o,a),o===a&&(s=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return c?c(h):h},this.setURLModifier=function(h){return c=h,this},this.addHandler=function(h,u){return l.push(h,u),this},this.removeHandler=function(h){const u=l.indexOf(h);return u!==-1&&l.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=l.length;u<d;u+=2){const f=l[u],g=l[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return g}return null}}}const ox=new rx;class ws{constructor(t){this.manager=t!==void 0?t:ox,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){const n=this;return new Promise(function(i,s){n.load(t,i,e,s)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}}ws.DEFAULT_MATERIAL_NAME="__DEFAULT";const Nn={};class ax extends Error{constructor(t,e){super(t),this.response=e}}class Hu extends ws{constructor(t){super(t)}load(t,e,n,i){t===void 0&&(t=""),this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const s=ci.get(t);if(s!==void 0)return this.manager.itemStart(t),setTimeout(()=>{e&&e(s),this.manager.itemEnd(t)},0),s;if(Nn[t]!==void 0){Nn[t].push({onLoad:e,onProgress:n,onError:i});return}Nn[t]=[],Nn[t].push({onLoad:e,onProgress:n,onError:i});const o=new Request(t,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),a=this.mimeType,c=this.responseType;fetch(o).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;const h=Nn[t],u=l.body.getReader(),d=l.headers.get("X-File-Size")||l.headers.get("Content-Length"),f=d?parseInt(d):0,g=f!==0;let _=0;const p=new ReadableStream({start(m){x();function x(){u.read().then(({done:y,value:v})=>{if(y)m.close();else{_+=v.byteLength;const R=new ProgressEvent("progress",{lengthComputable:g,loaded:_,total:f});for(let T=0,b=h.length;T<b;T++){const L=h[T];L.onProgress&&L.onProgress(R)}m.enqueue(v),x()}},y=>{m.error(y)})}}});return new Response(p)}else throw new ax(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(h=>new DOMParser().parseFromString(h,a));case"json":return l.json();default:if(a===void 0)return l.text();{const u=/charset="?([^;"\s]*)"?/i.exec(a),d=u&&u[1]?u[1].toLowerCase():void 0,f=new TextDecoder(d);return l.arrayBuffer().then(g=>f.decode(g))}}}).then(l=>{ci.add(t,l);const h=Nn[t];delete Nn[t];for(let u=0,d=h.length;u<d;u++){const f=h[u];f.onLoad&&f.onLoad(l)}}).catch(l=>{const h=Nn[t];if(h===void 0)throw this.manager.itemError(t),l;delete Nn[t];for(let u=0,d=h.length;u<d;u++){const f=h[u];f.onError&&f.onError(l)}this.manager.itemError(t)}).finally(()=>{this.manager.itemEnd(t)}),this.manager.itemStart(t)}setResponseType(t){return this.responseType=t,this}setMimeType(t){return this.mimeType=t,this}}class cx extends ws{constructor(t){super(t)}load(t,e,n,i){this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const s=this,o=ci.get(t);if(o!==void 0)return s.manager.itemStart(t),setTimeout(function(){e&&e(o),s.manager.itemEnd(t)},0),o;const a=Zs("img");function c(){h(),ci.add(t,this),e&&e(this),s.manager.itemEnd(t)}function l(u){h(),i&&i(u),s.manager.itemError(t),s.manager.itemEnd(t)}function h(){a.removeEventListener("load",c,!1),a.removeEventListener("error",l,!1)}return a.addEventListener("load",c,!1),a.addEventListener("error",l,!1),t.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),s.manager.itemStart(t),a.src=t,a}}class lx extends ws{constructor(t){super(t)}load(t,e,n,i){const s=new Ee,o=new cx(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(t,function(a){s.image=a,s.needsUpdate=!0,e!==void 0&&e(s)},n,i),s}}class Io extends pe{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new nt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class hx extends Io{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(pe.DEFAULT_UP),this.updateMatrix(),this.groundColor=new nt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const xa=new Bt,gh=new A,_h=new A;class Vc{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new at(512,512),this.map=null,this.mapPass=null,this.matrix=new Bt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Pc,this._frameExtents=new at(1,1),this._viewportCount=1,this._viewports=[new he(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;gh.setFromMatrixPosition(t.matrixWorld),e.position.copy(gh),_h.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(_h),e.updateMatrixWorld(),xa.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(xa),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(xa)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class ux extends Vc{constructor(){super(new Xe(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(t){const e=this.camera,n=_s*2*t.angle*this.focus,i=this.mapSize.width/this.mapSize.height,s=t.distance||e.far;(n!==e.fov||i!==e.aspect||s!==e.far)&&(e.fov=n,e.aspect=i,e.far=s,e.updateProjectionMatrix()),super.updateMatrices(t)}copy(t){return super.copy(t),this.focus=t.focus,this}}class dx extends Io{constructor(t,e,n=0,i=Math.PI/3,s=0,o=2){super(t,e),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(pe.DEFAULT_UP),this.updateMatrix(),this.target=new pe,this.distance=n,this.angle=i,this.penumbra=s,this.decay=o,this.map=null,this.shadow=new ux}get power(){return this.intensity*Math.PI}set power(t){this.intensity=t/Math.PI}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.angle=t.angle,this.penumbra=t.penumbra,this.decay=t.decay,this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}const xh=new Bt,Ns=new A,va=new A;class fx extends Vc{constructor(){super(new Xe(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new at(4,2),this._viewportCount=6,this._viewports=[new he(2,1,1,1),new he(0,1,1,1),new he(3,1,1,1),new he(1,1,1,1),new he(3,0,1,1),new he(1,0,1,1)],this._cubeDirections=[new A(1,0,0),new A(-1,0,0),new A(0,0,1),new A(0,0,-1),new A(0,1,0),new A(0,-1,0)],this._cubeUps=[new A(0,1,0),new A(0,1,0),new A(0,1,0),new A(0,1,0),new A(0,0,1),new A(0,0,-1)]}updateMatrices(t,e=0){const n=this.camera,i=this.matrix,s=t.distance||n.far;s!==n.far&&(n.far=s,n.updateProjectionMatrix()),Ns.setFromMatrixPosition(t.matrixWorld),n.position.copy(Ns),va.copy(n.position),va.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(va),n.updateMatrixWorld(),i.makeTranslation(-Ns.x,-Ns.y,-Ns.z),xh.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(xh)}}class px extends Io{constructor(t,e,n=0,i=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new fx}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class mx extends Vc{constructor(){super(new Ic(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Vu extends Io{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(pe.DEFAULT_UP),this.updateMatrix(),this.target=new pe,this.shadow=new mx}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class qs{static decodeText(t){if(console.warn("THREE.LoaderUtils: decodeText() has been deprecated with r165 and will be removed with r175. Use TextDecoder instead."),typeof TextDecoder<"u")return new TextDecoder().decode(t);let e="";for(let n=0,i=t.length;n<i;n++)e+=String.fromCharCode(t[n]);try{return decodeURIComponent(escape(e))}catch{return e}}static extractUrlBase(t){const e=t.lastIndexOf("/");return e===-1?"./":t.slice(0,e+1)}static resolveURL(t,e){return typeof t!="string"||t===""?"":(/^https?:\/\//i.test(e)&&/^\//.test(t)&&(e=e.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(t)||/^data:.*,.*$/i.test(t)||/^blob:.*$/i.test(t)?t:e+t)}}class gx extends ws{constructor(t){super(t),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"}}setOptions(t){return this.options=t,this}load(t,e,n,i){t===void 0&&(t=""),this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const s=this,o=ci.get(t);if(o!==void 0){if(s.manager.itemStart(t),o.then){o.then(l=>{e&&e(l),s.manager.itemEnd(t)}).catch(l=>{i&&i(l)});return}return setTimeout(function(){e&&e(o),s.manager.itemEnd(t)},0),o}const a={};a.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",a.headers=this.requestHeader;const c=fetch(t,a).then(function(l){return l.blob()}).then(function(l){return createImageBitmap(l,Object.assign(s.options,{colorSpaceConversion:"none"}))}).then(function(l){return ci.add(t,l),e&&e(l),s.manager.itemEnd(t),l}).catch(function(l){i&&i(l),ci.remove(t),s.manager.itemError(t),s.manager.itemEnd(t)});ci.add(t,c),s.manager.itemStart(t)}}class _x{constructor(t,e,n){this.binding=t,this.valueSize=n;let i,s,o;switch(e){case"quaternion":i=this._slerp,s=this._slerpAdditive,o=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(n*6),this._workIndex=5;break;case"string":case"bool":i=this._select,s=this._select,o=this._setAdditiveIdentityOther,this.buffer=new Array(n*5);break;default:i=this._lerp,s=this._lerpAdditive,o=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(n*5)}this._mixBufferRegion=i,this._mixBufferRegionAdditive=s,this._setIdentity=o,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(t,e){const n=this.buffer,i=this.valueSize,s=t*i+i;let o=this.cumulativeWeight;if(o===0){for(let a=0;a!==i;++a)n[s+a]=n[a];o=e}else{o+=e;const a=e/o;this._mixBufferRegion(n,s,0,a,i)}this.cumulativeWeight=o}accumulateAdditive(t){const e=this.buffer,n=this.valueSize,i=n*this._addIndex;this.cumulativeWeightAdditive===0&&this._setIdentity(),this._mixBufferRegionAdditive(e,i,0,t,n),this.cumulativeWeightAdditive+=t}apply(t){const e=this.valueSize,n=this.buffer,i=t*e+e,s=this.cumulativeWeight,o=this.cumulativeWeightAdditive,a=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,s<1){const c=e*this._origIndex;this._mixBufferRegion(n,i,c,1-s,e)}o>0&&this._mixBufferRegionAdditive(n,i,this._addIndex*e,1,e);for(let c=e,l=e+e;c!==l;++c)if(n[c]!==n[c+e]){a.setValue(n,i);break}}saveOriginalState(){const t=this.binding,e=this.buffer,n=this.valueSize,i=n*this._origIndex;t.getValue(e,i);for(let s=n,o=i;s!==o;++s)e[s]=e[i+s%n];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){const t=this.valueSize*3;this.binding.setValue(this.buffer,t)}_setAdditiveIdentityNumeric(){const t=this._addIndex*this.valueSize,e=t+this.valueSize;for(let n=t;n<e;n++)this.buffer[n]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){const t=this._origIndex*this.valueSize,e=this._addIndex*this.valueSize;for(let n=0;n<this.valueSize;n++)this.buffer[e+n]=this.buffer[t+n]}_select(t,e,n,i,s){if(i>=.5)for(let o=0;o!==s;++o)t[e+o]=t[n+o]}_slerp(t,e,n,i){xe.slerpFlat(t,e,t,e,t,n,i)}_slerpAdditive(t,e,n,i,s){const o=this._workIndex*s;xe.multiplyQuaternionsFlat(t,o,t,e,t,n),xe.slerpFlat(t,e,t,e,t,o,i)}_lerp(t,e,n,i,s){const o=1-i;for(let a=0;a!==s;++a){const c=e+a;t[c]=t[c]*o+t[n+a]*i}}_lerpAdditive(t,e,n,i,s){for(let o=0;o!==s;++o){const a=e+o;t[a]=t[a]+t[n+o]*i}}}const Gc="\\[\\]\\.:\\/",xx=new RegExp("["+Gc+"]","g"),Wc="[^"+Gc+"]",vx="[^"+Gc.replace("\\.","")+"]",yx=/((?:WC+[\/:])*)/.source.replace("WC",Wc),Mx=/(WCOD+)?/.source.replace("WCOD",vx),Sx=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Wc),bx=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Wc),wx=new RegExp("^"+yx+Mx+Sx+bx+"$"),Tx=["material","materials","bones","map"];class Ax{constructor(t,e,n){const i=n||ae.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,i)}getValue(t,e){this.bind();const n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(t,e)}setValue(t,e){const n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,s=n.length;i!==s;++i)n[i].setValue(t,e)}bind(){const t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){const t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}}class ae{constructor(t,e,n){this.path=e,this.parsedPath=n||ae.parseTrackName(e),this.node=ae.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new ae.Composite(t,e,n):new ae(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(xx,"")}static parseTrackName(t){const e=wx.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);const n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){const s=n.nodeName.substring(i+1);Tx.indexOf(s)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=s)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){const n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){const n=function(s){for(let o=0;o<s.length;o++){const a=s[o];if(a.name===e||a.uuid===e)return a;const c=n(a.children);if(c)return c}return null},i=n(t.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)t[e++]=n[i]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++]}_setValue_array_setNeedsUpdate(t,e){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node;const e=this.parsedPath,n=e.objectName,i=e.propertyName;let s=e.propertyIndex;if(t||(t=ae.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=e.objectIndex;switch(n){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===l){l=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(l!==void 0){if(t[l]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[l]}}const o=t[i];if(o===void 0){const l=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+l+"."+i+" but it wasn't found.",t);return}let a=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(s!==void 0){if(i==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[s]!==void 0&&(s=t.morphTargetDictionary[s])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=s}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}ae.Composite=Ax;ae.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ae.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ae.prototype.GetterByBindingType=[ae.prototype._getValue_direct,ae.prototype._getValue_array,ae.prototype._getValue_arrayElement,ae.prototype._getValue_toArray];ae.prototype.SetterByBindingTypeAndVersioning=[[ae.prototype._setValue_direct,ae.prototype._setValue_direct_setNeedsUpdate,ae.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ae.prototype._setValue_array,ae.prototype._setValue_array_setNeedsUpdate,ae.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ae.prototype._setValue_arrayElement,ae.prototype._setValue_arrayElement_setNeedsUpdate,ae.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ae.prototype._setValue_fromArray,ae.prototype._setValue_fromArray_setNeedsUpdate,ae.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];class Ex{constructor(t,e,n=null,i=e.blendMode){this._mixer=t,this._clip=e,this._localRoot=n,this.blendMode=i;const s=e.tracks,o=s.length,a=new Array(o),c={endingStart:ss,endingEnd:ss};for(let l=0;l!==o;++l){const h=s[l].createInterpolant(null);a[l]=h,h.settings=c}this._interpolantSettings=c,this._interpolants=a,this._propertyBindings=new Array(o),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._weightInterpolant=null,this.loop=ac,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(t){return this._startTime=t,this}setLoop(t,e){return this.loop=t,this.repetitions=e,this}setEffectiveWeight(t){return this.weight=t,this._effectiveWeight=this.enabled?t:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(t){return this._scheduleFading(t,0,1)}fadeOut(t){return this._scheduleFading(t,1,0)}crossFadeFrom(t,e,n){if(t.fadeOut(e),this.fadeIn(e),n){const i=this._clip.duration,s=t._clip.duration,o=s/i,a=i/s;t.warp(1,o,e),this.warp(a,1,e)}return this}crossFadeTo(t,e,n){return t.crossFadeFrom(this,e,n)}stopFading(){const t=this._weightInterpolant;return t!==null&&(this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(t)),this}setEffectiveTimeScale(t){return this.timeScale=t,this._effectiveTimeScale=this.paused?0:t,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(t){return this.timeScale=this._clip.duration/t,this.stopWarping()}syncWith(t){return this.time=t.time,this.timeScale=t.timeScale,this.stopWarping()}halt(t){return this.warp(this._effectiveTimeScale,0,t)}warp(t,e,n){const i=this._mixer,s=i.time,o=this.timeScale;let a=this._timeScaleInterpolant;a===null&&(a=i._lendControlInterpolant(),this._timeScaleInterpolant=a);const c=a.parameterPositions,l=a.sampleValues;return c[0]=s,c[1]=s+n,l[0]=t/o,l[1]=e/o,this}stopWarping(){const t=this._timeScaleInterpolant;return t!==null&&(this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(t)),this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(t,e,n,i){if(!this.enabled){this._updateWeight(t);return}const s=this._startTime;if(s!==null){const c=(t-s)*n;c<0||n===0?e=0:(this._startTime=null,e=n*c)}e*=this._updateTimeScale(t);const o=this._updateTime(e),a=this._updateWeight(t);if(a>0){const c=this._interpolants,l=this._propertyBindings;switch(this.blendMode){case Yd:for(let h=0,u=c.length;h!==u;++h)c[h].evaluate(o),l[h].accumulateAdditive(a);break;case Ec:default:for(let h=0,u=c.length;h!==u;++h)c[h].evaluate(o),l[h].accumulate(i,a)}}}_updateWeight(t){let e=0;if(this.enabled){e=this.weight;const n=this._weightInterpolant;if(n!==null){const i=n.evaluate(t)[0];e*=i,t>n.parameterPositions[1]&&(this.stopFading(),i===0&&(this.enabled=!1))}}return this._effectiveWeight=e,e}_updateTimeScale(t){let e=0;if(!this.paused){e=this.timeScale;const n=this._timeScaleInterpolant;if(n!==null){const i=n.evaluate(t)[0];e*=i,t>n.parameterPositions[1]&&(this.stopWarping(),e===0?this.paused=!0:this.timeScale=e)}}return this._effectiveTimeScale=e,e}_updateTime(t){const e=this._clip.duration,n=this.loop;let i=this.time+t,s=this._loopCount;const o=n===qd;if(t===0)return s===-1?i:o&&(s&1)===1?e-i:i;if(n===cu){s===-1&&(this._loopCount=0,this._setEndings(!0,!0,!1));t:{if(i>=e)i=e;else if(i<0)i=0;else{this.time=i;break t}this.clampWhenFinished?this.paused=!0:this.enabled=!1,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:t<0?-1:1})}}else{if(s===-1&&(t>=0?(s=0,this._setEndings(!0,this.repetitions===0,o)):this._setEndings(this.repetitions===0,!0,o)),i>=e||i<0){const a=Math.floor(i/e);i-=e*a,s+=Math.abs(a);const c=this.repetitions-s;if(c<=0)this.clampWhenFinished?this.paused=!0:this.enabled=!1,i=t>0?e:0,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:t>0?1:-1});else{if(c===1){const l=t<0;this._setEndings(l,!l,o)}else this._setEndings(!1,!1,o);this._loopCount=s,this.time=i,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:a})}}else this.time=i;if(o&&(s&1)===1)return e-i}return i}_setEndings(t,e,n){const i=this._interpolantSettings;n?(i.endingStart=rs,i.endingEnd=rs):(t?i.endingStart=this.zeroSlopeAtStart?rs:ss:i.endingStart=co,e?i.endingEnd=this.zeroSlopeAtEnd?rs:ss:i.endingEnd=co)}_scheduleFading(t,e,n){const i=this._mixer,s=i.time;let o=this._weightInterpolant;o===null&&(o=i._lendControlInterpolant(),this._weightInterpolant=o);const a=o.parameterPositions,c=o.sampleValues;return a[0]=s,c[0]=e,a[1]=s+t,c[1]=n,this}}const Rx=new Float32Array(1);class Cx extends Pi{constructor(t){super(),this._root=t,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1}_bindAction(t,e){const n=t._localRoot||this._root,i=t._clip.tracks,s=i.length,o=t._propertyBindings,a=t._interpolants,c=n.uuid,l=this._bindingsByRootAndName;let h=l[c];h===void 0&&(h={},l[c]=h);for(let u=0;u!==s;++u){const d=i[u],f=d.name;let g=h[f];if(g!==void 0)++g.referenceCount,o[u]=g;else{if(g=o[u],g!==void 0){g._cacheIndex===null&&(++g.referenceCount,this._addInactiveBinding(g,c,f));continue}const _=e&&e._propertyBindings[u].binding.parsedPath;g=new _x(ae.create(n,f,_),d.ValueTypeName,d.getValueSize()),++g.referenceCount,this._addInactiveBinding(g,c,f),o[u]=g}a[u].resultBuffer=g.buffer}}_activateAction(t){if(!this._isActiveAction(t)){if(t._cacheIndex===null){const n=(t._localRoot||this._root).uuid,i=t._clip.uuid,s=this._actionsByClip[i];this._bindAction(t,s&&s.knownActions[0]),this._addInactiveAction(t,i,n)}const e=t._propertyBindings;for(let n=0,i=e.length;n!==i;++n){const s=e[n];s.useCount++===0&&(this._lendBinding(s),s.saveOriginalState())}this._lendAction(t)}}_deactivateAction(t){if(this._isActiveAction(t)){const e=t._propertyBindings;for(let n=0,i=e.length;n!==i;++n){const s=e[n];--s.useCount===0&&(s.restoreOriginalState(),this._takeBackBinding(s))}this._takeBackAction(t)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;const t=this;this.stats={actions:{get total(){return t._actions.length},get inUse(){return t._nActiveActions}},bindings:{get total(){return t._bindings.length},get inUse(){return t._nActiveBindings}},controlInterpolants:{get total(){return t._controlInterpolants.length},get inUse(){return t._nActiveControlInterpolants}}}}_isActiveAction(t){const e=t._cacheIndex;return e!==null&&e<this._nActiveActions}_addInactiveAction(t,e,n){const i=this._actions,s=this._actionsByClip;let o=s[e];if(o===void 0)o={knownActions:[t],actionByRoot:{}},t._byClipCacheIndex=0,s[e]=o;else{const a=o.knownActions;t._byClipCacheIndex=a.length,a.push(t)}t._cacheIndex=i.length,i.push(t),o.actionByRoot[n]=t}_removeInactiveAction(t){const e=this._actions,n=e[e.length-1],i=t._cacheIndex;n._cacheIndex=i,e[i]=n,e.pop(),t._cacheIndex=null;const s=t._clip.uuid,o=this._actionsByClip,a=o[s],c=a.knownActions,l=c[c.length-1],h=t._byClipCacheIndex;l._byClipCacheIndex=h,c[h]=l,c.pop(),t._byClipCacheIndex=null;const u=a.actionByRoot,d=(t._localRoot||this._root).uuid;delete u[d],c.length===0&&delete o[s],this._removeInactiveBindingsForAction(t)}_removeInactiveBindingsForAction(t){const e=t._propertyBindings;for(let n=0,i=e.length;n!==i;++n){const s=e[n];--s.referenceCount===0&&this._removeInactiveBinding(s)}}_lendAction(t){const e=this._actions,n=t._cacheIndex,i=this._nActiveActions++,s=e[i];t._cacheIndex=i,e[i]=t,s._cacheIndex=n,e[n]=s}_takeBackAction(t){const e=this._actions,n=t._cacheIndex,i=--this._nActiveActions,s=e[i];t._cacheIndex=i,e[i]=t,s._cacheIndex=n,e[n]=s}_addInactiveBinding(t,e,n){const i=this._bindingsByRootAndName,s=this._bindings;let o=i[e];o===void 0&&(o={},i[e]=o),o[n]=t,t._cacheIndex=s.length,s.push(t)}_removeInactiveBinding(t){const e=this._bindings,n=t.binding,i=n.rootNode.uuid,s=n.path,o=this._bindingsByRootAndName,a=o[i],c=e[e.length-1],l=t._cacheIndex;c._cacheIndex=l,e[l]=c,e.pop(),delete a[s],Object.keys(a).length===0&&delete o[i]}_lendBinding(t){const e=this._bindings,n=t._cacheIndex,i=this._nActiveBindings++,s=e[i];t._cacheIndex=i,e[i]=t,s._cacheIndex=n,e[n]=s}_takeBackBinding(t){const e=this._bindings,n=t._cacheIndex,i=--this._nActiveBindings,s=e[i];t._cacheIndex=i,e[i]=t,s._cacheIndex=n,e[n]=s}_lendControlInterpolant(){const t=this._controlInterpolants,e=this._nActiveControlInterpolants++;let n=t[e];return n===void 0&&(n=new Bu(new Float32Array(2),new Float32Array(2),1,Rx),n.__cacheIndex=e,t[e]=n),n}_takeBackControlInterpolant(t){const e=this._controlInterpolants,n=t.__cacheIndex,i=--this._nActiveControlInterpolants,s=e[i];t.__cacheIndex=i,e[i]=t,s.__cacheIndex=n,e[n]=s}clipAction(t,e,n){const i=e||this._root,s=i.uuid;let o=typeof t=="string"?xo.findByName(i,t):t;const a=o!==null?o.uuid:t,c=this._actionsByClip[a];let l=null;if(n===void 0&&(o!==null?n=o.blendMode:n=Ec),c!==void 0){const u=c.actionByRoot[s];if(u!==void 0&&u.blendMode===n)return u;l=c.knownActions[0],o===null&&(o=l._clip)}if(o===null)return null;const h=new Ex(this,o,e,n);return this._bindAction(h,l),this._addInactiveAction(h,a,s),h}existingAction(t,e){const n=e||this._root,i=n.uuid,s=typeof t=="string"?xo.findByName(n,t):t,o=s?s.uuid:t,a=this._actionsByClip[o];return a!==void 0&&a.actionByRoot[i]||null}stopAllAction(){const t=this._actions,e=this._nActiveActions;for(let n=e-1;n>=0;--n)t[n].stop();return this}update(t){t*=this.timeScale;const e=this._actions,n=this._nActiveActions,i=this.time+=t,s=Math.sign(t),o=this._accuIndex^=1;for(let l=0;l!==n;++l)e[l]._update(i,t,s,o);const a=this._bindings,c=this._nActiveBindings;for(let l=0;l!==c;++l)a[l].apply(o);return this}setTime(t){this.time=0;for(let e=0;e<this._actions.length;e++)this._actions[e].time=0;return this.update(t)}getRoot(){return this._root}uncacheClip(t){const e=this._actions,n=t.uuid,i=this._actionsByClip,s=i[n];if(s!==void 0){const o=s.knownActions;for(let a=0,c=o.length;a!==c;++a){const l=o[a];this._deactivateAction(l);const h=l._cacheIndex,u=e[e.length-1];l._cacheIndex=null,l._byClipCacheIndex=null,u._cacheIndex=h,e[h]=u,e.pop(),this._removeInactiveBindingsForAction(l)}delete i[n]}}uncacheRoot(t){const e=t.uuid,n=this._actionsByClip;for(const o in n){const a=n[o].actionByRoot,c=a[e];c!==void 0&&(this._deactivateAction(c),this._removeInactiveAction(c))}const i=this._bindingsByRootAndName,s=i[e];if(s!==void 0)for(const o in s){const a=s[o];a.restoreOriginalState(),this._removeInactiveBinding(a)}}uncacheAction(t,e){const n=this.existingAction(t,e);n!==null&&(this._deactivateAction(n),this._removeInactiveAction(n))}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:xc}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=xc);const Jt={ready:!1,fps:30,unitHeight:29,bones:[],skeleton:{},clips:{},rootXZ:{},impacts:{},duration:{}};function Lx(r,t){const e=atob(r),n=new ArrayBuffer(e.length),i=new Uint8Array(n);for(let a=0;a<e.length;a++)i[a]=e.charCodeAt(a);const s=new Int16Array(n,0,t),o=new Float32Array(t);for(let a=0;a<t;a++)o[a]=s[a]/32767;return o}async function Px(r){const t=await fetch(r);if(!t.ok)throw new Error("anims.json failed to load: "+t.status);const e=await t.json();Jt.fps=e.fps,Jt.unitHeight=e.unitHeight,Jt.bones=e.bones,Jt.skeleton=e.skeleton;const n=e.bones.length;for(const[i,s]of Object.entries(e.clips)){const o=s.frames,a=new Float32Array(o);for(let u=0;u<o;u++)a[u]=u/e.fps;const c=Lx(s.quat,o*n*4),l=[];for(let u=0;u<n;u++){const d=new Float32Array(o*4);for(let f=0;f<o;f++){const g=(f*n+u)*4;d[f*4]=c[g],d[f*4+1]=c[g+1],d[f*4+2]=c[g+2],d[f*4+3]=c[g+3]}l.push(new Ci(e.bones[u]+".quaternion",a,d))}const h=new Float32Array(o*3);for(let u=0;u<o;u++)h[u*3]=0,h[u*3+1]=s.rootY[u],h[u*3+2]=0;l.push(new Li("mixamorigHips.position",a,h)),Jt.clips[i]=new xo(i,s.duration,l),Jt.rootXZ[i]=Float32Array.from(s.rootXZ),Jt.impacts[i]=s.impacts||[],Jt.duration[i]=s.duration}return Jt.ready=!0,Jt}const Gu=typeof location>"u"||!/[?&]toon=0\b|original/.test(location.search+location.hash),wi={bands:[.22,.62,1],inkColor:1315356,inkHeroPx:3,inkWorldPx:1.2,inkWorld:.05,inkFarGain:.012,inkFarMax:2.6};let Vr=null;const ya=new Map,Ix=[.62,1];function Wu(r=null){if(r){const t=r.join(",");return ya.has(t)||ya.set(t,vh(r)),ya.get(t)}return Vr||(Vr=vh(wi.bands),Vr)}function vh(r){const t=r.length,e=new Uint8Array(t*4);r.forEach((i,s)=>{const o=Math.round(i*255);e.set([o,o,o,255],s*4)});const n=new Nc(e,t,1,en);return n.minFilter=n.magFilter=He,n.generateMipmaps=!1,n.needsUpdate=!0,n}const yh=new Map;function fc(r){if(!r)return r;if(Array.isArray(r))return r.map(fc);if(r.isMeshToonMaterial||!(r.isMeshLambertMaterial||r.isMeshStandardMaterial||r.isMeshPhongMaterial))return r;let t=yh.get(r);return t||(t=new Ou({color:r.color,map:r.map,vertexColors:r.vertexColors,emissive:r.emissive,emissiveMap:r.emissiveMap,emissiveIntensity:r.emissiveIntensity,transparent:r.transparent,opacity:r.opacity,side:r.side,fog:r.fog,depthWrite:r.depthWrite,alphaTest:r.alphaTest,gradientMap:Wu()}),t.name=r.name,r.flatShading&&(t.flatShading=!0),t.userData={...r.userData,toonFrom:r.type},yh.set(r,t),t.color=r.color,r.emissive&&(t.emissive=r.emissive),Object.defineProperty(r,"__toon",{value:t}),t)}function Dx(r){if(r.attributes.outlineNormal)return r.attributes.outlineNormal;const t=r.attributes.position,e=r.attributes.normal,n=new Float32Array(t.count*3);if(!e)return r.setAttribute("outlineNormal",new ue(n,3)),r.attributes.outlineNormal;const i=a=>`${Math.round(t.getX(a)*1e3)},${Math.round(t.getY(a)*1e3)},${Math.round(t.getZ(a)*1e3)}`,s=new Map;for(let a=0;a<t.count;a++){const c=i(a);let l=s.get(c);l||s.set(c,l=[0,0,0]),l[0]+=e.getX(a),l[1]+=e.getY(a),l[2]+=e.getZ(a)}r.boundingSphere||r.computeBoundingSphere();const o=Math.max(1e-4,r.boundingSphere.radius*.15);for(let a=0;a<t.count;a++){const c=s.get(i(a)),l=(Math.hypot(c[0],c[1],c[2])||1)/o;n[a*3]=c[0]/l,n[a*3+1]=c[1]/l,n[a*3+2]=c[2]/l}return r.setAttribute("outlineNormal",new ue(n,3)),r.attributes.outlineNormal}const pc=new Map,Xu={uPxToWorld:{value:.0015}};function Ux(r,{width:t,px:e,push:n}){const i=`${r}|${t}|${e}|${n}`;let s=pc.get(i);return s||(s=new ke({color:wi.inkColor,side:Ve,fog:!0}),s.userData.isOutline=!0,s.onBeforeCompile=o=>{o.uniforms.uInk={value:t},o.uniforms.uInkPx={value:e},o.uniforms.uPush={value:n},o.uniforms.uFarGain={value:wi.inkFarGain},o.uniforms.uFarMax={value:wi.inkFarMax},o.uniforms.uPxToWorld=Xu.uPxToWorld,o.vertexShader=o.vertexShader.replace("#include <common>",`#include <common>
attribute vec3 outlineNormal;
uniform float uInk, uInkPx, uPush, uFarGain, uFarMax, uPxToWorld;`).replace("#include <begin_vertex>",`#include <begin_vertex>
        // undo the object's scale so a 1/28-scaled Mixamo hero and a 1:1
        // building get the same ink weight
        float sx = length(modelMatrix[0].xyz);
        float sy = length(modelMatrix[1].xyz);
        float sz = length(modelMatrix[2].xyz);
        float objScale = (sx + sy + sz) / 3.0;
        float dist = -(modelViewMatrix * vec4(position, 1.0)).z;
        float wWorld = uInk * clamp(1.0 + dist * uFarGain, 1.0, uFarMax);
        float wPx = uInkPx * uPxToWorld * dist; // constant on-screen width
        float cap = length(outlineNormal);
        transformed += (outlineNormal / max(cap, 1e-6)) * min(max(wWorld, wPx) / objScale, cap);`).replace("#include <project_vertex>",`#include <project_vertex>
        mvPosition.z -= uPush;
        gl_Position = projectionMatrix * mvPosition;`)},s.customProgramCacheKey=()=>"toon-outline-3",pc.set(i,s),s)}function Nx(r,t){if(r.userData.noOutline||r.isInstancedMesh||r.isPoints||r.isSprite||r.isLine)return!1;const e=Array.isArray(t)?t[0]:t;if(!e||!e.isMeshToonMaterial||e.transparent&&e.opacity<.95)return!1;const n=r.geometry;return!(!n||!n.attributes.position||n.attributes.position.count<=4)}function kx(r){const t=r.geometry;Dx(t);const e=r.isSkinnedMesh||r.userData.hero,n=Ux(!!r.isSkinnedMesh,e?{width:0,px:wi.inkHeroPx,push:.05}:{width:wi.inkWorld,px:wi.inkWorldPx,push:.02});let i;r.isSkinnedMesh?(i=new Eo(t,n),i.bind(r.skeleton,r.bindMatrix),i.bindMode=r.bindMode):i=new jt(t,n),i.userData.toonDone=!0,i.userData.isOutline=!0,i.castShadow=!1,i.receiveShadow=!1,i.frustumCulled=r.frustumCulled,i.renderOrder=r.renderOrder,i.onBeforeRender=()=>{},r.add(i),r.userData.outline=i}function Ox(r){const t=r.userData.outline;if(!t)return;const e=Array.isArray(r.material)?r.material[0]:r.material;let n=!!(e&&(!e.transparent||e.opacity>=.95)&&e.visible!==!1);if(n&&Vs&&r.isSkinnedMesh)Gr.setFromMatrixPosition(r.matrixWorld),n=Gr.distanceTo(Vs)<Fx;else if(n&&Vs){const i=r.geometry.boundingSphere||(r.geometry.computeBoundingSphere(),r.geometry.boundingSphere);Gr.copy(i.center).applyMatrix4(r.matrixWorld),n=Gr.distanceTo(Vs)-i.radius*r.matrixWorld.getMaxScaleOnAxis()<Bx}t.visible=n}const Gr=new A;let Vs=null;const Fx=55,Bx=80;function zx(r,t,e){if(Gu){if(Vs=t?t.position:null,t&&e){const n=e.domElement.clientHeight||720;Xu.uPxToWorld.value=2*Math.tan(uu.degToRad(t.fov)/2)/n;for(const i of pc.values())i.uniformsNeedUpdate=!0}r.traverse(n=>{if(!(!n.isMesh||n.userData.isOutline))if(!n.userData.toonDone)n.userData.toonDone=!0,n.material=fc(n.material),Nx(n,n.material)&&kx(n);else{const i=n.material,s=Array.isArray(i)?i[0]:i;s&&!s.isMeshToonMaterial&&(s.isMeshLambertMaterial||s.isMeshStandardMaterial)&&(n.material=fc(i)),Ox(n)}})}}function Hx(r,t){Gu&&(t.toneMapping=Gn,r.hemi&&(r.hemi.intensity=1.15,r.hemi.color.set(12899071),r.hemi.groundColor.set(9075896)),r.sun&&(r.sun.intensity=2,r.sun.color.set(16772300)))}const Vx=`
  {
    vec3 vd = normalize(vViewPosition);
    float r = 1.0 - max(dot(normal, vd), 0.0);
    outgoingLight += vec3(1.0, 0.95, 0.85) * smoothstep(0.72, 0.76, r) * RIM_STRENGTH;
  }
  #include <opaque_fragment>`;function Wr(r,t=!1){const e=r[0].index!==null,n=new Set(Object.keys(r[0].attributes)),i=new Set(Object.keys(r[0].morphAttributes)),s={},o={},a=r[0].morphTargetsRelative,c=new Me;let l=0;for(let h=0;h<r.length;++h){const u=r[h];let d=0;if(e!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const f in u.attributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;s[f]===void 0&&(s[f]=[]),s[f].push(u.attributes[f]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(a!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const f in u.morphAttributes){if(!i.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;o[f]===void 0&&(o[f]=[]),o[f].push(u.morphAttributes[f])}if(t){let f;if(e)f=u.index.count;else if(u.attributes.position!==void 0)f=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;c.addGroup(l,f,h),l+=f}}if(e){let h=0;const u=[];for(let d=0;d<r.length;++d){const f=r[d].index;for(let g=0;g<f.count;++g)u.push(f.getX(g)+h);h+=r[d].attributes.position.count}c.setIndex(u)}for(const h in s){const u=Mh(s[h]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;c.setAttribute(h,u)}for(const h in o){const u=o[h][0].length;if(u===0)break;c.morphAttributes=c.morphAttributes||{},c.morphAttributes[h]=[];for(let d=0;d<u;++d){const f=[];for(let _=0;_<o[h].length;++_)f.push(o[h][_][d]);const g=Mh(f);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;c.morphAttributes[h].push(g)}}return c}function Mh(r){let t,e,n,i=-1,s=0;for(let l=0;l<r.length;++l){const h=r[l];if(t===void 0&&(t=h.array.constructor),t!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=h.itemSize),e!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=h.gpuType),i!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=h.count*e}const o=new t(s),a=new ue(o,e,n);let c=0;for(let l=0;l<r.length;++l){const h=r[l];if(h.isInterleavedBufferAttribute){const u=c/e;for(let d=0,f=h.count;d<f;d++)for(let g=0;g<e;g++){const _=h.getComponent(d,g);a.setComponent(d+u,g,_)}}else o.set(h.array,c);c+=h.count*e}return i!==void 0&&(a.gpuType=i),a}function Sh(r,t){if(t===Kd)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),r;if(t===cc||t===lu){let e=r.getIndex();if(e===null){const o=[],a=r.getAttribute("position");if(a!==void 0){for(let c=0;c<a.count;c++)o.push(c);r.setIndex(o),e=r.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),r}const n=e.count-2,i=[];if(t===cc)for(let o=1;o<=n;o++)i.push(e.getX(0)),i.push(e.getX(o)),i.push(e.getX(o+1));else for(let o=0;o<n;o++)o%2===0?(i.push(e.getX(o)),i.push(e.getX(o+1)),i.push(e.getX(o+2))):(i.push(e.getX(o+2)),i.push(e.getX(o+1)),i.push(e.getX(o)));i.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");const s=r.clone();return s.setIndex(i),s.clearGroups(),s}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",t),r}class Gx extends ws{constructor(t){super(t),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(e){return new Kx(e)}),this.register(function(e){return new jx(e)}),this.register(function(e){return new sv(e)}),this.register(function(e){return new rv(e)}),this.register(function(e){return new ov(e)}),this.register(function(e){return new Zx(e)}),this.register(function(e){return new Jx(e)}),this.register(function(e){return new Qx(e)}),this.register(function(e){return new tv(e)}),this.register(function(e){return new Yx(e)}),this.register(function(e){return new ev(e)}),this.register(function(e){return new $x(e)}),this.register(function(e){return new iv(e)}),this.register(function(e){return new nv(e)}),this.register(function(e){return new Xx(e)}),this.register(function(e){return new av(e)}),this.register(function(e){return new cv(e)})}load(t,e,n,i){const s=this;let o;if(this.resourcePath!=="")o=this.resourcePath;else if(this.path!==""){const l=qs.extractUrlBase(t);o=qs.resolveURL(l,this.path)}else o=qs.extractUrlBase(t);this.manager.itemStart(t);const a=function(l){i?i(l):console.error(l),s.manager.itemError(t),s.manager.itemEnd(t)},c=new Hu(this.manager);c.setPath(this.path),c.setResponseType("arraybuffer"),c.setRequestHeader(this.requestHeader),c.setWithCredentials(this.withCredentials),c.load(t,function(l){try{s.parse(l,o,function(h){e(h),s.manager.itemEnd(t)},a)}catch(h){a(h)}},n,a)}setDRACOLoader(t){return this.dracoLoader=t,this}setDDSLoader(){throw new Error('THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".')}setKTX2Loader(t){return this.ktx2Loader=t,this}setMeshoptDecoder(t){return this.meshoptDecoder=t,this}register(t){return this.pluginCallbacks.indexOf(t)===-1&&this.pluginCallbacks.push(t),this}unregister(t){return this.pluginCallbacks.indexOf(t)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(t),1),this}parse(t,e,n,i){let s;const o={},a={},c=new TextDecoder;if(typeof t=="string")s=JSON.parse(t);else if(t instanceof ArrayBuffer)if(c.decode(new Uint8Array(t,0,4))===qu){try{o[Kt.KHR_BINARY_GLTF]=new lv(t)}catch(u){i&&i(u);return}s=JSON.parse(o[Kt.KHR_BINARY_GLTF].content)}else s=JSON.parse(c.decode(t));else s=t;if(s.asset===void 0||s.asset.version[0]<2){i&&i(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const l=new Sv(s,{path:e||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});l.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){const u=this.pluginCallbacks[h](l);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),a[u.name]=u,o[u.name]=!0}if(s.extensionsUsed)for(let h=0;h<s.extensionsUsed.length;++h){const u=s.extensionsUsed[h],d=s.extensionsRequired||[];switch(u){case Kt.KHR_MATERIALS_UNLIT:o[u]=new qx;break;case Kt.KHR_DRACO_MESH_COMPRESSION:o[u]=new hv(s,this.dracoLoader);break;case Kt.KHR_TEXTURE_TRANSFORM:o[u]=new uv;break;case Kt.KHR_MESH_QUANTIZATION:o[u]=new dv;break;default:d.indexOf(u)>=0&&a[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}l.setExtensions(o),l.setPlugins(a),l.parse(n,i)}parseAsync(t,e){const n=this;return new Promise(function(i,s){n.parse(t,e,i,s)})}}function Wx(){let r={};return{get:function(t){return r[t]},add:function(t,e){r[t]=e},remove:function(t){delete r[t]},removeAll:function(){r={}}}}const Kt={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class Xx{constructor(t){this.parser=t,this.name=Kt.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const t=this.parser,e=this.parser.json.nodes||[];for(let n=0,i=e.length;n<i;n++){const s=e[n];s.extensions&&s.extensions[this.name]&&s.extensions[this.name].light!==void 0&&t._addNodeRef(this.cache,s.extensions[this.name].light)}}_loadLight(t){const e=this.parser,n="light:"+t;let i=e.cache.get(n);if(i)return i;const s=e.json,c=((s.extensions&&s.extensions[this.name]||{}).lights||[])[t];let l;const h=new nt(16777215);c.color!==void 0&&h.setRGB(c.color[0],c.color[1],c.color[2],Oe);const u=c.range!==void 0?c.range:0;switch(c.type){case"directional":l=new Vu(h),l.target.position.set(0,0,-1),l.add(l.target);break;case"point":l=new px(h),l.distance=u;break;case"spot":l=new dx(h),l.distance=u,c.spot=c.spot||{},c.spot.innerConeAngle=c.spot.innerConeAngle!==void 0?c.spot.innerConeAngle:0,c.spot.outerConeAngle=c.spot.outerConeAngle!==void 0?c.spot.outerConeAngle:Math.PI/4,l.angle=c.spot.outerConeAngle,l.penumbra=1-c.spot.innerConeAngle/c.spot.outerConeAngle,l.target.position.set(0,0,-1),l.add(l.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+c.type)}return l.position.set(0,0,0),l.decay=2,Bn(l,c),c.intensity!==void 0&&(l.intensity=c.intensity),l.name=e.createUniqueName(c.name||"light_"+t),i=Promise.resolve(l),e.cache.add(n,i),i}getDependency(t,e){if(t==="light")return this._loadLight(e)}createNodeAttachment(t){const e=this,n=this.parser,s=n.json.nodes[t],a=(s.extensions&&s.extensions[this.name]||{}).light;return a===void 0?null:this._loadLight(a).then(function(c){return n._getNodeRef(e.cache,a,c)})}}class qx{constructor(){this.name=Kt.KHR_MATERIALS_UNLIT}getMaterialType(){return ke}extendParams(t,e,n){const i=[];t.color=new nt(1,1,1),t.opacity=1;const s=e.pbrMetallicRoughness;if(s){if(Array.isArray(s.baseColorFactor)){const o=s.baseColorFactor;t.color.setRGB(o[0],o[1],o[2],Oe),t.opacity=o[3]}s.baseColorTexture!==void 0&&i.push(n.assignTexture(t,"map",s.baseColorTexture,_e))}return Promise.all(i)}}class Yx{constructor(t){this.parser=t,this.name=Kt.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(t,e){const i=this.parser.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=i.extensions[this.name].emissiveStrength;return s!==void 0&&(e.emissiveIntensity=s),Promise.resolve()}}class Kx{constructor(t){this.parser=t,this.name=Kt.KHR_MATERIALS_CLEARCOAT}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:En}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],o=i.extensions[this.name];if(o.clearcoatFactor!==void 0&&(e.clearcoat=o.clearcoatFactor),o.clearcoatTexture!==void 0&&s.push(n.assignTexture(e,"clearcoatMap",o.clearcoatTexture)),o.clearcoatRoughnessFactor!==void 0&&(e.clearcoatRoughness=o.clearcoatRoughnessFactor),o.clearcoatRoughnessTexture!==void 0&&s.push(n.assignTexture(e,"clearcoatRoughnessMap",o.clearcoatRoughnessTexture)),o.clearcoatNormalTexture!==void 0&&(s.push(n.assignTexture(e,"clearcoatNormalMap",o.clearcoatNormalTexture)),o.clearcoatNormalTexture.scale!==void 0)){const a=o.clearcoatNormalTexture.scale;e.clearcoatNormalScale=new at(a,a)}return Promise.all(s)}}class jx{constructor(t){this.parser=t,this.name=Kt.KHR_MATERIALS_DISPERSION}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:En}extendMaterialParams(t,e){const i=this.parser.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=i.extensions[this.name];return e.dispersion=s.dispersion!==void 0?s.dispersion:0,Promise.resolve()}}class $x{constructor(t){this.parser=t,this.name=Kt.KHR_MATERIALS_IRIDESCENCE}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:En}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],o=i.extensions[this.name];return o.iridescenceFactor!==void 0&&(e.iridescence=o.iridescenceFactor),o.iridescenceTexture!==void 0&&s.push(n.assignTexture(e,"iridescenceMap",o.iridescenceTexture)),o.iridescenceIor!==void 0&&(e.iridescenceIOR=o.iridescenceIor),e.iridescenceThicknessRange===void 0&&(e.iridescenceThicknessRange=[100,400]),o.iridescenceThicknessMinimum!==void 0&&(e.iridescenceThicknessRange[0]=o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&(e.iridescenceThicknessRange[1]=o.iridescenceThicknessMaximum),o.iridescenceThicknessTexture!==void 0&&s.push(n.assignTexture(e,"iridescenceThicknessMap",o.iridescenceThicknessTexture)),Promise.all(s)}}class Zx{constructor(t){this.parser=t,this.name=Kt.KHR_MATERIALS_SHEEN}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:En}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[];e.sheenColor=new nt(0,0,0),e.sheenRoughness=0,e.sheen=1;const o=i.extensions[this.name];if(o.sheenColorFactor!==void 0){const a=o.sheenColorFactor;e.sheenColor.setRGB(a[0],a[1],a[2],Oe)}return o.sheenRoughnessFactor!==void 0&&(e.sheenRoughness=o.sheenRoughnessFactor),o.sheenColorTexture!==void 0&&s.push(n.assignTexture(e,"sheenColorMap",o.sheenColorTexture,_e)),o.sheenRoughnessTexture!==void 0&&s.push(n.assignTexture(e,"sheenRoughnessMap",o.sheenRoughnessTexture)),Promise.all(s)}}class Jx{constructor(t){this.parser=t,this.name=Kt.KHR_MATERIALS_TRANSMISSION}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:En}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],o=i.extensions[this.name];return o.transmissionFactor!==void 0&&(e.transmission=o.transmissionFactor),o.transmissionTexture!==void 0&&s.push(n.assignTexture(e,"transmissionMap",o.transmissionTexture)),Promise.all(s)}}class Qx{constructor(t){this.parser=t,this.name=Kt.KHR_MATERIALS_VOLUME}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:En}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],o=i.extensions[this.name];e.thickness=o.thicknessFactor!==void 0?o.thicknessFactor:0,o.thicknessTexture!==void 0&&s.push(n.assignTexture(e,"thicknessMap",o.thicknessTexture)),e.attenuationDistance=o.attenuationDistance||1/0;const a=o.attenuationColor||[1,1,1];return e.attenuationColor=new nt().setRGB(a[0],a[1],a[2],Oe),Promise.all(s)}}class tv{constructor(t){this.parser=t,this.name=Kt.KHR_MATERIALS_IOR}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:En}extendMaterialParams(t,e){const i=this.parser.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=i.extensions[this.name];return e.ior=s.ior!==void 0?s.ior:1.5,Promise.resolve()}}class ev{constructor(t){this.parser=t,this.name=Kt.KHR_MATERIALS_SPECULAR}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:En}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],o=i.extensions[this.name];e.specularIntensity=o.specularFactor!==void 0?o.specularFactor:1,o.specularTexture!==void 0&&s.push(n.assignTexture(e,"specularIntensityMap",o.specularTexture));const a=o.specularColorFactor||[1,1,1];return e.specularColor=new nt().setRGB(a[0],a[1],a[2],Oe),o.specularColorTexture!==void 0&&s.push(n.assignTexture(e,"specularColorMap",o.specularColorTexture,_e)),Promise.all(s)}}class nv{constructor(t){this.parser=t,this.name=Kt.EXT_MATERIALS_BUMP}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:En}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],o=i.extensions[this.name];return e.bumpScale=o.bumpFactor!==void 0?o.bumpFactor:1,o.bumpTexture!==void 0&&s.push(n.assignTexture(e,"bumpMap",o.bumpTexture)),Promise.all(s)}}class iv{constructor(t){this.parser=t,this.name=Kt.KHR_MATERIALS_ANISOTROPY}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:En}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],o=i.extensions[this.name];return o.anisotropyStrength!==void 0&&(e.anisotropy=o.anisotropyStrength),o.anisotropyRotation!==void 0&&(e.anisotropyRotation=o.anisotropyRotation),o.anisotropyTexture!==void 0&&s.push(n.assignTexture(e,"anisotropyMap",o.anisotropyTexture)),Promise.all(s)}}class sv{constructor(t){this.parser=t,this.name=Kt.KHR_TEXTURE_BASISU}loadTexture(t){const e=this.parser,n=e.json,i=n.textures[t];if(!i.extensions||!i.extensions[this.name])return null;const s=i.extensions[this.name],o=e.options.ktx2Loader;if(!o){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return e.loadTextureImage(t,s.source,o)}}class rv{constructor(t){this.parser=t,this.name=Kt.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(t){const e=this.name,n=this.parser,i=n.json,s=i.textures[t];if(!s.extensions||!s.extensions[e])return null;const o=s.extensions[e],a=i.images[o.source];let c=n.textureLoader;if(a.uri){const l=n.options.manager.getHandler(a.uri);l!==null&&(c=l)}return this.detectSupport().then(function(l){if(l)return n.loadTextureImage(t,o.source,c);if(i.extensionsRequired&&i.extensionsRequired.indexOf(e)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return n.loadTexture(t)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(t){const e=new Image;e.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",e.onload=e.onerror=function(){t(e.height===1)}})),this.isSupported}}class ov{constructor(t){this.parser=t,this.name=Kt.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(t){const e=this.name,n=this.parser,i=n.json,s=i.textures[t];if(!s.extensions||!s.extensions[e])return null;const o=s.extensions[e],a=i.images[o.source];let c=n.textureLoader;if(a.uri){const l=n.options.manager.getHandler(a.uri);l!==null&&(c=l)}return this.detectSupport().then(function(l){if(l)return n.loadTextureImage(t,o.source,c);if(i.extensionsRequired&&i.extensionsRequired.indexOf(e)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return n.loadTexture(t)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(t){const e=new Image;e.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",e.onload=e.onerror=function(){t(e.height===1)}})),this.isSupported}}class av{constructor(t){this.name=Kt.EXT_MESHOPT_COMPRESSION,this.parser=t}loadBufferView(t){const e=this.parser.json,n=e.bufferViews[t];if(n.extensions&&n.extensions[this.name]){const i=n.extensions[this.name],s=this.parser.getDependency("buffer",i.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(e.extensionsRequired&&e.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return s.then(function(a){const c=i.byteOffset||0,l=i.byteLength||0,h=i.count,u=i.byteStride,d=new Uint8Array(a,c,l);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(h,u,d,i.mode,i.filter).then(function(f){return f.buffer}):o.ready.then(function(){const f=new ArrayBuffer(h*u);return o.decodeGltfBuffer(new Uint8Array(f),h,u,d,i.mode,i.filter),f})})}else return null}}class cv{constructor(t){this.name=Kt.EXT_MESH_GPU_INSTANCING,this.parser=t}createNodeMesh(t){const e=this.parser.json,n=e.nodes[t];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;const i=e.meshes[n.mesh];for(const l of i.primitives)if(l.mode!==ln.TRIANGLES&&l.mode!==ln.TRIANGLE_STRIP&&l.mode!==ln.TRIANGLE_FAN&&l.mode!==void 0)return null;const o=n.extensions[this.name].attributes,a=[],c={};for(const l in o)a.push(this.parser.getDependency("accessor",o[l]).then(h=>(c[l]=h,c[l])));return a.length<1?null:(a.push(this.parser.createNodeMesh(t)),Promise.all(a).then(l=>{const h=l.pop(),u=h.isGroup?h.children:[h],d=l[0].count,f=[];for(const g of u){const _=new Bt,p=new A,m=new xe,x=new A(1,1,1),y=new Cu(g.geometry,g.material,d);for(let v=0;v<d;v++)c.TRANSLATION&&p.fromBufferAttribute(c.TRANSLATION,v),c.ROTATION&&m.fromBufferAttribute(c.ROTATION,v),c.SCALE&&x.fromBufferAttribute(c.SCALE,v),y.setMatrixAt(v,_.compose(p,m,x));for(const v in c)if(v==="_COLOR_0"){const R=c[v];y.instanceColor=new uc(R.array,R.itemSize,R.normalized)}else v!=="TRANSLATION"&&v!=="ROTATION"&&v!=="SCALE"&&g.geometry.setAttribute(v,c[v]);pe.prototype.copy.call(y,g),this.parser.assignFinalMaterial(y),f.push(y)}return h.isGroup?(h.clear(),h.add(...f),h):f[0]}))}}const qu="glTF",ks=12,bh={JSON:1313821514,BIN:5130562};class lv{constructor(t){this.name=Kt.KHR_BINARY_GLTF,this.content=null,this.body=null;const e=new DataView(t,0,ks),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(t.slice(0,4))),version:e.getUint32(4,!0),length:e.getUint32(8,!0)},this.header.magic!==qu)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const i=this.header.length-ks,s=new DataView(t,ks);let o=0;for(;o<i;){const a=s.getUint32(o,!0);o+=4;const c=s.getUint32(o,!0);if(o+=4,c===bh.JSON){const l=new Uint8Array(t,ks+o,a);this.content=n.decode(l)}else if(c===bh.BIN){const l=ks+o;this.body=t.slice(l,l+a)}o+=a}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class hv{constructor(t,e){if(!e)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Kt.KHR_DRACO_MESH_COMPRESSION,this.json=t,this.dracoLoader=e,this.dracoLoader.preload()}decodePrimitive(t,e){const n=this.json,i=this.dracoLoader,s=t.extensions[this.name].bufferView,o=t.extensions[this.name].attributes,a={},c={},l={};for(const h in o){const u=mc[h]||h.toLowerCase();a[u]=o[h]}for(const h in t.attributes){const u=mc[h]||h.toLowerCase();if(o[h]!==void 0){const d=n.accessors[t.attributes[h]],f=ds[d.componentType];l[u]=f.name,c[u]=d.normalized===!0}}return e.getDependency("bufferView",s).then(function(h){return new Promise(function(u,d){i.decodeDracoFile(h,function(f){for(const g in f.attributes){const _=f.attributes[g],p=c[g];p!==void 0&&(_.normalized=p)}u(f)},a,l,Oe,d)})})}}class uv{constructor(){this.name=Kt.KHR_TEXTURE_TRANSFORM}extendTexture(t,e){return(e.texCoord===void 0||e.texCoord===t.channel)&&e.offset===void 0&&e.rotation===void 0&&e.scale===void 0||(t=t.clone(),e.texCoord!==void 0&&(t.channel=e.texCoord),e.offset!==void 0&&t.offset.fromArray(e.offset),e.rotation!==void 0&&(t.rotation=e.rotation),e.scale!==void 0&&t.repeat.fromArray(e.scale),t.needsUpdate=!0),t}}class dv{constructor(){this.name=Kt.KHR_MESH_QUANTIZATION}}class Yu extends sr{constructor(t,e,n,i){super(t,e,n,i)}copySampleValue_(t){const e=this.resultBuffer,n=this.sampleValues,i=this.valueSize,s=t*i*3+i;for(let o=0;o!==i;o++)e[o]=n[s+o];return e}interpolate_(t,e,n,i){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=a*2,l=a*3,h=i-e,u=(n-e)/h,d=u*u,f=d*u,g=t*l,_=g-l,p=-2*f+3*d,m=f-d,x=1-p,y=m-d+u;for(let v=0;v!==a;v++){const R=o[_+v+a],T=o[_+v+c]*h,b=o[g+v+a],L=o[g+v]*h;s[v]=x*R+y*T+p*b+m*L}return s}}const fv=new xe;class pv extends Yu{interpolate_(t,e,n,i){const s=super.interpolate_(t,e,n,i);return fv.fromArray(s).normalize().toArray(s),s}}const ln={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},ds={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},wh={9728:He,9729:Ke,9984:Jh,9985:Qr,9986:zs,9987:Hn},Th={33071:ai,33648:ao,10497:Ti},Ma={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},mc={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},ni={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},mv={CUBICSPLINE:void 0,LINEAR:$s,STEP:js},Sa={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function gv(r){return r.DefaultMaterial===void 0&&(r.DefaultMaterial=new Po({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Wn})),r.DefaultMaterial}function xi(r,t,e){for(const n in e.extensions)r[n]===void 0&&(t.userData.gltfExtensions=t.userData.gltfExtensions||{},t.userData.gltfExtensions[n]=e.extensions[n])}function Bn(r,t){t.extras!==void 0&&(typeof t.extras=="object"?Object.assign(r.userData,t.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+t.extras))}function _v(r,t,e){let n=!1,i=!1,s=!1;for(let l=0,h=t.length;l<h;l++){const u=t[l];if(u.POSITION!==void 0&&(n=!0),u.NORMAL!==void 0&&(i=!0),u.COLOR_0!==void 0&&(s=!0),n&&i&&s)break}if(!n&&!i&&!s)return Promise.resolve(r);const o=[],a=[],c=[];for(let l=0,h=t.length;l<h;l++){const u=t[l];if(n){const d=u.POSITION!==void 0?e.getDependency("accessor",u.POSITION):r.attributes.position;o.push(d)}if(i){const d=u.NORMAL!==void 0?e.getDependency("accessor",u.NORMAL):r.attributes.normal;a.push(d)}if(s){const d=u.COLOR_0!==void 0?e.getDependency("accessor",u.COLOR_0):r.attributes.color;c.push(d)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c)]).then(function(l){const h=l[0],u=l[1],d=l[2];return n&&(r.morphAttributes.position=h),i&&(r.morphAttributes.normal=u),s&&(r.morphAttributes.color=d),r.morphTargetsRelative=!0,r})}function xv(r,t){if(r.updateMorphTargets(),t.weights!==void 0)for(let e=0,n=t.weights.length;e<n;e++)r.morphTargetInfluences[e]=t.weights[e];if(t.extras&&Array.isArray(t.extras.targetNames)){const e=t.extras.targetNames;if(r.morphTargetInfluences.length===e.length){r.morphTargetDictionary={};for(let n=0,i=e.length;n<i;n++)r.morphTargetDictionary[e[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function vv(r){let t;const e=r.extensions&&r.extensions[Kt.KHR_DRACO_MESH_COMPRESSION];if(e?t="draco:"+e.bufferView+":"+e.indices+":"+ba(e.attributes):t=r.indices+":"+ba(r.attributes)+":"+r.mode,r.targets!==void 0)for(let n=0,i=r.targets.length;n<i;n++)t+=":"+ba(r.targets[n]);return t}function ba(r){let t="";const e=Object.keys(r).sort();for(let n=0,i=e.length;n<i;n++)t+=e[n]+":"+r[e[n]]+";";return t}function gc(r){switch(r){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function yv(r){return r.search(/\.jpe?g($|\?)/i)>0||r.search(/^data\:image\/jpeg/)===0?"image/jpeg":r.search(/\.webp($|\?)/i)>0||r.search(/^data\:image\/webp/)===0?"image/webp":"image/png"}const Mv=new Bt;class Sv{constructor(t={},e={}){this.json=t,this.extensions={},this.plugins={},this.options=e,this.cache=new Wx,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,i=-1,s=!1,o=-1;if(typeof navigator<"u"){const a=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(a)===!0;const c=a.match(/Version\/(\d+)/);i=n&&c?parseInt(c[1],10):-1,s=a.indexOf("Firefox")>-1,o=s?a.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||n&&i<17||s&&o<98?this.textureLoader=new lx(this.options.manager):this.textureLoader=new gx(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Hu(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(t){this.extensions=t}setPlugins(t){this.plugins=t}parse(t,e){const n=this,i=this.json,s=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(o){const a={scene:o[0][i.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:i.asset,parser:n,userData:{}};return xi(s,a,i),Bn(a,i),Promise.all(n._invokeAll(function(c){return c.afterRoot&&c.afterRoot(a)})).then(function(){for(const c of a.scenes)c.updateMatrixWorld();t(a)})}).catch(e)}_markDefs(){const t=this.json.nodes||[],e=this.json.skins||[],n=this.json.meshes||[];for(let i=0,s=e.length;i<s;i++){const o=e[i].joints;for(let a=0,c=o.length;a<c;a++)t[o[a]].isBone=!0}for(let i=0,s=t.length;i<s;i++){const o=t[i];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(n[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(t,e){e!==void 0&&(t.refs[e]===void 0&&(t.refs[e]=t.uses[e]=0),t.refs[e]++)}_getNodeRef(t,e,n){if(t.refs[e]<=1)return n;const i=n.clone(),s=(o,a)=>{const c=this.associations.get(o);c!=null&&this.associations.set(a,c);for(const[l,h]of o.children.entries())s(h,a.children[l])};return s(n,i),i.name+="_instance_"+t.uses[e]++,i}_invokeOne(t){const e=Object.values(this.plugins);e.push(this);for(let n=0;n<e.length;n++){const i=t(e[n]);if(i)return i}return null}_invokeAll(t){const e=Object.values(this.plugins);e.unshift(this);const n=[];for(let i=0;i<e.length;i++){const s=t(e[i]);s&&n.push(s)}return n}getDependency(t,e){const n=t+":"+e;let i=this.cache.get(n);if(!i){switch(t){case"scene":i=this.loadScene(e);break;case"node":i=this._invokeOne(function(s){return s.loadNode&&s.loadNode(e)});break;case"mesh":i=this._invokeOne(function(s){return s.loadMesh&&s.loadMesh(e)});break;case"accessor":i=this.loadAccessor(e);break;case"bufferView":i=this._invokeOne(function(s){return s.loadBufferView&&s.loadBufferView(e)});break;case"buffer":i=this.loadBuffer(e);break;case"material":i=this._invokeOne(function(s){return s.loadMaterial&&s.loadMaterial(e)});break;case"texture":i=this._invokeOne(function(s){return s.loadTexture&&s.loadTexture(e)});break;case"skin":i=this.loadSkin(e);break;case"animation":i=this._invokeOne(function(s){return s.loadAnimation&&s.loadAnimation(e)});break;case"camera":i=this.loadCamera(e);break;default:if(i=this._invokeOne(function(s){return s!=this&&s.getDependency&&s.getDependency(t,e)}),!i)throw new Error("Unknown type: "+t);break}this.cache.add(n,i)}return i}getDependencies(t){let e=this.cache.get(t);if(!e){const n=this,i=this.json[t+(t==="mesh"?"es":"s")]||[];e=Promise.all(i.map(function(s,o){return n.getDependency(t,o)})),this.cache.add(t,e)}return e}loadBuffer(t){const e=this.json.buffers[t],n=this.fileLoader;if(e.type&&e.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+e.type+" buffer type is not supported.");if(e.uri===void 0&&t===0)return Promise.resolve(this.extensions[Kt.KHR_BINARY_GLTF].body);const i=this.options;return new Promise(function(s,o){n.load(qs.resolveURL(e.uri,i.path),s,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+e.uri+'".'))})})}loadBufferView(t){const e=this.json.bufferViews[t];return this.getDependency("buffer",e.buffer).then(function(n){const i=e.byteLength||0,s=e.byteOffset||0;return n.slice(s,s+i)})}loadAccessor(t){const e=this,n=this.json,i=this.json.accessors[t];if(i.bufferView===void 0&&i.sparse===void 0){const o=Ma[i.type],a=ds[i.componentType],c=i.normalized===!0,l=new a(i.count*o);return Promise.resolve(new ue(l,o,c))}const s=[];return i.bufferView!==void 0?s.push(this.getDependency("bufferView",i.bufferView)):s.push(null),i.sparse!==void 0&&(s.push(this.getDependency("bufferView",i.sparse.indices.bufferView)),s.push(this.getDependency("bufferView",i.sparse.values.bufferView))),Promise.all(s).then(function(o){const a=o[0],c=Ma[i.type],l=ds[i.componentType],h=l.BYTES_PER_ELEMENT,u=h*c,d=i.byteOffset||0,f=i.bufferView!==void 0?n.bufferViews[i.bufferView].byteStride:void 0,g=i.normalized===!0;let _,p;if(f&&f!==u){const m=Math.floor(d/f),x="InterleavedBuffer:"+i.bufferView+":"+i.componentType+":"+m+":"+i.count;let y=e.cache.get(x);y||(_=new l(a,m*f,i.count*f/h),y=new Eu(_,f/h),e.cache.add(x,y)),p=new Js(y,c,d%f/h,g)}else a===null?_=new l(i.count*c):_=new l(a,d,i.count*c),p=new ue(_,c,g);if(i.sparse!==void 0){const m=Ma.SCALAR,x=ds[i.sparse.indices.componentType],y=i.sparse.indices.byteOffset||0,v=i.sparse.values.byteOffset||0,R=new x(o[1],y,i.sparse.count*m),T=new l(o[2],v,i.sparse.count*c);a!==null&&(p=new ue(p.array.slice(),p.itemSize,p.normalized));for(let b=0,L=R.length;b<L;b++){const w=R[b];if(p.setX(w,T[b*c]),c>=2&&p.setY(w,T[b*c+1]),c>=3&&p.setZ(w,T[b*c+2]),c>=4&&p.setW(w,T[b*c+3]),c>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}}return p})}loadTexture(t){const e=this.json,n=this.options,s=e.textures[t].source,o=e.images[s];let a=this.textureLoader;if(o.uri){const c=n.manager.getHandler(o.uri);c!==null&&(a=c)}return this.loadTextureImage(t,s,a)}loadTextureImage(t,e,n){const i=this,s=this.json,o=s.textures[t],a=s.images[e],c=(a.uri||a.bufferView)+":"+o.sampler;if(this.textureCache[c])return this.textureCache[c];const l=this.loadImageSource(e,n).then(function(h){h.flipY=!1,h.name=o.name||a.name||"",h.name===""&&typeof a.uri=="string"&&a.uri.startsWith("data:image/")===!1&&(h.name=a.uri);const d=(s.samplers||{})[o.sampler]||{};return h.magFilter=wh[d.magFilter]||Ke,h.minFilter=wh[d.minFilter]||Hn,h.wrapS=Th[d.wrapS]||Ti,h.wrapT=Th[d.wrapT]||Ti,i.associations.set(h,{textures:t}),h}).catch(function(){return null});return this.textureCache[c]=l,l}loadImageSource(t,e){const n=this,i=this.json,s=this.options;if(this.sourceCache[t]!==void 0)return this.sourceCache[t].then(u=>u.clone());const o=i.images[t],a=self.URL||self.webkitURL;let c=o.uri||"",l=!1;if(o.bufferView!==void 0)c=n.getDependency("bufferView",o.bufferView).then(function(u){l=!0;const d=new Blob([u],{type:o.mimeType});return c=a.createObjectURL(d),c});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+t+" is missing URI and bufferView");const h=Promise.resolve(c).then(function(u){return new Promise(function(d,f){let g=d;e.isImageBitmapLoader===!0&&(g=function(_){const p=new Ee(_);p.needsUpdate=!0,d(p)}),e.load(qs.resolveURL(u,s.path),g,void 0,f)})}).then(function(u){return l===!0&&a.revokeObjectURL(c),Bn(u,o),u.userData.mimeType=o.mimeType||yv(o.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",c),u});return this.sourceCache[t]=h,h}assignTexture(t,e,n,i){const s=this;return this.getDependency("texture",n.index).then(function(o){if(!o)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(o=o.clone(),o.channel=n.texCoord),s.extensions[Kt.KHR_TEXTURE_TRANSFORM]){const a=n.extensions!==void 0?n.extensions[Kt.KHR_TEXTURE_TRANSFORM]:void 0;if(a){const c=s.associations.get(o);o=s.extensions[Kt.KHR_TEXTURE_TRANSFORM].extendTexture(o,a),s.associations.set(o,c)}}return i!==void 0&&(o.colorSpace=i),t[e]=o,o})}assignFinalMaterial(t){const e=t.geometry;let n=t.material;const i=e.attributes.tangent===void 0,s=e.attributes.color!==void 0,o=e.attributes.normal===void 0;if(t.isPoints){const a="PointsMaterial:"+n.uuid;let c=this.cache.get(a);c||(c=new Pu,nn.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,c.sizeAttenuation=!1,this.cache.add(a,c)),n=c}else if(t.isLine){const a="LineBasicMaterial:"+n.uuid;let c=this.cache.get(a);c||(c=new kc,nn.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,this.cache.add(a,c)),n=c}if(i||s||o){let a="ClonedMaterial:"+n.uuid+":";i&&(a+="derivative-tangents:"),s&&(a+="vertex-colors:"),o&&(a+="flat-shading:");let c=this.cache.get(a);c||(c=n.clone(),s&&(c.vertexColors=!0),o&&(c.flatShading=!0),i&&(c.normalScale&&(c.normalScale.y*=-1),c.clearcoatNormalScale&&(c.clearcoatNormalScale.y*=-1)),this.cache.add(a,c),this.associations.set(c,this.associations.get(n))),n=c}t.material=n}getMaterialType(){return Po}loadMaterial(t){const e=this,n=this.json,i=this.extensions,s=n.materials[t];let o;const a={},c=s.extensions||{},l=[];if(c[Kt.KHR_MATERIALS_UNLIT]){const u=i[Kt.KHR_MATERIALS_UNLIT];o=u.getMaterialType(),l.push(u.extendParams(a,s,e))}else{const u=s.pbrMetallicRoughness||{};if(a.color=new nt(1,1,1),a.opacity=1,Array.isArray(u.baseColorFactor)){const d=u.baseColorFactor;a.color.setRGB(d[0],d[1],d[2],Oe),a.opacity=d[3]}u.baseColorTexture!==void 0&&l.push(e.assignTexture(a,"map",u.baseColorTexture,_e)),a.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,a.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(l.push(e.assignTexture(a,"metalnessMap",u.metallicRoughnessTexture)),l.push(e.assignTexture(a,"roughnessMap",u.metallicRoughnessTexture))),o=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(t)}),l.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(t,a)})))}s.doubleSided===!0&&(a.side=Ye);const h=s.alphaMode||Sa.OPAQUE;if(h===Sa.BLEND?(a.transparent=!0,a.depthWrite=!1):(a.transparent=!1,h===Sa.MASK&&(a.alphaTest=s.alphaCutoff!==void 0?s.alphaCutoff:.5)),s.normalTexture!==void 0&&o!==ke&&(l.push(e.assignTexture(a,"normalMap",s.normalTexture)),a.normalScale=new at(1,1),s.normalTexture.scale!==void 0)){const u=s.normalTexture.scale;a.normalScale.set(u,u)}if(s.occlusionTexture!==void 0&&o!==ke&&(l.push(e.assignTexture(a,"aoMap",s.occlusionTexture)),s.occlusionTexture.strength!==void 0&&(a.aoMapIntensity=s.occlusionTexture.strength)),s.emissiveFactor!==void 0&&o!==ke){const u=s.emissiveFactor;a.emissive=new nt().setRGB(u[0],u[1],u[2],Oe)}return s.emissiveTexture!==void 0&&o!==ke&&l.push(e.assignTexture(a,"emissiveMap",s.emissiveTexture,_e)),Promise.all(l).then(function(){const u=new o(a);return s.name&&(u.name=s.name),Bn(u,s),e.associations.set(u,{materials:t}),s.extensions&&xi(i,u,s),u})}createUniqueName(t){const e=ae.sanitizeNodeName(t||"");return e in this.nodeNamesUsed?e+"_"+ ++this.nodeNamesUsed[e]:(this.nodeNamesUsed[e]=0,e)}loadGeometries(t){const e=this,n=this.extensions,i=this.primitiveCache;function s(a){return n[Kt.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a,e).then(function(c){return Ah(c,a,e)})}const o=[];for(let a=0,c=t.length;a<c;a++){const l=t[a],h=vv(l),u=i[h];if(u)o.push(u.promise);else{let d;l.extensions&&l.extensions[Kt.KHR_DRACO_MESH_COMPRESSION]?d=s(l):d=Ah(new Me,l,e),i[h]={primitive:l,promise:d},o.push(d)}}return Promise.all(o)}loadMesh(t){const e=this,n=this.json,i=this.extensions,s=n.meshes[t],o=s.primitives,a=[];for(let c=0,l=o.length;c<l;c++){const h=o[c].material===void 0?gv(this.cache):this.getDependency("material",o[c].material);a.push(h)}return a.push(e.loadGeometries(o)),Promise.all(a).then(function(c){const l=c.slice(0,c.length-1),h=c[c.length-1],u=[];for(let f=0,g=h.length;f<g;f++){const _=h[f],p=o[f];let m;const x=l[f];if(p.mode===ln.TRIANGLES||p.mode===ln.TRIANGLE_STRIP||p.mode===ln.TRIANGLE_FAN||p.mode===void 0)m=s.isSkinnedMesh===!0?new Eo(_,x):new jt(_,x),m.isSkinnedMesh===!0&&m.normalizeSkinWeights(),p.mode===ln.TRIANGLE_STRIP?m.geometry=Sh(m.geometry,lu):p.mode===ln.TRIANGLE_FAN&&(m.geometry=Sh(m.geometry,cc));else if(p.mode===ln.LINES)m=new Lu(_,x);else if(p.mode===ln.LINE_STRIP)m=new Oc(_,x);else if(p.mode===ln.LINE_LOOP)m=new k_(_,x);else if(p.mode===ln.POINTS)m=new Iu(_,x);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+p.mode);Object.keys(m.geometry.morphAttributes).length>0&&xv(m,s),m.name=e.createUniqueName(s.name||"mesh_"+t),Bn(m,s),p.extensions&&xi(i,m,p),e.assignFinalMaterial(m),u.push(m)}for(let f=0,g=u.length;f<g;f++)e.associations.set(u[f],{meshes:t,primitives:f});if(u.length===1)return s.extensions&&xi(i,u[0],s),u[0];const d=new je;s.extensions&&xi(i,d,s),e.associations.set(d,{meshes:t});for(let f=0,g=u.length;f<g;f++)d.add(u[f]);return d})}loadCamera(t){let e;const n=this.json.cameras[t],i=n[n.type];if(!i){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?e=new Xe(uu.radToDeg(i.yfov),i.aspectRatio||1,i.znear||1,i.zfar||2e6):n.type==="orthographic"&&(e=new Ic(-i.xmag,i.xmag,i.ymag,-i.ymag,i.znear,i.zfar)),n.name&&(e.name=this.createUniqueName(n.name)),Bn(e,n),Promise.resolve(e)}loadSkin(t){const e=this.json.skins[t],n=[];for(let i=0,s=e.joints.length;i<s;i++)n.push(this._loadNodeShallow(e.joints[i]));return e.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",e.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(i){const s=i.pop(),o=i,a=[],c=[];for(let l=0,h=o.length;l<h;l++){const u=o[l];if(u){a.push(u);const d=new Bt;s!==null&&d.fromArray(s.array,l*16),c.push(d)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',e.joints[l])}return new er(a,c)})}loadAnimation(t){const e=this.json,n=this,i=e.animations[t],s=i.name?i.name:"animation_"+t,o=[],a=[],c=[],l=[],h=[];for(let u=0,d=i.channels.length;u<d;u++){const f=i.channels[u],g=i.samplers[f.sampler],_=f.target,p=_.node,m=i.parameters!==void 0?i.parameters[g.input]:g.input,x=i.parameters!==void 0?i.parameters[g.output]:g.output;_.node!==void 0&&(o.push(this.getDependency("node",p)),a.push(this.getDependency("accessor",m)),c.push(this.getDependency("accessor",x)),l.push(g),h.push(_))}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c),Promise.all(l),Promise.all(h)]).then(function(u){const d=u[0],f=u[1],g=u[2],_=u[3],p=u[4],m=[];for(let x=0,y=d.length;x<y;x++){const v=d[x],R=f[x],T=g[x],b=_[x],L=p[x];if(v===void 0)continue;v.updateMatrix&&v.updateMatrix();const w=n._createAnimationTracks(v,R,T,b,L);if(w)for(let S=0;S<w.length;S++)m.push(w[S])}return new xo(s,void 0,m)})}createNodeMesh(t){const e=this.json,n=this,i=e.nodes[t];return i.mesh===void 0?null:n.getDependency("mesh",i.mesh).then(function(s){const o=n._getNodeRef(n.meshCache,i.mesh,s);return i.weights!==void 0&&o.traverse(function(a){if(a.isMesh)for(let c=0,l=i.weights.length;c<l;c++)a.morphTargetInfluences[c]=i.weights[c]}),o})}loadNode(t){const e=this.json,n=this,i=e.nodes[t],s=n._loadNodeShallow(t),o=[],a=i.children||[];for(let l=0,h=a.length;l<h;l++)o.push(n.getDependency("node",a[l]));const c=i.skin===void 0?Promise.resolve(null):n.getDependency("skin",i.skin);return Promise.all([s,Promise.all(o),c]).then(function(l){const h=l[0],u=l[1],d=l[2];d!==null&&h.traverse(function(f){f.isSkinnedMesh&&f.bind(d,Mv)});for(let f=0,g=u.length;f<g;f++)h.add(u[f]);return h})}_loadNodeShallow(t){const e=this.json,n=this.extensions,i=this;if(this.nodeCache[t]!==void 0)return this.nodeCache[t];const s=e.nodes[t],o=s.name?i.createUniqueName(s.name):"",a=[],c=i._invokeOne(function(l){return l.createNodeMesh&&l.createNodeMesh(t)});return c&&a.push(c),s.camera!==void 0&&a.push(i.getDependency("camera",s.camera).then(function(l){return i._getNodeRef(i.cameraCache,s.camera,l)})),i._invokeAll(function(l){return l.createNodeAttachment&&l.createNodeAttachment(t)}).forEach(function(l){a.push(l)}),this.nodeCache[t]=Promise.all(a).then(function(l){let h;if(s.isBone===!0?h=new Ro:l.length>1?h=new je:l.length===1?h=l[0]:h=new pe,h!==l[0])for(let u=0,d=l.length;u<d;u++)h.add(l[u]);if(s.name&&(h.userData.name=s.name,h.name=o),Bn(h,s),s.extensions&&xi(n,h,s),s.matrix!==void 0){const u=new Bt;u.fromArray(s.matrix),h.applyMatrix4(u)}else s.translation!==void 0&&h.position.fromArray(s.translation),s.rotation!==void 0&&h.quaternion.fromArray(s.rotation),s.scale!==void 0&&h.scale.fromArray(s.scale);return i.associations.has(h)||i.associations.set(h,{}),i.associations.get(h).nodes=t,h}),this.nodeCache[t]}loadScene(t){const e=this.extensions,n=this.json.scenes[t],i=this,s=new je;n.name&&(s.name=i.createUniqueName(n.name)),Bn(s,n),n.extensions&&xi(e,s,n);const o=n.nodes||[],a=[];for(let c=0,l=o.length;c<l;c++)a.push(i.getDependency("node",o[c]));return Promise.all(a).then(function(c){for(let h=0,u=c.length;h<u;h++)s.add(c[h]);const l=h=>{const u=new Map;for(const[d,f]of i.associations)(d instanceof nn||d instanceof Ee)&&u.set(d,f);return h.traverse(d=>{const f=i.associations.get(d);f!=null&&u.set(d,f)}),u};return i.associations=l(s),s})}_createAnimationTracks(t,e,n,i,s){const o=[],a=t.name?t.name:t.uuid,c=[];ni[s.path]===ni.weights?t.traverse(function(d){d.morphTargetInfluences&&c.push(d.name?d.name:d.uuid)}):c.push(a);let l;switch(ni[s.path]){case ni.weights:l=ys;break;case ni.rotation:l=Ci;break;case ni.position:case ni.scale:l=Li;break;default:switch(n.itemSize){case 1:l=ys;break;case 2:case 3:default:l=Li;break}break}const h=i.interpolation!==void 0?mv[i.interpolation]:$s,u=this._getArrayFromAccessor(n);for(let d=0,f=c.length;d<f;d++){const g=new l(c[d]+"."+ni[s.path],e.array,u,h);i.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(g),o.push(g)}return o}_getArrayFromAccessor(t){let e=t.array;if(t.normalized){const n=gc(e.constructor),i=new Float32Array(e.length);for(let s=0,o=e.length;s<o;s++)i[s]=e[s]*n;e=i}return e}_createCubicSplineTrackInterpolant(t){t.createInterpolant=function(n){const i=this instanceof Ci?pv:Yu;return new i(this.times,this.values,this.getValueSize()/3,n)},t.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function bv(r,t,e){const n=t.attributes,i=new Yn;if(n.POSITION!==void 0){const a=e.json.accessors[n.POSITION],c=a.min,l=a.max;if(c!==void 0&&l!==void 0){if(i.set(new A(c[0],c[1],c[2]),new A(l[0],l[1],l[2])),a.normalized){const h=gc(ds[a.componentType]);i.min.multiplyScalar(h),i.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const s=t.targets;if(s!==void 0){const a=new A,c=new A;for(let l=0,h=s.length;l<h;l++){const u=s[l];if(u.POSITION!==void 0){const d=e.json.accessors[u.POSITION],f=d.min,g=d.max;if(f!==void 0&&g!==void 0){if(c.setX(Math.max(Math.abs(f[0]),Math.abs(g[0]))),c.setY(Math.max(Math.abs(f[1]),Math.abs(g[1]))),c.setZ(Math.max(Math.abs(f[2]),Math.abs(g[2]))),d.normalized){const _=gc(ds[d.componentType]);c.multiplyScalar(_)}a.max(c)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}i.expandByVector(a)}r.boundingBox=i;const o=new fn;i.getCenter(o.center),o.radius=i.min.distanceTo(i.max)/2,r.boundingSphere=o}function Ah(r,t,e){const n=t.attributes,i=[];function s(o,a){return e.getDependency("accessor",o).then(function(c){r.setAttribute(a,c)})}for(const o in n){const a=mc[o]||o.toLowerCase();a in r.attributes||i.push(s(n[o],a))}if(t.indices!==void 0&&!r.index){const o=e.getDependency("accessor",t.indices).then(function(a){r.setIndex(a)});i.push(o)}return te.workingColorSpace!==Oe&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${te.workingColorSpace}" not supported.`),Bn(r,t),bv(r,t,e),Promise.all(i).then(function(){return t.targets!==void 0?_v(r,t.targets,e):r})}const Kn={heroes:{},props:{}};typeof window<"u"&&(window.__authored=Kn);const wv=typeof location<"u"&&/meshy/.test(location.search+location.hash),Os={heroes:{flight:wv?"models/hero-flight-meshy.json":"models/hero-flight.json",pyro:"models/hero-pyro.json",speed:"models/hero-speed.json",invisibility:"models/hero-invisibility.json",telekinesis:"models/hero-telekinesis.json",cryo:"models/hero-cryo.json",teleport:"models/hero-teleport.json",xray:"models/hero-xray.json",shapeshift:"models/hero-shapeshift.json",duplication:"models/hero-duplication.json"},props:{car:"models/prop-car.json","house-bungalow":"models/house-bungalow.json","tree-round":"models/prop-tree-round.json","tree-tall":"models/prop-tree-tall.json",bush:"models/prop-bush.json",bin:"models/prop-bin.json",bench:"models/prop-bench.json",lamppost:"models/prop-lamppost.json",hydrant:"models/prop-hydrant.json","house-two-storey":"models/house-two-storey.json","house-ranch":"models/house-ranch.json","house-modern":"models/house-modern.json","house-cottage":"models/house-cottage.json",shed:"models/prop-shed.json",mailbox:"models/prop-mailbox.json",fence:"models/prop-fence.json",hedge:"models/prop-hedge.json",flowers:"models/prop-flowers.json",fountain:"models/prop-fountain.json",planter:"models/prop-planter.json",watertower:"models/prop-watertower.json",acunit:"models/prop-acunit.json",token:"models/col-token.json",pill:"models/col-pill.json",potion:"models/col-potion.json"}},Tv=typeof location>"u"||!/[?&]models=0\b|original/.test(location.search+location.hash),Av=new Gx;function Ev(r){const t=atob(r.slice(r.indexOf(",")+1)),e=new Uint8Array(t.length);for(let n=0;n<t.length;n++)e[n]=t.charCodeAt(n);return e}function Rv(r){return new Promise((t,e)=>{const n=new Image;n.onload=()=>{const i=new Ee(n);i.flipY=!1,i.colorSpace=_e,i.anisotropy=4,i.needsUpdate=!0,t(i)},n.onerror=e,n.src=r})}async function Cv(r,t=""){const e=JSON.parse(JSON.stringify(r));let n=(e.images||[]).map(_=>_.uri).find(_=>_);n&&!n.startsWith("data:")&&(n=t+n),delete e.images,delete e.textures,delete e.samplers;for(const _ of e.materials||[])_.pbrMetallicRoughness&&(delete _.pbrMetallicRoughness.baseColorTexture,delete _.pbrMetallicRoughness.metallicRoughnessTexture),delete _.normalTexture,delete _.occlusionTexture,delete _.emissiveTexture;const i=Ev(e.buffers[0].uri),s=i.length+3&-4;e.buffers=[{byteLength:i.length}];const o=new TextEncoder().encode(JSON.stringify(e)),a=o.length+3&-4,c=20+a+8+s,l=new ArrayBuffer(c),h=new DataView(l),u=new Uint8Array(l);h.setUint32(0,1179937895,!0),h.setUint32(4,2,!0),h.setUint32(8,c,!0),h.setUint32(12,a,!0),h.setUint32(16,1313821514,!0),u.fill(32,20,20+a),u.set(o,20);const d=20+a;h.setUint32(d,s,!0),h.setUint32(d+4,5130562,!0),u.set(i,d+8);const[f,g]=await Promise.all([new Promise((_,p)=>Av.parse(l,"",_,p)),n?Rv(n):Promise.resolve(null)]);return f.userData.map=g,f}const Ku=[];function Lv(r){Ku.push(r)}async function wa(r,t,e,n){try{const i=await fetch(n+e);if(i.status===404)return;if(!i.ok)throw new Error(i.status);const s=await i.json(),o=await Cv(s.gltf,(n+e).replace(/[^/]*$/,""));if(Kn[r][t]=r==="heroes"?Uv(s,o):Ov(s,o),r==="heroes")for(const a of Ku)a(t)}catch(i){console.error("authored asset failed, using procedural",t,i)}}async function Pv(r="./",{eagerHeroes:t=["flight"]}={}){if(!Tv)return;const e=[];for(const[i,s]of Object.entries(Os.props))e.push(wa("props",i,s,r));for(const i of t)Os.heroes[i]&&e.push(wa("heroes",i,Os.heroes[i],r));await Promise.all(e);const n=Object.keys(Os.heroes).filter(i=>!t.includes(i));(async()=>{for(let i=0;i<n.length;i+=2)await Promise.all(n.slice(i,i+2).map(s=>wa("heroes",s,Os.heroes[s],r)))})()}const Iv=`
uniform float uKeyHue, uKeyWidth, uShift, uLight, uSkinOn, uSkinHue;
uniform vec3 uSkinFrom, uSkinTo;
uniform vec3 uTarget; uniform float uTargetOn;
uniform float uKey2Hue, uKey2Width, uTarget2On, uSatLo; uniform vec3 uTarget2;
vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);}
vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.,2./3.,1./3.,3.);vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);}
// all keying happens in sRGB, where the texture was measured and authored
vec3 toS(vec3 c){ return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2)); }
vec3 toL(vec3 c){ return pow(max(c, vec3(0.0)), vec3(2.2)); }
vec3 recolor(vec3 cl){
  vec3 c = toS(cl);
  vec3 h = rgb2hsv(c);
  float dh = abs(fract(h.x - uKeyHue + 0.5) - 0.5);
  float key = (1.0 - smoothstep(uKeyWidth * 0.7, uKeyWidth, dh)) * smoothstep(uSatLo, uSatLo + 0.12, h.y);
  if (key > 0.0) {
    vec3 t;
    if (uTargetOn > 0.5) {
      // paint to an absolute colour, keeping the texel's relative shading
      vec3 th = rgb2hsv(toS(uTarget));
      float rel = h.z / max(0.05, KEY_V);
      t = hsv2rgb(vec3(th.x, th.y, clamp(th.z * rel, 0.0, 1.0)));
    } else {
      t = hsv2rgb(vec3(fract(h.x + uShift), h.y, clamp(h.z * (1.0 + uLight), 0.0, 1.0)));
    }
    c = mix(c, t, key);
  }
  if (uTarget2On > 0.5) {
    // second paint key (e.g. roof): same absolute repaint as the first
    vec3 h2 = rgb2hsv(c);
    float d2 = abs(fract(h2.x - uKey2Hue + 0.5) - 0.5);
    float k2 = (1.0 - smoothstep(uKey2Width * 0.7, uKey2Width, d2)) * smoothstep(0.18, 0.35, h2.y) * (1.0 - key);
    if (k2 > 0.0) {
      vec3 th = rgb2hsv(toS(uTarget2));
      float rel = h2.z / max(0.05, KEY2_V);
      c = mix(c, hsv2rgb(vec3(th.x, th.y, clamp(th.z * rel, 0.0, 1.0))), k2);
    }
  }
  if (uSkinOn > 0.5) {
    float sk = (1.0 - smoothstep(0.025, 0.045, abs(fract(h.x - uSkinHue + 0.5) - 0.5))) * smoothstep(0.12, 0.2, h.y) * (1.0 - smoothstep(0.62, 0.75, h.y)) * smoothstep(0.35, 0.5, h.z);
    if (sk > 0.0) c = mix(c, c / max(toS(uSkinFrom), vec3(0.05)) * toS(uSkinTo), sk);
  }
  return toL(c);
}`;function ju(r,t){const e=new Ou({map:r,gradientMap:Wu(t.bands||null)}),n=t.keyV??.75,i=t.key2V??.6;return e.userData.recolor={uKeyHue:{value:t.keyHue},uKeyWidth:{value:t.keyWidth??.09},uShift:{value:0},uLight:{value:0},uSkinOn:{value:t.skin?1:0},uSkinHue:{value:t.skinHue??.054},uSkinFrom:{value:new nt(t.skinFrom??15250574)},uSkinTo:{value:new nt(15250574)},uTarget:{value:new nt},uTargetOn:{value:0},uSatLo:{value:t.satLo??.18},uKey2Hue:{value:t.key2Hue??0},uKey2Width:{value:t.key2Width??.05},uTarget2:{value:new nt},uTarget2On:{value:0}},e.onBeforeCompile=s=>{Object.assign(s.uniforms,e.userData.recolor),s.fragmentShader=s.fragmentShader.replace("#include <common>",`#include <common>
#define KEY_V `+n.toFixed(3)+`
#define KEY2_V `+i.toFixed(3)+`
`+Iv).replace("#include <map_fragment>",`#include <map_fragment>
        diffuseColor.rgb = recolor(diffuseColor.rgb);`).replace("#include <opaque_fragment>","#define RIM_STRENGTH "+(t.rim??0).toFixed(2)+`
`+Vx)},e.customProgramCacheKey=()=>"recolor-"+n.toFixed(3)+"-"+i.toFixed(3)+"-"+(t.rim??0),e}function $u(r){return r.userData.map||null}const Eh=18,Dv=new A;function Uv(r,t){let e=null;if(t.scene.traverse(h=>{!e&&h.isSkinnedMesh&&(e=h)}),!e)throw new Error("no skinned mesh");const n=e.geometry;for(const h of["normal","uv","skinWeight"])n.attributes[h]&&n.setAttribute(h,Zu(n.attributes[h]));const i=Jt.bones.concat(["mixamorigHeadTop_End","mixamorigLeftToe_End","mixamorigRightToe_End"]),s=Object.fromEntries(i.map((h,u)=>[h,u])),o=e.skeleton.bones.map(h=>h.name.replace(/[^A-Za-z0-9_]/g,"")),a=n.attributes.skinIndex,c=new Uint16Array(a.count*4);for(let h=0;h<a.count*4;h++)c[h]=s[o[a.array[h]]]??0;n.setAttribute("skinIndex",new To(c,4)),Nv(n,6),n.computeBoundingBox(),n.boundingSphere=new fn(new A(0,Jt.unitHeight*.3,0),Jt.unitHeight*1.4),n.dispose=()=>{};let l=null;if(r.lod&&n.index){const h=atob(r.lod.index),u=new Uint8Array(h.length);for(let f=0;f<h.length;f++)u[f]=h.charCodeAt(f);const d=r.lod.u32?new Uint32Array(u.buffer):new Uint16Array(u.buffer);l=new Me;for(const[f,g]of Object.entries(n.attributes))l.setAttribute(f,g);l.setIndex(new ue(d,1)),l.boundingBox=n.boundingBox,l.boundingSphere=n.boundingSphere,l.dispose=()=>{}}return{geo:n,geoLod:l,map:$u(t),joints:r.joints,meta:r.meta||{},names:i}}function Nv(r,t){const e=r.attributes.position,n=r.attributes.normal,i=r.index;if(!n||!i)return;const s=e.count,o=f=>`${Math.round(e.getX(f)*100)},${Math.round(e.getY(f)*100)},${Math.round(e.getZ(f)*100)}`,a=new Int32Array(s),c=new Map;let l=0;for(let f=0;f<s;f++){const g=o(f);let _=c.get(g);_===void 0&&(_=l++,c.set(g,_)),a[f]=_}const h=Array.from({length:l},()=>new Set),u=i.array;for(let f=0;f<u.length;f+=3){const g=a[u[f]],_=a[u[f+1]],p=a[u[f+2]];h[g].add(_),h[g].add(p),h[_].add(g),h[_].add(p),h[p].add(g),h[p].add(_)}let d=new Float32Array(l*3);for(let f=0;f<s;f++){const g=a[f]*3;d[g]+=n.getX(f),d[g+1]+=n.getY(f),d[g+2]+=n.getZ(f)}for(let f=0;f<t;f++){const g=new Float32Array(l*3);for(let _=0;_<l;_++){let p=d[_*3],m=d[_*3+1],x=d[_*3+2];for(const v of h[_])p+=d[v*3],m+=d[v*3+1],x+=d[v*3+2];const y=Math.hypot(p,m,x)||1;g[_*3]=p/y,g[_*3+1]=m/y,g[_*3+2]=x/y}d=g}for(let f=0;f<s;f++){const g=a[f]*3;n.setXYZ(f,d[g],d[g+1],d[g+2])}n.needsUpdate=!0}const Rh=new xe;function kv(r,t,e){const{geo:n,geoLod:i,map:s,joints:o,meta:a,names:c}=e,l=Jt.skeleton,h={},u=P=>{if(h[P])return h[P];const U=l[P],O=new xe().fromArray(U.quat);return h[P]=U.parent?u(U.parent).clone().multiply(O):O,h[P]},d={};for(const P of c){const U=l[P],O=new Ro;O.name=P,O.quaternion.fromArray(U.quat);const q=Array.isArray(o[P])?new A().fromArray(o[P]):null;if(q&&U.parent&&o[U.parent]){const Y=q.clone().sub(new A().fromArray(o[U.parent]));Rh.copy(u(U.parent)).invert(),O.position.copy(Y.applyQuaternion(Rh))}else q?O.position.copy(q):O.position.fromArray(U.pos);O.userData.restQuat=O.quaternion.clone(),O.userData.restPos=O.position.clone(),d[P]=O}for(const P of c){const U=l[P].parent;U&&d[U]&&d[U].add(d[P])}const f=ju(s,{keyHue:a.suitHue??.62,keyWidth:a.suitHueWidth??.07,keyV:a.suitV??.75,skin:!!a.skinRecolor,skinFrom:a.skinFrom,skinHue:a.skinHue,rim:0,bands:Ix,satLo:a.satLo}),g=new nt(r.palette.primary),_={},p={};g.getHSL(_),t.primary.getHSL(p),f.userData.recolor.uShift.value=p.h-_.h,f.userData.recolor.uLight.value=(p.l-_.l)*1.5,f.userData.recolor.uSkinTo.value.copy(t.skin);const m=new Eo(n,f);m.add(d.mixamorigHips),d.mixamorigHips.updateMatrixWorld(!0),m.bind(new er(c.map(P=>d[P]))),m.userData.authored=!0,i&&(m.onBeforeRender=(P,U,O)=>{if(!O.isPerspectiveCamera)return;const Y=Dv.setFromMatrixPosition(m.matrixWorld).distanceToSquared(O.position)>Eh*Eh?i:n;if(m.geometry===Y)return;const W=n.attributes.outlineNormal||i.attributes.outlineNormal;W&&(n.attributes.outlineNormal=W,i.attributes.outlineNormal=W),m.geometry=Y;const $=m.userData.outline;$&&($.geometry=Y)});const x=P=>new A().setFromMatrixPosition(d[P].matrixWorld),y=x("mixamorigLeftArm"),v=x("mixamorigRightArm"),R=Math.abs(y.x-v.x)/2,T=(y.y+v.y)/2,b=a.backZ??-1.6,L=a.torsoHalfW??R*.9,w=d.mixamorigSpine2,S=[];for(let P=0;P<7;P++){const U=P/6-.5;S.push(w.worldToLocal(new A(U*R*1.35,T+.35,b*.92)))}return{mesh:m,bones:d,extras:[],pins:S,H:Jt.unitHeight,hipsYOffset:o._hipsYOffset||0,torsoRadius:L*1.05,capeWidth:R*1.35*2}}function Zu(r){if(!r||r.array instanceof Float32Array&&!r.normalized&&!r.isInterleavedBufferAttribute)return r;const t=r.count,e=r.itemSize,n=new Float32Array(t*e),i=[r.getX,r.getY,r.getZ,r.getW];for(let s=0;s<t;s++)for(let o=0;o<e;o++)n[s*e+o]=i[o].call(r,s);return new ue(n,e)}function Ov(r,t){const e=[];t.scene.updateMatrixWorld(!0),t.scene.traverse(i=>{if(i.isMesh){const s=i.geometry.clone();for(const o of["position","normal","uv"])s.attributes[o]&&s.setAttribute(o,Zu(s.attributes[o]));s.applyMatrix4(i.matrixWorld);for(const o of Object.keys(s.attributes))["position","normal","uv"].includes(o)||s.deleteAttribute(o);e.push(s)}});const n=e[0];return n.computeBoundingBox(),n.computeBoundingSphere(),n.dispose=()=>{},{geo:n,map:$u(t),meta:r.meta||{}}}function kn(r){return!!Kn.props[r]}function oi(r,t,e){const n=Kn.props[r];if(!n)return null;const i=n.meta,s=ju(n.map,{keyHue:i.keyHue??.98,keyWidth:i.keyWidth??.06,keyV:i.keyV??.75,key2Hue:i.key2Hue,key2Width:i.key2Width,key2V:i.key2V,satLo:i.satLo,rim:i.rim??0});t!=null&&(s.userData.recolor.uTarget.value.set(t),s.userData.recolor.uTargetOn.value=1),e!=null&&i.key2Hue!=null&&(s.userData.recolor.uTarget2.value.set(e),s.userData.recolor.uTarget2On.value=1);const o=new jt(n.geo,s);return o.userData.authored=!0,o.name="prop:"+r,o}const ht={RTP:.96,BETS:[1,5,10,25,50,100],STARTING_WALLET:1e3,MULT_BRACKETS:[[.58,.05,.85],[.26,.9,1.8],[.11,1.8,4],[.042,4,12],[.008,12,40]],TOKEN_VALUE:.006,KILL_VALUE_MIN:.05,KILL_VALUE_MAX:.16,PLAYER_SPEED:9.5,FLIGHT_DECK:6.5,BOT_FLIGHT_DECK:5,FLIGHT_CLEARANCE:1.8,FLIGHT_CLIMB:10,FLIGHT_DESCEND:7,FLIGHT_LOOKAHEAD:9,METEOR_APEX:10,METEOR_UP_TIME:.45,METEOR_HANG_TIME:.9,METEOR_FALL_SPEED:30,LANDING_RADIUS:8.5,PLAYER_HP:100,HP_REGEN:4,SWITCHES_PER_GAME:3,ADRENALINE_COOLDOWN:14,BOT_COUNT:26,BOT_SPEED:6,HIT_Y_RANGE:2.4,STALK_FRACTION:.65,HUNTER_COUNT:2,HUNTER_SPEED:11.5,HUNTER_HP:320,HUNTER_DAMAGE:.9,HUNTER_FIREBALL_AT:8,HUNTER_GIANT_AT:15,HUNTER_BLINK_AT:22,BLOCK:22,ROAD:8,CHUNK_RADIUS:5,RECYCLE_DIST:135,TOKEN_COUNT:150,PILL_COUNT:6,POTION_COUNT:6,TK_RANGE:13,TK_PULL_SPEED:8,TK_THROW_SPEED:27,PILLS:[{id:"absorb",name:"Power Absorption",emblem:"🧬",p:.45,duration:45},{id:"twopower",name:"Two Powers",emblem:"☯",p:.3,duration:30},{id:"extraswitch",name:"Extra Switch",emblem:"🔄",p:.25,duration:0}],POTIONS:[{id:"enlarge",name:"Enlarge",emblem:"🦹",p:1/3,duration:15},{id:"fireball",name:"Fireball",emblem:"☄",p:1/3,duration:0},{id:"landing",name:"Superhero Landing",emblem:"💥",p:1/3,duration:0}]},tn={shadows:!1},I=(r=1,t)=>t===void 0?Math.random()*r:r+Math.random()*(t-r),cn=(r,t)=>Math.floor(I(r,t+1)),Yt=r=>r[Math.floor(Math.random()*r.length)],Ys=(r,t,e)=>Math.max(t,Math.min(e,r));function Ju(r,t){let e=0;for(const i of r)e+=t(i);let n=Math.random()*e;for(const i of r)if(n-=t(i),n<=0)return i;return r[r.length-1]}function as(r){return r>=1e3?"$"+(r/1e3).toFixed(r>=1e4?0:1)+"k":"$"+r.toFixed(2)}const Fv=["Shadow","Neon","Turbo","Vex","Nova","Grim","Pixel","Crash","Zero","Hyper","Rogue","Static","Blitz","Omen","Drift","Venom","Echo","Frost","Ember","Volt","Ghost","Rex","Jinx","Onyx","Comet"],Bv=["Viper","Fang","Wing","Fist","Byte","Strider","Bolt","Hound","Reaper","Kid","Prime","Shade","Storm","Claw","Wraith","Nine","Spark","Blade","Rush","Howl"];function zv(){const r=Yt(Fv)+Yt(Bv);return Math.random()<.35?r+cn(2,99):r}const De=ht.BLOCK+ht.ROAD,Ta=ht.CHUNK_RADIUS,Hv=80;function Ch(r=!1){const i=document.createElement("canvas");i.width=i.height=512;const s=i.getContext("2d");s.fillStyle=r?"#5a4d43":"#46505e",s.fillRect(0,0,512,512);for(let a=0;a<4;a++)for(let c=0;c<4;c++){const l=c*128+10,h=a*128+12,u=108,d=102,f=Math.random();let g,_;if(f<.12)g="#ffe9a8",_="#ffc96b";else if(f<.22)g="#c9d2dc",_="#aeb9c6";else{const m=I(-14,14);g=`rgb(${200+m},${222+m},${240+m})`,_=`rgb(${130+m},${165+m},${205+m})`}const p=s.createLinearGradient(0,h,0,h+d);if(p.addColorStop(0,g),p.addColorStop(1,_),s.fillStyle=p,s.fillRect(l,h,u,d),f>=.12&&f<.22){s.fillStyle="rgba(80,90,100,0.35)";for(let m=6;m<d;m+=9)s.fillRect(l,h+m,u,2)}if(f>=.22){s.save(),s.beginPath(),s.rect(l,h,u,d),s.clip(),s.fillStyle="rgba(255,255,255,0.55)";const m=I(-.2,.5)*u;s.beginPath(),s.moveTo(l+m,h+d),s.lineTo(l+m+u*.22,h+d),s.lineTo(l+m+u*.72,h),s.lineTo(l+m+u*.5,h),s.fill(),s.fillStyle="rgba(255,255,255,0.35)",s.beginPath(),s.moveTo(l+m+u*.3,h+d),s.lineTo(l+m+u*.36,h+d),s.lineTo(l+m+u*.86,h),s.lineTo(l+m+u*.8,h),s.fill(),s.restore()}s.strokeStyle="rgba(18,18,28,0.9)",s.lineWidth=4,s.strokeRect(l,h,u,d),s.fillStyle="rgba(230,232,236,0.55)",s.fillRect(l-4,h+d+3,u+8,5),s.fillStyle="rgba(18,18,28,0.6)",s.fillRect(l+u/2-1.5,h,3,d)}const o=new Ii(i);return o.wrapS=o.wrapT=Ti,o.colorSpace=_e,o.anisotropy=4,o}function Vv(){const e=document.createElement("canvas");e.width=256,e.height=128;const n=e.getContext("2d"),i=[[60,80,34],[104,62,44],[154,70,40],[196,84,30],[128,88,34],[86,92,26]],s=()=>{n.beginPath();for(const[a,c,l]of i)n.moveTo(a+l,c),n.arc(a,c,l,0,Math.PI*2)};n.save(),s(),n.lineWidth=6,n.strokeStyle="rgba(70,90,140,0.35)",n.stroke(),n.restore(),s(),n.fillStyle="#ffffff",n.fill(),n.save(),s(),n.clip(),n.fillStyle="#dde6f7",n.fillRect(0,92,256,128),n.fillStyle="rgba(255,255,255,0.9)";for(const[a,c,l]of i)n.beginPath(),n.arc(a-l*.25,c-l*.3,l*.45,0,Math.PI*2),n.fill();n.restore();const o=new Ii(e);return o.colorSpace=_e,o}function Lh(r){const e=document.createElement("canvas");e.width=e.height=1024;const n=e.getContext("2d"),i=1024/De,s=ht.ROAD/2*i,o=1.6*i,a=.22*i,c="rgba(22,20,30,0.85)",l={x:s+o,y:s+o,w:1024-2*(s+o)},h=(b,L,w,S)=>{n.fillStyle=S,n.beginPath(),n.ellipse(b,L,w,w*I(.5,1),I(0,Math.PI),0,Math.PI*2),n.fill()},u=(b,L,w,S,P)=>{n.strokeStyle=P,n.lineWidth=S,n.lineCap="round",n.beginPath(),n.moveTo(b,L);let U=I(0,Math.PI*2);for(let O=0;O<5;O++)U+=I(-.7,.7),b+=Math.cos(U)*w/5,L+=Math.sin(U)*w/5,n.lineTo(b,L);n.stroke()};if(r==="downtown"){n.fillStyle="#9aa0a8",n.fillRect(0,0,1024,1024);const b=1.6*i,L=.8*i;for(let w=0,S=l.y;S<l.y+l.w;w++,S+=L)for(let P=l.x-w%2*b/2;P<l.x+l.w;P+=b){const U=I(-10,10);n.fillStyle=`rgb(${158+U},${163+U},${171+U})`,n.fillRect(P+1.5,S+1.5,b-3,L-3),Math.random()<.18&&(n.fillStyle="rgba(255,255,255,0.10)",n.fillRect(P+3,S+3,b*.5,L*.25))}for(let w=0;w<25;w++)u(I(l.x+20,l.x+l.w-20),I(l.y+20,l.y+l.w-20),I(14,40),1.4,"rgba(40,42,50,0.45)");for(let w=0;w<2500;w++)n.fillStyle=`rgba(${Math.random()<.5?"255,255,255":"30,30,40"},${I(.03,.08)})`,n.fillRect(I(0,1024),I(0,1024),2,2)}else{n.fillStyle="#5e9a45",n.fillRect(0,0,1024,1024);for(let b=0;b<70;b++)h(I(0,1024),I(0,1024),I(30,90),Math.random()<.5?"rgba(120,180,80,0.25)":"rgba(55,105,45,0.25)");n.lineCap="round";for(let b=0;b<9e3;b++){const L=I(0,1024),w=I(0,1024),S=I(4,9),P=Math.random();n.strokeStyle=P<.45?`rgba(140,200,95,${I(.35,.7)})`:P<.9?`rgba(55,110,45,${I(.35,.7)})`:"rgba(30,70,30,0.6)",n.lineWidth=I(1.2,2.2),n.beginPath(),n.moveTo(L,w),n.quadraticCurveTo(L+I(-2,2),w-S*.6,L+I(-3,3),w-S),n.stroke()}for(let b=0;b<120;b++){const L=I(0,1024),w=I(0,1024);for(let S=0;S<3;S++)h(L+I(-4,4),w+I(-4,4),3,"rgba(70,130,55,0.8)")}for(let b=0;b<90;b++)h(I(0,1024),I(0,1024),2.2,["#ffffff","#ffe36b","#ff9ec7","#c9a7ff"][cn(0,3)])}const d=r==="downtown"?[196,199,205]:[208,202,190],f=18,g=(b,L,w,S,P)=>{n.fillStyle="rgb(120,118,115)",n.fillRect(b,L,w,S);const U=f,O=(P?w:S)/U;for(let q=0;q<U;q++)for(let Y=0;Y<2;Y++){const W=I(-12,8);n.fillStyle=`rgb(${d[0]+W},${d[1]+W},${d[2]+W})`;const $=q*O+1.5,X=Y*(P?S:w)/2+1.5,dt=O-3,_t=(P?S:w)/2-3;if(P?n.fillRect(b+$,L+X,dt,_t):n.fillRect(b+X,L+$,_t,dt),Math.random()<.12){const St=P?b+$+I(4,dt-4):b+X+I(4,_t-4),Xt=P?L+X+I(4,_t-4):L+$+I(4,dt-4);u(St,Xt,I(8,18),1.2,"rgba(60,58,55,0.55)")}}};g(s,s,1024-s*2,o,!0),g(s,1024-s-o,1024-s*2,o,!0),g(s,s,o,1024-s*2,!1),g(1024-s-o,s,o,1024-s*2,!1),n.strokeStyle="rgba(22,20,30,0.45)",n.lineWidth=2.5,n.strokeRect(l.x,l.y,l.w,l.w),n.fillStyle="#3a3d47",n.fillRect(0,0,1024,s),n.fillRect(0,1024-s,1024,s),n.fillRect(0,0,s,1024),n.fillRect(1024-s,0,s,1024);const _=()=>{const b=I(0,1024),L=I(0,s)+(Math.random()<.5?0:1024-s);return Math.random()<.5?[b,L]:[L,b]};n.save(),n.beginPath(),n.rect(0,0,1024,s),n.rect(0,1024-s,1024,s),n.rect(0,0,s,1024),n.rect(1024-s,0,s,1024),n.clip();for(let b=0;b<60;b++){const[L,w]=_();h(L,w,I(20,60),Math.random()<.5?"rgba(80,84,96,0.22)":"rgba(25,26,32,0.22)")}for(let b=0;b<14;b++){const[L,w]=_();h(L,w,I(8,18),"rgba(15,15,22,0.35)")}for(let b=0;b<9e3;b++){const[L,w]=_();n.fillStyle=`rgba(${Math.random()<.6?"255,255,255":"0,0,0"},${I(.03,.09)})`,n.fillRect(L,w,I(1,3),I(1,3))}for(let b=0;b<18;b++){const[L,w]=_();L>30&&L<994&&w>30&&w<994&&u(L,w,I(20,60),1.6,"rgba(14,14,20,0.7)")}n.restore(),n.fillStyle="#d9d6cf",n.fillRect(s-a,s-a,1024-2*(s-a),a),n.fillRect(s-a,1024-s,1024-2*(s-a),a),n.fillRect(s-a,s-a,a,1024-2*(s-a)),n.fillRect(1024-s,s-a,a,1024-2*(s-a)),n.strokeStyle=c,n.lineWidth=3,n.strokeRect(s-a,s-a,1024-2*(s-a),1024-2*(s-a));const p=(b,L,w,S,P)=>{n.fillStyle=b,n.fillRect(L,w,S,P);for(let U=0;U<S*P/900;U++)h(L+I(0,S),w+I(0,P),I(2,6),"rgba(58,61,71,0.22)")},m=2.6*i,x=2.6*i,y=.35*i;for(let b=x;b<1024-m;b+=m+x)p("rgb(238,200,80)",b,0,m,y),p("rgb(238,200,80)",b,1024-y,m,y),p("rgb(238,200,80)",0,b,y,m),p("rgb(238,200,80)",1024-y,b,y,m);const v=s*.8,R=.55*i;for(let b=0;b<5;b++){const L=s+o+1.2*i+b*R*2;if(L>s+o+8*i)break;p("rgb(236,236,240)",L,s*.1,R,v),p("rgb(236,236,240)",L,1024-s*.9,R,v),p("rgb(236,236,240)",s*.1,L,v,R),p("rgb(236,236,240)",1024-s*.9,L,v,R)}const T=new Ii(e);return T.colorSpace=_e,T.anisotropy=4,T}const Fs=new nt;function li(r,t,e=0){r.index&&(r=r.toNonIndexed()),Fs.set(t),e&&Fs.multiplyScalar(1+I(-e,e));const n=r.attributes.position.count,i=new Float32Array(n*3);for(let s=0;s<n;s++)i[s*3]=Fs.r,i[s*3+1]=Fs.g,i[s*3+2]=Fs.b;return r.setAttribute("color",new ue(i,3)),r}function gt(r,t,e,n,i,s,o,a,{ry:c=0,shade:l=.06}={}){const h=new wn(t,e,n);c&&h.rotateY(c),h.translate(i,s,o),r.push(li(h,a,l))}function Aa(r,t,e,n,i,s,o){const a=new ir(t,e,4);a.rotateY(Math.PI/4),a.translate(n,i,s),r.push(li(a,o,.05))}function Ph(r,t,e){let n=0;for(const i of r)Math.abs(t-i.x)<i.hw&&Math.abs(e-i.z)<i.hd&&(n=Math.max(n,i.top));return n}function on(r,t,e,n,i,s,o=1){const a=new Co(t,o);a.translate(e,n,i),r.push(li(a,s,.1))}function ze(r,t,e,n,i,s,o,a,c){const l=new qn(t,e,n,i);l.translate(s,o,a),r.push(li(l,c,.05))}function Xr(r,t,e){const n=Math.sin(r*127.1+t*311.7+e*74.7)*43758.5453;return n-Math.floor(n)}const Ih=r=>r*r*(3-2*r);function Dh(r,t,e){const n=Math.floor(r),i=Math.floor(t),s=Ih(r-n),o=Ih(t-i);return Xr(n,i,e)*(1-s)*(1-o)+Xr(n+1,i,e)*s*(1-o)+Xr(n,i+1,e)*(1-s)*o+Xr(n+1,i+1,e)*s*o}const Gv=new Set(["acunit","flowers","fence","hedge","mailbox","planter"]);class Wv{constructor(t){if(this.scene=t,this.chunks=new Map,this.focus={x:0,z:0},this.seed=I(0,1e3),this.drift=0,this.xray=!1,this.orphans=[],t.fog=new Uc(13624824,60,142),this.hemi=new hx(14084607,6126157,.95),t.add(this.hemi),this.sun=new Vu(16773845,1.7),this.sun.position.set(60,110,40),t.add(this.sun),t.add(this.sun.target),tn.shadows){this.sun.castShadow=!0,this.sun.shadow.mapSize.set(2048,2048);const e=this.sun.shadow.camera;e.left=-70,e.right=70,e.top=70,e.bottom=-70,e.near=20,e.far=260,this.sun.shadow.bias=-6e-4,this.sun.shadow.normalBias=.6}this.buildSky(),this.windowTexCool=Ch(!1),this.windowTexWarm=Ch(!0),this.groundMats={suburb:new dn({map:Lh("suburb")}),downtown:new dn({map:Lh("downtown")})},this.groundGeo=new Ri(De,De),this.groundGeo.rotateX(-Math.PI/2),this.vcMat=new dn({vertexColors:!0}),this.towerMatCool=new dn({map:this.windowTexCool,vertexColors:!0}),this.towerMatWarm=new dn({map:this.windowTexWarm,vertexColors:!0}),this.buildingMats=[this.vcMat,this.towerMatCool,this.towerMatWarm],this.update(this.focus,0,!0)}buildSky(){const e=new Lo(185,24,14),n=e.attributes.position,i=new Float32Array(n.count*3),s=new nt(2913504),o=new nt(8830962),a=new nt(15266555),c=new nt;for(let h=0;h<n.count;h++){const u=Math.max(0,Math.min(1,n.getY(h)/185));u<.25?c.lerpColors(a,o,u/.25):c.lerpColors(o,s,(u-.25)/.75),i[h*3]=c.r,i[h*3+1]=c.g,i[h*3+2]=c.b}e.setAttribute("color",new ue(i,3)),this.skyDome=new jt(e,new ke({vertexColors:!0,side:Ve,fog:!1,depthWrite:!1})),this.skyDome.renderOrder=-10,this.scene.add(this.skyDome);const l=Vv();this.clouds=[];for(let h=0;h<10;h++){const u=new Qs(new vs({map:l,transparent:!0,opacity:I(.5,.8),depthWrite:!1,fog:!1})),d=I(22,40);u.scale.set(d,d*.45,1),u.position.set(I(-150,150),I(48,80),I(-150,150)),this.scene.add(u),this.clouds.push({spr:u,speed:I(.9,2.2)})}}themeAt(t,e){const n=t*.14+this.drift,i=e*.14,s=t*.31-this.drift*.6,o=e*.31;return Dh(n,i,this.seed)*.72+Dh(s,o,this.seed+37)*.28>.5?"downtown":"suburb"}update(t,e=0,n=!1){if(this.focus={x:t.x,z:t.z},this.drift+=e*.004,this.sun.position.set(t.x+60,110,t.z+40),this.sun.target.position.set(t.x,0,t.z),this.skyDome?.position.set(t.x,0,t.z),this.clouds)for(const a of this.clouds)a.spr.position.x+=a.speed*e,a.spr.position.x-t.x>150&&(a.spr.position.x-=300),a.spr.position.x-t.x<-150&&(a.spr.position.x+=300),a.spr.position.z-t.z>150&&(a.spr.position.z-=300),a.spr.position.z-t.z<-150&&(a.spr.position.z+=300);const i=Math.round(t.x/De),s=Math.round(t.z/De);for(const[a,c]of this.chunks)(Math.abs(c.cx-i)>Ta+1||Math.abs(c.cz-s)>Ta+1)&&(this.disposeChunk(c),this.chunks.delete(a));for(const a of this.chunks.values()){if(!a.dressing?.length)continue;const c=Math.max(0,Math.abs(a.cx*De-t.x)-De/2),l=Math.max(0,Math.abs(a.cz*De-t.z)-De/2),h=Math.hypot(c,l)<Hv;if(a.dressNear!==h){a.dressNear=h;for(const u of a.dressing)u.visible=h}}let o=n?1/0:4;for(let a=0;a<=Ta&&o>0;a++)for(let c=i-a;c<=i+a&&o>0;c++)for(let l=s-a;l<=s+a&&o>0;l++){if(Math.max(Math.abs(c-i),Math.abs(l-s))!==a)continue;const h=c+":"+l;this.chunks.has(h)||(this.chunks.set(h,this.buildChunk(c,l)),o--)}for(let a=this.orphans.length-1;a>=0;a--){const c=this.orphans[a];c.ttl-=e,c.ttl<=0&&!c.busy&&(this.destroyLiftableMesh(c),this.orphans.splice(a,1))}}disposeChunk(t){for(const e of t.liftables)e.alive&&(e.busy?(e.ttl=30,this.orphans.push(e),t.group.remove(e.mesh),this.scene.add(e.mesh)):this.destroyLiftableMesh(e));this.scene.remove(t.group),t.group.traverse(e=>{e.geometry&&!e.userData.shared&&e.geometry.dispose(),e.userData.authored&&e.material?.dispose?.()})}destroyLiftableMesh(t){t.alive=!1,t.mesh.parent?.remove(t.mesh),t.mesh.geometry.dispose()}buildChunk(t,e){const n=this.themeAt(t,e),i=t*De,s=e*De,o=new je,a=[],c=[],l=[],h=[];h.extra=[],h.inst={};const u=[],d=[],f=new jt(this.groundGeo,this.groundMats[n]);f.position.set(i,0,s),f.userData.shared=!0,f.receiveShadow=tn.shadows,o.add(f);const g=(x,y,v,R,T)=>a.push({x,z:y,hw:v,hd:R,h:T}),_=(x,y,v,R,T)=>c.push({x,z:y,hw:v,hd:R,top:T});n==="suburb"?this.buildSuburbBlock(i,s,h,l,g,_):this.buildDowntownBlock(i,s,h,u,d,l,g,_);const p=(x,y)=>{if(!x.length)return;const v=new jt(Wr(x,!1),y);v.castShadow=tn.shadows,v.receiveShadow=tn.shadows,o.add(v)};p(h,this.vcMat);const m=[];for(const[x,y]of Object.entries(h.inst)){const v=Kn.props[x];if(!v||!y.length)continue;const R=y.map(b=>v.geo.clone().applyMatrix4(b)),T=new jt(Wr(R,!1),this.authoredMat(x));T.name="auth:"+x,Gv.has(x)&&(T.userData.noOutline=!0),R.forEach(b=>b.dispose()),h.extra.push(T),m.push(T)}for(const x of h.extra)x.castShadow=tn.shadows,x.receiveShadow=tn.shadows,o.add(x);p(u,this.towerMatCool),p(d,this.towerMatWarm);for(const x of l)x.mesh.castShadow=tn.shadows,x.baseY=Ph(c,x.mesh.position.x,x.mesh.position.z),x.mesh.position.y=x.baseY,o.add(x.mesh);return this.scene.add(o),{cx:t,cz:e,theme:n,group:o,colliders:a,platforms:c,liftables:l,dressing:m}}buildSuburbBlock(t,e,n,i,s,o){const a=ht.BLOCK,c=[15260872,14270888,12834278,14148289,14860214,15787728,12111833,14274792,15391144,13230804],l=[9063227,5989744,7426122,5204818,8478527,4148060];for(let h=0;h<2;h++)for(let u=0;u<2;u++){const d=t+(h-.5)*(a/2),f=e+(u-.5)*(a/2),g=u===0?Math.PI:0;if(Math.random()<.15){this.tree(n,d+I(-2.5,2.5),f+I(-2.5,2.5),I(.9,1.6),s),Math.random()<.7&&this.tree(n,d+I(-3,3),f+I(-3,3),I(.7,1.2),s),this.flowerPatch(n,d+I(-3,3),f+I(-3,3)),this.shrub(n,I(.5,.8),d+I(-3,3),f+I(-3,3));continue}const _=Yt(c),p=Yt(l),m=cn(0,4);this.house(n,d,f,g,_,p,m,s,o),Math.random()<.7&&this.tree(n,d+Yt([-1,1])*I(3.4,4.6),f+I(-3.5,3.5),I(.7,1.3),s),Math.random()<.5&&this.shrub(n,I(.35,.6),d+I(-4,4),f+I(-4,4)),Math.random()<.45&&this.flowerPatch(n,d+I(-4,4),f+I(-4,4)),Math.random()<.3&&this.shed(n,d+Yt([-1,1])*3.8,f-Math.sign(Math.cos(g)||1)*3.6,s);const x=f+(u===0?-1:1)*(a/4-.4);if(Math.random()<.4&&kn("fence")&&n.inst)this.placeAuthored(n,"fence",d-2.6,0,x,1,u===0?Math.PI:0),this.placeAuthored(n,"fence",d+2.6,0,x,1,u===0?Math.PI:0);else if(Math.random()<.4&&kn("hedge")&&n.inst)for(const y of[-3,0,3])this.placeAuthored(n,"hedge",d+y,0,x,I(.95,1.05),u===0?Math.PI:0);else Math.random()<.4?(gt(n,4.2,.55,.09,d-2.6,.32,x,15263455),gt(n,4.2,.55,.09,d+2.6,.32,x,15263455),gt(n,.12,.75,.12,d-4.6,.4,x,14210508),gt(n,.12,.75,.12,d+4.6,.4,x,14210508)):Math.random()<.4&&gt(n,9,.7,.55,d,.4,x,Yt([4160048,5214010]),{shade:.12});if(Math.random()<.5){const y=f+(u===0?-1:1)*I(3.2,3.8),v=d+Yt([-1,1])*I(1,1.6);this.placeAuthored(n,"mailbox",v,0,y,1,u===0?Math.PI:0)||(gt(n,.09,1,.09,v,.5,y,5916212),gt(n,.34,.24,.5,v,1.1,y,Yt([10104880,3827394,3816770])))}}Math.random()<.45&&this.spawnCar(i,t+I(-a/3,a/3),e+Yt([-1,1])*(a/2+1.6),0),Math.random()<.3&&this.spawnBin(i,t+Yt([-1,1])*(a/2-1),e+I(-a/3,a/3))}authoredHouse(t,e,n,i,s,o,a,c,l,h){const u=["house-bungalow","house-two-storey","house-ranch","house-modern","house-cottage"][a];if(!t.extra||!kn(u))return!1;let d,f,g,_=0,p=0;if(a===0){const v=I(5.5,6.5),R=I(4.6,5.4),T=I(3,3.6);d=v+3,f=R*1.05,g=T+1.6,_=1.5,p=.2,l(e,n,Math.max(v,R)/2+.2,Math.max(v,R)/2+.2,T+2);const b=c(v/2+1.5,.4);l(b.x,b.z,1.7,1.9,2.6),this.driveway(t,b.x,b.z,i),this.frontPath(t,e,n,v,R,i)}else if(a===1){const v=I(5,6),R=I(4.6,5.4),T=I(5.4,6.2);d=v*1.05,f=R*1.05,g=T+1.9,l(e,n,Math.max(v,R)/2+.2,Math.max(v,R)/2+.2,T+2),this.frontPath(t,e,n,v,R,i)}else if(a===2){const v=I(6.5,7.5),R=I(3.6,4.2),T=I(3,3.4),b=I(3.2,3.8);d=v+.5,f=R+3.4,g=T+1,p=1.55;const L=c(-v/2+b/2,R/2+1.4);l(e,n,v/2+.4,R/2+.4,T+1),l(L.x,L.z,b/2+.3,1.9,T+1),this.frontPath(t,e,n,v,R,i)}else if(a===3){const v=I(5,6),R=I(4.4,5),T=I(3.4,4);d=v*1.2,f=R,g=T*1.35+.3,_=v*.0975,l(e,n,v/2+.5,R/2+.4,T*1.4+1),this.driveway(t,c(v/2+1.6,.6).x,c(v/2+1.6,.6).z,i)}else{const v=I(4.8,5.6),R=I(4.2,4.8),T=I(2.8,3.2);d=v,f=R+2.2,g=T+2.4,p=1.1;const b=c(0,R/2+1.1);h(b.x,b.z,v*.45,1,.24),l(e,n,Math.max(v,R)/2+.2,Math.max(v,R)/2+.2,T+2),this.frontPath(t,e,n,v,R+2.2,i)}const m=oi(u,s,o);m.name="house:"+u;const x=m.geometry.boundingBox;m.scale.set(d/(x.max.x-x.min.x),g/(x.max.y-x.min.y),f/(x.max.z-x.min.z)),m.rotation.y=i;const y=c(_,p);return m.position.set(y.x,0,y.z),t.extra.push(m),!0}frontPath(t,e,n,i,s,o){const a=Math.sin(o),c=Math.cos(o),l=e+i*.22*c+(s/2+2.2)*a,h=n-i*.22*a+(s/2+2.2)*c;gt(t,1.1,.06,4.2,l,.04,h,13223096,{ry:o,shade:.02})}house(t,e,n,i,s,o,a,c,l){const h=Math.sin(i),u=Math.cos(i),d=(g,_)=>({x:e+g*u+_*h,z:n-g*h+_*u}),f=new nt(s).multiplyScalar(.8).getHex();if(!this.authoredHouse(t,e,n,i,s,o,a,d,c,l))if(a===0){const g=I(5.5,6.5),_=I(4.6,5.4),p=I(3,3.6);gt(t,g,p,_,e,p/2,n,s,{ry:i}),gt(t,g+.35,.22,_+.35,e,p+.05,n,f,{ry:i}),Aa(t,Math.max(g,_)*.72,I(1.7,2.3),e,p+.15,n,o),c(e,n,Math.max(g,_)/2+.2,Math.max(g,_)/2+.2,p+2);const m=d(g/2+1.5,.4);gt(t,3,2.4,3.4,m.x,1.2,m.z,s,{ry:i}),gt(t,2.4,1.8,.15,m.x+h*1.75,1,m.z+u*1.75,5923694,{ry:i}),gt(t,3.2,.25,3.6,m.x,2.5,m.z,o,{ry:i}),c(m.x,m.z,1.7,1.9,2.6),this.houseFace(t,e,n,g,_,p,i,s),this.driveway(t,m.x,m.z,i)}else if(a===1){const g=I(5,6),_=I(4.6,5.4),p=I(5.4,6.2);gt(t,g,p,_,e,p/2,n,s,{ry:i}),gt(t,g+.3,.18,_+.3,e,p/2+.05,n,f,{ry:i}),Aa(t,Math.max(g,_)*.7,I(1.6,2.1),e,p,n,o),c(e,n,Math.max(g,_)/2+.2,Math.max(g,_)/2+.2,p+2),gt(t,.6,1.6,.6,e+g*.28,p+.8,n+_*.2,10119765),this.houseFace(t,e,n,g,_,p,i,s,!0)}else if(a===2){const g=I(6.5,7.5),_=I(3.6,4.2),p=I(3,3.4);gt(t,g,p,_,e,p/2,n,s,{ry:i});const m=I(3.2,3.8),x=d(-g/2+m/2,_/2+1.4);gt(t,m,p,3.4,x.x,p/2,x.z,s,{ry:i}),gt(t,g+.5,.3,_+.5,e,p+.1,n,o,{ry:i}),gt(t,m+.5,.3,3.9,x.x,p+.1,x.z,o,{ry:i}),c(e,n,g/2+.4,_/2+.4,p+1),c(x.x,x.z,m/2+.3,1.9,p+1),this.houseFace(t,e,n,g,_,p,i,s)}else if(a===3){const g=I(5,6),_=I(4.4,5),p=I(3.4,4),m=Yt([10134701,8226961,13357784,9075565]);gt(t,g,p,_,e,p/2,n,s,{ry:i});const x=d(g*.42,-_*.1);gt(t,g*.55,p*1.35,_*.7,x.x,p*1.35/2,x.z,m,{ry:i}),gt(t,g+.4,.22,_+.4,e,p+.11,n,3817544,{ry:i}),gt(t,g*.55+.4,.22,_*.7+.4,x.x,p*1.35+.11,x.z,3817544,{ry:i});const y=d(-g*.1,_/2+.08);gt(t,g*.55,1.2,.12,y.x,1.8,y.z,10471135,{ry:i,shade:.03}),c(e,n,g/2+.5,_/2+.4,p*1.4+1),this.driveway(t,d(g/2+1.6,.6).x,d(g/2+1.6,.6).z,i)}else{const g=I(4.8,5.6),_=I(4.2,4.8),p=I(2.8,3.2);gt(t,g,p,_,e,p/2,n,s,{ry:i}),Aa(t,Math.max(g,_)*.78,I(2,2.6),e,p,n,o);const m=d(0,_/2+1.1);gt(t,g*.9,.22,2,m.x,.13,m.z,12034436,{ry:i}),l(m.x,m.z,g*.45,1,.24);const x=d(-g*.38,_/2+1.9),y=d(g*.38,_/2+1.9);gt(t,.14,2.2,.14,x.x,1.1,x.z,15263455),gt(t,.14,2.2,.14,y.x,1.1,y.z,15263455),gt(t,g*.95,.18,2.3,m.x,2.3,m.z,o,{ry:i}),c(e,n,Math.max(g,_)/2+.2,Math.max(g,_)/2+.2,p+2),this.houseFace(t,e,n,g,_,p,i,s)}}houseFace(t,e,n,i,s,o,a,c,l=!1){const h=Math.sin(a),u=Math.cos(a),d=s/2+.06,f=(p,m,x,y,v)=>{const R=e+p*u+d*h,T=n-p*h+d*u;gt(t,x,y,.12,R,m,T,v,{ry:a,shade:.03})};f(i*.22,1.05,.95,2.1,Yt([8010542,3230318,4086330,7232049])),f(i*.22,.12,1.3,.24,12170408),f(-i*.24,1.45,1.2,1.1,12375016),f(-i*.24,1.45,1.36,1.26,15789800),f(-i*.24,1.45,1.2,1.1,12375016),i>6&&f(0,1.45,1,1,12375016),l&&(f(-i*.24,3.9,1.1,1,12375016),f(i*.24,3.9,1.1,1,12375016));const g=e+i*.22*u+(s/2+2.2)*h,_=n-i*.22*h+(s/2+2.2)*u;gt(t,1.1,.06,4.2,g,.04,_,13223096,{ry:a,shade:.02})}driveway(t,e,n,i){gt(t,3,.05,5.5,e,.035,n,10197137,{ry:i,shade:.02})}shed(t,e,n,i){const s=I(1.8,2.4),o=I(1.8,2.2);if(this.placeAuthored(t,"shed",e,0,n,s/2.1,cn(0,3)*Math.PI/2)){i(e,n,s/2+.1,s/2,o+.5);return}gt(t,s,o,s*.85,e,o/2,n,Yt([9073493,7174760,8219228])),gt(t,s+.3,.35,s*.85+.3,e,o+.15,n,5984328),i(e,n,s/2+.1,s/2,o+.5)}flowerPatch(t,e,n){if(!this.placeAuthored(t,"flowers",e,0,n,I(.9,1.1),cn(0,3)*Math.PI/2)){gt(t,1.6,.12,1.1,e,.07,n,7164472,{shade:.08});for(let i=0;i<4;i++)on(t,.12,e+I(-.6,.6),.22,n+I(-.4,.4),Yt([14965882,15913806,14189032,15764043,16777215]),0)}}authoredMat(t){return this._authMats=this._authMats||{},this._authMats[t]||(this._authMats[t]=oi(t).material),this._authMats[t]}placeAuthored(t,e,n,i,s,o=1,a=0){if(!t.inst||!kn(e))return!1;const c=new Bt().compose(new A(n,i,s),new xe().setFromAxisAngle(new A(0,1,0),a),new A(o,o,o));return(t.inst[e]=t.inst[e]||[]).push(c),!0}shrub(t,e,n,i){this.placeAuthored(t,"bush",n,0,i,e/.55*I(.9,1.1),I(0,Math.PI*2))||on(t,e,n,e*.85,i,Yt([5214010,6136389,4160048]))}tree(t,e,n,i,s){const o=["tree-round","tree-tall"].filter(kn);if(o.length&&t.inst){this.placeAuthored(t,Yt(o),e,0,n,i*I(.9,1.1),I(0,Math.PI*2)),s?.(e,n,.4*i,.4*i,2.5*i);return}ze(t,.16*i,.26*i,2.1*i,6,e,1.05*i,n,7031346);const a=Yt([5214010,6136389,4160048,7776319,4888168]);on(t,1.15*i,e,2.6*i,n,a),on(t,.8*i,e+.7*i,2.1*i,n+.3*i,a),on(t,.7*i,e-.6*i,2.3*i,n-.4*i,a),s?.(e,n,.4*i,.4*i,2.5*i)}buildDowntownBlock(t,e,n,i,s,o,a,c){const l=ht.BLOCK,h=Math.random()<.16;if(gt(n,l,.14,l,t,.07,e,10988466,{shade:.03}),c(t,e,l/2,l/2,.14),n.extra){if(!this.slabTopGeo){const d=new Ri(l,l);d.rotateX(-Math.PI/2);const f=ht.ROAD/2/De,g=d.attributes.uv;for(let _=0;_<g.count;_++)g.setXY(_,f+g.getX(_)*(1-2*f),f+g.getY(_)*(1-2*f));this.slabTopGeo=d}const u=new jt(this.slabTopGeo,this.groundMats.downtown);u.position.set(t,.142,e),u.userData.shared=!0,u.receiveShadow=tn.shadows,n.extra.push(u)}if(h){this.placeAuthored(n,"fountain",t,.14,e,1,I(0,Math.PI*2))||(ze(n,1.6,1.9,.5,12,t,.35,e,9278105),ze(n,.4,.5,1.3,8,t,1,e,10467529),on(n,.42,t,1.75,e,12574962)),c(t,e,1.34,1.34,.6);for(let u=0;u<3;u++){const d=I(0,Math.PI*2),f=I(4,8),g=t+Math.cos(d)*f,_=e+Math.sin(d)*f;this.placeAuthored(n,"planter",g,.1,_,1.8/1.4,cn(0,3)*Math.PI/2)||gt(n,1.8,.5,1.8,g,.35,_,8291210),c(g,_,.9,.9,.6),this.tree(n,g,_,I(.6,.9),a)}this.spawnBench(o,t+I(-5,5),e+I(-5,5),I(0,Math.PI))}else{const u=cn(1,2);for(let d=0;d<u;d++){const f=I(7,11),g=I(7,11),p=Math.random()<.2?I(30,48):I(9,26),m=t+(u===1?0:d===0?-l/4.2:l/4.2)+I(-1,1),x=e+I(-2.5,2.5),y=Math.random()<.35,v=y?s:i,R=Math.random();if(R<.18&&f>8?this.cylinderTower(n,v,m,x,Math.min(f,g)/2,p,y):R<.4?this.slabTower(n,v,m,x,f,g,p,y):this.tieredTower(n,v,m,x,f,g,p,y),a(m,x,f/2,g/2,p),Math.random()<.5){const T=x+g/2+.5;gt(n,f*.7,.12,1.1,m,2.6,T,Yt([12728890,3046865,3115610,14263583]),{shade:.04})}}if(Math.random()<.6&&this.lamppost(n,t+l/2-.8,e+l/2-.8),Math.random()<.4&&this.lamppost(n,t-l/2+.8,e-l/2+.8),Math.random()<.4&&this.spawnBench(o,t+Yt([-1,1])*(l/2-1.6),e+I(-6,6),Math.PI/2),Math.random()<.35&&this.spawnBin(o,t+I(-l/3,l/3),e+Yt([-1,1])*(l/2-1)),Math.random()<.45){const d=t+Yt([-1,1])*(l/2-1.6),f=e+I(-6,6);this.placeAuthored(n,"planter",d,.08,f,1,cn(0,3)*Math.PI/2)||gt(n,1.4,.4,1.4,d,.28,f,8291210),c(d,f,.7,.7,.48),this.tree(n,d,f,I(.5,.75),a)}}Math.random()<.55&&this.spawnCar(o,t+Yt([-1,1])*(l/2+1.6),e+I(-l/3,l/3),Math.PI/2)}towerTint(t,e){return new nt().setHSL(t?I(.06,.12):I(.52,.62),t?I(.12,.3):I(.05,.22),I(.45,.62)*e).getHex()}scaleTowerUV(t,e,n,i){const s=t.attributes.uv;for(let o=0;o<s.count;o++)s.setXY(o,s.getX(o)*Math.max(e,n)/4.8,s.getY(o)*i/4.8)}roofClutter(t,e,n,i){if(kn("acunit")&&t.inst){const s=cn(0,1)+(Math.random()<.2?1:0);for(let o=0;o<s;o++)this.placeAuthored(t,"acunit",e+I(-2,2),i,n+I(-2,2),I(.9,1.2),cn(0,3)*Math.PI/2);Math.random()<.3&&kn("watertower")&&this.placeAuthored(t,"watertower",e+I(-1.5,1.5),i,n+I(-1.5,1.5),I(.9,1.15),I(0,Math.PI*2)),Math.random()<.35&&ze(t,.06,.06,I(2,5),4,e,i+1.8,n,7830917),Math.random()<.2&&gt(t,I(2.4,3.6),I(1.2,1.8),.15,e,i+1.4,n,Yt([14240362,3843690,3827394,14263583]),{shade:.02});return}Math.random()<.7&&gt(t,I(1,2),I(.8,1.4),I(1,2),e+I(-1,1),i+.6,n+I(-1,1),5593955),Math.random()<.35&&ze(t,.06,.06,I(2,5),4,e,i+1.8,n,7830917),Math.random()<.22&&ze(t,.9,.9,1.6,8,e+I(-1.5,1.5),i+1.6,n+I(-1.5,1.5),8019016),Math.random()<.2&&gt(t,I(2.4,3.6),I(1.2,1.8),.15,e,i+1.4,n,Yt([14240362,3843690,3827394,14263583]),{shade:.02})}tieredTower(t,e,n,i,s,o,a,c){const l=this.towerTint(c,I(.72,1.15)),h=a>26?cn(2,3):1;let u=s,d=o,f=0;for(let g=0;g<h;g++){const _=g===h-1?a-f:a*I(.35,.5),p=new wn(u,_,d);this.scaleTowerUV(p,u,d,_),p.translate(n,f+_/2,i),e.push(li(p,l,.02)),gt(t,u+.3,.3,d+.3,n,f+_+.1,i,3817544),f+=_,u*=I(.68,.82),d*=I(.68,.82)}gt(t,s+.4,1.4,o+.4,n,.7,i,3028028),this.roofClutter(t,n,i,a)}slabTower(t,e,n,i,s,o,a,c){const l=this.towerTint(c,I(.8,1.15)),h=s,u=Math.max(5,o*.6),d=new wn(h,a,u);this.scaleTowerUV(d,h,u,a),d.translate(n,a/2,i),e.push(li(d,l,.02));const f=cn(2,4);for(let g=0;g<f;g++){const _=n-h/2+h/(f+1)*(g+1);gt(t,.35,a*I(.85,1.02),u+.5,_,a/2,i,7173504,{shade:.04})}gt(t,h+.5,.4,u+.6,n,a+.2,i,3817544),gt(t,h+.4,1.4,u+.4,n,.7,i,3028028),this.roofClutter(t,n,i,a)}cylinderTower(t,e,n,i,s,o,a){const c=this.towerTint(a,I(.8,1.15)),l=new qn(s*I(.82,.95),s,o,14),h=l.attributes.uv;for(let u=0;u<h.count;u++)h.setXY(u,h.getX(u)*(Math.PI*s)/4.8,h.getY(u)*o/4.8);l.translate(n,o/2,i),e.push(li(l,c,.02)),ze(t,s*.6,s*.75,.8,12,n,o+.3,i,3817544),ze(t,s+.25,s+.35,1.4,14,n,.7,i,3028028),Math.random()<.5&&ze(t,.06,.06,I(3,6),4,n,o+2.2,i,7830917)}lamppost(t,e,n){this.placeAuthored(t,"lamppost",e,0,n,1,Math.PI/2)||(ze(t,.07,.1,4.6,6,e,2.3,n,3817544),gt(t,1.1,.12,.25,e+.45,4.6,n,3817544),gt(t,.4,.15,.3,e+.9,4.52,n,16773833,{shade:0}))}makeLiftable(t,e,n,i,s){const o=t.authored||new jt(Wr(t,!1),this.vcMat);return o.position.set(e,0,n),{mesh:o,type:i,radius:s,alive:!0,busy:!1,x:e,z:n}}propGeos(t){const e=[];if(t==="car"){const n=Yt([12728890,3827394,14211292,3026484,3843690,14263583,8668856,15262938]),i=oi("car",n);if(i)return e.authored=i,e;this.carGeos(e,n)}else if(["bin","bench","hydrant","bush","lamppost"].includes(t)&&kn(t)){const n=t==="bin"?Yt([4164170,5923952,10698816]):null;return e.authored=oi(t,n),e}else if(t==="bin")ze(e,.45,.4,1,10,0,.5,0,Yt([4157002,5593955,7225151])),ze(e,.5,.5,.1,10,0,1.02,0,3028028);else if(t==="bench")gt(e,2.2,.12,.55,0,.5,0,9070146),gt(e,2.2,.5,.1,0,.85,-.25,9070146),gt(e,.12,.5,.5,-.95,.25,0,3817544),gt(e,.12,.5,.5,.95,.25,0,3817544);else if(t==="mailbox")gt(e,.09,1,.09,0,.5,0,5916212),gt(e,.34,.24,.5,0,1.1,0,Yt([10104880,3827394,3816770]));else if(t==="hydrant")ze(e,.16,.2,.8,8,0,.4,0,12728890),ze(e,.12,.12,.14,8,0,.87,0,12728890),gt(e,.5,.12,.14,0,.5,0,12728890);else if(t==="bush"){const n=Yt([4160048,5214010,6136389]);on(e,.6,0,.55,0,n),on(e,.45,.4,.45,.2,n),on(e,.4,-.35,.5,-.2,n)}else if(t==="lamppost")ze(e,.07,.1,4.6,6,0,2.3,0,3817544),gt(e,1.1,.12,.25,.45,4.6,0,3817544),gt(e,.4,.15,.3,.9,4.52,0,16773833,{shade:0});else if(kn("tree-round")){const n=oi("tree-round");return n.scale.setScalar(.8),e.authored=n,e}else{ze(e,.16*.8,.26*.8,2.1*.8,6,0,1.05*.8,0,7031346);const i=Yt([5214010,6136389,4160048]);on(e,1.15*.8,0,2.6*.8,0,i),on(e,.8*.8,.7*.8,2.1*.8,.3*.8,i),on(e,.7*.8,-.6*.8,2.3*.8,-.4*.8,i)}return e}makePropMesh(t){const e=this.propGeos(t),n=e.authored||new jt(Wr(e,!1),this.vcMat);return n.castShadow=tn.shadows,n}carGeos(t,e){gt(t,1.9,.5,4.1,0,.62,0,e,{shade:.03}),gt(t,1.8,.16,.9,0,.92,1.5,e,{shade:.03}),gt(t,1.7,.52,2,0,1.1,-.2,12572392,{shade:.03}),gt(t,1.72,.1,2.1,0,1.38,-.2,e,{shade:.03}),gt(t,1.92,.18,.22,0,.42,2.05,10133672),gt(t,1.92,.18,.22,0,.42,-2.05,10133672),gt(t,.34,.12,.08,-.6,.72,2.06,16773833),gt(t,.34,.12,.08,.6,.72,2.06,16773833),gt(t,.34,.12,.08,-.6,.72,-2.06,12728890),gt(t,.34,.12,.08,.6,.72,-2.06,12728890);for(const[n,i]of[[-.85,1.35],[.85,1.35],[-.85,-1.35],[.85,-1.35]]){const s=new qn(.34,.34,.24,10);s.rotateZ(Math.PI/2),s.translate(n,.34,i),t.push(li(s,1842724))}}spawnCar(t,e,n,i){const s=this.makeLiftable(this.propGeos("car"),e,n,"car",2.1);s.mesh.rotation.y=i+(Math.random()<.5?Math.PI:0),t.push(s)}spawnBin(t,e,n){t.push(this.makeLiftable(this.propGeos("bin"),e,n,"bin",.8))}spawnBench(t,e,n,i){const s=this.makeLiftable(this.propGeos("bench"),e,n,"bench",1.4);s.mesh.rotation.y=i,t.push(s)}liftablesNear(t,e){const n=[],i=Math.round(t.x/De),s=Math.round(t.z/De);for(let o=i-1;o<=i+1;o++)for(let a=s-1;a<=s+1;a++){const c=this.chunks.get(o+":"+a);if(c)for(const l of c.liftables){if(!l.alive||l.busy)continue;const h=Math.hypot(l.mesh.position.x-t.x,l.mesh.position.z-t.z);h<e&&n.push({l,d:h})}}return n}removeLiftable(t){this.destroyLiftableMesh(t);const e=this.orphans.indexOf(t);e>=0&&this.orphans.splice(e,1)}collidersNear(t,e){const n=[],i=Math.round(t/De),s=Math.round(e/De);for(let o=i-1;o<=i+1;o++)for(let a=s-1;a<=s+1;a++){const c=this.chunks.get(o+":"+a);c&&n.push(...c.colliders)}return n}resolve(t,e,n=0){for(const i of this.collidersNear(t.x,t.z)){if(n>i.h+.5)continue;const s=t.x-i.x,o=t.z-i.z,a=i.hw+e-Math.abs(s),c=i.hd+e-Math.abs(o);a>0&&c>0&&(a<c?t.x+=(s>=0?1:-1)*a:t.z+=(o>=0?1:-1)*c)}}isBlocked(t,e,n=.8){for(const i of this.collidersNear(t,e))if(Math.abs(t-i.x)<i.hw+n&&Math.abs(e-i.z)<i.hd+n)return!0;return!1}groundHeightAt(t,e){let n=0;const i=Math.round(t/De),s=Math.round(e/De);for(let o=i-1;o<=i+1;o++)for(let a=s-1;a<=s+1;a++){const c=this.chunks.get(o+":"+a);c&&(n=Math.max(n,Ph(c.platforms,t,e)))}return n}buildingHeightAt(t,e){let n=0;for(const i of this.collidersNear(t,e))Math.abs(t-i.x)<i.hw&&Math.abs(e-i.z)<i.hd&&(n=Math.max(n,i.h));return n}randomOpenPos(t=this.focus,e=6,n=90){for(let i=0;i<50;i++){const s=I(0,Math.PI*2),o=I(e,n),a=t.x+Math.cos(s)*o,c=t.z+Math.sin(s)*o;if(!this.isBlocked(a,c,1.1))return{x:a,z:c}}return{x:t.x+I(-8,8),z:t.z+I(-8,8)}}setXray(t){this.xray=t;for(const e of this.buildingMats)for(const n of[e,e.__toon].filter(Boolean))n.transparent=t,n.opacity=t?.22:1,n.depthWrite=!t,n.needsUpdate=!0}}const Xv={dot:0,spark:1,puff:2,flame:3,shard:4,streak:5},Uh=new nt(1315356),On=4096,qv=`
attribute float psize;
attribute vec3 pcolor;
attribute vec3 pcolor2;
attribute float plife;
attribute float pshape;
attribute float prot;
attribute float pgrow;
attribute vec3 pvel;
uniform float uPointScale;
uniform vec2 uViewport;
varying vec3 vColor;
varying vec3 vColor2;
varying float vLife;
varying float vShape;
varying float vRot;
varying float vPx;
void main() {
  vColor = pcolor; vColor2 = pcolor2; vLife = plife; vShape = pshape;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec4 c0 = projectionMatrix * mv;
  gl_Position = c0;
  // size over life: puffs swell (pgrow > 1), everything pops in fast and
  // shrinks away over the last third instead of fading
  float k = 1.0 - plife;
  float swell = mix(1.0, pgrow, sqrt(k));
  float popIn = smoothstep(0.0, 0.08, k);
  float shrink = smoothstep(0.0, 0.35, plife);
  float px = psize * swell * popIn * shrink * (uPointScale / max(1.0, -mv.z));
  px = min(px, uViewport.y * 0.2);           // never a screen-filling blob right at the lens
  gl_PointSize = px;
  vPx = max(px, 1.0);
  // orientation: flames and streaks follow their on-screen motion
  vRot = prot;
  if (pshape > 2.5 && pshape < 3.5 || pshape > 4.5) {
    vec4 c1 = projectionMatrix * (modelViewMatrix * vec4(position + pvel * 0.05, 1.0));
    vec2 d = (c1.xy / c1.w - c0.xy / c0.w) * uViewport;
    // flames trail their tip behind them like a comet; streaks just align
    if (dot(d, d) > 0.25) vRot = atan(d.y, d.x) + (pshape < 3.5 ? 1.5707963 : -1.5707963);
    else if (pshape < 3.5) vRot = 0.0; // still flames lick upward
  }
}`,Yv=`
uniform vec3 uInk;
varying vec3 vColor;
varying vec3 vColor2;
varying float vLife;
varying float vShape;
varying float vRot;
varying float vPx;

float sdCircle(vec2 p, float r) { return length(p) - r; }
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

void main() {
  vec2 p = gl_PointCoord - 0.5;
  p.y = -p.y;                                   // +y up on screen
  float c = cos(vRot), s = sin(vRot);
  vec2 q = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);   // shape space

  float d;
  int shape = int(vShape + 0.5);
  if (shape == 1) {                             // spark: 4-point star
    float a = atan(q.y, q.x);
    float r = length(q);
    float R = mix(0.17, 0.48, pow(abs(cos(2.0 * a)), 5.0));
    d = r - R;
  } else if (shape == 2) {                      // puff: lumpy cloud with a flat-ish base
    d = sdCircle(q - vec2(-0.2, -0.1), 0.19);
    d = smin(d, sdCircle(q - vec2(0.19, -0.11), 0.18), 0.08);
    d = smin(d, sdCircle(q - vec2(-0.07, 0.08), 0.23), 0.08);
    d = smin(d, sdCircle(q - vec2(0.15, 0.1), 0.16), 0.08);
    d = smin(d, sdCircle(q - vec2(0.0, -0.13), 0.2), 0.08);
  } else if (shape == 3) {                      // flame: teardrop, tip along +y
    vec2 f = q - vec2(0.0, -0.13);
    float up = max(f.y, 0.0);
    d = length(vec2(f.x * (1.0 + up * 3.2), f.y * (f.y > 0.0 ? 0.62 : 1.0))) - 0.28;
  } else if (shape == 4) {                      // shard: long diamond
    d = (abs(q.x) * 2.4 + abs(q.y)) * 0.62 - 0.29;
  } else if (shape == 5) {                      // streak: capsule along +y
    vec2 e = vec2(q.x, max(abs(q.y) - 0.34, 0.0));
    d = length(e) - 0.1;
  } else {
    d = sdCircle(q, 0.45);
  }
  if (d > 0.0) discard;

  // cel colour over life: hard steps from colour to colour2, not a blend
  float t = vLife > 0.62 ? 0.0 : (vLife > 0.3 ? 0.5 : 1.0);
  vec3 col = mix(vColor, vColor2, t);

  // thin edge line (~1 screen px) in a dark shade of the particle's own
  // colour rather than black, so effects read cel-shaded, not stickered;
  // tiny particles skip it entirely
  if (vPx > 9.0) {
    float ink = clamp(1.1 / vPx, 0.014, 0.032);
    if (d > -ink) { gl_FragColor = vec4(mix(uInk, col * 0.4, 0.6), 1.0); return; }
  }

  // two-tone shading in screen space, light from the top left
  vec2 n = p / 0.5;
  float L = dot(n, normalize(vec2(-0.55, 0.75)));
  if (shape == 2) {                             // puffs: shadow crescent + rim highlight
    if (L < -0.12) col *= 0.72;
    else if (L > 0.55 && d < -0.05) col = mix(col, vec3(1.0), 0.35);
  } else if (shape == 3) {                      // flames: hot core
    if (d < -0.13) col = mix(col, vec3(1.0, 0.97, 0.8), 0.75);
  } else if (shape == 4) {                      // shards: lit facet
    if (q.x > 0.0) col = mix(col, vec3(1.0), 0.45);
  } else if (shape == 1 || shape == 0) {        // sparks/dots: white centre
    if (d < -0.2) col = mix(col, vec3(1.0), 0.7);
    else if (L < -0.3) col *= 0.8;
  }
  gl_FragColor = vec4(col, 1.0);
}`,Kv=`
varying vec2 vUv;
void main() { vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,jv=`
uniform vec3 uColor;
uniform vec3 uInk;
uniform float uK;
uniform float uBurst;
uniform float uScale;
varying vec2 vUv;
void main() {
  float r = length(vUv);
  float a = atan(vUv.y, vUv.x);
  float outer = 1.0;
  if (uBurst > 0.5) outer = 1.0 - 0.13 * smoothstep(0.35, 0.65, abs(fract(a * 2.5465) - 0.5) * 2.0);
  float inner = mix(0.8, 0.995, uK);
  if (r > outer || r < inner) discard;
  // ink width in ring units: ~5 cm on the ground at any radius
  float ink = clamp(0.03 / uScale, 0.006, 0.04);
  vec3 col = uColor;
  if (r > outer - ink || r < inner + ink) col = mix(uInk, uColor * 0.4, 0.6);
  else if (r < mix(inner, outer, 0.45)) col *= 0.78;   // inner shade band
  gl_FragColor = vec4(col, 1.0);
}`;function $v(){const t=document.createElement("canvas");t.width=t.height=256;const e=t.getContext("2d"),n=(s,o,a,c)=>{e.beginPath();for(let l=0;l<=a*2;l++){const h=l/(a*2)*Math.PI*2,u=(l%2?s:o)*(1+Math.sin(l*12.9898)*.5*c);e.lineTo(256/2+Math.cos(h)*u,256/2+Math.sin(h)*u)}e.closePath()};e.lineJoin="miter",n(48,116,11,.25),e.fillStyle="#5a4a3a",e.fill(),n(45,112,11,.25),e.fillStyle="#ffffff",e.fill(),n(26,62,9,.2),e.fillStyle="#ffffff",e.fill();const i=new Ii(t);return i.colorSpace=_e,i}function Zv(){const t=document.createElement("canvas");t.width=t.height=128;const e=t.getContext("2d");e.beginPath();for(let i=0;i<=18;i++){const s=i/18*Math.PI*2,o=i%2?22:54;e.lineTo(128/2+Math.cos(s)*o,128/2+Math.sin(s)*o)}e.closePath(),e.fillStyle="#ffffff",e.fill();const n=new Ii(t);return n.colorSpace=_e,n}class Jv{constructor(t,e=null){this.scene=t,this.pos=new Float32Array(On*3),this.vel=new Float32Array(On*3),this.life=new Float32Array(On),this.life0=new Float32Array(On),this.grav=new Float32Array(On),this.drag=new Float32Array(On),this.spin=new Float32Array(On),this.cursor=0,this.liveMax=0;const n=new Me,i=(l,h=1)=>new ue(new Float32Array(On*h),h).setUsage(Fo);this.posAttr=new ue(this.pos,3).setUsage(Fo),this.velAttr=new ue(this.vel,3).setUsage(Fo),this.sizeAttr=i(),this.colorAttr=i("pcolor",3),this.color2Attr=i("pcolor2",3),this.lifeAttr=i(),this.shapeAttr=i(),this.rotAttr=i(),this.growAttr=i(),n.setAttribute("position",this.posAttr),n.setAttribute("pvel",this.velAttr),n.setAttribute("psize",this.sizeAttr),n.setAttribute("pcolor",this.colorAttr),n.setAttribute("pcolor2",this.color2Attr),n.setAttribute("plife",this.lifeAttr),n.setAttribute("pshape",this.shapeAttr),n.setAttribute("prot",this.rotAttr),n.setAttribute("pgrow",this.growAttr),n.setDrawRange(0,0),this.uniforms={uPointScale:{value:240*(e?e.getPixelRatio():1)},uViewport:{value:new at(1280,720)},uInk:{value:Uh}};const s=new Tn({vertexShader:qv,fragmentShader:Yv,uniforms:this.uniforms,transparent:!1,depthWrite:!0});this.points=new Iu(n,s),this.points.frustumCulled=!1,this.points.userData.noOutline=!0,this.points.renderOrder=2,t.add(this.points),this.renderer=e,this.rings=[];const o=new Ri(2,2);for(let l=0;l<14;l++){const h=new Tn({vertexShader:Kv,fragmentShader:jv,uniforms:{uColor:{value:new nt},uInk:{value:Uh},uK:{value:0},uBurst:{value:0},uScale:{value:1}},side:Ye,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),u=new jt(o,h);u.rotation.x=-Math.PI/2,u.visible=!1,u.renderOrder=1,u.userData.noOutline=!0,t.add(u),this.rings.push({mesh:u,t:0,dur:0,maxR:0})}this.bursts=[];const a=$v(),c=Zv();for(let l=0;l<10;l++){const h=new Qs(new vs({map:a,transparent:!0,alphaTest:.5,depthWrite:!1,depthTest:!1})),u=new Qs(new vs({map:c,color:16777215,transparent:!0,alphaTest:.5,depthWrite:!1,depthTest:!1}));u.renderOrder=7,h.renderOrder=6,u.scale.setScalar(.55),h.add(u),h.visible=!1,t.add(h),this.bursts.push({spr:h,inner:u,t:0,dur:0,size:1})}this.shakeAmt=0,this.shakeOffset=new A,this._c=new nt,this._c2=new nt}_spawn(t,e,n,i,s,o,a){const c=this.cursor;this.cursor=(this.cursor+1)%On,c+1>this.liveMax&&(this.liveMax=c+1);const l=c*3;this.pos[l]=t,this.pos[l+1]=e,this.pos[l+2]=n,this.vel[l]=i,this.vel[l+1]=s,this.vel[l+2]=o,this.life[c]=this.life0[c]=a.life*I(.7,1.2),this.grav[c]=a.gravity,this.drag[c]=a.drag,this.spin[c]=a.spin?I(-a.spin,a.spin):0,this.sizeAttr.array[c]=a.size*I(.7,1.3)*Qv[a.shape],this.shapeAttr.array[c]=Xv[a.shape]??0,this.rotAttr.array[c]=I(0,Math.PI*2),this.growAttr.array[c]=a.grow??(a.shape==="puff"?1.7:1);const h=a.vary?I(-a.vary,a.vary):0;this._c.set(a.color),this.colorAttr.array[l]=ns(this._c.r+h),this.colorAttr.array[l+1]=ns(this._c.g+h),this.colorAttr.array[l+2]=ns(this._c.b+h),this._c2.set(a.color2??a.color),this.color2Attr.array[l]=ns(this._c2.r+h),this.color2Attr.array[l+1]=ns(this._c2.g+h),this.color2Attr.array[l+2]=ns(this._c2.b+h),this.lifeAttr.array[c]=1}emit(t,e,n,i={}){const s={...ty,...i};for(let o=0;o<s.count;o++){const a=I(0,Math.PI*2),c=Math.acos(I(-1,1)),l=s.speed*I(.4,1.1);this._spawn(t+I(-s.jitter,s.jitter),e+I(-s.jitter,s.jitter),n+I(-s.jitter,s.jitter),Math.sin(c)*Math.cos(a)*l*s.spread,Math.abs(Math.cos(c))*l*.7+s.up,Math.sin(c)*Math.sin(a)*l*s.spread,s)}}emitDir(t,e,n,i,s={}){const o={...ey,...s};for(let a=0;a<o.count;a++){const c=o.speed*I(.6,1.15);this._spawn(t+I(-o.jitter,o.jitter),e+I(-o.jitter,o.jitter),n+I(-o.jitter,o.jitter),(i.x+I(-o.cone,o.cone))*c,(i.y+I(-o.cone,o.cone))*c,(i.z+I(-o.cone,o.cone))*c,o)}}ring(t,e,{color:n=16777215,maxR:i=8,dur:s=.55,y:o=.12,burst:a=!1}={}){const c=this.rings.find(h=>!h.mesh.visible)||this.rings.reduce((h,u)=>h.t/h.dur>u.t/u.dur?h:u);c.mesh.visible=!0,c.mesh.position.set(t,o+this.rings.indexOf(c)*.002,e);const l=c.mesh.material.uniforms;l.uColor.value.set(n),l.uBurst.value=a?1:0,l.uK.value=0,c.t=0,c.dur=s,c.maxR=i,c.mesh.scale.setScalar(.01)}burst(t,e,n,{color:i=16770140,size:s=1.6,dur:o=.2}={}){const a=this.bursts.find(c=>!c.spr.visible)||this.bursts.reduce((c,l)=>c.t/c.dur>l.t/l.dur?c:l);a.spr.visible=!0,a.spr.position.set(t,e,n),a.spr.material.color.set(i),a.spr.material.rotation=I(0,Math.PI*2),a.inner.material.rotation=I(0,Math.PI*2),a.t=0,a.dur=o,a.size=s,a.spr.scale.setScalar(.01)}addShake(t){this.shakeAmt=Math.min(1.6,this.shakeAmt+t)}update(t){if(this.renderer){const s=this.renderer.getDrawingBufferSize(this._v2||(this._v2=new at));this.uniforms.uViewport.value.copy(s),this.uniforms.uPointScale.value=240*this.renderer.getPixelRatio()}let e=0;for(let s=0;s<this.liveMax;s++){if(this.life[s]<=0)continue;this.life[s]-=t;const o=s*3;if(this.life[s]<=0){this.lifeAttr.array[s]=0,this.sizeAttr.array[s]=0;continue}e=s+1;const a=Math.max(0,1-this.drag[s]*t);this.vel[o]*=a,this.vel[o+1]=this.vel[o+1]*a+this.grav[s]*t,this.vel[o+2]*=a,this.pos[o]+=this.vel[o]*t,this.pos[o+1]+=this.vel[o+1]*t,this.pos[o+2]+=this.vel[o+2]*t,this.pos[o+1]<.05&&(this.pos[o+1]=.05,this.vel[o+1]*=-.3),this.spin[s]&&(this.rotAttr.array[s]+=this.spin[s]*t),this.lifeAttr.array[s]=this.life[s]/this.life0[s]}this.liveMax=e,this.points.geometry.setDrawRange(0,this.liveMax);for(const s of[this.posAttr,this.velAttr,this.lifeAttr,this.sizeAttr,this.colorAttr,this.color2Attr,this.shapeAttr,this.rotAttr,this.growAttr])s.clearUpdateRanges?.(),s.addUpdateRange?.(0,this.liveMax*s.itemSize),s.needsUpdate=!0;for(const s of this.rings){if(!s.mesh.visible)continue;s.t+=t;const o=s.t/s.dur;if(o>=1){s.mesh.visible=!1;continue}const a=1-Math.pow(1-o,3),c=Math.max(.01,s.maxR*a);s.mesh.scale.setScalar(c),s.mesh.material.uniforms.uK.value=o,s.mesh.material.uniforms.uScale.value=c}for(const s of this.bursts){if(!s.spr.visible)continue;s.t+=t;const o=s.t/s.dur;if(o>=1){s.spr.visible=!1;continue}const a=o<.25?o/.25*1.15:o<.6?1.15-(o-.25)*.4:(1-o)/.4;s.spr.scale.setScalar(Math.max(.01,s.size*a))}this.shakeAmt=Math.max(0,this.shakeAmt-t*2.6);const i=this.shakeAmt*this.shakeAmt*.55;this.shakeOffset.set(I(-i,i),I(-i,i),I(-i,i))}}const ns=r=>Math.max(0,Math.min(1,r)),Qv={dot:.85,spark:1.25,puff:1.35,flame:1.3,shard:1.15,streak:1.4},ty={count:12,color:16777215,color2:null,shape:"dot",speed:5,life:.7,size:1.6,gravity:-6,drag:1.5,spread:1,up:0,jitter:.2,grow:null,spin:0,vary:.08},ey={count:10,color:16777215,color2:null,shape:"dot",speed:10,life:.5,size:1.6,gravity:0,drag:1,cone:.35,jitter:0,grow:null,spin:0,vary:0},Ea=new nt,qr={};function Yr(r){return Ea.set(r).getHSL(qr),Ea.setHSL((qr.h+.97)%1,Math.min(1,qr.s*1.1+.1),qr.l*.55),Ea.getHex()}const K={fireHot:16769126,fire:16751150,fireDeep:14168604,smoke:9406872,smokeDark:5525084,ice:15138303,iceDeep:4168680,frost:16777215,frostDeep:11132149,dust:15260872,dustDeep:10260090,tele:10354649,teleDeep:1482362,tk:12614655,tkDeep:5711536,sky:13954303,skyDeep:5217768,speed:16773754,speedDeep:15901696,pink:16762604,pinkDeep:13651865,dupe:16766645,dupeDeep:14708782,invis:15264759,invisDeep:8489128,gold:16769658,goldDeep:15239698,hurt:16739199,hurtDeep:10686259,white:16777215},ny=1,iy=14,sy=.9,ry=["#ffe45c","#ff6b6b","#7dffca","#8ecbff","#ff9de2","#ffb347","#c9ff5c","#c07bff","#ffffff"],Nh=new Map;function oy(r){let t=Nh.get(r);if(t)return t;const e=document.createElement("canvas"),n=e.getContext("2d"),i='96px Bangers, Impact, "Arial Black", sans-serif';n.font=i;const s=Math.ceil(n.measureText(r).width)+48;return e.width=Math.max(64,s),e.height=128,n.font=i,n.textAlign="center",n.textBaseline="middle",n.lineJoin="round",n.lineWidth=12,n.strokeStyle="#141018",n.strokeText(r,e.width/2,e.height/2+4),n.fillStyle="#ffffff",n.fillText(r,e.width/2,e.height/2+4),t=new Ii(e),t.colorSpace=_e,t.minFilter=Ke,t.generateMipmaps=!1,t.userData.aspect=e.width/e.height,Nh.set(r,t),t}class ay{constructor(t){this.scene=t,this.live=[],this.pool=[]}spawn(t,e,n,i,{size:s=1,color:o=null,camPos:a=null}={}){this.live.length>=iy&&this.kill(this.live[0]);let c=this.pool.pop();c||(c=new Qs(new vs({transparent:!0,depthWrite:!1,depthTest:!0})),c.renderOrder=5,this.scene.add(c));const l=oy(i);c.material.map=l,c.material.opacity=0,c.material.color.set(o||Yt(ry)),c.material.rotation=I(-.28,.28),c.material.needsUpdate=!0;let h=t,u=e,d=n;if(a){const g=t-a.x,_=n-a.z,p=Math.hypot(g,_)||1;h+=g/p*.7,d+=_/p*.7}c.position.set(h,u,d),c.visible=!0;const f=.55*s;return c.userData={t:0,h:f,aspect:l.userData.aspect,vy:I(.9,1.4),drift:I(-.3,.3)},c.scale.set(.01,.01,1),this.live.push(c),c}kill(t){const e=this.live.indexOf(t);e>=0&&this.live.splice(e,1),t.visible=!1,this.pool.push(t)}update(t){for(let e=this.live.length-1;e>=0;e--){const n=this.live[e],i=n.userData;i.t+=t;const s=i.t/ny;if(s>=1){this.kill(n);continue}let o;if(s<.18){const c=s/.18;o=1.25*Math.sin(c*Math.PI*.5)}else s<.32?o=1.25-.25*((s-.18)/.14):o=1;const a=s<.6?1:1-(s-.6)/.4;n.material.opacity=sy*Math.min(1,s/.08)*a,n.scale.set(i.h*i.aspect*o,i.h*o,1),n.position.y+=i.vy*t*(s>.3?1:.3),n.position.x+=i.drift*t}}}const cy={absorb:4054167,twopower:12614655,extraswitch:7252223},ly={enlarge:16747586,fireball:16728128,landing:16765286};function Xc(r,t,e){return r.material.emissive=new nt(t).multiplyScalar(e),r}function hy(r){const t=new je;if(Kn.props.pill)return t.add(Xc(oi("pill",r),r,.25)),t.rotation.z=Math.PI/5,t;const e=new dn({color:r,emissive:r,emissiveIntensity:.5}),n=new dn({color:15922424,emissive:15922424,emissiveIntensity:.25}),i=new jt(new go(.22,.3,4,10),e),s=new jt(new go(.225,.02,4,10),n);return s.position.y=-.16,t.add(i,s),t.rotation.z=Math.PI/5,t}function uy(r){const t=new je;if(Kn.props.potion){const o=Xc(oi("potion",r),r,.25);return o.position.y=-.45,t.add(o),t}const e=new dn({color:r,emissive:r,emissiveIntensity:.55,transparent:!0,opacity:.9}),n=new jt(new Lo(.32,12,10),e);n.scale.y=1.15;const i=new jt(new qn(.09,.11,.28,8),e);i.position.y=.42;const s=new jt(new qn(.1,.1,.1,8),new dn({color:9070146}));return s.position.y=.6,t.add(n,i,s),t}function dy(){if(Kn.props.token){const e=oi("token"),n=e.geometry.clone();n.computeBoundingBox();const i=n.boundingBox.getCenter(new A);return n.translate(-i.x,-i.y,-i.z),{geo:n,mat:Xc(e,16763210,.18).material}}const r=new qn(.34,.34,.09,14);r.rotateX(Math.PI/2);const t=new dn({color:16765286,emissive:11172382,emissiveIntensity:.6});return{geo:r,mat:t}}class fy{constructor(t,e){this.scene=t,this.world=e;const{geo:n,mat:i}=dy();this.tokenMat=i,this.tokenMesh=new Cu(n,this.tokenMat,ht.TOKEN_COUNT),this.tokenMesh.frustumCulled=!1,t.add(this.tokenMesh),this.tokens=[];for(let s=0;s<ht.TOKEN_COUNT;s++)this.tokens.push({x:0,z:0,active:!1,respawn:I(0,2),spin:I(0,Math.PI*2)});this.items=[],this._m=new Bt,this._q=new xe,this._s=new A(1,1,1),this._e=new Ce}respawnAll(){for(const t of this.tokens)this.placeToken(t);for(const t of this.items)this.scene.remove(t.mesh);this.items=[];for(let t=0;t<ht.PILL_COUNT;t++)this.spawnItem("pill");for(let t=0;t<ht.POTION_COUNT;t++)this.spawnItem("potion")}placeToken(t){const e=this.world.randomOpenPos(this.world.focus,8,95);t.x=e.x,t.z=e.z,t.active=!0}spawnItem(t){const e=t==="pill"?ht.PILLS:ht.POTIONS,n=Ju(e,c=>c.p),i=t==="pill"?cy[n.id]:ly[n.id],s=t==="pill"?hy(i):uy(i),o=this.world.randomOpenPos(this.world.focus,12,95);s.position.set(o.x,1,o.z);const a=new jt(new nr(.9,20),new ke({color:i,transparent:!0,opacity:.28,depthWrite:!1}));a.rotation.x=-Math.PI/2,a.position.y=-.85,s.add(a),this.scene.add(s),this.items.push({kind:t,def:n,mesh:s,x:o.x,z:o.z,active:!0,bobPhase:I(0,Math.PI*2),respawn:0})}update(t,e){const n=this.world.focus;for(let i=0;i<this.tokens.length;i++){const s=this.tokens[i];if(s.active&&Math.hypot(s.x-n.x,s.z-n.z)>ht.RECYCLE_DIST&&this.placeToken(s),!s.active){s.respawn-=t,s.respawn<=0&&this.placeToken(s),this._s.setScalar(.001),this._m.compose(new A(0,-10,0),this._q,this._s),this.tokenMesh.setMatrixAt(i,this._m);continue}s.spin+=t*2.2,this._e.set(0,s.spin,0),this._q.setFromEuler(this._e),this._s.setScalar(1);const o=.75+Math.sin(e*2.4+s.spin)*.12;this._m.compose(new A(s.x,o,s.z),this._q,this._s),this.tokenMesh.setMatrixAt(i,this._m)}this.tokenMesh.instanceMatrix.needsUpdate=!0;for(let i=this.items.length-1;i>=0;i--){const s=this.items[i];if(!s.active){s.respawn-=t,s.respawn<=0&&(this.scene.remove(s.mesh),this.items.splice(i,1),this.spawnItem(s.kind));continue}if(Math.hypot(s.x-n.x,s.z-n.z)>ht.RECYCLE_DIST+10){const o=this.world.randomOpenPos(n,15,95);s.x=o.x,s.z=o.z,s.mesh.position.x=o.x,s.mesh.position.z=o.z}s.mesh.rotation.y=e*1.4+s.bobPhase,s.mesh.position.y=1+Math.sin(e*2+s.bobPhase)*.18}}collectTokens(t,e,n){let i=0;for(const s of this.tokens){if(!s.active)continue;const o=s.x-t,a=s.z-e;o*o+a*a<n*n&&(s.active=!1,s.respawn=I(5,14),i++)}return i}collectItem(t,e,n){for(const i of this.items){if(!i.active)continue;const s=i.x-t,o=i.z-e;if(s*s+o*o<n*n)return i.active=!1,i.respawn=I(18,30),i.mesh.visible=!1,i}return null}setXray(t){for(const e of this.items)e.mesh.traverse(n=>{n.material&&(n.material.depthTest=!t,n.material.needsUpdate=!0)})}}const kh={flight:{idle:"ninja_idle_3",cast:"spell_cast",build:{height:1,shoulder:1,mass:.95,waist:.9,legLen:1.02,definition:.9},age:32,hair:"surfer",hairColor:13214298,facialHair:null,gear:["aviatorGoggles"],cape:"short",palette:{primary:2908121,secondary:1188943,accent:16052710,glow:9358335},hueRange:.12,suit:"flight",combat:{style:"aerial",speed:1.1,damage:46,range:2.6,arc:.4,moves:["flying_kick","jab_cross","side_kick","roundhouse_kick_2"]}},speed:{idle:"ninja_idle_3",cast:"spell_cast",build:{height:.96,shoulder:.88,mass:.75,waist:.82,legLen:1.05,definition:.85},age:22,hair:"spiky",hairColor:2367775,facialHair:null,gear:["speedShades","lightningBoots"],cape:null,palette:{primary:15905306,secondary:11740702,accent:16774084,glow:16770140},hueRange:.1,suit:"speed",combat:{style:"flurry",speed:1.55,damage:30,range:2.3,arc:.45,moves:["jab_cross","uppercut_jab","elbow_uppercut_combo","mma_kick_2"]}},invisibility:{idle:"ninja_idle_3",cast:"spell_cast",build:{height:.99,shoulder:.95,mass:.9,waist:1,legLen:1,definition:.6},age:52,hair:"bald",hairColor:0,facialHair:null,gear:["facelessMask"],cape:null,palette:{primary:7304840,secondary:3817293,accent:12173777,glow:12568542},hueRange:.15,suit:"invisibility",combat:{style:"precise",speed:1.05,damage:52,range:2.6,arc:.4,moves:["hook","standing_melee_kick","mma_kick","jab_cross"]}},telekinesis:{idle:"idle_4",cast:"standing_2h_magic_attack_03",build:{height:1.02,shoulder:1,mass:.95,waist:.92,legLen:1,definition:.8},age:41,hair:"quiff",hairColor:2759700,hairStreak:13224406,facialHair:"goatee",gear:[],cape:"medium",palette:{primary:8073151,secondary:2757698,accent:14992490,glow:12614655},hueRange:.1,suit:"telekinesis",combat:{style:"force",speed:.95,damage:50,range:3.2,arc:.5,moves:["standing_melee_attack_horizontal","mutant_swiping","hook","standing_melee_attack_360_high"]}},pyro:{idle:"ninja_idle_3",cast:"standing_1h_magic_attack_01",build:{height:.99,shoulder:.98,mass:.92,waist:.88,legLen:1,definition:.95},age:28,hair:"flame",hairColor:16742938,facialHair:null,gear:["robinMask"],cape:null,palette:{primary:14235678,secondary:2823184,accent:16754470,glow:16742972},hueRange:.06,suit:"pyro",combat:{style:"blazing",speed:1.15,damage:44,range:2.7,arc:.45,moves:["roundhouse_kick","hook","mma_kick_3","kicking"]}},cryo:{idle:"idle_4",cast:"standing_1h_magic_attack_01",build:{height:1.06,shoulder:1.18,mass:1.35,waist:1.15,legLen:.98,definition:.85},age:38,hair:"mohawk",hairColor:14216437,facialHair:"fullBeard",gear:["baneMask"],cape:"long",palette:{primary:3108776,secondary:1451578,accent:15004671,glow:10351359},hueRange:.08,suit:"cryo",combat:{style:"heavy",speed:.7,damage:92,range:2.8,arc:.45,moves:["standing_melee_attack_downward","stomp","standing_melee_attack_horizontal","standing_melee_attack_360_high"]}},teleport:{idle:"ninja_idle_3",cast:"spell_cast",build:{height:.9,shoulder:1.08,mass:1.15,waist:1.1,legLen:.92,definition:.85},age:27,hair:"buzz",hairColor:2893344,facialHair:null,gear:["bandana"],cape:null,palette:{primary:2073992,secondary:933176,accent:14090229,glow:8257482},hueRange:.12,suit:"teleport",combat:{style:"infighter",speed:1.25,damage:56,range:2,arc:.55,moves:["uppercut_jab","elbow_uppercut_combo","hook","jab_cross"]}},xray:{idle:"ninja_idle_3",cast:"spell_cast",build:{height:1.1,shoulder:.92,mass:.8,waist:.85,legLen:1.1,definition:.7},age:33,hair:"bald",hairColor:0,facialHair:"stubbleGoatee",gear:["xrayGoggles"],cape:"short",palette:{primary:1317399,secondary:658699,accent:10354524,glow:13696860},hueRange:.05,suit:"xray",combat:{style:"reach",speed:.9,damage:40,range:3.6,arc:.35,moves:["standing_melee_kick","side_kick","kicking","sword_and_shield_slash"]}},shapeshift:{idle:"idle_4",cast:"spell_cast",build:{height:.99,shoulder:.96,mass:.9,waist:.98,legLen:1,definition:.65},age:42,hair:"sidepart",hairColor:4863270,facialHair:null,gear:[],cape:null,palette:{primary:13778063,secondary:3871280,accent:16766959,glow:16752098},hueRange:.15,suit:"shapeshift",combat:{style:"morph",speed:1,damage:50,range:3,arc:.5,moves:["mutant_swiping","standing_melee_attack_horizontal","roundhouse_kick_2","hook"]}},duplication:{idle:"idle_4",cast:"spell_cast",build:{height:1.08,shoulder:1.22,mass:1.4,waist:1.05,legLen:1.02,definition:1},age:29,hair:"crew",hairColor:3811868,facialHair:null,gear:["sunglasses"],cape:null,palette:{primary:13923882,secondary:2891284,accent:3881792,glow:16757373},hueRange:.08,suit:"duplication",combat:{style:"bruiser",speed:.75,damage:86,range:2.9,arc:.45,moves:["drop_kick","standing_melee_attack_downward","stomp","standing_melee_attack_360_high"]}}},Oh=r=>kh[r]||kh.flight;function py(r,t=Math.random()){const e=(t-.5)*2*r.hueRange,n=(t*7.31%1-.5)*.12,i=(s,o=0)=>{const a=new nt(s),c={};return a.getHSL(c),a.setHSL((c.h+e+1)%1,c.s,Math.max(.05,Math.min(.92,c.l+o))),a};return{primary:i(r.palette.primary,n),secondary:i(r.palette.secondary,n*.5),accent:i(r.palette.accent,0),glow:new nt(r.palette.glow),skin:my(t),hair:new nt(r.hairColor),hairStreak:r.hairStreak?new nt(r.hairStreak):null}}const Fh=[15978408,14988428,13209443,11103558,8211505,5912098];function my(r){return new nt(Fh[Math.floor(r*13.7%1*Fh.length)])}const gy=new nt,xn=(r,t=.9)=>Math.abs(Math.atan2(Math.sin(r-Math.PI/2),Math.cos(r-Math.PI/2)))<t,Kr=(r,t,e)=>gy.copy(r).lerp(t,Math.max(0,Math.min(1,e))).clone(),Bh={flight(r,t){const{region:e,t:n,theta:i}=r;return e==="torso"?xn(i,.75)&&Math.abs(n-(.66-Math.abs(Math.sin(i-Math.PI/2))*.18))<.06?t.accent:!xn(i,1.3)||n<.12?t.secondary:t.primary:e==="foreArm"?n>.35?t.accent:t.primary:e==="hand"?t.accent:e==="shin"?n>.55?t.accent:t.secondary:e==="foot"?t.accent:e==="thigh"?t.secondary:t.primary},speed(r,t){const{region:e,t:n,theta:i}=r;if(e==="torso"){const s=Math.sin(i-Math.PI/2),o=.55+.25*s+(s>0?.1:-.1)*Math.sign(Math.sin(n*30));return xn(i,1.1)&&Math.abs(n-o)<.05?t.accent:xn(i,1.3)?t.primary:t.secondary}return e==="upperArm"?n<.25?t.secondary:t.primary:e==="foreArm"?t.secondary:e==="hand"?t.accent:e==="thigh"?t.primary:e==="shin"?n>.4?t.accent:t.secondary:e==="foot"?t.accent:t.primary},invisibility(r,t){const{region:e,t:n,theta:i}=r;if(e==="head"||e==="neck")return t.primary;const o=(Math.floor(n*8)+Math.floor(i/(Math.PI/5)))%2===0?t.primary:Kr(t.primary,t.secondary,.35);return e==="torso"&&n<.1||e==="hand"||e==="foot"?t.secondary:o},telekinesis(r,t){const{region:e,t:n,theta:i}=r;return e==="torso"?n>.9?t.accent:xn(i,.55)?t.secondary:xn(i,.7)||n<.12?t.accent:t.primary:e==="foreArm"?n>.6?t.accent:t.primary:e==="hand"||e==="thigh"||e==="shin"?t.secondary:e==="foot"?t.accent:t.primary},pyro(r,t){const{region:e,t:n,theta:i}=r,s=o=>.28+.14*Math.sin(i*3+o*7)+.08*Math.sin(i*7);return e==="torso"?n<s(n)?t.accent:n<s(n)+.1?t.primary:t.secondary:e==="foreArm"?n>.4+.1*Math.sin(i*4)?t.accent:t.primary:e==="hand"?t.accent:e==="thigh"?n<.2?t.accent:t.secondary:e==="shin"?n>.6?t.primary:t.secondary:t.primary},cryo(r,t){const{region:e,t:n,theta:i}=r;return e==="torso"?n>.86?t.accent:n<.14?t.secondary:(Math.floor(n*6)+Math.floor(i/(Math.PI/4)))%2===0?t.primary:Kr(t.primary,t.secondary,.25):e==="upperArm"?n<.3?t.accent:t.primary:e==="foreArm"?n>.7?t.accent:t.primary:e==="hand"||e==="thigh"?t.secondary:e==="shin"?n>.45?t.accent:t.secondary:e==="foot"?t.secondary:t.primary},teleport(r,t){const{region:e,t:n,theta:i}=r;return e==="torso"?Math.abs(n*5%1-.5)<.05||Math.abs(i/(Math.PI/3)%1-.5)<.05?t.accent:xn(i,.35)&&n>.55&&n<.8?t.glow:n<.12?t.secondary:t.primary:e==="upperArm"||e==="thigh"?t.secondary:e==="foreArm"||e==="shin"?n>.5?t.primary:t.secondary:e==="hand"||e==="foot"?t.accent:t.primary},xray(r,t){const{region:e,t:n,theta:i}=r;return Math.abs((n*9+Math.sin(i*2)*.5)%1-.5)<.04&&Math.sin(i*5)>.3&&e!=="head"||e==="torso"&&n<.1?t.accent:e==="hand"||e==="foot"?t.secondary:e==="torso"?t.primary:t.secondary},shapeshift(r,t){const{region:e,t:n,theta:i}=r,s=Math.floor(n*7)%2===0;return e==="torso"?xn(i,.5)&&n>.5?t.accent:xn(i,.12)&&n>.35&&n<.9?t.secondary:s?t.primary:Kr(t.primary,t.secondary,.4):e==="hand"||e==="foot"?t.secondary:s?t.primary:Kr(t.primary,t.secondary,.4)},duplication(r,t){const{region:e,t:n,theta:i}=r;return e==="torso"?n>.35&&n<.88&&(xn(i,.95)||!xn(i,2.2))||n<.14?t.accent:n<.22&&Math.floor(i/(Math.PI/4))%2===0?t.secondary:t.primary:e==="upperArm"?n<.35?t.accent:t.primary:e==="foreArm"?n>.5?t.secondary:t.primary:e==="hand"?t.secondary:e==="thigh"?t.primary:e==="shin"?n>.5?t.secondary:t.primary:e==="foot"?t.secondary:t.primary}},vo=Math.PI*2,zn=r=>Math.max(0,Math.min(1,r)),Ft=(r,t)=>Math.exp(-(r*r)/(2*t*t)),ii=(r,t)=>Math.atan2(Math.sin(r-t),Math.cos(r-t)),Qu=r=>(r=zn(r),r*r*(3-2*r)),lt={hips:"mixamorigHips",spine:"mixamorigSpine",spine1:"mixamorigSpine1",spine2:"mixamorigSpine2",neck:"mixamorigNeck",head:"mixamorigHead",headTop:"mixamorigHeadTop_End",L:{shoulder:"mixamorigLeftShoulder",arm:"mixamorigLeftArm",foreArm:"mixamorigLeftForeArm",hand:"mixamorigLeftHand",upLeg:"mixamorigLeftUpLeg",leg:"mixamorigLeftLeg",foot:"mixamorigLeftFoot",toe:"mixamorigLeftToeBase",toeEnd:"mixamorigLeftToe_End"},R:{shoulder:"mixamorigRightShoulder",arm:"mixamorigRightArm",foreArm:"mixamorigRightForeArm",hand:"mixamorigRightHand",upLeg:"mixamorigRightUpLeg",leg:"mixamorigRightLeg",foot:"mixamorigRightFoot",toe:"mixamorigRightToeBase",toeEnd:"mixamorigRightToe_End"}};class _y{constructor(t){this.BI=t,this.pos=[],this.col=[],this.si=[],this.sw=[],this.idx=[],this.n=0}vertex(t,e,n){this.pos.push(t.x,t.y,t.z),this.col.push(e.r,e.g,e.b);const i=n.slice(0,4);for(;i.length<4;)i.push([0,0]);let s=0;for(const[,o]of i)s+=o;for(const[o,a]of i)this.si.push(this.BI[o]??0),this.sw.push(s>0?a/s:0);return this.n++}tri(t,e,n){this.idx.push(t,e,n)}quad(t,e,n,i){this.idx.push(t,e,n,t,n,i)}tube({from:t,to:e,rings:n,segs:i,radius:s,bump:o,color:a,weights:c,frame:l,closeStart:h=!1,closeEnd:u=!1}){const d=e.clone().sub(t),f=this.n,g=[];for(let _=0;_<n;_++){const p=_/(n-1),m=t.clone().addScaledVector(d,p);g.push(m);const{rx:x,rz:y}=s(p);for(let v=0;v<i;v++){const R=v/i*vo,b=1+(o?o(p,R):0)/((x+y)*.5),L=m.clone().addScaledVector(l.u,x*Math.cos(R)*b).addScaledVector(l.v,y*Math.sin(R)*b);this.vertex(L,a(p,R),c(p))}}for(let _=0;_<n-1;_++)for(let p=0;p<i;p++){const m=f+_*i+p,x=f+_*i+(p+1)%i,y=f+(_+1)*i+(p+1)%i,v=f+(_+1)*i+p;this.quad(m,x,y,v)}if(h){const _=this.vertex(g[0],a(0,0),c(0));for(let p=0;p<i;p++)this.tri(_,f+(p+1)%i,f+p)}if(u){const _=f+(n-1)*i,p=this.vertex(g[n-1],a(1,0),c(1));for(let m=0;m<i;m++)this.tri(p,_+m,_+(m+1)%i)}}sphere({center:t,radii:e,wSeg:n=14,hSeg:i=10,color:s,weights:o,displace:a,filter:c}){const l=this.n,h=[];for(let u=0;u<=i;u++){const f=u/i*Math.PI,g=[];for(let _=0;_<=n;_++){const m=_/n*vo,x=new A(-Math.cos(m)*Math.sin(f),Math.cos(f),Math.sin(m)*Math.sin(f));let y=1;a&&(y+=a(x));const v=new A(x.x*e.x*y,x.y*e.y*y,x.z*e.z*y).add(t),R=!c||c(x);g.push(R?this.vertex(v,typeof s=="function"?s(x):s,o):-1)}h.push(g)}for(let u=0;u<i;u++)for(let d=0;d<n;d++){const f=h[u][d],g=h[u][d+1],_=h[u+1][d+1],p=h[u+1][d];f<0||g<0||_<0||p<0||(u!==0&&this.tri(f,g,p),u!==i-1&&this.tri(g,_,p))}return l}box({center:t,size:e,color:n,weights:i,rot:s=null}){const o=new wn(e.x,e.y,e.z).toNonIndexed();s&&o.applyQuaternion(s),o.translate(t.x,t.y,t.z);const a=o.attributes.position,c=this.n;for(let l=0;l<a.count;l++)this.vertex(new A(a.getX(l),a.getY(l),a.getZ(l)),n,i);for(let l=0;l<a.count;l+=3)this.tri(c+l,c+l+1,c+l+2)}cone({center:t,radius:e,height:n,color:i,weights:s,rot:o=null,segs:a=7}){const c=new ir(e,n,a).toNonIndexed();o&&c.applyQuaternion(o),c.translate(t.x,t.y,t.z);const l=c.attributes.position,h=this.n;for(let u=0;u<l.count;u++)this.vertex(new A(l.getX(u),l.getY(u),l.getZ(u)),i,s);for(let u=0;u<l.count;u+=3)this.tri(h+u,h+u+1,h+u+2)}build(){const t=new Me;return t.setAttribute("position",new ee(this.pos,3)),t.setAttribute("color",new ee(this.col,3)),t.setAttribute("skinIndex",new To(this.si,4)),t.setAttribute("skinWeight",new ee(this.sw,4)),t.setIndex(this.idx),t.computeVertexNormals(),t}}function zh(r){return t=>{if(t<=r[0][0])return r[0][1];for(let e=0;e<r.length-1;e++){const[n,i]=r[e],[s,o]=r[e+1];if(t<=s)return i+(o-i)*Qu((t-n)/(s-n))}return r[r.length-1][1]}}function vi(r){const t=r.clone().normalize();let e=new A(0,0,1).addScaledVector(t,-t.z);return e.lengthSq()<1e-4&&(e=new A(0,1,0).addScaledVector(t,-t.y)),e.normalize(),{u:t.clone().cross(e).normalize(),v:e}}function xy(r,t,{faceless:e=!1}={}){const n=Kn.heroes[r.suit];if(n)return kv(r,t,n);const i=r.build,s=i.mass,o=i.definition,a=Jt.unitHeight,c=Jt.bones.concat([lt.headTop,lt.L.toeEnd,lt.R.toeEnd]),l={};for(const z of c){const C=Jt.skeleton[z],M=new Ro;M.name=z,M.position.fromArray(C.pos),M.quaternion.fromArray(C.quat),M.userData.restQuat=M.quaternion.clone(),M.userData.restPos=M.position.clone(),l[z]=M}for(const z of c){const C=Jt.skeleton[z].parent;C&&l[C]&&l[C].add(l[z])}for(const z of["L","R"])l[lt[z].leg].position.multiplyScalar(i.legLen),l[lt[z].foot].position.multiplyScalar(i.legLen),l[lt[z].arm].position.multiplyScalar(i.shoulder);const h=Jt.skeleton[lt.L.leg].pos,u=Jt.skeleton[lt.L.foot].pos,f=(Math.hypot(...h)+Math.hypot(...u))*(i.legLen-1);l[lt.hips].updateMatrixWorld(!0);const g=z=>{const C=new A;return l[z].getWorldPosition(C),C},_=Object.fromEntries(c.map((z,C)=>[z,C])),p=new _y(_),m=Bh[r.suit]||Bh.flight,x=(z,C,M,F,j)=>m({region:z,t:C,theta:M,y:F/a,side:j},t),y=t.skin,v=g(lt.hips),R=g(lt.neck),T=g(lt.head),b=g(lt.headTop),L=g(lt.spine),w=g(lt.spine1),S=g(lt.spine2),P=g(lt.L.arm),U=g(lt.R.arm),O=Math.abs(P.x-U.x)/2,q=(P.y+U.y)/2,Y=v.clone().add(new A(0,-.07*a,0)),W=R.clone(),$=W.clone().sub(Y),X=vi($),dt=zh([[0,.088*a*(.9+.1*i.waist)],[.2,.076*a*i.waist],[.5,.098*a*(.55+.45*i.shoulder)],[.72,.112*a*i.shoulder],[.86,.128*a*i.shoulder],[1,.05*a]]),_t=zh([[0,.062*a*(.8+.2*i.waist)],[.2,.052*a*i.waist],[.5,.066*a*(.7+.3*s)],[.72,.074*a*(.7+.3*s)],[.86,.068*a],[1,.05*a]]),St=[[lt.hips,Y.y],[lt.spine,L.y],[lt.spine1,w.y],[lt.spine2,S.y],[lt.neck,R.y]],Xt=z=>{const C=Y.y+$.y*z;for(let M=0;M<St.length-1;M++){const[F,j]=St[M],[et,Q]=St[M+1];if(C<=Q){const Tt=Qu((C-j)/Math.max(1e-6,Q-j));return[[F,1-Tt],[et,Tt]]}}return[[lt.neck,1]]},ne=(z,C)=>{const M=ii(C,Math.PI/2),F=ii(C,3*Math.PI/2);let j=0;j+=.013*a*o*s*(Ft(M-.4,.3)+Ft(M+.4,.3))*Ft(z-.7,.085);for(const et of[.31,.42,.53])j+=.0062*a*o*(Ft(M-.17,.13)+Ft(M+.17,.13))*Ft(z-et,.04);return j+=.004*a*o*(Ft(M-.85,.2)+Ft(M+.85,.2))*Ft(z-.45,.12),j+=.009*a*s*(Ft(F-.55,.32)+Ft(F+.55,.32))*Ft(z-.66,.14),j+=.006*a*s*Ft(F,.5)*Ft(z-.9,.08),j-=.0045*a*Ft(F,.12)*Ft(z-.55,.3),j-=.002*a*Ft(M,.06)*Ft(z-.7,.1),j};p.tube({from:Y,to:W,rings:18,segs:22,frame:X,radius:z=>({rx:dt(z),rz:_t(z)}),bump:ne,color:(z,C)=>x("torso",z,C,Y.y+$.y*z,0),weights:Xt,closeStart:!0});const Z=T.clone().lerp(b,.5).add(new A(0,0,.006*a));p.tube({from:R.clone().add(new A(0,-.012*a,0)),to:new A(Z.x,Z.y-.055*a,Z.z),rings:4,segs:12,frame:X,radius:z=>({rx:.031*a*Math.sqrt(s)*(1+.15*z),rz:.03*a*Math.sqrt(s)}),color:(z,C)=>e?x("neck",z,C,R.y,0):y,weights:z=>z<.4?[[lt.neck,1]]:[[lt.neck,1-(z-.4)/.6*.6],[lt.head,(z-.4)/.6*.6]]});const st=new A(.066*a,.078*a,.071*a),pt=[[lt.head,1]],Mt=z=>{let C=0;const M=zn((-z.y-.15)/.85);return C-=.16*M*(Math.abs(z.x)*.9+.15)*(z.z<0?.6:1),C+=.05*Ft(z.y+.78,.15)*zn(z.z),C+=.05*Ft(z.y-.32,.1)*zn(z.z-.35)*(1-.5*Ft(z.x,.12)),C-=.06*(Ft(z.x-.4,.18)+Ft(z.x+.4,.18))*Ft(z.y-.16,.13)*zn(z.z-.3),C+=.035*(Ft(z.x-.62,.2)+Ft(z.x+.62,.2))*Ft(z.y+.08,.14)*zn(z.z),C-=.03*(Ft(z.x-.8,.2)+Ft(z.x+.8,.2))*Ft(z.y-.3,.2),C+=.04*zn(-z.z-.3)*zn(z.y+.2),C};p.sphere({center:Z,radii:st,wSeg:20,hSeg:14,color:e?x("head",.5,0,Z.y,0):y,weights:pt,displace:Mt});const Ct=Z,Pt=st;if(!e){p.box({center:Ct.clone().add(new A(0,-.004*a,Pt.z*.96)),size:new A(.017*a,.04*a,.026*a),color:y,weights:pt,rot:new xe().setFromEuler(new Ce(.35,0,0))}),p.box({center:Ct.clone().add(new A(0,-.022*a,Pt.z*1.02)),size:new A(.024*a,.014*a,.02*a),color:y,weights:pt});for(const M of[-1,1])p.sphere({center:Ct.clone().add(new A(M*Pt.x*.98,-.004*a,-.008*a)),radii:new A(.007*a,.02*a,.014*a),wSeg:8,hSeg:6,color:y,weights:pt});const z=t.hair.clone().multiplyScalar(.55),C=new nt(1316896);for(const M of[-1,1])p.box({center:Ct.clone().add(new A(M*.03*a,.027*a,Pt.z*.9)),size:new A(.036*a,.006*a,.012*a),color:z,weights:pt,rot:new xe().setFromEuler(new Ce(0,0,M*-.12))}),p.sphere({center:Ct.clone().add(new A(M*.028*a,.012*a,Pt.z*.86)),radii:new A(.012*a,.008*a,.008*a),wSeg:8,hSeg:5,color:C,weights:pt});p.box({center:Ct.clone().add(new A(0,-.046*a,Pt.z*.92)),size:new A(.028*a,.004*a,.008*a),color:y.clone().multiplyScalar(.7),weights:pt})}vy(p,r.hair,t,Ct,Pt,a,pt),r.facialHair&&yy(p,r.facialHair,t,Ct,Pt,a,pt);for(const z of["L","R"]){const C=z==="L"?1:-1,M=g(lt[z].arm),F=g(lt[z].foreArm),j=g(lt[z].hand),et=j.clone().sub(F).normalize(),Q=j.clone().addScaledVector(et,.085*a),Tt=M.distanceTo(F),ut=F.distanceTo(j),xt=vi(F.clone().sub(M)),Ot=vi(j.clone().sub(F)),it=vi(et);p.sphere({center:M.clone().add(new A(0,-.006*a,0)),radii:new A(.034*a*s,.036*a*s,.034*a*s),wSeg:12,hSeg:8,color:H=>x("upperArm",.02,Math.atan2(H.z,H.x),M.y,C),weights:[[lt[z].arm,.75],[lt[z].shoulder,.25]]}),p.tube({from:M,to:F,rings:9,segs:12,frame:xt,radius:H=>{const vt=.036*a*s*(1.1-.25*H);return{rx:vt,rz:vt*1.05}},bump:(H,vt)=>{const Lt=ii(vt,Math.PI/2),yt=ii(vt,3*Math.PI/2);return .008*a*o*s*Ft(Lt,.55)*Ft(H-.5,.18)+.006*a*o*s*Ft(yt,.6)*Ft(H-.55,.2)},color:(H,vt)=>x("upperArm",H,vt,M.y-Tt*H,C),weights:H=>H<.16?[[lt[z].arm,1-(.16-H)/.16*.35],[lt[z].shoulder,(.16-H)/.16*.35]]:H>.82?[[lt[z].arm,1-(H-.82)/.18*.5],[lt[z].foreArm,(H-.82)/.18*.5]]:[[lt[z].arm,1]]}),p.sphere({center:F,radii:new A(.028*a*s,.03*a*s,.03*a*s),wSeg:10,hSeg:7,color:H=>x("foreArm",.02,Math.atan2(H.z,H.x),F.y,C),weights:[[lt[z].arm,.5],[lt[z].foreArm,.5]]}),p.tube({from:F,to:j,rings:8,segs:12,frame:Ot,radius:H=>{const vt=.03*a*Math.sqrt(s)*(1+.15*Ft(H-.25,.2)-.35*H);return{rx:vt*1.05,rz:vt}},color:(H,vt)=>x("foreArm",H,vt,F.y-ut*H,C),weights:H=>H<.18?[[lt[z].foreArm,1-(.18-H)/.18*.5],[lt[z].arm,(.18-H)/.18*.5]]:H>.86?[[lt[z].foreArm,1-(H-.86)/.14*.5],[lt[z].hand,(H-.86)/.14*.5]]:[[lt[z].foreArm,1]]}),p.tube({from:j,to:Q,rings:4,segs:10,frame:it,radius:H=>({rx:.013*a*(1+.2*Math.sin(H*Math.PI)),rz:.024*a*(1+.3*Math.sin(H*Math.PI))}),color:(H,vt)=>x("hand",H,vt,j.y,C),weights:H=>H<.3?[[lt[z].hand,.7],[lt[z].foreArm,.3]]:[[lt[z].hand,1]],closeEnd:!0})}for(const z of["L","R"]){const C=z==="L"?1:-1,M=g(lt[z].upLeg),F=g(lt[z].leg),j=g(lt[z].foot),et=g(lt[z].toeEnd),Q=M.distanceTo(F),Tt=F.distanceTo(j),ut=vi(F.clone().sub(M)),xt=vi(j.clone().sub(F));p.tube({from:M.clone().add(new A(0,.03*a,0)),to:F,rings:10,segs:14,frame:ut,radius:H=>{const vt=.058*a*Math.sqrt(s)*(.5+.5*i.waist)*(1.05-.38*H);return{rx:vt,rz:vt*1.08}},bump:(H,vt)=>{const Lt=ii(vt,Math.PI/2),yt=ii(vt,3*Math.PI/2);return .009*a*o*s*(Ft(Lt-.3,.35)+Ft(Lt+.3,.35))*Ft(H-.55,.22)+.007*a*o*s*Ft(yt,.6)*Ft(H-.4,.22)},color:(H,vt)=>x("thigh",H,vt,M.y-Q*H,C),weights:H=>H<.15?[[lt[z].upLeg,1-(.15-H)/.15*.4],[lt.hips,(.15-H)/.15*.4]]:H>.84?[[lt[z].upLeg,1-(H-.84)/.16*.5],[lt[z].leg,(H-.84)/.16*.5]]:[[lt[z].upLeg,1]]}),p.sphere({center:F,radii:new A(.036*a*Math.sqrt(s),.04*a,.038*a),wSeg:10,hSeg:7,color:H=>x("shin",.02,Math.atan2(H.z,H.x),F.y,C),weights:[[lt[z].upLeg,.5],[lt[z].leg,.5]]}),p.tube({from:F,to:j,rings:9,segs:12,frame:xt,radius:H=>{const vt=.037*a*Math.sqrt(s)*(1.05-.4*H);return{rx:vt,rz:vt*1.05}},bump:(H,vt)=>{const Lt=ii(vt,3*Math.PI/2);return .011*a*o*s*Ft(Lt,.55)*Ft(H-.3,.16)+.003*a*o*Ft(ii(vt,Math.PI/2),.25)*Ft(H-.5,.3)},color:(H,vt)=>x("shin",H,vt,F.y-Tt*H,C),weights:H=>H<.16?[[lt[z].leg,1-(.16-H)/.16*.5],[lt[z].upLeg,(.16-H)/.16*.5]]:H>.86?[[lt[z].leg,1-(H-.86)/.14*.45],[lt[z].foot,(H-.86)/.14*.45]]:[[lt[z].leg,1]]});const Ot=new A(j.x,et.y+.012*a,j.z-.035*a),it=new A(et.x,et.y+.01*a,et.z+.01*a);p.tube({from:Ot,to:it,rings:5,segs:10,frame:vi(it.clone().sub(Ot)),radius:H=>({rx:.032*a*(1+.25*Math.sin(H*Math.PI)),rz:.02*a*(1.3-.6*H)}),color:(H,vt)=>x("foot",H,vt,j.y,C),weights:H=>H<.55?[[lt[z].foot,1]]:[[lt[z].foot,.5],[lt[z].toe,.5]],closeStart:!0,closeEnd:!0})}Sy(p,r,t,S.y+.02*a,_t(.72),a,lt.spine2);for(const z of r.gear)My(p,z,t,Ct,Pt,a,pt);const Wt=p.build();Wt.boundingSphere=new fn(new A(0,a*.5,0),a*1.4);const me=new Po({vertexColors:!0,roughness:.62,metalness:.04}),D=new Eo(Wt,me);D.add(l[lt.hips]),l[lt.hips].updateMatrixWorld(!0),D.bind(new er(c.map(z=>l[z])));const de=[],$t=l[lt.head],Qt=$t.worldToLocal(Ct.clone());if(r.hair==="flame"&&de.push(by($t,Qt,Pt,a)),r.gear.includes("xrayGoggles")&&de.push(wy($t,Qt,Pt,a,t.glow)),r.gear.includes("lightningBoots"))for(const z of["L","R"])de.push(Ty(l[lt[z].leg],g(lt[z].leg).distanceTo(g(lt[z].foot)),a,t.glow));const At=l[lt.spine2],ve=[],Nt=7;for(let z=0;z<Nt;z++){const C=z/(Nt-1)-.5,M=new A(C*O*1.35,q+.012*a,-_t(.86)*.85);ve.push(At.worldToLocal(M))}return{mesh:D,bones:l,extras:de,pins:ve,H:a,hipsYOffset:f,torsoRadius:dt(.72)*1.05,capeWidth:O*1.35*2}}function vy(r,t,e,n,i,s,o){const a=e.hair,c=(l,h,u={})=>r.sphere({center:n,radii:i.clone().multiplyScalar(1+h),wSeg:20,hSeg:12,color:a,weights:o,filter:d=>d.y>l&&!(d.z>.42&&d.y<(u.fringe??.5))&&!(u.flatTop&&d.y>.985),displace:u.displace});switch(t){case"surfer":c(-.25,.09,{fringe:.35,displace:l=>.05*Math.sin(l.x*14+l.y*9)*Math.sin(l.z*11)});for(const[l,h]of[[-.85,.1],[.85,.1],[-.6,-.65],[.6,-.65],[0,-.95],[-.95,-.35],[.95,-.35]])r.sphere({center:new A(n.x+l*i.x*1.05,n.y-.035*s,n.z+h*i.z*1.05),radii:new A(.012*s,.05*s,.016*s),wSeg:7,hSeg:6,color:a,weights:o});break;case"spiky":c(.02,.05);for(let l=0;l<9;l++){const h=l/9*vo,u=new A(Math.cos(h)*.33,1,Math.sin(h)*.28-.15).normalize(),d=n.clone().add(new A(u.x*i.x,u.y*i.y,u.z*i.z)),f=new xe().setFromUnitVectors(new A(0,1,0),u);r.cone({center:d.clone().addScaledVector(u,.028*s),radius:.016*s,height:.065*s,color:a,weights:o,rot:f,segs:6})}break;case"quiff":{c(-.05,.06,{fringe:.45});const l=new xe().setFromEuler(new Ce(-.5,.35,.25));r.sphere({center:n.clone().add(new A(.012*s,i.y*.98,i.z*.25)),radii:new A(.055*s,.026*s,.048*s),wSeg:12,hSeg:8,color:a,weights:o,displace:h=>.08*Math.sin(h.x*9)*Math.sin(h.z*7)}),e.hairStreak&&r.box({center:n.clone().add(new A(.03*s,i.y*1.03,i.z*.3)),size:new A(.016*s,.03*s,.06*s),color:e.hairStreak,weights:o,rot:l});break}case"flame":c(.1,.05);break;case"mohawk":{for(let h=0;h<9;h++){const u=h/8,d=(.75-1.5*u)*i.z,f=Math.sqrt(Math.max(0,1-(d/i.z)**2))*i.y,g=(.075+.03*Math.sin(u*Math.PI))*s;r.box({center:n.clone().add(new A(0,f+g/2-.006*s,d)),size:new A(.018*s,g,i.z*1.5/9*1.15),color:a,weights:o,rot:new xe().setFromEuler(new Ce((u-.5)*.8,0,0))})}break}case"buzz":c(.05,.02);break;case"sidepart":c(-.02,.05,{fringe:.4,displace:l=>l.x>.15?.05:0}),r.box({center:n.clone().add(new A(.02*s,i.y*1.04,0)),size:new A(.004*s,.004*s,i.z*1.1),color:a.clone().multiplyScalar(.55),weights:o});break;case"crew":c(.15,.035,{flatTop:!0});break}}function yy(r,t,e,n,i,s,o){const a=e.hair.clone().multiplyScalar(.9);if(t==="goatee"||t==="stubbleGoatee"){const c=t==="goatee"?a:e.skin.clone().lerp(new nt(2761760),.55);r.box({center:n.clone().add(new A(0,-.062*s,i.z*.82)),size:new A(.028*s,.03*s,.016*s),color:c,weights:o}),r.box({center:n.clone().add(new A(0,-.033*s,i.z*.95)),size:new A(.034*s,.006*s,.008*s),color:c,weights:o})}else t==="fullBeard"&&r.sphere({center:n.clone().add(new A(0,-.012*s,.004*s)),radii:new A(i.x*1.06,i.y*1.02,i.z*1.08),wSeg:18,hSeg:12,color:a,weights:o,filter:c=>c.y<-.28&&c.z>-.1&&!(c.z>.75&&c.y>-.5),displace:c=>.06*Math.sin(c.x*15)*Math.sin(c.y*12)+.1*zn(-c.y-.6)})}function My(r,t,e,n,i,s,o){const a=new nt(1316380),c=n.y+.012*s,l=(u,d,f)=>r.tube({from:new A(n.x,u-d/2,n.z),to:new A(n.x,u+d/2,n.z),rings:2,segs:18,frame:{u:new A(1,0,0),v:new A(0,0,1)},radius:()=>({rx:i.x*1.06,rz:i.z*1.06}),color:()=>f,weights:()=>o}),h=(u,d,f)=>new A(n.x+u,n.y+d,n.z+f);switch(t){case"aviatorGoggles":{l(c,.02*s,new nt(5916208));for(const u of[-1,1]){const d=h(u*.03*s,.012*s,i.z*.98);r.sphere({center:d,radii:new A(.026*s,.02*s,.012*s),wSeg:12,hSeg:6,color:new nt(9075285),weights:o}),r.sphere({center:d.clone().add(new A(0,0,.006*s)),radii:new A(.02*s,.015*s,.01*s),wSeg:12,hSeg:6,color:new nt(2902638),weights:o})}break}case"speedShades":r.box({center:h(0,.012*s,i.z*.95),size:new A(.11*s,.02*s,.014*s),color:new nt(3804434),weights:o});for(const u of[-1,1])r.box({center:h(u*i.x*.95,.012*s,i.z*.3),size:new A(.006*s,.008*s,i.z*1.3),color:a,weights:o});break;case"facelessMask":l(n.y-.06*s,.006*s,e.secondary);break;case"robinMask":{r.box({center:h(0,.012*s,i.z*.93),size:new A(.1*s,.03*s,.012*s),color:a,weights:o});for(const u of[-1,1])r.box({center:h(u*.058*s,.026*s,i.z*.72),size:new A(.026*s,.014*s,.012*s),color:a,weights:o,rot:new xe().setFromEuler(new Ce(0,u*.6,u*.5))}),r.sphere({center:h(u*.028*s,.012*s,i.z*.99),radii:new A(.011*s,.006*s,.004*s),wSeg:8,hSeg:4,color:new nt(15921906),weights:o});break}case"baneMask":{const u=new nt(3817290);r.sphere({center:h(0,-.01*s,.006*s),radii:new A(i.x*1.1,i.y*1.05,i.z*1.12),wSeg:18,hSeg:12,color:u,weights:o,filter:d=>d.y<-.12&&d.z>.05&&!(d.y<-.9)});for(const d of[-1,1]){for(let f=0;f<3;f++)r.box({center:h(d*(.02+f*.018)*s,-.045*s,i.z*.95-f*.008*s),size:new A(.01*s,.03*s,.012*s),color:new nt(9081763),weights:o});r.box({center:h(d*i.x*.9,-.03*s,i.z*.45),size:new A(.012*s,.012*s,.06*s),color:u.clone().multiplyScalar(.7),weights:o})}break}case"bandana":{l(c,.032*s,e.accent),r.sphere({center:h(0,.012*s,-i.z*1.02),radii:new A(.016*s,.014*s,.014*s),wSeg:8,hSeg:6,color:e.accent,weights:o});for(const u of[-1,1])r.box({center:h(u*.018*s,-.033*s,-i.z*1.05),size:new A(.018*s,.08*s,.004*s),color:e.accent,weights:o,rot:new xe().setFromEuler(new Ce(.25,0,u*.25))});for(const u of[-1,1])r.box({center:h(u*.028*s,.012*s,i.z*1.08),size:new A(.026*s,.006*s,.004*s),color:a,weights:o});break}case"xrayGoggles":l(c,.016*s,a);for(const u of[-1,1])r.sphere({center:h(u*.03*s,.012*s,i.z*.97),radii:new A(.024*s,.024*s,.014*s),wSeg:12,hSeg:6,color:new nt(2764586),weights:o});break;case"sunglasses":r.box({center:h(0,.012*s,i.z*.96),size:new A(.096*s,.022*s,.012*s),color:a,weights:o});for(const u of[-1,1])r.box({center:h(u*i.x*.96,.016*s,i.z*.3),size:new A(.005*s,.006*s,i.z*1.3),color:a,weights:o});break}}function Sy(r,t,e,n,i,s,o){const a=[[o,1]],c=i+.016*s,l=n+.05*s,h=e.accent,u=(d,f,g,_,p=0,m=h)=>r.box({center:new A(d,l+f,c),size:new A(g,_,.008*s),color:m,weights:a,rot:new xe().setFromEuler(new Ce(0,0,p))});switch(t.suit){case"flight":u(-.03*s,0,.05*s,.012*s,.35),u(.03*s,0,.05*s,.012*s,-.35);break;case"speed":u(-.008*s,.012*s,.014*s,.03*s,.5),u(.008*s,-.012*s,.014*s,.03*s,.5);break;case"telekinesis":r.sphere({center:new A(0,l,c),radii:new A(.026*s,.018*s,.005*s),wSeg:12,hSeg:6,color:h,weights:a}),r.sphere({center:new A(0,l,c+.004*s),radii:new A(.009*s,.009*s,.004*s),wSeg:8,hSeg:5,color:e.glow,weights:a});break;case"pyro":r.cone({center:new A(0,l+.006*s,c),radius:.02*s,height:.045*s,color:h,weights:a,segs:6});break;case"cryo":for(let d=0;d<3;d++)u(0,0,.05*s,.007*s,d*Math.PI/3);break;case"teleport":r.sphere({center:new A(0,l,c),radii:new A(.024*s,.024*s,.005*s),wSeg:12,hSeg:6,color:h,weights:a});break;case"xray":r.sphere({center:new A(0,l,c),radii:new A(.028*s,.014*s,.005*s),wSeg:12,hSeg:6,color:h,weights:a});break;case"shapeshift":u(0,0,.028*s,.028*s,Math.PI/4);break;case"duplication":u(-.014*s,0,.012*s,.04*s),u(.014*s,0,.012*s,.04*s);break}}function by(r,t,e,n){const i=new je,s=new ke({color:16742938,transparent:!0,opacity:.95}),o=new ke({color:16765500,transparent:!0,opacity:.9}),a=[];for(let c=0;c<10;c++){const l=c/10*vo,h=Math.cos(l)*e.x*.55,u=Math.sin(l)*e.z*.5-e.z*.15,d=Math.sqrt(Math.max(0,1-(h/e.x)**2-(u/e.z)**2))*e.y,f=(.07+.04*Math.random())*n,g=new jt(new ir(.018*n,f,5),c%3===0?o:s);g.position.set(t.x+h,t.y+d+f/2-.01*n,t.z+u),g.rotation.set((Math.random()-.5)*.5,0,(Math.random()-.5)*.5),g.userData.base={rx:g.rotation.x,rz:g.rotation.z},i.add(g),a.push(g)}return r.add(i),i.userData.animate=c=>{for(let l=0;l<a.length;l++){const h=a[l],u=h.userData.base;h.scale.y=.85+.35*Math.sin(c*9+l*1.7),h.rotation.x=u.rx+Math.sin(c*7+l)*.15,h.rotation.z=u.rz+Math.cos(c*6+l*2)*.15}},i}function wy(r,t,e,n,i){const s=new je,o=new ke({color:i});for(const a of[-1,1]){const c=new jt(new nr(.017*n,12),o);c.position.set(t.x+a*.03*n,t.y+.012*n,t.z+e.z*.97+.015*n),s.add(c)}return r.add(s),s.userData.animate=a=>{s.scale.setScalar(1+.05*Math.sin(a*8))},s}function Ty(r,t,e,n){const i=new ke({color:n}),s=new je;for(let o=0;o<3;o++){const a=new jt(new wn(.014*e,.006*e,.012*e),i);a.position.set((o-1)*.008*e,t*(.55+o*.1),.036*e),a.rotation.z=.5,s.add(a)}return r.add(s),s}const jr=(r,t,e)=>Math.max(t,Math.min(e,r)),Ra=.16,Ay=11.5;class Ey{constructor(t,e,{hipsYOffset:n=0}={}){this.mesh=t,this.arch=e,this.mixer=new Cx(t),this.hips=t.skeleton.bones.find(i=>i.name===lt.hips),this.hipsYOffset=n,this.actions={},this.base=null,this.baseName=null,this.over=null,this.moveIndex=0,this.dead=!1,this.rootDelta={x:0,z:0},this.flyK=0,this.floatK=0,this.mixedHipsY=void 0,this.bones=t.skeleton.bones}action(t){let e=this.actions[t];if(!e){const n=Jt.clips[t];if(!n)return null;e=this.mixer.clipAction(n),this.actions[t]=e}return e}setBase(t,e=1){const n=this.action(t);if(n){if(this.base!==n){if(n.reset().setLoop(ac,1/0),n.clampWhenFinished=!1,n.enabled=!0,n.play(),this.over)n.setEffectiveWeight(1),n.enabled=!1,this.base&&(this.base.enabled=!1);else if(this.base){n.setEffectiveWeight(1);const i=(t==="flying"||t==="flying_idle")&&(this.baseName==="flying"||this.baseName==="flying_idle")?.55:Ra*1.6;n.crossFadeFrom(this.base,i,!1)}else n.setEffectiveWeight(1);this.base=n,this.baseName=t}n.setEffectiveTimeScale(e)}}startOverride(t,{mode:e,timeScale:n=1,end:i=1,loop:s=!1,fade:o=Ra}={}){const a=this.action(t);if(!a)return null;this.over&&this.over.action!==a?this.over.action.fadeOut(o):this.over&&this.over.action,a.reset(),a.setLoop(s?ac:cu,s?1/0:1),a.clampWhenFinished=!0,a.enabled=!0,a.setEffectiveTimeScale(n),a.setEffectiveWeight(1),a.fadeIn(o),a.play(),this.base&&this.base.fadeOut(o);const c=Jt.duration[t],l=Jt.rootXZ[t];return this.over={action:a,name:t,mode:e,end:i*c,rootPrev:[l[0],l[1]],loop:s},{duration:i*c/n,rawDuration:c,timeScale:n}}endOverride(t=Ra){this.over&&(this.over.action.fadeOut(t),this.over=null,this.base&&(this.base.enabled=!0,this.base.paused=!1,this.base.setEffectiveWeight(1),this.base.play(),this.base.fadeIn(t)))}startHeld(){if(this.dead||this.over&&this.over.mode==="held")return;const t=Jt.clips.reaction_2?"reaction_2":"reaction";this.startOverride(t,{mode:"held",loop:!0,timeScale:.7})}endHeld(){this.over&&this.over.mode==="held"&&this.endOverride()}get attacking(){return!!this.over&&this.over.mode==="attack"}get busy(){return!!this.over&&(this.over.mode==="attack"||this.over.mode==="death"||this.over.mode==="landing")}nextMove(){const t=this.arch.combat.moves,e=t[this.moveIndex%t.length];return this.moveIndex++,e}startAttack(t,e=1){const n=1.25*e,i=Jt.impacts[t]||[],s=Jt.duration[t],o=i.length?i[i.length-1]:s*.5,a=jr((o+.38)/s,.55,.95),c=this.startOverride(t,{mode:"attack",timeScale:n,end:a});if(!c)return null;const l=(i.length?i:[s*.5]).map(h=>h/n);return{duration:c.duration,hits:l,hitScale:l.length>1?.6:1}}hitReaction(){if(this.dead||this.over&&(this.over.mode==="attack"||this.over.mode==="death"))return;const t=["reaction","reaction_2","reaction_3"].filter(e=>Jt.clips[e]);t.length&&this.startOverride(t[Math.floor(Math.random()*t.length)],{mode:"hit",timeScale:1.4,end:.55})}startCast(t,e=!1){this.dead||(e?this.startOverride(t,{mode:"cast",loop:!0,timeScale:1}):this.startOverride(t,{mode:"cast",timeScale:1.3,end:.9}))}stopCast(){this.over&&this.over.mode==="cast"&&this.endOverride()}landing(){this.startOverride("superhero_landing",{mode:"landing",timeScale:1.2,end:.98})}emote(){this.busy||this.startOverride("fist_pump",{mode:"emote",timeScale:1,end:.6})}die(t="back"){const e=t==="forward"?"falling_forward_death":t==="fly"?"flying_back_death_3":"falling_back_death";this.dead=!0,this.startOverride(e,{mode:"death",timeScale:1,end:1,fade:.08})}update(t,e){if(!this.dead){let n,i=1;e.flying?(n=(e.speed<1.6||e.backward)&&Jt.clips.flying_idle?"flying_idle":"flying",i=1):e.speed>3.2?(n=e.backward?"running_backward_2":"fast_run_4",i=jr(.6+e.speed/11,.7,2.4)):e.speed>.5?(n=e.backward?"walking_backwards":"walking_2",i=jr(.5+e.speed/3.2,.6,1.6)):(n=this.arch.idle||"idle_4",i=1),Jt.clips[n]||(n="idle_4"),this.setBase(n,i)}if(this.rootDelta.x=0,this.rootDelta.z=0,this.over){const n=this.over,i=n.action.time,s=Jt.rootXZ[n.name];if(s){const o=Jt.fps,a=s.length/2,c=jr(i*o,0,a-1),l=Math.floor(c),h=Math.min(a-1,l+1),u=c-l,d=s[l*2]+(s[h*2]-s[l*2])*u,f=s[l*2+1]+(s[h*2+1]-s[l*2+1])*u;n.mode!=="cast"&&n.mode!=="hit"&&(this.rootDelta.x=d-n.rootPrev[0],this.rootDelta.z=f-n.rootPrev[1]),n.rootPrev[0]=d,n.rootPrev[1]=f}!n.loop&&i>=n.end&&n.mode!=="death"&&this.endOverride()}if(this.hips&&this.mixedHipsY!==void 0&&(this.hips.position.y=this.mixedHipsY),this.mixer.update(t),this.flyK+=((e.flying?1:0)-this.flyK)*Math.min(1,t*7),this.hips&&(this.mixedHipsY=this.hips.position.y),this.floatK+=((e.float&&!this.over?1:0)-this.floatK)*Math.min(1,t*7),this.floatK>.002){for(const n of this.bones){const i=n.userData.restQuat;i&&n.quaternion.slerp(i,this.floatK)}if(this.hips){const n=this.hips.userData.restPos?.y??this.hips.position.y;this.hips.position.y+=(n-this.hips.position.y)*this.floatK}}return this.hips&&(this.hips.position.y+=this.hipsYOffset-Ay*this.flyK*(1-this.floatK)),{root:this.rootDelta}}dispose(){this.mixer.stopAllAction(),this.mixer.uncacheRoot(this.mesh)}}const $r=1/60,Ry=-9.8,an={damping:.92,trail:.45,flutter:.6,maxStep:.2,bend:.55,iterations:4,maxSwing:.65};class Cy{constructor(t,{rows:e,cols:n,width:i,length:s,color:o}){this.scene=t,this.rows=e,this.cols=n,this.baseWidth=i,this.baseLength=s,this.n=e*n,this.pos=new Float32Array(this.n*3),this.prev=new Float32Array(this.n*3),this.scale=1,this.acc=0,this.initialized=!1;const a=new Me;a.setAttribute("position",new ue(this.pos,3));const c=[];for(let d=0;d<e-1;d++)for(let f=0;f<n-1;f++){const g=d*n+f,_=g+1,p=g+n,m=p+1;c.push(g,p,_,_,p,m)}a.setIndex(c);const l=new Float32Array(this.n*3),h=new nt(o),u=h.clone().multiplyScalar(.72);for(let d=0;d<e;d++){const f=d/(e-1);for(let g=0;g<n;g++){const _=(d*n+g)*3;l[_]=h.r+(u.r-h.r)*f,l[_+1]=h.g+(u.g-h.g)*f,l[_+2]=h.b+(u.b-h.b)*f}}a.setAttribute("color",new ue(l,3)),this.mesh=new jt(a,new dn({vertexColors:!0,side:Ye})),this.mesh.frustumCulled=!1,this.mesh.castShadow=tn.shadows,t.add(this.mesh),this.buildConstraints(),this._v=new A,this._w=new A}buildConstraints(){const{rows:t,cols:e}=this,n=this.scale,i=this.baseLength/(t-1)*n,s=o=>this.baseWidth/(e-1)*(1+.45*(o/(t-1)))*n;this.cons=[];for(let o=0;o<t;o++)for(let a=0;a<e;a++){const c=o*e+a;if(a<e-1&&this.cons.push([c,c+1,s(o),1]),o<t-1&&this.cons.push([c,c+e,i,1]),o<t-1&&a<e-1){const l=Math.hypot(s(o),i);this.cons.push([c,c+e+1,l,.6]),this.cons.push([c+1,c+e,l,.6])}o<t-2&&this.cons.push([c,c+e*2,i*2,an.bend])}}update(t,e,n,i,s){Math.abs(s-this.scale)>.01&&(this.scale=s,this.buildConstraints());const{rows:o,cols:a,pos:c,prev:l}=this;if(this.initialized&&Math.hypot(e[0].x-c[0],e[0].y-c[1],e[0].z-c[2])>1.5*s&&(this.initialized=!1),!this.initialized){for(let d=0;d<o;d++)for(let f=0;f<a;f++){const g=(d*a+f)*3,_=e[f];c[g]=_.x,c[g+1]=_.y-d*(this.baseLength/(o-1))*s,c[g+2]=_.z-d*.02,l[g]=c[g],l[g+1]=c[g+1],l[g+2]=c[g+2]}this.initialized=!0}this.acc+=Math.min(t,.1);let h=0;for(;this.acc>=$r&&h<3;)this.step(e,n,i,s),this.acc-=$r,h++;h===3&&(this.acc=0);const u=this.mesh.geometry.attributes.position;u.needsUpdate=!0,this.mesh.geometry.computeVertexNormals()}step(t,e,n,i){const{rows:s,cols:o,pos:a,prev:c}=this,l=$r*$r,h=-n.x*an.trail+(Math.random()-.5)*an.flutter,u=-n.z*an.trail+(Math.random()-.5)*an.flutter,d=(Math.random()-.5)*an.flutter*.6-Math.hypot(n.x,n.z)*.1;for(let p=0;p<o;p++){const m=p*3,x=t[p];a[m]=x.x,a[m+1]=x.y,a[m+2]=x.z,c[m]=x.x,c[m+1]=x.y,c[m+2]=x.z}for(let p=o;p<this.n;p++){const m=p*3,x=a[m],y=a[m+1],v=a[m+2];let R=(x-c[m])*an.damping,T=(y-c[m+1])*an.damping,b=(v-c[m+2])*an.damping;const L=Math.sqrt(R*R+T*T+b*b),w=an.maxStep*i;if(L>w){const S=w/L;R*=S,T*=S,b*=S}c[m]=x,c[m+1]=y,c[m+2]=v,a[m]=x+R+h*l,a[m+1]=y+T+(Ry*i+d)*l,a[m+2]=v+b+u*l}let f=0,g=0,_=0;for(let p=0;p<o;p++)f+=t[p].x,g+=t[p].y,_+=t[p].z;e.pin={x:f/o,y:g/o,z:_/o};for(let p=0;p<an.iterations;p++){for(const[m,x,y,v]of this.cons){const R=m*3,T=x*3;let b=a[T]-a[R],L=a[T+1]-a[R+1],w=a[T+2]-a[R+2];const S=Math.sqrt(b*b+L*L+w*w)||1e-6,P=(S-y)/S*.5*v;b*=P,L*=P,w*=P;const U=m<o,O=x<o;U||(a[R]+=b*(O?2:1),a[R+1]+=L*(O?2:1),a[R+2]+=w*(O?2:1)),O||(a[T]-=b*(U?2:1),a[T+1]-=L*(U?2:1),a[T+2]-=w*(U?2:1))}this.collide(e,i)}}collide(t,e){const{pos:n,cols:i}=this,s=t.a,o=t.b,a=t.r,c=o.x-s.x,l=o.y-s.y,h=o.z-s.z,u=c*c+l*l+h*h||1e-6,d=t.back,f=Math.sqrt(u),g=c/f,_=l/f,p=h/f,m=this.baseLength/(this.rows-1)*e,x=t.pin;for(let y=i;y<this.n;y++){const v=y*3,R=n[v],T=n[v+1],b=n[v+2];let L=((R-s.x)*c+(T-s.y)*l+(b-s.z)*h)/u;L=Math.max(0,Math.min(1,L));const w=s.x+c*L,S=s.y+l*L,P=s.z+h*L;let U=R-w,O=T-S,q=b-P;const Y=Math.sqrt(U*U+O*O+q*q)||1e-6;if(Y<a){const W=(a-Y)/Y;n[v]+=U*W,n[v+1]+=O*W,n[v+2]+=q*W}{const W=(n[v]-t.mid.x)*d.x+(n[v+1]-t.mid.y)*d.y+(n[v+2]-t.mid.z)*d.z,$=.05*e;W<$&&(n[v]+=d.x*($-W),n[v+1]+=d.y*($-W),n[v+2]+=d.z*($-W))}if(x){const W=Math.floor(y/i),$=(n[v]-x.x)*g+(n[v+1]-x.y)*_+(n[v+2]-x.z)*p,X=W*m*(1-an.maxSwing);if($<X){const dt=X-$;n[v]+=g*dt,n[v+1]+=_*dt,n[v+2]+=p*dt}}n[v+1]<.03&&(n[v+1]=.03)}}setOpacity(t){const e=this.mesh.material;e.transparent=t<1,e.opacity=t,e.needsUpdate=!0}set visible(t){this.mesh.visible=t}get visible(){return this.mesh.visible}dispose(){this.scene.remove(this.mesh),this.mesh.geometry.dispose(),this.mesh.material.dispose()}}const Ly={short:{rows:6,len:.42},medium:{rows:9,len:.7},long:{rows:12,len:1}},Py=.93,Hh=()=>({primary:new nt(1706512),secondary:new nt(853255),accent:new nt(16719928),glow:new nt(16719928),skin:new nt(3809320),hair:new nt(1181192),hairStreak:new nt(16719928)});function Vh(r,t="#cfe0ff"){const e=document.createElement("canvas");e.width=256,e.height=64;const n=e.getContext("2d");n.font="700 30px system-ui, sans-serif",n.textAlign="center",n.textBaseline="middle",n.shadowColor="rgba(0,0,0,0.85)",n.shadowBlur=8,n.fillStyle=t,n.fillText(r,128,32);const i=new Ii(e);i.colorSpace=_e;const s=new vs({map:i,transparent:!0,depthWrite:!1}),o=new Qs(s);return o.scale.set(3.4,.85,1),o}let _c=null;function Iy(r){_c=r}class Ca{constructor(t,{name:e="",isPlayer:n=!1,power:i=null,paletteSeed:s=null}={}){this.scene=t,this.isPlayer=n,this.name=e,this.paletteSeed=s??(n?.5:Math.random()),this.pos=new A,this.vel=new A,this.yaw=0,this.altitude=0,this.groundY=0,this.hoverBob=0,this.prevYaw=0,this.turnRate=0,this.roll=0,this.pitch=0,this.dive=!1,this.hp=ht.PLAYER_HP,this.maxHp=ht.PLAYER_HP,this.alive=!0,this.power=null,this.score=0,this.frozenUntil=0,this.scaleTarget=1,this.curScale=1,this.flying=!1,this.backward=!1,this.bank=0,this.nemesis=!1,this.phase=Math.random()*Math.PI*2,this.disguise=null,this.propMesh=null,this.opacity=1,this.rootMoved=!1,this.group=new je,t.add(this.group),this.aura=new jt(new _o(.55,.85,28),new ke({color:16777215,transparent:!0,opacity:.55,depthWrite:!1,side:Ye})),this.aura.rotation.x=-Math.PI/2,this.aura.position.y=.07,this.aura.add(new jt(new _o(.85,.91,28),new ke({color:1315356,transparent:!0,opacity:.55,depthWrite:!1,side:Ye}))),this.group.add(this.aura),this.blobShadow=new jt(new nr(.62,20),new ke({color:0,transparent:!0,opacity:.3,depthWrite:!1})),this.blobShadow.rotation.x=-Math.PI/2,this.blobShadow.position.y=.04,this.group.add(this.blobShadow);const o=new Co(1,0);o.scale(.72,1.38,.62),this.iceShell=new jt(o,new dn({color:10351359,transparent:!0,opacity:.6,flatShading:!0})),this.iceShell.add(new Lu(new Z_(o),new kc({color:1719654,transparent:!0,opacity:.9}))),this.iceShell.position.y=1.22,this.iceShell.visible=!1,this.group.add(this.iceShell),this.name&&(this.label=Vh(this.name,this.isPlayer?"#ffd166":"#cfe0ff"),this.group.add(this.label)),this.body=null,this.setPower(i||{id:"flight",color:9358335})}buildLook(t,e=null){this.destroyBody();const n=Oh(t);this.arch=n;const i=e||py(n,this.paletteSeed);this.palette=i;const s=xy(n,i,{faceless:n.gear.includes("facelessMask")});if(this.rig=s,this.body=s.mesh,this.unitScale=1.85*n.build.height/(Jt.unitHeight*Py),this.body.scale.setScalar(this.unitScale),this.body.castShadow=tn.shadows,this.group.add(this.body),this.anim=new Ey(this.body,n,{hipsYOffset:s.hipsYOffset}),this.extras=s.extras,this.heightM=1.85*n.build.height,this.label&&(this.label.position.y=this.heightM+.35),this.iceShell.scale.setScalar(this.heightM/1.85),this.iceShell.position.y=1.22*this.heightM/1.85,n.cape){const o=Ly[n.cape],a=i.primary.clone().lerp(i.secondary,.4);this.cape=new Cy(this.scene,{rows:o.rows,cols:7,width:s.capeWidth*this.unitScale,length:o.len*this.heightM,color:a}),this.capePins=s.pins.map(()=>new A)}this.applyOpacity()}destroyBody(){this.body&&(this.anim?.dispose(),this.group.remove(this.body),this.body.skeleton?.dispose?.(),this.body.geometry.dispose(),this.body.material.dispose(),this.body.traverse(t=>{t!==this.body&&t.geometry&&(t.geometry.dispose(),t.material?.dispose?.())}),this.body=null),this.cape&&(this.cape.dispose(),this.cape=null)}refreshLook(){if(!this.arch||!this.body)return;const t=this.disguise||this.power?.id;this.buildLook(t,this.palette),this.propMesh&&(this.body.visible=!1,this.cape&&(this.cape.visible=!1))}setPower(t){this.power=t,t&&this.aura.material.color.set(t.color);const e=this.disguise||t?.id;(!this.arch||this.arch!==Oh(e))&&this.buildLook(e,this.nemesis?Hh():null)}disguiseAs(t,e=Math.random()){this.disguise=t;const n=this.paletteSeed;this.paletteSeed=e,this.buildLook(t),this.paletteSeed=n}disguiseAsProp(t){this.undisguise(),this.propMesh=t,t.rotation.y=-this.yaw,this.group.add(t),this.body.visible=!1,this.cape&&(this.cape.visible=!1),this.aura.visible=!1,this.label&&(this.label.visible=!1)}undisguise(){this.propMesh&&(this.group.remove(this.propMesh),this.propMesh.geometry.dispose(),this.propMesh=null,this.body&&(this.body.visible=!0),this.cape&&(this.cape.visible=!0),this.aura.visible=!0,this.label&&(this.label.visible=!0)),this.disguise&&(this.disguise=null,this.buildLook(this.power.id))}setNemesisLook(){this.nemesis=!0,this.aura.material.color.set(16719928),this.aura.material.opacity=.95,this.aura.scale.setScalar(1.5),this.buildLook(this.power.id,Hh()),this.label&&this.group.remove(this.label),this.label=Vh(this.name,"#ff5470"),this.label.position.y=this.heightM+.35,this.group.add(this.label)}setOpacity(t){t!==this.opacity&&(this.opacity=t,this.applyOpacity())}applyOpacity(){const t=this.opacity,e=n=>{n.transparent=t<1,n.opacity=t,n.needsUpdate=!0};this.body&&(e(this.body.material),this.body.traverse(n=>{n!==this.body&&n.material&&e(n.material)})),this.cape?.setOpacity(t),this.aura.material.opacity=.55*t,this.aura.children[0]&&(this.aura.children[0].material.opacity=.55*t),this.label&&(this.label.material.opacity=t<1?t*.4:1)}get feetY(){return this.altitude+this.groundY}get frozen(){return performance.now()/1e3<this.frozenUntil}freeze(t){this.frozenUntil=performance.now()/1e3+t,this.iceShell.visible=!0}get combat(){return this.arch.combat}get attacking(){return this.anim.attacking}startAttack(){const t=this.arch.combat,e=this.anim.nextMove(),n=this.anim.startAttack(e,t.speed);return n?{move:e,duration:n.duration,hits:n.hits,damage:t.damage*n.hitScale,range:t.range,arc:t.arc}:{move:e,duration:.5,hits:[.25],damage:t.damage,range:t.range,arc:t.arc}}cast(t,e=!1){this.anim.startCast(this.arch.cast||"spell_cast",e)}stopCast(){this.anim.stopCast()}hitReaction(){this.anim.hitReaction()}setHeld(t){t?this.anim.startHeld():this.anim.endHeld()}landing(){this.anim.landing()}emote(){this.anim.emote()}die(t){this.anim.die(t),this.aura.visible=!1}update(t,e){if(!this.frozen&&this.iceShell.visible&&(this.iceShell.visible=!1),Number.isFinite(this.altitude)||(this.altitude=0),Number.isFinite(this.pos.x+this.pos.z)||this.pos.set(0,0,0),_c){const _=_c.groundHeightAt(this.pos.x,this.pos.z),p=Math.abs(_-this.groundY);this.groundY=p>1.5?_:this.groundY+(_-this.groundY)*Math.min(1,t*16)}this.curScale+=(this.scaleTarget-this.curScale)*Math.min(1,t*5),this.group.scale.setScalar(this.curScale);const n=Math.hypot(this.vel.x,this.vel.z),i=this.flying,s=i&&this.altitude<2.6;if(this.rootMoved=!1,!this.frozen){const{root:_}=this.anim.update(t,{speed:n,backward:this.backward,flying:i,float:s,time:e});if(_.x||_.z){const p=this.unitScale*this.curScale,m=Math.sin(this.yaw),x=Math.cos(this.yaw);this.pos.x+=(_.x*x+_.z*m)*p,this.pos.z+=(-_.x*m+_.z*x)*p,this.rootMoved=!0}}const o=this.flying&&this.altitude>1&&n<1.6?Math.sin(e*2.1+this.phase)*.22:0;this.hoverBob+=(o-this.hoverBob)*Math.min(1,t*4),this.group.position.set(this.pos.x,this.altitude+this.groundY+this.hoverBob,this.pos.z),this.group.rotation.y=this.yaw;let a=this.yaw-this.prevYaw;for(;a>Math.PI;)a-=Math.PI*2;for(;a<-Math.PI;)a+=Math.PI*2;this.prevYaw=this.yaw;const c=t>0?a/t:0;this.turnRate+=(Math.max(-6,Math.min(6,c))-this.turnRate)*Math.min(1,t*6);const l=i&&this.altitude>.8,h=l?-Math.max(-.6,Math.min(.6,this.turnRate*.16)):0,u=this.dive?-1.15:l&&!this.backward&&n>1.6?-.1*Math.min(1,n/12):0;this.roll+=(h-this.roll)*Math.min(1,t*5),this.pitch+=(u-this.pitch)*Math.min(1,t*(this.dive?9:4)),this.body&&this.body.rotation.set(this.pitch,0,this.roll);const d=this.altitude;this.blobShadow.position.y=-d/Math.max(.001,this.curScale)+.04;const f=1/(1+d*.25);this.blobShadow.material.opacity=.3*f*this.opacity,this.blobShadow.scale.setScalar(Math.max(.4,f)),this.aura.rotation.z=e*1.5;const g=.9+Math.sin(e*5+this.pos.x)*.12;this.aura.scale.setScalar(g*(this.nemesis?1.5:1));for(const _ of this.extras)_.userData.animate?.(e);if(this.cape){this.group.updateMatrixWorld(!0);const _=this.rig.bones[lt.spine2],p=this.rig.bones[lt.hips];for(let T=0;T<this.capePins.length;T++)this.capePins[T].copy(this.rig.pins[T]),_.localToWorld(this.capePins[T]);const m=new A;_.getWorldPosition(m);const x=new A;p.getWorldPosition(x);const y=new xe;_.getWorldQuaternion(y);const v=new A(0,0,-1).applyQuaternion(y).normalize(),R=m.clone().add(x).multiplyScalar(.5);this.cape.update(t,this.capePins,{a:m,b:x,r:this.rig.torsoRadius*this.unitScale*this.curScale*1.12,back:v,mid:R},this.vel,this.curScale)}}dispose(){this.undisguise(),this.destroyBody(),this.scene.remove(this.group),this.group.traverse(t=>{t.geometry&&t.geometry.dispose(),t.material&&(Array.isArray(t.material)?t.material:[t.material]).forEach(e=>{e.map&&e.map.dispose(),e.dispose()})})}}function Dy(){let r=0;for(const[t,e,n]of ht.MULT_BRACKETS)r+=t*(e+n)/2;return r}const Uy=ht.RTP/Dy();function Ny(){let r=Math.random(),t=ht.MULT_BRACKETS[ht.MULT_BRACKETS.length-1];for(const i of ht.MULT_BRACKETS){if(r<i[0]){t=i;break}r-=i[0]}const[,e,n]=t;return I(e,n)*Uy}class ky{constructor(){this.bet=0,this.targetMult=1,this.total=0,this.phase="idle",this.strikeDelay=0}startRound(t){this.bet=t,this.targetMult=Ny(),this.total=0,this.phase="playing",this.strikeDelay=I(1,2.5)}get target(){return this.bet*this.targetMult}get mult(){return this.bet>0?this.total/this.bet:0}get live(){return this.phase==="playing"||this.phase==="stalk"||this.phase==="strike"}addWinnings(t){if(!this.live)return 0;const e=Math.max(0,this.target-this.total),n=Math.min(t,e);return this.total+=n,n}get targetReached(){return this.total>=this.target-1e-9}get stalkReached(){return this.total>=this.target*ht.STALK_FRACTION}update(t){return this.phase==="playing"&&this.stalkReached?(this.phase="stalk","stalk"):(this.phase==="stalk"||this.phase==="playing")&&this.targetReached&&(this.strikeDelay-=t,this.strikeDelay<=0)?(this.phase="strike","strike"):null}endRound(){return this.phase="done",this.total}}const Bs=55;class Oy{constructor(t){this.canvas=t,this.enabled=!1,this.isTouch=window.matchMedia("(pointer: coarse)").matches||"ontouchstart"in window,this.moveX=0,this.moveZ=0,this.lookDelta=0,this.pitchDelta=0,this.onAttack=null,this.onPowerDown=null,this.onPowerUp=null,this.onSwitch=null,this.keys=new Set,this.joyPointer=null,this.lookPointer=null,this.joyOrigin={x:0,y:0},this.joyEl=document.getElementById("joystick"),this.knobEl=document.getElementById("joy-knob"),this.bind()}bind(){window.addEventListener("keydown",a=>{this.enabled&&(a.code==="Tab"&&a.preventDefault(),!a.repeat&&(this.keys.add(a.code),a.code==="KeyM"&&this.onAttack?.(),a.code==="Space"&&(a.preventDefault(),this.onPowerDown?.()),a.code==="Tab"&&this.onSwitch?.()))}),window.addEventListener("keyup",a=>{this.keys.delete(a.code),a.code==="Space"&&this.enabled&&this.onPowerUp?.()}),window.addEventListener("blur",()=>{this.keys.clear(),this.onPowerUp?.()});const t=a=>{this.enabled&&a.target===this.canvas&&(this.canvas.setPointerCapture?.(a.pointerId),this.isTouch?this.joyPointer===null?(this.joyPointer=a.pointerId,this.joyOrigin={x:a.clientX,y:a.clientY},this.showJoystick(a.clientX,a.clientY,0,0)):this.lookPointer===null&&(this.lookPointer=a.pointerId,this.lastLook={x:a.clientX,y:a.clientY}):(this.lookPointer=a.pointerId,this.lastLook={x:a.clientX,y:a.clientY}))},e=a=>{if(this.enabled)if(a.pointerId===this.joyPointer){let c=a.clientX-this.joyOrigin.x,l=a.clientY-this.joyOrigin.y;const h=Math.hypot(c,l);h>Bs&&(c=c/h*Bs,l=l/h*Bs),this.moveX=Ys(c/Bs,-1,1),this.moveZ=Ys(-l/Bs,-1,1),this.showJoystick(this.joyOrigin.x,this.joyOrigin.y,c,l)}else a.pointerId===this.lookPointer&&(this.lookDelta+=(a.clientX-this.lastLook.x)*.0045,this.pitchDelta+=(a.clientY-this.lastLook.y)*.003,this.lastLook={x:a.clientX,y:a.clientY})},n=a=>{a.pointerId===this.joyPointer&&(this.joyPointer=null,this.moveX=0,this.moveZ=0,this.joyEl.classList.add("hidden")),a.pointerId===this.lookPointer&&(this.lookPointer=null)};window.addEventListener("pointerdown",t),window.addEventListener("pointermove",e),window.addEventListener("pointerup",n),window.addEventListener("pointercancel",n),document.getElementById("attack-btn").addEventListener("pointerdown",a=>{a.preventDefault(),a.stopPropagation(),this.enabled&&this.onAttack?.()});const s=document.getElementById("poweruse-btn");s.addEventListener("pointerdown",a=>{a.preventDefault(),a.stopPropagation(),this.enabled&&this.onPowerDown?.()});const o=a=>{a.preventDefault(),this.enabled&&this.onPowerUp?.()};s.addEventListener("pointerup",o),s.addEventListener("pointercancel",o),s.addEventListener("pointerleave",o)}showJoystick(t,e,n,i){this.joyEl.classList.remove("hidden"),this.joyEl.style.left="0px",this.joyEl.style.top="0px";const s=this.joyEl.querySelector(".joy-base");s.style.left=t+"px",s.style.top=e+"px",this.knobEl.style.left=t+n+"px",this.knobEl.style.top=e+i+"px"}poll(){let t=0;if(!this.isTouch||this.joyPointer===null){let i=0;(this.keys.has("KeyW")||this.keys.has("ArrowUp"))&&(i+=1),(this.keys.has("KeyS")||this.keys.has("ArrowDown"))&&(i-=1),(this.keys.has("KeyA")||this.keys.has("ArrowLeft"))&&(t-=1),(this.keys.has("KeyD")||this.keys.has("ArrowRight"))&&(t+=1),this.isTouch?i&&(this.moveZ=i):(this.moveX=0,this.moveZ=i)}const e=this.lookDelta,n=this.pitchDelta;return this.lookDelta=0,this.pitchDelta=0,{moveX:this.moveX,moveZ:this.moveZ,turn:t,look:e,pitch:n}}setEnabled(t){this.enabled=t,t||(this.keys.clear(),this.moveX=0,this.moveZ=0,this.joyPointer=null,this.lookPointer=null,this.joyEl.classList.add("hidden"))}}const hn="#141018",td=r=>"#"+r.toString(16).padStart(6,"0"),Fy={flight:(r,t)=>`
    <path d="M6 40 C18 22 27 21 32 8 C37 21 46 22 58 40 C47 33 38 34 32 46 C26 34 17 33 6 40 Z" fill="${r}"/>
    <path d="M32 14 C34 22 38 26 44 30 C38 30 34 33 32 40 C30 33 26 30 20 30 C26 26 30 22 32 14 Z" fill="${t}"/>`,speed:(r,t)=>`
    <path d="M6 22 H18 M4 32 H14 M8 42 H16" stroke="${r}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M38 4 L18 36 H31 L27 60 L50 26 H36 Z" fill="${r}"/>
    <path d="M36 10 L26 30 H33 L31 42 L42 26 H35 Z" fill="${t}"/>`,invisibility:(r,t)=>`
    <path d="M6 32 C16 16 48 16 58 32 C48 48 16 48 6 32 Z" fill="${r}"/>
    <circle cx="32" cy="32" r="9" fill="${hn}"/>
    <circle cx="35" cy="29" r="3" fill="#fff" stroke="none"/>
    <path d="M12 54 L52 10" stroke="${t}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M12 54 L52 10" stroke="${hn}" stroke-width="3" stroke-linecap="round" fill="none"/>`,telekinesis:(r,t)=>`
    <path d="M17 34 V30 M25 30 V22 M33 29 V20 M41 31 V24" stroke="${r}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M14 34 C14 46 20 56 32 58 C42 58 48 50 48 40 L48 32 C48 28 42 28 42 32 L41 34 L33 30 L25 32 L17 34 Z" fill="${r}"/>
    <path d="M22 10 L32 4 L42 10 L32 16 Z" fill="${t}"/>
    <path d="M22 10 V15 L32 21 L42 15 V10" fill="${r}"/>
    <path d="M32 16 V21" stroke="${hn}" stroke-width="3" fill="none"/>`,pyro:(r,t)=>`
    <path d="M32 4 C24 16 12 24 13 40 C14 52 22 60 32 60 C42 60 51 52 51 40 C51 30 44 26 40 16 C38 24 35 27 33 32 C28 26 30 14 32 4 Z" fill="${r}"/>
    <path d="M32 30 C28 36 22 40 23 47 C24 53 28 56 32 56 C36 56 41 53 41 47 C41 42 37 40 36 34 C34 38 33 36 32 30 Z" fill="${t}"/>`,cryo:(r,t)=>`
    <g stroke="${hn}" stroke-width="10" stroke-linecap="round" fill="none">
      <path d="M32 6 V58 M9.5 19 L54.5 45 M9.5 45 L54.5 19"/>
    </g>
    <g stroke="${r}" stroke-width="5" stroke-linecap="round" fill="none">
      <path d="M32 6 V58 M9.5 19 L54.5 45 M9.5 45 L54.5 19"/>
      <path d="M26 12 L32 18 L38 12 M26 52 L32 46 L38 52 M12 28 L18 26 L16 20 M52 36 L46 38 L48 44 M12 36 L18 38 L16 44 M52 28 L46 26 L48 20"/>
    </g>
    <circle cx="32" cy="32" r="5" fill="${t}"/>`,teleport:(r,t)=>`
    <ellipse cx="32" cy="34" rx="24" ry="10" fill="${r}"/>
    <ellipse cx="32" cy="34" rx="14" ry="5" fill="${hn}" stroke="none"/>
    <path d="M22 26 L32 12 L42 26" fill="${t}"/>
    <path d="M27 36 L32 28 L37 36" fill="${t}"/>`,xray:(r,t)=>`
    <path d="M8 12 L14 18 M56 12 L50 18 M8 52 L14 46 M56 52 L50 46" stroke="${r}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M6 32 C16 16 48 16 58 32 C48 48 16 48 6 32 Z" fill="${r}"/>
    <circle cx="32" cy="32" r="11" fill="${hn}"/>
    <circle cx="32" cy="32" r="5" fill="${t}" stroke="none"/>
    <path d="M32 21 V25 M32 39 V43 M21 32 H25 M39 32 H43" stroke="${t}" stroke-width="3" stroke-linecap="round" fill="none"/>`,shapeshift:(r,t)=>`
    <path d="M12 10 C22 6 42 6 52 10 C54 28 50 50 32 58 C14 50 10 28 12 10 Z" fill="${r}"/>
    <path d="M32 7.5 C42 7 48 8 52 10 C54 28 50 50 32 58 Z" fill="${t}"/>
    <path d="M18 24 C22 20 28 20 30 24 Z M34 24 C36 20 42 20 46 24 Z" fill="${hn}"/>
    <path d="M22 38 C27 46 37 46 42 38 C36 40 28 40 22 38 Z" fill="${hn}"/>`,duplication:(r,t)=>`
    <circle cx="40" cy="20" r="9" fill="${t}"/>
    <path d="M24 56 C24 40 32 36 40 36 C48 36 56 40 56 56 Z" fill="${t}"/>
    <circle cx="24" cy="24" r="9" fill="${r}"/>
    <path d="M8 60 C8 44 16 40 24 40 C32 40 40 44 40 60 Z" fill="${r}"/>`};function ed(r,t=.45){const e=r>>16&255,n=r>>8&255,i=r&255,s=o=>Math.round(o+(255-o)*t);return`rgb(${s(e)},${s(n)},${s(i)})`}const yo={};function is(r,t="1em"){const e=qe.find(s=>s.id===r),n=Fy[r];if(!e||!n)return"";const i=yo[r]||(yo[r]=n(td(e.color),ed(e.color)));return`<svg class="picon" viewBox="0 0 64 64" width="${t}" height="${t}" aria-label="${e.name}" role="img"><g stroke="${hn}" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke">${i}</g></svg>`}const By='<svg class="picon lock" viewBox="0 0 64 64" width="1em" height="1em" role="img" aria-label="locked"><path d="M20 30 V22 C20 14 26 9 32 9 C38 9 44 14 44 22 V30" fill="none" stroke="#e9e6ef" stroke-width="7" stroke-linecap="round"/><rect x="13" y="28" width="38" height="30" rx="6" fill="#e9e6ef" stroke="#141018" stroke-width="3.5"/><circle cx="32" cy="42" r="4.5" fill="#141018"/><path d="M32 44 V51" stroke="#141018" stroke-width="4" stroke-linecap="round"/></svg>',zy={absorb:[4054167,(r,t)=>`
    <path d="M20 6 C20 22 44 26 44 42 C44 50 38 56 32 58" fill="none" stroke="${r}" stroke-width="7" stroke-linecap="round"/>
    <path d="M44 6 C44 22 20 26 20 42 C20 50 26 56 32 58" fill="none" stroke="${t}" stroke-width="7" stroke-linecap="round"/>
    <path d="M23 14 H41 M26 22 H38 M26 42 H38 M23 50 H41" stroke="${hn}" stroke-width="3" stroke-linecap="round"/>`],twopower:[12614655,(r,t)=>`
    <circle cx="23" cy="34" r="15" fill="${r}"/>
    <circle cx="41" cy="30" r="15" fill="${t}"/>
    <path d="M30 22 C36 26 36 38 30 44" fill="none" stroke="${hn}" stroke-width="3"/>
    <circle cx="20" cy="30" r="3" fill="#fff" stroke="none"/><circle cx="44" cy="26" r="3" fill="#fff" stroke="none"/>`],extraswitch:[7252223,(r,t)=>`
    <path d="M14 30 C14 18 24 10 34 10 C42 10 48 14 52 20" fill="none" stroke="${r}" stroke-width="8" stroke-linecap="round"/>
    <path d="M44 22 L56 24 L54 10 Z" fill="${r}"/>
    <path d="M50 34 C50 46 40 54 30 54 C22 54 16 50 12 44" fill="none" stroke="${t}" stroke-width="8" stroke-linecap="round"/>
    <path d="M20 42 L8 40 L10 54 Z" fill="${t}"/>`],enlarge:[16747586,(r,t)=>`
    <circle cx="32" cy="18" r="8" fill="${t}"/>
    <path d="M20 58 L22 34 C22 28 42 28 42 34 L44 58 Z" fill="${r}"/>
    <path d="M8 26 L14 16 L20 26 M44 26 L50 16 L56 26" fill="none" stroke="${r}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`],fireball:[16728128,(r,t)=>`
    <path d="M8 56 C14 40 22 30 34 24 C30 32 30 36 32 40 C38 34 44 32 52 30 C46 40 40 50 26 54 Z" fill="${t}"/>
    <circle cx="40" cy="22" r="14" fill="${r}"/>
    <circle cx="36" cy="18" r="4" fill="#fff" stroke="none"/>`],landing:[16765286,(r,t)=>`
    <path d="M32 4 L38 22 L56 16 L44 32 L58 44 L40 44 L36 60 L28 46 L12 54 L18 38 L4 28 L22 24 Z" fill="${r}"/>
    <path d="M32 20 L35 28 L43 27 L37 33 L41 41 L33 37 L27 42 L28 34 L21 30 L29 28 Z" fill="${t}"/>`]};function Gh(r,t="1em"){const e=zy[r];if(!e)return"";const n="buff:"+r,i=yo[n]||(yo[n]=e[1](td(e[0]),ed(e[0])));return`<svg class="picon" viewBox="0 0 64 64" width="${t}" height="${t}" role="img" aria-label="${r}"><g stroke="${hn}" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke">${i}</g></svg>`}const Ht=r=>document.getElementById(r);class Hy{constructor(){this.menu=Ht("menu"),this.hud=Ht("hud"),this.results=Ht("results"),this.switchOverlay=Ht("switch-overlay"),this.onPlay=null,this.onSwitchPick=null,this.onResultsDone=null,this.powerIndex=0,this.bet=ht.BETS[1],this.rareUnlocked=new Set,this.announceTimer=null,this.buildMenu(),this.buildSwitchOverlay(),Ht("results-btn").addEventListener("click",()=>{Rt.click(),this.onResultsDone?.()}),Ht("sound-btn").addEventListener("click",()=>{Rt.setEnabled(!Rt.enabled),Ht("sound-btn").classList.toggle("off",!Rt.enabled),Rt.click()}),Ht("sound-btn").classList.toggle("off",!Rt.enabled)}buildMenu(){const t=Ht("bet-options");t.innerHTML="";for(const e of ht.BETS){const n=document.createElement("button");n.className="bet-chip"+(e===this.bet?" on":""),n.textContent="$"+e,n.addEventListener("click",()=>{Rt.click(),this.bet=e,t.querySelectorAll(".bet-chip").forEach(i=>i.classList.toggle("on",i===n))}),t.appendChild(n)}Ht("play-btn").addEventListener("click",()=>{Rt.unlock();const e=qe[this.powerIndex];e.rare&&!this.rareUnlocked.has(e.id)||(Rt.click(),this.onPlay?.(e,this.bet))}),this.renderPowerGrid()}rollRarePowers(){this.rareUnlocked.clear();for(const t of qe)t.rare&&Math.random()<.5&&this.rareUnlocked.add(t.id)}renderPowerGrid(){let t=qe[this.powerIndex];t.rare&&!this.rareUnlocked.has(t.id)&&(this.powerIndex=qe.findIndex(n=>!n.rare||this.rareUnlocked.has(n.id)),t=qe[this.powerIndex]);const e=Ht("power-grid");e.innerHTML="",qe.forEach((n,i)=>{const s=n.rare&&!this.rareUnlocked.has(n.id),o=document.createElement("div");o.className="pg-cell"+(i===this.powerIndex?" on":"")+(n.rare?" rare":"")+(s?" locked":""),o.style.setProperty("--pcolor","#"+n.color.toString(16).padStart(6,"0")),o.innerHTML=`<div class="em">${is(n.id)}${s?By:""}</div><div class="nm">${n.name}</div>`,o.addEventListener("click",()=>{if(Rt.click(),s){Ht("power-desc").innerHTML=`<b>${n.name}</b> — RARE power, not in this lobby rotation. Check back after your next round.`;return}this.powerIndex=i,this.renderPowerGrid()}),e.appendChild(o)}),Ht("power-desc").innerHTML=`<b>${t.name}</b> — ${t.desc}`,Ht("play-btn").disabled=!1}showMenu(t){this.rollRarePowers(),this.renderPowerGrid(),Ht("wallet-value").textContent=as(t);const e=Ht("bet-options").children;for(let n=0;n<e.length;n++){const i=ht.BETS[n]<=t;e[n].style.opacity=i?1:.3,e[n].style.pointerEvents=i?"auto":"none",!i&&ht.BETS[n]===this.bet&&(this.bet=ht.BETS[0],e[0]?.classList.add("on"),e[n].classList.remove("on"))}this.menu.classList.remove("hidden"),this.hud.classList.add("hidden"),this.results.classList.add("hidden")}showHUD(t){this.menu.classList.add("hidden"),this.hud.classList.remove("hidden"),this.results.classList.add("hidden"),Ht("keys-hint").style.display=t?"none":"",Ht("attack-btn").style.display=t?"":"none",Ht("killfeed").innerHTML=""}setTotal(t,e,n=!1){const i=Ht("total-value");i.textContent=as(t),Ht("total-mult").textContent=e.toFixed(2)+"×",n&&(i.classList.remove("bump"),i.offsetWidth,i.classList.add("bump"))}setHP(t){const e=Ht("hp-fill");e.style.width=Math.max(0,t*100)+"%",e.classList.toggle("low",t<.35)}setPowerButton(t,e){Ht("poweruse-icon").innerHTML=is(t?t.id:"speed","100%");const n=Ht("cd-circle");n.style.stroke=t?"#"+t.color.toString(16).padStart(6,"0"):"#6ea8ff",n.style.strokeDashoffset=String(289*e),Ht("poweruse-btn").classList.toggle("oncd",e>.02)}setSwitches(t){Ht("switch-count").textContent=t}setBuffs(t){Ht("buff-row").innerHTML=t.map(e=>`<span class="buff-chip">${e.icon?is(e.icon):e.buff?Gh(e.buff):e.emblem} ${e.label}</span>`).join("")}leaderboard(t){Ht("leaderboard").innerHTML=t.map(e=>`<div class="lb-row${e.me?" me":""}"><span class="lb-name">${e.rank}. ${e.name}</span><span>${as(e.score)}</span></div>`).join("")}killfeed(t,e=!1){const n=Ht("killfeed"),i=document.createElement("div");for(i.className="kf-row"+(e?" me":""),i.innerHTML=t,n.prepend(i);n.children.length>5;)n.lastChild.remove();setTimeout(()=>i.remove(),6e3)}popup(t,e,n,i=!1){const s=document.createElement("div");s.className="pop"+(i?" big":""),s.textContent=n,s.style.left=t+"px",s.style.top=e+"px",this.hud.appendChild(s),setTimeout(()=>s.remove(),1e3)}announce(t,{danger:e=!1,dur:n=2200,icon:i=null,buff:s=null}={}){const o=Ht("announce");o.textContent=t,i?o.innerHTML=is(i)+"<span>"+o.innerHTML+"</span>":s&&(o.innerHTML=Gh(s)+"<span>"+o.innerHTML+"</span>"),o.classList.remove("hidden"),o.classList.toggle("danger",e),clearTimeout(this.announceTimer),this.announceTimer=setTimeout(()=>o.classList.add("hidden"),n)}flash(){const t=Ht("flash");t.classList.remove("go"),t.offsetWidth,t.classList.add("go")}buildSwitchOverlay(){Ht("switch-btn").addEventListener("click",()=>this.onSwitchOpen?.()),Ht("switch-cancel").addEventListener("click",()=>{Rt.click(),this.closeSwitch()})}openSwitch(t,e,n=!1){Rt.click(),Ht("switch-left-label").innerHTML=n?"<span>FREE</span>":`<span>${e} LEFT</span>`;const i=Ht("switch-grid");i.innerHTML="";for(const s of qe){const o=document.createElement("div"),a=s.id===t||!n&&e<=0;o.className="switch-cell"+(s.id===t?" current":"")+(a?" disabled":""),o.innerHTML=`<div class="em">${is(s.id)}</div><div class="nm">${s.name}</div>`,o.addEventListener("click",()=>{a||(Rt.click(),this.closeSwitch(),this.onSwitchPick?.(s))}),i.appendChild(o)}this.switchOverlay.classList.remove("hidden")}closeSwitch(){this.switchOverlay.classList.add("hidden")}get switchOpen(){return!this.switchOverlay.classList.contains("hidden")}showResults({payout:t,mult:e,kills:n,tokens:i,place:s,killerName:o,killerPower:a,win:c}){Ht("results-title").textContent=c?"CASHED OUT":"ELIMINATED",Ht("results-title").classList.toggle("win",c),Ht("results-killer").textContent=o?`taken down by ${o} (${a})`:"",Ht("results-payout").textContent=as(t),Ht("results-mult").textContent=e.toFixed(2)+"× your bet",Ht("results-stats").innerHTML=`<div><b>${n}</b>KILLS</div><div><b>${i}</b>TOKENS</div><div><b>#${s}</b>PLACE</div>`,this.results.classList.remove("hidden")}}const ge=()=>performance.now()/1e3,La=12614655,Wh=r=>Number.isFinite(r.x)&&Number.isFinite(r.y)&&Number.isFinite(r.z),si=(r,t)=>Math.abs(r.feetY-t.feetY)<=ht.HIT_Y_RANGE,Zr=(r,t)=>Math.hypot(r.pos.x-t.x,r.feetY+1.1-t.y,r.pos.z-t.z);function Jr(r,t,e){if(Wh(t)){if(!Wh(r)){r.copy(t);return}r.lerp(t,e)}}const Xh={hit:["POW!","WHAM!","SMACK!","BIFF!","THWACK!","BONK!","WHACK!","BAM!"],kill:["KAPOW!","CRUNCH!","BLAM!","KRAK!","WHAMMO!","KA-BLAM!"],fire:["FWOOSH!","KABOOM!","BLAZE!"],shatter:["CRACK!","SHATTER!","KRISH!"],slam:["SLAM!","CRASH!","WHUMP!"],hurt:["OOF!","OUCH!","UGH!","ARGH!"],boom:["BOOM!","KABOOM!","KRAKOOM!"],squish:["SQUISH!","SPLAT!","CRUNCH!"]},qh={hit:{size:1},kill:{size:1.35},fire:{size:1.45},shatter:{size:1.25},slam:{size:1.35},hurt:{size:.9},boom:{size:1.7},squish:{size:1.25}};class Vy{constructor(t){this.canvas=t,this.renderer=new P_({canvas:t,antialias:!0,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this.renderer.outputColorSpace=_e,this.renderer.toneMapping=$h,this.renderer.toneMappingExposure=1.06,tn.shadows=window.matchMedia("(pointer: fine)").matches&&!("ontouchstart"in window),tn.shadows&&(this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=jh),this.scene=new I_,this.camera=new Xe(68,1,.1,200),this.baseFov=68,this.world=new Wv(this.scene),Hx(this.world,this.renderer),Lv(e=>{const n=[this.player?.ch,...this.bots.map(i=>i.ch)].filter(Boolean);for(const i of n)i.arch&&i.arch.suit===e&&i.alive!==!1&&i.refreshLook()}),Iy(this.world),this.fx=new Jv(this.scene,this.renderer),this.bams=new ay(this.scene),this.collectibles=new fy(this.scene,this.world),this.ui=new Hy,this.controls=new Oy(t),this.director=new ky,this.state="menu",this.timescale=1,this.slowmoUntil=0,this.time=0,this.wallet=parseFloat(localStorage.getItem("irr_wallet")??"")||ht.STARTING_WALLET,this.bots=[],this.clones=[],this.thrown=[],this.pendingHits=[],this.corpses=[],this.pendingRespawns=[],this.player=null,this.hunters=[],this.strikeT=0,this.hunterRefill=0,this.hunterFireCd=0,this.camYaw=0,this.camPitch=.42,this.camPos=new A(0,30,40),this.camTarget=new A,this.attractBot=null,this.attractTimer=0,this.deathT=0,this.lbTimer=0,this._v1=new A,this._v2=new A,this.collectibles.respawnAll();for(let e=0;e<ht.BOT_COUNT;e++)this.spawnBot({initial:!0});this.ui.onPlay=(e,n)=>this.startRound(e,n),this.ui.onResultsDone=()=>this.backToMenu(),this.ui.onSwitchOpen=()=>this.openSwitch(),this.ui.onSwitchPick=e=>this.doSwitch(e),this.controls.onAttack=()=>this.playerAttack(),this.controls.onPowerDown=()=>this.powerDown(),this.controls.onPowerUp=()=>this.powerUp(),this.controls.onSwitch=()=>this.openSwitch(),this.ui.showMenu(this.wallet),window.addEventListener("pointerdown",()=>Rt.unlock(),{once:!0})}saveWallet(){localStorage.setItem("irr_wallet",String(this.wallet))}resize(t,e){this.renderer.setSize(t,e,!1),this.camera.aspect=t/e,this.camera.updateProjectionMatrix()}get focusPos(){return this.player&&(this.state==="playing"||this.state==="dying")?this.player.ch.pos:this.attractBot?.ch.alive?this.attractBot.ch.pos:this.world.focus}bam(t,e,n,i,s=1){const o=Math.hypot(t-this.camPos.x,n-this.camPos.z);if(o>55)return;const a=qh[i]||qh.hit,c=Ys(.8+o/30,.8,1.9);this.bams.spawn(t+I(-.25,.25),e+I(-.1,.25),n+I(-.25,.25),Yt(Xh[i]||Xh.hit),{size:a.size*s*c,camPos:this.camPos})}sfxAt(t,e,n,i=!1){if(i){Rt[t]();return}const s=Math.hypot(e-this.camPos.x,n-this.camPos.z);if(s>38)return;const o=1-s/38;Rt.play(t,o*o*.8)}updateFootsteps(t){if(!t)return;this._steps=this._steps||new WeakMap;const e=[this.player?.ch,...this.bots.map(i=>i.ch),...(this.clones||[]).map(i=>i.ch)];let n=3;for(const i of e){if(!i)continue;let s=this._steps.get(i);if(!s){s={x:i.pos.x,z:i.pos.z,acc:0,side:1},this._steps.set(i,s);continue}const o=Math.hypot(i.pos.x-s.x,i.pos.z-s.z);if(s.x=i.pos.x,s.z=i.pos.z,!(i.alive&&i.altitude<.15&&!i.propMesh&&!i.flying&&!i.frozen)||o>3||o/t<.8){s.acc=Math.min(s.acc,.4);continue}const c=i===this.player?.ch,l=i.curScale||1;s.acc+=o;const h=(o/t>7?1.5:1)*l;if(s.acc<h)continue;if(s.acc-=h,s.side=-s.side,c){Rt.step(s.side,l>1.5,!0);continue}if(n<=0)continue;const u=Math.hypot(i.pos.x-this.camPos.x,i.pos.z-this.camPos.z);u>18||(n--,Rt.play("step",(1-u/18)*.6,s.side,l>1.5,!1))}}poof(t,e,n,i,s,o=10){this.fx.emit(t,e,n,{count:o,shape:"puff",color:i,color2:s,speed:3.2,life:.55,size:1.7,gravity:.6,drag:3.2,jitter:.35,grow:1.8})}hitFx(t,e,n,i=1){this.fx.burst(t,e,n,{color:K.speed,size:1.9*i,dur:.17}),this.fx.emit(t,e,n,{count:Math.round(6*i),shape:"spark",color:K.white,color2:K.speed,speed:5,life:.3,size:1.1*i,gravity:-4,spin:8})}explosionFx(t,e,n){this.fx.burst(t,e,n,{color:K.fire,size:4.2,dur:.28}),this.fx.emit(t,e,n,{count:26,shape:"flame",color:K.fireHot,color2:K.fireDeep,speed:11,life:.65,size:3,gravity:4,drag:2.5}),this.fx.emit(t,e+.5,n,{count:12,shape:"puff",color:K.smoke,color2:K.smokeDark,speed:4,life:1.3,size:2.6,gravity:2.5,drag:2,grow:2.3,jitter:.8}),this.fx.emit(t,e,n,{count:12,shape:"spark",color:K.fireHot,color2:K.fire,speed:15,life:.5,size:1.3,gravity:-10}),this.fx.ring(t,n,{color:K.fire,maxR:8,dur:.6,burst:!0})}dustRing(t,e,n,i,s=12,o=7,a=1.8){for(let c=0;c<s;c++){const l=c/s*Math.PI*2+I(-.2,.2);this.fx.emitDir(t+Math.sin(l)*.6,.35,e+Math.cos(l)*.6,this._v1.set(Math.sin(l),.12,Math.cos(l)),{count:1,shape:"puff",color:n,color2:i,speed:o,life:.6,size:a,cone:.1,drag:3.5,grow:1.9})}}spawnBot({initial:t=!1,pos:e=null}={}){const n=Ju(qe,a=>a.rare?.35:1),i=new Ca(this.scene,{name:zv(),power:n});let s=e;!s&&!t&&this.player&&this.state==="playing"&&Math.random()<.65&&(s=this.world.randomOpenPos(this.player.ch.pos,25,65)),s=s||this.world.randomOpenPos(this.focusPos,15,90),i.pos.set(s.x,0,s.z),i.yaw=I(0,Math.PI*2);const o={ch:i,power:n,state:"roam",target:null,wander:this.world.randomOpenPos(s,8,40),repath:I(.5,3),attackCd:0,quirkCd:I(2,8),aggressive:Math.random()<.35,score:t?I(.2,8)*10:I(.5,3),hunter:!1,stalkCd:0,farT:0,hp:100,held:!1};return this.bots.push(o),o}updateBot(t,e){const n=t.ch;if(!n.alive)return;if(t.held){n.update(e,this.time);return}if(n.update(e,this.time),n.rootMoved&&this.world.resolve(n.pos,.55,n.altitude),n.frozen){n.vel.set(0,0,0);return}const i=this.focusPos;if(!t.hunter&&Math.hypot(n.pos.x-i.x,n.pos.z-i.z)>ht.RECYCLE_DIST+20){const v=this.world.randomOpenPos(i,55,100);n.pos.set(v.x,0,v.z),t.target=null,t.wander=this.world.randomOpenPos(i,15,60)}t.repath-=e,t.attackCd-=e,t.quirkCd-=e,t.stalkCd-=e;const s=this.director.phase,o=t.hunter&&s==="strike"&&this.player?.ch.alive&&this.state==="playing",a=t.hunter&&s==="stalk"&&this.player?.ch.alive&&this.state==="playing",c=this.player&&this.player.ch.alive&&this.state==="playing"&&!this.playerHidden()&&this.player.ch.curScale<1.5;if(t.repath<=0&&!o){t.repath=I(1.2,3),t.target=null;let v=null,R=24;for(const T of this.bots){if(T===t||!T.ch.alive||T.ch.frozen||T.held||Math.abs(T.ch.feetY-n.feetY)>4)continue;const b=n.pos.distanceTo(T.ch.pos);b<R&&(v=T,R=b)}if(c&&t.aggressive&&!a&&Math.abs(this.player.ch.feetY-n.feetY)<4){const T=n.pos.distanceTo(this.player.ch.pos);T<15&&T<R&&(t.target="player")}!t.target&&v&&Math.random()<(a?.25:.55)&&(t.target=v),!t.target&&!a&&Math.random()<.6&&(t.wander=this.world.randomOpenPos(n.pos,10,45))}if(a&&t.stalkCd<=0){t.stalkCd=I(1.5,3.5);const v=this.player.ch.pos,R=I(0,Math.PI*2),T=I(6,13),b=v.x+Math.sin(R)*T,L=v.z+Math.cos(R)*T;t.wander=this.world.isBlocked(b,L,.9)?this.world.randomOpenPos(v,5,13):{x:b,z:L},t.target&&n.pos.distanceTo(v)>18&&(t.target=null)}o&&(t.target="player");let l=t.wander,h=!1;t.target==="player"?!this.player||!this.player.ch.alive||!o&&!c?t.target=null:(l=this.player.ch.pos,h=!0):t.target&&(!t.target.ch.alive||t.target.ch.frozen||t.target.held?t.target=null:(l=t.target.ch.pos,h=!0));const u=l.x-n.pos.x,d=l.z-n.pos.z,f=Math.hypot(u,d);let g=o?ht.HUNTER_SPEED:ht.BOT_SPEED;if(t.quirkCd<=0){t.quirkCd=I(4,10);const v=t.power.id;if(v==="speed")t.speedBurst=ge()+1.2;else if(v==="flight")t.flyUntil=ge()+I(3,6);else if(v==="teleport"&&f>8){const R=Math.min(9,f*.6)/f,T=n.pos.x+u*R,b=n.pos.z+d*R;this.world.isBlocked(T,b)||(this.poof(n.pos.x,1.1,n.pos.z,K.tele,K.teleDeep,7),n.pos.set(T,0,b),this.poof(T,1.1,b,K.tele,K.teleDeep,7))}else v==="invisibility"?t.fadeUntil=ge()+2.5:v==="telekinesis"&&this.fx.emit(n.pos.x,1.6,n.pos.z,{count:6,shape:"spark",color:K.tk,color2:K.tkDeep,speed:2.5,life:.7,gravity:1,size:1.1,spin:4})}t.speedBurst&&ge()<t.speedBurst&&(g*=2.1,this.fx.emitDir(n.pos.x,1,n.pos.z,this._v1.set(-u/(f||1),0,-d/(f||1)),{count:1,shape:"streak",color:K.speed,color2:K.speedDeep,speed:5,life:.3,size:1.3,cone:.15,jitter:.4})),n.setOpacity(t.fadeUntil&&ge()<t.fadeUntil?.25:1);const _=o&&this.player.ch.altitude>2,p=t.flyUntil&&ge()<t.flyUntil||_;let m=0;if(p){const v=_?Math.max(0,this.player.ch.altitude):ht.BOT_FLIGHT_DECK+Math.sin(this.time*.7+n.phase)*1.2;m=Math.max(v,this.flightCeiling(n,n.vel.x,n.vel.z))}if(Number.isFinite(n.altitude)||(n.altitude=0),n.altitude+=(m-n.altitude)*Math.min(1,e*(m>n.altitude?3.2:2.2)),n.altitude>.05||(n.altitude=0),n.flying=p||n.flying&&n.altitude>.4,o){const v=n.pos.distanceTo(this.player.ch.pos);if(v>34?t.farT+=e:t.farT=0,(t.farT>2.5||this.strikeT>ht.HUNTER_BLINK_AT&&v>9)&&(this.relocateHunter(t,this.strikeT>ht.HUNTER_BLINK_AT),t.farT=0),n.curScale>1.5&&v<1.9*n.curScale&&si(this.player.ch,n)){this.bam(this.player.ch.pos.x,1.2+this.player.ch.altitude,this.player.ch.pos.z,"squish",1.3),this.playerDeath(t);return}}const x=h?Math.max(1.6,n.combat.range*.72):1.2;if(n.attacking&&h)n.vel.set(0,0,0);else if(f>x){const v=u/f*g,R=d/f*g;n.vel.set(v,0,R),n.pos.x+=v*e,n.pos.z+=R*e;let b=Math.atan2(v,R)-n.yaw;for(;b>Math.PI;)b-=Math.PI*2;for(;b<-Math.PI;)b+=Math.PI*2;n.yaw+=b*Math.min(1,e*8),this.world.resolve(n.pos,.55,n.altitude)}else n.vel.set(0,0,0),!h&&t.repath>1&&(t.wander=this.world.randomOpenPos(n.pos,10,45));const y=t.target==="player"?this.player?.ch:t.target?.ch;if(h&&f<n.combat.range&&t.attackCd<=0&&y&&si(n,y)&&!n.attacking){const v=n.startAttack();t.attackCd=v.duration+I(.25,.7),n.yaw=Math.atan2(u,d);for(const R of v.hits)this.pendingHits.push({at:this.time+R,owner:"bot",bot:t,target:t.target,damage:v.damage,range:v.range})}}processHits(){for(let t=this.pendingHits.length-1;t>=0;t--){const e=this.pendingHits[t];if(e.at>this.time)continue;if(this.pendingHits.splice(t,1),e.owner==="player"){this.resolvePlayerHit(e);continue}const n=e.owner==="bot"?e.bot:e.clone;if(!n||!n.ch.alive)continue;if(e.owner==="bot"&&e.target==="player"){if(!this.player?.ch.alive)continue;const o=n.ch.pos.distanceTo(this.player.ch.pos),a=n.hunter&&this.director.phase==="strike";o<e.range+.6&&si(n.ch,this.player.ch)&&this.damagePlayer(e.damage*(a?ht.HUNTER_DAMAGE:.3),n);continue}const i=e.target;!i||!i.ch?.alive||i.held||n.ch.pos.distanceTo(i.ch.pos)>e.range+.6||!si(n.ch,i.ch)||(i.hp-=e.damage,i.ch.hitReaction(),this.hitFx(i.ch.pos.x,1.4+i.ch.altitude,i.ch.pos.z,.8),i.hp<=0?this.killBot(i,e.owner==="clone"?{byPlayer:!0}:{byBot:n}):(e.owner==="clone"||Math.random()<.5)&&this.bam(i.ch.pos.x,1.5+i.ch.altitude,i.ch.pos.z,"hit",.75))}}killBot(t,{byPlayer:e=!1,byBot:n=null,cause:i="attack",silent:s=!1}={}){if(!t.ch.alive)return;t.ch.alive=!1;const o=t.ch.pos.x,a=t.ch.altitude+1.2,c=t.ch.pos.z;if(!s){const h=t.power.color;i==="shatter"?(this.fx.emit(o,a,c,{count:26,shape:"shard",color:K.ice,color2:K.iceDeep,speed:10,life:.9,size:1.9,gravity:-16,spin:10}),this.fx.emit(o,a,c,{count:9,shape:"puff",color:K.frost,color2:K.frostDeep,speed:3.5,life:.7,size:2.2,gravity:.5,drag:3}),this.fx.burst(o,a,c,{color:K.ice,size:2.2}),this.fx.ring(o,c,{color:K.ice,maxR:4.5,dur:.5}),this.fx.addShake(.25),this.sfxAt("shatter",o,c,e)):i==="fire"?(this.fx.emit(o,a,c,{count:16,shape:"flame",color:K.fireHot,color2:K.fireDeep,speed:5,life:.6,size:2.2,gravity:5}),this.fx.emit(o,a+.4,c,{count:6,shape:"puff",color:K.smoke,color2:K.smokeDark,speed:2,life:1,size:1.8,gravity:2.5,drag:2,grow:2.2})):i==="slam"?(this.fx.emit(o,.4,c,{count:12,shape:"puff",color:K.dust,color2:K.dustDeep,speed:6,life:.7,size:2,gravity:0,drag:3.5,spread:1.3}),this.fx.emit(o,a,c,{count:10,shape:"spark",color:K.tk,color2:K.tkDeep,speed:8,life:.5,size:1.3}),this.fx.burst(o,a,c,{color:K.tk,size:2.4}),this.sfxAt("slam",o,c,e)):(this.fx.emit(o,a,c,{count:14,shape:"spark",color:h,color2:Yr(h),speed:8,life:.55,size:1.4,spin:6}),this.fx.emit(o,a,c,{count:7,shape:"puff",color:K.white,color2:h,speed:3,life:.6,size:1.9,gravity:.5,drag:3}),this.fx.burst(o,a,c,{color:h,size:2})),this.fx.ring(o,c,{color:h,maxR:3,dur:.4}),this.sfxAt("kill",o,c,e);const u=i==="fire"?"fire":i==="shatter"?"shatter":i==="slam"?"slam":i==="squish"?"squish":"kill";this.bam(o,a+.4,c,u,e?1:.8)}if(e&&this.player){const h=this.director.bet*I(ht.KILL_VALUE_MIN,ht.KILL_VALUE_MAX)*(1+Math.min(2,t.score/200)),u=this.director.addWinnings(h);if(this.player.kills++,u>0){const d=this.project(this._v1.set(o,a,c));d&&this.ui.popup(d.x,d.y,"+"+as(u),!0),this.ui.setTotal(this.director.total,this.director.mult,!0)}Rt.coin(),this.ui.killfeed(`<b>You</b> ⚡ eliminated <b>${t.ch.name}</b>`,!0),this.player.absorbUntil>ge()&&t.power.id!==this.playerMainPower().id&&(this.setPlayerPower(t.power),this.ui.announce(`ABSORBED ${t.power.name.toUpperCase()}`,{dur:1800}),Rt.pickup())}else n&&(n.score+=2+t.score*.25,(Math.random()<.5||t.ch.pos.distanceTo(this.camPos)<70)&&this.ui.killfeed(`<b>${n.ch.name}</b> ⚔ <b>${t.ch.name}</b>`));if(t.hunter){const h=this.hunters.indexOf(t);h>=0&&this.hunters.splice(h,1),this.director.phase==="strike"&&(this.hunterRefill=Math.min(this.hunterRefill||9,I(1,2)))}const l=this.bots.indexOf(t);if(l>=0&&this.bots.splice(l,1),s||i==="shatter")t.ch.dispose();else{const h=e?this.player?.ch:n?.ch;t.ch.die(this.deathKindFor(t.ch,h,i)),t.ch.vel.set(0,0,0),this.corpses.push({ch:t.ch,ttl:2.8})}this.pendingRespawns.push(I(1.5,4))}deathKindFor(t,e,n){if(n==="slam"||n==="fire"||n==="shatter")return"fly";if(!e)return"back";const i=e.pos.x-t.pos.x,s=e.pos.z-t.pos.z;return i*Math.sin(t.yaw)+s*Math.cos(t.yaw)>=0?"back":"forward"}updateCorpses(t){for(let e=this.corpses.length-1;e>=0;e--){const n=this.corpses[e];n.ttl-=t,n.ch.update(t,this.time),n.ttl<.6&&n.ch.setOpacity(Math.max(0,n.ttl/.6)),n.ttl<=0&&(n.ch.dispose(),this.corpses.splice(e,1))}}startRound(t,e){if(e>this.wallet)return;this.wallet-=e,this.saveWallet(),this.director.startRound(e),this.player&&this.player.ch.dispose();const n=new Ca(this.scene,{name:"YOU",isPlayer:!0,power:t}),i=this.world.randomOpenPos(this.focusPos,5,40);n.pos.set(i.x,0,i.z),this.player={ch:n,powerMain:t,secondPower:null,switchesLeft:ht.SWITCHES_PER_GAME,cds:{},flying:!1,speedUntil:0,invisUntil:0,disguiseUntil:0,xrayUntil:0,absorbUntil:0,twoUntil:0,enlargeUntil:0,meteor:null,ambushUntil:0,fireballArmed:!1,flameUntil:0,invulnUntil:ge()+2,adrenalineReady:ge(),kills:0,tokens:0,prevAlt:0,tk:null},n.hp=ht.PLAYER_HP,this.state="playing",this.clearHunters(),this.camYaw=n.yaw+Math.PI,this.camPitch=.42,this.camTarget.set(i.x,1.6,i.z),this.camPos.set(i.x-Math.sin(this.camYaw)*8.5,6.6,i.z-Math.cos(this.camYaw)*8.5),this.ui.showHUD(this.controls.isTouch),this.ui.setSwitches(this.player.switchesLeft),this.ui.setTotal(0,0),this.ui.setHP(1),this.controls.setEnabled(!0),this.ui.announce(t.name.toUpperCase(),{dur:1800,icon:t.id}),this.fx.ring(i.x,i.z,{color:t.color,maxR:6,dur:.7,burst:!0}),this.fx.emit(i.x,1,i.z,{count:18,shape:"spark",color:t.color,color2:Yr(t.color),speed:7,life:.8,size:1.4,spin:5}),this.poof(i.x,.5,i.z,K.white,t.color,8),Rt.whoosh()}playerMainPower(){return this.player.powerMain}playerHidden(){return this.player?this.player.invisUntil>ge()||!!this.player.ch.propMesh:!1}setPlayerPower(t){this.player.powerMain=t,this.player.ch.setPower(t),t.id!=="flight"&&(this.player.flying=!1),t.id!=="telekinesis"&&this.cancelTelekinesis(!0)}openSwitch(){if(this.state==="playing"){if(this.ui.switchOpen){this.ui.closeSwitch();return}this.ui.openSwitch(this.player.powerMain.id,this.player.switchesLeft)}}doSwitch(t){if(this.state!=="playing"||!t||this.player.switchesLeft<=0)return;this.player.switchesLeft--,this.ui.setSwitches(this.player.switchesLeft),this.setPlayerPower(t);const e=this.player.ch.pos;this.fx.ring(e.x,e.z,{color:t.color,maxR:5,dur:.5}),this.fx.emit(e.x,1.4,e.z,{count:14,shape:"spark",color:t.color,color2:Yr(t.color),speed:6,life:.7,size:1.3,spin:5}),this.poof(e.x,1,e.z,K.white,t.color,7),this.ui.announce(t.name.toUpperCase(),{dur:1500,icon:t.id}),Rt.morph()}playerAttack(){if(this.state!=="playing"||!this.player?.ch.alive)return;const t=this.player,e=t.ch;if(t.fireballArmed){this.launchFireball();return}if(e.attacking)return;e.propMesh&&this.revealDisguise(!0),e.yaw=this.camYaw;const n=e.startAttack();Rt.whoosh();for(const i of n.hits)this.pendingHits.push({at:this.time+i,owner:"player",damage:n.damage,range:n.range*e.curScale,arc:n.arc})}resolvePlayerHit(t){const e=this.player;if(!e?.ch.alive)return;const n=e.ch,i=n.curScale,s=Math.sin(n.yaw),o=Math.cos(n.yaw);let a=!1;for(const c of[...this.bots]){if(!c.ch.alive||c.held)continue;const l=c.ch.pos.x-n.pos.x,h=c.ch.pos.z-n.pos.z,u=Math.hypot(l,h);if(u>t.range+.6||!si(c.ch,n))continue;const d=(l*s+h*o)/(u||1);if(u>1.2&&d<t.arc)continue;a=!0;const f=e.ambushUntil>ge(),g=i>1.5;if(c.ch.frozen){this.killBot(c,{byPlayer:!0,cause:"shatter"});continue}if(f||g){this.killBot(c,{byPlayer:!0});continue}if(c.hp-=t.damage,c.ch.hitReaction(),this.hitFx(c.ch.pos.x,1.4+c.ch.altitude,c.ch.pos.z,1),this.fx.addShake(.1+t.damage*.002),Rt.punch(),c.hp<=0)this.killBot(c,{byPlayer:!0});else{this.bam(c.ch.pos.x,1.5+c.ch.altitude,c.ch.pos.z,"hit");const _=(.6+t.damage*.012)/(u||1);c.ch.pos.x+=l*_,c.ch.pos.z+=h*_,Math.random()<.5&&(c.target="player",c.aggressive=!0)}}a&&this.fx.addShake(.12),e.ambushUntil&&(e.ambushUntil=0)}launchFireball(){const t=this.player,e=t.ch;t.fireballArmed=!1,Rt.fireball();const n=this._v1.set(Math.sin(e.yaw),0,Math.cos(e.yaw)).clone(),i=e.pos.clone().setY(1.4+e.feetY);this.projectiles=this.projectiles||[],this.projectiles.push({pos:i,dir:n,speed:26,life:2.2,r:0}),this.fx.addShake(.3)}updateProjectiles(t){if(this.projectiles)for(let e=this.projectiles.length-1;e>=0;e--){const n=this.projectiles[e];n.life-=t,n.pos.addScaledVector(n.dir,n.speed*t),this.fx.emit(n.pos.x,n.pos.y,n.pos.z,{count:3,shape:"flame",color:K.fireHot,color2:K.fireDeep,speed:2,life:.4,size:2.6,gravity:3,jitter:.3}),this.fx.emit(n.pos.x,n.pos.y,n.pos.z,{count:1,shape:"dot",color:K.white,color2:K.fireHot,speed:.5,life:.12,size:3.6,gravity:0}),Math.random()<.4&&this.fx.emit(n.pos.x,n.pos.y+.2,n.pos.z,{count:1,shape:"puff",color:K.smoke,color2:K.smokeDark,speed:.6,life:.7,size:1.3,gravity:1.5,drag:2,grow:2});const i=n.owner==="bot";if(i&&n.homing&&this.player?.ch.alive){const c=this.player.ch,l=this._v1.set(c.pos.x,c.feetY+1.1,c.pos.z).sub(n.pos).normalize();n.dir.lerp(l,Math.min(1,n.homing*t)).normalize()}const s=this.world.isBlocked(n.pos.x,n.pos.z,.5)&&this.world.buildingHeightAt(n.pos.x,n.pos.z)>n.pos.y;let o=!1;if(!i){for(const c of this.bots)if(c.ch.alive&&!c.held&&Zr(c.ch,n.pos)<1.6){o=!0;break}}const a=i&&this.player?.ch.alive&&Zr(this.player.ch,n.pos)<1.8;if(n.life<=0||s||o||a){this.sfxAt("explosion",n.pos.x,n.pos.z,!i),this.fx.addShake(.8),this.explosionFx(n.pos.x,n.pos.y,n.pos.z),this.bam(n.pos.x,n.pos.y+.5,n.pos.z,"boom",1.2);for(const c of[...this.bots])c.ch.alive&&c!==n.bot&&Zr(c.ch,n.pos)<7.5&&this.killBot(c,i?{byBot:n.bot,cause:"fire"}:{byPlayer:!0,cause:"fire"});if(i&&this.player?.ch.alive){const c=Zr(this.player.ch,n.pos);c<6&&this.damagePlayer(c<2.5?999:60,n.bot)}this.projectiles.splice(e,1)}}}powerDown(){if(this.state!=="playing"||!this.player?.ch.alive)return;const t=this.player,e=[t.powerMain];t.twoUntil>ge()&&t.secondPower&&e.push(t.secondPower);for(const n of e)n.id==="telekinesis"?this.startTelekinesis(n):this.activatePower(n)}powerUp(){this.player&&this.player.tk&&this.player.tk.phase!=="thrown"&&this.releaseTelekinesis()}activatePower(t){const e=this.player,n=e.ch,i=ge();if((e.cds[t.id]||0)>i)return;n.propMesh&&t.id!=="shapeshift"&&this.revealDisguise();const s=n.pos.x,o=n.pos.z,a=1.2+n.altitude;let c=!0;switch(n.cast(t.id),t.id){case"flight":{e.flying=!e.flying,e.flying&&(Rt.whoosh(),this.fx.ring(s,o,{color:K.sky,maxR:4,dur:.5}),this.dustRing(s,o,K.sky,K.skyDeep,10,5));break}case"speed":{e.speedUntil=i+3,Rt.whoosh(),this.fx.ring(s,o,{color:K.speed,maxR:5,dur:.45}),this.fx.emit(s,1,o,{count:10,shape:"streak",color:K.speed,color2:K.speedDeep,speed:9,life:.35,size:1.3,gravity:0,drag:2,spread:1.2});break}case"invisibility":{e.invisUntil=i+5,Rt.invis(),this.poof(s,a,o,K.invis,K.invisDeep,12);for(const l of this.bots)l.target==="player"&&!(l.hunter&&this.director.phase==="strike")&&(l.target=null);break}case"pyro":{e.flameUntil=i+1.6,Rt.flame();break}case"cryo":{Rt.freeze(),this.fx.ring(s,o,{color:K.ice,maxR:10,dur:.8,burst:!0}),this.fx.emit(s,.8,o,{count:22,shape:"shard",color:K.ice,color2:K.iceDeep,speed:13,life:.75,size:1.25,gravity:-4,spread:1.3,spin:8}),this.dustRing(s,o,K.frost,K.frostDeep,12,9,1.4),this.fx.addShake(.3);for(const l of this.bots)l.ch.alive&&!l.held&&l.ch.pos.distanceTo(n.pos)<10&&Math.abs(l.ch.altitude-n.altitude)<4&&(l.ch.freeze(4.5),l.ch.vel.set(0,0,0));break}case"teleport":{const l=n.yaw;let h=Math.sin(l),u=Math.cos(l),d=14,f=s,g=o;for(;d>=4;d-=2){const _=s+h*d,p=o+u*d;if(!this.world.isBlocked(_,p,.9)){f=_,g=p;break}}if(f===s&&g===o){c=!1;break}Rt.teleport(),this.poof(s,a,o,K.tele,K.teleDeep,11),this.fx.emit(s,a,o,{count:8,shape:"spark",color:K.tele,color2:K.teleDeep,speed:6,life:.4,size:1.2}),n.pos.set(f,0,g),this.poof(f,a,g,K.tele,K.teleDeep,11),this.fx.burst(f,a,g,{color:K.tele,size:2.2}),this.fx.ring(f,g,{color:K.tele,maxR:4,dur:.45});break}case"xray":{e.xrayUntil=i+6,this.world.setXray(!0),this.collectibles.setXray(!0),Rt.xray(),this.ui.flash();break}case"shapeshift":{if(n.propMesh||e.flying||e.tk){c=!1;break}e.disguiseUntil=i+90,Rt.morph(),this.poof(s,a,o,K.pink,K.pinkDeep,14),this.fx.emit(s,a,o,{count:8,shape:"spark",color:K.pink,color2:K.pinkDeep,speed:5,life:.5,size:1.2,spin:6}),n.setOpacity(1);const l=ht.BLOCK+ht.ROAD,h=Yt(this.world.themeAt(Math.round(s/l),Math.round(o/l))==="suburb"?["bin","mailbox","bush","hydrant","tree","bench"]:["bin","bench","hydrant","lamppost","car"]);n.disguiseAsProp(this.world.makePropMesh(h)),n.vel.set(0,0,0);for(const u of this.bots)u.target==="player"&&(u.target=null);break}case"duplication":{Rt.dupe();for(let l=0;l<2;l++){const h=new Ca(this.scene,{name:"YOU",power:e.powerMain,paletteSeed:n.paletteSeed});h.pos.set(s+I(-2,2),0,o+I(-2,2)),this.poof(h.pos.x,1,h.pos.z,K.dupe,K.dupeDeep,9),this.clones.push({ch:h,until:i+10,attackCd:0,target:null,repath:0})}this.fx.ring(s,o,{color:K.dupe,maxR:5,dur:.5});break}}c&&(e.cds[t.id]=i+t.cooldown)}startTelekinesis(t){const e=this.player,n=ge();if(e.tk||(e.cds[t.id]||0)>n)return;const i=e.ch;i.propMesh&&this.revealDisguise();let s=null,o=null,a=null,c=ht.TK_RANGE;for(const h of this.bots){if(!h.ch.alive||h.held||h.ch.frozen)continue;const u=h.ch.pos.distanceTo(i.pos);u<c&&(o=h,c=u,s="bot")}for(const{l:h,d:u}of this.world.liftablesNear(i.pos,ht.TK_RANGE))u<c&&(a=h,o=null,c=u,s="prop");if(!s){this.fx.emit(i.pos.x,1.6,i.pos.z,{count:5,shape:"spark",color:K.tk,color2:K.tkDeep,speed:2,life:.4,size:1.1});return}e.tk={kind:s,bot:o,prop:a,phase:"lift",y:0,auraT:0},i.cast("telekinesis",!0),o&&(o.held=!0,o.ch.vel.set(0,0,0),o.ch.setHeld(!0)),a&&(a.busy=!0,a.baseRot=a.mesh.rotation.y),Rt.tk();const l=s==="bot"?o.ch.pos:a.mesh.position;this.fx.ring(l.x,l.z,{color:La,maxR:3.5,dur:.5})}tkTargetPos(t){if(t.kind==="bot"){const n=t.bot.ch;return{x:n.pos.x,y:n.altitude,z:n.pos.z}}const e=t.prop.mesh.position;return{x:e.x,y:e.y,z:e.z}}tkSetPos(t,e,n,i){t.kind==="bot"?(t.bot.ch.pos.x=e,t.bot.ch.pos.z=i,t.bot.ch.altitude=n):t.prop.mesh.position.set(e,n,i)}updateTelekinesis(t){const e=this.player,n=e?.tk;if(!n)return;if(n.kind==="bot"&&!n.bot.ch.alive||n.kind==="prop"&&!n.prop.alive){e.tk=null,e.cds.telekinesis=ge()+1.5;return}const i=e.ch,s=this.tkTargetPos(n);n.auraT+=t,this.fx.emit(s.x,s.y+1.2,s.z,{count:1,shape:"spark",color:K.tk,color2:K.tkDeep,speed:1.6,life:.5,size:1.2,gravity:2,jitter:.7,spin:5}),n.auraT>.3&&(n.auraT=0,this.fx.ring(s.x,s.z,{color:La,maxR:2.2,dur:.4})),n.kind==="bot"?n.bot.ch.yaw+=t*5:n.prop.mesh.rotation.y=n.prop.baseRot+(n.prop.mesh.rotation.y-n.prop.baseRot)+t*3;const o=3;if(n.phase==="lift"){const a=Math.min(o,s.y+t*6);this.tkSetPos(n,s.x,a,s.z),a>=o-.01&&(n.phase="pull")}else if(n.phase==="pull"){const a=i.pos.x-s.x,c=i.pos.z-s.z,l=Math.hypot(a,c),h=o+Math.sin(this.time*5)*.25;if(l>3.6){const u=ht.TK_PULL_SPEED*t;this.tkSetPos(n,s.x+a/l*u,h,s.z+c/l*u)}else{const u=this.camYaw;i.yaw=u;const d=new A(Math.sin(u)*ht.TK_THROW_SPEED,1.5,Math.cos(u)*ht.TK_THROW_SPEED);this.thrown.push({kind:n.kind,bot:n.bot,prop:n.prop,vel:d,mode:"throw",spin:I(3,7)}),e.cds.telekinesis=ge()+this.playerMainPower().cooldown,e.tk=null,i.stopCast(),i.startAttack(),Rt.whoosh(),this.fx.addShake(.35),this.fx.emit(s.x,h+1,s.z,{count:12,shape:"spark",color:K.tk,color2:K.tkDeep,speed:6,life:.5,size:1.4,spin:6}),this.fx.burst(s.x,h+1,s.z,{color:K.tk,size:1.8})}}}releaseTelekinesis(){const t=this.player,e=t?.tk;e&&(this.thrown.push({kind:e.kind,bot:e.bot,prop:e.prop,vel:new A(0,0,0),mode:"drop",spin:0}),t.cds.telekinesis=ge()+1.5,t.tk=null,t.ch.stopCast(),Rt.invis())}cancelTelekinesis(t=!1){const e=this.player;if(e?.tk)if(t){const n=e.tk;n.kind==="bot"&&n.bot.ch.alive&&(n.bot.held=!1,n.bot.ch.altitude=0,n.bot.ch.setHeld(!1)),n.kind==="prop"&&n.prop.alive&&(n.prop.busy=!1,n.prop.mesh.position.y=n.prop.baseY||0),e.tk=null,e.ch.stopCast()}else this.releaseTelekinesis()}updateThrown(t){for(let e=this.thrown.length-1;e>=0;e--){const n=this.thrown[e];if(!(n.kind==="bot"?n.bot.ch.alive:n.prop.alive)){this.thrown.splice(e,1);continue}const s=n.kind==="bot"?{x:n.bot.ch.pos.x,y:n.bot.ch.altitude,z:n.bot.ch.pos.z}:n.prop.mesh.position;n.vel.y-=26*t;const o=s.x+n.vel.x*t,a=s.y+n.vel.y*t,c=s.z+n.vel.z*t;if(n.kind==="bot"?(n.bot.ch.pos.x=o,n.bot.ch.pos.z=c,n.bot.ch.altitude=Math.max(0,a),n.bot.ch.yaw+=n.spin*t):(n.prop.mesh.position.set(o,Math.max(0,a),c),n.prop.mesh.rotation.x+=n.spin*t*.5),n.mode==="throw"){this.fx.emit(o,Math.max(.5,a)+1,c,{count:1,shape:"streak",color:K.tk,color2:K.tkDeep,speed:1.5,life:.3,size:1.3});for(const u of[...this.bots]){if(!u.ch.alive||u.held||n.kind==="bot"&&u===n.bot)continue;const d=Math.hypot(u.ch.pos.x-o,u.ch.pos.z-c),f=n.kind==="prop"?2.3:1.9;d<f&&Math.abs(u.ch.altitude-a)<3.2&&this.killBot(u,{byPlayer:!0,cause:"slam"})}}const l=this.world.isBlocked(o,c,.4)&&this.world.buildingHeightAt(o,c)>a,h=a<=.15;(l||h)&&(n.mode==="throw"?(this.fx.ring(o,c,{color:La,maxR:4.5,dur:.5}),this.fx.addShake(.4),n.kind==="bot"?(n.bot.held=!1,this.killBot(n.bot,{byPlayer:!0,cause:"slam"})):(Rt.slam(),this.fx.emit(o,Math.max(.5,a),c,{count:12,shape:"puff",color:K.dust,color2:K.dustDeep,speed:6,life:.7,size:1.9,gravity:0,drag:3,spread:1.3}),this.fx.emit(o,Math.max(.5,a),c,{count:10,shape:"shard",color:12107462,color2:6120300,speed:9,life:.7,size:1.1,gravity:-16,spin:10}),this.world.removeLiftable(n.prop))):n.kind==="bot"?(n.bot.held=!1,n.bot.ch.altitude=0,n.bot.ch.setHeld(!1),n.bot.repath=1.5,this.fx.emit(o,.4,c,{count:5,shape:"puff",color:K.dust,color2:K.dustDeep,speed:3,life:.45,size:1.3,gravity:0,drag:3})):(n.prop.mesh.position.y=this.world.groundHeightAt(o,c),n.prop.mesh.rotation.x=0,n.prop.busy=!1),this.thrown.splice(e,1))}}revealDisguise(t=!1){const e=this.player,n=e.ch;!n.propMesh&&!n.disguise||(e.disguiseUntil=0,n.undisguise(),this.poof(n.pos.x,1.2,n.pos.z,K.pink,K.pinkDeep,10),Rt.morph(),t&&(e.ambushUntil=ge()+1.2))}superheroLanding(){const t=this.player,e=t.ch;e.landing(),Rt.landing(),this.fx.addShake(1.1),this.ui.flash(),this.fx.ring(e.pos.x,e.pos.z,{color:K.gold,maxR:9,dur:.7,burst:!0}),this.fx.ring(e.pos.x,e.pos.z,{color:K.white,maxR:5,dur:.5}),this.dustRing(e.pos.x,e.pos.z,K.dust,K.dustDeep,18,10),this.fx.emit(e.pos.x,.6,e.pos.z,{count:12,shape:"shard",color:12107462,color2:6120300,speed:11,life:.8,size:1.2,gravity:-18,spin:10}),this.fx.burst(e.pos.x,1,e.pos.z,{color:K.gold,size:3.4,dur:.26}),this.bam(e.pos.x,1.6,e.pos.z,"boom",1.3);for(const n of[...this.bots])n.ch.alive&&n.ch.pos.distanceTo(e.pos)<ht.LANDING_RADIUS&&si(n.ch,e)&&this.killBot(n,{byPlayer:!0})}applyItem(t){const e=this.player,n=ge();if(Rt.pickup(),this.ui.announce(t.def.name.toUpperCase(),{dur:1800,buff:t.def.id}),t.kind==="pill")if(t.def.id==="absorb")e.absorbUntil=n+t.def.duration;else if(t.def.id==="twopower"){e.twoUntil=n+t.def.duration;const i=qe.filter(s=>s.id!==e.powerMain.id);e.secondPower=Yt(i),this.ui.announce(`TWO POWERS: ${e.secondPower.name.toUpperCase()}`,{dur:2200,icon:e.secondPower.id})}else t.def.id==="extraswitch"&&(e.switchesLeft++,this.ui.setSwitches(e.switchesLeft));else Rt.potion(),t.def.id==="enlarge"?(e.enlargeUntil=n+t.def.duration,e.ch.scaleTarget=2.3,Rt.grow(),this.fx.addShake(.4)):t.def.id==="fireball"?(e.fireballArmed=!0,this.ui.announce("☄ FIREBALL ARMED — ATTACK TO LAUNCH",{dur:2600})):t.def.id==="landing"&&(e.meteor={phase:"up",t:0,ringT:0},this.cancelTelekinesis(!0),this.ui.announce("SUPERHERO LANDING — STEER YOUR DROP",{dur:2200}),Rt.whoosh(),this.fx.ring(e.ch.pos.x,e.ch.pos.z,{color:K.gold,maxR:4,dur:.4}),this.dustRing(e.ch.pos.x,e.ch.pos.z,K.dust,K.dustDeep,10,5))}damagePlayer(t,e){const n=this.player;if(!n||!n.ch.alive||this.state!=="playing")return;const i=ge();if(!(i<n.invulnUntil)&&(n.ch.hp-=t,n.ch.hitReaction(),Rt.hurt(),this.fx.addShake(.3),this.fx.emit(n.ch.pos.x,1.4+n.ch.altitude,n.ch.pos.z,{count:6,shape:"spark",color:K.hurt,color2:K.hurtDeep,speed:4,life:.4,size:1.2}),this.fx.burst(n.ch.pos.x,1.4+n.ch.altitude,n.ch.pos.z,{color:K.hurt,size:1.4}),n.ch.propMesh&&this.revealDisguise(),n.ch.hp>0&&this.bam(n.ch.pos.x,1.6+n.ch.altitude,n.ch.pos.z,"hurt"),n.ch.hp<=0)){if(e?.hunter&&this.director.phase==="strike"){this.bam(n.ch.pos.x,1.6+n.ch.altitude,n.ch.pos.z,"kill",1.4),this.playerDeath(e);return}n.ch.hp=1,i>n.adrenalineReady?(n.adrenalineReady=i+ht.ADRENALINE_COOLDOWN,n.invulnUntil=i+1.6,n.speedUntil=Math.max(n.speedUntil,i+1.6),this.slowmoUntil=performance.now()/1e3+.7,this.timescale=.35,this.ui.announce("ADRENALINE RUSH",{dur:1400}),this.ui.flash(),Rt.whoosh(),e&&(e.target=null,e.repath=4)):n.invulnUntil=i+.9}}hiddenSpotNear(t,e,n){for(let i=0;i<8;i++){const s=this.camYaw+Math.PI+I(-1.3,1.3),o=I(e,n),a=t.x-Math.sin(s)*o,c=t.z-Math.cos(s)*o;if(!this.world.isBlocked(a,c,.9))return{x:a,z:c}}return this.world.randomOpenPos(t,e,n)}assignHunters(t){if(!this.player)return;const e=this.player.ch.pos,n=ld(this.player.powerMain.id),i=this.bots.filter(s=>s.ch.alive&&!s.hunter&&!s.held).map(s=>({b:s,d:s.ch.pos.distanceTo(e)-(s.power.id===n.id?12:0)})).filter(s=>s.d<70).sort((s,o)=>s.d-o.d);for(;this.hunters.length<t;){let s=i.shift()?.b;if(!s){const o=this.hiddenSpotNear(e,22,40);s=this.spawnBot({pos:o}),Math.random()<.6&&(s.power=n,s.ch.setPower(n))}s.hunter=!0,s.aggressive=!0,s.stalkCd=0,s.farT=0,s.target=null,this.hunters.push(s)}}beginStrike(){this.strikeT=0,this.hunterFireCd=1.5,this.assignHunters(ht.HUNTER_COUNT);for(const t of this.hunters)this.armHunter(t)}armHunter(t){t.hp=Math.max(t.hp,ht.HUNTER_HP),t.target="player",t.attackCd=Math.min(t.attackCd,.3),this.strikeT>ht.HUNTER_GIANT_AT&&(t.ch.scaleTarget=2)}relocateHunter(t,e){const n=this.player.ch.pos,i=e?this.world.randomOpenPos(n,3,6):this.hiddenSpotNear(n,14,22);e&&(this.poof(t.ch.pos.x,1.1,t.ch.pos.z,K.tele,K.teleDeep,8),Rt.teleport()),t.ch.pos.set(i.x,0,i.z),t.ch.altitude=this.player.ch.altitude>2?this.player.ch.altitude:0,e&&this.poof(i.x,1.1,i.z,K.tele,K.teleDeep,8)}updateHunt(t){if(this.director.phase!=="strike"||!this.player?.ch.alive)return;this.strikeT+=t;const e=this.player,n=e.ch.pos;this.hunters=this.hunters.filter(s=>s.ch.alive);const i=ht.HUNTER_COUNT+(this.strikeT>ht.HUNTER_GIANT_AT?2:0);if(this.hunters.length<i&&(this.hunterRefill-=t,this.hunterRefill<=0)){this.hunterRefill=1.5;const s=this.hunters.length;this.assignHunters(Math.min(i,s+1));for(const o of this.hunters.slice(s))this.armHunter(o)}if(this.strikeT>ht.HUNTER_GIANT_AT)for(const s of this.hunters)s.ch.scaleTarget<2&&(s.ch.scaleTarget=2);if(this.strikeT>ht.HUNTER_FIREBALL_AT&&(this.hunterFireCd-=t,this.hunterFireCd<=0)){const s=this.hunters.find(o=>{const a=o.ch.pos.distanceTo(n);return a>4&&a<30&&!o.ch.attacking});s&&(this.hunterFireCd=I(2.2,3.5),this.botFireball(s))}}botFireball(t){const e=this.player,n=t.ch.pos.clone().setY(1.4+t.ch.feetY),s=e.ch.pos.clone().setY(1.2+e.ch.feetY).sub(n).normalize();t.ch.yaw=Math.atan2(s.x,s.z),t.ch.cast("pyro"),Rt.fireball(),this.projectiles=this.projectiles||[],this.projectiles.push({pos:n,dir:s,speed:22,life:2.4,r:0,owner:"bot",bot:t,homing:2.2})}clearHunters(){for(const t of this.bots)t.hunter&&(t.hunter=!1,t.hp=Math.min(t.hp,100),t.ch.scaleTarget=1,t.target=null);this.hunters=[],this.strikeT=0,this.hunterRefill=0}playerDeath(t){const e=this.player;this.cancelTelekinesis(!0),e.ch.alive=!1,e.ch.vel.set(0,0,0),e.ch.flying=!1,e.meteor=null,e.ch.dive=!1,e.ch.die(this.deathKindFor(e.ch,t?.ch,"attack")),this.state="dying",this.deathT=0,this.deathKiller=t,this.controls.setEnabled(!1),this.ui.closeSwitch(),this.timescale=.3,this.slowmoUntil=performance.now()/1e3+2,Rt.death(),this.fx.addShake(1.2),this.ui.flash();const n=e.ch.pos,i=t?t.power.color:K.hurt;this.fx.emit(n.x,1.4+e.ch.altitude,n.z,{count:22,shape:"spark",color:i,color2:Yr(i),speed:9,life:1,size:1.6,spin:6}),this.fx.emit(n.x,1.2+e.ch.altitude,n.z,{count:10,shape:"puff",color:K.white,color2:i,speed:3.5,life:.9,size:2.2,gravity:.5,drag:3}),this.fx.burst(n.x,1.4+e.ch.altitude,n.z,{color:K.hurt,size:3,dur:.3}),this.fx.ring(n.x,n.z,{color:K.hurt,maxR:7,dur:.8,burst:!0}),this.world.setXray(!1),this.collectibles.setXray(!1)}finishRound(){const t=this.director.endRound();this.wallet+=t,this.saveWallet();const e=t>=this.director.bet,i=this.leaderboardRows().find(s=>s.me)?.rank??this.bots.length+1;e&&Rt.cashout(),this.ui.showResults({payout:t,mult:this.director.mult,kills:this.player.kills,tokens:this.player.tokens,place:i,killerName:this.deathKiller?.ch.name,killerPower:this.deathKiller?.power.name,win:e}),this.state="results"}backToMenu(){this.cancelTelekinesis(!0);for(const t of this.thrown)t.kind==="bot"&&t.bot.ch.alive&&(t.bot.held=!1,t.bot.ch.altitude=0,t.bot.ch.setHeld(!1)),t.kind==="prop"&&t.prop.alive&&(t.prop.busy=!1,t.prop.mesh.position.y=t.prop.baseY||0);this.thrown=[],this.pendingHits=[];for(const t of this.corpses)t.ch.dispose();this.corpses=[],this.player&&(this.player.ch.dispose(),this.player=null),this.clearHunters();for(const t of this.clones)t.ch.dispose();this.clones=[],this.state="menu",this.attractBot=null,this.attractTimer=0,this.ui.showMenu(this.wallet)}flightCeiling(t,e,n){const i=Math.hypot(e,n),s=i>.05?e/i:Math.sin(t.yaw),o=i>.05?n/i:Math.cos(t.yaw),a=-o,c=s;let l=0;const h=i>.05?[0,.25,.5,.75,1]:[0,.2];for(const u of h){const d=t.pos.x+s*u*ht.FLIGHT_LOOKAHEAD,f=t.pos.z+o*u*ht.FLIGHT_LOOKAHEAD;for(const g of[-.9,0,.9])l=Math.max(l,this.world.buildingHeightAt(d+a*g,f+c*g))}return l>0?l+ht.FLIGHT_CLEARANCE:0}updatePlayer(t,e){const n=this.player,i=n.ch;if(!i.alive)return;const s=ge(),o=(n.speedUntil>s?2.4:1)*(n.enlargeUntil>s?1.2:1),a=n.meteor?1.6:n.flying?1.35:1,c=ht.PLAYER_SPEED*o*a,l=Math.sin(this.camYaw),h=Math.cos(this.camYaw),u=-e.moveX*h+e.moveZ*l,d=e.moveX*l+e.moveZ*h,f=Math.hypot(u,d)>.05;i.propMesh&&f&&this.revealDisguise(),i.vel.set(u*c,0,d*c),i.pos.x+=i.vel.x*t,i.pos.z+=i.vel.z*t;const g=e.moveZ<-.2&&Math.abs(e.moveX)<.5;if(i.backward=g&&f,f){let y=(g?this.camYaw:Math.atan2(u,d))-i.yaw;for(;y>Math.PI;)y-=Math.PI*2;for(;y<-Math.PI;)y+=Math.PI*2;i.yaw+=y*Math.min(1,t*10)}else if(e.turn){let x=this.camYaw-i.yaw;for(;x>Math.PI;)x-=Math.PI*2;for(;x<-Math.PI;)x+=Math.PI*2;i.yaw+=x*Math.min(1,t*6)}if(n.prevAlt=i.altitude,i.flying=n.flying&&n.powerMain.id==="flight"||i.flying&&i.altitude>.4,i.bank+=(e.turn*.9+e.look*6-i.bank)*Math.min(1,t*4),n.meteor){const x=n.meteor;x.t+=t,i.flying=!0,x.phase==="up"?(i.altitude=Math.min(ht.METEOR_APEX,i.altitude+t*ht.METEOR_APEX/ht.METEOR_UP_TIME),x.t>=ht.METEOR_UP_TIME&&(x.phase="hang",x.t=0)):x.phase==="hang"?(i.altitude=ht.METEOR_APEX+Math.sin(x.t*6)*.15,x.t>=ht.METEOR_HANG_TIME&&(x.phase="down",x.t=0,i.dive=!0,Rt.whoosh())):(i.altitude-=t*ht.METEOR_FALL_SPEED,this.fx.emitDir(i.pos.x,i.altitude+1,i.pos.z,this._v1.set(0,1,0),{count:3,shape:"flame",color:K.fireHot,color2:K.fireDeep,speed:6,life:.4,size:2.4,cone:.25,jitter:.3}),this.fx.emitDir(i.pos.x,i.altitude+1,i.pos.z,this._v1.set(0,1,0),{count:1,shape:"streak",color:K.gold,color2:K.goldDeep,speed:10,life:.3,size:1.4,cone:.1,jitter:.5}),i.altitude<=0&&(i.altitude=0,i.dive=!1,n.meteor=null,this.superheroLanding())),n.meteor&&x.phase!=="up"&&(x.ringT-=t,x.ringT<=0&&(x.ringT=.22,this.fx.ring(i.pos.x,i.pos.z,{color:16765286,maxR:ht.LANDING_RADIUS,dur:.3})))}else if(n.flying&&n.powerMain.id==="flight"){const x=Math.max(ht.FLIGHT_DECK,this.flightCeiling(i,u,d));i.altitude<x?i.altitude=Math.min(x,i.altitude+t*ht.FLIGHT_CLIMB):i.altitude=Math.max(x,i.altitude-t*ht.FLIGHT_DESCEND),Math.random()<.6&&this.fx.emitDir(i.pos.x,i.altitude+.4,i.pos.z,this._v1.set(-u,0,-d),{count:1,shape:"streak",color:K.sky,color2:K.skyDeep,speed:6,life:.35,size:1.3,cone:.15,jitter:.35})}else i.altitude>0&&(i.altitude=Math.max(0,i.altitude-t*16),i.altitude===0&&n.prevAlt>3.5&&(this.fx.ring(i.pos.x,i.pos.z,{color:K.white,maxR:3,dur:.4}),this.dustRing(i.pos.x,i.pos.z,K.dust,K.dustDeep,8,4),this.fx.addShake(.3),Rt.punch()));if(this.world.resolve(i.pos,.6*i.curScale,i.altitude),n.speedUntil>s&&f&&(this.fx.emitDir(i.pos.x,.9,i.pos.z,this._v1.set(-u,.05,-d),{count:1,shape:"streak",color:K.speed,color2:K.speedDeep,speed:8,life:.3,size:1.5,cone:.1,jitter:.5}),Math.random()<.35&&this.fx.emit(i.pos.x,.3,i.pos.z,{count:1,shape:"puff",color:K.dust,color2:K.dustDeep,speed:.5,life:.4,size:1.1,gravity:0,drag:3})),n.flameUntil>s){const x=this._v1.set(Math.sin(i.yaw),.05,Math.cos(i.yaw));this.fx.emitDir(i.pos.x+x.x,1.3+i.altitude,i.pos.z+x.z,x,{count:6,shape:"flame",color:K.fireHot,color2:K.fireDeep,speed:15,life:.5,size:2.6,cone:.22,gravity:3}),this.fx.emitDir(i.pos.x+x.x,1.3+i.altitude,i.pos.z+x.z,x,{count:2,shape:"flame",color:K.white,color2:K.fire,speed:12,life:.3,size:1.8,cone:.15}),Math.random()<.3&&this.fx.emitDir(i.pos.x+x.x*3,1.8+i.altitude,i.pos.z+x.z*3,x,{count:1,shape:"puff",color:K.smoke,color2:K.smokeDark,speed:5,life:.8,size:1.6,cone:.3,gravity:2,drag:2,grow:2.2});for(const y of[...this.bots]){if(!y.ch.alive||y.held)continue;const v=y.ch.pos.x-i.pos.x,R=y.ch.pos.z-i.pos.z,T=Math.hypot(v,R);T<8.5&&(v*x.x+R*x.z)/(T||1)>.72&&si(y.ch,i)&&this.killBot(y,{byPlayer:!0,cause:"fire"})}}i.setOpacity(n.invisUntil>s?.15:1),n.disguiseUntil>0&&n.disguiseUntil<s&&(i.disguise||i.propMesh)&&this.revealDisguise(),n.xrayUntil>0&&n.xrayUntil<s&&(n.xrayUntil=0,this.world.setXray(!1),this.collectibles.setXray(!1)),n.enlargeUntil>0&&n.enlargeUntil<s&&(n.enlargeUntil=0,i.scaleTarget=1),n.twoUntil>0&&n.twoUntil<s&&(n.twoUntil=0,n.secondPower=null),i.hp=Math.min(i.maxHp,i.hp+ht.HP_REGEN*t);const _=1.7*i.curScale,p=this.collectibles.collectTokens(i.pos.x,i.pos.z,_);if(p>0){n.tokens+=p;const x=this.director.addWinnings(p*this.director.bet*ht.TOKEN_VALUE);if(Rt.coin(),x>0){const y=this.project(this._v1.set(i.pos.x,1.5,i.pos.z));y&&this.ui.popup(y.x,y.y,"+"+as(x)),this.ui.setTotal(this.director.total,this.director.mult)}}const m=this.collectibles.collectItem(i.pos.x,i.pos.z,_+.4);if(m&&this.applyItem(m),i.curScale>1.5)for(const x of[...this.bots])x.ch.alive&&!x.held&&x.ch.curScale<1.5&&x.ch.pos.distanceTo(i.pos)<1.9*i.curScale&&si(x.ch,i)&&(this.killBot(x,{byPlayer:!0,cause:"squish"}),this.fx.addShake(.3));i.update(t,this.time),i.rootMoved&&this.world.resolve(i.pos,.6*i.curScale,i.altitude)}updateClones(t){const e=ge();for(let n=this.clones.length-1;n>=0;n--){const i=this.clones[n];if(e>i.until){this.poof(i.ch.pos.x,1,i.ch.pos.z,K.dupe,K.dupeDeep,8),i.ch.dispose(),this.clones.splice(n,1);continue}if(i.repath-=t,i.attackCd-=t,i.repath<=0||!i.target?.ch.alive){i.repath=1;let s=null,o=26;for(const a of this.bots){if(!a.ch.alive||a.held)continue;const c=i.ch.pos.distanceTo(a.ch.pos);c<o&&(s=a,o=c)}i.target=s}if(i.target){const s=i.target.ch.pos.x-i.ch.pos.x,o=i.target.ch.pos.z-i.ch.pos.z,a=Math.hypot(s,o);if(a>1.8)i.ch.vel.set(s/a*8.5,0,o/a*8.5),i.ch.pos.x+=i.ch.vel.x*t,i.ch.pos.z+=i.ch.vel.z*t,i.ch.yaw=Math.atan2(s,o),this.world.resolve(i.ch.pos,.55,0);else if(i.attackCd<=0&&!i.ch.attacking){const c=i.ch.startAttack();i.attackCd=c.duration+.3;for(const l of c.hits)this.pendingHits.push({at:this.time+l,owner:"clone",clone:i,target:i.target,damage:c.damage*.8,range:c.range})}}else i.ch.vel.set(0,0,0);i.ch.update(t,this.time),i.ch.rootMoved&&this.world.resolve(i.ch.pos,.55,0)}}updateCameraPlay(t,e){const n=this.player,i=n.ch;this.camYaw-=e.look+e.turn*2.6*t,this.camPitch=Ys(this.camPitch+e.pitch,.12,1.1),Number.isFinite(this.camYaw)||(this.camYaw=i.yaw+Math.PI),Number.isFinite(this.camPitch)||(this.camPitch=.42);const s=i.curScale,o=Ys((i.altitude-.6)/2.5,0,1),a=Math.hypot(i.vel.x,i.vel.z),c=(8.5-2.9*o+Math.min(1.2,a*.06)*o)*(.75+s*.35),l=(3.2+Math.sin(this.camPitch)*6)*(.7+s*.3)*(1-.45*o),h=Math.sin(this.time*.8)*.45*o,u=Math.sin(this.time*1.25+1.3)*.3*o,d=i.pos.x-Math.sin(this.camYaw)*c+Math.cos(this.camYaw)*h,f=i.pos.z-Math.cos(this.camYaw)*c-Math.sin(this.camYaw)*h,g=i.altitude+l+u,_=i.pos.x,p=i.altitude+1.8*s,m=i.pos.z;let x=1;const y=10;for(let T=1;T<=y;T++){const b=T/y,L=_+(d-_)*b,w=p+(g-p)*b,S=m+(f-m)*b;if(this.world.buildingHeightAt(L,S)>w){x=Math.max(.18,(T-1)/y);break}}this._v2.set(_+(d-_)*x,p+(g-p)*x,m+(f-m)*x),Jr(this.camPos,this._v2,Math.min(1,t*7)),this.camera.position.copy(this.camPos).add(this.fx.shakeOffset),Jr(this.camTarget,this._v2.set(i.pos.x,i.altitude+(1.6-.5*o)*s,i.pos.z),Math.min(1,t*10)),this.camera.lookAt(this.camTarget),this.camRoll=(this.camRoll||0)+(-i.bank*.16*o-(this.camRoll||0))*Math.min(1,t*5),Number.isFinite(this.camRoll)&&this.camera.rotateZ(this.camRoll);const v=ge(),R=this.baseFov+(n.speedUntil>v?14:0)+(o>0?4+Math.min(6,a*.5)*o:0);this.camera.fov+=(R-this.camera.fov)*Math.min(1,t*5),this.camera.updateProjectionMatrix()}updateCameraMenu(t){if(this.attractTimer-=t,this.attractTimer<=0||!this.attractBot?.ch.alive){this.attractTimer=I(7,11);const i=this.bots.filter(s=>s.ch.alive);this.attractBot=i.length?Yt(i):null,this.attractAngle=I(0,Math.PI*2)}if(!this.attractBot)return;this.attractAngle+=t*.12;const e=this.attractBot.ch.pos,n=13;this._v2.set(e.x+Math.cos(this.attractAngle)*n,5.5+Math.sin(this.time*.3)*2+this.attractBot.ch.altitude,e.z+Math.sin(this.attractAngle)*n),Jr(this.camPos,this._v2,Math.min(1,t*1.2)),Jr(this.camTarget,this._v2.set(e.x,this.attractBot.ch.altitude+1.5,e.z),Math.min(1,t*2.5)),this.camera.position.copy(this.camPos),this.camera.lookAt(this.camTarget),this.camera.fov+=(this.baseFov-this.camera.fov)*Math.min(1,t),this.camera.updateProjectionMatrix()}updateCameraDeath(t){this.deathT+=t;const n=this.player.ch.pos,i=this.camYaw+this.deathT*.7,s=7+this.deathT*2;this.camPos.lerp(this._v2.set(n.x-Math.sin(i)*s,3.5+this.deathT*1.5,n.z-Math.cos(i)*s),Math.min(1,t*4)),this.camera.position.copy(this.camPos).add(this.fx.shakeOffset),this.camera.lookAt(n.x,1,n.z)}leaderboardRows(){const t=this.bots.map(i=>({name:i.ch.name,score:i.score*this.director.bet*.02+i.score,me:!1}));this.player&&this.state!=="menu"&&t.push({name:"You",score:this.director.total,me:!0}),t.sort((i,s)=>s.score-i.score);const e=t.slice(0,6).map((i,s)=>({...i,rank:s+1})),n=t.findIndex(i=>i.me);return n>=6&&e.push({...t[n],rank:n+1}),e.length?e:[]}update(t){const e=Math.min(t,.05)*this.timescale;this.time+=e,this.timescale<1&&performance.now()/1e3>this.slowmoUntil&&this.state!=="dying"&&(this.timescale=Math.min(1,this.timescale+t*2)),this.world.update(this.focusPos,e);for(const i of[...this.bots])this.updateBot(i,e);for(let i=this.pendingRespawns.length-1;i>=0;i--)this.pendingRespawns[i]-=e,this.pendingRespawns[i]<=0&&(this.pendingRespawns.splice(i,1),this.bots.length<ht.BOT_COUNT+(this.director.phase==="strike"?2:0)&&this.spawnBot({}));if(Math.random()<e*2&&this.bots.length){const i=Yt(this.bots);i.score+=I(.5,4)}this.collectibles.update(e,this.time),this.updateProjectiles(e),this.updateThrown(e),this.processHits(),this.updateCorpses(e),this.fx.update(e),this.bams.update(e);const n=this.controls.poll();if(this.state==="playing"){this.updatePlayer(e,n),this.updateTelekinesis(e),this.updateClones(e),this.updateFootsteps(e);const i=this.director.update(e);i==="stalk"?this.assignHunters(ht.HUNTER_COUNT):i==="strike"&&this.beginStrike(),this.updateHunt(e),this.updateCameraPlay(e,n);const s=this.player,o=ge();this.ui.setHP(s.ch.hp/s.ch.maxHp);const a=s.powerMain,c=Math.max(0,(s.cds[a.id]||0)-o);if(this.ui.setPowerButton(a,c/a.cooldown),this.lbTimer-=e,this.lbTimer<=0){this.lbTimer=.5,this.ui.leaderboard(this.leaderboardRows());const l=[];s.absorbUntil>o&&l.push({buff:"absorb",label:Math.ceil(s.absorbUntil-o)+"s"}),s.twoUntil>o&&s.secondPower&&l.push({icon:s.secondPower.id,label:Math.ceil(s.twoUntil-o)+"s"}),s.enlargeUntil>o&&l.push({buff:"enlarge",label:Math.ceil(s.enlargeUntil-o)+"s"}),s.fireballArmed&&l.push({buff:"fireball",label:"armed"}),s.invisUntil>o&&l.push({icon:"invisibility",label:Math.ceil(s.invisUntil-o)+"s"}),s.ch.propMesh&&l.push({icon:"shapeshift",label:"hidden"}),s.tk&&l.push({icon:"telekinesis",label:"hold"}),this.ui.setBuffs(l)}}else this.state==="menu"||this.state==="results"?this.updateCameraMenu(e):this.state==="dying"&&(this.updateCameraDeath(t),this.player.ch.update(e,this.time),this.deathT>3&&(this.timescale=1,this.finishRound()));zx(this.scene,this.camera,this.renderer),this.renderer.render(this.scene,this.camera)}project(t){return this._v2.copy(t).project(this.camera),this._v2.z>1?null:{x:(this._v2.x*.5+.5)*this.canvas.clientWidth,y:(-this._v2.y*.5+.5)*this.canvas.clientHeight}}}const Gy=document.getElementById("gl"),Yh=document.getElementById("loading");async function Wy(){try{await Promise.all([Px("./anims.json").then(()=>Pv("./")).then(()=>{Rt.loadMusic("./music.json")}),document.fonts?.load("96px Bangers").catch(()=>{})])}catch(c){throw Yh.textContent="Failed to load animations: "+c.message,c}Yh.classList.add("hidden");const r=new Vy(Gy);window.__game=r,window.__powers=qe,window.__sfx=Rt;function t(){r.resize(window.innerWidth,window.innerHeight)}window.addEventListener("resize",t),window.addEventListener("orientationchange",()=>setTimeout(t,250)),t();let e=null,n=0,i=0;/[?&]stats=1\b|stats/.test(location.search+location.hash)&&(e=document.createElement("div"),e.style.cssText="position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:99;font:12px monospace;color:#fff;background:#000a;padding:3px 8px;border-radius:6px;pointer-events:none",document.body.appendChild(e));let s=performance.now(),o=0;function a(c){const l=(c-s)/1e3;s=c;try{r.update(l)}catch(h){o++<5&&console.error("frame error",h)}if(e&&(n+=l,i++,n>.5)){const h=r.renderer.info.render;e.textContent=`${Math.round(i/n)} fps · ${h.calls} calls · ${(h.triangles/1e3).toFixed(0)}k tris · dpr ${r.renderer.getPixelRatio().toFixed(1)}`,n=0,i=0}requestAnimationFrame(a)}requestAnimationFrame(a)}Wy();"serviceWorker"in navigator&&location.protocol==="https:"&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").catch(()=>{})});
