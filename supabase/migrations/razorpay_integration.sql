-- Razorpay Payment Integration Migration
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- 1. ADD PAYMENT COLUMNS TO REGISTRATIONS
-- ============================================

-- Add Razorpay payment columns to registrations table
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- Index for faster payment lookups
CREATE INDEX IF NOT EXISTS idx_registrations_order_id ON public.registrations(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_id ON public.registrations(razorpay_payment_id);

-- ============================================
-- 2. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN public.registrations.razorpay_order_id IS 'Razorpay order ID created when user clicks Proceed to Payment';
COMMENT ON COLUMN public.registrations.razorpay_payment_id IS 'Razorpay payment ID stored after successful payment verification';
