/* Week 8 labs: natural selection (peppered moths), gel electrophoresis forensics, PCR, Hardy–Weinberg. */
(function () {
  const Bio = window.Bio;

  /* ---------- Natural selection ---------- */
  Bio.labs.selection = function (el) {
    el.innerHTML = `
      <h3>Lab 8A · Natural Selection: The Peppered Moth</h3>
      <p>During England's Industrial Revolution, soot darkened tree bark, and dark moths (allele <strong>D</strong>, dominant) went from rare to common because birds spotted light moths (<strong>dd</strong>) more easily. After clean-air laws, the trend reversed. Recreate it, and see how population size changes the role of chance.</p>
      <div class="lab-controls">
        <div class="ctl"><label for="ns-bg">Tree bark</label><select id="ns-bg"><option value="sooty">Sooty (dark) bark</option><option value="clean">Clean (light, lichen) bark</option></select></div>
        <div class="ctl"><label>Bird predation strength <output id="ns-sv"></output></label><input type="range" id="ns-s" min="0" max="60" value="30"></div>
        <div class="ctl"><label>Population size <output id="ns-nv"></output></label><input type="range" id="ns-n" min="10" max="1000" step="10" value="500"></div>
        <div class="ctl"><label>Starting D allele frequency <output id="ns-pv"></output></label><input type="range" id="ns-p" min="0.01" max="0.99" step="0.01" value="0.05"></div>
      </div>
      <div class="btn-row"><button class="btn primary" id="ns-run">▶ Run 50 generations</button><button class="btn" id="ns-step">+1 generation</button><button class="btn" id="ns-new">New population</button><button class="btn small" id="ns-clear">Clear graph</button></div>
      <div class="two-col">
        <svg class="stage" id="ns-svg" viewBox="0 0 300 200" role="img" aria-label="Moths resting on bark"></svg>
        <div class="readout" style="align-content:start"><div><b id="ns-g">0</b><span>Generation</span></div><div><b id="ns-f">—</b><span>Frequency of D allele</span></div><div><b id="ns-d">—</b><span>% dark moths</span></div></div>
      </div>
      <canvas id="ns-cv"></canvas>
      ${Bio.worksheet("w8-sel", [
        "Run with sooty bark, predation 30, N = 500, starting D = 0.05. Describe the curve. Why does it rise slowly at first, then quickly?",
        "Now set predation to 0 (no selection) and N = 20. Run several times (use New population). What happens to the D allele? What is this process called?",
        "Repeat with N = 1000 and predation 0. How does population size affect genetic drift?",
        "Switch to clean bark with D starting high (0.9). Does the light allele ever fully disappear? Why is it hard for selection to eliminate a recessive allele? (Hint: where does it hide?)",
        "Explain why it is wrong to say the moths 'changed color in order to survive'."
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    let p, gen, series = [], cur;
    const label = () => `${$("ns-bg").value === "sooty" ? "Sooty" : "Clean"}, s=${$("ns-s").value}%, N=${$("ns-n").value}`;
    function upd() { $("ns-sv").textContent = $("ns-s").value + "%"; $("ns-nv").textContent = $("ns-n").value; $("ns-pv").textContent = $("ns-p").value; }
    function fresh() {
      p = +$("ns-p").value; gen = 0;
      cur = { name: label(), points: [[0, p]] };
      series.push(cur); if (series.length > 4) series.shift();
      show();
    }
    function step() {
      const N = +$("ns-n").value, s = +$("ns-s").value / 100, sooty = $("ns-bg").value === "sooty";
      // Random mating: sample genotypes for N individuals (drift), then selection
      let alleleD = 0, total = 0;
      for (let k = 0; k < N; k++) {
        const a = Math.random() < p, b = Math.random() < p;
        const dark = a || b;
        const conspicuous = sooty ? !dark : dark;
        const survive = Math.random() > (conspicuous ? s : s * 0.15);
        if (survive) { alleleD += (a ? 1 : 0) + (b ? 1 : 0); total += 2; }
      }
      p = total ? alleleD / total : p;
      gen++;
      cur.points.push([gen, p]);
      show();
    }
    function show() {
      $("ns-g").textContent = gen; $("ns-f").textContent = p.toFixed(3); $("ns-d").textContent = Math.round((1 - (1 - p) ** 2) * 100) + "%";
      const sooty = $("ns-bg").value === "sooty";
      let s = `<rect width="300" height="200" fill="${sooty ? "#3b3631" : "#d8d2bf"}"/>`;
      for (let k = 0; k < 18; k++) s += `<path d="M${k * 18} 0 q${8} 100 0 200" stroke="${sooty ? "#2a2622" : "#bfb69c"}" stroke-width="5" fill="none"/>`;
      if (!sooty) for (let k = 0; k < 30; k++) s += `<circle cx="${(k * 97) % 300}" cy="${(k * 53) % 200}" r="6" fill="#a7b48a" opacity=".6"/>`;
      const fDark = 1 - (1 - p) ** 2;
      for (let k = 0; k < 40; k++) {
        const x = 15 + ((k * 71) % 270), y = 12 + ((k * 37) % 176), dark = (k * 0.6180339) % 1 < fDark;
        const c = dark ? "#1d1b19" : "#efeadb";
        s += `<g transform="translate(${x} ${y}) rotate(${(k * 47) % 360})"><ellipse rx="9" ry="5" fill="${c}" stroke="${dark ? "#000" : "#999"}" stroke-width=".6"/><ellipse cx="-4" cy="0" rx="3" ry="7" fill="${c}" opacity=".9"/><ellipse cx="4" cy="0" rx="3" ry="7" fill="${c}" opacity=".9"/></g>`;
      }
      $("ns-svg").innerHTML = s;
      draw();
    }
    function draw() { Bio.chart($("ns-cv"), { series, xLabel: "Generation", yLabel: "Frequency of D allele", yMin: 0, yMax: 1, xMin: 0, xMax: Math.max(50, gen), legend: true }); }
    $("ns-run").addEventListener("click", () => { let k = 0; const t = setInterval(() => { step(); if (++k >= 50) clearInterval(t); }, 40); });
    $("ns-step").addEventListener("click", step);
    $("ns-new").addEventListener("click", fresh);
    $("ns-clear").addEventListener("click", () => { series = []; fresh(); });
    el.addEventListener("input", upd);
    $("ns-bg").addEventListener("change", () => { cur.name = label() + " (changed)"; show(); });
    upd(); fresh();
    Bio.live(draw);
  };

  /* ---------- Gel electrophoresis ---------- */
  Bio.labs.gel = function (el) {
    const LADDER = [10000, 5000, 3000, 2000, 1500, 1000, 700, 500, 300, 200, 100];
    el.innerHTML = `
      <h3>Lab 8B · Forensic Gel Electrophoresis</h3>
      <p>A burglar left a drop of blood at a crime scene. DNA from the scene and from four suspects was copied by PCR and cut with the same restriction enzyme. Load the gel, run the current, and compare the band patterns. DNA is negatively charged, so it runs toward the <strong>positive</strong> electrode, and <strong>smaller fragments travel farther</strong>.</p>
      <div class="lab-controls"><div class="ctl"><label>Run time <output id="gl-tv">0 min</output></label><input type="range" id="gl-t" min="0" max="45" value="0"></div></div>
      <div class="btn-row"><button class="btn primary" id="gl-run">⚡ Run gel</button><button class="btn" id="gl-case">New case</button></div>
      <svg class="stage" id="gl-svg" viewBox="0 0 520 330" role="img" aria-label="Agarose gel with DNA bands"></svg>
      <div class="lab-output">Which suspect's DNA matches the crime scene? <span class="chips" id="gl-ans" style="display:inline-flex"></span><div class="feedback" id="gl-fb"></div></div>
      ${Bio.worksheet("w8-gel", [
        "Why does DNA move toward the positive electrode? Why do small fragments move farther?",
        "Use the ladder to estimate the sizes of the crime-scene bands.",
        "Why must the same restriction enzyme be used on every sample?",
        "Real forensic labs analyze about 20 highly variable regions called STRs. Why is matching many regions much stronger evidence than matching one?"
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    let lanes, culprit;
    const pick = () => { const n = Bio.randInt(3, 5), s = new Set(); while (s.size < n) s.add(Math.round(Bio.rand(150, 8000) / 10) * 10); return [...s]; };
    function newCase() {
      const sus = [0, 1, 2, 3].map(pick);
      culprit = Bio.randInt(0, 3);
      lanes = [{ name: "Ladder", f: LADDER }, { name: "Scene", f: sus[culprit] }, ...sus.map((f, i) => ({ name: "Susp. " + (i + 1), f }))];
      $("gl-t").value = 0; $("gl-fb").textContent = "";
      $("gl-ans").innerHTML = [1, 2, 3, 4].map((i) => `<button class="chip" data-s="${i - 1}">Suspect ${i}</button>`).join("");
      Bio.$$("[data-s]", el).forEach((b) => b.addEventListener("click", () => {
        if (+$("gl-t").value < 25) { $("gl-fb").className = "feedback bad"; $("gl-fb").textContent = "Run the gel longer so the bands separate before deciding."; return; }
        const ok = +b.dataset.s === culprit;
        b.classList.add(ok ? "ok" : "no");
        $("gl-fb").className = "feedback " + (ok ? "good" : "bad");
        $("gl-fb").textContent = ok ? `✓ Every band of Suspect ${culprit + 1} lines up with the scene sample: a match.` : "✗ Some bands don't line up. A match requires every band to match.";
      }));
      draw();
    }
    function draw() {
      const t = +$("gl-t").value / 45;
      $("gl-tv").textContent = $("gl-t").value + " min";
      const W = 520, top = 40, len = 232, lw = 70;
      let s = `<rect x="10" y="10" width="${W - 20}" height="310" rx="10" fill="#cfe0ea" opacity=".55" stroke="currentColor" stroke-opacity=".3"/>`;
      s += `<text x="${W / 2}" y="28" text-anchor="middle" font-size="12" fill="currentColor">− wells (negative electrode)</text><text x="${W / 2}" y="316" text-anchor="middle" font-size="12" fill="currentColor">+ positive electrode</text>`;
      lanes.forEach((ln, i) => {
        const x = 30 + i * (lw + 10);
        s += `<rect x="${x + 8}" y="${top}" width="${lw - 16}" height="8" fill="#555" opacity=".6"/><text x="${x + lw / 2}" y="${top - 2}" text-anchor="middle" font-size="10" fill="currentColor"></text>`;
        s += `<text x="${x + lw / 2}" y="${top + len + 24}" text-anchor="middle" font-size="11" fill="currentColor">${ln.name}</text>`;
        ln.f.forEach((bp) => {
          const mob = (Math.log10(12000) - Math.log10(bp)) / (Math.log10(12000) - Math.log10(80)); // 0..1
          const y = top + 10 + mob * len * t;
          s += `<rect x="${x + 8}" y="${y}" width="${lw - 16}" height="4" rx="2" fill="${i === 0 ? "#6b4fbb" : "#0f7b62"}" opacity="${0.55 + 0.45 * Math.min(1, t * 2)}"/>`;
          if (i === 0 && t > 0.6) s += `<text x="${x + 4}" y="${y + 4}" text-anchor="end" font-size="8" fill="currentColor">${bp}</text>`;
        });
      });
      $("gl-svg").innerHTML = s;
    }
    $("gl-t").addEventListener("input", draw);
    $("gl-run").addEventListener("click", () => { const r = $("gl-t"); const iv = setInterval(() => { r.value = +r.value + 1; draw(); if (+r.value >= 45) clearInterval(iv); }, 50); });
    $("gl-case").addEventListener("click", newCase);
    newCase();
  };

  /* ---------- PCR ---------- */
  Bio.labs.pcr = function (el) {
    el.innerHTML = `
      <h3>Lab 8C · PCR: Copying DNA Exponentially</h3>
      <p>Each PCR cycle has three temperature steps (denature at 95 °C, anneal primers at ~60 °C, extend at 72 °C) and roughly <strong>doubles</strong> the target DNA. Set your starting copies and cycles.</p>
      <div class="lab-controls">
        <div class="ctl"><label>Starting copies <output id="pc-sv"></output></label><input type="range" id="pc-s" min="1" max="100" value="1"></div>
        <div class="ctl"><label>Cycles <output id="pc-cv"></output></label><input type="range" id="pc-c" min="0" max="40" value="30"></div>
        <div class="ctl"><label>Efficiency per cycle <output id="pc-ev"></output></label><input type="range" id="pc-e" min="50" max="100" value="100"></div>
      </div>
      <div class="readout"><div><b id="pc-n"></b><span>Copies after cycling</span></div><div><b id="pc-time"></b><span>Approximate run time</span></div></div>
      <canvas id="pc-cv2"></canvas>
      <label class="small" style="font-weight:400"><input type="checkbox" id="pc-log"> Logarithmic y-axis (log₁₀ copies)</label>
      ${Bio.worksheet("w8-pcr", [
        "How many copies come from 1 starting molecule after 30 perfect cycles? Show the math as a power of 2.",
        "Why does PCR need a heat-stable polymerase like Taq (recall the Week 2 enzyme lab)?",
        "COVID-19 PCR tests report a 'Ct value': the cycle at which the signal crosses a threshold. Would a sample with MORE virus have a lower or higher Ct? Explain."
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    function draw() {
      const s0 = +$("pc-s").value, c = +$("pc-c").value, e = +$("pc-e").value / 100, lg = $("pc-log").checked;
      $("pc-sv").textContent = s0; $("pc-cv").textContent = c; $("pc-ev").textContent = Math.round(e * 100) + "%";
      const n = s0 * Math.pow(1 + e, c);
      $("pc-n").textContent = n >= 1e6 ? n.toExponential(2) : Math.round(n).toLocaleString();
      $("pc-time").textContent = Math.round(c * 2.5) + " min";
      const pts = []; for (let k = 0; k <= c; k++) { const v = s0 * Math.pow(1 + e, k); pts.push([k, lg ? Math.log10(v) : v]); }
      Bio.chart($("pc-cv2"), { series: [{ name: "Copies", points: pts }], xLabel: "Cycle", yLabel: lg ? "log₁₀(copies)" : "Copies", xMin: 0, xMax: Math.max(1, c), yMin: 0 });
    }
    el.addEventListener("input", draw);
    Bio.live(draw);
  };

  /* ---------- Hardy–Weinberg ---------- */
  Bio.labs.hardy = function (el) {
    el.innerHTML = `
      <h3>Lab 8D · Hardy–Weinberg Calculator</h3>
      <p>If a population isn't evolving, allele and genotype frequencies stay constant: <strong>p + q = 1</strong> and <strong>p² + 2pq + q² = 1</strong>. For a recessive condition, the frequency of affected people equals q², and that's all you need.</p>
      <div class="lab-controls"><div class="ctl"><label for="hw-in">Affected people: 1 in …</label><input type="number" id="hw-in" value="2500" min="1"></div></div>
      <div class="btn-row small"><span class="muted">Examples (approximate, population-specific):</span><button class="btn small" data-v="2500">Cystic fibrosis (N. European): 1 in 2,500</button><button class="btn small" data-v="365">Sickle-cell disease (African American births): 1 in 365</button><button class="btn small" data-v="10000">PKU: 1 in 10,000</button></div>
      <div class="readout"><div><b id="hw-q"></b><span>q (recessive allele)</span></div><div><b id="hw-p"></b><span>p (dominant allele)</span></div><div><b id="hw-c"></b><span>Carriers (2pq)</span></div><div><b id="hw-r"></b><span>Carriers per affected person</span></div></div>
      ${Bio.worksheet("w8-hw", ["For cystic fibrosis at 1 in 2,500, what fraction of people are carriers? Why are carriers so much more common than affected people?", "List the five conditions for Hardy–Weinberg equilibrium. Which is violated by the peppered moths?"])}`;
    const $ = (id) => Bio.$("#" + id, el);
    function calc() {
      const n = Math.max(1, +$("hw-in").value || 1), q2 = 1 / n, q = Math.sqrt(q2), p = 1 - q, c = 2 * p * q;
      $("hw-q").textContent = q.toFixed(4); $("hw-p").textContent = p.toFixed(4);
      $("hw-c").textContent = `${(c * 100).toFixed(2)}% (1 in ${Math.round(1 / c)})`;
      $("hw-r").textContent = Math.round(c / q2).toLocaleString();
    }
    $("hw-in").addEventListener("input", calc);
    Bio.$$("[data-v]", el).forEach((b) => b.addEventListener("click", () => { $("hw-in").value = b.dataset.v; calc(); }));
    calc();
  };
})();
