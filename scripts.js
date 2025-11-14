const AUTH_KEY = 'orgsAuth';

document.addEventListener('DOMContentLoaded', () => {
  enforcePrivateRoutes();
  initAuthUI();
  hydrateUserName();
  setupLoginForm();
  setupReserveModal();
  setupAdvancedFilters();
  setupExploreSearch();
  setupOrgDetailPanel();
  setupJoinDrawer();
});

function getAuthData() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isAuthenticated() {
  return Boolean(getAuthData());
}

function enforcePrivateRoutes() {
  if (document.body.classList.contains('page-dashboard') && !isAuthenticated()) {
    window.location.href = 'login.html';
  }
}

function initAuthUI() {
  const authed = isAuthenticated();
  document.querySelectorAll('[data-auth-link]').forEach(link => {
    link.hidden = !authed;
  });

  const authButton = document.querySelector('[data-auth-button]');
  if (!authButton) return;

  if (authed) {
    authButton.textContent = 'Log Out';
    authButton.addEventListener('click', () => {
      localStorage.removeItem(AUTH_KEY);
      window.location.href = 'index.html';
    });
  } else {
    authButton.textContent = 'Log In';
    authButton.addEventListener('click', () => {
      if (!window.location.pathname.endsWith('/login.html') && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
      }
    });
  }
}

function hydrateUserName() {
  const data = getAuthData();
  if (!data?.name) return;
  document.querySelectorAll('[data-user-name]').forEach(node => {
    node.textContent = data.name;
  });
}

function setupLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  if (isAuthenticated()) {
    window.location.href = 'my-orgs.html';
    return;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = (formData.get('name') || '').toString().trim();
    const email = (formData.get('email') || '').toString().trim();
    if (!name || !email) {
      alert('Please provide both your name and UCSD email.');
      return;
    }
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ name, email, timestamp: Date.now() })
    );
    window.location.href = 'my-orgs.html';
  });
}

function setupReserveModal() {
  const modal = document.getElementById('reserve-modal');
  const trigger = document.getElementById('reserve-button');
  if (!modal || !trigger) return;

  trigger.addEventListener('click', () => openLayer(modal));
  modal.addEventListener('click', event => {
    if (event.target === modal) closeLayer(modal);
  });
  modal.querySelectorAll('[data-close]').forEach(btn =>
    btn.addEventListener('click', () => closeLayer(modal))
  );
}

function setupAdvancedFilters() {
  const filterButton = document.querySelector('.btn-filter');
  const advancedFilters = document.getElementById('advanced-filters');
  if (!filterButton || !advancedFilters) return;

  filterButton.addEventListener('click', () => {
    const isHidden = advancedFilters.hasAttribute('hidden');
    if (isHidden) {
      advancedFilters.removeAttribute('hidden');
    } else {
      advancedFilters.setAttribute('hidden', '');
    }
    filterButton.setAttribute('aria-expanded', String(isHidden));
  });
}

function setupExploreSearch() {
  const searchInput = document.getElementById('search-orgs');
  const searchButton = document.getElementById('search-button');
  const cards = Array.from(document.querySelectorAll('[data-org-card]'));
  const activeFiltersWrap = document.getElementById('active-filters');
  const filterContainer = document.getElementById('advanced-filters');

  if (!searchInput || !searchButton || cards.length === 0) {
    console.warn('Explore search unavailable: missing input/button/cards');
    return;
  }

  console.info('Explore search ready');

  const state = { keyword: '', filters: {} };
  const filterInputs = {};

  const registerFilterInput = input => {
    const group = input.dataset.filterGroup;
    const value = (input.value || '').toLowerCase();
    const label = input.dataset.filterLabel || value;
    if (!group || !value) return;
    if (!state.filters[group]) state.filters[group] = new Set();
    const key = `${group}:${value}`;
    filterInputs[key] = { input, label };
    input.addEventListener('change', () => {
      if (input.checked) {
        state.filters[group].add(value);
      } else {
        state.filters[group].delete(value);
      }
      renderActiveFilters();
      applyFilters();
    });
  };

  filterContainer?.querySelectorAll('input[type="checkbox"]').forEach(registerFilterInput);

  const updateKeyword = () => {
    state.keyword = searchInput.value.trim().toLowerCase();
    console.debug('Search keyword updated:', state.keyword);
    applyFilters();
  };

  searchButton.addEventListener('click', updateKeyword);
  searchInput.addEventListener('input', updateKeyword);
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      updateKeyword();
    }
  });
  searchInput.addEventListener('search', updateKeyword);

  function renderActiveFilters() {
    if (!activeFiltersWrap) return;
    const chips = [];
    Object.entries(state.filters).forEach(([group, values]) => {
      values.forEach(value => {
        const key = `${group}:${value}`;
        const label = filterInputs[key]?.label || value;
        chips.push({ key, label, group, value });
      });
    });
    if (!chips.length) {
      activeFiltersWrap.hidden = true;
      activeFiltersWrap.innerHTML = '';
      return;
    }
    activeFiltersWrap.hidden = false;
    activeFiltersWrap.innerHTML = chips
      .map(
        chip =>
          `<button type="button" class="filter-pill" data-filter-chip="${chip.key}">${chip.label} ×</button>`
      )
      .join('');
    activeFiltersWrap.querySelectorAll('[data-filter-chip]').forEach(button => {
      button.addEventListener('click', () => {
        const key = button.dataset.filterChip;
        const target = filterInputs[key];
        if (!target) return;
        target.input.checked = false;
        const [group, value] = key.split(':');
        state.filters[group]?.delete(value);
        renderActiveFilters();
        applyFilters();
      });
    });
  }

  function cardMatchesFilters(card) {
    return Object.entries(state.filters).every(([group, values]) => {
      if (!values || values.size === 0) return true;
      const cardValues = (card.dataset[group] || '')
        .split(',')
        .map(item => item.trim().toLowerCase())
        .filter(Boolean);
      if (!cardValues.length) return false;
      return cardValues.some(val => values.has(val));
    });
  }

  function applyFilters() {
    cards.forEach(card => {
      const searchBlob = (card.dataset.search || '').toLowerCase();
      const matchesKeyword = !state.keyword || searchBlob.includes(state.keyword);
      const matchesFilters = cardMatchesFilters(card);
      card.hidden = !(matchesKeyword && matchesFilters);
    });
  }

  applyFilters();
  renderActiveFilters();
}

function setupOrgDetailPanel() {
  const panel = document.getElementById('org-detail');
  if (!panel) return;

  const titleEl = panel.querySelector('.detail-title');
  const bodyEl = panel.querySelector('.detail-body');
  const tagsEl = panel.querySelector('.detail-tags');

  document.querySelectorAll('.view-details').forEach(button => {
    button.addEventListener('click', () => {
      const org = button.dataset.org || 'Student Organization';
      const description = button.dataset.description || '';
      const tags = button.dataset.tags ? button.dataset.tags.split(',') : [];

      titleEl.textContent = org;
      bodyEl.textContent = description;
      tagsEl.innerHTML = tags
        .map(tag => `<span class="tag">${tag.trim()}</span>`)
        .join('');

      positionFloatingPanel(panel, button);
      openLayer(panel);
    });
  });

  panel.querySelectorAll('[data-close]').forEach(btn =>
    btn.addEventListener('click', () => closeLayer(panel))
  );
}

function setupJoinDrawer() {
  const drawer = document.getElementById('join-drawer');
  const trigger = document.getElementById('join-org-btn');
  if (!drawer || !trigger) return;

  trigger.addEventListener('click', () => {
    positionFloatingPanel(drawer, trigger);
    openLayer(drawer);
  });
  drawer.querySelectorAll('[data-close]').forEach(btn =>
    btn.addEventListener('click', () => closeLayer(drawer))
  );
}

function openLayer(element) {
  element?.classList.add('is-visible');
  element?.setAttribute('aria-hidden', 'false');
}

function closeLayer(element) {
  element?.classList.remove('is-visible');
  element?.setAttribute('aria-hidden', 'true');
}

function positionFloatingPanel(panel, trigger) {
  if (!panel || !trigger) return;
  const rect = trigger.getBoundingClientRect();
  const panelWidth = panel.offsetWidth || 320;
  const viewportWidth = window.innerWidth;
  let left = window.scrollX + rect.left;
  if (left + panelWidth > window.scrollX + viewportWidth - 16) {
    left = window.scrollX + viewportWidth - panelWidth - 16;
  }
  left = Math.max(window.scrollX + 16, left);
  const top = window.scrollY + rect.bottom + 12;
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}
