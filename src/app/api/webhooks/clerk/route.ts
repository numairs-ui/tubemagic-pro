import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
    // You need to add this to your .env.local
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env.local')
    }

    // Get headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400
        })
    }

    // Handle the webhook
    const { id } = evt.data;
    const eventType = evt.type;

    if (eventType === 'user.created') {
        const { email_addresses, primary_email_address_id } = evt.data;
        const emailObject = email_addresses.find((email) => {
            return email.id === primary_email_address_id;
        });

        if (!emailObject) {
            return new Response('Error occured -- no primary email', {
                status: 400
            })
        }

        // Insert user into Supabase
        const { error } = await supabaseAdmin
            .from('users')
            .insert({
                clerk_user_id: id,
                email: emailObject.email_address,
            })

        if (error) {
            console.error('Error creating user in Supabase:', error)
            return new Response('Error occured', { status: 500 })
        }
    }

    return new Response('', { status: 200 })
}
