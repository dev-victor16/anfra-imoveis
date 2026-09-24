/**
 * Anfra Imóveis — Aplicação Principal (JavaScript)
 * CRECI-MG PJ 8373 | Centro de Ibirité - MG
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initSearch();
  initProtagonist();
  initCatalog();
  initSimulator();
  initFaq();
  initSellForm();
  initModal();
  initDrawer();
});

/* ==========================================================================
   1. HEADER & NAVEGAÇÃO
   ========================================================================== */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* ==========================================================================
   2. IMÓVEL PROTAGONISTA & VITRINE EDITORIAL
   ========================================================================== */
function initProtagonist() {
  // Configura os botões da vitrine editorial para abrir o modal do imóvel correto
  const heroCard = document.querySelector('.hero-card-featured');
  if (heroCard) {
    heroCard.addEventListener('click', (e) => {
      e.preventDefault();
      openPropertyModalByRef('644'); // Casa Alto Padrão no Santa Rosa
    });
  }

  const editorialMain = document.querySelector('.editorial-main');
  if (editorialMain) {
    editorialMain.addEventListener('click', (e) => {
      e.preventDefault();
      openPropertyModalByRef('491'); // Casa no Tirol (Barreiro)
    });
  }

  const miniCards = document.querySelectorAll('.editorial-mini-card');
  miniCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const ref = card.getAttribute('data-ref');
      if (ref) openPropertyModalByRef(ref);
    });
  });
}

/* ==========================================================================
   3. BUSCA & FILTROS DO CATÁLOGO
   ========================================================================== */
let activeFilter = {
  city: 'Todas as Cidades',
  type: 'Todos os Tipos',
  keyword: '',
  transaction: 'Venda',
  mcmvOnly: false,
  sort: 'default'
};

function initSearch() {
  const citySelect = document.getElementById('search-city');
  const typeSelect = document.getElementById('search-type');
  const keywordInput = document.getElementById('search-keyword');
  const searchBtn = document.getElementById('search-submit-btn');

  // Preencher Cidades
  if (citySelect && typeof ANFRA_CITIES !== 'undefined') {
    citySelect.innerHTML = ANFRA_CITIES.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  // Preencher Tipos
  if (typeSelect && typeof ANFRA_TYPES !== 'undefined') {
    typeSelect.innerHTML = ANFRA_TYPES.map(t => `<option value="${t}">${t}</option>`).join('');
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (citySelect) activeFilter.city = citySelect.value;
      if (typeSelect) activeFilter.type = typeSelect.value;
      if (keywordInput) activeFilter.keyword = keywordInput.value.trim().toLowerCase();

      // Rola suavemente até o catálogo
      const catalogEl = document.getElementById('catalogo');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }

      applyFilters();
    });
  }

  // Abas de tipo de negócio na busca
  const searchTabs = document.querySelectorAll('.search-tab-btn');
  searchTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      searchTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter.transaction = tab.getAttribute('data-trans') || 'Venda';
      applyFilters();
    });
  });
}

/* ==========================================================================
   4. RENDERIZAÇÃO DO CATÁLOGO
   ========================================================================== */
function initCatalog() {
  const chipBtns = document.querySelectorAll('.chip-btn');
  const sortSelect = document.getElementById('catalog-sort-select');

  chipBtns.forEach(chip => {
    chip.addEventListener('click', () => {
      chipBtns.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter.type = chip.getAttribute('data-type') || 'Todos os Tipos';
      
      // Sincroniza select de busca se existir
      const searchType = document.getElementById('search-type');
      if (searchType) searchType.value = activeFilter.type;

      applyFilters();
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      activeFilter.sort = sortSelect.value;
      applyFilters();
    });
  }

  // Render inicial
  renderCatalog(ANFRA_PROPERTIES);
}

function parsePriceToNumber(priceStr) {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

function applyFilters() {
  if (typeof ANFRA_PROPERTIES === 'undefined') return;

  let filtered = ANFRA_PROPERTIES.filter(p => {
    // Cidade
    if (activeFilter.city !== 'Todas as Cidades') {
      if (!p.city.toLowerCase().includes(activeFilter.city.toLowerCase()) &&
          !p.fullAddress.toLowerCase().includes(activeFilter.city.toLowerCase())) {
        return false;
      }
    }

    // Tipo
    if (activeFilter.type !== 'Todos os Tipos') {
      if (p.type !== activeFilter.type) {
        return false;
      }
    }

    // Keyword (código ou texto)
    if (activeFilter.keyword) {
      const kw = activeFilter.keyword;
      const refMatch = p.reference.toLowerCase().includes(kw);
      const titleMatch = p.title.toLowerCase().includes(kw);
      const neighMatch = p.neighborhood.toLowerCase().includes(kw);
      const descMatch = p.description.toLowerCase().includes(kw);
      if (!refMatch && !titleMatch && !neighMatch && !descMatch) {
        return false;
      }
    }

    return true;
  });

  // Ordenação
  if (activeFilter.sort === 'price-asc') {
    filtered.sort((a, b) => parsePriceToNumber(a.price) - parsePriceToNumber(b.price));
  } else if (activeFilter.sort === 'price-desc') {
    filtered.sort((a, b) => parsePriceToNumber(b.price) - parsePriceToNumber(a.price));
  }

  renderCatalog(filtered);
}

function renderCatalog(properties) {
  const grid = document.getElementById('properties-grid');
  const countEl = document.getElementById('catalog-count');

  if (countEl) {
    countEl.textContent = `${properties.length} imóveis encontrados`;
  }

  if (!grid) return;

  if (properties.length === 0) {
    grid.innerHTML = `
      <div class="catalog-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-tertiary); margin-bottom: 14px;">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3 style="font-family: var(--font-heading); margin-bottom: 8px;">Nenhum imóvel corresponde aos filtros</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">Tente selecionar outra cidade, tipo ou limpar a busca.</p>
        <button class="btn btn-outline btn-sm" onclick="resetFilters()">Limpar Filtros</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = properties.map(p => `
    <article class="property-card" data-ref="${p.reference}">
      <div class="property-media-wrapper">
        <img class="property-img" src="${p.coverImage}" alt="${p.title}" loading="lazy" />
        <div class="property-badges-group">
          ${p.situation ? `<span class="badge-tag">${p.situation}</span>` : ''}
          ${p.isMcmv ? `<span class="badge-tag badge-mcmv">Aceita MCMV</span>` : ''}
        </div>
        <span class="property-ref-tag">CÓD ${p.reference}</span>
      </div>

      <div class="property-body">
        <div class="property-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${p.neighborhood} — ${p.city}/MG</span>
        </div>

        <h3 class="property-title">${p.title}</h3>

        <div class="property-specs">
          ${p.bedrooms ? `
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v11m0-4h18m0-7v11M7 10h10"></path></svg>
              ${p.bedrooms} qts
            </span>
          ` : ''}
          ${p.bathrooms ? `
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z"></path></svg>
              ${p.bathrooms} banh
            </span>
          ` : ''}
          ${p.garages ? `
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8" cy="16" r="2"></circle><circle cx="16" cy="16" r="2"></circle></svg>
              ${p.garages} vag${p.garages > 1 ? 'as' : 'a'}
            </span>
          ` : ''}
          ${p.area ? `
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>
              ${p.area} ${p.areaMeasure}
            </span>
          ` : ''}
        </div>

        <div class="property-footer">
          <div class="property-price-wrap">
            <span class="property-price-label">Valor de Venda</span>
            <span class="property-price">${p.price}</span>
          </div>
          <button class="btn btn-outline btn-sm btn-view-details" onclick="openPropertyModalByRef('${p.reference}')">
            Ver Detalhes
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

window.resetFilters = function() {
  activeFilter = {
    city: 'Todas as Cidades',
    type: 'Todos os Tipos',
    keyword: '',
    transaction: 'Venda',
    mcmvOnly: false,
    sort: 'default'
  };

  const citySelect = document.getElementById('search-city');
  const typeSelect = document.getElementById('search-type');
  const keywordInput = document.getElementById('search-keyword');
  const sortSelect = document.getElementById('catalog-sort-select');

  if (citySelect) citySelect.value = 'Todas as Cidades';
  if (typeSelect) typeSelect.value = 'Todos os Tipos';
  if (keywordInput) keywordInput.value = '';
  if (sortSelect) sortSelect.value = 'default';

  const chips = document.querySelectorAll('.chip-btn');
  chips.forEach((c, idx) => {
    if (idx === 0) c.classList.add('active');
    else c.classList.remove('active');
  });

  renderCatalog(ANFRA_PROPERTIES);
};

/* ==========================================================================
   5. MODAL DE DETALHES & GALERIA COMPLETA
   ========================================================================== */
let currentModalProperty = null;
let currentImageIndex = 0;

function initModal() {
  const backdrop = document.getElementById('property-modal');
  const closeBtn = document.getElementById('modal-close');
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');

  if (closeBtn && backdrop) {
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => changeModalImage(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => changeModalImage(1));

  document.addEventListener('keydown', (e) => {
    if (!backdrop || !backdrop.classList.contains('active')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') changeModalImage(-1);
    if (e.key === 'ArrowRight') changeModalImage(1);
  });
}

window.openPropertyModalByRef = function(ref) {
  if (typeof ANFRA_PROPERTIES === 'undefined') return;
  const prop = ANFRA_PROPERTIES.find(p => p.reference === ref);
  if (!prop) return;

  currentModalProperty = prop;
  currentImageIndex = 0;

  const backdrop = document.getElementById('property-modal');
  const titleEl = document.getElementById('modal-title');
  const locationEl = document.getElementById('modal-location');
  const refEl = document.getElementById('modal-ref');
  const priceEl = document.getElementById('modal-price');
  const descEl = document.getElementById('modal-description');
  const whatsappBtn = document.getElementById('modal-whatsapp-btn');

  // Specs
  document.getElementById('modal-bedrooms').textContent = prop.bedrooms ? `${prop.bedrooms} dormitório(s)` : '—';
  document.getElementById('modal-bathrooms').textContent = prop.bathrooms ? `${prop.bathrooms} banheiro(s)` : '—';
  document.getElementById('modal-garages').textContent = prop.garages ? `${prop.garages} vaga(s)` : '—';
  document.getElementById('modal-area').textContent = prop.area ? `${prop.area} ${prop.areaMeasure}` : '—';

  if (titleEl) titleEl.textContent = prop.title;
  if (locationEl) locationEl.textContent = `${prop.fullAddress}`;
  if (refEl) refEl.textContent = `Código: ${prop.reference}`;
  if (priceEl) priceEl.textContent = prop.price;
  if (descEl) descEl.innerHTML = `<p>${prop.description.replace(/\n/g, '<br>')}</p>`;

  // Configura botão WhatsApp com mensagem pronta
  if (whatsappBtn) {
    const msg = encodeURIComponent(`Olá, Daniel! Tenho interesse no imóvel "${prop.title}" (Cód. ${prop.reference}) de ${prop.price} em ${prop.neighborhood}, ${prop.city}. Gostaria de mais informações e agendar uma visita.`);
    whatsappBtn.href = `https://wa.me/5531988281073?text=${msg}`;
  }

  // Preenche miniaturas da galeria
  const thumbsContainer = document.getElementById('modal-gallery-thumbs');
  if (thumbsContainer && prop.images && prop.images.length > 0) {
    thumbsContainer.innerHTML = prop.images.map((img, i) => `
      <div class="gallery-thumb-item ${i === 0 ? 'active' : ''}" onclick="selectModalImage(${i})">
        <img src="${img.medium || img.large}" alt="Miniatura ${i+1}" />
      </div>
    `).join('');
  }

  updateModalImage();

  if (backdrop) {
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

function closeModal() {
  const backdrop = document.getElementById('property-modal');
  if (backdrop) {
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function updateModalImage() {
  if (!currentModalProperty || !currentModalProperty.images || currentModalProperty.images.length === 0) return;
  const imgEl = document.getElementById('modal-main-img');
  if (imgEl) {
    imgEl.src = currentModalProperty.images[currentImageIndex].large || currentModalProperty.images[currentImageIndex].medium;
  }

  // Atualiza classe ativa nas miniaturas
  const thumbs = document.querySelectorAll('.gallery-thumb-item');
  thumbs.forEach((t, i) => {
    if (i === currentImageIndex) t.classList.add('active');
    else t.classList.remove('active');
  });
}

function changeModalImage(delta) {
  if (!currentModalProperty || !currentModalProperty.images) return;
  const total = currentModalProperty.images.length;
  currentImageIndex = (currentImageIndex + delta + total) % total;
  updateModalImage();
}

window.selectModalImage = function(index) {
  currentImageIndex = index;
  updateModalImage();
};

/* ==========================================================================
   6. SIMULADOR DE FINANCIAMENTO HABITACIONAL CAIXA
   ========================================================================== */
function initSimulator() {
  const propValSlider = document.getElementById('sim-prop-val');
  const propValLabel = document.getElementById('sim-prop-val-display');

  const downPaySlider = document.getElementById('sim-down-pay');
  const downPayLabel = document.getElementById('sim-down-pay-display');

  const termSlider = document.getElementById('sim-term');
  const termLabel = document.getElementById('sim-term-display');

  const financedValEl = document.getElementById('sim-financed-val');
  const installmentEl = document.getElementById('sim-installment-val');
  const incomeEl = document.getElementById('sim-income-val');
  const whatsappSimBtn = document.getElementById('sim-whatsapp-btn');

  let amortizationType = 'SAC'; // SAC ou PRICE

  const systemBtns = document.querySelectorAll('.calc-tab-btn');
  systemBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      systemBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      amortizationType = btn.getAttribute('data-system');
      recalc();
    });
  });

  function recalc() {
    if (!propValSlider || !downPaySlider || !termSlider) return;

    const propVal = parseInt(propValSlider.value, 10);
    const downPercent = parseInt(downPaySlider.value, 10);
    const months = parseInt(termSlider.value, 10);

    const downVal = propVal * (downPercent / 100);
    const financed = propVal - downVal;

    // Atualiza labels
    if (propValLabel) propValLabel.textContent = propVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    if (downPayLabel) downPayLabel.textContent = `${downPercent}% (${downVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })})`;
    if (termLabel) termLabel.textContent = `${months} meses (${(months/12).toFixed(0)} anos)`;

    if (financedValEl) financedValEl.textContent = financed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

    // Taxa de juros anual média estimada (9.5% a.a. para SBPE / Caixa)
    const annualRate = 0.095;
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;

    let firstInstallment = 0;

    if (amortizationType === 'SAC') {
      const amort = financed / months;
      const interest = financed * monthlyRate;
      firstInstallment = amort + interest;
    } else {
      // PRICE
      firstInstallment = financed * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    }

    if (installmentEl) {
      installmentEl.textContent = firstInstallment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
    }

    // Renda mínima recomendada (parcela = máx 30% da renda)
    const reqIncome = firstInstallment / 0.30;
    if (incomeEl) {
      incomeEl.textContent = reqIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
    }

    // Link WhatsApp
    if (whatsappSimBtn) {
      const msg = encodeURIComponent(`Olá, Daniel! Realizei uma simulação de financiamento no site da Anfra Imóveis:\n- Valor do Imóvel: ${propVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n- Entrada: ${downVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${downPercent}%)\n- Prazo: ${months} meses\n- Sistema: ${amortizationType}\n- Parcela Estimada: ${firstInstallment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\nGostaria de uma análise bancária oficial para o meu perfil!`);
      whatsappSimBtn.href = `https://wa.me/5531988281073?text=${msg}`;
    }
  }

  if (propValSlider) propValSlider.addEventListener('input', recalc);
  if (downPaySlider) downPaySlider.addEventListener('input', recalc);
  if (termSlider) termSlider.addEventListener('input', recalc);

  recalc();
}

/* ==========================================================================
   7. FORMULÁRIO DE AVALIAÇÃO / VENDA DE IMÓVEL
   ========================================================================== */
function initSellForm() {
  const form = document.getElementById('sell-property-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('owner-name').value.trim();
    const phone = document.getElementById('owner-phone').value.trim();
    const type = document.getElementById('owner-prop-type').value;
    const city = document.getElementById('owner-prop-city').value;
    const details = document.getElementById('owner-prop-details').value.trim();

    const msg = encodeURIComponent(`Olá, Daniel (Anfra Imóveis)! Gostaria de avaliar e anunciar meu imóvel com vocês:\n- Nome: ${name}\n- Telefone: ${phone}\n- Tipo do Imóvel: ${type}\n- Localização: ${city}\n- Informações adicionais: ${details}`);
    window.open(`https://wa.me/5531988281073?text=${msg}`, '_blank');
  });
}

/* ==========================================================================
   8. FAQ ACCORDION
   ========================================================================== */
function initFaq() {
  const headers = document.querySelectorAll('.accordion-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const body = item.querySelector('.accordion-body');
      const isOpen = item.classList.contains('open');

      // Fecha todos os outros accordions
      document.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('open');
        const b = i.querySelector('.accordion-body');
        if (b) b.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
}

/* ==========================================================================
   9. MOBILE DRAWER
   ========================================================================== */
function initDrawer() {
  const toggleBtn = document.getElementById('mobile-toggle-btn');
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const closeBtn = document.getElementById('drawer-close-btn');
  const links = document.querySelectorAll('.drawer-link');

  function openDrawer() {
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (toggleBtn) toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  links.forEach(l => {
    l.addEventListener('click', closeDrawer);
  });
}
