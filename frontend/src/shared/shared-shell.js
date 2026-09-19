// Shared progressive enhancement for native disclosure menus in React, Vue and Jinja.
// Delegated listeners also cover menus mounted after a client-side route change.
(() => {
  const menus = () => [...document.querySelectorAll('details[data-popover][open]')];
  const close = (menu, returnFocus = false) => {
    menu.open = false;
    menu.querySelector('summary')?.setAttribute('aria-expanded', 'false');
    if (returnFocus) menu.querySelector('summary')?.focus();
  };
  window.matchMedia('(max-width: 959px)').addEventListener('change', () => menus().forEach(menu => close(menu)));
  document.addEventListener('toggle', event => {
    const menu = event.target;
    if (!(menu instanceof HTMLDetailsElement) || !menu.hasAttribute('data-popover')) return;
    menu.querySelector('summary')?.setAttribute('aria-expanded', String(menu.open));
    if (menu.open) menus().filter(other => other !== menu).forEach(other => close(other));
  }, true);
  document.addEventListener('pointerdown', event => {
    menus().filter(menu => !menu.contains(event.target)).forEach(menu => close(menu));
  });
  document.addEventListener('click', event => {
    if (event.target.closest('details[data-popover] a')) menus().forEach(menu => close(menu));
  });
  document.addEventListener('focusin', event => {
    menus().filter(menu => !menu.contains(event.target)).forEach(menu => close(menu));
  });
  // Close the inner disclosure first; a second Escape can close its mobile drawer.
  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !menus().length) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    menus().forEach(menu => close(menu, true));
  }, true);
})();
