// script.js — gerencia carrinho, animações, produtos e checkout
const PRODUCTS = [
  {sku:'x1000', name:'Fone X1000', price:599, desc:'Fones de alta fidelidade com cancelamento de ruído.'},
  {sku:'swpro', name:'Smart Watch Pro', price:1299, desc:'Relógio inteligente com monitoramento avançado.'},
  {sku:'console', name:'Console NovaGen', price:2499, desc:'Console de última geração com jogos exclusivos.'},
  {sku:'tv55', name:'TV OLED 55"', price:4299, desc:'Televisão OLED com cores imersivas e HDR.'},
  {sku:'notebook', name:'Notebook Ultra', price:3199, desc:'Notebook ultrafino para produtividade e criatividade.'},
  {sku:'speaker', name:'Caixa de Som Max', price:399, desc:'Som potente em um design compacto.'}
];

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
function formatMoney(n){ return Number(n).toLocaleString('pt-BR'); }

function updateCartCount(){ const cart = loadCart(); const nodes = document.querySelectorAll('.cart-count'); nodes.forEach(n=>n.textContent = cart.reduce((s,i)=>s+i.qty,0)); }

// Generic: add item to cart
function addToCart(item){ const cart = loadCart(); const existing = cart.find(i=>i.sku===item.sku); if(existing){ existing.qty += (item.qty||1); } else { cart.push(Object.assign({qty:1}, item)); } saveCart(cart); updateCartCount(); }

// Wire up add buttons on index (if present)
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      const name = card.querySelector('.prod-name').textContent.trim();
      const price = Number(card.querySelector('.price').dataset.price || 0);
      const sku = card.dataset.sku || name;
      addToCart({sku,name,price});
      btn.classList.add('added'); btn.textContent = 'Adicionado';
      setTimeout(()=>{btn.classList.remove('added');btn.textContent='Adicionar'},1400);
    });
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
function renderProductPage(sku){ const p = getProductBySku(sku); if(!p) return; const nameEl = document.getElementById('product-name'); const priceEl = document.getElementById('product-price'); const descEl = document.getElementById('product-desc'); const mediaEl = document.getElementById('product-media'); const addBtn = document.getElementById('add-to-cart'); if(nameEl) nameEl.textContent = p.name; if(priceEl) priceEl.textContent = `R$ ${formatMoney(p.price)}`; if(descEl) descEl.textContent = p.desc; if(mediaEl) mediaEl.innerHTML = `<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="220" rx="14" fill="#0f0f0f"/><circle cx="260" cy="60" r="26" fill="#FFD400"/></svg>`;
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
    orderForm.addEventListener('submit', (e)=>{
      e.preventDefault(); const cart = loadCart(); if(cart.length===0){ alert('Carrinho vazio'); return; }
      const name = document.getElementById('customer-name').value.trim(); const email = document.getElementById('customer-email').value.trim(); const address = document.getElementById('customer-address').value.trim();
      if(!name||!email||!address){ alert('Preencha todos os campos'); return; }
      const result = document.getElementById('order-result'); result.classList.add('show'); result.textContent = 'Processando pedido...'; setTimeout(()=>{ result.textContent = `Pedido recebido! Obrigado, ${name}. Enviaremos confirmação para ${email}.`; localStorage.removeItem('cart'); updateCartCount(); renderCartItems(); }, 1200);
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

