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
      const details = makeElement('details', 'menu-group');
      if (index === 0) details.open = true;
      details.append(makeElement('summary', '', `${group.name} · ${group.items.length}`));
      const items = makeElement('div', 'menu-items');
      group.items.forEach((item) => {
        const row = makeElement('div', 'menu-item');
        const info = makeElement('div', 'menu-item-info');
        info.append(makeElement('div', 'menu-item-name', item.name));
        if (item.description) info.append(makeElement('div', 'menu-item-description', item.description));
        row.append(info, makeElement('span', 'menu-item-price', item.price));
        items.append(row);
      });
      details.append(items);
      contents.push(details);
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

const reviewsViewport = document.querySelector('.reviews-viewport');
const reviewCard = document.querySelector('.review-card');
function scrollReviews(direction) {
  if (!reviewsViewport || !reviewCard) return;
  const step = reviewCard.getBoundingClientRect().width + 14;
  reviewsViewport.scrollBy({left: step * direction, behavior: 'smooth'});
}
document.querySelector('.review-prev')?.addEventListener('click', () => scrollReviews(-1));
document.querySelector('.review-next')?.addEventListener('click', () => scrollReviews(1));
