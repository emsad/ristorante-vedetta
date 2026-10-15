const navToggle = document.querySelector('.nav-toggle');
const primaryNav = document.querySelector('.primary-nav');
function setMobileNavOpen(open, restoreFocus = false) {
  navToggle?.setAttribute('aria-expanded', String(open));
  navToggle?.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
  primaryNav?.classList.toggle('open', open);
  document.body.classList.toggle('mobile-nav-open', open);
  if (restoreFocus) navToggle?.focus();
}
navToggle?.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') !== 'true';
  setMobileNavOpen(open);
});
primaryNav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    setMobileNavOpen(false);
  } else if (event.target === primaryNav) {
    setMobileNavOpen(false, true);
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navToggle?.getAttribute('aria-expanded') === 'true') {
    setMobileNavOpen(false, true);
  }
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 1100 && navToggle?.getAttribute('aria-expanded') === 'true') setMobileNavOpen(false);
}, { passive: true });

const mobileNavBreakpoint = window.matchMedia('(max-width: 700px)');
let mobileNavHideTimer = 0;
function updateMobileStickyNav() {
  if (!navToggle) return;
  const isSticky = navToggle.classList.contains('is-mobile-sticky');
  const shouldShow = mobileNavBreakpoint.matches && (window.scrollY >= 100 || (isSticky && window.scrollY > 18));
  if (shouldShow) {
    window.clearTimeout(mobileNavHideTimer);
    navToggle.classList.remove('is-sticky-leaving');
    if (!isSticky) {
      navToggle.classList.add('is-mobile-sticky', 'is-sticky-entering');
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => navToggle.classList.remove('is-sticky-entering')));
    }
    return;
  }
  if (!isSticky || navToggle.classList.contains('is-sticky-leaving')) return;
  navToggle.classList.remove('is-sticky-entering');
  navToggle.classList.add('is-sticky-leaving');
  mobileNavHideTimer = window.setTimeout(() => {
    if (!mobileNavBreakpoint.matches || window.scrollY <= 18) {
      navToggle.classList.remove('is-mobile-sticky', 'is-sticky-entering', 'is-sticky-leaving');
    }
  }, 360);
}
window.addEventListener('scroll', updateMobileStickyNav, { passive: true });
window.addEventListener('resize', updateMobileStickyNav, { passive: true });
mobileNavBreakpoint.addEventListener('change', updateMobileStickyNav);
updateMobileStickyNav();

const menuPanel = document.querySelector('#menu-panel');
const menuTabs = [...document.querySelectorAll('.menu-tab')];
let menuData = null;

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderMenu(id) {
  if (!menuPanel || !menuData) return;
  const menu = menuData[id];
  if (!menu) return;
  menuTabs.forEach((tab) => {
    const active = tab.dataset.menu === id;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-expanded', String(active));
  });
  menuPanel.classList.toggle('menu-panel-summer', id === 'estivo');
  const contents = [];
  if (id !== 'estivo') {
    const heading = makeElement('div', 'menu-panel-heading');
    heading.append(makeElement('h3', '', menu.title));
    if (menu.pdf) {
      const pdf = makeElement('a', '', 'Apri la carta originale ↗');
      pdf.href = menu.pdf;
      pdf.target = '_blank';
      pdf.rel = 'noopener noreferrer';
      heading.append(pdf);
    }
    contents.push(heading);
  }
  if (menu.pending) {
    const empty = makeElement('div', 'menu-empty');
    empty.append(makeElement('strong', '', 'In preparazione'));
    empty.append(makeElement('p', '', menu.pending));
    contents.push(empty);
  } else {
    menu.groups.forEach((group, index) => {
      const staticSummerGroup = id === 'estivo';
      const groupElement = makeElement(
        staticSummerGroup ? 'section' : 'details',
        staticSummerGroup ? 'menu-group menu-group-static' : 'menu-group'
      );
      if (staticSummerGroup) {
        const title = makeElement('h4', 'menu-group-title', group.name);
        title.id = `menu-category-${index}`;
        groupElement.setAttribute('aria-labelledby', title.id);
        groupElement.append(title);
      } else {
        if (index === 0) groupElement.open = true;
        groupElement.append(makeElement('summary', '', `${group.name} · ${group.items.length}`));
      }
      const items = makeElement('div', 'menu-items');
      group.items.forEach((item) => {
        const row = makeElement('div', 'menu-item');
        const info = makeElement('div', 'menu-item-info');
        const name = makeElement('div', 'menu-item-name', item.name);
        const leader = makeElement('span', 'menu-item-leader');
        leader.setAttribute('aria-hidden', 'true');
        info.append(name, leader);
        if (item.description) info.append(makeElement('div', 'menu-item-description', item.description));
        row.append(info, makeElement('span', 'menu-item-price', item.price));
        items.append(row);
      });
      groupElement.append(items);
      contents.push(groupElement);
    });
  }
  menuPanel.replaceChildren(...contents);
}

fetch('/menus.json')
  .then((response) => {
    if (!response.ok) throw new Error('Menu non disponibile');
    return response.json();
  })
  .then((data) => {
    menuData = data;
    renderMenu('estivo');
  })
  .catch(() => {
    if (menuPanel) menuPanel.textContent = 'La carta non è disponibile in questo momento. Puoi consultare il PDF originale.';
  });

menuTabs.forEach((tab) => tab.addEventListener('click', () => renderMenu(tab.dataset.menu)));

const occasionImage = document.querySelector('#occasion-image');
const occasionChoices = [...document.querySelectorAll('.occasion-choice')];
const occasionPhotos = {
  private: {
    src: '/assets/vedetta-occasione-cena-privata.webp',
    alt: 'Tavolo riservato per una cena privata nella sala in legno del ristorante.'
  },
  celebration: {
    src: '/assets/vedetta-occasione-ricorrenza.webp',
    alt: 'Torta con candeline e fiori per una ricorrenza nella sala del ristorante.'
  },
  business: {
    src: '/assets/vedetta-occasione-cena-aziendale-professionisti.webp',
    alt: 'Colleghi riuniti per una cena aziendale in un ristorante.'
  },
  family: {
    src: '/assets/vedetta-occasione-pranzo-famiglia.webp',
    alt: 'Famiglia riunita intorno a un pranzo con piatti da condividere.'
  }
};

occasionChoices.forEach((choice) => choice.addEventListener('click', () => {
  const photo = occasionPhotos[choice.dataset.occasion];
  if (!photo || !occasionImage) return;
  occasionChoices.forEach((item) => {
    const active = item === choice;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  occasionImage.classList.add('is-changing');
  occasionImage.alt = photo.alt;
  occasionImage.onload = () => {
    occasionImage.classList.remove('is-changing');
    occasionImage.onload = null;
  };
  occasionImage.onerror = () => {
    occasionImage.classList.remove('is-changing');
    occasionImage.onerror = null;
  };
  occasionImage.src = photo.src;
  if (occasionImage.complete && occasionImage.naturalWidth > 0) {
    occasionImage.classList.remove('is-changing');
    occasionImage.onload = null;
  }
}));

const reviewSection = document.querySelector('#recensioni');
const reviewViewport = document.querySelector('.reviews-viewport');
const reviewCards = [...document.querySelectorAll('.review-card')];
const reviewTrack = reviewViewport?.querySelector('.reviews-track');
const reviewDots = [...document.querySelectorAll('.review-dot')];
const reviewArrows = [...document.querySelectorAll('[data-review-direction]')];
const reviewRotation = document.querySelector('.review-rotation');
const reducedMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const reviewCloneCount = reviewTrack && reviewCards.length > 1 ? reviewCards.length : 0;
if (reviewCloneCount) {
  const makeReviewClones = (cards) => cards.map((card) => {
    const clone = card.cloneNode(true);
    clone.dataset.reviewClone = 'true';
    clone.setAttribute('aria-hidden', 'true');
    clone.inert = true;
    return clone;
  });
  reviewTrack.prepend(...makeReviewClones(reviewCards.slice(-reviewCloneCount)));
  reviewTrack.append(...makeReviewClones(reviewCards.slice(0, reviewCloneCount)));
}
let activeReviewIndex = Math.max(0, reviewDots.findIndex((dot) => dot.classList.contains('is-active')));
let physicalReviewIndex = reviewCloneCount + activeReviewIndex;
let reviewAutoplayEnabled = !reducedMotionPreference.matches;
let reviewPointerInside = false;
let reviewAutoplayTimer = null;
let reviewScrollSettleTimer = null;

function reviewCardStart(card) {
  if (!reviewViewport || !card) return 0;
  const viewportRect = reviewViewport.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  return reviewViewport.scrollLeft + cardRect.left - viewportRect.left;
}

function scrollToReviewCard(card) {
  if (!reviewViewport || !card) return;
  reviewViewport.scrollTo({
    left: Math.max(0, reviewCardStart(card)),
    behavior: reducedMotionPreference.matches ? 'auto' : 'smooth'
  });
}

function updateActiveReview(index) {
  if (!reviewCards.length) return;
  activeReviewIndex = (index + reviewCards.length) % reviewCards.length;
  reviewDots.forEach((dot, dotIndex) => {
    const active = dotIndex === activeReviewIndex;
    dot.classList.toggle('is-active', active);
    dot.setAttribute('aria-pressed', String(active));
  });
}

function updateReviewRotationControl() {
  if (!reviewRotation) return;
  const label = reviewAutoplayEnabled ? 'Metti in pausa l’avanzamento automatico' : 'Avvia l’avanzamento automatico';
  reviewRotation.setAttribute('aria-label', label);
  reviewRotation.setAttribute('aria-pressed', String(reviewAutoplayEnabled));
  reviewRotation.title = label;
  const icon = reviewRotation.querySelector('span');
  if (icon) icon.textContent = reviewAutoplayEnabled ? 'Ⅱ' : '▶';
}

function scheduleReviewAutoplay() {
  window.clearTimeout(reviewAutoplayTimer);
  reviewAutoplayTimer = null;
  if (!reviewAutoplayEnabled || reviewPointerInside || document.hidden || reviewCards.length < 2) return;
  reviewAutoplayTimer = window.setTimeout(() => {
    reviewAutoplayTimer = null;
    moveReview(1);
  }, 2500);
}

function showReview(index) {
  if (!reviewCards.length || !reviewTrack) return;
  updateActiveReview(index);
  physicalReviewIndex = reviewCloneCount + activeReviewIndex;
  scrollToReviewCard(reviewTrack.children[physicalReviewIndex]);
  scheduleReviewAutoplay();
}

function moveReview(direction) {
  if (!reviewCards.length || !reviewTrack || reviewCards.length < 2) return;
  updateActiveReview(activeReviewIndex + direction);
  const cards = [...reviewTrack.children];
  const nextPhysicalIndex = physicalReviewIndex + direction;
  physicalReviewIndex = nextPhysicalIndex >= 0 && nextPhysicalIndex < cards.length
    ? nextPhysicalIndex
    : reviewCloneCount + activeReviewIndex;
  scrollToReviewCard(cards[physicalReviewIndex]);
  scheduleReviewAutoplay();
}

function syncReviewLoopPosition() {
  if (!reviewViewport || !reviewTrack || !reviewCards.length) return;
  window.clearTimeout(reviewScrollSettleTimer);
  reviewScrollSettleTimer = null;
  const cards = [...reviewTrack.children];
  const viewportRect = reviewViewport.getBoundingClientRect();
  let nearestIndex = 0;
  let nearestDistance = Infinity;
  cards.forEach((card, index) => {
    const cardRect = card.getBoundingClientRect();
    const cardStart = reviewViewport.scrollLeft + cardRect.left - viewportRect.left;
    const distance = Math.abs(cardStart - reviewViewport.scrollLeft);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  updateActiveReview(nearestIndex - reviewCloneCount);
  const firstOriginalIndex = reviewCloneCount;
  const afterOriginalsIndex = reviewCloneCount + reviewCards.length;
  if (nearestIndex < firstOriginalIndex || nearestIndex >= afterOriginalsIndex) {
    physicalReviewIndex = firstOriginalIndex + activeReviewIndex;
    reviewViewport.scrollLeft = reviewCardStart(reviewCards[activeReviewIndex]);
  } else {
    physicalReviewIndex = nearestIndex;
  }
  scheduleReviewAutoplay();
}

function scheduleReviewPositionSync() {
  window.clearTimeout(reviewScrollSettleTimer);
  reviewScrollSettleTimer = window.setTimeout(syncReviewLoopPosition, 120);
}

if (reviewViewport && reviewTrack && reviewCards.length) {
  reviewViewport.scrollLeft = reviewCardStart(reviewCards[activeReviewIndex]);
  reviewViewport.addEventListener('scroll', scheduleReviewPositionSync, { passive: true });
  reviewViewport.addEventListener('scrollend', syncReviewLoopPosition);
  window.addEventListener('resize', () => {
    window.requestAnimationFrame(() => scrollToReviewCard(reviewTrack.children[physicalReviewIndex]));
  });
}

reviewDots.forEach((dot, index) => dot.addEventListener('click', () => showReview(index)));
reviewArrows.forEach((arrow) => arrow.addEventListener('click', () => {
  moveReview(arrow.dataset.reviewDirection === 'previous' ? -1 : 1);
}));
reviewRotation?.addEventListener('click', () => {
  reviewAutoplayEnabled = !reviewAutoplayEnabled;
  if (reviewAutoplayEnabled) reviewPointerInside = false;
  updateReviewRotationControl();
  scheduleReviewAutoplay();
});
reviewSection?.addEventListener('pointerenter', () => {
  reviewPointerInside = true;
  window.clearTimeout(reviewAutoplayTimer);
  reviewAutoplayTimer = null;
});
reviewSection?.addEventListener('pointerleave', () => {
  reviewPointerInside = false;
  scheduleReviewAutoplay();
});
reviewSection?.addEventListener('focusin', () => {
  reviewAutoplayEnabled = false;
  updateReviewRotationControl();
  window.clearTimeout(reviewAutoplayTimer);
  reviewAutoplayTimer = null;
});
document.addEventListener('visibilitychange', scheduleReviewAutoplay);
reducedMotionPreference.addEventListener?.('change', (event) => {
  if (event.matches) {
    reviewAutoplayEnabled = false;
    updateReviewRotationControl();
    window.clearTimeout(reviewAutoplayTimer);
    reviewAutoplayTimer = null;
  }
});
updateReviewRotationControl();
scheduleReviewAutoplay();

const heroImages = [...document.querySelectorAll('.hero-image')];
let activeHeroIndex = Math.max(0, heroImages.findIndex((image) => image.classList.contains('is-active')));
let heroAutoplayTimer = null;

function scheduleHeroAutoplay() {
  window.clearTimeout(heroAutoplayTimer);
  heroAutoplayTimer = null;
  if (heroImages.length < 2 || reducedMotionPreference.matches || document.hidden) return;
  heroAutoplayTimer = window.setTimeout(() => {
    heroImages[activeHeroIndex]?.classList.remove('is-active');
    activeHeroIndex = (activeHeroIndex + 1) % heroImages.length;
    heroImages[activeHeroIndex]?.classList.add('is-active');
    scheduleHeroAutoplay();
  }, 3500);
}

document.addEventListener('visibilitychange', scheduleHeroAutoplay);
reducedMotionPreference.addEventListener?.('change', scheduleHeroAutoplay);
scheduleHeroAutoplay();
