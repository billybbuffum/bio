/* Week 1 labs: pH explorer and a virtual plant-growth experiment. */
(function () {
  const Bio = window.Bio;

  // Approximate universal-indicator and red-cabbage colors by pH
  const UNIVERSAL = [[0, "#d7191c"], [3, "#f46d2a"], [5, "#f7c32e"], [7, "#3fae49"], [9, "#2b7bba"], [11, "#3b3f9f"], [14, "#6a2c91"]];
  const CABBAGE = [[1, "#d01c3a"], [3, "#c23a7a"], [5, "#8e3c96"], [7, "#5b4aa8"], [8, "#3d6bc4"], [10, "#2a9a8a"], [12, "#9cc23a"], [14, "#e3d33b"]];
  function lerpColor(stops, x) {
    if (x <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
      if (x <= stops[i][0]) {
        const [x0, c0] = stops[i - 1], [x1, c1] = stops[i];
        const t = (x - x0) / (x1 - x0);
        const a = parseInt(c0.slice(1), 16), b = parseInt(c1.slice(1), 16);
        const ch = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
        return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
      }
    }
    return stops[stops.length - 1][1];
  }
  const SUBSTANCES = [
    ["Battery acid", 0.5], ["Stomach acid", 1.5], ["Lemon juice", 2.2], ["Cola", 2.5], ["Vinegar", 2.9], ["Orange juice", 3.5],
    ["Tomato", 4.3], ["Black coffee", 5], ["Urine (typical)", 6], ["Milk", 6.6], ["Pure water", 7], ["Human blood", 7.4],
    ["Sea water", 8.1], ["Baking soda", 8.3], ["Milk of magnesia", 10.5], ["Household ammonia", 11.5], ["Bleach", 12.5], ["Drain cleaner", 13.8]
  ];
  const sci = (x) => { const e = Math.floor(Math.log10(x)); const m = x / Math.pow(10, e); return `${m.toFixed(1)} × 10<sup>${e}</sup>`; };

  Bio.labs.ph = function (el) {
    el.innerHTML = `
      <h3>Lab 1A · The pH Explorer</h3>
      <p>Drag the slider or click a substance. Watch how the H⁺ concentration changes by <strong>10×</strong> for every step on the scale, and how the two indicators change color.</p>
      <div class="lab-controls"><div class="ctl"><label>pH <output id="ph-v">7.0</output></label><input type="range" id="ph-s" min="0" max="14" step="0.1" value="7"></div></div>
      <div class="two-col">
        <div>
          <div style="display:flex;gap:12px;align-items:center">
            <div style="flex:1;text-align:center"><div id="ph-u" style="height:90px;border-radius:12px;border:1px solid var(--border)"></div><div class="small muted">Universal indicator</div></div>
            <div style="flex:1;text-align:center"><div id="ph-c" style="height:90px;border-radius:12px;border:1px solid var(--border)"></div><div class="small muted">Red-cabbage indicator</div></div>
          </div>
          <div class="readout">
            <div><b id="ph-h"></b><span>[H⁺] mol/L</span></div>
            <div><b id="ph-oh"></b><span>[OH⁻] mol/L</span></div>
            <div><b id="ph-k"></b><span>Classification</span></div>
          </div>
          <p id="ph-rel" class="small"></p>
        </div>
        <div><div class="small muted" style="margin-bottom:4px">Common substances (approximate pH)</div><div class="chips" id="ph-list"></div></div>
      </div>
      <div class="lab-output">
        <strong>Challenge:</strong> <span id="ph-q"></span>
        <div class="btn-row"><input type="number" id="ph-a" placeholder="times" style="width:140px"><button class="btn small primary" id="ph-check">Check</button><button class="btn small" id="ph-new">New challenge</button></div>
        <div class="feedback" id="ph-fb"></div>
        <div class="small muted">Challenges solved: <span id="ph-n">0</span></div>
      </div>
      ${Bio.worksheet("w1-ph", [
        "Stomach acid is about pH 1.5 and blood is pH 7.4. Roughly how many times more H⁺ is in stomach acid? Show your reasoning.",
        "Your blood must stay between pH 7.35 and 7.45. Why might even a small pH change be dangerous? (Hint: think ahead to enzymes and proteins in Week 2.)",
        "Using the red-cabbage colors, predict what color baking soda and vinegar will turn your cabbage indicator in this week's practical."
      ])}`;
    const s = Bio.$("#ph-s", el);
    Bio.$("#ph-list", el).innerHTML = SUBSTANCES.map(([n, p]) => `<button class="chip" data-p="${p}">${n} <span class="muted">${p}</span></button>`).join("");
    function update() {
      const p = +s.value;
      Bio.$("#ph-v", el).textContent = p.toFixed(1);
      Bio.$("#ph-u", el).style.background = lerpColor(UNIVERSAL, p);
      Bio.$("#ph-c", el).style.background = lerpColor(CABBAGE, p);
      Bio.$("#ph-h", el).innerHTML = sci(Math.pow(10, -p));
      Bio.$("#ph-oh", el).innerHTML = sci(Math.pow(10, -(14 - p)));
      Bio.$("#ph-k", el).textContent = p < 6.95 ? "Acidic" : p > 7.05 ? "Basic" : "Neutral";
      const diff = Math.abs(7 - p);
      Bio.$("#ph-rel", el).innerHTML = diff < 0.05 ? "Neutral: [H⁺] = [OH⁻]." :
        `Compared with pure water, this has <strong>${Math.round(Math.pow(10, diff)).toLocaleString()}×</strong> ${p < 7 ? "more" : "less"} H⁺.`;
    }
    s.addEventListener("input", update);
    Bio.$("#ph-list", el).addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (b) { s.value = b.dataset.p; update(); } });

    let cur, solved = 0;
    function challenge() {
      const pick = Bio.shuffle(SUBSTANCES).slice(0, 2);
      let [a, b] = pick.map(([n, p]) => [n, Math.round(p)]);
      if (a[1] === b[1]) b = [b[0], b[1] + 1];
      if (a[1] > b[1]) [a, b] = [b, a];
      cur = { a, b, ans: Math.pow(10, b[1] - a[1]) };
      Bio.$("#ph-q", el).innerHTML = `Treat ${a[0]} as pH ${a[1]} and ${b[0]} as pH ${b[1]}. How many times more H⁺ does ${a[0]} have?`;
      Bio.$("#ph-fb", el).textContent = ""; Bio.$("#ph-a", el).value = "";
    }
    Bio.$("#ph-new", el).addEventListener("click", challenge);
    Bio.$("#ph-check", el).addEventListener("click", () => {
      const v = +Bio.$("#ph-a", el).value, fb = Bio.$("#ph-fb", el);
      if (v === cur.ans) { fb.className = "feedback good"; fb.textContent = `✓ Yes: 10^${cur.b[1] - cur.a[1]} = ${cur.ans.toLocaleString()}×.`; Bio.$("#ph-n", el).textContent = ++solved; }
      else { fb.className = "feedback bad"; fb.textContent = `✗ Not quite. The pH difference is ${cur.b[1] - cur.a[1]}; each unit is a factor of 10.`; }
    });
    update(); challenge();
  };

  /* ---------- Virtual experiment: fertilizer vs plant growth ---------- */
  Bio.labs.experiment = function (el) {
    const LEVELS = [0, 5, 10, 15, 20, 25];
    el.innerHTML = `
      <h3>Lab 1B · Design an Experiment: Does Fertilizer Help Bean Plants Grow?</h3>
      <p>You are the scientist. Choose which fertilizer doses to test, how many plants per group, and whether to control the other variables. Run the experiment, look at the data, and decide what you can honestly conclude. The simulation has a hidden "true" relationship plus realistic random variation between plants.</p>
      <div class="lab-controls">
        <div class="ctl"><label>Fertilizer doses to test (g/week)</label><div class="chips" id="ex-levels">${LEVELS.map((l) => `<button class="chip ${[0, 10].includes(l) ? "sel" : ""}" data-l="${l}">${l} g${l === 0 ? " (control)" : ""}</button>`).join("")}</div></div>
        <div class="ctl"><label>Plants per group <output id="ex-nv">3</output></label><input type="range" id="ex-n" min="1" max="40" value="3"></div>
        <div class="ctl"><label style="justify-content:flex-start;gap:8px;font-weight:400"><input type="checkbox" id="ex-ctrl"> Keep light, water and soil identical for all groups (control variables)</label></div>
      </div>
      <div class="btn-row"><button class="btn primary" id="ex-run">▶ Run experiment (3 weeks)</button><button class="btn" id="ex-rep">Repeat same design</button></div>
      <canvas id="ex-cv" aria-label="Plant height by fertilizer dose"></canvas>
      <div id="ex-out" class="lab-output small">Run the experiment to see results.</div>
      <p class="small muted">Runs completed: <span id="ex-runs">0</span>. Try at least: (1) n = 1 with two groups, run 3 times; (2) n = 30 with all six doses, controls ON; (3) controls OFF.</p>
      ${Bio.worksheet("w1-exp", [
        "State your hypothesis as an if…then statement before running anything.",
        "Identify the independent variable, the dependent variable, the control group, and three controlled variables.",
        "Run the experiment with 1 plant per group three times. Did your conclusion stay the same each time? What does this tell you about sample size?",
        "With 30+ plants per group and all six doses, describe the shape of the relationship. Is 'more fertilizer is always better' supported?",
        "Turn OFF the control variables and run again. Why can't you trust these results, even with a large sample?"
      ])}`;
    const cv = Bio.$("#ex-cv", el);
    let sel = new Set([0, 10]), last = null, runs = 0;
    const trueHeight = (f) => 18 + 1.6 * f - 0.065 * f * f; // peaks near 12 g, then fertilizer "burn"
    Bio.$("#ex-levels", el).addEventListener("click", (e) => {
      const b = e.target.closest("[data-l]"); if (!b) return;
      const l = +b.dataset.l; sel.has(l) ? sel.delete(l) : sel.add(l); b.classList.toggle("sel");
    });
    Bio.$("#ex-n", el).addEventListener("input", (e) => (Bio.$("#ex-nv", el).textContent = e.target.value));
    function run() {
      const levels = [...sel].sort((a, b) => a - b);
      if (!levels.length) { Bio.$("#ex-out", el).textContent = "Select at least one dose."; return; }
      const n = +Bio.$("#ex-n", el).value, ctrl = Bio.$("#ex-ctrl", el).checked;
      last = levels.map((f) => {
        const confound = ctrl ? 0 : Bio.gauss(0, 7); // uneven light/water per group
        const hs = Array.from({ length: n }, () => Math.max(2, Bio.gauss(trueHeight(f) + confound, 4.5)));
        const mean = hs.reduce((a, b) => a + b, 0) / n;
        const sd = n > 1 ? Math.sqrt(hs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
        return { f, hs, mean, sd };
      });
      runs++; Bio.$("#ex-runs", el).textContent = runs;
      draw();
      const best = last.reduce((a, b) => (b.mean > a.mean ? b : a));
      Bio.$("#ex-out", el).innerHTML = `<table class="simple"><tr><th>Dose (g)</th><th>n</th><th>Mean height (cm)</th><th>SD</th></tr>${last.map((g) => `<tr><td>${g.f}</td><td>${g.hs.length}</td><td>${g.mean.toFixed(1)}</td><td>${n > 1 ? g.sd.toFixed(1) : "—"}</td></tr>`).join("")}</table>
        Tallest group this run: <strong>${best.f} g</strong>. ${n < 5 ? "⚠️ With so few plants, random variation can easily mislead you." : ""} ${!ctrl ? "⚠️ Groups got different light/water, so differences may not be due to fertilizer (a confounding variable)." : ""}`;
    }
    function draw() {
      if (!last) { Bio.chart(cv, { series: [], xLabel: "Fertilizer (g/week)", yLabel: "Height (cm)", xMin: 0, xMax: 25, yMax: 50 }); return; }
      Bio.chart(cv, {
        xLabel: "Fertilizer (g/week)", yLabel: "Height after 3 weeks (cm)", xMin: 0, xMax: 25, yMin: 0, yMax: 60,
        series: [
          { name: "Plants", mode: "scatter", points: last.flatMap((g) => g.hs.map((h) => [g.f + Bio.rand(-0.6, 0.6), h])) },
          { name: "Mean", mode: "line", color: Bio.css("--c3"), points: last.map((g) => [g.f, g.mean]) }
        ]
      });
    }
    Bio.$("#ex-run", el).addEventListener("click", run);
    Bio.$("#ex-rep", el).addEventListener("click", run);
    Bio.live(draw);
  };
})();
