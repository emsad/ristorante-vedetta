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
  const heading = makeElement('div', 'menu-panel-heading');
  heading.append(makeElement('h3', '', menu.title));
  if (menu.pdf) {
    const pdf = makeElement('a', '', 'Apri la carta originale ↗');
    pdf.href = menu.pdf;
    pdf.target = '_blank';
    pdf.rel = 'noopener noreferrer';
    heading.append(pdf);
  }
  const contents = [heading];
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
        const title = makeElement('h4', 'menu-group-title', `${group.name} · ${group.items.length}`);
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
const occasionCaption = document.querySelector('#occasion-caption');
const occasionChoices = [...document.querySelectorAll('.occasion-choice')];
const occasionPhotos = {
  private: {
    src: '/assets/vedetta-occasione-cena-privata.jpg',
    alt: 'Immagine illustrativa: tavolo riservato per una cena privata nella sala in legno della Vedetta.',
    caption: 'Immagine illustrativa · Cene private'
  },
  celebration: {
    src: '/assets/vedetta-occasione-ricorrenza.jpg',
    alt: 'Immagine illustrativa: torta con candeline e fiori per una ricorrenza nella sala del ristorante.',
    caption: 'Immagine illustrativa · Ricorrenze'
  },
  business: {
    src: '/assets/vedetta-occasione-cena-aziendale-professionisti.jpg',
    alt: 'Immagine illustrativa: tavolo apparecchiato per una cena aziendale in un ristorante tradizionale.',
    caption: 'Immagine illustrativa · Cene aziendali'
  },
  family: {
    src: '/assets/vedetta-occasione-pranzo-famiglia.jpg',
    alt: 'Immagine illustrativa: famiglia riunita intorno a un pranzo con piatti da condividere.',
    caption: 'Immagine illustrativa · Pranzi di famiglia'
  }
};

occasionChoices.forEach((choice) => choice.addEventListener('click', () => {
  const photo = occasionPhotos[choice.dataset.occasion];
  if (!photo || !occasionImage || !occasionCaption) return;
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
  occasionCaption.textContent = photo.caption;
  if (occasionImage.complete && occasionImage.naturalWidth > 0) {
    occasionImage.classList.remove('is-changing');
    occasionImage.onload = null;
  }
}));

const reviewsViewport = document.querySelector('.reviews-viewport');
const reviewCard = document.querySelector('.review-card');
function scrollReviews(direction) {
  if (!reviewsViewport || !reviewCard) return;
  const step = reviewCard.getBoundingClientRect().width + 14;
  reviewsViewport.scrollBy({left: step * direction, behavior: 'smooth'});
}
document.querySelector('.review-prev')?.addEventListener('click', () => scrollReviews(-1));
document.querySelector('.review-next')?.addEventListener('click', () => scrollReviews(1));
