import Stripe from "stripe";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);
export async function POST(req: Request) {
  const body = await req.json();

  const session =
    await stripe.checkout.sessions.create({
      mode: "subscription",

      customer_email: body.email,

      metadata: {
        userId: body.userId,
      },

      line_items: [
        {
          price:
            process.env
              .NEXT_PUBLIC_STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],

      success_url:
        "http://localhost:3000/?success=true",

      cancel_url:
        "http://localhost:3000/?canceled=true",
    });

  return Response.json({
    url: session.url,
  });
}