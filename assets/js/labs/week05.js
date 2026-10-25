/* Week 5 labs: base-pair builder, Chargaff's rules trainer, replication fork stepper. */
(function () {
  const Bio = window.Bio;
  const PAIR = { A: "T", T: "A", G: "C", C: "G" };
  const randSeq = (n) => Array.from({ length: n }, () => "ATGC"[Math.floor(Math.random() * 4)]).join("");

  Bio.labs.basepair = function (el) {
    el.innerHTML = `
      <h3>Lab 5A · Build the Complementary Strand</h3>
      <p>DNA polymerase reads a template strand and adds the matching base opposite each one. Be the polymerase! Click (or type) the base that pairs with each highlighted letter. The ladder shows the hydrogen bonds: <strong>2 for A–T, 3 for G–C</strong>.</p>
      <svg class="stage" id="bp-svg" viewBox="0 0 640 170" role="img" aria-label="DNA ladder"></svg>
      <div class="btn-row" style="justify-content:center">${"ATGC".split("").map((b) => `<button class="btn b-${b}" data-b="${b}" style="font-size:1.3rem;min-width:64px;font-family:var(--mono)">${b}</button>`).join("")}</div>
      <div class="feedback center" id="bp-fb">Template strand ready. Which base pairs with the first letter?</div>
      <div class="readout"><div><b id="bp-done">0</b><span>Strands completed</span></div><div><b id="bp-acc">—</b><span>Accuracy</span></div><div><b id="bp-time">—</b><span>Last strand time</span></div><div><b id="bp-best">—</b><span>Best time</span></div></div>
      <div class="btn-row"><button class="btn small" id="bp-new">New strand</button><label class="small" style="font-weight:400">Length <select id="bp-len"><option>8</option><option selected>12</option><option>16</option></select></label></div>`;
    const $ = (id) => Bio.$("#" + id, el);
    let tmpl, built, t0, done = 0, right = 0, total = 0, best = null;
    function fresh() { tmpl = randSeq(+$("bp-len").value); built = ""; t0 = null; draw(); $("bp-fb").className = "feedback center"; $("bp-fb").textContent = "Which base pairs with the highlighted letter?"; }
    function draw() {
      const n = tmpl.length, w = 600 / n;
      let s = `<text x="10" y="30" font-size="12" fill="currentColor">5'</text><text x="10" y="150" font-size="12" fill="currentColor">3'</text><text x="616" y="30" font-size="12" fill="currentColor">3'</text><text x="616" y="150" font-size="12" fill="currentColor">5'</text>`;
      s += `<line x1="28" y1="26" x2="612" y2="26" stroke="${Bio.css("--c4")}" stroke-width="5"/>`;
      if (built.length) s += `<line x1="28" y1="146" x2="${28 + built.length * w}" y2="146" stroke="${Bio.css("--c1")}" stroke-width="5"/>`;
      for (let i = 0; i < n; i++) {
        const x = 30 + i * w + w / 2, b = tmpl[i];
        const cur = i === built.length;
        s += `<rect x="${x - w / 2 + 3}" y="34" width="${w - 6}" height="34" rx="6" fill="${Bio.css("--base-" + b.toLowerCase())}" ${cur ? `stroke="${Bio.css("--text")}" stroke-width="3"` : ""}/><text x="${x}" y="57" text-anchor="middle" font-family="monospace" font-weight="700" font-size="16" fill="#fff">${b}</text>`;
        if (i < built.length) {
          const p = built[i], hb = b === "A" || b === "T" ? 2 : 3;
          for (let k = 0; k < hb; k++) s += `<line x1="${x - (hb - 1) * 4 + k * 8}" y1="70" x2="${x - (hb - 1) * 4 + k * 8}" y2="102" stroke="currentColor" stroke-dasharray="3 3"/>`;
          s += `<rect x="${x - w / 2 + 3}" y="104" width="${w - 6}" height="34" rx="6" fill="${Bio.css("--base-" + p.toLowerCase())}"/><text x="${x}" y="127" text-anchor="middle" font-family="monospace" font-weight="700" font-size="16" fill="#fff">${p}</text>`;
        } else s += `<rect x="${x - w / 2 + 3}" y="104" width="${w - 6}" height="34" rx="6" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-dasharray="4 3"/>`;
      }
      $("bp-svg").innerHTML = s;
    }
    function press(b) {
      if (built.length >= tmpl.length) return;
      if (!t0) t0 = performance.now();
      total++;
      const want = PAIR[tmpl[built.length]];
      if (b === want) { right++; built += b; $("bp-fb").className = "feedback center good"; $("bp-fb").textContent = `✓ ${tmpl[built.length - 1]}–${b} (${want === "A" || want === "T" ? 2 : 3} hydrogen bonds)`; }
      else { $("bp-fb").className = "feedback center bad"; $("bp-fb").textContent = `✗ ${b} doesn't pair with ${tmpl[built.length]}. Remember: A–T, G–C.`; }
      $("bp-acc").textContent = Math.round((right / total) * 100) + "%";
      draw();
      if (built.length === tmpl.length) {
        const t = (performance.now() - t0) / 1000; done++;
        if (best == null || t < best) best = t;
        $("bp-done").textContent = done; $("bp-time").textContent = t.toFixed(1) + " s"; $("bp-best").textContent = best.toFixed(1) + " s";
        $("bp-fb").innerHTML = `🎉 Strand complete! Real DNA polymerase adds ~50 bases per second in humans and ~1000 per second in bacteria. <button class="btn small" id="bp-again">Next strand</button>`;
        $("bp-again").addEventListener("click", fresh);
      }
    }
    Bio.$$("[data-b]", el).forEach((b) => b.addEventListener("click", () => press(b.dataset.b)));
    el.tabIndex = 0;
    el.addEventListener("keydown", (e) => { const k = e.key.toUpperCase(); if (PAIR[k] && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "INPUT") press(k); });
    $("bp-new").addEventListener("click", fresh);
    $("bp-len").addEventListener("change", fresh);
    fresh();
    Bio.live(draw);
  };

  Bio.labs.chargaff = function (el) {
    const DATA = [["Human", 30.9, 29.4, 19.9, 19.8], ["Chicken", 28.8, 29.2, 20.5, 21.5], ["Wheat", 27.3, 27.1, 22.7, 22.8], ["Yeast", 31.3, 32.9, 18.7, 17.1], ["E. coli", 24.7, 23.6, 26.0, 25.7], ["Sea urchin", 32.8, 32.1, 17.7, 17.3]];
    el.innerHTML = `
      <h3>Lab 5B · Chargaff's Rules</h3>
      <p>In the late 1940s, Erwin Chargaff measured the base composition of DNA from many species. Study his kind of data below. What patterns do you see?</p>
      <div class="table-scroll"><table class="simple"><tr><th>Organism</th><th>%A</th><th>%T</th><th>%G</th><th>%C</th><th>A/T</th><th>G/C</th></tr>
        ${DATA.map(([n, a, t, g, c]) => `<tr><td>${n}</td><td>${a}</td><td>${t}</td><td>${g}</td><td>${c}</td><td>${(a / t).toFixed(2)}</td><td>${(g / c).toFixed(2)}</td></tr>`).join("")}</table></div>
      <p class="small muted">Values are approximate measurements from classic studies; real measurements have experimental error, so ratios aren't exactly 1.00.</p>
      <div class="lab-output">
        <strong>Practice:</strong> <span id="cg-q"></span>
        <div class="btn-row">${["A", "T", "G", "C"].map((b) => `<label class="small">%${b} <input type="number" id="cg-${b}" style="width:80px"></label>`).join("")}<button class="btn small primary" id="cg-check">Check</button><button class="btn small" id="cg-new">New problem</button></div>
        <div class="feedback" id="cg-fb"></div><div class="small muted">Solved: <span id="cg-n">0</span></div>
      </div>
      ${Bio.worksheet("w5-chg", [
        "Describe the two patterns (rules) in Chargaff's data. How did the double-helix model explain them?",
        "Base composition differs between species (compare human and E. coli). Why does this make sense if DNA carries genetic information?"
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    let cur, n = 0;
    function make() {
      const given = "ATGC"[Math.floor(Math.random() * 4)], v = Bio.randInt(12, 38);
      const at = given === "A" || given === "T" ? v : 50 - v, gc = 50 - at;
      cur = { A: at, T: at, G: gc, C: gc, given };
      $("cg-q").innerHTML = `A double-stranded DNA sample is <strong>${v}% ${given}</strong>. Fill in all four bases.`;
      "ATGC".split("").forEach((b) => { $("cg-" + b).value = b === given ? v : ""; });
      $("cg-fb").textContent = "";
    }
    $("cg-check").addEventListener("click", () => {
      const ok = "ATGC".split("").every((b) => +$("cg-" + b).value === cur[b]);
      $("cg-fb").className = "feedback " + (ok ? "good" : "bad");
      $("cg-fb").textContent = ok ? "✓ Correct! A = T and G = C, and all four add to 100%." : `✗ Hint: ${cur.given} = its partner; then the other pair splits the remaining ${100 - 2 * cur[cur.given]}% equally.`;
      if (ok) $("cg-n").textContent = ++n;
    });
    $("cg-new").addEventListener("click", make);
    make();
  };

  Bio.labs.replication = function (el) {
    const STEPS = [
      ["Original double helix", "Two antiparallel parent strands (blue) held together by hydrogen bonds between base pairs. Replication begins at sites called origins; a human chromosome has thousands."],
      ["Helicase unzips", "Helicase breaks the hydrogen bonds, opening a Y-shaped replication fork. Single-strand binding proteins keep the strands apart, and topoisomerase relieves the twisting ahead of the fork."],
      ["Primase lays primers", "DNA polymerase can't start from scratch. It can only add to an existing 3' end. Primase lays down short RNA primers (orange) as starting points."],
      ["Leading strand: continuous", "On the leading strand, DNA polymerase (green) builds continuously 5'→3', following the fork as it opens."],
      ["Lagging strand: Okazaki fragments", "The lagging strand runs the opposite way, so polymerase builds it backward in short pieces (Okazaki fragments), each needing its own primer."],
      ["Primers replaced, ligase seals", "Another polymerase swaps RNA primers for DNA, and DNA ligase seals the gaps. Proofreading makes errors very rare, about 1 in a billion bases after repair."],
      ["Two identical molecules", "Each new DNA molecule has one parent strand (blue) and one new strand (green). This is semiconservative replication, proven by Meselson and Stahl in 1958."]
    ];
    el.innerHTML = `
      <h3>Lab 5C · Inside the Replication Fork</h3>
      <p>Step through DNA replication. Watch the leading and lagging strands carefully.</p>
      <svg class="stage" id="rp-svg" viewBox="0 0 640 260" role="img" aria-label="Replication fork diagram"></svg>
      <div class="lab-output" id="rp-info"></div>
      <div class="btn-row"><button class="btn" id="rp-prev">← Back</button><button class="btn primary" id="rp-next">Next step →</button><span class="muted small" id="rp-n"></span></div>
      <div class="legend"><span><i style="background:${"#2a6fc9"}"></i>Parent strand</span><span><i style="background:#2e8b57"></i>New DNA</span><span><i style="background:#f08c3a"></i>RNA primer</span></div>
      ${Bio.worksheet("w5-rep", [
        "Why is one strand made continuously and the other in fragments?",
        "Explain what 'semiconservative' means and why it matters for passing on genetic information accurately.",
        "Your cells copy ~6 billion bases each division. Why is proofreading by DNA polymerase so important? (Think ahead to mutations, Week 6.)"
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    let k = 0;
    const BLUE = "#2a6fc9", GREEN = "#2e8b57", ORANGE = "#f08c3a";
    function draw() {
      let s = "";
      const line = (x1, y1, x2, y2, c, w = 6) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
      const rungs = (x1, x2, y1, y2) => { let r = ""; for (let x = x1; x <= x2; x += 18) r += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="currentColor" stroke-opacity=".35" stroke-width="2"/>`; return r; };
      const t = (x, y, txt) => `<text x="${x}" y="${y}" font-size="12" fill="currentColor">${txt}</text>`;
      if (k === 0) {
        s += rungs(40, 600, 112, 148) + line(30, 110, 610, 110, BLUE) + line(30, 150, 610, 150, BLUE);
        s += t(14, 106, "5'") + t(14, 166, "3'") + t(614, 106, "3'") + t(614, 166, "5'");
      } else if (k < 6) {
        const fork = 330;
        s += rungs(fork, 600, 112, 148) + line(fork, 110, 610, 110, BLUE) + line(fork, 150, 610, 150, BLUE);
        s += line(fork, 110, 40, 40, BLUE) + line(fork, 150, 40, 220, BLUE);
        s += `<circle cx="${fork + 6}" cy="130" r="16" fill="#b07cc6"/><text x="${fork + 6}" y="134" text-anchor="middle" font-size="10" fill="#fff">helicase</text>`;
        s += t(30, 30, "parent 3'→5' (leading template)") + t(30, 240, "parent 5'→3' (lagging template)");
        const P = (f) => [fork + (40 - fork) * f, 110 + (40 - 110) * f]; // along top arm
        const Q = (f) => [fork + (40 - fork) * f, 150 + (220 - 150) * f]; // along bottom arm
        const off = (pt, dy) => [pt[0], pt[1] + dy];
        if (k >= 2) {
          // leading primer near origin (far end of top arm)
          const a = off(P(0.95), 14), b = off(P(0.85), 14);
          s += line(a[0], a[1], b[0], b[1], ORANGE, 7);
          // lagging primers
          [0.25, 0.55, 0.85].forEach((f) => { const a2 = off(Q(f), -14), b2 = off(Q(f - 0.08), -14); s += line(a2[0], a2[1], b2[0], b2[1], ORANGE, 7); });
        }
        if (k >= 3) { const a = off(P(0.85), 14), b = off(P(0.06), 14); s += line(a[0], a[1], b[0], b[1], k >= 5 ? GREEN : GREEN, 6); s += t(160, 92, "leading strand → toward fork"); }
        if (k >= 4) {
          [[0.17, 0.02], [0.47, 0.27], [0.77, 0.57]].forEach(([f1, f2]) => { const a = off(Q(f1), -14), b = off(Q(f2 + (k >= 5 ? 0 : 0.03)), -14); s += line(a[0], a[1], b[0], b[1], GREEN, 6); });
          s += t(150, 186, "← Okazaki fragments (built away from fork)");
        }
        if (k >= 5) {
          // primers replaced: paint over primers in green, mark ligase
          [0.25, 0.55, 0.85].forEach((f) => { const a2 = off(Q(f), -14), b2 = off(Q(f - 0.09), -14); s += line(a2[0], a2[1], b2[0], b2[1], GREEN, 6); });
          const a = off(P(0.95), 14), b = off(P(0.84), 14); s += line(a[0], a[1], b[0], b[1], GREEN, 6);
          [0.27, 0.57].forEach((f) => { const c = off(Q(f), -14); s += `<circle cx="${c[0]}" cy="${c[1]}" r="9" fill="#d0661c"/><text x="${c[0]}" y="${c[1] - 12}" text-anchor="middle" font-size="10" fill="currentColor">ligase</text>`; });
        }
      } else {
        [60, 170].forEach((y) => { s += rungs(40, 600, y + 2, y + 38) + line(30, y, 610, y, BLUE) + line(30, y + 40, 610, y + 40, GREEN); });
        s += t(250, 52, "Daughter molecule 1: old + new") + t(250, 162, "Daughter molecule 2: old + new");
      }
      $("rp-svg").innerHTML = s;
      $("rp-info").innerHTML = `<strong>Step ${k + 1}: ${STEPS[k][0]}.</strong> ${STEPS[k][1]}`;
      $("rp-n").textContent = `${k + 1} / ${STEPS.length}`;
      $("rp-prev").disabled = k === 0; $("rp-next").textContent = k === STEPS.length - 1 ? "Start over ↺" : "Next step →";
    }
    $("rp-next").addEventListener("click", () => { k = (k + 1) % STEPS.length; draw(); });
    $("rp-prev").addEventListener("click", () => { k = Math.max(0, k - 1); draw(); });
    draw();
  };
})();
