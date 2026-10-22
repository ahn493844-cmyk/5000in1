// 5천만분의 1 — 화면
(() => {
'use strict';
const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const P = () => E.P, W = () => E.W;

let birth = null, token = 0, busy = false, speed = 1, seenVer = -1, lastBoard = 0, acc = 0, last = 0, showT0 = 0, showFor = null;
const MS = {1:320, 3:105, 10:32};          // 한 달에 걸리는 시간(밀리초)
try { const s = +localStorage.getItem('5000in1-speed'); if (MS[s]) speed = s; } catch {}

// ── 숫자 ─────────────────────────────────────────
function fmtCount(n){
  if (n>=10) return Math.round(n).toLocaleString('ko-KR');
  if (n>=1) return n.toFixed(1);
  if (n>=0.01) return n.toFixed(2);
  return n.toPrecision(2);
}
function korNum(x){
  if (x>=1e12) return (x/1e12).toFixed(1).replace(/\.0$/,'')+'조';
  if (x>=1e8) return (x/1e8).toFixed(1).replace(/\.0$/,'')+'억';
  if (x>=1e4) return Math.round(x/1e4).toLocaleString('ko-KR')+'만';
  return Math.round(x).toLocaleString('ko-KR');
}
function fmtP(p){
  if (p>=0.995) return '확정';
  if (p>=0.1) return Math.round(p*100)+'%';
  if (p>=0.01) return (p*100).toFixed(1)+'%';
  return '1/'+korNum(1/p);
}
const POP = 51217221;
function setCount(n){
  $('count').innerHTML = `${fmtCount(n)}<small>명</small>`;
  $('meter').style.width = Math.max(0, Math.min(100, (Math.log10(Math.max(n,1e-2))+2)/(Math.log10(POP)+2)*100)) + '%';
}
function tween(from, to, ms, my){
  return new Promise(res => {
    if (reduce){ setCount(to); return res(); }
    const a=Math.log(Math.max(from,1e-6)), b=Math.log(Math.max(to,1e-6)), t0=performance.now();
    (function f(now){
      if (my!==token) return res();
      const t=Math.min(1,(now-t0)/ms), k=1-Math.pow(1-t,3);
      setCount(Math.exp(a+(b-a)*k));
      t<1 ? requestAnimationFrame(f) : res();
    })(t0);
  });
}

// ── 출생신고서 ───────────────────────────────────
function renderSheet(hide){
  const p = P();
  $('name').textContent = p.name;
  $('rrn').textContent = `${String(p.by).slice(2)}${String(p.bm+1).padStart(2,'0')}${String(1+Math.floor(Math.random()*28)).padStart(2,'0')}-${p.male?3:4}●●●●●●`;
  $('docno').textContent = `접수번호 ${p.by}-${String(Math.floor(Math.random()*1e6)).padStart(6,'0')}`;
  $('rows').innerHTML = birth.rows.map(r => `<div class="row${hide?' wait':''}"><dt>${r.label}</dt><dd>${esc(r.value)}</dd><span class="p">${r.pick ? '직접 고름' : fmtP(r.p)}</span>${r.note?`<span class="note">${esc(r.note)}</span>`:''}</div>`).join('');
}
function renderVerdict(){
  const e = birth.expected, one = korNum(1/birth.prob);
  const [big, small] = e < 1
    ? ['통계로 보면 이런 조건으로 태어난 사람은 당신 한 명뿐입니다.', `이 조합의 확률은 ${one}분의 1. 당신 앞에는 두 번의 세계대전과 세 번의 체제가 기다립니다.`]
    : [`같은 조건으로 태어난 사람이 약 ${Math.round(e).toLocaleString('ko-KR')}명 있습니다.`, `그들 모두 같은 역사를 지나게 됩니다. 두 번의 세계대전과 세 번의 체제를.`];
  $('verdict').innerHTML = `<p class="big">${big}</p><p class="small">${small}</p>`;
}

// ── 지금의 나 ───────────────────────────────────
function stageLabel(){
  const p = P();
  if (!p.alive) return '고인';
  if (p.camp) return '수용소에 갇힘';
  if (p.prison) return '수감 중';
  if (p.exile) return '망명 중';
  const t = E.title(p);
  if (t && (p.party!=null || p.office)) return t;
  if (p.age<6) return p.age<2 ? '아기' : '어린아이';
  if (p.age<15) return p.edu==='김나지움' ? '김나지움 학생' : '국민학교 학생';
  if (!p.job && p.flags.uni) return p.edu==='사관학교' ? '사관생도' : '대학생';
  if (p.job && p.age<65) return p.job;
  if (p.flags.jobless && !p.job) return '실업자';
  return p.age>=65 ? '은퇴' : '—';
}
const STATS = [['건강','hp'],['능력','smart'],['말솜씨','talk'],['친화력','charm'],['인지도','fame'],['평판','rep'],['조직력','org']];
function renderStatus(){
  const p = P(), w = W();
  $('sAge').innerHTML = `${p.age}<small>세</small>`;
  $('sYear').textContent = `${p.year}년 ${p.month+1}월`;
  const chips = [`<span class="chip main">${esc(stageLabel())}</span>`];
  if (p.party!=null) chips.push(`<span class="chip"><i class="dot p${p.party}"></i>${esc(E.pname(p.party))}</span>`);
  chips.push(`<span class="chip">${esc(p.region===p.place ? p.place : `${p.region} ${p.place}`)}</span>`);
  chips.push(`<span class="chip">${esc(p.faith)}</span>`);
  if (p.edu && p.age>=15) chips.push(`<span class="chip">${esc(p.edu)}${p.major?` · ${esc(p.major)}`:''}</span>`);
  if (p.retired) chips.push('<span class="chip">정계 은퇴</span>');
  $('sChips').innerHTML = chips.join('');
  $('sStats').innerHTML = STATS.map(([l,k]) => {
    const v = Math.round(p[k]);
    return `<div class="stat${v<30 && k!=='fame' && k!=='org' ?' low':''}"><span>${l}</span><span class="bar"><i style="width:${v}%"></i></span><b>${v}</b></div>`;
  }).join('');
  const kv = (k, v, cls='') => `<div class="kv"><dt>${k}</dt><dd class="${cls}">${v}</dd></div>`;
  const era = E.era(p.year, p.month), ranked = ['weimar','west','east'].includes(era);
  const r = ranked && p.party!=null ? E.rank() : null;
  $('sLedger').innerHTML =
    kv('시대', E.ERA_NAME[era], 'txt') +
    kv('재산', E.money(p.money), p.money<0?'neg':'') +
    (r ? kv('정치인 순위', r.me ? `${r.me}위 / ${r.total}명` : '—') : '') +
    (p.peakRank ? kv('최고 순위', `${p.peakRank}위`) : '') +
    (p.wins||p.losses ? kv('선거', `당선 ${p.wins} · 낙선 ${p.losses}`, 'txt') : '') +
    (p.deeds.length ? kv('남은 기록', `${p.deeds.length}건`, 'neg') : '');
}
function renderLog(){
  const box = $('log'), p = P();
  box.innerHTML = p.log.map(e => `<li class="yr"><div class="yh"><b>${e.year}</b><span>${e.age}세</span></div><ul>${
    e.lines.map(l => `<li class="ln k-${l.kind}">${esc(l.t)}${l.fx.map(f => `<span class="fx${f.neg?' neg':''}">${esc(f.s)}</span>`).join('')}</li>`).join('')
  }</ul></li>`).join('');
  box.scrollTop = box.scrollHeight;
}

// ── 선택과 개표 ─────────────────────────────────
function renderChoice(){
  const el = $('choice'), p = P();
  if (p.shows.length){ renderShow(); return; }
  showFor = null;
  if (!p.alive){ el.innerHTML = summaryHTML(); bindSummary(); return; }
  const ch = p.pending;
  if (!ch){ el.innerHTML = ''; return; }
  el.innerHTML = `<div class="choice" role="group" aria-labelledby="chT"><p class="eyebrow">선택 · ${p.age}세 · 시간이 멈춰 있습니다</p><h3 id="chT">${esc(ch.title)}</h3><p>${esc(ch.desc)}</p><div class="opts">${
    ch.options.map((o,i) => `<button type="button" class="opt" data-i="${i}"${o.off?' disabled':''}>${esc(o.label)}<small>${esc(o.sub||'')}</small></button>`).join('')
  }</div></div>`;
  el.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => { E.choose(+b.dataset.i); render(); }));
}
function renderShow(){
  const s = P().shows[0];
  if (showFor===s) return;
  showFor = s; showT0 = performance.now();
  const el = $('choice');
  if (s.kind==='trial'){
    el.innerHTML = `<div class="count trial" aria-live="polite"><p class="eyebrow">재판</p><h3>${esc(s.title)}</h3>
      <p class="muted">기록에 남은 것</p><ul class="charges">${s.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      <p class="outcome lose" id="outcome"></p><div class="acts"><button type="button" id="ack" disabled>계속</button></div></div>`;
  } else {
    s.noise = s.bars.map(() => (Math.random()-.5)*.08);
    el.innerHTML = `<div class="count" aria-live="polite"><p class="eyebrow">개표</p><h3>${esc(s.title)}</h3>
      <ol class="bars">${s.bars.map((c,i) => `<li class="${c.me?'me':''}"><span class="nm">${esc(c.name)}${c.me?'<small>내 당</small>':''}</span><span class="track"><i class="p${c.party}" id="bar${i}"></i></span><b id="pc${i}">0%</b></li>`).join('')}</ol>
      <p class="progress" id="prog">개표율 0%</p><p class="line" id="line"></p><p class="outcome" id="outcome"></p>
      <div class="acts"><button type="button" id="ack" disabled>계속</button></div></div>`;
  }
  $('ack').addEventListener('click', () => { E.ack(); showFor = null; render(); });
}
function tickShow(now){
  const p = P(); if (!p.shows.length || !showFor) return;
  const s = showFor, dur = reduce ? 0 : s.kind==='trial' ? 2400 : 2600;
  const t = dur ? Math.min(1, (now-showT0)/dur) : 1;
  if (s.kind!=='trial'){
    const raw = s.bars.map((c,i) => Math.max(.001, c.share + s.noise[i]*(1-t)));
    const tot = raw.reduce((a,b)=>a+b,0), top = Math.max(...s.bars.map(c=>c.share));
    raw.forEach((v,i) => { const sh = v/tot, bar = $('bar'+i); if (!bar) return; bar.style.width = `${(sh/Math.max(top,.01))*100*Math.min(1,t*1.2+.05)}%`; $('pc'+i).textContent = `${(sh*100).toFixed(1)}%`; });
    $('prog').textContent = t<1 ? `개표율 ${Math.round(t*100)}%` : '개표 완료';
  }
  if (t>=1 && !s.done){
    s.done = true;
    if ($('line')) $('line').textContent = s.line;
    const o = $('outcome'); o.textContent = s.kind==='trial' ? `판결: ${s.outcome}` : s.outcome;
    o.className = `outcome ${s.won ? 'win' : 'lose'}`;
    $('ack').disabled = false; $('ack').focus({preventScroll:true});
    s.at = now;
  }
  if (s.done && speed && now - s.at > (s.kind==='trial' ? 4000 : 2000)){ E.ack(); showFor = null; render(); }
}

function renderControls(){
  document.querySelectorAll('#speed button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.s===speed));
  const p = P();
  $('state').textContent = !p.alive ? '삶이 끝났습니다.' : p.shows.length ? (p.shows[0].kind==='trial' ? '재판 중' : '개표 중') : p.pending ? '선택을 기다리는 중' : speed ? `${speed}배속으로 흐르는 중` : '멈춤';
}
function render(){ renderStatus(); renderLog(); renderChoice(); renderControls(); seenVer = P().ver; }

// ── 정치판 ───────────────────────────────────────
// 왼쪽부터 공산·사통·사민·민주·자민·중앙·기민련·인민·군소·국가인민·나치
const SEAT_ORDER = [1,10,0,3,9,2,8,4,7,5,6];
const seatCache = {};
function seats(n){   // n석 반원 배치
  if (seatCache[n]) return seatCache[n];
  const rows = Math.max(5, Math.round(Math.sqrt(n/3.2))), pos = [], r0 = .36;
  const radii = Array.from({length:rows}, (_,i) => r0 + (1-r0)*i/(rows-1));
  const tot = radii.reduce((a,b)=>a+b,0);
  let left = n;
  radii.forEach((r,i) => {
    const k = i===rows-1 ? left : Math.round(n*r/tot); left -= k;
    for (let j=0;j<k;j++){ const a = Math.PI*(1 - (k>1 ? j/(k-1) : .5)); pos.push({x:Math.cos(a)*r, y:Math.sin(a)*r, a}); }
  });
  pos.sort((p,q) => q.a-p.a);
  return seatCache[n] = pos;
}
function drawHouse(){
  const cv = $('house'), w = W(), p = P(), h = w.house;
  const css = getComputedStyle(document.documentElement);
  const col = i => css.getPropertyValue(`--p${i}`).trim();
  const dpr = window.devicePixelRatio || 1, Wd = cv.clientWidth, Hd = cv.clientHeight;
  if (cv.width !== Wd*dpr){ cv.width = Wd*dpr; cv.height = Hd*dpr; }
  const c = cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,Wd,Hd);
  $('houseTitle').textContent = h ? `${h.name} ${h.total}석` : '의회';
  if (!h){
    c.fillStyle = css.getPropertyValue('--muted').trim(); c.font = '14px sans-serif'; c.textAlign = 'center';
    c.fillText(p.year<1919 ? '아직 공화국의 의회가 없습니다' : '의회가 없습니다', Wd/2, Hd/2);
    $('houseKey').innerHTML = ''; return;
  }
  const R = Math.min(Wd/2-8, Hd-14), cx = Wd/2, cy = Hd-6, dot = Math.max(1.6, R/Math.sqrt(h.total)/2.1);
  const list = []; SEAT_ORDER.forEach(i => { for (let k=0;k<(h.seats[i]||0);k++) list.push(i); });
  const mine = ['mdr','bdr'].includes(p.office) && p.alive ? list.indexOf(p.party) + Math.floor((h.seats[p.party]||0)/2) : -1;
  seats(list.length).forEach((s,i) => {
    const party = list[i]; if (party==null) return;
    c.beginPath(); c.arc(cx + s.x*R, cy - s.y*R, dot, 0, Math.PI*2); c.fillStyle = col(party); c.fill();
    if (i===mine){ c.lineWidth = 2.5; c.strokeStyle = css.getPropertyValue('--ink').trim(); c.beginPath(); c.arc(cx + s.x*R, cy - s.y*R, dot+3, 0, Math.PI*2); c.stroke(); }
  });
  const maj = Math.floor(h.total/2)+1;
  $('houseKey').innerHTML = SEAT_ORDER.filter(i => h.seats[i]).map(i => `<span><i class="dot p${i}"></i>${esc(E.pname(i))} <b>${h.seats[i]}</b></span>`).join('') +
    (Object.values(h.seats).some(n => n>=maj) ? '' : `<span class="muted">과반(${maj}석) 정당 없음</span>`);
}
let prevRank = new Map();
function renderBoard(){
  const w = W(), p = P();
  drawHouse();
  const era = E.era(p.year, p.month);
  $('eraBox').innerHTML = `<span class="lbl">지금</span><b>${E.ERA_NAME[era]}</b><span class="muted">${p.year}년 ${p.month+1}월</span>`;
  if (['nazi','occ'].includes(era)){
    $('rankTitle').textContent = '옛 경쟁자들의 행방';
    $('rank').innerHTML = E.fates().map((f,i) => `<li><span class="rk">${i+1}</span><span class="who"><b>${esc(f.name)}</b><small>${esc(f.was)} → ${esc(f.now)}</small></span><span class="pw"></span></li>`).join('') || '<li class="muted">—</li>';
    $('rankNote').textContent = '1933년 이후 자유로운 정치 경쟁은 사라졌습니다. 순위 대신 바이마르 시절 이름난 정치인들이 어떻게 됐는지 보여 줍니다.';
  } else if (era==='empire'){
    $('rankTitle').textContent = '실시간 정치인 순위';
    $('rank').innerHTML = '<li class="muted">아직 황제의 나라입니다. 1918년 11월 공화국이 서면 정치판이 열립니다.</li>';
    $('rankNote').textContent = '';
  } else {
    $('rankTitle').textContent = era==='east' ? '동독 사통당 서열' : era==='west' ? '서독 정치인 순위' : '실시간 정치인 순위';
    const r = E.rank(), top = r.list.slice(0, 10), showMe = r.me && r.me>10;
    const row = (e, i) => {
      const me = e.x===p, id = e.x.id||0, before = prevRank.get(id);
      const mv = before==null ? '' : before>i+1 ? '<span class="up">▲</span>' : before<i+1 ? '<span class="dn">▼</span>' : '';
      return `<li class="${me?'me':''}"><span class="rk">${i+1}</span><span class="who"><i class="dot p${e.x.party}"></i><b>${esc(me ? `${e.x.name} (나)` : e.x.name)}</b>${mv}<small>${esc(E.title(e.x)||'—')}</small></span><span class="pw">${e.p.toLocaleString('ko-KR')}</span></li>`;
    };
    $('rank').innerHTML = top.map(row).join('') + (showMe ? `<li class="gap" aria-hidden="true">⋯</li>${row(r.list[r.me-1], r.me-1)}` : '');
    $('rankNote').textContent = `이름 있는 정치인 ${r.total}명 중 · 숫자는 권력 점수`;
    prevRank = new Map(r.list.map((e,i)=>[e.x.id||0, i+1]));
  }
  $('news').innerHTML = w.news.slice(0,12).map(n => `<li${n.big?' class="big"':''}><span>${n.y}.${String(n.m+1).padStart(2,'0')}</span>${esc(n.t)}</li>`).join('') || '<li class="muted">아직 소식이 없습니다.</li>';
}

// ── 흐르는 시간 ─────────────────────────────────
function loop(now){
  const p = P(), dt = Math.min(250, now - (last||now)); last = now;
  if (p && !busy){
    if (p.shows.length){ if (!showFor) renderChoice(); tickShow(now); }
    else if (speed && p.alive && !p.pending){
      acc += dt;
      let n = 0;
      while (acc >= MS[speed] && n < 8){ acc -= MS[speed]; n++; if (!E.step()) { acc = 0; break; } }
    } else acc = 0;
    if (!p.alive && !p.histed){ p.histed = true; pushHist(); }
    if (p.ver !== seenVer) render();
    if (now - lastBoard > 450){ lastBoard = now; renderBoard(); renderStatus(); }
  }
  requestAnimationFrame(loop);
}

// ── 마지막 ─────────────────────────────────────
function lifeLine(){
  const p = P(), d = p.deeds.length;
  if (p.cause==='홀로코스트') return '1933년 이후 이 나라는 그를 이웃으로 여기지 않았다. 그는 살해된 600만 명 가운데 한 사람이다.';
  if (p.flags.survivor) return '살아남은 사람이었다. 많은 이가 그러지 못했다.';
  if (p.jew && p.flags.emigrated) return '고향을 떠나야 했기에 살아남은 삶이었다.';
  if (p.cause==='전범재판 사형 집행') return '권력의 가장 어두운 곳에 섰다가 법정에서 생을 마쳤다.';
  if (/인민재판소|게슈타포/.test(p.cause)) return '체제에 맞서다 목숨을 잃은 삶이었다.';
  if (p.flags.helper) return '모두가 커튼을 칠 때 문을 열어 준 사람이었다.';
  if (p.wasNS!=null && p.wasNS>=3) return '체제의 톱니바퀴로 출세했고, 그 대가를 법정에서 따져 물었다.';
  if (p.wasNS!=null) return '줄을 선 수백만 명 가운데 한 사람이었다.';
  if (p.flags.victim) return '수용소를 겪고도 살아남은 삶이었다.';
  if (p.exile) return '나라를 떠나 지켜본 삶이었다.';
  if (p.best==='bdr' || p.best==='mdr' || p.landmin) return '의사당에 자리를 얻은 삶이었다.';
  if (p.best) return '동네 정치에서 사람들을 대변한 삶이었다.';
  if (p.age<20) return '너무 일찍 끝난 삶이었다.';
  if (p.cause==='전사') return '참호에서 끝난 삶이었다.';
  return d ? '평범하게 살았지만, 기록이 남았다.' : '격동의 세기를 평범하게 건넌 삶이었다.';
}
function summaryHTML(){
  const p = P();
  const kv = (k, v) => `<div class="kv"><dt>${k}</dt><dd class="txt">${v}</dd></div>`;
  return `<div class="summary"><p class="eyebrow">인생 성적표</p><h3>${esc(p.name)} · ${p.by}–${p.year}</h3>
    <p class="line">${lifeLine()}</p>
    <dl>${kv('마지막', `${esc(p.cause)}, 향년 ${p.age}세`)}${kv('종교', esc(p.faith))}${kv('학력', esc(p.edu||'—'))}${kv('거쳐 간 일', esc(p.careers.join(' → ')||'없음'))}${
      kv('정당', esc([p.prevParty, p.party].filter((x,i,a)=>x!=null && a.indexOf(x)===i).map(E.pname).join(' → ') || '없음'))}${kv('선거', `당선 ${p.wins}번 · 낙선 ${p.losses}번`)}${
      p.deeds.length ? kv('남은 기록', esc(p.deeds.join(', '))) : ''}${p.flags.tried ? kv('전후 심판', esc(p.flags.tried)) : ''}${
      p.titles.length ? kv('지낸 자리', esc(p.titles.join(' → '))) : ''}${p.peakRank ? kv('가장 높이 오른 순위', `${p.peakRank}위`) : ''}${
      kv('남긴 재산', E.money(p.money))}${kv('태어난 조건', `같은 조건 ${fmtCount(birth.expected)}명`)}</dl>
    <div class="acts"><button type="button" id="again">다시 태어나기</button><button type="button" class="ghost" id="copyLife">요약 복사</button></div></div>`;
}
function bindSummary(){
  $('again').addEventListener('click', () => { window.scrollTo({top:0, behavior: reduce ? 'auto' : 'smooth'}); });
  $('copyLife').addEventListener('click', () => {
    const p = P();
    const text = `[5천만분의 1] ${p.by}년 ${p.region} ${p.birthPlace}에서 태어난 ${p.name}. ${p.titles.length ? p.titles.join(' → ') : (p.careers.join(' → ')||'평범한 삶')}. ${p.year}년 ${p.cause}, 향년 ${p.age}세. "${lifeLine()}"`;
    const ok = () => $('toast').textContent = '요약을 복사했습니다.';
    const fail = () => $('toast').textContent = text;
    try { navigator.clipboard.writeText(text).then(ok, fail); } catch { fail(); }
  });
}

// ── 지난 인생 ───────────────────────────────────
const HKEY = '5000in1-germany';
let history = [];
try { history = JSON.parse(localStorage.getItem(HKEY)) || []; } catch {}
function pushHist(){
  const p = P();
  history.unshift({t:`${p.name} · ${p.by}–${p.year} · ${p.titles.at(-1)?.replace(/^\d+ /,'') || p.careers.at(-1) || '—'} · ${p.cause}`, a:p.age});
  history = history.slice(0,12);
  try { localStorage.setItem(HKEY, JSON.stringify(history)); } catch {}
  renderHist();
}
function renderHist(){
  $('hist').innerHTML = history.length
    ? history.map(h => `<li><span>${esc(h.t)}</span><span>${h.a}세</span></li>`).join('')
    : '<li><span class="empty">아직 끝난 인생이 없습니다. 끝까지 살면 여기에 남습니다.</span><span></span></li>';
}

// ── 타고난 기질 고르기 ───────────────────────────
let alloc = {hp:5, smart:5, talk:5, charm:5};
try { const a = JSON.parse(localStorage.getItem('5000in1-alloc')); if (a && E.TRAITS.every(([k]) => a[k]>=0 && a[k]<=10) && E.TRAITS.reduce((s,[k])=>s+a[k],0)===E.TRAIT_SUM) alloc = a; } catch {}
const HINT = {hp:'오래 버티고 선거 강행군을 견딘다', smart:'수능·고시·법안에 유리하다', talk:'선거·토론·방송에서 빛난다', charm:'사람을 모아 조직을 키운다'};
function renderAlloc(){
  const left = E.TRAIT_SUM - E.TRAITS.reduce((s,[k])=>s+alloc[k],0);
  $('alloc').innerHTML = `<p class="al-head"><span>타고난 기질</span><span>남은 점수 <b>${left}</b></span></p>` + E.TRAITS.map(([k,l]) => `
    <div class="al-row"><span class="al-l">${l}<small>${HINT[k]}</small></span>
      <button type="button" class="al-b" data-k="${k}" data-d="-1" aria-label="${l} 낮추기"${alloc[k]<=0?' disabled':''}>−</button>
      <span class="al-pips" aria-label="${l} ${alloc[k]}점">${Array.from({length:10},(_,i)=>`<i${i<alloc[k]?' class="on"':''}></i>`).join('')}</span>
      <button type="button" class="al-b" data-k="${k}" data-d="1" aria-label="${l} 올리기"${alloc[k]>=10||left<=0?' disabled':''}>+</button></div>`).join('');
  $('alloc').querySelectorAll('.al-b').forEach(b => b.addEventListener('click', () => {
    alloc[b.dataset.k] += +b.dataset.d; renderAlloc();
    try { localStorage.setItem('5000in1-alloc', JSON.stringify(alloc)); } catch {}
  }));
  $('roll').disabled = busy || left!==0;
  $('roll').textContent = left ? `점수 ${left}점을 더 나눠 주세요` : P() ? '다시 태어나기' : '태어나기';
}

// ── 태어나기 ─────────────────────────────────────
async function born(animate){
  if (E.TRAIT_SUM !== E.TRAITS.reduce((s,[k])=>s+alloc[k],0)){ document.getElementById('alloc').scrollIntoView({behavior:'smooth', block:'center'}); return; }
  document.querySelectorAll('.after').forEach(e => e.hidden = false);
  const my = ++token; busy = animate && !reduce; acc = 0; showFor = null; prevRank = new Map();
  birth = E.newLife({...alloc});
  renderSheet(busy); render(); renderBoard();
  const seal = $('seal'); seal.className = 'seal off'; $('verdict').innerHTML = ''; $('toast').textContent = '';
  let n = POP; setCount(n);
  if (busy){
    $('roll').disabled = true;
    const els = [...document.querySelectorAll('#rows .row')];
    for (let i=0;i<birth.rows.length;i++){
      if (my!==token) return;
      els[i].classList.remove('wait'); els[i].classList.add('flash');
      const next = n*birth.rows[i].p; await tween(n, next, 380, my); await sleep(80); n = next;
    }
  }
  setCount(birth.expected); renderVerdict();
  seal.className = busy ? 'seal stamp' : 'seal';
  busy = false; renderControls(); renderAlloc();
}

document.querySelectorAll('#speed button').forEach(b => b.addEventListener('click', () => {
  speed = +b.dataset.s; acc = 0; renderControls();
  try { localStorage.setItem('5000in1-speed', speed); } catch {}
}));
$('roll').addEventListener('click', () => born(true));
$('reborn').addEventListener('click', () => { window.scrollTo({top:0, behavior: reduce ? 'auto' : 'smooth'}); });
addEventListener('resize', () => { if (P()) renderBoard(); });
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (P()) renderBoard(); });

renderHist();
renderAlloc();
requestAnimationFrame(loop);
})();
