/* Bio 101 — core course engine.
 * Progress, navigation, tabs, quizzes, flashcards, notebooks, data tables and charts.
 * Everything is stored in the learner's browser (localStorage); nothing leaves the device.
 */
(function () {
  "use strict";
  const Bio = (window.Bio = window.Bio || {});
  Bio.labs = Bio.labs || {};

  Bio.WEEKS = [
    { n: 1, title: "The Chemistry of Life", blurb: "The scientific method, atoms, bonds, water, and pH: the chemical stage everything else is built on." },
    { n: 2, title: "Biomolecules & Enzymes", blurb: "Carbohydrates, lipids, proteins and nucleic acids, and the enzymes that make chemistry fast enough for life." },
    { n: 3, title: "Cells & Membranes", blurb: "Prokaryotes vs. eukaryotes, the organelles, and how membranes control what goes in and out." },
    { n: 4, title: "Energy: Respiration & Photosynthesis", blurb: "ATP, cellular respiration, fermentation and photosynthesis: how cells capture and spend energy." },
    { n: 5, title: "DNA: Structure & Replication", blurb: "The double helix, base pairing, chromosomes, and how a cell copies 6 billion letters." },
    { n: 6, title: "Gene Expression & Mutation", blurb: "Transcription, translation, the genetic code, gene regulation, and what happens when DNA changes." },
    { n: 7, title: "Cell Division & Inheritance", blurb: "Mitosis, meiosis, Mendel's laws, Punnett squares, pedigrees and human inheritance." },
    { n: 8, title: "Evolution & Biotechnology", blurb: "Natural selection, population genetics, PCR, gel electrophoresis, sequencing and CRISPR." },
    { n: 9, title: "The Human Body I: Control Systems", blurb: "Tissues, homeostasis, neurons, the brain, hormones, and muscles & bones." },
    { n: 10, title: "The Human Body II: Transport & Defense", blurb: "Heart and blood, lungs, digestion, kidneys, and the immune system." }
  ];

  /* ---------------- Storage ---------------- */
  const KEY = "bio101";
  let memory = {};
  Bio.store = {
    get() {
      try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return memory; }
    },
    set(s) {
      memory = s;
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode: keep in memory */ }
    },
    update(fn) {
      const s = this.get();
      fn(s);
      this.set(s);
      document.dispatchEvent(new CustomEvent("bio:progress"));
    },
    week(n) { const s = this.get(); return (s.weeks && s.weeks[n]) || {}; },
    setWeek(n, k, v) {
      this.update((s) => { s.weeks = s.weeks || {}; s.weeks[n] = s.weeks[n] || {}; s.weeks[n][k] = v; });
    },
    note(id) { const s = this.get(); return (s.notes && s.notes[id]) || ""; },
    setNote(id, v) {
      const s = this.get(); s.notes = s.notes || {}; s.notes[id] = v; this.set(s);
    }
  };

  /** Fraction (0–1) of a week's four required activities that are complete. */
  Bio.weekProgress = function (n) {
    const w = Bio.store.week(n);
    let done = 0;
    if (w.reading) done++;
    if (w.lab) done++;
    if (w.practical) done++;
    if ((w.quiz || 0) >= 70) done++;
    return done / 4;
  };

  /* ---------------- Helpers ---------------- */
  Bio.$ = (sel, root) => (root || document).querySelector(sel);
  Bio.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  Bio.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  Bio.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  Bio.rand = (min, max) => min + Math.random() * (max - min);
  Bio.randInt = (min, max) => Math.floor(Bio.rand(min, max + 1));
  /** Normally distributed random number (Box–Muller). */
  Bio.gauss = function (mean, sd) {
    const u = 1 - Math.random(), v = Math.random();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  Bio.css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  Bio.root = () => document.body.dataset.root || ".";
  Bio.colorSeq = (s) => String(s).replace(/[ATGCU]/g, (b) => `<span class="b-${b}">${b}</span>`);

  /* ---------------- Theme ---------------- */
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }
  try { applyTheme(localStorage.getItem("bio101-theme")); } catch (e) { /* ignore */ }
  function isDark() {
    const t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function toggleTheme() {
    const next = isDark() ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem("bio101-theme", next); } catch (e) { /* ignore */ }
    document.dispatchEvent(new CustomEvent("bio:theme"));
  }

  /* ---------------- Header / footer ---------------- */
  const LOGO = `<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M10 3c0 7 12 7 12 13S10 22 10 29" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round"/><path d="M22 3c0 7-12 7-12 13s12 6 12 13" fill="none" stroke="var(--accent-2)" stroke-width="2.6" stroke-linecap="round"/><path d="M12 7h8M11 25h10M13.5 12.5h5M13.5 19.5h5" stroke="var(--muted)" stroke-width="1.6" stroke-linecap="round"/></svg>`;

  function buildHeader() {
    const host = Bio.$("#site-header");
    if (!host) return;
    const r = Bio.root();
    const page = document.body.dataset.page || "";
    const week = +document.body.dataset.week || 0;
    const opts = Bio.WEEKS.map((w) => `<option value="${r}/weeks/week-${String(w.n).padStart(2, "0")}.html" ${w.n === week ? "selected" : ""}>Week ${w.n}: ${Bio.esc(w.title)}</option>`).join("");
    host.className = "site-header";
    host.innerHTML = `<div class="wrap">
      <a class="brand" href="${r}/index.html">${LOGO}<span>Bio 101</span></a>
      <nav class="site-nav" aria-label="Main">
        <a href="${r}/index.html" ${page === "home" ? 'aria-current="page"' : ""}>Syllabus</a>
        <select aria-label="Jump to week" id="week-jump"><option value="">Weeks…</option>${opts}</select>
        <a href="${r}/glossary.html" ${page === "glossary" ? 'aria-current="page"' : ""}>Glossary</a>
        <a href="${r}/final-exam.html" ${page === "final" ? 'aria-current="page"' : ""}>Final Exam</a>
        <a href="${r}/progress.html" ${page === "progress" ? 'aria-current="page"' : ""}>My Progress</a>
        <button type="button" id="theme-toggle" aria-label="Toggle dark mode" title="Toggle dark mode">◐</button>
      </nav></div>`;
    Bio.$("#week-jump").addEventListener("change", (e) => { if (e.target.value) location.href = e.target.value; });
    Bio.$("#theme-toggle").addEventListener("click", toggleTheme);
  }

  function buildFooter() {
    const host = Bio.$("#site-footer");
    if (!host) return;
    host.className = "site-footer";
    host.innerHTML = `<div class="wrap">
      <p><strong>Bio 101: An Interactive Introduction to Biology, DNA & the Human Body.</strong> A free, self-paced 10-week course.
      Your progress and notes are saved only in this browser. Use <a href="${Bio.root()}/progress.html">My Progress</a> to back them up.</p>
      <p class="small">This course is for learning, not medical advice. Companion textbook: <a href="https://openstax.org/details/books/biology-2e" target="_blank" rel="noopener">OpenStax Biology 2e</a> (free, CC BY 4.0).</p>
    </div>`;
  }

  /* ---------------- Tabs ---------------- */
  function buildTabs() {
    const sections = Bio.$$("section[data-tab]");
    if (!sections.length) return;
    const bar = document.createElement("div");
    bar.className = "tabs";
    bar.setAttribute("role", "tablist");
    sections[0].parentNode.insertBefore(bar, sections[0]);
    const week = +document.body.dataset.week;

    sections.forEach((sec) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.dataset.target = sec.dataset.tab;
      b.innerHTML = Bio.esc(sec.dataset.label || sec.dataset.tab);
      b.addEventListener("click", () => { show(sec.dataset.tab); history.replaceState(null, "", "#" + sec.dataset.tab); window.scrollTo({ top: bar.offsetTop - 70, behavior: "smooth" }); });
      bar.appendChild(b);
    });

    function show(id) {
      let found = false;
      sections.forEach((s) => { const on = s.dataset.tab === id; s.hidden = !on; found = found || on; });
      if (!found) { sections.forEach((s, i) => (s.hidden = i !== 0)); id = sections[0].dataset.tab; }
      Bio.$$("button", bar).forEach((b) => b.setAttribute("aria-selected", b.dataset.target === id ? "true" : "false"));
      document.dispatchEvent(new CustomEvent("bio:tab", { detail: id }));
    }
    function ticks() {
      if (!week) return;
      const w = Bio.store.week(week);
      Bio.$$("button", bar).forEach((b) => {
        const t = b.dataset.target;
        const done = t === "quiz" ? (w.quiz || 0) >= 70 : !!w[t];
        const label = (Bio.$(`section[data-tab="${t}"]`).dataset.label) || t;
        b.innerHTML = Bio.esc(label) + (done ? '<span class="tick" aria-label="complete">✓</span>' : "");
      });
    }
    document.addEventListener("bio:progress", ticks);
    window.addEventListener("hashchange", () => show(location.hash.slice(1)));
    Bio.showTab = show;
    ticks();
    show(location.hash.slice(1));
  }

  /* ---------------- Completion buttons & checklist ---------------- */
  function bindComplete() {
    const week = +document.body.dataset.week;
    if (!week) return;
    const labels = { reading: "reading", lab: "virtual lab", practical: "practical", capstone: "capstone project" };
    function render() {
      const w = Bio.store.week(week);
      Bio.$$("[data-complete]").forEach((b) => {
        const k = b.dataset.complete;
        b.classList.toggle("done", !!w[k]);
        b.textContent = w[k] ? `✓ ${labels[k] || k} complete (click to undo)` : `Mark ${labels[k] || k} complete`;
      });
      Bio.$$(".checklist [data-item]").forEach((li) => {
        const k = li.dataset.item;
        const done = k === "quiz" ? (w.quiz || 0) >= 70 : !!w[k];
        const box = Bio.$(".box", li);
        box.classList.toggle("on", done);
        box.textContent = done ? "✓" : "";
      });
      const bar = Bio.$("#week-progress");
      if (bar) bar.style.width = Math.round(Bio.weekProgress(week) * 100) + "%";
    }
    Bio.$$("[data-complete]").forEach((b) => {
      b.classList.add("btn");
      b.addEventListener("click", () => {
        const k = b.dataset.complete;
        Bio.store.setWeek(week, k, !Bio.store.week(week)[k]);
      });
    });
    Bio.$$(".checklist [data-item]").forEach((li) => {
      if (!Bio.$(".box", li)) li.insertAdjacentHTML("afterbegin", '<span class="box"></span>');
    });
    document.addEventListener("bio:progress", render);
    render();
  }

  /* ---------------- Notebook fields ---------------- */
  function bindNotes(root) {
    Bio.$$("[data-note]", root).forEach((el) => {
      if (el.dataset.bound) return;
      el.dataset.bound = "1";
      const id = el.dataset.note;
      const v = Bio.store.note(id);
      if (v) el.value = v;
      el.addEventListener("input", () => { Bio.store.setNote(id, el.value); el.dispatchEvent(new CustomEvent("bio:note", { bubbles: true })); });
    });
  }
  Bio.bindNotes = bindNotes;

  /* ---------------- Data tables ---------------- */
  /* <table class="datatable" data-id="w1p" data-cols='["A","B"]' data-rows='["row1","row2"]' or data-rows="6"
       data-chart='{"x":0,"y":[1],"xLabel":"..","yLabel":".."}'> */
  function buildDataTables() {
    Bio.$$("table.datatable[data-cols]").forEach((t) => {
      const id = t.dataset.id;
      const cols = JSON.parse(t.dataset.cols);
      let rows = t.dataset.rows;
      const named = rows && rows.trim().startsWith("[");
      rows = named ? JSON.parse(rows) : Array.from({ length: +rows || 5 }, () => null);
      let html = "<thead><tr>" + cols.map((c) => `<th scope="col">${Bio.esc(c)}</th>`).join("") + "</tr></thead><tbody>";
      rows.forEach((r, i) => {
        html += "<tr>";
        cols.forEach((c, j) => {
          if (named && j === 0) html += `<td class="rowhead">${Bio.esc(r)}</td>`;
          else html += `<td><input aria-label="${Bio.esc(c)} row ${i + 1}" data-note="${id}-r${i}c${j}"></td>`;
        });
        html += "</tr>";
      });
      t.innerHTML = html + "</tbody>";
      const wrap = document.createElement("div");
      wrap.className = "table-scroll";
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
      bindNotes(t);

      if (t.dataset.chart) {
        const cfg = JSON.parse(t.dataset.chart);
        const cv = document.createElement("canvas");
        cv.style.height = "260px";
        cv.style.marginTop = "8px";
        cv.setAttribute("role", "img");
        cv.setAttribute("aria-label", "Chart of your recorded data");
        wrap.after(cv);
        const cell = (i, j) => {
          if (named && j === 0) return parseFloat(rows[i]);
          return parseFloat(Bio.store.note(`${id}-r${i}c${j}`));
        };
        const draw = () => {
          const series = cfg.y.map((yj, k) => ({
            name: cols[yj],
            points: rows.map((_, i) => [cfg.x === "row" ? i + 1 : cell(i, cfg.x), cell(i, yj)]).filter((p) => isFinite(p[0]) && isFinite(p[1]))
          }));
          Bio.chart(cv, { series, xLabel: cfg.xLabel || cols[cfg.x] || "", yLabel: cfg.yLabel || "", type: cfg.type || "line" });
        };
        t.addEventListener("bio:note", draw);
        Bio.live(draw);
      }
    });
  }

  /* ---------------- Chart (tiny canvas plotter) ---------------- */
  /* opts: { series:[{name, points:[[x,y]...], color?, dashed?}], xLabel, yLabel, xMin, xMax, yMin, yMax,
            type:'line'|'scatter'|'bar', bars:[{label,value,color}], hLines:[{y,label}] } */
  Bio.chart = function (canvas, opts) {
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || 600, H = canvas.clientHeight || 280;
    if (!W) return;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const text = Bio.css("--text"), muted = Bio.css("--muted"), border = Bio.css("--border");
    const palette = [Bio.css("--c1"), Bio.css("--c2"), Bio.css("--c3"), Bio.css("--c4")];
    const m = { l: 54, r: 14, t: 14, b: 44 };
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    ctx.font = "12px system-ui, sans-serif";

    if (opts.type === "bar") {
      const bars = opts.bars || [];
      const yMax = opts.yMax != null ? opts.yMax : niceMax(Math.max(1, ...bars.map((b) => b.value)));
      axes(0, 1, 0, yMax, false);
      const bw = pw / Math.max(1, bars.length);
      bars.forEach((b, i) => {
        const h = (b.value / yMax) * ph;
        ctx.fillStyle = b.color || palette[i % 4];
        ctx.fillRect(m.l + i * bw + bw * 0.18, m.t + ph - h, bw * 0.64, h);
        ctx.fillStyle = muted; ctx.textAlign = "center";
        ctx.fillText(b.label, m.l + i * bw + bw / 2, H - m.b + 16);
        ctx.fillStyle = text;
        ctx.fillText(fmt(b.value), m.l + i * bw + bw / 2, m.t + ph - h - 4);
      });
      label();
      return;
    }

    const all = (opts.series || []).flatMap((s) => s.points);
    const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
    let xMin = opts.xMin != null ? opts.xMin : xs.length ? Math.min(...xs) : 0;
    let xMax = opts.xMax != null ? opts.xMax : xs.length ? Math.max(...xs) : 1;
    let yMin = opts.yMin != null ? opts.yMin : Math.min(0, ...(ys.length ? ys : [0]));
    let yMax = opts.yMax != null ? opts.yMax : niceMax(ys.length ? Math.max(...ys) : 1);
    if (xMax === xMin) { xMax += 1; xMin -= opts.xMin != null ? 0 : 1; }
    if (yMax === yMin) yMax += 1;
    axes(xMin, xMax, yMin, yMax, true);
    const X = (x) => m.l + ((x - xMin) / (xMax - xMin)) * pw;
    const Y = (y) => m.t + ph - ((y - yMin) / (yMax - yMin)) * ph;

    (opts.hLines || []).forEach((hl) => {
      ctx.strokeStyle = hl.color || muted; ctx.setLineDash([5, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(m.l, Y(hl.y)); ctx.lineTo(m.l + pw, Y(hl.y)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = hl.color || muted; ctx.textAlign = "right"; ctx.fillText(hl.label || "", m.l + pw - 4, Y(hl.y) - 4);
    });

    (opts.series || []).forEach((s, i) => {
      const col = s.color || palette[i % 4];
      const mode = s.mode || opts.type;
      const pts = s.points.slice().sort((a, b) => a[0] - b[0]);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.2;
      if (s.dashed) ctx.setLineDash([6, 4]);
      if (mode !== "scatter" && pts.length > 1) {
        ctx.beginPath();
        pts.forEach((p, k) => (k ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
        ctx.stroke();
      }
      ctx.setLineDash([]);
      if (mode === "scatter" || (pts.length < 40 && !s.noDots)) pts.forEach((p) => { ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), mode === "scatter" ? 3.5 : 3, 0, 7); ctx.fill(); });
    });

    // legend
    const named = (opts.series || []).filter((s) => s.name);
    if (named.length > 1 || opts.legend) {
      let lx = m.l + 8;
      named.forEach((s, i) => {
        ctx.fillStyle = s.color || palette[(opts.series.indexOf(s)) % 4];
        ctx.fillRect(lx, m.t + 4, 12, 12);
        ctx.fillStyle = text; ctx.textAlign = "left";
        ctx.fillText(s.name, lx + 16, m.t + 14);
        lx += ctx.measureText(s.name).width + 34;
      });
    }
    label();

    function axes(x0, x1, y0, y1, xTicks) {
      ctx.strokeStyle = border; ctx.fillStyle = muted; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = m.t + ph - (i / 5) * ph;
        ctx.beginPath(); ctx.moveTo(m.l, y); ctx.lineTo(m.l + pw, y); ctx.stroke();
        ctx.textAlign = "right"; ctx.fillText(fmt(y0 + (i / 5) * (y1 - y0)), m.l - 6, y + 4);
      }
      if (xTicks) for (let i = 0; i <= 5; i++) {
        const x = m.l + (i / 5) * pw;
        ctx.textAlign = "center"; ctx.fillText(fmt(x0 + (i / 5) * (x1 - x0)), x, H - m.b + 16);
      }
      ctx.strokeStyle = muted;
      ctx.beginPath(); ctx.moveTo(m.l, m.t); ctx.lineTo(m.l, m.t + ph); ctx.lineTo(m.l + pw, m.t + ph); ctx.stroke();
    }
    function label() {
      ctx.fillStyle = text; ctx.textAlign = "center";
      if (opts.xLabel) ctx.fillText(opts.xLabel, m.l + pw / 2, H - 6);
      if (opts.yLabel) { ctx.save(); ctx.translate(13, m.t + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(opts.yLabel, 0, 0); ctx.restore(); }
    }
    function niceMax(v) {
      if (v <= 0) return 1;
      const p = Math.pow(10, Math.floor(Math.log10(v)));
      const f = v / p;
      return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
    }
    function fmt(v) {
      const a = Math.abs(v);
      if (a >= 1e6) return v.toExponential(1).replace("e+", "e");
      if (a >= 1000) return Math.round(v).toLocaleString();
      if (a >= 10 || v === 0) return String(Math.round(v * 10) / 10);
      return String(Math.round(v * 100) / 100);
    }
  };

  /** Re-run a draw function whenever its canvas may have changed size or colours. */
  Bio.live = function (draw) {
    document.addEventListener("bio:tab", () => requestAnimationFrame(draw));
    document.addEventListener("bio:theme", draw);
    let t;
    window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(draw, 120); });
    requestAnimationFrame(draw);
    return draw;
  };

  /** Standard lab worksheet: list of questions saved to the notebook. */
  Bio.worksheet = function (id, questions) {
    return `<div class="worksheet"><h4>Lab worksheet</h4><p class="small muted">Your answers save automatically in this browser.</p>` +
      questions.map((q, i) => `<div class="field"><label for="${id}-q${i}">${i + 1}. ${q}</label><textarea id="${id}-q${i}" data-note="${id}-q${i}"></textarea></div>`).join("") +
      `</div>`;
  };

  /* ---------------- Flashcards ---------------- */
  function buildFlashcards() {
    Bio.$$(".flashcards").forEach((host) => {
      const week = +(host.dataset.week || document.body.dataset.week);
      const terms = (Bio.TERMS && Bio.TERMS[week]) || [];
      let deck = terms.slice(), i = 0, known = 0;
      host.innerHTML = `
        <div class="fc-stage"><div class="fc-card" tabindex="0" role="button" aria-label="Flashcard, press to flip">
          <div class="fc-face front"></div><div class="fc-face back"></div></div></div>
        <div class="fc-meta"></div>
        <div class="btn-row" style="justify-content:center">
          <button class="btn small" data-a="prev">← Prev</button>
          <button class="btn small" data-a="flip">Flip</button>
          <button class="btn small" data-a="again">Study again</button>
          <button class="btn small primary" data-a="know">I know it ✓</button>
          <button class="btn small" data-a="next">Next →</button>
          <button class="btn small" data-a="shuffle">Shuffle</button>
          <button class="btn small" data-a="reset">Reset deck</button>
        </div>
        <details><summary>Show all ${terms.length} terms as a list</summary><dl class="term-list">${terms.map((t) => `<dt>${Bio.esc(t.t)}</dt><dd>${Bio.esc(t.d)}</dd>`).join("")}</dl></details>`;
      const card = Bio.$(".fc-card", host), front = Bio.$(".front", host), back = Bio.$(".back", host), meta = Bio.$(".fc-meta", host);
      function render() {
        card.classList.remove("flipped");
        if (!deck.length) {
          front.textContent = "🎉 Deck complete!"; back.textContent = "Press Reset to study again.";
          meta.textContent = `You marked all ${terms.length} terms as known.`;
          return;
        }
        i = (i + deck.length) % deck.length;
        front.textContent = deck[i].t; back.textContent = deck[i].d;
        meta.textContent = `Card ${i + 1} of ${deck.length} remaining · ${known} known`;
      }
      const flip = () => card.classList.toggle("flipped");
      card.addEventListener("click", flip);
      card.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } if (e.key === "ArrowRight") { i++; render(); } if (e.key === "ArrowLeft") { i--; render(); } });
      host.addEventListener("click", (e) => {
        const a = e.target.dataset && e.target.dataset.a;
        if (!a) return;
        if (a === "flip") flip();
        if (a === "next") { i++; render(); }
        if (a === "prev") { i--; render(); }
        if (a === "again") { if (deck.length) { const c = deck.splice(i, 1)[0]; deck.push(c); } render(); }
        if (a === "know") { if (deck.length) { deck.splice(i, 1); known++; } render(); }
        if (a === "shuffle") { deck = Bio.shuffle(deck); i = 0; render(); }
        if (a === "reset") { deck = terms.slice(); i = 0; known = 0; render(); }
      });
      render();
    });
  }

  /* ---------------- Quiz engine ---------------- */
  /* Question: { q, type:'mc'|'multi'|'tf'|'num'|'text', options:[], answer, tol, explain } */
  Bio.renderQuiz = function (host, questions, opts) {
    opts = opts || {};
    let qs;
    function prepare() {
      const pool = opts.sample ? opts.sample() : questions;
      qs = pool.map((q) => {
        const c = Object.assign({}, q);
        if (q.type === "mc" || q.type === "multi" || !q.type) {
          c.type = q.type || "mc";
          const idx = q.options.map((_, i) => i);
          const order = q.noShuffle ? idx : Bio.shuffle(idx);
          c.options = order.map((i) => q.options[i]);
          const ans = Array.isArray(q.answer) ? q.answer : [q.answer];
          c.answer = ans.map((a) => order.indexOf(a));
        }
        return c;
      });
      if (opts.shuffleQuestions) qs = Bio.shuffle(qs);
    }
    function render() {
      prepare();
      const best = opts.getBest ? opts.getBest() : null;
      let html = `<p class="muted">${qs.length} questions · ${opts.passMark || 70}% to pass${best != null ? ` · Your best so far: <strong>${best}%</strong>` : ""}. Answer everything, then submit. You can retake as often as you like; the options get shuffled each time.</p><form novalidate>`;
      qs.forEach((q, n) => {
        const name = `q${n}-${Math.random().toString(36).slice(2, 7)}`;
        html += `<div class="quiz-q" data-n="${n}"><div class="qnum">Question ${n + 1}${q.week ? ` · Week ${q.week}` : ""}</div><div class="qtext">${q.q}</div>`;
        if (q.type === "mc" || q.type === "multi") {
          const t = q.type === "mc" ? "radio" : "checkbox";
          if (q.type === "multi") html += `<div class="small muted" style="margin:-6px 0 6px">Select all that apply.</div>`;
          q.options.forEach((o, i) => (html += `<label class="opt"><input type="${t}" name="${name}" value="${i}"><span>${o}</span></label>`));
        } else if (q.type === "tf") {
          html += `<label class="opt"><input type="radio" name="${name}" value="true"><span>True</span></label><label class="opt"><input type="radio" name="${name}" value="false"><span>False</span></label>`;
        } else if (q.type === "num") {
          html += `<input type="number" step="any" name="${name}" aria-label="Your numeric answer" placeholder="Enter a number"> ${q.unit ? `<span class="muted">${q.unit}</span>` : ""}`;
        } else if (q.type === "text") {
          html += `<input type="text" name="${name}" aria-label="Your answer" placeholder="Type your answer" autocomplete="off" spellcheck="false">`;
        }
        html += `<div class="fb"></div></div>`;
      });
      html += `<div class="btn-row"><button class="btn primary" type="submit">Submit answers</button></div></form><div class="quiz-result"></div>`;
      host.innerHTML = html;
      Bio.$("form", host).addEventListener("submit", (e) => { e.preventDefault(); grade(); });
    }
    function grade() {
      let score = 0;
      Bio.$$(".quiz-q", host).forEach((box) => {
        const q = qs[+box.dataset.n];
        const inputs = Bio.$$("input", box);
        let ok = false;
        if (q.type === "mc" || q.type === "multi") {
          const chosen = inputs.filter((x) => x.checked).map((x) => +x.value).sort();
          const want = q.answer.slice().sort();
          ok = chosen.length === want.length && chosen.every((v, i) => v === want[i]);
          Bio.$$("label.opt", box).forEach((l, i) => {
            l.classList.toggle("is-answer", want.includes(i));
            l.classList.toggle("is-wrong", chosen.includes(i) && !want.includes(i));
          });
        } else if (q.type === "tf") {
          const c = inputs.find((x) => x.checked);
          ok = !!c && (c.value === "true") === q.answer;
          Bio.$$("label.opt", box).forEach((l, i) => {
            const val = i === 0;
            l.classList.toggle("is-answer", val === q.answer);
            l.classList.toggle("is-wrong", !!c && c === inputs[i] && val !== q.answer);
          });
        } else if (q.type === "num") {
          const v = parseFloat(inputs[0].value);
          const tol = q.tol != null ? q.tol : Math.abs(q.answer) * 0.02 + 1e-9;
          ok = isFinite(v) && Math.abs(v - q.answer) <= tol;
        } else if (q.type === "text") {
          const v = inputs[0].value.trim().toLowerCase().replace(/\s+/g, " ");
          ok = [].concat(q.answer).some((a) => String(a).toLowerCase() === v);
        }
        if (ok) score++;
        box.classList.toggle("correct", ok);
        box.classList.toggle("incorrect", !ok);
        let ans = "";
        if (!ok && (q.type === "num" || q.type === "text")) ans = ` Correct answer: <strong>${Bio.esc([].concat(q.answer)[0])}${q.unit ? " " + q.unit : ""}</strong>.`;
        Bio.$(".fb", box).innerHTML = `<div class="explain"><span class="verdict">${ok ? "✓ Correct." : "✗ Not quite."}</span>${ans} ${q.explain || ""}</div>`;
      });
      const pct = Math.round((score / qs.length) * 100);
      const pass = pct >= (opts.passMark || 70);
      if (opts.onScore) opts.onScore(pct);
      const res = Bio.$(".quiz-result", host);
      res.innerHTML = `<div class="score-banner ${pass ? "pass" : "fail"}"><strong>${pct}%</strong>${score} of ${qs.length} correct · ${pass ? "Passed! 🎉" : "Review the explanations above and the reading, then try again."}</div>
        <div class="btn-row" style="justify-content:center"><button class="btn primary" type="button" data-retake>Retake with shuffled options</button></div>`;
      Bio.$("[data-retake]", res).addEventListener("click", () => { render(); host.scrollIntoView({ behavior: "smooth" }); });
      Bio.$$("input", host).forEach((x) => (x.disabled = true));
      Bio.$('button[type="submit"]', host).disabled = true;
      res.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    render();
  };

  function buildQuizzes() {
    Bio.$$(".quiz[data-quiz]").forEach((host) => {
      const id = host.dataset.quiz;
      if (id === "final") return; // final-exam.html wires itself
      const week = +id;
      const qs = (Bio.QUIZZES && Bio.QUIZZES[week]) || [];
      Bio.renderQuiz(host, qs, {
        getBest: () => Bio.store.week(week).quiz,
        onScore: (pct) => {
          const prev = Bio.store.week(week).quiz || 0;
          if (pct > prev) Bio.store.setWeek(week, "quiz", pct);
          Bio.store.update((s) => { s.attempts = s.attempts || {}; s.attempts[week] = (s.attempts[week] || 0) + 1; });
        }
      });
    });
  }

  /* ---------------- Week pager ---------------- */
  function buildWeekNav() {
    const host = Bio.$("#week-nav");
    const week = +document.body.dataset.week;
    if (!host || !week) return;
    const p = Bio.WEEKS[week - 2], n = Bio.WEEKS[week];
    const href = (w) => `week-${String(w.n).padStart(2, "0")}.html`;
    host.className = "week-nav";
    host.innerHTML = (p ? `<a class="btn" href="${href(p)}">← Week ${p.n}: ${Bio.esc(p.title)}</a>` : `<a class="btn" href="../index.html">← Syllabus</a>`) +
      (n ? `<a class="btn primary" href="${href(n)}">Week ${n.n}: ${Bio.esc(n.title)} →</a>` : `<a class="btn primary" href="../final-exam.html">Final Exam →</a>`);
  }

  /* ---------------- Labs ---------------- */
  function mountLabs() {
    Bio.$$("[data-lab]").forEach((el) => {
      const fn = Bio.labs[el.dataset.lab];
      if (!fn) { el.innerHTML = `<p class="muted">Lab “${Bio.esc(el.dataset.lab)}” failed to load.</p>`; return; }
      el.classList.add("lab");
      try { fn(el); } catch (err) { console.error(err); el.insertAdjacentHTML("beforeend", `<p class="feedback bad">Something went wrong loading this lab. Try refreshing.</p>`); }
      bindNotes(el);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildHeader();
    buildFooter();
    buildDataTables();
    buildFlashcards();
    buildQuizzes();
    mountLabs();
    buildTabs();
    bindComplete();
    bindNotes(document);
    buildWeekNav();
    document.dispatchEvent(new CustomEvent("bio:ready"));
  });
})();
