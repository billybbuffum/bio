/* Week 9 labs: reaction time test, action potential simulator, blood glucose homeostasis. */
(function () {
  const Bio = window.Bio;

  /* ---------- Reaction time ---------- */
  Bio.labs.reaction = function (el) {
    const KEY = "w9-rt-data";
    el.innerHTML = `
      <h3>Lab 9A · Measure Your Reaction Time</h3>
      <p>This is a real experiment on <em>your</em> nervous system. Choose a condition, click the box to start, and click again as soon as it turns <strong>green</strong> (or as soon as you <strong>hear the beep</strong> in sound mode). Do at least 5 trials per condition.</p>
      <div class="lab-controls"><div class="ctl"><label for="rt-cond">Condition</label><select id="rt-cond">
        <option>Dominant hand (visual)</option><option>Non-dominant hand (visual)</option><option>Sound cue (dominant hand)</option><option>Distracted (count backward by 7s aloud)</option><option>After 1 min of exercise</option></select></div></div>
      <div id="rt-box" role="button" tabindex="0" style="height:200px;border-radius:14px;display:grid;place-items:center;font-size:1.4rem;font-weight:700;cursor:pointer;user-select:none;background:var(--surface-2);border:2px solid var(--border)">Click to start</div>
      <div class="readout"><div><b id="rt-last">—</b><span>Last (ms)</span></div><div><b id="rt-avg">—</b><span>Average this condition (ms)</span></div><div><b id="rt-n">0</b><span>Trials this condition</span></div></div>
      <canvas id="rt-cv" style="height:240px"></canvas>
      <div class="btn-row"><button class="btn small" id="rt-undo">Undo last trial</button><button class="btn small" id="rt-clear">Clear all data</button></div>
      <p class="small muted">Your data is saved in this browser. Typical visual reaction times are 200–300 ms; responses to sound are often a bit faster.</p>
      ${Bio.worksheet("w9-rt", [
        "Trace the pathway of the signal from your eyes to your finger. Name the types of neurons and parts of the nervous system involved.",
        "Compare your conditions. Which was fastest/slowest? Propose a biological explanation for each difference.",
        "Why does reaction time involve the brain, while pulling your hand off a hot stove (a reflex) does not? Which is faster?",
        "Identify two sources of error in this experiment and how you could reduce them."
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    let data = {};
    try { data = JSON.parse(Bio.store.note(KEY) || "{}"); } catch (e) { data = {}; }
    let state = "idle", timer, t0, audio;
    const box = $("rt-box");
    const save = () => Bio.store.setNote(KEY, JSON.stringify(data));
    function beep() {
      try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = 880; o.connect(g); g.connect(audio.destination); g.gain.value = 0.2; o.start(); o.stop(audio.currentTime + 0.15); } catch (e) { /* no audio */ }
    }
    function setBox(bg, txt) { box.style.background = bg; box.textContent = txt; }
    function stats() {
      const c = $("rt-cond").value, arr = data[c] || [];
      $("rt-n").textContent = arr.length;
      $("rt-avg").textContent = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : "—";
      const pal = [Bio.css("--c1"), Bio.css("--c2"), Bio.css("--c3"), Bio.css("--c4"), Bio.css("--accent")];
      const bars = Object.entries(data).filter(([, a]) => a.length).map(([k, a], i) => ({ label: k.split(" (")[0].replace("After 1 min of exercise", "Exercise").slice(0, 18), value: Math.round(a.reduce((x, y) => x + y, 0) / a.length), color: pal[i % 5] }));
      Bio.chart($("rt-cv"), { type: "bar", bars: bars.length ? bars : [{ label: "No data yet", value: 0 }], yLabel: "Average reaction time (ms)" });
    }
    function act() {
      const sound = $("rt-cond").value.startsWith("Sound");
      if (state === "idle" || state === "done") {
        state = "wait"; setBox("var(--bad-soft)", sound ? "Listen… (click at the beep)" : "Wait for green…");
        timer = setTimeout(() => { state = "go"; t0 = performance.now(); if (sound) { beep(); setBox("var(--bad-soft)", "🔊"); } else setBox("#2e9e5b", "CLICK!"); }, Bio.rand(1500, 4000));
      } else if (state === "wait") {
        clearTimeout(timer); state = "done"; setBox("var(--warn-soft)", "Too soon! Click to try again.");
      } else if (state === "go") {
        const ms = Math.round(performance.now() - t0); state = "done";
        const c = $("rt-cond").value; (data[c] = data[c] || []).push(ms); save();
        $("rt-last").textContent = ms; setBox("var(--surface-2)", `${ms} ms. Click to go again.`); stats();
      }
    }
    box.addEventListener("mousedown", act);
    box.addEventListener("touchstart", (e) => { e.preventDefault(); act(); }, { passive: false });
    box.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); act(); } });
    $("rt-cond").addEventListener("change", stats);
    $("rt-undo").addEventListener("click", () => { const c = $("rt-cond").value; if (data[c] && data[c].length) { data[c].pop(); save(); stats(); } });
    $("rt-clear").addEventListener("click", () => { if (confirm("Clear all reaction-time data?")) { data = {}; save(); stats(); } });
    Bio.live(stats);
  };

  /* ---------- Action potential ---------- */
  Bio.labs.neuron = function (el) {
    el.innerHTML = `
      <h3>Lab 9B · Action Potential Simulator</h3>
      <p>Stimulate a neuron and record its membrane voltage. Find the <strong>threshold</strong>, test the <strong>all-or-none</strong> law, and discover how neurons encode a stronger stimulus.</p>
      <div class="lab-controls">
        <div class="ctl"><label for="ap-mode">Stimulus type</label><select id="ap-mode"><option value="pulse">Single brief pulse</option><option value="hold">Sustained stimulus (40 ms)</option></select></div>
        <div class="ctl"><label>Stimulus strength <output id="ap-sv"></output></label><input type="range" id="ap-s" min="0" max="40" value="10"></div>
        <div class="ctl"><label style="justify-content:flex-start;gap:8px;font-weight:400"><input type="checkbox" id="ap-block"> Apply Na⁺ channel blocker (like lidocaine)</label></div>
      </div>
      <div class="btn-row"><button class="btn primary" id="ap-go">⚡ Stimulate</button><label class="small" style="font-weight:400"><input type="checkbox" id="ap-keep" checked> Keep previous traces</label><button class="btn small" id="ap-clr">Clear</button></div>
      <canvas id="ap-cv"></canvas>
      <div class="readout"><div><b id="ap-peak">—</b><span>Peak voltage (mV)</span></div><div><b id="ap-n">—</b><span>Action potentials fired</span></div><div><b id="ap-f">—</b><span>Firing rate (Hz)</span></div></div>
      ${Bio.worksheet("w9-ap", [
        "Using single pulses, find the smallest stimulus that triggers an action potential. What is the threshold voltage?",
        "Compare a stimulus just above threshold with the maximum stimulus. Is the action potential bigger? What does 'all-or-none' mean?",
        "Use the sustained stimulus at several strengths. How does the neuron signal a stronger stimulus, if not by making bigger spikes?",
        "Explain what lidocaine does and why it numbs pain at the dentist.",
        "Label the phases on one trace: resting potential, depolarization (which ion?), repolarization (which ion?), hyperpolarization."
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    let traces = [];
    const REST = -70, THRESH = -55;
    function spikeShape(t) { // t in ms since threshold crossing
      if (t < 0.6) return THRESH + (30 - THRESH) * (t / 0.6);
      if (t < 1.6) return 30 - 110 * ((t - 0.6) / 1.0);
      if (t < 4) return -80 + 10 * ((t - 1.6) / 2.4);
      return null;
    }
    function simulate(mode, S, blocked) {
      const dt = 0.05, T = 50, tau = 4, pts = [];
      let V = REST, spikeT = null, refr = 0, n = 0, peak = REST, first = null, last = null;
      for (let t = 0; t <= T; t += dt) {
        const on = mode === "pulse" ? t >= 5 && t < 6 : t >= 5 && t < 45;
        const drive = on ? (mode === "pulse" ? S * 4.4 : S * 1.25) : 0; // pulse charges quickly
        if (spikeT !== null) {
          const v = spikeShape(t - spikeT);
          if (v === null) { spikeT = null; V = -70; refr = 0; } else V = v;
        } else {
          V += dt * ((REST - V) + drive) / tau;
          if (refr > 0) refr -= dt;
          if (V >= THRESH && !blocked && refr <= 0) { spikeT = t; n++; if (first == null) first = t; last = t; refr = 1; }
        }
        peak = Math.max(peak, V);
        pts.push([t, V]);
      }
      const rate = n > 1 ? Math.round((1000 * (n - 1)) / (last - first)) : n === 1 ? "—" : 0;
      return { pts, n, peak, rate };
    }
    function draw() {
      Bio.chart($("ap-cv"), {
        series: traces.map((tr, i) => ({ name: tr.name, points: tr.pts, noDots: true, color: i === traces.length - 1 ? Bio.css("--c1") : undefined })),
        xLabel: "Time (ms)", yLabel: "Membrane potential (mV)", xMin: 0, xMax: 50, yMin: -90, yMax: 60,
        hLines: [{ y: -55, label: "threshold −55", color: Bio.css("--c3") }, { y: -70, label: "rest −70" }]
      });
    }
    $("ap-s").addEventListener("input", (e) => ($("ap-sv").textContent = e.target.value));
    $("ap-sv").textContent = $("ap-s").value;
    $("ap-go").addEventListener("click", () => {
      const mode = $("ap-mode").value, S = +$("ap-s").value, blocked = $("ap-block").checked;
      const r = simulate(mode, S, blocked);
      if (!$("ap-keep").checked) traces = [];
      traces.push({ name: `${mode === "pulse" ? "Pulse" : "Hold"} ${S}${blocked ? " +blocker" : ""}`, pts: r.pts });
      if (traces.length > 4) traces.shift();
      $("ap-peak").textContent = Math.round(r.peak); $("ap-n").textContent = r.n; $("ap-f").textContent = mode === "hold" ? r.rate : "n/a";
      draw();
    });
    $("ap-clr").addEventListener("click", () => { traces = []; draw(); });
    Bio.live(draw);
  };

  /* ---------- Glucose homeostasis ---------- */
  function glucoseSim(o) {
    const sens = { healthy: 1, t1: 1, t2: 0.4 }[o.mode];
    let G = o.mode === "t1" ? (o.basal ? 95 : 190) : o.mode === "t2" ? 112 : 90;
    let I = o.mode === "t1" ? 2 : 10, P = 0, Ii = 0;
    const meals = [[60, o.meal], [300, o.meal]], G_ = [], I_ = [];
    for (let t = 0; t <= 480; t++) {
      let Ra = 0;
      for (const [t0, A] of meals) if (t >= t0) { const s = t - t0, tau = 35; Ra += (A * s * Math.exp(-s / tau)) / (tau * tau); }
      let Itar = o.mode === "t1" ? (o.basal ? 10 : 2) : 10 + (o.mode === "t2" ? 1.8 : 1.2) * Math.max(0, G - 90);
      if (o.mode === "t2") Itar = Math.min(Itar, 120);
      I += (Itar - I) / 12;
      if (o.dose && (t === 55 || t === 295)) P += o.dose;
      const rel = P / 40; P -= rel; Ii += rel * 14 - Ii / 40;
      const Ie = I + Ii;
      const ex = o.ex && ((t >= 90 && t < 150) || (t >= 330 && t < 390)) ? 0.012 : 0;
      const up = (0.015 + ex + 0.0015 * sens * Ie) * G + 0.03 * Math.max(0, G - 180);
      const hgp = Math.max(0, 3.45 - 0.075 * sens * Ie);
      G = Math.max(20, G + Ra + hgp - up);
      if (t % 5 === 0) { G_.push([t / 60, G]); I_.push([t / 60, Ie]); }
    }
    return { G: G_, I: I_ };
  }

  Bio.labs.glucose = function (el) {
    el.innerHTML = `
      <h3>Lab 9C · Blood Sugar: A Negative Feedback Loop</h3>
      <p>This model simulates 8 hours of blood glucose and insulin, with meals at hour 1 and hour 5. In a healthy body, the pancreas releases insulin when glucose rises, bringing it back to ~90 mg/dL. See what happens when that feedback loop breaks.</p>
      <div class="lab-controls">
        <div class="ctl"><label for="gl-mode">Person</label><select id="gl-mode"><option value="healthy">Healthy</option><option value="t2">Type 2 diabetes (insulin resistance)</option><option value="t1">Type 1 diabetes (no insulin made)</option></select></div>
        <div class="ctl"><label>Meal size (carbohydrate) <output id="gl-mv"></output></label><input type="range" id="gl-m" min="0" max="4000" step="100" value="2100"></div>
        <div class="ctl"><label style="justify-content:flex-start;gap:8px;font-weight:400"><input type="checkbox" id="gl-ex"> 1 hour of exercise after each meal</label></div>
      </div>
      <div class="lab-controls" id="gl-t1" hidden>
        <div class="ctl"><label style="justify-content:flex-start;gap:8px;font-weight:400"><input type="checkbox" id="gl-basal"> Long-acting (basal) insulin</label></div>
        <div class="ctl"><label>Rapid-acting insulin with each meal <output id="gl-dv"></output></label><input type="range" id="gl-d" min="0" max="16" value="0"></div>
      </div>
      <canvas id="gl-cv" style="height:300px"></canvas>
      <div class="readout"><div><b id="gl-max">—</b><span>Peak glucose (mg/dL)</span></div><div><b id="gl-min">—</b><span>Lowest glucose (mg/dL)</span></div><div><b id="gl-tir">—</b><span>Time in 70–180 range</span></div></div>
      <p class="small muted">Simplified teaching model with arbitrary meal units; real physiology is more complex. Never use it for medical decisions. Insulin is plotted in µU/mL (dashed).</p>
      ${Bio.worksheet("w9-glu", [
        "Describe the healthy person's response to a meal. Identify the stimulus, sensor, control center, effector and response in this negative feedback loop.",
        "Compare type 2 diabetes with healthy. Why is insulin HIGHER in type 2, yet glucose is still high?",
        "For type 1, add basal insulin, then find a meal dose that keeps glucose mostly between 70 and 180. What happens if you give too much? Why is low blood sugar dangerous?",
        "How does exercise affect blood glucose? Why is exercise recommended for managing type 2 diabetes?"
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    function draw() {
      const mode = $("gl-mode").value;
      $("gl-t1").hidden = mode !== "t1";
      $("gl-mv").textContent = $("gl-m").value; $("gl-dv").textContent = $("gl-d").value + " units";
      const r = glucoseSim({ mode, meal: +$("gl-m").value, ex: $("gl-ex").checked, basal: $("gl-basal").checked, dose: mode === "t1" ? +$("gl-d").value : 0 });
      const gs = r.G.map((p) => p[1]);
      $("gl-max").textContent = Math.round(Math.max(...gs));
      $("gl-min").textContent = Math.round(Math.min(...gs));
      $("gl-tir").textContent = Math.round((gs.filter((g) => g >= 70 && g <= 180).length / gs.length) * 100) + "%";
      Bio.chart($("gl-cv"), {
        series: [{ name: "Glucose (mg/dL)", points: r.G, noDots: true }, { name: "Insulin (µU/mL)", points: r.I, noDots: true, dashed: true, color: Bio.css("--c2") }],
        xLabel: "Time (hours)", yLabel: "mg/dL  ·  µU/mL", xMin: 0, xMax: 8, yMin: 0, yMax: Math.max(250, Math.ceil(Math.max(...gs) / 50) * 50),
        hLines: [{ y: 180, label: "180 (high)", color: Bio.css("--c3") }, { y: 70, label: "70 (low)", color: Bio.css("--bad") }]
      });
    }
    el.addEventListener("input", draw);
    el.addEventListener("change", draw);
    Bio.live(draw);
  };
})();
