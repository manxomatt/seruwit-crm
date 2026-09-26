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
            'title' => 'Seruwit Biz – Platform SaaS Rental Kendaraan & Ekosistem Bisnis Modular',
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
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

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

    --srw-teal-800: #115e59;
    --srw-teal-700: #0f766e;
    --srw-teal-600: #0d9488;
    --srw-teal-500: #14b8a6;
    --srw-teal-100: #ccfbf1;
    --srw-teal-50: #f0fdfa;

    --srw-cyan-700: #0e7490;
    --srw-cyan-600: #0891b2;
    --srw-cyan-500: #06b6d4;
    --srw-cyan-100: #cffafe;
    --srw-cyan-50: #ecfeff;

    --srw-emerald-600: #059669;
    --srw-emerald-500: #10b981;
    --srw-emerald-100: #d1fae5;
    --srw-emerald-50: #ecfdf5;

    --srw-amber-500: #f59e0b;
    --srw-rose-500: #f43f5e;

    --srw-shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02);
    --srw-shadow-md: 0 4px 14px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03);
    --srw-shadow-lg: 0 12px 30px -4px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04);
    --srw-shadow-xl: 0 20px 35px -5px rgba(15, 23, 42, 0.1), 0 8px 12px -6px rgba(15, 23, 42, 0.05);
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
    -webkit-font-smoothing: antialiased;
}

.srw-root *, .srw-root *::before, .srw-root *::after {
    box-sizing: border-box;
}

.srw-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
}

/* FLOATING CAPSULE HEADER */
.srw-nav-wrapper {
    position: fixed;
    top: 16px;
    left: 0;
    right: 0;
    z-index: 1000;
    padding: 0 20px;
    pointer-events: none;
    transition: all 0.3s ease;
}
.srw-navbar {
    pointer-events: auto;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: 9999px;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
    max-width: 1140px;
    margin: 0 auto;
    padding: 8px 14px 8px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.3s ease;
}
.srw-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    font-size: 1.18rem;
    font-weight: 800;
    color: var(--srw-slate-900);
    letter-spacing: -0.02em;
    flex-shrink: 0;
}
.srw-brand-img {
    height: 32px;
    max-height: 36px;
    width: auto;
    max-width: 130px;
    object-fit: contain;
    border-radius: 6px;
}
.srw-brand-badge {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--srw-teal-600), var(--srw-cyan-600));
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    box-shadow: 0 3px 10px rgba(13, 148, 136, 0.3);
}
.srw-brand-tag {
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    background: var(--srw-teal-50);
    color: var(--srw-teal-700);
    padding: 3px 8px;
    border-radius: 9999px;
    border: 1px solid var(--srw-teal-100);
    letter-spacing: 0.04em;
}
.srw-nav-links {
    display: flex;
    align-items: center;
    gap: 24px;
    list-style: none;
    margin: 0;
    padding: 0;
}
.srw-nav-link {
    text-decoration: none;
    color: var(--srw-slate-600);
    font-size: 0.88rem;
    font-weight: 600;
    transition: all 0.2s ease;
    padding: 6px 12px;
    border-radius: 9999px;
}
.srw-nav-link:hover {
    color: var(--srw-teal-700);
    background: var(--srw-slate-100);
}
.srw-nav-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}
.srw-btn-login {
    text-decoration: none;
    color: var(--srw-slate-700);
    font-size: 0.86rem;
    font-weight: 700;
    padding: 8px 16px;
    border-radius: 9999px;
    transition: all 0.2s ease;
}
.srw-btn-login:hover {
    color: var(--srw-teal-700);
    background: var(--srw-slate-100);
}
.srw-btn-capsule {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    background: linear-gradient(135deg, var(--srw-teal-700) 0%, var(--srw-teal-600) 100%);
    color: #ffffff;
    font-size: 0.84rem;
    font-weight: 700;
    padding: 8px 18px;
    border-radius: 9999px;
    box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
}
.srw-btn-capsule:hover {
    background: linear-gradient(135deg, var(--srw-teal-800) 0%, var(--srw-teal-700) 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(15, 118, 110, 0.35);
}
.srw-menu-btn {
    display: none;
    background: transparent;
    border: none;
    color: var(--srw-slate-700);
    cursor: pointer;
    padding: 6px;
}

/* HERO SECTION */
.srw-hero {
    position: relative;
    padding: 130px 0 80px 0;
    background: radial-gradient(at 0% 0%, rgba(13, 148, 136, 0.12) 0px, transparent 50%),
                radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.12) 0px, transparent 50%),
                radial-gradient(at 50% 50%, rgba(248, 250, 252, 0.8) 0px, transparent 100%);
    overflow: hidden;
    text-align: center;
}
.srw-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid var(--srw-teal-100);
    padding: 6px 16px;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--srw-teal-800);
    box-shadow: var(--srw-shadow-sm);
    margin-bottom: 24px;
}
.srw-pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    background: var(--srw-teal-500);
    box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.7);
    animation: srwPulse 2s infinite;
}
@keyframes srwPulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(20, 184, 166, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
}
.srw-hero-title {
    font-size: clamp(2.2rem, 5vw, 3.6rem);
    font-weight: 800;
    color: var(--srw-slate-900);
    line-height: 1.15;
    letter-spacing: -0.03em;
    max-width: 900px;
    margin: 0 auto 20px auto;
}
.srw-grad-text {
    background: linear-gradient(135deg, var(--srw-teal-700) 0%, var(--srw-cyan-600) 50%, var(--srw-emerald-600) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.srw-hero-desc {
    font-size: clamp(1rem, 2vw, 1.15rem);
    color: var(--srw-slate-600);
    max-width: 680px;
    margin: 0 auto 36px auto;
    line-height: 1.7;
}
.srw-hero-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 50px;
}
.srw-hero-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, var(--srw-teal-700) 0%, var(--srw-cyan-700) 100%);
    color: #ffffff;
    font-size: 0.96rem;
    font-weight: 800;
    padding: 14px 30px;
    border-radius: 9999px;
    text-decoration: none;
    box-shadow: 0 8px 24px rgba(15, 118, 110, 0.3);
    transition: all 0.25s ease;
}
.srw-hero-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(15, 118, 110, 0.4);
}
.srw-hero-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid var(--srw-slate-200);
    color: var(--srw-slate-700);
    font-size: 0.96rem;
    font-weight: 700;
    padding: 14px 28px;
    border-radius: 9999px;
    text-decoration: none;
    box-shadow: var(--srw-shadow-sm);
    transition: all 0.25s ease;
}
.srw-hero-btn-secondary:hover {
    background: #ffffff;
    border-color: var(--srw-teal-500);
    color: var(--srw-teal-800);
    transform: translateY(-2px);
}

/* HERO SAAS DASHBOARD MOCKUP */
.srw-dashboard-mockup {
    max-width: 1040px;
    margin: 0 auto;
    background: linear-gradient(to bottom, rgba(20, 184, 166, 0.2), rgba(6, 182, 212, 0.08), transparent);
    padding: 12px;
    border-radius: 28px;
    box-shadow: var(--srw-shadow-xl);
    text-align: left;
}
.srw-mockup-inner {
    background: #ffffff;
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: 20px;
    padding: 20px 24px;
    box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.9);
}
.srw-mockup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--srw-slate-100);
    padding-bottom: 14px;
    margin-bottom: 20px;
}
.srw-mockup-dots {
    display: flex;
    align-items: center;
    gap: 6px;
}
.srw-dot {
    width: 10px;
    height: 10px;
    border-radius: 9999px;
}
.srw-dot-red { background: #fb7185; }
.srw-dot-yellow { background: #fbbf24; }
.srw-dot-green { background: #34d399; }
.srw-mockup-url {
    font-family: monospace;
    font-size: 0.76rem;
    color: var(--srw-slate-400);
    margin-left: 10px;
}
.srw-mockup-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--srw-emerald-50);
    border: 1px solid var(--srw-emerald-100);
    color: var(--srw-emerald-600);
    font-size: 0.72rem;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 9999px;
}
.srw-mockup-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}
.srw-mockup-card {
    background: var(--srw-slate-50);
    border: 1px solid var(--srw-slate-100);
    border-radius: 14px;
    padding: 16px;
}
.srw-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}
.srw-card-header span:first-child {
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--srw-slate-500);
}
.srw-card-val {
    display: flex;
    align-items: baseline;
    gap: 8px;
}
.srw-card-val strong {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--srw-slate-900);
}
.srw-card-val span {
    font-size: 0.76rem;
    font-weight: 700;
}
.srw-card-prog {
    margin-top: 12px;
    background: var(--srw-slate-200);
    height: 8px;
    border-radius: 9999px;
    display: flex;
    overflow: hidden;
}
.srw-prog-green { background: var(--srw-emerald-500); width: 85%; }
.srw-prog-yellow { background: var(--srw-amber-500); width: 10%; }
.srw-prog-gray { background: var(--srw-slate-400); width: 5%; }
.srw-card-subinfo {
    display: flex;
    justify-content: space-between;
    font-size: 0.72rem;
    color: var(--srw-slate-500);
    margin-top: 8px;
}
.srw-order-item {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #ffffff;
    border: 1px solid var(--srw-slate-100);
    border-radius: 8px;
    padding: 8px 10px;
    margin-top: 12px;
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--srw-slate-700);
}

/* TRUST METRICS BAR */
.srw-trust {
    background: #ffffff;
    border-top: 1px solid var(--srw-slate-200);
    border-bottom: 1px solid var(--srw-slate-200);
    padding: 40px 0;
}
.srw-trust-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    text-align: center;
}
.srw-trust-item strong {
    display: block;
    font-size: 2.2rem;
    font-weight: 800;
    color: var(--srw-slate-900);
    letter-spacing: -0.02em;
}
.srw-trust-item p {
    margin: 4px 0 0 0;
    font-size: 0.76rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--srw-slate-500);
}

/* 3 CORE PILLARS SECTION */
.srw-pillars {
    padding: 90px 0;
    background: var(--srw-slate-50);
}
.srw-section-badge {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--srw-teal-700);
    background: var(--srw-teal-50);
    border: 1px solid var(--srw-teal-100);
    padding: 4px 14px;
    border-radius: 9999px;
    margin-bottom: 12px;
}
.srw-section-header {
    text-align: center;
    max-width: 680px;
    margin: 0 auto 56px auto;
}
.srw-section-title {
    font-size: clamp(1.8rem, 3.5vw, 2.5rem);
    font-weight: 800;
    color: var(--srw-slate-900);
    letter-spacing: -0.02em;
    margin: 0 0 12px 0;
    line-height: 1.25;
}
.srw-section-desc {
    font-size: 0.98rem;
    color: var(--srw-slate-600);
    margin: 0;
    line-height: 1.6;
}
.srw-pillars-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
}
.srw-pillar-card {
    background: #ffffff;
    border: 1px solid var(--srw-slate-200);
    border-radius: 24px;
    padding: 34px 28px;
    box-shadow: var(--srw-shadow-sm);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.srw-pillar-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--srw-shadow-xl);
    border-color: var(--srw-teal-500);
}
.srw-pillar-featured {
    border-color: rgba(13, 148, 136, 0.4);
    box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.15), var(--srw-shadow-md);
}
.srw-pillar-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 22px;
}
.srw-icon-teal {
    background: var(--srw-teal-50);
    color: var(--srw-teal-700);
    border: 1px solid var(--srw-teal-100);
}
.srw-icon-cyan {
    background: var(--srw-cyan-50);
    color: var(--srw-cyan-700);
    border: 1px solid var(--srw-cyan-100);
}
.srw-icon-emerald {
    background: var(--srw-emerald-50);
    color: var(--srw-emerald-600);
    border: 1px solid var(--srw-emerald-100);
}
.srw-pillar-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--srw-slate-900);
    margin: 0 0 10px 0;
}
.srw-pillar-desc {
    font-size: 0.88rem;
    color: var(--srw-slate-600);
    line-height: 1.6;
    margin: 0 0 22px 0;
}
.srw-pillar-list {
    list-style: none;
    margin: 0;
    padding: 20px 0 0 0;
    border-top: 1px solid var(--srw-slate-100);
    display: grid;
    gap: 12px;
}
.srw-pillar-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.84rem;
    font-weight: 600;
    color: var(--srw-slate-700);
}
.srw-pillar-item .material-symbols-outlined {
    font-size: 18px;
}
.srw-pillar-footer {
    margin-top: 28px;
    padding-top: 20px;
    border-top: 1px solid var(--srw-slate-100);
}
.srw-pillar-link {
    font-size: 0.84rem;
    font-weight: 800;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
}

/* MODULAR ECOSYSTEM SECTION */
.srw-modular {
    padding: 80px 0;
    background: #ffffff;
    border-top: 1px solid var(--srw-slate-200);
}
.srw-modular-box {
    background: linear-gradient(135deg, var(--srw-slate-900) 0%, var(--srw-slate-800) 60%, #042f2e 100%);
    border-radius: 28px;
    padding: 50px 48px;
    color: #ffffff;
    position: relative;
    overflow: hidden;
}
.srw-modular-content {
    max-width: 640px;
    position: relative;
    z-index: 2;
}
.srw-modular-badge {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--srw-teal-500);
    background: rgba(15, 118, 110, 0.25);
    border: 1px solid rgba(20, 184, 166, 0.3);
    padding: 4px 12px;
    border-radius: 9999px;
    margin-bottom: 14px;
}
.srw-modular-title {
    font-size: clamp(1.8rem, 3.5vw, 2.4rem);
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 14px 0;
    line-height: 1.25;
}
.srw-modular-desc {
    font-size: 0.95rem;
    color: var(--srw-slate-300);
    line-height: 1.7;
    margin: 0 0 32px 0;
}
.srw-modular-tags {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
}
.srw-tag-card {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    padding: 14px;
    backdrop-filter: blur(8px);
}
.srw-tag-card .material-symbols-outlined {
    font-size: 20px;
    color: var(--srw-teal-500);
    margin-bottom: 6px;
}
.srw-tag-card strong {
    display: block;
    font-size: 0.84rem;
    color: #ffffff;
}
.srw-tag-card span {
    display: block;
    font-size: 0.72rem;
    color: var(--srw-slate-400);
    margin-top: 2px;
}

/* PRICING & FAQ SECTION */
.srw-pricing {
    padding: 90px 0;
    background: var(--srw-slate-50);
}
.srw-faq {
    padding: 80px 0;
    background: #ffffff;
    border-top: 1px solid var(--srw-slate-200);
}
.srw-faq-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    max-width: 960px;
    margin: 0 auto;
}
.srw-faq-card {
    background: var(--srw-slate-50);
    border: 1px solid var(--srw-slate-200);
    border-radius: 16px;
    padding: 22px 24px;
}
.srw-faq-q {
    font-size: 0.96rem;
    font-weight: 800;
    color: var(--srw-slate-900);
    margin: 0 0 8px 0;
}
.srw-faq-a {
    font-size: 0.86rem;
    color: var(--srw-slate-600);
    line-height: 1.6;
    margin: 0;
}

/* HIGH-CONVERSION CAPSULE CTA */
.srw-cta-wrap {
    padding: 80px 0;
    background: var(--srw-slate-50);
}
.srw-cta-capsule {
    background: linear-gradient(135deg, var(--srw-teal-800) 0%, var(--srw-teal-700) 50%, var(--srw-cyan-700) 100%);
    border-radius: 40px;
    padding: 60px 40px;
    text-align: center;
    color: #ffffff;
    box-shadow: 0 20px 40px -10px rgba(15, 118, 110, 0.4);
    max-width: 1040px;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
}
.srw-cta-title {
    font-size: clamp(1.8rem, 3.5vw, 2.6rem);
    font-weight: 800;
    margin: 0 0 14px 0;
    letter-spacing: -0.02em;
}
.srw-cta-desc {
    font-size: 1rem;
    color: var(--srw-teal-100);
    max-width: 580px;
    margin: 0 auto 32px auto;
    line-height: 1.6;
}
.srw-cta-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    flex-wrap: wrap;
}
.srw-btn-white-pill {
    background: #ffffff;
    color: var(--srw-teal-800);
    font-size: 0.92rem;
    font-weight: 800;
    padding: 14px 32px;
    border-radius: 9999px;
    text-decoration: none;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    transition: all 0.2s ease;
}
.srw-btn-white-pill:hover {
    background: var(--srw-slate-50);
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
}
.srw-btn-glass-pill {
    background: rgba(17, 94, 89, 0.4);
    border: 1px solid rgba(204, 251, 241, 0.5);
    color: #ffffff;
    font-size: 0.92rem;
    font-weight: 700;
    padding: 14px 28px;
    border-radius: 9999px;
    text-decoration: none;
    transition: all 0.2s ease;
}
.srw-btn-glass-pill:hover {
    background: rgba(17, 94, 89, 0.7);
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
    gap: 36px;
    margin-bottom: 48px;
}
.srw-footer-brand h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.25rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 12px 0;
}
.srw-footer-brand p {
    font-size: 0.86rem;
    line-height: 1.7;
    margin: 0;
    max-width: 320px;
}
.srw-footer-col h5 {
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #ffffff;
    margin: 0 0 16px 0;
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
    font-size: 0.84rem;
    transition: color 0.15s ease;
}
.srw-footer-link a:hover {
    color: #ffffff;
}
.srw-footer-bottom {
    border-top: 1px solid var(--srw-slate-800);
    padding-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
}

/* RESPONSIVE STYLES */
@media (max-width: 992px) {
    .srw-nav-links, .srw-btn-login {
        display: none;
    }
    .srw-menu-btn {
        display: block;
    }
    .srw-mockup-grid, .srw-pillars-grid {
        grid-template-columns: 1fr;
    }
    .srw-trust-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .srw-modular-tags {
        grid-template-columns: 1fr;
    }
    .srw-faq-grid {
        grid-template-columns: 1fr;
    }
    .srw-footer-grid {
        grid-template-columns: 1fr 1fr;
    }
}
@media (max-width: 640px) {
    .srw-trust-grid, .srw-footer-grid {
        grid-template-columns: 1fr;
    }
    .srw-footer-bottom {
        flex-direction: column;
        gap: 12px;
        text-align: center;
    }
}
CSS;
    }

    public static function html(): string
    {
        return <<<'HTML'
<div class="srw-root">

  <!-- FLOATING CAPSULE HEADER -->
  <div class="srw-nav-wrapper">
    <header class="srw-navbar">
      <a href="/" class="srw-brand">
        <img src="{{setting:site.logo}}" alt="{{setting:general.site_name}}" class="srw-brand-img" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
        <div class="srw-brand-badge" style="display:none;">
          <span class="material-symbols-outlined" style="font-size: 20px;">directions_car</span>
        </div>
        <span>{{setting:general.site_name}}</span>
        <span class="srw-brand-tag">SaaS Rental</span>
      </a>

      <nav class="srw-nav-links">
        <a href="#armada" class="srw-nav-link">Fleet Management</a>
        <a href="#operasional" class="srw-nav-link">Rental Operations</a>
        <a href="#keuangan" class="srw-nav-link">Finance &amp; ROI</a>
        <a href="#modular" class="srw-nav-link">Modular Suite</a>
        <a href="#harga" class="srw-nav-link">Harga</a>
        <a href="#faq" class="srw-nav-link">FAQ</a>
      </nav>

      <div class="srw-nav-actions">
        <a href="/login" class="srw-btn-login">Masuk</a>
        <a href="/register" class="srw-btn-capsule">
          <span>Mulai Gratis</span>
          <span class="material-symbols-outlined" style="font-size: 16px;">arrow_forward</span>
        </a>
        <button type="button" class="srw-menu-btn" onclick="const m = document.getElementById('srw-mobile-drawer'); if(m) m.style.display = m.style.display === 'block' ? 'none' : 'block';" aria-label="Menu">
          <span class="material-symbols-outlined" style="font-size: 24px;">menu</span>
        </button>
      </div>
    </header>

    <!-- Mobile Drawer -->
    <div id="srw-mobile-drawer" style="display: none; background: #ffffff; border: 1px solid var(--srw-slate-200); border-radius: 20px; padding: 16px; margin-top: 10px; max-width: 1140px; margin-left: auto; margin-right: auto; box-shadow: var(--srw-shadow-lg); pointer-events: auto;">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <a href="#armada" class="srw-nav-link" onclick="document.getElementById('srw-mobile-drawer').style.display='none';">Fleet Management</a>
        <a href="#operasional" class="srw-nav-link" onclick="document.getElementById('srw-mobile-drawer').style.display='none';">Rental Operations</a>
        <a href="#keuangan" class="srw-nav-link" onclick="document.getElementById('srw-mobile-drawer').style.display='none';">Finance &amp; ROI</a>
        <a href="#modular" class="srw-nav-link" onclick="document.getElementById('srw-mobile-drawer').style.display='none';">Modular Suite</a>
        <a href="#harga" class="srw-nav-link" onclick="document.getElementById('srw-mobile-drawer').style.display='none';">Harga</a>
        <a href="#faq" class="srw-nav-link" onclick="document.getElementById('srw-mobile-drawer').style.display='none';">FAQ</a>
        <div style="border-top: 1px solid var(--srw-slate-100); padding-top: 10px; margin-top: 4px; display: flex; gap: 10px;">
          <a href="/login" class="srw-btn-login" style="display: inline-block; text-align: center; flex: 1;">Masuk</a>
          <a href="/register" class="srw-btn-capsule" style="display: inline-flex; justify-content: center; flex: 1;">Daftar Akun</a>
        </div>
      </div>
    </div>
  </div>

  <!-- HERO SECTION -->
  <section class="srw-hero">
    <div class="srw-container">
      <div class="srw-hero-badge">
        <span class="srw-pulse-dot"></span>
        <span>Platform All-in-One Manajemen Rental Modern</span>
      </div>

      <h1 class="srw-hero-title">
        Kendalikan Armada, Bisnis Rental &amp; Keuangan dalam <span class="srw-grad-text">Satu Platform Cerdas</span>
      </h1>

      <p class="srw-hero-desc">
        Solusi SaaS komprehensif bagi pemilik rental kendaraan. Otomatisasi ketersediaan armada, pencatatan sewa digital, perawatan berkala, dan pembukuan laba-rugi otomatis tanpa kerumitan spreadsheet.
      </p>

      <div class="srw-hero-actions">
        <a href="/register" class="srw-hero-btn-primary">
          <span>Coba Gratis 14 Hari</span>
          <span class="material-symbols-outlined" style="font-size: 18px;">rocket_launch</span>
        </a>
        <a href="#fitur" class="srw-hero-btn-secondary">
          <span class="material-symbols-outlined" style="font-size: 18px; color: var(--srw-teal-600);">play_circle</span>
          <span>Lihat Demo Fitur</span>
        </a>
      </div>

      <!-- SAAS DASHBOARD MOCKUP -->
      <div class="srw-dashboard-mockup">
        <div class="srw-mockup-inner">
          <div class="srw-mockup-header">
            <div class="srw-mockup-dots">
              <span class="srw-dot srw-dot-red"></span>
              <span class="srw-dot srw-dot-yellow"></span>
              <span class="srw-dot srw-dot-green"></span>
              <span class="srw-mockup-url">app.seruwit.com/fleet-overview</span>
            </div>
            <span class="srw-mockup-badge">
              <span class="srw-pulse-dot" style="width: 6px; height: 6px;"></span> Live Fleet Monitor
            </span>
          </div>

          <div class="srw-mockup-grid">
            <!-- Widget 1: Fleet -->
            <div class="srw-mockup-card">
              <div class="srw-card-header">
                <span>Status Armada</span>
                <span class="material-symbols-outlined" style="color: var(--srw-teal-600); font-size: 20px;">directions_car</span>
              </div>
              <div class="srw-card-val">
                <strong>42</strong>
                <span style="color: var(--srw-emerald-600);">36 Unit Aktif Disewa</span>
              </div>
              <div class="srw-card-prog">
                <div class="srw-prog-green"></div>
                <div class="srw-prog-yellow"></div>
                <div class="srw-prog-gray"></div>
              </div>
              <div class="srw-card-subinfo">
                <span>85% Tersewa</span>
                <span>Servis: 2 Unit</span>
              </div>
            </div>

            <!-- Widget 2: Booking Calendar -->
            <div class="srw-mockup-card">
              <div class="srw-card-header">
                <span>Reservasi Hari Ini</span>
                <span class="material-symbols-outlined" style="color: var(--srw-cyan-600); font-size: 20px;">event_available</span>
              </div>
              <div class="srw-card-val">
                <strong>18 Order</strong>
                <span style="color: var(--srw-cyan-600);">+4 Siap Handover</span>
              </div>
              <div class="srw-order-item">
                <span class="material-symbols-outlined" style="color: var(--srw-emerald-600); font-size: 18px;">verified</span>
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Innova Zenix - B 1294 ABC (Check-in OK)</span>
              </div>
            </div>

            <!-- Widget 3: Cashflow -->
            <div class="srw-mockup-card">
              <div class="srw-card-header">
                <span>Omset Bulan Ini</span>
                <span class="material-symbols-outlined" style="color: var(--srw-emerald-600); font-size: 20px;">payments</span>
              </div>
              <div class="srw-card-val">
                <strong>Rp 128.5 Jt</strong>
                <span style="color: var(--srw-emerald-600);">↑ 18.4%</span>
              </div>
              <div class="srw-card-subinfo" style="border-top: 1px solid var(--srw-slate-200); padding-top: 6px; margin-top: 10px;">
                <span>Split Investor: Rp 38 Jt</span>
                <strong style="color: var(--srw-slate-700);">Net: Rp 90.5 Jt</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- TRUST & METRICS BAR -->
  <section class="srw-trust">
    <div class="srw-container">
      <div class="srw-trust-grid">
        <div class="srw-trust-item">
          <strong>99.9%</strong>
          <p>Akurasi Jadwal Armada</p>
        </div>
        <div class="srw-trust-item">
          <strong style="color: var(--srw-teal-700);">3x Lipat</strong>
          <p>Kecepatan Handover Unit</p>
        </div>
        <div class="srw-trust-item">
          <strong style="color: var(--srw-cyan-700);">100%</strong>
          <p>Transparansi Finansial</p>
        </div>
        <div class="srw-trust-item">
          <strong>Modular</strong>
          <p>Skalabel Tanpa Batas</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 3 CORE PILLARS SECTION -->
  <section class="srw-pillars" id="fitur">
    <div class="srw-container">
      <div class="srw-section-header">
        <span class="srw-section-badge">3 Pilar Solusi Utama</span>
        <h2 class="srw-section-title">Dibuat Khusus untuk Kebutuhan Nyata Pemilik Rental</h2>
        <p class="srw-section-desc">Mulai dari ketersediaan fisik mobil hingga pembagian hasil investor, semua terkendali rapi dalam satu platform terpadu.</p>
      </div>

      <div class="srw-pillars-grid">
        <!-- Pilar 1: Fleet Management -->
        <div class="srw-pillar-card" id="armada">
          <div>
            <div class="srw-pillar-icon srw-icon-teal">
              <span class="material-symbols-outlined" style="font-size: 26px;">directions_car</span>
            </div>
            <h3 class="srw-pillar-title">Fleet Management</h3>
            <p class="srw-pillar-desc">
              Pantau kondisi dan utilisasi seluruh armada secara real-time. Cegah kerugian akibat kerusakan tersembunyi dan unit yang tidak produktif.
            </p>
            <ul class="srw-pillar-list">
              <li class="srw-pillar-item">
                <span class="material-symbols-outlined" style="color: var(--srw-teal-600);">check_circle</span>
                <span>Monitoring status ketersediaan armada live</span>
              </li>
              <li class="srw-pillar-item">
                <span class="material-symbols-outlined" style="color: var(--srw-teal-600);">check_circle</span>
                <span>Jadwal servis preventif &amp; pengingat STNK/Pajak</span>
              </li>
              <li class="srw-pillar-item">
                <span class="material-symbols-outlined" style="color: var(--srw-teal-600);">check_circle</span>
                <span>Inspeksi fisik digital &amp; foto kondisi unit</span>
              </li>
              <li class="srw-pillar-item">
                <span class="material-symbols-outlined" style="color: var(--srw-teal-600);">check_circle</span>
                <span>Riwayat pemeliharaan &amp; biaya per kendaraan</span>
              </li>
            </ul>
          </div>
          <div class="srw-pillar-footer">
            <a href="/register" class="srw-pillar-link" style="color: var(--srw-teal-700);">Eksplorasi Fitur Armada →</a>
          </div>
        </div>

        <!-- Pilar 2: Rental Operations -->
        <div class="srw-pillar-card srw-pillar-featured" id="operasional">
          <div>
            <div class="srw-pillar-icon srw-icon-cyan">
              <span class="material-symbols-outlined" style="font-size: 26px;">calendar_month</span>
            </div>
            <h3 class="srw-pillar-title">Rental Operations</h3>
            <p class="srw-pillar-desc">
              Kelola alur pemesanan tanpa risiko bentrok jadwal. Dari booking pelanggan hingga serah terima unit secara digital tanpa repot berkas kertas.
            </p>
            <ul class="srw-pillar-list">
              <li class="srw-pillar-item">
                <span class="material-symbols-outlined" style="color: var(--srw-cyan-600);">check_circle</span>
                <span>Kalender booking visual anti double-booking</span>
              </li>
              <li class="srw-pillar-item">
                <span class="material-symbols-outlined" style="color: var(--srw-cyan-600);">check_circle</span>
                <span>Surat perjanjian sewa digital &amp; e-signature</span>
              </li>
              <li class="srw-pillar-item">
                <span class="material-symbols-outlined" style="color: var(--srw-cyan-600);">check_circle</span>
                <span>Verifikasi identitas penyewa &amp; jaminan deposit</span>
              </li>
              <li class="srw-pillar-item">
                <span class="material-symbols-outlined" style="color: var(--srw-cyan-600);">check_circle</span>
                <span>Multi-cabang &amp; opsi antar-jemput bandara/hotel</span>
              </li>
            </ul>
          </div>
          <div class="srw-pillar-footer">
            <a href="/register" class="srw-pillar-link" style="color: var(--srw-cyan-700);">Eksplorasi Operasional →</a>
          </div>
        </div>

        <!-- Pilar 3: Finance Management -->
        <div class="srw-pillar-card" id="keuangan">
          <div>
            <div class="srw-pillar-icon srw-icon-emerald">
              <span class="material-symbols-outlined" style="font-size: 26px;">account_balance_wallet</span>
            </div>
            <h3 class="srw-pillar-title">Finance &amp; ROI</h3>
            <p class="srw-pillar-desc">
              Otomatisasi pembukuan dan analisis laba-rugi setiap armada. Transparan bagi pengelola dan pemilik unit titipan (investor mitra).
            </p>
            <ul class="srw-pillar-list">
              <li class="srw-pillar-item">
                <span class="material-symbols-outlined" style="color: var(--srw-emerald-600);">check_circle</span>
                <span>Invoice digital instan ber-QR &amp; status bayar</span>
              </li>
              <li class="srw-pillar-item">
                <span class="material-symbols-outlined" style="color: var(--srw-emerald-600);">check_circle</span>
                <span>Otomatisasi split revenue mitra / investor titip unit</span>
              </li>
              <li class="srw-pillar-item">
                <span class="material-symbols-outlined" style="color: var(--srw-emerald-600);">check_circle</span>
                <span>Laporan profit &amp; margin bersih per mobil</span>
              </li>
              <li class="srw-pillar-item">
                <span class="material-symbols-outlined" style="color: var(--srw-emerald-600);">check_circle</span>
                <span>Pencatatan arus kas operasional harian terpadu</span>
              </li>
            </ul>
          </div>
          <div class="srw-pillar-footer">
            <a href="/register" class="srw-pillar-link" style="color: var(--srw-emerald-600);">Eksplorasi Keuangan →</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- MODULAR ECOSYSTEM SECTION -->
  <section class="srw-modular" id="modular">
    <div class="srw-container">
      <div class="srw-modular-box">
        <div class="srw-modular-content">
          <span class="srw-modular-badge">Arsitektur Modular Seruwit</span>
          <h2 class="srw-modular-title">Platform yang Tumbuh Bersama Skala Bisnis Anda</h2>
          <p class="srw-modular-desc">
            Tidak ada fitur berlebih yang memperlambat sistem Anda. Aktifkan modul tambahan sesuai kebutuhan operasional armada dan cabang Anda sewaktu-waktu tanpa perlu migrasi database.
          </p>

          <div class="srw-modular-tags">
            <div class="srw-tag-card">
              <span class="material-symbols-outlined">web</span>
              <strong>Storefront &amp; Pages</strong>
              <span>Katalog publik &amp; visual CMS</span>
            </div>
            <div class="srw-tag-card">
              <span class="material-symbols-outlined">chat</span>
              <strong>WhatsApp Reminder</strong>
              <span>Pengingat jatuh tempo otomatis</span>
            </div>
            <div class="srw-tag-card">
              <span class="material-symbols-outlined">domain</span>
              <strong>Multi-Tenant Cabang</strong>
              <span>Skalabilitas multi-lokasi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PRICING SECTION -->
  <section class="srw-pricing" id="harga">
    <div class="srw-container">
      <div class="srw-section-header">
        <span class="srw-section-badge">Paket Investasi Bisnis</span>
        <h2 class="srw-section-title">Pilihan Paket Fleksibel Sesuai Jumlah Armada</h2>
        <p class="srw-section-desc">Mulai gratis 14 hari. Tanpa komitmen kartu kredit. Upgrade kapan saja saat armada bertambah.</p>
      </div>

      {{pricing_table}}
    </div>
  </section>

  <!-- FAQ SECTION -->
  <section class="srw-faq" id="faq">
    <div class="srw-container">
      <div class="srw-section-header">
        <span class="srw-section-badge">Tanya Jawab</span>
        <h2 class="srw-section-title">Pertanyaan yang Sering Diajukan</h2>
        <p class="srw-section-desc">Semua yang perlu Anda ketahui sebelum menggunakan platform Seruwit SaaS.</p>
      </div>

      <div class="srw-faq-grid">
        <div class="srw-faq-card">
          <h3 class="srw-faq-q">Apakah aplikasi ini cocok untuk rental mobil dan motor?</h3>
          <p class="srw-faq-a">Ya. Seruwit dirancang fleksibel untuk segala jenis rental kendaraan, baik mobil keluarga, mobil premium, bus/shuttle, hingga motor harian.</p>
        </div>
        <div class="srw-faq-card">
          <h3 class="srw-faq-q">Bagaimana jika saya memiliki armada milik investor (titip sewa)?</h3>
          <p class="srw-faq-a">Sistem menyediakan fitur split revenue otomatis. Anda dapat menentukan persentase bagi hasil dan menghasilkan laporan bulanan transparan bagi mitra dalam satu klik.</p>
        </div>
        <div class="srw-faq-card">
          <h3 class="srw-faq-q">Apakah saya bisa memindahkan data dari Excel?</h3>
          <p class="srw-faq-a">Tentu saja. Tersedia fitur impor data kendaraan dan pelanggan via file spreadsheet sehingga Anda tidak perlu input satu per satu.</p>
        </div>
        <div class="srw-faq-card">
          <h3 class="srw-faq-q">Apakah halaman website publik bisa diedit sendiri?</h3>
          <p class="srw-faq-a">Bisa! Seruwit dilengkapi modul visual Page Builder (GrapesJS) yang memungkinkan Anda mengubah teks, gambar, promo, dan tampilan katalog tanpa koding.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CAPSULE CTA SECTION -->
  <section class="srw-cta-wrap" id="daftar">
    <div class="srw-container">
      <div class="srw-cta-capsule">
        <h2 class="srw-cta-title">Siap Memodernisasi Bisnis Rental Anda?</h2>
        <p class="srw-cta-desc">
          Tingkatkan efisiensi armada dan pantau laba operasional secara akurat hari ini. Mulai uji coba gratis 14 hari penuh.
        </p>
        <div class="srw-cta-actions">
          <a href="/register" class="srw-btn-white-pill">
            Mulai Uji Coba Gratis 14 Hari
          </a>
          <a href="/login" class="srw-btn-glass-pill">
            Masuk ke Portal Akun
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="srw-footer">
    <div class="srw-container">
      <div class="srw-footer-grid">
        <div class="srw-footer-brand">
          <h4>
            <span class="material-symbols-outlined" style="font-size: 20px; color: var(--srw-teal-500);">directions_car</span>
            <span>{{setting:general.site_name}}</span>
          </h4>
          <p>
            Platform SaaS all-in-one untuk efisiensi armada, otomatisasi operasional sewa, dan akuntansi bisnis rental terpadu.
          </p>
        </div>

        <div class="srw-footer-col">
          <h5>Fitur Utama</h5>
          <ul class="srw-footer-links">
            <li class="srw-footer-link"><a href="#armada">Fleet Management</a></li>
            <li class="srw-footer-link"><a href="#operasional">Rental Operations</a></li>
            <li class="srw-footer-link"><a href="#keuangan">Finance &amp; ROI</a></li>
          </ul>
        </div>

        <div class="srw-footer-col">
          <h5>Ekosistem</h5>
          <ul class="srw-footer-links">
            <li class="srw-footer-link"><a href="#modular">Modul Storefront</a></li>
            <li class="srw-footer-link"><a href="#modular">Modul GrapesJS Pages</a></li>
            <li class="srw-footer-link"><a href="#modular">Multi-Cabang Tenant</a></li>
          </ul>
        </div>

        <div class="srw-footer-col">
          <h5>Akses</h5>
          <ul class="srw-footer-links">
            <li class="srw-footer-link"><a href="/login">Masuk Akun</a></li>
            <li class="srw-footer-link"><a href="/register">Registrasi Baru</a></li>
            <li class="srw-footer-link"><a href="#faq">Pusat Bantuan</a></li>
          </ul>
        </div>
      </div>

      <div class="srw-footer-bottom">
        <div>{{setting:site.copyright}}</div>
        <div>Platform Manajemen Rental Kendaraan Modern</div>
      </div>
    </div>
  </footer>

</div>
HTML;
    }
}
