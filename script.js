'use strict';

const API_URL = 'https://rickandmortyapi.com/api/character';
const cardsContainer = document.querySelector('#cards');
const resultsLabel = document.querySelector('#results-label');
const pageLabel = document.querySelector('#page-label');
const message = document.querySelector('#message');
const previousButton = document.querySelector('#prev');
const nextButton = document.querySelector('#next');
const filterForm = document.querySelector('#filters');
const searchInput = document.querySelector('#search');
const statusInput = document.querySelector('#status');
const resetButton = document.querySelector('#reset');
let currentPage = 1;
let totalPages = 1;
let requestController = null;

const statusNames = { Alive: 'Vivo', Dead: 'Morto', unknown: 'Desconhecido' };

function makeElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function addRow(parent, label, value) {
  const row = makeElement('div', 'card-row');
  row.appendChild(makeElement('span', 'key', label));
  row.appendChild(makeElement('span', 'value', value || 'Não informado'));
  parent.appendChild(row);
}

function createCharacterCard(character) {
  const card = makeElement('article', 'character-card');
  const imageBox = makeElement('div', 'character-image');
  const image = document.createElement('img');
  image.src = character.image;
  image.alt = `Retrato de ${character.name}`;
  image.loading = 'lazy';
  image.width = 300;
  image.height = 300;
  imageBox.appendChild(image);
  card.appendChild(imageBox);

  const body = makeElement('div', 'card-body');
  const heading = makeElement('div', 'card-top');
  heading.appendChild(makeElement('h3', '', character.name));
  const status = makeElement('span', `status ${character.status.toLowerCase()}`, statusNames[character.status] || character.status);
  heading.appendChild(status);
  body.appendChild(heading);
  addRow(body, 'Espécie', character.species);
  addRow(body, 'Origem', character.origin?.name);
  addRow(body, 'Localização', character.location?.name);
  card.appendChild(body);
  return card;
}

async function loadCharacters() {
  if (requestController) requestController.abort();
  requestController = new AbortController();
  const controller = requestController;
  cardsContainer.replaceChildren();
  message.hidden = true;
  resultsLabel.textContent = 'Buscando personagens na API...';
  pageLabel.textContent = '';
  previousButton.disabled = true;
  nextButton.disabled = true;

  const params = new URLSearchParams({ page: String(currentPage) });
  if (searchInput.value.trim()) params.set('name', searchInput.value.trim());
  if (statusInput.value) params.set('status', statusInput.value);

  try {
    const response = await fetch(`${API_URL}?${params}`, { signal: controller.signal });
    if (response.status === 404) {
      resultsLabel.textContent = '0 personagens encontrados';
      message.hidden = false;
      message.textContent = 'Nenhum personagem corresponde à sua busca. Tente outro nome ou status.';
      return;
    }
    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
    const data = await response.json();
    if (controller !== requestController) return;
    totalPages = data.info.pages;
    const fragment = document.createDocumentFragment();
    data.results.forEach(character => fragment.appendChild(createCharacterCard(character)));
    cardsContainer.appendChild(fragment);
    resultsLabel.textContent = `${data.info.count} personagem(ns) encontrado(s)`;
    pageLabel.textContent = `Página ${currentPage} de ${totalPages}`;
    previousButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;
  } catch (error) {
    if (error.name === 'AbortError') return;
    resultsLabel.textContent = 'Falha ao carregar';
    message.hidden = false;
    message.replaceChildren();
    message.appendChild(makeElement('p', '', 'Não foi possível consultar a API. Verifique sua conexão com a internet.'));
    const retry = makeElement('button', '', 'Tentar novamente');
    retry.type = 'button';
    retry.addEventListener('click', loadCharacters);
    message.appendChild(retry);
    console.error('Erro ao consultar personagens:', error);
  }
}

filterForm.addEventListener('submit', event => {
  event.preventDefault();
  currentPage = 1;
  loadCharacters();
});
resetButton.addEventListener('click', () => {
  filterForm.reset();
  currentPage = 1;
  loadCharacters();
});
previousButton.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    loadCharacters();
    document.querySelector('#personagens').scrollIntoView();
  }
});
nextButton.addEventListener('click', () => {
  if (currentPage < totalPages) {
    currentPage++;
    loadCharacters();
    document.querySelector('#personagens').scrollIntoView();
  }
});
loadCharacters();
