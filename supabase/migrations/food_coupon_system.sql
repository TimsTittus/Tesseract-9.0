-- Food Coupon System Migration
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Table: food_coupons
-- Stores food coupon types (e.g., Breakfast, Lunch, Snacks)
CREATE TABLE public.food_coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g. "Breakfast", "Lunch", "Snacks"
    ticket_ids UUID[] NOT NULL, -- Array of ticket IDs this coupon applies to
    quantity INTEGER DEFAULT 1, -- How many times per registration
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.food_coupons ENABLE ROW LEVEL SECURITY;

-- Table: coupon_consumptions
-- Tracks each time a coupon is consumed by a registration
CREATE TABLE public.coupon_consumptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES public.registrations(id) NOT NULL,
    coupon_id UUID REFERENCES public.food_coupons(id) NOT NULL,
    consumed_at TIMESTAMPTZ DEFAULT now(),
    consumed_by UUID REFERENCES public.profiles(id),
    UNIQUE(registration_id, coupon_id) -- One consumption per coupon per registration
);

-- Enable RLS
ALTER TABLE public.coupon_consumptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. RLS POLICIES
-- ============================================

-- Admins can manage coupons (full access)
CREATE POLICY "Admin can manage coupons" ON public.food_coupons
FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Volunteers can view coupons (read-only for dropdown lists)
CREATE POLICY "Volunteers can view coupons" ON public.food_coupons
FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_volunteer = true))
);

-- Volunteers can manage consumptions (insert and read)
CREATE POLICY "Volunteers can manage consumptions" ON public.coupon_consumptions
FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_volunteer = true))
);

-- ============================================
-- 3. INDEXES (Optional but recommended)
-- ============================================

-- Index for faster coupon lookups by active status
CREATE INDEX idx_food_coupons_active ON public.food_coupons(is_active);

-- Index for faster consumption lookups
CREATE INDEX idx_coupon_consumptions_registration ON public.coupon_consumptions(registration_id);
CREATE INDEX idx_coupon_consumptions_coupon ON public.coupon_consumptions(coupon_id);
