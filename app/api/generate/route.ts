import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const body = await req.json();

  const {
    subject,
    topic,
    level,
    days,
    hours,
  } = body;

  const prompt = `
You are a professional study planner.

Create:
1. Study plan
2. Flashcards
3. Quiz

STRICT RULES:

- NEVER use LaTeX
- NEVER use symbols like:
\\sqrt
\\frac
\\(
\\)
^
{}
[]
=
- Write math in plain readable text only
- Example:
BAD: \\sqrt{16}
GOOD: square root of 16

BAD: a^2 + b^2 = c^2
GOOD: a squared plus b squared equals c squared

FLASHCARDS RULES:
- Flashcards MUST only contain:
Q:
A:
- Keep answers short and clean
- No formatting symbols
- No markdown
- No bullet points

QUIZ RULES:
- EVERY question MUST contain:
A)
B)
C)
Correct:
- NEVER leave a question incomplete
- NEVER generate open-ended questions
- NEVER generate quiz questions without options
- ALWAYS generate exactly 3 options
- Correct answer MUST always be A, B, or C
- Questions must be short and readable

FORMAT EXACTLY LIKE THIS:

FLASHCARDS

Q: What is gravity?
A: A force that pulls objects together.

Q: What is velocity?
A: Speed in a direction.

QUIZ

1. What is 2 plus 2?
A) 3
B) 4
C) 5
Correct: B

2. What planet do we live on?
A) Mars
B) Venus
C) Earth
Correct: C

DO NOT mix flashcards and quiz together.

Subject: ${subject}
Topic: ${topic}
Level: ${level}
Days until exam: ${days}
Hours per day: ${hours}
`;

  const completion =
    await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

  return Response.json({
    plan:
      completion.choices[0].message.content,
  });
}