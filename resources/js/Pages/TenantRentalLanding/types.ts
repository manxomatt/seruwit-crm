export interface Brand {
    name: string;
    tagline?: string | null;
    description?: string | null;
    logo_url?: string | null;
    hero_image_url?: string | null;
    support_phone?: string | null;
    address?: string | null;
    contact_email?: string | null;
    business_hours?: string | null;
    primary_color?: string;
    secondary_color?: string;
    terms_url?: string | null;
    privacy_url?: string | null;
    social?: {
        instagram?: string | null;
        facebook?: string | null;
        tiktok?: string | null;
    };
}

export interface LocationOption {
    id: number;
    name: string;
    address?: string | null;
    city?: string | null;
}

export interface ClassOption {
    value: string;
    label: string;
}

export interface VehicleCardItem {
    id: number | string;
    name: string;
    rental_class?: string | null;
    rental_class_label?: string | null;
    capacity_seats?: number | null;
    fuel_label?: string | null;
    fuel_type?: string | null;
    transmission?: string | null;
    model_year?: number | null;
    photo_url?: string | null;
    from_price?: number | null;
    deposit_amount?: number | null;
    features?: string[];
    is_popular?: boolean;
}

export interface CustomerAuth {
    id: number;
    name: string;
    phone?: string | null;
    email?: string | null;
}

export interface TenantRentalLandingProps {
    settings?: Record<string, string | undefined>;
    brand?: Brand;
    featuredVehicles?: VehicleCardItem[];
    locations?: LocationOption[];
    classes?: ClassOption[];
    customer?: CustomerAuth | null;
    passengerBookingEnabled?: boolean;
    canLogin?: boolean;
}
