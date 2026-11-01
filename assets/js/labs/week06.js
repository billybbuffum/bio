/* Week 6 labs: transcription & translation machine, mutation lab, codon table. */
(function () {
  const Bio = window.Bio;
  const B = "UCAG";
  const AA = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG";
  const CODE = {};
  let i = 0;
  for (const a of B) for (const b of B) for (const c of B) CODE[a + b + c] = AA[i++];
  const NAMES = { A: "Ala", R: "Arg", N: "Asn", D: "Asp", C: "Cys", Q: "Gln", E: "Glu", G: "Gly", H: "His", I: "Ile", L: "Leu", K: "Lys", M: "Met", F: "Phe", P: "Pro", S: "Ser", T: "Thr", W: "Trp", Y: "Tyr", V: "Val", "*": "STOP" };
  const PROPS = { A: "nonpolar", G: "nonpolar", V: "nonpolar", L: "nonpolar", I: "nonpolar", P: "nonpolar", F: "nonpolar", M: "nonpolar", W: "nonpolar", S: "polar", T: "polar", C: "polar", Y: "polar", N: "polar", Q: "polar", D: "acidic (−)", E: "acidic (−)", K: "basic (+)", R: "basic (+)", H: "basic (+)" };
  Bio.CODE = CODE;
  const comp = { A: "U", T: "A", G: "C", C: "G" };
  const toMRNAfromCoding = (dna) => dna.replace(/T/g, "U");
  const toMRNAfromTemplate = (dna) => dna.split("").map((b) => comp[b]).join("");

  /** Translate from the first AUG; returns {codons, protein, startIdx}. */
  function translate(mrna) {
    const start = mrna.indexOf("AUG");
    if (start < 0) return { codons: [], protein: "", start: -1 };
    const codons = [];
    let protein = "";
    for (let k = start; k + 3 <= mrna.length; k += 3) {
      const cod = mrna.slice(k, k + 3), aa = CODE[cod];
      codons.push(cod); protein += aa;
      if (aa === "*") break;
    }
    return { codons, protein, start };
  }
  Bio.translate = translate;

  const clean = (s) => s.toUpperCase().replace(/[^ATGC]/g, "");
  const aaChip = (a, diff) => `<span title="${NAMES[a]}${PROPS[a] ? " · " + PROPS[a] : ""}" style="display:inline-block;margin:2px;padding:3px 7px;border-radius:7px;font-family:var(--mono);font-size:.9rem;background:${a === "*" ? "var(--bad-soft)" : diff ? "var(--warn-soft)" : "var(--accent-soft)"};color:${a === "*" ? "var(--bad)" : diff ? "var(--warn)" : "var(--accent)"};${diff ? "outline:2px solid var(--warn)" : ""}">${NAMES[a]}</span>`;

  function codonTable(hl) {
    let h = `<div class="table-scroll"><table class="simple" style="font-family:var(--mono);font-size:.82rem;text-align:center"><tr><th>1st ↓ / 2nd →</th>${[...B].map((b) => `<th class="b-${b}">${b}</th>`).join("")}</tr>`;
    for (const a of B) {
      h += `<tr><th class="b-${a}">${a}</th>`;
      for (const b of B) {
        h += "<td>" + [...B].map((c) => { const cod = a + b + c; const on = hl && hl.has(cod); return `<div style="${on ? "background:var(--warn-soft);font-weight:700;border-radius:4px" : ""}">${cod} ${NAMES[CODE[cod]]}</div>`; }).join("") + "</td>";
      }
      h += "</tr>";
    }
    return h + "</table></div>";
  }

  /* ---------- Central dogma machine ---------- */
  Bio.labs.dogma = function (el) {
    const SECRET = { "Hidden word 1": "ATGGAAGATATTTGCATCAACGAGTAA", "Hidden word 2": "ATGTACAGCACTGAGCGTTATTAA", "Insulin B chain (start)": "ATGTTTGTGAACCAACACCTGTGCGGCTCACACCTGGTGGAAGCTCTCTACCTAGTGTGCGGGGAACGAGGCTTCTTCTACACACCCAAGACCTAA" };
    el.innerHTML = `
      <h3>Lab 6A · The Central Dogma Machine</h3>
      <p>Enter a DNA sequence and watch it become mRNA, then protein. Translation begins at the first <strong>AUG</strong> and ends at a <strong>stop</strong> codon. Hover over amino acids to see their chemical properties.</p>
      <div class="field"><label for="cd-in">DNA sequence</label><textarea id="cd-in" class="seq" style="min-height:70px" spellcheck="false">ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG</textarea></div>
      <div class="btn-row">
        <label style="font-weight:400"><input type="radio" name="cd-strand" value="coding" checked> This is the <strong>coding</strong> strand (same as mRNA, with T)</label>
        <label style="font-weight:400"><input type="radio" name="cd-strand" value="template"> This is the <strong>template</strong> strand</label>
      </div>
      <div class="btn-row small"><span class="muted">Try:</span>${Object.keys(SECRET).map((k) => `<button class="btn small" data-s="${k}">${k}</button>`).join("")}<button class="btn small" id="cd-rand">Random gene</button></div>
      <div class="lab-output">
        <div class="small muted">Step 1, Transcription (nucleus): mRNA 5'→3'</div><div class="seq" id="cd-m"></div>
        <div class="small muted" style="margin-top:10px">Step 2, Translation (ribosome): codons → amino acids</div><div id="cd-c"></div>
        <div class="small muted" style="margin-top:10px">One-letter protein sequence</div><div class="seq" id="cd-p" style="font-weight:700"></div>
        <div id="cd-note" class="small"></div>
      </div>
      <details><summary>Show the codon table (used codons highlighted)</summary><div id="cd-table"></div></details>
      ${Bio.worksheet("w6-dogma", [
        "Decode both hidden words using one-letter amino acid codes. What do they spell? Check one codon by hand using the codon table.",
        "Switch the sample sequence to 'template strand'. Why does the protein change completely?",
        "Insulin is made by pancreas cells. List every location and molecule involved in going from the insulin gene to insulin protein in the blood (connect to Week 3).",
        "Why is it useful that the code is redundant (several codons per amino acid)?"
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    function run() {
      const dna = clean($("cd-in").value);
      const strand = Bio.$('input[name="cd-strand"]:checked', el).value;
      const mrna = strand === "coding" ? toMRNAfromCoding(dna) : toMRNAfromTemplate(dna);
      $("cd-m").innerHTML = Bio.colorSeq(mrna) || "<span class='muted'>—</span>";
      const t = translate(mrna);
      if (t.start < 0) { $("cd-c").innerHTML = "<span class='feedback bad'>No AUG start codon found, so no protein is made.</span>"; $("cd-p").textContent = ""; $("cd-note").textContent = ""; $("cd-table").innerHTML = codonTable(); return; }
      $("cd-c").innerHTML = t.codons.map((c) => `<span style="display:inline-flex;flex-direction:column;align-items:center;margin:2px"><span class="seq" style="font-size:.85rem">${Bio.colorSeq(c)}</span>${aaChip(CODE[c])}</span>`).join("");
      $("cd-p").textContent = t.protein.replace("*", "") ;
      const ended = t.protein.endsWith("*");
      $("cd-note").innerHTML = `Start codon at mRNA position ${t.start + 1}. ${t.codons.length - (ended ? 1 : 0)} amino acids. ${ended ? "Ended at a stop codon ✓" : "⚠️ No stop codon: the ribosome ran off the end."}`;
      $("cd-table").innerHTML = codonTable(new Set(t.codons));
    }
    $("cd-in").addEventListener("input", run);
    Bio.$$('input[name="cd-strand"]', el).forEach((r) => r.addEventListener("change", run));
    Bio.$$("[data-s]", el).forEach((b) => b.addEventListener("click", () => { $("cd-in").value = SECRET[b.dataset.s]; Bio.$('input[value="coding"]', el).checked = true; run(); }));
    $("cd-rand").addEventListener("click", () => {
      const sense = Object.keys(CODE).filter((c) => CODE[c] !== "*");
      let s = "AUG"; for (let k = 0; k < 12; k++) s += sense[Math.floor(Math.random() * sense.length)];
      s += ["UAA", "UAG", "UGA"][Bio.randInt(0, 2)];
      $("cd-in").value = s.replace(/U/g, "T"); Bio.$('input[value="coding"]', el).checked = true; run();
    });
    run();
  };

  /* ---------- Mutation lab ---------- */
  const HBB = "ATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGTAA";
  Bio.labs.mutation = function (el) {
    el.innerHTML = `
      <h3>Lab 6B · Mutation Lab: The β-Globin Gene</h3>
      <p>Below is the real beginning of the human <strong>HBB</strong> gene, which codes for the β chain of hemoglobin (coding strand, shortened with a stop added at the end). Make mutations and see what happens to the protein. Can you recreate the sickle-cell mutation?</p>
      <div class="lab-output"><div class="small muted">Original DNA (click a base to select its position)</div><div class="seq" id="mu-orig" style="cursor:pointer;line-height:2"></div></div>
      <div class="lab-controls">
        <div class="ctl"><label for="mu-type">Mutation type</label><select id="mu-type"><option value="sub">Substitution (swap one base)</option><option value="ins">Insertion (add one base)</option><option value="del">Deletion (remove one base)</option><option value="del3">Delete three bases</option></select></div>
        <div class="ctl"><label for="mu-pos">Position (1–${HBB.length})</label><input type="number" id="mu-pos" min="1" max="${HBB.length}" value="20"></div>
        <div class="ctl"><label for="mu-base">New base</label><select id="mu-base"><option>A</option><option selected>T</option><option>G</option><option>C</option></select></div>
      </div>
      <div class="btn-row"><button class="btn primary" id="mu-go">Apply mutation</button><button class="btn" id="mu-sickle">Show me sickle cell</button><button class="btn" id="mu-reset">Reset</button></div>
      <div class="lab-output">
        <div class="small muted">Mutated DNA</div><div class="seq" id="mu-dna" style="line-height:2"></div>
        <div class="small muted" style="margin-top:8px">Original protein</div><div id="mu-p0"></div>
        <div class="small muted" style="margin-top:8px">Mutated protein (changes highlighted)</div><div id="mu-p1"></div>
        <div class="readout"><div><b id="mu-class">—</b><span>Mutation class</span></div><div><b id="mu-len">—</b><span>Protein length (aa)</span></div></div>
        <p id="mu-explain" class="small"></p>
      </div>
      ${Bio.worksheet("w6-mut", [
        "Apply the sickle-cell mutation. Which codon changed, from what to what? Which amino acid changed, and how do their properties differ (hover over them)?",
        "Find a substitution that is SILENT. Why doesn't it change the protein?",
        "Make a nonsense mutation. Predict what happens to hemoglobin and to the person (this causes a form of β-thalassemia).",
        "Compare deleting one base near the start with deleting three bases. Explain the big difference using the term 'reading frame'."
      ])}`;
    const $ = (id) => Bio.$("#" + id, el);
    const p0 = translate(toMRNAfromCoding(HBB)).protein;
    $("mu-orig").innerHTML = HBB.split("").map((b, k) => `<span data-i="${k}" class="b-${b}" title="position ${k + 1}">${b}</span>${(k + 1) % 3 === 0 ? " " : ""}`).join("");
    $("mu-p0").innerHTML = p0.split("").map((a) => aaChip(a)).join("");
    $("mu-orig").addEventListener("click", (e) => { const s = e.target.closest("[data-i]"); if (s) $("mu-pos").value = +s.dataset.i + 1; });
    function show(dna, type, pos) {
      const p1 = translate(toMRNAfromCoding(dna)).protein;
      $("mu-dna").innerHTML = dna.split("").map((b, k) => `<span class="b-${b}" ${k === pos ? 'style="outline:2px solid var(--warn);border-radius:3px"' : ""}>${b}</span>${(k + 1) % 3 === 0 ? " " : ""}`).join("");
      $("mu-p1").innerHTML = p1.split("").map((a, k) => aaChip(a, a !== p0[k])).join("");
      let cls, ex;
      const stopAt = p1.indexOf("*"), stop0 = p0.indexOf("*");
      if (type === "none") { cls = "—"; ex = ""; }
      else if (p1 === p0) { cls = "Silent"; ex = "The new codon codes for the same amino acid, so the protein is unchanged."; }
      else if (type === "ins" || type === "del") { cls = "Frameshift"; ex = "Adding or removing one base shifts every codon after it. The amino acids downstream are scrambled, and a premature stop usually appears. The protein is almost certainly non-functional."; }
      else if (type === "del3") { cls = "In-frame deletion"; ex = "Removing exactly three bases deletes one or two amino acids but keeps the reading frame. Effects range from mild to severe; the most common cystic fibrosis mutation (ΔF508) is one of these."; }
      else if (stopAt >= 0 && stopAt < stop0) { cls = "Nonsense"; ex = `A premature stop codon cuts the protein short at ${stopAt} amino acids instead of ${stop0}.`; }
      else { cls = "Missense"; const k = [...p1].findIndex((a, j) => a !== p0[j]); ex = `Amino acid ${k + 1} changed from ${NAMES[p0[k]]} (${PROPS[p0[k]]}) to ${NAMES[p1[k]]} (${PROPS[p1[k]] || "stop"}).` + (k === 6 && p1[k] === "V" && p0[k] === "E" ? " 🩸 <strong>This is the sickle-cell mutation!</strong> Swapping a charged amino acid for a hydrophobic one makes hemoglobin molecules stick together when oxygen is low. (It's often called position 6, because the first Met is removed from the finished protein.)" : ""); }
      $("mu-class").textContent = cls;
      $("mu-len").textContent = (stopAt < 0 ? p1.length : stopAt) + " / " + stop0;
      $("mu-explain").innerHTML = ex;
    }
    $("mu-go").addEventListener("click", () => {
      const type = $("mu-type").value, pos = Math.min(HBB.length, Math.max(1, +$("mu-pos").value)) - 1, base = $("mu-base").value;
      let dna = HBB;
      if (type === "sub") dna = HBB.slice(0, pos) + base + HBB.slice(pos + 1);
      if (type === "ins") dna = HBB.slice(0, pos) + base + HBB.slice(pos);
      if (type === "del") dna = HBB.slice(0, pos) + HBB.slice(pos + 1);
      if (type === "del3") dna = HBB.slice(0, pos) + HBB.slice(pos + 3);
      show(dna, type, pos);
    });
    $("mu-sickle").addEventListener("click", () => { $("mu-type").value = "sub"; $("mu-pos").value = 20; $("mu-base").value = "T"; $("mu-go").click(); });
    $("mu-reset").addEventListener("click", () => show(HBB, "none", -1));
    show(HBB, "none", -1);
  };
})();
