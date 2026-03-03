"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useCallback, useEffect, useRef } from "react";
import { registerFace } from "@/app/lib/facedb";

// SSR 비활성화: face-api.js / 카메라는 브라우저 전용
const FaceDetector = dynamic(
  () => import("@/app/components/FaceDetector"),
  { ssr: false, loading: () => <CameraPlaceholder text="카메라 초기화 중..." /> }
);

type Step = "guide" | "name" | "capture" | "processing" | "done";

const STEP_ORDER: Step[] = ["guide", "name", "capture", "processing", "done"];

export default function RegisterPage() {
  const [step,       setStep]       = useState<Step>("guide");
  const [userName,   setUserName]   = useState("");
  const [descriptor, setDescriptor] = useState<Float32Array | null>(null);
  const [saveError,  setSaveError]  = useState<string | null>(null);

  /** processing 스텝 진입 시 실제 Supabase 저장 */
  const handleSave = useCallback(async () => {
    if (!descriptor || !userName.trim()) return;
    const result = await registerFace(userName.trim(), descriptor);
    if (result.success) {
      setStep("done");
    } else if (result.configError) {
      // 테이블 미생성 → 안내 배너 + capture로 돌아가지 않음
      setSaveError(
        "⚠️ DB 설정 필요: face_users 테이블이 없습니다.\n" +
        "Supabase SQL Editor에서 supabase/schema.sql을 실행해주세요."
      );
      setStep("guide"); // 처음으로 돌아가 배너 표시
    } else {
      setSaveError(result.error ?? "저장 실패");
      setStep("capture"); // 일반 오류 시 다시 촬영
    }
  }, [descriptor, userName]);

  const curIdx = STEP_ORDER.indexOf(step);

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
          <h1 className="text-lg font-bold text-white">얼굴 등록</h1>
          <p className="text-xs text-[#4a6fa5]">Face Registration</p>
        </div>
        {/* 스텝 인디케이터 */}
        <div className="ml-auto flex items-center gap-1.5">
          {STEP_ORDER.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? "w-5 bg-blue-500" :
                i < curIdx  ? "w-1.5 bg-blue-700" :
                              "w-1.5 bg-[#1a2f50]"
              }`}
            />
          ))}
        </div>
      </header>

      {/* 에러 배너 */}
      {saveError && (
        <div className="mx-5 mb-2 flex items-center gap-2 rounded-xl bg-red-900/30 px-4 py-3 text-sm text-red-400">
          <span>⚠️</span>
          <span>{saveError}</span>
          <button className="ml-auto text-xs underline" onClick={() => setSaveError(null)}>닫기</button>
        </div>
      )}

      <div className="flex flex-1 flex-col px-5">
        {step === "guide"      && <GuideStep      onNext={() => setStep("name")} />}
        {step === "name"       && <NameStep        onNext={(n) => { setUserName(n); setStep("capture"); }} />}
        {step === "capture"    && (
          <CaptureStep
            onNext={(desc) => { setDescriptor(desc); setStep("processing"); }}
          />
        )}
        {step === "processing" && <ProcessingStep onMount={handleSave} />}
        {step === "done"       && <DoneStep userName={userName} />}
      </div>
    </main>
  );
}

// ── 안내 스텝 ─────────────────────────────────────────────────────────────
function GuideStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center py-6">
        <div className="relative mb-8 flex h-48 w-48 items-center justify-center rounded-full border-2 border-dashed border-[#1e3a5f]">
          <div className="flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-[#0d1829] to-[#0f2040]">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="18" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4"/>
              <circle cx="28" cy="32" r="3" fill="#60a5fa"/>
              <circle cx="44" cy="32" r="3" fill="#60a5fa"/>
              <path d="M26 44 Q36 52 46 44" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M10 10 L10 20 M10 10 L20 10" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M62 10 L62 20 M62 10 L52 10" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M10 62 L10 52 M10 62 L20 62" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M62 62 L62 52 M62 62 L52 62" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
        <h2 className="mb-2 text-xl font-bold text-white">얼굴 등록 안내</h2>
        <p className="mb-7 text-center text-sm text-[#6b82a8]">
          AI가 128개 특징점을 추출해<br />안전하게 저장합니다
        </p>
        <div className="w-full space-y-3">
          {[
            { icon: "💡", text: "밝은 곳에서 촬영하세요" },
            { icon: "😊", text: "정면을 바라봐 주세요" },
            { icon: "🕶️", text: "안경·마스크를 제거해 주세요" },
            { icon: "📱", text: "기기를 눈높이에 맞춰 주세요" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 rounded-2xl border border-[#1a2f50] bg-[#0d1829] px-4 py-3">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm text-[#a0b4cc]">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="pb-10">
        <button onClick={onNext}
          className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 py-4 text-base font-bold text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] transition-all active:scale-[0.98]">
          시작하기
        </button>
      </div>
    </div>
  );
}

// ── 이름 입력 스텝 ────────────────────────────────────────────────────────
function NameStep({ onNext }: { onNext: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <div className="flex flex-1 flex-col py-6">
      <div className="flex flex-1 flex-col gap-6">
        {/* 아이콘 */}
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#1e3a5f] bg-gradient-to-br from-[#0d1829] to-[#0f2040]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">이름을 입력하세요</h2>
          <p className="text-sm text-[#6b82a8]">등록 시 사용할 이름을 입력해주세요</p>
        </div>

        {/* 입력 필드 */}
        <div className="space-y-2">
          <label className="text-xs font-semibold tracking-wider text-[#4a6fa5] uppercase">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onNext(name.trim()); }}
            placeholder="홍길동"
            maxLength={30}
            autoFocus
            className="w-full rounded-2xl border border-[#1a2f50] bg-[#0d1829] px-4 py-4 text-base text-white placeholder-[#2a3f60] outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
          />
          <p className="text-right text-xs text-[#2a3f60]">{name.length}/30</p>
        </div>

        {/* 안내 */}
        <div className="rounded-2xl border border-[#1a2f50] bg-[#0d1829] px-4 py-3">
          <p className="text-xs text-[#6b82a8]">
            💡 입력한 이름은 인증 성공 시 화면에 표시됩니다
          </p>
        </div>
      </div>

      <div className="pb-10">
        <button
          onClick={() => { if (name.trim()) onNext(name.trim()); }}
          disabled={!name.trim()}
          className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 py-4 text-base font-bold text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
        >
          다음 단계
        </button>
      </div>
    </div>
  );
}

// ── 카메라 촬영 스텝 ──────────────────────────────────────────────────────
function CaptureStep({ onNext }: { onNext: (descriptor: Float32Array) => void }) {
  const [faceDetected, setFaceDetected] = useState(false);
  const [descriptor,   setDescriptor]   = useState<Float32Array | null>(null);

  const handleFaceDetected   = useCallback((d: boolean) => setFaceDetected(d), []);
  const handleDescriptorChange = useCallback((d: Float32Array | null) => setDescriptor(d), []);

  const handleCapture = () => {
    if (descriptor) onNext(descriptor);
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="text-center text-sm text-[#6b82a8]">
        {faceDetected
          ? "✅ 얼굴 감지 완료 · 촬영 버튼을 눌러주세요"
          : "카메라를 정면으로 바라봐 주세요"}
      </p>

      {/* 실제 카메라 + 얼굴 감지 */}
      <FaceDetector
        onFaceDetected={handleFaceDetected}
        onDescriptorChange={handleDescriptorChange}
        showLandmarks={true}
        showScore={true}
      />

      <div className="flex justify-center gap-5 text-[11px] text-[#3a4f6e]">
        <span>🟢 눈</span><span>🩷 입</span><span>🟡 코</span><span>🟣 눈썹</span><span>🔵 윤곽</span>
      </div>

      {/* 촬영 버튼 */}
      <div className="pb-10 pt-1">
        <button
          onClick={handleCapture}
          disabled={!descriptor}
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 transition-all active:scale-95 ${
            descriptor
              ? "border-blue-500 bg-white shadow-[0_0_24px_rgba(59,130,246,0.5)]"
              : "border-[#1a2f50] bg-[#0d1829] opacity-40"
          }`}
        >
          <div className={`h-10 w-10 rounded-full transition-colors ${descriptor ? "bg-blue-600" : "bg-[#1a2f50]"}`} />
        </button>
        <p className={`mt-2.5 text-center text-xs ${descriptor ? "text-blue-400" : "text-[#3a4f6e]"}`}>
          {descriptor ? "탭하여 촬영" : "얼굴 감지 후 활성화"}
        </p>
      </div>
    </div>
  );
}

// ── 처리 중 스텝 ───────────────────────────────────────────────────────────
function ProcessingStep({ onMount }: { onMount: () => Promise<void> }) {
  // React 18 StrictMode는 개발 모드에서 useEffect를 2번 실행합니다.
  // useRef guard로 registerFace()가 중복 호출되어 DB에 2건이 삽입되는 것을 방지합니다.
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return; // 두 번째 실행 차단
    calledRef.current = true;
    onMount();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-blue-500" />
        <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-blue-400" style={{ animationDuration: "1.5s" }} />
        <div className="absolute inset-4 animate-spin rounded-full border-2 border-transparent border-t-blue-300" style={{ animationDuration: "2s" }} />
        <span className="text-3xl">🔍</span>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-white">등록 중...</h2>
        <p className="mt-2 text-sm text-[#6b82a8]">128차원 얼굴 특징값을 저장하고 있어요</p>
      </div>
      <div className="w-full space-y-2">
        {[
          { label: "얼굴 특징점 추출 완료",  done: true  },
          { label: "128차원 descriptor 생성", done: true  },
          { label: "Supabase DB 저장 중",     done: false },
          { label: "등록 완료",               done: false },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-xl border border-[#1a2f50] bg-[#0d1829] px-4 py-2.5">
            <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${item.done ? "bg-emerald-600" : "border border-[#2a4f80]"}`}>
              {item.done && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <span className={`text-sm ${item.done ? "text-white" : "text-[#3a4f6e]"}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 완료 스텝 ─────────────────────────────────────────────────────────────
function DoneStep({ userName }: { userName: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="relative flex h-36 w-36 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/10" style={{ animationDuration: "2s" }} />
        <div className="absolute inset-4 rounded-full bg-emerald-500/20" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.5)]">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-[#6b82a8]">등록 완료</p>
        <h2 className="mt-1 text-2xl font-bold text-white">{userName}님</h2>
        <p className="mt-2 text-sm text-[#6b82a8]">
          얼굴 정보가 Supabase에 저장됐어요<br/>이제 얼굴 인증을 시작할 수 있어요
        </p>
      </div>

      {/* DB 저장 확인 카드 */}
      <div className="w-full rounded-2xl border border-[#1a3a2a] bg-[#0a1f15] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900/50">
            <span className="text-lg">🗄️</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400">Supabase 저장 완료</p>
            <p className="text-xs text-[#4a7a5a]">128차원 face descriptor 암호화 저장</p>
          </div>
          <div className="ml-auto text-xs text-[#4a7a5a]">방금 전</div>
        </div>
      </div>

      <div className="w-full space-y-3 pb-10">
        <Link href="/auth" className="block">
          <button className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 py-4 text-base font-bold text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] transition-all active:scale-[0.98]">
            인증 시작하기
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

// ── 플레이스홀더 ─────────────────────────────────────────────────────────
function CameraPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex w-full items-center justify-center rounded-3xl border border-[#1a2f50] bg-[#050810]" style={{ aspectRatio: "3/4" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-blue-500" />
        <p className="text-xs text-[#4a6fa5]">{text}</p>
      </div>
    </div>
  );
}
