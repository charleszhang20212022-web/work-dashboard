/* =====================================================================
   data.js — 업무 종합 대시보드 샘플 데이터
   ---------------------------------------------------------------------
   모든 페이지(index / tasks / projects / reports)가 공유하는
   전역 데이터 객체입니다. 실제 서비스에서는 이 부분이 API 응답으로
   대체됩니다.
   ===================================================================== */

const DASHBOARD_DATA = {

  /* ---- 기본 정보 ---------------------------------------------------- */
  meta: {
    company: '오로라 테크놀로지',
    user: { name: '펑린항', role: '운영팀 매니저', initial: '펑' },
    updatedAt: '2026-05-19',
    period: '2026년 5월 기준'
  },

  /* ---- 핵심 지표 (KPI 카드) ---------------------------------------- */
  kpis: [
    { key: 'revenue',   label: '총 매출',     value: 4.82, decimals: 2,
      prefix: '₩', suffix: '억',  delta: 12.5, deltaSuffix: '%',  trend: 'up',
      color: 'indigo',  icon: 'revenue', note: '전월 대비' },
    { key: 'customers', label: '신규 고객',   value: 1284, decimals: 0,
      prefix: '',  suffix: '명',  delta: 8.3,  deltaSuffix: '%',  trend: 'up',
      color: 'sky',     icon: 'users',   note: '전월 대비' },
    { key: 'tasks',     label: '완료 업무',   value: 156,  decimals: 0,
      prefix: '',  suffix: '건',  delta: 12,   deltaSuffix: '건', trend: 'up',
      color: 'emerald', icon: 'check',   note: '이번 달' },
    { key: 'rate',      label: '평균 진행률', value: 87.4, decimals: 1,
      prefix: '',  suffix: '%',   delta: -2.1, deltaSuffix: '%p', trend: 'down',
      color: 'amber',   icon: 'gauge',   note: '전월 대비' }
  ],

  /* ---- 매출 추이 (라인 차트, 기간 토글용 2종) ----------------------- */
  revenue: {
    yearly: {
      label: '최근 12개월',
      unit: '억원',
      points: [
        { x: "'25 6월", y: 3.2 }, { x: '7월',  y: 3.5 }, { x: '8월',  y: 3.1 },
        { x: '9월',     y: 3.9 }, { x: '10월', y: 4.3 }, { x: '11월', y: 4.1 },
        { x: '12월',    y: 4.8 }, { x: "'26 1월", y: 4.0 }, { x: '2월', y: 4.4 },
        { x: '3월',     y: 4.6 }, { x: '4월',  y: 5.1 }, { x: '5월',  y: 4.82 }
      ]
    },
    weekly: {
      label: '최근 7일',
      unit: '백만원',
      points: [
        { x: '5/13', y: 38 }, { x: '5/14', y: 44 }, { x: '5/15', y: 36 },
        { x: '5/16', y: 52 }, { x: '5/17', y: 41 }, { x: '5/18', y: 29 },
        { x: '5/19', y: 47 }
      ]
    }
  },

  /* ---- 업무 진행 상태 (도넛 차트) ----------------------------------- */
  taskStatus: [
    { label: '완료',    value: 156, color: '#10b981' },
    { label: '진행 중', value: 48,  color: '#6366f1' },
    { label: '대기',    value: 22,  color: '#f59e0b' },
    { label: '지연',    value: 9,   color: '#ef4444' }
  ],

  /* ---- 부서별 목표 달성률 (가로 막대) ------------------------------- */
  departments: [
    { name: '영업팀',     achievement: 112 },
    { name: '마케팅팀',   achievement: 94  },
    { name: '개발팀',     achievement: 88  },
    { name: '운영팀',     achievement: 103 },
    { name: '고객지원팀', achievement: 97  }
  ],

  /* ---- 주요 업무 목록 ----------------------------------------------- */
  tasks: [
    { id: 'T-101', title: '2분기 마케팅 캠페인 기획',  assignee: '김서연', dept: '마케팅팀',
      priority: '높음', status: '진행 중', due: '2026-05-24', progress: 65 },
    { id: 'T-102', title: '신규 고객 온보딩 자동화',    assignee: '이준호', dept: '개발팀',
      priority: '높음', status: '진행 중', due: '2026-05-27', progress: 40 },
    { id: 'T-103', title: '4월 매출 보고서 작성',       assignee: '박지민', dept: '영업팀',
      priority: '보통', status: '완료',    due: '2026-05-08', progress: 100 },
    { id: 'T-104', title: '고객 만족도 설문 분석',      assignee: '최유진', dept: '고객지원팀',
      priority: '보통', status: '완료',    due: '2026-05-12', progress: 100 },
    { id: 'T-105', title: '사내 보안 점검',             assignee: '정민재', dept: '개발팀',
      priority: '높음', status: '지연',    due: '2026-05-15', progress: 55 },
    { id: 'T-106', title: '파트너사 계약 갱신',         assignee: '한가람', dept: '영업팀',
      priority: '높음', status: '진행 중', due: '2026-05-30', progress: 25 },
    { id: 'T-107', title: '웹사이트 리뉴얼 디자인',     assignee: '강예나', dept: '개발팀',
      priority: '보통', status: '진행 중', due: '2026-06-05', progress: 50 },
    { id: 'T-108', title: '신제품 출시 일정 조율',      assignee: '윤도현', dept: '운영팀',
      priority: '높음', status: '대기',    due: '2026-06-10', progress: 0 },
    { id: 'T-109', title: '5월 급여 정산',              assignee: '박지민', dept: '운영팀',
      priority: '보통', status: '진행 중', due: '2026-05-22', progress: 80 },
    { id: 'T-110', title: 'SNS 콘텐츠 제작',            assignee: '김서연', dept: '마케팅팀',
      priority: '낮음', status: '진행 중', due: '2026-05-26', progress: 70 },
    { id: 'T-111', title: '고객 데이터 마이그레이션',   assignee: '이준호', dept: '개발팀',
      priority: '높음', status: '대기',    due: '2026-06-15', progress: 0 },
    { id: 'T-112', title: '분기 실적 발표 자료',        assignee: '최유진', dept: '영업팀',
      priority: '보통', status: '진행 중', due: '2026-05-28', progress: 35 },
    { id: 'T-113', title: '채용 면접 일정 관리',        assignee: '한가람', dept: '운영팀',
      priority: '낮음', status: '완료',    due: '2026-05-10', progress: 100 },
    { id: 'T-114', title: '재고 관리 시스템 점검',      assignee: '정민재', dept: '운영팀',
      priority: '보통', status: '지연',    due: '2026-05-16', progress: 60 }
  ],

  /* ---- 프로젝트 현황 ------------------------------------------------ */
  projects: [
    { name: '차세대 ERP 구축',    owner: '이준호', dept: '개발팀',     status: '정상',
      progress: 72, start: '2026-02-01', end: '2026-08-31', members: 8,
      budget: 120000, spent: 81000 },
    { name: '글로벌 마케팅 확장', owner: '김서연', dept: '마케팅팀',   status: '주의',
      progress: 45, start: '2026-03-15', end: '2026-09-30', members: 5,
      budget: 85000,  spent: 52000 },
    { name: '모바일 앱 2.0',      owner: '강예나', dept: '개발팀',     status: '정상',
      progress: 88, start: '2026-01-10', end: '2026-06-20', members: 6,
      budget: 64000,  spent: 60000 },
    { name: '고객지원 챗봇 도입', owner: '최유진', dept: '고객지원팀', status: '정상',
      progress: 60, start: '2026-04-01', end: '2026-07-15', members: 4,
      budget: 38000,  spent: 19000 },
    { name: '물류 자동화',        owner: '윤도현', dept: '운영팀',     status: '지연',
      progress: 30, start: '2026-03-01', end: '2026-08-01', members: 7,
      budget: 95000,  spent: 41000 },
    { name: '데이터 보안 강화',   owner: '정민재', dept: '개발팀',     status: '정상',
      progress: 95, start: '2026-02-20', end: '2026-05-31', members: 3,
      budget: 42000,  spent: 39500 }
  ],

  /* ---- 최근 활동 피드 ----------------------------------------------- */
  activities: [
    { time: '10분 전', text: "박지민님이 '4월 매출 보고서'를 완료했습니다.",          type: 'check' },
    { time: '1시간 전', text: "김서연님이 '2분기 마케팅 캠페인'에 댓글을 남겼습니다.", type: 'comment' },
    { time: '3시간 전', text: "'모바일 앱 2.0' 진행률이 88%에 도달했습니다.",          type: 'progress' },
    { time: '어제',     text: "이준호님이 신규 업무 '고객 데이터 마이그레이션'을 등록했습니다.", type: 'add' },
    { time: '어제',     text: "'사내 보안 점검' 업무가 지연 상태로 변경되었습니다.",    type: 'alert' },
    { time: '2일 전',   text: "최유진님이 고객 만족도 설문 분석을 완료했습니다.",       type: 'check' },
    { time: '3일 전',   text: "정민재님이 '데이터 보안 강화' 프로젝트에 합류했습니다.", type: 'user' }
  ],

  /* ---- 보고서 데이터 ------------------------------------------------ */
  reports: {
    // 분기별 실적 (단위: 억원)
    quarterly: [
      { q: "'25 3Q", revenue: 11.2, profit: 4.1 },
      { q: "'25 4Q", revenue: 13.6, profit: 5.3 },
      { q: "'26 1Q", revenue: 13.0, profit: 5.0 },
      { q: "'26 2Q", revenue: 14.8, profit: 6.2 }
    ],
    // 매출 채널 비중 (%)
    channels: [
      { name: '온라인 스토어', value: 42, color: '#6366f1' },
      { name: '직영 매장',     value: 24, color: '#0ea5e9' },
      { name: '모바일 앱',     value: 21, color: '#10b981' },
      { name: '파트너사',      value: 13, color: '#f59e0b' }
    ],
    // 팀별 성과 요약
    teams: [
      { name: '영업팀',     completed: 62, ontime: 94, score: 'A'  },
      { name: '마케팅팀',   completed: 48, ontime: 88, score: 'B+' },
      { name: '개발팀',     completed: 71, ontime: 82, score: 'B+' },
      { name: '운영팀',     completed: 55, ontime: 91, score: 'A-' },
      { name: '고객지원팀', completed: 39, ontime: 96, score: 'A'  }
    ],
    // 핵심 인사이트
    insights: [
      '최근 12개월 매출이 꾸준한 우상향 추세이며, 4월에 5.1억으로 최고치를 기록했습니다.',
      '온라인 채널 비중이 42%로 가장 높아, 디지털 전환 전략이 효과를 보이고 있습니다.',
      '개발팀 완료 건수는 가장 많으나 정시 완료율(82%)은 개선이 필요합니다.',
      "'물류 자동화' 프로젝트가 지연 상태로, 일정 재조정 검토가 권장됩니다."
    ]
  }
};
