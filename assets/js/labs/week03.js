/* Week 3 labs: interactive cell explorer, osmosis simulator, surface-area-to-volume calculator. */
(function () {
  const Bio = window.Bio;

  const ORG = {
    membrane: ["Plasma membrane", "both", "A phospholipid bilayer with embedded proteins that controls what enters and leaves.", "Many drugs work by targeting membrane proteins (receptors and channels)."],
    nucleus: ["Nucleus", "both", "Holds the DNA (chromosomes) and controls the cell by deciding which genes are expressed. Surrounded by a double membrane with nuclear pores.", "Mature red blood cells eject their nucleus to make room for hemoglobin."],
    nucleolus: ["Nucleolus", "both", "A dense region inside the nucleus where ribosome subunits are assembled.", "Fast-growing cancer cells often have enlarged nucleoli."],
    rer: ["Rough ER", "both", "A folded membrane network studded with ribosomes. Makes and folds proteins destined for membranes or export.", "Antibody-secreting plasma cells are packed with rough ER."],
    ser: ["Smooth ER", "both", "ER without ribosomes. Makes lipids and steroid hormones, detoxifies drugs and alcohol, and stores calcium.", "Liver cells of heavy drinkers expand their smooth ER to detoxify alcohol."],
    golgi: ["Golgi apparatus", "both", "Stacks of flattened sacs that modify, sort and package proteins into vesicles, like the cell's post office.", "The Golgi adds sugar tags that determine your ABO blood type antigens."],
    mito: ["Mitochondrion", "both", "Site of aerobic cellular respiration, producing most of the cell's ATP. Has its own circular DNA and ribosomes.", "You inherit mitochondria only from your mother, so mtDNA traces maternal ancestry."],
    lyso: ["Lysosome", "animal (mostly)", "A sac of digestive enzymes that breaks down worn-out organelles, food particles and engulfed bacteria.", "In Tay–Sachs disease, a missing lysosomal enzyme lets lipids build up in neurons."],
    ribo: ["Ribosomes", "both", "Molecular machines (rRNA + protein) that translate mRNA into protein. Free in the cytoplasm or bound to the rough ER.", "Many antibiotics target bacterial ribosomes, which differ from ours."],
    centriole: ["Centrioles", "animal", "Pairs of microtubule cylinders that help organize the spindle during cell division.", "Related structures (basal bodies) anchor the cilia that sweep mucus out of your airways."],
    vesicle: ["Vesicle", "both", "Small membrane bubbles that transport materials within the cell and to the membrane (exocytosis).", "Neurons release neurotransmitters from vesicles at synapses."],
    cytoplasm: ["Cytoplasm & cytoskeleton", "both", "The jelly-like cytosol plus a scaffold of protein fibers that gives shape, anchors organelles and moves things.", "Microtubules form the tracks that motor proteins walk along, carrying cargo along nerve axons up to 1 m long."],
    wall: ["Cell wall", "plant", "A rigid layer of cellulose outside the membrane that supports the cell and prevents bursting.", "Penicillin works by blocking bacterial cell-wall construction. Human cells have no wall, so they're unaffected."],
    vacuole: ["Central vacuole", "plant", "A large water-filled sac that stores water, ions and pigments and pushes outward (turgor pressure) to keep the plant rigid.", "Wilting lettuce has lost water from its vacuoles. Soak it to restore turgor!"],
    chloro: ["Chloroplast", "plant", "Site of photosynthesis. Contains chlorophyll in stacked thylakoids. Like mitochondria, it has its own DNA.", "Every O₂ molecule you breathe was released by photosynthesis."]
  };

  function cellSVG(type) {
    const plant = type === "plant";
    const g = (id, inner) => `<g data-org="${id}" class="org" tabindex="0" role="button" aria-label="${ORG[id][0]}">${inner}</g>`;
    let s = `<svg viewBox="0 0 600 400" class="stage" role="group" aria-label="${plant ? "Plant" : "Animal"} cell diagram">
      <style>.org{cursor:pointer}.org:hover>*,.org:focus>*{filter:brightness(1.18);stroke-width:3.5}.org.hl>*{stroke:#ff3d7f !important;stroke-width:4}</style>`;
    if (plant) {
      s += g("wall", `<rect x="40" y="25" width="520" height="350" rx="18" fill="#a5c88a" stroke="#4c7a32" stroke-width="10" fill-opacity=".25"/>`);
      s += g("membrane", `<rect x="54" y="39" width="492" height="322" rx="12" fill="none" stroke="#2e6b8f" stroke-width="3"/>`);
      s += g("cytoplasm", `<rect x="60" y="45" width="480" height="310" rx="10" fill="#e9f2dd" fill-opacity=".55" stroke="none"/>`);
      s += g("vacuole", `<rect x="210" y="90" width="230" height="220" rx="60" fill="#9fd3f0" fill-opacity=".7" stroke="#2c86b8" stroke-width="2"/>`);
      [[110, 300], [480, 100], [500, 290], [170, 80]].forEach(([x, y]) => (s += g("chloro", `<ellipse cx="${x}" cy="${y}" rx="30" ry="16" fill="#3e9b4f" stroke="#1f5e2b" stroke-width="2"/><path d="M${x - 18} ${y}h36M${x - 14} ${y - 6}h28M${x - 14} ${y + 6}h28" stroke="#b9e3a5" stroke-width="2"/>`)));
    } else {
      s += g("membrane", `<ellipse cx="300" cy="200" rx="270" ry="180" fill="none" stroke="#2e6b8f" stroke-width="5"/>`);
      s += g("cytoplasm", `<ellipse cx="300" cy="200" rx="266" ry="176" fill="#f6e3d3" fill-opacity=".6" stroke="none"/>`);
      [[150, 120], [440, 300]].forEach(([x, y]) => (s += g("lyso", `<circle cx="${x}" cy="${y}" r="13" fill="#b07cc6" stroke="#6b3d82" stroke-width="2"/>`)));
      s += g("centriole", `<rect x="400" y="80" width="12" height="34" rx="3" fill="#888" stroke="#444" stroke-width="2"/><rect x="415" y="95" width="34" height="12" rx="3" fill="#888" stroke="#444" stroke-width="2"/>`);
    }
    const nx = plant ? 130 : 260, ny = plant ? 190 : 200;
    s += g("rer", `<path d="M${nx + 55} ${ny - 50} q20 20 0 40 q-20 20 0 40 q20 20 0 40 M${nx + 72} ${ny - 55} q20 25 0 50 q-20 25 0 50 q20 25 0 50" fill="none" stroke="#d68a2f" stroke-width="5"/>` +
      Array.from({ length: 10 }, (_, i) => `<circle cx="${nx + 60 + (i % 2) * 17}" cy="${ny - 45 + i * 13}" r="2.6" fill="#5a3c1a"/>`).join(""));
    s += g("nucleus", `<circle cx="${nx}" cy="${ny}" r="52" fill="#c9b6e8" stroke="#6b4fbb" stroke-width="4"/>`);
    s += g("nucleolus", `<circle cx="${nx - 8}" cy="${ny + 6}" r="16" fill="#6b4fbb"/>`);
    if (!plant) s += g("ser", `<path d="M380 160 q15 -10 30 0 t30 0 M380 175 q15 -10 30 0 t30 0" fill="none" stroke="#e0b25a" stroke-width="6" stroke-linecap="round"/>`);
    else s += g("ser", `<path d="M120 105 q15 -10 30 0 t30 0" fill="none" stroke="#e0b25a" stroke-width="6" stroke-linecap="round"/>`);
    const gx = plant ? 470 : 370, gy = plant ? 190 : 250;
    s += g("golgi", [0, 1, 2, 3].map((i) => `<path d="M${gx} ${gy + i * 10} q30 -14 60 0" fill="none" stroke="#e05d5d" stroke-width="6" stroke-linecap="round"/>`).join(""));
    s += g("vesicle", `<circle cx="${gx + 70}" cy="${gy - 8}" r="6" fill="#f2a1a1" stroke="#e05d5d" stroke-width="2"/><circle cx="${gx + 76}" cy="${gy + 28}" r="5" fill="#f2a1a1" stroke="#e05d5d" stroke-width="2"/>`);
    const mitos = plant ? [[130, 320], [480, 340]] : [[170, 280], [450, 140], [330, 330], [140, 190]];
    mitos.forEach(([x, y]) => (s += g("mito", `<ellipse cx="${x}" cy="${y}" rx="30" ry="15" fill="#f08c3a" stroke="#a24f10" stroke-width="2"/><path d="M${x - 20} ${y} l6 -8 l6 16 l6 -16 l6 16 l6 -16 l6 8" fill="none" stroke="#fff3e3" stroke-width="2"/>`)));
    s += g("ribo", Array.from({ length: 14 }, (_, i) => `<circle cx="${(plant ? 90 : 120) + ((i * 53) % (plant ? 100 : 380))}" cy="${(plant ? 130 : 100) + ((i * 37) % (plant ? 200 : 200))}" r="3.2" fill="#5a3c1a"/>`).join(""));
    return s + "</svg>";
  }

  Bio.labs.cell = function (el) {
    el.innerHTML = `
      <h3>Lab 3A · Interactive Cell Explorer</h3>
      <p>Click any structure to learn what it does. Switch between animal and plant cells to compare them, then try <strong>Quiz mode</strong> to test yourself.</p>
      <div class="btn-row"><button class="chip sel" data-type="animal">🐾 Animal cell</button><button class="chip" data-type="plant">🌿 Plant cell</button><button class="btn small" id="ce-quiz">🎯 Quiz mode</button></div>
      <div class="two-col" style="grid-template-columns:3fr 2fr">
        <div id="ce-svg"></div>
        <div class="lab-output" id="ce-info"><strong>Click a structure</strong><p class="small muted">Every organelle has a job. Together they keep the cell alive.</p></div>
      </div>
      <div class="feedback" id="ce-fb"></div>
      ${Bio.worksheet("w3-cell", [
        "List three structures found in plant cells but not animal cells, and explain what each one does for the plant.",
        "Trace the path of a protein hormone like insulin from its gene to its release outside the cell. Name at least four structures.",
        "Heart muscle cells have far more mitochondria than skin cells. Explain why.",
        "Mitochondria and chloroplasts have their own DNA and ribosomes. What does endosymbiotic theory propose about their origin?"
      ])}`;
    let type = "animal", quiz = null, score = 0, asked = 0;
    const info = Bio.$("#ce-info", el), fb = Bio.$("#ce-fb", el);
    function render() { Bio.$("#ce-svg", el).innerHTML = cellSVG(type); }
    function showInfo(id) {
      const [n, where, fn, human] = ORG[id];
      info.innerHTML = `<strong style="font-size:1.15rem">${n}</strong> <span class="pill">${where}</span><p>${fn}</p><p class="small"><strong>🫀 Human connection:</strong> ${human}</p>`;
    }
    function ask() {
      const ids = [...new Set(Bio.$$("[data-org]", el).map((g) => g.dataset.org))];
      quiz = ids[Math.floor(Math.random() * ids.length)];
      fb.className = "feedback"; fb.innerHTML = `🎯 Find the <strong>${ORG[quiz][0]}</strong>. (Score: ${score}/${asked})`;
    }
    Bio.$("#ce-svg", el).addEventListener("click", (e) => {
      const g = e.target.closest("[data-org]"); if (!g) return;
      const id = g.dataset.org;
      Bio.$$(".org.hl", el).forEach((x) => x.classList.remove("hl"));
      Bio.$$(`[data-org="${id}"]`, el).forEach((x) => x.classList.add("hl"));
      showInfo(id);
      if (quiz) {
        asked++;
        if (id === quiz) { score++; fb.className = "feedback good"; fb.textContent = `✓ Correct! That's the ${ORG[id][0]}.`; }
        else { fb.className = "feedback bad"; fb.textContent = `✗ That's the ${ORG[id][0]}, not the ${ORG[quiz][0]}.`; }
        setTimeout(ask, 1300);
      }
    });
    Bio.$("#ce-svg", el).addEventListener("keydown", (e) => { if (e.key === "Enter") { const g = e.target.closest("[data-org]"); if (g) g.dispatchEvent(new MouseEvent("click", { bubbles: true })); } });
    Bio.$$("[data-type]", el).forEach((b) => b.addEventListener("click", () => {
      type = b.dataset.type; Bio.$$("[data-type]", el).forEach((x) => x.classList.toggle("sel", x === b)); render(); if (quiz) ask();
    }));
    Bio.$("#ce-quiz", el).addEventListener("click", (e) => {
      if (quiz) { quiz = null; fb.textContent = `Quiz ended. Final score ${score}/${asked}.`; e.target.textContent = "🎯 Quiz mode"; }
      else { score = asked = 0; e.target.textContent = "⏹ End quiz"; ask(); }
    });
    render();
  };

  /* ---------- Osmosis simulator ---------- */
  Bio.labs.osmosis = function (el) {
    el.innerHTML = `
      <h3>Lab 3B · Osmosis Simulator</h3>
      <p>Place a cell in solutions of different salt concentrations. The inside of the cell is about <strong>0.9% solutes</strong>. Water moves across the membrane toward the side with <em>more</em> dissolved solute.</p>
      <div class="btn-row"><button class="chip sel" data-c="rbc">🩸 Red blood cell</button><button class="chip" data-c="plant">🌿 Plant cell</button></div>
      <div class="lab-controls"><div class="ctl"><label>Outside solution: NaCl concentration <output id="os-v"></output></label><input type="range" id="os-s" min="0" max="3" step="0.1" value="0.9"></div></div>
      <svg class="stage" id="os-svg" viewBox="0 0 600 300" role="img" aria-label="Cell in a beaker of solution"></svg>
      <div class="readout"><div><b id="os-t"></b><span>Solution is…</span></div><div><b id="os-w"></b><span>Net water movement</span></div><div><b id="os-r"></b><span>Result</span></div></div>
      <div class="btn-row small"><span class="muted">Presets:</span><button class="btn small" data-p="0">Distilled water</button><button class="btn small" data-p="0.9">IV saline (0.9%)</button><button class="btn small" data-p="3.0">Sea water (~3.5%)</button></div>
      ${Bio.worksheet("w3-osm", [
        "Describe what happens to a red blood cell in distilled water, and why hospitals never inject pure water into veins.",
        "Why does a plant cell in distilled water NOT burst, while a red blood cell does?",
        "Explain why drinking seawater dehydrates you, using the word hypertonic.",
        "Salting a garden slug or sprinkling salt on strawberries draws water out. Explain using osmosis."
      ])}`;
    let kind = "rbc";
    const svg = Bio.$("#os-svg", el), sld = Bio.$("#os-s", el);
    function seeded(i) { const x = Math.sin(i * 999) * 10000; return x - Math.floor(x); }
    function draw() {
      const c = +sld.value;
      Bio.$("#os-v", el).textContent = c.toFixed(1) + "%";
      const diff = 0.9 - c; // + means water enters the cell
      const tone = Math.abs(diff) < 0.15 ? "Isotonic" : diff > 0 ? "Hypotonic" : "Hypertonic";
      let r = 80 * (1 + Math.max(-0.45, Math.min(0.5, diff * 0.45)));
      let result;
      if (kind === "rbc") {
        result = tone === "Isotonic" ? "Normal shape ✓" : tone === "Hypotonic" ? (c < 0.4 ? "Swells and bursts (lysis) 💥" : "Swells") : "Shrivels (crenation)";
      } else {
        r = 80 * (1 + Math.max(-0.4, Math.min(0.08, diff * 0.3)));
        result = tone === "Isotonic" ? "Flaccid (limp)" : tone === "Hypotonic" ? "Turgid (firm) ✓ the healthy state" : "Plasmolyzed: membrane pulls from wall";
      }
      const burst = kind === "rbc" && c < 0.4;
      let s = `<rect x="20" y="20" width="560" height="260" rx="16" fill="${Bio.css("--accent-soft")}" stroke="${Bio.css("--border")}"/>`;
      const nOut = Math.round(c * 40);
      for (let i = 0; i < nOut; i++) {
        const x = 40 + seeded(i) * 520, y = 40 + seeded(i + 50) * 220;
        if (Math.hypot(x - 300, y - 150) > 100) s += `<circle cx="${x}" cy="${y}" r="4" fill="${Bio.css("--c3")}"/>`;
      }
      if (kind === "plant") s += `<rect x="200" y="50" width="200" height="200" rx="10" fill="none" stroke="#4c7a32" stroke-width="8"/>`;
      if (burst) {
        s += `<path d="M300 ${150 - r} l12 30 l30 -10 l-14 28 l34 14 l-34 10 l14 30 l-32 -12 l-10 32 l-10 -32 l-32 12 l14 -30 l-34 -10 l34 -14 l-14 -28 l30 10 z" fill="#e57373" opacity=".55"/>`;
      } else if (kind === "rbc") {
        const wob = tone === "Hypertonic" ? 10 : 0;
        let d = "";
        for (let a = 0; a <= 360; a += 10) { const rr = r + (wob ? Math.sin((a * Math.PI) / 18) * wob : 0); d += `${a ? "L" : "M"}${300 + rr * Math.cos((a * Math.PI) / 180)} ${150 + rr * 0.8 * Math.sin((a * Math.PI) / 180)}`; }
        s += `<path d="${d}Z" fill="#d9534f" stroke="#8e1f1b" stroke-width="3"/>`;
        if (tone !== "Hypotonic") s += `<ellipse cx="300" cy="150" rx="${r * 0.45}" ry="${r * 0.3}" fill="#b23b37"/>`;
      } else {
        const side = Math.min(92, r * 1.15);
        s += `<rect x="${300 - side}" y="${150 - side}" width="${side * 2}" height="${side * 2}" rx="14" fill="#7cc576" stroke="#2e6b8f" stroke-width="3"/>`;
        s += `<rect x="${300 - side * 0.6}" y="${150 - side * 0.6}" width="${side * 1.2}" height="${side * 1.2}" rx="12" fill="#9fd3f0" opacity=".8"/>`;
      }
      const nIn = 36;
      for (let i = 0; i < nIn && !burst; i++) {
        const a = seeded(i + 200) * 6.28, d = seeded(i + 300) * (r * 0.6);
        s += `<circle cx="${300 + d * Math.cos(a)}" cy="${150 + d * 0.8 * Math.sin(a)}" r="3" fill="#fff" opacity=".85"/>`;
      }
      if (tone !== "Isotonic") {
        const inward = diff > 0;
        [[140, 100, 0], [140, 200, 0], [460, 100, 180], [460, 200, 180]].forEach(([x, y, ang]) => {
          s += `<g transform="translate(${x} ${y}) rotate(${inward ? ang : ang + 180})"><path d="M-25 0 H18 M8 -8 L20 0 L8 8" stroke="${Bio.css("--c4")}" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
        });
      }
      s += `<text x="34" y="272" font-size="13" fill="${Bio.css("--muted")}">● = salt outside · ○ = solutes inside · blue arrows = water</text>`;
      svg.innerHTML = s;
      Bio.$("#os-t", el).textContent = tone;
      Bio.$("#os-w", el).textContent = tone === "Isotonic" ? "None (balanced)" : diff > 0 ? "Into cell" : "Out of cell";
      Bio.$("#os-r", el).textContent = result;
    }
    sld.addEventListener("input", draw);
    Bio.$$("[data-c]", el).forEach((b) => b.addEventListener("click", () => { kind = b.dataset.c; Bio.$$("[data-c]", el).forEach((x) => x.classList.toggle("sel", x === b)); draw(); }));
    Bio.$$("[data-p]", el).forEach((b) => b.addEventListener("click", () => { sld.value = b.dataset.p; draw(); }));
    Bio.live(draw);
  };

  /* ---------- Surface area to volume ---------- */
  Bio.labs.sav = function (el) {
    el.innerHTML = `
      <h3>Lab 3C · Why Are Cells So Small?</h3>
      <p>A cell exchanges nutrients and waste through its <strong>surface</strong>, but its needs depend on its <strong>volume</strong>. Grow a cube-shaped "cell" and watch the ratio.</p>
      <div class="lab-controls"><div class="ctl"><label>Side length <output id="sv-v"></output></label><input type="range" id="sv-s" min="1" max="20" value="2"></div></div>
      <div class="readout"><div><b id="sv-a"></b><span>Surface area (µm²)</span></div><div><b id="sv-b"></b><span>Volume (µm³)</span></div><div><b id="sv-r"></b><span>SA : V ratio</span></div></div>
      <canvas id="sv-cv"></canvas>
      ${Bio.worksheet("w3-sav", ["What happens to the SA:V ratio as the cell grows? Why is this a problem for a large cell?", "Name two features in the human body that increase surface area for exchange. (Hint: lungs and intestines, Week 10.)"])}`;
    const s = Bio.$("#sv-s", el);
    function draw() {
      const L = +s.value;
      Bio.$("#sv-v", el).textContent = L + " µm";
      Bio.$("#sv-a", el).textContent = (6 * L * L).toLocaleString();
      Bio.$("#sv-b", el).textContent = (L ** 3).toLocaleString();
      Bio.$("#sv-r", el).textContent = (6 / L).toFixed(2) + " : 1";
      const pts = []; for (let x = 1; x <= 20; x += 0.25) pts.push([x, 6 / x]);
      Bio.chart(Bio.$("#sv-cv", el), { xLabel: "Side length (µm)", yLabel: "SA : V", xMin: 1, xMax: 20, yMin: 0, yMax: 6, series: [{ name: "SA:V", points: pts, noDots: true }, { name: "Your cell", mode: "scatter", points: [[L, 6 / L]], color: Bio.css("--c3") }] });
    }
    s.addEventListener("input", draw);
    Bio.live(draw);
  };
})();
