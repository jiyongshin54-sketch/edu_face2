import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 기본값 = Turbopack
  // face-api.js는 dynamic({ ssr: false })로 클라이언트 전용 로드 → 별도 번들 설정 불필요
  turbopack: {},
};

export default nextConfig;
