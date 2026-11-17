# Jev example: grading a free-text biology answer

A small, complete program that uses [Jev](https://typesafe.ai) (TypeSafe AI's
"System One" model) to grade a student's written answer about osmosis.

## What Jev is for

A chat model takes text and writes text back. Jev takes some content plus a
list of questions and returns **typed answers with probabilities**: no prose
at all.

```
evaluate(state, questions)  ->  { name: typed answer + probability }
```

That makes it a building block for the one thing ordinary code cannot do:
judge meaning. `if "water" in answer` is easy. "Did the student get the
direction of water movement right, in whatever words they used?" is not. Jev
turns that second kind of question into a number your `if` statement can read.

## How semantics get coded into software

There are three layers, and only the middle one involves AI.

| Layer | What it is | In `grader.py` |
| --- | --- | --- |
| **State** | The content being judged, as text or JSON | `build_state()` |
| **Questions** | The judgements, written as data | `QUESTIONS` |
| **Policy** | Normal code that acts on the answers | `decide()` |

The questions come in three types:

| Type | Asks | Returns |
| --- | --- | --- |
| `Noul` | a yes/no question | `.noul`: probability of yes, 0 to 1 |
| `Choice` | which label fits | `.choice`, `.confidence`, `.probabilities` per label |
| `Score` | where on an ordered rubric | `.score` (may be fractional, like 1.7), `.confidence`, `.probabilities` per level |

(There is also `Box`, which locates something in an image. Not used here.)

So "the semantics" live in two places you can read, review and version like any
other code: the English `instructions` and `criteria` in each question, and the
thresholds in the policy. The model's job is only to map messy language onto
those definitions.

## What goes over the wire

One `POST https://api.typesafe.ai/v1/systemone` per student answer:

```json
{
  "model": "jev-latest",
  "state": {
    "exam_question": "Explain what osmosis is and which way the water moves.",
    "reference_answer": "Osmosis is the movement of water across ...",
    "student_answer": "It's when salt moves through the cell membrane ..."
  },
  "questions": {
    "is_attempt": {
      "type": "noul",
      "instructions": "Is student_answer a genuine attempt to answer exam_question?",
      "criteria": {"true": "It tries to explain osmosis, even if it is wrong.",
                   "false": "It is blank, off-topic, a joke, or 'I don't know'."}
    },
    "misconception": {"type": "choice", "instructions": "...", "criteria": {"none": "...", "solute_moves": "..."}},
    "quality": {"type": "score", "instructions": "...", "criteria": ["No correct biology.", "...", "...", "Fully correct ..."]}
  }
}
```

The reply has the same names, each with a typed answer:

```json
{
  "answers": {
    "is_attempt":    {"type": "noul", "noul": 0.98},
    "misconception": {"type": "choice", "choice": "solute_moves", "confidence": 0.85,
                      "probabilities": {"none": 0.04, "solute_moves": 0.85, "...": 0.11}},
    "quality":       {"type": "score", "score": 0.8, "confidence": 0.8,
                      "legend": {"0": "No correct biology.", "...": "..."},
                      "probabilities": {"0": 0.3, "1": 0.6, "2": 0.1, "3": 0.0}}
  }
}
```

The reply shape is real; the numbers in it are made up for illustration.

## The policy is where you stay in control

`decide()` has no AI in it. It reads the numbers and applies rules you chose:

- very unlikely to be a real attempt: 0 points
- model not confident in the score: send to a person
- a yes/no near 50/50: send to a person
- full marks, but the direction check says "wrong": the two judgements
  contradict, so send to a person
- otherwise: round the score, and pick feedback from the misconception label

The probabilities are what make this possible. A chat model would hand back a
grade with no way to tell a sure thing from a guess.

## Run it

```bash
pip install -r requirements.txt        # Python 3.10+

python -m pytest test_grader.py        # offline: no key, no network

export TYPESAFE_API_KEY=...            # live: grades five sample answers
python grader.py
```

The thresholds in `grader.py` are starting guesses. Before trusting them, run a
batch of answers you have already graded by hand and adjust.
