(() => {
  const film = document.querySelector('[data-home-film]');
  const stage = film?.querySelector('[data-home-stage]');
  const video = film?.querySelector('[data-home-video]');
  const copy = film?.querySelector('[data-story-copy]');
  const footer = film?.querySelector('[data-home-footer]');
  if (!film || !stage || !video || !copy) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let posterOnly = reducedMotion.matches;
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const smooth = (value) => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };
  const thresholds = [0.2, 0.42, 0.64, 0.84];
  const panels = [...film.querySelectorAll('[data-story-panel]')];
  const labels = ['YOGA · PRESENZA', 'HATHA YOGA', 'ASCOLTO · PRESENZA', 'LE PRATICHE BHUMI', 'STUDIO BHUMI · MILANO ISOLA'];
  const videoStart = 0;
  let progress = 0;
  let targetProgress = 0;
  let chapter = -1;
  let updateQueued = false;
  let renderQueued = false;
  let lastRenderAt = 0;
  let seekQueued = false;
  let panelSwapTimer = 0;
  let panelSwapToken = 0;
  let requested = false;
  let mediaFailed = false;
  let desiredTime = 0;
  let courseRedirectTimer = 0;
  const navigationEntry = performance.getEntriesByType?.('navigation')?.[0];
  let courseRedirected = navigationEntry?.type === 'back_forward';

  function travelDistance() {
    return Math.max(1, film.offsetHeight - stage.clientHeight);
  }

  function scheduleCourseRedirect() {
    if (courseRedirectTimer || courseRedirected) return;
    courseRedirectTimer = window.setTimeout(() => {
      courseRedirectTimer = 0;
      if (progress < 0.985 || targetProgress < 0.985) return;
      courseRedirected = true;
      window.location.assign('corsi.html');
    }, 350);
  }

  function ensureLoaded() {
    if (posterOnly || requested || mediaFailed) return;
    requested = true;
    video.preload = 'auto';
    // `preload="metadata"` may have completed before the scroll starts. In
    // that case changing preload alone does not make browsers fetch frames;
    // restart the request once unless a media download is already in flight.
    if (video.readyState < 2 && video.networkState !== 2) video.load();
  }

  function videoTime(amount) {
    if (!Number.isFinite(video.duration) || video.duration <= 0.2) return 0;
    const start = videoStart;
    const end = Math.min(0.18, video.duration * 0.025);
    return start + clamp(amount) * Math.max(0.01, video.duration - start - end);
  }

  function scheduleSeek() {
    if (seekQueued || posterOnly || mediaFailed) return;
    seekQueued = true;
    requestAnimationFrame(() => {
      seekQueued = false;
      if (posterOnly || mediaFailed || video.readyState < 2) return;
      if (video.seeking) return;
      if (Math.abs(video.currentTime - desiredTime) > 0.02) {
        try { video.currentTime = desiredTime; } catch { /* Il fotogramma disponibile resta visibile. */ }
      }
    });
  }

  function setChapter(next) {
    if (next === chapter) return;
    const firstChapter = chapter < 0;
    chapter = next;
    const token = ++panelSwapToken;
    const showChapter = () => {
      stage.dataset.chapter = String(chapter + 1);
      for (const [index, panel] of panels.entries()) {
        const active = index === chapter;
        panel.hidden = !active;
        panel.setAttribute('aria-hidden', active ? 'false' : 'true');
      }
    };

    if (firstChapter) {
      showChapter();
      return;
    }

    copy.classList.add('is-changing');
    window.clearTimeout(panelSwapTimer);
    panelSwapTimer = window.setTimeout(() => {
      if (token !== panelSwapToken) return;
      showChapter();
      requestAnimationFrame(() => {
        if (token === panelSwapToken) copy.classList.remove('is-changing');
      });
    }, reducedMotion.matches ? 0 : 190);
  }

  function currentChapter(value) {
    let next = 0;
    while (next < thresholds.length && value >= thresholds[next]) next += 1;
    return next;
  }

  function update() {
    updateQueued = false;
    const rect = film.getBoundingClientRect();
    targetProgress = clamp(-rect.top / travelDistance());
    if (!renderQueued) {
      renderQueued = true;
      requestAnimationFrame(render);
    }
  }

  function render(now) {
    renderQueued = false;
    const elapsed = lastRenderAt ? Math.min(50, now - lastRenderAt) : 16;
    lastRenderAt = now;
    const remaining = targetProgress - progress;
    const easing = 1 - Math.exp(-elapsed / 75);
    progress = Math.abs(remaining) < 0.00035 ? targetProgress : progress + remaining * easing;
    desiredTime = videoTime(progress);
    if (window.matchMedia('(min-width: 651px)').matches) {
      const focusY = progress < 0.45
        ? 82 - smooth(progress / 0.45) * 43
        : 39 + smooth((progress - 0.45) / 0.55) * 43;
      video.style.setProperty('--video-focus', focusY.toFixed(1) + '%');
    }
    const focusX = smooth(progress / 0.24) * 50;
    video.style.setProperty('--video-focus-x', focusX.toFixed(1) + '%');

    if (progress > 0.01) ensureLoaded();
    if (!posterOnly) {
      video.pause();
      scheduleSeek();
    }

    stage.classList.toggle('is-poster', posterOnly || mediaFailed);
    document.body.classList.toggle('journey-scrolling', progress > 0.008);

    setChapter(currentChapter(progress));
    const indicator = film.querySelector('[data-story-progress]');
    if (indicator) {
      indicator.style.setProperty('--story-progress', String((progress * 100).toFixed(2)) + '%');
      indicator.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    }
    const cue = film.querySelector('[data-story-cue]');
    if (cue) cue.innerHTML = progress > 0.975 ? 'FINE DEL RACCONTO <b aria-hidden="true">↗</b>' : 'CONTINUA A SCORRERE <b aria-hidden="true">↓</b>';
    const label = film.querySelector('[data-story-label]');
    if (label) label.textContent = labels[chapter] || labels[0];

    if (progress >= 0.985 && targetProgress >= 0.985) {
      scheduleCourseRedirect();
    } else if (courseRedirectTimer) {
      window.clearTimeout(courseRedirectTimer);
      courseRedirectTimer = 0;
    }

    if (footer) {
      const showFooter = progress > 0.91;
      footer.hidden = false;
      footer.classList.toggle('is-visible', showFooter);
      footer.setAttribute('aria-hidden', showFooter ? 'false' : 'true');
      footer.inert = !showFooter;
    }

    if (Math.abs(targetProgress - progress) >= 0.00035 && !renderQueued) {
      renderQueued = true;
      requestAnimationFrame(render);
    }
  }

  function onScroll() {
    if (updateQueued) return;
    updateQueued = true;
    requestAnimationFrame(update);
  }

  video.muted = true;
  video.playsInline = true;
  video.addEventListener('loadedmetadata', scheduleSeek);
  video.addEventListener('loadeddata', () => {
    stage.classList.add('is-ready');
    onScroll();
  });
  video.addEventListener('seeked', scheduleSeek);
  video.addEventListener('error', () => {
    mediaFailed = true;
    stage.classList.remove('is-ready');
    stage.classList.add('is-poster');
  });

  if (posterOnly) {
    video.preload = 'none';
    stage.classList.add('is-poster');
  } else if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        ensureLoaded();
        observer.disconnect();
      }
    }, { rootMargin: '120px 0px' });
    observer.observe(film);
  } else {
    ensureLoaded();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  reducedMotion.addEventListener?.('change', (event) => {
    posterOnly = event.matches;
    if (posterOnly) {
      video.pause();
      stage.classList.add('is-poster');
    } else {
      stage.classList.remove('is-poster');
      ensureLoaded();
    }
    onScroll();
  });
  if ('ResizeObserver' in window) new ResizeObserver(onScroll).observe(stage);
  update();
})();
