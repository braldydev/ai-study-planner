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
Create a study plan for:

Subject: ${subject}
Days until exam: ${days}
Hours per day: ${hours}

Rules:
- Make the plan realistic
- Split work across days
- Be motivating but concise
- Use clean formatting
- Make it easy to follow
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