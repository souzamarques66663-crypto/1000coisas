// script.js — gerencia carrinho, animações, produtos e checkout
const PRODUCTS = [
  {sku:'kaidi777', name:'Fone Kaidi 777', price:120, desc:'Fone destaque com som imersivo e bateria de longa duração.', details:'Ideal para quem busca áudio premium, conforto e praticidade no dia a dia.', highlights:['Bluetooth 5.3','Bateria de até 40h','Design confortável e portátil'], images:['images/kaidi-1.jpg','images/kaidi-2.jpg','images/kaidi-3.jpg']},
  {sku:'swpro', name:'Smart Watch Pro', price:1299, desc:'Relógio inteligente com monitoramento avançado.', details:'Monitore batimentos, passos e notificações com um visual moderno e elegante.', highlights:['Monitoramento de saúde','Tela AMOLED','Resistência à água'], images:[]},
  {sku:'console', name:'Console NovaGen', price:2499, desc:'Console de última geração com jogos exclusivos.', details:'Experiência imersiva com gráficos de alta performance e acesso a jogos modernos.', highlights:['Gráficos avançados','Jogos exclusivos','Conexão rápida'], images:[]},
  {sku:'tv55', name:'TV OLED 55"', price:4299, desc:'Televisão OLED com cores imersivas e HDR.', details:'Imagem ultra nítida com contraste profundo e reprodução cinematográfica.', highlights:['OLED 55 polegadas','HDR e som envolvente','Smart TV completa'], images:[]},
  {sku:'notebook', name:'Notebook Ultra', price:3199, desc:'Notebook ultrafino para produtividade e criatividade.', details:'Desempenho leve e portátil para estudar, trabalhar e criar com facilidade.', highlights:['Processador moderno','Tela Full HD','Leve e silencioso'], images:[]},
  {sku:'speaker', name:'Caixa de Som Max', price:399, desc:'Som potente em um design compacto.', details:'Perfeita para festas, ambientes e momentos de música com boa presença.', highlights:['Som potente','Portátil','Conexão simples'], images:[]}
];

let modalRotationTimer = null;

function getPlaceholderImage(label){ return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420"><rect width="600" height="420" rx="28" fill="#121212"/><rect x="70" y="70" width="460" height="280" rx="18" fill="#1d1d1d"/><circle cx="460" cy="140" r="46" fill="#FFD400"/><text x="300" y="235" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#ffffff">${label}</text></svg>`)}`; }

function getProductBySku(sku){ return PRODUCTS.find(p=>p.sku===sku) || null; }

// Scroll reveal
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {threshold: 0.12});
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
});

// Cart persistence utils
function loadCart(){ try{ return JSON.parse(localStorage.getItem('cart')||'[]'); }catch(e){return []} }
function saveCart(cart){ localStorage.setItem('cart', JSON.stringify(cart)); }
function loadOrders(){ try{ return JSON.parse(localStorage.getItem('orders')||'[]'); }catch(e){return []} }
function saveOrders(orders){ localStorage.setItem('orders', JSON.stringify(orders)); }
function formatMoney(n){ return Number(n).toLocaleString('pt-BR'); }
const WHATSAPP_NUMBER = '5511983248250';

function buildWhatsAppMessage(order){
  const itemsText = (order.items || []).map((item) => `• ${item.name} x${item.qty} — R$ ${formatMoney(item.price * item.qty)}`).join('\n');
  const paymentLabel = order.paymentMethod === 'pix' ? 'Pix' : order.paymentMethod === 'debit' ? 'Débito' : 'Crédito';
  return `Novo pedido 1000 Coisas\n\nID: ${order.id}\nCliente: ${order.customer.name}\nE-mail: ${order.customer.email}\nTelefone: ${order.customer.phone}\nCPF: ${order.customer.cpf}\nEndereço: ${order.customer.address}\nPagamento: ${paymentLabel}\n\nItens:\n${itemsText}\n\nTotal: R$ ${formatMoney(order.total)}`;
}

function sendOrderToWhatsApp(order){
  const message = encodeURIComponent(buildWhatsAppMessage(order));
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (!popup) {
    window.location.href = url;
  }
}

function updateCartCount(){ const cart = loadCart(); const nodes = document.querySelectorAll('.cart-count'); nodes.forEach(n=>n.textContent = cart.reduce((s,i)=>s+i.qty,0)); }

// Generic: add item to cart
function addToCart(item){ const cart = loadCart(); const existing = cart.find(i=>i.sku===item.sku); if(existing){ existing.qty += (item.qty||1); } else { cart.push(Object.assign({qty:1}, item)); } saveCart(cart); updateCartCount(); }

function openProductModal(sku){
  const product = getProductBySku(sku);
  if(!product) return;
  const modal = document.getElementById('product-modal');
  const nameEl = document.getElementById('modal-product-name');
  const priceEl = document.getElementById('modal-product-price');
  const descEl = document.getElementById('modal-product-desc');
  const highlightsEl = document.getElementById('modal-product-highlights');
  const mediaEl = document.getElementById('modal-media');
  const addBtn = document.getElementById('modal-add-to-cart');
  if(!modal||!nameEl||!priceEl||!descEl||!highlightsEl||!mediaEl||!addBtn) return;

  nameEl.textContent = product.name;
  priceEl.textContent = `R$ ${formatMoney(product.price)}`;
  descEl.textContent = product.details || product.desc;
  highlightsEl.innerHTML = '';
  (product.highlights || []).forEach((item) => {
    const li = document.createElement('li'); li.textContent = item; highlightsEl.appendChild(li);
  });

  const images = (product.images && product.images.length) ? product.images : [getPlaceholderImage(product.name)];
  let activeIndex = 0;
  mediaEl.innerHTML = `
    <img id="modal-main-image" src="${images[0]}" alt="${product.name}" />
    <div class="modal-thumbs"></div>
  `;

  const thumbsEl = mediaEl.querySelector('.modal-thumbs');
  images.forEach((image, index) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = `modal-thumb ${index === 0 ? 'active' : ''}`;
    thumb.innerHTML = `<img src="${image}" alt="${product.name} ${index + 1}" />`;
    thumb.addEventListener('click', () => {
      activeIndex = index;
      updateModalImage();
    });
    thumbsEl.appendChild(thumb);
  });

  function updateModalImage(){
    const mainImage = document.getElementById('modal-main-image');
    if(!mainImage) return;
    mainImage.src = images[activeIndex];
    mediaEl.querySelectorAll('.modal-thumb').forEach((thumb, index) => {
      thumb.classList.toggle('active', index === activeIndex);
    });
  }

  addBtn.onclick = () => {
    addToCart({sku: product.sku, name: product.name, price: product.price});
    addBtn.textContent = 'Adicionado';
    setTimeout(()=>{ addBtn.textContent = 'Adicionar ao carrinho'; }, 1200);
  };

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  clearInterval(modalRotationTimer);
  if(images.length > 1){
    modalRotationTimer = setInterval(() => {
      activeIndex = (activeIndex + 1) % images.length;
      updateModalImage();
    }, 2600);
  }
}

function closeProductModal(){
  const modal = document.getElementById('product-modal');
  if(!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  clearInterval(modalRotationTimer);
}

// Wire up add buttons on index (if present)
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = e.target.closest('.product-card');
      const name = card.querySelector('.prod-name').textContent.trim();
      const price = Number(card.querySelector('.price').dataset.price || 0);
      const sku = card.dataset.sku || name;
      addToCart({sku,name,price});
      btn.classList.add('added'); btn.textContent = 'Adicionado';
      setTimeout(()=>{btn.classList.remove('added');btn.textContent='Adicionar'},1400);
    });
  });

  document.querySelectorAll('.product-card').forEach((card) => {
    card.classList.add('is-clickable');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', (e) => {
      if(e.target.closest('.add-btn')) return;
      const sku = card.dataset.sku;
      if(sku) openProductModal(sku);
    });
    card.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        const sku = card.dataset.sku;
        if(sku) openProductModal(sku);
      }
    });
  });

  const kaidiCard = document.querySelector('.product-card[data-sku="kaidi777"]');
  const kaidiImage = kaidiCard?.querySelector('.product-image');
  if(kaidiCard && kaidiImage){
    const kaidiImages = ['images/kaidi-1.jpg','images/kaidi-2.jpg','images/kaidi-3.jpg'];
    let kaidiIndex = 0;
    setInterval(() => {
      kaidiIndex = (kaidiIndex + 1) % kaidiImages.length;
      kaidiImage.src = kaidiImages[kaidiIndex];
    }, 3000);
  }

  document.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', closeProductModal);
  });

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') closeProductModal();
  });

  updateCartCount();
  const cartBtn = document.getElementById('open-cart'); if(cartBtn){ cartBtn.addEventListener('click', ()=>{ window.location.href = 'cart.html'; }); }
  const cta = document.getElementById('cta-hero'); if (cta) cta.addEventListener('click', () => { const el = document.getElementById('produtos'); if(el) el.scrollIntoView({behavior:'smooth'}); });
});

// Render cart items into a container with id 'cart-items'
function renderCartItems(){ const itemsContainer = document.getElementById('cart-items'); if(!itemsContainer) return; let cart = loadCart(); itemsContainer.innerHTML=''; if(cart.length===0){ itemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>'; const sub = document.getElementById('cart-subtotal'); if(sub) sub.textContent='R$ 0,00'; return; }
  cart.forEach((it, idx) => {
    const itemEl = document.createElement('div'); itemEl.className='cart-item';
    itemEl.innerHTML = `
      <div class="meta">
        <h4>${it.name}</h4>
        <div class="price">R$ ${formatMoney(it.price)}</div>
      </div>
      <div class="qty">
        <button data-action="dec" data-idx="${idx}">-</button>
        <div>${it.qty}</div>
        <button data-action="inc" data-idx="${idx}">+</button>
        <button data-action="rm" data-idx="${idx}">Remover</button>
      </div>
    `;
    itemsContainer.appendChild(itemEl);
  });
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0); const subEl = document.getElementById('cart-subtotal'); if(subEl) subEl.textContent = 'R$ ' + formatMoney(subtotal);
  // handlers
  itemsContainer.querySelectorAll('button[data-action]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const action = b.dataset.action; const idx = Number(b.dataset.idx); let cart = loadCart(); if(action==='inc'){ cart[idx].qty += 1; } else if(action==='dec'){ cart[idx].qty = Math.max(1, cart[idx].qty-1); } else if(action==='rm'){ cart.splice(idx,1); }
      saveCart(cart); renderCartItems(); updateCartCount();
    });
  });
}

// Expose a function to render the product page
function renderProductPage(sku){ const p = getProductBySku(sku); if(!p) return; const nameEl = document.getElementById('product-name'); const priceEl = document.getElementById('product-price'); const descEl = document.getElementById('product-desc'); const mediaEl = document.getElementById('product-media'); const addBtn = document.getElementById('add-to-cart'); if(nameEl) nameEl.textContent = p.name; if(priceEl) priceEl.textContent = `R$ ${formatMoney(p.price)}`; if(descEl) descEl.textContent = p.desc; if(mediaEl) {
    if (sku === 'kaidi777') {
      mediaEl.innerHTML = `
        <div class="product-gallery">
          <img class="product-gallery-main" src="images/kaidi-1.jpg" alt="Fone Kaidi 777 vista frontal" />
          <div class="product-gallery-thumbs">
            <button class="gallery-thumb active" type="button" data-image="images/kaidi-1.jpg" aria-label="Ver foto 1"><img src="images/kaidi-1.jpg" alt="Foto 1 do Kaidi" /></button>
            <button class="gallery-thumb" type="button" data-image="images/kaidi-2.jpg" aria-label="Ver foto 2"><img src="images/kaidi-2.jpg" alt="Foto 2 do Kaidi" /></button>
            <button class="gallery-thumb" type="button" data-image="images/kaidi-3.jpg" aria-label="Ver foto 3"><img src="images/kaidi-3.jpg" alt="Foto 3 do Kaidi" /></button>
          </div>
        </div>
      `;
      const mainImage = mediaEl.querySelector('.product-gallery-main');
      mediaEl.querySelectorAll('.gallery-thumb').forEach((thumb) => {
        thumb.addEventListener('click', () => {
          mediaEl.querySelectorAll('.gallery-thumb').forEach((item) => item.classList.remove('active'));
          thumb.classList.add('active');
          if (mainImage) mainImage.src = thumb.dataset.image;
        });
      });
    } else {
      mediaEl.innerHTML = `<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="220" rx="14" fill="#0f0f0f"/><circle cx="260" cy="60" r="26" fill="#FFD400"/></svg>`;
    }
  }
  if(addBtn){ addBtn.addEventListener('click', ()=>{ addToCart({sku:p.sku,name:p.name,price:p.price}); addBtn.textContent='Adicionado'; setTimeout(()=>addBtn.textContent='Adicionar ao carrinho',1300); }); }
  // footer year
  const y3 = document.getElementById('year3'); if(y3) y3.textContent = new Date().getFullYear();
}

// Render cart page (separado da página de checkout)
function renderCartPage(){ renderCartItems(); const clearBtn = document.getElementById('clear-cart-page'); if(clearBtn) clearBtn.addEventListener('click', ()=>{ localStorage.removeItem('cart'); renderCartItems(); updateCartCount(); }); const y4 = document.getElementById('year4'); if(y4) y4.textContent = new Date().getFullYear(); }

// Checkout page behavior: order submission
document.addEventListener('DOMContentLoaded', ()=>{
  const orderForm = document.getElementById('order-form');
  if(orderForm){
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const cardFields = document.getElementById('card-fields');
    const toggleCardFields = () => {
      const selected = document.querySelector('input[name="payment"]:checked')?.value;
      const shouldShow = selected === 'debit' || selected === 'credit';
      cardFields?.classList.toggle('show', shouldShow);
      if(!shouldShow){
        document.getElementById('card-number').value = '';
        document.getElementById('card-name').value = '';
        document.getElementById('card-cvv').value = '';
      }
    };
    paymentRadios.forEach(radio => radio.addEventListener('change', toggleCardFields));
    toggleCardFields();

    orderForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const cart = loadCart();
      if(cart.length===0){ alert('Carrinho vazio'); return; }

      const name = document.getElementById('customer-name').value.trim();
      const email = document.getElementById('customer-email').value.trim();
      const phone = document.getElementById('customer-phone').value.trim();
      const cpf = document.getElementById('customer-cpf').value.trim();
      const address = document.getElementById('customer-address').value.trim();
      const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'pix';
      const cardNumber = document.getElementById('card-number').value.trim();
      const cardName = document.getElementById('card-name').value.trim();
      const cardCvv = document.getElementById('card-cvv').value.trim();
      const cardInstallments = document.getElementById('card-installments').value;

      if(!name||!email||!phone||!cpf||!address){ alert('Preencha todos os campos'); return; }
      if((paymentMethod === 'debit' || paymentMethod === 'credit') && (!cardNumber||!cardName||!cardCvv)){ alert('Preencha os dados do cartão para concluir'); return; }

      const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
      const order = {
        id: `order-${Date.now()}`,
        createdAt: new Date().toISOString(),
        customer: { name, email, phone, cpf, address },
        paymentMethod,
        paymentDetails: (paymentMethod === 'pix') ? { status: 'Aguardando pagamento por Pix' } : { cardNumber: cardNumber.slice(-4), cardName, cardCvv: cardCvv.slice(-2), installments: cardInstallments },
        items: cart,
        total: subtotal,
        status: 'Recebido'
      };

      const orders = loadOrders();
      orders.push(order);
      saveOrders(orders);
      sendOrderToWhatsApp(order);

      const result = document.getElementById('order-result');
      result.classList.add('show');
      result.innerHTML = `
        <strong>Pedido recebido!</strong><br />
        Cliente: ${name}<br />
        E-mail: ${email}<br />
        Forma de pagamento: ${paymentMethod === 'pix' ? 'Pix' : paymentMethod === 'debit' ? 'Débito' : 'Crédito'}<br />
        Total: R$ ${formatMoney(subtotal)}
      `;
      localStorage.removeItem('cart');
      updateCartCount();
      renderCartItems();
      orderForm.reset();
      toggleCardFields();
    });
  }
  // clear button on checkout page
  const clearBtn = document.getElementById('clear-cart'); if(clearBtn) clearBtn.addEventListener('click', ()=>{ localStorage.removeItem('cart'); renderCartItems(); updateCartCount(); });
  // footer year for checkout
  const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear(); const y2 = document.getElementById('year2'); if(y2) y2.textContent = new Date().getFullYear();
});

// Make functions available globally for pages
window.getProductBySku = getProductBySku;
window.renderProductPage = renderProductPage;
window.renderCartPage = renderCartPage;
window.renderCartItems = renderCartItems;

