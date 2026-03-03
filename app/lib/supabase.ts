import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnon) {
  console.warn(
    "[FaceAuth] Supabase 환경변수가 설정되지 않았습니다.\n" +
    "  NEXT_PUBLIC_SUPABASE_URL\n" +
    "  NEXT_PUBLIC_SUPABASE_ANON_KEY\n" +
    ".env.local 파일을 확인해주세요."
  );
}

// 빌드 타임(SSR 프리렌더링)에 환경변수가 없어도 createClient가 예외를 던지지 않도록
// 플레이스홀더를 사용합니다. 실제 DB 요청은 런타임에만 발생합니다.
export const supabase = createClient(
  supabaseUrl  || "https://placeholder.supabase.co",
  supabaseAnon || "placeholder-anon-key"
);

// ─── 테이블 타입 ──────────────────────────────────────────────────────────
export interface FaceUser {
  id:              string;
  name:            string;
  face_descriptor: number[];   // 128차원 float 배열 (PostgreSQL FLOAT8[])
  created_at:      string;
}
