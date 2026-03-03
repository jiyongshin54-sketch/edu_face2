/**
 * facedb.ts
 * Supabase face_users 테이블 CRUD + 얼굴 유사도 비교 로직
 */
import { supabase } from "./supabase";
import type { FaceUser } from "./supabase";

// ──────────────────────────────────────────────────────────────────────────
// 상수
// ──────────────────────────────────────────────────────────────────────────

/**
 * 유클리드 거리 임계값.
 * face-api.js 공식 권장값은 0.6 (같은 사람 판단 기준).
 * 여기서는 0.5 로 더 엄격하게 적용.
 * 0 = 완전 일치, 값이 낮을수록 더 유사함.
 */
const DISTANCE_THRESHOLD = 0.5;

// ──────────────────────────────────────────────────────────────────────────
// 타입
// ──────────────────────────────────────────────────────────────────────────

export interface RegisterResult {
  success:     boolean;
  user?:       FaceUser;
  error?:      string;
  /** 테이블 미생성 등 설정 오류 */
  configError: boolean;
}

export interface VerifyResult {
  matched:       boolean;       // 인증 성공 여부 (distance < THRESHOLD)
  name:          string | null; // 매칭된 사용자 이름
  matchPercent:  number | null; // UI 표시용 일치율 (0–100)
  distance:      number | null; // 실제 유클리드 거리
  noUsers:       boolean;       // DB에 등록된 사용자가 없음
  /** 테이블 미생성 또는 Supabase 연결 오류 */
  configError:   boolean;
  configMessage: string | null;
}

// ──────────────────────────────────────────────────────────────────────────
// 등록 (INSERT)
// ──────────────────────────────────────────────────────────────────────────

/**
 * 사용자 이름과 얼굴 descriptor를 Supabase에 저장합니다.
 * Float32Array는 JSON 직렬화가 안 되므로 number[]로 변환합니다.
 */
export async function registerFace(
  name: string,
  descriptor: Float32Array
): Promise<RegisterResult> {
  try {
    const { data, error } = await supabase
      .from("face_users")
      .insert({
        name,
        face_descriptor: Array.from(descriptor), // Float32Array → number[]
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, user: data as FaceUser };
  } catch (err: unknown) {
    const raw = err as { code?: string; message?: string; status?: number };
    const isTableMissing =
      raw.code === "42P01" ||
      raw.message?.toLowerCase().includes("does not exist") ||
      raw.status === 404;

    const msg = isTableMissing
      ? "face_users 테이블이 없습니다. supabase/schema.sql을 실행해주세요."
      : (err instanceof Error ? err.message : "알 수 없는 오류");

    return { success: false, error: msg, configError: isTableMissing };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 인증 (SELECT + 비교)
// ──────────────────────────────────────────────────────────────────────────

/**
 * 카메라에서 추출한 descriptor를 DB에 등록된 모든 사용자와 비교합니다.
 * 가장 가까운 사용자의 거리가 DISTANCE_THRESHOLD 미만이면 인증 성공.
 */
export async function verifyFace(
  descriptor: Float32Array
): Promise<VerifyResult> {
  // 공통 실패 결과 헬퍼
  const fail = (overrides: Partial<VerifyResult> = {}): VerifyResult => ({
    matched: false, name: null, matchPercent: null, distance: null,
    noUsers: false, configError: false, configMessage: null,
    ...overrides,
  });

  try {
    const { data, error } = await supabase
      .from("face_users")
      .select("id, name, face_descriptor");

    if (error) {
      // PostgreSQL 42P01 = 테이블이 존재하지 않음
      // Supabase REST 404도 동일한 상황을 나타냄
      const isTableMissing =
        (error as { code?: string }).code === "42P01" ||
        error.message?.toLowerCase().includes("does not exist") ||
        error.message?.toLowerCase().includes("relation") ||
        (error as { status?: number }).status === 404 ||
        String((error as { status?: number }).status) === "404";

      if (isTableMissing) {
        return fail({
          configError: true,
          configMessage:
            "face_users 테이블이 없습니다.\n" +
            "Supabase SQL Editor에서 supabase/schema.sql을 실행해주세요.",
        });
      }
      throw error;
    }

    const users = (data ?? []) as FaceUser[];

    if (users.length === 0) {
      return fail({ noUsers: true });
    }

    // 전체 사용자와 유클리드 거리 계산 → 최소 거리 찾기
    let bestDistance = Infinity;
    let bestName: string | null = null;

    for (const user of users) {
      const stored = new Float32Array(user.face_descriptor); // number[] → Float32Array
      const dist   = euclideanDistance(descriptor, stored);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestName     = user.name;
      }
    }

    const matched = bestDistance < DISTANCE_THRESHOLD;

    // UI 표시용 일치율: 임계값 기준 선형 스케일 (0%–100%)
    //   distance=0         → 100% (완전 일치)
    //   distance=THRESHOLD → 0%
    const matchPercent = Math.round(
      Math.max(0, Math.min(100, (1 - bestDistance / DISTANCE_THRESHOLD) * 100))
    );

    return {
      matched,
      name:          matched ? bestName : null,
      matchPercent,
      distance:      Math.round(bestDistance * 1000) / 1000,
      noUsers:       false,
      configError:   false,
      configMessage: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("[verifyFace]", msg);
    return fail();
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 유틸
// ──────────────────────────────────────────────────────────────────────────

/** 두 128차원 Float32Array 간의 유클리드 거리 */
function euclideanDistance(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
