import Stripe from "stripe";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function POST() {
  const session =
    await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price:
            process.env
              .NEXT_PUBLIC_STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],

      success_url:
        "https://ai-study-planner-pi-three.vercel.app/?success=true",

      cancel_url:
        "https://ai-study-planner-pi-three.vercel.app/?success=true",
    });

  return Response.json({
    url: session.url,
  });
}