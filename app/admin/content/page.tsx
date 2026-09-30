import type { Metadata } from "next";
import GuidePage from "@/app/components/guide-page";
import ContentDashboard from "./content-dashboard";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = { ...pageMetadata("관리자 콘텐츠 현황", "관리자 전용 공개 콘텐츠 현황과 편집 관리 화면입니다.", "/admin/content"), robots: { index: false, follow: false } };

export default function ContentPage() {
  return <GuidePage title="관리자 콘텐츠 현황" description="40개 트랙의 공개 숏컷과 보완할 항목을 확인하세요.">
    <ContentDashboard />
  </GuidePage>;
}
