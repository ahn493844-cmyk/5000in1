// 5천만분의 1 — 정치 인생 엔진
// 화면과 상관없는 규칙만 둔다. 내 상태는 P, 정치판(다른 정치인·국회·대통령)은 W 하나에 모은다.
// 시간은 한 달씩 흐른다(step). 선택이나 개표가 기다리고 있으면 멈춘다.
'use strict';

const POP = 51217221;                       // 2024년 말 주민등록인구
const YEAR = new Date().getFullYear();

// ── 도구 ─────────────────────────────────────────
let rand = Math.random;
function wpick(list){
  const t = list.reduce((s,x)=>s+x[1],0);
  let r = rand()*t;
  for (const x of list){ r -= x[1]; if (r < 0) return {v:x[0], p:x[1]/t}; }
  const x = list[list.length-1]; return {v:x[0], p:x[1]/t};
}
const rnd = a => a[Math.floor(rand()*a.length)];
const ri = (a,b) => b<a ? a : a+Math.floor(rand()*(b-a+1));
const clamp = (x,a,b) => Math.max(a, Math.min(b, x));
const sig = x => 1/(1+Math.exp(-x));
function normal(m, s){ let u=0, v=0; while(!u) u=rand(); while(!v) v=rand(); return m + s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function jong(w){ const c=String(w).charCodeAt(String(w).length-1)-0xAC00; return c<0||c>11171 ? -1 : c%28; }
const eu = w => { const j=jong(w); return j>0 && j!==8 ? '으로' : '로'; };
function won(n){
  const s = n<0 ? '−' : ''; n = Math.abs(Math.round(n));
  if (!n) return '0원';
  if (n>=10000){ const e=Math.floor(n/10000), r=n%10000; return `${s}${e.toLocaleString('ko-KR')}억${r?` ${r.toLocaleString('ko-KR')}만`:''} 원`; }
  return `${s}${n.toLocaleString('ko-KR')}만 원`;
}
const pct = x => `${(x*100).toFixed(1)}%`;

// ── 지역 ─────────────────────────────────────────
// [출생 비중(%), 진보 쪽 양당 득표 비율(최근 총선·대선 평균 근사), 국회의원 지역구 수, 약칭, 시·군·구 예시]
const REGION = {
  '서울특별시':[16.4,.50,48,'서울',['종로구','마포구','강남구','노원구','관악구','송파구','은평구','성동구']],
  '경기도':[27.5,.55,60,'경기',['수원시','성남시','고양시','용인시','부천시','화성시','안산시','파주시']],
  '인천광역시':[6.3,.53,14,'인천',['미추홀구','연수구','부평구','남동구','계양구']],
  '부산광역시':[5.1,.42,18,'부산',['해운대구','부산진구','사하구','동래구','북구']],
  '대구광역시':[3.7,.25,12,'대구',['수성구','달서구','북구','동구','달성군']],
  '광주광역시':[2.4,.86,8,'광주',['서구','북구','광산구','남구']],
  '대전광역시':[2.9,.52,7,'대전',['유성구','서구','중구','대덕구']],
  '울산광역시':[2.1,.44,6,'울산',['남구','중구','울주군','동구']],
  '세종특별자치시':[1.4,.58,2,'세종',['세종시']],
  '강원특별자치도':[2.1,.43,8,'강원',['춘천시','원주시','강릉시','속초시','홍천군']],
  '충청북도':[3.1,.50,8,'충북',['청주시','충주시','제천시','옥천군']],
  '충청남도':[4.1,.49,11,'충남',['천안시','아산시','공주시','서산시','논산시']],
  '전북특별자치도':[2.2,.84,10,'전북',['전주시','익산시','군산시','남원시','완주군']],
  '전라남도':[2.9,.86,10,'전남',['순천시','여수시','목포시','나주시','해남군']],
  '경상북도':[3.7,.28,13,'경북',['포항시','구미시','경주시','안동시','경산시']],
  '경상남도':[5.2,.42,16,'경남',['창원시','김해시','진주시','양산시','거제시']],
  '제주특별자치도':[1.3,.57,3,'제주',['제주시','서귀포시']]
};
const REGIONS = Object.keys(REGION);
const short = r => REGION[r][3];
const isCity = r => /특별시|광역시|특별자치시/.test(r);
const govTitle = r => `${short(r)}${isCity(r) ? '시장' : '지사'}`;
const chiefTitle = d => d.endsWith('구') ? `${d}청장` : d.endsWith('군') ? `${d}수` : `${d}장`;

// ── 정당과 자리 ───────────────────────────────────
// 실제 정당이 아닌 가상의 정당이다. 0=진보, 1=보수, 2=제3지대, 3=무소속
const PARTY = [{n:'푸른당', side:'진보'}, {n:'붉은당', side:'보수'}, {n:'새길당', side:'제3지대'}, {n:'무소속', side:'무소속'}];
const IND = 3;
const pname = i => PARTY[i].n;

// pw=권력 점수, sal=연봉(만 원), cost=선거 비용(만 원), lim=연임 제한
const OFF = {
  local:    {n:'기초의원', pw:30,   sal:4500,  kind:'지선', cost:3000,    term:4},
  metro:    {n:'광역의원', pw:55,   sal:6500,  kind:'지선', cost:5000,    term:4},
  mayor:    {n:'기초단체장', pw:130, sal:11000, kind:'지선', cost:30000,   term:4, lim:3},
  mp:       {n:'국회의원', pw:200,  sal:16000, kind:'총선', cost:20000,   term:4},
  gov:      {n:'광역단체장', pw:330, sal:13000, kind:'지선', cost:100000,  term:4, lim:3},
  president:{n:'대통령',   pw:1000, sal:26000, kind:'대선', cost:30000,   term:5, lim:1}
};
const MINISTRY = ['기획재정부','교육부','외교부','통일부','법무부','국방부','행정안전부','문화체육관광부','농림축산식품부','산업통상자원부','보건복지부','환경부','고용노동부','여성가족부','국토교통부','해양수산부','중소벤처기업부','과학기술정보통신부'];
const SEATS_LOCAL = 254, SEATS_PR = 46;

// ── 이름 ─────────────────────────────────────────
const SURNAME = [['김',21.5],['이',14.7],['박',8.4],['최',4.7],['정',4.3],['강',2.4],['조',2.1],['윤',2.1],['장',2.0],['임',1.7],['한',1.5],['오',1.5],['서',1.5],['신',1.5],['권',1.4],['황',1.4],['안',1.4],['송',1.3],['전',1.1],['홍',1.1]]
  .concat('유고문양손배백허남심노하곽성차주우구민류나진지엄채원천방공현'.split('').map(c=>[c,0.75]));
const NAMES = [
  [1960,['영수','영호','정수','상철','성수','종수','병철','재근'],['영자','정숙','순자','영숙','옥순','경자','명희']],
  [1970,['성호','영철','정호','경수','상훈','기현','동수'],['미숙','경숙','정희','미경','혜숙','선영']],
  [1980,['정훈','성진','상훈','성훈','영훈','재석','준영'],['은주','미영','은정','현정','지영','미정']],
  [1990,['지훈','성민','현우','동현','준호','민석'],['지영','은지','수진','지혜','은영','혜진']],
  [2000,['동현','지훈','성민','현우','준호','민수'],['지은','유진','민지','수진','지현','지혜']],
  [2010,['민준','현우','동현','준혁','민재','지훈'],['서연','민지','수빈','서현','지원','유진']],
  [9999,['민준','서준','도윤','예준','시우','하준','주원','이안'],['서연','서윤','지우','하윤','하은','지유','수아','이서']]
];
const givenName = (by, male) => rnd(NAMES.find(n => by < n[0])[male?1:2]);
const mkName = (by, male) => wpick(SURNAME).v + givenName(by, male);

// ── 사망 ─────────────────────────────────────────
function gompQ(x, M){
  const b=0.09, a=b*Math.exp(-b*M), H = t => a/b*(Math.exp(b*t)-1);
  return 1-Math.exp(-(H(x+1)-H(x)));
}
function deathCause(d){
  return wpick(
    d<40 ? [['사고',45],['암',25],['심장질환',12],['기타 질환',18]] :
    d<65 ? [['암',48],['심장질환',13],['간질환',9],['뇌혈관 질환',9],['사고',8],['기타 질환',13]] :
    d<80 ? [['암',40],['심장질환',12],['폐렴',9],['뇌혈관 질환',10],['당뇨병',4],['기타 질환',25]] :
           [['폐렴',18],['심장질환',14],['암',15],['뇌혈관 질환',10],['노환',25],['알츠하이머병',6],['기타 질환',12]]
  ).v;
}

// ── 상태 ─────────────────────────────────────────
let P = null, W = null, nextId = 1;
const LBL = {hp:'건강', smart:'능력', talk:'말솜씨', fame:'인지도', rep:'평판', org:'조직력'};

function fx(eff){
  const parts = [];
  for (const k in eff){
    const v = Math.round(eff[k]); if (!v) continue;
    if (k==='money'){ P.money += v; parts.push({s:`${v>0?'+':''}${won(v)}`, neg:v<0}); }
    else { P[k] = clamp(P[k]+v, 0, 100); parts.push({s:`${LBL[k]} ${v>0?'+':'−'}${Math.abs(v)}`, neg:v<0}); }
  }
  return parts;
}
function say(t, eff, kind){ P.cur.lines.push({t, fx: eff ? fx(eff) : [], kind: kind || 'life'}); P.ver++; }
function news(t, big){
  W.news.unshift({t, y:P.year, m:P.month, big:!!big}); W.news.length = Math.min(W.news.length, 40);
  if (big) say(t, null, 'world');
}
// 이미 기다리는 선택이 있으면 줄을 세운다
function ask(ch){ if (!P.alive) return; if (P.pending){ P.queue.push(ch); return; } P.pending = ch; P.ver++; }
function choose(i){
  const ch = P.pending; if (!ch) return;
  const o = ch.options[i]; if (!o || o.off) return;
  P.pending = null; P.ver++;
  say(`${ch.title} · ${o.label}`, null, 'pick');
  o.go();
  if (!P.pending && P.queue.length && P.alive) P.pending = P.queue.shift();
}
function show(s){ P.shows.push(s); P.ver++; }
function ack(){ P.shows.shift(); P.ver++; }

// ── 직함과 권력 ─────────────────────────────────
function title(x){
  if (W.pres && W.pres.who===x) return '대통령';
  if (x.pm) return '국무총리';
  const parts = [];
  if (x.minister) parts.push(`${x.minister} 장관`);
  if (x.office){
    const r = x.home || x.region, d = x.dist;
    parts.push(
      x.office==='local' ? `${d}의회 의원` :
      x.office==='metro' ? `${short(r)}${isCity(r)?'시':'도'}의원` :
      x.office==='mayor' ? chiefTitle(d) :
      x.office==='mp' ? `국회의원 (${short(r)} ${d})` :
      x.office==='gov' ? govTitle(r) : OFF[x.office].n);
  }
  if (x.chair) parts.push(`${pname(x.party)} 대표`);
  if (parts.length) return parts.join(' · ');
  if (x.ex) return x.ex;
  if (x.party!=null) return x.party===IND ? '무소속 정치인' : `${pname(x.party)} 당원`;
  return '';
}
function power(x){
  if (!x.alive || x.retired) return 0;
  let p = x.office ? OFF[x.office].pw : 0;
  if (W.pres && W.pres.who===x) p = 1000;
  if (x.pm) p = Math.max(p, 550);
  if (x.minister) p = Math.max(p, 300);
  if (x.best) p = Math.max(p, OFF[x.best].pw*.25);
  if (x.party==null) return Math.round(x.fame);
  if (x.chair) p += 250;
  return Math.round(p + x.fame*1.5 + x.wins*8);
}
// 인지도는 자리에 걸맞은 수준으로 끌려간다(국회의원 40 안팎, 대통령 95)
function fameTarget(x){
  const base = power(x) - x.fame*1.5;
  const job = x.job ? ({'기자':20, '변호사':14, '창업가':12, '노동조합 간부':12, '시민단체 활동가':10, '국회 보좌진':10}[x.job] || 5) : 3;
  return Math.max(job, 8 + Math.min(87, base/8));
}
function orgTarget(x){
  const job = x.job ? ({'시민단체 활동가':45, '노동조합 간부':50, '자영업자':35, '국회 보좌진':40, '창업가':35}[x.job] || 25) : 20;
  return Math.max(job, 30 + Math.min(55, (power(x) - x.fame*1.5)/8));
}
function setBest(x, o){ if (!x.best || OFF[o].pw > OFF[x.best].pw) x.best = o; }
function exTitle(x){ return x.best ? `전 ${x.best==='gov' ? govTitle(x.home||x.region) : OFF[x.best].n}` : null; }

// ── 다른 정치인(봇) ──────────────────────────────
function mkBot(age, party, region, office){
  const male = rand() < .78, by = P.year - age;
  region = region || wpick(REGIONS.map(r=>[r, REGION[r][0]])).v;
  const b = {id:nextId++, bot:true, name:mkName(by, male), male, by, party, region, home:region, dist:rnd(REGION[region][4]),
    office:office||null, fame:clamp(normal(office ? 18+OFF[office].pw/10 : 15, 8), 3, 95), rep:clamp(normal(55,15),5,95),
    org:clamp(normal(30+(office ? Math.min(50, OFF[office].pw/6) : 0), 10), 5, 95), talk:clamp(normal(55,12), 5, 95),
    wins:office ? ri(1,3) : 0, best:office||null, terms:{}, alive:true, retired:false, chair:false, minister:null, pm:false};
  if (office) b.terms[office] = ri(0,1);
  return b;
}
const bage = b => P.year - b.by;
const active = () => W.bots.filter(b => b.alive && !b.retired);
function partyLeanAt(lean, party){
  const t = W.third;
  return party===0 ? (1-t)*lean : party===1 ? (1-t)*(1-lean) : party===2 ? t : .04;
}
// 대통령 지지율이 낮으면 여당이 진다(정권 심판). 진보 쪽으로 + 값
function swing(){
  const pr = W.pres; if (!pr) return 0;
  const s = (pr.approval-45)/100*.35;
  return pr.party===0 ? s : pr.party===1 ? -s : 0;
}
const leanOf = r => REGION[r][1];

function newWorld(){
  W = {bots:[], news:[], seats:[171,108,15,6], third:.09, pres:null, nextPres:{y:2030, m:5}, approvalHist:[]};
  // 대통령과 내각(2025년 조기 대선으로 들어선 가상 정부)
  const pres = mkBot(61, 0, '경기도', 'president'); pres.fame = 92; pres.wins = 6;
  W.bots.push(pres);
  W.pres = {who:pres, party:0, approval:56, from:2025};
  // 국회의원
  const mpN = [44,28,4,2];
  mpN.forEach((n,p) => { for (let i=0;i<n;i++) W.bots.push(mkBot(ri(38,72), p, null, 'mp')); });
  // 광역단체장(2022년 지방선거 무렵 판세)
  for (const r of REGIONS){ const p = leanOf(r)-.06+normal(0,.03) > .5 ? 0 : 1; W.bots.push(mkBot(ri(50,70), p, r, 'gov')); }
  // 기초단체장·지방의원·지망생
  for (let i=0;i<24;i++) W.bots.push(mkBot(ri(45,68), rand()<.5?0:1, null, 'mayor'));
  for (let i=0;i<20;i++) W.bots.push(mkBot(ri(35,62), wpick([[0,45],[1,45],[2,10]]).v, null, 'metro'));
  for (let i=0;i<24;i++) W.bots.push(mkBot(ri(30,55), wpick([[0,45],[1,45],[2,10]]).v, null, 'local'));
  for (let i=0;i<20;i++) W.bots.push(mkBot(ri(27,45), wpick([[0,42],[1,42],[2,16]]).v, null, null));
  W.bots.forEach(b => { if (b.office==='mp') b.fame = clamp(b.fame+10,0,95); });
  // 당 대표와 내각
  for (let p=0;p<3;p++){ const c = topOf(p, b => b.office==='mp'); if (c) c.chair = true; }
  formCabinet(true);
}
function topOf(party, filter){
  let best=null, bp=-1;
  for (const b of active()) if (b.party===party && W.pres.who!==b && (!filter || filter(b))){ const p=power(b); if (p>bp){bp=p; best=b;} }
  return best;
}
function formCabinet(quiet){
  for (const b of W.bots){ b.minister = null; b.pm = false; }
  if (P && !P.bot){ if (P.minister || P.pm) say('내각이 바뀌어 자리에서 물러났다.'); P.minister = null; P.pm = false; }
  const pool = active().filter(b => b.party===W.pres.party && b!==W.pres.who && !b.chair && bage(b)>=40 && b.office!=='gov' && b.office!=='mayor')
    .sort((a,b)=>power(b)-power(a));
  const pm = pool.shift(); if (pm) pm.pm = true;
  const mins = MINISTRY.slice().sort(()=>rand()-.5).slice(0,8);
  for (const m of mins){ const b = pool.splice(ri(0,Math.min(5,pool.length-1)),1)[0]; if (b) b.minister = m; }
  if (!quiet && pm) news(`${pm.name}, 국무총리 취임`);
}

// ── 태어나기 ─────────────────────────────────────
function births(y){ return {2017:357800,2018:326800,2019:302700,2020:272300,2021:260600,2022:249200,2023:230000,2024:238300,2025:254500}[y] || 250000; }
const WEALTH = ['어려운 형편','넉넉지 않은 형편','보통 형편','여유 있는 집','부유한 집'];
const TALK = ['말수가 적은 아이','수줍은 아이','보통 아이','말을 잘하는 아이','사람들 앞에 서면 빛나는 아이'];

function newLife(){
  const rows = []; let prob = 1;
  const row = (label, value, p, note) => { rows.push({label, value, p, note}); prob *= p; };
  const by = YEAR, bm = ri(0,11);
  P = {bot:false, alive:true, by, bm, year:by, month:bm, age:0, ver:0, log:[], pending:null, queue:[], shows:[], wins:0, losses:0,
       party:null, office:null, best:null, terms:{}, minister:null, pm:false, chair:false, chairEnd:0, termEnd:0, dirty:0, prison:0,
       retired:false, ex:null, careers:[], titles:[], peak:0, peakRank:null, flags:{}, edu:null, job:null, money:0, id:0};
  newWorld();

  const nb = births(by);
  row('출생', `${by}년 ${bm+1}월`, nb/POP, `올해 태어나는 아기 약 ${nb.toLocaleString('ko-KR')}명`);
  const sx = wpick([['M',.512],['F',.488]]); P.male = sx.v==='M';
  row('성별', P.male ? '남자' : '여자', sx.p);
  const rg = wpick(REGIONS.map(r=>[r, REGION[r][0]])); P.region = P.home = rg.v;
  row('출생지', rg.v, rg.p, `이 지역 진보 쪽 득표 비율 약 ${Math.round(leanOf(rg.v)*100)}%`);
  const wl = wpick([[0,15],[1,25],[2,35],[3,20],[4,5]]); P.wealth = wl.v;
  row('집안 형편', WEALTH[wl.v], wl.p);
  const lean = leanOf(rg.v);
  const pl = wpick([['진보 쪽',.62*lean],['보수 쪽',.62*(1-lean)],['정치에 관심 없음',.38]]); P.parentsLean = pl.v;
  row('부모님 정치 성향', pl.v, pl.p);
  const tk = ri(0,4); P.talk = clamp(Math.round(normal([28,40,50,60,72][tk],4)),5,95);
  row('타고난 기질', TALK[tk], .2);
  const sn = wpick(SURNAME); P.name = sn.v + givenName(by, P.male);
  row('이름', P.name, sn.p, `${sn.v}씨는 인구의 약 ${(sn.p*100).toFixed(1)}%`);

  P.hp = clamp(Math.round(normal(82,8)),40,100);
  P.smart = clamp(Math.round(normal(50,15)),5,95);
  P.fame = 0; P.rep = 60; P.org = clamp(Math.round(normal(10+P.wealth*3,4)),0,40);
  P.cur = {year:by, age:0, lines:[]}; P.log.push(P.cur);
  say(`${P.region}에서 ${WEALTH[P.wealth]}의 ${P.male?'아들':'딸'}로 태어났다.`);
  return {rows, prob, expected: POP*prob};
}

// ── 한 달 ────────────────────────────────────────
function step(){
  if (!P.alive || P.pending || P.shows.length) return false;
  P.month++;
  if (P.month===12){ P.month = 0; P.year++; worldYear(); }
  worldMonth();
  if (P.month===P.bm){ P.age++; P.cur = {year:P.year, age:P.age, lines:[]}; P.log.push(P.cur); P.ver++; lifeYear(); }
  if (P.alive) calendar();
  const r = rank(); if (P.party!=null && (P.peakRank==null || r.me < P.peakRank)) P.peakRank = r.me;
  P.peak = Math.max(P.peak, power(P));
  return true;
}

// 선거·전당대회 일정
function calendar(){
  const y = P.year, m = P.month;
  if (m===5 && (y-2026)%4===0) election('지선');
  if (m===3 && (y-2028)%4===0) election('총선');
  if (y===W.nextPres.y && m===W.nextPres.m) election('대선');
  if (m===7 && y%2===0) convention();
}

// ── 정치판의 한 달 ───────────────────────────────
function worldMonth(){
  const pr = W.pres;
  const pull = P===pr.who ? 38 + (P.talk-50)*.15 + (P.rep-50)*.15 : 40;
  pr.approval = clamp(pr.approval + (pull-pr.approval)*.04 + normal(0,1.8), 8, 85);
  W.third = clamp(W.third + (.09-W.third)*.03 + normal(0,.004), .03, .25);
  if (P.month===0) W.approvalHist.push(Math.round(pr.approval));
  // 탄핵: 지지율이 바닥이고 야당이 3분의 2를 넘으면
  const opp = W.seats.reduce((s,n,i)=>s+(i===pr.party?0:n),0);
  if (pr.approval<22 && opp>=200 && !W.impeach && rand()<.03) impeach();
}
function impeach(){
  const pr = W.pres, who = pr.who;
  W.impeach = true;
  news(`국회가 ${who===P?'나':who.name} 대통령 탄핵소추안을 가결했다`, true);
  if (rand() < .7){
    news(`헌법재판소가 ${who===P?'나':who.name} 대통령을 파면했다`, true);
    if (who===P){ say('대통령직에서 파면됐다.', {fame:5, rep:-25}, 'big'); endOffice(P); P.ex = '파면된 전 대통령'; }
    W.pres.who = {name:who.name, party:who.party, alive:false}; earlyPres();
  } else news('헌법재판소가 탄핵소추를 기각했다', true);
  W.impeach = false;
}

function worldYear(){
  // 나이·은퇴·사망
  for (const b of active()){
    const a = bage(b);
    if (rand() < gompQ(a, b.male ? 88 : 93)){ b.alive = false; if (power(b)>150) news(`${title(b)} ${b.name} 별세 (향년 ${a}세)`); vacate(b); continue; }
    if ((a>70 && rand()<.15) || a>82){ b.retired = true; if (power(b)>150) news(`${b.name}, 정계 은퇴`); vacate(b); continue; }
    b.fame = clamp(b.fame + (fameTarget(b)-b.fame)*.25 + normal(1,4), 1, 99);
    b.org = clamp(b.org + (orgTarget(b)-b.org)*.15 + normal(0,2), 1, 99);
    if (b.office && rand() < .012){ news(`[수사] ${title(b)} ${b.name}, 뇌물 혐의로 기소`); b.rep -= 30; if (rand()<.6){ news(`${b.name}, 유죄 확정으로 ${OFF[b.office].n}직 상실`); vacate(b); b.office=null; b.ex = exTitle(b); } }
  }
  // 새 얼굴
  for (let i=0;i<7;i++){ const nl = clamp(.5+swing(),.2,.8); W.bots.push(mkBot(ri(27,40), wpick([[0,nl*(1-W.third)],[1,(1-nl)*(1-W.third)],[2,W.third]]).v, null, null)); }
  // 개각
  if (rand() < .35){
    const cur = active().filter(b=>b.minister);
    const out = cur.sort(()=>rand()-.5).slice(0, ri(1,3));
    const pool = active().filter(b=>b.party===W.pres.party && !b.minister && !b.pm && !b.chair && b!==W.pres.who && bage(b)>=40 && b.office!=='gov' && b.office!=='mayor');
    for (const o of out){ const n = pool.splice(ri(0,Math.min(6,pool.length-1)),1)[0]; if (n){ n.minister = o.minister; news(`${n.name}, ${o.minister} 장관 내정`); } o.minister = null; }
    if (P.minister && rand()<.4){ say(`개각으로 ${P.minister} 장관에서 물러났다.`); P.ex = P.ex || `전 ${P.minister} 장관`; P.minister = null; }
  }
  W.bots = W.bots.filter(b => b.alive || bage(b) < 100).slice(-600);
}
function vacate(b){
  b.minister = null; b.pm = false; b.chair = false;
  if (W.pres.who===b){ W.pres.who = {name:b.name, party:b.party, alive:false}; earlyPres(); }
}
function earlyPres(){ let m = P.month+2, y = P.year; if (m>11){ m-=12; y++; } W.nextPres = {y, m}; news('대통령 궐위로 두 달 뒤 보궐 대선이 열린다', true); }
function setPres(who){
  const old = W.pres && W.pres.who;
  if (old && old!==who && old.alive!==false){ old.ex = '전 대통령'; if (old.office==='president') old.office = null; }
  W.pres = {who, party:who.party, approval:58, from:P.year};
  W.nextPres = {y:P.year+5, m:P.month};
  who.chair = false;
}

// ── 내 한 해 ─────────────────────────────────────
function lifeYear(){
  const a = P.age;
  // 몸과 돈
  if (a>45) P.hp = clamp(P.hp - (a>70?2:a>60?1:.5) + normal(0,1), 0, 100);
  if (P.prison){ P.prison--; P.hp = clamp(P.hp-3,0,100); if (!P.prison) say('형기를 마치고 출소했다.', {rep:5}); else say('교도소에서 한 해를 보냈다.', {hp:-2}); }
  const inc = income();
  if (a>=22 && !P.prison){ const spend = 2600 + P.wealth*400; P.money += inc - spend; }
  if (a>18){
    P.fame = clamp(P.fame + (fameTarget(P)-P.fame)*.25, 0, 100);
    P.org = clamp(P.org + (orgTarget(P)-P.org)*.15, 0, 100);
  }
  if (a<=18) schoolYear(a);
  else if (P.party==null || P.retired) civilianYear(a);
  else politicsYear(a);
  if (a>=19 && a<=22 && P.edu===null) college();
  if (a===24 && !P.job) career();
  if (P.job && !P.flags.partyAsked && a>=25 && P.party==null && rand() < (P.job==='국회 보좌진' ? 1 : .35)) joinParty();
  if (P.job && P.flags.partyAsked && P.party==null && a>=30 && a<=60 && a%5===0 && rand()<.6) joinParty();
  if (a>=70 && P.party!=null && !P.retired && !P.office && !P.pending && a%3===1) retireAsk();
  family(a);
  death(a);
}
function income(){
  if (P.prison) return 0;
  let inc = 0;
  if (P.office) inc = OFF[P.office].sal;
  else if (P.pm) inc = 20000; else if (P.minister) inc = 14000;
  else if (P.job && P.age<65) inc = JOBS[P.job].inc;
  else if (P.age>=65) inc = 1500;
  if (W.pres.who===P) inc = OFF.president.sal;
  return inc;
}

function schoolYear(a){
  if (a===7) say(`${P.year<1996?'국민':'초등'}학교에 입학했다.`);
  if (a===13) say('중학교에 입학했다.');
  if (a===16) say('고등학교에 입학했다.');
  P.smart = clamp(P.smart + normal(.3,1.5), 0, 100);
  P.talk = clamp(P.talk + normal(.2,1.2), 0, 100);
  if (a>=9 && a<=17 && rand() < .14 + (P.talk-50)/200){
    const w = rand() < sig((P.talk-50)/12);
    say(w ? '반장 선거에 나가 당선됐다. 첫 선거였다.' : '반장 선거에 나갔다가 떨어졌다.', w ? {talk:2, org:2} : {talk:1});
    if (w) P.flags.class = (P.flags.class||0)+1;
  }
  if (a===17 && P.talk>60 && rand()<.3){ const w = rand()<sig((P.talk-60)/8); say(w ? '전교 학생회장에 당선됐다.' : '전교 학생회장 선거에서 아깝게 졌다.', w ? {talk:3, org:4, fame:1} : {talk:2}); }
  if (a===18){
    const s = P.smart + P.wealth*5 + normal(0,10);
    P.exam = s;
    say('수능을 봤다.');
  }
}

const UNI = [[95,'서울 상위권 대학',{org:10, smart:3}],[78,'수도권 대학',{org:5}],[58,'지방 국립대',{org:4}],[42,'지방 사립대',{org:2}]];
function college(){
  const u = UNI.find(x => P.exam >= x[0]);
  if (P.male) say('입대해 18개월 동안 군 복무를 했다.', {hp:2, org:1});
  if (!u){ P.edu = '고졸'; say('대학에 가지 않고 일을 시작했다.'); if (!P.job) career(); return; }
  P.edu = u[1];
  if (u[1]==='서울 상위권 대학' || (u[1]==='수도권 대학' && P.home!=='경기도' && P.home!=='인천광역시')){ if (P.home!=='서울특별시') say('대학 때문에 서울로 올라왔다.'); P.home = '서울특별시'; }
  say(`${u[1]}에 입학했다.`, u[2]);
  const majors = [['법학','법조인 길이 열린다', {smart:2}],['정치외교학','정치에 대한 감이 생긴다', {org:2, fame:1}],['경제학','숫자에 밝아진다', {smart:2}],['사회학','사람을 만나는 일이 많다', {org:3}],['공학','먹고살 길은 확실하다', {money:0}]];
  ask({title:'전공 선택', desc:`${u[1]}에서 무엇을 공부할까?`, options: majors.map(([m,sub,e]) => ({label:m, sub, go:() => {
    P.major = m; say(`${m}을 전공했다.`, e);
    ask({title:'대학 생활', desc:'4년을 어떻게 보낼까?', options:[
      {label:'총학생회 활동', sub:'선거 경험, 인맥', go:()=>{ const w = rand()<sig((P.talk-55)/10); say(w ? '총학생회장에 당선됐다.' : '총학생회 선거에서 졌지만 사람을 얻었다.', w ? {talk:4, org:8, fame:2, smart:-3} : {org:5, talk:2}); P.flags.student = w; }},
      {label:'학점 관리', sub:'능력 +', go:()=>say('도서관에서 살았다.', {smart:5})},
      {label:'시민사회 동아리', sub:'조직력 +, 평판 +', go:()=>say('봉사와 캠페인을 다녔다.', {org:5, rep:4})},
      {label:'아르바이트', sub:'돈 +', go:()=>say('학비를 벌며 다녔다.', {money:1500, hp:-2})}
    ]});
  }}))});
}

const JOBS = {
  '변호사':{inc:12000, d:{smart:.3}}, '기자':{inc:5500, d:{talk:.4}}, '시민단체 활동가':{inc:2800, d:{org:1.5, rep:.5}},
  '노동조합 간부':{inc:4500, d:{org:1.5}}, '회사원':{inc:5500, d:{}}, '행정 공무원':{inc:6000, d:{smart:.4}},
  '창업가':{inc:5000, d:{org:.5}}, '국회 보좌진':{inc:5000, d:{org:1}}, '자영업자':{inc:4000, d:{org:.6}}, '생산직 노동자':{inc:4200, d:{}}
};
function career(){
  const uni = P.edu && P.edu!=='고졸';
  const law = clamp((P.smart-45)/45 + (P.major==='법학'?.15:0), .05, .9);
  const gosi = clamp((P.smart-58)/40, .03, .7);
  const press = clamp(((P.smart+P.talk)/2-35)/50, .1, .8);
  const set = (j, line, eff) => { P.job = j; P.careers.push(j); say(line, eff); };
  const opts = uni ? [
    {label:'로스쿨', sub:`변호사시험 합격 가능성 ${Math.round(law*100)}%`, go:()=>{ say('로스쿨에 들어갔다.', {money:-6000}); if (rand()<law) set('변호사','3년 뒤 변호사시험에 합격했다.', {fame:2, smart:3}); else set('회사원','변호사시험에 떨어져 회사에 들어갔다.', {}); }},
    {label:'행정고시', sub:`합격 가능성 ${Math.round(gosi*100)}%`, go:()=>{ if (rand()<gosi) set('행정 공무원','행정고시에 합격해 사무관이 됐다.', {smart:3, rep:3}); else set('회사원','몇 년을 공부했지만 떨어져 회사에 들어갔다.', {smart:2}); }},
    {label:'언론사 입사', sub:`합격 가능성 ${Math.round(press*100)}%`, go:()=>{ if (rand()<press) set('기자','언론사 기자가 됐다.', {fame:2}); else set('회사원','언론사 시험에 떨어져 회사에 들어갔다.', {}); }},
    {label:'국회 보좌진', sub:'정치에 바로 들어선다', go:()=>set('국회 보좌진','국회의원 사무실의 비서로 일을 시작했다.', {org:3})},
    {label:'시민단체', sub:'월급은 적다', go:()=>set('시민단체 활동가','시민단체 상근 활동가가 됐다.', {rep:3, org:2})},
    {label:'회사 취업', sub:'안정적', go:()=>set('회사원','회사에 취직했다.', {money:500})},
    {label:'창업', sub:'망하거나 뜨거나', go:()=>{ if (rand()<.3) set('창업가','창업한 회사가 자리를 잡았다.', {money:20000, fame:3, org:3}); else set('자영업자','창업했다가 접고 작은 가게를 차렸다.', {money:-5000}); }}
  ] : [
    {label:'공장 취업', sub:'노조 활동을 할 수 있다', go:()=>{ set('생산직 노동자','공장에 취직했다.', {}); }},
    {label:'장사', sub:'동네 사람을 안다', go:()=>set('자영업자','작은 가게를 차렸다.', {org:3, money:-1500})},
    {label:'시민단체', sub:'월급은 적다', go:()=>set('시민단체 활동가','시민단체 활동가가 됐다.', {rep:3, org:2})},
    {label:'정당 사무처', sub:'정치에 바로 들어선다', go:()=>set('국회 보좌진','정당 지역 사무실에서 일을 시작했다.', {org:3})}
  ];
  ask({title:'첫 직업', desc:'무엇을 하며 살까?', options:opts});
}

function joinParty(){
  P.flags.partyAsked = true;
  const r = P.home, l = leanOf(r);
  const hint = p => p===0 ? `이 지역 지지 ${Math.round(l*100)}%` : p===1 ? `이 지역 지지 ${Math.round((1-l)*100)}%` : `전국 지지 ${Math.round(W.third*100)}%`;
  const lean = P.parentsLean==='진보 쪽' ? 0 : P.parentsLean==='보수 쪽' ? 1 : null;
  ask({title:'입당', desc:`${P.job==='국회 보좌진' ? '정치판에서 일하려면 당적이 필요하다.' : '정당에서 입당 권유가 왔다.'}${lean!=null ? ` 부모님은 ${pname(lean)} 쪽이다.` : ''}`, options:[
    ...[0,1,2].map(p => ({label:pname(p), sub:`${PARTY[p].side} · ${hint(p)}`, go:()=>enter(p)})),
    {label:'무소속으로 뛴다', sub:'정당 없이 선거에 나간다', go:()=>enter(IND)},
    {label:'정치는 관심 없다', sub:'평범하게 산다', go:()=>say('정치와는 거리를 두기로 했다.')}
  ]});
}
function enter(p){
  P.party = p; P.dist = P.dist || rnd(REGION[P.home][4]);
  P.distLean = clamp(leanOf(P.home) + normal(0,.05), .1, .92);
  P.region = P.home;
  say(p===IND ? `${P.home} ${P.dist}에서 무소속 정치인으로 활동을 시작했다.` : `${pname(p)}에 입당했다. 활동 지역은 ${short(P.home)} ${P.dist}.`, {org:3, fame:2});
}

function civilianYear(a){
  if (P.job && JOBS[P.job]) grow(JOBS[P.job].d);
  if (a===65 && P.job){ say('일을 그만두고 은퇴했다.'); }
  if (P.job==='생산직 노동자' && a>=28 && a<=45 && !P.flags.union && rand()<.12){ P.flags.union = true; P.job = '노동조합 간부'; P.careers.push('노동조합 간부'); say('노동조합 간부로 뽑혔다.', {org:6, talk:2}); }
  if (P.job==='기자' && rand()<.06) say('특종 보도로 이름이 알려졌다.', {fame:6});
  if (P.job==='변호사' && rand()<.06) say('사회적으로 주목받은 사건을 맡았다.', {fame:5, rep:2});
}
function grow(d){ for (const k in d) P[k] = clamp(P[k] + d[k] + normal(0,.6), 0, 100); }

// 정치인으로 사는 한 해
function politicsYear(a){
  if (P.prison) return;
  if (P.job && JOBS[P.job] && !P.office && !P.minister) grow(JOBS[P.job].d);
  if (P.office) say(`${title(P)}로 일했다.`);
  const ev = [];
  if (P.office==='mp') ev.push(
    ['대표발의한 법안이 본회의를 통과했다.', {fame:3, rep:2}],
    ['국정감사에서 날카로운 질의로 화제가 됐다.', P.talk>55 ? {fame:7} : {fame:2}],
    ['막말 논란에 휩싸였다.', {rep:-7, fame:4}],
    ['지역구 예산을 크게 따냈다.', {org:5, rep:1}],
    ['당 지도부와 부딪혔다.', {org:-3, fame:3}],
    ['단식 농성을 했다.', {hp:-5, fame:5}]);
  else if (P.office==='local' || P.office==='metro') ev.push(
    ['지역 민원을 해결하느라 발로 뛰었다.', {org:4}], ['조례안을 냈다.', {fame:1, smart:1}],
    ['외유성 해외연수로 비판받았다.', {rep:-5}], ['지역 언론 인터뷰가 화제가 됐다.', {fame:3}]);
  else if (P.office==='mayor' || P.office==='gov') ev.push(
    ['지역 축제가 크게 성공했다.', {fame:4, org:2}], ['개발 사업을 두고 주민과 갈등을 빚었다.', {rep:-4, org:-2}],
    ['재난 대응을 잘했다는 평가를 받았다.', {fame:5, rep:4}], ['대기업 공장을 유치했다.', {fame:4, org:4}],
    ['측근 비리로 곤욕을 치렀다.', {rep:-8}]);
  else if (W.pres.who===P) ev.push(
    ['정상회담을 했다.', {fame:3}], ['경제 지표가 나빠져 비판을 받았다.', {rep:-3}], ['대국민 담화를 했다.', {talk:1}]);
  else ev.push(
    ['방송 시사 프로그램 패널로 나갔다.', P.talk>55 ? {fame:5} : {fame:1}], ['지역 행사를 빠짐없이 돌았다.', {org:4, hp:-1}],
    ['당 행사에서 사회를 봤다.', {org:2, fame:1}], ['책을 내고 북콘서트를 열었다.', {fame:3, money:500}],
    ['선거를 돕다 몸살이 났다.', {hp:-3, org:3}]);
  if (P.minister) ev.push(['인사청문회를 무사히 통과했다.', {fame:4}], ['국회에서 야당 의원들과 설전을 벌였다.', {fame:4, rep:-2}]);
  if (P.chair) ev.push(['당 대표로서 당을 이끌었다.', {fame:4, org:3}], ['당내 반발에 부딪혔다.', {org:-4}]);
  const e = rnd(ev), eff = {...e[1]};
  if (eff.fame) eff.fame = Math.round(eff.fame*.3);
  say(e[0], eff);

  // 대통령
  if (W.pres.who===P) presYear();
  // 돈 봉투
  if ((P.office || P.minister) && rand() < .1 && !P.pending){
    const amt = Math.round(OFF[P.office||'mp'].pw * 40 * (0.5+rand()));
    ask({title:'돈 봉투', desc:`한 사업가가 '잘 봐 달라'며 ${won(amt)}을 내밀었다.`, options:[
      {label:'받는다', sub:'아무도 모를 수도', go:()=>{ P.dirty++; say('돈을 받았다.', {money:amt}); }},
      {label:'돌려보낸다', sub:'평판 +', go:()=>say('돌려보냈다.', {rep:3})}
    ]});
  }
  // 수사
  if (P.dirty && rand() < .07*P.dirty) investigated();
  // 장관 제의
  if (!P.minister && !P.pm && W.pres.who!==P && P.party===W.pres.party && P.fame>=45 && P.age>=40 && ['mp',null].includes(P.office) && rand()<.18 && !P.pending) offerCabinet();
}

function presYear(){
  if (P.pending) return;
  ask({title:'국정 방향', desc:`대통령 지지율 ${Math.round(W.pres.approval)}%. 올해는 무엇에 힘을 쏟을까?`, options:[
    {label:'경제 살리기', sub:'잘되면 지지율 크게 오른다', go:()=>{ const d = normal(3,8); W.pres.approval = clamp(W.pres.approval+d, 5, 90); say(d>0 ? '경기가 살아났다는 평가를 받았다.' : '경제 정책이 헛돌았다.', {fame:2}); }},
    {label:'개혁 드라이브', sub:'평판 +, 지지율 −', go:()=>{ W.pres.approval = clamp(W.pres.approval-4, 5, 90); say('밀어붙인 개혁 법안이 통과됐다.', {rep:5, fame:3}); }},
    {label:'국민 통합', sub:'지지율 조금 +', go:()=>{ W.pres.approval = clamp(W.pres.approval+3, 5, 90); say('야당 대표와 영수회담을 했다.', {rep:2}); }},
    {label:'외교 순방', sub:'인지도 +', go:()=>{ W.pres.approval = clamp(W.pres.approval+normal(1,3), 5, 90); say('정상 외교를 펼쳤다.', {fame:3, hp:-1}); }}
  ]});
}

function investigated(){
  say('검찰이 수사에 들어갔다.', {rep:-10, fame:4}, 'big');
  if (rand() < .65){
    const y = ri(1,4); P.prison = y; P.dirty = 0;
    say(`뇌물 혐의로 징역 ${y}년이 확정됐다.`, {rep:-25, fame:5}, 'big');
    if (P.office || P.minister || P.chair){ endOffice(P); P.minister = null; P.chair = false; }
    news(`${P.name}, 뇌물 혐의로 징역 ${y}년 확정`);
  } else { say('무죄 판결을 받았다.', {rep:4}); P.dirty = Math.max(0, P.dirty-1); }
}
function endOffice(x){
  if (x.office){ x.ex = exTitle(x); if (x.office!=='president') x.terms[x.office] = 0; }
  if (W.pres.who===x){ x.ex = '전 대통령'; W.pres.who = {name:x.name, party:x.party, alive:false, gone:true}; }
  x.office = null;
}

function offerCabinet(){
  const pm = P.fame>=70 && rand()<.35;
  const min = rnd(MINISTRY);
  ask({title: pm ? '국무총리 제의' : '장관 제의', desc: pm ? '대통령이 국무총리를 맡아 달라고 한다.' : `대통령실에서 ${min} 장관을 맡아 달라는 연락이 왔다.`, options:[
    {label:'수락', sub:'인사청문회를 거친다', go:()=>{
      if (P.dirty && rand()<.6){ say('인사청문회에서 돈 문제가 드러나 낙마했다.', {rep:-12, fame:5}, 'big'); return; }
      if (pm){ for (const b of W.bots) b.pm = false; P.pm = true; say('국무총리에 취임했다.', {fame:4}, 'big'); news(`${P.name}, 국무총리 취임`); }
      else { P.minister = min; say(`${min} 장관에 취임했다.`, {fame:3}, 'big'); news(`${P.name}, ${min} 장관 취임`); }
    }},
    {label:'고사', sub:'지역구를 지킨다', go:()=>say('정중히 고사했다.', {org:2})}
  ]});
}

function retireAsk(){
  ask({title:'정계 은퇴', desc:`${P.age}세. 이제 그만 내려놓을까?`, options:[
    {label:'은퇴한다', sub:'남은 삶은 조용히', go:()=>{ P.retired = true; P.chair = false; say('정계 은퇴를 선언했다.', null, 'big'); news(`${P.name}, 정계 은퇴`); }},
    {label:'아직이다', sub:'한 번 더', go:()=>say('아직 할 일이 남았다고 생각했다.')}
  ]});
}

function family(a){
  if (!P.married && a>=27 && a<=45 && rand()<.12){ P.married = true; say('결혼했다.', {hp:1}); }
  if (P.married && !P.kids && a<=42 && rand()<.15){ P.kids = 1; say('아이가 태어났다.'); }
  else if (P.kids===1 && a<=44 && rand()<.07){ P.kids = 2; say('둘째가 태어났다.'); }
  if (a===55+ri(0,20) && !P.flags.parents){ P.flags.parents = true; say('부모님이 세상을 떠나셨다.', {money: [0,0,3000,15000,80000][P.wealth]}); }
}

function death(a){
  let q = gompQ(a-1, P.male ? 88.5 : 93.5) * (1 + Math.max(0, 50-P.hp)/30);
  if (P.prison) q *= 1.3;
  if (rand() < q){ die(deathCause(a)); }
}
function die(cause){
  P.alive = false; P.cause = cause; P.pending = null;
  say(`${cause}${eu(cause)} 세상을 떠났다. 향년 ${P.age}세.`, null, 'death');
  if (W.pres.who===P){ news(`${P.name} 대통령 서거`); W.pres.who = {name:P.name, party:P.party, alive:false}; }
}

// ── 선거 ─────────────────────────────────────────
// 내가 나갈 수 있는 자리
function canRun(kind){
  if (P.party==null || P.retired || P.prison || !P.alive || P.age<18 || W.pres.who===P) return [];
  const o = [];
  const best = P.best ? OFF[P.best].pw : 0;
  const lim = k => OFF[k].lim && (P.terms[k]||0) >= OFF[k].lim;
  if (kind==='지선'){
    o.push('local');
    if (P.fame>=15 || best>=30 || P.org>=40) o.push('metro');
    if (P.fame>=30 || best>=55) o.push('mayor');
    if (P.fame>=50 || best>=130) o.push('gov');
  } else if (kind==='총선') o.push('mp');
  else if (kind==='대선' && P.age>=40 && P.fame>=60 && best>=200 && P.party!==IND && partyRank()<=3 && (P.flags.presLoss||0)<2) o.push('president');
  return o.filter(k => !lim(k));
}

// 같은 당 안에서 몇 번째 거물인가(대통령 제외)
function partyRank(){
  const me = power(P);
  return 1 + active().filter(b => b.party===P.party && b!==W.pres.who && power(b) > me).length;
}
function election(kind){
  // 같은 종류 선거라면 지금 자리는 임기가 끝난다
  const opts = canRun(kind);
  if (W.pres.who===P && kind==='대선'){ endOffice(P); say('대통령 임기를 마쳤다.', null, 'big'); }
  if (!opts.length || W.pres.who===P){ worldElection(kind, null); return; }
  const expiring = P.office && OFF[P.office].kind===kind;
  const keep = P.office && !expiring;
  const label = {지선:'지방선거', 총선:'국회의원 총선거', 대선:'대통령 선거'}[kind];
  ask({title:`${P.year} ${label}`, desc: expiring ? `${title(P)} 임기가 끝난다. 어디에 나갈까?` : keep ? `지금은 ${title(P)}. 다른 자리에 나가려면 사퇴해야 한다.` : '출마할까?', options:[
    ...opts.map(k => {
      const f = field(k), ch = chance(f);
      return {label: k===P.office ? `${OFF[k].n} 재선 도전` : `${OFF[k].n} 출마`, sub:`당선 가능성 약 ${Math.round(ch*100)}% · 비용 ${won(cost(k))}${keep && k!==P.office ? ' · 현직 사퇴' : ''}`, go:()=>{
        if (keep && k!==P.office){ say(`${title(P)}에서 물러났다.`); endOffice(P); }
        runFor(f, kind);
      }};
    }),
    {label: keep ? '현직 유지' : '불출마', sub: keep ? '이번엔 쉬어 간다' : expiring ? '임기를 마치고 물러난다' : '다음을 기약한다', go:()=>{
      if (expiring){ say(`${title(P)} 임기를 마쳤다.`); endOffice(P); }
      worldElection(kind, null);
    }}
  ]});
}
function cost(k){ return P.party===IND ? OFF[k].cost : Math.round(OFF[k].cost*(k==='president'?1:.6)); }

// 이번 선거에 나올 사람들. 미리 보기와 실제 선거가 같은 상대를 쓴다
function field(k){
  const region = P.home;
  const top = (party, f) => active().filter(b => b.party===party && b!==W.pres.who && !b.pm && f(b)).sort((a,b)=>power(b)-power(a));
  const local = b => b.home===region && (!b.office || OFF[b.office].pw <= OFF[k].pw*1.6);
  let prim = [];
  if (P.party!==IND){
    const n = k==='president' ? 3 : k==='gov' ? 2 : k==='mp' ? ri(1,2) : ri(0,1);
    prim = k==='president' ? top(P.party, b => bage(b)>=40 && power(b)>200).slice(0,n) : top(P.party, local).slice(0,n);
    while (prim.length < n) prim.push(ghost(P.party, k, region));
    // 대선 경선에는 바깥에서 영입된 스타가 끼어들곤 한다
    if (k==='president' && rand()<.6){ const g = ghost(P.party, k, region); g.fame = clamp(normal(78,8),50,98); g.org = 60; g.star = true; prim.push(g); }
  }
  const parties = P.party===IND ? [0,1,2] : [0,1,2].filter(p => p!==P.party);
  const opp = parties.map(p => (k==='president' ? top(p, b => bage(b)>=40)[0] : top(p, local)[0]) || ghost(p, k, region));
  const extra = k==='local' ? [0,1].map(p => ghost(p, k, region)) : [];
  return {k, region, prim, opp, extra};
}
// 당선 확률(미리 보기): 같은 판을 여러 번 굴려 본다
function chance(f){
  let w = 0; const n = 150;
  for (let i=0;i<n;i++) if (race(f).won) w++;
  return w/n;
}
function ghost(party, k, region){   // 이름만 있는 상대(지역 정치인)
  const tier = {local:10, metro:18, mayor:30, mp:40, gov:55, president:70}[k];
  return {name: mkName(P.year - ri(35,65), rand()<.78), party, fame: clamp(normal(tier,10),2,95), rep:55, org:clamp(normal(tier+10,10),5,95), talk:clamp(normal(50,10),5,95), ghost:true, home:region, inc: rand()<.35};
}
function quality(x, k){
  const s = (k==='local'||k==='metro') ? .6 : k==='president' ? .5 : 1;
  return s*((x.fame-45)*.0028 + (x.org-50)*.0016 + (x.rep-50)*.0012 + (x.talk-50)*.001) + (x.inc || x.office===k ? .025 : 0);
}

// 한 번의 판: 경선 → 본선. 결과만 만들고 상태는 바꾸지 않는다
function race(f){
  const k = f.k;
  const out = {k, prim:null, main:null, won:false};
  if (f.prim.length){
    const st = x => x.fame*.45 + x.org*.35 + x.talk*.2 + (x.office===k || x.inc ? 10 : 0) + normal(0,9);
    const c = [{name:P.name, me:true, party:P.party, v:st(P) - (P.rep<30 ? 15 : 0)}].concat(f.prim.map(r => ({name:r.name, party:r.party, v:st(r), ref:r})));
    const tot = c.reduce((s,x)=>s+Math.max(1,x.v),0);
    c.forEach(x => x.share = Math.max(1,x.v)/tot);
    out.prim = {cands:c.sort((a,b)=>b.share-a.share)};
    if (!out.prim.cands[0].me) return out;
  }
  const region = f.region, opp = f.opp;
  const lean = k==='president' ? .5 : k==='gov' ? leanOf(region) : P.distLean;
  const l = clamp(lean + swing() + normal(0,.025), .05, .95);
  const c = [{name:P.name, me:true, party:P.party, v: (P.party===IND ? .05 + P.fame*.002 : partyLeanAt(l, P.party)) + quality(P, k) + normal(0,.03)}]
    .concat(opp.map(o => ({name:o.name, party:o.party, ref:o, v: partyLeanAt(l, o.party) + quality(o, k)*(o.party===2?.6:1) + normal(0,.03)})));
  // 기초의원은 한 선거구에서 2~3명을 뽑는다. 큰 두 당은 후보를 둘씩 낸다
  let seats = 1;
  if (k==='local'){
    seats = 2;
    for (const p of [0,1]){ const g = f.extra[p]; const base = partyLeanAt(l, p);
      const mine = c.find(x=>x.party===p && x.me), other = c.find(x=>x.party===p && !x.me);
      const tgt = mine || other; if (tgt) tgt.v -= base*.42;
      c.push({name:g.name, party:p, ref:g, v: base*.42 + normal(0,.02)}); }
  }
  c.forEach(x => x.v = Math.max(.005, x.v));
  const tot = c.reduce((s,x)=>s+x.v,0);
  c.forEach(x => x.share = x.v/tot);
  c.sort((a,b)=>b.share-a.share);
  out.main = {cands:c, seats, lean:l};
  out.won = c.findIndex(x=>x.me) < seats;
  return out;
}

const KLABEL = {local:'기초의원', metro:'광역의원', mayor:'기초단체장', mp:'국회의원', gov:'광역단체장', president:'대통령'};
function runFor(f, kind){
  const k = f.k, r = race(f);
  const where = k==='president' ? '전국' : k==='gov' ? govTitle(P.home) : k==='mayor' ? chiefTitle(P.dist) : k==='mp' ? `${short(P.home)} ${P.dist} 국회의원` : k==='metro' ? `${short(P.home)} 광역의원` : `${P.dist} 기초의원`;
  if (r.prim){
    show({kind:'prim', title:`${pname(P.party)} ${where} 후보 경선`, cands:r.prim.cands, won:r.prim.cands[0].me, seats:1});
    if (!r.prim.cands[0].me){
      say(`${pname(P.party)} ${where} 경선에서 ${r.prim.cands[0].name}에게 졌다.`, {fame:1, org:-2}, 'big');
      P.losses++; worldElection(kind, null); return;
    }
    say(`${pname(P.party)} ${where} 후보 경선에서 이겼다.`, {fame:2});
  }
  const c = cost(k), me = r.main.cands.find(x=>x.me);
  P.money -= c;
  const refund = me.share>=.15 ? c : me.share>=.10 ? c/2 : 0;
  P.money += refund;
  show({kind:'main', title:`${P.year} ${where} 선거 개표`, cands:r.main.cands, won:r.won, seats:r.main.seats});
  const pos = r.main.cands.indexOf(me)+1;
  if (r.won){
    const was = P.office===k;
    P.office = k; P.terms[k] = was ? (P.terms[k]||0)+1 : 1;
    P.wins++; setBest(P, k); P.ex = null;
    P.titles.push(`${P.year} ${title(P)}`);
    say(`${where} 선거에서 ${pct(me.share)}로 당선됐다!${was ? ` (${P.terms[k]}선)` : ''}`, {fame: Math.round(2 + OFF[k].pw/80), org:2}, 'big');
    if (k==='president') setPres(P);
    news(`${P.name}, ${where} 당선`, false);
  } else {
    P.losses++;
    if (P.office===k) endOffice(P);
    if (k==='president'){ P.flags.presLoss = (P.flags.presLoss||0)+1; fx({fame:-8, org:-5}); }
    say(`${where} 선거에서 ${pct(me.share)}, ${pos}위로 떨어졌다.${refund ? '' : ' 선거비용을 돌려받지 못했다.'}`, {fame:2, money:0}, 'big');
  }
  // 상대 정치인(봇)의 결과
  for (const x of r.main.cands) if (x.ref && x.ref.bot){
    const w = r.main.cands.indexOf(x) < r.main.seats;
    if (w){ x.ref.office = k; x.ref.wins++; setBest(x.ref, k); x.ref.home = P.home; if (k==='president') setPres(x.ref); }
    else if (x.ref.office===k){ x.ref.office = null; x.ref.ex = exTitle(x.ref); }
  }
  // 대선에서 이름만 있던 상대가 이기면 정치판에 들인다
  const top = r.main.cands[0];
  if (k==='president' && !r.won && !(top.ref && top.ref.bot)){ const nb = mkBot(58, top.party, P.home, null); nb.name = top.name; nb.fame = 80; W.bots.push(nb); setPres(nb); nb.office = 'president'; setBest(nb,'president'); }
  worldElection(kind, k);
}

// 내 선거구 말고 나머지 판
function worldElection(kind, mine){
  const sw = swing() + normal(0,.015);
  const pr = W.pres;
  if (kind==='총선'){
    const s = [0,0,0,0];
    for (const r of REGIONS){
      let n = REGION[r][2]; if (mine && r===P.home) n--;
      for (let i=0;i<n;i++){
        const u = rand();
        if (u < W.third*.25) s[2]++;
        else if (u < W.third*.25+.015) s[IND]++;
        else s[leanOf(r)+sw+normal(0,.07) > .5 ? 0 : 1]++;
      }
    }
    if (mine){ if (P.office==='mp') s[P.party]++; else { const w = W.bots.find(b=>b.office==='mp' && b.home===P.home && b.alive && b.party!==P.party) ; s[w ? w.party : (P.party===0?1:0)]++; } }
    // 비례대표 46석
    const nl = clamp(.5+sw,.2,.8), t2 = W.third*1.6;
    const v = [(1-t2)*nl, (1-t2)*(1-nl), t2];
    const pr46 = v.map(x => x*SEATS_PR), base = pr46.map(Math.floor);
    let left = SEATS_PR - base.reduce((a,b)=>a+b,0);
    pr46.map((x,i)=>[x-base[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,left).forEach(([,i])=>base[i]++);
    base.forEach((x,i)=>s[i]+=x);
    W.seats = s;
    // 이름 있는 의원들
    for (const b of active()){
      if (b.office && b.office!=='mp') continue;
      if (mine && b.home===P.home && b.office==='mp') continue;
      const run = b.office==='mp' ? rand()<.85 : (b.fame>=30 && bage(b)>=30 && bage(b)<72 && rand()<.45);
      if (!run){ if (b.office==='mp'){ b.office=null; b.ex = exTitle(b); } continue; }
      const pl = b.party===0 ? leanOf(b.home)+sw : b.party===1 ? 1-leanOf(b.home)-sw : .3;
      const w = rand() < sig((pl-.5)*9 + (b.fame-45)/15 + (b.office==='mp'?.5:0));
      if (w){ b.wins++; b.office = 'mp'; setBest(b,'mp'); }
      else if (b.office==='mp'){ b.office=null; b.ex = exTitle(b); }
    }
    news(`${P.year} 총선 결과 — ${pname(0)} ${s[0]}석, ${pname(1)} ${s[1]}석, ${pname(2)} ${s[2]}석, 무소속 ${s[3]}석`, true);
    const ruling = s[pr.party] || 0;
    if (ruling < 150 && pr.party!==IND) news(`여당 ${pname(pr.party)} 과반 실패 — 여소야대`, false);
    return;
  }
  if (kind==='지선'){
    let g = [0,0,0,0];
    for (const r of REGIONS){
      const inc = active().find(b => b.office==='gov' && b.home===r);
      if (mine==='gov' && r===P.home){
        if (P.office==='gov') g[P.party]++;
        else { const w = active().find(b=>b.office==='gov' && b.home===r); g[w ? w.party : (P.party===0?1:0)]++; }
        continue;
      }
      const p = W.third>.14 && rand()<.06 ? 2 : leanOf(r)+sw+normal(0,.04) > .5 ? 0 : 1;
      g[p]++;
      if (inc && inc.party===p && (inc.terms.gov||0)<2 && rand()<.75){ inc.terms.gov = (inc.terms.gov||0)+1; inc.wins++; continue; }
      if (inc){ inc.office = null; inc.ex = exTitle(inc); inc.terms.gov = 0; }
      const c = active().filter(b => b.party===p && (b.home===r) && ['mp','mayor','metro'].includes(b.office) && !b.minister).sort((a,b)=>power(b)-power(a))[0]
        || (() => { const nb = mkBot(ri(50,64), p, r, 'mayor'); W.bots.push(nb); return nb; })();
      c.office = 'gov'; c.home = r; c.wins++; c.terms.gov = 1; setBest(c,'gov');
      if (c.chair) c.chair = false;
    }
    for (const b of active()){
      if (b.office==='gov' || b.office==='mp' || b.minister || b.pm || W.pres.who===b) continue;
      if (mine && b.home===P.home && b.office===mine) continue;
      let tgt = b.office;
      if (b.office==='local' && rand()<.35) tgt = 'metro';
      else if (b.office==='metro' && rand()<.3) tgt = 'mayor';
      else if (!b.office){ if (bage(b)<60 && rand()<.5) tgt = b.fame>30 ? 'metro' : 'local'; else continue; }
      if (tgt==='mayor' && b.office==='mayor' && (b.terms.mayor||0)>=3) { b.office=null; b.ex=exTitle(b); continue; }
      const pl = b.party===0 ? leanOf(b.home)+sw : b.party===1 ? 1-leanOf(b.home)-sw : .3;
      const w = rand() < sig((pl-.5)*8 + (b.fame-30)/15 + (b.office===tgt?.6:0) + (tgt==='local'?.8:0));
      if (w){ b.terms[tgt] = b.office===tgt ? (b.terms[tgt]||0)+1 : 1; b.office = tgt; b.wins++; setBest(b,tgt); }
      else if (b.office){ b.office = null; b.ex = exTitle(b); }
    }
    news(`${P.year} 지방선거 결과 — 광역단체장 ${pname(0)} ${g[0]}곳, ${pname(1)} ${g[1]}곳${g[2]?`, ${pname(2)} ${g[2]}곳`:''}`, true);
    return;
  }
  if (kind==='대선'){
    if (mine==='president'){ news(`${P.year} 대선 — ${W.pres.who.name} 당선 (${pname(W.pres.party)})`, true); W.nextPres = {y:P.year+5, m:P.month}; formCabinet(); return; }
    const cands = [0,1].map(p => active().filter(b=>b.party===p && bage(b)>=40 && b!==W.pres.who).sort((a,b)=>power(b)-power(a))[0]).filter(Boolean);
    if (cands.length<2){ W.nextPres = {y:P.year+5, m:P.month}; return; }
    const nl = .5 + sw + (cands[0].fame-cands[1].fame)*.002 + normal(0,.025);
    const win = nl>.5 ? cands[0] : cands[1];
    const old = W.pres.who; if (old && old.bot) old.office = null;
    win.office = 'president'; win.wins++; setBest(win,'president');
    setPres(win);
    news(`${P.year} 대선 — ${win.name}(${pname(win.party)}) 당선, ${pct(Math.max(nl,1-nl)*(1-W.third*.6))}`, true);
    formCabinet();
  }
}

// 전당대회: 2년마다 당 대표를 뽑는다
function convention(){
  for (let p=0;p<3;p++){
    const old = active().find(b=>b.chair && b.party===p); if (old) old.chair = false;
    if (P.chair && P.party===p){ P.chair = false; say('당 대표 임기를 마쳤다.'); }
    const can = P.party===p && !P.retired && !P.prison && W.pres.who!==P && (P.office==='mp' || P.best==='mp' || P.best==='gov') && P.fame>=40;
    if (can && !P.pending){
      const rivals = active().filter(b=>b.party===p && b!==W.pres.who && ['mp','gov'].includes(b.office||b.best)).sort((a,b)=>power(b)-power(a)).slice(0,2);
      const st = x => x.fame*.6 + (x.org??55)*.4 + normal(0,8);
      const pick = () => { const c = active().filter(b=>b.party===p && b!==W.pres.who && (b.office==='mp')).sort((a,b)=>power(b)-power(a))[0]; if (c){ c.chair = true; news(`${pname(p)} 새 대표에 ${c.name}`); } };
      ask({title:`${pname(p)} 전당대회`, desc:'당 대표 선거가 열린다. 나갈까?', options:[
        {label:'출마', sub:`상대 ${rivals.map(r=>r.name).join(', ')||'없음'}`, go:()=>{
          const c = [{name:P.name, me:true, party:p, v:st(P)}].concat(rivals.map(r=>({name:r.name, party:p, v:st(r), ref:r})));
          const tot = c.reduce((s,x)=>s+Math.max(1,x.v),0); c.forEach(x=>x.share=Math.max(1,x.v)/tot); c.sort((a,b)=>b.share-a.share);
          show({kind:'prim', title:`${pname(p)} 당 대표 선거`, cands:c, won:c[0].me, seats:1});
          if (c[0].me){ P.chair = true; P.chairEnd = P.year+2; say(`${pname(p)} 대표에 선출됐다.`, {fame:4, org:3}, 'big'); news(`${pname(p)} 새 대표에 ${P.name}`); }
          else { c[0].ref.chair = true; say(`당 대표 선거에서 ${c[0].name}에게 졌다.`, {fame:3}, 'big'); news(`${pname(p)} 새 대표에 ${c[0].name}`); }
        }},
        {label:'나가지 않는다', sub:'', go:pick}
      ]});
    } else {
      const c = active().filter(b=>b.party===p && b!==W.pres.who && (b.office==='mp')).sort((a,b)=>power(b)-power(a))[ri(0,2)];
      if (c){ c.chair = true; if (p<2) news(`${pname(p)} 새 대표에 ${c.name}`); }
    }
  }
}

// ── 순위 ─────────────────────────────────────────
function rank(){
  const list = active().filter(b=>b.party!=null).map(b=>({x:b, p:power(b)}));
  if (P.alive && P.party!=null && !P.retired) list.push({x:P, p:power(P)});
  list.sort((a,b)=>b.p-a.p);
  const me = list.findIndex(e=>e.x===P);
  return {list, me: me<0 ? null : me+1, total:list.length};
}

const E = {newLife, step, choose, ack, title, power, rank, won, pct, pname, short, govTitle, OFF, PARTY, REGION, IND, gompQ,
  get P(){ return P; }, get W(){ return W; }, setRand: f => { rand = f; }, canRun};
if (typeof module !== 'undefined') module.exports = E;
