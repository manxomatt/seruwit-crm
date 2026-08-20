<?php

namespace Modules\Pages\Support;

class CentralLandingPageTemplate
{
    /**
     * Build the data array for the modern Seruwit Central Landing Page.
     *
     * @return array{title: string, slug: string, html: string, css: string, gjs_data: null}
     */
    public static function build(): array
    {
        $css = self::css();
        $html = self::html();

        return [
            'title' => 'Seruwit CRM – Platform SaaS Rental Kendaraan & Ekosistem Bisnis Modular',
            'slug' => 'home',
            'html' => '<style>'.$css.'</style>'."\n".$html,
            'css' => $css,
            'gjs_data' => null,
        ];
    }

    public static function css(): string
    {
        return <<<'CSS'
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

:root {
    --srw-font: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --srw-slate-900: #0f172a;
    --srw-slate-800: #1e293b;
    --srw-slate-700: #334155;
    --srw-slate-600: #475569;
    --srw-slate-500: #64748b;
    --srw-slate-400: #94a3b8;
    --srw-slate-200: #e2e8f0;
    --srw-slate-100: #f1f5f9;
    --srw-slate-50: #f8fafc;
    --srw-white: #ffffff;

    --srw-teal-700: #0f766e;
    --srw-teal-600: #0d9488;
    --srw-teal-500: #14b8a6;
    --srw-teal-50: #f0fdfa;

    --srw-cyan-600: #0891b2;
    --srw-cyan-500: #06b6d4;
    --srw-cyan-50: #ecfeff;

    --srw-emerald-600: #059669;
    --srw-emerald-500: #10b981;
    --srw-emerald-50: #ecfdf5;

    --srw-indigo-600: #4f46e5;
    --srw-indigo-500: #6366f1;
    --srw-indigo-50: #eef2ff;

    --srw-amber-500: #f59e0b;
    --srw-amber-50: #fffbeb;

    --srw-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --srw-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    --srw-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
    --srw-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
}

.srw-root {
    font-family: var(--srw-font);
    color: var(--srw-slate-800);
    background-color: var(--srw-slate-50);
    line-height: 1.6;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    overflow-x: hidden;
}

.srw-root *, .srw-root *::before, .srw-root *::after {
    box-sizing: border-box;
}

.srw-container {
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 20px;
}

/* ANNOUNCEMENT BANNER */
.srw-banner {
    background: linear-gradient(90deg, #0f766e 0%, #0891b2 50%, #4f46e5 100%);
    color: #ffffff;
    font-size: 0.84rem;
    font-weight: 600;
    text-align: center;
    padding: 8px 16px;
    letter-spacing: 0.01em;
}
.srw-banner a {
    color: #ffffff;
    text-decoration: underline;
    margin-left: 6px;
    font-weight: 700;
}

/* NAVBAR */
.srw-navbar {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--srw-slate-200);
    transition: all 0.2s ease;
}
.srw-nav-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72px;
}
.srw-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--srw-slate-900);
    letter-spacing: -0.02em;
}
.srw-brand-badge {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--srw-teal-600), var(--srw-cyan-600));
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
}
.srw-brand-tag {
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
    background: var(--srw-teal-50);
    color: var(--srw-teal-700);
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid rgba(15, 118, 110, 0.2);
    letter-spacing: 0.04em;
}
.srw-nav-menu {
    display: flex;
    align-items: center;
    gap: 28px;
    list-style: none;
    margin: 0;
    padding: 0;
}
.srw-nav-link {
    text-decoration: none;
    color: var(--srw-slate-600);
    font-size: 0.92rem;
    font-weight: 600;
    transition: color 0.15s ease;
}
.srw-nav-link:hover {
    color: var(--srw-teal-700);
}
.srw-nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}
.srw-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 0.92rem;
    font-weight: 700;
    border-radius: 10px;
    padding: 10px 20px;
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer;
}
.srw-btn-outline {
    background: #ffffff;
    border: 1px solid var(--srw-slate-200);
    color: var(--srw-slate-700);
}
.srw-btn-outline:hover {
    background: var(--srw-slate-50);
    border-color: var(--srw-slate-300);
    color: var(--srw-slate-900);
}
.srw-btn-primary {
    background: linear-gradient(135deg, var(--srw-teal-700) 0%, var(--srw-teal-600) 100%);
    border: 1px solid var(--srw-teal-700);
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(15, 118, 110, 0.25);
}
.srw-btn-primary:hover {
    background: linear-gradient(135deg, #0e655e 0%, #0b7c72 100%);
    box-shadow: 0 6px 18px rgba(15, 118, 110, 0.35);
    transform: translateY(-1px);
}

/* HERO SECTION */
.srw-hero {
    position: relative;
    padding: 70px 0 80px 0;
    background: radial-gradient(100% 80% at 50% -10%, rgba(20, 184, 166, 0.12) 0%, rgba(248, 250, 252, 0) 80%);
    overflow: hidden;
}
.srw-hero-grid {
    display: grid;
    grid-template-columns: 1.15fr 0.95fr;
    gap: 48px;
    align-items: center;
}
.srw-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #ffffff;
    border: 1px solid rgba(13, 148, 136, 0.3);
    padding: 6px 14px;
    border-radius: 50px;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--srw-teal-700);
    box-shadow: var(--srw-shadow-sm);
    margin-bottom: 20px;
}
.srw-hero-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--srw-teal-500);
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.25);
}
.srw-hero-title {
    font-size: clamp(2.2rem, 4vw, 3.4rem);
    font-weight: 800;
    color: var(--srw-slate-900);
    line-height: 1.18;
    letter-spacing: -0.03em;
    margin: 0 0 20px 0;
}
.srw-hero-title span {
    background: linear-gradient(135deg, var(--srw-teal-700) 0%, var(--srw-cyan-600) 50%, var(--srw-indigo-600) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.srw-hero-desc {
    font-size: 1.1rem;
    color: var(--srw-slate-600);
    line-height: 1.65;
    margin: 0 0 32px 0;
    max-width: 580px;
}
.srw-hero-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-bottom: 40px;
}
.srw-hero-trust {
    display: flex;
    align-items: center;
    gap: 24px;
    padding-top: 24px;
    border-top: 1px solid var(--srw-slate-200);
}
.srw-trust-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--srw-slate-600);
}
.srw-trust-icon {
    color: var(--srw-emerald-600);
    font-size: 1.1rem;
}

/* HERO VISUAL DASHBOARD MOCKUP */
.srw-dashboard-mockup {
    background: #ffffff;
    border: 1px solid var(--srw-slate-200);
    border-radius: 20px;
    box-shadow: var(--srw-shadow-xl), 0 0 0 1px rgba(0,0,0,0.02);
    overflow: hidden;
    position: relative;
}
.srw-mockup-bar {
    background: var(--srw-slate-900);
    color: #ffffff;
    padding: 12px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.8rem;
    font-weight: 600;
}
.srw-mockup-dots {
    display: flex;
    gap: 6px;
}
.srw-mockup-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #475569;
}
.srw-mockup-body {
    padding: 22px;
    background: #fcfdfe;
}
.srw-mockup-statgrid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin-bottom: 18px;
}
.srw-mstat-card {
    background: #ffffff;
    border: 1px solid var(--srw-slate-200);
    border-radius: 14px;
    padding: 14px 16px;
}
.srw-mstat-lbl {
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--srw-slate-500);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 4px;
}
.srw-mstat-val {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--srw-slate-900);
}
.srw-mstat-badge {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--srw-emerald-600);
    background: var(--srw-emerald-50);
    padding: 2px 6px;
    border-radius: 4px;
    display: inline-block;
    margin-top: 4px;
}
.srw-mvehicle-card {
    background: #ffffff;
    border: 1px solid var(--srw-slate-200);
    border-radius: 14px;
    padding: 16px;
    margin-top: 14px;
}
.srw-mvehicle-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}
.srw-mvehicle-title {
    font-size: 0.92rem;
    font-weight: 800;
    color: var(--srw-slate-900);
}
.srw-mvehicle-status {
    font-size: 0.72rem;
    font-weight: 700;
    background: var(--srw-teal-50);
    color: var(--srw-teal-700);
    border: 1px solid rgba(13, 148, 136, 0.2);
    padding: 3px 8px;
    border-radius: 6px;
}
.srw-mvehicle-info {
    font-size: 0.8rem;
    color: var(--srw-slate-600);
    display: flex;
    gap: 12px;
}

/* SECTION COMMONS */
.srw-section {
    padding: 85px 0;
    position: relative;
}
.srw-section-white {
    background: #ffffff;
}
.srw-section-alt {
    background: var(--srw-slate-50);
}
.srw-head-center {
    text-align: center;
    max-width: 720px;
    margin: 0 auto 52px auto;
}
.srw-tag-pill {
    display: inline-block;
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--srw-teal-700);
    background: var(--srw-teal-50);
    border: 1px solid rgba(13, 148, 136, 0.2);
    padding: 5px 14px;
    border-radius: 50px;
    margin-bottom: 14px;
}
.srw-section-title {
    font-size: clamp(1.8rem, 3.2vw, 2.5rem);
    font-weight: 800;
    color: var(--srw-slate-900);
    letter-spacing: -0.02em;
    line-height: 1.25;
    margin: 0 0 16px 0;
}
.srw-section-subtitle {
    font-size: 1.05rem;
    color: var(--srw-slate-600);
    line-height: 1.6;
    margin: 0;
}

/* RENTAL SPOTLIGHT (FLAGSHIP TODAY) */
.srw-spotlight-box {
    background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 50%, #f8fafc 100%);
    border: 1px solid rgba(13, 148, 136, 0.25);
    border-radius: 24px;
    padding: 44px;
    box-shadow: var(--srw-shadow-lg);
    margin-bottom: 48px;
}
.srw-spotlight-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: center;
}
.srw-feature-list {
    display: grid;
    gap: 16px;
    margin: 24px 0 32px 0;
}
.srw-feature-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
}
.srw-feature-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--srw-teal-50);
    color: var(--srw-teal-700);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
}
.srw-feature-text h4 {
    margin: 0 0 3px 0;
    font-size: 0.98rem;
    font-weight: 700;
    color: var(--srw-slate-900);
}
.srw-feature-text p {
    margin: 0;
    font-size: 0.88rem;
    color: var(--srw-slate-600);
    line-height: 1.5;
}

/* FLEET CARDS GRID */
.srw-fleet-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
}
.srw-fleet-card {
    background: #ffffff;
    border: 1px solid var(--srw-slate-200);
    border-radius: 18px;
    overflow: hidden;
    transition: all 0.25s ease;
    display: flex;
    flex-direction: column;
}
.srw-fleet-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--srw-shadow-xl);
    border-color: rgba(13, 148, 136, 0.3);
}
.srw-fleet-media {
    height: 160px;
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3.5rem;
    position: relative;
}
.srw-fleet-category {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(15, 23, 42, 0.85);
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 50px;
    backdrop-filter: blur(4px);
}
.srw-fleet-body {
    padding: 20px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.srw-fleet-name {
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--srw-slate-900);
    margin: 0 0 8px 0;
}
.srw-fleet-specs {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 0.8rem;
    color: var(--srw-slate-600);
    margin-bottom: 18px;
}
.srw-fleet-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--srw-slate-100);
    padding-top: 14px;
}
.srw-fleet-price {
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--srw-teal-700);
}
.srw-fleet-price span {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--srw-slate-500);
}

/* MODULAR ECOSYSTEM EXPANSION SUITES */
.srw-ecosystem-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 28px;
}
.srw-eco-card {
    background: #ffffff;
    border: 1px solid var(--srw-slate-200);
    border-radius: 20px;
    padding: 32px;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
}
.srw-eco-card:hover {
    box-shadow: var(--srw-shadow-lg);
    border-color: var(--srw-teal-500);
}
.srw-eco-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
}
.srw-eco-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
}
.srw-icon-teal { background: var(--srw-teal-50); color: var(--srw-teal-700); }
.srw-icon-cyan { background: var(--srw-cyan-50); color: var(--srw-cyan-600); }
.srw-icon-indigo { background: var(--srw-indigo-50); color: var(--srw-indigo-600); }
.srw-icon-amber { background: var(--srw-amber-50); color: var(--srw-amber-500); }

.srw-eco-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--srw-slate-900);
    margin: 0;
}
.srw-eco-desc {
    font-size: 0.94rem;
    color: var(--srw-slate-600);
    line-height: 1.6;
    margin: 0 0 20px 0;
}
.srw-eco-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.srw-eco-tag {
    font-size: 0.78rem;
    font-weight: 700;
    background: var(--srw-slate-100);
    color: var(--srw-slate-700);
    padding: 4px 12px;
    border-radius: 50px;
    border: 1px solid var(--srw-slate-200);
}
.srw-eco-tag.srw-tag-active {
    background: var(--srw-teal-50);
    color: var(--srw-teal-700);
    border-color: rgba(13, 148, 136, 0.3);
}

/* HORIZON / MARKETPLACE BANNER */
.srw-horizon-box {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #ffffff;
    border-radius: 20px;
    padding: 38px 44px;
    margin-top: 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
}
.srw-horizon-content h3 {
    font-size: 1.45rem;
    font-weight: 800;
    margin: 0 0 8px 0;
    color: #ffffff;
}
.srw-horizon-content p {
    font-size: 0.95rem;
    color: var(--srw-slate-400);
    margin: 0;
    max-width: 680px;
    line-height: 1.6;
}

/* HOW IT WORKS / 3 STEPS */
.srw-steps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
}
.srw-step-card {
    background: #ffffff;
    border: 1px solid var(--srw-slate-200);
    border-radius: 20px;
    padding: 34px 28px;
    text-align: center;
    position: relative;
}
.srw-step-num {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--srw-teal-700), var(--srw-cyan-600));
    color: #ffffff;
    font-size: 1.3rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px auto;
    box-shadow: 0 6px 16px rgba(13, 148, 136, 0.3);
}
.srw-step-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--srw-slate-900);
    margin: 0 0 10px 0;
}
.srw-step-desc {
    font-size: 0.92rem;
    color: var(--srw-slate-600);
    margin: 0;
    line-height: 1.6;
}

/* PRICING PLANS */
.srw-price-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
}
.srw-price-card {
    background: #ffffff;
    border: 1px solid var(--srw-slate-200);
    border-radius: 20px;
    padding: 36px 30px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.2s ease;
}
.srw-price-card.srw-price-popular {
    border: 2px solid var(--srw-teal-600);
    box-shadow: var(--srw-shadow-xl);
    position: relative;
}
.srw-popular-badge {
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--srw-teal-700);
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 4px 14px;
    border-radius: 50px;
}
.srw-plan-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--srw-slate-900);
    margin: 0 0 6px 0;
}
.srw-plan-desc {
    font-size: 0.88rem;
    color: var(--srw-slate-500);
    margin: 0 0 20px 0;
    line-height: 1.5;
}
.srw-plan-cost {
    font-size: 2rem;
    font-weight: 800;
    color: var(--srw-slate-900);
    margin-bottom: 24px;
}
.srw-plan-cost span {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--srw-slate-500);
}
.srw-plan-features {
    list-style: none;
    margin: 0 0 32px 0;
    padding: 0;
    display: grid;
    gap: 12px;
}
.srw-plan-feature {
    font-size: 0.88rem;
    color: var(--srw-slate-700);
    display: flex;
    align-items: center;
    gap: 10px;
}
.srw-plan-check {
    color: var(--srw-teal-600);
    font-weight: bold;
}

/* FAQ */
.srw-faq-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    max-width: 1000px;
    margin: 0 auto;
}
.srw-faq-card {
    background: #ffffff;
    border: 1px solid var(--srw-slate-200);
    border-radius: 16px;
    padding: 24px 26px;
}
.srw-faq-q {
    font-size: 1.05rem;
    font-weight: 800;
    color: var(--srw-slate-900);
    margin: 0 0 10px 0;
}
.srw-faq-a {
    font-size: 0.92rem;
    color: var(--srw-slate-600);
    margin: 0;
    line-height: 1.6;
}

/* CTA BANNER SECTION */
.srw-cta-section {
    background: linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #0891b2 100%);
    color: #ffffff;
    padding: 80px 0;
    text-align: center;
}
.srw-cta-title {
    font-size: clamp(2rem, 3.5vw, 2.8rem);
    font-weight: 800;
    margin: 0 0 16px 0;
    letter-spacing: -0.02em;
}
.srw-cta-desc {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.9);
    max-width: 600px;
    margin: 0 auto 36px auto;
    line-height: 1.6;
}
.srw-btn-white {
    background: #ffffff;
    color: var(--srw-teal-700);
    font-weight: 800;
    padding: 14px 34px;
    border-radius: 12px;
    font-size: 1rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
.srw-btn-white:hover {
    background: #f8fafc;
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
}

/* FOOTER */
.srw-footer {
    background: var(--srw-slate-900);
    color: var(--srw-slate-400);
    padding: 70px 0 32px 0;
}
.srw-footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 40px;
    margin-bottom: 48px;
}
.srw-footer-brand h3 {
    font-size: 1.35rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 14px 0;
}
.srw-footer-brand p {
    font-size: 0.9rem;
    line-height: 1.7;
    margin: 0 0 20px 0;
    max-width: 320px;
}
.srw-footer-col h4 {
    font-size: 0.92rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 18px 0;
    letter-spacing: 0.02em;
}
.srw-footer-links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
}
.srw-footer-link a {
    color: var(--srw-slate-400);
    text-decoration: none;
    font-size: 0.88rem;
    transition: color 0.15s ease;
}
.srw-footer-link a:hover {
    color: #ffffff;
}
.srw-footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.84rem;
}

/* RESPONSIVE BREAKPOINTS */
@media (max-width: 992px) {
    .srw-hero-grid, .srw-spotlight-grid, .srw-ecosystem-grid, .srw-price-grid, .srw-steps-grid, .srw-fleet-grid, .srw-faq-grid {
        grid-template-columns: 1fr;
    }
    .srw-footer-grid {
        grid-template-columns: 1fr 1fr;
    }
    .srw-horizon-box {
        flex-direction: column;
        text-align: center;
    }
    .srw-nav-menu {
        display: none;
    }
}
@media (max-width: 640px) {
    .srw-footer-grid {
        grid-template-columns: 1fr;
    }
    .srw-footer-bottom {
        flex-direction: column;
        gap: 12px;
        text-align: center;
    }
    .srw-hero-trust {
        flex-direction: column;
        align-items: flex-start;
    }
}
CSS;
    }

    public static function html(): string
    {
        return <<<'HTML'
<div class="srw-root">

  <!-- TOP ANNOUNCEMENT BAR -->
  <div class="srw-banner">
    🚀 <strong>Seruwit Platform:</strong> Solusi SaaS Rental Kendaraan & Ekosistem Bisnis Modular. <a href="#modul">Pelajari Arsitektur Modul →</a>
  </div>

  <!-- NAVBAR -->
  <nav class="srw-navbar">
    <div class="srw-container">
      <div class="srw-nav-wrap">
        <a href="/" class="srw-brand">
          <div class="srw-brand-badge">⚡</div>
          <span>{{setting:general.site_name}}</span>
          <span class="srw-brand-tag">Modular OS</span>
        </a>
        <ul class="srw-nav-menu">
          <li><a href="#rental" class="srw-nav-link">Rental &amp; Armada</a></li>
          <li><a href="#modul" class="srw-nav-link">Modul Suite</a></li>
          <li><a href="#keunggulan" class="srw-nav-link">Keunggulan</a></li>
          <li><a href="#cara-kerja" class="srw-nav-link">Cara Kerja</a></li>
          <li><a href="#harga" class="srw-nav-link">Paket Harga</a></li>
          <li><a href="#faq" class="srw-nav-link">FAQ</a></li>
        </ul>
        <div class="srw-nav-actions">
          <a href="/login" class="srw-btn srw-btn-outline">Masuk</a>
          <a href="/workspaces" class="srw-btn srw-btn-primary">Portal Workspace</a>
        </div>
      </div>
    </div>
  </nav>

  <!-- HERO SECTION -->
  <header class="srw-hero">
    <div class="srw-container">
      <div class="srw-hero-grid">
        <div class="srw-hero-content">
          <div class="srw-hero-badge">
            <span class="srw-hero-dot"></span> Solusi Rental Kendaraan &amp; Modular ERP #1
          </div>
          <h1 class="srw-hero-title">
            Kelola Rental Kendaraan &amp; <span>Otomasi Seluruh Bisnis Anda.</span>
          </h1>
          <p class="srw-hero-desc">
            Tinggalkan pencatatan terpisah. Seruwit menyatukan manajemen rental mobil &amp; shuttle, pemantauan live GPS armada, inventori gudang, hingga faktur akuntansi dalam satu platform modular multi-tenant.
          </p>
          <div class="srw-hero-btns">
            <a href="#rental" class="srw-btn srw-btn-primary">
              🚗 Lihat Solusi Rental
            </a>
            <a href="#modul" class="srw-btn srw-btn-outline">
              🧩 Jelajahi Modul Suite
            </a>
          </div>
          <div class="srw-hero-trust">
            <div class="srw-trust-item">
              <span class="srw-trust-icon">✓</span> Siap Pakai Hari Ini
            </div>
            <div class="srw-trust-item">
              <span class="srw-trust-icon">✓</span> Multi-Tenant Terisolasi
            </div>
            <div class="srw-trust-item">
              <span class="srw-trust-icon">✓</span> Modul Plug &amp; Play
            </div>
          </div>
        </div>

        <!-- HERO VISUAL MOCKUP -->
        <div class="srw-dashboard-mockup">
          <div class="srw-mockup-bar">
            <div class="srw-mockup-dots">
              <div class="srw-mockup-dot"></div>
              <div class="srw-mockup-dot"></div>
              <div class="srw-mockup-dot"></div>
            </div>
            <span>Seruwit Workspace Dashboard • Live</span>
            <span style="color:#14b8a6;">● Online</span>
          </div>
          <div class="srw-mockup-body">
            <div class="srw-mockup-statgrid">
              <div class="srw-mstat-card">
                <div class="srw-mstat-lbl">Armada Aktif Rental</div>
                <div class="srw-mstat-val">38 / 42</div>
                <span class="srw-mstat-badge">90.4% Tingkat Utilisasi</span>
              </div>
              <div class="srw-mstat-card">
                <div class="srw-mstat-lbl">Pemesanan Hari Ini</div>
                <div class="srw-mstat-val">19 Booking</div>
                <span class="srw-mstat-badge" style="background:#f0fdf4; color:#16a34a;">+12% vs Kemarin</span>
              </div>
            </div>

            <!-- ACTIVE VEHICLE PREVIEW -->
            <div class="srw-mvehicle-card">
              <div class="srw-mvehicle-head">
                <span class="srw-mvehicle-title">Toyota Innova Zenix Q Hybrid</span>
                <span class="srw-mvehicle-status">On Trip (Lepas Kunci)</span>
              </div>
              <div class="srw-mvehicle-info">
                <span>📍 Live GPS: Jakarta Selatan</span>
                <span>⏱️ Selesai: Besok, 18:00</span>
              </div>
            </div>

            <div class="srw-mvehicle-card" style="margin-top: 10px;">
              <div class="srw-mvehicle-head">
                <span class="srw-mvehicle-title">Toyota HiAce Premio Luxury</span>
                <span class="srw-mvehicle-status" style="background:#eff6ff; color:#2563eb; border-color:#bfdbfe;">Shuttle Travel Scheduled</span>
              </div>
              <div class="srw-mvehicle-info">
                <span>🛣️ Rute: Bandung → Jakarta</span>
                <span>👥 10 / 10 Kursi Terisi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- FLAGSHIP SPOTLIGHT: RENTAL KENDARAAN SAAS -->
  <section class="srw-section srw-section-white" id="rental">
    <div class="srw-container">
      <div class="srw-head-center">
        <span class="srw-tag-pill">Solusi Utama Hari Ini</span>
        <h2 class="srw-section-title">SaaS Rental Kendaraan &amp; Shuttle Cerdas</h2>
        <p class="srw-section-subtitle">
          Sistem manajemen lengkap untuk pemilik rental mobil, motor, bus pariwisata, hingga armada shuttle travel antar-kota.
        </p>
      </div>

      <div class="srw-spotlight-box">
        <div class="srw-spotlight-grid">
          <div>
            <span class="srw-brand-tag">Rental &amp; Fleet Management</span>
            <h3 style="font-size: 1.8rem; font-weight: 800; color: #0f172a; margin: 12px 0 16px 0; line-height: 1.25;">
              Automasi Penuh Operasional Rental dari Booking hingga Pengembalian Unit
            </h3>
            <p style="font-size: 0.95rem; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
              Tidak perlu lagi mengecek ketersediaan unit secara manual. Kalender ketersediaan armada langsung ter-update otomatis setiap ada pesanan baru.
            </p>

            <div class="srw-feature-list">
              <div class="srw-feature-row">
                <div class="srw-feature-icon">📅</div>
                <div class="srw-feature-text">
                  <h4>Kalender Ketersediaan Real-Time</h4>
                  <p>Hindari double booking dengan visualisasi kalender armada yang interaktif dan dinamis.</p>
                </div>
              </div>
              <div class="srw-feature-row">
                <div class="srw-feature-icon">🪪</div>
                <div class="srw-feature-text">
                  <h4>Verifikasi KTP, SIM &amp; Deposit Otomatis</h4>
                  <p>Kelola data identitas penyewa, foto dokumen, checklist kondisi mobil, dan jaminan deposit.</p>
                </div>
              </div>
              <div class="srw-feature-row">
                <div class="srw-feature-icon">📍</div>
                <div class="srw-feature-text">
                  <h4>Live Telematika &amp; GPS Tracking</h4>
                  <p>Pantau posisi kendaraan yang sedang disewa secara langsung lengkap dengan histori perjalanan.</p>
                </div>
              </div>
            </div>

            <a href="/workspaces" class="srw-btn srw-btn-primary">Mulai Kelola Rental Anda →</a>
          </div>

          <!-- SAMPLE FLEET GRID -->
          <div class="srw-fleet-grid" style="grid-template-columns: 1fr;">
            <div class="srw-fleet-card">
              <div class="srw-fleet-media">
                🚙
                <span class="srw-fleet-category">SUV Premium</span>
              </div>
              <div class="srw-fleet-body">
                <h4 class="srw-fleet-name">Toyota Fortuner 2.8 GR Sport</h4>
                <div class="srw-fleet-specs">
                  <span>👥 7 Kursi</span>
                  <span>⚙️ Otomatis</span>
                  <span>❄️ Double Blower</span>
                  <span>⛽ Diesel</span>
                </div>
                <div class="srw-fleet-footer">
                  <div class="srw-fleet-price">Rp 850.000 <span>/hari</span></div>
                  <span class="srw-btn srw-btn-outline" style="padding: 6px 14px; font-size: 0.82rem;">Siap Jalan</span>
                </div>
              </div>
            </div>

            <div class="srw-fleet-card">
              <div class="srw-fleet-media">
                🚐
                <span class="srw-fleet-category">Shuttle &amp; Commuter</span>
              </div>
              <div class="srw-fleet-body">
                <h4 class="srw-fleet-name">Toyota HiAce Premio Luxury</h4>
                <div class="srw-fleet-specs">
                  <span>👥 10-14 Kursi</span>
                  <span>🛋️ Captain Seat</span>
                  <span>📺 Multimedia</span>
                  <span>👨‍✈️ Driver Ready</span>
                </div>
                <div class="srw-fleet-footer">
                  <div class="srw-fleet-price">Rp 1.400.000 <span>/hari</span></div>
                  <span class="srw-btn srw-btn-outline" style="padding: 6px 14px; font-size: 0.82rem;">Siap Jalan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- MODULAR ECOSYSTEM SUITES GRID -->
  <section class="srw-section srw-section-alt" id="modul">
    <div class="srw-container">
      <div class="srw-head-center">
        <span class="srw-tag-pill">Ekosistem Lengkap</span>
        <h2 class="srw-section-title">Modul Spesialis Sesuai Skala Bisnis Anda</h2>
        <p class="srw-section-subtitle">
          Mulai dari rental armada hari ini, aktifkan modul logistik, inventori, POS, hingga marketplace saat bisnis Anda terus berkembang.
        </p>
      </div>

      <div class="srw-ecosystem-grid">
        <!-- Suite 1: Mobility & Fleet -->
        <div class="srw-eco-card">
          <div class="srw-eco-header">
            <div class="srw-eco-icon srw-icon-teal">🚗</div>
            <div>
              <h3 class="srw-eco-title">Mobilitas &amp; Armada</h3>
              <span style="font-size: 0.8rem; color: #0d9488; font-weight: 700;">Tersedia &amp; Siap Pakai</span>
            </div>
          </div>
          <p class="srw-eco-desc">
            Manajemen rental kendaraan lepas kunci/dengan supir, shuttle travel terjadwal, TMS rute pengiriman, pemantauan GPS live, dan perawatan kendaraan.
          </p>
          <div class="srw-eco-tags">
            <span class="srw-eco-tag srw-tag-active">Rental Kendaraan</span>
            <span class="srw-eco-tag srw-tag-active">Shuttle Travel</span>
            <span class="srw-eco-tag srw-tag-active">Fleet Management</span>
            <span class="srw-eco-tag srw-tag-active">Live GPS Tracking</span>
            <span class="srw-eco-tag srw-tag-active">Driver Scoring</span>
          </div>
        </div>

        <!-- Suite 2: Supply Chain & Logistics -->
        <div class="srw-eco-card">
          <div class="srw-eco-header">
            <div class="srw-eco-icon srw-icon-cyan">📦</div>
            <div>
              <h3 class="srw-eco-title">Supply Chain &amp; Logistik</h3>
              <span style="font-size: 0.8rem; color: #0891b2; font-weight: 700;">Tersedia &amp; Siap Pakai</span>
            </div>
          </div>
          <p class="srw-eco-desc">
            Kontrol stok multi-gudang, purchase order (PO), penerimaan barang (GRN), surat jalan digital (POD), dan distribusi barang tanpa blind spot.
          </p>
          <div class="srw-eco-tags">
            <span class="srw-eco-tag srw-tag-active">Inventory Multi-Gudang</span>
            <span class="srw-eco-tag srw-tag-active">Purchasing (PO/GRN)</span>
            <span class="srw-eco-tag srw-tag-active">Outbound Dispatch</span>
            <span class="srw-eco-tag srw-tag-active">Delivery Orders (POD)</span>
          </div>
        </div>

        <!-- Suite 3: Commerce & Sales -->
        <div class="srw-eco-card">
          <div class="srw-eco-header">
            <div class="srw-eco-icon srw-icon-amber">🛍️</div>
            <div>
              <h3 class="srw-eco-title">Commerce &amp; Penjualan</h3>
              <span style="font-size: 0.8rem; color: #d97706; font-weight: 700;">Tersedia &amp; Siap Pakai</span>
            </div>
          </div>
          <p class="srw-eco-desc">
            Kasir Point of Sale (POS) untuk toko/cabang fisik, manajemen sales lapangan &amp; canvassing, promosi dagang, dan katalog produk.
          </p>
          <div class="srw-eco-tags">
            <span class="srw-eco-tag srw-tag-active">POS Kasir Cabang</span>
            <span class="srw-eco-tag srw-tag-active">Sales Canvassing</span>
            <span class="srw-eco-tag srw-tag-active">Trade Promotions</span>
            <span class="srw-eco-tag srw-tag-active">Product Catalog</span>
          </div>
        </div>

        <!-- Suite 4: Finance & ERP -->
        <div class="srw-eco-card">
          <div class="srw-eco-header">
            <div class="srw-eco-icon srw-icon-indigo">💰</div>
            <div>
              <h3 class="srw-eco-title">Keuangan &amp; Akuntansi</h3>
              <span style="font-size: 0.8rem; color: #4f46e5; font-weight: 700;">Tersedia &amp; Siap Pakai</span>
            </div>
          </div>
          <p class="srw-eco-desc">
            Faktur otomatis dari rental atau pesanan barang, manajemen piutang (AR) &amp; utang (AP), jurnal akuntansi (GL), dan approval berjenjang.
          </p>
          <div class="srw-eco-tags">
            <span class="srw-eco-tag srw-tag-active">Automated Invoicing</span>
            <span class="srw-eco-tag srw-tag-active">Piutang &amp; Aging</span>
            <span class="srw-eco-tag srw-tag-active">Buku Besar / GL</span>
            <span class="srw-eco-tag srw-tag-active">Multi-tier Approvals</span>
          </div>
        </div>
      </div>

      <!-- HORIZON ROADMAP: MARKETPLACE -->
      <div class="srw-horizon-box">
        <div class="srw-horizon-content">
          <span style="background:rgba(20, 184, 166, 0.2); color:#2dd4bf; font-size:0.75rem; font-weight:800; padding:3px 10px; border-radius:50px; text-transform:uppercase;">Ecosystem Horizon</span>
          <h3>🌐 B2B Marketplace &amp; E-Commerce Storefront</h3>
          <p>
            Visi masa depan Seruwit: Membuka kolaborasi antar-tenant. Saling bertukar permintaan armada sewa saat unit Anda penuh, jual beli suku cadang, hingga etalase e-commerce B2B terintegrasi.
          </p>
        </div>
        <div>
          <a href="/workspaces" class="srw-btn" style="background:#ffffff; color:#0f172a; font-weight:800; white-space:nowrap;">Gabung Ekosistem</a>
        </div>
      </div>
    </div>
  </section>

  <!-- KEUNGGULAN / PLATFORM ADVANTAGES -->
  <section class="srw-section srw-section-white" id="keunggulan">
    <div class="srw-container">
      <div class="srw-head-center">
        <span class="srw-tag-pill">Mengapa Seruwit?</span>
        <h2 class="srw-section-title">Arsitektur Multi-Tenant yang Aman &amp; Terisolasi</h2>
        <p class="srw-section-subtitle">
          Dibangun khusus untuk performa tinggi, privasi data perusahaan, dan fleksibilitas tanpa batas.
        </p>
      </div>

      <div class="srw-steps-grid">
        <div class="srw-step-card">
          <div class="srw-step-num">🏢</div>
          <h3 class="srw-step-title">Multi-Tenant Isolation</h3>
          <p class="srw-step-desc">
            Setiap perusahaan memiliki database dan ruang kerja yang terisolasi penuh demi keamanan dan kepatuhan privasi data.
          </p>
        </div>

        <div class="srw-step-card">
          <div class="srw-step-num">🧩</div>
          <h3 class="srw-step-title">Bayar Sesuai Kebutuhan</h3>
          <p class="srw-step-desc">
            Pasang modul rental saat memulai, dan cukup aktifkan modul gudang atau POS kasir saat bisnis Anda berekspansi.
          </p>
        </div>

        <div class="srw-step-card">
          <div class="srw-step-num">📱</div>
          <h3 class="srw-step-title">Mobile PWA Ready</h3>
          <p class="srw-step-desc">
            Dapat diakses lancar dari smartphone oleh pengemudi, staf lapangan, kasir toko, maupun pelanggan penyewa.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- CARA KERJA (3 LANGKAH) -->
  <section class="srw-section srw-section-alt" id="cara-kerja">
    <div class="srw-container">
      <div class="srw-head-center">
        <span class="srw-tag-pill">Cara Kerja</span>
        <h2 class="srw-section-title">Mulai Operasional Hanya dalam 3 Langkah</h2>
        <p class="srw-section-subtitle">Tidak membutuhkan instalasi server yang rumit. Workspace Anda langsung siap pakai.</p>
      </div>

      <div class="srw-steps-grid">
        <div class="srw-step-card">
          <div class="srw-step-num">1</div>
          <h3 class="srw-step-title">Daftarkan Workspace</h3>
          <p class="srw-step-desc">Buat akun perusahaan Anda dan dapatkan domain workspace mandiri dalam hitungan detik.</p>
        </div>

        <div class="srw-step-card">
          <div class="srw-step-num">2</div>
          <h3 class="srw-step-title">Aktifkan Modul Pilihan</h3>
          <p class="srw-step-desc">Pilih modul Rental Kendaraan, Shuttle, Inventory, atau Kasir sesuai lini bisnis yang aktif.</p>
        </div>

        <div class="srw-step-card">
          <div class="srw-step-num">3</div>
          <h3 class="srw-step-title">Jalankan Operasi Harian</h3>
          <p class="srw-step-desc">Input unit armada, kelola booking pelanggan, pantau posisi GPS, dan terbitkan invoice otomatis.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- PAKET HARGA -->
  <section class="srw-section srw-section-white" id="harga">
    <div class="srw-container">
      <div class="srw-head-center">
        <span class="srw-tag-pill">Paket Investasi</span>
        <h2 class="srw-section-title">Paket Fleksibel untuk Setiap Tahap Usaha</h2>
        <p class="srw-section-subtitle">Transparan, terjangkau, dan dapat di-upgrade sewaktu-waktu.</p>
      </div>

      <div class="srw-price-grid">
        <!-- Starter Plan -->
        <div class="srw-price-card">
          <div>
            <h3 class="srw-plan-title">Rental Starter</h3>
            <p class="srw-plan-desc">Cocok untuk usaha rental mobil atau shuttle travel mandiri.</p>
            <div class="srw-plan-cost">Rp 299rb <span>/bulan</span></div>
            <ul class="srw-plan-features">
              <li class="srw-plan-feature"><span class="srw-plan-check">✓</span> Modul Rental Kendaraan Penuh</li>
              <li class="srw-plan-feature"><span class="srw-plan-check">✓</span> Kalender Booking &amp; Jadwal Armada</li>
              <li class="srw-plan-feature"><span class="srw-plan-check">✓</span> Verifikasi Dokumen &amp; Deposit</li>
              <li class="srw-plan-feature"><span class="srw-plan-check">✓</span> Faktur &amp; Tagihan Otomatis</li>
            </ul>
          </div>
          <a href="/workspaces" class="srw-btn srw-btn-outline">Pilih Paket Starter</a>
        </div>

        <!-- Growth Plan -->
        <div class="srw-price-card srw-price-popular">
          <div class="srw-popular-badge">Paling Populer</div>
          <div>
            <h3 class="srw-plan-title">Mobility &amp; Logistics</h3>
            <p class="srw-plan-desc">Untuk bisnis rental berkembang dengan kebutuhan pelacakan &amp; logistik.</p>
            <div class="srw-plan-cost">Rp 699rb <span>/bulan</span></div>
            <ul class="srw-plan-features">
              <li class="srw-plan-feature"><span class="srw-plan-check">✓</span> Semua Fitur Rental Starter</li>
              <li class="srw-plan-feature"><span class="srw-plan-check">✓</span> Live GPS Tracking &amp; Telematika</li>
              <li class="srw-plan-feature"><span class="srw-plan-check">✓</span> Modul Shuttle &amp; Tiket Penumpang</li>
              <li class="srw-plan-feature"><span class="srw-plan-check">✓</span> Manajemen Inventori &amp; Suku Cadang</li>
              <li class="srw-plan-feature"><span class="srw-plan-check">✓</span> Multi-User &amp; Hak Akses Khusus</li>
            </ul>
          </div>
          <a href="/workspaces" class="srw-btn srw-btn-primary">Mulai Uji Coba Gratis</a>
        </div>

        <!-- Enterprise Plan -->
        <div class="srw-price-card">
          <div>
            <h3 class="srw-plan-title">Full Enterprise Suite</h3>
            <p class="srw-plan-desc">Solusi komprehensif tanpa batas modul untuk perusahaan skala besar.</p>
            <div class="srw-plan-cost">Hubungi Kami <span>/custom</span></div>
            <ul class="srw-plan-features">
              <li class="srw-plan-feature"><span class="srw-plan-check">✓</span> Seluruh Modul Bisnis (28+ Modul)</li>
              <li class="srw-plan-feature"><span class="srw-plan-check">✓</span> Akuntansi Buku Besar &amp; Audit Trail</li>
              <li class="srw-plan-feature"><span class="srw-plan-check">✓</span> Akses Awal B2B Marketplace</li>
              <li class="srw-plan-feature"><span class="srw-plan-check">✓</span> Custom Domain &amp; Dedicated Support</li>
            </ul>
          </div>
          <a href="mailto:{{setting:site.contact_email}}" class="srw-btn srw-btn-outline">Konsultasi Enterprise</a>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="srw-section srw-section-alt" id="faq">
    <div class="srw-container">
      <div class="srw-head-center">
        <span class="srw-tag-pill">Pertanyaan Umum</span>
        <h2 class="srw-section-title">Hal yang Sering Ditanyakan</h2>
      </div>

      <div class="srw-faq-grid">
        <div class="srw-faq-card">
          <h4 class="srw-faq-q">Apakah saya bisa hanya memakai fitur rental kendaraan saja?</h4>
          <p class="srw-faq-a">
            Tentu saja! Seruwit dirancang modular. Anda dapat mengaktifkan modul rental saja tanpa perlu terganggu dengan modul lain yang belum dibutuhkan.
          </p>
        </div>

        <div class="srw-faq-card">
          <h4 class="srw-faq-q">Bagaimana jika nanti saya ingin menambah modul logistik atau POS?</h4>
          <p class="srw-faq-a">
            Anda dapat langsung mengaktifkannya dari menu Registry Modul di dashboard workspace Anda secara instan tanpa perlu migrasi data atau ganti aplikasi.
          </p>
        </div>

        <div class="srw-faq-card">
          <h4 class="srw-faq-q">Apakah data bisnis rental saya aman dari tenant lain?</h4>
          <p class="srw-faq-a">
            Sangat aman. Setiap tenant beroperasi dalam arsitektur multi-tenant terisolasi penuh dengan database independen dan hak akses ketat.
          </p>
        </div>

        <div class="srw-faq-card">
          <h4 class="srw-faq-q">Bisakah saya menggunakan nama domain bisnis saya sendiri?</h4>
          <p class="srw-faq-a">
            Ya, Seruwit mendukung custom domain untuk masing-masing tenant workspace sehingga brand bisnis Anda tampil profesional.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- FINAL CTA -->
  <section class="srw-cta-section">
    <div class="srw-container">
      <h2 class="srw-cta-title">Siap Memajukan Bisnis Rental &amp; Mobilitas Anda?</h2>
      <p class="srw-cta-desc">
        Bergabunglah dengan ekosistem bisnis modern Seruwit. Daftarkan workspace perusahaan Anda hari ini.
      </p>
      <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap;">
        <a href="/workspaces" class="srw-btn srw-btn-white">Daftar Workspace Gratis →</a>
        <a href="mailto:{{setting:site.contact_email}}" class="srw-btn" style="background:rgba(255,255,255,0.15); color:#ffffff; border:1px solid rgba(255,255,255,0.3);">Hubungi Tim Sales</a>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="srw-footer">
    <div class="srw-container">
      <div class="srw-footer-grid">
        <div class="srw-footer-brand">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
            <div class="srw-brand-badge" style="width:32px; height:32px; font-size:1rem;">⚡</div>
            <h3 style="margin:0;">{{setting:general.site_name}}</h3>
          </div>
          <p>{{setting:general.site_tagline}}</p>
          <p style="font-size:0.84rem; color:#64748b;">
            📍 {{setting:site.address}}<br>
            📞 {{setting:site.phone}}<br>
            ✉️ {{setting:site.contact_email}}
          </p>
        </div>

        <div class="srw-footer-col">
          <h4>Solusi Mobilitas</h4>
          <ul class="srw-footer-links">
            <li class="srw-footer-link"><a href="#rental">Rental Kendaraan</a></li>
            <li class="srw-footer-link"><a href="#rental">Shuttle &amp; Travel</a></li>
            <li class="srw-footer-link"><a href="#modul">Fleet Management</a></li>
            <li class="srw-footer-link"><a href="#modul">Live GPS Tracking</a></li>
          </ul>
        </div>

        <div class="srw-footer-col">
          <h4>Ekosistem Modular</h4>
          <ul class="srw-footer-links">
            <li class="srw-footer-link"><a href="#modul">Supply Chain &amp; Gudang</a></li>
            <li class="srw-footer-link"><a href="#modul">POS &amp; Field Sales</a></li>
            <li class="srw-footer-link"><a href="#modul">Faktur &amp; Akuntansi</a></li>
            <li class="srw-footer-link"><a href="#modul">B2B Marketplace</a></li>
          </ul>
        </div>

        <div class="srw-footer-col">
          <h4>Legal &amp; Akses</h4>
          <ul class="srw-footer-links">
            <li class="srw-footer-link"><a href="/login">Masuk ke Akun</a></li>
            <li class="srw-footer-link"><a href="/workspaces">Portal Workspace</a></li>
            <li class="srw-footer-link"><a href="/terms">Syarat &amp; Ketentuan</a></li>
            <li class="srw-footer-link"><a href="/privacy">Kebijakan Privasi</a></li>
          </ul>
        </div>
      </div>

      <div class="srw-footer-bottom">
        <div>{{setting:site.copyright}}</div>
        <div style="display:flex; gap:16px;">
          <span>All-in-One Mobility &amp; Business Operating System</span>
        </div>
      </div>
    </div>
  </footer>

</div>
HTML;
    }
}
