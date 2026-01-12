export interface FormField {
    id: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox';
    required: boolean;
    options?: string[];
    placeholder?: string;
}

export interface Ticket {
    id: string;
    title: string;
    description: string | null;
    price: number;
    is_active: boolean;
    form_fields: FormField[];
    max_registrations: number | null;
    created_at: string;
    updated_at: string;
}

export interface Registration {
    id: string;
    user_id: string;
    ticket_id: string;
    registration_id: string | null;
    form_data: Record<string, unknown>;
    status: 'pending' | 'confirmed' | 'cancelled';
    referred_by: string | null;
    checked_in: boolean;
    checked_in_at: string | null;
    checked_in_by: string | null;
    razorpay_order_id?: string | null;
    razorpay_payment_id?: string | null;
    created_at: string;
    ticket?: Ticket;
    profile?: {
        full_name: string;
        email: string;
        phone: string;
    };
}

export interface Profile {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    referral_code: string | null;
    is_admin: boolean;
    is_volunteer: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface FoodCoupon {
    id: string;
    name: string;
    ticket_ids: string[];
    quantity: number;
    is_active: boolean;
    created_at: string;
}

export interface CouponConsumption {
    id: string;
    registration_id: string;
    coupon_id: string;
    consumed_at: string;
    consumed_by: string | null;
}
