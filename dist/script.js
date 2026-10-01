const navToggle = document.querySelector('.nav-toggle');
const primaryNav = document.querySelector('.primary-nav');
navToggle?.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') !== 'true';
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
  primaryNav.classList.toggle('open', open);
});
primaryNav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    primaryNav.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.setAttribute('aria-label', 'Apri il menu');
  }
});

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
        info.append(makeElement('div', 'menu-item-name', item.name));
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
    src: '/assets/vedetta-occasione-cena-privata.jpg',
    alt: 'Tavolo riservato per una cena privata nella sala in legno del ristorante.'
  },
  celebration: {
    src: '/assets/vedetta-occasione-ricorrenza.jpg',
    alt: 'Torta con candeline e fiori per una ricorrenza nella sala del ristorante.'
  },
  business: {
    src: '/assets/vedetta-occasione-cena-aziendale-professionisti.jpg',
    alt: 'Colleghi riuniti per una cena aziendale in un ristorante.'
  },
  family: {
    src: '/assets/vedetta-occasione-pranzo-famiglia.jpg',
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
const reviewDots = [...document.querySelectorAll('.review-dot')];
const reviewArrows = [...document.querySelectorAll('[data-review-direction]')];
const reviewRotation = document.querySelector('.review-rotation');
const reducedMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeReviewIndex = Math.max(0, reviewDots.findIndex((dot) => dot.classList.contains('is-active')));
let reviewAutoplayEnabled = !reducedMotionPreference.matches;
let reviewPointerInside = false;
let reviewAutoplayTimer = null;

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
    showReview(activeReviewIndex + 1);
  }, 2500);
}

function showReview(index) {
  if (!reviewCards.length) return;
  activeReviewIndex = (index + reviewCards.length) % reviewCards.length;
  reviewDots.forEach((dot, dotIndex) => {
    const active = dotIndex === activeReviewIndex;
    dot.classList.toggle('is-active', active);
    dot.setAttribute('aria-pressed', String(active));
  });
  const card = reviewCards[activeReviewIndex];
  if (reviewViewport && card) {
    const viewportRect = reviewViewport.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const centerOffset = mobile ? 0 : (reviewViewport.clientWidth - cardRect.width) / 2;
    const target = reviewViewport.scrollLeft + cardRect.left - viewportRect.left - centerOffset;
    reviewViewport.scrollTo({
      left: Math.max(0, target),
      behavior: reducedMotionPreference.matches ? 'auto' : 'smooth'
    });
  }
  scheduleReviewAutoplay();
}

reviewDots.forEach((dot, index) => dot.addEventListener('click', () => showReview(index)));
reviewArrows.forEach((arrow) => arrow.addEventListener('click', () => {
  showReview(activeReviewIndex + (arrow.dataset.reviewDirection === 'previous' ? -1 : 1));
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
