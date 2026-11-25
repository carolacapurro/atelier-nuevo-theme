(() => {
  const DATA = JSON.parse(document.getElementById('mpz-data').textContent);
  const RAIZ = document.querySelector('.mpz');
  const pesos = c => c / 100;
  /* color de respaldo de cada cuero (si la textura no carga) */
  const HEX = { 'rojo flor':'#fc1616', 'cafe flor':'#2b2020', 'camel flor':'#e1bd79', 'chocolate engrasado':'#550e0e', 'azul engrasado':'#13607e',
    'cactus engrasado':'#51632d', 'caramelo vetas':'#f1c67a', 'gris engrasado':'#4b4b4b', 'habano engrasado':'#532a02', 'malbec engrasado':'#4a0f1e',
    'cocoa engrasado':'#3a2620', 'avellana vetas':'#a8693a' };
  const sinTilde = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const CUEROS = DATA.cueros;
  const TEX = {}; CUEROS.forEach(c => { TEX[c.n] = c.tex; });
  /* dijes con stock: cada uno es una variante de su producto */
  const CIRCULO_SVG = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="436" viewBox="0 0 400 436"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f5f6"/><stop offset=".35" stop-color="#a9adb2"/><stop offset=".55" stop-color="#eef0f2"/><stop offset=".8" stop-color="#8f949a"/><stop offset="1" stop-color="#dfe2e5"/></linearGradient></defs><circle cx="200" cy="15" r="10" fill="none" stroke="url(#g)" stroke-width="6"/><circle cx="200" cy="228" r="196" fill="none" stroke="#7d8287" stroke-width="9" opacity=".35"/><circle cx="200" cy="228" r="195" fill="none" stroke="url(#g)" stroke-width="7"/></svg>');
  const armar = (lista, pre) => lista.map(d => ({ id: pre + d.id, vid: d.id, n: d.n, p: pesos(d.p), img: /plata grande/i.test(d.n) ? CIRCULO_SVG : d.img }));
  const DIJES = { front: armar(DATA.dijes.front, 'f'), side: armar(DATA.dijes.side, 's'), extra: armar(DATA.dijes.extra, 'e') };
  const svg = document.getElementById('jc-svg'), sideSvg = document.getElementById('jc-side');
  const setVar = (k, v) => { svg.style.setProperty(k, v); sideSvg.style.setProperty(k, v); };
  const PATHS = {
    rectas: "M104.1,97.4h981.4c5.8,0,10.5,4.7,10.5,10.5v1370.6c0,5.8-4.7,10.5-10.5,10.5h-981.4s0-1391.5,0-1391.5Z",
    curvas: "M104.1,97.4h887.9c57.5,0,104,46.6,104,104v1183.5c0,57.5-46.6,104-104,104H104.1s0-1391.5,0-1391.5Z"
  };
  const cueroInicial = (CUEROS.find(c => sinTilde(c.n) === 'cafe flor') || CUEROS[0] || { n: '' }).n;
  const state = { tam: DATA.tam, cuero: cueroInicial, cordon:'Negro', cant:'4', esq:'Rectas', detalles:'Plateado' };
  const swBox = document.querySelector('.card[data-group="cuero"] .swatches');
  swBox.innerHTML = CUEROS.map(c => {
    const p = pesos(c.p), hex = HEX[sinTilde(c.n)] || '#6b4a35', tip = c.n + (p ? ' · +' + ('$' + String(Math.round(p)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')) : '');
    return `<button type="button" class="sw sq" style="background:url(${c.tex}) center/cover, ${hex}" data-v="${hex}" data-l="${c.n}" data-p="${p}" data-vid="${c.id}" data-tip="${tip}" aria-pressed="${c.n === cueroInicial}" aria-label="${tip}"></button>`;
  }).join('');
  if (!CUEROS.length) swBox.closest('.card').hidden = true;
  let cueroExtra = 0;
  /* texturas: fotos reales de cada cuero (sacadas de las fotos de la web) */
  const setCuero = l => { if (TEX[l]) document.querySelectorAll('.leather-img').forEach(i => i.setAttribute('href', TEX[l])); };
  const BASE = { A5: DATA.productos.A5 ? pesos(DATA.productos.A5.precio) : 0, A6: DATA.productos.A6 ? pesos(DATA.productos.A6.precio) : 0 }, EXTRA_GRABADO = DATA.grabado ? pesos(DATA.grabado.precio) : 0;
  let grabadoExtra = false;
  const fmt = n => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  let dijesExtra = 0;
  const updatePrecio = () => {
    const extras = cueroExtra + (grabadoExtra ? EXTRA_GRABADO : 0) + dijesExtra;
    const lista = BASE[state.tam] + extras;
    document.getElementById('p-list').textContent = fmt(lista);
    document.getElementById('p-tr').textContent = fmt(lista * 0.9);
    const pe = document.getElementById('p-extra');
    pe.hidden = extras === 0;
    pe.textContent = 'Incluye extras (+' + fmt(extras) + ')';
  };
  const plain = s => s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  const cap = document.getElementById('cap');
  const updateCap = () => { cap.textContent = `${state.tam} · ${state.cuero} · Cordón ${state.cordon} · ${state.cant} cordones`; };
  const out = (card, t) => { const o = card.querySelector('[data-out]'); if (o) o.textContent = t; };
  const press = (list, el) => { list.forEach(b => b.setAttribute('aria-pressed','false')); el.setAttribute('aria-pressed','true'); };

  document.querySelectorAll('.card[data-group="cuero"] .sw, .card[data-group="cordon"] .sw').forEach(b => {
    b.addEventListener('click', () => {
      const card = b.closest('.card'), g = card.dataset.group;
      press(card.querySelectorAll('.sw'), b);
      const p = +b.dataset.p || 0;
      out(card, b.dataset.l + (p ? ' · +' + fmt(p) : ''));
      setVar(g === 'cuero' ? '--cuero' : '--cordon', g === 'cordon' && b.dataset.l === 'Plata' ? 'url(#plata-tex)' : b.dataset.v);
      state[g] = b.dataset.l; updateCap();
      if (g === 'cuero') { cueroExtra = p; updatePrecio(); setCuero(b.dataset.l); }
    });
  });

  document.querySelectorAll('[data-cant]').forEach(b => {
    b.addEventListener('click', () => {
      const card = b.closest('.card');
      press(card.querySelectorAll('.opt'), b);
      state.cant = b.dataset.cant; out(card, state.cant); updateCap(); renderSide();
    });
  });

  document.querySelectorAll('[data-tam]').forEach(b => {
    const pr = DATA.productos[b.dataset.tam];
    if (!pr || !pr.disp) b.disabled = true;
    b.setAttribute('aria-pressed', b.dataset.tam === state.tam ? 'true' : 'false');
    if (b.dataset.tam === state.tam) out(b.closest('.card'), state.tam);
    b.addEventListener('click', () => {
      const card = b.closest('.card');
      press(card.querySelectorAll('.opt'), b);
      state.tam = b.dataset.tam; out(card, state.tam); updateCap();
      updatePrecio();
    });
  });

  const cover = document.getElementById('cover'), outline = document.getElementById('outline');
  document.querySelectorAll('[data-esq]').forEach(b => {
    if (!b.classList.contains('opt')) return;
    b.addEventListener('click', () => {
      const card = b.closest('.card');
      press(card.querySelectorAll('.opt'), b);
      const label = b.dataset.esq === 'curvas' ? 'Curvas' : 'Rectas';
      out(card, label); state.esq = label; updateCap();
      cover.setAttribute('d', PATHS[b.dataset.esq]); outline.setAttribute('d', PATHS[b.dataset.esq]);
    });
  });

  const slot = document.getElementById('charm-slot'), art = document.getElementById('charm-art');
  const sideG = document.getElementById('charm-side'), extrasG = document.getElementById('charm-extras');
  const byId = {}; Object.keys(DIJES).forEach(k => DIJES[k].forEach(d => { byId[d.id] = d; }));
  const corto = n => n.replace(/\s+\d+(?:x\d+)?(?:mm)?$/, '');
  const dz = { front:'', side:'', extra:[] };
  const SLOTS = [390, 810, 200, 1000];
  /* 3 tamaños estándar según la medida del nombre (la dimensión mayor): chico ≤15 mm, mediano ≤27 mm, grande >27 mm */
  const medida = n => Math.max(...(n.match(/\d+/g) || [15]).map(Number));
  const tier = d => { const m = medida(d.n); return m <= 15 ? 'S' : (m <= 27 ? 'M' : 'L'); };
  const TIER_NOMBRE = { S:'chico', M:'mediano', L:'grande' };
  const TIER_PX = { S:80, M:130, L:200 };
  /* tamaño proporcional a la medida real (tapa A5 = 16 cm ≈ 992 unidades → 6,2 por mm), un poco agrandado para que se lean bien */
  const MM = 7.1, AJUSTE = { 'plata grande': 1, 'borde': 1, 'chain': 1, 'hueco': 1.15 }, RESTO = 1.2;   // los no nombrados, un poco más grandes
  const anchoDije = d => { const n = d.n.toLowerCase(), k = Object.keys(AJUSTE).find(k => n.includes(k)); return Math.round(Math.max(medida(d.n), 9) * MM * (k ? AJUSTE[k] : RESTO)); };
  /* borde superior real de cada PNG (sin el aire transparente), para que el dije quede colgado del elástico y no flote */
  const BORDE = {};
  const URLS = [...new Set([].concat(DIJES.front, DIJES.side, DIJES.extra).map(d => d.img).filter(Boolean))];
  const medirBordes = () => Promise.all(URLS.map(k => new Promise(res => {
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0);
      let a; try { a = x.getImageData(0, 0, c.width, c.height).data; } catch (e) { res(); return; } let fila = 0;
      buscar: for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) if (a[(y * c.width + i) * 4 + 3] > 40) { fila = y; break buscar; }
      BORDE[k] = { fila, W: c.width, H: c.height }; res();
    };
    im.onerror = res; im.src = k;
  })));
  const imgTag = (d, arriba = -8, escala = 1) => {
    const w = Math.round(anchoDije(d) * escala), b = BORDE[d.img];
    const y = b ? arriba - b.fila * (w / Math.max(b.W, b.H)) : arriba;
    return `<image href="${d.img}" x="${-w/2}" y="${y.toFixed(1)}" width="${w}" height="${w}" preserveAspectRatio="xMidYMin meet"/>`;
  };
  const renderDijes = () => {
    art.innerHTML = dz.front ? imgTag(byId[dz.front]) : '';
    slot.classList.toggle('on', !!dz.front);
    sideG.innerHTML = dz.side ? imgTag(byId[dz.side]) : '';
    renderSideCharm();
    extrasG.innerHTML = dz.extra.map((id,i) => `<g transform="translate(${SLOTS[i]} 836)">${imgTag(byId[id])}</g>`).join('');
    dijesExtra = dz.extra.reduce((t,id) => t + (byId[id].p || 0), 0);
    const parts = [];
    if (dz.front) parts.push(corto(byId[dz.front].n));
    if (dz.side) parts.push(corto(byId[dz.side].n));
    if (dz.extra.length) parts.push(dz.extra.length + (dz.extra.length === 1 ? ' extra' : ' extras'));
    document.getElementById('dij-out').textContent = parts.join(' · ') || 'Ninguno';
    updatePrecio();
  };

  /* vista de costado (según fotos reales): arriba y abajo, columnas de 2 ojalillos (una por cada 2 cordones);
     el elástico negro baja por fuera de un ojalillo al de abajo. En el medio, 2 ojalillos con el cordón de cierre (color elegido) */
  const sideCords = document.getElementById('side-cords'), sideEyelets = document.getElementById('side-eyelets'), sideCharm = document.getElementById('side-charm');
  const T1 = 168, T2 = 232, B1 = 1354, B2 = 1418, MID = 824;
  const eyelet = (x, y, r) => `<g><circle class="sp-ring" cx="${x}" cy="${y}" r="${r}"/><circle class="sp-hole" cx="${x}" cy="${y}" r="${(r*0.5).toFixed(1)}"/><path class="sp-shine" d="M${(x-r*.65).toFixed(1)} ${(y-r*.3).toFixed(1)}A${(r*.72).toFixed(1)} ${(r*.72).toFixed(1)} 0 0 1 ${(x-r*.25).toFixed(1)} ${(y-r*.72).toFixed(1)}"/></g>`;
  let sideX = 157, sideY = T2 + 10;
  const renderSide = () => {
    const cols = +state.cant / 2;                                // 4 cordones = 2 columnas, 6 = 3 columnas
    const sp = cols === 2 ? 64 : 56, r = cols === 2 ? 17 : 15.5;
    const xs = Array.from({ length: cols }, (_, i) => 125 + (i - (cols - 1) / 2) * sp);
    const elastico = (x, y1, y2) => `<path class="sp-cord" d="M${x} ${y1}Q${x + 7} ${(y1 + y2) / 2} ${x} ${y2}"/>`;
    let ring = '', el = '';
    xs.forEach(x => {
      ring += eyelet(x, T1, r) + eyelet(x, T2, r) + eyelet(x, B1, r) + eyelet(x, B2, r);
      el += elastico(x, T1, T2) + elastico(x, B1, B2);
    });
    // cierre del medio: el cordón rodea el lomo y pasa por los 2 ojalillos
    const mx = [101, 149];
    ring += mx.map(x => eyelet(x, MID, 16)).join('');
    const cierre = `<path class="sp-band" d="M14 ${MID - 6}Q60 ${MID + 6} ${mx[0]} ${MID}L${mx[1]} ${MID}Q190 ${MID + 6} 236 ${MID - 6}"/>`;
    sideCords.innerHTML = '';
    sideEyelets.innerHTML = ring + el + cierre;
    sideX = xs[xs.length - 1]; sideY = T2 + r * 0.5;
    renderSideCharm();
  };
  const renderSideCharm = () => {
    if (!dz.side) { sideCharm.innerHTML = ''; return; }
    sideCharm.innerHTML = `<g transform="translate(${sideX} ${sideY})"><path class="sp-cord" d="M0 0V12" stroke-width="6"/>${imgTag(byId[dz.side], 9, .8)}</g>`;
  };
  const NINGUNO = '<circle cx="0" cy="75" r="46" fill="none" stroke="currentColor" stroke-width="5"/><path d="M-32 107L32 43" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>';
  document.querySelectorAll('.dz-grid').forEach(g => {
    const kind = g.dataset.dz;
    const items = [null].concat(DIJES[kind]);
    items.forEach(d => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'dz-item'; b.dataset.dzV = d ? d.id : '';
      b.setAttribute('aria-pressed', !d ? 'true' : 'false');
      b.innerHTML = d
        ? `<img src="${d.img}" alt="" loading="lazy"><span>${corto(d.n)}</span>${d.p ? `<em>+${fmt(d.p)}</em>` : ''}`
        : `<svg viewBox="-90 0 180 150" aria-hidden="true">${NINGUNO}</svg><span>Ninguno</span>`;
      b.title = d ? d.n + ' · ' + TIER_NOMBRE[tier(d)] + (d.p ? ' · +' + fmt(d.p) : '') : 'Ninguno';
      g.appendChild(b);
    });
  });
  const tg = document.querySelector('.dij-toggle'), body = document.getElementById('dij-body');
  const setOpen = open => { tg.setAttribute('aria-expanded', open ? 'true' : 'false'); body.hidden = !open; };
  tg.addEventListener('click', () => setOpen(tg.getAttribute('aria-expanded') !== 'true'));
  const ORDEN = ['front', 'side', 'extra'];
  const SIG = { front: 'Siguiente: costado →', side: 'Siguiente: extra →', extra: 'Listo ✓' };
  let paso = 'front';
  const setPaso = k => {
    paso = k;
    document.querySelectorAll('.dz-step').forEach(t => t.setAttribute('aria-selected', t.dataset.step === k ? 'true' : 'false'));
    document.querySelectorAll('.dz-grid').forEach(g => { g.hidden = g.dataset.dz !== k; });
    document.getElementById('dz-next').textContent = SIG[k];
  };
  document.querySelectorAll('.dz-step').forEach(t => t.addEventListener('click', () => setPaso(t.dataset.step)));
  document.getElementById('dz-next').addEventListener('click', () => {
    const i = ORDEN.indexOf(paso);
    if (i < ORDEN.length - 1) setPaso(ORDEN[i + 1]); else { setOpen(false); setPaso('front'); }
  });
  document.querySelectorAll('[data-dz-v]').forEach(b => {
    b.addEventListener('click', () => {
      const row = b.parentElement, kind = row.dataset.dz, v = b.dataset.dzV;
      if (kind === 'extra') {
        if (v === '') dz.extra = [];
        else {
          const i = dz.extra.indexOf(v);
          if (i >= 0) dz.extra.splice(i,1);
          else if (dz.extra.length < 4) dz.extra.push(v);
        }
        row.querySelectorAll('.dz-item').forEach(o => o.setAttribute('aria-pressed', (o.dataset.dzV === '' ? dz.extra.length === 0 : dz.extra.includes(o.dataset.dzV)) ? 'true' : 'false'));
      } else {
        press(row.querySelectorAll('.dz-item'), b);
        dz[kind] = v;
      }
      renderDijes();
    });
  });

  document.querySelectorAll('[data-gr]').forEach(b => {
    b.addEventListener('click', () => {
      const card = b.closest('.card');
      press(card.querySelectorAll('.opt'), b);
      out(card, b.dataset.name); state.detalles = b.dataset.name;
      setVar('--grabado', b.dataset.gr);
      setVar('--metal', b.dataset.gr);
    });
  });


  /* grabado extra: solo letras y puntos, mayúsculas, máx. 2 palabras, sin repetir letras seguidas */
  const eng2 = document.getElementById('eng2'), n2 = document.getElementById('n2');
  const limpiarExtra = v => {
    v = v.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ. ]/g, '').toUpperCase().replace(/^ +/, '').replace(/ {2,}/g, ' ');
    v = v.replace(/([A-ZÁÉÍÓÚÜÑ])\1+/g, '$1');                        // sin letras repetidas seguidas
    const partes = v.split(' '); if (partes.length > 2) v = partes.slice(0, 2).join(' ');   // dos palabras como máximo
    let puntos = 0; v = v.replace(/\./g, () => (++puntos > 2 ? '' : '.'));                 // máx. 2 puntos
    return v;
  };
  const geT = document.getElementById('ge-toggle'), geB = document.getElementById('ge-body');
  geT.addEventListener('click', () => {
    const abrir = geT.getAttribute('aria-expanded') !== 'true';
    geT.setAttribute('aria-expanded', abrir ? 'true' : 'false'); geB.hidden = !abrir;
    if (abrir) setTimeout(() => eng2.focus({ preventScroll: true }), 0);
  });
  const teclaGrabado = (inp, e) => {
    const k = e.key; if (k.length > 1 || e.ctrlKey || e.metaKey) return;
    const v = inp.value, pos = inp.selectionStart, prev = v[pos - 1];
    if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ. ]$/.test(k)) { e.preventDefault(); return; }
    if (k === ' ' && (!prev || prev === ' ' || v.trim().indexOf(' ') !== -1)) { e.preventDefault(); return; }
    if (k !== ' ' && k !== '.' && prev && prev.toLowerCase() === k.toLowerCase()) e.preventDefault();
  };
  eng2.addEventListener('keydown', e => {
    const k = e.key; if (k.length > 1 || e.ctrlKey || e.metaKey) return;
    const v = eng2.value, pos = eng2.selectionStart, prev = v[pos - 1];
    if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ. ]$/.test(k)) { e.preventDefault(); return; }
    if (k === ' ' && (!prev || prev === ' ' || v.trim().indexOf(' ') !== -1)) { e.preventDefault(); return; }
    if (k !== ' ' && k !== '.' && prev && prev.toLowerCase() === k.toLowerCase()) e.preventDefault();
  });
  eng2.addEventListener('input', () => {
    const limpio = limpiarExtra(eng2.value);
    if (limpio !== eng2.value) eng2.value = limpio;
    n2.textContent = limpio.length;
    grabadoExtra = limpio.trim().length > 0;
    document.getElementById('ge-out').textContent = limpio.trim() || 'Ninguno';
    updatePrecio();
  });

  const eng = document.getElementById('eng');
  eng.addEventListener('keydown', e => teclaGrabado(eng, e));
  const tspan = document.querySelector('#engrave tspan'), n = document.getElementById('n');
  eng.addEventListener('input', () => {
    const v = limpiarExtra(eng.value);                              // mismas reglas que el grabado extra
    if (v !== eng.value) eng.value = v; n.textContent = v.length; tspan.textContent = v.trim() || 'ABC'; out(eng.closest('.card'), v.trim() || '—');
  });

  /* Agregar al carrito: el Midori con todas las elecciones (se ven en el pedido) + una línea por cuero, dije y grabado extra,
     que son variantes de sus productos de stock, así Shopify descuenta el inventario. */
  const cta = document.getElementById('cta'), ctaNote = document.getElementById('ctanote');
  cta.addEventListener('click', async () => {
    const pr = DATA.productos[state.tam];
    if (!pr || !pr.disp) { ctaNote.textContent = 'Este tamaño no está disponible por ahora.'; ctaNote.classList.add('err'); return; }
    const ref = 'Midori #' + Date.now().toString(36).slice(-5).toUpperCase();
    const nom = id => { const d = [].concat(DIJES.front, DIJES.side, DIJES.extra).find(x => x.id === id); return d ? d.n : ''; };
    const grab = eng.value.trim(), grab2 = eng2.value.trim();
    const props = {
      'Tamaño': state.tam, 'Cuero': state.cuero, 'Cordón': state.cordon, 'Cantidad de cordones': state.cant,
      'Esquinas': state.esq, 'Detalles': state.detalles,
      'Dije frente': dz.front ? nom(dz.front) : 'Ninguno', 'Dije costado': dz.side ? nom(dz.side) : 'Ninguno',
      'Dijes extra': dz.extra.length ? dz.extra.map(nom).join(', ') : 'Ninguno',
      'Grabado del frente': grab || 'Sin grabado', 'Grabado extra': grab2 || 'Ninguno', '_Pedido': ref
    };
    const items = [{ id: pr.id, quantity: 1, properties: props }];
    const parte = (vid, extra) => items.push({ id: vid, quantity: 1, properties: Object.assign({ 'Para': ref }, extra || {}) });
    const cu = CUEROS.find(c => c.n === state.cuero); if (cu) parte(cu.id);
    if (dz.front) parte(byId[dz.front].vid);
    if (dz.side) parte(byId[dz.side].vid);
    dz.extra.forEach(id => parte(byId[id].vid));
    if (grab2 && DATA.grabado) parte(DATA.grabado.id, { 'Texto': grab2 });
    cta.disabled = true; ctaNote.classList.remove('err'); ctaNote.textContent = 'Agregando…';
    try {
      const r = await fetch(DATA.rutas.add + '.js', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ items }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.description || j.message || 'No se pudo agregar al carrito.');
      window.location.href = DATA.rutas.cart;
    } catch (e) {
      ctaNote.textContent = e.message + ' Puede que alguna opción se haya quedado sin stock: recargá la página y probá de nuevo.';
      ctaNote.classList.add('err'); cta.disabled = false;
    }
  });


  /* Midoris ya hechos: tira plegable + visor */
  const HECHOS = CUEROS.filter(c => c.foto).map(c => ({ n: c.n, src: c.foto }));
  const hT = document.getElementById('hechos-toggle'), hS = document.getElementById('hechos-strip');
  const visor = document.getElementById('visor'), vImg = document.getElementById('visor-img'), vN = document.getElementById('visor-n');
  let vi = 0;
  hS.innerHTML = HECHOS.map((f, i) => `<button type="button" class="hecho" data-i="${i}"><img src="${f.src}" alt="Midori en cuero ${f.n}" loading="lazy" onerror="this.closest('.hecho').remove()"><small>${f.n}</small></button>`).join('');
  hT.addEventListener('click', () => { const ab = hT.getAttribute('aria-expanded') !== 'true'; hT.setAttribute('aria-expanded', ab); hS.hidden = !ab; });
  const verFoto = i => { vi = (i + HECHOS.length) % HECHOS.length; vImg.src = HECHOS[vi].src; vImg.alt = 'Midori en cuero ' + HECHOS[vi].n; vN.textContent = HECHOS[vi].n; };
  hS.addEventListener('click', e => { const b = e.target.closest('.hecho'); if (!b) return; verFoto(+b.dataset.i); visor.hidden = false; document.getElementById('visor-x').focus(); });
  const cerrar = () => { visor.hidden = true; hS.querySelector(`[data-i="${vi}"]`).focus(); };
  document.getElementById('visor-x').addEventListener('click', cerrar);
  document.getElementById('visor-prev').addEventListener('click', () => verFoto(vi - 1));
  document.getElementById('visor-next').addEventListener('click', () => verFoto(vi + 1));
  visor.addEventListener('click', e => { if (e.target === visor) cerrar(); });
  document.addEventListener('keydown', e => { if (visor.hidden) return; if (e.key === 'Escape') cerrar(); if (e.key === 'ArrowLeft') verFoto(vi - 1); if (e.key === 'ArrowRight') verFoto(vi + 1); });
  document.getElementById('visor-usar').addEventListener('click', () => {
    const sw = [...document.querySelectorAll('.card[data-group="cuero"] .sw')].find(b => b.dataset.l === HECHOS[vi].n);
    if (sw) sw.click(); visor.hidden = true;
  });
  if (!HECHOS.length) document.querySelector('.hechos').hidden = true;
  medirBordes().then(() => renderDijes());
  setCuero(cueroInicial);
  out(document.querySelector('.card[data-group="cuero"]'), cueroInicial);
  { const c0 = CUEROS.find(c => c.n === cueroInicial); cueroExtra = c0 ? pesos(c0.p) : 0; }
  document.querySelectorAll('.card[data-group="cuero"] .sw').forEach(b => { if (TEX[b.dataset.l]) b.style.background = `url(${TEX[b.dataset.l]}) center/cover`; });
  setVar('--cuero', HEX[sinTilde(cueroInicial)] || '#2b2020');
  setVar('--cordon','#000000');
  setVar('--grabado','#d9d9d9');
  setVar('--metal','#d9d9d9');
  renderSide(); updateCap(); updatePrecio();

})();
