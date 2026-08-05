// 챕터 4: 사진 확대 → 두 번째 탭에서 손글씨 드로잉 패드로 전환.
// 그린 내용은 PNG(dataURL)로 Firestore(ch4-captions/{photoId})에 저장되고,
// onSnapshot으로 모든 방문자에게 실시간 반영된다.
// Firebase 설정이 비어 있으면(firebase-config.js의 placeholder 값 그대로면) localStorage로 폴백한다.

import { CHAPTER4_PHOTOS, photoSrc } from './data.js';
import { firebaseConfig } from './firebase-config.js';

const LOCAL_STORAGE_KEY = 'ch4-drawings';
const CANVAS_BG = '#f2efe9';

const ch4Lightbox = document.getElementById('ch4-lightbox');
const ch4CloseBtn = ch4Lightbox.querySelector('.lightbox-close');
const ch4Card = ch4Lightbox.querySelector('.ch4-card');
const ch4Img = ch4Lightbox.querySelector('.ch4-lightbox-img');
const ch4Placeholder = ch4Lightbox.querySelector('.lightbox-placeholder');
const ch4PlaceholderLabel = ch4Placeholder.querySelector('.placeholder-label');

const drawPad = document.getElementById('draw-pad');
const canvas = document.getElementById('draw-canvas');
const clearBtn = document.getElementById('draw-clear');
const closeBtn = document.getElementById('draw-close');
const saveBtn = document.getElementById('draw-save');
const statusEl = document.getElementById('draw-status');

let db = null;
let usingFirebase = false;
let drawings = {}; // photoId -> dataURL
let currentIndex = null;
let lastFocused = null;
let isDrawing = false;

function photoIdFor(index) {
  return CHAPTER4_PHOTOS[index].id;
}

function updateDots() {
  const grid = document.getElementById('chapter-4-grid');
  if (!grid) return;
  CHAPTER4_PHOTOS.forEach((photo, i) => {
    const card = grid.querySelector(`[data-ch4-index="${i}"]`);
    if (!card) return;
    const dot = card.querySelector('.photo-dot');
    dot.hidden = !drawings[photo.id];
  });
}

function initFirebase() {
  const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY';
  if (!isConfigured || typeof window.firebase === 'undefined') {
    console.warn('[chapter4] Firebase 설정이 없어 localStorage로 동작합니다. js/firebase-config.js를 확인하세요.');
    loadLocalDrawings();
    return;
  }

  try {
    if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
    db = window.firebase.firestore();
    usingFirebase = true;
    db.collection('ch4-captions').onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') delete drawings[change.doc.id];
          else drawings[change.doc.id] = change.doc.data().imageData;
        });
        updateDots();
      },
      (err) => {
        console.error('[chapter4] Firestore 구독 실패:', err);
      }
    );
  } catch (err) {
    console.warn('[chapter4] Firebase 초기화 실패, localStorage로 폴백합니다.', err);
    usingFirebase = false;
    loadLocalDrawings();
  }
}

function loadLocalDrawings() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) drawings = JSON.parse(raw);
  } catch (err) {
    console.warn('[chapter4] localStorage 읽기 실패', err);
  }
  updateDots();
}

function saveLocalDrawings() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drawings));
  } catch (err) {
    console.warn('[chapter4] localStorage 저장 실패', err);
  }
}

// ---------------- 라이트박스 (확대 보기) ----------------

function openLightbox(index) {
  currentIndex = index;
  const label = `PHOTO ${String(index + 1).padStart(2, '0')}`;
  const src = photoSrc(4, index);

  ch4Img.classList.remove('is-loaded');
  ch4Placeholder.classList.remove('is-hidden');
  ch4PlaceholderLabel.textContent = label;
  ch4Img.removeAttribute('src');

  if (src) {
    ch4Img.alt = label;
    ch4Img.onload = () => {
      ch4Img.classList.add('is-loaded');
      ch4Placeholder.classList.add('is-hidden');
    };
    ch4Img.onerror = () => {
      console.warn(`[chapter4] 이미지를 찾을 수 없습니다: ${src}`);
    };
    ch4Img.src = src;
  }

  lastFocused = document.activeElement;
  ch4Lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  ch4CloseBtn.focus();
}

function closeLightbox() {
  if (ch4Lightbox.hidden) return;
  ch4Lightbox.hidden = true;
  document.body.style.overflow = '';
}

function tapLightbox() {
  const index = currentIndex;
  closeLightbox();
  openDrawPad(index);
}

// ---------------- 드로잉 패드 ----------------

function setupCanvasBase() {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = CANVAS_BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return ctx;
}

function openDrawPad(index) {
  currentIndex = index;
  const ctx = setupCanvasBase();
  const existing = drawings[photoIdFor(index)];
  if (existing) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = existing;
  }
  statusEl.textContent = '';

  lastFocused = document.activeElement;
  drawPad.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeDrawPad() {
  drawPad.hidden = true;
  document.body.style.overflow = '';
  currentIndex = null;
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

function onPointerDown(e) {
  isDrawing = true;
  canvas.setPointerCapture(e.pointerId);
  const ctx = canvas.getContext('2d');
  const { x, y } = getPos(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
}

function onPointerMove(e) {
  if (!isDrawing) return;
  const ctx = canvas.getContext('2d');
  const { x, y } = getPos(e);
  ctx.lineTo(x, y);
  ctx.stroke();
}

function onPointerUp() {
  isDrawing = false;
}

function onClear() {
  setupCanvasBase();
}

function onSave() {
  const index = currentIndex;
  const photoId = photoIdFor(index);
  const dataUrl = canvas.toDataURL('image/png');

  if (usingFirebase && db) {
    statusEl.textContent = '저장 중…';
    saveBtn.disabled = true;
    db.collection('ch4-captions')
      .doc(photoId)
      .set({ imageData: dataUrl, updatedAt: Date.now() })
      .then(() => {
        saveBtn.disabled = false;
        closeDrawPad();
      })
      .catch((err) => {
        saveBtn.disabled = false;
        statusEl.textContent = '저장 실패: ' + err.message;
      });
  } else {
    drawings[photoId] = dataUrl;
    saveLocalDrawings();
    updateDots();
    closeDrawPad();
  }
}

canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerup', onPointerUp);
canvas.addEventListener('pointerleave', onPointerUp);
clearBtn.addEventListener('click', onClear);
closeBtn.addEventListener('click', closeDrawPad);
saveBtn.addEventListener('click', onSave);

ch4Lightbox.addEventListener('click', closeLightbox);
ch4Card.addEventListener('click', (e) => {
  e.stopPropagation();
  tapLightbox();
});
ch4CloseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!drawPad.hidden) closeDrawPad();
  else if (!ch4Lightbox.hidden) closeLightbox();
});

export function initChapter4() {
  initFirebase();
  return { openLightbox };
}
