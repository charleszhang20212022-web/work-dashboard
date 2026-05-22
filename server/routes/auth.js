/* =====================================================================
   routes/auth.js — 로그인 / 로그아웃 라우트
   ===================================================================== */

const express = require('express');
const passport = require('passport');
const router = express.Router();
const auth = require('../auth');
const store = require('../store');

/* ---- Google 로그인 ----------------------------------------------- */
router.get('/google', function (req, res, next) {
  if (!auth.googleEnabled()) return res.redirect('/login?e=google_disabled');
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get('/google/callback', function (req, res, next) {
  if (!auth.googleEnabled()) return res.redirect('/login?e=google_disabled');
  passport.authenticate('google', { session: false, failureRedirect: '/login?e=google_failed' },
    function (err, user) {
      if (err || !user) return res.redirect('/login?e=google_failed');
      req.session.user = auth.publicUser(user);
      res.redirect('/');
    })(req, res, next);
});

/* ---- 관리자 로그인 ----------------------------------------------- */
router.post('/admin', function (req, res) {
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin1234';
  const { username, password } = req.body || {};

  if (username !== adminUser || password !== adminPass) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }

  const s = store.getState();
  let admin = s.users.find(function (u) { return u.role === 'admin'; });
  if (!admin) { admin = s.users[0]; admin.role = 'admin'; }
  req.session.user = auth.publicUser(admin);
  res.json({ ok: true, user: req.session.user });
});

/* ---- 데모 로그인 (OAuth 미설정 환경 시연용) ---------------------- */
router.post('/demo', function (req, res) {
  const s = store.getState();
  const id = (req.body && req.body.id) || 'u1';
  const user = s.users.find(function (u) { return u.id === id; }) || s.users[0];
  req.session.user = auth.publicUser(user);
  res.json({ ok: true, user: req.session.user });
});

/* ---- 로그아웃 ---------------------------------------------------- */
router.post('/logout', function (req, res) {
  req.session.destroy(function () { res.json({ ok: true }); });
});

module.exports = router;
