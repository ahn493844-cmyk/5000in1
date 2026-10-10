// 5천만분의 1 — 인생 엔진
// 화면과 상관없는 규칙만 둔다. 상태는 전역 P 하나에 모은다.
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
function normal(m, s){ let u=0, v=0; while(!u) u=rand(); while(!v) v=rand(); return m + s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function Phi(z){ // 표준정규 누적분포 근사
  const t = 1/(1+0.2316419*Math.abs(z));
  const d = 0.3989423*Math.exp(-z*z/2);
  const p = d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));
  return z>0 ? 1-p : p;
}
// 받침에 맞는 조사
function jong(w){ const c=String(w).charCodeAt(String(w).length-1)-0xAC00; return c<0||c>11171 ? -1 : c%28; }
const J = (w, a, b) => w + (jong(w)>0 ? a : b);
const eu = w => { const j=jong(w); return j>0 && j!==8 ? '으로' : '로'; };
function won(n){
  const s = n<0 ? '−' : ''; n = Math.abs(Math.round(n));
  if (!n) return '0원';
  if (n>=10000){ const e=Math.floor(n/10000), r=n%10000; return `${s}${e.toLocaleString('ko-KR')}억${r?` ${r.toLocaleString('ko-KR')}만`:''} 원`; }
  return `${s}${n.toLocaleString('ko-KR')}만 원`;
}
const ERA = y => y<1970 ? 0 : y<1990 ? 1 : y<2010 ? 2 : 3;

// ── 출생 통계 ────────────────────────────────────
function births(y){
  if (y<1960) return 900000; if (y<1972) return 1000000; if (y<1980) return 850000;
  if (y<1984) return 800000; if (y<1991) return 650000; if (y<1997) return 710000;
  if (y<2002) return 600000; if (y<2017) return 450000;
  return {2017:357800,2018:326800,2019:302700,2020:272300,2021:260600,2022:249200,2023:230000,2024:238300}[y] || 250000;
}
const BIRTH_REGION = [['경기도',27.5],['서울특별시',16.4],['인천광역시',6.3],['경상남도',5.2],['부산광역시',5.1],['충청남도',4.1],['대구광역시',3.7],['경상북도',3.7],['충청북도',3.1],['대전광역시',2.9],['전라남도',2.9],['광주광역시',2.4],['전북특별자치도',2.2],['강원특별자치도',2.1],['울산광역시',2.1],['세종특별자치시',1.4],['제주특별자치도',1.3]];
const kidsTable = by => by<1955?[[3,15],[4,25],[5,30],[6,30]]:by<1965?[[2,10],[3,30],[4,35],[5,25]]:by<1975?[[1,5],[2,35],[3,45],[4,15]]:by<1990?[[1,15],[2,65],[3,20]]:by<2005?[[1,25],[2,62],[3,13]]:[[1,38],[2,52],[3,10]];
const ORD = ['','첫','둘','셋','넷','다섯','여섯'];
const SURNAME = [['김',21.5],['이',14.7],['박',8.4],['최',4.7],['정',4.3],['강',2.4],['조',2.1],['윤',2.1],['장',2.0],['임',1.7],['한',1.5],['오',1.5],['서',1.5],['신',1.5],['권',1.4],['황',1.4],['안',1.4],['송',1.3],['전',1.1],['홍',1.1]]
  .concat('유고문양손배백허남심노하곽성차주우구민류나진지엄채원천방공현'.split('').map(c=>[c,0.75]));
const BLOOD = [['A형',34],['O형',28],['B형',27],['AB형',11]];
const NAMES = [
  [1960,['영수','영호','영식','정수','상철','성수','종수'],['영자','정숙','순자','영숙','춘자','옥순','말순']],
  [1970,['영수','성호','영철','정호','경수','상훈'],['미숙','경숙','영숙','정희','미경','혜숙']],
  [1980,['정훈','성진','성호','상훈','성훈','영훈'],['은주','미영','은정','현정','지영','미정']],
  [1990,['지훈','성민','성훈','현우','정훈','동현'],['지영','은지','수진','지혜','은영','혜진']],
  [2000,['동현','지훈','성민','현우','준호','민수'],['지은','유진','민지','수진','지현','지혜']],
  [2010,['민준','현우','동현','준혁','민재','지훈'],['서연','민지','수빈','서현','지원','유진']],
  [9999,['민준','서준','도윤','예준','시우','하준','주원','이안'],['서연','서윤','지우','하윤','하은','지유','수아','이서']]
];
const givenName = (by, male) => rnd(NAMES.find(n => by < n[0])[male?1:2]);

// 직업: 연 소득(만 원, 지금 돈 가치), 유형
const JOB = {
  '농사':{inc:2200,t:'자영업'}, '어업':{inc:2800,t:'자영업'}, '공장 생산직':{inc:4200,t:'생산직'}, '건설 노동자':{inc:3800,t:'생산직'},
  '운전기사':{inc:3600,t:'생산직'}, '작은 가게 사장':{inc:4000,t:'자영업'}, '식당 사장':{inc:4500,t:'자영업'},
  '중소기업 회사원':{inc:4200,t:'중소기업'}, '대기업 회사원':{inc:8000,t:'대기업'}, '공무원':{inc:5200,t:'공무원'},
  '교사':{inc:5600,t:'교사'}, '경찰관':{inc:5400,t:'공무원'}, '직업군인':{inc:5200,t:'공무원'}, '은행원':{inc:8000,t:'은행'},
  'IT 개발자':{inc:7000,t:'대기업'}, '의사':{inc:20000,t:'의사'}, '변호사':{inc:15000,t:'전문직'}, '교수':{inc:11000,t:'교사'},
  '회사 임원':{inc:18000,t:'대기업'}, '사업가':{inc:14000,t:'자영업'}, '간호사':{inc:5200,t:'전문직'}, '판매직':{inc:2800,t:'서비스'},
  '서비스직':{inc:2700,t:'서비스'}, '미용사':{inc:3000,t:'자영업'}, '일용직':{inc:2200,t:'서비스'}, '보험설계사':{inc:3800,t:'서비스'},
  '프리랜서':{inc:3600,t:'서비스'}, '무직':{inc:0,t:'무직'}, '전업주부':{inc:0,t:'주부'}
};
const FJOBS = [
  [['농사',35],['어업',4],['공장 생산직',12],['건설 노동자',9],['작은 가게 사장',10],['운전기사',5],['공무원',5],['교사',3],['중소기업 회사원',7],['일용직',6],['직업군인',2],['경찰관',1],['의사',.5],['사업가',1],['은행원',1],['무직',2]],
  [['농사',12],['공장 생산직',16],['건설 노동자',8],['작은 가게 사장',12],['식당 사장',4],['운전기사',6],['중소기업 회사원',14],['대기업 회사원',7],['공무원',6],['교사',3],['은행원',2],['경찰관',1.5],['직업군인',1.5],['의사',.8],['교수',.5],['사업가',1.5],['일용직',4],['무직',2]],
  [['농사',3],['공장 생산직',15],['건설 노동자',7],['작은 가게 사장',9],['식당 사장',4],['운전기사',5],['중소기업 회사원',20],['대기업 회사원',10],['공무원',7],['교사',3],['은행원',2],['IT 개발자',3],['경찰관',1.5],['직업군인',1.5],['의사',1],['변호사',.3],['교수',.5],['회사 임원',.8],['사업가',2],['서비스직',3],['판매직',2],['보험설계사',1],['일용직',2],['무직',3]],
  [['농사',2],['공장 생산직',14],['건설 노동자',6],['작은 가게 사장',7],['식당 사장',4],['운전기사',5],['중소기업 회사원',22],['대기업 회사원',11],['공무원',7],['교사',3],['은행원',2],['IT 개발자',6],['경찰관',1.5],['직업군인',1.5],['의사',1.2],['변호사',.4],['교수',.5],['회사 임원',1],['사업가',2],['서비스직',3],['판매직',2],['보험설계사',1],['프리랜서',2],['무직',3]]
];
const MJOBS = [
  [['전업주부',55],['농사',30],['작은 가게 사장',5],['공장 생산직',5],['교사',1],['판매직',2],['서비스직',2]],
  [['전업주부',60],['농사',6],['작은 가게 사장',6],['공장 생산직',7],['판매직',5],['서비스직',5],['교사',3],['간호사',2],['중소기업 회사원',4],['미용사',2]],
  [['전업주부',48],['중소기업 회사원',12],['판매직',5],['서비스직',6],['교사',5],['간호사',4],['공무원',4],['대기업 회사원',3],['작은 가게 사장',4],['미용사',2],['보험설계사',2],['IT 개발자',1],['의사',.6],['공장 생산직',3]],
  [['전업주부',40],['중소기업 회사원',16],['서비스직',6],['판매직',4],['교사',6],['간호사',5],['공무원',6],['대기업 회사원',5],['작은 가게 사장',3],['미용사',2],['IT 개발자',2],['의사',.8],['공장 생산직',2],['프리랜서',2]]
];
const WEALTH = ['빚에 쪼들림','근근이 버팀','평범함','여유 있음','부유함','재벌가'];
const WEALTH_W = [[30,45,22,3,0,0],[15,35,40,9,1,0],[7,20,53,17,3,0],[4,10,45,32,9,0],[2,5,25,40,27.9,.1]];
const ASSET = [-3000, 2000, 25000, 70000, 200000, 5000000];   // 집안 순자산(만 원)
const TENURE = [[['월세',60],['전세',20],['반지하 월세',10],['자가',10]],[['월세',40],['전세',30],['자가',30]],[['자가',60],['전세',28],['월세',12]],[['자가',85],['전세',13],['월세',2]],[['자가',100]]];
const HTYPE = (e,w) => w>=4 ? [['넓은 아파트',60],['단독주택',40]]
  : e===0 ? [['단독주택',75],['셋방',25]] : e===1 ? [['단독주택',45],['아파트',30],['연립·다세대',25]]
  : [['아파트',60],['연립·다세대',20],['단독주택',12],['오피스텔',8]];
const HOUSE_PRICE = r => ({'서울특별시':110000,'경기도':55000,'세종특별자치시':55000,'인천광역시':45000,'부산광역시':45000,'대구광역시':40000,'대전광역시':40000})[r] || 30000;

// ── 사망 ─────────────────────────────────────────
// 곰페르츠 모형의 한 해 사망 확률. M=최빈 사망 나이
function gompQ(x, M){
  const b=0.09, a=b*Math.exp(-b*M), H = t => a/b*(Math.exp(b*t)-1);
  return 1-Math.exp(-(H(x+1)-H(x)));
}
const infantRate = y => y<1960?.07 : y<1970?.045 : y<1980?.025 : y<1990?.012 : y<2000?.006 : .0025;
function deathCause(d){
  return wpick(
    d<40 ? [['사고',45],['암',25],['심장질환',12],['기타 질환',18]] :
    d<65 ? [['암',48],['심장질환',13],['간질환',9],['뇌혈관 질환',9],['사고',8],['기타 질환',13]] :
    d<80 ? [['암',40],['심장질환',12],['폐렴',9],['뇌혈관 질환',10],['당뇨병',4],['기타 질환',25]] :
           [['폐렴',18],['심장질환',14],['암',15],['뇌혈관 질환',10],['노환',25],['알츠하이머병',6],['기타 질환',12]]
  ).v;
}
let M_MALE = 91.5, M_FEMALE = 98.5;   // 기대수명(남 80.6 · 여 86.4세)에 맞춘 값

// ── 세상 ─────────────────────────────────────────
const WORLD = {
  1950:['6·25 전쟁이 터졌다', () => { say('피란길에 올랐다.', {hp:-6, happy:-15}); if (rand()<.03) die('전쟁'); }],
  1953:['정전협정이 맺어졌다'], 1960:['4·19 혁명이 일어났다'], 1970:['경부고속도로가 개통됐다'],
  1974:['서울 지하철 1호선이 개통됐다'], 1979:['10·26 사태가 일어났다'], 1980:['5·18 민주화운동이 일어났다'],
  1983:['〈이산가족을 찾습니다〉 생방송에 온 나라가 울었다'], 1986:['서울 아시안게임이 열렸다'],
  1987:['6월 민주항쟁이 일어났다'], 1988:['서울 올림픽이 열렸다', () => say('호돌이 인형을 샀다.', {happy:3})],
  1989:['해외여행이 전면 자유화됐다'], 1993:['금융실명제가 시행됐다'], 1995:['삼풍백화점이 무너졌다'],
  1997:['IMF 외환위기가 터졌다', () => {
    if (P.age<25 && P.fa.alive && !['공무원','교사','무직'].includes(JOB[P.fa.job].t) && rand()<.3){
      P.fa.job='무직'; P.fam.wealth=Math.max(0,P.fam.wealth-1); P.fam.assets*=.6;
      say('아버지가 실직하셨다. 집안 형편이 어려워졌다.', {happy:-10});
    } else say('나라 전체가 허리띠를 졸라맸다.', {happy:-4});
  }],
  1998:['금 모으기 운동이 벌어졌다', () => say('집에 있던 돌반지를 내놓았다.', {happy:1})],
  2000:['첫 남북정상회담이 열렸다'], 2002:['한일 월드컵 4강 신화가 쓰였다', () => { if (P.age>=6 && P.age<=70) say('붉은 티셔츠를 입고 거리 응원에 나섰다.', {happy:6, social:2}); }],
  2004:['KTX가 개통됐다'], 2008:['글로벌 금융위기가 왔다', () => { if (P.money>3000){ const l=Math.round(P.money*.15); say('투자해 둔 돈이 크게 줄었다.', {money:-l, happy:-4}); } }],
  2009:['아이폰이 국내에 출시됐다'], 2012:['〈강남스타일〉이 세계를 휩쓸었다'], 2014:['세월호 참사가 일어났다', () => say('온 나라가 슬픔에 잠겼다.', {happy:-4})],
  2016:['알파고가 이세돌을 이겼다'], 2017:['대통령이 탄핵되고 조기 대선이 열렸다'], 2018:['평창 동계올림픽이 열렸다'],
  2020:['코로나19가 대유행했다', () => { say('마스크를 쓰고 거리두기를 했다.', {happy:-5}); if (P.job && P.job.t==='자영업'){ P.job.inc=Math.round(P.job.inc*.75); say('가게 매출이 크게 줄었다.', {happy:-6}); } }],
  2024:['12·3 비상계엄이 선포됐다'], 2025:['대통령이 파면되고 조기 대선이 열렸다']
};

// ── 상태 ─────────────────────────────────────────
let P = null;
const LBL = {hp:'건강', happy:'행복', smart:'지능', social:'관계'};

function apply(fx){
  const parts = [];
  for (const k in fx){
    const v = Math.round(fx[k]); if (!v) continue;
    if (k==='money'){ P.money += v; parts.push({s:`${v>0?'+':''}${won(v)}`, neg:v<0}); }
    else { P[k] = clamp(P[k]+v, 0, 100); parts.push({s:`${LBL[k]} ${v>0?'+':'−'}${Math.abs(v)}`, neg:v<0}); }
  }
  return parts;
}
function say(t, fx, kind){ P.cur.lines.push({t, fx: fx ? apply(fx) : [], kind: kind || 'life'}); }
function ask(ch){ if (P.pending || !P.alive) return false; P.pending = ch; return true; }
function choose(i){
  const ch = P.pending; if (!ch) return;
  const o = ch.options[i]; if (!o || o.off) return;
  P.pending = null;
  say(`${ch.title} · ${o.label}`, null, 'pick');
  o.go();
}

function newLife(mode){
  const rows = []; let prob = 1;
  const row = (label, value, p, note) => { rows.push({label, value, p, note}); prob *= p; };

  let by = YEAR;
  if (mode==='past'){ const ys=[]; for (let y=1950; y<YEAR; y++) ys.push([y, births(y)]); by = wpick(ys).v; }
  const nb = births(by);
  row('출생', mode==='past' ? `${by}년` : `${by}년 (올해)`, nb/POP, `그해 태어난 아기 약 ${nb.toLocaleString('ko-KR')}명`);
  const sx = wpick([['M',.512],['F',.488]]); const male = sx.v==='M';
  row('성별', male ? '남자' : '여자', sx.p);
  const rg = wpick(BIRTH_REGION); row('출생지', rg.v, rg.p);

  const kt = kidsTable(by), tot = kt.reduce((s,x)=>s+x[1],0);
  const n = wpick(kt).v, order = ri(1,n);
  let pOrder = 0; for (const [k,w] of kt) if (k>=order) pOrder += (w/tot)/k;
  row('출생 순위', order===1 ? '첫째' : `${ORD[order]}째 · 위로 ${order-1}명`, pOrder);

  const e = ERA(by);
  const fMean = [29,30,32.5,36][e]+(order-1)*2.3, mMean = [25.5,27,30,33.5][e]+(order-1)*2.3;
  const fa = Math.round(clamp(normal(fMean,4),19,62)), ma = Math.round(clamp(normal(mMean,3.5),17,46));
  const fj = wpick(FJOBS[e]), mj = wpick(MJOBS[e]);
  // 나이는 5세 단위(20대 후반, 30대 초반…)로 확률을 매긴다
  const band = (x, m, s) => { const lo = Math.floor(x/5)*5; return Phi((lo+5-.5-m)/s) - Phi((lo-.5-m)/s); };
  row('아버지', `${fa}세 · ${fj.v}`, band(fa,fMean,4)*fj.p);
  row('어머니', `${ma}세 · ${mj.v}`, band(ma,mMean,3.5)*mj.p);
  const inc = Math.max(0, Math.round((JOB[fj.v].inc + JOB[mj.v].inc) * clamp(normal(1,.15),.6,1.5) / 100) * 100);
  const q = inc<2500 ? 1 : inc<4500 ? 2 : inc<6500 ? 3 : inc<9500 ? 4 : 5;
  row('가구 소득', `연 ${won(inc)} · 소득 ${q}분위`, 1, '부모님 직업으로 정해짐');
  const wl = wpick(WEALTH_W[q-1].map((w,i)=>[i,w])), wealth = wl.v;
  row('가정 형편', WEALTH[wealth], wl.p);
  const ten = wpick(TENURE[Math.min(wealth,4)]), ht = wpick(HTYPE(e, wealth));
  row('집', `${ht.v} · ${ten.v}`, ten.p*ht.p);
  const rel = wpick([['화목함',55],['평범함',33],['자주 다툼',12]]); row('부모님 사이', rel.v, rel.p);
  const sn = wpick(SURNAME); row('성씨', `${sn.v}씨`, sn.p);
  const bl = wpick(BLOOD); row('혈액형', bl.v, bl.p);

  const today = new Date();
  let mm = ri(1,12), dd = ri(1,28);
  if (by===YEAR){ mm = ri(1, today.getMonth()+1); dd = mm===today.getMonth()+1 ? ri(1, Math.min(28, today.getDate())) : ri(1,28); }
  const pad = x => String(x).padStart(2,'0');
  const younger = []; let t = 0; for (let i=order; i<n; i++){ t += ri(2,4); younger.push(t); }

  P = {
    name: sn.v + givenName(by, male), surname: sn.v, male, by, region: rg.v, order, sibs: n-1, younger, blood: bl.v,
    rrn: `${pad(by%100)}${pad(mm)}${pad(dd)}-${by>=2000 ? (male?3:4) : (male?1:2)}●●●●●●`, bday: `${by}년 ${mm}월 ${dd}일`,
    fa: {age0:fa, job:fj.v, alive:true}, mo: {age0:ma, job:mj.v, alive:true},
    fam: {inc, q, wealth, assets: Math.round(ASSET[wealth]*clamp(normal(1,.3),.3,2)), tenure: ten.v, house: ht.v, rel: rel.v, divorced:false},
    age: 0, year: by, alive: true, cause: '',
    hp: clamp(normal(80,8),45,100), happy: clamp(68 + (rel.v==='화목함'?5:rel.v==='자주 다툼'?-8:0) + (wealth-2)*2, 0, 100),
    smart: clamp(normal(50,15) + (wealth-2)*2, 5, 95), social: clamp(normal(50,15), 5, 95),
    money: 0, house: null, home: 'parents', effort: 0, stage: 'baby', edu: '', track: '', hs: '', uni: null, cred: 0,
    mil: null, milDone: !male, job: null, careers: [], maxInc: 0, pension: 0, exam: null, retakes: 0,
    partner: null, spouse: null, married: false, kids: [], grandkids: 0, planKid: false, divorces: 0,
    smoke: false, cancer: null, flags: {}, pending: null, happySum: 0, log: [], cur: null
  };
  P.cur = {year: by, age: 0, lines: []}; P.log.push(P.cur);
  const where = by<1970 ? '집에서' : `${rg.v.replace(/(특별자치시|특별자치도|특별시|광역시)$/,'')}의 한 산부인과에서`;
  say(`${P.bday}, ${where} ${ORD[order]}째로 태어났다.`);
  const FAM_DESC = ['빚에 쪼들리는','근근이 버티는','평범한','여유 있는','부유한'];
  say(`아버지는 ${fa}세 ${fj.v}, 어머니는 ${ma}세 ${mj.v}. ${wealth===5 ? '집안은 재벌가다.' : `집은 ${FAM_DESC[wealth]} 형편이다.`}`);
  return {rows, prob, expected: POP*prob};
}

// ── 한 해 ────────────────────────────────────────
function step(){
  if (!P || !P.alive || P.pending) return false;
  P.age++; P.year++;
  P.cur = {year: P.year, age: P.age, lines: []}; P.log.push(P.cur);
  for (const f of [world, family, military, growUp, career, love, finance]){ f(); if (!P.alive) return true; }
  if (P.alive && (P.cur.lines.length===0 || rand()<.4)) flavor(P.cur.lines.length===0);
  health();
  P.happySum += P.happy;
  return true;
}
function world(){
  const w = WORLD[P.year]; if (!w || P.year>=YEAR) return;
  say(w[0]+'.', null, 'world'); if (w[1]) w[1]();
}
const parentWord = p => p===P.fa ? '아버지' : '어머니';
function family(){
  const a = P.age;
  if (P.younger.includes(a) && P.mo.alive && P.mo.age0+a < 46) say(`${rand()<.51?'남':'여'}동생이 태어났다.`, {happy:2});
  for (const p of [P.fa, P.mo]){
    if (!p.alive) continue;
    const pa = p.age0 + a;
    if (rand() < gompQ(pa, p===P.fa ? 84 : 90)){
      p.alive = false; p.death = pa;
      say(`${parentWord(p)}께서 향년 ${pa}세로 세상을 떠나셨다.`, {happy: a<20 ? -22 : -14});
      if (!P.fa.alive && !P.mo.alive) inherit();
    } else if (a>=35 && pa>=80 && rand()<.06) say(`${parentWord(p)}를 간병했다.`, {happy:-4, money:-300});
  }
  if (a<20 && P.fa.alive && P.mo.alive && !P.fam.divorced){
    const pr = {'자주 다툼':.05, '평범함':.01, '화목함':.002}[P.fam.rel];
    if (rand()<pr){ P.fam.divorced = true; say('부모님이 이혼하셨다.', {happy:-15}); }
  }
  if (a<25 && P.fa.alive){
    const t = JOB[P.fa.job].t;
    if (t==='자영업' && rand()<.03){ P.fam.wealth=Math.max(0,P.fam.wealth-1); P.fam.assets*=.7; say('아버지 가게가 문을 닫았다.', {happy:-8}); }
    else if (t==='자영업' && rand()<.02){ P.fam.wealth=Math.min(4,P.fam.wealth+1); P.fam.assets=P.fam.assets*1.5+5000; say('아버지 사업이 크게 잘됐다.', {happy:6}); }
    else if (!['공무원','교사','무직','주부'].includes(t) && rand()<.012){ P.fa.job='무직'; say('아버지가 회사를 그만두셨다.', {happy:-6}); }
  }
  if (a<18 && a>=3 && rand()<.05) say('이사를 했다. 새 동네에 적응해야 했다.', {social:-2});
}
function inherit(){
  const share = Math.round(P.fam.assets / (P.sibs+1));
  if (share > 500) say(`부모님이 남긴 재산 ${won(share)}을 물려받았다.`, {money:share});
  else if (share < 0) say('부모님이 남긴 빚은 상속을 포기했다.');
}

// ── 성장과 학교 ──────────────────────────────────
const MAJORS = {
  문과: ['경영학','경제학','국어국문학','영어영문학','행정학','법학','심리학','사회복지학','신문방송학','중어중문학'],
  이과: ['컴퓨터공학','전자공학','기계공학','화학공학','건축학','간호학','생명과학','수학','산업공학'],
  전문: ['간호학','유아교육','호텔조리','자동차정비','물리치료','뷰티디자인','항공서비스']
};
const enrollRate = y => y<1980 ? .27 : y<1990 ? .35 : y<2000 ? .6 : y<2010 ? .8 : .73;
const examName = y => y<1969 ? '대학 입학시험' : y<1982 ? '예비고사' : y<1994 ? '학력고사' : '수능';
const TIERS = [[.985,'SKY',5,4],[.94,'서울 상위권 대학',4,4],[.84,'서울 중위권 대학',3.3,4],[.68,'지방 국립대',2.6,4],[.42,'지방 사립대',2,4],[0,'전문대',1.5,2]];

function growUp(){
  const a = P.age, y = P.year;
  if (a===1){ say('첫 걸음마를 뗐다.'); ask(DOL()); }
  if (a===2 && y>=1990 && (y>=2005 || P.mo.job!=='전업주부')) say('어린이집에 다니기 시작했다.', {social:2});
  if (a===5){
    if (y>=1995 && P.fam.wealth>=3 && rand()<.5) say('영어유치원에 다녔다.', {smart:3, social:1});
    else if (y>=1982) say('유치원에 다녔다.', {social:2});
    else say('동네 골목에서 해가 질 때까지 놀았다.', {hp:2, happy:2});
  }
  if (a===7){ P.stage='elem'; say(`${y<1996?'국민학교':'초등학교'}에 입학했다.`); }
  if (a===10) ask(AFTER());
  if (a===13 && P.stage==='elem'){
    if (y<1972 && (P.fam.wealth<=1 || rand()<.3)){
      P.edu='초등학교 졸업'; P.cred=.5; say('형편이 어려워 중학교에 가지 못하고 집안일을 도왔다.', {happy:-8});
      hire(P.fam.house==='셋방' || rand()<.5 ? '공장 견습공' : '농사일', 1500, '생산직');
    } else { P.stage='mid'; say('중학교에 입학했다.'); ask(MID()); }
  }
  if (a===16 && P.stage==='mid'){
    if (y<1985 && ((P.fam.wealth<=1 && rand()<.55) || rand()<.12)){
      P.edu='중학교 졸업'; P.cred=.7; say('고등학교 대신 돈을 벌기로 했다.', {happy:-6});
      hire('공장 생산직', 2600, '생산직');
    } else { P.stage='high'; ask(HIGH()); }
  }
  if (a===17 && P.stage==='high' && P.hs!=='특성화고') ask(TRACK());
  if (a===18 && P.stage==='high'){ if (P.hs==='특성화고') ask(VOC()); else exam(); }
  if (P.stage==='retake' && a>=19) exam();
  if (P.stage==='univ' && !P.mil){
    P.uni.done++;
    if (P.uni.done >= P.uni.len) graduate();
    else if (P.fam.wealth<=1 && !P.job) say('학자금 대출을 받았다.', {money:-700});
  }
  if (P.stage==='seek' && a>=60){ retire(); return; }
  if (P.stage==='seek' && !P.mil && !P.pending) ask(JOBS());
  if (P.stage==='exam-prep' && !P.mil) examPrep();
  if (P.stage==='jobless' && !P.pending){ if (a>=60) retire(); else ask(JOBLESS()); }
}

function exam(){
  const z = (P.smart-50)/15*.75 + P.effort*.08 + (P.fam.wealth-2)*.08 + (P.hs==='자사고·특목고'?.2:0) + normal(0,.55);
  const pct = Phi(z), top = Math.max(.1, (1-pct)*100);
  const cut = 1 - enrollRate(P.year);
  const tier = pct < cut ? null : TIERS.find(t => pct >= t[0]);
  say(`${examName(P.year)}을 봤다. 전국 상위 ${top<1 ? top.toFixed(1) : Math.round(top)}%.`, {happy: pct>.8 ? 6 : pct<.4 ? -6 : 0});
  P.stage = 'exam';
  const opts = [];
  if (pct>=.992 && P.track==='이과') opts.push({label:'의대 진학', sub:'6년 공부, 5년 수련, 그다음 의사', go:() => enter('의대', 5, 6, '의학')});
  if (pct>=.86 && P.track==='문과') opts.push({label:'교대 진학', sub:'4년 뒤 임용시험을 거쳐 초등 교사', go:() => enter('교육대학교', 3, 4, '초등교육')});
  if (tier) opts.push({label:`${tier[1]} 진학`, sub: tier[3]===2 ? '2년제' : '4년제', go:() => enter(tier[1], tier[2], tier[3])});
  if (P.retakes<2) opts.push({label:'재수하기', sub: P.fam.wealth>=2 ? '1년 더, 재수학원에서' : '1년 더, 독서실에서', go:() => {
    P.retakes++; P.stage='retake'; P.effort += 2; P.fam.assets -= 1500; say('재수를 시작했다.', {happy:-8, smart:2});
  }});
  opts.push({label:'대학 대신 취업', sub:'고졸로 사회에 나간다', go:() => { P.edu='고등학교 졸업'; P.cred=1; P.stage='seek'; say('대학 대신 일을 하기로 했다.'); }});
  ask({title:'대학 진학', desc: tier ? `성적으로 갈 수 있는 곳은 ${tier[1]} 정도다.` : '이 성적으로는 갈 수 있는 대학이 마땅치 않다.', options: opts.slice(0,4)});
}
function enter(label, score, len, major){
  major = major || rnd(MAJORS[len===2 ? '전문' : (P.track || '문과')]);
  P.uni = {label, score, len, done:0, major}; P.stage='univ';
  say(`${label} ${major}과에 입학했다.`, {happy:6});
}
function graduate(){
  const u = P.uni; P.edu = `${u.label} ${u.major}과 졸업`; P.cred = u.score;
  if (u.label==='의대'){ say('의사 국가고시에 합격했다. 수련을 시작했다.', {happy:8}); hire('전공의', 4500, '수련'); return; }
  if (u.label==='교육대학교'){ say('교대를 졸업했다. 임용시험을 준비한다.'); P.stage='exam-prep'; P.exam={kind:'임용', tries:0}; return; }
  say(`${J(u.label,'을','를')} 졸업했다.`, {happy:4});
  P.stage = 'seek';
}
function examPrep(){
  const ex = P.exam; ex.tries++;
  const p = ex.kind==='임용' ? .5 : .1 + (P.smart-50)/300 + ex.tries*.03;
  if (rand() < p){
    say(`${ex.kind==='임용'?'임용시험':'공무원 시험'}에 합격했다!`, {happy:12});
    if (ex.kind==='임용') hire('초등학교 교사', 4000, '교사'); else hire('9급 공무원', 3300, '공무원');
    P.exam = null;
  } else {
    say(`${ex.kind==='임용'?'임용시험':'공무원 시험'}에 떨어졌다.`, {happy:-7});
    ask({title:'다시 도전?', desc:`${ex.tries}번째 낙방이다.`, options:[
      {label:'한 번 더', sub:'1년 더 공부한다', go:() => say('다시 책을 폈다.', {smart:1})},
      {label:'그만두고 취업', sub:'다른 길을 찾는다', go:() => { P.exam=null; P.stage='seek'; say('시험을 접었다.'); }}
    ]});
  }
}
function hire(title, inc, t){
  P.job = {title, inc, t, years:0, rank:0}; P.stage='work';
  if (!P.careers.includes(title)) P.careers.push(title);
  P.maxInc = Math.max(P.maxInc, inc);
}
function retire(){
  const t = P.job ? P.job.t : '';
  P.pension = ['공무원','교사'].includes(t) ? 3000 : (P.careers.length ? 900 : 400);
  say(['공무원','교사'].includes(t) ? '정년퇴직했다.' : '일을 그만두고 은퇴했다.', {happy:4});
  P.job = null; P.stage = 'retired';
}

// ── 선택지 ───────────────────────────────────────
const DOL = () => ({title:'돌잡이', desc:'돌상 위에 물건이 놓여 있다. 무엇을 잡을까?', options:[
  {label:'연필', sub:'공부를 잘한대요', go:() => say('연필을 꽉 쥐었다.', {smart:4})},
  {label:'돈', sub:'부자가 된대요', go:() => { P.flags.dolMoney=true; say('지폐를 움켜쥐었다.', {happy:2}); }},
  {label:'실', sub:'오래 산대요', go:() => say('실타래를 잡았다.', {hp:5})},
  {label:'마이크', sub:'인기가 많아진대요', go:() => say('마이크를 잡고 옹알거렸다.', {social:5})}
]});
const AFTER = () => {
  const can = P.fam.wealth>=2 || P.fam.q>=3;
  return {title:'방과 후', desc:'학교가 끝나면 무엇을 할까?', options:[
    {label:'학원 뺑뺑이', sub: can ? '영어·수학·논술 학원' : '집안 형편상 어렵다', off:!can, go:() => { P.effort+=2; say('학원을 세 군데 다녔다.', {smart:6, happy:-6}); }},
    {label:'운동', sub:'태권도, 축구', go:() => say('운동장을 뛰어다녔다.', {hp:6, social:3})},
    {label:'실컷 놀기', sub:'놀이터와 골목', go:() => say('해가 질 때까지 놀았다.', {happy:8, social:4, smart:-2})},
    {label:'책 읽기', sub:'도서관에서', go:() => say('도서관 책을 다 읽을 기세였다.', {smart:4, happy:2, social:-2})}
  ]};
};
const MID = () => ({title:'중학교 생활', desc:'중학교 3년을 어디에 쓸까?', options:[
  {label:'공부', sub:'전교 등수 올리기', go:() => { P.effort+=2; say('공부에 몰두했다.', {smart:6, happy:-3}); }},
  {label:'친구', sub:'어울려 다니기', go:() => say('친구들과 어울려 다녔다.', {social:8, happy:4, smart:-2})},
  {label:'운동부', sub:'학교 대표 선수', go:() => say('운동부에 들어갔다.', {hp:8, social:3, smart:-3})},
  {label:'게임', sub:'PC방과 게임기', go:() => say(P.year>=1998 ? 'PC방에서 살다시피 했다.' : '오락실에서 살다시피 했다.', {happy:8, smart:-4, hp:-2})}
]});
const HIGH = () => {
  const elite = P.smart>=68 && (P.fam.wealth>=2 || P.smart>=80);
  return {title:'고등학교', desc:'어느 고등학교로 갈까?', options:[
    {label:'일반고', sub:'대부분이 가는 길', go:() => { P.hs='일반고'; say('일반고에 입학했다.'); }},
    {label:'특성화고', sub:'기술을 배워 바로 취업', go:() => { P.hs='특성화고'; say(`${P.year<2010?'실업계':'특성화'} 고등학교에 입학했다.`); }},
    {label:'자사고·특목고', sub: elite ? '입시 경쟁의 한복판' : '성적이나 형편이 닿지 않는다', off:!elite, go:() => { P.hs='자사고·특목고'; P.effort+=3; P.fam.assets-=1500; say('자사고에 합격했다.', {happy:3, smart:2}); }}
  ]};
};
const TRACK = () => ({title:'문과와 이과', desc:'어느 쪽으로 갈까?', options:[
  {label:'문과', sub:'경영·법·인문·교대', go:() => { P.track='문과'; say('문과를 골랐다.'); }},
  {label:'이과', sub:'공대·자연대·의대', go:() => { P.track='이과'; say('이과를 골랐다.'); }}
]});
const VOC = () => ({title:'졸업 후', desc:'특성화고를 마친다. 다음은?', options:[
  {label:'바로 취업', sub:'고졸 채용', go:() => { P.edu='특성화고 졸업'; P.cred=1.3; P.stage='seek'; say('취업 전선에 뛰어들었다.'); }},
  {label:'전문대 진학', sub:'2년 더 배운다', go:() => enter('전문대', 1.5, 2)}
]});
function chance(score){ return clamp(.02*Math.exp((score-1)*.83) + (P.smart-50)/300, .005, .8); }
function JOBS(){
  const c = P.cred, opts = [];
  if (c>=1.5){
    const p = chance(c);
    opts.push({label:'대기업 공채', sub:`합격 가능성 ${Math.round(p*100)}%`, go:() => tryJob(p, '대기업 회사원', 5500, '대기업')});
    opts.push({label:'공무원 시험 준비', sub:'붙을 때까지, 몇 년이 걸릴지 모른다', go:() => { P.stage='exam-prep'; P.exam={kind:'공무원', tries:0}; say('노량진 학원에 등록했다.', {happy:-3}); }});
    if (P.uni && ['간호학','물리치료'].includes(P.uni.major)) opts.push({label:'병원 취업', sub:'면허를 살려서', go:() => tryJob(.9, P.uni.major==='간호학'?'간호사':'물리치료사', 4300, '전문직')});
    else if (P.track==='이과' && c>=2) opts.push({label:'IT 회사', sub:`합격 가능성 ${Math.round(Math.min(.8,p*1.6)*100)}%`, go:() => tryJob(Math.min(.8,p*1.6), 'IT 개발자', 5000, '대기업')});
    else opts.push({label:'공기업', sub:`합격 가능성 ${Math.round(p*.7*100)}%`, go:() => tryJob(p*.7, '공기업 직원', 4800, '공무원')});
    opts.push({label:'중소기업', sub:'합격 가능성 85%', go:() => tryJob(.85, '중소기업 회사원', 3300, '중소기업')});
  } else {
    opts.push({label:'공장 생산직', sub:'교대 근무', go:() => tryJob(.8, '공장 생산직', 3800, '생산직')});
    opts.push({label:'서비스직', sub:'매장, 식당, 콜센터', go:() => tryJob(.95, '서비스직', 2600, '서비스')});
    opts.push({label:'기술 배우기', sub:'전기·용접·미용 기술', go:() => { say('기술을 배우기 시작했다. 처음엔 박봉이다.', {smart:2}); hire('기술 견습생', 2400, '기술'); }});
    if (c>=1.3) opts.push({label:'공기업 고졸 채용', sub:'합격 가능성 15%', go:() => tryJob(.15, '공기업 직원', 4000, '공무원')});
  }
  return {title:'취업', desc: P.edu ? `${P.edu}. 어디에 지원할까?` : '어디에 지원할까?', options: opts.slice(0,4)};
}
function tryJob(p, title, inc, t){
  if (rand() < p){ hire(title, Math.round(inc*clamp(normal(1,.08),.8,1.2)), t); say(`${title}${eu(title)} 일하게 됐다.`, {happy:10}); }
  else { say('불합격 통보를 받았다. 1년 더 취업 준비를 한다.', {happy:-8}); P.stage='seek'; }
}
const JOBLESS = () => ({title:'일자리를 잃었다', desc:`모아 둔 돈은 ${won(P.money)}. 이제 어떻게 할까?`, options:[
  {label:'재취업', sub:'경력을 살려 다시', go:() => { const p=.55-(P.age-40)/80; if (rand()<p){ hire('중소기업 회사원', Math.round(Math.max(3000,P.maxInc*.7)), '중소기업'); say('다시 회사에 들어갔다.', {happy:6}); } else say('나이 때문인지 연락이 오지 않았다.', {happy:-6}); }},
  {label:'치킨집 창업', sub:'8,000만 원이 든다', off:P.money<-2000 && P.age>55, go:() => {
    P.money -= 8000; if (rand()<.45){ hire('치킨집 사장', 4500, '자영업'); say('치킨집을 열었다. 단골이 생겼다.', {happy:6}); }
    else say('치킨집을 열었지만 1년 만에 문을 닫았다.', {happy:-12}); }},
  {label:'당분간 쉬기', sub:'숨 고르기', go:() => say('한동안 쉬었다.', {happy:5, hp:2})}
]});

// ── 일 ──────────────────────────────────────────
const RANKS = {대기업:['사원','대리','과장','차장','부장','임원'], 중소기업:['사원','대리','과장','차장','부장','이사'], 은행:['행원','대리','과장','차장','지점장'], 공무원:['9급','8급','7급','6급','5급','4급'], 교사:['교사','부장교사','교감','교장']};
const RISK = {대기업:.012, 은행:.01, 중소기업:.02, 생산직:.02, 서비스:.03, 자영업:.05, 기술:.02, 전문직:.01, 공무원:0, 교사:0, 의사:0, 수련:0};
function career(){
  const j = P.job; if (!j || P.mil) return;
  const a = P.age; j.years++;
  if (j.t==='수련' && j.years>=5){ hire('의사', 16000, '의사'); say('전문의가 됐다.', {happy:10}); return; }
  if (j.t==='기술' && j.years>=3){ j.title='기술자'; j.t='생산직'; j.inc=4600; P.careers.push('기술자'); P.maxInc=Math.max(P.maxInc,4600); say('어엿한 기술자가 됐다.', {happy:6}); }
  j.inc = Math.round(j.inc * (1 + normal(.02,.015)));
  const R = RANKS[j.t];
  if (R && j.rank < R.length-1 && rand() < (j.rank<2 ? .2 : .08)){ j.rank++; j.inc = Math.round(j.inc*1.07); say(`${R[j.rank]}${eu(R[j.rank])} 승진했다.`, {happy:6}); }
  P.maxInc = Math.max(P.maxInc, j.inc);
  const crisis = P.year===1997||P.year===1998 ? 6 : P.year===2008 ? 2 : P.year===2020 ? 2 : 1;
  if (rand() < (RISK[j.t]||.02)*crisis){
    say(j.t==='자영업' ? '가게 문을 닫았다.' : '구조조정으로 회사를 나왔다.', {happy:-12, money: j.t==='자영업' ? -3000 : 0});
    P.job=null; P.stage='jobless'; if (a<60) ask(JOBLESS()); return;
  }
  if (['대기업','은행'].includes(j.t) && a>=50 && rand()<.1){
    ask({title:'희망퇴직', desc:'회사가 희망퇴직을 받는다. 위로금은 연봉의 2배다.', options:[
      {label:'신청한다', sub:`위로금 ${won(j.inc*2)}`, go:() => { P.money += j.inc*2; say('희망퇴직했다.', {happy:-4}); P.job=null; P.stage='jobless'; }},
      {label:'버틴다', sub:'눈치는 보이겠지만', go:() => say('책상을 지켰다.', {happy:-6})}
    ]}); return;
  }
  if (['대기업','중소기업','은행','전문직'].includes(j.t) && a<50 && rand()<.05){
    ask({title:'이직 제안', desc:'다른 회사에서 연봉을 더 주겠다고 한다.', options:[
      {label:'옮긴다', sub:`연봉 ${won(Math.round(j.inc*1.2))}`, go:() => { j.inc=Math.round(j.inc*1.2); P.maxInc=Math.max(P.maxInc,j.inc); say('회사를 옮겼다.', {happy:4}); }},
      {label:'남는다', sub:'익숙한 곳이 낫다', go:() => say('지금 회사에 남았다.')}
    ]}); return;
  }
  if ((['공무원','교사'].includes(j.t) && a>=60) || (j.t!=='자영업' && j.t!=='의사' && a>=60 && rand()<.3) || a>=72) retire();
}

// ── 사랑과 가족 ─────────────────────────────────
function love(){
  const a = P.age;
  if (!P.partner && !P.married && a>=15 && a<80 && !P.mil){
    const base = a<20 ? .1 : a<35 ? .28 : a<50 ? .12 : .05;
    if (rand() < base*(.6 + P.social/100)){
      const pby = P.by + ri(-3,3);
      P.partner = {name: givenName(pby, !P.male), age0: P.by-pby, years:0};
      say(`${J(P.partner.name,'과','와')} 사귀기 시작했다.`, {happy:8});
    }
  } else if (P.partner && !P.married){
    P.partner.years++;
    if (rand() < (a<25 ? .35 : .2)){ say(`${J(P.partner.name,'과','와')} 헤어졌다.`, {happy:-10}); P.partner=null; }
    else if (a>=26 && P.partner.years>=1 && rand()<.55){
      const nm = P.partner.name;
      ask({title:'결혼', desc: P.male ? `${J(nm,'과','와')} ${P.partner.years}년째 만나고 있다. 청혼할까?` : `${J(nm,'이','가')} 청혼했다. 받아들일까?`, options:[
        {label:'결혼한다', sub:'예식장과 신혼집이 필요하다', go:marry},
        {label:'아직은', sub:'조금 더 생각해 본다', go:() => { say('결혼을 미뤘다.'); if (rand()<.3){ say(`${J(nm,'과','와')} 결국 헤어졌다.`, {happy:-10}); P.partner=null; } }}
      ]});
    }
  }
  if (P.married){
    if (P.planKid){
      const wAge = P.male ? a - P.spouse.age0 : a;
      const p = wAge<35 ? .85 : wAge<40 ? .55 : wAge<44 ? .25 : 0;
      if (rand()<p){ const k={born:a, son:rand()<.51, married:false, gk:0}; P.kids.push(k); P.planKid=false; say(`${ORD[P.kids.length]}째 ${k.son?'아들':'딸'}이 태어났다.`, {happy:12}); }
      else if (wAge>=44){ P.planKid=false; say('아이는 더 생기지 않았다.', {happy:-4}); }
      else say('아이가 생기지 않아 난임 병원에 다녔다.', {happy:-4, money:-400});
    } else {
      const wAge = P.male ? a - P.spouse.age0 : a;
      if (P.kids.length<4 && wAge<43 && rand()<.45 && !P.flags.noKids){
        ask({title:'아이', desc: P.kids.length ? `아이가 ${P.kids.length}명 있다. 한 명 더?` : '아이를 가질까?', options:[
          {label:'갖는다', sub:'아이 한 명에 한 해 1,000만 원 넘게 든다', go:() => { P.planKid=true; say('아이를 갖기로 했다.'); }},
          {label:'아직은', sub:'나중에 다시 생각한다', go:() => say('조금 더 미루기로 했다.')},
          {label:'안 갖는다', sub:'둘이서 사는 삶', go:() => { P.flags.noKids=true; say('아이 없이 살기로 했다.'); }}
        ]});
      }
    }
    if (rand() < .006 + (P.happy<30 ? .02 : 0)){
      P.divorces++; P.married=false; P.spouse=null; P.partner=null;
      say('이혼했다. 재산을 나눴다.', {happy:-18, money: P.money>0 ? -Math.round(P.money/2) : 0});
    } else if (P.spouse && rand() < gompQ(a - P.spouse.age0, P.male ? M_FEMALE : M_MALE)){
      say(`배우자 ${J(P.spouse.name,'이','가')} 세상을 떠났다.`, {happy:-25}); P.married=false; P.spouse=null; P.partner=null; P.flags.widow=true;
    }
  }
  P.kids.forEach((k,i) => {
    const ka = a - k.born, nth = `${ORD[i+1]}째`;
    if (ka===7) say(`${nth}가 초등학교에 입학했다.`, {happy:3});
    if (ka===18) say(`${nth}가 ${examName(P.year)}을 봤다.`, {happy:-2});
    if (ka>=27 && ka<=40 && !k.married && rand()<.12){ k.married=true; say(`${nth}가 결혼했다.`, {happy:6, money: P.money>8000 ? -3000 : 0}); }
    if (k.married && k.gk<2 && rand()<.15){ k.gk++; P.grandkids++; say(P.grandkids===1 ? '첫 손주가 태어났다.' : '손주가 또 태어났다.', {happy:8}); }
  });
}
function marry(){
  const help = (P.fa.alive||P.mo.alive) ? [0,300,2000,8000,30000,300000][P.fam.wealth] : 0;
  const cost = 3000;
  P.married = true; P.spouse = P.partner; P.partner = null; P.home='own';
  say(`${J(P.spouse.name,'과','와')} 결혼했다.`, {happy:15, money: help - cost});
  if (help>0) say(`부모님이 결혼 자금 ${won(help)}을 보태 주셨다.`);
}

// ── 돈 ──────────────────────────────────────────
function finance(){
  const a = P.age;
  let inc = P.job && !P.mil ? P.job.inc : 0;
  if (P.stage==='retired' && a>=62) inc += P.pension;
  let cost = 0;
  const adult = a>=19 && !P.mil && !['univ','retake','exam'].includes(P.stage);
  if (adult){
    const atHome = P.home==='parents' && (P.fa.alive||P.mo.alive);
    cost = atHome ? 600 : 1800;
    if (P.married) cost += 1000;
    cost += P.kids.filter(k => a-k.born < 23).length*1200;
    if (!P.house && !atHome) cost += P.region==='서울특별시' ? 1100 : 650;
    if (atHome && P.job && a>=26 && rand()<.25){ P.home='own'; say('부모님 집에서 독립했다.', {happy:3}); }
  }
  cost += inc*.8*.3;                     // 버는 만큼 씀씀이도 커진다
  if (a>=65) cost *= .7;
  if (P.money < 0) cost *= .75;          // 빚이 있으면 허리띠를 졸라맨다
  P.money += inc*.8 - cost;
  if (P.house && P.money < -P.house.value*.8){ P.money += P.house.value; P.house=null; say('빚을 감당하지 못해 집을 팔았다.', {happy:-12}); }
  else if (!P.house && P.money < -30000){ P.money = -5000; say('빚을 견디지 못해 개인회생을 신청했다.', {happy:-15}); }
  if (P.money > 0) P.money *= 1 + normal(.012 + (P.flags.dolMoney?.005:0), .05);
  else P.money *= 1.04;
  P.money = Math.round(P.money);
  if (P.house) P.house.value = Math.round(P.house.value * (1 + normal(.01,.05)));
  const price = HOUSE_PRICE(P.region);
  if (!P.house && a>=28 && a<70 && P.money >= price*.35 && rand()<.4 && !P.pending){
    const help = (P.fam.wealth>=3 && (P.fa.alive||P.mo.alive)) ? Math.round(price*.3) : 0;
    ask({title:'내 집 마련', desc:`${P.region} 집값은 ${won(price)}쯤. 모은 돈은 ${won(P.money)}.`, options:[
      {label:'대출 끼고 산다', sub: help ? `부모님이 ${won(help)}을 보태 주신다` : '빚이 생긴다', go:() => { P.money += help - price; P.house={value:price}; say('내 집을 마련했다.', {happy:12}); }},
      {label:'조금 더 모은다', sub:'집값이 더 오를지도 모른다', go:() => say('집 사는 걸 미뤘다.')}
    ]});
  }
}
const netWorth = () => P.money + (P.house ? P.house.value : 0);

// ── 몸 ──────────────────────────────────────────
function cancerRate(a){ return a<30 ? .0005 : a<40 ? .0015 : a<50 ? .004 : a<60 ? .008 : a<70 ? .014 : .02; }
function health(){
  if (!P.alive) return;
  const a = P.age;
  // 나이에 맞는 건강 수준으로 조금씩 돌아간다. 흡연은 기준을 낮춘다
  const target = 85 - Math.max(0, a-30)*.8 - (P.smoke ? 8 : 0);
  P.hp = clamp(P.hp + (target-P.hp)*.1 + normal(0,1.2), 0, 100);
  P.happy = clamp(P.happy + (60-P.happy)*.06, 0, 100);
  if (a===20 && rand() < (P.male ? (P.year<2000 ? .6 : .32) : .06)){ P.smoke=true; say('담배를 피우기 시작했다.'); }
  else if (P.smoke && rand()<.04){ P.smoke=false; say('담배를 끊었다.', {hp:3}); }
  if (a>=40 && !P.flags.htn && rand()<.025){ P.flags.htn=true; say('고혈압 진단을 받았다.', {hp:-4}); }
  if (a>=45 && !P.flags.dm && rand()<.015){ P.flags.dm=true; say('당뇨 진단을 받았다.', {hp:-5}); }
  if (!P.cancer && rand() < cancerRate(a)*(P.smoke?1.5:1)){
    const site = wpick(P.male ? [['폐암',15],['위암',14],['대장암',13],['전립선암',12],['간암',10],['갑상선암',8],['췌장암',5]] : [['갑상선암',20],['유방암',20],['대장암',10],['폐암',8],['위암',8],['췌장암',4]]).v;
    P.cancer = {site, at:a, cured: rand()<.72};
    if (P.cancer.cured) P.cancer.cureAt = a+ri(2,5); else P.cancer.dieAt = a+ri(0,3);
    say(`${site} 진단을 받았다.`, {hp:-20, happy:-12, money:-800});
  }
  if (P.cancer && P.cancer.cureAt===a) say('암 완치 판정을 받았다.', {hp:8, happy:10});
  if (a>=5 && rand()<.0025){ say('교통사고를 당했다.', {hp:-15}); if (rand()<.08) return die('교통사고'); }
  if (P.cancer && P.cancer.dieAt!=null && a>=P.cancer.dieAt) return die(P.cancer.site);
  let q = gompQ(a-1, P.male ? M_MALE : M_FEMALE) * (1 + Math.max(0, 50-P.hp)/30);
  if (a===1) q += infantRate(P.year-1);
  if (P.hp<=0 || rand()<q) die(a===1 ? '영아 질환' : deathCause(a));
}
function die(cause){
  if (!P.alive) return;
  P.alive=false; P.cause=cause; P.pending=null;
  say(`${cause}${eu(cause)} 세상을 떠났다. 향년 ${P.age}세.`, null, 'death');
}

// ── 그해의 소소한 일 ────────────────────────────
const FLAV = {
  baby: [['수족구병에 걸려 며칠을 앓았다.',{hp:-3}],['놀이공원에 처음 가 봤다.',{happy:4}],['할머니 댁에서 여름을 보냈다.',{happy:3}],['자전거 타는 법을 배웠다.',{hp:2}],['그림책을 줄줄 외웠다.',{smart:2}],['동네 친구가 생겼다.',{social:3}],['장염으로 입원했다.',{hp:-4}],['처음으로 바다를 봤다.',{happy:3}],['한글을 뗐다.',{smart:2}]],
  elem: [['받아쓰기에서 100점을 받았다.',{smart:2,happy:2}],['단짝 친구가 생겼다.',{social:4,happy:3}],['친구와 크게 싸웠다.',{social:-3,happy:-3}],['태권도 노란 띠를 땄다.',{hp:2}],['안경을 쓰기 시작했다.',{}],
    ['반장 선거에 나가 당선됐다.',{social:5,happy:4},()=>P.social>60],['수학 경시대회에서 상을 받았다.',{smart:3,happy:4},()=>P.smart>70],['게임에 푹 빠졌다.',{happy:3,smart:-2}],['문구점 뽑기에 용돈을 다 썼다.',{happy:2}],['방학 일기를 몰아서 썼다.',{}],
    ['처음으로 스마트폰이 생겼다.',{happy:4,smart:-1},()=>P.year>=2011],['친구들과 PC방에 처음 가 봤다.',{happy:2},()=>P.year>=1999],['연탄불에 고구마를 구워 먹었다.',{happy:2},()=>P.year<1990]],
  mid: [['첫사랑이 시작됐다.',{happy:6}],['사춘기가 와서 부모님과 자주 다퉜다.',{happy:-4}],['중간고사에서 반 1등을 했다.',{smart:3,happy:4},()=>P.smart>68],['친구들과 노래방에 다녔다.',{social:3,happy:3},()=>P.year>=1992],
    ['아이돌을 덕질하기 시작했다.',{happy:5},()=>P.year>=1996],['학교 폭력으로 힘든 시간을 보냈다.',{happy:-12,social:-5},()=>P.social<40],['키가 10cm나 컸다.',{hp:2}],['수학여행을 다녀왔다.',{happy:4,social:2}]],
  high: [['야간 자율학습이 밤 10시에 끝났다.',{smart:2,happy:-3}],['모의고사 성적이 올랐다.',{smart:2,happy:3}],['모의고사를 망쳤다.',{happy:-4}],['진로 고민으로 밤을 지새웠다.',{happy:-2}],['동아리 활동에 빠져 살았다.',{social:3,happy:3}],['스트레스로 위염이 생겼다.',{hp:-3,happy:-3}]],
  univ: [['MT에서 밤새 술을 마셨다.',{social:3,hp:-1}],['동아리에 들어갔다.',{social:4,happy:3}],['장학금을 받았다.',{smart:2,happy:4,money:300},()=>P.smart>65],['학점이 바닥을 쳤다.',{happy:-4}],['편의점 아르바이트를 했다.',{money:600,happy:-1}],
    ['교환학생으로 외국에 다녀왔다.',{social:3,happy:6,smart:2},()=>P.fam.wealth>=3],['배낭여행을 떠났다.',{happy:6,money:-300}],['토익 학원에 다녔다.',{smart:2}]],
  mil: [['훈련소에서 첫 편지를 받았다.',{happy:3}],['혹한기 훈련을 버텼다.',{hp:3,happy:-3}],['휴가를 나왔다.',{happy:5}],['선임에게 시달렸다.',{happy:-5}],['축구를 하다 발목을 다쳤다.',{hp:-2}]],
  seek: [['자기소개서를 50번 고쳐 썼다.',{happy:-3}],['독서실에서 하루를 보냈다.',{smart:1}],['아르바이트로 버텼다.',{money:800}],['면접에서 떨어졌다.',{happy:-4}],['부모님 눈치가 보였다.',{happy:-3},()=>P.age<35&&(P.fa.alive||P.mo.alive)]],
  work: [['야근이 이어졌다.',{hp:-2,happy:-3}],['회식이 잦았다.',{hp:-2,social:2}],['해외여행을 다녀왔다.',{happy:6,money:-300},()=>P.year>=1990],['운동을 시작했다.',{hp:4}],['번아웃이 왔다.',{happy:-8}],['반려동물을 입양했다.',{happy:7,money:-100}],
    ['주식으로 돈을 벌었다.',{money:700,happy:3},()=>P.money>2000],['주식으로 돈을 잃었다.',{money:-800,happy:-4},()=>P.money>2000],['코인에 손댔다가 크게 잃었다.',{money:-1500,happy:-6},()=>P.year>=2017&&P.money>3000],
    ['동창회에서 옛 친구들을 만났다.',{social:3,happy:2}],['자격증을 땄다.',{smart:2}],['허리 디스크가 왔다.',{hp:-4},()=>P.age>35],['건강검진에서 이상 없음 판정을 받았다.',{happy:2}],['로또 4등에 당첨됐다.',{money:5,happy:2}],
    ['연말 성과급을 받았다.',{money:800,happy:4},()=>P.job&&['대기업','은행'].includes(P.job.t)]],
  retired: [['등산에 재미를 붙였다.',{hp:3,happy:3}],['경로당에 나가기 시작했다.',{social:3}],['무릎 수술을 받았다.',{hp:-5,money:-300}],['손주들이 놀러 왔다.',{happy:6},()=>P.grandkids>0],['노인 일자리에 나갔다.',{money:300,social:2}],
    ['텃밭을 가꾸었다.',{happy:3,hp:1}],['치매 검사를 받았다.',{happy:-2},()=>P.age>75],['친구의 부고를 들었다.',{happy:-4},()=>P.age>70],['자식들과 가족 여행을 다녀왔다.',{happy:5},()=>P.kids.length>0]]
};
function stageKey(){
  const a=P.age;
  if (P.mil) return 'mil';
  if (a<7) return 'baby';
  if (P.stage==='elem') return 'elem'; if (P.stage==='mid') return 'mid'; if (P.stage==='high'||P.stage==='retake') return 'high';
  if (P.stage==='univ') return 'univ';
  if (['seek','exam-prep','jobless','exam'].includes(P.stage)) return 'seek';
  if (P.stage==='retired' || a>=65) return 'retired';
  return 'work';
}
// 처음 겪는 일은 한 번만, 나머지도 몇 년 안에는 되풀이하지 않는다
const ONCE = /처음|시작|뗐다|배웠다|입양|컸다|들어갔다|교환학생|디스크|띠를/;
function flavor(force){
  const seen = P.flags.seen || (P.flags.seen = {});
  const pool = FLAV[stageKey()].filter(f => (!f[2] || f[2]()) && !(f[0] in seen && (ONCE.test(f[0]) || P.age-seen[f[0]] < 6)));
  if (pool.length && (force || rand()<.8)){ const f = rnd(pool); seen[f[0]] = P.age; say(f[0], f[1]); }
  else if (force) say('평범한 한 해가 지나갔다.');
}

// ── 병역 ────────────────────────────────────────
function military(){
  const a = P.age;
  if (P.mil){
    P.mil.left -= 12;
    if (P.mil.left <= 0){ P.mil=null; P.milDone=true; say(P.flags.service ? '소집 해제됐다.' : '전역했다.', {happy:8}); }
    return;
  }
  if (P.milDone || a<20 || P.pending) return;
  if (a>35){ P.milDone=true; return; }
  if (['mid','high','exam'].includes(P.stage)) return;
  if (P.stage==='univ' && P.uni.done<1 && a<22) return;
  if (P.hp<20){ P.milDone=true; say('신체검사에서 병역 면제 판정을 받았다.'); return; }
  const y = P.year, m = y<1990 ? 30 : y<2004 ? 26 : y<2011 ? 24 : y<2018 ? 21 : 18;
  if (P.hp<35){ P.mil={left:m+3}; P.flags.service=true; say('신체검사 4급, 사회복무요원으로 소집됐다.'); return; }
  ask({title:'입대', desc:'입영 통지서가 나왔다. 어디로 갈까?', options:[
    {label:'육군', sub:`${m}개월`, go:() => { P.mil={left:m}; say('육군 훈련소에 입소했다.', {hp:3, happy:-6}); }},
    {label:'공군', sub:`${m+3}개월, 기술을 배운다`, go:() => { P.mil={left:m+3}; say('공군에 입대했다.', {smart:2, happy:-5}); }},
    {label:'해병대', sub:`${m}개월, 누구나 갈 수는 없다`, go:() => { P.mil={left:m}; say('해병대 훈련소에 입소했다.', {hp:6, happy:-8, social:2}); }}
  ]});
}

if (typeof module !== 'undefined') module.exports = {
  newLife, step, choose, get P(){ return P; }, setRand: f => { rand = f; }, setM: (m,f) => { M_MALE=m; M_FEMALE=f; }, netWorth, gompQ, M_MALE, M_FEMALE
};
