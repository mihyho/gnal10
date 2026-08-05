// 챕터 1~3 라이트박스: 사진 클릭 → 확대, 한 번 더 탭 → 플립되며 캡션(뒷면) 표시.

import { CHAPTER_CAPTIONS, photoSrc } from './data.js';

const lightbox = document.getElementById('lightbox');
const closeBtn = lightbox.querySelector('.lightbox-close');
const flipCard = lightbox.querySelector('.flip-card');
const img = lightbox.querySelector('.lightbox-img');
const placeholder = lightbox.querySelector('.lightbox-placeholder');
const placeholderLabel = placeholder.querySelector('.placeholder-label');
const captionTitle = lightbox.querySelector('.lightbox-caption-title');
const captionMeta = lightbox.querySelector('.lightbox-caption-meta');
const captionBody = lightbox.querySelector('.lightbox-caption-body');

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
    console.warn(`[lightbox] 이미지를 찾을 수 없습니다: ${src}`);
  };
  img.src = src;
}

function open(chapter, index) {
  const label = `PHOTO ${String(index + 1).padStart(2, '0')}`;
  const photo = CHAPTER_CAPTIONS[chapter][index];

  loadImage(photoSrc(chapter, index), label);
  captionTitle.textContent = photo.title;
  captionMeta.textContent = `${photo.photographer} · ${photo.meta}`;
  captionBody.textContent = photo.body;
  flipCard.classList.remove('is-flipped');

  lastFocused = document.activeElement;
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  closeBtn.focus();
}

function close() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  document.body.style.overflow = '';
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
}

function toggleFlip() {
  flipCard.classList.toggle('is-flipped');
}

lightbox.addEventListener('click', close);
flipCard.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleFlip();
});
closeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  close();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !lightbox.hidden) close();
});

export function initLightbox() {
  return { open, close };
}
