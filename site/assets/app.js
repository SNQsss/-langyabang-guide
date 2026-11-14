(() => {
  const key = 'langya-spoilers-v1';
  let enabled = false;
  try { enabled = sessionStorage.getItem(key) === 'on'; } catch {}
  const safeTitle = document.title;
  const live = document.querySelector('[data-mode-status]');
  function apply(next, announce = false) {
    enabled = next;
    document.documentElement.classList.add('js');
    document.documentElement.dataset.spoilers = next ? 'on' : 'off';
    for (const element of document.querySelectorAll('[data-safe-only]')) element.hidden = next;
    for (const element of document.querySelectorAll('[data-spoiler-panel]')) { element.open = next; element.hidden = !next; }
    for (const button of document.querySelectorAll('[data-global-mode]')) {
      button.hidden = false;
      button.setAttribute('aria-pressed', String(next));
      button.querySelector('[data-mode-label]').textContent = next ? '劇透已開啟' : '不劇透模式';
    }
    for (const button of document.querySelectorAll('[data-set-mode]')) {
      button.hidden = false;
      button.setAttribute('aria-pressed', String(button.dataset.setMode === String(next)));
    }
    if (document.body.dataset.page === 'event') document.title = next ? document.body.dataset.spoilerTitle : safeTitle;
    try { sessionStorage.setItem(key, next ? 'on' : 'off'); } catch {}
    if (announce && live) live.textContent = next ? '已開啟劇透內容。' : '已切換為不劇透模式。';
  }
  apply(enabled);
  for (const button of document.querySelectorAll('[data-global-mode]')) button.addEventListener('click', () => apply(!enabled, true));
  for (const button of document.querySelectorAll('[data-set-mode]')) button.addEventListener('click', () => {
    const next = button.dataset.setMode === 'true';
    apply(next, true);
    if (button.closest('[data-safe-only]')) {
      const target = document.querySelector('[data-spoiler-panel]');
      const heading = target && target.querySelector('h1,h2,h3');
      if (heading) { heading.setAttribute('tabindex','-1'); heading.scrollIntoView({block:'start',behavior:'instant'}); heading.focus({preventScroll:true}); }
    }
  });
})();
