This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Track catalog (Ver. 1.8.0)

The wiki includes 30 main race courses and 10 SNES sub-courses, for 40 unique
track pages. Battle courses, inter-course routes and alternate Grand Prix layouts
are not counted as additional tracks. Nintendo confirms the 10 sub-courses in its
[Ver. 1.8.0 update notes](https://en-americas-support.nintendo.com/app/answers/detail/a_id/68580).

- `data/track-catalog.json`: stable slugs, article URLs and original image metadata.
- `data/track-content.ts`: original short introductions, editorial categories,
  Grand Prix cups and parent-course relationships, based on the linked articles.
- `data/tracks.ts`: combines the catalog with the existing four track guides.
  New tracks have no invented difficulty rating or shortcut instructions;
  `difficulty: null` means not rated and remains visible with the All filter.
- `public/images/tracks/`: 40 local WebP course-selection images. These are
  course previews, not overhead route maps. Image rights belong to Nintendo;
  the file-description links in the catalog credit Super Mario Wiki as the source.

Images were retrieved on 2026-09-27 and converted without changing their dimensions.
Run `node scripts/download-track-images.mjs` to restore missing assets from the
catalog; existing files are preserved. The script uses the installed `sharp`
dependency supplied with Next.js. Keep the source links and image credits when
adding or replacing assets. A source credit does not change the original image rights.

Each new track needs a unique lowercase hyphenated slug, an entry in both data
files, and a matching local image. A SNES course's `parentSlug` must point to an
existing main course. Keep the four featured homepage courses stable; the full
catalog is available through `/tracks`.

## 숏컷 페이지 · 관리자 편집

40개 트랙 모두 `/tracks/[slug]/shortcuts`에서 영상, 준비 조건, 단계별 설명과
이미지를 볼 수 있습니다. 트랙의 Shortcuts 영역과 홈페이지 숏컷 카드에서 연결됩니다.
방문자는 읽기만 가능하고, 관리자 로그인 후 웹사이트에서 직접 추가·수정·삭제합니다.
‘저장·공개’를 누르면 다른 방문자에게도 반영됩니다. 기존 4개 가이드는 초기 내용으로
유지되며, 저장한 트랙은 클라우드 내용을 우선 표시합니다.

### Vercel 설정 (필수)

1. Vercel 프로젝트의 Storage에서 **Public Vercel Blob** 저장소를 생성·연결합니다.
   이미지와 영상, 숏컷 설명은 공개 자료입니다. 서버 쓰기 토큰은 공개되지 않습니다.
2. 서버 환경 변수 `BLOB_READ_WRITE_TOKEN`이 연결되어 있는지 확인합니다.
   직접 업로드 토큰 발급에 필요하며 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.
3. `SHORTCUT_ADMIN_PASSWORD`를 최소 8자 이상, 가능하면 비밀번호 관리자로 생성한
   32자 이상의 고유한 임의 비밀번호로 설정합니다. 비밀번호를 채팅이나 코드에 넣지 않습니다.
4. 환경 변수 적용 후 재배포합니다. 로컬 개발은 `.env.example`을 참고해 동일 값을 `.env.local`에 넣고 재시작합니다.
   Production과 Preview는 서로 다른 Blob 저장소와 비밀번호를 사용하는 것이 좋습니다.
5. 숏컷 페이지 → 관리자 로그인 → 내용 작성 → **저장·공개**.

저장소/비밀번호가 없으면 읽기 화면은 열리고 편집에 필요한 설정을 안내합니다.
관리자 세션은 HttpOnly/SameSite 쿠키로 8시간 유지됩니다. 비밀번호 변경은 기존 세션을
무효화합니다. API는 저장과 업로드 토큰 발급 시 서버에서 권한·Origin을 확인합니다.
로그인 시도 제한은 인스턴스 단위이므로 공개 운영 시 Vercel Firewall에서
`/api/shortcut-admin` POST 요청에 전역 속도 제한도 설정하세요.

### 콘텐츠와 첨부 파일

- 영상: YouTube 일반/Shorts 링크, HTTPS 영상 직접 주소 또는 MP4/WebM/Ogg 업로드(100MB).
- 이미지: HTTPS 주소 또는 PNG/JPEG/WebP/GIF 업로드(10MB). 각 단계에 설명·이미지·캡션을
  넣고 단계를 추가/삭제/위로 이동할 수 있습니다. 미리보기에서 방문자 화면을 확인합니다.
- 파일은 브라우저에서 Blob으로 직접 업로드하므로 Vercel 함수의 요청 크기 제한을
  통과할 필요가 없습니다. 설명 JSON은 트랙당 2MB, 최대 100개 숏컷/숏컷당 100단계입니다.
- 업로드 즉시 공개 파일 URL이 생성되며 **저장·공개** 후 페이지에 연결됩니다.
  페이지에서 첨부를 제거해도 Blob 원본은 보존됩니다. 미사용 파일 정리는 Blob 관리 화면에서 합니다.
- 설명은 `shortcuts/content/[slug].json`, 미디어는 `shortcuts/media/[slug]/`에 저장됩니다.
  ETag 조건부 저장으로 다른 탭에서 수정한 내용을 덮어쓰지 않습니다.
- 백업 내보내기/불러오기는 해당 트랙의 설명과 미디어 **주소**를 보관합니다.
  미디어 바이너리는 포함하지 않으므로 원본 파일과 Blob 저장소도 따로 보관하세요.
- 기존 홈/검색 목록의 요약과 난이도는 정적 트랙 데이터입니다. 관리자가 작성한 상세 내용은
  숏컷 전용 페이지에 반영됩니다.

구현: `lib/shortcut-drafts.ts`(스키마), `lib/shortcut-server.ts`(인증·클라우드 저장),
`app/api/shortcut-admin`, `app/api/shortcut-upload`, `app/api/tracks/[slug]/shortcuts`,
`app/tracks/[slug]/shortcuts`(읽기·편집 화면).

[Vercel Blob SDK 문서](https://vercel.com/docs/vercel-blob/using-blob-sdk) ·
[직접 업로드 문서](https://vercel.com/docs/vercel-blob/client-upload)
