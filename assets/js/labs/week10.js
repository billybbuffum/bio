/* Week 10 labs: blood flow pathway, blood typing & transfusion, epidemic & vaccination simulator. */
(function () {
  const Bio = window.Bio;

  /* ---------- Blood flow ---------- */
  const PATH = [
    ["Body tissues (capillaries)", "body", "Cells have taken O₂ and dumped CO₂. The blood is now deoxygenated."],
    ["Superior & inferior vena cava", "vc", "The largest veins return blood from the upper and lower body."],
    ["Right atrium", "ra", "Receives deoxygenated blood from the body."],
    ["Tricuspid valve", "ra", "A one-way valve that stops backflow into the right atrium."],
    ["Right ventricle", "rv", "Pumps blood to the lungs, which needs only low pressure."],
    ["Pulmonary valve", "rv", "Opens as the right ventricle contracts."],
    ["Pulmonary arteries", "pa", "The only arteries carrying deoxygenated blood."],
    ["Lungs (alveolar capillaries)", "lungs", "CO₂ diffuses out and O₂ diffuses in, binding hemoglobin."],
    ["Pulmonary veins", "pv", "The only veins carrying oxygenated blood."],
    ["Left atrium", "la", "Receives oxygen-rich blood from the lungs."],
    ["Mitral (bicuspid) valve", "la", "A two-flap valve between the left chambers."],
    ["Left ventricle", "lv", "The thickest wall. It pumps to the entire body at high pressure."],
    ["Aortic valve", "lv", "Opens as the left ventricle contracts. The 'lub-dub' sounds are valves closing."],
    ["Aorta", "ao", "The largest artery. It branches to deliver O₂-rich blood everywhere, then back to the body tissues."]
  ];
  function heartSVG(active, doneSet) {
    const col = (id, base) => (id === active ? "#ff3d7f" : doneSet.has(id) ? base : base + "55");
    return `<svg viewBox="0 0 360 300" class="stage" style="max-width:420px" role="img" aria-label="Schematic heart showing the current step">
      <g font-family="system-ui" font-size="11" text-anchor="middle">
        <rect x="120" y="8" width="120" height="40" rx="10" fill="${col("lungs", "#8fb3ea")}"/><text x="180" y="32" fill="#111">LUNGS</text>
        <rect x="120" y="252" width="120" height="40" rx="10" fill="${col("body", "#f2a1a1")}"/><text x="180" y="276" fill="#111">BODY</text>
        <rect x="60" y="80" width="105" height="60" rx="10" fill="${col("ra", "#5b7fc7")}"/><text x="112" y="114" fill="#fff">Right atrium</text>
        <rect x="60" y="150" width="105" height="80" rx="10" fill="${col("rv", "#5b7fc7")}"/><text x="112" y="194" fill="#fff">Right ventricle</text>
        <rect x="195" y="80" width="105" height="60" rx="10" fill="${col("la", "#d9534f")}"/><text x="247" y="114" fill="#fff">Left atrium</text>
        <rect x="195" y="150" width="105" height="80" rx="10" fill="${col("lv", "#d9534f")}"/><text x="247" y="194" fill="#fff">Left ventricle</text>
        <path d="M30 270 V110 H58" stroke="${col("vc", "#5b7fc7")}" stroke-width="10" fill="none"/><text x="20" y="200" transform="rotate(-90 20 200)" fill="currentColor">vena cava</text>
        <path d="M112 150 C 112 145, 90 120, 100 60 C 105 40, 115 30, 120 28" stroke="${col("pa", "#5b7fc7")}" stroke-width="8" fill="none" opacity=".9"/><text x="84" y="64" fill="currentColor">pulm. artery</text>
        <path d="M240 28 C 260 30, 262 60, 247 78" stroke="${col("pv", "#d9534f")}" stroke-width="8" fill="none"/><text x="282" y="58" fill="currentColor">pulm. veins</text>
        <path d="M300 190 H330 V270 H242" stroke="${col("ao", "#d9534f")}" stroke-width="10" fill="none"/><text x="345" y="200" transform="rotate(90 345 200)" fill="currentColor">aorta</text>
        <text x="180" y="146" fill="currentColor" font-size="10">septum</text><line x1="180" y1="80" x2="180" y2="230" stroke="currentColor" stroke-width="3"/>
      </g></svg>`;
  }
  Bio.labs.bloodflow = function (el) {
    el.innerHTML = `
      <h3>Lab 10A · Trace a Red Blood Cell</h3>
      <p>Starting in the body's capillaries, click the structures in the order a red blood cell passes through them on one full loop. Each correct step lights up on the diagram. (Diagram is drawn as if facing the person, so their right side is on your left.)</p>
      <div class="two-col"><div id="bf-svg"></div><div><ol id="bf-done" class="small"></ol><div class="feedback" id="bf-fb"></div></div></div>
      <div class="chips" id="bf-opts"></div>
      <div class="readout"><div><b id="bf-m">0</b><span>Mistakes</span></div><div><b id="bf-s">0/${PATH.length}</b><span>Steps</span></div></div>
      <div class="btn-row"><button class="btn small" id="bf-reset">Start over</button></div>
      ${Bio.worksheet("w10-bf", [
        "Why does the left ventricle have a much thicker wall than the right ventricle?",
        "Explain why 'arteries carry oxygenated blood' is not quite right. What actually defines an artery?",
        "Why does the heart need two separate circuits (pulmonary and systemic) rather than one loop?"
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    let step, mistakes, done;
    function reset() {
      step = 0; mistakes = 0; done = new Set();
      $("bf-opts").innerHTML = Bio.shuffle(PATH.map((p, i) => i)).map((i) => `<button class="chip" data-i="${i}">${PATH[i][0]}</button>`).join("");
      $("bf-done").innerHTML = ""; $("bf-fb").textContent = "Click the first step."; $("bf-fb").className = "feedback";
      render(null);
    }
    function render(active) { $("bf-svg").innerHTML = heartSVG(active, done); $("bf-m").textContent = mistakes; $("bf-s").textContent = `${step}/${PATH.length}`; }
    $("bf-opts").addEventListener("click", (e) => {
      const b = e.target.closest("[data-i]"); if (!b || b.disabled) return;
      const i = +b.dataset.i;
      if (i === step) {
        b.disabled = true; b.classList.add("ok"); done.add(PATH[i][1]);
        $("bf-done").insertAdjacentHTML("beforeend", `<li><strong>${PATH[i][0]}</strong>: ${PATH[i][2]}</li>`);
        step++; $("bf-fb").className = "feedback good";
        $("bf-fb").textContent = step === PATH.length ? `🎉 Full circuit complete with ${mistakes} mistake${mistakes === 1 ? "" : "s"}! A real red cell makes this trip in about a minute at rest.` : "✓ Correct. What's next?";
        render(PATH[i][1]);
      } else {
        mistakes++; $("bf-fb").className = "feedback bad"; $("bf-fb").textContent = `✗ Not yet. Blood is currently at: ${step ? PATH[step - 1][0] : "body tissues (start)"}.`; render(step ? PATH[step - 1][1] : null);
      }
    });
    $("bf-reset").addEventListener("click", reset);
    reset();
  };

  /* ---------- Blood typing ---------- */
  const TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const ant = (t) => ({ A: t.includes("A"), B: t.includes("B"), Rh: t.endsWith("+") });
  const canGive = (donor, recip) => { const d = ant(donor), r = ant(recip); return (!d.A || r.A) && (!d.B || r.B) && (!d.Rh || r.Rh); };
  Bio.labs.bloodtype = function (el) {
    el.innerHTML = `
      <h3>Lab 10B · Blood Typing & Transfusion</h3>
      <p>A patient arrives in the emergency room. Add each antiserum to a drop of their blood. <strong>Clumping (agglutination)</strong> means the antibodies found their matching antigen on the red cells. Determine the blood type, then choose safe donors.</p>
      <div class="btn-row"><span>Patient #<b id="bt-id"></b></span><button class="btn small" id="bt-new">New patient</button></div>
      <svg class="stage" id="bt-svg" viewBox="0 0 480 170" role="img" aria-label="Three test wells"></svg>
      <div class="btn-row" style="justify-content:space-around"><button class="btn small" data-w="A">Add anti-A</button><button class="btn small" data-w="B">Add anti-B</button><button class="btn small" data-w="Rh">Add anti-Rh (D)</button></div>
      <div class="lab-output"><strong>1. Patient's blood type:</strong><div class="chips" id="bt-type">${TYPES.map((t) => `<button class="chip" data-t="${t}">${t}</button>`).join("")}</div><div class="feedback" id="bt-fb1"></div>
        <strong>2. Which donor blood types could this patient safely receive? (select all, then check)</strong><div class="chips" id="bt-don">${TYPES.map((t) => `<button class="chip" data-d="${t}">${t}</button>`).join("")}</div>
        <button class="btn small primary" id="bt-chk">Check donors</button><div class="feedback" id="bt-fb2"></div></div>
      <details><summary>Reference: antigens and antibodies</summary><div class="table-scroll"><table class="simple"><tr><th>Type</th><th>Antigens on red cells</th><th>Antibodies in plasma</th><th>Can receive</th></tr>
        <tr><td>A</td><td>A</td><td>anti-B</td><td>A, O</td></tr><tr><td>B</td><td>B</td><td>anti-A</td><td>B, O</td></tr><tr><td>AB</td><td>A and B</td><td>none</td><td>A, B, AB, O</td></tr><tr><td>O</td><td>none</td><td>anti-A and anti-B</td><td>O</td></tr></table>
        <p class="small">Rh⁻ people can receive only Rh⁻ blood (for red cell transfusions). Rh⁺ people can receive either.</p></div></details>
      ${Bio.worksheet("w10-bt", [
        "Explain why giving type A blood to a type B patient is dangerous. What do the patient's antibodies do?",
        "Why is O⁻ called the universal donor, and AB⁺ the universal recipient?",
        "Connect to Week 7: what are the possible blood types of children of an Iᴬi (type A) and Iᴮi (type B) couple?"
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    let pt, added, picks;
    function well(cx, label, state) {
      let s = `<circle cx="${cx}" cy="80" r="62" fill="#f7f1ec" stroke="#999" stroke-width="2"/><text x="${cx}" y="162" text-anchor="middle" font-size="13" fill="currentColor">${label}</text>`;
      for (let k = 0; k < 60; k++) {
        const h = (n) => { const x = Math.sin(n) * 43758.5453; return x - Math.floor(x); };
        const a = 6.283 * h(k * 78.233 + 1), r = 52 * Math.sqrt(h(k * 12.9898 + 7));
        let x = cx + r * Math.cos(a), y = 80 + r * Math.sin(a);
        if (state === "clump") { const c = k % 5, ca = c * 1.256; x = cx + 28 * Math.cos(ca) + (x - cx) * 0.18; y = 80 + 28 * Math.sin(ca) + (y - 80) * 0.18; }
        s += `<circle cx="${x}" cy="${y}" r="${state === "clump" ? 4 : 3.2}" fill="${state === "none" ? "#e6b8b5" : "#c0392b"}" opacity="${state === "none" ? 0.6 : 0.9}"/>`;
      }
      if (state === "clump") s += `<text x="${cx}" y="20" text-anchor="middle" font-size="12" fill="#c0392b">clumped!</text>`;
      if (state === "smooth") s += `<text x="${cx}" y="20" text-anchor="middle" font-size="12" fill="currentColor">smooth</text>`;
      return s;
    }
    function draw() {
      const a = ant(pt);
      $("bt-svg").innerHTML = [["A", 80, "anti-A"], ["B", 240, "anti-B"], ["Rh", 400, "anti-Rh"]].map(([k, x, lab]) => well(x, lab, !added.has(k) ? "none" : a[k] ? "clump" : "smooth")).join("");
    }
    function fresh() {
      const weights = { "O+": 37, "A+": 30, "B+": 10, "AB+": 4, "O-": 7, "A-": 7, "B-": 3, "AB-": 2 };
      let r = Math.random() * 100; pt = "O+";
      for (const [t, w] of Object.entries(weights)) { if ((r -= w) < 0) { pt = t; break; } }
      added = new Set(); picks = new Set();
      $("bt-id").textContent = Bio.randInt(1000, 9999);
      Bio.$$(".chip", el).forEach((c) => c.classList.remove("sel", "ok", "no"));
      $("bt-fb1").textContent = ""; $("bt-fb2").textContent = "";
      draw();
    }
    Bio.$$("[data-w]", el).forEach((b) => b.addEventListener("click", () => { added.add(b.dataset.w); draw(); }));
    $("bt-type").addEventListener("click", (e) => {
      const b = e.target.closest("[data-t]"); if (!b) return;
      if (added.size < 3) { $("bt-fb1").className = "feedback bad"; $("bt-fb1").textContent = "Test with all three antisera first!"; return; }
      Bio.$$("[data-t]", el).forEach((c) => c.classList.remove("ok", "no"));
      const ok = b.dataset.t === pt;
      b.classList.add(ok ? "ok" : "no");
      $("bt-fb1").className = "feedback " + (ok ? "good" : "bad");
      $("bt-fb1").textContent = ok ? `✓ Type ${pt}.` : "✗ Re-check: clumping with anti-A means A antigen present, and so on.";
    });
    $("bt-don").addEventListener("click", (e) => { const b = e.target.closest("[data-d]"); if (!b) return; b.classList.remove("ok", "no"); b.classList.toggle("sel"); picks.has(b.dataset.d) ? picks.delete(b.dataset.d) : picks.add(b.dataset.d); });
    $("bt-chk").addEventListener("click", () => {
      let right = true;
      Bio.$$("[data-d]", el).forEach((c) => {
        const safe = canGive(c.dataset.d, pt), chosen = picks.has(c.dataset.d);
        c.classList.remove("sel", "ok", "no");
        if (safe) c.classList.add("ok"); else if (chosen) c.classList.add("no");
        if (safe !== chosen) right = false;
      });
      $("bt-fb2").className = "feedback " + (right ? "good" : "bad");
      $("bt-fb2").textContent = right ? "✓ Perfect. Green = safe donors." : `Green shows all safe donors for ${pt}; red were unsafe choices. A wrong transfusion triggers agglutination and destruction of donor cells.`;
    });
    $("bt-new").addEventListener("click", fresh);
    fresh();
  };

  /* ---------- Epidemic & vaccination ---------- */
  Bio.labs.epidemic = function (el) {
    el.innerHTML = `
      <h3>Lab 10C · Outbreak! Vaccines & Herd Immunity</h3>
      <p>Simulate an outbreak in a town of 10,000 people using an <strong>SIR model</strong> (Susceptible → Infected → Recovered). <strong>R₀</strong> is how many people one sick person infects in a fully susceptible population. Vaccinate part of the town and watch what happens.</p>
      <div class="lab-controls">
        <div class="ctl"><label>R₀ <output id="ep-rv"></output></label><input type="range" id="ep-r" min="1" max="18" step="0.1" value="2.5"></div>
        <div class="ctl"><label>Vaccinated <output id="ep-vv"></output></label><input type="range" id="ep-v" min="0" max="99" value="0"></div>
        <div class="ctl"><label>Vaccine effectiveness <output id="ep-ev"></output></label><input type="range" id="ep-e" min="50" max="100" value="95"></div>
      </div>
      <div class="btn-row small"><span class="muted">Disease presets (approximate R₀):</span><button class="btn small" data-r="1.3">Seasonal flu ~1.3</button><button class="btn small" data-r="2.8">Early COVID-19 ~2.5–3</button><button class="btn small" data-r="6">Polio ~5–7</button><button class="btn small" data-r="15">Measles ~12–18</button></div>
      <canvas id="ep-cv" style="height:300px"></canvas>
      <div class="readout"><div><b id="ep-tot">—</b><span>Total ever infected</span></div><div><b id="ep-pk">—</b><span>Peak sick at once</span></div><div><b id="ep-hit">—</b><span>Herd immunity threshold (1 − 1/R₀)</span></div><div><b id="ep-prot">—</b><span>Effectively immune at start</span></div></div>
      <p id="ep-msg" class="small"></p>
      <p class="small muted">Simplified model: infectious for ~7 days, everyone mixes equally, and no deaths, births, or behavior change. Real epidemics are messier, but the logic of herd immunity holds.</p>
      ${Bio.worksheet("w10-ep", [
        "With R₀ = 2.5 and no vaccine, what share of the town gets infected? Now find the lowest vaccination level that prevents a large outbreak. Compare it to the herd immunity threshold.",
        "Why does measles require ~95% vaccination coverage while flu needs much less?",
        "Explain how herd immunity protects people who can't be vaccinated (newborns, people on chemotherapy). Use the idea of breaking chains of transmission.",
        "Explain at the cellular level why a vaccinated person is protected. Use: antigen, B cell, T cell, memory cell."
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    function run() {
      const R0 = +$("ep-r").value, vac = +$("ep-v").value / 100, eff = +$("ep-e").value / 100, N = 10000;
      $("ep-rv").textContent = R0.toFixed(1); $("ep-vv").textContent = Math.round(vac * 100) + "%"; $("ep-ev").textContent = Math.round(eff * 100) + "%";
      const gamma = 1 / 7, beta = R0 * gamma, immune0 = vac * eff * N;
      let I = 5, R = immune0, S = N - I - R, peak = I, cum = I;
      const sS = [], sI = [], sR = [];
      const days = 365, dt = 0.25;
      for (let k = 0; k <= days / dt; k++) {
        const t = k * dt;
        if (k % 4 === 0) { sS.push([t, S]); sI.push([t, I]); sR.push([t, R]); }
        const inf = (beta * S * I) / N * dt, rec = gamma * I * dt;
        S -= inf; I += inf - rec; R += rec; cum += inf;
        peak = Math.max(peak, I);
      }
      const hit = R0 > 1 ? 1 - 1 / R0 : 0;
      $("ep-tot").textContent = `${Math.round(cum).toLocaleString()} (${Math.round((cum / N) * 100)}%)`;
      $("ep-pk").textContent = Math.round(peak).toLocaleString();
      $("ep-hit").textContent = Math.round(hit * 100) + "%";
      $("ep-prot").textContent = Math.round(vac * eff * 100) + "%";
      const big = cum / N > 0.05;
      $("ep-msg").innerHTML = vac * eff >= hit ? "✅ <strong>Herd immunity reached.</strong> Each case infects fewer than one new person on average, so the outbreak fizzles." : big ? "⚠️ <strong>Large outbreak.</strong> Not enough people are immune to stop sustained spread." : "The outbreak stays fairly small but isn't fully blocked.";
      Bio.chart($("ep-cv"), {
        series: [{ name: "Susceptible", points: sS, noDots: true, color: Bio.css("--c4") }, { name: "Infected", points: sI, noDots: true, color: Bio.css("--bad") }, { name: "Recovered / immune", points: sR, noDots: true, color: Bio.css("--c1") }],
        xLabel: "Day", yLabel: "People", xMin: 0, xMax: 365, yMin: 0, yMax: N
      });
    }
    el.addEventListener("input", (e) => { if (e.target.type === "range") run(); });
    Bio.$$("[data-r]", el).forEach((b) => b.addEventListener("click", () => { $("ep-r").value = b.dataset.r; run(); }));
    Bio.live(run);
  };
})();
