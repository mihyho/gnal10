import { renderAll } from './gallery.js';
import { initLightbox } from './lightbox.js';
import { initChapter4 } from './chapter4.js';

function initActiveNav() {
  const links = Array.from(document.querySelectorAll('.bottom-nav a'));
  const sections = links
    .map((a) => document.getElementById(a.dataset.navTarget))
    .filter(Boolean);

  const setActive = (id) => {
    for (const link of links) {
      link.classList.toggle('is-active', link.dataset.navTarget === id);
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    },
    { threshold: [0.3, 0.5, 0.7] }
  );

  for (const section of sections) observer.observe(section);
}

function main() {
  const lightbox = initLightbox();
  const chapter4 = initChapter4();

  renderAll({
    onChapter123Open: (chapter, index) => lightbox.open(chapter, index),
    onChapter4Open: (index) => chapter4.open(index),
  });

  initActiveNav();
}

document.addEventListener('DOMContentLoaded', main);
