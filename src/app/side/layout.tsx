import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "크리스마스 특가 | 웹사이트 제작 50만원",
  description: "웹사이트(랜딩페이지) 제작 크리스마스 특가 이벤트. 150만원 → 50만원",
  openGraph: {
    title: "크리스마스 특가 | 웹사이트 제작 50만원",
    description: "웹사이트(랜딩페이지) 제작 크리스마스 특가 이벤트",
    type: "website",
  },
};

export default function SideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
