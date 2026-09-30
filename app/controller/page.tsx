import type { Metadata } from "next";
import ControllerViewer from "@/app/controller/controller-viewer";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata(
  "컨트롤러 뷰어",
  "Switch2Connect로 연결한 Joy-Con 2의 입력을 실시간으로 표시합니다.",
  "/controller",
);

export default function ControllerPage() {
  return <ControllerViewer />;
}
