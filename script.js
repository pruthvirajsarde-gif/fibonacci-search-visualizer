/**
 * ============================================================================
 * FIBONACCI SEARCH VISUALIZER - JAVASCRIPT CONTROLLER
 * Designed for Data Structures & Algorithms (DSA) Students
 * ============================================================================
 */

// --- Global Application State ---
const AppState = {
  array: [10, 22, 35, 47, 51, 63, 72, 85, 91],
  target: 63,
  fibSequence: [],
  states: [],               // Precomputed immutable history of search states
  currentStepIndex: 0,      // Pointer to active search state
  isPlaying: false,         // Auto-play interval state
  playIntervalId: null,     // Timer handle
  speedMs: 1200,            // Animation delay in ms
  soundEnabled: true,       // Audio synth state
  theme: 'dark',            // 'dark' | 'light'
};

// Expose on window for student console inspection and testing
window.AppState = AppState;

// Crisp SVG Vector Icons (Replaces all emojis)
const SVG_ICONS = {
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  arrowRight: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
  arrowLeft: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
  check: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  x: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
};

// Web Audio API Context (Lazy-loaded)
let audioCtx = null;

// ============================================================================
// 1. FIBONACCI GENERATION & MATHEMATICAL HELPERS
// ============================================================================

/**
 * Generates Fibonacci numbers up to the smallest Fibonacci number >= n.
 * Returns { sequence: number[], fibM, fib1, fib2, mIndex }
 */
function generateFibonacciNumbers(n) {
  const sequence = [0, 1];
  if (n <= 0) {
    return { sequence, fibM: 0, fib1: 0, fib2: 0, mIndex: 0 };
  }

  let fib2 = 0; // (m-2)'th Fibonacci No.
  let fib1 = 1; // (m-1)'th Fibonacci No.
  let fibM = fib2 + fib1; // m'th Fibonacci No.

  while (fibM < n) {
    fib2 = fib1;
    fib1 = fibM;
    fibM = fib2 + fib1;
    sequence.push(fibM);
  }

  // Ensure full sequence up to fibM is present in sequence array
  const fullSeq = [0, 1];
  while (fullSeq[fullSeq.length - 1] < fibM || fullSeq.length < 3) {
    const nextFib = fullSeq[fullSeq.length - 1] + fullSeq[fullSeq.length - 2];
    fullSeq.push(nextFib);
  }

  const mIndex = fullSeq.indexOf(fibM);

  return {
    sequence: fullSeq,
    fibM,
    fib1,
    fib2,
    mIndex: mIndex !== -1 ? mIndex : fullSeq.length - 1
  };
}

/**
 * Calculates probe index: min(offset + fib2, n - 1)
 */
function calculateProbe(offset, fib2, n) {
  return Math.min(offset + fib2, n - 1);
}

// ============================================================================
// 2. STATE MACHINE GENERATION (STATE-DRIVEN ARCHITECTURE)
// ============================================================================

/**
 * Simulates the complete Fibonacci Search algorithm and pre-computes
 * an array of detailed execution states for deterministic stepping & replay.
 */
function generateSearchStates(arr, target) {
  const states = [];
  const n = arr.length;
  const fibData = generateFibonacciNumbers(n);
  
  let fib2 = fibData.fib2;
  let fib1 = fibData.fib1;
  let fibM = fibData.fibM;
  let offset = -1;
  let comparisons = 0;
  let stepCounter = 0;

  // Track eliminated indices set
  const eliminated = new Set();

  function cloneArrayStates(probeIdx = null, comparingIdx = null, foundIdx = null) {
    const statusMap = [];
    const low = offset + 1;
    const high = Math.min(offset + fibM, n - 1);

    for (let i = 0; i < n; i++) {
      if (foundIdx === i) {
        statusMap.push('state-found');
      } else if (comparingIdx === i) {
        statusMap.push('state-comparing');
      } else if (probeIdx === i) {
        statusMap.push('state-probe');
      } else if (eliminated.has(i)) {
        statusMap.push('state-eliminated');
      } else if (i >= low && i <= high) {
        statusMap.push('state-in-range');
      } else {
        statusMap.push('state-normal');
      }
    }
    return statusMap;
  }

  // --- Step 0: Initial Ready State ---
  states.push({
    stepIndex: 0,
    title: 'Visualizer Initialized',
    description: `Array loaded with ${n} sorted elements. Ready to search for target ${target}.`,
    pseudocodeLine: 1,
    fibM,
    fib1,
    fib2,
    offset,
    low: 0,
    high: n - 1,
    probe: null,
    comparisons: 0,
    arrayStates: cloneArrayStates(),
    eliminated: new Set(eliminated),
    compProbeIdx: null,
    compProbeVal: null,
    compTargetVal: target,
    compOp: 'Ready',
    compHeadline: `Ready to search for ${target}`,
    compDesc: `Click "Start Search" or "Next Step" to begin probe calculation.`,
    isFinished: false,
    foundIndex: -1,
    statusType: 'ready',
    sound: 'step'
  });

  // --- Step 1: Fibonacci Initialization ---
  stepCounter++;
  states.push({
    stepIndex: stepCounter,
    title: 'Fibonacci Variables Initialized',
    description: `Generated smallest Fibonacci number >= array size (${n}). fibM = ${fibM}, fib1 = ${fib1}, fib2 = ${fib2}, offset = -1. Initial search range spans [0 .. ${n - 1}].`,
    pseudocodeLine: 2,
    fibM,
    fib1,
    fib2,
    offset,
    low: 0,
    high: n - 1,
    probe: null,
    comparisons: 0,
    arrayStates: cloneArrayStates(),
    eliminated: new Set(eliminated),
    compProbeIdx: null,
    compProbeVal: null,
    compTargetVal: target,
    compOp: 'Init',
    compHeadline: `Fibonacci numbers initialized: fibM = ${fibM}`,
    compDesc: `Search range encompasses all ${n} array elements. Next step will compute the first probe index.`,
    isFinished: false,
    foundIndex: -1,
    statusType: 'setup',
    sound: 'step'
  });

  let found = false;

  // --- Core Fibonacci Search Loop: while (fibM > 1) ---
  while (fibM > 1 && !found) {
    const i = calculateProbe(offset, fib2, n);
    const low = offset + 1;
    const high = Math.min(offset + fibM, n - 1);

    // Sub-Step A: Probe Calculation & Selection
    stepCounter++;
    states.push({
      stepIndex: stepCounter,
      title: `Calculated Probe Index i = ${i}`,
      description: `Probe index calculated using formula: i = min(offset + fib2, n - 1) = min(${offset} + ${fib2}, ${n - 1}) = ${i}. Element Array[${i}] = ${arr[i]} selected for inspection.`,
      pseudocodeLine: 5,
      fibM,
      fib1,
      fib2,
      offset,
      low,
      high,
      probe: i,
      comparisons,
      arrayStates: cloneArrayStates(i, null, null),
      eliminated: new Set(eliminated),
      compProbeIdx: i,
      compProbeVal: arr[i],
      compTargetVal: target,
      compOp: '?',
      compHeadline: `Probing Array[${i}] = ${arr[i]}`,
      compDesc: `Comparing probed array element ${arr[i]} with target value ${target}...`,
      isFinished: false,
      foundIndex: -1,
      statusType: 'probe',
      sound: 'probe'
    });

    // Sub-Step B: Comparison Execution
    comparisons++;
    stepCounter++;

    if (arr[i] < target) {
      // Element is smaller -> target lies to the right
      const prevOffset = offset;
      // All elements from 0 to i are eliminated
      for (let k = 0; k <= i; k++) {
        eliminated.add(k);
      }

      const nextFibM = fib1;
      const nextFib1 = fib2;
      const nextFib2 = nextFibM - nextFib1;
      const nextOffset = i;

      states.push({
        stepIndex: stepCounter,
        title: `Array[${i}] (${arr[i]}) < Target (${target})`,
        description: `Array[${i}] is smaller than target ${target}. Target must lie to the right in subarray [${i + 1} .. ${high}]. Elements [0 .. ${i}] eliminated. Offset updated to ${i}. Fibonacci ranks shift down 1 level (fibM=${nextFibM}, fib1=${nextFib1}, fib2=${nextFib2}).`,
        pseudocodeLine: 7,
        fibM: nextFibM,
        fib1: nextFib1,
        fib2: nextFib2,
        offset: nextOffset,
        low: nextOffset + 1,
        high: Math.min(nextOffset + nextFibM, n - 1),
        probe: i,
        comparisons,
        arrayStates: cloneArrayStates(null, i, null),
        eliminated: new Set(eliminated),
        compProbeIdx: i,
        compProbeVal: arr[i],
        compTargetVal: target,
        compOp: '<',
        compHeadline: `${arr[i]} < ${target} (Target is Greater)`,
        compDesc: `Target is greater than Array[${i}]. Discard left partition [${prevOffset + 1} .. ${i}]. Move search range to right, update offset to ${i}, and shift Fibonacci numbers down by 1 step.`,
        isFinished: false,
        foundIndex: -1,
        statusType: 'compare',
        sound: 'compare'
      });

      fibM = nextFibM;
      fib1 = nextFib1;
      fib2 = nextFib2;
      offset = nextOffset;

    } else if (arr[i] > target) {
      // Element is greater -> target lies to the left
      // Elements from i to n-1 eliminated
      for (let k = i; k < n; k++) {
        eliminated.add(k);
      }

      const nextFibM = fib2;
      const nextFib1 = fib1 - fib2;
      const nextFib2 = nextFibM - nextFib1;

      states.push({
        stepIndex: stepCounter,
        title: `Array[${i}] (${arr[i]}) > Target (${target})`,
        description: `Array[${i}] is greater than target ${target}. Target must lie to the left in subarray [${offset + 1} .. ${i - 1}]. Elements [${i} .. ${high}] eliminated. Offset remains ${offset}. Fibonacci ranks shift down 2 levels (fibM=${nextFibM}, fib1=${nextFib1}, fib2=${nextFib2}).`,
        pseudocodeLine: 9,
        fibM: nextFibM,
        fib1: nextFib1,
        fib2: nextFib2,
        offset,
        low: offset + 1,
        high: Math.min(offset + nextFibM, n - 1),
        probe: i,
        comparisons,
        arrayStates: cloneArrayStates(null, i, null),
        eliminated: new Set(eliminated),
        compProbeIdx: i,
        compProbeVal: arr[i],
        compTargetVal: target,
        compOp: '>',
        compHeadline: `${arr[i]} > ${target} (Target is Smaller)`,
        compDesc: `Target is smaller than Array[${i}]. Discard right partition [${i} .. ${high}]. Keep offset at ${offset}, and shift Fibonacci numbers down by 2 steps.`,
        isFinished: false,
        foundIndex: -1,
        statusType: 'compare',
        sound: 'compare'
      });

      fibM = nextFibM;
      fib1 = nextFib1;
      fib2 = nextFib2;

    } else {
      // arr[i] === target -> Element found!
      found = true;
      states.push({
        stepIndex: stepCounter,
        title: `Target Found at Index ${i}`,
        description: `Match found! Array[${i}] == ${target}. The search terminates successfully after ${comparisons} comparisons.`,
        pseudocodeLine: 10,
        fibM,
        fib1,
        fib2,
        offset,
        low: offset + 1,
        high: Math.min(offset + fibM, n - 1),
        probe: i,
        comparisons,
        arrayStates: cloneArrayStates(null, null, i),
        eliminated: new Set(eliminated),
        compProbeIdx: i,
        compProbeVal: arr[i],
        compTargetVal: target,
        compOp: '==',
        compHeadline: `${arr[i]} == ${target} (Target Matched)`,
        compDesc: `Success! Target value ${target} matches Array[${i}]. Search complete.`,
        isFinished: true,
        foundIndex: i,
        statusType: 'found',
        sound: 'found'
      });
      break;
    }
  }

  // --- Final Boundary Check: if (fib1 == 1 && offset + 1 < n) ---
  if (!found) {
    if (fib1 === 1 && offset + 1 < n) {
      const boundaryIdx = offset + 1;
      comparisons++;
      stepCounter++;

      if (arr[boundaryIdx] === target) {
        found = true;
        states.push({
          stepIndex: stepCounter,
          title: `Boundary Match Found at Index ${boundaryIdx}`,
          description: `fib1 == 1 boundary check succeeded! Array[${boundaryIdx}] == ${target}. Target successfully found at index ${boundaryIdx}.`,
          pseudocodeLine: 12,
          fibM,
          fib1,
          fib2,
          offset,
          low: boundaryIdx,
          high: boundaryIdx,
          probe: boundaryIdx,
          comparisons,
          arrayStates: cloneArrayStates(null, null, boundaryIdx),
          eliminated: new Set(eliminated),
          compProbeIdx: boundaryIdx,
          compProbeVal: arr[boundaryIdx],
          compTargetVal: target,
          compOp: '==',
          compHeadline: `Boundary check matched: Array[${boundaryIdx}] == ${target}`,
          compDesc: `The remaining single boundary element Array[${boundaryIdx}] matches target ${target}. Search completed.`,
          isFinished: true,
          foundIndex: boundaryIdx,
          statusType: 'found',
          sound: 'found'
        });
      } else {
        // Boundary element didn't match -> Not Found
        eliminated.add(boundaryIdx);
        stepCounter++;
        states.push({
          stepIndex: stepCounter,
          title: `Target Not Found in Array`,
          description: `Boundary check: Array[${boundaryIdx}] (${arr[boundaryIdx]}) != ${target}. Search range exhausted. Target ${target} does not exist in array.`,
          pseudocodeLine: 14,
          fibM,
          fib1,
          fib2,
          offset,
          low: boundaryIdx,
          high: boundaryIdx,
          probe: boundaryIdx,
          comparisons,
          arrayStates: cloneArrayStates(),
          eliminated: new Set(eliminated),
          compProbeIdx: boundaryIdx,
          compProbeVal: arr[boundaryIdx],
          compTargetVal: target,
          compOp: '!=',
          compHeadline: `Element Not Found in Array`,
          compDesc: `Array[${boundaryIdx}] (${arr[boundaryIdx]}) does not equal target ${target}. No elements remain in search range.`,
          isFinished: true,
          foundIndex: -1,
          statusType: 'not-found',
          sound: 'failure'
        });
      }
    } else {
      // Loop exited with no remaining boundary candidates -> Not Found
      stepCounter++;
      states.push({
        stepIndex: stepCounter,
        title: `Target Not Found in Array`,
        description: `Fibonacci numbers reduced below 1 and search range exhausted without finding target ${target}. Total comparisons: ${comparisons}.`,
        pseudocodeLine: 14,
        fibM,
        fib1,
        fib2,
        offset,
        low: Math.max(0, offset + 1),
        high: Math.min(n - 1, offset + fibM),
        probe: null,
        comparisons,
        arrayStates: cloneArrayStates(),
        eliminated: new Set(eliminated),
        compProbeIdx: null,
        compProbeVal: null,
        compTargetVal: target,
        compOp: '!=',
        compHeadline: `Element Not Found`,
        compDesc: `Search interval became empty. Target ${target} is not in the array.`,
        isFinished: true,
        foundIndex: -1,
        statusType: 'not-found',
        sound: 'failure'
      });
    }
  }

  return states;
}

// ============================================================================
// 3. AUDIO SYNTHESIZER (WEB AUDIO API)
// ============================================================================

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  if (!AppState.soundEnabled) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  switch (type) {
    case 'probe': {
      // Warm acoustic probe tone (sine, 480Hz)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
      break;
    }
    case 'compare': {
      // Harmonic comparison ping (triangle, 560Hz -> 420Hz)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.linearRampToValueAtTime(420, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
      break;
    }
    case 'found': {
      // Major triad victory chime: C5 (523Hz), E5 (659Hz), G5 (784Hz)
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
      break;
    }
    case 'failure': {
      // Descending double tone (300Hz -> 200Hz)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.28);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    }
    case 'step':
    default: {
      // Subtle tactile click
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
    }
  }
}

// ============================================================================
// 4. UI RENDERING & COMPONENT SYNCHRONIZATION
// ============================================================================

/**
 * Renders the array boxes into the DOM.
 */
function renderArrayElements() {
  const container = document.getElementById('array-container');
  container.innerHTML = '';

  AppState.array.forEach((val, idx) => {
    const item = document.createElement('div');
    item.className = 'array-item state-normal';
    item.id = `array-item-${idx}`;
    item.dataset.index = idx;
    item.dataset.value = val;
    item.title = `Click to set ${val} as search target`;

    // Click on array element sets it as target!
    item.addEventListener('click', () => {
      document.getElementById('target-input').value = val;
      AppState.target = val;
      initializeSearch(AppState.array, val);
      announceToScreenReader(`Selected ${val} at index ${idx} as search target`);
    });

    item.innerHTML = `
      <div class="array-box">
        <span class="box-role-tag" id="role-tag-${idx}">PROBE</span>
        <span class="box-val">${val}</span>
      </div>
      <span class="box-index">${idx}</span>
    `;

    container.appendChild(item);
  });

  // Update header badge
  document.getElementById('array-stats-badge').textContent = 
    `Length: ${AppState.array.length} • Target: ${AppState.target}`;
}

/**
 * Renders the Fibonacci numbers sequence ribbon tape.
 */
function renderFibonacciSequenceTape() {
  const tape = document.getElementById('fib-sequence-tape');
  tape.innerHTML = '';

  const fibData = generateFibonacciNumbers(AppState.array.length);
  AppState.fibSequence = fibData.sequence;

  AppState.fibSequence.forEach((num, idx) => {
    const pill = document.createElement('div');
    pill.className = 'fib-pill';
    pill.id = `fib-pill-${idx}`;
    pill.dataset.value = num;
    pill.dataset.idx = idx;

    pill.innerHTML = `
      <span class="fib-pill-num">${num}</span>
      <span class="fib-pill-idx">F<sub>${idx}</sub></span>
      <span class="fib-pill-tag">fibM</span>
    `;

    tape.appendChild(pill);
  });
}

/**
 * Renders the Step-by-Step timeline list items.
 */
function renderStepsTimeline() {
  const timeline = document.getElementById('steps-timeline');
  timeline.innerHTML = '';

  AppState.states.forEach((st, idx) => {
    const card = document.createElement('div');
    card.className = `step-card ${idx === AppState.currentStepIndex ? 'active-step' : ''}`;
    card.id = `step-card-${idx}`;
    card.dataset.stepIndex = idx;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    // Click step card to jump directly to this step!
    card.addEventListener('click', () => {
      pauseSearch();
      goToStep(idx);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pauseSearch();
        goToStep(idx);
      }
    });

    card.innerHTML = `
      <span class="step-num-pill">${idx}</span>
      <div class="step-info">
        <div class="step-title">${escapeHTML(st.title)}</div>
        <div class="step-desc">${escapeHTML(st.description)}</div>
      </div>
    `;

    timeline.appendChild(card);
  });
}

/**
 * Updates all visual panels to reflect the specified search state.
 */
function updateVisualization(state) {
  if (!state) return;

  // 1. Update Array Element Visual States
  const n = AppState.array.length;
  for (let i = 0; i < n; i++) {
    const item = document.getElementById(`array-item-${i}`);
    if (item) {
      item.className = `array-item ${state.arrayStates[i] || 'state-normal'}`;
      const roleTag = document.getElementById(`role-tag-${i}`);
      if (roleTag) {
        if (state.foundIndex === i) {
          roleTag.textContent = 'FOUND';
          roleTag.style.display = 'block';
        } else if (state.probe === i) {
          roleTag.textContent = 'PROBE';
          roleTag.style.display = 'block';
        } else {
          roleTag.style.display = 'none';
        }
      }
    }
  }

  // 2. Update Offset & Probe Pointers
  updatePointerTrack(state);

  // 3. Update Fibonacci Numbers Panel
  updateFibonacciPanel(state);

  // 4. Update Search Range Panel
  updateSearchRangePanel(state);

  // 5. Update Current Comparison Arena
  updateComparisonPanel(state);

  // 6. Update Result Notification Banner
  updateResultBanner(state);

  // 7. Update Metrics (Comparisons, Steps)
  document.getElementById('comparisons-count').textContent = state.comparisons;
  document.getElementById('step-count').textContent = `${state.stepIndex} / ${AppState.states.length - 1}`;
  document.getElementById('current-step-badge').textContent = `Step ${state.stepIndex}`;

  // 8. Update Pseudocode Line Highlight
  updatePseudocodeHighlight(state.pseudocodeLine);

  // 9. Update Step Cards Active Highlight & Scroll into view
  updateStepTimelineActive(state.stepIndex);

  // 10. Update Stepper Button Disabled States
  document.getElementById('btn-prev-step').disabled = (state.stepIndex === 0);
  document.getElementById('btn-next-step').disabled = (state.stepIndex >= AppState.states.length - 1);

  // 11. Screen Reader Live Announcement
  announceToScreenReader(state.description);

  // 12. Audio cue
  if (state.sound) {
    playSound(state.sound);
  }
}

/**
 * Updates the floating pointer markers underneath the array (Offset & Probe).
 */
function updatePointerTrack(state) {
  const offsetBadge = document.getElementById('offset-indicator');
  const probeBadge = document.getElementById('probe-indicator');
  const container = document.getElementById('array-container');
  if (!container || !offsetBadge || !probeBadge) return;

  // Probe indicator with smooth glide position
  if (state.probe !== null && state.probe !== undefined) {
    const probeItem = document.getElementById(`array-item-${state.probe}`);
    if (probeItem) {
      probeBadge.style.display = 'inline-flex';
      const label = probeBadge.querySelector('.pointer-label');
      if (label) label.textContent = `Probe (i): ${state.probe}`;
      
      const xPos = probeItem.offsetLeft + (probeItem.offsetWidth / 2);
      probeBadge.style.left = `${xPos}px`;

      // Horizontally center probed element within array container if overflowing (never scroll window)
      const wrapper = document.getElementById('array-wrapper');
      if (wrapper && wrapper.scrollWidth > wrapper.clientWidth) {
        const targetScroll = probeItem.offsetLeft - (wrapper.clientWidth / 2) + (probeItem.clientWidth / 2);
        wrapper.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
      }
    }
  } else {
    probeBadge.style.display = 'none';
  }

  // Offset indicator with smooth glide position
  if (state.offset !== null && state.offset !== undefined) {
    offsetBadge.style.display = 'inline-flex';
    const label = offsetBadge.querySelector('.pointer-label');
    if (label) label.textContent = `Offset: ${state.offset}`;

    if (state.offset === -1) {
      const firstItem = document.getElementById('array-item-0');
      if (firstItem) {
        const xPos = Math.max(20, firstItem.offsetLeft - 32);
        offsetBadge.style.left = `${xPos}px`;
      }
    } else {
      const offItem = document.getElementById(`array-item-${state.offset}`);
      if (offItem) {
        const xPos = offItem.offsetLeft + (offItem.offsetWidth / 2);
        offsetBadge.style.left = `${xPos}px`;
      }
    }
  } else {
    offsetBadge.style.display = 'none';
  }
}

/**
 * Updates Fibonacci sequence ribbon highlights and variable cards.
 */
function updateFibonacciPanel(state) {
  // Update variable values
  document.getElementById('val-fibM').textContent = state.fibM;
  document.getElementById('val-fib1').textContent = state.fib1;
  document.getElementById('val-fib2').textContent = state.fib2;

  // Invariant equation bar
  document.getElementById('fib-equation').textContent = 
    `fibM (${state.fibM}) = fib1 (${state.fib1}) + fib2 (${state.fib2})`;

  // Sequence ribbon highlighting
  const pills = document.querySelectorAll('.fib-pill');
  pills.forEach((p) => {
    p.classList.remove('is-fibM', 'is-fib1', 'is-fib2');
    const tag = p.querySelector('.fib-pill-tag');
    if (tag) tag.style.display = 'none';
  });

  // Highlight pills that match current variables
  const seq = AppState.fibSequence;
  const mIdx = seq.lastIndexOf(state.fibM);
  const m1Idx = mIdx > 0 ? mIdx - 1 : seq.lastIndexOf(state.fib1);
  const m2Idx = mIdx > 1 ? mIdx - 2 : seq.lastIndexOf(state.fib2);

  if (mIdx !== -1) {
    const pill = document.getElementById(`fib-pill-${mIdx}`);
    if (pill) {
      pill.classList.add('is-fibM');
      const tag = pill.querySelector('.fib-pill-tag');
      if (tag) { tag.textContent = 'fibM'; tag.style.display = 'block'; }
    }
  }

  if (m1Idx !== -1 && m1Idx !== mIdx) {
    const pill = document.getElementById(`fib-pill-${m1Idx}`);
    if (pill) {
      pill.classList.add('is-fib1');
      const tag = pill.querySelector('.fib-pill-tag');
      if (tag) { tag.textContent = 'fib1'; tag.style.display = 'block'; }
    }
  }

  if (m2Idx !== -1 && m2Idx !== mIdx && m2Idx !== m1Idx) {
    const pill = document.getElementById(`fib-pill-${m2Idx}`);
    if (pill) {
      pill.classList.add('is-fib2');
      const tag = pill.querySelector('.fib-pill-tag');
      if (tag) { tag.textContent = 'fib2'; tag.style.display = 'block'; }
    }
  }

  // Update m-index badge in header
  document.getElementById('fib-m-index-badge').textContent = 
    mIdx !== -1 ? `m = ${mIdx} (F${mIdx} = ${state.fibM})` : `fibM = ${state.fibM}`;
}

/**
 * Updates Search Range panel numbers and formula text.
 */
function updateSearchRangePanel(state) {
  const n = AppState.array.length;
  const lowVal = state.low !== null ? state.low : (state.offset + 1);
  const highVal = state.high !== null ? state.high : Math.min(state.offset + state.fibM, n - 1);

  document.getElementById('stat-low').textContent = lowVal;
  document.getElementById('stat-high').textContent = highVal;
  document.getElementById('stat-offset').textContent = state.offset;
  document.getElementById('stat-probe').textContent = state.probe !== null ? state.probe : '-';

  const rangeBadge = document.getElementById('range-active-badge');
  if (rangeBadge) {
    rangeBadge.textContent = `Active: [${lowVal} .. ${highVal}]`;
  }

  // Probe formula string
  const formulaEl = document.getElementById('probe-formula-text');
  if (state.probe !== null) {
    formulaEl.innerHTML = `<code>i = min(offset + fib2, n - 1) = min(${state.offset} + ${state.fib2}, ${n - 1}) = ${state.probe}</code>`;
  } else {
    formulaEl.innerHTML = `<code>offset = ${state.offset}, fib2 = ${state.fib2} (Awaiting probe step)</code>`;
  }
}

/**
 * Updates the Comparison card values, operators, and verdict box.
 */
function updateComparisonPanel(state) {
  const statusBadge = document.getElementById('comp-status-badge');
  const probeIdxEl = document.getElementById('comp-probe-idx');
  const probeValEl = document.getElementById('comp-probe-val');
  const targetValEl = document.getElementById('comp-target-val');
  const operatorSignEl = document.getElementById('comp-operator-sign');
  const operatorSubEl = document.getElementById('comp-operator-sub');
  const headlineEl = document.getElementById('verdict-headline');
  const descEl = document.getElementById('verdict-desc');
  const iconEl = document.getElementById('verdict-icon');

  targetValEl.textContent = state.compTargetVal;

  if (state.compProbeIdx !== null && state.compProbeVal !== null) {
    probeIdxEl.textContent = state.compProbeIdx;
    probeValEl.textContent = state.compProbeVal;
  } else {
    probeIdxEl.textContent = '-';
    probeValEl.textContent = '--';
  }

  // Operator sign & subtext using clean vector SVGs
  if (state.compOp === '<') {
    operatorSignEl.textContent = '<';
    operatorSubEl.textContent = 'Is Smaller';
    statusBadge.textContent = 'Probe < Target';
    statusBadge.className = 'badge badge-warning';
    if (iconEl) iconEl.innerHTML = SVG_ICONS.arrowRight;
  } else if (state.compOp === '>') {
    operatorSignEl.textContent = '>';
    operatorSubEl.textContent = 'Is Greater';
    statusBadge.textContent = 'Probe > Target';
    statusBadge.className = 'badge badge-warning';
    if (iconEl) iconEl.innerHTML = SVG_ICONS.arrowLeft;
  } else if (state.compOp === '==') {
    operatorSignEl.textContent = '==';
    operatorSubEl.textContent = 'Match!';
    statusBadge.textContent = 'Match Found';
    statusBadge.className = 'badge badge-accent';
    if (iconEl) iconEl.innerHTML = SVG_ICONS.check;
  } else if (state.compOp === '!=') {
    operatorSignEl.textContent = '!=';
    operatorSubEl.textContent = 'No Match';
    statusBadge.textContent = 'Exhausted';
    statusBadge.className = 'badge badge-neutral';
    if (iconEl) iconEl.innerHTML = SVG_ICONS.x;
  } else {
    operatorSignEl.textContent = '≟';
    operatorSubEl.textContent = 'Awaiting';
    statusBadge.textContent = 'Inspecting';
    statusBadge.className = 'badge badge-info';
    if (iconEl) iconEl.innerHTML = SVG_ICONS.search;
  }

  headlineEl.textContent = state.compHeadline;
  descEl.textContent = state.compDesc;
}

/**
 * Updates the Result Notification card when search completes.
 */
function updateResultBanner(state) {
  const banner = document.getElementById('result-banner');
  if (!state.isFinished) {
    banner.style.display = 'none';
    return;
  }

  banner.style.display = 'block';

  const titleEl = document.getElementById('result-title');
  const subEl = document.getElementById('result-subtitle');
  const iconEl = document.getElementById('result-icon-circle');
  const targetValEl = document.getElementById('res-val-target');
  const indexValEl = document.getElementById('res-val-index');
  const compsValEl = document.getElementById('res-val-comps');
  const stepsValEl = document.getElementById('res-val-steps');
  const explEl = document.getElementById('result-explanation');

  targetValEl.textContent = AppState.target;
  compsValEl.textContent = state.comparisons;
  stepsValEl.textContent = state.stepIndex;

  if (state.statusType === 'found') {
    banner.className = 'card result-card success-state';
    if (iconEl) iconEl.innerHTML = SVG_ICONS.check;
    titleEl.textContent = 'Element Found!';
    subEl.textContent = `Target ${AppState.target} exists in the array at index ${state.foundIndex}.`;
    indexValEl.textContent = state.foundIndex;
    explEl.textContent = `Search completed successfully! Target matched at index ${state.foundIndex} using ${state.comparisons} comparisons.`;
  } else {
    banner.className = 'card result-card failure-state';
    if (iconEl) iconEl.innerHTML = SVG_ICONS.x;
    titleEl.textContent = 'Element Not Found';
    subEl.textContent = `Target ${AppState.target} does not exist in the array.`;
    indexValEl.textContent = 'None (-1)';
    explEl.textContent = `The search space was completely exhausted after ${state.comparisons} comparisons without finding target ${AppState.target}.`;
  }
}

/**
 * Highlights the active line of code in the pseudocode viewer.
 */
function updatePseudocodeHighlight(lineNum) {
  document.querySelectorAll('.code-line').forEach((el) => {
    el.classList.remove('active');
  });
  if (lineNum) {
    const activeLine = document.querySelector(`.code-line[data-line="${lineNum}"]`);
    if (activeLine) {
      activeLine.classList.add('active');
    }
  }
}

/**
 * Highlights active step in the timeline and smoothly scrolls it into view.
 */
function updateStepTimelineActive(stepIdx) {
  document.querySelectorAll('.step-card').forEach((c) => {
    c.classList.remove('active-step');
  });

  const activeCard = document.getElementById(`step-card-${stepIdx}`);
  if (activeCard) {
    activeCard.classList.add('active-step');

    // Smoothly scroll ONLY the internal tab container, NEVER the window/page!
    const scrollContainer = document.getElementById('tab-steps');
    if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
      const cardOffset = activeCard.offsetTop - scrollContainer.offsetTop;
      const targetScroll = cardOffset - (scrollContainer.clientHeight / 2) + (activeCard.clientHeight / 2);
      scrollContainer.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  }
}

/**
 * Screen Reader helper for accessibility.
 */
function announceToScreenReader(msg) {
  const announcer = document.getElementById('live-announcer');
  if (announcer) {
    announcer.textContent = msg;
  }
}

// ============================================================================
// 5. PLAYBACK CONTROLS & STEPPING ENGINE
// ============================================================================

/**
 * Advances exactly one step forward.
 */
function performNextStep() {
  if (AppState.currentStepIndex < AppState.states.length - 1) {
    AppState.currentStepIndex++;
    updateVisualization(AppState.states[AppState.currentStepIndex]);

    // If reached end during autoplay, pause
    if (AppState.currentStepIndex >= AppState.states.length - 1) {
      pauseSearch();
    }
  } else {
    pauseSearch();
  }
}

/**
 * Rewinds exactly one step backward.
 */
function performPrevStep() {
  pauseSearch();
  if (AppState.currentStepIndex > 0) {
    AppState.currentStepIndex--;
    updateVisualization(AppState.states[AppState.currentStepIndex]);
  }
}

/**
 * Jumps to a specific step index.
 */
function goToStep(index) {
  if (index >= 0 && index < AppState.states.length) {
    AppState.currentStepIndex = index;
    updateVisualization(AppState.states[AppState.currentStepIndex]);
  }
}

/**
 * Starts automatic execution animation.
 */
function playSearch() {
  // If at the end, reset to beginning before playing
  if (AppState.currentStepIndex >= AppState.states.length - 1) {
    AppState.currentStepIndex = 0;
    updateVisualization(AppState.states[0]);
  }

  AppState.isPlaying = true;
  updatePlayButtonUI(true);

  if (AppState.playIntervalId) {
    clearInterval(AppState.playIntervalId);
  }

  AppState.playIntervalId = setInterval(() => {
    if (AppState.currentStepIndex < AppState.states.length - 1) {
      performNextStep();
    } else {
      pauseSearch();
    }
  }, AppState.speedMs);
}

/**
 * Pauses automatic execution animation.
 */
function pauseSearch() {
  AppState.isPlaying = false;
  if (AppState.playIntervalId) {
    clearInterval(AppState.playIntervalId);
    AppState.playIntervalId = null;
  }
  updatePlayButtonUI(false);
}

/**
 * Toggles Play/Pause state.
 */
function togglePlayPause() {
  if (AppState.isPlaying) {
    pauseSearch();
  } else {
    playSearch();
  }
}

/**
 * Synchronizes play/pause button labels and icons.
 */
function updatePlayButtonUI(isPlaying) {
  const playLabel = document.getElementById('play-pause-label');
  const startBtnText = document.getElementById('start-btn-text');
  const startBtn = document.getElementById('btn-start-search');
  const playBtn = document.getElementById('btn-play-pause');

  const startPlayIcon = startBtn.querySelector('.play-icon');
  const startPauseIcon = startBtn.querySelector('.pause-icon');
  const ctrlPlayIcon = playBtn.querySelector('.play-icon');
  const ctrlPauseIcon = playBtn.querySelector('.pause-icon');

  if (isPlaying) {
    playLabel.textContent = 'Pause';
    startBtnText.textContent = 'Pause Search';
    startPlayIcon.style.display = 'none';
    startPauseIcon.style.display = 'inline-block';
    ctrlPlayIcon.style.display = 'none';
    ctrlPauseIcon.style.display = 'inline-block';
  } else {
    playLabel.textContent = 'Play';
    startBtnText.textContent = 'Start Search';
    startPlayIcon.style.display = 'inline-block';
    startPauseIcon.style.display = 'none';
    ctrlPlayIcon.style.display = 'inline-block';
    ctrlPauseIcon.style.display = 'none';
  }
}

/**
 * Resets visualization to initial unsearched state.
 */
function resetVisualization() {
  pauseSearch();
  AppState.currentStepIndex = 0;
  updateVisualization(AppState.states[0]);
  announceToScreenReader('Visualization reset to initial state');
}

// ============================================================================
// 6. INITIALIZATION & INPUT VALIDATION
// ============================================================================

/**
 * Initializes or re-initializes search given an array and target.
 */
function initializeSearch(arr, target) {
  pauseSearch();

  AppState.array = [...arr];
  AppState.target = Number(target);
  AppState.states = generateSearchStates(AppState.array, AppState.target);
  AppState.currentStepIndex = 0;

  renderArrayElements();
  renderFibonacciSequenceTape();
  renderStepsTimeline();
  updateVisualization(AppState.states[0]);
}

/**
 * Validates text input from the user.
 * Checks for empty array, non-numbers, unsorted condition, duplicates, and bounds.
 */
function validateAndParseInput(rawString) {
  if (!rawString || rawString.trim() === '') {
    return { error: 'Please enter at least one number.' };
  }

  const parts = rawString.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

  if (parts.length === 0) {
    return { error: 'Array cannot be empty.' };
  }

  if (parts.length > 25) {
    return { error: 'Please enter 25 elements or fewer for optimal visual clarity.' };
  }

  const numbers = [];
  for (const part of parts) {
    const num = Number(part);
    if (isNaN(num)) {
      return { error: `Invalid item "${part}". Array must contain only valid numbers.` };
    }
    numbers.push(num);
  }

  // Check if sorted
  let isSorted = true;
  for (let i = 0; i < numbers.length - 1; i++) {
    if (numbers[i] > numbers[i + 1]) {
      isSorted = false;
      break;
    }
  }

  return { numbers, isSorted };
}

/**
 * Applies custom input from inputs fields with sorting validation prompt.
 */
function applyCustomArray(autoStart = false) {
  const arrayInput = document.getElementById('array-input');
  const targetInput = document.getElementById('target-input');
  const errorMsg = document.getElementById('input-error-msg');
  const unsortedModal = document.getElementById('unsorted-modal');

  errorMsg.style.display = 'none';

  const res = validateAndParseInput(arrayInput.value);
  if (res.error) {
    errorMsg.textContent = res.error;
    errorMsg.style.display = 'flex';
    return;
  }

  if (targetInput.value.trim() === '' || isNaN(Number(targetInput.value))) {
    errorMsg.textContent = 'Please enter a valid search target number.';
    errorMsg.style.display = 'flex';
    return;
  }

  const targetVal = Number(targetInput.value);

  // If unsorted, show warning banner
  if (!res.isSorted) {
    unsortedModal.style.display = 'block';
    unsortedModal.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  unsortedModal.style.display = 'none';
  initializeSearch(res.numbers, targetVal);

  if (autoStart) {
    playSearch();
  }
}

/**
 * Automatically sorts user input and starts search.
 */
function handleSortAutomatically() {
  const arrayInput = document.getElementById('array-input');
  const unsortedModal = document.getElementById('unsorted-modal');
  const res = validateAndParseInput(arrayInput.value);

  if (!res.numbers) return;

  const sorted = [...res.numbers].sort((a, b) => a - b);
  arrayInput.value = sorted.join(', ');
  unsortedModal.style.display = 'none';

  const targetInput = document.getElementById('target-input');
  const targetVal = Number(targetInput.value) || sorted[0];

  initializeSearch(sorted, targetVal);
  announceToScreenReader('Array sorted in ascending order automatically');
}

/**
 * Generates a random sorted array with 5 to 15 unique integers.
 */
function generateRandomArray() {
  const size = Math.floor(Math.random() * 8) + 7; // 7 to 14 elements
  const set = new Set();

  while (set.size < size) {
    const val = Math.floor(Math.random() * 95) + 5; // values between 5 and 99
    set.add(val);
  }

  const arr = Array.from(set).sort((a, b) => a - b);
  
  // Pick either an existing element (80% chance) or a non-existing value (20% chance)
  let target;
  if (Math.random() < 0.8) {
    target = arr[Math.floor(Math.random() * arr.length)];
  } else {
    target = Math.floor(Math.random() * 95) + 5;
  }

  document.getElementById('array-input').value = arr.join(', ');
  document.getElementById('target-input').value = target;
  document.getElementById('input-error-msg').style.display = 'none';
  document.getElementById('unsorted-modal').style.display = 'none';

  initializeSearch(arr, target);
  announceToScreenReader(`Generated random sorted array of size ${arr.length} with target ${target}`);
}

/**
 * Loads predefined presets for students.
 */
function loadPreset(presetKey) {
  let arr, target;

  switch (presetKey) {
    case 'found-first':
      arr = [10, 22, 35, 47, 51, 63, 72, 85, 91];
      target = 10;
      break;
    case 'found-last':
      arr = [10, 22, 35, 47, 51, 63, 72, 85, 91];
      target = 91;
      break;
    case 'not-found':
      arr = [10, 22, 35, 47, 51, 63, 72, 85, 91];
      target = 70;
      break;
    case 'single':
      arr = [42];
      target = 42;
      break;
    case 'large':
      arr = [3, 8, 14, 21, 29, 37, 44, 52, 60, 68, 75, 83, 89, 94, 99];
      target = 52;
      break;
    case 'default':
    default:
      arr = [10, 22, 35, 47, 51, 63, 72, 85, 91];
      target = 63;
      break;
  }

  document.getElementById('array-input').value = arr.join(', ');
  document.getElementById('target-input').value = target;
  document.getElementById('input-error-msg').style.display = 'none';
  document.getElementById('unsorted-modal').style.display = 'none';

  initializeSearch(arr, target);
}

// ============================================================================
// 7. EVENT LISTENERS & KEYBOARD SHORTCUTS
// ============================================================================

function setupEventListeners() {
  // Start / Pause Primary Button
  document.getElementById('btn-start-search').addEventListener('click', () => {
    if (AppState.isPlaying) {
      pauseSearch();
    } else {
      // If currently modified in input, apply first
      applyCustomArray(true);
    }
  });

  // Play / Pause Stepper Button
  document.getElementById('btn-play-pause').addEventListener('click', togglePlayPause);

  // Next Step Button
  document.getElementById('btn-next-step').addEventListener('click', () => {
    pauseSearch();
    performNextStep();
  });

  // Previous Step Button
  document.getElementById('btn-prev-step').addEventListener('click', performPrevStep);

  // Reset Button
  document.getElementById('btn-reset').addEventListener('click', resetVisualization);

  // Apply Button
  document.getElementById('btn-apply-array').addEventListener('click', () => {
    applyCustomArray(false);
  });

  // Random Array Button
  document.getElementById('btn-random-array').addEventListener('click', generateRandomArray);

  // Unsorted Modal Actions
  document.getElementById('btn-sort-auto').addEventListener('click', handleSortAutomatically);
  document.getElementById('btn-sort-cancel').addEventListener('click', () => {
    document.getElementById('unsorted-modal').style.display = 'none';
    document.getElementById('array-input').focus();
  });

  // Focus Active Step
  document.getElementById('btn-clear-history').addEventListener('click', () => {
    updateStepTimelineActive(AppState.currentStepIndex);
  });

  // Speed Slider
  const speedSlider = document.getElementById('speed-slider');
  speedSlider.addEventListener('input', (e) => {
    // Invert so higher value = faster (lower delay)
    const minVal = Number(e.target.min);
    const maxVal = Number(e.target.max);
    const rawVal = Number(e.target.value);
    
    // Invert slider: slider towards Fast gives smaller delay
    AppState.speedMs = (maxVal + minVal) - rawVal;

    // Display human multiplier
    const speedMultiplier = (1200 / AppState.speedMs).toFixed(1);
    document.getElementById('speed-value-badge').textContent = `${speedMultiplier}x`;

    // If currently playing, update interval seamlessly
    if (AppState.isPlaying) {
      clearInterval(AppState.playIntervalId);
      AppState.playIntervalId = setInterval(() => {
        if (AppState.currentStepIndex < AppState.states.length - 1) {
          performNextStep();
        } else {
          pauseSearch();
        }
      }, AppState.speedMs);
    }
  });

  // Preset Buttons
  document.querySelectorAll('.chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      loadPreset(btn.dataset.preset);
    });
  });

  // Audio Toggle Button
  const soundBtn = document.getElementById('btn-toggle-sound');
  soundBtn.addEventListener('click', toggleSound);

  // Theme Toggle Button
  const themeBtn = document.getElementById('btn-toggle-theme');
  themeBtn.addEventListener('click', toggleTheme);

  // Help Modal Open / Close
  const helpModal = document.getElementById('help-modal');
  document.getElementById('btn-open-help').addEventListener('click', () => {
    helpModal.style.display = 'flex';
  });
  document.getElementById('btn-close-help').addEventListener('click', () => {
    helpModal.style.display = 'none';
  });
  document.getElementById('btn-modal-got-it').addEventListener('click', () => {
    helpModal.style.display = 'none';
  });

  // Tab Switching (Algorithm Explorer)
  document.querySelectorAll('.tab-btn').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      const targetPaneId = tabBtn.dataset.tab;
      
      // Update Tab Buttons
      document.querySelectorAll('.tab-btn').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabBtn.classList.add('active');
      tabBtn.setAttribute('aria-selected', 'true');

      // Update Tab Panes
      document.querySelectorAll('.tab-pane').forEach((pane) => {
        pane.style.display = 'none';
        pane.classList.remove('active');
      });

      const activePane = document.getElementById(targetPaneId);
      if (activePane) {
        activePane.style.display = 'block';
        activePane.classList.add('active');
      }

      if (targetPaneId === 'tab-steps') {
        updateStepTimelineActive(AppState.currentStepIndex);
      }
    });
  });

  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
      helpModal.style.display = 'none';
    }
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', handleGlobalKeydown);

  // Input Enter key triggers apply
  document.getElementById('array-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      applyCustomArray(false);
    }
  });
  document.getElementById('target-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      applyCustomArray(true);
    }
  });
}

/**
 * Handles global keyboard shortcuts without interfering with text inputs.
 */
function handleGlobalKeydown(e) {
  // If user is focused on an input element, do not trigger visualizer shortcuts
  const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
  if (activeTag === 'input' || activeTag === 'textarea') {
    return;
  }

  switch (e.key) {
    case ' ':
      e.preventDefault();
      togglePlayPause();
      break;

    case 'ArrowRight':
      e.preventDefault();
      pauseSearch();
      performNextStep();
      break;

    case 'ArrowLeft':
      e.preventDefault();
      performPrevStep();
      break;

    case 'r':
    case 'R':
      e.preventDefault();
      resetVisualization();
      break;

    case 'm':
    case 'M':
      e.preventDefault();
      toggleSound();
      break;

    case 't':
    case 'T':
      e.preventDefault();
      toggleTheme();
      break;

    case '?':
      e.preventDefault();
      const helpModal = document.getElementById('help-modal');
      helpModal.style.display = helpModal.style.display === 'flex' ? 'none' : 'flex';
      break;

    case 'Escape':
      document.getElementById('help-modal').style.display = 'none';
      document.getElementById('unsorted-modal').style.display = 'none';
      break;

    default:
      break;
  }
}

/**
 * Toggles sound effects and updates icon.
 */
function toggleSound() {
  AppState.soundEnabled = !AppState.soundEnabled;
  const soundOnIcon = document.querySelector('.icon-sound-on');
  const soundOffIcon = document.querySelector('.icon-sound-off');
  const soundBtn = document.getElementById('btn-toggle-sound');

  if (AppState.soundEnabled) {
    soundOnIcon.style.display = 'block';
    soundOffIcon.style.display = 'none';
    soundBtn.title = 'Mute Sound Effects (M)';
    playSound('step');
  } else {
    soundOnIcon.style.display = 'none';
    soundOffIcon.style.display = 'block';
    soundBtn.title = 'Enable Sound Effects (M)';
  }
}

/**
 * Toggles dark/light visual theme.
 */
function toggleTheme() {
  const body = document.body;
  const sunIcon = document.querySelector('.icon-sun');
  const moonIcon = document.querySelector('.icon-moon');

  if (body.classList.contains('dark-theme')) {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
    AppState.theme = 'light';
  } else {
    body.classList.remove('light-theme');
    body.classList.add('dark-theme');
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
    AppState.theme = 'dark';
  }
}

/**
 * Utility to escape HTML entities for safety.
 */
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// 8. BOOTSTRAP ON DOM READY
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();

  // Load interactive default example:
  // Array: 10, 22, 35, 47, 51, 63, 72, 85, 91; Target: 63
  initializeSearch(AppState.array, AppState.target);
});
