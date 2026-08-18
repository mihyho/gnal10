// 챕터 4: 사진 확대 → 한 번 더 탭하면 플립되며 관람객이 남긴 손글씨 캡션(뒷면) 표시.
// 전시 기간 중 Firestore에 실시간으로 쌓였던 손글씨는 전시 종료 후 PNG로 내보내
// photo/ch4-captions/ 에 고정했습니다. 더 이상 DB나 드로잉 입력은 쓰지 않습니다.

import { CHAPTER4_PHOTOS, photoSrc, captionSrc } from './data.js';

const ch4Lightbox = document.getElementById('ch4-lightbox');
const closeBtn = ch4Lightbox.querySelector('.lightbox-close');
const flipCard = ch4Lightbox.querySelector('.flip-card');
const img = ch4Lightbox.querySelector('.ch4-lightbox-img');
const placeholder = ch4Lightbox.querySelector('.lightbox-placeholder');
const placeholderLabel = placeholder.querySelector('.placeholder-label');
const captionImg = ch4Lightbox.querySelector('.ch4-caption-img');
const captionEmpty = ch4Lightbox.querySelector('.ch4-caption-empty');

let lastFocused = null;

function loadImage(src, label) {
  img.classList.remove('is-loaded');
  placeholder.classList.remove('is-hidden');
  placeholderLabel.textContent = label;
  img.removeAttribute('src');

  if (!src) return;

  img.alt = label;
  img.onload = () => {
    img.classList.add('is-loaded');
    placeholder.classList.add('is-hidden');
  };
  img.onerror = () => {
    console.warn(`[chapter4] 이미지를 찾을 수 없습니다: ${src}`);
  };
  img.src = src;
}

function open(index) {
  const label = `PHOTO ${String(index + 1).padStart(2, '0')}`;
  const photoId = CHAPTER4_PHOTOS[index].id;
  const caption = captionSrc(photoId);

  loadImage(photoSrc(4, index), label);

  if (caption) {
    captionImg.src = caption;
    captionImg.hidden = false;
    captionEmpty.hidden = true;
  } else {
    captionImg.removeAttribute('src');
    captionImg.hidden = true;
    captionEmpty.hidden = false;
  }

  flipCard.classList.remove('is-flipped');

  lastFocused = document.activeElement;
  ch4Lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  closeBtn.focus();
}

function close() {
  if (ch4Lightbox.hidden) return;
  ch4Lightbox.hidden = true;
  document.body.style.overflow = '';
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
}

function toggleFlip() {
  flipCard.classList.toggle('is-flipped');
}

ch4Lightbox.addEventListener('click', close);
flipCard.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleFlip();
});
closeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  close();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !ch4Lightbox.hidden) close();
});

export function initChapter4() {
  return { open };
}
