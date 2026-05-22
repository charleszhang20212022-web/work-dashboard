/* =====================================================================
   socket.js — 업무용 SNS 실시간 채팅 + 접속 상태(presence)
   ---------------------------------------------------------------------
   Express 세션을 공유하여 로그인 사용자를 식별합니다.
   ===================================================================== */

const store = require('./store');

function setup(io) {
  const presence = {};   // userId -> 연결 수

  io.on('connection', function (socket) {
    const session = socket.request.session;
    const user = session && session.user;
    if (!user) { socket.disconnect(true); return; }

    /* 접속 상태 */
    presence[user.id] = (presence[user.id] || 0) + 1;
    setOnline(user.id, true);
    io.emit('presence:update', onlineIds(presence));

    /* 채팅 전송 */
    socket.on('chat:send', function (payload) {
      payload = payload || {};
      const text = (payload.text || '').trim();
      if (!text) return;
      const s = store.getState();
      const u = s.users.find(function (x) { return x.id === user.id; }) || user;
      const msg = {
        id: 'm' + store.nextId('msg'),
        channel: payload.channel || '전체',
        userId: u.id, name: u.name, initial: u.initial, colors: u.colors,
        text: text.slice(0, 1000),
        ts: new Date().toISOString()
      };
      s.chat.push(msg);
      if (s.chat.length > 500) s.chat = s.chat.slice(-500);
      store.persist();
      io.emit('chat:new', msg);
    });

    /* 타이핑 표시 */
    socket.on('chat:typing', function (payload) {
      socket.broadcast.emit('chat:typing', {
        channel: (payload && payload.channel) || '전체',
        name: user.name
      });
    });

    socket.on('disconnect', function () {
      presence[user.id] = Math.max(0, (presence[user.id] || 1) - 1);
      if (presence[user.id] === 0) setOnline(user.id, false);
      io.emit('presence:update', onlineIds(presence));
    });
  });
}

function setOnline(id, val) {
  const s = store.getState();
  const u = s.users.find(function (x) { return x.id === id; });
  if (u) u.online = val;
}

function onlineIds(presence) {
  return Object.keys(presence).filter(function (id) { return presence[id] > 0; });
}

module.exports = { setup: setup };
