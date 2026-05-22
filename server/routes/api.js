/* =====================================================================
   routes/api.js — REST API (사용자 · 업무분장 · 채팅 · 포스트잇 · 결산 · 메일)
   ---------------------------------------------------------------------
   io(Socket.io) 와 mailer 를 주입받아 변경 시 실시간 브로드캐스트합니다.
   ===================================================================== */

const express = require('express');
const store = require('../store');
const auth = require('../auth');
const { requireAuth, requireRole } = auth;

module.exports = function (io, mailer) {
  const router = express.Router();
  router.use(requireAuth);   // 이하 모든 API 는 로그인 필요

  /* ---- 부트스트랩: 대시보드 초기 로딩 데이터 일괄 제공 ---------- */
  router.get('/bootstrap', function (req, res) {
    const s = store.getState();
    res.json({
      me: req.user,
      company: s.company,
      googleEnabled: auth.googleEnabled(),
      users: s.users.map(auth.publicUser),
      tasks: s.tasks,
      postits: s.postits,
      channels: s.channels,
      chat: s.chat.slice(-100),
      analytics: withLiveStatus(s),
      activities: s.activities,
      mail: mailer.status()
    });
  });

  router.get('/me', function (req, res) { res.json({ user: req.user }); });

  /* ---- 사용자 / 권한 관리 -------------------------------------- */
  router.get('/users', function (req, res) {
    res.json(store.getState().users.map(auth.publicUser));
  });

  router.patch('/users/:id', requireRole('admin'), function (req, res) {
    const s = store.getState();
    const u = s.users.find(function (x) { return x.id === req.params.id; });
    if (!u) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    const { role, dept, title } = req.body || {};
    if (role && ['admin', 'leader', 'member'].indexOf(role) !== -1) u.role = role;
    if (dept != null) u.dept = dept;
    if (title != null) u.title = title;
    store.persist();
    io.emit('users:update');
    res.json(auth.publicUser(u));
  });

  /* ---- 업무 분장 (Tasks) --------------------------------------- */
  router.get('/tasks', function (req, res) {
    res.json(store.getState().tasks);
  });

  router.post('/tasks', requireRole('admin', 'leader'), function (req, res) {
    const s = store.getState();
    const b = req.body || {};
    if (!b.title) return res.status(400).json({ error: '업무 제목을 입력하세요.' });
    const assignee = s.users.find(function (u) { return u.id === b.assigneeId; });
    const task = {
      id: 'T-' + store.nextId('task'),
      title: b.title,
      assigneeId: b.assigneeId || null,
      assignee: assignee ? assignee.name : (b.assignee || '미지정'),
      assignerId: req.user.id,
      dept: b.dept || (assignee ? assignee.dept : '미배정'),
      priority: b.priority || '보통',
      status: b.status || '대기',
      due: b.due || '',
      progress: Number(b.progress) || 0,
      shared: b.shared !== false,
      memo: b.memo || '',
      createdAt: new Date().toISOString()
    };
    s.tasks.unshift(task);
    addActivity(s, req.user.name + "님이 '" + task.title + "' 업무를 등록했습니다.", 'add');
    store.persist();
    io.emit('tasks:update');
    res.status(201).json(task);
  });

  router.patch('/tasks/:id', function (req, res) {
    const s = store.getState();
    const t = s.tasks.find(function (x) { return x.id === req.params.id; });
    if (!t) return res.status(404).json({ error: '업무를 찾을 수 없습니다.' });

    const isManager = req.user.role === 'admin' || req.user.role === 'leader';
    const isAssignee = t.assigneeId === req.user.id;
    if (!isManager && !isAssignee) {
      return res.status(403).json({ error: '본인 담당 업무 또는 관리자/팀장만 수정할 수 있습니다.' });
    }

    const b = req.body || {};
    // 담당자 재지정 / 우선순위 / 부서 / 공유 → 관리자·팀장 전용
    if (isManager) {
      if (b.assigneeId !== undefined) {
        const a = s.users.find(function (u) { return u.id === b.assigneeId; });
        t.assigneeId = b.assigneeId;
        if (a) { t.assignee = a.name; if (!b.dept) t.dept = a.dept; }
      }
      if (b.priority !== undefined) t.priority = b.priority;
      if (b.dept !== undefined) t.dept = b.dept;
      if (b.shared !== undefined) t.shared = !!b.shared;
      if (b.title !== undefined) t.title = b.title;
      if (b.due !== undefined) t.due = b.due;
    }
    // 상태 / 진행률 / 메모 → 담당자도 가능
    if (b.status !== undefined) t.status = b.status;
    if (b.progress !== undefined) t.progress = Math.max(0, Math.min(100, Number(b.progress)));
    if (b.memo !== undefined) t.memo = b.memo;
    if (t.progress === 100 && t.status !== '완료') t.status = '완료';

    store.persist();
    io.emit('tasks:update');
    res.json(t);
  });

  router.delete('/tasks/:id', requireRole('admin', 'leader'), function (req, res) {
    const s = store.getState();
    const i = s.tasks.findIndex(function (x) { return x.id === req.params.id; });
    if (i === -1) return res.status(404).json({ error: '업무를 찾을 수 없습니다.' });
    const [removed] = s.tasks.splice(i, 1);
    store.persist();
    io.emit('tasks:update');
    res.json({ ok: true, removed: removed.id });
  });

  /* ---- 채팅 이력 ----------------------------------------------- */
  router.get('/chat', function (req, res) {
    const s = store.getState();
    const ch = req.query.channel;
    let list = s.chat;
    if (ch && ch !== '전체') list = list.filter(function (m) { return m.channel === ch; });
    res.json(list.slice(-100));
  });

  /* ---- 포스트잇 ------------------------------------------------ */
  router.get('/postits', function (req, res) {
    res.json(store.getState().postits);
  });

  router.post('/postits', function (req, res) {
    const s = store.getState();
    const b = req.body || {};
    if (!b.text || !b.text.trim()) return res.status(400).json({ error: '내용을 입력하세요.' });
    const note = {
      id: 'p' + store.nextId('postit'),
      userId: req.user.id, name: req.user.name,
      text: b.text.trim(),
      color: b.color || '#fef08a',
      createdAt: new Date().toISOString()
    };
    s.postits.unshift(note);
    store.persist();
    io.emit('postits:update');
    res.status(201).json(note);
  });

  router.patch('/postits/:id', function (req, res) {
    const s = store.getState();
    const n = s.postits.find(function (x) { return x.id === req.params.id; });
    if (!n) return res.status(404).json({ error: '메모를 찾을 수 없습니다.' });
    if (n.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '작성자 또는 관리자만 수정할 수 있습니다.' });
    }
    const b = req.body || {};
    if (b.text !== undefined) n.text = b.text;
    if (b.color !== undefined) n.color = b.color;
    store.persist();
    io.emit('postits:update');
    res.json(n);
  });

  router.delete('/postits/:id', function (req, res) {
    const s = store.getState();
    const i = s.postits.findIndex(function (x) { return x.id === req.params.id; });
    if (i === -1) return res.status(404).json({ error: '메모를 찾을 수 없습니다.' });
    if (s.postits[i].userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '작성자 또는 관리자만 삭제할 수 있습니다.' });
    }
    s.postits.splice(i, 1);
    store.persist();
    io.emit('postits:update');
    res.json({ ok: true });
  });

  /* ---- 결산 분석 (일·주·월·분기·연) ---------------------------- */
  router.get('/settlements', function (req, res) {
    res.json(withLiveStatus(store.getState()));
  });

  router.get('/settlements/:period', function (req, res) {
    const a = withLiveStatus(store.getState());
    const key = req.params.period;
    if (!a[key]) return res.status(404).json({ error: '지원하지 않는 기간입니다.' });
    res.json({ period: key, data: a[key], taskStatus: a.taskStatus, insights: a.insights });
  });

  /* ---- 메일 (자동 발송) ---------------------------------------- */
  router.get('/mail/status', function (req, res) { res.json(mailer.status()); });

  router.post('/mail/send', requireRole('admin'), function (req, res) {
    const to = (req.body && req.body.to) || null;
    mailer.sendDailySettlement({ to: to }).then(function (r) {
      io.emit('mail:update');
      res.json(r);
    });
  });

  router.patch('/mail/settings', requireRole('admin'), function (req, res) {
    const s = store.getState();
    const b = req.body || {};
    if (b.enabled !== undefined) s.settings.mail.enabled = !!b.enabled;
    if (b.time !== undefined && /^\d{2}:\d{2}$/.test(b.time)) s.settings.mail.time = b.time;
    if (b.recipients !== undefined) {
      s.settings.mail.recipients = Array.isArray(b.recipients)
        ? b.recipients
        : String(b.recipients).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    }
    store.persist();
    io.emit('mail:update');
    res.json(mailer.status());
  });

  return router;
};

/* ---- 헬퍼 --------------------------------------------------------- */
function withLiveStatus(s) {
  // 실제 업무 데이터로 taskStatus 도넛을 갱신
  const counts = { '완료': 0, '진행 중': 0, '대기': 0, '지연': 0 };
  s.tasks.forEach(function (t) { if (counts[t.status] != null) counts[t.status]++; });
  const colorMap = { '완료': '#10b981', '진행 중': '#6366f1', '대기': '#f59e0b', '지연': '#ef4444' };
  const taskStatus = Object.keys(counts).map(function (k) {
    return { label: k, value: counts[k], color: colorMap[k] };
  });
  return Object.assign({}, s.analytics, { taskStatus: taskStatus });
}

function addActivity(s, text, type) {
  s.activities.unshift({ time: '방금', text: text, type: type || 'add' });
  s.activities = s.activities.slice(0, 12);
}
