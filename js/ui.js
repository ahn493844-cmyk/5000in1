// 5천만분의 1 — 화면
(() => {
'use strict';
const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

let mode = 'now', birth = null, token = 0, running = false, busy = false, resume = 0;
try { if (localStorage.getItem('5000in1-mode')==='past') mode = 'past'; } catch {}

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
  $('name').textContent = P.name;
  $('rrn').textContent = P.rrn;
  $('docno').textContent = `접수번호 ${P.by}-${String(Math.floor(rand()*1e6)).padStart(6,'0')}`;
  $('rows').innerHTML = birth.rows.map(r => `<div class="row${hide?' wait':''}"><dt>${r.label}</dt><dd>${esc(r.value)}</dd><span class="p">${fmtP(r.p)}</span>${r.note?`<span class="note">${esc(r.note)}</span>`:''}</div>`).join('');
}
function renderVerdict(){
  const e = birth.expected, one = korNum(1/birth.prob);
  const [big, small] = e < 1
    ? ['통계로 보면 이런 조건으로 태어난 사람은 당신 한 명뿐입니다.', `이 조합의 확률은 ${one}분의 1, 기대 인원은 ${fmtCount(e)}명입니다.`]
    : [`같은 조건으로 태어난 사람이 약 ${Math.round(e).toLocaleString('ko-KR')}명 있습니다.`, `확률 ${one}분의 1.`];
  $('verdict').innerHTML = `<p class="big">${big}</p><p class="small">${small}</p>`;
}

// ── 지금의 나 ───────────────────────────────────
function stageLabel(){
  if (!P.alive) return '고인';
  if (P.mil) return P.flags.service ? '사회복무요원' : '군 복무 중';
  switch (P.stage){
    case 'baby': return P.age<2 ? '아기' : '미취학 아동';
    case 'elem': return P.year<1996 ? '국민학생' : '초등학생';
    case 'mid': return '중학생';
    case 'high': return `고등학생${P.hs?` · ${P.hs}`:''}${P.track?` · ${P.track}`:''}`;
    case 'exam': return '수험생';
    case 'retake': return '재수생';
    case 'univ': return `${P.uni.label} ${P.uni.major}과 ${Math.min(P.uni.done+1, P.uni.len)}학년`;
    case 'seek': return '취업 준비 중';
    case 'exam-prep': return `${P.exam ? P.exam.kind : ''} 시험 준비 중`;
    case 'jobless': return '실직 중';
    case 'retired': return '은퇴';
    case 'work': {
      const R = RANKS[P.job.t], rank = R && P.job.rank ? ` · ${R[P.job.rank]}` : '';
      return `${P.job.title}${rank}`;
    }
  }
  return '';
}
function renderStatus(){
  $('sAge').innerHTML = `${P.age}<small>세</small>`;
  $('sYear').textContent = `${P.year}년`;
  const chips = [`<span class="chip main">${esc(stageLabel())}</span>`];
  if (P.job && P.alive) chips.push(`<span class="chip">연봉 ${won(P.job.inc)}</span>`);
  if (P.married && P.spouse) chips.push(`<span class="chip">기혼 · ${esc(P.spouse.name)}</span>`);
  else if (P.partner) chips.push(`<span class="chip">연애 중 · ${esc(P.partner.name)}</span>`);
  else if (P.age>=20) chips.push(`<span class="chip">${P.flags.widow?'사별':P.divorces?'이혼':'미혼'}</span>`);
  if (P.age>=19) chips.push(`<span class="chip">${P.house ? '내 집' : P.home==='parents' ? '부모님 집' : '셋집'}</span>`);
  if (P.edu && P.age>=19) chips.push(`<span class="chip">${esc(P.edu)}</span>`);
  $('sChips').innerHTML = chips.join('');
  $('sStats').innerHTML = [['건강','hp'],['행복','happy'],['지능','smart'],['관계','social']].map(([l,k]) => {
    const v = Math.round(P[k]);
    return `<div class="stat${v<30?' low':''}"><span>${l}</span><span class="bar"><i style="width:${v}%"></i></span><b>${v}</b></div>`;
  }).join('');
  const parent = (p, w) => p.alive ? `${p.age0+P.age}세 · ${p.job}` : `${p.death}세에 별세`;
  const kv = (k, v, cls='') => `<div class="kv"><dt>${k}</dt><dd class="${cls}">${v}</dd></div>`;
  const nw = netWorth();
  $('sLedger').innerHTML =
    kv('모은 돈', won(P.money), P.money<0?'neg':'') +
    (P.house ? kv('집', won(P.house.value)) : '') +
    kv('순자산', won(nw), nw<0?'neg':'') +
    kv('아버지', esc(parent(P.fa)), 'txt') + kv('어머니', esc(parent(P.mo)), 'txt') +
    kv('집안 형편', WEALTH[P.fam.wealth], 'txt') +
    (P.kids.length ? kv('자녀', `${P.kids.length}명${P.grandkids?` · 손주 ${P.grandkids}명`:''}`, 'txt') : '');
}
function renderLog(){
  const box = $('log');
  box.innerHTML = P.log.map(e => `<li class="yr"><div class="yh"><b>${e.year}</b><span>${e.age}세</span></div><ul>${
    e.lines.map(l => `<li class="ln k-${l.kind}">${esc(l.t)}${l.fx.map(f => `<span class="fx${f.neg?' neg':''}">${esc(f.s)}</span>`).join('')}</li>`).join('')
  }</ul></li>`).join('');
  box.scrollTop = box.scrollHeight;
}
function renderChoice(){
  const el = $('choice');
  if (!P.alive){ el.innerHTML = summaryHTML(); bindSummary(); return; }
  const ch = P.pending;
  if (!ch){ el.innerHTML = ''; return; }
  el.innerHTML = `<div class="choice" role="group" aria-labelledby="chT"><p class="eyebrow">선택 · ${P.age}세</p><h3 id="chT">${esc(ch.title)}</h3><p>${esc(ch.desc)}</p><div class="opts">${
    ch.options.map((o,i) => `<button type="button" class="opt" data-i="${i}"${o.off?' disabled':''}>${esc(o.label)}<small>${esc(o.sub||'')}</small></button>`).join('')
  }</div></div>`;
  el.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
    choose(+b.dataset.i); render();
    if (resume > 0 && P.alive && !P.pending){ const n = resume; resume = 0; run(n); }   // 끝까지 살기 도중이었다면 이어서
  }));
}
function renderControls(){
  const blocked = busy || !P.alive || !!P.pending;
  $('b1').disabled = blocked || running;
  $('b5').disabled = blocked || running;
  $('bAll').disabled = busy || !P.alive || (!!P.pending && !running);
  $('bAll').textContent = running ? '멈추기' : '끝까지 살기';
}
function render(){ renderStatus(); renderLog(); renderChoice(); renderControls(); }

// ── 마지막 ─────────────────────────────────────
function lifeLine(){
  const h = P.happySum/Math.max(1,P.age);
  if (P.age<20) return '너무 일찍 끝난 삶이었다.';
  if (h>=70) return '돌아보면 행복한 날이 더 많은 삶이었다.';
  if (h<45) return '버티고 또 버틴 삶이었다.';
  if (P.kids.length>=2 && P.grandkids) return '자식과 손주를 남긴 삶이었다.';
  if (netWorth()>100000) return '남부럽지 않게 이룬 삶이었다.';
  return '평범해서 더 소중한 삶이었다.';
}
function summaryHTML(){
  const kv = (k, v) => `<div class="kv"><dt>${k}</dt><dd class="txt">${v}</dd></div>`;
  const fam = [P.spouse||P.divorces||P.flags.widow ? (P.divorces ? `이혼 ${P.divorces}번` : P.flags.widow ? '배우자와 사별' : '결혼') : '결혼하지 않음',
    P.kids.length ? `자녀 ${P.kids.length}명` : '자녀 없음', P.grandkids ? `손주 ${P.grandkids}명` : ''].filter(Boolean).join(' · ');
  return `<div class="summary"><p class="eyebrow">인생 성적표</p><h3>${esc(P.name)} · ${P.by}–${P.year}</h3>
    <p class="line">${lifeLine()}</p>
    <dl>${kv('마지막', `${P.cause}, 향년 ${P.age}세`)}${kv('학력', esc(P.edu||'정규 교육 이전'))}${kv('거쳐 간 일', esc(P.careers.join(' → ')||'없음'))}${
      P.maxInc ? kv('가장 많이 번 해', `연 ${won(P.maxInc)}`) : ''}${kv('가족', fam)}${kv('남긴 재산', won(netWorth()))}${
      kv('평균 행복', `${Math.round(P.happySum/Math.max(1,P.age))}점`)}${kv('태어난 조건', `같은 조건 ${fmtCount(birth.expected)}명`)}</dl>
    <div class="acts"><button type="button" id="again">다시 태어나기</button><button type="button" class="ghost" id="copyLife">요약 복사</button></div></div>`;
}
function bindSummary(){
  $('again').addEventListener('click', () => born(true));
  $('copyLife').addEventListener('click', () => {
    const text = `[5천만분의 1] ${P.by}년 ${P.region}에서 ${P.fa.job} 아버지와 ${P.mo.job} 어머니 사이에 태어난 ${P.name}. ${P.edu||''}${P.careers.length?`, ${P.careers.join('→')}`:''}. ${P.cause}${eu(P.cause)} ${P.age}세에 세상을 떠났다. "${lifeLine()}"`;
    const ok = () => $('toast').textContent = '요약을 복사했습니다.';
    const fail = () => $('toast').textContent = text;
    try { navigator.clipboard.writeText(text).then(ok, fail); } catch { fail(); }
  });
}

// ── 지난 인생 ───────────────────────────────────
const HKEY = '5000in1-lives';
let history = [];
try { history = JSON.parse(localStorage.getItem(HKEY)) || []; } catch {}
function pushHist(){
  history.unshift({t:`${P.name} · ${P.by}–${P.year} · ${P.careers.at(-1)||P.edu||'—'} · ${P.cause}`, a:P.age});
  history = history.slice(0,10);
  try { localStorage.setItem(HKEY, JSON.stringify(history)); } catch {}
  renderHist();
}
function renderHist(){
  $('hist').innerHTML = history.length
    ? history.map(h => `<li><span>${esc(h.t)}</span><span>${h.a}세</span></li>`).join('')
    : '<li><span class="empty">아직 끝난 인생이 없습니다. 끝까지 살면 여기에 남습니다.</span><span></span></li>';
}

// ── 흐름 ───────────────────────────────────────
async function born(animate){
  const my = ++token; running = false; resume = 0; busy = animate && !reduce;
  birth = newLife(mode);
  renderSheet(busy); render();
  const seal = $('seal'); seal.className = 'seal off'; $('verdict').innerHTML = ''; $('toast').textContent = '';
  let n = POP; setCount(n);
  if (busy){
    $('roll').disabled = true;
    const els = [...document.querySelectorAll('#rows .row')];
    for (let i=0;i<birth.rows.length;i++){
      if (my!==token) return;
      els[i].classList.remove('wait'); els[i].classList.add('flash');
      const next = n*birth.rows[i].p; await tween(n, next, 420, my); await sleep(90); n = next;
    }
    $('roll').disabled = false;
  }
  setCount(birth.expected); renderVerdict();
  seal.className = busy ? 'seal stamp' : 'seal';
  busy = false; renderControls();
}
function live(){ if (step()){ if (!P.alive) pushHist(); } }
async function run(limit){
  if (running){ running = false; renderControls(); return; }
  running = true; resume = 0; const my = token;
  let i = 0;
  for (; i<limit && running && my===token && P.alive && !P.pending; i++){
    live(); render();
    await sleep(reduce ? 0 : limit>5 ? 60 : 160);
  }
  if (running && P.pending && my===token) resume = limit - i;
  running = false; renderControls();
}

$('b1').addEventListener('click', () => { resume = 0; live(); render(); });
$('b5').addEventListener('click', () => run(5));
$('bAll').addEventListener('click', () => run(200));
$('roll').addEventListener('click', () => born(true));
function setMode(m){
  mode = m;
  $('modeNow').setAttribute('aria-pressed', m==='now'); $('modePast').setAttribute('aria-pressed', m==='past');
  try { localStorage.setItem('5000in1-mode', m); } catch {}
}
$('modeNow').addEventListener('click', () => { setMode('now'); born(true); });
$('modePast').addEventListener('click', () => { setMode('past'); born(true); });

setMode(mode);
renderHist();
born(false);
})();
