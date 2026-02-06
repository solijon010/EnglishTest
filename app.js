const state = {
  mode: 'learn',
  testSet: [],
  index: 0,
  answered: 0,
  correct: 0,
  timerId: null,
  startTime: null,
  limitSeconds: 0,
  timeElapsed: 0
};

const els = {
  modeButtons: document.querySelectorAll('.mode-btn'),
  learnView: document.getElementById('learnView'),
  testView: document.getElementById('testView'),
  learnList: document.getElementById('learnList'),
  learnSearch: document.getElementById('learnSearch'),
  testCard: document.getElementById('testCard'),
  historyList: document.getElementById('historyList'),
  count: document.getElementById('count'),
  timer: document.getElementById('timer'),
  shuffle: document.getElementById('shuffle'),
  start: document.getElementById('start'),
  reset: document.getElementById('reset'),
  next: document.getElementById('next'),
  finish: document.getElementById('finish'),
  statTotal: document.getElementById('stat-total'),
  statAnswered: document.getElementById('stat-answered'),
  statCorrect: document.getElementById('stat-correct'),
  statTime: document.getElementById('stat-time')
};

function shuffleArray(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateStats() {
  els.statTotal.textContent = state.testSet.length || QUESTIONS.length;
  els.statAnswered.textContent = state.answered;
  els.statCorrect.textContent = state.correct;
  els.statTime.textContent = formatTime(state.timeElapsed);
}

function setMode(mode) {
  state.mode = mode;
  els.modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
  els.learnView.classList.toggle('hidden', mode !== 'learn');
  els.testView.classList.toggle('hidden', mode !== 'test');
}

function buildLearnList() {
  const countVal = els.count.value === 'all' ? QUESTIONS.length : Number(els.count.value);
  const list = QUESTIONS.slice(0, countVal);
  const query = (els.learnSearch?.value || '').trim().toLowerCase();
  els.learnList.innerHTML = '';
  list
    .filter(item => !query || item.q.toLowerCase().includes(query))
    .forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.innerHTML = `
      <h3>${idx + 1}. ${item.q}</h3>
      ${item.options.map((opt, i) => `
        <div class="option ${i === item.answerIndex ? 'correct' : ''}">${String.fromCharCode(65 + i)}) ${opt}</div>
      `).join('')}
    `;
    els.learnList.appendChild(card);
  });
}

function buildTestSet() {
  const countVal = els.count.value === 'all' ? QUESTIONS.length : Number(els.count.value);
  const shouldShuffle = els.shuffle.value === 'on';
  const base = shouldShuffle ? shuffleArray(QUESTIONS) : QUESTIONS.slice();
  state.testSet = base.slice(0, countVal).map(q => {
    const opts = q.options.map((opt, idx) => ({ opt, idx }));
    const shuffled = shouldShuffle ? shuffleArray(opts) : opts;
    const answerIndex = shuffled.findIndex(o => o.idx === q.answerIndex);
    return {
      q: q.q,
      options: shuffled.map(o => o.opt),
      answerIndex
    };
  });
  state.index = 0;
  state.answered = 0;
  state.correct = 0;
  els.historyList.innerHTML = '';
  updateStats();
}

function renderTestCard() {
  const current = state.testSet[state.index];
  if (!current) {
    els.testCard.innerHTML = "<p>Test tugadi. Natijani pastda ko'ring.</p>";
    els.next.disabled = true;
    els.finish.disabled = true;
    return;
  }
  els.testCard.innerHTML = `
    <h3>${state.index + 1}. ${current.q}</h3>
    <div class="answer-grid">
      ${current.options.map((opt, i) => `
        <button class="answer-btn" data-index="${i}">${String.fromCharCode(65 + i)}) ${opt}</button>
      `).join('')}
    </div>
  `;

  els.next.disabled = true;
  els.finish.disabled = false;

  els.testCard.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(btn, current));
  });
}

function handleAnswer(btn, current) {
  const selected = Number(btn.dataset.index);
  const buttons = [...els.testCard.querySelectorAll('.answer-btn')];
  buttons.forEach(b => b.disabled = true);

  const correct = current.answerIndex;
  if (selected === correct) {
    state.correct += 1;
    burstConfetti();
  }
  state.answered += 1;

  buttons.forEach((b, i) => {
    if (i === correct) b.classList.add('correct');
    if (i === selected && selected !== correct) b.classList.add('wrong');
  });

  addHistoryCard(current, selected);
  updateStats();

  els.next.disabled = false;
  if (state.index >= state.testSet.length - 1) {
    els.next.disabled = true;
  }
}

function burstConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti';
  const colors = ['#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa'];

  for (let i = 0; i < 24; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const x = Math.random() * window.innerWidth;
    const y = 120;
    const dx = (Math.random() - 0.5) * 180;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--x', `${x}px`);
    piece.style.setProperty('--y', `${y}px`);
    piece.style.setProperty('--dx', `${dx}px`);
    container.appendChild(piece);
  }

  document.body.appendChild(container);
  setTimeout(() => {
    container.remove();
  }, 1000);
}

function addHistoryCard(question, selected) {
  const card = document.createElement('div');
  const isCorrect = selected === question.answerIndex;
  card.className = `history-card ${isCorrect ? 'correct' : 'wrong'}`;
  card.innerHTML = `
    <strong>${question.q}</strong>
    <p>Tanlov: ${String.fromCharCode(65 + selected)}) ${question.options[selected]}</p>
    <p>To'g'ri: ${String.fromCharCode(65 + question.answerIndex)}) ${question.options[question.answerIndex]}</p>
  `;
  els.historyList.prepend(card);
}

function startTimer() {
  stopTimer();
  state.startTime = Date.now();
  const limit = Number(els.timer.value || 0);
  state.limitSeconds = limit > 0 ? limit * 60 : 0;
  state.timeElapsed = 0;
  updateStats();

  state.timerId = setInterval(() => {
    const now = Date.now();
    state.timeElapsed = Math.floor((now - state.startTime) / 1000);
    if (state.limitSeconds > 0) {
      const remaining = Math.max(state.limitSeconds - state.timeElapsed, 0);
      els.statTime.textContent = formatTime(remaining);
      if (remaining === 0) {
        stopTimer();
        finishTest();
      }
    } else {
      els.statTime.textContent = formatTime(state.timeElapsed);
    }
  }, 500);
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function finishTest() {
  els.testCard.innerHTML = `<p>Test yakunlandi. Topilgan: ${state.correct} / ${state.testSet.length}</p>`;
  els.next.disabled = true;
  els.finish.disabled = true;
}

els.modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    setMode(btn.dataset.mode);
    if (state.mode === 'learn') {
      buildLearnList();
    }
  });
});

if (els.learnSearch) {
  els.learnSearch.addEventListener('input', () => {
    buildLearnList();
  });
}

els.start.addEventListener('click', () => {
  if (state.mode === 'learn') {
    buildLearnList();
    return;
  }
  buildTestSet();
  renderTestCard();
  startTimer();
});

els.reset.addEventListener('click', () => {
  stopTimer();
  state.testSet = [];
  state.index = 0;
  state.answered = 0;
  state.correct = 0;
  state.timeElapsed = 0;
  els.historyList.innerHTML = '';
  els.testCard.innerHTML = '';
  updateStats();
});

els.next.addEventListener('click', () => {
  if (state.index < state.testSet.length - 1) {
    state.index += 1;
    renderTestCard();
  }
});

els.finish.addEventListener('click', () => {
  finishTest();
  stopTimer();
});

// Init
setMode('learn');
buildLearnList();
updateStats();
