(function () {
  'use strict';

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
        grabadoInput.addEventListener('input', (e) => {
          const val = e.target.value;
          if (this.grabadoTextEl) this.grabadoTextEl.textContent = val;
          if (charCounter) charCounter.textContent = `${val.length}/30`;
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
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
          body:    new FormData(this.form),
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

  function init() {
    document.querySelectorAll('.journal-configurator-section').forEach((root) => {
      new JournalConfigurator(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
