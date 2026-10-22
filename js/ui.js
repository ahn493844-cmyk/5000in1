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
  $('rows').innerHTML = birth.rows.map(r => `<div class="row${hide?' wait':''}"><dt>${r.label}</dt><dd>${esc(r.value)}</dd><span class="p">${fmtP(r.p)}</span>${r.note?`<span class="note">${esc(r.note)}</span>`:''}</div>`).join('');
}
function renderVerdict(){
  const e = birth.expected, one = korNum(1/birth.prob);
  const [big, small] = e < 1
    ? ['통계로 보면 이런 조건으로 태어난 사람은 당신 한 명뿐입니다.', `이 조합의 확률은 ${one}분의 1. 대한민국 대통령은 5천만분의 1입니다.`]
    : [`같은 조건으로 태어난 사람이 약 ${Math.round(e).toLocaleString('ko-KR')}명 있습니다.`, `그중 대통령이 되는 사람은 아마 없을 겁니다. 대통령은 5천만분의 1입니다.`];
  $('verdict').innerHTML = `<p class="big">${big}</p><p class="small">${small}</p>`;
}

// ── 지금의 나 ───────────────────────────────────
function stageLabel(){
  const p = P(), w = W();
  if (!p.alive) return '고인';
  if (p.prison) return '수감 중';
  const t = E.title(p);
  if (t && (p.party!=null || p.office || w.pres.who===p)) return t;
  if (p.age<7) return p.age<2 ? '아기' : '미취학 아동';
  if (p.age<13) return '초등학생';
  if (p.age<16) return '중학생';
  if (p.age<19) return '고등학생';
  if (!p.job && p.edu && p.edu!=='고졸') return '대학생';
  if (p.job && p.age<65) return p.job;
  return p.age>=65 ? '은퇴' : '취업 준비 중';
}
const STATS = [['건강','hp'],['능력','smart'],['말솜씨','talk'],['인지도','fame'],['평판','rep'],['조직력','org']];
function renderStatus(){
  const p = P(), w = W();
  $('sAge').innerHTML = `${p.age}<small>세</small>`;
  $('sYear').textContent = `${p.year}년 ${p.month+1}월`;
  const chips = [`<span class="chip main">${esc(stageLabel())}</span>`];
  if (p.party!=null) chips.push(`<span class="chip"><i class="dot p${p.party}"></i>${esc(E.pname(p.party))}</span>`);
  if (p.party!=null && p.dist) chips.push(`<span class="chip">${esc(E.short(p.home))} ${esc(p.dist)}</span>`);
  else if (p.age>=19) chips.push(`<span class="chip">${esc(E.short(p.home))}</span>`);
  if (p.edu && p.age>=19) chips.push(`<span class="chip">${esc(p.edu)}${p.major?` · ${esc(p.major)}`:''}</span>`);
  if (p.retired) chips.push('<span class="chip">정계 은퇴</span>');
  $('sChips').innerHTML = chips.join('');
  $('sStats').innerHTML = STATS.map(([l,k]) => {
    const v = Math.round(p[k]);
    return `<div class="stat${v<30 && k!=='fame' && k!=='org' ?' low':''}"><span>${l}</span><span class="bar"><i style="width:${v}%"></i></span><b>${v}</b></div>`;
  }).join('');
  const kv = (k, v, cls='') => `<div class="kv"><dt>${k}</dt><dd class="${cls}">${v}</dd></div>`;
  const r = E.rank();
  $('sLedger').innerHTML =
    kv('재산', E.won(p.money), p.money<0?'neg':'') +
    (p.party!=null ? kv('정치인 순위', r.me ? `${r.me}위 / ${r.total}명` : '—') : '') +
    (p.peakRank ? kv('최고 순위', `${p.peakRank}위`) : '') +
    (p.wins||p.losses ? kv('선거', `당선 ${p.wins} · 낙선 ${p.losses}`, 'txt') : '') +
    kv('대통령', `${esc(w.pres.who===p ? '나' : w.pres.who.name)} · 지지율 ${Math.round(w.pres.approval)}%`, 'txt');
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
  s.noise = s.cands.map(() => (Math.random()-.5)*.12);
  const el = $('choice');
  el.innerHTML = `<div class="count" aria-live="polite"><p class="eyebrow">${s.kind==='prim' ? '경선' : '개표 방송'}</p><h3>${esc(s.title)}</h3>
    <ol class="bars">${s.cands.map((c,i) => `<li class="${c.me?'me':''}"><span class="nm">${esc(c.me?`${c.name} (나)`:c.name)}<small>${esc(E.pname(c.party))}</small></span><span class="track"><i class="p${c.party}" id="bar${i}"></i></span><b id="pc${i}">0%</b></li>`).join('')}</ol>
    <p class="progress" id="prog">개표율 0%</p><p class="outcome" id="outcome"></p>
    <div class="acts"><button type="button" id="ack" disabled>계속</button></div></div>`;
  $('ack').addEventListener('click', () => { E.ack(); showFor = null; render(); });
}
function tickShow(now){
  const p = P(); if (!p.shows.length || !showFor) return;
  const s = showFor, dur = reduce ? 0 : s.kind==='prim' ? 1400 : 2600;
  const t = dur ? Math.min(1, (now-showT0)/dur) : 1;
  const raw = s.cands.map((c,i) => Math.max(.001, c.share + s.noise[i]*(1-t)));
  const tot = raw.reduce((a,b)=>a+b,0);
  const top = Math.max(...s.cands.map(c=>c.share));
  raw.forEach((v,i) => { const sh = v/tot; const bar = $('bar'+i); if (!bar) return; bar.style.width = `${(sh/Math.max(top,.01))*100*Math.min(1,t*1.2+.05)}%`; $('pc'+i).textContent = `${(sh*100).toFixed(1)}%`; });
  $('prog').textContent = t<1 ? `${s.kind==='prim'?'집계':'개표율'} ${Math.round(t*100)}%` : `${s.kind==='prim'?'집계':'개표'} 완료`;
  if (t>=1 && !s.done){
    s.done = true;
    const o = $('outcome'); o.textContent = s.won ? (s.kind==='prim' ? '경선 승리' : '당선') : (s.kind==='prim' ? '경선 탈락' : '낙선');
    o.className = `outcome ${s.won ? 'win' : 'lose'}`;
    $('ack').disabled = false; $('ack').focus({preventScroll:true});
    s.at = now;
  }
  if (s.done && speed && now - s.at > 1800){ E.ack(); showFor = null; render(); }
}

function renderControls(){
  document.querySelectorAll('#speed button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.s===speed));
  const p = P();
  $('state').textContent = !p.alive ? '삶이 끝났습니다.' : p.shows.length ? '개표 중' : p.pending ? '선택을 기다리는 중' : speed ? `${speed}배속으로 흐르는 중` : '멈춤';
}
function render(){ renderStatus(); renderLog(); renderChoice(); renderControls(); seenVer = P().ver; }

// ── 정치판 ───────────────────────────────────────
const SEAT_ORDER = [0,2,3,1];
let seatPos = null;
function seats(){   // 300석 반원 배치
  if (seatPos) return seatPos;
  const rows = 9, pos = [], r0 = .36;
  const radii = Array.from({length:rows}, (_,i) => r0 + (1-r0)*i/(rows-1));
  const tot = radii.reduce((a,b)=>a+b,0);
  let left = 300;
  radii.forEach((r,i) => {
    const n = i===rows-1 ? left : Math.round(300*r/tot); left -= n;
    for (let k=0;k<n;k++){ const a = Math.PI*(1 - k/(n-1)); pos.push({x:Math.cos(a)*r, y:Math.sin(a)*r, a}); }
  });
  pos.sort((p,q) => q.a-p.a);
  return seatPos = pos;
}
function drawHouse(){
  const cv = $('house'), w = W(), p = P();
  const css = getComputedStyle(document.documentElement);
  const col = i => css.getPropertyValue(`--p${i}`).trim();
  const dpr = window.devicePixelRatio || 1, Wd = cv.clientWidth, Hd = cv.clientHeight;
  if (cv.width !== Wd*dpr){ cv.width = Wd*dpr; cv.height = Hd*dpr; }
  const c = cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,Wd,Hd);
  const R = Math.min(Wd/2-8, Hd-14), cx = Wd/2, cy = Hd-6, dot = Math.max(2.2, R/36);
  const list = []; SEAT_ORDER.forEach(i => { for (let k=0;k<w.seats[i];k++) list.push(i); });
  const mine = p.office==='mp' && p.alive ? list.indexOf(p.party) + Math.floor(w.seats[p.party]/2) : -1;
  seats().forEach((s,i) => {
    const party = list[i]; if (party==null) return;
    c.beginPath(); c.arc(cx + s.x*R, cy - s.y*R, dot, 0, Math.PI*2); c.fillStyle = col(party); c.fill();
    if (i===mine){ c.lineWidth = 2.5; c.strokeStyle = css.getPropertyValue('--ink').trim(); c.beginPath(); c.arc(cx + s.x*R, cy - s.y*R, dot+3, 0, Math.PI*2); c.stroke(); }
  });
  $('houseKey').innerHTML = SEAT_ORDER.filter(i => w.seats[i]).map(i => `<span><i class="dot p${i}"></i>${esc(E.pname(i))} <b>${w.seats[i]}</b></span>`).join('') +
    (w.seats.some((n,i)=>n>=151 && i<3) ? '' : '<span class="muted">과반 정당 없음</span>');
}
let prevRank = new Map();
function renderBoard(){
  const w = W(), p = P();
  drawHouse();
  const pr = w.pres;
  const presName = pr.who===p ? `${p.name} (나)` : pr.who.name;
  $('presBox').innerHTML = `<span class="lbl">대통령</span><b>${esc(presName)}</b><span><i class="dot p${pr.party}"></i>${esc(E.pname(pr.party))} · ${pr.from}년 취임</span><span class="appr"><span class="bar"><i style="width:${Math.round(pr.approval)}%"></i></span>지지율 ${Math.round(pr.approval)}%</span><span class="muted">다음 대선 ${w.nextPres.y}년</span>`;
  const r = E.rank(), top = r.list.slice(0, 10);
  const showMe = r.me && r.me>10;
  const row = (e, i) => {
    const me = e.x===p, id = e.x.id||0, before = prevRank.get(id);
    const mv = before==null ? '' : before>i+1 ? '<span class="up">▲</span>' : before<i+1 ? '<span class="dn">▼</span>' : '';
    return `<li class="${me?'me':''}"><span class="rk">${i+1}</span><span class="who"><i class="dot p${e.x.party}"></i><b>${esc(me ? `${e.x.name} (나)` : e.x.name)}</b>${mv}<small>${esc(E.title(e.x)||'—')}</small></span><span class="pw">${e.p.toLocaleString('ko-KR')}</span></li>`;
  };
  $('rank').innerHTML = top.map(row).join('') + (showMe ? `<li class="gap" aria-hidden="true">⋯</li>${row(r.list[r.me-1], r.me-1)}` : '');
  $('rankNote').textContent = `이름 있는 정치인 ${r.total}명 중 · 숫자는 권력 점수`;
  prevRank = new Map(r.list.map((e,i)=>[e.x.id||0, i+1]));
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
      if (n && !p.alive) pushHist();
    } else acc = 0;
    if (p.ver !== seenVer) render();
    if (now - lastBoard > 450){ lastBoard = now; renderBoard(); renderStatus(); }
  }
  requestAnimationFrame(loop);
}

// ── 마지막 ─────────────────────────────────────
function lifeLine(){
  const p = P();
  if (p.titles.some(t=>t.includes('대통령'))) return '5천만분의 1. 대한민국 대통령이 된 삶이었다.';
  if (p.best==='gov') return '한 지역을 이끈 삶이었다.';
  if (p.best==='mp') return '국회의원 300명 가운데 한 자리를 차지한 삶이었다.';
  if (p.best) return '동네 정치에서 사람들을 대변한 삶이었다.';
  if (p.party!=null && p.losses) return '끝내 배지를 달지 못한 삶이었다.';
  if (p.party!=null) return '정치판 언저리를 지킨 삶이었다.';
  if (p.age<20) return '너무 일찍 끝난 삶이었다.';
  return '정치는 투표로만 함께한 평범한 삶이었다.';
}
function summaryHTML(){
  const p = P();
  const kv = (k, v) => `<div class="kv"><dt>${k}</dt><dd class="txt">${v}</dd></div>`;
  return `<div class="summary"><p class="eyebrow">인생 성적표</p><h3>${esc(p.name)} · ${p.by}–${p.year}</h3>
    <p class="line">${lifeLine()}</p>
    <dl>${kv('마지막', `${esc(p.cause)}, 향년 ${p.age}세`)}${kv('학력', esc(p.edu||'—'))}${kv('거쳐 간 일', esc(p.careers.join(' → ')||'없음'))}${
      kv('정당', p.party!=null ? esc(E.pname(p.party)) : '없음')}${kv('선거', `당선 ${p.wins}번 · 낙선 ${p.losses}번`)}${
      p.titles.length ? kv('지낸 자리', esc(p.titles.join(' → '))) : ''}${p.peakRank ? kv('가장 높이 오른 순위', `${p.peakRank}위`) : ''}${
      kv('남긴 재산', E.won(p.money))}${kv('태어난 조건', `같은 조건 ${fmtCount(birth.expected)}명`)}</dl>
    <div class="acts"><button type="button" id="again">다시 태어나기</button><button type="button" class="ghost" id="copyLife">요약 복사</button></div></div>`;
}
function bindSummary(){
  $('again').addEventListener('click', () => born(true));
  $('copyLife').addEventListener('click', () => {
    const p = P();
    const text = `[5천만분의 1] ${p.by}년 ${p.region}에서 태어난 ${p.name}. ${p.titles.length ? p.titles.join(' → ') : (p.careers.join(' → ')||'평범한 삶')}. 당선 ${p.wins}번, 낙선 ${p.losses}번. ${p.age}세에 세상을 떠났다. "${lifeLine()}"`;
    const ok = () => $('toast').textContent = '요약을 복사했습니다.';
    const fail = () => $('toast').textContent = text;
    try { navigator.clipboard.writeText(text).then(ok, fail); } catch { fail(); }
  });
}

// ── 지난 인생 ───────────────────────────────────
const HKEY = '5000in1-politics';
let history = [];
try { history = JSON.parse(localStorage.getItem(HKEY)) || []; } catch {}
function pushHist(){
  const p = P();
  history.unshift({t:`${p.name} · ${p.by}–${p.year} · ${p.titles.at(-1)?.replace(/^\d+ /,'') || (p.party!=null ? `${E.pname(p.party)} 낙선 ${p.losses}번` : p.careers.at(-1) || '—')}`, a:p.age});
  history = history.slice(0,12);
  try { localStorage.setItem(HKEY, JSON.stringify(history)); } catch {}
  renderHist();
}
function renderHist(){
  $('hist').innerHTML = history.length
    ? history.map(h => `<li><span>${esc(h.t)}</span><span>${h.a}세</span></li>`).join('')
    : '<li><span class="empty">아직 끝난 인생이 없습니다. 끝까지 살면 여기에 남습니다.</span><span></span></li>';
}

// ── 태어나기 ─────────────────────────────────────
async function born(animate){
  const my = ++token; busy = animate && !reduce; acc = 0; showFor = null; prevRank = new Map();
  birth = E.newLife();
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
    $('roll').disabled = false;
  }
  setCount(birth.expected); renderVerdict();
  seal.className = busy ? 'seal stamp' : 'seal';
  busy = false; renderControls();
}

document.querySelectorAll('#speed button').forEach(b => b.addEventListener('click', () => {
  speed = +b.dataset.s; acc = 0; renderControls();
  try { localStorage.setItem('5000in1-speed', speed); } catch {}
}));
$('roll').addEventListener('click', () => born(true));
$('reborn').addEventListener('click', () => born(true));
addEventListener('resize', () => renderBoard());
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => renderBoard());

renderHist();
born(false);
requestAnimationFrame(loop);
})();
