import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#080c18]">
      {/* Status bar area */}
      <div className="h-12" />

      {/* Header */}
      <header className="px-6 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest text-[#4a6fa5] uppercase">
              FaceAuth
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              생체 인증
            </h1>
          </div>
          {/* Security badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-[#1e3a5f] bg-[#0d1829] px-3 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span className="text-[11px] font-medium text-emerald-400">보안 연결</span>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        {/* Face icon with animated ring */}
        <div className="relative mb-10 flex items-center justify-center">
          {/* Outer pulse ring */}
          <div className="absolute h-44 w-44 animate-ping rounded-full border border-[#1e3a5f] opacity-30" />
          {/* Middle ring */}
          <div className="absolute h-36 w-36 rounded-full border border-[#2a4f80] opacity-50" />
          {/* Inner circle */}
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-[#1e3a5f] bg-gradient-to-br from-[#0d1829] to-[#0f2040] shadow-[0_0_40px_rgba(59,130,246,0.15)]">
            {/* Face SVG */}
            <svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Scan lines */}
              <line x1="8" y1="8" x2="18" y2="8" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="8" y1="8" x2="8" y2="18" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="48" y1="8" x2="38" y2="8" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="48" y1="8" x2="48" y2="18" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="8" y1="48" x2="18" y2="48" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="8" y1="48" x2="8" y2="38" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="48" y1="48" x2="38" y2="48" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="48" y1="48" x2="48" y2="38" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
              {/* Face circle */}
              <circle cx="28" cy="28" r="13" stroke="#60a5fa" strokeWidth="1.5" opacity="0.6" />
              {/* Eyes */}
              <circle cx="23" cy="25" r="2" fill="#60a5fa" />
              <circle cx="33" cy="25" r="2" fill="#60a5fa" />
              {/* Smile */}
              <path d="M22 32 Q28 37 34 32" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="mb-2 text-center">
          <h2 className="text-xl font-bold text-white">얼굴 인식 인증</h2>
          <p className="mt-2 text-sm text-[#6b82a8]">
            AI 기반 얼굴 인식으로<br />빠르고 안전하게 인증하세요
          </p>
        </div>

        {/* Security features */}
        <div className="mt-6 grid w-full grid-cols-3 gap-3">
          {[
            { icon: "🔒", label: "256-bit\n암호화" },
            { icon: "⚡", label: "0.3초\n인증" },
            { icon: "🛡️", label: "위변조\n방지" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center rounded-2xl border border-[#1a2f50] bg-[#0d1829] py-4 px-2"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="mt-1.5 text-center text-[11px] font-medium leading-tight text-[#6b82a8] whitespace-pre-line">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Action buttons */}
      <section className="px-5 pb-10 space-y-3">
        {/* 인증 시작 - primary */}
        <Link href="/auth" className="block w-full">
          <button className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 py-4 text-base font-bold text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] transition-all active:scale-[0.98]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full" />
            <span className="flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              인증 시작
            </span>
          </button>
        </Link>

        {/* 얼굴 등록 - secondary */}
        <Link href="/register" className="block w-full">
          <button className="w-full rounded-2xl border border-[#1e3a5f] bg-[#0d1829] py-4 text-base font-semibold text-[#60a5fa] transition-all active:scale-[0.98] active:bg-[#111f38]">
            <span className="flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                <line x1="12" y1="14" x2="12" y2="20" />
                <line x1="9" y1="17" x2="15" y2="17" />
              </svg>
              얼굴 등록
            </span>
          </button>
        </Link>

        <p className="text-center text-[11px] text-[#3a4f6e]">
          생체 정보는 기기 내에서만 처리되며 서버에 저장되지 않습니다
        </p>
      </section>
    </main>
  );
}
