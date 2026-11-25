(function () {
  'use strict';

  /* ── Validación de grabado (mismas reglas que easify-custom.js) ──
     - Solo letras (incluye ñ y tildes), espacio y punto
     - Sin números ni caracteres especiales
     - Sin letras repetidas consecutivas
     - Máx. 2 puntos (≈ máx. 3 oraciones)
     - Todo en mayúsculas
  ── */
  var VALID_CHARS       = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ. ]$/;
  var NUMBERS_OR_SPECIAL = /[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ. ]/g;
  var MAX_DOTS = 2;

  function limitDots(str) {
    var count = 0;
    var out = '';
    for (var i = 0; i < str.length; i++) {
      if (str[i] === '.') {
        count++;
        if (count > MAX_DOTS) continue;
      }
      out += str[i];
    }
    return out;
  }

  function cleanGrabado(value) {
    var cleaned = value.replace(NUMBERS_OR_SPECIAL, '');
    cleaned = cleaned.replace(/(.)\1+/gi, '$1');
    cleaned = limitDots(cleaned);
    return cleaned.toUpperCase();
  }

  class JournalConfigurator {
    constructor(root) {
      this.root   = root;
      this.form   = root.querySelector('.jc-form');
      this.canvas = root.querySelector('.jc-canvas');
      if (!this.form || !this.canvas) return;

      this.grabadoTextEl = root.querySelector('.jc-grabado-text');
      this.submitBtn     = root.querySelector('[id^="jc-submit-"]');
      this.errorEl       = root.querySelector('[id^="jc-error-"]');

      this.state = {
        cuero:        null,
        cordon:       null,
        cantidad:     null,
        esquinas:     null,
        detalles:     null,
        dije_portada: null,
        dije_costado: null,
        dije_extra:   new Set(),
      };

      this._bind();
    }

    _bind() {
      // Option chips
      this.form.querySelectorAll('.jc-chip').forEach((chip) => {
        chip.addEventListener('click', () => this._onChipClick(chip));
      });

      // Grabado text input
      const grabadoInput   = this.form.querySelector('.jc-grabado-input');
      const charCounter    = this.form.querySelector('.jc-char-counter');
      if (grabadoInput) {
        grabadoInput.addEventListener('keydown', (e) => {
          const key = e.key;
          if (key.length > 1) return;

          if (/[0-9]/.test(key)) { e.preventDefault(); return; }
          if (!VALID_CHARS.test(key)) { e.preventDefault(); return; }

          if (key === '.') {
            const dotCount = (grabadoInput.value.match(/\./g) || []).length;
            if (dotCount >= MAX_DOTS) { e.preventDefault(); return; }
          }

          const pos = grabadoInput.selectionStart;
          const charBefore = grabadoInput.value[pos - 1];
          if (charBefore && charBefore.toLowerCase() === key.toLowerCase()) {
            e.preventDefault();
          }
        });

        grabadoInput.addEventListener('input', (e) => {
          const pos = grabadoInput.selectionStart;
          const cleaned = cleanGrabado(e.target.value);
          if (cleaned !== e.target.value) {
            grabadoInput.value = cleaned;
            const newPos = Math.min(pos, cleaned.length);
            try { grabadoInput.setSelectionRange(newPos, newPos); } catch (_) {}
          }
          const val = grabadoInput.value;
          if (this.grabadoTextEl) this.grabadoTextEl.textContent = val;
          if (charCounter) charCounter.textContent = `${val.length}/30`;
        });

        grabadoInput.addEventListener('paste', (e) => {
          e.preventDefault();
          const pasted  = (e.clipboardData || window.clipboardData).getData('text') || '';
          const start   = grabadoInput.selectionStart;
          const end     = grabadoInput.selectionEnd;
          const current = grabadoInput.value;
          const newValue = cleanGrabado(current.substring(0, start) + pasted + current.substring(end));
          grabadoInput.value = newValue;
          const newPos = Math.min(start + pasted.length, newValue.length);
          try { grabadoInput.setSelectionRange(newPos, newPos); } catch (_) {}
          if (this.grabadoTextEl) this.grabadoTextEl.textContent = newValue;
          if (charCounter) charCounter.textContent = `${newValue.length}/30`;
        });
      }

      // Quantity buttons
      this.form.querySelectorAll('.jc-qty-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const input = this.form.querySelector('.jc-qty-input');
          const val   = parseInt(input.value, 10) || 1;
          input.value = btn.dataset.action === 'plus'
            ? Math.min(99, val + 1)
            : Math.max(1, val - 1);
        });
      });

      // Form submit
      this.form.addEventListener('submit', (e) => this._onSubmit(e));
    }

    _onChipClick(chip) {
      const option = chip.dataset.option;
      const value  = chip.dataset.value;
      const label  = chip.dataset.label || value;

      if (chip.classList.contains('jc-chip--multi')) {
        // ── Multi-select (Dijes Extra) ──────────────────
        const isActive = chip.classList.toggle('is-active');
        const container = this.canvas.querySelector('[data-layer="dijes_extra"]');

        if (isActive) {
          this.state.dije_extra.add(value);
          if (chip.dataset.image && container) {
            const img       = document.createElement('img');
            img.src         = chip.dataset.image;
            img.alt         = label;
            img.className   = 'jc-extra-img';
            img.dataset.dije = value;
            container.appendChild(img);
          }
        } else {
          this.state.dije_extra.delete(value);
          container?.querySelector(`[data-dije="${CSS.escape(value)}"]`)?.remove();
        }

        const prop = this.form.querySelector('[data-prop="dije_extra"]');
        if (prop) prop.value = [...this.state.dije_extra].join(', ');

      } else {
        // ── Single-select ───────────────────────────────
        this.form
          .querySelectorAll(`.jc-chip[data-option="${option}"]`)
          .forEach((c) => c.classList.remove('is-active'));

        chip.classList.add('is-active');
        this.state[option] = value;

        const prop = this.form.querySelector(`[data-prop="${option}"]`);
        if (prop) prop.value = label;

        // Clear error state
        chip.closest('[data-required]')?.classList.remove('jc-has-error');

        this._updateLayer(option, chip);
      }
    }

    _updateLayer(option, chip) {
      switch (option) {
        case 'cuero':
          this._setLayer('cuero', chip.dataset.image);
          break;

        case 'cordon':
        case 'cantidad':
          this._updateCordonLayer();
          break;

        case 'esquinas':
          this._setLayer('esquinas', chip.dataset.image);
          break;

        case 'detalles':
          if (this.grabadoTextEl && chip.dataset.color) {
            this.grabadoTextEl.style.color = chip.dataset.color;
          }
          break;

        case 'dije_portada':
          this._setLayer('dije_portada', chip.dataset.image);
          break;

        case 'dije_costado':
          this._setLayer('dije_costado', chip.dataset.image);
          break;
      }
    }

    _updateCordonLayer() {
      if (!this.state.cordon || !this.state.cantidad) return;
      const active = this.form.querySelector('.jc-chip[data-option="cordon"].is-active');
      if (!active) return;
      const src = this.state.cantidad === '4' ? active.dataset.four : active.dataset.six;
      this._setLayer('cordon', src);
    }

    _setLayer(name, src) {
      const el = this.canvas.querySelector(`[data-layer="${name}"]`);
      if (!el) return;
      const valid = src && src.trim() !== '' && src !== 'undefined' && src !== 'null';
      if (valid) {
        el.src            = src;
        el.hidden         = false;
        el.style.display  = '';
      } else {
        el.src            = '';
        el.hidden         = true;
        el.style.display  = 'none';
      }
    }

    _validate() {
      const requiredGroups = this.form.querySelectorAll('[data-required]');
      let valid = true;
      let firstError = null;

      requiredGroups.forEach((group) => {
        const key   = group.dataset.group;
        const hasVal = this.state[key] !== null && this.state[key] !== undefined && this.state[key] !== '';
        group.classList.toggle('jc-has-error', !hasVal);
        if (!hasVal) {
          valid = false;
          firstError = firstError || group;
        }
      });

      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      return valid;
    }

    async _onSubmit(e) {
      e.preventDefault();
      if (!this._validate()) return;

      this._setLoading(true);

      try {
        const resp = await fetch('/cart/add.js', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body:    JSON.stringify({ items: this._cartItems() }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.description || 'No se pudo agregar al carrito.');
        }

        const item = await resp.json();

        // Trigger cart drawer (this theme listens for 'cart:update')
        document.dispatchEvent(
          new CustomEvent('cart:update', {
            bubbles: true,
            detail: { resource: item, data: {} },
          })
        );

        this._hideError();
      } catch (err) {
        this._showError(err.message);
      } finally {
        this._setLoading(false);
      }
    }

    /* El Midori + una línea por cada cuero / dije / grabado extra elegido.
       Cada uno es una variante de su producto de stock, así Shopify descuenta el inventario. */
    _cartItems() {
      const fd = new FormData(this.form);
      const qty = Math.max(1, parseInt(fd.get('quantity'), 10) || 1);
      const properties = {};
      for (const [k, v] of fd.entries()) {
        const m = k.match(/^properties\[(.+)\]$/);
        if (m && String(v).trim() !== '') properties[m[1]] = v;
      }
      const ref = `Midori #${Date.now().toString(36).slice(-5).toUpperCase()}`;   // une el Midori con sus partes en el pedido
      properties['_Pedido'] = ref;
      const items = [{ id: Number(fd.get('id')), quantity: qty, properties }];
      const partes = [...this.form.querySelectorAll('.jc-chip.is-active[data-variant-id]')];
      partes.forEach((chip) => {
        items.push({ id: Number(chip.dataset.variantId), quantity: qty, properties: { 'Para': ref } });
      });
      const ge = this.form.querySelector('[data-grabado-extra-input]');
      const geVar = this.form.querySelector('[data-grabado-extra-variant]');
      if (ge && geVar && ge.value.trim() !== '') {
        items.push({ id: Number(geVar.value), quantity: qty, properties: { 'Para': ref, 'Texto': ge.value.trim() } });
      }
      return items;
    }

    _setLoading(on) {
      if (!this.submitBtn) return;
      this.submitBtn.disabled = on;
      const label   = this.submitBtn.querySelector('.jc-submit-label');
      const spinner = this.submitBtn.querySelector('.jc-submit-spinner');
      if (label)   label.hidden   = on;
      if (spinner) spinner.hidden = !on;
    }

    _showError(msg) {
      if (!this.errorEl) return;
      this.errorEl.textContent = msg;
      this.errorEl.hidden      = false;
    }

    _hideError() {
      if (!this.errorEl) return;
      this.errorEl.hidden = true;
    }
  }

  function initInfoTabs(root) {
    const tabs = [...root.querySelectorAll('.jc-info-tab')];
    if (!tabs.length) return;

    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const active = t === tab;
        t.setAttribute('aria-selected', active ? 'true' : 'false');
        t.tabIndex = active ? 0 : -1;
        const panel = root.querySelector('#' + CSS.escape(t.getAttribute('aria-controls')));
        if (panel) panel.hidden = !active;
      });
      if (focus) tab.focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const step = e.key === 'ArrowRight' ? 1 : -1;
        select(tabs[(i + step + tabs.length) % tabs.length], true);
      });
    });

    select(tabs[0]);
  }

  function init() {
    document.querySelectorAll('.journal-configurator-section').forEach((root) => {
      new JournalConfigurator(root);
      initInfoTabs(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
