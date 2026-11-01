/* Week 7 labs: Punnett squares with offspring simulation and chi-square, plus a cell-division phase game. */
(function () {
  const Bio = window.Bio;

  const MODES = {
    mono: {
      label: "Monohybrid (complete dominance)", opts: ["AA", "Aa", "aa"], def: ["Aa", "Aa"],
      gametes: (g) => [g[0], g[1]],
      join: (a, b) => [a, b].sort((x, y) => (x === x.toUpperCase() ? -1 : 1) - (y === y.toUpperCase() ? -1 : 1)).join(""),
      pheno: (g) => (g.includes("A") ? "Dominant (A_)" : "Recessive (aa)"),
      note: "Example: in pea plants, purple flowers (A) are dominant over white (a)."
    },
    incomplete: {
      label: "Incomplete dominance (snapdragon color)", opts: ["RR", "RW", "WW"], def: ["RW", "RW"],
      gametes: (g) => [g[0], g[1]],
      join: (a, b) => [a, b].sort().reverse().join(""),
      pheno: (g) => ({ RR: "Red", RW: "Pink", WW: "White" }[g]),
      note: "Heterozygotes show an intermediate (blended) phenotype."
    },
    di: {
      label: "Dihybrid (two genes)", opts: ["AABB", "AaBb", "AaBB", "AABb", "aabb", "Aabb", "aaBb"], def: ["AaBb", "AaBb"],
      gametes: (g) => { const r = []; for (const a of [g[0], g[1]]) for (const b of [g[2], g[3]]) r.push(a + b); return r; },
      join: (x, y) => { const s = (p, q) => (p === p.toUpperCase() ? p + q : q + p); return s(x[0], y[0]) + s(x[1], y[1]); },
      pheno: (g) => (g.includes("A") ? "A_" : "aa") + " " + (g.includes("B") ? "B_" : "bb"),
      note: "Example: Mendel's peas, round (A) vs wrinkled seeds and yellow (B) vs green seeds."
    },
    xlinked: {
      label: "X-linked (color blindness)", opts: ["XᴮXᴮ", "XᴮXᵇ", "XᵇXᵇ", "XᴮY", "XᵇY"], def: ["XᴮXᵇ", "XᴮY"], split: true,
      gametes: (g) => (g.endsWith("Y") ? [g.slice(0, 2), "Y"] : [g.slice(0, 2), g.slice(2, 4)]),
      join: (a, b) => { if (a === "Y") return b + a; if (b === "Y") return a + b; return [a, b].sort((x, y) => (x === "Xᴮ" ? 0 : 1) - (y === "Xᴮ" ? 0 : 1)).join(""); },
      pheno: (g) => g.endsWith("Y") ? (g.startsWith("Xᴮ") ? "Male, normal vision" : "Male, color-blind") : (g.includes("Xᴮ") ? (g.includes("Xᵇ") ? "Female, carrier" : "Female, normal") : "Female, color-blind"),
      note: "Mother is parent 1 (columns), father is parent 2 (rows)."
    },
    blood: {
      label: "ABO blood type (codominance)", opts: ["IᴬIᴬ", "Iᴬi", "IᴮIᴮ", "Iᴮi", "IᴬIᴮ", "ii"], def: ["Iᴬi", "Iᴮi"],
      gametes: (g) => (g === "ii" ? ["i", "i"] : g.match(/I[ᴬᴮ]|i/g)),
      join: (a, b) => { const order = { "Iᴬ": 0, "Iᴮ": 1, i: 2 }; return [a, b].sort((x, y) => order[x] - order[y]).join(""); },
      pheno: (g) => (g.includes("Iᴬ") && g.includes("Iᴮ") ? "Type AB" : g.includes("Iᴬ") ? "Type A" : g.includes("Iᴮ") ? "Type B" : "Type O"),
      note: "Iᴬ and Iᴮ are codominant; both are dominant over i."
    }
  };
  const CRIT = [0, 3.84, 5.99, 7.81, 9.49, 11.07];

  Bio.labs.punnett = function (el) {
    el.innerHTML = `
      <h3>Lab 7A · Punnett Square Lab</h3>
      <p>Pick a type of cross and the parents' genotypes. The Punnett square shows the <em>expected</em> offspring. Then breed real (simulated) offspring and test whether chance alone explains the differences, just as Mendel did.</p>
      <div class="lab-controls">
        <div class="ctl"><label for="pu-mode">Type of cross</label><select id="pu-mode">${Object.entries(MODES).map(([k, m]) => `<option value="${k}">${m.label}</option>`).join("")}</select></div>
        <div class="ctl"><label for="pu-p1" id="pu-l1">Parent 1</label><select id="pu-p1"></select></div>
        <div class="ctl"><label for="pu-p2" id="pu-l2">Parent 2</label><select id="pu-p2"></select></div>
      </div>
      <p class="small muted" id="pu-note"></p>
      <div class="two-col">
        <div class="table-scroll" id="pu-grid"></div>
        <div id="pu-ratios"></div>
      </div>
      <h4>Breed offspring</h4>
      <div class="lab-controls"><div class="ctl"><label>Number of offspring <output id="pu-nv">100</output></label><input type="range" id="pu-n" min="4" max="1000" value="100"></div></div>
      <div class="btn-row"><button class="btn primary" id="pu-breed">🐣 Breed!</button></div>
      <div id="pu-sim"></div>
      ${Bio.worksheet("w7-pun", [
        "Cross Aa × Aa. What are the expected genotype and phenotype ratios? Breed 8 offspring three times. Why don't you always get exactly 3:1?",
        "Breed 1000 offspring. How close is the result to 3:1 now? What does the chi-square test tell you?",
        "A carrier mother (XᴮXᵇ) and a father with normal vision (XᴮY): what is the chance a SON is color-blind? A daughter?",
        "Can two parents with type A and type B blood have a type O child? Show the cross.",
        "Do a dihybrid AaBb × AaBb cross. What ratio do you get, and which of Mendel's laws does it demonstrate?"
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    function setMode() {
      const m = MODES[$("pu-mode").value];
      let o1 = m.opts, o2 = m.opts;
      if (m.split) { o1 = m.opts.filter((g) => !g.endsWith("Y")); o2 = m.opts.filter((g) => g.endsWith("Y")); }
      $("pu-p1").innerHTML = o1.map((g) => `<option ${g === m.def[0] ? "selected" : ""}>${g}</option>`).join("");
      $("pu-p2").innerHTML = o2.map((g) => `<option ${g === m.def[1] ? "selected" : ""}>${g}</option>`).join("");
      $("pu-l1").textContent = m.split ? "Mother" : "Parent 1"; $("pu-l2").textContent = m.split ? "Father" : "Parent 2";
      $("pu-note").textContent = m.note;
      $("pu-sim").innerHTML = "";
      render();
    }
    function expected() {
      const m = MODES[$("pu-mode").value];
      const g1 = m.gametes($("pu-p1").value), g2 = m.gametes($("pu-p2").value);
      const cells = g2.map((b) => g1.map((a) => m.join(a, b)));
      const geno = {}, pheno = {};
      cells.flat().forEach((g) => { geno[g] = (geno[g] || 0) + 1; const p = m.pheno(g); pheno[p] = (pheno[p] || 0) + 1; });
      return { m, g1, g2, cells, geno, pheno, total: cells.flat().length };
    }
    function render() {
      const e = expected();
      let h = `<table class="punnett"><tr><th></th>${e.g1.map((g) => `<th>${g}</th>`).join("")}</tr>`;
      e.cells.forEach((row, i) => (h += `<tr><th>${e.g2[i]}</th>${row.map((c) => `<td title="${e.m.pheno(c)}">${c}</td>`).join("")}</tr>`));
      $("pu-grid").innerHTML = h + "</table>";
      const fr = (n) => `${n}/${e.total} (${Math.round((n / e.total) * 1000) / 10}%)`;
      $("pu-ratios").innerHTML = `<h4 style="margin-top:0">Expected genotypes</h4><ul>${Object.entries(e.geno).map(([g, n]) => `<li><code>${g}</code>: ${fr(n)}</li>`).join("")}</ul>
        <h4>Expected phenotypes</h4><ul>${Object.entries(e.pheno).map(([p, n]) => `<li>${p}: ${fr(n)}</li>`).join("")}</ul>`;
    }
    $("pu-breed").addEventListener("click", () => {
      const e = expected(), N = +$("pu-n").value, obs = {};
      Object.keys(e.pheno).forEach((p) => (obs[p] = 0));
      for (let k = 0; k < N; k++) {
        const a = e.g1[Math.floor(Math.random() * e.g1.length)], b = e.g2[Math.floor(Math.random() * e.g2.length)];
        obs[e.m.pheno(e.m.join(a, b))]++;
      }
      let chi = 0;
      const rows = Object.keys(e.pheno).map((p) => { const ex = (e.pheno[p] / e.total) * N; chi += ex ? (obs[p] - ex) ** 2 / ex : 0; return `<tr><td>${p}</td><td>${obs[p]}</td><td>${ex.toFixed(1)}</td><td>${ex ? ((obs[p] - ex) ** 2 / ex).toFixed(2) : "—"}</td></tr>`; });
      const df = Object.keys(e.pheno).length - 1;
      const verdict = df === 0 ? "Only one possible phenotype, so there's nothing to test." :
        chi < CRIT[df] ? `χ² = ${chi.toFixed(2)} &lt; ${CRIT[df]} (critical value, df = ${df}, p = 0.05). <strong>The differences can be explained by chance</strong>, and the data fit the expected ratio. ✓` :
          `χ² = ${chi.toFixed(2)} ≥ ${CRIT[df]} (df = ${df}). <strong>Differences this large would happen by chance less than 5% of the time.</strong> Either a rare fluke happened, or the hypothesis is wrong.`;
      $("pu-sim").innerHTML = `<div class="table-scroll"><table class="simple"><tr><th>Phenotype</th><th>Observed (O)</th><th>Expected (E)</th><th>(O−E)²/E</th></tr>${rows.join("")}</table></div><p class="small">${verdict}</p><canvas id="pu-cv" style="height:220px"></canvas>`;
      const pal = [Bio.css("--c1"), Bio.css("--c2"), Bio.css("--c3"), Bio.css("--c4")];
      const bars = [];
      Object.keys(e.pheno).forEach((p, i) => { bars.push({ label: p.length > 16 ? p.slice(0, 15) + "…" : p, value: obs[p], color: pal[i % 4] }); });
      Bio.chart($("pu-cv"), { type: "bar", bars, yLabel: "Offspring" });
    });
    $("pu-n").addEventListener("input", (e) => ($("pu-nv").textContent = e.target.value));
    $("pu-mode").addEventListener("change", setMode);
    $("pu-p1").addEventListener("change", () => { $("pu-sim").innerHTML = ""; render(); });
    $("pu-p2").addEventListener("change", () => { $("pu-sim").innerHTML = ""; render(); });
    setMode();
  };

  /* ---------- Cell division phase game ---------- */
  const RED = "#d9534f", BLUE = "#2a6fc9", RED2 = "#f2a1a1", BLUE2 = "#8fb3ea";
  function chrom(x, y, len, col, rep, ang = 0, col2) {
    const w = 8;
    if (!rep) return `<rect x="${x - w / 2}" y="${y - len / 2}" width="${w}" height="${len}" rx="4" fill="${col}" transform="rotate(${ang} ${x} ${y})"/>`;
    return `<g transform="rotate(${ang} ${x} ${y})"><rect x="${x - w - 1}" y="${y - len / 2}" width="${w}" height="${len}" rx="4" fill="${col}"/><rect x="${x + 1}" y="${y - len / 2}" width="${w}" height="${len}" rx="4" fill="${col2 || col}"/><circle cx="${x}" cy="${y}" r="3.5" fill="#333"/></g>`;
  }
  const cell = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#f6e3d3" fill-opacity=".6" stroke="#a27a5a" stroke-width="3"/>`;
  const spindle = (cx, cy, rx, targets) => `<circle cx="${cx - rx + 12}" cy="${cy}" r="5" fill="#666"/><circle cx="${cx + rx - 12}" cy="${cy}" r="5" fill="#666"/>` + targets.map(([x, y]) => (Math.abs(x - cx) < 1 ? [cx - rx + 12, cx + rx - 12] : [x < cx ? cx - rx + 12 : cx + rx - 12]).map((px) => `<line x1="${px}" y1="${cy}" x2="${x}" y2="${y}" stroke="#888" stroke-width="1"/>`).join("")).join("");
  const PHASES = {
    "Interphase": () => cell(150, 110, 120, 90) + `<circle cx="150" cy="110" r="48" fill="#e5dbf5" stroke="#6b4fbb" stroke-width="2"/>` + `<path d="M120 100 q10 -20 20 0 t20 0 t20 0 M125 120 q10 15 20 0 t20 0 t15 5 M130 90 q8 10 16 0 t16 0" fill="none" stroke="${RED}" stroke-width="2"/><path d="M118 112 q10 10 20 0 t20 0 t20 -5 M135 130 q8 -10 16 0 t16 0" fill="none" stroke="${BLUE}" stroke-width="2"/>`,
    "Prophase (mitosis)": () => cell(150, 110, 120, 90) + `<circle cx="150" cy="110" r="55" fill="none" stroke="#6b4fbb" stroke-width="2" stroke-dasharray="6 6"/>` + chrom(125, 95, 40, RED, true, 20) + chrom(175, 120, 40, BLUE, true, -30) + chrom(140, 135, 24, RED, true, 70) + chrom(170, 85, 24, BLUE, true, -60) + `<circle cx="100" cy="60" r="5" fill="#666"/><circle cx="200" cy="160" r="5" fill="#666"/>`,
    "Metaphase (mitosis)": () => { const t = [[150, 50], [150, 88], [150, 128], [150, 166]]; return cell(150, 110, 120, 90) + spindle(150, 110, 120, t) + chrom(150, 50, 36, RED, true, 90) + chrom(150, 88, 36, BLUE, true, 90) + chrom(150, 128, 22, RED, true, 90) + chrom(150, 166, 22, BLUE, true, 90); },
    "Anaphase (mitosis)": () => { let s = cell(150, 110, 130, 85); const ys = [60, 92, 124, 156], cols = [RED, BLUE, RED, BLUE], lens = [36, 36, 22, 22]; s += spindle(150, 110, 130, ys.flatMap((y) => [[95, y], [205, y]])); ys.forEach((y, i) => { s += chrom(95, y, lens[i], cols[i], false, 90) + chrom(205, y, lens[i], cols[i], false, 90); }); return s; },
    "Telophase & cytokinesis": () => `<path d="M30 110 C 30 30, 140 30, 150 80 C 160 30, 270 30, 270 110 C 270 190, 160 190, 150 140 C 140 190, 30 190, 30 110 Z" fill="#f6e3d3" fill-opacity=".6" stroke="#a27a5a" stroke-width="3"/>` + [90, 210].map((x) => `<circle cx="${x}" cy="110" r="40" fill="#e5dbf5" stroke="#6b4fbb" stroke-width="2"/>` + chrom(x - 18, 100, 34, RED, false, 15) + chrom(x - 4, 115, 34, BLUE, false, -10) + chrom(x + 12, 100, 20, RED, false, 30) + chrom(x + 22, 118, 20, BLUE, false, -25)).join(""),
    "Prophase I (meiosis)": () => cell(150, 110, 120, 90) + `<circle cx="150" cy="110" r="60" fill="none" stroke="#6b4fbb" stroke-width="2" stroke-dasharray="6 6"/>` + chrom(128, 105, 46, RED, true, 0, RED) + chrom(148, 105, 46, BLUE, true, 0, BLUE) + `<rect x="129" y="112" width="8" height="14" fill="${BLUE}"/><rect x="139" y="112" width="8" height="14" fill="${RED}"/>` + chrom(178, 110, 28, RED, true) + chrom(196, 110, 28, BLUE, true) + `<text x="150" y="190" text-anchor="middle" font-size="12" fill="currentColor">homologs paired (tetrads), crossing over</text>`,
    "Metaphase I (meiosis)": () => { const t = [[140, 70], [160, 70], [140, 140], [160, 140]]; return cell(150, 110, 120, 90) + spindle(150, 110, 120, t) + chrom(138, 70, 40, RED, true, 0) + chrom(162, 70, 40, BLUE, true, 0) + chrom(138, 140, 26, BLUE, true, 0) + chrom(162, 140, 26, RED, true, 0); },
    "Anaphase I (meiosis)": () => { let s = cell(150, 110, 130, 85); s += spindle(150, 110, 130, [[90, 80], [90, 140], [210, 80], [210, 140]]); s += chrom(90, 80, 40, RED, true, 90) + chrom(90, 140, 26, BLUE, true, 90) + chrom(210, 80, 40, BLUE, true, 90) + chrom(210, 140, 26, RED, true, 90); return s; },
    "Metaphase II (meiosis)": () => [80, 220].map((cx, i) => cell(cx, 110, 65, 80) + spindle(cx, 110, 65, [[cx, 80], [cx, 140]]) + chrom(cx, 80, 36, i ? BLUE : RED, true, 90) + chrom(cx, 140, 24, i ? RED : BLUE, true, 90)).join(""),
    "Telophase II (meiosis)": () => [[75, 60], [225, 60], [75, 160], [225, 160]].map(([x, y], i) => cell(x, y, 55, 42) + chrom(x - 10, y, 30, i % 2 ? BLUE : RED, false, 0) + chrom(x + 10, y, 20, i < 2 ? BLUE : RED, false, 0)).join("") + `<text x="150" y="114" text-anchor="middle" font-size="12" fill="currentColor">4 haploid cells</text>`
  };
  const HINTS = {
    "Interphase": "The nucleus is intact and chromatin is loose. DNA is copied during S phase.",
    "Prophase (mitosis)": "Chromosomes condense into visible X shapes and the nuclear envelope breaks down.",
    "Metaphase (mitosis)": "Replicated chromosomes line up single-file at the middle.",
    "Anaphase (mitosis)": "Sister chromatids are pulled apart to opposite poles.",
    "Telophase & cytokinesis": "Two nuclei re-form and the cell pinches in two, giving 2 identical diploid cells.",
    "Prophase I (meiosis)": "Homologous chromosomes pair up and swap segments (crossing over).",
    "Metaphase I (meiosis)": "Homologous PAIRS line up side by side at the middle; orientation is random (independent assortment).",
    "Anaphase I (meiosis)": "Homologs separate, but sister chromatids stay together (still X-shaped).",
    "Metaphase II (meiosis)": "Two cells, each with chromosomes lined up single-file.",
    "Telophase II (meiosis)": "Four genetically unique haploid cells (gametes)."
  };

  Bio.labs.division = function (el) {
    const names = Object.keys(PHASES);
    el.innerHTML = `
      <h3>Lab 7B · Name That Phase</h3>
      <p>These cells have 2n = 4 (one long and one short pair; red = from mom, blue = from dad). Use <strong>Study mode</strong> to step through mitosis and meiosis, then switch to <strong>Challenge mode</strong> and identify each phase.</p>
      <div class="btn-row"><button class="chip sel" data-m="study">📖 Study mode</button><button class="chip" data-m="game">🎯 Challenge mode</button></div>
      <svg class="stage" id="dv-svg" style="max-width:480px" viewBox="0 0 300 220" role="img" aria-label="Cell division phase"></svg>
      <div id="dv-ctrl"></div>
      <div class="feedback" id="dv-fb"></div>
      ${Bio.worksheet("w7-div", [
        "List three differences between mitosis and meiosis (number of divisions, number and type of cells produced, genetic variation).",
        "In which phase do homologous chromosomes separate? In which do sister chromatids separate (in mitosis and in meiosis II)?",
        "If nondisjunction happened in anaphase I, how many chromosomes would the resulting gametes have? Connect this to Down syndrome."
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    let mode = "study", k = 0, target, score = 0, tries = 0;
    function draw(name) { $("dv-svg").innerHTML = PHASES[name](); }
    function study() {
      draw(names[k]);
      $("dv-ctrl").innerHTML = `<div class="lab-output"><strong>${names[k]}</strong><br>${HINTS[names[k]]}</div><div class="btn-row"><button class="btn" id="dv-prev">← Prev</button><button class="btn primary" id="dv-next">Next →</button><span class="small muted">${k + 1} / ${names.length}</span></div>`;
      $("dv-prev").onclick = () => { k = (k - 1 + names.length) % names.length; study(); };
      $("dv-next").onclick = () => { k = (k + 1) % names.length; study(); };
      $("dv-fb").textContent = "";
    }
    function game() {
      target = names[Math.floor(Math.random() * names.length)];
      draw(target);
      $("dv-ctrl").innerHTML = `<div class="chips">${names.map((n) => `<button class="chip" data-a="${n}">${n}</button>`).join("")}</div><div class="small muted">Score: ${score} / ${tries}</div>`;
      Bio.$$("[data-a]", el).forEach((b) => (b.onclick = () => {
        tries++;
        if (b.dataset.a === target) { score++; $("dv-fb").className = "feedback good"; $("dv-fb").textContent = `✓ ${target}. ${HINTS[target]}`; }
        else { $("dv-fb").className = "feedback bad"; $("dv-fb").textContent = `✗ That was ${target}. ${HINTS[target]}`; }
        setTimeout(game, 1800);
      }));
    }
    Bio.$$("[data-m]", el).forEach((b) => b.addEventListener("click", () => {
      mode = b.dataset.m; Bio.$$("[data-m]", el).forEach((x) => x.classList.toggle("sel", x === b));
      mode === "study" ? study() : game();
    }));
    study();
  };
})();
