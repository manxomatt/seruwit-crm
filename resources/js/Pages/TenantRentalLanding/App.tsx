import React, { useState } from 'react';
import { TenantRentalLandingProps } from './types';
import Navbar from './components/Navbar';
import HeroWithBookingWidget from './components/HeroWithBookingWidget';
import FleetShowcase from './components/FleetShowcase';
import AdvantagesSection from './components/AdvantagesSection';
import ServicesSection from './components/ServicesSection';
import HowItWorksSection from './components/HowItWorksSection';
import CoverageDepotsSection from './components/CoverageDepotsSection';
import TestimonialsSection from './components/TestimonialsSection';
import FAQSection from './components/FAQSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import TrackingModal from './components/TrackingModal';
import FloatingWhatsApp from './components/FloatingWhatsApp';

export default function TenantRentalLandingApp({
    brand,
    featuredVehicles = [],
    locations = [],
    classes = [],
    customer,
    canLogin = true,
}: TenantRentalLandingProps) {
    const [trackModalOpen, setTrackModalOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased selection:bg-teal-600 selection:text-white">
            {/* Top Navigation */}
            <Navbar
                brand={brand}
                customer={customer}
                canLogin={canLogin}
                onOpenTrackModal={() => setTrackModalOpen(true)}
            />

            {/* Main Content Body */}
            <main className="flex-1">
                {/* 1. Hero with Interactive Booking Bar */}
                <HeroWithBookingWidget
                    brand={brand}
                    locations={locations}
                    classes={classes}
                />

                {/* 2. Fleet Showcase / Vehicle Catalog */}
                <FleetShowcase
                    vehicles={featuredVehicles}
                    brand={brand}
                    classes={classes}
                />

                {/* 3. Why Choose Us / Keunggulan */}
                <AdvantagesSection />

                {/* 4. Complete Rental Services */}
                <ServicesSection />

                {/* 5. 4-Step How It Works */}
                <HowItWorksSection />

                {/* 6. Coverage & Pickup Depots */}
                <CoverageDepotsSection
                    locations={locations}
                    brand={brand}
                />

                {/* 7. Testimonials */}
                <TestimonialsSection />

                {/* 8. Frequently Asked Questions */}
                <FAQSection />

                {/* 9. Final High-Impact CTA */}
                <CTASection brand={brand} />
            </main>

            {/* Footer */}
            <Footer
                brand={brand}
                canLogin={canLogin}
                onOpenTrackModal={() => setTrackModalOpen(true)}
            />

            {/* Interactive Overlays */}
            <TrackingModal
                isOpen={trackModalOpen}
                onClose={() => setTrackModalOpen(false)}
            />

            <FloatingWhatsApp brand={brand} />
        </div>
    );
}
