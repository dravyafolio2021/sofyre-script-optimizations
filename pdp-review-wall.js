if (!customElements.get('pdp-review-wall')) {
  class PdpReviewWall extends HTMLElement {
    connectedCallback() {
      this.tabs = Array.from(this.querySelectorAll('[role="tab"]'));
      this.panels = Array.from(this.querySelectorAll('[role="tabpanel"]'));

      this.handleTabClick = this.handleTabClick.bind(this);
      this.handleTabKeydown = this.handleTabKeydown.bind(this);
      this.handleReadMore = this.handleReadMore.bind(this);
      this.handleScrollCta = this.handleScrollCta.bind(this);

      this.tabs.forEach((tab) => {
        tab.addEventListener('click', this.handleTabClick);
        tab.addEventListener('keydown', this.handleTabKeydown);
      });

      this.initReadMore();
      this.initScrollCta();
      this.initCarousel();
    }

    activeGrid() {
      const panel = this.panels.find((item) => !item.hidden);
      return (panel || this).querySelector('.pdp-review-wall__grid');
    }

    initCarousel() {
      const prev = this.querySelector('[data-pdp-review-wall-prev]');
      const next = this.querySelector('[data-pdp-review-wall-next]');
      if (!prev || !next) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const scrollByCard = (direction) => {
        const grid = this.activeGrid();
        if (!grid) return;
        const card = grid.querySelector('.pdp-review-wall__card');
        const gap = parseFloat(getComputedStyle(grid).columnGap) || 16;
        const amount = card ? card.getBoundingClientRect().width + gap : grid.clientWidth;
        const max = grid.scrollWidth - grid.clientWidth;
        let left = grid.scrollLeft + direction * amount;
        if (left > max + 2) left = 0;
        if (left < -2) left = max;
        grid.scrollTo({ left, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      };

      prev.addEventListener('click', () => scrollByCard(-1));
      next.addEventListener('click', () => scrollByCard(1));
    }

    disconnectedCallback() {
      this.tabs?.forEach((tab) => {
        tab.removeEventListener('click', this.handleTabClick);
        tab.removeEventListener('keydown', this.handleTabKeydown);
      });
    }

    handleTabClick(event) {
      this.selectTab(event.currentTarget);
    }

    handleTabKeydown(event) {
      const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();

      const currentIndex = this.tabs.indexOf(event.currentTarget);
      let nextIndex = currentIndex;
      if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % this.tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = this.tabs.length - 1;

      const nextTab = this.tabs[nextIndex];
      this.selectTab(nextTab);
      nextTab.focus();
    }

    selectTab(tab) {
      this.tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', selected ? 'true' : 'false');
        item.tabIndex = selected ? 0 : -1;
      });
      this.panels.forEach((panel) => {
        panel.hidden = panel.id !== tab.getAttribute('aria-controls');
        if (!panel.hidden) {
          panel.querySelector('.pdp-review-wall__grid')?.scrollTo({ left: 0 });
        }
      });
    }

    initReadMore() {
      const calculateClamps = () => {
        this.querySelectorAll('[data-pdp-review-wall-read-more]').forEach((button) => {
          const story = button.previousElementSibling;
          if (!story?.matches('[data-pdp-review-wall-story]')) return;

          story.classList.add('pdp-review-wall__story--clamped');
          if (story.scrollHeight <= story.clientHeight) {
            story.classList.remove('pdp-review-wall__story--clamped');
            return;
          }

          button.hidden = false;
          button.addEventListener('click', this.handleReadMore, { passive: false });
        });
      };

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
          if (entries[0].isIntersecting) {
            obs.disconnect();
            calculateClamps();
          }
        }, { rootMargin: '300px' });
        observer.observe(this);
      } else if (window.requestIdleCallback) {
        requestIdleCallback(calculateClamps);
      } else {
        setTimeout(calculateClamps, 1000);
      }
    }

    handleReadMore(event) {
      const button = event.currentTarget;
      const story = button.previousElementSibling;
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      story.classList.toggle('pdp-review-wall__story--clamped', expanded);
    }

    initScrollCta() {
      const cta = this.closest('.pdp-review-wall')?.querySelector('[data-pdp-review-wall-scroll-to-form]');
      if (!cta) return;
      cta.addEventListener('click', this.handleScrollCta);
    }

    handleScrollCta(event) {
      const form =
        document.querySelector('.main-product-section form[data-type="add-to-cart-form"]') ||
        [...document.querySelectorAll('form[data-type="add-to-cart-form"]')].find((candidate) => candidate.offsetParent);
      if (!form) return;
      event.preventDefault();
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }
  }

  customElements.define('pdp-review-wall', PdpReviewWall);
}

if (window.Shopify?.designMode) {
  document.addEventListener('shopify:block:select', (event) => {
    const tab = event.target.closest?.('[role="tab"]');
    const wall = event.target.closest?.('pdp-review-wall');
    if (tab && wall) wall.selectTab(tab);
  });
}
