// 어느 독일인의 생애 — 엔진
// 1879~1899년 독일 제국에서 태어나 바이마르 공화국, 나치 독일, 전쟁, 점령기, 서독·동독을 산다.
// 나라 전체의 역사(선거 결과, 집권, 전쟁)는 실제대로 흘러가고, 나는 그 안의 한 사람이다.
// 화면과 상관없는 규칙만 둔다. 내 상태는 P, 정치판(다른 정치인·의회)은 W에 모은다. 시간은 한 달씩 흐른다.
'use strict';

const POP = 49428470;                       // 1890년 독일 제국 인구

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
const J = (w, a, b) => w + (jong(w)>0 ? a : b);
const eu = w => { const j=jong(w); return j>0 && j!==8 ? '으로' : '로'; };
const pct = x => `${(x*100).toFixed(1)}%`;
// 돈: 1948년 화폐개혁 뒤 서독은 도이치마르크
function money(n){
  const unit = P && P.year>=1948 && P.zone==='west' ? '도이치마르크' : '마르크';
  return `${n<0?'−':''}${Math.abs(Math.round(n)).toLocaleString('ko-KR')}${unit}`;
}

// ── 땅 ───────────────────────────────────────────
// 지역: 인구(1900년 무렵, 만 명), 가톨릭 비율, 공업, 동엘베(융커 농촌), 유대인 비율(%), 1945년 이후 운명
// 장소: [이름, 인구 비중, 도시 여부, 공업, (가톨릭 비율 덮어쓰기)]
const REGION = {
  '베를린':{w:270, cath:.10, ind:.7, east:0, jew:4.3, after:'berlin', places:[['베딩',50,1,.9],['크로이츠베르크',50,1,.7],['샤를로텐부르크',40,1,.3],['쇠네베르크',30,1,.3],['노이쾰른',40,1,.8],['판코',30,1,.5]]},
  '브란덴부르크':{w:310, cath:.07, ind:.4, east:1, jew:.3, after:'east', places:[['포츠담',10,1,.3],['프랑크푸르트(오데르)',8,1,.4],['코트부스',7,1,.6],['브란덴부르크 농촌 마을',285,0,.1]]},
  '동프로이센':{w:200, cath:.13, ind:.1, east:1, jew:.7, after:'lost', places:[['쾨니히스베르크',20,1,.4],['틸지트',4,1,.3],['알렌슈타인',4,1,.2,.9],['동프로이센 농촌 마을',172,0,.05]]},
  '포메른':{w:160, cath:.02, ind:.2, east:1, jew:.4, after:'lost', places:[['슈테틴',20,1,.6],['슈트랄준트',3,1,.3],['포메른 농촌 마을',137,0,.05]]},
  '슐레지엔':{w:470, cath:.55, ind:.5, east:1, jew:.9, after:'lost', places:[['브레슬라우',42,1,.5],['글라이비츠',6,1,.9,.95],['괴를리츠',8,1,.5,.2],['슐레지엔 농촌 마을',414,0,.2]]},
  '작센':{w:420, cath:.04, ind:.9, east:0, jew:.4, after:'east', places:[['라이프치히',45,1,.8],['드레스덴',40,1,.6],['켐니츠',20,1,.9],['츠비카우',7,1,.9],['에르츠산맥 마을',308,0,.6]]},
  '작센주':{w:280, cath:.08, ind:.6, east:0, jew:.3, after:'east', places:[['마그데부르크',23,1,.7],['할레',16,1,.8],['에르푸르트',8,1,.5],['작센주 농촌 마을',233,0,.2]]},
  '튀링겐':{w:130, cath:.02, ind:.6, east:0, jew:.2, after:'east', places:[['바이마르',3,1,.2],['예나',2,1,.6],['게라',4,1,.7],['고타',3,1,.4],['튀링겐 숲 마을',118,0,.4]]},
  '메클렌부르크':{w:70, cath:.01, ind:.1, east:1, jew:.2, after:'east', places:[['로스토크',5,1,.4],['슈베린',4,1,.2],['메클렌부르크 농촌 마을',61,0,.05]]},
  '슐레스비히홀슈타인':{w:140, cath:.02, ind:.3, east:0, jew:.2, after:'west', places:[['킬',10,1,.6],['플렌스부르크',5,1,.3],['디트마르셴 농촌 마을',125,0,.05]]},
  '하노버':{w:260, cath:.13, ind:.4, east:0, jew:.4, after:'west', places:[['하노버',25,1,.6],['오스나브뤼크',5,1,.4,.7],['괴팅겐',3,1,.2],['하노버 농촌 마을',227,0,.1]]},
  '베스트팔렌':{w:320, cath:.50, ind:.9, east:0, jew:.6, after:'west', places:[['도르트문트',15,1,1],['보훔',7,1,1],['겔젠키르헨',14,1,1],['뮌스터',6,1,.1,.95],['빌레펠트',7,1,.6,.1],['베스트팔렌 농촌 마을',271,0,.3]]},
  '라인 지방':{w:580, cath:.70, ind:.8, east:0, jew:.9, after:'west', places:[['쾰른',37,1,.6],['뒤셀도르프',21,1,.6],['에센',12,1,1],['뒤스부르크',10,1,1],['아헨',14,1,.6],['코블렌츠',4,1,.2],['라인 농촌 마을',362,0,.3]]},
  '헤센':{w:300, cath:.30, ind:.5, east:0, jew:1.6, after:'west', places:[['프랑크푸르트',29,1,.5],['카셀',10,1,.6],['다름슈타트',7,1,.4],['비스바덴',9,1,.2],['헤센 농촌 마을',245,0,.2]]},
  '바이에른':{w:620, cath:.70, ind:.4, east:0, jew:.8, after:'west', places:[['뮌헨',50,1,.4],['뉘른베르크',26,1,.8,.3],['아우크스부르크',9,1,.7],['뷔르츠부르크',7,1,.2],['레겐스부르크',5,1,.3],['바이에른 농촌 마을',523,0,.1]]},
  '뷔르템베르크':{w:220, cath:.30, ind:.5, east:0, jew:.5, after:'west', places:[['슈투트가르트',18,1,.6],['울름',4,1,.5],['하일브론',4,1,.6],['슈바벤 농촌 마을',194,0,.2]]},
  '바덴':{w:190, cath:.60, ind:.5, east:0, jew:1.3, after:'west', places:[['만하임',14,1,.8],['카를스루에',10,1,.5],['프라이부르크',6,1,.2,.8],['바덴 농촌 마을',160,0,.2]]},
  '함부르크':{w:80, cath:.04, ind:.7, east:0, jew:2.3, after:'west', places:[['함부르크',80,1,.7]]},
  '브레멘·올덴부르크':{w:60, cath:.15, ind:.4, east:0, jew:.4, after:'west', places:[['브레멘',19,1,.6],['올덴부르크',3,1,.2],['올덴부르크 농촌 마을',38,0,.1]]}
};
const REGIONS = Object.keys(REGION);
const POP_W = REGIONS.reduce((s,r)=>s+REGION[r].w,0);
const PLACE_ALL = []; for (const r of REGIONS) for (const pl of REGION[r].places) PLACE_ALL.push([[r, pl[0]], pl[1]]);
const isVillage = place => /마을$/.test(place);
function prof(r, place){   // 정치 성향을 정하는 동네의 모습
  const R = REGION[r], pl = R.places.find(x=>x[0]===place) || R.places[R.places.length-1];
  return {cath: pl[4]!=null ? pl[4] : R.cath, urb: pl[2] ? 1 : .1, ind: pl[3], east: R.east};
}
const at = (r, place) => isVillage(place) || r===place ? place : `${r} ${place}`;
const pickPlace = r => wpick(REGION[r].places.map(x=>[x[0],x[1]])).v;

// ── 정당 ─────────────────────────────────────────
const PARTY = [
  {n:'사민당', f:'사회민주당(SPD)'}, {n:'공산당', f:'독일 공산당(KPD)'}, {n:'중앙당', f:'가톨릭 중앙당'}, {n:'민주당', f:'독일 민주당(DDP)'},
  {n:'인민당', f:'독일 인민당(DVP)'}, {n:'국가인민당', f:'독일 국가인민당(DNVP)'}, {n:'나치당', f:'국가사회주의 독일 노동자당(NSDAP)'}, {n:'군소 정당', f:'군소 정당'},
  {n:'기민련', f:'기독교민주연합(CDU/CSU)'}, {n:'자민당', f:'자유민주당(FDP)'}, {n:'사통당', f:'독일 사회주의통일당(SED)'}
];
const SPD=0, KPD=1, Z=2, DDP=3, DVP=4, DNVP=5, NS=6, ETC=7, CDU=8, FDP=9, SED=10;
const pname = i => i==null ? '무소속' : PARTY[i].n;
// 동네 모습에 따라 당 지지가 커지고 작아진다(전국 평균 가톨릭 비율 약 1/3 기준)
function mult(p, f){
  const c = f.cath - .33;
  switch (p){
    case SPD: return Math.max(.2, 1 + .3*f.urb + .5*f.ind - 1.1*c);
    case KPD: return Math.max(.1, .35 + 1.2*f.ind + .4*f.urb - .6*c);
    case Z: return Math.max(.03, 3*f.cath);
    case DDP: return Math.max(.2, .8 + .5*f.urb - .4*c);
    case DVP: return Math.max(.2, .9 + .3*f.urb + .2*f.ind - .5*c);
    case DNVP: return Math.max(.2, .7 + 1.1*f.east - .3*f.urb - .8*c);
    case NS: return Math.max(.2, 1.15 - 1.2*c + .25*f.east - .3*f.urb);
    case CDU: return Math.max(.3, .6 + 1.3*f.cath);
    case FDP: return Math.max(.3, .9 + .3*f.urb - .4*c);
    default: return 1;
  }
}
function localShare(sh, f){
  const out = {}; let t = 0;
  for (const p in sh){ out[p] = sh[p]*mult(+p, f); t += out[p]; }
  for (const p in out) out[p] /= t;
  return out;
}

// ── 선거 ─────────────────────────────────────────
// 제국의회: [연, 월(0부터), 총 의석, 득표율, 실제 의석]. 순서 = 사민·공산(1919~20년은 독립사민당 포함)·중앙(바이에른 인민당 포함)·민주·인민·국가인민·나치(1924년은 민족주의 연합)·기타
const REICH = [
  [1919,0,423,[37.9,7.6,19.7,18.6,4.4,10.3,0,1.5],[163,22,91,75,19,44,0,9]],
  [1920,5,459,[21.9,20.0,17.9,8.3,13.9,15.1,0,2.9],[102,88,85,39,65,71,0,9]],
  [1924,4,472,[20.5,12.6,16.6,5.7,9.2,19.5,6.5,9.4],[100,62,81,28,45,95,32,29]],
  [1924,11,493,[26.0,9.0,17.3,6.3,10.1,20.5,3.0,7.8],[131,45,88,32,51,103,14,29]],
  [1928,4,491,[29.8,10.6,15.2,4.9,8.7,14.2,2.6,14.0],[153,54,78,25,45,73,12,51]],
  [1930,8,577,[24.5,13.1,14.8,3.8,4.7,7.0,18.3,13.8],[143,77,87,20,30,41,107,72]],
  [1932,6,608,[21.6,14.3,15.7,1.0,1.2,5.9,37.3,3.0],[133,89,97,4,7,37,230,11]],
  [1932,10,584,[20.4,16.9,15.0,1.0,1.9,8.3,33.1,3.4],[121,100,90,2,11,52,196,12]],
  [1933,2,647,[18.3,12.3,13.9,.9,1.1,8.0,43.9,1.6],[120,81,92,5,2,52,288,7]]
];
const LAND = [[1919,0],[1921,1],[1924,11],[1928,4],[1932,3]];     // 주의회(프로이센 기준)
const CITY = [[1919,2],[1924,4],[1929,10]];                        // 시·군 의회
// 서독 연방의회: [연, 월, 의석, {당:득표율}, {당:의석}]
const BUND = [
  [1949,7,402,{0:29.2,1:5.7,8:31.0,9:11.9,7:22.2},{0:131,1:15,8:139,9:52,7:65}],
  [1953,8,487,{0:28.8,1:2.2,8:45.2,9:9.5,7:14.3},{0:151,8:243,9:48,7:45}],
  [1957,8,497,{0:31.8,8:50.2,9:7.7,7:10.3},{0:169,8:270,9:41,7:17}],
  [1961,8,499,{0:36.2,8:45.3,9:12.8,7:5.7},{0:190,8:242,9:67}],
  [1965,8,496,{0:39.3,8:47.6,9:9.5,7:3.6},{0:202,8:245,9:49}],
  [1969,8,496,{0:42.7,8:46.1,9:5.8,7:5.4},{0:224,8:242,9:30}],
  [1972,10,496,{0:45.8,8:44.9,9:8.4,7:.9},{0:230,8:225,9:41}],
  [1976,9,496,{0:42.6,8:48.6,9:7.9,7:.9},{0:214,8:243,9:39}],
  [1980,9,497,{0:42.9,8:44.5,9:10.6,7:2},{0:218,8:226,9:53}],
  [1983,2,498,{0:38.2,8:48.8,9:7.0,7:6},{0:193,8:244,9:34,7:27}],
  [1987,0,497,{0:37.0,8:44.3,9:9.1,7:9.6},{0:186,8:223,9:46,7:42}]
];
const WCITY = [[1946,8],[1948,9],[1952,10],[1956,9],[1960,2],[1964,9],[1968,3],[1972,9],[1976,3],[1980,2],[1984,9],[1988,3]];
const VOLK = [[1950,9],[1954,9],[1958,10],[1963,9],[1967,6],[1971,10],[1976,9],[1981,5],[1986,5]];
const reichShare = e => Object.fromEntries(e[3].map((v,i)=>[i,v/100]).filter(([,v])=>v>0));
function nearestReich(y, m){ let best = REICH[0]; for (const e of REICH) if (e[0]*12+e[1] <= y*12+m+6) best = e; return best; }
function nearestBund(y){ let best = BUND[0]; for (const e of BUND) if (e[0] <= y+1) best = e; return best; }
const bundShare = b => Object.fromEntries(Object.entries(b[3]).map(([p,v])=>[p, v/100]));

// ── 시대 ─────────────────────────────────────────
// empire: 제국, weimar: 공화국, nazi: 나치 독일, occ: 점령기, west/east: 서독·동독
function era(y, m){
  const t = y*12+m;
  if (t < 1918*12+10) return 'empire';
  if (t < 1933*12) return 'weimar';
  if (t < 1945*12+4) return 'nazi';
  if (t < 1949*12+4) return 'occ';
  return P.zone==='east' ? 'east' : 'west';
}
const ERA_NAME = {empire:'독일 제국', weimar:'바이마르 공화국', nazi:'나치 독일', occ:'연합국 점령기', west:'서독', east:'동독'};

// 역사: [연, 월, 내용]. 정치 지형이 바뀌는 큰일만
const HISTORY = [
  [1888,5,'빌헬름 2세가 황제에 올랐다'],[1890,2,'비스마르크가 재상에서 물러났다'],[1890,9,'사회주의자 탄압법이 폐지됐다'],
  [1900,0,'민법전이 시행됐다'],[1908,9,'여성이 대학에 정식으로 입학할 수 있게 됐다'],[1912,0,'제국의회 선거에서 사민당이 제1당이 됐다'],
  [1914,7,'제1차 세계대전이 일어났다'],[1916,8,'베르됭과 솜에서 수십만 명이 죽었다'],[1917,0,'순무로 버틴 굶주림의 겨울이 지나갔다'],
  [1918,9,'스페인 독감이 퍼졌다'],[1918,10,'11월 혁명이 일어나 황제가 물러나고 공화국이 선포됐다. 휴전이 맺어졌다'],
  [1919,0,'스파르타쿠스단 봉기가 진압됐다'],[1919,0,'여성이 처음으로 투표했다'],[1919,5,'베르사유 조약이 맺어졌다'],
  [1919,7,'바이마르 헌법이 공포됐다'],[1920,2,'카프 폭동이 총파업으로 무너졌다'],[1921,7,'에르츠베르거가 암살됐다'],[1922,5,'외무장관 라테나우가 암살됐다'],
  [1923,0,'프랑스군이 루르를 점령했다'],[1923,10,'물가가 하늘로 치솟았다. 빵 한 덩이가 수천억 마르크가 됐다'],[1923,10,'뮌헨에서 히틀러의 맥주홀 폭동이 실패했다'],
  [1924,7,'도스안으로 경제가 숨을 돌렸다'],[1925,3,'힌덴부르크가 대통령에 당선됐다'],[1926,8,'독일이 국제연맹에 들어갔다'],
  [1929,9,'슈트레제만이 죽고 뉴욕 증시가 무너졌다'],[1930,2,'대연정이 무너지고 대통령 긴급명령 정치가 시작됐다'],[1932,1,'실업자가 600만 명을 넘었다'],
  [1932,3,'힌덴부르크가 히틀러를 꺾고 대통령에 다시 당선됐다'],[1932,6,'프로이센 주정부가 쫓겨났다'],[1933,0,'히틀러가 총리에 임명됐다'],
  [1933,1,'제국의회 의사당이 불탔다. 기본권이 정지됐다'],[1933,2,'수권법이 통과됐다. 사민당만 반대했다'],[1933,3,'유대인 상점 불매운동이 벌어졌다'],
  [1933,4,'노동조합이 해산됐다'],[1933,6,'나치당 말고는 모든 정당이 금지됐다'],[1934,5,'긴 칼의 밤. 돌격대 지도부가 살해됐다'],[1934,7,'힌덴부르크가 죽고 히틀러가 총통이 됐다'],
  [1935,8,'뉘른베르크법으로 유대인이 시민권을 잃었다'],[1936,7,'베를린 올림픽이 열렸다'],[1938,2,'오스트리아가 합병됐다'],
  [1938,10,'11월 포그롬. 회당이 불타고 유대인 3만 명이 수용소로 끌려갔다'],[1939,8,'독일이 폴란드를 침공했다. 제2차 세계대전이 시작됐다'],
  [1940,5,'프랑스가 항복했다'],[1941,5,'독일이 소련을 침공했다'],[1941,9,'독일 유대인의 동방 이송이 시작됐다'],[1942,0,'반제 회의에서 유대인 학살 계획이 조율됐다'],
  [1943,1,'스탈린그라드에서 6군이 항복했다'],[1943,6,'함부르크가 폭격으로 불탔다'],[1944,5,'연합군이 노르망디에 상륙했다'],
  [1944,6,'7월 20일 히틀러 암살 시도가 실패했다'],[1944,9,'16~60세 남자를 국민돌격대로 모았다'],[1945,0,'동부에서 수백만 명이 서쪽으로 피난길에 올랐다'],
  [1945,1,'드레스덴이 폭격으로 불탔다'],[1945,3,'히틀러가 자살했다'],[1945,4,'독일이 무조건 항복했다'],[1945,7,'포츠담 회담. 독일이 넷으로 나뉘어 점령됐다'],
  [1945,10,'뉘른베르크 국제군사재판이 열렸다'],[1946,9,'뉘른베르크에서 주요 전범 12명에게 사형이 선고됐다'],[1948,5,'화폐개혁. 베를린 봉쇄가 시작됐다'],
  [1949,4,'서쪽에 독일연방공화국이 세워졌다'],[1949,9,'동쪽에 독일민주공화국이 세워졌다'],[1953,5,'동독에서 6월 17일 봉기가 진압됐다'],
  [1954,6,'서독이 월드컵에서 우승했다'],[1955,4,'서독이 나토에 들어갔다'],[1956,7,'서독 헌법재판소가 공산당을 금지했다'],
  [1961,7,'베를린 장벽이 세워졌다'],[1963,11,'프랑크푸르트 아우슈비츠 재판이 시작됐다'],[1968,4,'학생운동이 거리를 메웠다'],
  [1970,11,'브란트 총리가 바르샤바 게토 기념비 앞에 무릎을 꿇었다'],[1972,8,'뮌헨 올림픽 참사'],[1989,10,'베를린 장벽이 무너졌다'],[1990,9,'독일이 다시 하나가 됐다']
];

// ── 이름 ─────────────────────────────────────────
const SURNAME = '뮐러 슈미트 슈나이더 피셔 베버 마이어 바그너 베커 슐츠 호프만 셰퍼 코흐 바우어 리히터 클라인 볼프 슈뢰더 노이만 슈바르츠 치머만 브라운 크뤼거 하르트만 랑에 베르너 슈미츠 크라우제 레만 쾰러 헤르만 쾨니히 발터 후버 카이저 푹스 페터스 랑 숄츠 묄러 바이스 융 한 슈베르트 포겔 켈러 귄터 프랑케 베르거 빈클러 로트 베크 로렌츠 바우만 알브레히트 짐머 슈만 하제 크라머'.split(' ');
const JSURNAME = '콘 레비 로젠탈 히르슈 오펜하이머 카츠 마이어호프 멘델스존 뢰벤슈타인 블로흐 하이만 프랑크 로젠베르크 골트슈미트 잘로몬'.split(' ');
const MALE = '카를 빌헬름 프리드리히 한스 오토 파울 헤르만 하인리히 에른스트 발터 프리츠 쿠르트 막스 리하르트 게오르크 루트비히 에리히 빌리 요한 아우구스트 프란츠 알프레트 루돌프 구스타프 베르너 헬무트 테오도어 알베르트'.split(' ');
const FEMALE = '안나 마리아 마리 마르타 프리다 엠마 엘리자베트 마르가레테 게르트루트 베르타 클라라 헤트비히 케테 루이제 헬레네 이다 엘제 파울라 헤르타 로자 아그네스'.split(' ');
const JMALE = '모리츠 지크프리트 이지도어 잘로몬 율리우스 막스 레오 아르투어 지크문트 에른스트'.split(' ');
const JFEMALE = '레기나 헨리에테 베티 지도니 로자 클라라 이다 아다 헬레네'.split(' ');
const mkName = (male, jew) => `${rnd(jew ? (male?JMALE:JFEMALE) : (male?MALE:FEMALE))} ${rnd(jew ? JSURNAME : SURNAME)}`;

// ── 사망 ─────────────────────────────────────────
function gompQ(x, M){
  const b=0.09, a=b*Math.exp(-b*M), H = t => a/b*(Math.exp(b*t)-1);
  return 1-Math.exp(-(H(x+1)-H(x)));
}
function deathCause(d){
  return wpick(
    d<15 ? [['디프테리아',30],['결핵',25],['장염',25],['사고',20]] :
    d<45 ? [['결핵',40],['사고',25],['폐렴',20],['기타 질환',15]] :
    d<70 ? [['심장병',30],['암',30],['뇌졸중',15],['결핵',10],['기타 질환',15]] :
           [['심장병',35],['노환',25],['암',20],['폐렴',10],['뇌졸중',10]]
  ).v;
}

// ── 상태 ─────────────────────────────────────────
let P = null, W = null, nextId = 1;
const LBL = {merit:'공훈', hp:'건강', smart:'머리', talk:'말솜씨', charm:'친화력', nerve:'담력', wit:'처세', fame:'인지도', rep:'평판', org:'조직력'};

function fx(eff){
  const parts = [];
  for (const k in eff){
    const v = Math.round(eff[k]); if (!v) continue;
    if (k==='money'){ P.money += v; parts.push({s:`${v>0?'+':''}${money(v)}`, neg:v<0}); }
    else { P[k] = clamp(P[k]+v, 0, 100); parts.push({s:`${LBL[k]} ${v>0?'+':'−'}${Math.abs(v)}`, neg:v<0}); }
  }
  return parts;
}
function say(t, eff, kind){ P.cur.lines.push({t, fx: eff ? fx(eff) : [], kind: kind || 'life'}); P.ver++; }
function news(t, big){
  W.news.unshift({t, y:P.year, m:P.month, big:!!big}); W.news.length = Math.min(W.news.length, 40);
  if (big) say(t, null, 'world');
}
// 이미 기다리는 선택이 있으면 줄을 세운다. 차례가 왔을 때 더는 맞지 않는 선택은 버린다
function ask(ch){ if (!P.alive) return; if (P.pending){ P.queue.push(ch); return; } P.pending = ch; P.ver++; }
function choose(i){
  const ch = P.pending; if (!ch) return;
  const o = ch.options[i]; if (!o || o.off) return;
  P.pending = null; P.ver++;
  say(`${ch.title} · ${o.label}`, null, 'pick');
  o.go();
  while (!P.pending && P.queue.length && P.alive){ const n = P.queue.shift(); if (!n.valid || n.valid()) P.pending = n; }
}
function show(s){ P.shows.push(s); P.ver++; }
function ack(){ P.shows.shift(); P.ver++; }
function deed(t, g){ P.deeds.push(t); P.guilt += g||0; }

// ── 자리 ─────────────────────────────────────────
const OFF = {
  city:{n:'시의원', pw:30, sal:600}, land:{n:'주의회 의원', pw:70, sal:3000}, mdr:{n:'제국의회 의원', pw:150, sal:9000},
  landmin:{n:'주 장관', pw:230, sal:15000}, bdr:{n:'연방의회 의원', pw:160, sal:22000}, wcity:{n:'시의원', pw:30, sal:2000}
};
const NSR = {m:['당원','블록 지도자','지구 지도자','군 지도자','가우 간부','가우라이터'], f:['당원','나치 여성회 회원','나치 여성회 지구 책임자','나치 여성회 군 책임자','나치 여성회 가우 책임자','나치 여성회 가우 책임자']};
const NS_GUILT = [.1,.25,.6,1.5,3,6], NS_SAL = [0,0,1200,6000,9000,20000];
const SEDR = ['사통당 당원','지구 간부','군 간부','도 간부','인민의회 의원','중앙위원'];
const nsr = (x, r) => NSR[x.male ? 'm' : 'f'][r];

function title(x){
  const parts = [];
  if (x.landmin) parts.push(`${x.region} 주 장관`);
  if (x.office) parts.push(x.office==='mdr' ? `제국의회 의원 (${x.region})` : x.office==='bdr' ? `연방의회 의원 (${x.region})` :
    x.office==='land' ? `${x.region} 주의회 의원` : `${x.place} 시의원`);
  if (x.party===NS && x.nsRank!=null) parts.push(`나치당 ${nsr(x, x.nsRank)}${x.nsRank>=2 ? ` (${x.place})` : ''}`);
  if (x.party===SED && x.sedRank!=null) parts.push(SEDR[x.sedRank]);
  if (x.nsMdr) parts.push('제국의회 의원(나치)');
  if (x.mil && (x.mil.active || x.mil.pow)) parts.push(`${x.mil.pow ? '포로 · ' : ''}${armyName()} ${MILR[x.mil.r]}`);
  if (x.biz) parts.push(bizTitle(x.biz));
  if (parts.length) return parts.join(' · ');
  if (x.fate) return x.fate;
  if (x.ex) return x.ex;
  if (x.party!=null) return `${pname(x.party)} 당원`;
  return '';
}
function power(x){
  if (!x.alive || x.retired) return 0;
  let p = x.office ? OFF[x.office].pw : 0;
  if (x.landmin) p = Math.max(p, OFF.landmin.pw);
  if (x.party===NS && x.nsRank!=null) p = Math.max(p, [5,15,40,90,160,350][x.nsRank]);
  if (x.party===SED && x.sedRank!=null) p = Math.max(p, [5,30,60,100,160,300][x.sedRank]);
  if (x.best) p = Math.max(p, OFF[x.best].pw*.25);
  if (x.mil && x.mil.active) p = Math.max(p, MILW[x.mil.r]);
  if (x.biz) p = Math.max(p, bizW(x.biz.size));
  if (x.party==null && !x.mil && !x.biz) return Math.round(x.fame);
  return Math.round(p + x.fame*1.5 + x.wins*8);
}
function setBest(x, o){ if (!x.best || OFF[o].pw > OFF[x.best].pw) x.best = o; }
const exTitle = x => x.best ? `전 ${OFF[x.best].n}` : null;
function fameTarget(x){
  const base = power(x) - x.fame*1.5;
  const job = x.job && JOBS[x.job] ? JOBS[x.job].fame || 3 : 3;
  return Math.max(job, 8 + Math.min(87, base/6));
}
function orgTarget(x){
  const job = x.job && JOBS[x.job] ? JOBS[x.job].org || 20 : 15;
  return Math.max(job, 25 + Math.min(55, (power(x) - x.fame*1.5)/6)) + (x.charm!=null ? (x.charm-50)*.3 : 0);
}

// ── 실존 인물 ─────────────────────────────────────
// 이름난 사람들은 모두 실존 인물이다(people.js). 그들은 실제 경력대로 살고 죽는다.
// 기록이 남지 않은 사람(명부의 다른 후보 등)은 그 시대 이름으로 지어 부른다
const PCODE = {SPD, KPD, Z, DDP, DVP, DNVP, NS, ETC, CDU, FDP, SED};
const REAL = (typeof PEOPLE!=='undefined' ? PEOPLE : require('./people.js')).map((r,i) => ({id:'r'+i, real:true, name:r[0], male:r[1]==='m', b:r[2], d:r[3], dc:r[4], region:r[5],
  path:r[6].map(e => ({from:e[0], to:e[1], t:e[2], w:e[3], party:e[4] ? PCODE[e[4]] : null, tr:e[5]})), ev:r[7]||[], top:Math.max(...r[6].map(e=>e[3]))}));
const now = () => P.year + P.month/12;
const realAlive = x => now() >= x.b && now() < x.d + .5;
function realEntry(x, tr){ let e = null; for (const p of x.path) if (p.from<=P.year && P.year<=p.to && (!tr || p.tr===tr)) e = p; return e; }
function realLast(x){ let e = null; for (const p of x.path) if (p.from<=P.year) e = p; return e; }
function realTitle(x){
  if (!realAlive(x)) return `${x.dc || '사망'} (${x.d})`;
  const e = realEntry(x); if (e) return e.t;
  const l = realLast(x); return l ? `전 ${l.t}` : '—';
}
// 해마다 실존 인물들의 새 자리와 일, 죽음을 소식으로 전한다
function realNews(){
  const y = P.year;
  for (const x of REAL){
    for (const p of x.path) if (p.from===y && p.w>=300) news(`${x.name}, ${p.t}`);
    for (const [ey, t] of x.ev) if (ey===y) news(`${x.name} — ${t}`);
    if (x.d===y && x.top>=300) news(`${x.name} ${x.dc || '별세'} (향년 ${x.d-x.b}세)`);
  }
}
// 명부에 함께 오른 사람들: 그 지역 같은 당의 실존 의원이 먼저, 나머지는 그 시대 이름으로
function listNames(k, rank, n){
  const reals = (k==='mdr' || k==='bdr') ? REAL.filter(x => { const e = realAlive(x) && realEntry(x, 'pol'); return e && x.region===P.region && e.party===P.party && e.w>=150; }).map(x=>x.name) : [];
  const out = [];
  for (let i=1; i<=n; i++) out.push(i===rank ? `${P.name}(나)` : reals.shift() || mkName(rand()<.9, false));
  return out;
}

// ── 직업 ─────────────────────────────────────────
// 부모와 나의 직업: 한 해 벌이(마르크, 1913~1928년 무렵), 인지도·조직력 바닥, 아이에게 주는 것
const JOBS = {
  '농부':{inc:900, org:25, d:{org:2}}, '농장 일꾼':{inc:600}, '광부':{inc:1700, org:30}, '공장 노동자':{inc:1500, org:25}, '수공업 장인':{inc:1600, org:25, d:{org:1}},
  '철도원':{inc:1700}, '점원':{inc:1300}, '하인':{inc:600}, '사무원':{inc:1800}, '교사':{inc:2800, d:{smart:3}}, '관료':{inc:4000, d:{smart:2}},
  '변호사':{inc:8000, fame:12, d:{smart:2, org:2}}, '의사':{inc:9000, fame:10, d:{smart:3}}, '목사':{inc:3000, org:35, d:{talk:3, org:2}}, '기자':{inc:3000, fame:18, d:{talk:2}},
  '기술자':{inc:3500, d:{smart:2}}, '장교':{inc:4000, fame:8, d:{org:2}}, '노동조합 간부':{inc:2500, org:50}, '상인':{inc:3500, org:30, d:{org:2}},
  '공장주':{inc:20000, fame:12, d:{org:4}}, '기업가':{inc:0, fame:6, org:30}, '직업군인':{inc:1100}, '간호사(적십자)':{inc:900}, '대지주':{inc:15000, fame:10, d:{org:3}}, '가정주부':{inc:0}, '삯바느질':{inc:500}, '간호사':{inc:1200}, '타자수':{inc:1300}
};
const FJOBS = [['농부',30],['농장 일꾼',10],['공장 노동자',20],['광부',5],['수공업 장인',12],['철도원',3],['점원',3],['사무원',3],['교사',2],['관료',2],['상인',5],['의사',.5],['변호사',.4],['목사',.8],['장교',.6],['공장주',.4],['대지주',.3]];
const JFJOBS = [['상인',40],['의사',6],['변호사',5],['공장주',4],['사무원',15],['수공업 장인',15],['교사',5],['기자',3],['공장 노동자',7]];
// 어머니 직업은 아버지 쪽 살림에 따라 갈린다. 아버지가 없으면 어머니가 벌어야 한다
function motherJobs(fa){
  if (!fa) return [['삯바느질',35],['공장 노동자',28],['하인',15],['농부',15],['점원',7]];
  if (['농부','농장 일꾼'].includes(fa)) return [['농부',72],['가정주부',22],['삯바느질',6]];
  if (['의사','변호사','공장주','대지주','장교','관료','목사'].includes(fa)) return [['가정주부',97],['간호사',3]];
  if (['교사','상인','기술자','사무원','철도원','수공업 장인','기자'].includes(fa)) return [['가정주부',82],['점원',8],['삯바느질',7],['공장 노동자',3]];
  return [['가정주부',55],['공장 노동자',18],['삯바느질',15],['하인',6],['점원',6]];
}
// 형편은 아버지 직업의 계층에서 정하고 어머니 벌이를 조금 더한다.
// 농부·상인·장인처럼 땅과 가게 크기가 제각각인 집은 더 넓게 퍼진다
const CLASS = {'농장 일꾼':.3, '하인':.3, '공장 노동자':1, '광부':1, '점원':1.2, '농부':1.3, '수공업 장인':1.6, '철도원':1.6, '사무원':1.8,
  '교사':2.2, '기자':2.3, '상인':2.5, '기술자':2.5, '목사':2.6, '관료':2.8, '장교':3, '의사':3.6, '변호사':3.6, '공장주':4.2, '대지주':4.2};
function wealthOf(fa, mo){
  let base = fa ? CLASS[fa] : mo ? .5 : .8;
  if (mo && !['가정주부','농부'].includes(mo)) base += ['하인','삯바느질'].includes(mo) ? 0 : .25;
  const wide = ['농부','상인','수공업 장인'].includes(fa);
  const v = clamp(Math.round(base + normal(0, wide ? .5 : .3)), 0, 4);
  // 확률: 같은 아버지 직업 집안 가운데 이 형편이 나올 비율(근사)
  const p = Phi((v+.5-base)/(wide?.5:.3)) - Phi((v-.5-base)/(wide?.5:.3));
  return {v, p: v===0 ? Phi((.5-base)/(wide?.5:.3)) : v===4 ? 1-Phi((3.5-base)/(wide?.5:.3)) : p};
}
function Phi(z){ const t = 1/(1+.2316419*Math.abs(z)), d = .3989423*Math.exp(-z*z/2), q = d*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274)))); return z>0 ? 1-q : q; }
const WEALTH = ['가난한 집','넉넉지 않은 집','살 만한 집','여유 있는 집','부유한 집'];
// 타고난 기질: 30점을 여섯 가지에 나눠 준다(0~10, 고르게 나누면 5씩)
// 체력=전선·굶주림·수용소를 버팀, 머리=학교·전문직, 말솜씨=연설·명부 순번, 친화력=조직,
// 담력=체포·심문·거리 싸움을 견딤, 처세=시류를 읽고 줄을 섬·위기를 빠져나감
const TRAITS = [['hp','체력'],['smart','머리'],['talk','말솜씨'],['charm','친화력'],['nerve','담력'],['wit','처세']];
const TRAIT_SUM = 30;
const births = y => 1750000 + (y-1879)*11000;
const BORN_FROM = 1879, BORN_TO = 1899;     // 히틀러(1889년생) 앞뒤 10년

// ── 태어나기 ─────────────────────────────────────
function newLife(alloc){
  alloc = alloc || Object.fromEntries(TRAITS.map(([k]) => [k, 5]));
  const rows = []; let prob = 1;
  const row = (label, value, p, note) => { rows.push({label, value, p, note}); prob *= p; };
  const yrs = []; for (let y=BORN_FROM; y<=BORN_TO; y++) yrs.push([y, births(y)]);
  const by = wpick(yrs).v, bm = ri(0,11);
  P = {bot:false, alive:true, by, bm, year:by, month:bm, age:0, ver:0, log:[], pending:null, queue:[], shows:[], wins:0, losses:0,
       party:null, prevParty:null, office:null, best:null, landmin:false, nsRank:null, wasNS:null, sedRank:null, nsMdr:false, guilt:0, deeds:[], camp:0, prison:0,
       retired:false, ex:null, careers:[], titles:[], peak:0, peakRank:null, flags:{}, edu:null, job:null, money:0, id:0, zone:null, exile:false};
  W = {news:[], house:null, hist:0};
  P.policy = 'work'; P.track = null; P.mil = null; P.biz = null;

  const nb = births(by);
  row('출생', `${by}년 ${bm+1}월`, nb/POP, `그해 태어난 아기 약 ${(Math.round(nb/10000)*10000).toLocaleString('ko-KR')}명`);
  const sx = wpick([['M',.513],['F',.487]]); P.male = sx.v==='M';
  row('성별', P.male ? '남자' : '여자', sx.p);
  const bp = wpick(PLACE_ALL); const [r, place] = bp.v;
  P.region = r; P.place = P.birthPlace = place;
  const f = prof(r, place);
  row('출생지', r===place ? r : `${r} · ${place}`, bp.p, isVillage(place) ? '시골' : '도시');
  const R = REGION[r];
  const jewP = R.jew/100 * (isVillage(place) ? .5 : place==='프랑크푸르트' ? 3 : 1.1);
  const rel = wpick([['유대교', jewP], ['가톨릭', f.cath*(1-jewP)], ['개신교', (1-f.cath)*(1-jewP)]]);
  P.faith = rel.v; P.jew = rel.v==='유대교';
  row('종교', rel.v, rel.p, P.jew ? '독일 인구의 1%가 채 안 되는 유대계 독일인' : null);

  const fam = wpick([['아버지·어머니',88],['어머니만',8],['아버지만',2.5],['할머니·할아버지',1.5]]);
  P.fa = /아버지/.test(fam.v) ? wpick(P.jew ? JFJOBS : FJOBS) : null;
  P.mo = /어머니/.test(fam.v) ? wpick(motherJobs(P.fa && P.fa.v)) : null;
  row('부모', fam.v==='아버지·어머니' ? '두 분 다 계심' : fam.v==='할머니·할아버지' ? '조부모 손에서 자람' : `${fam.v} 계심`, fam.p, /만$/.test(fam.v) ? '한쪽 부모를 일찍 잃음' : null);
  if (P.fa) row('아버지 직업', P.fa.v, P.fa.p);
  if (P.mo) row('어머니 직업', P.mo.v, P.mo.p);
  const inc = (P.fa ? JOBS[P.fa.v].inc : 0) + (P.mo ? JOBS[P.mo.v].inc : 0) + (!P.fa && !P.mo ? 700 : 0);
  const wl = wealthOf(P.fa && P.fa.v, P.mo && P.mo.v); P.wealth = wl.v;
  row('집안 형편', WEALTH[wl.v], wl.p, `부모 벌이 한 해 약 ${money(inc)}`);

  const pt = k => clamp(Math.round(alloc[k]||0), 0, 10);
  P.alloc = Object.fromEntries(TRAITS.map(([k]) => [k, pt(k)]));
  rows.push({label:'타고난 기질', value: TRAITS.map(([k,l]) => `${l} ${P.alloc[k]}`).join(' · '), p:1, pick:true});
  P.name = mkName(P.male, P.jew);
  row('이름', P.name, .02);

  P.hp = clamp(Math.round(60 + P.alloc.hp*4 + normal(0,3)), 30, 100);
  P.smart = clamp(Math.round(25 + P.alloc.smart*5 + normal(0,4)), 5, 95);
  P.talk = clamp(Math.round(25 + P.alloc.talk*5 + normal(0,4)), 5, 95);
  for (const k of ['charm','nerve','wit']) P[k] = clamp(Math.round(25 + P.alloc[k]*5 + normal(0,4)), 5, 95);
  P.fame = 0; P.rep = 60; P.org = clamp(Math.round(P.charm*.2 + P.wealth*2 + normal(0,3)), 0, 40);
  for (const j of [P.fa, P.mo]) if (j && JOBS[j.v].d) for (const k in JOBS[j.v].d) P[k] = clamp(P[k] + JOBS[j.v].d[k], 0, 100);
  P.cur = {year:by, age:0, lines:[]}; P.log.push(P.cur);
  const par = [P.fa && `아버지는 ${P.fa.v}`, P.mo && `어머니는 ${P.mo.v}`].filter(Boolean).join(', ');
  say(`${at(r, place)}에서 ${P.faith} 집안, ${WEALTH[P.wealth]}의 ${P.male?'아들':'딸'}로 태어났다. ${par ? `${par}.` : '할머니·할아버지 손에서 자랐다.'}`);
  // 태어나기 전에 이미 지나간 역사는 건너뛴다
  while (W.hist < HISTORY.length && HISTORY[W.hist][0]*12+HISTORY[W.hist][1] <= by*12+bm) W.hist++;
  return {rows, prob, expected: POP*prob};
}

// ── 한 달 ────────────────────────────────────────
function step(){
  if (!P.alive || P.pending || P.shows.length) return false;
  P.month++;
  if (P.month===12){ P.month = 0; P.year++; P.cur = {year:P.year, age:P.age, lines:[]}; P.log.push(P.cur); P.ver++; worldYear(); }
  while (W.hist < HISTORY.length && HISTORY[W.hist][0]===P.year && HISTORY[W.hist][1]===P.month){ say(HISTORY[W.hist][2], null, 'world'); W.hist++; }
  turning();
  if (P.alive && P.month===P.bm){ P.age++; P.ver++; lifeYear(); }
  if (P.alive) calendar();
  if (P.alive && inTrack(mainTrack()) && (mainTrack()!=='pol' || ['weimar','west','east'].includes(era(P.year,P.month))) && P.month===0){ const r = rank(); if (r.me && (P.peakRank==null || r.me < P.peakRank)) P.peakRank = r.me; }
  P.peak = Math.max(P.peak, power(P));
  return true;
}

// 역사가 꺾이는 순간들
function turning(){
  const y = P.year, m = P.month;
  if (y===1914 && m===7) warStart();
  if (y===1918 && m===10 && P.flags.front && P.alive && !(P.mil && P.mil.active)) say('전쟁이 끝났다. 살아서 돌아왔다.', {hp:-3});
  if (y===1919 && m===0 && P.party==null && P.age>=18) partyOffer();
  if (y===1923 && m===10 && P.money>0) say('초인플레이션으로 모아 둔 돈이 휴지가 됐다.', {money:-P.money*.97});
  if (y===1930 && m===0) depression();
  if (y===1933 && m===0) seizure();
  if (y===1933 && m===6) ban();
  if (y===1945 && m===4) surrender();
  if (y===1946 && m===6) trial();
  if (y===1948 && m===5 && P.money>0 && P.zone==='west') say('화폐개혁으로 돈이 10분의 1이 됐다.', {money:-P.money*.9});
  if (y===1949 && m===4) twoStates();
  milTurning(y, m); bizTurning(y, m);
}

// 선거 일정
function calendar(){
  const y = P.year, m = P.month, e = era(y, m);
  for (const r of REICH) if (r[0]===y && r[1]===m) electReich(r);
  if (e==='weimar'){
    for (const [ly,lm] of LAND) if (ly===y && lm===m) electLow('land');
    for (const [cy,cm] of CITY) if (cy===y && cm===m) electLow('city');
  }
  if (e==='nazi' && ((y===1933 && m===10) || (y===1936 && m===2) || (y===1938 && m===3))) nsElection();
  if (e==='west'){
    for (const b of BUND) if (b[0]===y && b[1]===m) electBund(b);
    for (const [cy,cm] of WCITY) if (cy===y && cm===m && y>=1949) electLow('wcity');
  }
  if (e==='east') for (const [vy,vm] of VOLK) if (vy===y && vm===m) volkskammer();
}

// ── 정치판의 한 해 ───────────────────────────────
function worldYear(){ realNews(); }

// ── 내 한 해 ─────────────────────────────────────
function lifeYear(){
  const a = P.age, e = era(P.year, P.month);
  if (a>45) P.hp = clamp(P.hp - (a>70?2:a>60?1:.5) + normal(0,1), 0, 100);
  if (P.prison){ P.prison--; P.hp = clamp(P.hp-3,0,100); say(P.prison ? '갇힌 채로 한 해를 보냈다.' : '풀려났다.', P.prison ? {hp:-2} : null); }
  const inc = income();
  // 벌이가 없으면 배우자나 식구에게 기대 산다. 씀씀이는 벌이를 크게 넘지 못한다
  if (a>=16 && !P.prison && !P.camp) P.money += inc - Math.min(900 + P.wealth*300, inc*.9 + (P.married ? 800 : 200));
  if (a>14){
    P.fame = clamp(P.fame + (fameTarget(P)-P.fame)*.25, 0, 100);
    P.org = clamp(P.org + (orgTarget(P)-P.org)*.15, 0, 100);
  }
  if (a<=14) childhood(a);
  else if (a===15 && !P.job) youth();
  if (a===20 && P.male && e==='empire' && !P.flags.served && P.hp>45){ P.flags.served = true; say('징집돼 2년 동안 군 복무를 했다.', {hp:2, org:2}); }
  if (P.flags.uni && a===P.flags.uni && !P.job) graduate();
  if (P.job && JOBS[P.job] && JOBS[P.job].d && !P.office && a<65) grow(JOBS[P.job].d, .3);
  if (P.year>=1914 && P.year<=1918) warYear();
  if (!P.alive) return;
  applyPolicy(a);
  milYear(a); if (!P.alive) return;
  bizYear(a);
  bizEntry(a);
  if (e==='empire') empireYear(a);
  if (e==='weimar') weimarYear(a);
  if (e==='nazi') naziYear(a);
  if (e==='west' || e==='east' || e==='occ') postwarYear(a);
  if (!P.alive) return;
  family(a);
  if (a>=68 && P.party!=null && !P.retired && !P.office && a%3===0 && (e==='west'||e==='weimar')) retireAsk();
  death(a);
}
function income(){
  if (P.prison || P.camp) return 0;
  let inc = P.office ? OFF[P.office].sal : 0;
  if (P.landmin) inc = Math.max(inc, OFF.landmin.sal);
  if (P.party===NS && P.nsRank!=null) inc = Math.max(inc, NS_SAL[P.nsRank]);
  if (P.job && P.age<65 && JOBS[P.job]) inc = Math.max(inc, JOBS[P.job].inc);
  if (P.mil && P.mil.active && !P.mil.pow) inc = Math.max(inc, MILPAY[P.mil.r]);
  if (P.age>=65) inc = Math.max(inc, 600);
  if (P.year>=1948 && P.zone==='west') inc *= 3;
  return inc;
}
function grow(d, s){ for (const k in d) P[k] = clamp(P[k] + d[k]*s + normal(0,.5), 0, 100); }

function childhood(a){
  if (a===6) say('국민학교(폴크스슐레)에 들어갔다.');
  P.smart = clamp(P.smart + normal(.3,1.5), 0, 100);
  P.talk = clamp(P.talk + normal(.2,1.2), 0, 100);
  if (a>=10 && a<=14 && rand()<.08) say(rnd(['동네 아이들 사이에서 대장 노릇을 했다.','교회 합창단에서 노래했다.','학교 황제 생일 행사에서 시를 읊었다.']), {charm:1, talk:1});
  if (a===10 && P.wealth + P.smart/25 >= 4.5 && rand()<.7){ P.edu = '김나지움'; say('김나지움에 들어갔다. 또래 스무 명 중 한 명꼴이다.', {smart:3, org:2}); }
}
// 열네 살: 학교를 마치고 일을 배우거나, 김나지움을 마치고 대학에 간다
function youth(){
  if (P.edu==='김나지움'){
    if (P.smart>=50 && (P.male || P.by>=1890)){
      const majors = P.male ? [['법학','변호사나 관료가 된다'],['의학','의사가 된다'],['신학','목사가 된다'],['철학','교사나 기자가 된다'],['공학','기술자가 된다'],['사관학교','장교가 된다']]
        : [['의학','여의사는 아직 드물다'],['철학','교사가 된다']];
      ask({title:'대학', desc:'김나지움을 마쳤다. 무엇을 공부할까?', options: majors.map(([m,sub]) => ({label:m, sub, go:()=>{
        P.major = m; P.flags.uni = m==='사관학교' ? 20 : 24; P.edu = m==='사관학교' ? '사관학교' : '대학';
        say(m==='사관학교' ? '사관학교에 들어갔다.' : `대학에서 ${m}을 공부했다.`, {smart:3, org:2}); }}))});
      return;
    }
    P.edu = '김나지움 중퇴';
  } else P.edu = '국민학교';
  const fa = P.fa && !['의사','변호사','장교','관료','교사','목사','공장주','대지주'].includes(P.fa.v) ? P.fa.v : '농장 일꾼';
  const opts = P.male ? [
    {label:'가업을 잇는다', sub:`${fa} 일을 배운다`, go:()=>setJob(fa, '집안일을 이어받아 일을 시작했다.')},
    {label:'수공업 견습', sub:'목수·재단사·인쇄공이 된다', go:()=>setJob('수공업 장인', '견습공으로 들어가 몇 년 뒤 장인이 됐다.')},
    {label:'공장', sub:'노동운동과 가깝다', go:()=>setJob(REGION[P.region].ind>.7 && rand()<.4 ? '광부' : '공장 노동자', '공장에 들어갔다.')},
    {label:'철도·사무', sub:'안정적인 월급', go:()=>setJob(rand()<.5 ? '철도원' : '사무원', '철도와 사무 일을 시작했다.')},
    {label:'직업군인', sub:'지원 입대. 사병에서 시작한다', go:()=>startMil(false)}
  ] : [
    {label:'집안일을 돕는다', sub:'결혼을 기다린다', go:()=>setJob('가정주부', '집에서 살림을 배웠다.')},
    {label:'하녀', sub:'도시의 부잣집으로', go:()=>setJob('하인', '도시의 부잣집 하녀로 들어갔다.')},
    {label:'공장', sub:'방직공장, 담배공장', go:()=>setJob('공장 노동자', '공장 여공이 됐다.')},
    {label:'점원·타자수', sub:'백화점과 사무실', go:()=>setJob(P.by>=1890 ? '타자수' : '점원', '점원으로 일을 시작했다.')}
  ];
  ask({title:'열네 살', desc:'학교를 마쳤다. 무엇을 할까?', options:opts});
}
function setJob(j, line){ P.job = j; P.careers.push(j); say(line); }
function graduate(){
  const m = P.major;
  if (m==='사관학교') return startMil(true);
  const j = m==='법학' ? (rand()<.5 ? '변호사' : '관료') : m==='의학' ? '의사' : m==='신학' ? '목사' : m==='철학' ? (rand()<.6 ? '교사' : '기자') : m==='공학' ? '기술자' : '장교';
  setJob(j, `공부를 마치고 ${J(j,'이','가')} 됐다.`); P.fame += 3;
}

function empireYear(a){
  if (a>=18 && P.male && ['공장 노동자','광부','수공업 장인','철도원'].includes(P.job) && P.party==null && rand()<.05 && P.year>=1900){
    ask({title:'사민당', desc:'공장 동료가 사민당 집회에 같이 가자고 한다.', valid:()=>P.party==null, options:[
      {label:'따라간다', sub:'노동운동에 발을 들인다', go:()=>{ P.party = SPD; say('사민당에 입당했다.', {org:4}); }},
      {label:'관심 없다', sub:'', go:()=>{}}
    ]});
  }
}

// 제1차 세계대전
function warStart(){
  if (P.mil && P.mil.active){ P.mil.front = '서부전선'; say('전쟁이 터졌다. 부대가 전선으로 떠났다.', null, 'big'); return; }
  if (!P.male && P.age>=18 && P.age<=40) ask({title:'1914년 8월', desc:'적십자가 간호사를 모집한다.', options:[
    {label:'간호사로 자원한다', sub:'야전병원으로 간다', go:()=>{ P.flags.nurse = true; setJob('간호사(적십자)', '적십자 간호사가 돼 야전병원으로 갔다.'); }},
    {label:'집을 지킨다', sub:'', go:()=>say('남편과 형제들이 전쟁터로 떠났다.')}
  ]});
  if (!P.male || P.age<17 || P.age>45) return;
  if (P.age<=24 && P.hp>45){
    ask({title:'1914년 8월', desc:'온 나라가 들떴다. 크리스마스 전에 끝난다고들 한다.', options:[
      {label:'자원입대', sub:'전선 세대가 된다', go:()=>{ P.flags.front = 'vol'; say('자원해서 입대했다.', {fame:2}); }},
      {label:'징집을 기다린다', sub:'', go:()=>{ P.flags.front = 'draft'; }}
    ]});
  } else P.flags.front = P.hp>40 && rand()<.8 ? 'draft' : null;
}
function warYear(){
  if (P.flags.nurse && P.year<=1918){ say(rnd(['야전병원에서 밤을 새웠다.','부상병의 마지막 편지를 대신 써 줬다.','티푸스가 병동을 덮쳤다.']), {hp:-3, rep:2}); if (rand()<.01) die('티푸스'); return; }
  if (P.mil && P.mil.active) return;
  if (!P.flags.front || P.flags.home || P.year>1918 || (P.year===1918 && P.month>=10)) return;
  if (P.flags.front==='draft' && !P.flags.drafted){ P.flags.drafted = true; say('징집돼 전선으로 갔다.'); }
  const q = P.flags.front==='vol' ? .05 : .04, r = rand();
  if (r < q){ die('전사'); return; }
  if (r < q+.09){ say(rnd(['솜 전투에서 다쳤다.','베르됭에서 파편을 맞았다.','동부전선에서 다쳤다.']), {hp:-15}); if (rand()<.3){ P.flags.home = true; say('부상으로 전역했다.'); } return; }
  say(rnd(['참호에서 한 해를 버텼다.','동부전선에서 싸웠다.','서부전선 참호에서 겨울을 났다.','전우를 여럿 잃었다.']), {hp:-3, org:1});
  if (!P.flags.cross && rand() < P.nerve/350){ P.flags.cross = true; say('철십자 훈장을 받았다.', {fame:3, rep:2}); }
}

// ── 바이마르 ─────────────────────────────────────
function partyOffer(again){
  const sh = localShare(reichShare(REICH[0]), prof(P.region, P.place));
  const top = Object.entries(sh).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([p,v])=>`${pname(+p)} ${Math.round(v*100)}%`).join(', ');
  const parties = [SPD, KPD, Z, DDP, DVP, DNVP].concat(P.year>=1920 ? [NS] : []);
  ask({title: again ? '입당 권유' : '공화국', desc:`${again ? '정당에서 사람이 찾아왔다.' : '황제가 물러났다. 여자도 투표한다.'} ${at(P.region, P.place)}에서 강한 당은 ${top}.`,
    valid:()=>P.party==null && P.year<1933,
    options:[
      ...parties.map(p => ({label:pname(p), sub:PARTY[p].f + (p===NS ? ' · 1920년 창당' : ''), off:(P.jew && (p===NS || p===DNVP)), go:()=>joinParty(p)})),
      {label:'정치는 관심 없다', sub:'평범하게 산다', go:()=>{ P.flags.noPol = (P.flags.noPol||0)+1; say('정치와는 거리를 두기로 했다.'); }}
    ]});
}
function joinParty(p){
  P.party = p; if (!P.track) P.track = 'pol';
  if (p===NS){ P.nsRank = 0; P.flags.nsFrom = P.year; deed(`${P.year}년 나치당 입당`, P.year<1933 ? 1.5 : 1); }
  say(`${pname(p)}에 입당했다. 활동 지역은 ${at(P.region, P.place)}.`, {org:3, fame:2});
}
function weimarYear(a){
  if (P.party==null && a>=20 && (P.flags.noPol||0)<3 && rand()<.1){ partyOffer(true); return; }
  if (P.party==null || P.retired) return;
  if (P.office || P.landmin) say(`${title(P)}로 일했다.`);
  const ev = [];
  if (P.party===SPD) ev.push(['노동조합 집회에서 연설했다.', {talk:1, org:3}], ['국기단과 함께 공화국을 지키는 행진을 했다.', {org:3}]);
  if (P.party===KPD) ev.push(['적색전선투사동맹과 거리에서 나치 돌격대와 부딪쳤다.', {hp:P.nerve>60 ? -2 : -5, org:3}], ['모스크바의 노선을 두고 당내 다툼이 벌어졌다.', {org:-2}]);
  if (P.party===Z) ev.push(['가톨릭 노동자 협회를 이끌었다.', {org:4}], ['주교와 저녁을 먹었다.', {org:2, fame:1}]);
  if (P.party===DDP || P.party===DVP) ev.push(['신문에 공화국을 지키자는 글을 썼다.', {fame:3}], ['당원이 줄고 있다는 보고를 받았다.', {org:-2}]);
  if (P.party===DNVP) ev.push(['철모단 행사에서 베르사유 조약을 성토했다.', {org:3, fame:2}], ['대지주들의 후원을 받았다.', {money:500}]);
  if (P.party===NS) ev.push(['돌격대(SA)와 거리 행진을 했다.', {org:3}], ['맥줏집 집회에서 연설했다.', {talk:2, fame:2}], ['공산당원과 패싸움을 벌였다.', {hp:P.nerve>60 ? -2 : -6, org:2}]);
  ev.push(['집회 연설이 신문에 실렸다.', {fame:3}], ['동네 사람들 민원을 들어줬다.', {org:3}], ['당 지도부와 부딪혔다.', {org:-2, fame:2}]);
  const e = rnd(ev), eff = {...e[1]}; if (eff.fame) eff.fame = Math.round(eff.fame*.5);
  say(e[0], eff);
  if (P.party===NS && P.year>=1925 && P.nsRank<2 && rand()<.25){ P.nsRank++; const t = nsr(P, P.nsRank); say(`나치당 ${J(t,'이','가')} 됐다.`, {org:2}); deed(`${P.year}년 나치당 ${t}`, .5); }
  if (P.year>=1930 && [DNVP,DVP,ETC].includes(P.party) && !P.jew && !P.flags.switch){ P.flags.switch = true;
    ask({title:'당을 옮길까', desc:'나치당이 무섭게 크고 있다. 동료 여럿이 이미 갈아탔다.', valid:()=>P.party!==NS && P.year<1933, options:[
      {label:'나치당으로', sub:'뜨는 당', go:()=>{ say(`${pname(P.party)}을 떠났다.`); if (P.office){ P.ex = exTitle(P); P.office = null; } joinParty(NS); }},
      {label:'남는다', sub:'', go:()=>say('당에 남았다.', {rep:2})}
    ]});
  }
  if (P.office==='land' && !P.landmin && [SPD,Z,DDP,DVP].includes(P.party) && P.fame>=30 && rand()<.08){
    ask({title:'주 장관 제의', desc:`${P.region} 연립정부에서 장관 자리를 제안했다.`, valid:()=>P.office==='land' && P.year<1933, options:[
      {label:'수락', sub:'', go:()=>{ P.landmin = true; say(`${P.region} 주 장관이 됐다.`, {fame:6}, 'big'); P.titles.push(`${P.year} ${P.region} 주 장관`); news(`${P.name}, ${P.region} 주 장관 취임`); }},
      {label:'고사', sub:'', go:()=>{}}
    ]});
  }
}
function depression(){
  if (['공장 노동자','광부','사무원','점원','수공업 장인','타자수','기술자'].includes(P.job) && rand()<.35 && P.age<60){ say('대공황으로 일자리를 잃었다.', {hp:-4, money:-500}); P.job = null; P.flags.jobless = P.careers.at(-1); }
  else say('대공황이 덮쳤다. 동네에 실업자가 넘쳤다.');
}

// ── 선거: 비례대표 명부 ──────────────────────────
// 당이 이 지역에서 얻은 표만큼 명부 위에서부터 당선된다. 내가 명부 몇 번을 받느냐가 관건이다
const LEVEL = {
  city:{n:'시의회', mu:22, seats: place => isVillage(place) ? 18 : 60},
  land:{n:'주의회', mu:35, seats: (_, r) => Math.max(40, Math.round(REGION[r].w/7))},
  mdr:{n:'제국의회', mu:45},
  wcity:{n:'시의회', mu:22, seats: place => isVillage(place) ? 18 : 60},
  bdr:{n:'연방의회', mu:45}
};
function myStrength(k){
  return P.fame*.45 + P.org*.35 + P.talk*.2 + (P.wit-50)*.12 + (P.policy==='inner' ? 6 : 0) + (P.donated===P.party ? 4 : 0) + (P.office===k ? 10 : 0) + (P.flags.front && [DNVP,NS].includes(P.party) ? 4 : 0) - (P.male ? 0 : 6) - (P.rep<30 ? 8 : 0);
}
// 한 판: 지역 득표 → 당 의석 → 내 명부 순번
function race(k, sh, total){
  const loc = localShare(sh, prof(P.region, P.place));
  const noisy = {}; let t = 0;
  for (const p in loc){ noisy[p] = Math.max(.001, loc[p]*(1+normal(0,.08))); t += noisy[p]; }
  for (const p in noisy) noisy[p] /= t;
  const L = LEVEL[k];
  const seats = k==='mdr' || k==='bdr' ? Math.max(8, Math.round(total * REGION[P.region].w/POP_W)) : L.seats(P.place, P.region);
  const mine = Math.round(seats * (noisy[P.party]||0));
  const me = myStrength(k) + normal(0,8);
  const pool = Math.max(4, mine*2 + 3);
  let rank = 1;
  for (let i=0;i<pool;i++) if (normal(L.mu - i*.6, 12) > me) rank++;
  return {share:noisy, seats, mine, rank, won: rank <= mine};
}
function chance(k, sh, total){ let w = 0; for (let i=0;i<150;i++) if (race(k, sh, total).won) w++; return w/150; }

function canRun(){ return P.party!=null && P.party!==ETC && P.party!==SED && !P.retired && !P.prison && !P.camp && !P.exile && P.alive && P.age>=25; }
function offerRun(k, sh, total, label){
  const where = k==='city'||k==='wcity' ? `${P.place} 시의회` : k==='land' ? `${P.region} 주의회` : `${LEVEL[k].n} (${P.region} 선거구)`;
  const keep = P.office===k;
  const ch = chance(k, sh, total);
  ask({title:label, desc:`${keep ? `지금 ${title(P)}. ` : ''}${pname(P.party)} ${where} 명부에 이름을 올릴까?`, valid:()=>canRun(), options:[
    {label: keep ? '재선 도전' : '출마', sub:`당선 가능성 약 ${Math.round(ch*100)}%`, go:()=>runFor(k, sh, total, where)},
    {label: keep ? '물러난다' : '나가지 않는다', sub: keep ? '임기를 마친다' : '다음을 기약한다', go:()=>{ if (keep){ P.ex = exTitle(P); P.office = null; say(`${OFF[k].n} 임기를 마쳤다.`); } }}
  ]});
}
function runFor(k, sh, total, where){
  const r = race(k, sh, total);
  const bars = Object.entries(r.share).map(([p,v]) => ({name:pname(+p), party:+p, share:v, me:+p===P.party})).sort((a,b)=>b.share-a.share).filter(x=>x.share>.004);
  const names = listNames(k, r.rank, Math.min(Math.max(r.mine, r.rank), 8));
  const roll = names.map((n,i) => `${i+1}번 ${n}`).join(' · ') + (r.rank>8 ? ` … ${r.rank}번 ${P.name}(나)` : '');
  show({kind:'list', title:`${P.year} ${where} 개표`, bars, line:`${pname(P.party)} ${r.mine}석 — 명부 ${roll}`, won:r.won, outcome: r.won ? '당선' : '낙선'});
  if (r.won){
    const again = P.office===k;
    P.office = k; P.wins++; setBest(P, k); P.ex = null; P.titles.push(`${P.year} ${title(P)}`);
    say(`${where} 선거에서 명부 ${r.rank}번으로 당선됐다.${again ? ' 재선이다.' : ''}`, {fame: Math.round(2 + OFF[k].pw/40), org:2}, 'big');
    news(`${P.name}, ${where} 당선`);
  } else {
    P.losses++;
    if (P.office===k){ P.office = null; P.ex = exTitle(P); }
    say(`${where} 선거에서 떨어졌다. ${pname(P.party)}은 ${r.mine}석, 나는 명부 ${r.rank}번이었다.`, {fame:1}, 'big');
  }
}
function electReich(e){
  W.house = {name: e[0]===1919 ? '국민의회' : '제국의회', total:e[2], seats:Object.fromEntries(e[4].map((v,i)=>[i,v]).filter(([,v])=>v>0))};
  const sh = reichShare(e);
  const top = Object.entries(sh).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([p,v])=>`${pname(+p)} ${(v*100).toFixed(1)}%`).join(', ');
  news(`${e[0]}년 ${e[0]===1919 ? '국민의회' : '제국의회'} 선거 — ${top}`, true);
  if (e[0]===1933) return;   // 3월 선거는 이미 나치의 손아귀에서 치러졌다
  if (P.office==='mdr' && !canRun()){ P.office = null; P.ex = exTitle(P); }
  if (canRun() && (P.fame>=20 || P.office==='land' || P.office==='mdr')) offerRun('mdr', sh, e[2], `${e[0]}년 ${e[0]===1919 ? '국민의회' : '제국의회'} 선거`);
}
function electLow(k){
  const s = k==='wcity' ? bundShare(nearestBund(P.year)) : reichShare(nearestReich(P.year, P.month));
  if (P.office===k && !canRun()){ P.office = null; P.ex = exTitle(P); }
  if (!canRun() || (k==='wcity' && P.zone!=='west') || !s[P.party]) return;
  if (k==='land' && !(P.fame>=12 || P.office==='city' || P.office==='land')) return;
  offerRun(k, s, 0, `${P.year}년 ${k==='land' ? `${P.region} 주의회` : `${P.place} 시의회`} 선거`);
}
// ── 나치 독일 ────────────────────────────────────
function seizure(){
  // 나에게 오는 1933년
  if (P.party===NS || P.jew || P.party==null) return;
  if (P.party===KPD){
    if (rand()<risk(.5)){ P.camp = ri(1,2); say('의사당 화재 뒤 공산당원 일제 검거에 걸려 수용소로 끌려갔다.', {hp:-15}, 'big'); P.flags.victim = true; }
    exileAsk('공산당원 사냥이 시작됐다.');
  } else if (P.party===SPD){
    if ((P.office || P.landmin) && rand()<.3){ P.camp = 1; say('사민당 의원이라는 이유로 체포돼 수용소에 끌려갔다.', {hp:-10}, 'big'); P.flags.victim = true; }
    exileAsk('사민당 간부들이 잡혀가고 있다.');
  } else if (P.party===DDP && (P.office || P.landmin)) exileAsk('공화국을 지키던 사람들이 하나둘 떠나고 있다.');
}
function exileAsk(why){
  ask({title:'망명', desc:`${why} 떠날까?`, valid:()=>!P.exile && P.alive && !P.camp, options:[
    {label:'망명한다', sub:'프라하·파리·런던으로', go:()=>{ P.exile = true; P.office = null; P.landmin = false; say('국경을 넘어 망명했다.', {money:-P.money*.7, org:-10}, 'big'); }},
    {label:'남는다', sub:'숨죽이고 산다', go:()=>say('남기로 했다.')},
    {label:'남아서 싸운다', sub:'지하 저항. 위험하다', go:()=>{ P.policy = 'under'; P.flags.resist = true; say('지하 조직에 들어갔다.', {rep:5}); }}
  ]});
}
function ban(){
  if (P.party!=null && P.party!==NS){ say(`${pname(P.party)}이 해산됐다.`, null, 'big'); P.prevParty = P.party; P.party = null; P.ex = P.ex || exTitle(P); }
  P.office = null; P.landmin = false;
  W.house = {name:'제국의회', total:661, seats:{[NS]:661}};
  // 1933년 봄에 몰려든 '3월의 전사자들'
  if (P.party==null && !P.jew && !P.exile && !P.camp && !P.flags.resist && P.prevParty!==KPD && P.age>=25){
    ask({title:'입당 행렬', desc:'나치당 입당 신청이 쏟아지고 있다. 공무원도, 교사도, 이웃도 줄을 선다.', valid:()=>P.party==null && P.alive, options:[
      {label:'입당한다', sub:'직장과 출세에 유리하다', go:()=>joinParty(NS)},
      {label:'하지 않는다', sub:'눈 밖에 날 수 있다', go:()=>say('입당하지 않았다.', {rep:2})}
    ]});
  }
}
function nsElection(){
  const tot = {1933:661, 1936:741, 1938:813}[P.year];
  W.house = {name:'제국의회', total:tot, seats:{[NS]:tot}};
  news(`${P.year}년 제국의회 '선거' — 나치당 단일 명부 ${P.year===1933 ? '92' : '99'}% 찬성`, true);
  if (P.party===NS && P.nsRank>=3 && P.male && !P.nsMdr && rand()<.4){ P.nsMdr = true; say('나치 제국의회 의원 명단에 들었다.', {fame:5}, 'big'); deed('나치 제국의회 의원', 3); P.titles.push(`${P.year} 제국의회 의원(나치)`); }
}
function naziYear(a){
  const y = P.year;
  if (P.camp){ P.camp--; if (rand()<frail(.06)){ die('수용소에서의 학대'); return; } say(P.camp ? '수용소에서 한 해를 보냈다.' : '수용소에서 풀려났다. 감시가 따라붙었다.', {hp:-6}); return; }
  if (P.exile){ say(rnd(['망명지에서 독일의 실상을 알리는 글을 썼다.','망명지에서 일자리를 구하느라 애썼다.','망명객 모임에 나갔다.']), {hp:-1}); return; }
  if (P.jew) return jewYear();
  if (P.flags.resist){
    say(rnd(['밤에 전단을 돌렸다.','쫓기는 동지를 숨겨 줬다.','망명지와 몰래 연락했다.']), {rep:2});
    if (rand()<risk(.18)){ caught(); return; }
  }
  if (P.party===NS){
    P.guilt += NS_GUILT[P.nsRank];
    if (P.nsRank<5 && rand() < sig((P.fame+P.org-80)/15 + (P.wit-50)/20 + (P.policy==='zeal' ? 1 : 0))*.3){
      P.nsRank++; const t = nsr(P, P.nsRank);
      say(`나치당 ${t}로 올라갔다.`, {fame:3, org:3}, 'big'); deed(`${y}년 나치당 ${t}`, P.nsRank); P.titles.push(`${y} 나치당 ${t}`);
    } else say(`나치당 ${nsr(P, P.nsRank)}로 일했다.`);
  }
  // 그 시대가 묻는 것들
  if (y===1935 && P.party===NS && P.nsRank>=1) ask({title:'밀고', desc:'옆집 사람이 체제를 비웃는 말을 했다. 위에서 보고하라고 한다.', options:[
    {label:'보고한다', sub:'충성을 보인다', go:()=>{ deed('이웃을 게슈타포에 밀고', 2); say('보고서를 올렸다. 그 이웃은 끌려갔다.', {org:2}); }},
    {label:'못 들은 걸로 한다', sub:'', go:()=>say('모른 척했다.')}
  ]});
  if (y===1937 && P.party==null && ['관료','교사'].includes(P.job)) ask({title:'입당 압박', desc:'공무원은 당원이 되라는 압박이 거세다. 승진 명단에서 빠질 수 있다.', valid:()=>P.party==null, options:[
    {label:'입당한다', sub:'', go:()=>joinParty(NS)}, {label:'버틴다', sub:'승진은 포기한다', go:()=>say('끝까지 입당하지 않았다.', {rep:3})}
  ]});
  if (y===1938){
    if (P.party===NS) ask({title:'1938년 11월 9일 밤', desc:'유대인 회당과 상점을 부수라는 지시가 내려왔다.', options:[
      {label:'앞장선다', sub:'', go:()=>{ deed('11월 포그롬 가담', 4); say('그날 밤 거리로 나섰다.', {org:2, rep:-5}); }},
      {label:'빠진다', sub:'의심받을 수 있다', go:()=>say('집에 있었다.', {org:-2})}
    ]});
    else ask({title:'1938년 11월 9일 밤', desc:'유대인 이웃의 상점 유리창이 깨지고 있다.', options:[
      {label:'커튼을 친다', sub:'', go:()=>say('창밖을 보지 않았다.')},
      {label:'이웃을 들여 숨겨 준다', sub:'위험하다', go:()=>{ P.flags.helper = (P.flags.helper||0)+1; say('이웃 가족을 하룻밤 숨겨 줬다.', {rep:6}); if (rand()<risk(.1)) caught(); }}
    ]});
  }
  if (y>=1938 && y<=1940 && !P.flags.aryan && (P.money>2000 || P.biz || ['상인','공장주','대지주'].includes(P.job) || (P.party===NS && P.nsRank>=2)) && rand()<.4){ P.flags.aryan = true;
    ask({title:'헐값', desc:'쫓겨나는 유대인 가족의 가게와 집을 헐값에 넘겨받을 수 있다.', options:[
      {label:'넘겨받는다', sub:'재산이 크게 는다', go:()=>{ deed('유대인 재산 헐값 인수(아리아화)', 3); P.flags.took = true; if (P.biz) P.biz.size *= 1.3; say(P.biz ? '경쟁 회사를 헐값에 넘겨받았다.' : '가게와 집을 넘겨받았다.', {money:8000}); }},
      {label:'거절한다', sub:'', go:()=>say('손대지 않았다.', {rep:3})}
    ]});
  }
  if (y>=1940 && P.party===NS && P.nsRank>=3 && !P.flags.east && rand()<.4){ P.flags.east = true;
    ask({title:'점령지 근무', desc:'동부 점령지 민정 기구에서 일할 사람을 찾는다. 출세가 보장된다.', options:[
      {label:'간다', sub:'', go:()=>{ deed('동부 점령지 민정 근무', 8); say('동부 점령지로 부임했다. 그곳에서 벌어지는 일을 보았고, 거기에 서명했다.', {money:6000, fame:4}, 'big'); }},
      {label:'핑계를 대고 빠진다', sub:'', go:()=>say('가지 않았다.', {org:-3})}
    ]});
  }
  if (y>=1941 && y<=1944 && (['농부','공장주','대지주'].includes(P.job) || (P.biz && P.biz.size>=20)) && !P.flags.forced){ P.flags.forced = true;
    ask({title:'강제노동자', desc:'폴란드와 소련에서 끌려온 사람들이 일손으로 배정됐다.', options:[
      {label:'규정대로 부린다', sub:'', go:()=>{ deed('강제노동자 혹사', 2); say('그들을 부렸다.', {money:1500}); }},
      {label:'몰래 먹을 것을 더 준다', sub:'걸리면 처벌받는다', go:()=>{ say('몰래 빵을 더 줬다.', {rep:4}); if (rand()<risk(.08)) caught(); }}
    ]});
  }
  if (y>=1942 && y<=1944 && P.party!==NS && !P.flags.hide && rand()<.12){ P.flags.hide = true;
    ask({title:'숨을 곳', desc:'이송 명단에 오른 유대인 지인이 숨겨 달라고 찾아왔다.', options:[
      {label:'숨겨 준다', sub:'걸리면 수용소다', go:()=>{ P.flags.helper = (P.flags.helper||0)+2; say('다락방에 숨겨 줬다.', {rep:10}, 'big'); if (rand()<risk(.2)) caught(); }},
      {label:'돌려보낸다', sub:'', go:()=>say('문을 닫았다. 그 뒤로 소식을 듣지 못했다.')}
    ]});
  }
  if (y===1943 && P.male && ((P.mil && P.mil.active && P.mil.r>=8) || [DNVP,Z,DVP].includes(P.prevParty)) && P.fame>=20 && !P.flags.july && P.party!==NS){ P.flags.july = true;
    ask({title:'모의', desc:'옛 동료가 조심스럽게 묻는다. 그가 없어진 뒤에 나라를 맡을 사람이 필요하다고.', options:[
      {label:'함께한다', sub:'', go:()=>{ P.flags.plot = true; say('모의에 이름을 올렸다.', {rep:8}); }},
      {label:'못 들은 걸로 한다', sub:'', go:()=>{}}
    ]});
  }
  if (y===1944 && P.flags.plot && rand()<.6){ say('7월 20일 거사가 실패했다. 이름이 적힌 명단이 나왔다.', null, 'big'); if (rand()<frail(.8)){ die('인민재판소의 사형 판결'); return; } P.prison = 2; }
  if (y>=1940) war2(a);
}
// 처세가 좋으면 덜 걸리고, 담력이 크면 심문과 수용소를 더 버틴다
const risk = p => p*(1.3 - P.wit*.006)*(P.policy==='safe' ? .6 : P.policy==='under' ? 1.4 : 1);
const frail = p => p*(1.5 - P.nerve*.01);
function caught(){
  say('게슈타포에 잡혔다.', {hp:-10}, 'big');
  if (rand()<frail(.25)){ die('게슈타포의 고문과 처형'); return; }
  P.camp = ri(1,3); P.flags.victim = true; P.flags.resist = false;
}
function war2(a){
  const city = !isVillage(P.place);
  if (P.male && a<=45 && P.hp>45 && !P.flags.ww2 && P.party!==NS && !P.mil){ P.flags.ww2 = true; say('다시 군복을 입었다. 후방 경비 부대로 갔다.'); }
  if (P.year>=1942 && city && rand()<.1){ if (rand()<.12){ die('공습'); return; } say('공습으로 집이 불탔다.', {hp:-5, money:-P.money*.5}); }
  if (P.year===1944 && P.male && a<=60 && rand()<.5) say('국민돌격대에 끌려갔다.', {hp:-4});
  if (P.year===1945 && P.male && a<=60 && rand()<.05){ die('국민돌격대로 싸우다 전사'); return; }
  if (P.year>=1943) say(rnd(['배급이 줄었다.','이웃집 아들의 전사 통지서가 왔다.','방공호에서 밤을 지새웠다.']), {hp:-2});
}
// 유대계 독일인의 1933년 이후. 게임 장치가 아니라 기록으로 남긴다
function jewYear(){
  const y = P.year;
  if (!P.flags.j33){ P.flags.j33 = true; say('가게 앞에 "유대인에게서 사지 말라"는 팻말이 붙었다.', null, 'big'); if (['관료','교사','변호사'].includes(P.job)){ say('직업공무원법으로 일자리에서 쫓겨났다.', {money:-1000}); P.job = null; } }
  if (P.party!=null){ P.prevParty = P.party; P.party = null; P.office = null; P.landmin = false; }
  if (y===1935 && !P.flags.j35){ P.flags.j35 = true; say('뉘른베르크법으로 시민권을 잃었다.', null, 'big'); }
  if (P.biz && y>=1935){ say(`${P.biz.name}을 헐값에 넘기라는 압박에 회사를 빼앗겼다.`, {money:-P.money*.5}, 'big'); P.biz = null; P.track = null; }
  if (y===1938 && !P.flags.j38){ P.flags.j38 = true; say('회당이 불탔다. 집안 남자들이 수용소로 끌려갔다.', {hp:-8}, 'big'); }
  if (y<=1939){
    const left = y<=1935 ? '아직 길이 있다' : y<=1938 ? '받아 주는 나라가 줄고 있다' : '거의 마지막 기회다';
    ask({title:'떠날까', desc:`${left}. 재산 대부분을 '출국세'로 내놓아야 한다.`, valid:()=>!P.exile && P.alive, options:[
      {label:'떠난다', sub:'팔레스타인·미국·영국으로', go:()=>{ if (rand() < (y<=1935 ? .9 : y<=1938 ? .7 : .45) + (P.wit-50)/250){ P.exile = true; P.flags.emigrated = true; say('독일을 떠났다.', {money:-P.money*.85}, 'big'); } else say('비자를 받지 못했다.', null, 'big'); }},
      {label:'아직은 남는다', sub:'곧 지나가리라 믿는다', go:()=>say('남았다.')}
    ]});
    return;
  }
  if (y===1941 && !P.flags.j41){ P.flags.j41 = true; say('노란 별을 달아야 했다.', null, 'big'); }
  if (y>=1941 && y<=1943 && rand()<.6){
    say('이송 명단에 이름이 올랐다. "동쪽으로" 간다고 했다.', null, 'big');
    if (rand()<.92){ die('홀로코스트'); return; }
    say('살아남았다. 수용소에서 해방됐다.', {hp:-40}, 'big'); P.flags.survivor = true; P.exile = false; P.flags.j43 = true;
  }
}

function surrender(){
  const R = REGION[P.region];
  P.zone = R.after==='west' ? 'west' : R.after==='berlin' ? (P.place==='판코' ? 'east' : 'west') : R.after==='east' ? 'east' : null;
  if (P.party===NS){ say('나치당이 사라졌다. 당원 명부는 연합군 손에 넘어갔다.', null, 'big'); P.wasNS = P.nsRank; P.prevParty = NS; P.party = null; }
  P.nsMdr = false;
  if (R.after==='lost' && !P.exile){
    say(`${P.region}에서 쫓겨나 서쪽으로 피난길에 올랐다.`, {hp:-10, money:-P.money*.9}, 'big');
    if (rand()<.08){ die('피난길'); return; }
    P.region = rand()<.75 ? rnd(['바이에른','하노버','슐레스비히홀슈타인','헤센','뷔르템베르크']) : rnd(['작센','메클렌부르크','브란덴부르크']);
    P.place = pickPlace(P.region);
    P.zone = REGION[P.region].after==='west' ? 'west' : 'east';
    say(`${at(P.region, P.place)}에 새로 자리를 잡았다.`);
  }
  W.house = null;
  if (P.exile) ask({title:'귀국', desc:'전쟁이 끝났다. 돌아갈까?', valid:()=>P.exile && P.alive, options:[
    {label:'돌아간다', sub:'폐허가 된 고향으로', go:()=>{ P.exile = false; P.zone = P.zone || 'west'; say('독일로 돌아왔다.', {fame:4}, 'big'); }},
    {label:'망명지에 남는다', sub:'', go:()=>say('망명지에 남았다.')}
  ]});
}

// 전범재판·탈나치화 심판
function trial(){
  if (!P.alive || P.jew) return;
  const member = P.wasNS!=null;
  if (!member && P.guilt<2) return;
  // 처세가 좋으면 '세탁 증명서'(페르질샤인)를 써 줄 사람을 더 많이 구한다
  const g = P.guilt - (P.wit-50)/25, rk = member ? P.wasNS : -1, east = P.zone==='east';
  let court, verdict, years = 0, dead = false;
  const general = P.mil && P.mil.r>=10, magnate = P.biz && P.biz.size>=1000;
  if (general && g>=5){ court = '최고사령부 재판(장군 재판)'; const n = g>=15 ? ri(10,20) : ri(3,10); verdict = g>=25 ? '사형' : `징역 ${n}년`; if (verdict==='사형') dead = true; else years = Math.ceil(n/2); }
  else if (magnate && g>=5){ court = '뉘른베르크 기업인 재판'; const n = g>=12 ? ri(6,12) : ri(2,6); verdict = `징역 ${n}년, 회사 재산 몰수`; years = Math.ceil(n/2); P.biz.size *= .5; }
  else if (rk>=5 || g>=25){ court = '연합국 전범재판'; verdict = wpick([['사형',40],['무기징역',30],['징역 20년',30]]).v; if (verdict==='사형') dead = true; else years = verdict==='무기징역' ? 10 : 8; }
  else if (east && rk>=2){ court = '소련 군사재판'; verdict = '특별수용소 수감'; years = ri(3,6); if (rand()<.3) dead = 'camp'; }
  else if (g>=12){ court = '연합국 재판'; const n = ri(5,15); verdict = `징역 ${n}년`; years = Math.ceil(n/2); }
  else if (g>=8){ court = '탈나치화 심판소'; verdict = '중범(II급) — 노동수용소'; years = ri(1,3); }
  else if (g>=6 && member){ court = '탈나치화 심판소'; verdict = '경범(III급) — 보호관찰과 벌금'; }
  else if (member){ court = '탈나치화 심판소'; verdict = '추종자(IV급) — 벌금'; }
  else { court = '배상 심리'; verdict = '빼앗은 재산 반환 명령'; }
  show({kind:'trial', title:court, lines: P.deeds.length ? P.deeds.slice(-8) : ['나치당 당적'], outcome:verdict, won:false});
  say(`${court}에 섰다. ${verdict}.`, {rep:-15, fame:-5}, 'big');
  P.flags.tried = verdict;
  if (P.flags.took) fx({money:-8000});
  if (dead===true){ die('전범재판 사형 집행'); return; }
  if (dead==='camp'){ die('소련 특별수용소'); return; }
  if (years) P.prison = years;
}

function twoStates(){
  if (!P.zone && !P.exile) P.zone = 'west';
  W.house = P.zone==='east' ? {name:'인민의회', total:400, seats:{[SED]:110, [ETC]:290}} : null;
  if (P.alive && !P.exile && !P.prison && P.age<80) postwarParty();
}
function postwarParty(){
  const east = P.zone==='east', prev = P.prevParty ?? P.party;
  const opts = east ? [{label:'사통당', sub:'사민당과 공산당이 합친 당', go:()=>{ P.party = SED; P.sedRank = 0; say('사통당에 들어갔다.', {org:3}); }}]
    : [SPD, CDU, FDP, KPD, ETC].map(p => ({label:pname(p), sub:PARTY[p].f, go:()=>{ P.party = p; say(`${pname(p)}에 들어갔다.`, {org:3}); }}));
  ask({title: east ? '동독' : '서독', desc:`${east ? '동쪽에 독일민주공화국이 섰다.' : '서쪽에 독일연방공화국이 섰다.'}${prev!=null ? ` 예전에는 ${pname(prev)}이었다.` : ''}${P.flags.tried ? ` 심판 결과는 ${P.flags.tried}.` : ''}`, valid:()=>P.alive, options:[
    ...opts, {label:'정치는 이제 그만', sub:'', go:()=>{ P.party = null; say('다시는 당에 들지 않기로 했다.'); }}
  ]});
}
function postwarYear(a){
  if (P.exile){ say(rnd(['망명지에서 늙어 갔다.','고향 소식을 신문으로 읽었다.'])); return; }
  if (P.year<1949){ say(rnd(['폐허에서 벽돌을 날랐다.','암시장에서 담배로 먹을 것을 샀다.','굶주린 겨울을 났다.']), {hp:-2}); return; }
  if (P.party==null || P.retired) return;
  if (P.party===SED){
    if (P.sedRank<5 && rand() < sig((P.fame+P.org-80)/15 + (P.wit-50)/20)*.3){ P.sedRank++; say(`${SEDR[P.sedRank]}가 됐다.`, {fame:3}, 'big'); P.titles.push(`${P.year} ${SEDR[P.sedRank]}`); }
    else say(rnd(['당 회의에서 노선을 따랐다.','슈타지가 동료를 조사한다는 소문을 들었다.','생산 목표를 채우라는 지시를 내려보냈다.']));
    return;
  }
  if (P.office) say(`${title(P)}로 일했다.`);
  const e = rnd([['지역 재건 사업을 챙겼다.', {org:3}], ['신문 인터뷰가 실렸다.', {fame:1}], ['당 행사에서 연설했다.', {talk:1, org:2}],
    P.wasNS!=null ? ['과거 나치 경력이 신문에 실렸다.', {rep:-6, fame:2}] : ['전쟁 피해자 단체를 도왔다.', {rep:3}]]);
  say(e[0], e[1]);
  if (P.party===KPD && P.year>=1956 && !P.flags.kpdBan){ P.flags.kpdBan = true; say('공산당이 금지됐다.', null, 'big'); P.party = null; P.office = null; }
}
function electBund(b){
  W.house = {name:'연방의회', total:b[2], seats:b[4]};
  const sh = bundShare(b);
  const top = Object.entries(sh).sort((a,c)=>c[1]-a[1]).slice(0,3).map(([p,v])=>`${pname(+p)} ${(v*100).toFixed(1)}%`).join(', ');
  news(`${b[0]}년 연방의회 선거 — ${top}`, true);
  if (P.office==='bdr' && !canRun()){ P.office = null; P.ex = exTitle(P); }
  if (canRun() && sh[P.party] && (P.fame>=20 || P.office==='wcity' || P.office==='bdr')) offerRun('bdr', sh, b[2], `${b[0]}년 연방의회 선거`);
}
function volkskammer(){
  W.house = {name:'인민의회', total:400, seats:{[SED]:127, [ETC]:273}};
  news(`${P.year}년 인민의회 선거 — 단일 명부 99% 찬성`);
  if (P.party===SED && P.sedRank===3 && rand()<.4){ P.sedRank = 4; say('인민의회 의원 명단에 들었다.', {fame:4}, 'big'); P.titles.push(`${P.year} 인민의회 의원`); }
}

function retireAsk(){
  ask({title:'은퇴', desc:`${P.age}세. 이제 그만 내려놓을까?`, valid:()=>P.alive && !P.retired, options:[
    {label:'은퇴한다', sub:'', go:()=>{ P.retired = true; say('정치에서 물러났다.', null, 'big'); }},
    {label:'아직이다', sub:'', go:()=>{}}
  ]});
}
function family(a){
  if (!P.married && a>=20 && a<=40 && rand()<.14){ P.married = true; say('결혼했다.', {hp:1}); }
  if (P.married && (P.kids||0)<4 && a<=42 && rand()<(P.year<1915 ? .25 : .12)){ P.kids = (P.kids||0)+1; say(`${P.kids===1 ? '첫아이' : `${P.kids}째 아이`}가 태어났다.`); }
  if ((P.fa || P.mo) && a===45+ri(0,20) && !P.flags.parents){ P.flags.parents = true; say('부모님이 세상을 떠나셨다.', {money: [0,0,500,3000,20000][P.wealth]}); }
}
function death(a){
  if (!P.alive) return;
  // 1890년대 독일은 아기 다섯 중 하나가 첫돌 전에 죽었다. 게임에서는 그 절반으로 줄였다
  let q = a===1 ? .10 : a<15 ? .004 : gompQ(a-1, P.male ? 76 : 80);
  q *= 1 + Math.max(0, 50-P.hp)/30;
  if (P.year===1918 && rand()<.006){ die('스페인 독감'); return; }
  if (P.year>=1945 && P.year<=1947) q *= 1.4;
  if (P.year>=1960) q *= .85;
  if (rand() < q) die(deathCause(a));
}
function die(cause){
  if (!P.alive) return;
  P.alive = false; P.cause = cause; P.pending = null; P.queue = [];
  say(`${cause}${eu(cause)} 세상을 떠났다. 향년 ${P.age}세.`, null, 'death');
}

// ── 활동 방침 ────────────────────────────────────
// 해마다 무엇에 힘을 쏟을지. 언제든 바꿀 수 있고, 한 해가 지날 때 그대로 반영된다
function policies(){
  const e = era(P.year, P.month), L = [['work','생업에 전념','돈을 모은다'], ['net','인맥 쌓기','조직력이 는다'], ['safe','몸 사리기','건강을 챙기고 위험을 피한다']];
  if (P.mil && P.mil.active && !P.mil.pow){
    L.push(['drill','부대 관리','공훈이 쌓인다'], ['staff','참모 교육','진급이 빨라지고 전선 위험이 준다'], ['patron','상관에게 줄서기','진급이 빨라지고 평판이 깎인다']);
    if (atWar(P.year)) L.push(['front','전선 자원','공훈이 크게 쌓이고 위험하다']);
  }
  if (P.biz) L.push(['invest','설비 투자','회사가 크고 이익은 준다'], ['expand','빚내서 확장','크게 크거나 크게 망한다'], ['workers','노동자 처우','평판이 오르고 이익은 준다'], ['donate','정당 후원','정치 인맥이 생긴다']);
  if (P.party!=null && P.party!==SED && (e==='weimar' || e==='west')) L.push(['local','지역 활동','조직력이 는다'], ['speech','연설·집회','인지도가 오르고 다칠 수 있다'], ['inner','당내 다지기','명부 순번이 오른다']);
  if (P.party===NS && e==='nazi') L.push(['zeal','열성 당 활동','승진이 빨라지고 기록이 남는다']);
  if (e==='nazi' && !P.jew && P.party!==NS && !P.exile && !P.camp && (P.prevParty!=null || P.rep>=60)) L.push(['under','지하 활동','평판이 오르고 체포 위험이 크다']);
  L.push(['family','가족과 휴식','건강이 좋아진다']);
  return L.map(([k,label,sub]) => ({k, label, sub}));
}
function setPolicy(k){ if (policies().some(o=>o.k===k)){ P.policy = k; P.ver++; } }
function applyPolicy(a){
  if (a<16) return;
  if (!policies().some(o=>o.k===P.policy)) P.policy = 'work';
  const k = P.policy;
  P.flags.resist = k==='under';
  if (k==='work') P.money += income()*.25;
  if (k==='net') P.org = clamp(P.org+3, 0, 100);
  if (k==='safe') P.hp = clamp(P.hp+1, 0, 100);
  if (k==='family'){ P.hp = clamp(P.hp+2, 0, 100); P.fame = clamp(P.fame-1, 0, 100); }
  if (k==='local') P.org = clamp(P.org+3, 0, 100);
  if (k==='speech'){ P.fame = clamp(P.fame+3, 0, 100); if (rand()<.1) say('집회가 난장판이 돼 다쳤다.', {hp:-4}); }
  if (k==='zeal'){ P.org = clamp(P.org+2, 0, 100); deed(`${P.year}년 열성 당 활동`, .5); }
  if (k==='drill' && P.mil) P.mil.merit += .5;
  if (k==='staff') P.smart = clamp(P.smart+1, 0, 100);
  if (k==='patron') P.rep = clamp(P.rep-1, 0, 100);
}

// ── 군인 ─────────────────────────────────────────
const MILR = ['이병','상병','하사','상사','소위','중위','대위','소령','중령','대령','소장','중장','대장','상급대장','원수'];
const MILW = [5,8,15,25,40,55,80,120,160,220,320,420,550,650,800];
const MILPAY = [600,700,900,1100,2400,2800,3600,4500,5500,6500,9000,11000,13000,15000,20000];
const atWar = y => (y>=1914 && y<=1918) || (y>=1939 && y<=1945);
function armyName(){
  const y = P.year;
  return y<1919 ? '제국군' : y<1935 ? '국방군' : y<=1945 ? '국방군' : P.zone==='east' ? '국가인민군' : '연방군';
}
function startMil(officer){
  P.track = 'mil';
  P.mil = {r: officer ? 4 : 0, merit:0, active:true, pow:0, front:null, medals:[]};
  setJob(officer ? '장교' : '직업군인', officer ? '사관학교를 마치고 소위로 임관했다.' : '지원 입대해 이병이 됐다.');
}
const WOUND = ['포탄 파편에 다쳤다.','총에 맞았지만 살았다.','가스에 쓰러졌다가 깨어났다.','동상으로 발가락을 잃었다.'];
function medal(name){ if (!P.mil.medals.includes(name)){ P.mil.medals.push(name); say(`${name}을 받았다.`, {fame:3, rep:2}, 'big'); P.titles.push(`${P.year} ${name}`); } }
function milYear(a){
  const M = P.mil; if (!M || P.prison || P.camp) return;
  if (M.pow){
    M.pow--;
    if (rand() < (M.powEast ? .08 : .01)){ die('포로수용소'); return; }
    say(M.pow ? `${M.powEast ? '소련' : '연합군'} 포로수용소에서 한 해를 보냈다.` : '포로수용소에서 풀려나 돌아왔다.', {hp:-5});
    if (!M.pow){ M.active = false; P.ex = `전 ${MILR[M.r]}`; }
    return;
  }
  if (!M.active) return;
  const y = P.year, war = atWar(y), pol = P.policy;
  const lim = M.r>=10 ? 63 : M.r>=7 ? 56 : M.r>=4 ? 48 : 40;
  if (!war && a>lim){ M.active = false; P.ex = `예비역 ${MILR[M.r]}`; say(`${MILR[M.r]}로 전역했다.`, null, 'big'); return; }
  if (war){
    const mul = pol==='front' ? 1.6 : pol==='staff' ? .5 : 1;
    const base = y<=1918 ? [.06,.06,.06,.06,.08,.08,.07,.04,.03,.03,.01,.01,.01,.01,.01] : [.05,.05,.05,.05,.06,.06,.05,.03,.02,.02,.01,.01,.01,.01,.01];
    const q = base[M.r] * mul * (1.2 - P.nerve/250), r = rand();
    if (r < q){ die('전사'); return; }
    if (r < q*3) say(rnd(WOUND), {hp:-12});
    else say(rnd(y<=1918 ? ['참호에서 한 해를 버텼다.','솜 강가에서 싸웠다.','베르됭 앞에서 겨울을 났다.','동부전선에서 진격했다.'] :
      (M.front==='동부전선' ? ['러시아의 진흙 속을 행군했다.','동부전선의 겨울을 버텼다.','후퇴하는 길에 부하를 잃었다.'] : ['프랑스에 주둔했다.','대서양 방벽을 쌓았다.','이탈리아 전선에서 싸웠다.'])), {hp:-2});
    M.merit += mul * (1 + rand()*2) * (P.nerve/50);
    if (y<=1918){ if (M.merit>=2) medal('2급 철십자 훈장'); if (M.merit>=5) medal('1급 철십자 훈장'); if (M.r>=4 && M.merit>=10 && rand()<.2) medal('푸르 르 메리트 훈장'); }
    else { if (M.merit>=2) medal('2급 철십자 훈장'); if (M.merit>=5) medal('1급 철십자 훈장'); if (M.merit>=10 && rand()<.25) medal('기사철십자 훈장'); }
  } else if (rand()<.4) say(rnd(['기동 훈련을 지휘했다.','부대를 옮겼다.','참모 회의에 들어갔다.','사열을 받았다.']));
  // 진급: 전쟁 때 빠르고, 10만 명 군대(1919~34) 때는 막힌다. 부사관은 전쟁 때만 장교가 될 수 있다
  let base = war ? .45 : (y>=1919 && y<=1934) ? .1 : (y>=1935 && y<=1938) ? .35 : .18;
  if (M.r===3) base = war && P.smart>=45 ? .12 : 0;
  if (M.r===13 && !war) base = 0;
  // 위로 갈수록 자리가 좁다. 원수는 전쟁 중에만, 아주 드물게
  const narrow = [1,1,1,1,1,1,1,.8,.7,.55,.3,.25,.15,.08,.02][M.r+1] ?? 0;
  const pr = base * 2 * narrow * sig((P.smart + P.nerve + P.wit - 150)/30 + M.merit/10 - M.r*.12 + (pol==='staff' ? .5 : pol==='patron' ? .7 : 0));
  if (M.r < 14 && rand() < pr){
    M.r++;
    say(`${MILR[M.r]}로 진급했다.`, {fame: M.r>=10 ? 4 : 1}, M.r>=9 ? 'big' : 'life');
    if (M.r>=9) P.titles.push(`${y} ${armyName()} ${MILR[M.r]}`);
    if (M.r>=10) news(`${P.name}, ${MILR[M.r]} 진급`);
  }
  // 동부전선의 명령
  if (y>=1942 && y<=1944 && M.front==='동부전선' && M.r>=5 && !P.flags.reprisal){ P.flags.reprisal = true;
    ask({title:'보복 명령', desc:'빨치산 습격의 보복으로 마을 하나를 불태우고 주민을 처형하라는 명령이 내려왔다.', valid:()=>P.mil && P.mil.active, options:[
      {label:'명령대로 한다', sub:'', go:()=>{ deed('점령지 민간인 보복 처형', 6); M.merit += 1; say('명령을 따랐다. 그 마을의 이름을 잊지 못했다.', {rep:-6}); }},
      {label:'흐지부지 넘긴다', sub:'들키면 군법회의', go:()=>{ say('명령을 미루고 보고서를 꾸몄다.', {rep:4}); if (rand()<risk(.15)){ say('들켜서 좌천됐다.', {fame:-3}); if (M.r>4) M.r--; } }}
    ]});
  }
}
function milTurning(y, m){
  const M = P.mil;
  if (!M || !P.alive) return;
  // 1918년 패전: 10만 명 군대만 남는다
  if (y===1918 && m===11 && M.active) ask({title:'패전', desc:'베르사유 조약으로 군대가 10만 명으로 줄어든다. 장교 여덟 중 일곱은 떠나야 한다.', valid:()=>P.mil.active, options:[
    {label:'군에 남기를 청한다', sub:`남을 가능성 약 ${Math.round(clamp((M.r>=4 ? .15 : .08) + M.merit/40 + (P.wit-50)/300, .03, .8)*100)}%`, go:()=>{
      if (rand() < clamp((M.r>=4 ? .15 : .08) + M.merit/40 + (P.wit-50)/300, .03, .8)) say('국방군(라이히스베어)에 남았다.', null, 'big');
      else { M.active = false; P.ex = `전 ${MILR[M.r]}`; say('명단에 들지 못하고 전역했다.', {hp:-2}, 'big'); P.job = null; } }},
    {label:'의용군(자유군단)에 들어간다', sub:'혁명을 진압하러 간다', go:()=>{ P.flags.freikorps = true; say('의용군에 들어갔다.', {org:3, rep:-3}); }},
    {label:'군복을 벗는다', sub:'새 삶을 찾는다', go:()=>{ M.active = false; P.ex = `전 ${MILR[M.r]}`; P.job = null; say('군복을 벗었다.'); }}
  ]});
  if (y===1920 && m===2 && (M.active || P.flags.freikorps)) ask({title:'카프 폭동', desc:'의용군이 베를린으로 진군해 정부를 몰아내려 한다. 함께할까?', options:[
    {label:'가담한다', sub:'', go:()=>{ say('폭동에 가담했다. 총파업 앞에 나흘 만에 무너졌다.', {fame:2, rep:-6}); if (rand()<.5){ M.active = false; P.ex = `전 ${MILR[M.r]}`; say('군에서 쫓겨났다.', null, 'big'); } }},
    {label:'병영을 지킨다', sub:'"국방군은 국방군을 쏘지 않는다"', go:()=>say('병영에 머물렀다.')}
  ]});
  if (y===1920 && m===5 && P.flags.freikorps && !M.active){ P.flags.freikorps = false; }
  if (y===1934 && m===7 && M.active) ask({title:'충성 맹세', desc:'헌법이 아니라 히틀러 한 사람에게 무조건 복종하겠다고 맹세하라고 한다.', valid:()=>P.mil.active, options:[
    {label:'맹세한다', sub:'모두가 한다', go:()=>say('맹세했다.')},
    {label:'전역한다', sub:'', go:()=>{ M.active = false; P.ex = `예비역 ${MILR[M.r]}`; say('맹세 대신 군복을 벗었다.', {rep:6}, 'big'); }}
  ]});
  if (y===1939 && m===8 && !M.active && !M.pow && P.age<=60 && M.r>=4 && !P.exile && !P.camp){ M.active = true; say(`예비역 ${MILR[M.r]}으로 다시 불려 나왔다.`, null, 'big'); }
  if (y===1939 && m===8 && M.active) M.front = '서부전선';
  if (y===1941 && m===5 && M.active){ M.front = rand()<.65 ? '동부전선' : '서부전선'; if (M.front==='동부전선') say('소련 침공에 나섰다.', null, 'big');
    if (M.front==='동부전선' && M.r>=7) ask({title:'인민위원 명령', desc:'붙잡은 소련군 정치장교를 재판 없이 사살하라는 명령을 부하들에게 전달해야 한다.', options:[
      {label:'전달한다', sub:'', go:()=>deed('인민위원 명령 하달', 4)},
      {label:'서랍에 넣어 둔다', sub:'', go:()=>say('명령을 전달하지 않았다.', {rep:4})}
    ]});
  }
  if (y===1943 && m===1 && M.active && M.front==='동부전선' && rand()<.08){ M.pow = ri(6,12); M.powEast = true; say('스탈린그라드에서 포위돼 소련군에 항복했다.', {hp:-15}, 'big'); }
  if (y===1945 && m===4 && M.active && !M.pow){ M.pow = M.front==='동부전선' ? ri(3,10) : ri(1,3); M.powEast = M.front==='동부전선'; say(`${M.powEast ? '소련군' : '연합군'}의 포로가 됐다.`, {hp:-8}, 'big'); }
  // 1955·1956년: 서독 연방군, 동독 국가인민군
  if (((y===1955 && m===10 && P.zone==='west') || (y===1956 && m===2 && P.zone==='east')) && !M.active && !M.pow && P.age<=62 && M.r>=6 && !P.prison && !/사형|징역/.test(P.flags.tried||''))
    ask({title: P.zone==='west' ? '연방군 창설' : '국가인민군 창설', desc:'새 군대가 경험 많은 장교를 찾는다.', options:[
      {label:'들어간다', sub:'', go:()=>{ M.active = true; M.front = null; say(`${armyName()} ${MILR[M.r]}로 다시 군복을 입었다.`, null, 'big'); }},
      {label:'사양한다', sub:'', go:()=>{}}
    ]});
}

// ── 기업인 ───────────────────────────────────────
// 군수(arm)에 쓰일 수 있는 업종은 전쟁과 재무장 때 크게 큰다
const IND = {'섬유':0, '철강·석탄':1, '화학':1, '전기':.6, '기계·자동차':1, '출판·신문':0, '식품·담배':0, '백화점·상점':0};
const bizW = size => Math.round(clamp(40 + 130*Math.log10(size+1), 40, 800));
function bizTitle(b){
  const s = b.size, t = s<10 ? '주인' : s<100 ? '공장주' : s<1000 ? '사장' : s<10000 ? '회장' : '콘체른 회장';
  return `${b.name} ${t}`;
}
// 그해 경기. 1923년 인플레이션, 1930~32년 대공황, 1945년 붕괴, 1950년대 경제기적
function econ(y, arm){
  if (y<1914) return .04;
  if (y<=1918) return arm ? .12 : -.06;
  if (y<=1922) return .03;
  if (y===1923) return -.12;
  if (y<=1928) return .06;
  if (y===1929) return -.04;
  if (y<=1932) return -.14;
  if (y<=1938) return arm ? .16 : .06;
  if (y<=1944) return arm ? .1 : -.06;
  if (y===1945) return -.35;
  if (y<=1947) return -.05;
  if (y<=1966) return .09;
  if (y<=1973) return .05;
  if (y<=1975) return -.03;
  return .03;
}
function startBiz(ind, size, line){
  const sur = P.name.split(' ').pop();
  P.biz = {name:`${sur} ${ind==='백화점·상점' ? '상회' : ind}`, ind, size, debt:0, armed:false};
  P.track = 'biz';
  setJob('기업가', line);
}
function bizEntry(a){
  if (P.biz || P.exile || P.prison || P.camp || P.jew && P.year>=1933 && P.year<1946) return;
  // 가업: 아버지가 공장주나 상인이면 물려받는다. 딸은 아들이 없을 때만(드문 예외)
  if (a===26 && P.fa && ['공장주','상인'].includes(P.fa.v) && !P.flags.heirAsked && (P.male || rand()<.35)){
    P.flags.heirAsked = true;
    const big = P.fa.v==='공장주', ind = big ? rnd(['섬유','철강·석탄','화학','기계·자동차','식품·담배']) : '백화점·상점';
    ask({title:'가업', desc: P.male ? `아버지가 ${big ? '공장' : '가게'}를 물려주려 한다.` : `아들이 없는 아버지가 ${big ? '공장' : '가게'}를 딸인 나에게 맡기려 한다. 흔치 않은 일이다.`, options:[
      {label:'물려받는다', sub:`${ind} · 직원 약 ${big ? '수백' : '열'} 명`, go:()=>startBiz(ind, big ? ri(80,400) : ri(3,15), `${big ? '공장' : '가게'}를 물려받았다.`)},
      {label:'내 길을 간다', sub:'', go:()=>say('가업을 잇지 않았다.')}
    ]});
    return;
  }
  // 창업: 밑천이 있고 장사나 기술을 아는 사람
  if (a>=24 && a<=55 && P.money>=2500 && ['상인','기술자','수공업 장인','사무원','점원','변호사','기자','장교'].includes(P.job) && !P.flags.noBiz && rand()<.12){
    const inds = Object.keys(IND).sort(()=>rand()-.5).slice(0,3);
    ask({title:'창업', desc:`모아 둔 ${money(P.money)}로 회사를 차릴 수 있다.`, valid:()=>!P.biz, options:[
      ...inds.map(ind => ({label:ind, sub: IND[ind] ? '전쟁 때 크게 큰다' : '경기를 덜 탄다', go:()=>{ P.money -= 2500; startBiz(ind, ri(4,12), `${ind} 회사를 차렸다.`); }})),
      {label:'하지 않는다', sub:'', go:()=>{ P.flags.noBiz = true; }}
    ]});
  }
}
function bizYear(a){
  const B = P.biz; if (!B || P.prison || P.camp || P.exile) return;
  const y = P.year, k = P.policy, before = B.size;
  let g = econ(y, IND[B.ind]>0 && (B.armed || (y>=1914 && y<=1918))) + normal(0,.1) + (P.smart+P.wit-100)/600, margin = .1;
  if (k==='invest'){ g += .08; margin *= .5; }
  if (k==='expand'){ g += .15; B.debt += B.size*120; }
  if (k==='workers'){ g -= .02; margin *= .7; P.rep = clamp(P.rep+1, 0, 100); }
  if (k==='donate'){ margin *= .6; P.org = clamp(P.org+2, 0, 100); P.donated = P.party; }
  if (k==='work') margin *= 1.2;
  B.size = Math.max(0, B.size*(1+g));
  const profit = B.size*1200*margin*(y>=1948 && P.zone==='west' ? 3 : 1);
  P.money += profit;
  if (B.debt>0) P.money -= B.debt*.06;
  if (B.size<1 || (g<-.05 && B.debt > B.size*400 && rand()<.4)){
    say(`${B.name}이 파산했다.`, {money:-B.debt, rep:-5}, 'big'); P.biz = null; if (P.track==='biz') P.track = P.party!=null ? 'pol' : null; P.job = '사무원'; return;
  }
  say(`${B.name}: 직원 ${Math.round(B.size).toLocaleString('ko-KR')}명, 이익 ${money(profit)}.`);
  for (const t of [100, 1000, 10000]) if (before<t && B.size>=t){ say(`${B.name}의 직원이 ${t.toLocaleString('ko-KR')}명을 넘었다.`, {fame:3}, 'big'); P.titles.push(`${y} ${bizTitle(B)}`); if (t>=1000) news(`${B.name}, 직원 ${t.toLocaleString('ko-KR')}명 돌파`); }
}
function bizTurning(y, m){
  const B = P.biz;
  if (!B || !P.alive) return;
  if (y===1914 && m===7 && IND[B.ind]) ask({title:'군수 계약', desc:'군에서 대량 주문이 들어왔다.', options:[
    {label:'받는다', sub:'전쟁 내내 큰다', go:()=>{ B.armed = true; say('군수 계약을 맺었다.', {money:2000}); }},
    {label:'사양한다', sub:'', go:()=>{}}
  ]});
  if (y===1918 && m===11) B.armed = false;
  if (y===1923 && m===10 && B.debt>0){ say('인플레이션으로 회사의 빚이 휴지가 됐다.', null, 'big'); B.debt = 0; }
  if (y===1931 && m===6) ask({title:'대공황', desc:'주문이 반으로 줄었다. 은행이 대출을 거둬들인다.', options:[
    {label:'노동자 절반을 해고한다', sub:'회사는 산다', go:()=>{ B.size *= .55; say('해고 통지서에 서명했다.', {rep:-5}); }},
    {label:'버틴다', sub:'망할 수도 있다', go:()=>{ if (P.money < B.size*300 && rand()<.35){ say(`${B.name}이 무너졌다.`, {rep:2}, 'big'); P.biz = null; if (P.track==='biz') P.track = P.party!=null ? 'pol' : null; P.job = '사무원'; } else say('이를 악물고 버텼다.', {rep:4}); }}
  ]});
  if (y===1932 && m===10 && B.size>=100) ask({title:'정치 자금', desc:'정당들이 기업인들에게 손을 벌린다.', options:[
    {label:'나치당에 댄다', sub:'', go:()=>{ P.donated = NS; deed('1932년 나치당에 정치 자금 제공', 1.5); say('나치당에 돈을 댔다.', {org:3}); }},
    {label:'국가인민당에 댄다', sub:'', go:()=>{ P.donated = DNVP; say('국가인민당에 돈을 댔다.', {org:2}); }},
    {label:'중도 정당에 댄다', sub:'중앙당·인민당', go:()=>{ P.donated = DVP; say('중도 정당에 돈을 댔다.', {org:2}); }},
    {label:'아무 데도 대지 않는다', sub:'', go:()=>{}}
  ]});
  if (y===1936 && m===8 && IND[B.ind] && B.size>=50) ask({title:'4개년 계획', desc:'재무장을 위한 군수 생산으로 돌리라는 요구가 왔다.', options:[
    {label:'군수로 돌린다', sub:'크게 큰다', go:()=>{ B.armed = true; deed('재무장 군수 생산 전환', .5); say('군수 공장으로 바꿨다.'); }},
    {label:'민수에 남는다', sub:'', go:()=>{}}
  ]});
  if (y===1942 && m===3 && B.armed && B.size>=1000) ask({title:'수용소 노동력', desc:'친위대가 수용소 수감자를 일꾼으로 빌려주겠다고 한다. 공장 옆에 막사를 지으면 된다.', options:[
    {label:'받아들인다', sub:'', go:()=>{ deed('수용소 수감자 강제노동', 6); B.size *= 1.2; say('공장 옆에 막사가 섰다. 그곳에서 사람들이 죽어 나갔다.', {rep:-8}, 'big'); }},
    {label:'거절한다', sub:'', go:()=>say('거절했다.', {rep:3})}
  ]});
  if (y>=1943 && y<=1945 && m===3 && !isVillage(P.place) && rand()<.3){ B.size *= .7; say('공습으로 공장이 크게 부서졌다.', null, 'big'); }
  if (y===1945 && m===6 && B.armed && P.zone==='west'){ B.size *= .6; say('연합군이 군수 설비를 뜯어 갔다.', null, 'big'); B.armed = false; }
  if (y===1946 && m===5 && P.zone==='east') ask({title:'국유화', desc:'소련 점령지구에서 기업이 몰수되고 있다.', options:[
    {label:'서쪽으로 넘어간다', sub:'회사는 두고 간다', go:()=>{ say('모든 것을 두고 서쪽으로 넘어갔다.', {money:-P.money*.7}, 'big'); P.biz = null; P.zone = 'west'; P.region = rnd(['바이에른','헤센','하노버']); P.place = pickPlace(P.region); if (P.track==='biz') P.track = null; }},
    {label:'남는다', sub:'회사를 빼앗긴다', go:()=>{ say(`${B.name}이 인민소유기업이 됐다.`, null, 'big'); P.biz = null; if (P.track==='biz') P.track = null; P.job = '사무원'; }}
  ]});
  if (y===1948 && m===5 && P.zone==='west') B.debt *= .1;
}

// ── 순위 ─────────────────────────────────────────
// 갈래마다(정치·군·재계) 그해 자리에 있는 실존 인물과 나를 함께 줄 세운다
const TRACKS = {pol:'정치', mil:'군', biz:'재계'};
function inTrack(tr){
  if (!P.alive || P.exile) return false;
  if (tr==='pol') return P.party!=null && !P.retired;
  if (tr==='mil') return !!(P.mil && (P.mil.active || P.mil.pow));
  return !!P.biz;
}
function trackPower(tr){
  if (tr==='mil') return MILW[P.mil.r] + Math.round(P.mil.merit*3);
  if (tr==='biz') return bizW(P.biz.size);
  const keep = [P.mil, P.biz]; P.mil = null; P.biz = null;
  const v = power(P); P.mil = keep[0]; P.biz = keep[1]; return v;
}
const mainTrack = () => P.track || 'pol';
function rank(tr){
  tr = tr || mainTrack();
  const e = era(P.year, P.month);
  const list = [];
  for (const x of REAL){
    if (!realAlive(x)) continue;
    const en = realEntry(x, tr); if (!en) continue;
    if (tr==='pol' && e==='east' && en.party!==SED) continue;
    if (tr==='pol' && e==='west' && en.party===SED) continue;
    list.push({x, p:en.w, t:en.t, party:en.party});
  }
  if (inTrack(tr)) list.push({x:P, p:trackPower(tr), t:title(P), party:P.party});
  list.sort((a,b)=>b.p-a.p);
  const me = list.findIndex(o=>o.x===P);
  return {list, me: me<0 ? null : me+1, total:list.length};
}
// 1933년 이후: 바이마르의 이름난 정치인들이 어떻게 됐나
function fates(){
  return REAL.filter(x => x.path.some(p => p.tr==='pol' && p.from<1933 && p.from>=1918 && p.w>=150) && x.b <= P.year)
    .sort((a,b)=>b.top-a.top).slice(0,16)
    .map(x => {
      const evs = x.ev.filter(([ey]) => ey>=1933 && ey<=P.year);
      const was = x.path.filter(p => p.from<1933 && p.tr==='pol').pop();
      return {id:x.id, name:x.name, was: was ? pname(was.party) : '—', now: !realAlive(x) ? realTitle(x) : evs.length ? evs.at(-1)[1] : realTitle(x)};
    });
}

const E = {POP, TRAITS, TRAIT_SUM, TRACKS, newLife, step, choose, ack, title, power, rank, fates, money, pct, pname, era, ERA_NAME, PARTY, NS, gompQ,
  policies, setPolicy, mainTrack, MILR, bizTitle,
  get P(){ return P; }, get W(){ return W; }, setRand: f => { rand = f; }};
if (typeof module !== 'undefined') module.exports = E;
