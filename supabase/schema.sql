-- ──────────────────────────────────────────────────────────────────────────
-- FaceAuth - Supabase 테이블 스키마
-- Supabase 대시보드 → SQL Editor 에서 실행하세요
-- ──────────────────────────────────────────────────────────────────────────

-- 얼굴 등록 사용자 테이블
CREATE TABLE IF NOT EXISTS face_users (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT        NOT NULL,
  -- 128차원 얼굴 특징 벡터 (face-api.js faceRecognitionNet 출력)
  -- Float32Array → number[] → PostgreSQL FLOAT8[]
  face_descriptor FLOAT8[]    NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스: 이름 검색용
CREATE INDEX IF NOT EXISTS idx_face_users_name       ON face_users (name);
CREATE INDEX IF NOT EXISTS idx_face_users_created_at ON face_users (created_at DESC);

-- ── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE face_users ENABLE ROW LEVEL SECURITY;

-- 개발용: 모든 anon 접근 허용
-- ⚠️ 프로덕션에서는 반드시 아래 정책을 삭제하고 인증(auth) 기반 정책으로 교체하세요
CREATE POLICY "dev_allow_all_read"   ON face_users FOR SELECT USING (true);
CREATE POLICY "dev_allow_all_insert" ON face_users FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_allow_all_delete" ON face_users FOR DELETE USING (true);

-- ── 확인 쿼리 ────────────────────────────────────────────────────────────
-- SELECT id, name, array_length(face_descriptor, 1) AS dims, created_at
-- FROM face_users
-- ORDER BY created_at DESC;
