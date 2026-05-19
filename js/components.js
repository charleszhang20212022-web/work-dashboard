/* =====================================================================
   components.js — 공통 UI · 차트 렌더링 엔진
   ---------------------------------------------------------------------
   사이드바 / 상단바 셸 구성, KPI 카운트업, SVG 라인 · 도넛 · 막대 차트,
   배지 · 진행률 바 등 모든 페이지가 재사용하는 함수 모음입니다.
   외부 라이브러리 없이 순수 JavaScript + SVG 로 구현되어 오프라인에서도
   동작합니다.
   ===================================================================== */

/* ---- SVG 아이콘 (24x24, stroke 기반) ------------------------------- */
const ICONS = {
  grid:    '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
  tasks:   '<path d="M9.5 6h10.5M9.5 12h10.5M9.5 18h10.5"/><path d="M3.5 6 5 7.5 7.5 5"/><path d="M3.5 12 5 13.5 7.5 11"/><path d="M3.5 18 5 19.5 7.5 17"/>',
  layers:  '<path d="M12 3 3 7.5 12 12l9-4.5L12 3Z"/><path d="m3 12 9 4.5L21 12"/><path d="m3 16.5 9 4.5 9-4.5"/>',
  chart:   '<line x1="3" y1="21" x2="21" y2="21"/><rect x="5.5" y="10" width="3.3" height="8" rx="1"/><rect x="10.3" y="5.5" width="3.3" height="12.5" rx="1"/><rect x="15.1" y="13" width="3.3" height="5" rx="1"/>',
  revenue: '<circle cx="12" cy="12" r="9"/><path d="M8.2 8.5h7.6M8.2 11.5h7.6M9 7l3 5 3-5M12 12v5"/>',
  users:   '<circle cx="9.5" cy="8" r="3.3"/><path d="M3.8 19v-1.2A3.8 3.8 0 0 1 7.6 14h3.8a3.8 3.8 0 0 1 3.8 3.8V19"/><path d="M16 5.2a3.3 3.3 0 0 1 0 5.6M17.5 14a3.8 3.8 0 0 1 2.7 3.6V19"/>',
  check:   '<circle cx="12" cy="12" r="9"/><path d="m8.3 12 2.6 2.6 5-5.2"/>',
  gauge:   '<path d="M3 13.5h3.6l2.4 5.5 4-13 2.6 7.5h4.4"/>',
  comment: '<path d="M20.5 11.4a7.6 7.6 0 0 1-10.8 6.9L4.5 19.5l1.3-4.6A7.6 7.6 0 1 1 20.5 11.4Z"/>',
  progress:'<path d="M3.5 16.5 9.5 10l3.8 3.8L20.5 6.6"/><path d="M15 6.5h5.5V12"/>',
  add:     '<circle cx="12" cy="12" r="9"/><path d="M12 8.2v7.6M8.2 12h7.6"/>',
  alert:   '<path d="M12 3.5 2.8 19.8h18.4L12 3.5Z"/><path d="M12 9.8v4.4M12 17.4h.02"/>',
  user:    '<circle cx="12" cy="8" r="3.6"/><path d="M5.5 20v-1.2a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5V20"/>',
  userAdd: '<circle cx="9.5" cy="8" r="3.5"/><path d="M3.8 20v-1.2a4.8 4.8 0 0 1 4.8-4.8h2.6"/><path d="M18 7.5v6M15 10.5h6"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/>',
  target:  '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  search:  '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.9-3.9"/>',
  flag:    '<path d="M5 21V4M5 4h11l-2.2 3.5L16 11H5"/>',
  budget:  '<rect x="3" y="6.5" width="18" height="13" rx="2.5"/><path d="M3 11h18M7 15.5h4"/>'
};

function icon(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
       + 'stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
}

/* ---- 페이지 / 메뉴 정의 -------------------------------------------- */
const PAGE_META = {
  overview: { title: '종합 개요', sub: '핵심 지표와 실적을 한눈에 확인하세요' },
  tasks:    { title: '업무 목록', sub: '진행 중인 업무와 담당자 현황' },
  projects: { title: '프로젝트',  sub: '진행 중인 프로젝트 추적 및 예산 관리' },
  reports:  { title: '보고서',    sub: '기간별 실적 분석과 팀 성과' }
};

const NAV = [
  { key: 'overview', label: '종합 개요', href: 'index.html',    icon: 'grid'   },
  { key: 'tasks',    label: '업무 목록', href: 'tasks.html',    icon: 'tasks'  },
  { key: 'projects', label: '프로젝트',  href: 'projects.html', icon: 'layers' },
  { key: 'reports',  label: '보고서',    href: 'reports.html',  icon: 'chart'  }
];

/* ---- 기본 헬퍼 ----------------------------------------------------- */
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls)  e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function svgEl(tag, attrs) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
function formatNum(n, decimals) {
  return Number(n).toLocaleString('ko-KR', {
    minimumFractionDigits: decimals || 0,
    maximumFractionDigits: decimals || 0
  });
}
function niceCeil(v) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / (mag / 2)) * (mag / 2);
}

/* ---- 셸(사이드바 + 상단바) 구성 ----------------------------------- */
function renderShell(pageKey) {
  const meta = DASHBOARD_DATA.meta;
  const m    = PAGE_META[pageKey] || { title: '', sub: '' };

  /* 사이드바 */
  const navHtml = NAV.map(function (n) {
    return '<a class="nav-item ' + (n.key === pageKey ? 'active' : '') + '" href="' + n.href + '">'
         + icon(n.icon) + '<span>' + n.label + '</span></a>';
  }).join('');

  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.innerHTML =
      '<div class="brand">'
      + '<div class="brand-logo">O</div>'
      + '<div><div class="brand-name">오로라 테크</div>'
      + '<div class="brand-sub">업무 종합 대시보드</div></div></div>'
      + '<div class="nav-label">메뉴</div>'
      + '<nav>' + navHtml + '</nav>'
      + '<div class="sidebar-spacer"></div>'
      + '<div class="sidebar-user"><div class="avatar">' + meta.user.initial + '</div>'
      + '<div><div class="u-name">' + meta.user.name + '</div>'
      + '<div class="u-role">' + meta.user.role + '</div></div></div>';
  }

  /* 상단바 */
  const p = meta.updatedAt.split('-').map(Number);
  const d = new Date(p[0], p[1] - 1, p[2]);
  const wd = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  const dateStr = p[0] + '. ' + p[1] + '. ' + p[2] + '. (' + wd + ')';

  const topbar = document.getElementById('topbar');
  if (topbar) {
    topbar.innerHTML =
      '<div><h1>' + m.title + '</h1><div class="sub">' + m.sub + '</div></div>'
      + '<div class="topbar-right">'
      + '<div class="pill"><span class="dot"></span>실시간</div>'
      + '<div class="pill">' + icon('calendar') + dateStr + '</div>'
      + '<div class="avatar">' + meta.user.initial + '</div>'
      + '</div>';
  }
}

/* ---- 숫자 카운트업 애니메이션 -------------------------------------- */
function countUp(node, target, decimals, prefix) {
  const dur = 1100, t0 = performance.now();
  function frame(now) {
    let p = Math.min(1, (now - t0) / dur);
    p = 1 - Math.pow(1 - p, 3);                  // easeOutCubic
    node.textContent = (prefix || '') + formatNum(target * p, decimals);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---- 배지 ---------------------------------------------------------- */
function statusBadge(status) {
  const map = { '완료': 'done', '진행 중': 'prog', '대기': 'wait', '지연': 'late' };
  return '<span class="badge ' + (map[status] || 'wait') + '">'
       + '<span class="bdot" style="background:currentColor"></span>' + status + '</span>';
}
function priorityBadge(p) {
  const map = { '높음': 'p-high', '보통': 'p-mid', '낮음': 'p-low' };
  return '<span class="badge ' + (map[p] || 'p-mid') + '">' + p + '</span>';
}
function projStatusBadge(s) {
  const map = { '정상': 'ok', '주의': 'warn', '지연': 'delay' };
  return '<span class="badge ' + (map[s] || 'ok') + '">' + s + '</span>';
}

/* ---- 진행률 바 ----------------------------------------------------- */
function progressBar(percent, color) {
  const c = color || 'var(--primary)';
  return '<div class="progress"><div class="progress-track">'
       + '<div class="progress-fill js-fill" data-w="' + percent + '" '
       + 'style="background:' + c + '"></div></div>'
       + '<span class="progress-num">' + percent + '%</span></div>';
}
/* 렌더 직후 호출 — 0 → 목표 너비로 채움 */
function animateFills(root) {
  (root || document).querySelectorAll('.js-fill').forEach(function (f) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { f.style.width = f.dataset.w + '%'; });
    });
  });
}

/* ---- 차트 툴팁 ----------------------------------------------------- */
let _tip = null;
function chartTip() {
  if (!_tip) { _tip = el('div', 'chart-tip'); document.body.appendChild(_tip); }
  return _tip;
}
function showTip(evt, html) {
  const t = chartTip();
  t.innerHTML = html;
  t.style.left = evt.clientX + 'px';
  t.style.top  = evt.clientY + 'px';
  t.style.opacity = '1';
}
function hideTip() { if (_tip) _tip.style.opacity = '0'; }

function bindTip(node, html) {
  node.style.cursor = 'pointer';
  node.addEventListener('mousemove', function (e) { showTip(e, html); });
  node.addEventListener('mouseleave', hideTip);
}

/* =====================================================================
   라인 / 영역 차트
   ===================================================================== */
function buildLineChart(container, points, opts) {
  opts = opts || {};
  const color = opts.color || '#6366f1';
  const W = 760, H = 290, padL = 46, padR = 18, padT = 18, padB = 40;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = points.length;
  const maxY = niceCeil(Math.max.apply(null, points.map(function (p) { return p.y; })) * 1.1);

  const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart-svg' });

  const xAt = function (i) { return padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW); };
  const yAt = function (v) { return padT + plotH - (v / maxY) * plotH; };

  /* 가로 그리드 + Y축 라벨 */
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const y = padT + plotH - (i / steps) * plotH;
    svg.appendChild(svgEl('line', {
      x1: padL, y1: y, x2: W - padR, y2: y, stroke: '#eef0f6', 'stroke-width': 1
    }));
    const lbl = svgEl('text', { x: padL - 10, y: y + 4, 'text-anchor': 'end' });
    lbl.textContent = formatNum(maxY * i / steps, maxY < 10 ? 1 : 0);
    svg.appendChild(lbl);
  }

  /* 영역 + 라인 경로 */
  let line = '', area = '';
  points.forEach(function (p, i) {
    const cmd = (i === 0 ? 'M' : 'L') + xAt(i) + ' ' + yAt(p.y);
    line += cmd + ' ';
  });
  area = line + 'L' + xAt(n - 1) + ' ' + (padT + plotH)
       + ' L' + xAt(0) + ' ' + (padT + plotH) + ' Z';

  /* 그라데이션 정의 */
  const gid = 'grad-' + Math.random().toString(36).slice(2, 7);
  const defs = svgEl('defs', {});
  const grad = svgEl('linearGradient', { id: gid, x1: '0', y1: '0', x2: '0', y2: '1' });
  grad.appendChild(svgEl('stop', { offset: '0%',   'stop-color': color, 'stop-opacity': '0.30' }));
  grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': '0' }));
  defs.appendChild(grad);
  svg.appendChild(defs);

  const areaPath = svgEl('path', { d: area, fill: 'url(#' + gid + ')', class: 'chart-area' });
  areaPath.style.opacity = '0';
  svg.appendChild(areaPath);

  const linePath = svgEl('path', {
    d: line.trim(), fill: 'none', stroke: color, 'stroke-width': 3,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'chart-line'
  });
  svg.appendChild(linePath);

  /* 라인 드로잉 애니메이션 */
  const len = linePath.getTotalLength();
  linePath.style.strokeDasharray  = len;
  linePath.style.strokeDashoffset = len;
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      linePath.style.strokeDashoffset = '0';
      areaPath.style.opacity = '1';
    });
  });

  /* 데이터 포인트 + X축 라벨 */
  points.forEach(function (p, i) {
    const cx = xAt(i), cy = yAt(p.y);
    const dot = svgEl('circle', {
      cx: cx, cy: cy, r: 4.5, fill: '#fff', stroke: color, 'stroke-width': 2.5
    });
    bindTip(dot, p.x + ' · <b>' + formatNum(p.y, p.y < 10 ? 2 : 0) + (opts.unit || '') + '</b>');
    svg.appendChild(dot);

    const xl = svgEl('text', { x: cx, y: H - padB + 22, 'text-anchor': 'middle' });
    xl.textContent = p.x;
    svg.appendChild(xl);
  });

  container.appendChild(svg);
}

/* =====================================================================
   도넛 차트
   ===================================================================== */
function buildDonut(container, segments, opts) {
  opts = opts || {};
  const total = segments.reduce(function (s, x) { return s + x.value; }, 0);
  const size = 184, r = 65, cx = size / 2, cy = size / 2, sw = 26;
  const C = 2 * Math.PI * r;

  const wrap = el('div', 'donut-wrap');
  const svg = svgEl('svg', { viewBox: '0 0 ' + size + ' ' + size, class: 'chart-svg' });
  svg.style.maxWidth = size + 'px';
  svg.style.margin = '0 auto';

  svg.appendChild(svgEl('circle', {
    cx: cx, cy: cy, r: r, fill: 'none', stroke: '#eef0f6', 'stroke-width': sw
  }));

  let acc = 0;
  segments.forEach(function (seg) {
    const frac = total ? seg.value / total : 0;
    const segLen = frac * C;
    const arc = svgEl('circle', {
      cx: cx, cy: cy, r: r, fill: 'none', stroke: seg.color, 'stroke-width': sw,
      'stroke-dasharray': '0 ' + C,
      transform: 'rotate(' + (-90 + acc * 360) + ' ' + cx + ' ' + cy + ')'
    });
    arc.classList.add('donut-seg');
    const uSuffix = opts.unit || '건';
    const pctTxt  = opts.showPercent === false ? '' : ' (' + Math.round(frac * 100) + '%)';
    bindTip(arc, seg.label + ' · <b>' + formatNum(seg.value) + uSuffix + pctTxt + '</b>');
    svg.appendChild(arc);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        arc.style.strokeDasharray = segLen + ' ' + C;
      });
    });
    acc += frac;
  });

  wrap.appendChild(svg);
  const center = el('div', 'donut-center',
    '<div class="big">' + (opts.centerValue != null ? opts.centerValue : total) + '</div>'
    + '<div class="small">' + (opts.centerLabel || '') + '</div>');
  wrap.appendChild(center);
  container.appendChild(wrap);

  /* 범례 */
  if (opts.legend !== false) {
    const lg = el('div', 'legend');
    segments.forEach(function (seg) {
      lg.appendChild(el('div', 'legend-item',
        '<span class="legend-dot" style="background:' + seg.color + '"></span>'
        + seg.label + ' <b>' + formatNum(seg.value) + (opts.unit || '건') + '</b>'));
    });
    container.appendChild(lg);
  }
}

/* =====================================================================
   가로 막대 (부서별 달성률 등)
   ===================================================================== */
function buildHBars(container, items) {
  items.forEach(function (it) {
    const pct = Math.min(100, (it.value / it.max) * 100);
    const row = el('div', 'hbar-row',
      '<div class="hbar-top"><span class="name">' + it.name + '</span>'
      + '<span class="val">' + it.display + '</span></div>'
      + '<div class="hbar-track"><div class="hbar-fill js-fill bar-grow" '
      + 'data-w="' + pct + '" style="background:' + it.color + '"></div></div>');
    container.appendChild(row);
  });
  animateFills(container);
}

/* =====================================================================
   세로 그룹 막대 (분기별 실적 등)
   ===================================================================== */
function buildBarChart(container, groups, series, opts) {
  opts = opts || {};
  const W = 660, H = 300, padL = 44, padR = 16, padT = 22, padB = 42;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const allVals = groups.reduce(function (a, g) { return a.concat(g.values); }, []);
  const maxY = niceCeil(Math.max.apply(null, allVals) * 1.12);

  const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart-svg' });

  /* 그리드 + Y축 */
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const y = padT + plotH - (i / steps) * plotH;
    svg.appendChild(svgEl('line', {
      x1: padL, y1: y, x2: W - padR, y2: y, stroke: '#eef0f6', 'stroke-width': 1
    }));
    const lbl = svgEl('text', { x: padL - 10, y: y + 4, 'text-anchor': 'end' });
    lbl.textContent = formatNum(maxY * i / steps, maxY < 10 ? 1 : 0);
    svg.appendChild(lbl);
  }

  const groupW = plotW / groups.length;
  const barW = Math.min(30, groupW / (series.length + 1.5));
  const gap = 7;
  const baseline = padT + plotH;

  groups.forEach(function (g, gi) {
    const center = padL + groupW * gi + groupW / 2;
    const blockW = series.length * barW + (series.length - 1) * gap;
    g.values.forEach(function (v, si) {
      const h = (v / maxY) * plotH;
      const x = center - blockW / 2 + si * (barW + gap);
      const rect = svgEl('rect', {
        x: x, y: baseline - h, width: barW, height: h, rx: 5, fill: series[si].color
      });
      rect.classList.add('barv-grow');
      rect.style.transformOrigin = (x + barW / 2) + 'px ' + baseline + 'px';
      rect.style.transform = 'scaleY(0)';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { rect.style.transform = 'scaleY(1)'; });
      });
      bindTip(rect, g.label + ' · ' + series[si].name
                  + ' <b>' + formatNum(v, v < 10 ? 1 : 0) + (opts.unit || '') + '</b>');
      svg.appendChild(rect);
    });
    const xl = svgEl('text', { x: center, y: H - padB + 22, 'text-anchor': 'middle' });
    xl.textContent = g.label;
    svg.appendChild(xl);
  });

  container.appendChild(svg);

  /* 범례 */
  const lg = el('div', 'legend');
  series.forEach(function (s) {
    lg.appendChild(el('div', 'legend-item',
      '<span class="legend-dot" style="background:' + s.color + '"></span>' + s.name));
  });
  container.appendChild(lg);
}
