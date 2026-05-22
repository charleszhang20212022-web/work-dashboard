/* =====================================================================
   store.js — 상태 저장소 (Postgres 선택 / 파일·메모리 폴백)
   ---------------------------------------------------------------------
   전체 애플리케이션 상태를 하나의 JSON 문서로 관리합니다.
     • DATABASE_URL 이 있으면  → Postgres(JSONB 단일 행)에 저장
     • 없으면                  → data/store.json 파일에 저장
   이렇게 하면 DB 설정 없이도 바로 실행되고, Railway 에 Postgres 를
   연결하면 재배포에도 데이터가 유지됩니다.
   ===================================================================== */

const fs = require('fs');
const path = require('path');
const { buildSeed } = require('./seed');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE_PATH = path.join(DATA_DIR, 'store.json');

let state = null;
let backend = 'memory';   // 'pg' | 'file' | 'memory'
let pgPool = null;
let saveTimer = null;

/* ---- 초기화 -------------------------------------------------------- */
async function init() {
  if (process.env.DATABASE_URL) {
    try {
      await initPostgres();
      backend = 'pg';
    } catch (err) {
      console.error('[store] Postgres 연결 실패, 파일 저장으로 폴백:', err.message);
      backend = 'file';
    }
  } else {
    backend = 'file';
  }

  if (backend === 'pg') {
    state = await loadFromPostgres();
  } else {
    state = loadFromFile();
  }

  if (!state) {
    state = buildSeed();
    await persistNow();
    console.log('[store] 시드 데이터로 초기화했습니다.');
  }
  console.log('[store] 백엔드: ' + backend);
  return state;
}

/* ---- Postgres ------------------------------------------------------ */
async function initPostgres() {
  const { Pool } = require('pg');
  const ssl = /railway|render|heroku|amazonaws|supabase|neon/i.test(process.env.DATABASE_URL || '')
    ? { rejectUnauthorized: false }
    : (process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false);
  pgPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: ssl });
  await pgPool.query(
    'CREATE TABLE IF NOT EXISTS app_state (id INT PRIMARY KEY DEFAULT 1, data JSONB NOT NULL)'
  );
}

async function loadFromPostgres() {
  const res = await pgPool.query('SELECT data FROM app_state WHERE id = 1');
  return res.rows.length ? res.rows[0].data : null;
}

async function saveToPostgres() {
  await pgPool.query(
    'INSERT INTO app_state (id, data) VALUES (1, $1) ' +
    'ON CONFLICT (id) DO UPDATE SET data = $1',
    [state]
  );
}

/* ---- 파일 ---------------------------------------------------------- */
function loadFromFile() {
  try {
    if (fs.existsSync(FILE_PATH)) {
      return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[store] store.json 읽기 실패:', err.message);
  }
  return null;
}

function saveToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('[store] store.json 쓰기 실패:', err.message);
  }
}

/* ---- 영속화 (디바운스) -------------------------------------------- */
async function persistNow() {
  if (backend === 'pg') {
    try { await saveToPostgres(); }
    catch (err) { console.error('[store] Postgres 저장 실패:', err.message); }
  } else if (backend === 'file') {
    saveToFile();
  }
}

function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(function () { persistNow(); }, 400);
}

/* ---- 접근자 -------------------------------------------------------- */
function getState() { return state; }

function nextId(kind) {
  state.seq = state.seq || {};
  state.seq[kind] = (state.seq[kind] || 0) + 1;
  return state.seq[kind];
}

module.exports = {
  init: init,
  getState: getState,
  persist: persist,
  persistNow: persistNow,
  nextId: nextId,
  get backend() { return backend; }
};
