import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // 개발 중 WebSocket 오류 방지 (프로덕션 배포 전 true로 변경 권장)
};

export default nextConfig;
