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

IMPORTANT RULES:
- NO LaTeX
- NO special math formatting
- Write math normally
- Example:
BAD: \\sqrt{a+b}
GOOD: square root of a+b

BAD: \\frac{a+b}{2}
GOOD: (a+b)/2

FLASHCARDS FORMAT:
FLASHCARDS
Q: question
A: answer

Q: question
A: answer

QUIZ FORMAT:
QUIZ

1. Question here
A) option
B) option
C) option
Correct: A

2. Question here
A) option
B) option
C) option
Correct: B

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