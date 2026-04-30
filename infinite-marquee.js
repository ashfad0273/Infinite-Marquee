/*!
 * InfiniteMarquee v2.0.0
 * Smooth, accessible, zero-dependency infinite marquee
 * Features: pause/play, hover pause, drag scroll, vertical, fade edges,
 *           reduced-motion, declarative API, auto-init
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? module.exports = factory()
    : typeof define === 'function' && define.amd
      ? define(factory)
      : (global.InfiniteMarquee = factory());
}(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  let _uid = 0;

  class InfiniteMarquee {
    /**
     * @param {HTMLElement} el
     * @param {Object} [o]
     * @param {number}  [o.speed=50]           px/s
     * @param {'left'|'right'|'up'|'down'} [o.direction='left']
     * @param {number}  [o.gap=40]             gap between items (px)
     * @param {boolean} [o.pauseOnHover=true]
     * @param {boolean} [o.reverseOnHover=false]
     * @param {boolean} [o.drag=true]          drag-to-scroll
     * @param {boolean} [o.fade=false]         fade edges with mask
     * @param {number}  [o.fadeSize=80]        fade gradient size (px)
     */
    constructor(el, o = {}) {
      if (!el) return;
      this.ct = el;
      this.speed         = o.speed         ?? 50;
      this.dir           = o.direction     ?? 'left';
      this.gap           = o.gap           ?? 40;
      this.pauseOnHover  = o.pauseOnHover  !== false;
      this.reverseOnHover= o.reverseOnHover ?? false;
      this.drag          = o.drag          !== false;
      this.fade          = o.fade          ?? false;
      this.fadeSize      = o.fadeSize      ?? 80;
      this.slowOnHover   = o.slowOnHover   ?? false;
      this.slowSpeed     = o.slowSpeed     ?? 15;

      this._id       = 'imq' + _uid++;
      this._track    = null;
      this._items    = [];
      this._style    = null;
      this._ro       = null;
      this._paused   = false;
      this._hovered  = false;
      this._period   = 0;
      this._vertical = this.dir === 'up' || this.dir === 'down';

      // drag state
      this._drag = { active: false, startX: 0, startY: 0, offsetPx: 0, lastV: 0, rafId: null };

      // reduced-motion
      this._mq = window.matchMedia('(prefers-reduced-motion: reduce)');

      this._build();
    }

    /* ─── BUILD ─────────────────────────────────────────────── */
    _build() {
      const ct = this.ct;
      ct.classList.add('imq');
      ct.style.overflow = 'hidden';
      ct.style.opacity  = '0';
      ct.style.position = ct.style.position || 'relative';

      this._track = document.createElement('div');
      this._track.className = 'imq-track';
      this._track.style.cssText = this._vertical
        ? 'display:flex;flex-direction:column;'
        : 'display:flex;flex-direction:row;align-items:center;white-space:nowrap;';

      this._items = Array.from(ct.children);
      this._items.forEach(ch => {
        ch.classList.add('imq-item');
        this._track.appendChild(ch);
      });
      ct.appendChild(this._track);

      if (this.fade) this._applyFade();
      this._bindEvents();

      requestAnimationFrame(() => {
        this._calc();
        ct.style.opacity = '1';
      });

      this._ro = new ResizeObserver(() => this._calc());
      this._ro.observe(ct);

      // reduced-motion listener
      this._onMqChange = () => this._applyPlayState();
      this._mq.addEventListener('change', this._onMqChange);

      // pause when tab hidden
      this._onVisibility = () => {
        if (document.hidden) this._setWillChange(false);
        else if (!this._paused) this._setWillChange(true);
        this._applyPlayState();
      };
      document.addEventListener('visibilitychange', this._onVisibility);
    }

    /* ─── CALC ──────────────────────────────────────────────── */
    _calc() {
      const t = this._track;
      const N = this._items.length;
      if (!N) return;

      // clean clones
      t.querySelectorAll('[data-imq-clone]').forEach(n => n.remove());

      // batch reads first
      if (this._vertical) {
        t.style.gap = this.gap + 'px';
      } else {
        t.style.gap = this.gap + 'px';
      }

      // measure after gap is set
      let size = 0;
      this._items.forEach(i => {
        const r = i.getBoundingClientRect();
        size += this._vertical ? r.height : r.width;
      });

      const period  = size + N * this.gap;
      const viewSize = this._vertical ? this.ct.offsetHeight : this.ct.offsetWidth;
      const sets    = Math.max(2, Math.ceil((viewSize + period) / period) + 1);
      this._period  = period;

      const frag = document.createDocumentFragment();
      for (let s = 1; s < sets; s++) {
        this._items.forEach(orig => {
          const cl = orig.cloneNode(true);
          cl.setAttribute('data-imq-clone', '');
          cl.setAttribute('aria-hidden', 'true');
          frag.appendChild(cl);
        });
      }
      t.appendChild(frag);

      // inject keyframes
      if (this._style) this._style.remove();
      this._style = document.createElement('style');

      const dur   = period / this.speed;
      const durSlow = period / (this.speed * 0.15); // reduced-motion: very slow

      if (this._vertical) {
        const fromY = this.dir === 'down' ? -period : 0;
        const toY   = this.dir === 'down' ? 0       : -period;
        this._style.textContent =
          `@keyframes ${this._id}{from{transform:translate3d(0,${fromY}px,0)}to{transform:translate3d(0,${toY}px,0)}}` +
          `@keyframes ${this._id}_r{from{transform:translate3d(0,${toY}px,0)}to{transform:translate3d(0,${fromY}px,0)}}` +
          `@media(prefers-reduced-motion:reduce){.${this._id}-track{animation-duration:${durSlow}s!important}}`;
      } else {
        const fromX = this.dir === 'right' ? -period : 0;
        const toX   = this.dir === 'right' ? 0       : -period;
        this._style.textContent =
          `@keyframes ${this._id}{from{transform:translate3d(${fromX}px,0,0)}to{transform:translate3d(${toX}px,0,0)}}` +
          `@keyframes ${this._id}_r{from{transform:translate3d(${toX}px,0,0)}to{transform:translate3d(${fromX}px,0,0)}}` +
          `@media(prefers-reduced-motion:reduce){.${this._id}-track{animation-duration:${durSlow}s!important}}`;
      }
      document.head.appendChild(this._style);

      t.className = `imq-track ${this._id}-track`;
      this._applyAnimation(false);
      this._setWillChange(true);
    }

    _applyAnimation(reversed) {
      const t     = this._track;
      const name  = reversed ? `${this._id}_r` : this._id;
      const dur   = this._period / this.speed;
      t.style.animation = `${name} ${dur}s linear infinite`;
      this._applyPlayState();
    }

    _applyPlayState() {
      const shouldPause = this._paused || document.hidden;
      this._track.style.animationPlayState = shouldPause ? 'paused' : 'running';
    }

    _setWillChange(on) {
      this._track.style.willChange = on ? 'transform' : 'auto';
    }

    /* ─── FADE EDGES ────────────────────────────────────────── */
    _applyFade() {
      const s = this.fadeSize;
      const mask = this._vertical
        ? `linear-gradient(to bottom, transparent 0px, #000 ${s}px, #000 calc(100% - ${s}px), transparent 100%)`
        : `linear-gradient(to right,  transparent 0px, #000 ${s}px, #000 calc(100% - ${s}px), transparent 100%)`;
      this.ct.style.webkitMaskImage = mask;
      this.ct.style.maskImage       = mask;
    }

    /* ─── EVENTS ────────────────────────────────────────────── */
    _bindEvents() {
      const ct = this.ct;

      if (this.pauseOnHover || this.reverseOnHover || this.slowOnHover) {
  ct.addEventListener('mouseenter', () => {
    this._hovered = true;
    if (this.pauseOnHover) { this._paused = true; this._applyPlayState(); this._setWillChange(false); }
    if (this.reverseOnHover) this._applyAnimation(true);
    if (this.slowOnHover) {
      this._track.style.animationDuration = (this._period / this.slowSpeed) + 's';
    }
  });
  ct.addEventListener('mouseleave', () => {
    this._hovered = false;
    if (this.pauseOnHover) { this._paused = false; this._applyPlayState(); this._setWillChange(true); }
    if (this.reverseOnHover) this._applyAnimation(false);
    if (this.slowOnHover) {
      this._track.style.animationDuration = (this._period / this.speed) + 's';
    }
  });
}

      if (this.drag) this._bindDrag();
    }

    /* ─── DRAG ──────────────────────────────────────────────── */
    _bindDrag() {
      const ct = this.ct;
      const d  = this._drag;

      const onStart = (clientX, clientY) => {
        cancelAnimationFrame(d.rafId);
        d.active  = true;
        d.startX  = clientX;
        d.startY  = clientY;
        d.lastV   = 0;
        d.offsetPx = 0;
        this._track.style.animationPlayState = 'paused';
        this._setWillChange(true);
        ct.style.cursor = 'grabbing';
      };

      const onMove = (clientX, clientY) => {
        if (!d.active) return;
        const delta = this._vertical ? clientY - d.startY : clientX - d.startX;
        d.lastV     = delta - d.offsetPx;
        d.offsetPx  = delta;
        // shift current animation offset via margin trick
        const cur = parseFloat(this._track.style.marginLeft || 0);
        if (this._vertical) {
          this._track.style.marginTop = (parseFloat(this._track.style.marginTop || 0) + d.lastV) + 'px';
        } else {
          this._track.style.marginLeft = (cur + d.lastV) + 'px';
        }
      };

      const onEnd = () => {
        if (!d.active) return;
        d.active = false;
        ct.style.cursor = '';
        // snap back with inertia
        let v = d.lastV;
        const prop = this._vertical ? 'marginTop' : 'marginLeft';
        const decay = () => {
          v *= 0.92;
          const cur = parseFloat(this._track.style[prop] || 0);
          this._track.style[prop] = (cur + v) + 'px';
          // gradually zero out margin back to 0
          const margin = parseFloat(this._track.style[prop]);
          this._track.style[prop] = (margin * 0.88) + 'px';
          if (Math.abs(v) > 0.3 || Math.abs(parseFloat(this._track.style[prop])) > 0.3) {
            d.rafId = requestAnimationFrame(decay);
          } else {
            this._track.style[prop] = '0px';
            if (!this._paused) {
              this._track.style.animationPlayState = 'running';
              this._setWillChange(true);
            }
          }
        };
        d.rafId = requestAnimationFrame(decay);
      };

      // mouse
      ct.addEventListener('mousedown', e => { e.preventDefault(); onStart(e.clientX, e.clientY); });
      window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
      window.addEventListener('mouseup',   () => onEnd());

      // touch
      ct.addEventListener('touchstart', e => { const t = e.touches[0]; onStart(t.clientX, t.clientY); }, { passive: true });
      ct.addEventListener('touchmove',  e => { const t = e.touches[0]; onMove(t.clientX, t.clientY); },  { passive: true });
      ct.addEventListener('touchend',   () => onEnd());

      ct.style.cursor = 'grab';
    }

    /* ─── PUBLIC API ────────────────────────────────────────── */

    /** Pause the animation */
    pause() {
      this._paused = true;
      this._applyPlayState();
      this._setWillChange(false);
    }

    /** Resume the animation */
    play() {
      this._paused = false;
      this._applyPlayState();
      this._setWillChange(true);
    }

    /** Toggle pause/play */
    toggle() {
      this._paused ? this.play() : this.pause();
    }

    /**
     * Update options on the fly
     * @param {Object} opts  same keys as constructor options
     */
    update(opts = {}) {
      if (opts.speed     !== undefined) this.speed          = opts.speed;
      if (opts.direction !== undefined) { this.dir          = opts.direction; this._vertical = this.dir === 'up' || this.dir === 'down'; }
      if (opts.gap       !== undefined) this.gap            = opts.gap;
      if (opts.fade      !== undefined) { this.fade         = opts.fade;      this._applyFade(); }
      if (opts.fadeSize  !== undefined) { this.fadeSize      = opts.fadeSize; if (this.fade) this._applyFade(); }
      this._calc();
    }

    /** Fully remove the marquee and restore original DOM */
    destroy() {
      this._ro?.disconnect();
      this._mq.removeEventListener('change', this._onMqChange);
      document.removeEventListener('visibilitychange', this._onVisibility);
      if (this._style) this._style.remove();
      cancelAnimationFrame(this._drag.rafId);

      // restore original items
      this._items.forEach(ch => {
        ch.classList.remove('imq-item');
        this.ct.appendChild(ch);
      });
      this._track.remove();
      this.ct.classList.remove('imq');
      this.ct.style.cssText = '';
    }
  }

  /* ─── DECLARATIVE / AUTO-INIT ─────────────────────────────── */

  /**
   * Auto-initialize all [data-marquee] elements.
   * Reads config from data-marquee-* attributes:
   *   data-marquee-speed="80"
   *   data-marquee-direction="right"
   *   data-marquee-gap="30"
   *   data-marquee-pause-on-hover="false"
   *   data-marquee-reverse-on-hover="true"
   *   data-marquee-drag="false"
   *   data-marquee-fade="true"
   *   data-marquee-fade-size="60"
   */
  function autoInit() {
    document.querySelectorAll('[data-marquee]').forEach(el => {
      if (el._imq) return; // already initialized
      const d = el.dataset;
      const toBool = v => v === undefined ? undefined : v !== 'false';
      el._imq = new InfiniteMarquee(el, {
        speed:           d.marqueeSpeed      !== undefined ? +d.marqueeSpeed       : undefined,
        direction:       d.marqueeDirection,
        gap:             d.marqueeGap        !== undefined ? +d.marqueeGap         : undefined,
        pauseOnHover:    toBool(d.marqueePauseOnHover),
        reverseOnHover:  toBool(d.marqueeReverseOnHover),
        drag:            toBool(d.marqueeDrag),
        fade:            toBool(d.marqueeFade),
        fadeSize:        d.marqueeFadeSize   !== undefined ? +d.marqueeFadeSize    : undefined,
        slowOnHover:     toBool(d.marqueeSlowOnHover),
        slowSpeed:       d.marqueeSlowSpeed  !== undefined ? +d.marqueeSlowSpeed   : undefined,
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  InfiniteMarquee.autoInit = autoInit;

  return InfiniteMarquee;
}));