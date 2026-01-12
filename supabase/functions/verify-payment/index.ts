import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyPaymentSignature } from '../_shared/razorpay.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request): Promise<Response> => {
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
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            registration_id
        } = await req.json()

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !registration_id) {
            return new Response(
                JSON.stringify({ success: false, error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
        if (!keySecret) {
            console.error('Missing Razorpay key secret')
            return new Response(
                JSON.stringify({ success: false, error: 'Payment service not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // CRITICAL: Verify signature using HMAC-SHA256
        const isValidSignature = await verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            keySecret
        )

        if (!isValidSignature) {
            console.error(`Invalid signature for payment ${razorpay_payment_id}`)
            return new Response(
                JSON.stringify({ success: false, error: 'Invalid payment signature' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`Payment signature verified: ${razorpay_payment_id}`)

        // Initialize Supabase with service role
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

        // Idempotency check - prevent duplicate processing
        const { data: existingReg } = await supabase
            .from('registrations')
            .select('id, status, razorpay_payment_id')
            .eq('id', registration_id)
            .single()

        if (!existingReg) {
            console.error(`Registration not found: ${registration_id}`)
            return new Response(
                JSON.stringify({ success: false, error: 'Registration not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (existingReg.razorpay_payment_id === razorpay_payment_id) {
            console.log(`Payment ${razorpay_payment_id} already processed for registration ${registration_id}`)
            return new Response(
                JSON.stringify({ success: true, message: 'Payment already processed' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Update registration to confirmed with payment details
        const { error: updateError } = await supabase
            .from('registrations')
            .update({
                status: 'confirmed',
                razorpay_payment_id: razorpay_payment_id,
            })
            .eq('id', registration_id)

        if (updateError) {
            console.error('Failed to update registration:', updateError.message)
            throw new Error('Failed to confirm registration')
        }

        console.log(`Registration ${registration_id} confirmed with payment ${razorpay_payment_id}`)

        return new Response(
            JSON.stringify({ success: true, message: 'Payment verified and registration confirmed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Verify payment error:', error.message || 'Unknown error')
        return new Response(
            JSON.stringify({ success: false, error: 'Payment verification failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
