// data.js 의 데이터를 index.html의 빈 섹션/템플릿에 채워 넣는다.
// 사진 클릭 시 동작은 main.js가 넘겨주는 콜백(onChapter123Open / onChapter4Open)에 위임한다.

import { EXHIBIT_INFO, INTRO_TITLE, INTRO_TEXT, CHAPTER_META, CHAPTER_CAPTIONS, CHAPTER4_PHOTOS, photoSrc, posterSrc, captionSrc } from './data.js';

const cardTemplate = document.getElementById('photo-card-template');

function fillPhotoFrame(frame, { src, label }) {
  const img = frame.querySelector('.photo-img');
  const placeholder = frame.querySelector('.photo-placeholder');
  const labelEl = placeholder.querySelector('.placeholder-label');
  labelEl.textContent = label;

  if (!src) return;

  img.alt = label;
  img.addEventListener('load', () => {
    img.classList.add('is-loaded');
    placeholder.classList.add('is-hidden');
  });
  img.addEventListener('error', () => {
    console.warn(`[gallery] 이미지를 찾을 수 없습니다: ${src} (data.js의 PHOTO_FILES 값을 확인하세요)`);
  });
  img.src = src;
}

function createPhotoCard({ src, label, onOpen, hasDot }) {
  const node = cardTemplate.content.firstElementChild.cloneNode(true);
  fillPhotoFrame(node, { src, label });
  node.setAttribute('aria-label', `${label} 확대 보기`);
  if (hasDot !== undefined) {
    const dot = node.querySelector('.photo-dot');
    dot.hidden = !hasDot;
  }
  node.addEventListener('click', onOpen);
  return node;
}

function renderPoster() {
  document.getElementById('poster-group').textContent = EXHIBIT_INFO.group;
  document.getElementById('poster-mark').textContent = EXHIBIT_INFO.englishMark;
  document.getElementById('poster-title').textContent = EXHIBIT_INFO.title;
  document.getElementById('poster-eventname').textContent = EXHIBIT_INFO.eventName;
  document.getElementById('poster-dates').textContent = EXHIBIT_INFO.dates;
  document.getElementById('poster-venue').textContent = EXHIBIT_INFO.venue;

  const hoursList = document.getElementById('poster-hours');
  hoursList.innerHTML = '';
  for (const hour of EXHIBIT_INFO.hours) {
    const li = document.createElement('li');
    li.textContent = hour;
    hoursList.appendChild(li);
  }

  const src = posterSrc();
  if (src) {
    const img = document.getElementById('poster-img');
    const placeholder = document.getElementById('poster-placeholder');
    img.alt = '전시 포스터';
    img.addEventListener('load', () => {
      img.hidden = false;
      placeholder.classList.add('is-hidden');
    });
    img.addEventListener('error', () => {
      console.warn(`[gallery] 포스터 이미지를 찾을 수 없습니다: ${src}`);
    });
    img.src = src;
  }
}

function renderIntro() {
  document.getElementById('intro-title').textContent = INTRO_TITLE;
  document.getElementById('intro-text').textContent = INTRO_TEXT;
}

function renderChapterHeader(section, meta, extraHint) {
  const header = document.createElement('div');
  header.className = 'chapter-header';

  const label = document.createElement('span');
  label.className = 'mono accent';
  label.textContent = meta.title;

  const subtitle = document.createElement('h2');
  subtitle.className = 'serif';
  subtitle.textContent = meta.subtitle;

  const intro = document.createElement('p');
  intro.className = 'chapter-intro';
  intro.textContent = meta.intro;

  header.append(label, subtitle, intro);

  if (extraHint) {
    const hint = document.createElement('p');
    hint.className = 'chapter-hint mono';
    hint.textContent = extraHint;
    header.appendChild(hint);
  }

  section.appendChild(header);
}

function renderChaptersOneToThree(handlers) {
  for (const chapter of [1, 2, 3]) {
    const section = document.getElementById(`chapter-${chapter}`);
    renderChapterHeader(section, CHAPTER_META[chapter]);

    const grid = document.createElement('div');
    grid.className = 'photo-grid';

    CHAPTER_CAPTIONS[chapter].forEach((photo, i) => {
      const label = `PHOTO ${String(i + 1).padStart(2, '0')}`;
      const card = createPhotoCard({
        src: photoSrc(chapter, i),
        label,
        onOpen: () => handlers.onChapter123Open(chapter, i),
      });
      grid.appendChild(card);
    });

    section.appendChild(grid);
  }
}

function renderChapterFour(handlers) {
  const section = document.getElementById('chapter-4');
  renderChapterHeader(
    section,
    CHAPTER_META[4],
    '사진을 두 번 탭하면 관람객이 남긴 손글씨 캡션을 볼 수 있어요.'
  );

  const grid = document.createElement('div');
  grid.className = 'photo-grid';
  grid.id = 'chapter-4-grid';

  CHAPTER4_PHOTOS.forEach((photo, i) => {
    const label = `PHOTO ${String(i + 1).padStart(2, '0')}`;
    const card = createPhotoCard({
      src: photoSrc(4, i),
      label,
      hasDot: Boolean(captionSrc(photo.id)),
      onOpen: () => handlers.onChapter4Open(i),
    });
    card.dataset.ch4Index = String(i);
    grid.appendChild(card);
  });

  section.appendChild(grid);
}

export function renderAll(handlers) {
  renderPoster();
  renderIntro();
  renderChaptersOneToThree(handlers);
  renderChapterFour(handlers);
}
