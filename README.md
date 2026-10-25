# Bio 101: Life, DNA & the Human Body

A free, self-paced, **interactive 10-week introductory biology course** that runs entirely on GitHub Pages. No build step, no accounts, no tracking.

Each week includes:

- **Reading:** a 45–70 minute lesson with diagrams, "check yourself" questions and human-body connections
- **Key terms:** flip-card flashcards (~180 terms in total, also in a searchable glossary)
- **Virtual labs:** 26 in-browser simulations with saved worksheets
- **Practical:** a hands-on experiment with household materials, with data tables (some auto-graph your data) and analysis questions
- **Quiz:** auto-graded, with an explanation for every answer and unlimited retakes

Plus a **capstone project**, a **cumulative final exam**, a **gradebook** with backup/restore, and a printable **certificate**.

## Syllabus

| Week | Topic | Virtual labs | Practical |
|---|---|---|---|
| 1 | The Chemistry of Life | pH Explorer · Experiment Designer | Red-cabbage pH indicator |
| 2 | Biomolecules & Enzymes | Enzyme Activity Simulator · Biomolecule Sorter | Catalase & hydrogen peroxide |
| 3 | Cells & Membranes | Cell Explorer · Osmosis Simulator · Surface Area:Volume | Potato osmosis |
| 4 | Energy: Respiration & Photosynthesis | Follow a Glucose · Pondweed Photosynthesis | Yeast balloon fermentation |
| 5 | DNA: Structure & Replication | Base-Pair Builder · Chargaff's Rules · Replication Fork | Strawberry DNA extraction |
| 6 | Gene Expression & Mutation | Central Dogma Machine · β-Globin Mutation Lab | Decode the sickle-cell gene |
| 7 | Cell Division & Inheritance | Punnett Squares + Chi-square · Name That Phase | Coin-flip genetics |
| 8 | Evolution & Biotechnology | Peppered Moths · Forensic Gel · PCR · Hardy–Weinberg | Bird-beak natural selection |
| 9 | Human Body I: Control Systems | Reaction Time · Action Potential · Blood Glucose Feedback | Ruler drop & touch sensitivity |
| 10 | Human Body II: Transport & Defense | Blood Flow · Blood Typing · Outbreak & Vaccines | Heart rate & lung capacity · **Capstone** |

## Publishing on GitHub Pages

1. Merge this work into `main`.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, then choose **`main`** and **`/ (root)`**, and save.
4. After a minute the course is live at `https://<your-username>.github.io/bio/`.

## Running locally

Any static file server works:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## How it's built

- Plain HTML, CSS and JavaScript with no dependencies or build tools.
- `assets/js/course.js` is the shared engine: navigation, tabs, progress tracking, quizzes, flashcards, notebooks, data tables and a small canvas charting helper.
- `assets/js/data/` holds the key terms and quiz banks.
- `assets/js/labs/weekNN.js` holds each week's interactive labs.
- `weeks/week-NN.html` holds each week's content.
- Progress and notes are stored in the browser's `localStorage`. Learners can export and import a JSON backup from **My Progress**.

Companion reading links point to the free, CC BY-licensed [OpenStax Biology 2e](https://openstax.org/details/books/biology-2e). Health content is educational and not medical advice.
