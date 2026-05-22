/* =====================================================================
   auth.js — 인증 (Google OAuth + 관리자 로그인 + 데모 로그인)
   ---------------------------------------------------------------------
   • Google 로그인: GOOGLE_CLIENT_ID / SECRET 가 설정되면 활성화
   • 관리자 로그인: ADMIN_USERNAME / ADMIN_PASSWORD (.env)
   • 데모 로그인 : OAuth 미설정 환경에서도 전체 기능 시연 가능
   세션은 req.session.user 로 관리하며 역할(role)은 admin/leader/member.
   ===================================================================== */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const store = require('./store');

const AVATAR_COLORS = [
  ['#818cf8', '#6366f1'], ['#34d399', '#10b981'], ['#38bdf8', '#0ea5e9'],
  ['#fbbf24', '#f59e0b'], ['#f472b6', '#ec4899'], ['#a78bfa', '#8b5cf6']
];

function googleEnabled() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/* ---- 사용자 조회/생성 -------------------------------------------- */
function findOrCreateGoogleUser(profile) {
  const s = store.getState();
  const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || '';
  const name = profile.displayName || (email ? email.split('@')[0] : '구글 사용자');

  let user = s.users.find(function (u) {
    return (u.googleId && u.googleId === profile.id) ||
           (email && u.email && u.email.toLowerCase() === email.toLowerCase());
  });

  if (user) {
    user.googleId = profile.id;
    if (email) user.email = email;
    if (profile.photos && profile.photos[0]) user.photo = profile.photos[0].value;
    user.provider = 'google';
  } else {
    const id = 'g' + (store.nextId('user') || Date.now());
    user = {
      id: id, name: name, initial: name.trim().charAt(0) || '구',
      email: email, role: 'member', dept: '미배정', title: '신규 구성원',
      colors: AVATAR_COLORS[s.users.length % AVATAR_COLORS.length],
      googleId: profile.id,
      photo: (profile.photos && profile.photos[0]) ? profile.photos[0].value : null,
      provider: 'google', online: false
    };
    s.users.push(user);
  }
  store.persist();
  return user;
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id, name: u.name, initial: u.initial, email: u.email,
    role: u.role, dept: u.dept, title: u.title, colors: u.colors,
    photo: u.photo || null, provider: u.provider
  };
}

/* ---- Passport 구성 ----------------------------------------------- */
function configure() {
  passport.serializeUser(function (user, done) { done(null, user.id); });
  passport.deserializeUser(function (id, done) {
    const s = store.getState();
    done(null, s.users.find(function (u) { return u.id === id; }) || null);
  });

  if (googleEnabled()) {
    const base = process.env.BASE_URL || ('http://localhost:' + (process.env.PORT || 3000));
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: base.replace(/\/$/, '') + '/auth/google/callback',
      proxy: true
    }, function (accessToken, refreshToken, profile, done) {
      try { done(null, findOrCreateGoogleUser(profile)); }
      catch (err) { done(err); }
    }));
    console.log('[auth] Google OAuth 활성화 (callback: ' + base.replace(/\/$/, '') + '/auth/google/callback)');
  } else {
    console.log('[auth] Google OAuth 비활성화 (GOOGLE_CLIENT_ID/SECRET 미설정) — 데모/관리자 로그인 사용 가능');
  }
}

/* ---- 미들웨어 ----------------------------------------------------- */
function attachUser(req, res, next) {
  if (req.session && req.session.user) {
    const s = store.getState();
    const live = s.users.find(function (u) { return u.id === req.session.user.id; });
    req.user = live ? publicUser(live) : req.session.user;
  }
  next();
}

function requireAuth(req, res, next) {
  if (req.user) return next();
  const isApi = req.originalUrl.indexOf('/api/') === 0 || req.xhr;
  if (!isApi && req.accepts('html')) return res.redirect('/login');
  return res.status(401).json({ error: '로그인이 필요합니다.' });
}

function requireRole() {
  const roles = Array.prototype.slice.call(arguments);
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: '로그인이 필요합니다.' });
    if (roles.indexOf(req.user.role) === -1) {
      return res.status(403).json({ error: '권한이 없습니다. (' + roles.join('/') + ' 전용)' });
    }
    next();
  };
}

module.exports = {
  configure: configure,
  googleEnabled: googleEnabled,
  findOrCreateGoogleUser: findOrCreateGoogleUser,
  publicUser: publicUser,
  attachUser: attachUser,
  requireAuth: requireAuth,
  requireRole: requireRole
};
