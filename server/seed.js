/* =====================================================================
   seed.js — 초기 시드 데이터
   ---------------------------------------------------------------------
   최초 부팅 시(저장된 상태가 없을 때) 사용되는 기본 데이터입니다.
   기존 정적 대시보드(data.js)의 자료를 사용자·권한·채팅·포스트잇 등
   고도화 기능에 맞게 확장했습니다.
   ===================================================================== */

const AVATAR_COLORS = [
  ['#818cf8', '#6366f1'], ['#34d399', '#10b981'], ['#38bdf8', '#0ea5e9'],
  ['#fbbf24', '#f59e0b'], ['#f472b6', '#ec4899'], ['#a78bfa', '#8b5cf6'],
  ['#fb7185', '#ef4444'], ['#2dd4bf', '#14b8a6'], ['#facc15', '#eab308']
];

function buildSeed() {
  /* ---- 사용자(팀원·팀장·관리자) ---------------------------------- */
  const users = [
    { id: 'u1', name: '펑린항',  initial: '펑', email: '',  role: 'admin',  dept: '운영팀',     title: '운영팀 매니저' },
    { id: 'u2', name: '김서연',  initial: '김', email: '',  role: 'leader', dept: '마케팅팀',   title: '마케팅 팀장' },
    { id: 'u3', name: '이준호',  initial: '이', email: '',  role: 'leader', dept: '개발팀',     title: '개발 팀장' },
    { id: 'u4', name: '박지민',  initial: '박', email: '',  role: 'leader', dept: '영업팀',     title: '영업 팀장' },
    { id: 'u5', name: '최유진',  initial: '최', email: '',  role: 'member', dept: '고객지원팀', title: '고객지원 담당' },
    { id: 'u6', name: '정민재',  initial: '정', email: '',  role: 'member', dept: '개발팀',     title: '백엔드 개발자' },
    { id: 'u7', name: '한가람',  initial: '한', email: '',  role: 'member', dept: '영업팀',     title: '영업 담당' },
    { id: 'u8', name: '강예나',  initial: '강', email: '',  role: 'member', dept: '개발팀',     title: 'UI/UX 디자이너' },
    { id: 'u9', name: '윤도현',  initial: '윤', email: '',  role: 'member', dept: '운영팀',     title: '운영 담당' }
  ];
  users.forEach(function (u, i) {
    u.colors = AVATAR_COLORS[i % AVATAR_COLORS.length];
    u.online = false;
    u.googleId = null;
    u.provider = 'seed';
  });

  const nameToId = {};
  users.forEach(function (u) { nameToId[u.name] = u.id; });

  /* ---- 업무 분장(과제) -------------------------------------------- */
  const rawTasks = [
    ['T-101', '2분기 마케팅 캠페인 기획', '김서연', '마케팅팀', '높음', '진행 중', '2026-05-24', 65],
    ['T-102', '신규 고객 온보딩 자동화',   '이준호', '개발팀',   '높음', '진행 중', '2026-05-27', 40],
    ['T-103', '4월 매출 보고서 작성',      '박지민', '영업팀',   '보통', '완료',    '2026-05-08', 100],
    ['T-104', '고객 만족도 설문 분석',     '최유진', '고객지원팀','보통', '완료',    '2026-05-12', 100],
    ['T-105', '사내 보안 점검',           '정민재', '개발팀',   '높음', '지연',    '2026-05-15', 55],
    ['T-106', '파트너사 계약 갱신',        '한가람', '영업팀',   '높음', '진행 중', '2026-05-30', 25],
    ['T-107', '웹사이트 리뉴얼 디자인',    '강예나', '개발팀',   '보통', '진행 중', '2026-06-05', 50],
    ['T-108', '신제품 출시 일정 조율',     '윤도현', '운영팀',   '높음', '대기',    '2026-06-10', 0],
    ['T-109', '5월 급여 정산',            '박지민', '운영팀',   '보통', '진행 중', '2026-05-22', 80],
    ['T-110', 'SNS 콘텐츠 제작',          '김서연', '마케팅팀', '낮음', '진행 중', '2026-05-26', 70],
    ['T-111', '고객 데이터 마이그레이션',  '이준호', '개발팀',   '높음', '대기',    '2026-06-15', 0],
    ['T-112', '분기 실적 발표 자료',       '최유진', '영업팀',   '보통', '진행 중', '2026-05-28', 35],
    ['T-113', '채용 면접 일정 관리',       '한가람', '운영팀',   '낮음', '완료',    '2026-05-10', 100],
    ['T-114', '재고 관리 시스템 점검',     '정민재', '운영팀',   '보통', '지연',    '2026-05-16', 60]
  ];
  const tasks = rawTasks.map(function (t) {
    return {
      id: t[0], title: t[1],
      assigneeId: nameToId[t[2]] || null, assignee: t[2],
      assignerId: 'u1', dept: t[3], priority: t[4], status: t[5],
      due: t[6], progress: t[7], shared: true,
      memo: '', createdAt: '2026-05-01T09:00:00.000Z'
    };
  });

  /* ---- 업무용 SNS 채팅 -------------------------------------------- */
  const channels = ['전체', '운영팀', '개발팀', '마케팅팀', '영업팀'];
  const messages = [
    { channel: '전체',   uid: 'u1', text: '안녕하세요 팀! 이번 주 결산 자료 금요일까지 부탁드립니다.', min: 180 },
    { channel: '전체',   uid: 'u2', text: '네 매니저님, 마케팅 캠페인 지표 정리해서 공유할게요.',       min: 165 },
    { channel: '개발팀', uid: 'u3', text: '온보딩 자동화 40% 진행됐습니다. 다음 주 데모 가능합니다.',  min: 95 },
    { channel: '개발팀', uid: 'u6', text: '보안 점검이 일정보다 지연되고 있어요. 리소스 지원 요청드립니다.', min: 60 },
    { channel: '마케팅팀', uid: 'u2', text: 'SNS 콘텐츠 초안 업로드했습니다. 피드백 주세요!',           min: 40 },
    { channel: '전체',   uid: 'u4', text: '4월 매출 보고서 완료했습니다 ✅', min: 12 }
  ];
  const now = Date.now();
  const chat = messages.map(function (m, i) {
    const u = users.find(function (x) { return x.id === m.uid; });
    return {
      id: 'm' + (i + 1), channel: m.channel, userId: m.uid,
      name: u.name, initial: u.initial, colors: u.colors,
      text: m.text, ts: new Date(now - m.min * 60000).toISOString()
    };
  });

  /* ---- 포스트잇 --------------------------------------------------- */
  const POSTIT_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa'];
  const postitSeed = [
    ['u1', '금요일 17시 전사 결산 미팅 — 회의실 A', 0],
    ['u2', '캠페인 A/B 테스트 결과 정리하기', 3],
    ['u3', '코드 리뷰 PR #142 확인 요청', 2],
    ['u5', '고객 VOC 주간 리포트 작성', 1]
  ];
  const postits = postitSeed.map(function (p, i) {
    const u = users.find(function (x) { return x.id === p[0]; });
    return {
      id: 'p' + (i + 1), userId: p[0], name: u.name,
      text: p[1], color: POSTIT_COLORS[p[2] % POSTIT_COLORS.length],
      createdAt: new Date(now - (i + 1) * 3600000).toISOString()
    };
  });

  /* ---- 결산 분석용 지표 ------------------------------------------- */
  const analytics = {
    kpis: [
      { key: 'revenue',  label: '총 매출',     value: 4.82, decimals: 2, prefix: '₩', suffix: '억', delta: 12.5, deltaSuffix: '%',  trend: 'up',   color: 'indigo',  icon: 'revenue', note: '전월 대비' },
      { key: 'customers',label: '신규 고객',   value: 1284, decimals: 0, prefix: '',  suffix: '명', delta: 8.3,  deltaSuffix: '%',  trend: 'up',   color: 'sky',     icon: 'users',   note: '전월 대비' },
      { key: 'tasks',    label: '완료 업무',   value: 156,  decimals: 0, prefix: '',  suffix: '건', delta: 12,   deltaSuffix: '건', trend: 'up',   color: 'emerald', icon: 'check',   note: '이번 달' },
      { key: 'rate',     label: '평균 진행률', value: 87.4, decimals: 1, prefix: '',  suffix: '%',  delta: -2.1, deltaSuffix: '%p', trend: 'down', color: 'amber',   icon: 'gauge',   note: '전월 대비' }
    ],
    daily: {
      label: '오늘',
      points: [
        { x: '09시', y: 6 }, { x: '11시', y: 11 }, { x: '13시', y: 9 },
        { x: '15시', y: 14 }, { x: '17시', y: 18 }, { x: '19시', y: 12 }
      ],
      unit: '건',
      summary: { 매출: '4,720만원', 신규고객: '47명', 완료업무: '12건', 상담: '38건' }
    },
    weekly: {
      label: '최근 7일', unit: '백만원',
      points: [
        { x: '5/16', y: 38 }, { x: '5/17', y: 44 }, { x: '5/18', y: 36 },
        { x: '5/19', y: 52 }, { x: '5/20', y: 41 }, { x: '5/21', y: 29 }, { x: '5/22', y: 47 }
      ]
    },
    monthly: {
      label: '최근 12개월', unit: '억원',
      points: [
        { x: "'25.6", y: 3.2 }, { x: '7', y: 3.5 }, { x: '8', y: 3.1 }, { x: '9', y: 3.9 },
        { x: '10', y: 4.3 }, { x: '11', y: 4.1 }, { x: '12', y: 4.8 }, { x: "'26.1", y: 4.0 },
        { x: '2', y: 4.4 }, { x: '3', y: 4.6 }, { x: '4', y: 5.1 }, { x: '5', y: 4.82 }
      ]
    },
    quarterly: {
      label: '분기별 실적', unit: '억원',
      groups: [
        { label: "'25 3Q", values: [11.2, 4.1] },
        { label: "'25 4Q", values: [13.6, 5.3] },
        { label: "'26 1Q", values: [13.0, 5.0] },
        { label: "'26 2Q", values: [14.8, 6.2] }
      ],
      series: [{ name: '매출', color: '#6366f1' }, { name: '이익', color: '#10b981' }]
    },
    annual: {
      label: '연간 매출', unit: '억원',
      points: [
        { x: '2022', y: 28.4 }, { x: '2023', y: 35.1 },
        { x: '2024', y: 42.7 }, { x: '2025', y: 49.6 }, { x: '2026E', y: 58.2 }
      ]
    },
    taskStatus: [
      { label: '완료',    value: 156, color: '#10b981' },
      { label: '진행 중', value: 48,  color: '#6366f1' },
      { label: '대기',    value: 22,  color: '#f59e0b' },
      { label: '지연',    value: 9,   color: '#ef4444' }
    ],
    departments: [
      { name: '영업팀', achievement: 112 }, { name: '마케팅팀', achievement: 94 },
      { name: '개발팀', achievement: 88 }, { name: '운영팀', achievement: 103 },
      { name: '고객지원팀', achievement: 97 }
    ],
    channels: [
      { name: '온라인 스토어', value: 42, color: '#6366f1' },
      { name: '직영 매장', value: 24, color: '#0ea5e9' },
      { name: '모바일 앱', value: 21, color: '#10b981' },
      { name: '파트너사', value: 13, color: '#f59e0b' }
    ],
    insights: [
      '최근 12개월 매출이 꾸준한 우상향 추세이며, 4월에 5.1억으로 최고치를 기록했습니다.',
      '온라인 채널 비중이 42%로 가장 높아 디지털 전환 전략이 효과를 보이고 있습니다.',
      '개발팀 완료 건수는 가장 많으나 정시 완료율(82%)은 개선이 필요합니다.',
      "'물류 자동화' 프로젝트가 지연 상태로, 일정 재조정 검토가 권장됩니다."
    ]
  };

  return {
    version: 2,
    company: '오로라 테크놀로지',
    users: users,
    channels: channels,
    tasks: tasks,
    chat: chat,
    postits: postits,
    analytics: analytics,
    activities: [
      { time: '10분 전',  text: "박지민님이 '4월 매출 보고서'를 완료했습니다.", type: 'check' },
      { time: '1시간 전', text: "김서연님이 '2분기 마케팅 캠페인'에 댓글을 남겼습니다.", type: 'comment' },
      { time: '3시간 전', text: "'모바일 앱 2.0' 진행률이 88%에 도달했습니다.", type: 'progress' },
      { time: '어제',     text: "이준호님이 '고객 데이터 마이그레이션'을 등록했습니다.", type: 'add' }
    ],
    settings: {
      mail: {
        enabled: true,
        time: '18:00',
        recipients: [],
        lastSentAt: null,
        lastStatus: null
      }
    },
    seq: { task: 114, msg: 6, postit: 4 }
  };
}

module.exports = { buildSeed: buildSeed };
