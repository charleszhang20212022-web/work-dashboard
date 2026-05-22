/* =====================================================================
   charts.js — 순수 JS/SVG 차트 엔진 + UI 헬퍼 (외부 라이브러리 없음)
   기존 정적 대시보드(components.js)의 차트 엔진을 재사용합니다.
   ===================================================================== */

const ICONS = {
  grid:    '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
  tasks:   '<path d="M9.5 6h10.5M9.5 12h10.5M9.5 18h10.5"/><path d="M3.5 6 5 7.5 7.5 5"/><path d="M3.5 12 5 13.5 7.5 11"/><path d="M3.5 18 5 19.5 7.5 17"/>',
  chat:    '<path d="M20.5 11.4a7.6 7.6 0 0 1-10.8 6.9L4.5 19.5l1.3-4.6A7.6 7.6 0 1 1 20.5 11.4Z"/>',
  note:    '<path d="M19.5 3.5h-15v17h9l6-6v-11Z"/><path d="M13.5 20.5v-5h5"/>',
  revenue: '<circle cx="12" cy="12" r="9"/><path d="M8.2 8.5h7.6M8.2 11.5h7.6M9 7l3 5 3-5M12 12v5"/>',
  users:   '<circle cx="9.5" cy="8" r="3.3"/><path d="M3.8 19v-1.2A3.8 3.8 0 0 1 7.6 14h3.8a3.8 3.8 0 0 1 3.8 3.8V19"/><path d="M16 5.2a3.3 3.3 0 0 1 0 5.6M17.5 14a3.8 3.8 0 0 1 2.7 3.6V19"/>',
  check:   '<circle cx="12" cy="12" r="9"/><path d="m8.3 12 2.6 2.6 5-5.2"/>',
  gauge:   '<path d="M3 13.5h3.6l2.4 5.5 4-13 2.6 7.5h4.4"/>',
  chart:   '<line x1="3" y1="21" x2="21" y2="21"/><rect x="5.5" y="10" width="3.3" height="8" rx="1"/><rect x="10.3" y="5.5" width="3.3" height="12.5" rx="1"/><rect x="15.1" y="13" width="3.3" height="5" rx="1"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/>',
  mail:    '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
  shield:  '<path d="M12 3 5 6v5.5c0 4 3 7.4 7 9 4-1.6 7-5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  pie:     '<path d="M12 3a9 9 0 1 0 9 9h-9V3Z"/><path d="M14 3.2A9 9 0 0 1 20.8 10H14V3.2Z"/>',
  trend:   '<path d="M3.5 16.5 9.5 10l3.8 3.8L20.5 6.6"/><path d="M15 6.5h5.5V12"/>',
  bars:    '<line x1="3" y1="21" x2="21" y2="21"/><rect x="5.5" y="10" width="3.3" height="8" rx="1"/><rect x="10.3" y="5.5" width="3.3" height="12.5" rx="1"/><rect x="15.1" y="13" width="3.3" height="5" rx="1"/>',
  layers:  '<path d="M12 3 3 7.5 12 12l9-4.5L12 3Z"/><path d="m3 12 9 4.5L21 12"/><path d="m3 16.5 9 4.5 9-4.5"/>',
  plus:    '<path d="M12 5v14M5 12h14"/>',
  trash:   '<path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13"/>',
  logout:  '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  send:    '<path d="M4 12 21 4l-7 17-3-7-7-2Z"/>',
  edit:    '<path d="M14 5.5 18.5 10 7.5 21H3v-4.5L14 5.5Z"/><path d="m12.5 7 4.5 4.5"/>',
  close:   '<path d="M6 6l12 12M18 6 6 18"/>',
  online:  '<circle cx="12" cy="12" r="9"/>'
};
function icon(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
       + 'stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
}

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function svgEl(tag, attrs) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function formatNum(n, decimals) {
  return Number(n).toLocaleString('ko-KR', {
    minimumFractionDigits: decimals || 0, maximumFractionDigits: decimals || 0
  });
}
function niceCeil(v) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / (mag / 2)) * (mag / 2);
}

/* ---- 차트 툴팁 ---------------------------------------------------- */
let _tip = null;
function chartTip() { if (!_tip) { _tip = el('div', 'chart-tip'); document.body.appendChild(_tip); } return _tip; }
function showTip(evt, html) { const t = chartTip(); t.innerHTML = html; t.style.left = evt.clientX + 'px'; t.style.top = evt.clientY + 'px'; t.style.opacity = '1'; }
function hideTip() { if (_tip) _tip.style.opacity = '0'; }
function bindTip(node, html) {
  node.style.cursor = 'pointer';
  node.addEventListener('mousemove', function (e) { showTip(e, html); });
  node.addEventListener('mouseleave', hideTip);
}

/* ---- 진행률 바 --------------------------------------------------- */
function progressBar(percent, color) {
  const c = color || 'var(--primary)';
  return '<div class="progress"><div class="progress-track">'
       + '<div class="progress-fill js-fill" data-w="' + percent + '" style="background:' + c + '"></div>'
       + '</div><span class="progress-num">' + percent + '%</span></div>';
}
function animateFills(root) {
  (root || document).querySelectorAll('.js-fill').forEach(function (f) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { f.style.width = f.dataset.w + '%'; });
    });
  });
}

/* ---- 배지 -------------------------------------------------------- */
function statusBadge(status) {
  const map = { '완료': 'done', '진행 중': 'prog', '대기': 'wait', '지연': 'late' };
  return '<span class="badge ' + (map[status] || 'wait') + '"><span class="bdot" style="background:currentColor"></span>' + esc(status) + '</span>';
}
function priorityBadge(p) {
  const map = { '높음': 'p-high', '보통': 'p-mid', '낮음': 'p-low' };
  return '<span class="badge ' + (map[p] || 'p-mid') + '">' + esc(p) + '</span>';
}
function roleBadge(r) {
  const map = { admin: ['관리자', 'p-high'], leader: ['팀장', 'prog'], member: ['팀원', 'p-low'] };
  const m = map[r] || map.member;
  return '<span class="badge ' + m[1] + '">' + m[0] + '</span>';
}

/* =====================================================================
   라인 / 영역 차트
   ===================================================================== */
function buildLineChart(container, points, opts) {
  opts = opts || {};
  const color = opts.color || '#6366f1';
  const W = opts.W || 760, H = opts.H || 290;
  const padL = opts.mini ? 30 : 46, padR = 16, padT = 14, padB = opts.mini ? 24 : 38;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = points.length;
  const maxY = niceCeil(Math.max.apply(null, points.map(function (p) { return p.y; })) * 1.1);

  const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart-svg', preserveAspectRatio: 'none' });
  const xAt = function (i) { return padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW); };
  const yAt = function (v) { return padT + plotH - (v / maxY) * plotH; };

  const steps = opts.mini ? 2 : 4;
  for (let i = 0; i <= steps; i++) {
    const y = padT + plotH - (i / steps) * plotH;
    svg.appendChild(svgEl('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: '#eef0f6', 'stroke-width': 1 }));
    if (!opts.mini) {
      const lbl = svgEl('text', { x: padL - 10, y: y + 4, 'text-anchor': 'end' });
      lbl.textContent = formatNum(maxY * i / steps, maxY < 10 ? 1 : 0);
      svg.appendChild(lbl);
    }
  }

  let line = '';
  points.forEach(function (p, i) { line += (i === 0 ? 'M' : 'L') + xAt(i) + ' ' + yAt(p.y) + ' '; });
  const area = line + 'L' + xAt(n - 1) + ' ' + (padT + plotH) + ' L' + xAt(0) + ' ' + (padT + plotH) + ' Z';

  const gid = 'grad-' + Math.random().toString(36).slice(2, 7);
  const defs = svgEl('defs', {});
  const grad = svgEl('linearGradient', { id: gid, x1: '0', y1: '0', x2: '0', y2: '1' });
  grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': '0.30' }));
  grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': '0' }));
  defs.appendChild(grad); svg.appendChild(defs);

  const areaPath = svgEl('path', { d: area, fill: 'url(#' + gid + ')', class: 'chart-area' });
  areaPath.style.opacity = '0'; svg.appendChild(areaPath);

  const linePath = svgEl('path', { d: line.trim(), fill: 'none', stroke: color, 'stroke-width': opts.mini ? 2.5 : 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'chart-line' });
  svg.appendChild(linePath);
  const len = linePath.getTotalLength();
  linePath.style.strokeDasharray = len; linePath.style.strokeDashoffset = len;
  requestAnimationFrame(function () { requestAnimationFrame(function () { linePath.style.strokeDashoffset = '0'; areaPath.style.opacity = '1'; }); });

  points.forEach(function (p, i) {
    const cx = xAt(i), cy = yAt(p.y);
    const dot = svgEl('circle', { cx: cx, cy: cy, r: opts.mini ? 3 : 4.5, fill: '#fff', stroke: color, 'stroke-width': 2.5 });
    bindTip(dot, p.x + ' · <b>' + formatNum(p.y, p.y < 10 ? 2 : 0) + (opts.unit || '') + '</b>');
    svg.appendChild(dot);
    if (!opts.mini) {
      const xl = svgEl('text', { x: cx, y: H - padB + 22, 'text-anchor': 'middle' });
      xl.textContent = p.x; svg.appendChild(xl);
    }
  });
  container.appendChild(svg);
}

/* =====================================================================
   도넛 차트
   ===================================================================== */
function buildDonut(container, segments, opts) {
  opts = opts || {};
  const total = segments.reduce(function (s, x) { return s + x.value; }, 0);
  const size = opts.size || 184, r = size * 0.353, cx = size / 2, cy = size / 2, sw = size * 0.141;
  const C = 2 * Math.PI * r;

  const wrap = el('div', 'donut-wrap');
  const svg = svgEl('svg', { viewBox: '0 0 ' + size + ' ' + size, class: 'chart-svg' });
  svg.style.maxWidth = size + 'px'; svg.style.margin = '0 auto';
  svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: '#eef0f6', 'stroke-width': sw }));

  let acc = 0;
  segments.forEach(function (seg) {
    const frac = total ? seg.value / total : 0;
    const segLen = frac * C;
    const arc = svgEl('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: seg.color, 'stroke-width': sw, 'stroke-dasharray': '0 ' + C, transform: 'rotate(' + (-90 + acc * 360) + ' ' + cx + ' ' + cy + ')' });
    arc.classList.add('donut-seg');
    bindTip(arc, seg.label + ' · <b>' + formatNum(seg.value) + (opts.unit || '건') + ' (' + Math.round(frac * 100) + '%)</b>');
    svg.appendChild(arc);
    requestAnimationFrame(function () { requestAnimationFrame(function () { arc.style.strokeDasharray = segLen + ' ' + C; }); });
    acc += frac;
  });
  wrap.appendChild(svg);
  wrap.appendChild(el('div', 'donut-center', '<div class="big">' + (opts.centerValue != null ? opts.centerValue : total) + '</div><div class="small">' + (opts.centerLabel || '') + '</div>'));
  container.appendChild(wrap);

  if (opts.legend !== false) {
    const lg = el('div', 'legend');
    segments.forEach(function (seg) {
      lg.appendChild(el('div', 'legend-item', '<span class="legend-dot" style="background:' + seg.color + '"></span>' + seg.label + ' <b>' + formatNum(seg.value) + (opts.unit || '건') + '</b>'));
    });
    container.appendChild(lg);
  }
}

/* =====================================================================
   가로 막대
   ===================================================================== */
function buildHBars(container, items) {
  items.forEach(function (it) {
    const pct = Math.min(100, (it.value / it.max) * 100);
    container.appendChild(el('div', 'hbar-row',
      '<div class="hbar-top"><span class="name">' + esc(it.name) + '</span><span class="val">' + esc(it.display) + '</span></div>'
      + '<div class="hbar-track"><div class="hbar-fill js-fill bar-grow" data-w="' + pct + '" style="background:' + it.color + '"></div></div>'));
  });
  animateFills(container);
}

/* =====================================================================
   세로 그룹 막대
   ===================================================================== */
function buildBarChart(container, groups, series, opts) {
  opts = opts || {};
  const W = opts.W || 660, H = opts.H || 300, padL = opts.mini ? 30 : 44, padR = 16, padT = 18, padB = opts.mini ? 24 : 40;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const allVals = groups.reduce(function (a, g) { return a.concat(g.values); }, []);
  const maxY = niceCeil(Math.max.apply(null, allVals) * 1.12);
  const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart-svg', preserveAspectRatio: 'none' });

  const steps = opts.mini ? 2 : 4;
  for (let i = 0; i <= steps; i++) {
    const y = padT + plotH - (i / steps) * plotH;
    svg.appendChild(svgEl('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: '#eef0f6', 'stroke-width': 1 }));
    if (!opts.mini) {
      const lbl = svgEl('text', { x: padL - 10, y: y + 4, 'text-anchor': 'end' });
      lbl.textContent = formatNum(maxY * i / steps, maxY < 10 ? 1 : 0); svg.appendChild(lbl);
    }
  }
  const groupW = plotW / groups.length;
  const barW = Math.min(opts.mini ? 16 : 30, groupW / (series.length + 1.5));
  const gap = opts.mini ? 4 : 7, baseline = padT + plotH;

  groups.forEach(function (g, gi) {
    const center = padL + groupW * gi + groupW / 2;
    const blockW = series.length * barW + (series.length - 1) * gap;
    g.values.forEach(function (v, si) {
      const h = (v / maxY) * plotH;
      const x = center - blockW / 2 + si * (barW + gap);
      const rect = svgEl('rect', { x: x, y: baseline - h, width: barW, height: h, rx: 4, fill: series[si].color });
      rect.classList.add('barv-grow');
      rect.style.transformOrigin = (x + barW / 2) + 'px ' + baseline + 'px';
      rect.style.transform = 'scaleY(0)';
      requestAnimationFrame(function () { requestAnimationFrame(function () { rect.style.transform = 'scaleY(1)'; }); });
      bindTip(rect, g.label + ' · ' + series[si].name + ' <b>' + formatNum(v, v < 10 ? 1 : 0) + (opts.unit || '') + '</b>');
      svg.appendChild(rect);
    });
    if (!opts.mini) {
      const xl = svgEl('text', { x: center, y: H - padB + 22, 'text-anchor': 'middle' });
      xl.textContent = g.label; svg.appendChild(xl);
    }
  });
  container.appendChild(svg);
  if (!opts.mini) {
    const lg = el('div', 'legend');
    series.forEach(function (s) { lg.appendChild(el('div', 'legend-item', '<span class="legend-dot" style="background:' + s.color + '"></span>' + s.name)); });
    container.appendChild(lg);
  }
}
