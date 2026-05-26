import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { subject, days, hours } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI study planner that creates realistic and motivating study schedules for students.",
        },
        {
          role: "user",
          content: `
Create a realistic study plan for:

Subject: ${subject}
Days until exam: ${days}
Hours per day: ${hours}

After the study plan, also generate 5 useful flashcards.

Format flashcards like this:

FLASHCARDS

Q: Question here
A: Answer here

Rules:
- Make the study plan realistic
- Split work across days
- Keep it easy to follow
- Make flashcards concise
- Do NOT write huge paragraphs
`,
        },
      ],
    });

    return new Response(
      JSON.stringify({
        plan: response.choices[0].message.content,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.log(error);

    return new Response(
      JSON.stringify({
        plan: "Something went wrong.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}