import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();

  const signature =
    req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.log(err);

    return new Response("Webhook Error", {
      status: 400,
    });
  }

  if (
    event.type ===
    "checkout.session.completed"
  ) {
    const session =
      event.data.object as Stripe.Checkout.Session;

    const userId =
      session.metadata?.userId;

    console.log("USER ID:", userId);

    if (userId) {
  console.log(
    "UPDATING USER:",
    userId
  );

  const result = await supabase
    .from("users")
    .update({
      premium: true,
      stripe_customer_id:
        session.customer as string,
    })
    .eq("id", userId);

  console.log("RESULT:", result);

  console.log("UPDATED");
}
  }

  return Response.json({
    received: true,
  });
}