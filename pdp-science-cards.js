(() => {
  const findBuyBoxForm = () =>
    document.querySelector('.main-product-section form[data-type="add-to-cart-form"]') ||
    [...document.querySelectorAll('form[data-type="add-to-cart-form"]')].find((form) => form.offsetParent);

  document.addEventListener('click', (event) => {
    const cta = event.target.closest('[data-pdp-scroll-to-form]');
    if (!cta) return;
    const form = findBuyBoxForm();
    if (!form) return;
    event.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });
})();
