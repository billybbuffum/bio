/* Week 2 labs: enzyme activity simulator and biomolecule sorter. */
(function () {
  const Bio = window.Bio;

  const ENZYMES = {
    amylase: { name: "Salivary amylase (human mouth)", tOpt: 37, pHOpt: 6.8, km: 12, vmax: 100 },
    pepsin: { name: "Pepsin (human stomach)", tOpt: 37, pHOpt: 2.0, km: 8, vmax: 80 },
    taq: { name: "Taq polymerase (hot-spring bacterium)", tOpt: 72, pHOpt: 8.3, km: 15, vmax: 120 }
  };
  function rate(e, T, pH, S, I) {
    const below = 28, above = 9; // rises gently with temperature, then crashes as the enzyme denatures
    const w = T <= e.tOpt ? below : above;
    const fT = Math.exp(-Math.pow((T - e.tOpt) / w, 2));
    const fpH = Math.exp(-Math.pow((pH - e.pHOpt) / 1.6, 2));
    const km = e.km * (1 + I / 10); // competitive inhibitor raises apparent Km
    return e.vmax * fT * fpH * (S / (km + S));
  }

  Bio.labs.enzyme = function (el) {
    el.innerHTML = `
      <h3>Lab 2A · Enzyme Activity Simulator</h3>
      <p>An enzyme's speed depends on its environment. Pick an enzyme and an <strong>independent variable</strong> to investigate. Hold everything else constant, change your variable in steps, and press <em>Record</em> at each step to build a graph. Real measurements are noisy, and so are these.</p>
      <div class="lab-controls">
        <div class="ctl"><label for="en-e">Enzyme</label><select id="en-e">${Object.entries(ENZYMES).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join("")}</select></div>
        <div class="ctl"><label for="en-x">I am investigating…</label><select id="en-x"><option value="T">Temperature</option><option value="pH">pH</option><option value="S">Substrate concentration</option><option value="I">Inhibitor concentration</option></select></div>
      </div>
      <div class="lab-controls">
        <div class="ctl"><label>Temperature <output id="en-tv"></output></label><input type="range" id="en-t" min="0" max="100" value="37"></div>
        <div class="ctl"><label>pH <output id="en-pv"></output></label><input type="range" id="en-p" min="0" max="14" step="0.5" value="7"></div>
        <div class="ctl"><label>Substrate <output id="en-sv"></output></label><input type="range" id="en-s" min="0" max="100" value="50"></div>
        <div class="ctl"><label>Competitive inhibitor <output id="en-iv"></output></label><input type="range" id="en-i" min="0" max="50" value="0"></div>
      </div>
      <div class="readout">
        <div><b id="en-r">0</b><span>Reaction rate (µmol product/min)</span></div>
        <div><b id="en-st">—</b><span>Enzyme state</span></div>
      </div>
      <div class="progress" style="height:14px"><span id="en-bar"></span></div>
      <div class="btn-row"><button class="btn primary" id="en-rec">● Record data point</button><button class="btn" id="en-clr">Clear data</button><label style="font-weight:400"><input type="checkbox" id="en-model"> Show the model curve</label></div>
      <canvas id="en-cv"></canvas>
      <p class="small muted" id="en-n">0 points recorded.</p>
      ${Bio.worksheet("w2-enz", [
        "Investigate temperature for salivary amylase (keep pH 7, substrate 50). Describe the shape of your graph and give the optimum temperature.",
        "Why does the rate fall so steeply above the optimum, but rise only gradually below it? Use the words 'kinetic energy' and 'denature'.",
        "Now investigate pH for pepsin vs. amylase. Explain how each enzyme's optimum matches where it works in your body.",
        "Investigate substrate concentration. Why does the graph level off (plateau)?",
        "Taq polymerase comes from bacteria in hot springs. Why is it useful for PCR (a technique that heats DNA to 95 °C)? We'll meet PCR again in Week 8."
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    let data = [];
    const xMeta = { T: ["Temperature (°C)", 0, 100, "en-t"], pH: ["pH", 0, 14, "en-p"], S: ["Substrate (mM)", 0, 100, "en-s"], I: ["Inhibitor (mM)", 0, 50, "en-i"] };
    function vals() { return { e: ENZYMES[$("en-e").value], T: +$("en-t").value, pH: +$("en-p").value, S: +$("en-s").value, I: +$("en-i").value }; }
    function update() {
      const v = vals();
      $("en-tv").textContent = v.T + " °C"; $("en-pv").textContent = v.pH; $("en-sv").textContent = v.S + " mM"; $("en-iv").textContent = v.I + " mM";
      const r = rate(v.e, v.T, v.pH, v.S, v.I);
      $("en-r").textContent = r.toFixed(1);
      $("en-bar").style.width = Math.min(100, (r / 120) * 100) + "%";
      let st = "Working";
      if (v.T > v.e.tOpt + 12) st = "Denaturing 🔥";
      else if (Math.abs(v.pH - v.e.pHOpt) > 3) st = "Wrong pH: shape distorted";
      else if (v.T < 10) st = "Sluggish (cold) ❄️";
      else if (v.S === 0) st = "No substrate";
      else if (r > 0.85 * v.e.vmax) st = "Near maximum ✓";
      $("en-st").textContent = st;
    }
    function draw() {
      const x = $("en-x").value, [lab, lo, hi] = xMeta[x];
      const series = [{ name: "Your data", mode: "scatter", points: data.filter((d) => d.x === x && d.e === $("en-e").value).map((d) => [d.xv, d.r]) }];
      if ($("en-model").checked) {
        const v = vals(), pts = [];
        for (let k = 0; k <= 100; k++) { const xv = lo + (k / 100) * (hi - lo); const o = Object.assign({}, v, { [x]: xv }); pts.push([xv, rate(v.e, o.T, o.pH, o.S, o.I)]); }
        series.push({ name: "Model", mode: "line", noDots: true, color: Bio.css("--c3"), points: pts, dashed: true });
      }
      Bio.chart($("en-cv"), { series, xLabel: lab, yLabel: "Rate (µmol/min)", xMin: lo, xMax: hi, yMin: 0, yMax: 130 });
      const n = series[0].points.length;
      $("en-n").textContent = `${n} point${n === 1 ? "" : "s"} recorded for this enzyme and variable.${n >= 6 ? " Nice dataset!" : " Aim for at least 6, spread across the range."}`;
    }
    el.addEventListener("input", (e) => { if (e.target.type === "range") update(); });
    $("en-e").addEventListener("change", () => { update(); draw(); });
    $("en-x").addEventListener("change", draw);
    $("en-model").addEventListener("change", draw);
    $("en-rec").addEventListener("click", () => {
      const v = vals(), x = $("en-x").value;
      const r = Math.max(0, rate(v.e, v.T, v.pH, v.S, v.I) * (1 + Bio.gauss(0, 0.04)));
      data.push({ e: $("en-e").value, x, xv: v[x], r });
      draw();
    });
    $("en-clr").addEventListener("click", () => { data = []; draw(); });
    update();
    Bio.live(draw);
  };

  const MOLECULES = [
    ["Glucose", "carb", "A monosaccharide, the main fuel of cells and the sugar in your blood."],
    ["Starch", "carb", "A plant storage polysaccharide made of glucose (potatoes, rice, bread)."],
    ["Cellulose", "carb", "A structural polysaccharide in plant cell walls; we can't digest it (fiber)."],
    ["Glycogen", "carb", "The animal storage form of glucose, kept in liver and muscle."],
    ["Sucrose", "carb", "Table sugar: a disaccharide of glucose + fructose."],
    ["Chitin", "carb", "A structural polysaccharide in insect exoskeletons and fungal cell walls."],
    ["Triglyceride", "lipid", "Glycerol + 3 fatty acids: stored energy in fat cells."],
    ["Cholesterol", "lipid", "A steroid that stiffens membranes and is used to make hormones."],
    ["Phospholipid", "lipid", "The main building block of cell membranes."],
    ["Testosterone", "lipid", "A steroid hormone (built from cholesterol)."],
    ["Olive oil", "lipid", "Mostly unsaturated fats, liquid at room temperature."],
    ["Beeswax", "lipid", "A waterproof wax: long fatty acids bonded to long alcohols."],
    ["Hemoglobin", "protein", "A four-chain protein that carries oxygen in red blood cells."],
    ["Insulin", "protein", "A small protein hormone that lowers blood glucose."],
    ["Keratin", "protein", "A structural protein in hair, nails and skin."],
    ["Amylase", "protein", "An enzyme that digests starch. Most enzymes are proteins."],
    ["Collagen", "protein", "The most abundant protein in your body; found in skin, tendons and bone."],
    ["Antibody", "protein", "A Y-shaped immune protein that binds a specific antigen."],
    ["DNA", "nucleic", "Deoxyribonucleic acid, the genetic blueprint."],
    ["mRNA", "nucleic", "A messenger copy of a gene, read by ribosomes."],
    ["tRNA", "nucleic", "An adapter RNA that carries amino acids to the ribosome."],
    ["ATP", "nucleic", "A nucleotide (adenine + ribose + 3 phosphates), the cell's energy currency."]
  ];
  const BINS = { carb: "Carbohydrate", lipid: "Lipid", protein: "Protein", nucleic: "Nucleic acid / nucleotide" };

  Bio.labs.sorter = function (el) {
    el.innerHTML = `
      <h3>Lab 2B · Biomolecule Sorting Challenge</h3>
      <p>Click a molecule, then click the class it belongs to. Every placement teaches you something about where that molecule shows up in your body.</p>
      <div class="chips" id="so-items"></div>
      <div class="bins" id="so-bins">${Object.entries(BINS).map(([k, v]) => `<div class="bin" data-bin="${k}" tabindex="0" role="button"><h5>${v}</h5><div class="chips"></div></div>`).join("")}</div>
      <div class="feedback" id="so-fb">Select a molecule to begin.</div>
      <div class="readout"><div><b id="so-c">0</b><span>Correct</span></div><div><b id="so-w">0</b><span>Mistakes</span></div><div><b id="so-l">${MOLECULES.length}</b><span>Remaining</span></div></div>
      <div class="btn-row"><button class="btn small" id="so-reset">Start over</button></div>`;
    let sel = null, correct = 0, wrong = 0;
    const items = Bio.$("#so-items", el), fb = Bio.$("#so-fb", el);
    function reset() {
      correct = wrong = 0; sel = null;
      items.innerHTML = Bio.shuffle(MOLECULES).map(([n]) => `<button class="chip" data-m="${n}">${n}</button>`).join("");
      Bio.$$(".bin .chips", el).forEach((c) => (c.innerHTML = ""));
      stats(); fb.className = "feedback"; fb.textContent = "Select a molecule to begin.";
    }
    function stats() { Bio.$("#so-c", el).textContent = correct; Bio.$("#so-w", el).textContent = wrong; Bio.$("#so-l", el).textContent = items.children.length; }
    items.addEventListener("click", (e) => {
      const b = e.target.closest("[data-m]"); if (!b) return;
      Bio.$$(".chip", items).forEach((c) => c.classList.remove("sel"));
      b.classList.add("sel"); sel = b; fb.className = "feedback"; fb.textContent = `Where does ${b.dataset.m} belong?`;
    });
    function place(binEl) {
      if (!sel) { fb.textContent = "Pick a molecule first."; return; }
      const m = MOLECULES.find((x) => x[0] === sel.dataset.m);
      if (m[1] === binEl.dataset.bin) {
        correct++; sel.classList.remove("sel"); sel.classList.add("ok"); Bio.$(".chips", binEl).appendChild(sel);
        fb.className = "feedback good"; fb.textContent = `✓ ${m[0]}: ${m[2]}`; sel = null;
        if (!items.children.length) fb.textContent += `  🎉 All sorted with ${wrong} mistake${wrong === 1 ? "" : "s"}!`;
      } else {
        wrong++; fb.className = "feedback bad"; fb.textContent = `✗ ${m[0]} isn't a ${BINS[binEl.dataset.bin].toLowerCase()}. Hint: ${m[2].split(".")[0]}.`;
      }
      stats();
    }
    Bio.$$(".bin", el).forEach((b) => { b.addEventListener("click", () => place(b)); b.addEventListener("keydown", (e) => { if (e.key === "Enter") place(b); }); });
    Bio.$("#so-reset", el).addEventListener("click", reset);
    reset();
  };
})();
