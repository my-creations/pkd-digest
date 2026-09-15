'use strict';

/**
 * Dual framing toggle (progressive enhancement).
 * Each [data-dual] block switches between its plain-language and clinical
 * panels. Without JS both panels stay visible.
 */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-dual]').forEach((root) => {
    const buttons = Array.from(root.querySelectorAll('[data-dual-view]'));
    const panels = Array.from(root.querySelectorAll('[data-dual-panel]'));
    if (buttons.length === 0 || panels.length === 0) return;
    root.classList.add('is-dual');

    function show(view) {
      buttons.forEach((button) => {
        const active = button.dataset.dualView === view;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.dualPanel !== view;
      });
    }

    root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-dual-view]');
      if (button) show(button.dataset.dualView);
    });
  });
});
