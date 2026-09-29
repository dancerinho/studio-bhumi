(() => {
  const form = document.querySelector('[data-path-quiz]');
  if (!form) return;

  const steps = [...form.querySelectorAll('[data-path-step]')];
  const result = document.querySelector('[data-path-result]');
  const nextButton = form.querySelector('[data-path-next]');
  const backButton = form.querySelector('[data-path-back]');
  const stepLabel = form.querySelector('[data-path-step-label]');
  const progress = form.querySelector('[data-path-progress]');
  const error = form.querySelector('[data-path-error]');
  let currentStep = 0;

  const recommendations = {
    control: {
      practices: ['Pilates', 'Gyrotonic®'],
      description: 'Una combinazione da esplorare per lavorare su precisione, sostegno e continuità del movimento.'
    },
    mobility: {
      practices: ['Gyrotonic®', 'Hatha Yoga'],
      description: 'Due pratiche che possono affiancare sequenze circolari e lavoro su mobilità, postura e respiro.'
    },
    breath: {
      practices: ['Hatha Yoga', 'Body-Mind Centering®'],
      description: 'Un percorso che mette in dialogo asana, respirazione e ascolto esperienziale del corpo.'
    },
    dynamic: {
      practices: ['Dainami®', 'Pilates'],
      description: 'Una proposta che unisce movimento dinamico e un lavoro di precisione e sostegno.'
    }
  };

  const answerFor = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value;
  const selectedOption = (step) => step.querySelector('input:checked');

  function paintSelectedOptions() {
    steps.forEach((step) => {
      step.querySelectorAll('label').forEach((label) => {
        label.classList.toggle('is-selected', Boolean(label.querySelector('input:checked')));
      });
    });
  }

  function showStep(index) {
    currentStep = index;
    steps.forEach((step, stepIndex) => { step.hidden = stepIndex !== currentStep; });
    stepLabel.textContent = `Domanda ${currentStep + 1} di ${steps.length}`;
    progress.setAttribute('aria-valuenow', String(currentStep + 1));
    progress.querySelector('i').style.width = `${((currentStep + 1) / steps.length) * 100}%`;
    backButton.hidden = currentStep === 0;
    nextButton.innerHTML = currentStep === steps.length - 1
      ? 'Mostra il suggerimento <b aria-hidden="true">→︎</b>'
      : 'Continua <b aria-hidden="true">→︎</b>';
    error.hidden = true;
  }

  function showResult() {
    const health = answerFor('health');
    form.hidden = true;
    result.hidden = false;

    if (health === 'yes') {
      result.innerHTML = `
        <p class="eyebrow">Prima, un confronto</p>
        <h3>Il tuo percorso<br/><i>va valutato insieme.</i></h3>
        <p>Con un’ernia, una patologia, dolore, un infortunio o un intervento recente, questo questionario non può stabilire quale pratica sia adatta. Chiedi al tuo medico o fisioterapista quali attività puoi intraprendere e con quali indicazioni; poi contatta lo studio per parlarne con un’insegnante.</p>
        <a class="personal-path__result-cta" href="contatti.html">Parla con lo studio <b aria-hidden="true">↗︎</b></a>
        <p class="personal-path__disclaimer">Non inviare dettagli sanitari tramite questo quiz: le risposte non vengono salvate né trasmesse.</p>
        <button type="button" data-path-restart>Ricomincia</button>`;
      return;
    }

    const suggestion = recommendations[answerFor('goal')] || recommendations.control;
    const format = {
      group: 'Piccoli gruppi',
      individual: 'Lezioni individuali',
      unsure: 'Formula da scegliere insieme'
    }[answerFor('format')];
    const experience = answerFor('experience');
    const pace = experience === 'regular'
      ? 'La proposta può essere calibrata per dare continuità alla pratica che già conosci.'
      : 'L’insegnante può accompagnarti a conoscere le pratiche e concordare un ritmo adatto al tuo punto di partenza.';

    result.innerHTML = `
      <p class="eyebrow">Il tuo punto di partenza</p>
      <h3>Un percorso<br/><i>in due pratiche.</i></h3>
      <p>${suggestion.description}</p>
      <div class="personal-path__practice-pair">${suggestion.practices.map((name) => `<span>${name}</span>`).join('')}</div>
      <p class="personal-path__format"><strong>Formato da esplorare:</strong> ${format}.</p>
      <p>${pace}</p>
      <p class="personal-path__disclaimer">È uno spunto iniziale, non un pacchetto già acquistabile. Lo studio confermerà insieme a te disponibilità, combinazione e formula.</p>
      <a class="personal-path__result-cta" href="contatti.html">Definisci il tuo percorso <b aria-hidden="true">↗︎</b></a>
      <a class="personal-path__result-link" href="prezzi.html#prezzi">Consulta le formule e i prezzi <b aria-hidden="true">↗︎</b></a>
      <button type="button" data-path-restart>Ricomincia</button>`;
  }

  form.addEventListener('change', () => {
    paintSelectedOptions();
    error.hidden = true;
  });

  nextButton.addEventListener('click', () => {
    if (!selectedOption(steps[currentStep])) {
      error.hidden = false;
      return;
    }
    if (currentStep === steps.length - 1) {
      showResult();
      return;
    }
    showStep(currentStep + 1);
  });

  backButton.addEventListener('click', () => showStep(Math.max(0, currentStep - 1)));

  result.addEventListener('click', (event) => {
    if (!event.target.closest('[data-path-restart]')) return;
    result.hidden = true;
    form.hidden = false;
    form.reset();
    paintSelectedOptions();
    showStep(0);
  });

  paintSelectedOptions();
  showStep(0);
})();
