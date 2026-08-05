# 사진전시 온라인 도록

순수 HTML/CSS/JS(빌드 도구 없음) 기반 온라인 도록. GitHub Pages에 정적 파일 그대로 배포합니다.

## 구조

```
index.html          모든 섹션(포스터/서문/챕터1~4)을 담은 단일 페이지, 하단 챕터 내비게이션
css/
  style.css          디자인 토큰, 반응형 레이아웃, 라이트박스/드로잉 패드 스타일
js/
  data.js            전시 정보 / 서문 / 챕터 서문 / 챕터1~3 캡션 / 사진 파일 매니페스트
  firebase-config.js Firebase 설정 (placeholder, TODO 주석 포함)
  gallery.js         data.js → DOM 렌더링 (포스터, 서문, 챕터별 사진 그리드)
  lightbox.js         챕터 1~3: 확대 → 플립 캡션 인터랙션
  chapter4.js         챕터 4: 확대 → 손글씨 드로잉 패드, Firestore 실시간 동기화 / localStorage 폴백
  main.js             엔트리포인트 (모듈 조립, 하단 내비 활성 상태)
photo/               실제 사진 파일을 넣는 곳 (지금은 비어 있음 → 자리표시자 표시)
firestore.rules       챕터4 방명록용 Firestore 보안 규칙 예시
```

빌드 스텝이 없으므로 `index.html`을 그대로 웹서버 루트에 올리면 동작합니다.

## 사진 넣는 법

사진은 `photo/` 폴더에 `ch1_이름_1.jpeg`처럼 **챕터_촬영자이름_순번** 형식 파일명으로 넣을 예정이라고 하셨는데,
파일명에 촬영자 이름이 섞여 있어 코드가 자동으로 유추할 수 없습니다. 대신 `js/data.js`의 `PHOTO_FILES`에
챕터별로 실제 파일명을 순서대로 채워 넣으면 됩니다.

```js
// js/data.js
export const PHOTO_FILES = {
  1: ['ch1_김민준_1.jpeg', 'ch1_김민준_2.jpeg', null, null, ...], // 10개
  2: [...], // 10개
  3: [...], // 10개
  4: [...], // 30개
};
```

- 배열의 **순서 = 도록에 표시되는 사진 순서**입니다.
- 아직 채우지 않은 자리(`null`)는 줄무늬 자리표시자 박스("PHOTO 01" 라벨)로 표시됩니다.
- 파일을 찾지 못하면 브라우저 콘솔에 경고가 뜨니, 배포 전에 콘솔을 한 번 확인하세요.
- 포스터 이미지는 `EXHIBIT_INFO.posterFile`에 파일명을 넣으면 됩니다.

**가로 사진 혼합 대응**: 그리드 썸네일과 라이트박스 모두 프레임 비율(4:5)은 고정하고 이미지는
`object-fit: contain`으로 표시합니다. 가로 사진은 위아래에 여백(레터박스)이 생기지만 잘리지 않고,
그리드도 깨지지 않습니다.

## 캡션 넣는 법 (챕터 1~3)

`photo/` 폴더에 넣어주실 `전체캡션.pdf`를 열어서, 각 챕터·사진 순서에 맞는 캡션 텍스트를
`js/data.js`의 `CHAPTER_CAPTIONS`에 순서대로 옮겨 적으면 됩니다.

```js
function makeCaptions(chapter, count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${chapter}-${i + 1}`,
    caption: `사진 ${i + 1} 캡션 텍스트가 이 자리에 들어갑니다.`, // ← 이 문자열을 실제 캡션으로 교체
  }));
}
```

챕터 4는 텍스트 캡션이 없고, 관람객이 화면에 직접 그리는 손글씨가 캡션 역할을 합니다.

## 로컬에서 확인하기

ES 모듈(`type="module"`)을 쓰기 때문에 `index.html`을 파일로 그냥 더블클릭하면 브라우저 CORS 정책에
막혀 동작하지 않습니다. 간단한 로컬 서버로 열어주세요.

```bash
npx serve .
# 또는
python -m http.server 8000
```

## Firebase(Firestore) 설정 — 챕터 4 손글씨 캡션용

챕터 4는 관람객이 남긴 손글씨를 **모두가 함께 보는 방명록**처럼 실시간 공유합니다. 아직 Firebase
프로젝트가 없다면 `js/firebase-config.js`의 placeholder 값 그대로 두세요 — 자동으로 이 브라우저의
localStorage에만 저장되는 폴백 모드로 동작합니다(다른 방문자와는 공유되지 않음).

실시간 공유를 켜려면:

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성 후 Firestore Database 활성화.
2. 웹 앱 등록 후 SDK 설정값을 `js/firebase-config.js`의 `firebaseConfig` 객체에 그대로 채워 넣습니다
   (환경변수 없이 파일에 직접 씁니다 — 빌드 스텝이 없기 때문입니다. Firebase 웹 SDK 설정값은 클라이언트에
   노출되는 것이 정상이며, 보안은 아래 Firestore 규칙으로 제어합니다).
3. Firestore 보안 규칙을 [firestore.rules](firestore.rules) 내용으로 교체합니다. 인증 없이 누구나 쓸 수
   있는 공개 방명록 구조이므로, 이미지 크기 제한 정도만 걸어두었습니다. 남용이 우려되면 Firebase
   App Check 도입을 고려하세요.
4. 캡션은 `ch4-captions/{photoId}` 문서에 `{ imageData: "data:image/png;base64,...", updatedAt }` 형태로
   저장되고, 모든 방문자가 `onSnapshot`으로 실시간 구독합니다.

## GitHub Pages 배포

빌드 스텝이 없으므로 GitHub Actions 없이 저장소 설정만으로 배포됩니다.

1. 이 폴더를 그대로 GitHub 저장소에 push합니다 (`index.html`이 저장소 루트에 있어야 함).
2. 저장소 Settings → Pages → Source를 **Deploy from a branch** 로, Branch를 `main` / `(root)` 로 설정합니다.
3. 몇 분 뒤 `https://<user>.github.io/<repo>/` 에서 확인할 수 있습니다.

모든 리소스 경로가 상대경로(`css/`, `js/`, `photo/`)라서 user page든 project page든 별도 설정 없이 그대로
동작합니다.

## 아직 안 된 것 / TODO

- `photo/` 폴더에 실제 사진 파일 넣고 `js/data.js`의 `PHOTO_FILES` 채우기
- `전체캡션.pdf` 내용을 `js/data.js`의 `CHAPTER_CAPTIONS`에 옮겨 적기
- Firebase 프로젝트 생성 및 `js/firebase-config.js` 값 채우기 (안 하면 localStorage 폴백으로 동작)
- 포스터 이미지(`EXHIBIT_INFO.posterFile`) 채우기
