/* =====================================================================
   app.js — 페이지별 초기화 로직
   ---------------------------------------------------------------------
   body 의 data-page 속성을 읽어 해당 페이지의 화면을 구성합니다.
     · overview  → index.html
     · tasks     → tasks.html
     · projects  → projects.html
     · reports   → reports.html
   ===================================================================== */

const D = DASHBOARD_DATA;

/* KPI 색상 팔레트 [강조색, 배경색] */
const KPI_COLOR = {
  indigo:  ['#6366f1', '#eef2ff'],
  sky:     ['#0ea5e9', '#e0f2fe'],
  emerald: ['#10b981', '#d1fae5'],
  amber:   ['#f59e0b', '#fef3c7']
};

/* 활동 피드 유형별 [아이콘, 강조색, 배경색] */
const FEED_STYLE = {
  check:    ['check',    '#10b981', '#d1fae5'],
  comment:  ['comment',  '#0ea5e9', '#e0f2fe'],
  progress: ['progress', '#6366f1', '#eef2ff'],
  add:      ['userAdd',  '#6366f1', '#eef2ff'],
  alert:    ['alert',    '#ef4444', '#fee2e2'],
  user:     ['user',     '#0ea5e9', '#e0f2fe']
};

/* ---- 공통 포맷 헬퍼 ------------------------------------------------ */
function fmtDate(iso)  { return iso.replace(/-/g, '.'); }
function fmtMD(iso)    { const p = iso.split('-'); return p[1] + '.' + p[2]; }
function manwonToEok(v){ return (v / 10000).toFixed(1); }   // 만원 → 억

/* ---- 리치 KPI 카드 ------------------------------------------------- */
function renderKpis(container) {
  D.kpis.forEach(function (k) {
    const cc = KPI_COLOR[k.color] || KPI_COLOR.indigo;
    const arrow = k.trend === 'up' ? '▲' : '▼';
    const card = el('div', 'kpi-card');
    card.style.setProperty('--kpi-color', cc[0]);
    card.style.setProperty('--kpi-soft', cc[1]);
    card.innerHTML =
      '<div class="kpi-top">'
      + '<div class="kpi-icon">' + icon(k.icon) + '</div>'
      + '<div class="kpi-delta ' + k.trend + '">' + arrow + ' '
      + Math.abs(k.delta) + k.deltaSuffix + '</div></div>'
      + '<div class="kpi-label">' + k.label + '</div>'
      + '<div class="kpi-value"><span class="num">0</span>'
      + '<span class="unit">' + k.suffix + '</span></div>'
      + '<div class="kpi-note">' + k.note + '</div>';
    container.appendChild(card);
    countUp(card.querySelector('.num'), k.value, k.decimals, k.prefix);
  });
}

/* ---- 미니 통계 카드 ------------------------------------------------ */
function renderStatCards(container, cards) {
  cards.forEach(function (c) {
    const card = el('div', 'stat-card');
    let html = '<div class="s-label">' + c.label + '</div>'
             + '<div class="s-value">' + c.value
             + (c.unit ? '<span class="unit"> ' + c.unit + '</span>' : '') + '</div>';
    if (c.barPercent != null) {
      html += '<div class="s-bar"><div class="hbar-track">'
            + '<div class="hbar-fill js-fill bar-grow" data-w="' + c.barPercent
            + '" style="background:' + (c.barColor || 'var(--primary)') + '"></div>'
            + '</div></div>';
    }
    card.innerHTML = html;
    container.appendChild(card);
  });
  animateFills(container);
}

/* =====================================================================
   1) 종합 개요 (overview)
   ===================================================================== */
function initOverview() {
  renderKpis(document.getElementById('kpiGrid'));

  /* 매출 추이 — 기간 토글 */
  function renderRev(range) {
    const box = document.getElementById('revChart');
    box.innerHTML = '';
    const series = D.revenue[range];
    buildLineChart(box, series.points, { color: '#6366f1', unit: series.unit });
    document.getElementById('revDesc').textContent =
      series.label + ' 매출 흐름 (단위: ' + series.unit + ')';
  }
  renderRev('yearly');
  document.querySelectorAll('#revToggle .toggle-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('#revToggle .toggle-btn')
        .forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderRev(btn.dataset.range);
    });
  });

  /* 업무 진행 상태 도넛 */
  const total = D.taskStatus.reduce(function (s, x) { return s + x.value; }, 0);
  buildDonut(document.getElementById('statusChart'), D.taskStatus,
             { centerValue: total, centerLabel: '전체 업무' });

  /* 부서별 달성률 가로 막대 */
  buildHBars(document.getElementById('deptBars'), D.departments.map(function (d) {
    const c = d.achievement >= 100 ? '#10b981'
            : d.achievement >= 90 ? '#6366f1' : '#f59e0b';
    return { name: d.name, value: d.achievement, max: 120,
             display: d.achievement + '%', color: c };
  }));

  /* 최근 활동 피드 */
  const feed = document.getElementById('activityFeed');
  D.activities.forEach(function (a) {
    const st = FEED_STYLE[a.type] || FEED_STYLE.progress;
    feed.appendChild(el('div', 'feed-item',
      '<div class="feed-icon" style="background:' + st[2] + ';color:' + st[1] + '">'
      + icon(st[0]) + '</div>'
      + '<div class="feed-body"><div class="feed-text">' + a.text + '</div>'
      + '<div class="feed-time">' + a.time + '</div></div>'));
  });
}

/* =====================================================================
   2) 업무 목록 (tasks)
   ===================================================================== */
function initTasks() {
  const tasks = D.tasks;
  const count = function (s) {
    return tasks.filter(function (t) { return t.status === s; }).length;
  };

  /* 상단 통계 카드 */
  renderStatCards(document.getElementById('taskStats'), [
    { label: '전체 업무',  value: tasks.length, unit: '건' },
    { label: '진행 중',    value: count('진행 중'), unit: '건' },
    { label: '완료',       value: count('완료'),    unit: '건' },
    { label: '지연',       value: count('지연'),    unit: '건' }
  ]);

  /* 필터 버튼 */
  const filters = ['전체', '진행 중', '완료', '대기', '지연'];
  const fBox = document.getElementById('taskFilters');
  let activeFilter = '전체';
  filters.forEach(function (f) {
    const c = f === '전체' ? tasks.length : count(f);
    const btn = el('button', 'filter-btn' + (f === '전체' ? ' active' : ''),
                   f + '<span class="count">' + c + '</span>');
    btn.dataset.filter = f;
    btn.addEventListener('click', function () {
      activeFilter = f;
      fBox.querySelectorAll('.filter-btn')
        .forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      draw();
    });
    fBox.appendChild(btn);
  });

  /* 검색 */
  const searchInput = document.getElementById('taskSearch');
  searchInput.addEventListener('input', draw);

  /* 표 렌더링 */
  const body = document.getElementById('taskBody');
  function draw() {
    const term = searchInput.value.trim().toLowerCase();
    const rows = tasks.filter(function (t) {
      const okFilter = activeFilter === '전체' || t.status === activeFilter;
      const okSearch = !term
        || t.title.toLowerCase().indexOf(term) >= 0
        || t.assignee.toLowerCase().indexOf(term) >= 0;
      return okFilter && okSearch;
    });
    body.innerHTML = '';
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="8" class="empty-row">조건에 맞는 업무가 없습니다.</td></tr>';
      return;
    }
    rows.forEach(function (t) {
      const tr = el('tr', '',
        '<td class="t-id">' + t.id + '</td>'
        + '<td class="t-title">' + t.title + '</td>'
        + '<td><div class="cell-person"><span class="mini-avatar">'
        + t.assignee.charAt(0) + '</span>' + t.assignee + '</div></td>'
        + '<td>' + t.dept + '</td>'
        + '<td>' + priorityBadge(t.priority) + '</td>'
        + '<td>' + statusBadge(t.status) + '</td>'
        + '<td>' + fmtDate(t.due) + '</td>'
        + '<td style="min-width:140px">' + progressBar(t.progress) + '</td>');
      body.appendChild(tr);
    });
    animateFills(body);
  }
  draw();
}

/* =====================================================================
   3) 프로젝트 (projects)
   ===================================================================== */
function initProjects() {
  const ps = D.projects;
  const sumBudget = ps.reduce(function (s, p) { return s + p.budget; }, 0);
  const sumSpent  = ps.reduce(function (s, p) { return s + p.spent; }, 0);
  const avgProg   = Math.round(ps.reduce(function (s, p) { return s + p.progress; }, 0) / ps.length);
  const execRate  = Math.round(sumSpent / sumBudget * 100);

  renderStatCards(document.getElementById('projStats'), [
    { label: '전체 프로젝트', value: ps.length, unit: '건' },
    { label: '평균 진행률',   value: avgProg, unit: '%', barPercent: avgProg },
    { label: '총 예산',       value: manwonToEok(sumBudget), unit: '억원' },
    { label: '예산 집행률',   value: execRate, unit: '%', barPercent: execRate,
      barColor: execRate > 85 ? '#ef4444' : '#10b981' }
  ]);

  /* 타임라인 (간트형) */
  const STATUS_COLOR = { '정상': '#6366f1', '주의': '#f59e0b', '지연': '#ef4444' };
  const dates = [];
  ps.forEach(function (p) { dates.push(+new Date(p.start), +new Date(p.end)); });
  const minD = Math.min.apply(null, dates), maxD = Math.max.apply(null, dates);
  const span = maxD - minD;

  const gantt = document.getElementById('gantt');
  ps.forEach(function (p) {
    const s = +new Date(p.start), e = +new Date(p.end);
    const left  = (s - minD) / span * 100;
    const width = (e - s) / span * 100;
    const row = el('div', 'gantt-row');
    row.innerHTML =
      '<div class="gantt-name">' + p.name
      + '<span>' + fmtDate(p.start) + ' ~ ' + fmtDate(p.end) + '</span></div>'
      + '<div class="gantt-track"><div class="gantt-bar" style="left:' + left
      + '%;width:' + width + '%;background:' + STATUS_COLOR[p.status] + '">'
      + p.progress + '%</div></div>';
    gantt.appendChild(row);
  });
  /* 월 단위 눈금 */
  const scale = el('div', 'gantt-scale');
  const labels = [];
  const cur = new Date(minD); cur.setDate(1);
  const end = new Date(maxD);
  while (cur <= end) {
    labels.push((cur.getMonth() + 1) + '월');
    cur.setMonth(cur.getMonth() + 1);
  }
  scale.style.gridTemplateColumns = 'repeat(' + labels.length + ', 1fr)';
  labels.forEach(function (l) { scale.appendChild(el('span', '', l)); });
  gantt.appendChild(scale);

  /* 프로젝트 카드 */
  const grid = document.getElementById('projGrid');
  ps.forEach(function (p) {
    const budgetPct = Math.round(p.spent / p.budget * 100);
    const budgetColor = budgetPct > 90 ? '#ef4444' : '#10b981';
    const card = el('div', 'project-card');
    card.innerHTML =
      '<div class="p-head"><div><h3>' + p.name + '</h3>'
      + '<div class="p-dept">' + p.dept + '</div></div>'
      + projStatusBadge(p.status) + '</div>'
      + '<div class="project-meta">'
      + '<span class="m-item">' + icon('user') + p.owner + '</span>'
      + '<span class="m-item">' + icon('users') + p.members + '명</span>'
      + '<span class="m-item">' + icon('calendar') + fmtMD(p.start) + ' ~ ' + fmtMD(p.end) + '</span>'
      + '</div>'
      + progressBar(p.progress)
      + '<div class="p-foot"><div class="budget-line"><span>예산 집행</span>'
      + '<span>' + manwonToEok(p.spent) + '억 / ' + manwonToEok(p.budget) + '억</span></div>'
      + '<div class="hbar-track"><div class="hbar-fill js-fill bar-grow" data-w="'
      + budgetPct + '" style="background:' + budgetColor + '"></div></div></div>';
    grid.appendChild(card);
  });
  animateFills(document);
}

/* =====================================================================
   4) 보고서 (reports)
   ===================================================================== */
function initReports() {
  const r = D.reports;
  const totRev  = r.quarterly.reduce(function (s, q) { return s + q.revenue; }, 0);
  const totProf = r.quarterly.reduce(function (s, q) { return s + q.profit; }, 0);
  const margin  = (totProf / totRev * 100).toFixed(1);
  const avgOnt  = Math.round(r.teams.reduce(function (s, t) { return s + t.ontime; }, 0) / r.teams.length);

  renderStatCards(document.getElementById('reportStats'), [
    { label: '누적 매출',      value: totRev.toFixed(1),  unit: '억원' },
    { label: '누적 영업이익',  value: totProf.toFixed(1), unit: '억원' },
    { label: '평균 영업이익률', value: margin, unit: '%', barPercent: margin },
    { label: '평균 정시 완료율', value: avgOnt, unit: '%', barPercent: avgOnt,
      barColor: '#10b981' }
  ]);

  /* 분기별 실적 그룹 막대 */
  buildBarChart(
    document.getElementById('quarterChart'),
    r.quarterly.map(function (q) { return { label: q.q, values: [q.revenue, q.profit] }; }),
    [{ name: '매출', color: '#6366f1' }, { name: '영업이익', color: '#34d399' }],
    { unit: '억' }
  );

  /* 매출 채널 도넛 */
  const channelSegs = r.channels.map(function (c) {
    return { label: c.name, value: c.value, color: c.color };
  });
  buildDonut(document.getElementById('channelChart'), channelSegs,
             { centerValue: '100%', centerLabel: '매출 구성', unit: '%', showPercent: false });

  /* 팀별 성과 표 */
  const tbody = document.getElementById('teamBody');
  r.teams.forEach(function (t) {
    const scoreClass = t.score.charAt(0) === 'A' ? 'ok' : 'warn';
    tbody.appendChild(el('tr', '',
      '<td class="t-title">' + t.name + '</td>'
      + '<td>' + t.completed + '건</td>'
      + '<td style="min-width:150px">' + progressBar(t.ontime,
          t.ontime >= 90 ? '#10b981' : '#f59e0b') + '</td>'
      + '<td><span class="badge ' + scoreClass + '">' + t.score + '</span></td>'));
  });
  animateFills(tbody);

  /* 핵심 인사이트 */
  const ins = document.getElementById('insights');
  r.insights.forEach(function (text, i) {
    ins.appendChild(el('div', 'insight-item',
      '<span class="insight-num">' + (i + 1) + '</span><span>' + text + '</span>'));
  });
}

/* =====================================================================
   부트스트랩
   ===================================================================== */
const PAGE_INIT = {
  overview: initOverview,
  tasks:    initTasks,
  projects: initProjects,
  reports:  initReports
};

document.addEventListener('DOMContentLoaded', function () {
  const page = document.body.dataset.page;
  renderShell(page);
  const fn = PAGE_INIT[page];
  if (fn) fn();
});
