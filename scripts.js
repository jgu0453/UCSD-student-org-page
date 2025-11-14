document.addEventListener('DOMContentLoaded', () => {
  setupReserveModal();
  setupAdvancedFilters();
  setupOrgDetailPanel();
  setupJoinDrawer();
});

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

  trigger.addEventListener('click', () => openLayer(drawer));
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
