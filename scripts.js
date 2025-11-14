const AUTH_KEY = 'orgsAuth';

document.addEventListener('DOMContentLoaded', () => {
  enforcePrivateRoutes();
  initAuthUI();
  hydrateUserName();
  setupLoginForm();
  setupReserveModal();
  setupAdvancedFilters();
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
