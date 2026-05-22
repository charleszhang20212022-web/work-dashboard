/* =====================================================================
   app.js — 16:9 단일화면 대시보드 메인 로직
   ===================================================================== */

let S = null;                 // 부트스트랩 상태
let socket = null;
let onlineIds = [];
let openModalId = null;
const chatState = { channel: '전체' };

/* ---- 무대 16:9 스케일링 ------------------------------------------ */
function fitStage() {
  const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  document.getElementById('stage').style.setProperty('--scale', s);
}
window.addEventListener('resize', fitStage);
fitStage();

/* ---- 공통 헬퍼 --------------------------------------------------- */
function api(method, path, body) {
  return fetch('/api' + path, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }).then(function (r) {
    if (r.status === 401) { location.href = '/login'; throw new Error('unauth'); }
    return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || '요청 실패'); return d; });
  });
}
function toast(msg, type) {
  const t = el('div', 'toast' + (type ? ' ' + type : ''), esc(msg));
  document.getElementById('toastRoot').appendChild(t);
  setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 300); }, 2600);
}
function avatarHTML(u, size) {
  const sz = size || 34;
  const bg = u && u.colors ? 'linear-gradient(135deg,' + u.colors[0] + ',' + u.colors[1] + ')' : 'linear-gradient(135deg,#818cf8,#6366f1)';
  return '<div class="avatar" style="width:' + sz + 'px;height:' + sz + 'px;font-size:' + (sz * 0.42) + 'px;background:' + bg + '">' + esc((u && u.initial) || '?') + '</div>';
}
function userById(id) { return (S.users || []).find(function (u) { return u.id === id; }); }
function isManager() { return S.me.role === 'admin' || S.me.role === 'leader'; }
function timeHM(iso) { const d = new Date(iso); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
function relTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return '방금'; if (diff < 60) return Math.floor(diff) + '분 전';
  if (diff < 1440) return Math.floor(diff / 60) + '시간 전'; return Math.floor(diff / 1440) + '일 전';
}

/* =====================================================================
   부팅
   ===================================================================== */
api('GET', '/bootstrap').then(function (data) {
  S = data;
  chatState.channel = S.channels[0] || '전체';
  renderBar();
  buildDeck();
  connectSocket();
}).catch(function (e) { if (e.message !== 'unauth') console.error(e); });

function renderBar() {
  document.getElementById('barSub').textContent = S.company;
  document.getElementById('meName').textContent = S.me.name;
  document.getElementById('meRole').textContent = ({ admin: '관리자', leader: '팀장', member: '팀원' })[S.me.role] + ' · ' + (S.me.dept || '');
  document.getElementById('meAvatar').outerHTML = avatarHTML(S.me, 34).replace('class="avatar"', 'class="avatar" id="meAvatar"');
  document.getElementById('logoutBtn').innerHTML = icon('logout');
  document.getElementById('logoutBtn').onclick = function () {
    api('POST', '/logout', {}).then(function () { location.href = '/login'; });
  };
  document.getElementById('meBtn').onclick = function () { openModal('admin'); };
  const now = new Date();
  const wd = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];
  document.getElementById('dateChip').innerHTML = icon('calendar') + now.getFullYear() + '. ' + (now.getMonth() + 1) + '. ' + now.getDate() + '. (' + wd + ')';
}

/* =====================================================================
   카드 정의 (12개)
   ===================================================================== */
const CARDS = [
  { id: 'team',      title: '팀 현황',     sub: '팀원 · 접속',       icon: 'users',   cls: 'sky' },
  { id: 'tasks',     title: '업무 분장',   sub: '담당 · 진행',       icon: 'tasks',   cls: '' },
  { id: 'chat',      title: '업무 SNS 채팅', sub: '실시간 메신저',   icon: 'chat',    cls: 'vio' },
  { id: 'postit',    title: '포스트잇',    sub: '공유 메모',         icon: 'note',    cls: 'amb' },
  { id: 'daily',     title: '일일 결산',   sub: '오늘 실적',         icon: 'revenue', cls: 'emr' },
  { id: 'weekly',    title: '주간 결산',   sub: '최근 7일',          icon: 'trend',   cls: 'sky' },
  { id: 'monthly',   title: '월간 결산',   sub: '최근 12개월',       icon: 'chart',   cls: '' },
  { id: 'quarterly', title: '분기 결산',   sub: '분기별 실적',       icon: 'bars',    cls: 'vio' },
  { id: 'annual',    title: '연간 결산',   sub: '연도별 추이',       icon: 'layers',  cls: 'emr' },
  { id: 'analytics', title: '결산 분석',   sub: '업무 분포 · 인사이트', icon: 'pie',  cls: 'amb' },
  { id: 'mail',      title: '자동 메일',   sub: '일일 결산 발송',     icon: 'mail',    cls: 'ros' },
  { id: 'admin',     title: '관리자',      sub: '권한 · 내 정보',     icon: 'shield',  cls: 'gray' }
];

function buildDeck() {
  const deck = document.getElementById('deck');
  deck.innerHTML = '';
  CARDS.forEach(function (c) {
    const card = el('div', 'dcard');
    card.dataset.id = c.id;
    card.innerHTML =
      '<div class="dc-head"><div class="dc-ico ' + c.cls + '">' + icon(c.icon) + '</div>'
      + '<div class="dc-title">' + c.title + '<small>' + c.sub + '</small></div></div>'
      + '<div class="dc-body"></div>'
      + '<div class="dc-foot"><span class="dc-hint"></span><span class="dc-open">자세히 ›</span></div>';
    card.onclick = function () { openModal(c.id); };
    deck.appendChild(card);
    renderCard(c.id);
  });
}

function renderCard(id) {
  const card = document.querySelector('.dcard[data-id="' + id + '"]');
  if (!card) return;
  const body = card.querySelector('.dc-body');
  const hint = card.querySelector('.dc-hint');
  body.innerHTML = '';
  (CARD_RENDER[id] || function () {})(body, hint);
}

/* ---- 카드 본문 렌더러 ------------------------------------------- */
const CARD_RENDER = {
  team: function (b, hint) {
    const users = S.users;
    const onCount = onlineIds.length;
    const top = users.slice(0, 5);
    let stack = '<div class="av-stack">';
    top.forEach(function (u) { stack += avatarHTML(u, 30); });
    if (users.length > 5) stack += '<div class="av-more">+' + (users.length - 5) + '</div>';
    stack += '</div>';
    b.innerHTML = '<div class="metric">' + users.length + '<span class="u">명</span></div>'
      + '<div class="metric-sub" style="margin-bottom:9px">접속 중 <b style="color:#16a34a">' + onCount + '명</b> · 팀장 '
      + users.filter(function (u) { return u.role === 'leader'; }).length + '명</div>' + stack;
    hint.textContent = '구성원 관리';
  },
  tasks: function (b, hint) {
    const counts = { '완료': 0, '진행 중': 0, '대기': 0, '지연': 0 };
    S.tasks.forEach(function (t) { if (counts[t.status] != null) counts[t.status]++; });
    const mine = S.tasks.filter(function (t) { return t.assigneeId === S.me.id; }).length;
    b.innerHTML = '<div class="metric">' + S.tasks.length + '<span class="u">건</span></div>'
      + '<div class="metric-sub" style="margin-bottom:9px">내 업무 <b style="color:var(--primary)">' + mine + '건</b></div>'
      + '<div style="display:flex;gap:5px;flex-wrap:wrap">'
      + statusBadge('진행 중').replace('진행 중', '진행 ' + counts['진행 중'])
      + statusBadge('완료').replace('완료', '완료 ' + counts['완료'])
      + statusBadge('지연').replace('지연', '지연 ' + counts['지연']) + '</div>';
    hint.textContent = isManager() ? '분장 · 편집' : '내 업무';
  },
  chat: function (b, hint) {
    const recent = S.chat.slice(-3);
    let h = '<div class="chat-prev">';
    if (!recent.length) h += '<div class="empty" style="padding:10px 0">대화가 없습니다</div>';
    recent.forEach(function (m) {
      h += '<div class="cp-line">' + avatarHTML(m, 22) + '<div class="tx"><b>' + esc(m.name) + '</b> ' + esc(m.text) + '</div></div>';
    });
    h += '</div>';
    b.innerHTML = h;
    hint.textContent = S.chat.length + '개 메시지';
  },
  postit: function (b, hint) {
    const top = S.postits.slice(0, 2);
    let h = '<div class="metric" style="font-size:22px">' + S.postits.length + '<span class="u">개</span></div><div class="pi-prev" style="margin-top:8px">';
    if (!top.length) h += '<div class="empty" style="padding:6px 0">메모 없음</div>';
    top.forEach(function (p) { h += '<div class="pi-mini" style="background:' + p.color + '">' + esc(p.text) + '</div>'; });
    h += '</div>';
    b.innerHTML = h;
    hint.textContent = '메모 추가';
  },
  daily: function (b, hint) {
    const d = S.analytics.daily;
    b.innerHTML = '<div class="metric" style="font-size:24px">' + (d.summary['매출'] || '-') + '</div>'
      + '<div class="metric-sub">완료 ' + (d.summary['완료업무'] || '-') + ' · 신규 ' + (d.summary['신규고객'] || '-') + '</div>'
      + '<div class="mini-chart"></div>';
    buildLineChart(b.querySelector('.mini-chart'), d.points, { mini: true, W: 320, H: 96, color: '#10b981', unit: d.unit });
    hint.textContent = '오늘';
  },
  weekly: function (b, hint) {
    const d = S.analytics.weekly;
    const sum = d.points.reduce(function (a, p) { return a + p.y; }, 0);
    b.innerHTML = '<div class="metric" style="font-size:22px">' + formatNum(sum) + '<span class="u">' + d.unit + '</span></div><div class="mini-chart"></div>';
    buildLineChart(b.querySelector('.mini-chart'), d.points, { mini: true, W: 320, H: 100, color: '#0ea5e9', unit: d.unit });
    hint.textContent = '7일 합계';
  },
  monthly: function (b, hint) {
    const d = S.analytics.monthly;
    b.innerHTML = '<div class="mini-chart"></div>';
    buildLineChart(b.querySelector('.mini-chart'), d.points, { mini: true, W: 320, H: 118, color: '#6366f1', unit: d.unit });
    hint.textContent = '월별 매출';
  },
  quarterly: function (b, hint) {
    const d = S.analytics.quarterly;
    b.innerHTML = '<div class="mini-chart"></div>';
    buildBarChart(b.querySelector('.mini-chart'), d.groups, d.series, { mini: true, W: 320, H: 118, unit: d.unit });
    hint.textContent = '매출 · 이익';
  },
  annual: function (b, hint) {
    const d = S.analytics.annual;
    b.innerHTML = '<div class="mini-chart"></div>';
    buildLineChart(b.querySelector('.mini-chart'), d.points, { mini: true, W: 320, H: 118, color: '#10b981', unit: d.unit });
    hint.textContent = '연도별';
  },
  analytics: function (b, hint) {
    b.innerHTML = '<div class="mini-donut"></div>';
    const wrap = b.querySelector('.mini-donut');
    wrap.style.transform = 'scale(.86)';
    buildDonut(wrap, S.analytics.taskStatus, { size: 130, legend: false, centerLabel: '업무', unit: '건' });
    hint.textContent = '업무 분포';
  },
  mail: function (b, hint) {
    const m = S.mail;
    const modeTxt = { gmail: 'Gmail 연동', smtp: 'SMTP 연동', disabled: '시뮬레이션' }[m.mode] || m.mode;
    b.innerHTML = '<div class="mail-state">'
      + '<div class="ms-row"><span class="k">자동 발송</span><span class="v" style="color:' + (m.enabled ? '#16a34a' : '#dc2626') + '">' + (m.enabled ? 'ON · ' + m.time : 'OFF') + '</span></div>'
      + '<div class="ms-row"><span class="k">발송 모드</span><span class="v">' + modeTxt + '</span></div>'
      + '<div class="ms-row"><span class="k">최근 발송</span><span class="v">' + (m.lastSentAt ? relTime(m.lastSentAt) : '없음') + '</span></div>'
      + '</div>';
    hint.textContent = '메일 설정';
  },
  admin: function (b, hint) {
    if (S.me.role === 'admin') {
      b.innerHTML = '<div class="metric" style="font-size:22px">' + S.users.length + '<span class="u">명</span></div>'
        + '<div class="metric-sub">권한 관리 · 업무 공유</div>'
        + '<div style="margin-top:8px;display:flex;gap:5px">' + roleBadge('admin') + roleBadge('leader') + roleBadge('member') + '</div>';
      hint.textContent = '권한 설정';
    } else {
      b.innerHTML = '<div style="display:flex;align-items:center;gap:10px">' + avatarHTML(S.me, 40)
        + '<div><div style="font-weight:800">' + esc(S.me.name) + '</div><div style="font-size:11.5px;color:var(--text-faint)">' + esc(S.me.title || '') + '</div></div></div>'
        + '<div style="margin-top:9px">' + roleBadge(S.me.role) + '</div>';
      hint.textContent = '내 정보';
    }
  }
};

/* =====================================================================
   모달 시스템
   ===================================================================== */
function openModal(id) {
  const c = CARDS.find(function (x) { return x.id === id; });
  if (!c) return;
  openModalId = id;
  const root = document.getElementById('modalRoot');
  const sizeCls = (id === 'chat' || id === 'tasks' || id === 'admin') ? ' lg' : '';
  root.innerHTML =
    '<div class="modal-backdrop" id="mbd"><div class="modal' + sizeCls + '">'
    + '<div class="modal-head"><div class="dc-ico ' + c.cls + '">' + icon(c.icon) + '</div>'
    + '<div style="flex:1"><h2>' + c.title + '</h2><div class="sub">' + c.sub + '</div></div>'
    + '<button class="icon-btn" id="mClose" style="background:#eef0f4;color:#5b6273">' + icon('close') + '</button></div>'
    + '<div class="modal-body" id="mBody"></div>'
    + '<div class="modal-foot" id="mFoot" style="display:none"></div></div></div>';
  const bd = document.getElementById('mbd');
  requestAnimationFrame(function () { bd.classList.add('show'); });
  bd.onclick = function (e) { if (e.target === bd) closeModal(); };
  document.getElementById('mClose').onclick = closeModal;
  document.addEventListener('keydown', escClose);
  renderModalBody(id);
}
function escClose(e) { if (e.key === 'Escape') closeModal(); }
function closeModal() {
  openModalId = null;
  document.removeEventListener('keydown', escClose);
  const bd = document.getElementById('mbd');
  if (bd) { bd.classList.remove('show'); setTimeout(function () { document.getElementById('modalRoot').innerHTML = ''; }, 180); }
}
function renderModalBody(id) {
  if (openModalId !== id) return;
  const body = document.getElementById('mBody');
  if (!body) return;
  (MODAL_RENDER[id] || function (b) { b.innerHTML = '준비 중입니다.'; })(body);
}
function setFoot(html) {
  const f = document.getElementById('mFoot');
  if (!f) return;
  if (html) { f.innerHTML = html; f.style.display = 'flex'; } else { f.style.display = 'none'; }
}

/* =====================================================================
   모달 본문 렌더러
   ===================================================================== */
const MODAL_RENDER = {
  /* ---- 팀 현황 ---- */
  team: function (b) {
    let rows = S.users.map(function (u) {
      const on = onlineIds.indexOf(u.id) !== -1;
      return '<tr><td><div class="cell-person">' + posAvatar(u) + '<div><div style="font-weight:600">' + esc(u.name)
        + '</div><div style="font-size:11px;color:var(--text-faint)">' + esc(u.title || '') + '</div></div></div></td>'
        + '<td>' + roleBadge(u.role) + '</td><td>' + esc(u.dept || '-') + '</td>'
        + '<td><span class="badge ' + (on ? 'done' : 'p-low') + '"><span class="bdot" style="background:currentColor"></span>'
        + (on ? '접속 중' : '오프라인') + '</span></td></tr>';
    }).join('');
    b.innerHTML = '<div class="card"><div class="card-head"><div><h3>팀 구성원</h3><div class="desc">총 '
      + S.users.length + '명 · 접속 ' + onlineIds.length + '명</div></div></div>'
      + '<table class="data"><thead><tr><th>이름</th><th>권한</th><th>부서</th><th>상태</th></tr></thead><tbody>'
      + rows + '</tbody></table></div>';
  },

  /* ---- 업무 분장 ---- */
  tasks: function (b) {
    const manager = isManager();
    let h = '';
    if (manager) {
      h += '<div class="card" style="margin-bottom:16px"><div class="card-head"><div><h3>새 업무 분장</h3><div class="desc">담당자에게 업무를 지정하고 공유합니다</div></div></div>'
        + '<div class="form-row" style="margin-bottom:10px"><div style="flex:2"><label class="lbl">업무 제목</label><input class="inp" id="ntTitle" placeholder="예: 6월 매출 보고서 작성"></div>'
        + '<div><label class="lbl">담당자</label><select class="inp" id="ntAssignee">' + S.users.map(function (u) { return '<option value="' + u.id + '">' + esc(u.name) + ' (' + esc(u.dept) + ')</option>'; }).join('') + '</select></div></div>'
        + '<div class="form-row"><div><label class="lbl">우선순위</label><select class="inp" id="ntPriority"><option>보통</option><option>높음</option><option>낮음</option></select></div>'
        + '<div><label class="lbl">마감일</label><input class="inp" type="date" id="ntDue"></div>'
        + '<div style="display:flex;align-items:flex-end"><button class="btn primary" id="ntAdd" style="width:100%">' + icon('plus') + '업무 등록</button></div></div></div>';
    }
    h += '<div class="card"><div class="card-head"><div><h3>업무 목록</h3><div class="desc">' + (manager ? '전체 업무 · 담당자 재지정 가능' : '내 업무는 상태·진행률을 직접 변경할 수 있습니다') + '</div></div></div>'
      + '<table class="data"><thead><tr><th>업무</th><th>담당</th><th>상태</th><th>진행률</th><th>마감</th>' + (manager ? '<th></th>' : '') + '</tr></thead><tbody id="taskRows"></tbody></table></div>';
    b.innerHTML = h;
    renderTaskRows();
    if (manager) {
      document.getElementById('ntAdd').onclick = function () {
        const title = document.getElementById('ntTitle').value.trim();
        if (!title) return toast('업무 제목을 입력하세요', 'err');
        api('POST', '/tasks', {
          title: title, assigneeId: document.getElementById('ntAssignee').value,
          priority: document.getElementById('ntPriority').value, due: document.getElementById('ntDue').value, status: '대기'
        }).then(function () { toast('업무를 등록했습니다', 'ok'); document.getElementById('ntTitle').value = ''; });
      };
    }
  },

  /* ---- 채팅 ---- */
  chat: function (b) {
    let chans = S.channels.map(function (ch) {
      return '<div class="chan' + (ch === chatState.channel ? ' active' : '') + '" data-ch="' + esc(ch) + '"><span class="hash">#</span>' + esc(ch) + '</div>';
    }).join('');
    b.innerHTML = '<div class="chat-layout"><div class="chat-channels">' + chans + '</div>'
      + '<div class="chat-main"><div class="chat-msgs" id="chatMsgs"></div><div class="typing" id="typing"></div>'
      + '<div class="chat-input"><input id="chatInput" placeholder="# ' + esc(chatState.channel) + ' 에 메시지 보내기..." autocomplete="off">'
      + '<button class="chat-send" id="chatSend">' + icon('send') + '</button></div></div></div>';
    b.querySelectorAll('.chan').forEach(function (c) {
      c.onclick = function () { chatState.channel = c.dataset.ch; renderModalBody('chat'); };
    });
    renderChatMsgs();
    const input = document.getElementById('chatInput');
    const send = function () {
      const text = input.value.trim(); if (!text) return;
      socket.emit('chat:send', { channel: chatState.channel, text: text });
      input.value = ''; input.focus();
    };
    document.getElementById('chatSend').onclick = send;
    input.onkeydown = function (e) { if (e.key === 'Enter') send(); else socket.emit('chat:typing', { channel: chatState.channel }); };
    input.focus();
  },

  /* ---- 포스트잇 ---- */
  postit: function (b) {
    b.innerHTML = '<div class="postit-grid" id="piGrid"></div>';
    renderPostits();
  },

  /* ---- 결산 (일/주/월/분기/연) ---- */
  daily: function (b) { settlementModal(b, 'daily'); },
  weekly: function (b) { settlementModal(b, 'weekly'); },
  monthly: function (b) { settlementModal(b, 'monthly'); },
  quarterly: function (b) { settlementModal(b, 'quarterly'); },
  annual: function (b) { settlementModal(b, 'annual'); },

  /* ---- 결산 분석 ---- */
  analytics: function (b) {
    const a = S.analytics;
    b.innerHTML = '<div class="grid c2"><div class="card"><div class="card-head"><div><h3>업무 진행 분포</h3><div class="desc">전체 업무 상태</div></div></div><div id="anDonut"></div></div>'
      + '<div class="card"><div class="card-head"><div><h3>매출 채널 비중</h3><div class="desc">채널별 매출 기여도</div></div></div><div id="anChannel"></div></div></div>'
      + '<div class="card" style="margin-top:16px"><div class="card-head"><div><h3>부서별 목표 달성률</h3><div class="desc">목표 100% 기준</div></div></div><div id="anDept"></div></div>'
      + '<div class="card" style="margin-top:16px"><div class="card-head"><div><h3>핵심 인사이트</h3></div></div><div id="anInsight"></div></div>';
    buildDonut(document.getElementById('anDonut'), a.taskStatus, { centerLabel: '업무', unit: '건' });
    buildDonut(document.getElementById('anChannel'), a.channels.map(function (c) { return { label: c.name, value: c.value, color: c.color }; }), { unit: '%', centerValue: '100%', centerLabel: '합계' });
    buildHBars(document.getElementById('anDept'), a.departments.map(function (d) {
      return { name: d.name, value: d.achievement, max: 120, display: d.achievement + '%', color: d.achievement >= 100 ? '#10b981' : (d.achievement >= 90 ? '#6366f1' : '#f59e0b') };
    }));
    document.getElementById('anInsight').innerHTML = a.insights.map(function (t, i) {
      return '<div class="insight-item"><div class="insight-num">' + (i + 1) + '</div><div>' + esc(t) + '</div></div>';
    }).join('');
  },

  /* ---- 자동 메일 ---- */
  mail: function (b) {
    const m = S.mail;
    const admin = S.me.role === 'admin';
    const modeTxt = { gmail: 'Gmail SMTP 연동됨', smtp: '커스텀 SMTP 연동됨', disabled: '시뮬레이션 모드 (자격증명 미설정)' }[m.mode];
    b.innerHTML =
      '<div class="card"><div class="card-head"><div><h3>일일 결산 자동 메일</h3><div class="desc">매일 지정 시각에 결산 리포트를 자동 발송합니다 (보너스 기능)</div></div></div>'
      + '<div class="ms-row" style="margin-bottom:12px"><span class="k">현재 상태</span><span class="badge ' + (m.mode === 'disabled' ? 'wait' : 'done') + '">' + modeTxt + '</span></div>'
      + '<div class="form-row" style="align-items:center;margin-bottom:14px"><div style="flex:none;display:flex;align-items:center;gap:10px"><span class="lbl" style="margin:0">자동 발송</span><div class="toggle ' + (m.enabled ? 'on' : '') + '" id="mailToggle"></div></div>'
      + '<div><label class="lbl">발송 시각</label><input class="inp" type="time" id="mailTime" value="' + (m.time || '18:00') + '" ' + (admin ? '' : 'disabled') + '></div></div>'
      + '<label class="lbl">수신자 메일 (쉼표로 구분)</label><input class="inp" id="mailTo" placeholder="team@example.com, ceo@example.com" value="' + (m.recipients || []).join(', ') + '" ' + (admin ? '' : 'disabled') + '>'
      + '<div class="ms-row" style="margin-top:12px"><span class="k">최근 발송</span><span class="v">' + (m.lastSentAt ? new Date(m.lastSentAt).toLocaleString('ko-KR') + ' · ' + (m.lastStatus || '') : '없음') + '</span></div>'
      + '</div>';
    if (admin) {
      setFoot('<button class="btn" id="mailSave">설정 저장</button><button class="btn primary" id="mailSend">' + icon('send') + '지금 발송</button>');
      const tg = document.getElementById('mailToggle');
      tg.onclick = function () { tg.classList.toggle('on'); };
      document.getElementById('mailSave').onclick = function () {
        api('PATCH', '/mail/settings', {
          enabled: tg.classList.contains('on'), time: document.getElementById('mailTime').value,
          recipients: document.getElementById('mailTo').value
        }).then(function () { toast('메일 설정을 저장했습니다', 'ok'); });
      };
      document.getElementById('mailSend').onclick = function () {
        const btn = document.getElementById('mailSend'); btn.disabled = true; btn.textContent = '발송 중...';
        api('POST', '/mail/send', {}).then(function (r) {
          toast(r.ok ? (r.simulated ? '시뮬레이션 발송 완료 (자격증명 설정 시 실제 발송)' : '메일을 발송했습니다') : r.message, r.ok ? 'ok' : 'err');
        }).finally(function () { renderModalBody('mail'); });
      };
    } else {
      setFoot('');
    }
  },

  /* ---- 관리자 / 내 정보 ---- */
  admin: function (b) {
    if (S.me.role !== 'admin') {
      b.innerHTML = '<div class="card"><div class="card-head"><div><h3>내 정보</h3></div></div>'
        + '<div style="display:flex;align-items:center;gap:14px">' + posAvatar(S.me, 56)
        + '<div><div style="font-size:17px;font-weight:800">' + esc(S.me.name) + '</div>'
        + '<div style="color:var(--text-faint)">' + esc(S.me.title || '') + ' · ' + esc(S.me.dept || '') + '</div>'
        + '<div style="margin-top:6px">' + roleBadge(S.me.role) + '</div></div></div></div>';
      setFoot('');
      return;
    }
    let rows = S.users.map(function (u) {
      return '<tr><td><div class="cell-person">' + posAvatar(u) + '<span style="font-weight:600">' + esc(u.name) + '</span></div></td>'
        + '<td><select class="inp sm" data-uid="' + u.id + '" data-f="role"><option value="member"' + (u.role === 'member' ? ' selected' : '') + '>팀원</option>'
        + '<option value="leader"' + (u.role === 'leader' ? ' selected' : '') + '>팀장</option>'
        + '<option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>관리자</option></select></td>'
        + '<td><input class="inp sm" data-uid="' + u.id + '" data-f="dept" value="' + esc(u.dept || '') + '" style="width:120px"></td>'
        + '<td><input class="inp sm" data-uid="' + u.id + '" data-f="title" value="' + esc(u.title || '') + '" style="width:150px"></td></tr>';
    }).join('');
    b.innerHTML = '<div class="card"><div class="card-head"><div><h3>구성원 권한 · 업무 분장 관리</h3><div class="desc">권한(관리자/팀장/팀원), 부서, 직책을 변경하면 즉시 공유됩니다</div></div></div>'
      + '<table class="data"><thead><tr><th>이름</th><th>권한</th><th>부서</th><th>직책</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    b.querySelectorAll('select[data-uid], input[data-uid]').forEach(function (ctrl) {
      ctrl.onchange = function () {
        const uid = ctrl.dataset.uid, f = ctrl.dataset.f, payload = {};
        payload[f] = ctrl.value;
        api('PATCH', '/users/' + uid, payload).then(function () { toast('변경 사항을 저장했습니다', 'ok'); });
      };
    });
    setFoot('');
  }
};

/* ---- 결산 모달 공통 ---- */
function settlementModal(b, period) {
  const a = S.analytics, d = a[period];
  const titleMap = { daily: '오늘의 시간대별 추이', weekly: '최근 7일 매출', monthly: '최근 12개월 매출', quarterly: '분기별 매출·이익', annual: '연도별 매출 추이' };
  let summaryHTML = '';
  if (period === 'daily' && d.summary) {
    summaryHTML = '<div class="quad" style="margin-bottom:16px">' + Object.keys(d.summary).map(function (k) {
      return '<div class="q"><div class="ql">' + k + '</div><div class="qv">' + d.summary[k] + '</div></div>';
    }).join('') + '</div>';
  }
  b.innerHTML = summaryHTML + '<div class="card"><div class="card-head"><div><h3>' + titleMap[period] + '</h3><div class="desc">' + d.label + ' · 단위 ' + d.unit + '</div></div></div><div id="setChart"></div></div>'
    + '<div class="grid c2" style="margin-top:16px"><div class="card"><div class="card-head"><div><h3>업무 진행 현황</h3></div></div><div id="setDonut"></div></div>'
    + '<div class="card"><div class="card-head"><div><h3>핵심 인사이트</h3></div></div><div id="setInsight"></div></div></div>';
  const chart = document.getElementById('setChart');
  if (period === 'quarterly') buildBarChart(chart, d.groups, d.series, { unit: d.unit });
  else buildLineChart(chart, d.points, { color: period === 'annual' || period === 'daily' ? '#10b981' : (period === 'weekly' ? '#0ea5e9' : '#6366f1'), unit: d.unit });
  buildDonut(document.getElementById('setDonut'), a.taskStatus, { centerLabel: '업무', unit: '건' });
  document.getElementById('setInsight').innerHTML = a.insights.slice(0, 3).map(function (t, i) {
    return '<div class="insight-item"><div class="insight-num">' + (i + 1) + '</div><div>' + esc(t) + '</div></div>';
  }).join('');
}

function posAvatar(u, size) {
  return '<div style="position:relative">' + avatarHTML(u, size || 34)
    + '<span class="on-dot ' + (onlineIds.indexOf(u.id) !== -1 ? 'on' : '') + '"></span></div>';
}

/* ---- 업무 행 렌더 ---- */
function renderTaskRows() {
  const tb = document.getElementById('taskRows');
  if (!tb) return;
  const manager = isManager();
  tb.innerHTML = S.tasks.map(function (t) {
    const u = userById(t.assigneeId);
    const canEdit = manager || t.assigneeId === S.me.id;
    const statusSel = canEdit
      ? '<select class="inp sm tk-status" data-id="' + t.id + '" style="width:92px">' + ['대기', '진행 중', '완료', '지연'].map(function (s) { return '<option' + (s === t.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>'
      : statusBadge(t.status);
    return '<tr><td><div style="font-weight:600">' + esc(t.title) + '</div><div style="font-size:11px;color:var(--text-faint)">' + esc(t.dept) + ' · ' + priorityBadge(t.priority) + '</div></td>'
      + '<td><div class="cell-person">' + (u ? avatarHTML(u, 26) : '') + esc(t.assignee || '미지정') + '</div></td>'
      + '<td>' + statusSel + '</td>'
      + '<td style="min-width:120px">' + (canEdit ? '<input type="range" min="0" max="100" value="' + t.progress + '" class="tk-prog" data-id="' + t.id + '" style="width:80px"> <b style="font-size:11px">' + t.progress + '%</b>' : progressBar(t.progress)) + '</td>'
      + '<td style="font-size:12px;color:var(--text-soft)">' + esc(t.due || '-') + '</td>'
      + (manager ? '<td><button class="btn sm danger tk-del" data-id="' + t.id + '">' + icon('trash') + '</button></td>' : '') + '</tr>';
  }).join('');
  if (manager) tb.querySelectorAll('.tk-del').forEach(function (btn) {
    btn.onclick = function () { api('DELETE', '/tasks/' + btn.dataset.id).then(function () { toast('업무를 삭제했습니다', 'ok'); }); };
  });
  tb.querySelectorAll('.tk-status').forEach(function (sel) {
    sel.onchange = function () { api('PATCH', '/tasks/' + sel.dataset.id, { status: sel.value }).then(function () { toast('상태를 변경했습니다', 'ok'); }); };
  });
  tb.querySelectorAll('.tk-prog').forEach(function (rg) {
    rg.oninput = function () { rg.nextElementSibling.textContent = rg.value + '%'; };
    rg.onchange = function () { api('PATCH', '/tasks/' + rg.dataset.id, { progress: Number(rg.value) }).then(function () { toast('진행률을 변경했습니다', 'ok'); }); };
  });
}

/* ---- 채팅 메시지 렌더 ---- */
function renderChatMsgs() {
  const box = document.getElementById('chatMsgs');
  if (!box) return;
  const list = S.chat.filter(function (m) { return chatState.channel === '전체' || m.channel === chatState.channel; });
  box.innerHTML = list.map(function (m) {
    const mine = m.userId === S.me.id;
    return '<div class="msg' + (mine ? ' mine' : '') + '">' + avatarHTML(m, 34)
      + '<div class="bub"><div class="who">' + esc(m.name) + '<span>' + esc(m.channel) + ' · ' + timeHM(m.ts) + '</span></div><div class="tx">' + esc(m.text) + '</div></div></div>';
  }).join('') || '<div class="empty">아직 대화가 없습니다. 첫 메시지를 보내보세요!</div>';
  box.scrollTop = box.scrollHeight;
}

/* ---- 포스트잇 렌더 ---- */
function renderPostits() {
  const grid = document.getElementById('piGrid');
  if (!grid) return;
  const COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa', '#e9d5ff'];
  let h = '<div class="postit-add" id="piAdd">' + icon('plus') + '<span>메모 추가</span></div>';
  h += S.postits.map(function (p, i) {
    const canDel = p.userId === S.me.id || S.me.role === 'admin';
    return '<div class="postit" style="background:' + p.color + ';--rot:' + ((i % 3 - 1) * 1.4) + 'deg">'
      + (canDel ? '<button class="pi-del" data-id="' + p.id + '">' + icon('trash') + '</button>' : '')
      + esc(p.text) + '<div class="pi-name">— ' + esc(p.name) + '</div></div>';
  }).join('');
  grid.innerHTML = h;
  document.getElementById('piAdd').onclick = function () { openPostitComposer(COLORS); };
  grid.querySelectorAll('.pi-del').forEach(function (btn) {
    btn.onclick = function () { api('DELETE', '/postits/' + btn.dataset.id).then(function () { toast('메모를 삭제했습니다', 'ok'); }); };
  });
}
function openPostitComposer(COLORS) {
  let sel = COLORS[0];
  const grid = document.getElementById('piGrid');
  const box = el('div', '', '<textarea class="inp" id="piText" placeholder="메모 내용을 입력하세요..." style="min-height:90px"></textarea>'
    + '<div class="color-dots">' + COLORS.map(function (c, i) { return '<div class="color-dot' + (i === 0 ? ' sel' : '') + '" data-c="' + c + '" style="background:' + c + '"></div>'; }).join('') + '</div>'
    + '<button class="btn primary" id="piSave" style="width:100%">메모 저장</button>');
  box.style.cssText = 'grid-column:1/-1;background:#fff;border:1px solid var(--border);border-radius:12px;padding:14px';
  grid.prepend(box);
  box.querySelectorAll('.color-dot').forEach(function (d) {
    d.onclick = function () { box.querySelectorAll('.color-dot').forEach(function (x) { x.classList.remove('sel'); }); d.classList.add('sel'); sel = d.dataset.c; };
  });
  document.getElementById('piText').focus();
  document.getElementById('piSave').onclick = function () {
    const text = document.getElementById('piText').value.trim();
    if (!text) return toast('내용을 입력하세요', 'err');
    api('POST', '/postits', { text: text, color: sel }).then(function () { toast('메모를 추가했습니다', 'ok'); });
  };
}

/* =====================================================================
   Socket.io 실시간
   ===================================================================== */
function connectSocket() {
  socket = io();
  socket.on('chat:new', function (m) {
    S.chat.push(m); if (S.chat.length > 500) S.chat = S.chat.slice(-500);
    renderCard('chat');
    if (openModalId === 'chat') renderChatMsgs();
  });
  socket.on('chat:typing', function (d) {
    if (openModalId !== 'chat') return;
    const t = document.getElementById('typing');
    if (!t || (chatState.channel !== '전체' && d.channel !== chatState.channel)) return;
    t.textContent = d.name + ' 님이 입력 중...';
    clearTimeout(t._timer); t._timer = setTimeout(function () { t.textContent = ''; }, 1500);
  });
  socket.on('presence:update', function (ids) {
    onlineIds = ids || [];
    document.getElementById('onlineCount').textContent = onlineIds.length;
    renderCard('team');
    if (openModalId === 'team') renderModalBody('team');
  });
  socket.on('tasks:update', function () {
    api('GET', '/tasks').then(function (t) { S.tasks = t; renderCard('tasks'); renderCard('analytics'); if (openModalId === 'tasks') renderTaskRows(); });
  });
  socket.on('postits:update', function () {
    api('GET', '/postits').then(function (p) { S.postits = p; renderCard('postit'); if (openModalId === 'postit') renderPostits(); });
  });
  socket.on('users:update', function () {
    api('GET', '/users').then(function (u) { S.users = u; renderCard('team'); renderCard('admin'); if (openModalId === 'admin' || openModalId === 'team') renderModalBody(openModalId); });
  });
  socket.on('mail:update', function () {
    api('GET', '/mail/status').then(function (m) { S.mail = m; renderCard('mail'); });
  });
}
