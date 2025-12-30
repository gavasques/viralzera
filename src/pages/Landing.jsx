import React from 'react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingHero from '@/components/landing/LandingHero';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingFooter from '@/components/landing/LandingFooter';

export default function Landing() {
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            <LandingNavbar />
            <main>
                <LandingHero />
                <LandingFeatures />
                <LandingPricing />
            </main>
            <LandingFooter />
        </div>
    );
}