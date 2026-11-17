"""Grade a free-text Bio 101 answer with Jev.

The whole idea in one sentence: the *meaning* questions ("did the student get
the direction of water movement right?") go to Jev, which answers each one with
a typed value and a probability; everything after that is ordinary code.

Run:  TYPESAFE_API_KEY=... python grader.py
"""

from dataclasses import dataclass

from typesafe_sdk import Choice, Noul, Score, SystemOneResponse, TypeSafeClient

# --------------------------------------------------------------------------
# 1. STATE: the thing being judged. Any text or JSON; you choose the shape.
# --------------------------------------------------------------------------

QUESTION = "Explain what osmosis is and which way the water moves."
REFERENCE = (
    "Osmosis is the movement of water across a selectively permeable membrane "
    "from a region of lower solute concentration to a region of higher solute "
    "concentration."
)


def build_state(student_answer: str) -> dict:
    return {
        "exam_question": QUESTION,
        "reference_answer": REFERENCE,
        "student_answer": student_answer,
    }


# --------------------------------------------------------------------------
# 2. QUESTIONS: the semantics, written down as data.
#
# Each entry is one judgement a human grader would make. The dictionary key is
# the name you read the answer back under. There are three kinds:
#
#   Noul   yes/no           -> one probability of "yes" (0..1)
#   Choice pick one label   -> the label, plus a probability for every label
#   Score  ordered rubric   -> a number on the rubric (level 0, 1, 2, ...)
#
# `instructions` is the question; `criteria` spells out what each outcome means.
# --------------------------------------------------------------------------

QUESTIONS = {
    "is_attempt": Noul(
        instructions="Is student_answer a genuine attempt to answer exam_question?",
        criteria={
            "true": "It tries to explain osmosis, even if it is wrong.",
            "false": "It is blank, off-topic, a joke, or 'I don't know'.",
        },
    ),
    "direction_correct": Noul(
        instructions=(
            "Does student_answer say that water moves toward the side with the "
            "higher solute concentration (equivalently: from high water "
            "concentration to low water concentration)?"
        ),
    ),
    "misconception": Choice(
        instructions="Which description best fits student_answer?",
        criteria={
            "none": "No misconception; the biology is right.",
            "solute_moves": "Says the solute (salt, sugar) crosses the membrane instead of water.",
            "direction_reversed": "Says water moves toward the lower solute concentration.",
            "no_membrane": "Describes plain diffusion with no membrane involved.",
            "other": "Wrong or incomplete in some other way.",
        },
    ),
    "quality": Score(
        instructions="Rate student_answer against reference_answer.",
        criteria=[  # position in the list is the score: 0, 1, 2, 3
            "No correct biology.",
            "Mentions water or a membrane but the mechanism is wrong or missing.",
            "Correct mechanism but missing either the membrane or the direction.",
            "Fully correct: water, selectively permeable membrane, and direction.",
        ],
    ),
}

# --------------------------------------------------------------------------
# 3. POLICY: plain, deterministic code that turns probabilities into actions.
#
# These thresholds are *your* decisions, not the model's. They are starting
# guesses: tune them against answers you have already graded by hand.
# --------------------------------------------------------------------------

MAX_POINTS = 3
NOT_AN_ATTEMPT_BELOW = 0.20  # probability of "genuine attempt"
UNSURE_BAND = (0.35, 0.65)  # a yes/no this close to 50/50 is not a decision
MIN_CONFIDENCE = 0.60  # below this, a person looks at it

FEEDBACK = {
    "none": "Nice work.",
    "solute_moves": "Careful: in osmosis the water moves, not the solute.",
    "direction_reversed": "Check the direction: water moves toward the higher solute concentration.",
    "no_membrane": "Osmosis needs a selectively permeable membrane. Without one it is just diffusion.",
    "other": "Compare your answer with the definition in Week 3 and try again.",
}


@dataclass
class Verdict:
    points: int | None  # None means "not auto-graded"
    feedback: str
    needs_human: bool
    why: str


def decide(response: SystemOneResponse) -> Verdict:
    """No AI in here. Just if-statements over typed numbers."""
    is_attempt = response.nouls["is_attempt"].noul
    direction = response.nouls["direction_correct"].noul
    misconception = response.choices["misconception"]
    quality = response.scores["quality"]

    if is_attempt < NOT_AN_ATTEMPT_BELOW:
        return Verdict(0, "No answer given.", False, f"is_attempt={is_attempt:.2f}")

    if quality.confidence < MIN_CONFIDENCE:
        return Verdict(None, "", True, f"quality confidence {quality.confidence:.2f} too low")

    if UNSURE_BAND[0] < direction < UNSURE_BAND[1]:
        return Verdict(None, "", True, f"direction_correct={direction:.2f} is a coin flip")

    points = round(quality.score)

    # Two independent judgements disagreeing is a cheap, useful sanity check.
    if points == MAX_POINTS and direction < UNSURE_BAND[0]:
        return Verdict(None, "", True, "full marks but direction looks wrong")

    if misconception.confidence >= MIN_CONFIDENCE:
        feedback = FEEDBACK[misconception.choice]
    else:
        feedback = FEEDBACK["other"]

    return Verdict(points, feedback, False, f"quality={quality.score:.2f}, {misconception.choice}")


# --------------------------------------------------------------------------
# 4. GLUE: one network call per answer; all four questions go in together.
# --------------------------------------------------------------------------


def grade(client: TypeSafeClient, student_answer: str) -> Verdict:
    response = client.system_one(state=build_state(student_answer), questions=QUESTIONS)
    return decide(response)


SAMPLE_ANSWERS = [
    "Water crosses a semi-permeable membrane from where there's less solute to where there's more.",
    "It's when salt moves through the cell membrane until both sides are equal.",
    "Water goes through the membrane to the side with less stuff dissolved in it.",
    "Osmosis is when things spread out from high to low concentration.",
    "idk lol",
]

if __name__ == "__main__":
    with TypeSafeClient() as client:  # reads TYPESAFE_API_KEY from the environment
        for answer in SAMPLE_ANSWERS:
            verdict = grade(client, answer)
            score = "HUMAN" if verdict.needs_human else f"{verdict.points}/{MAX_POINTS}"
            print(f"\n{answer}\n  -> {score}  {verdict.feedback}\n     ({verdict.why})")
