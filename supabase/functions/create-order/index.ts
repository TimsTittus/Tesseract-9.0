import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { RazorpayClient } from '../_shared/razorpay.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ success: false, error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    try {
        const { amount, user_id, registration_id } = await req.json()

        if (!amount || !user_id || !registration_id) {
            return new Response(
                JSON.stringify({ success: false, error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const keyId = Deno.env.get('RAZORPAY_KEY_ID')
        const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

        if (!keyId || !keySecret) {
            console.error('Missing Razorpay credentials')
            return new Response(
                JSON.stringify({ success: false, error: 'Payment service not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Initialize Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase credentials')
            return new Response(
                JSON.stringify({ success: false, error: 'Database service not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Create Razorpay order
        const razorpay = new RazorpayClient(keyId, keySecret)
        const amountInPaise = Math.round(amount * 100)
        const receipt = `reg_${registration_id.slice(0, 8)}_${Date.now()}`

        const order = await razorpay.createOrder(amountInPaise, 'INR', receipt, {
            registration_id,
            user_id,
        })

        console.log(`Order created: ${order.id} for registration: ${registration_id}`)

        // Update registration with order ID
        const { error: updateError } = await supabase
            .from('registrations')
            .update({ razorpay_order_id: order.id })
            .eq('id', registration_id)

        if (updateError) {
            console.error('Failed to update registration with order ID:', updateError.message)
            // Don't fail the request - order is created, we can still proceed
        }

        return new Response(
            JSON.stringify({
                success: true,
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Create order error:', error.message || 'Unknown error')
        return new Response(
            JSON.stringify({ success: false, error: 'Failed to create order' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
