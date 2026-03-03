"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { verifyFace } from "@/app/lib/facedb";
import type { VerifyResult } from "@/app/lib/facedb";

const FaceDetector = dynamic(
  () => import("@/app/components/FaceDetector"),
  { ssr: false, loading: () => <CameraPlaceholder /> }
);

type Step = "ready" | "scanning" | "verifying" | "success" | "fail" | "no-users" | "config-error";

export default function AuthPage() {
  const [step,       setStep]       = useState<Step>("ready");
  const [descriptor, setDescriptor] = useState<Float32Array | null>(null);
  const [result,     setResult]     = useState<VerifyResult | null>(null);

  return (
    <main className="flex min-h-screen flex-col bg-[#080c18]">
      <div className="h-12" />

      {/* 헤더 */}
      <header className="flex items-center gap-4 px-5 py-4">
        <Link href="/">
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1a2f50] bg-[#0d1829]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-white">얼굴 인증</h1>
          <p className="text-xs text-[#4a6fa5]">Face Authentication</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full border border-[#1e3a5f] bg-[#0d1829] px-3 py-1.5">
          <span className="text-[10px] font-bold text-yellow-400">LEVEL 2</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col px-5">
        {step === "ready" && (
          <ReadyStep onStart={() => setStep("scanning")} />
        )}
        {step === "scanning" && (
          <ScanningStep
            onPass={(desc) => {
              setDescriptor(desc);
              setStep("verifying");
            }}
          />
        )}
        {step === "verifying" && descriptor && (
          <VerifyingStep
            descriptor={descriptor}
            onDone={(r) => {
              setResult(r);
              if (r.configError) setStep("config-error");
              else if (r.noUsers)    setStep("no-users");
              else if (r.matched)    setStep("success");
              else                   setStep("fail");
            }}
          />
        )}
        {step === "success"  && <SuccessStep  result={result!} />}
        {step === "fail"     && <FailStep     result={result}  onRetry={() => setStep("scanning")} />}
        {step === "no-users"     && <NoUsersStep />}
        {step === "config-error" && <ConfigErrorStep message={result?.configMessage ?? null} />}
      </div>
    </main>
  );
}

// ── 준비 화면 ─────────────────────────────────────────────────────────────
function ReadyStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <div className="absolute inset-0 animate-pulse rounded-full bg-blue-900/20" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#2a4f80] bg-gradient-to-br from-[#0d1829] to-[#0f2040]">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M8 8 L8 16 M8 8 L16 8" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M40 8 L40 16 M40 8 L32 8" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M8 40 L8 32 M8 40 L16 40" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M40 40 L40 32 M40 40 L32 40" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="24" cy="24" r="10" stroke="#60a5fa" strokeWidth="1.5" opacity="0.5"/>
              <circle cx="20" cy="22" r="2" fill="#60a5fa"/>
              <circle cx="28" cy="22" r="2" fill="#60a5fa"/>
              <path d="M19 29 Q24 33 29 29" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-white">인증 준비</h2>
          <p className="mt-2 text-sm text-[#6b82a8]">
            등록된 얼굴과 비교해 본인을 확인합니다<br />카메라를 정면으로 바라봐 주세요
          </p>
        </div>

        <div className="w-full rounded-2xl border border-[#1a2f50] bg-[#0d1829] p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
            <span className="text-xs font-semibold tracking-wider text-yellow-400 uppercase">인증 정보</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "비교 방식",  value: "유클리드 거리 (128차원)" },
              { label: "인증 기준",  value: "일치율 ≥ 90%" },
              { label: "보안 등급",  value: "Level 2 (고강도)" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-[#4a6fa5]">{item.label}</span>
                <span className="text-xs font-semibold text-[#a0b4cc]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pb-10">
        <button onClick={onStart}
          className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 py-4 text-base font-bold text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] transition-all active:scale-[0.98]">
          인증 시작
        </button>
      </div>
    </div>
  );
}

// ── 스캔 화면 (실제 카메라 + AI 감지) ────────────────────────────────────
function ScanningStep({ onPass }: { onPass: (descriptor: Float32Array) => void }) {
  const TOTAL = 3;
  const [countdown,    setCountdown]    = useState(TOTAL);
  const [faceDetected, setFaceDetected] = useState(false);
  const [descriptor,   setDescriptor]   = useState<Float32Array | null>(null);
  const faceRef        = useRef(false);
  const descriptorRef  = useRef<Float32Array | null>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  // countdownRef: setInterval 안에서 직접 읽기 위한 ref (stale closure 방지)
  const countdownRef   = useRef(TOTAL);
  // onPassRef: 항상 최신 onPass 참조 유지 (의존성 배열에서 제외하기 위함)
  const onPassRef      = useRef(onPass);
  useEffect(() => { onPassRef.current = onPass; }, [onPass]);

  const handleFaceDetected     = useCallback((d: boolean) => { faceRef.current = d; setFaceDetected(d); }, []);
  const handleDescriptorChange = useCallback((d: Float32Array | null) => { descriptorRef.current = d; setDescriptor(d); }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!faceRef.current) return; // 얼굴 없으면 일시정지

      countdownRef.current -= 1;
      setCountdown(countdownRef.current); // UI 리렌더 트리거 (상태 업데이터 함수 사용 안 함)

      if (countdownRef.current <= 0) {
        clearInterval(timerRef.current!);
        // ✅ setInterval 콜백(비동기 컨텍스트)에서 직접 호출 → 렌더 중 setState 아님
        if (descriptorRef.current) onPassRef.current(descriptorRef.current);
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = ((TOTAL - countdown) / TOTAL) * 175.9;

  return (
    <div className="flex flex-1 flex-col gap-3">
      <p className="text-center text-sm text-[#6b82a8]">
        {faceDetected
          ? <span className="font-semibold text-blue-400">{countdown}초 후 자동 인증 · 얼굴을 유지해주세요</span>
          : "카메라에 얼굴을 비춰주세요"}
      </p>

      <FaceDetector
        onFaceDetected={handleFaceDetected}
        onDescriptorChange={handleDescriptorChange}
        showLandmarks={true}
        showScore={true}
      />

      {/* 카운트다운 링 */}
      <div className="flex flex-col items-center gap-2 pb-8 pt-2">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg className="-rotate-90" width="64" height="64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#1a2f50" strokeWidth="4"/>
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke={faceDetected ? "#3b82f6" : "#1a2f50"}
              strokeWidth="4"
              strokeDasharray={`${progress} 175.9`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.9s ease, stroke 0.3s" }}
            />
          </svg>
          <span className={`absolute text-xl font-bold ${faceDetected ? "text-white" : "text-[#3a4f6e]"}`}>
            {countdown}
          </span>
        </div>
        <p className="text-xs text-[#3a4f6e]">
          {faceDetected ? "카운트다운 진행 중" : "얼굴 인식 대기 중"}
        </p>
      </div>
    </div>
  );
}

// ── DB 비교 중 ────────────────────────────────────────────────────────────
function VerifyingStep({
  descriptor,
  onDone,
}: {
  descriptor: Float32Array;
  onDone: (result: VerifyResult) => void;
}) {
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 실제 Supabase DB 비교
      const result = await verifyFace(descriptor);
      if (!cancelled) onDoneRef.current(result);
    })();
    return () => { cancelled = true; };
  }, [descriptor]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="relative flex h-32 w-32 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-blue-500" style={{ animationDuration: "0.8s" }}/>
        <div className="absolute inset-3 animate-spin rounded-full border-2 border-transparent border-t-blue-400" style={{ animationDuration: "1.2s", animationDirection: "reverse" }}/>
        <div className="absolute inset-6 animate-spin rounded-full border-2 border-transparent border-t-blue-300" style={{ animationDuration: "1.6s" }}/>
        <div className="absolute inset-9 flex h-14 w-14 items-center justify-center rounded-full bg-[#0d1829]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-bold text-white">Supabase DB 비교 중...</h2>
        <p className="mt-2 text-sm text-[#6b82a8]">등록된 얼굴과 유클리드 거리를 계산해요</p>
      </div>

      <div className="w-full space-y-2">
        {[
          { label: "128차원 descriptor 추출",  status: "done"   },
          { label: "DB 전체 사용자 조회",        status: "active" },
          { label: "유클리드 거리 계산 (배치)", status: "pending"},
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-xl border border-[#1a2f50] bg-[#0d1829] px-4 py-3">
            <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
              item.status === "done"   ? "bg-emerald-600" :
              item.status === "active" ? "border-2 border-blue-500" :
                                         "border border-[#2a4f80]"
            }`}>
              {item.status === "done"   && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              {item.status === "active" && <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400"/>}
            </div>
            <span className={`text-sm ${
              item.status === "done"   ? "text-white" :
              item.status === "active" ? "text-blue-300" : "text-[#3a4f6e]"
            }`}>{item.label}</span>
            {item.status === "active" && <span className="ml-auto animate-pulse text-xs text-blue-400">진행 중</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 인증 성공 ─────────────────────────────────────────────────────────────
function SuccessStep({ result }: { result: VerifyResult }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="relative flex h-36 w-36 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/10" style={{ animationDuration: "2s" }}/>
        <div className="absolute inset-4 rounded-full bg-emerald-500/20"/>
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.5)]">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-[#6b82a8]">인증 성공</p>
        <h2 className="mt-1 text-2xl font-bold text-white">
          {result.name ? `${result.name}님` : "인증 완료"}
        </h2>
        <p className="mt-1 text-sm text-[#6b82a8]">본인 확인이 완료되었습니다</p>
      </div>

      {/* 인증 결과 카드 */}
      <div className="w-full rounded-2xl border border-[#1a3a2a] bg-[#0a1f15] p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"/>
          <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">인증 결과</span>
        </div>
        <div className="space-y-3">
          {[
            {
              label: "일치율",
              value: result.matchPercent !== null ? `${result.matchPercent}%` : "-",
              color: (result.matchPercent ?? 0) >= 90 ? "text-emerald-400" : "text-yellow-400",
            },
            {
              label: "유클리드 거리",
              value: result.distance !== null ? `${result.distance}` : "-",
              color: "text-[#a0b4cc]",
            },
            {
              label: "등록자",
              value: result.name ?? "-",
              color: "text-white",
            },
            {
              label: "보안 등급",
              value: "Level 2",
              color: "text-yellow-400",
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-xs text-[#4a6fa5]">{item.label}</span>
              <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* 일치율 바 */}
        {result.matchPercent !== null && (
          <div className="mt-4">
            <div className="h-1.5 w-full rounded-full bg-[#1a2f50]">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
                style={{ width: `${result.matchPercent}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-[#3a4f6e]">
              <span>0%</span>
              <span className="text-emerald-500 font-semibold">기준: 90%</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>

      <div className="w-full pb-10">
        <Link href="/" className="block">
          <button className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-4 text-base font-bold text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all active:scale-[0.98]">
            완료
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── 인증 실패 ─────────────────────────────────────────────────────────────
function FailStep({ result, onRetry }: { result: VerifyResult | null; onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="relative flex h-36 w-36 items-center justify-center">
        <div className="absolute inset-4 rounded-full bg-red-500/15"/>
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-700 to-red-600 shadow-[0_0_40px_rgba(239,68,68,0.4)]">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">인증 실패</h2>
        <p className="mt-2 text-sm text-[#6b82a8]">일치율이 기준(90%)에 미달했어요</p>
      </div>

      {/* 실패 상세 카드 */}
      {result && (
        <div className="w-full rounded-2xl border border-[#3a1a1a] bg-[#1a0a0a] p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-red-400 uppercase">비교 결과</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-[#7a4a4a]">측정된 일치율</span>
              <span className="text-sm font-bold text-red-400">
                {result.matchPercent !== null ? `${result.matchPercent}%` : "-"} (기준: 90%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-[#7a4a4a]">유클리드 거리</span>
              <span className="text-sm font-bold text-[#a0b4cc]">
                {result.distance !== null ? result.distance : "-"}
              </span>
            </div>
          </div>
          {/* 일치율 바 */}
          {result.matchPercent !== null && (
            <div className="mt-4">
              <div className="h-1.5 w-full rounded-full bg-[#2a1a1a]">
                <div className="h-1.5 rounded-full bg-red-600" style={{ width: `${result.matchPercent}%` }}/>
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-[#3a2a2a]">
                <span>0%</span>
                <span className="text-red-500">기준: 90%</span>
                <span>100%</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="w-full rounded-2xl border border-[#3a1a1a] bg-[#1a0a0a] p-4">
        <p className="mb-2 text-xs font-semibold text-red-400 uppercase">확인 사항</p>
        <div className="space-y-1.5 text-sm text-[#7a4a4a]">
          <p>• 밝은 환경에서 다시 시도해 보세요</p>
          <p>• 안경·마스크를 제거해 주세요</p>
          <p>• 얼굴이 화면 중앙에 오도록 해주세요</p>
        </div>
      </div>

      <div className="w-full space-y-3 pb-10">
        <button onClick={onRetry}
          className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 py-4 text-base font-bold text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] transition-all active:scale-[0.98]">
          다시 시도
        </button>
        <Link href="/" className="block">
          <button className="w-full rounded-2xl border border-[#1e3a5f] bg-[#0d1829] py-4 text-base font-semibold text-[#60a5fa] transition-all active:scale-[0.98]">
            메인으로
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── 등록된 사용자 없음 ────────────────────────────────────────────────────
function NoUsersStep() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#1e3a5f] bg-[#0d1829]">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#4a6fa5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
          <line x1="18" y1="11" x2="24" y2="17"/>
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">등록된 사용자 없음</h2>
        <p className="mt-2 text-sm text-[#6b82a8]">
          먼저 얼굴을 등록해야<br />인증을 진행할 수 있어요
        </p>
      </div>
      <div className="w-full space-y-3 pb-10">
        <Link href="/register" className="block">
          <button className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 py-4 text-base font-bold text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] transition-all active:scale-[0.98]">
            얼굴 등록하러 가기
          </button>
        </Link>
        <Link href="/" className="block">
          <button className="w-full rounded-2xl border border-[#1e3a5f] bg-[#0d1829] py-4 text-base font-semibold text-[#60a5fa] transition-all active:scale-[0.98]">
            메인으로
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── 설정 오류 (테이블 미생성 / Supabase 연결 오류) ──────────────────────
function ConfigErrorStep({ message }: { message: string | null }) {
  const steps = [
    "Supabase 대시보드 접속 (supabase.com)",
    "좌측 메뉴 → SQL Editor 클릭",
    "supabase/schema.sql 파일 내용 전체 복사",
    "SQL Editor에 붙여넣고 ▶ Run 클릭",
    "서버 재시작 후 다시 시도",
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5">
      {/* 경고 아이콘 */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-orange-800/60 bg-orange-950/40">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-white">DB 설정 필요</h2>
        <p className="mt-2 text-sm text-[#6b82a8]">
          {message ?? "face_users 테이블이 생성되지 않았습니다"}
        </p>
      </div>

      {/* 해결 방법 */}
      <div className="w-full rounded-2xl border border-orange-900/50 bg-orange-950/20 p-4">
        <p className="mb-3 text-xs font-semibold tracking-wider text-orange-400 uppercase">해결 방법</p>
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-[#a08060]">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange-900/50 text-[10px] font-bold text-orange-400">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      {/* SQL 미리보기 */}
      <div className="w-full rounded-xl border border-[#1a2f50] bg-[#050810] p-3">
        <p className="mb-1.5 text-[10px] font-semibold text-[#4a6fa5]">supabase/schema.sql 핵심 쿼리</p>
        <pre className="overflow-x-auto text-[10px] leading-relaxed text-[#60a5fa]">{`CREATE TABLE face_users (
  id   UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT  NOT NULL,
  face_descriptor FLOAT8[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}</pre>
      </div>

      <div className="w-full pb-10">
        <Link href="/" className="block">
          <button className="w-full rounded-2xl border border-[#1e3a5f] bg-[#0d1829] py-4 text-base font-semibold text-[#60a5fa] transition-all active:scale-[0.98]">
            메인으로
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── 플레이스홀더 ─────────────────────────────────────────────────────────
function CameraPlaceholder() {
  return (
    <div className="flex w-full items-center justify-center rounded-3xl border border-[#1a2f50] bg-[#050810]" style={{ aspectRatio: "3/4" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-blue-500"/>
        <p className="text-xs text-[#4a6fa5]">카메라 초기화 중...</p>
      </div>
    </div>
  );
}
