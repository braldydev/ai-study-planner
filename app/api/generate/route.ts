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

Create ONLY a clean study plan.

DO NOT:
- say "Certainly"
- talk like a chatbot
- say "Feel free to ask"
- add introductions or conclusions
- add motivational text

Output format:
- Day by day plan
- Clear sections
- Short and clean formatting
- Practical study tasks only

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