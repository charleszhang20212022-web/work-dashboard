/* =====================================================================
   index.js — 서버 엔트리포인트
   ---------------------------------------------------------------------
   Express + Socket.io + 세션 + Passport(Google) + 정적 호스팅 + REST API
   + 일일 결산 자동 메일 스케줄러.
   ===================================================================== */

require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Server } = require('socket.io');

const store = require('./store');
const auth = require('./auth');
const mailer = require('./mailer');
const socketSetup = require('./socket');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

async function start() {
  await store.init();
  mailer.initTransport();
  auth.configure();

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  /* ---- 세션 (Socket.io 와 공유) -------------------------------- */
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'aurora-work-dashboard-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 }
  });
  app.use(sessionMiddleware);
  io.engine.use(sessionMiddleware);

  app.use(passport.initialize());
  app.use(auth.attachUser);

  /* ---- 라우트 -------------------------------------------------- */
  app.get('/healthz', function (req, res) {
    res.json({ ok: true, backend: store.backend, mail: mailer.status().mode, time: new Date().toISOString() });
  });

  app.use('/auth', authRoutes);
  app.use('/api', apiRoutes(io, mailer));

  app.get('/login', function (req, res) {
    if (req.user) return res.redirect('/');
    res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
  });

  // 정적 자산 (login.html 의 css/js 포함). index 자동 제공은 비활성화.
  app.use(express.static(PUBLIC_DIR, { index: false }));

  // 대시보드(메인) — 로그인 필요
  app.get('/', auth.requireAuth, function (req, res) {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });

  /* ---- 실시간 채팅 -------------------------------------------- */
  socketSetup.setup(io);

  /* ---- 일일 결산 자동 메일 스케줄러 --------------------------- */
  mailer.schedule();

  server.listen(PORT, function () {
    console.log('────────────────────────────────────────────');
    console.log(' 업무 종합 대시보드(고도화) 실행 중');
    console.log(' http://localhost:' + PORT);
    console.log(' 저장소: ' + store.backend + ' / 메일: ' + mailer.status().mode);
    console.log(' Google 로그인: ' + (auth.googleEnabled() ? '활성' : '비활성(데모 로그인 사용)'));
    console.log('────────────────────────────────────────────');
  });
}

start().catch(function (err) {
  console.error('서버 시작 실패:', err);
  process.exit(1);
});
