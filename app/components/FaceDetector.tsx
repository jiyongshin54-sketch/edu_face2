"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── 타입 ───────────────────────────────────────────────────────────────────
export type FaceStatus = "loading" | "ready" | "error";

interface Props {
  /** 얼굴 감지 여부 콜백 */
  onFaceDetected?: (detected: boolean) => void;
  /**
   * 128차원 face descriptor 변경 콜백.
   * 얼굴이 감지되면 Float32Array, 없어지면 null.
   * Supabase 저장 및 인증 비교에 사용.
   */
  onDescriptorChange?: (descriptor: Float32Array | null) => void;
  /** 랜드마크(특징점) 색상 표시 여부 */
  showLandmarks?: boolean;
  /** 감지 신뢰도 점수 라벨 표시 여부 */
  showScore?: boolean;
}

// ─── 랜드마크 부위별 색상·크기 ────────────────────────────────────────────
const LANDMARK_GROUPS = {
  jaw:       { range: [0,  16], color: "rgba(96,165,250,0.5)",  size: 1.5 }, // 파랑
  eyebrow_l: { range: [17, 21], color: "rgba(167,139,250,0.8)", size: 2   }, // 보라
  eyebrow_r: { range: [22, 26], color: "rgba(167,139,250,0.8)", size: 2   }, // 보라
  nose:      { range: [27, 35], color: "rgba(251,191,36,0.8)",  size: 2   }, // 노랑
  eye_l:     { range: [36, 41], color: "rgba(52,211,153,0.9)",  size: 2.5 }, // 초록
  eye_r:     { range: [42, 47], color: "rgba(52,211,153,0.9)",  size: 2.5 }, // 초록
  mouth:     { range: [48, 67], color: "rgba(244,114,182,0.9)", size: 2   }, // 핑크
} as const;

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────
export default function FaceDetector({
  onFaceDetected,
  onDescriptorChange,
  showLandmarks = true,
  showScore = true,
}: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [status,       setStatus]       = useState<FaceStatus>("loading");
  const [faceDetected, setFaceDetected] = useState(false);
  const [loadingMsg,   setLoadingMsg]   = useState("카메라 권한 확인 중...");

  // stale closure 방지: 최신 콜백 참조
  const onFaceRef       = useRef(onFaceDetected);
  const onDescriptorRef = useRef(onDescriptorChange);
  useEffect(() => { onFaceRef.current       = onFaceDetected;     }, [onFaceDetected]);
  useEffect(() => { onDescriptorRef.current = onDescriptorChange; }, [onDescriptorChange]);

  // ── 캔버스 그리기 ───────────────────────────────────────────────────────
  const draw = useCallback(
    (
      detections: Array<{
        detection: { box: { x: number; y: number; width: number; height: number }; score: number };
        landmarks: { positions: Array<{ x: number; y: number }> };
      }>,
      canvas: HTMLCanvasElement
    ) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      detections.forEach(({ detection, landmarks }) => {
        const { box, score } = detection;
        const { x, y, width: w, height: h } = box;
        const pts = landmarks.positions;

        // 1. 파란 바운딩 박스 (글로우)
        ctx.save();
        ctx.shadowColor = "#3b82f6";
        ctx.shadowBlur  = 14;
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth   = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.restore();

        // 2. 모서리 강조선
        const cl = 20;
        ctx.save();
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth   = 3;
        ctx.lineCap     = "round";
        ctx.shadowColor = "#93c5fd";
        ctx.shadowBlur  = 6;
        ctx.beginPath(); ctx.moveTo(x,         y + cl); ctx.lineTo(x,         y    ); ctx.lineTo(x + cl,     y    ); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - cl, y    ); ctx.lineTo(x + w,     y    ); ctx.lineTo(x + w,     y + cl); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x,         y+h-cl); ctx.lineTo(x,         y + h); ctx.lineTo(x + cl,   y + h  ); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - cl, y + h); ctx.lineTo(x + w,   y + h  ); ctx.lineTo(x + w,   y+h-cl  ); ctx.stroke();
        ctx.restore();

        // 3. 신뢰도 라벨
        if (showScore) {
          const label = `${Math.round(score * 100)}% 인식`;
          ctx.fillStyle = "rgba(37,99,235,0.85)";
          ctx.beginPath();
          ctx.roundRect(x, y - 26, 68, 22, 5);
          ctx.fill();
          ctx.fillStyle    = "#ffffff";
          ctx.font         = "bold 11px -apple-system, sans-serif";
          ctx.textBaseline = "middle";
          ctx.fillText(label, x + 6, y - 15);
        }

        // 4. 랜드마크 특징점
        if (showLandmarks) {
          Object.values(LANDMARK_GROUPS).forEach(({ range, color, size }) => {
            ctx.fillStyle = color;
            for (let i = range[0]; i <= range[1]; i++) {
              const p = pts[i];
              if (!p) continue;
              ctx.beginPath();
              ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
              ctx.fill();
            }
          });
          // 눈 윤곽
          ctx.save();
          ctx.strokeStyle = "rgba(52,211,153,0.45)";
          ctx.lineWidth   = 1;
          ([[ 36, 41 ], [ 42, 47 ]] as [number,number][]).forEach(([s, e]) => {
            ctx.beginPath();
            ctx.moveTo(pts[s].x, pts[s].y);
            for (let i = s + 1; i <= e; i++) ctx.lineTo(pts[i].x, pts[i].y);
            ctx.closePath();
            ctx.stroke();
          });
          // 입술 윤곽
          ctx.strokeStyle = "rgba(244,114,182,0.4)";
          ctx.beginPath();
          ctx.moveTo(pts[48].x, pts[48].y);
          for (let i = 49; i <= 59; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        }
      });
    },
    [showLandmarks, showScore]
  );

  // ── 메인 초기화 Effect ────────────────────────────────────────────────
  useEffect(() => {
    let active    = true;
    let stream: MediaStream | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const init = async () => {
      try {
        // ① face-api.js 동적 임포트 (SSR 방지)
        setLoadingMsg("AI 라이브러리 로딩 중...");
        const faceapi = await import("face-api.js");
        if (!active) return;

        // ② 모델 3종 로드
        //    - tinyFaceDetector    : 얼굴 감지   (~190KB)
        //    - faceLandmark68Tiny  : 68개 특징점  (~76KB)
        //    - faceRecognitionNet  : 128차원 descriptor (~6.2MB) ← Supabase 저장용
        setLoadingMsg("얼굴 인식 모델 초기화 중...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        if (!active) return;

        // ③ 카메라 시작
        setLoadingMsg("카메라 연결 중...");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }

        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        setStatus("ready");

        // ④ 실시간 감지 루프 (150ms ≈ ~7fps)
        //    withFaceDescriptors() 추가로 연산량 증가 → 간격 살짝 늘림
        let detecting = false;
        intervalId = setInterval(async () => {
          if (!active || detecting || !video || video.readyState < 2) return;
          detecting = true;
          try {
            const detections = await faceapi
              .detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.45, inputSize: 320 })
              )
              .withFaceLandmarks(true)       // true = tiny model 사용
              .withFaceDescriptors();        // 128차원 float32 descriptor 추출 ← NEW

            if (!active) return;

            const canvas = canvasRef.current!;
            canvas.width  = video.videoWidth;
            canvas.height = video.videoHeight;

            const dims    = { width: video.videoWidth, height: video.videoHeight };
            const resized = faceapi.resizeResults(detections, dims);

            // 캔버스에 그리기
            draw(resized as Parameters<typeof draw>[0], canvas);

            const detected = resized.length > 0;
            setFaceDetected(detected);
            onFaceRef.current?.(detected);

            // descriptor 콜백 (첫 번째 얼굴만 사용)
            const descriptor = detected ? (resized[0] as { descriptor?: Float32Array }).descriptor ?? null : null;
            onDescriptorRef.current?.(descriptor);
          } finally {
            detecting = false;
          }
        }, 150);
      } catch (err) {
        console.error("[FaceDetector]", err);
        if (active) setStatus("error");
      }
    };

    init();

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [draw]);

  // ── 렌더 ─────────────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl bg-[#050810]"
      style={{ aspectRatio: "3/4" }}
    >
      {/* 카메라 영상 (셀피 미러링) */}
      <video
        ref={videoRef}
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: "scaleX(-1)" }}
      />

      {/* 캔버스 오버레이 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ transform: "scaleX(-1)" }}
      />

      {/* ── 로딩 ──────────────────────────────────────────────────── */}
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#050810]">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-blue-500" />
            <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-blue-400"
              style={{ animationDuration: "1.4s", animationDirection: "reverse" }} />
            <div className="absolute inset-4 animate-spin rounded-full border-2 border-transparent border-t-blue-300"
              style={{ animationDuration: "1.8s" }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#a0b4cc]">{loadingMsg}</p>
            <p className="mt-1 text-xs text-[#3a4f6e]">face-api.js  •  faceRecognitionNet</p>
          </div>
        </div>
      )}

      {/* ── 에러 ──────────────────────────────────────────────────── */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#050810] p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30 ring-1 ring-red-800">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <line x1="12" y1="11" x2="12" y2="15"/>
              <circle cx="12" cy="17.5" r="0.5" fill="#f87171"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-red-400">카메라 시작 실패</p>
          <p className="text-xs leading-relaxed text-[#6b82a8]">
            카메라 권한을 허용하거나<br/>HTTPS(localhost) 환경에서 접속해주세요
          </p>
        </div>
      )}

      {/* ── 감지 상태 배지 ─────────────────────────────────────────── */}
      {status === "ready" && (
        <div className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm transition-all duration-300 ${
          faceDetected
            ? "border-blue-500/60 bg-blue-600/80 text-white"
            : "border-[#1a2f50] bg-[#080c18]/80 text-[#6b82a8]"
        }`}>
          <div className={`h-1.5 w-1.5 rounded-full ${faceDetected ? "animate-pulse bg-white" : "bg-[#4a6fa5]"}`} />
          {faceDetected ? "얼굴 감지됨 ✓" : "얼굴 찾는 중..."}
        </div>
      )}

      {/* ── 랜드마크 범례 ─────────────────────────────────────────── */}
      {status === "ready" && faceDetected && showLandmarks && (
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 rounded-xl border border-[#1a2f50] bg-[#080c18]/85 px-2.5 py-2 backdrop-blur-sm">
          {[
            { color: "bg-green-400",  label: "눈"  },
            { color: "bg-pink-400",   label: "입"  },
            { color: "bg-yellow-400", label: "코"  },
            { color: "bg-purple-400", label: "눈썹" },
            { color: "bg-blue-400",   label: "윤곽" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${color}`} />
              <span className="text-[9px] text-[#6b82a8]">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
