/* Week 4 labs: cellular respiration stepper and photosynthesis (pondweed) simulator. */
(function () {
  const Bio = window.Bio;

  Bio.labs.respiration = function (el) {
    const STAGES_O2 = [
      { name: "Glycolysis", where: "Cytoplasm", loc: "cyto", d: "Glucose (6 carbons) is split into two pyruvate (3 carbons each). It invests 2 ATP and makes 4 ATP, a net gain of +2, and loads 2 NADH with electrons. No oxygen needed.", add: { ATP: 2, NADH: 2 } },
      { name: "Pyruvate oxidation", where: "Mitochondrial matrix", loc: "matrix", d: "Each pyruvate enters the mitochondrion, loses one carbon as CO₂, and becomes acetyl-CoA. ×2 per glucose.", add: { NADH: 2, CO2: 2 } },
      { name: "Krebs (citric acid) cycle", where: "Mitochondrial matrix", loc: "matrix", d: "Each acetyl-CoA is fully broken down to CO₂. The cycle turns twice per glucose, harvesting electrons into NADH and FADH₂. This is where the CO₂ you exhale comes from.", add: { ATP: 2, NADH: 6, FADH2: 2, CO2: 4 } },
      { name: "Electron transport chain & chemiosmosis", where: "Inner mitochondrial membrane", loc: "inner", d: "NADH and FADH₂ hand their electrons to a chain of proteins. The energy pumps H⁺ ions into the intermembrane space. H⁺ flows back through ATP synthase, spinning it like a turbine to make ~28 ATP. Oxygen is the final electron acceptor and becomes water.", add: { ATP: 28, O2: 6, H2O: 6 }, spend: true }
    ];
    const STAGES_NO = [
      STAGES_O2[0],
      { name: "Fermentation", where: "Cytoplasm", loc: "cyto", d: "With no O₂, the electron transport chain stops and NADH piles up. To keep glycolysis running, pyruvate accepts the electrons from NADH, regenerating NAD⁺. Human muscle makes <strong>lactate</strong>; yeast make <strong>ethanol + CO₂</strong>. No extra ATP is made.", add: {}, ferment: true }
    ];
    el.innerHTML = `
      <h3>Lab 4A · Follow a Glucose Molecule</h3>
      <p>Step one glucose molecule through cellular respiration and watch the energy tally build. Then remove oxygen and compare.</p>
      <div class="btn-row"><button class="chip sel" data-o="1">🫁 Oxygen present (aerobic)</button><button class="chip" data-o="0">🚫 No oxygen (anaerobic)</button>
        <select id="rs-org" aria-label="Organism" hidden><option value="muscle">Human muscle cell</option><option value="yeast">Yeast cell</option></select></div>
      <div class="two-col">
        <svg class="stage" viewBox="0 0 320 220" id="rs-svg" role="img" aria-label="Cell with mitochondrion; the current stage location is highlighted">
          <rect x="6" y="6" width="308" height="208" rx="30" style="fill:var(--surface)" stroke="currentColor" stroke-opacity=".4"/>
          <rect id="rs-cyto" x="6" y="6" width="308" height="208" rx="30" fill="#f2b84b" opacity="0"/>
          <ellipse cx="200" cy="120" rx="95" ry="60" fill="#f6c7a4" stroke="#a24f10" stroke-width="3"/>
          <path id="rs-inner" d="M120 120 q10 -40 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="#a24f10" stroke-width="3"/>
          <ellipse id="rs-matrix" cx="200" cy="120" rx="80" ry="45" fill="#3cc49f" opacity="0"/>
          <text x="20" y="34" font-size="13" fill="currentColor">cytoplasm</text><text x="150" y="196" font-size="13" fill="currentColor">mitochondrion</text>
        </svg>
        <div class="lab-output" id="rs-info"><strong>Press “Next step” to begin.</strong><p class="small">Starting with 1 glucose (C₆H₁₂O₆).</p></div>
      </div>
      <div class="readout">
        <div><b id="rs-ATP">0</b><span>ATP (net)</span></div><div><b id="rs-NADH">0</b><span>NADH</span></div><div><b id="rs-FADH2">0</b><span>FADH₂</span></div>
        <div><b id="rs-CO2">0</b><span>CO₂ released</span></div><div><b id="rs-O2">0</b><span>O₂ used</span></div><div><b id="rs-H2O">0</b><span>H₂O made</span></div>
      </div>
      <div class="btn-row"><button class="btn primary" id="rs-next">Next step ▶</button><button class="btn" id="rs-reset">Reset</button></div>
      <canvas id="rs-cv" style="height:220px"></canvas>
      ${Bio.worksheet("w4-resp", [
        "Complete the equation and label where each reactant enters and each product leaves: C₆H₁₂O₆ + 6O₂ → ? + ? + ~32 ATP",
        "Compare ATP from aerobic respiration vs. fermentation. Why do your muscles switch to fermentation during a sprint even though it's so inefficient?",
        "Where does the carbon in the CO₂ you exhale come from? Where does the oxygen you inhale end up?",
        "Why is cyanide (which blocks the electron transport chain) deadly, even though glycolysis still works?"
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    let o2 = true, step = 0, tally, runs = { aerobic: null, anaerobic: null };
    const reset = () => { step = 0; tally = { ATP: 0, NADH: 0, FADH2: 0, CO2: 0, O2: 0, H2O: 0 }; show(); hl(null); $("rs-info").innerHTML = "<strong>Press “Next step” to begin.</strong><p class='small'>Starting with 1 glucose (C₆H₁₂O₆).</p>"; };
    function hl(loc) {
      $("rs-cyto").setAttribute("opacity", loc === "cyto" ? ".35" : "0");
      $("rs-matrix").setAttribute("opacity", loc === "matrix" ? ".5" : "0");
      $("rs-inner").setAttribute("stroke", loc === "inner" ? "#ff3d7f" : "#a24f10");
      $("rs-inner").setAttribute("stroke-width", loc === "inner" ? "6" : "3");
    }
    function show() { Object.keys(tally).forEach((k) => ($("rs-" + k).textContent = tally[k])); drawChart(); }
    function drawChart() {
      const bars = [];
      if (runs.aerobic != null) bars.push({ label: "Aerobic", value: runs.aerobic });
      if (runs.anaerobic != null) bars.push({ label: "Fermentation", value: runs.anaerobic, color: Bio.css("--c3") });
      if (!bars.length) bars.push({ label: "Finish a run to compare", value: 0 });
      Bio.chart($("rs-cv"), { type: "bar", bars, yLabel: "ATP per glucose", yMax: 35 });
    }
    $("rs-next").addEventListener("click", () => {
      const stages = o2 ? STAGES_O2 : STAGES_NO;
      if (step >= stages.length) { reset(); return; }
      const s = stages[step];
      Object.entries(s.add).forEach(([k, v]) => (tally[k] += v));
      let extra = "";
      if (s.spend) { extra = `<p class="small">10 NADH × ~2.5 ATP + 2 FADH₂ × ~1.5 ATP ≈ 28 ATP. The carriers are now empty again.</p>`; tally.NADH = 0; tally.FADH2 = 0; }
      if (s.ferment) {
        tally.NADH = 0;
        const yeast = $("rs-org").value === "yeast";
        if (yeast) tally.CO2 += 2;
        extra = `<p class="small">Product: <strong>${yeast ? "2 ethanol + 2 CO₂ (this is how bread rises!)" : "2 lactate"}</strong>.</p>`;
      }
      hl(s.loc);
      step++;
      const done = step >= stages.length;
      if (done) runs[o2 ? "aerobic" : "anaerobic"] = tally.ATP;
      $("rs-info").innerHTML = `<span class="pill">Step ${step} of ${stages.length}</span> <span class="pill purple">${s.where}</span><h4 style="margin:.5em 0">${s.name}</h4><p>${s.d}</p>${extra}${done ? `<p><strong>Total: ~${tally.ATP} ATP per glucose.</strong> Press Next to start over.</p>` : ""}`;
      show();
    });
    $("rs-reset").addEventListener("click", reset);
    Bio.$$("[data-o]", el).forEach((b) => b.addEventListener("click", () => {
      o2 = b.dataset.o === "1"; Bio.$$("[data-o]", el).forEach((x) => x.classList.toggle("sel", x === b));
      $("rs-org").hidden = o2; reset();
    }));
    reset();
    Bio.live(drawChart);
  };

  /* ---------- Photosynthesis: pondweed bubbles ---------- */
  Bio.labs.photosynthesis = function (el) {
    el.innerHTML = `
      <h3>Lab 4B · Pondweed Photosynthesis</h3>
      <p>A sprig of pondweed (<em>Elodea</em>) releases O₂ bubbles as it photosynthesizes. Count bubbles per minute while changing light, CO₂ and temperature. Can you find the <strong>limiting factor</strong>?</p>
      <div class="lab-controls">
        <div class="ctl"><label>Light intensity <output id="ps-lv"></output></label><input type="range" id="ps-l" min="0" max="100" value="40"></div>
        <div class="ctl"><label>CO₂ (baking soda in water) <output id="ps-cv2"></output></label><input type="range" id="ps-c" min="0" max="100" value="30"></div>
        <div class="ctl"><label>Temperature <output id="ps-tv"></output></label><input type="range" id="ps-t" min="0" max="50" value="22"></div>
        <div class="ctl"><label for="ps-col">Light color</label><select id="ps-col"><option value="1">White</option><option value="0.95">Red</option><option value="0.85">Blue</option><option value="0.25">Green</option></select></div>
      </div>
      <div class="two-col">
        <svg class="stage" viewBox="0 0 300 260" id="ps-svg" role="img" aria-label="Beaker with pondweed releasing bubbles"></svg>
        <div>
          <div class="readout"><div><b id="ps-r">0</b><span>Bubbles per minute</span></div><div><b id="ps-lim">—</b><span>Limiting factor now</span></div></div>
          <div class="field"><label for="ps-x">Variable you're testing</label><select id="ps-x"><option value="l">Light intensity</option><option value="c">CO₂</option><option value="t">Temperature</option></select></div>
          <div class="btn-row"><button class="btn primary" id="ps-rec">● Count for 1 minute & record</button><button class="btn small" id="ps-clr">Clear</button></div>
        </div>
      </div>
      <canvas id="ps-cv"></canvas>
      ${Bio.worksheet("w4-photo", [
        "Investigate light intensity with CO₂ low (20) and again with CO₂ high (90). Sketch or describe both curves. Why does each level off?",
        "Explain what a 'limiting factor' is, using your data as an example.",
        "Why does the rate fall at very high temperatures?",
        "Green light produces very few bubbles. Explain why, using the color of chlorophyll.",
        "Greenhouse growers often pump in extra CO₂. Use your data to explain why this works."
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    let data = [], bubbles = [], acc = 0, lastT = performance.now();
    function vals() { return { l: +$("ps-l").value, c: +$("ps-c").value, t: +$("ps-t").value, col: +$("ps-col").value }; }
    function model(v) {
      const lightTerm = 60 * v.col * (v.l / 100);
      const co2Term = 8 + 52 * (v.c / (v.c + 25)) * 1.25;
      const tf = v.t <= 30 ? Math.pow(2, (v.t - 30) / 10) : Math.exp(-Math.pow((v.t - 30) / 8, 2));
      const tempTerm = 60 * tf;
      const r = Math.max(0, Math.min(lightTerm, co2Term, tempTerm));
      const lim = r === lightTerm ? "Light" : r === co2Term ? "CO₂" : "Temperature";
      return { r, lim };
    }
    function update() {
      const v = vals();
      $("ps-lv").textContent = v.l + "%"; $("ps-cv2").textContent = v.c + "%"; $("ps-tv").textContent = v.t + " °C";
      const m = model(v);
      $("ps-r").textContent = Math.round(m.r);
      $("ps-lim").textContent = m.r < 1 ? (v.l === 0 ? "Light" : "—") : m.lim;
    }
    function scene() {
      const v = vals(), glow = v.l / 100;
      const lc = { 1: "#fff6b0", 0.95: "#ff8a80", 0.85: "#82b1ff", 0.25: "#a5d6a7" }[String(v.col)] || "#fff6b0";
      let s = `<circle cx="40" cy="40" r="${14 + glow * 10}" fill="${lc}" opacity="${0.25 + glow * 0.75}"/><text x="40" y="80" text-anchor="middle" font-size="11" fill="currentColor">lamp</text>
        <rect x="90" y="40" width="160" height="200" rx="10" fill="#bfe3f2" fill-opacity=".55" stroke="currentColor" stroke-opacity=".5"/>
        <path d="M170 235 q-8 -40 0 -80 q8 -40 -4 -80" stroke="#2e8b57" stroke-width="5" fill="none"/>
        ${[0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="${170 + (i % 2 ? 12 : -12)}" cy="${215 - i * 28}" rx="13" ry="5" fill="#3e9b4f" transform="rotate(${i % 2 ? -25 : 25} ${170 + (i % 2 ? 12 : -12)} ${215 - i * 28})"/>`).join("")}`;
      bubbles.forEach((b) => (s += `<circle cx="${b.x}" cy="${b.y}" r="${b.r}" fill="#fff" stroke="#5aa9cf" stroke-width="1"/>`));
      $("ps-svg").innerHTML = s;
    }
    function tick(now) {
      const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
      if (el.offsetParent !== null) {
        const r = model(vals()).r; // bubbles per minute; animation runs 4x speed
        acc += (r / 60) * dt * 4;
        while (acc >= 1) { acc -= 1; bubbles.push({ x: 166 + Bio.rand(-6, 6), y: 80 + Bio.rand(0, 20), r: Bio.rand(2.5, 4.5) }); }
        bubbles.forEach((b) => { b.y -= 60 * dt; b.x += Bio.rand(-0.4, 0.4); });
        bubbles = bubbles.filter((b) => b.y > 44);
        scene();
      }
      requestAnimationFrame(tick);
    }
    function draw() {
      const x = $("ps-x").value, labels = { l: "Light intensity (%)", c: "CO₂ (%)", t: "Temperature (°C)" };
      const groups = {};
      data.filter((d) => d.x === x).forEach((d) => { (groups[d.series] = groups[d.series] || []).push([d.xv, d.r]); });
      const series = Object.entries(groups).map(([name, points]) => ({ name, points }));
      Bio.chart($("ps-cv"), { series, xLabel: labels[x], yLabel: "Bubbles per minute", xMin: 0, xMax: x === "t" ? 50 : 100, yMin: 0, yMax: 70, legend: true });
    }
    $("ps-rec").addEventListener("click", () => {
      const v = vals(), x = $("ps-x").value;
      const r = Math.max(0, Math.round(model(v).r + Bio.gauss(0, 1.5)));
      const series = x === "l" ? `CO₂ ${v.c}%, ${v.t} °C` : x === "c" ? `Light ${v.l}%, ${v.t} °C` : `Light ${v.l}%, CO₂ ${v.c}%`;
      data.push({ x, xv: v[x], r, series });
      draw();
    });
    $("ps-clr").addEventListener("click", () => { data = []; draw(); });
    $("ps-x").addEventListener("change", draw);
    el.addEventListener("input", update);
    $("ps-col").addEventListener("change", update);
    update();
    requestAnimationFrame(tick);
    Bio.live(draw);
  };
})();
