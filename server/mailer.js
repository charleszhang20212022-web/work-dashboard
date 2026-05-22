/* =====================================================================
   mailer.js — 일일 결산 자동 메일 발송 (보너스 기능)
   ---------------------------------------------------------------------
   • Gmail(GMAIL_USER + GMAIL_APP_PASSWORD) 또는 일반 SMTP 지원
   • node-cron 으로 매분 확인하여 설정된 시각에 일일 결산 메일 발송
   • 수동 발송(즉시 보내기) API 도 제공
   메일 자격 증명이 없으면 '시뮬레이션 모드'로 동작하여 앱은 정상 실행됩니다.
   ===================================================================== */

const nodemailer = require('nodemailer');
const cron = require('node-cron');
const store = require('./store');

let transporter = null;
let mode = 'disabled';   // 'gmail' | 'smtp' | 'disabled'

function initTransport() {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
    });
    mode = 'gmail';
  } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE) === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    mode = 'smtp';
  } else {
    mode = 'disabled';
  }
  console.log('[mailer] 모드: ' + mode);
  return mode;
}

function fromAddress() {
  return process.env.MAIL_FROM ||
         process.env.GMAIL_USER ||
         process.env.SMTP_USER ||
         'no-reply@work-dashboard.local';
}

function recipients() {
  const s = store.getState();
  const set = (s.settings.mail.recipients || []).filter(Boolean);
  if (set.length) return set;
  if (process.env.MAIL_DEFAULT_TO) {
    return process.env.MAIL_DEFAULT_TO.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
  }
  return s.users.map(function (u) { return u.email; }).filter(Boolean);
}

/* ---- 일일 결산 메일 본문 ----------------------------------------- */
function buildReport() {
  const s = store.getState();
  const a = s.analytics;
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const counts = { 완료: 0, '진행 중': 0, 대기: 0, 지연: 0 };
  s.tasks.forEach(function (t) { if (counts[t.status] != null) counts[t.status]++; });

  const sum = a.daily.summary || {};
  const sumRows = Object.keys(sum).map(function (k) {
    return '<tr><td style="padding:8px 14px;color:#5b6273;border-bottom:1px solid #f0f1f6">' + k +
           '</td><td style="padding:8px 14px;font-weight:700;text-align:right;border-bottom:1px solid #f0f1f6">' + sum[k] + '</td></tr>';
  }).join('');

  const subject = '[오로라 테크놀로지] 일일 결산 리포트 · ' + today;
  const text =
    '오로라 테크놀로지 일일 결산 리포트\n' + today + '\n\n' +
    Object.keys(sum).map(function (k) { return '- ' + k + ': ' + sum[k]; }).join('\n') + '\n\n' +
    '업무 현황 — 완료 ' + counts['완료'] + ' / 진행 중 ' + counts['진행 중'] +
    ' / 대기 ' + counts['대기'] + ' / 지연 ' + counts['지연'] + '\n';

  const html =
  '<div style="font-family:Apple SD Gothic Neo,Pretendard,Arial,sans-serif;max-width:560px;margin:0 auto;background:#f4f5fb;padding:24px">' +
    '<div style="background:linear-gradient(120deg,#6366f1,#8b5cf6);border-radius:16px 16px 0 0;padding:24px 28px;color:#fff">' +
      '<div style="font-size:13px;opacity:.85;letter-spacing:1px">AURORA TECHNOLOGY</div>' +
      '<div style="font-size:21px;font-weight:800;margin-top:4px">일일 결산 리포트</div>' +
      '<div style="font-size:13px;opacity:.9;margin-top:6px">' + today + '</div>' +
    '</div>' +
    '<div style="background:#fff;padding:24px 28px;border-radius:0 0 16px 16px;box-shadow:0 4px 16px rgba(20,23,40,.07)">' +
      '<h3 style="margin:0 0 12px;font-size:15px;color:#1f2433">오늘의 핵심 지표</h3>' +
      '<table style="width:100%;border-collapse:collapse;font-size:14px;color:#1f2433">' + sumRows + '</table>' +
      '<h3 style="margin:22px 0 12px;font-size:15px;color:#1f2433">업무 진행 현황</h3>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        badge('완료 ' + counts['완료'], '#d1fae5', '#047857') +
        badge('진행 중 ' + counts['진행 중'], '#e0e7ff', '#4338ca') +
        badge('대기 ' + counts['대기'], '#fef3c7', '#b45309') +
        badge('지연 ' + counts['지연'], '#fee2e2', '#b91c1c') +
      '</div>' +
      '<h3 style="margin:22px 0 10px;font-size:15px;color:#1f2433">핵심 인사이트</h3>' +
      '<ul style="margin:0;padding-left:18px;color:#5b6273;font-size:13px;line-height:1.7">' +
        a.insights.slice(0, 3).map(function (i) { return '<li>' + i + '</li>'; }).join('') +
      '</ul>' +
      '<div style="margin-top:24px;padding-top:16px;border-top:1px solid #f0f1f6;font-size:11px;color:#8b91a3">' +
        '본 메일은 업무 종합 대시보드에서 자동 발송되었습니다.</div>' +
    '</div>' +
  '</div>';

  return { subject: subject, text: text, html: html };
}

function badge(label, bg, color) {
  return '<span style="display:inline-block;background:' + bg + ';color:' + color +
         ';font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px">' + label + '</span>';
}

/* ---- 발송 --------------------------------------------------------- */
async function sendDailySettlement(opts) {
  opts = opts || {};
  const s = store.getState();
  const to = (opts.to && opts.to.length ? opts.to : recipients());
  const report = buildReport();
  const stamp = new Date().toISOString();

  if (mode === 'disabled') {
    s.settings.mail.lastSentAt = stamp;
    s.settings.mail.lastStatus = 'simulated';
    store.persist();
    return {
      ok: true, simulated: true, to: to,
      message: '메일 자격 증명이 없어 시뮬레이션으로 처리했습니다. (GMAIL_USER/GMAIL_APP_PASSWORD 설정 시 실제 발송)',
      subject: report.subject
    };
  }

  if (!to.length) {
    s.settings.mail.lastStatus = 'no-recipients';
    store.persist();
    return { ok: false, message: '수신자가 없습니다. 수신자 메일을 추가하세요.' };
  }

  try {
    const info = await transporter.sendMail({
      from: '"업무 종합 대시보드" <' + fromAddress() + '>',
      to: to.join(','), subject: report.subject, text: report.text, html: report.html
    });
    s.settings.mail.lastSentAt = stamp;
    s.settings.mail.lastStatus = 'sent';
    store.persist();
    return { ok: true, simulated: false, to: to, messageId: info.messageId, subject: report.subject };
  } catch (err) {
    s.settings.mail.lastStatus = 'error: ' + err.message;
    store.persist();
    return { ok: false, message: '발송 실패: ' + err.message };
  }
}

/* ---- 매일 자동 발송 스케줄 (매분 확인) --------------------------- */
function schedule() {
  cron.schedule('* * * * *', function () {
    const s = store.getState();
    const m = s.settings.mail;
    if (!m.enabled) return;

    const now = new Date();
    const hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    if (hhmm !== (m.time || '18:00')) return;

    const todayKey = now.toISOString().slice(0, 10);
    const lastKey = m.lastSentAt ? m.lastSentAt.slice(0, 10) : null;
    if (lastKey === todayKey) return;       // 오늘 이미 발송됨

    console.log('[mailer] 일일 결산 자동 발송 트리거 (' + hhmm + ')');
    sendDailySettlement().then(function (r) {
      console.log('[mailer] 자동 발송 결과:', r.ok ? (r.simulated ? '시뮬레이션' : '발송 완료') : r.message);
    });
  });
  console.log('[mailer] 일일 자동 발송 스케줄러 시작');
}

function status() {
  const s = store.getState();
  return {
    mode: mode,
    enabled: s.settings.mail.enabled,
    time: s.settings.mail.time,
    recipients: recipients(),
    lastSentAt: s.settings.mail.lastSentAt,
    lastStatus: s.settings.mail.lastStatus
  };
}

module.exports = {
  initTransport: initTransport,
  sendDailySettlement: sendDailySettlement,
  schedule: schedule,
  status: status,
  buildReport: buildReport
};
