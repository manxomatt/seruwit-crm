<?php

namespace Modules\Pages\Support;

class RentalManagementLandingTemplate
{
    /**
     * Build the data array for the Vehicle Rental Management Landing Page template.
     *
     * @return array{title: string, slug: string, html: string, css: string, gjs_data: null}
     */
    public static function build(): array
    {
        $css = self::css();
        $html = self::html();

        return [
            'title' => 'Seruwit Rental – Platform Sistem Manajemen Rental Kendaraan Enterprise',
            'slug' => 'sistem-manajemen-rental',
            'html' => '<style>'.$css.'</style>'."\n".$html,
            'css' => $css,
            'gjs_data' => null,
        ];
    }

    public static function css(): string
    {
        return <<<'CSS'
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

.srw-rental-root {
    --srw-bg-base: #f8fafc;
    --srw-bg-white: #ffffff;
    --srw-bg-mint: #f0fdf4;
    --srw-bg-emerald-light: #ecfdf5;
    --srw-bg-cyan-light: #ecfeff;
    
    --srw-emerald: #10b981;
    --srw-emerald-dark: #047857;
    --srw-cyan: #06b6d4;
    --srw-teal: #0d9488;
    --srw-orange: #f97316;
    
    --srw-grad-primary: linear-gradient(135deg, #10b981 0%, #0284c7 100%);
    --srw-grad-accent: linear-gradient(135deg, #059669 0%, #06b6d4 100%);
    --srw-grad-text: linear-gradient(135deg, #047857 0%, #0284c7 50%, #0d9488 100%);
    --srw-grad-hero: radial-gradient(circle at 50% -10%, rgba(16, 185, 129, 0.12) 0%, transparent 65%),
                     radial-gradient(circle at 90% 40%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
                     radial-gradient(circle at 10% 70%, rgba(249, 115, 22, 0.06) 0%, transparent 50%);
                     
    --srw-text-dark: #0f172a;
    --srw-text-main: #334155;
    --srw-text-muted: #64748b;
    --srw-border: #e2e8f0;
    --srw-border-soft: rgba(226, 232, 240, 0.8);

    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--srw-text-main);
    background-color: var(--srw-bg-base);
    line-height: 1.6;
    width: 100%;
    overflow-x: hidden;
}

.srw-rental-root *, 
.srw-rental-root *::before, 
.srw-rental-root *::after {
    box-sizing: border-box;
}

.srw-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
}

/* NAVBAR */
.srw-navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--srw-border);
    width: 100%;
}
.srw-nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 76px;
}
.srw-brand {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--srw-text-dark) !important;
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
}
.srw-brand-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--srw-grad-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 1.2rem;
    box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35);
}
.srw-brand-badge {
    background: #d1fae5;
    color: #047857;
    font-size: 0.7rem;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 50px;
    border: 1px solid #a7f3d0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.srw-nav-links {
    display: flex;
    gap: 32px;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0;
}
.srw-nav-links a {
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--srw-text-main) !important;
    text-decoration: none;
    transition: color 0.2s;
}
.srw-nav-links a:hover {
    color: var(--srw-emerald) !important;
}
.srw-nav-actions {
    display: flex;
    gap: 12px;
    align-items: center;
}
.srw-btn-login {
    color: var(--srw-text-dark) !important;
    font-size: 0.9rem;
    font-weight: 700;
    padding: 10px 22px;
    border-radius: 50px;
    text-decoration: none;
    transition: all 0.2s;
}
.srw-btn-login:hover {
    background: var(--srw-bg-mint);
    color: var(--srw-emerald) !important;
}
.srw-btn-portal {
    background: var(--srw-grad-primary);
    color: #ffffff !important;
    padding: 11px 26px;
    border-radius: 50px;
    font-size: 0.9rem;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 4px 18px rgba(16, 185, 129, 0.35);
    transition: all 0.2s;
    white-space: nowrap;
}
.srw-btn-portal:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.5);
}

/* HERO SECTION */
.srw-hero {
    position: relative;
    padding: 95px 0 100px;
    background: var(--srw-grad-hero), var(--srw-bg-base);
    width: 100%;
}
.srw-hero-grid {
    display: flex;
    align-items: center;
    gap: 56px;
}
.srw-hero-content {
    flex: 1.1;
    min-width: 0;
}
.srw-hero-visual {
    flex: 0.9;
    min-width: 0;
}

.srw-pill-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #ffffff;
    border: 1px solid #a7f3d0;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.1);
    padding: 7px 20px;
    border-radius: 50px;
    color: #047857;
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 26px;
}
.srw-pill-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 10px #10b981;
}

.srw-hero-title {
    font-size: clamp(2.4rem, 4.3vw, 3.4rem);
    font-weight: 800;
    color: var(--srw-text-dark);
    line-height: 1.15;
    margin: 0 0 24px 0;
    letter-spacing: -0.03em;
}
.srw-hero-title span {
    background: var(--srw-grad-text);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.srw-hero-subtitle {
    font-size: 1.1rem;
    color: var(--srw-text-muted);
    margin: 0 0 38px 0;
    max-width: 560px;
    line-height: 1.7;
}
.srw-hero-btns {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
}

.srw-btn-primary {
    background: var(--srw-grad-primary);
    color: #ffffff !important;
    padding: 16px 34px;
    border-radius: 50px;
    font-size: 1rem;
    font-weight: 700;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 8px 26px rgba(16, 185, 129, 0.38);
    transition: all 0.2s;
}
.srw-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(16, 185, 129, 0.52);
}

.srw-btn-secondary {
    background: #ffffff;
    color: var(--srw-text-dark) !important;
    padding: 16px 30px;
    border-radius: 50px;
    font-size: 1rem;
    font-weight: 700;
    text-decoration: none;
    border: 1px solid var(--srw-border);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
}
.srw-btn-secondary:hover {
    background: var(--srw-bg-mint);
    border-color: #a7f3d0;
    transform: translateY(-1px);
}

/* HERO DASHBOARD WIDGET */
.srw-dashboard-card {
    background: #ffffff;
    border: 1px solid var(--srw-border);
    border-radius: 26px;
    padding: 28px;
    box-shadow: 0 24px 60px rgba(16, 185, 129, 0.08);
}
.srw-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 22px;
}
.srw-card-title {
    color: var(--srw-text-dark);
    font-size: 0.95rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 8px;
}
.srw-live-indicator {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 10px #10b981;
}

.srw-stats-mini-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 22px;
}
.srw-mini-stat {
    background: var(--srw-bg-emerald-light);
    border: 1px solid #a7f3d0;
    border-radius: 16px;
    padding: 16px 18px;
}
.srw-mini-label {
    font-size: 0.72rem;
    color: var(--srw-emerald-dark);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.srw-mini-val {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--srw-text-dark);
    margin-top: 4px;
}
.srw-mini-trend {
    font-size: 0.76rem;
    color: #059669;
    font-weight: 700;
    margin-top: 2px;
}

.srw-module-bars {
    display: flex;
    flex-direction: column;
    gap: 14px;
}
.srw-bar-item {
    background: #f8fafc;
    border-radius: 14px;
    padding: 14px 16px;
    border: 1px solid var(--srw-border);
}
.srw-bar-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.82rem;
    color: var(--srw-text-dark);
    margin-bottom: 8px;
    font-weight: 700;
}
.srw-bar-bg {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 50px;
    overflow: hidden;
}
.srw-bar-fill {
    height: 100%;
    border-radius: 50px;
    background: linear-gradient(90deg, #10b981, #06b6d4);
}

/* METRICS BAR */
.srw-metrics-section {
    background: linear-gradient(135deg, #ecfdf5 0%, #ecfeff 100%);
    border-top: 1px solid #a7f3d0;
    border-bottom: 1px solid #a7f3d0;
    padding: 44px 0;
    width: 100%;
}
.srw-metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    text-align: center;
}
.srw-metric-num {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--srw-text-dark);
}
.srw-metric-num span {
    color: var(--srw-emerald);
}
.srw-metric-lbl {
    font-size: 0.88rem;
    color: var(--srw-text-main);
    font-weight: 700;
    margin-top: 4px;
}

/* SECTIONS COMMON */
.srw-section {
    padding: 100px 0;
    width: 100%;
}
.srw-section-white {
    background: #ffffff;
}
.srw-section-soft {
    background: var(--srw-bg-base);
}

.srw-head {
    text-align: center;
    margin-bottom: 64px;
}
.srw-head-tag {
    color: var(--srw-emerald-dark);
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 14px;
    display: inline-block;
    background: #d1fae5;
    padding: 5px 16px;
    border-radius: 50px;
    border: 1px solid #a7f3d0;
}
.srw-head-title {
    font-size: clamp(2rem, 3.6vw, 2.7rem);
    font-weight: 800;
    color: var(--srw-text-dark);
    margin: 0;
    letter-spacing: -0.025em;
}
.srw-head-sub {
    color: var(--srw-text-muted);
    font-size: 1.05rem;
    max-width: 620px;
    margin: 14px auto 0;
}

/* FEATURE CARDS GRID */
.srw-rent-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
}
.srw-rent-card {
    background: #ffffff;
    border: 1px solid var(--srw-border);
    border-radius: 24px;
    padding: 38px 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
    display: flex;
    flex-direction: column;
}
.srw-rent-card:hover {
    transform: translateY(-6px);
    border-color: #a7f3d0;
    box-shadow: 0 20px 40px rgba(16, 185, 129, 0.12);
}
.srw-rent-icon {
    width: 60px;
    height: 60px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.7rem;
    margin-bottom: 24px;
}
.srw-icon-emerald { background: linear-gradient(135deg, #059669, #10b981); color: #fff; box-shadow: 0 6px 18px rgba(16, 185, 129, 0.3); }
.srw-icon-cyan { background: linear-gradient(135deg, #0284c7, #06b6d4); color: #fff; box-shadow: 0 6px 18px rgba(6, 182, 212, 0.3); }
.srw-icon-orange { background: linear-gradient(135deg, #ea580c, #f97316); color: #fff; box-shadow: 0 6px 18px rgba(249, 115, 22, 0.3); }
.srw-icon-indigo { background: linear-gradient(135deg, #4f46e5, #6366f1); color: #fff; box-shadow: 0 6px 18px rgba(79, 70, 229, 0.3); }
.srw-icon-teal { background: linear-gradient(135deg, #0f766e, #14b8a6); color: #fff; box-shadow: 0 6px 18px rgba(20, 184, 166, 0.3); }
.srw-icon-rose { background: linear-gradient(135deg, #e11d48, #f43f5e); color: #fff; box-shadow: 0 6px 18px rgba(244, 63, 94, 0.3); }

.srw-rent-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--srw-text-dark);
    margin: 0 0 12px 0;
}
.srw-rent-desc {
    font-size: 0.94rem;
    color: var(--srw-text-main);
    line-height: 1.65;
    margin: 0 0 20px 0;
    flex: 1;
}
.srw-rent-badge-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.srw-rent-tag {
    background: #f1f5f9;
    color: #334155;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 50px;
    border: 1px solid #e2e8f0;
}

/* STEPS WORKFLOW */
.srw-steps-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
}
.srw-step-item {
    background: #ffffff;
    border: 1px solid var(--srw-border);
    border-radius: 24px;
    padding: 34px 26px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}
.srw-step-badge {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--srw-grad-primary);
    color: #ffffff;
    font-size: 1.25rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 22px auto;
    box-shadow: 0 8px 22px rgba(16, 185, 129, 0.35);
}
.srw-step-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--srw-text-dark);
    margin: 0 0 10px 0;
}
.srw-step-desc {
    font-size: 0.9rem;
    color: var(--srw-text-main);
    margin: 0;
    line-height: 1.6;
}

/* PRICING */
.srw-price-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
}
.srw-price-card {
    background: #ffffff;
    border: 1px solid var(--srw-border);
    border-radius: 26px;
    padding: 42px 34px;
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}
.srw-price-card.featured {
    border: 2px solid var(--srw-emerald);
    box-shadow: 0 16px 40px rgba(16, 185, 129, 0.16);
}
.srw-featured-badge {
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--srw-grad-primary);
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 5px 18px;
    border-radius: 50px;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.srw-price-plan {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--srw-text-dark);
    margin-bottom: 8px;
}
.srw-price-sub {
    font-size: 0.88rem;
    color: var(--srw-text-muted);
    margin-bottom: 24px;
}
.srw-price-val {
    font-size: 2.4rem;
    font-weight: 800;
    color: var(--srw-text-dark);
    margin-bottom: 28px;
}
.srw-price-val small {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--srw-text-muted);
}
.srw-price-list {
    margin: 0 0 36px 0;
    padding: 0;
    list-style: none;
    flex: 1;
}
.srw-price-list li {
    font-size: 0.92rem;
    color: var(--srw-text-main);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
}
.srw-price-list li span {
    color: #10b981;
    font-weight: 800;
}
.srw-btn-plan {
    width: 100%;
    text-align: center;
    padding: 14px 24px;
    border-radius: 50px;
    font-size: 0.96rem;
    font-weight: 800;
    text-decoration: none;
    transition: all 0.2s;
}
.srw-btn-plan-outline {
    background: transparent;
    color: var(--srw-emerald) !important;
    border: 1.5px solid var(--srw-emerald);
}
.srw-btn-plan-outline:hover {
    background: var(--srw-bg-emerald-light);
}
.srw-btn-plan-solid {
    background: var(--srw-grad-primary);
    color: #ffffff !important;
    box-shadow: 0 6px 22px rgba(16, 185, 129, 0.38);
}
.srw-btn-plan-solid:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(16, 185, 129, 0.52);
}

/* TESTIMONIALS */
.srw-testi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
}
.srw-testi-card {
    background: #ffffff;
    border: 1px solid var(--srw-border);
    border-radius: 22px;
    padding: 34px 28px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 4px 16px rgba(0,0,0,0.02);
}
.srw-stars {
    color: #f59e0b;
    font-size: 1.05rem;
    margin-bottom: 18px;
}
.srw-testi-quote {
    font-size: 0.96rem;
    color: var(--srw-text-main);
    font-style: italic;
    margin-bottom: 24px;
    line-height: 1.65;
}
.srw-testi-user {
    display: flex;
    align-items: center;
    gap: 14px;
}
.srw-testi-avatar {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: var(--srw-grad-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 800;
    font-size: 0.95rem;
    flex-shrink: 0;
}
.srw-testi-name {
    font-size: 0.96rem;
    font-weight: 800;
    color: var(--srw-text-dark);
}
.srw-testi-role {
    font-size: 0.82rem;
    color: var(--srw-text-muted);
}

/* CTA BANNER */
.srw-cta-section {
    padding: 90px 0;
    background: linear-gradient(135deg, #059669 0%, #0284c7 100%);
    text-align: center;
    width: 100%;
}
.srw-cta-title {
    font-size: clamp(2.1rem, 4vw, 3rem);
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 18px 0;
    letter-spacing: -0.025em;
}
.srw-cta-desc {
    font-size: 1.12rem;
    color: rgba(255, 255, 255, 0.92);
    max-width: 580px;
    margin: 0 auto 40px auto;
}
.srw-btn-cta {
    background: #ffffff;
    color: var(--srw-emerald-dark) !important;
    padding: 17px 42px;
    border-radius: 50px;
    font-size: 1.08rem;
    font-weight: 800;
    text-decoration: none;
    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.22);
    display: inline-flex;
    align-items: center;
    gap: 10px;
    transition: all 0.2s;
}
.srw-btn-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 38px rgba(0, 0, 0, 0.32);
}

/* FOOTER */
.srw-footer {
    background: #0f172a;
    padding: 72px 0 36px 0;
    width: 100%;
    color: #94a3b8;
}
.srw-footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 44px;
    margin-bottom: 52px;
}
.srw-footer-brand h3 {
    font-size: 1.35rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 16px 0;
}
.srw-footer-brand p {
    font-size: 0.88rem;
    color: #94a3b8;
    line-height: 1.7;
    max-width: 330px;
    margin: 0;
}
.srw-footer-col h4 {
    font-size: 0.92rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 18px 0;
}
.srw-footer-col ul {
    list-style: none;
    margin: 0;
    padding: 0;
}
.srw-footer-col li {
    margin-bottom: 12px;
}
.srw-footer-col li a {
    font-size: 0.86rem;
    color: #cbd5e1 !important;
    text-decoration: none;
    transition: color 0.2s;
}
.srw-footer-col li a:hover {
    color: #34d399 !important;
}
.srw-footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 26px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.82rem;
    color: #64748b;
}

/* RESPONSIVE MEDIA QUERIES */
@media (max-width: 992px) {
    .srw-hero-grid {
        flex-direction: column;
        text-align: center;
    }
    .srw-hero-subtitle {
        margin-left: auto;
        margin-right: auto;
    }
    .srw-hero-btns {
        justify-content: center;
    }
    .srw-rent-grid,
    .srw-feat-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .srw-steps-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .srw-price-grid,
    .srw-testi-grid {
        grid-template-columns: 1fr;
    }
    .srw-metrics-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .srw-footer-grid {
        grid-template-columns: 1fr 1fr;
    }
}
@media (max-width: 640px) {
    .srw-nav-links {
        display: none;
    }
    .srw-rent-grid,
    .srw-feat-grid,
    .srw-steps-grid,
    .srw-metrics-grid,
    .srw-footer-grid {
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
<div class="srw-rental-root">

<!-- NAVBAR -->
<nav class="srw-navbar">
  <div class="srw-container">
    <div class="srw-nav-inner">
      <a href="/" class="srw-brand">
        <span class="srw-brand-icon">🚗</span>
        Seruwit Rental
        <span class="srw-brand-badge">Software ERP Rental</span>
      </a>
      <ul class="srw-nav-links">
        <li><a href="#fitur">Fitur Utama</a></li>
        <li><a href="#keunggulan">Solusi Bisnis</a></li>
        <li><a href="#cara-kerja">Cara Kerja</a></li>
        <li><a href="#harga">Paket Harga</a></li>
        <li><a href="#testimoni">Testimoni Pengusaha</a></li>
      </ul>
      <div class="srw-nav-actions">
        <a href="/login" class="srw-btn-login">Masuk</a>
        <a href="/workspaces" class="srw-btn-portal">Coba Gratis 14 Hari</a>
      </div>
    </div>
  </div>
</nav>

<!-- HERO SECTION -->
<header class="srw-hero">
  <div class="srw-container">
    <div class="srw-hero-grid">
      <div class="srw-hero-content">
        <div class="srw-pill-badge">
          <span class="srw-pill-dot"></span> Software Rental Mobil &amp; Kendaraan #1 Indonesia
        </div>
        <h1 class="srw-hero-title">
          Kelola Bisnis Rental Mobil <span>Secara Otomatis &amp; Lebih Menguntungkan</span>
        </h1>
        <p class="srw-hero-subtitle">
          Sistem manajemen rental kendaraan terpadu untuk pengusaha rental: dari jadwal reservasi, pelacakan GPS live, inspeksi serah terima unit, hingga otomatisasi pembukuan &amp; invoice.
        </p>
        <div class="srw-hero-btns">
          <a href="#fitur" class="srw-btn-primary">
            🚀 Pelajari Fitur Rental ERP
          </a>
          <a href="/workspaces" class="srw-btn-secondary">
            ⚡ Coba Demo Software
          </a>
        </div>
      </div>
      
      <div class="srw-hero-visual">
        <div class="srw-dashboard-card">
          <div class="srw-card-header">
            <div class="srw-card-title">
              <span class="srw-live-indicator"></span> Depot Fleet Control Dashboard
            </div>
            <span style="color:#059669; font-size:0.78rem; font-weight:800;">Realtime Operational</span>
          </div>
          
          <div class="srw-stats-mini-grid">
            <div class="srw-mini-stat">
              <div class="srw-mini-label">Armada Aktif Disewa</div>
              <div class="srw-mini-val">42 / 48 Unit</div>
              <div class="srw-mini-trend">↑ 87.5% Utilitas Armada</div>
            </div>
            <div class="srw-mini-stat">
              <div class="srw-mini-label">Omset Sewa Bulan Ini</div>
              <div class="srw-mini-val">Rp 185.5M</div>
              <div class="srw-mini-trend">↑ +21.2% dari bulan lalu</div>
            </div>
          </div>
          
          <div class="srw-module-bars">
            <div class="srw-bar-item">
              <div class="srw-bar-info"><span>Mobil MPV &amp; SUV (Innova, Fortuner)</span><span>95% Disewa</span></div>
              <div class="srw-bar-bg"><div class="srw-bar-fill" style="width: 95%;"></div></div>
            </div>
            <div class="srw-bar-item">
              <div class="srw-bar-info"><span>GPS Telematika &amp; Geofence Live Tracking</span><span>100% Signal Online</span></div>
              <div class="srw-bar-bg"><div class="srw-bar-fill" style="width: 100%; background: linear-gradient(90deg, #10b981, #34d399);"></div></div>
            </div>
            <div class="srw-bar-item">
              <div class="srw-bar-info"><span>Pelunasan Deposit &amp; Automatic Invoicing</span><span>98.8% Lunas</span></div>
              <div class="srw-bar-bg"><div class="srw-bar-fill" style="width: 98%; background: linear-gradient(90deg, #0284c7, #38bdf8);"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</header>

<!-- METRICS BAR -->
<section class="srw-metrics-section">
  <div class="srw-container">
    <div class="srw-metrics-grid">
      <div>
        <div class="srw-metric-num">50K<span>+</span></div>
        <div class="srw-metric-lbl">Hari Sewa Kendaraan Terkelola</div>
      </div>
      <div>
        <div class="srw-metric-num">99.8<span>%</span></div>
        <div class="srw-metric-lbl">Akurasi Jadwal &amp; Pengembalian Unit</div>
      </div>
      <div>
        <div class="srw-metric-num">500<span>+</span></div>
        <div class="srw-metric-lbl">Pengusaha Rental Terdaftar</div>
      </div>
      <div>
        <div class="srw-metric-num">0<span>%</span></div>
        <div class="srw-metric-lbl">Resiko Bentrok Jadwal Sewa</div>
      </div>
    </div>
  </div>
</section>

<!-- MAIN FEATURES GRID FOR RENTAL OWNERS -->
<section class="srw-section srw-section-white" id="fitur">
  <div class="srw-container">
    <div class="srw-head">
      <span class="srw-head-tag">Solusi Khusus Pengusaha Rental</span>
      <h2 class="srw-head-title">Fitur Spesialis Mengelola Bisnis Rental Kendaraan</h2>
      <p class="srw-head-sub">Segala kebutuhan operasional rental mobil, motor, hingga armada wisata dalam satu sistem pintar.</p>
    </div>
    
    <div class="srw-rent-grid">
      <!-- Feature 1 -->
      <div class="srw-rent-card">
        <div class="srw-rent-icon srw-icon-emerald">🚗</div>
        <h3 class="srw-rent-title">Manajemen Armada &amp; Surat Kendaraan</h3>
        <p class="srw-rent-desc">Pantau status fisik setiap mobil, pengingat otomatis perpanjangan STNK, Pajak, Asuransi, hingga alur servis berkala (Maintenance).</p>
        <div class="srw-rent-badge-list">
          <span class="srw-rent-tag">Status Unit</span>
          <span class="srw-rent-tag">STNK &amp; Pajak</span>
          <span class="srw-rent-tag">Jadwal Servis</span>
        </div>
      </div>

      <!-- Feature 2 -->
      <div class="srw-rent-card">
        <div class="srw-rent-icon srw-icon-cyan">📅</div>
        <h3 class="srw-rent-title">Kalender Reservasi &amp; Booking Engine</h3>
        <p class="srw-rent-desc">Kalender visual ketersediaan unit yang mencegah bentrok jadwal sewa. Bebas atur sewa lepas kunci maupun sewa dengan sopir.</p>
        <div class="srw-rent-badge-list">
          <span class="srw-rent-tag">Lepas Kunci</span>
          <span class="srw-rent-tag">Dengan Sopir</span>
          <span class="srw-rent-tag">Cek Bentrok</span>
        </div>
      </div>

      <!-- Feature 3 -->
      <div class="srw-rent-card">
        <div class="srw-rent-icon srw-icon-orange">📍</div>
        <h3 class="srw-rent-title">Pelacakan GPS Real-Time &amp; Geofencing</h3>
        <p class="srw-rent-desc">Integrasi GPS telematika langsung di sistem. Pantau posisi mobil secara live, beri peringatan jika keluar kota, dan fitur kelola keamanan.</p>
        <div class="srw-rent-badge-list">
          <span class="srw-rent-tag">GPS Live</span>
          <span class="srw-rent-tag">Alarm Geofence</span>
          <span class="srw-rent-tag">Multi-Device</span>
        </div>
      </div>

      <!-- Feature 4 -->
      <div class="srw-rent-card">
        <div class="srw-rent-icon srw-icon-indigo">💳</div>
        <h3 class="srw-rent-title">Faktur Otomatis &amp; Manajemen Deposit</h3>
        <p class="srw-rent-desc">Penerbitan invoice dan kuitansi pembayaran otomatis. Pencatatan uang muka (DP), jaminan deposit, dan tagihan denda keterlambatan.</p>
        <div class="srw-rent-badge-list">
          <span class="srw-rent-tag">Invoice Kuitansi</span>
          <span class="srw-rent-tag">Deposit Jaminan</span>
          <span class="srw-rent-tag">Gateway Midtrans</span>
        </div>
      </div>

      <!-- Feature 5 -->
      <div class="srw-rent-card">
        <div class="srw-rent-icon srw-icon-teal">📋</div>
        <h3 class="srw-rent-title">Formulir Serah Terima &amp; Inspeksi Mobil</h3>
        <p class="srw-rent-desc">Formulir digital cek kondisi fisik kendaraan saat keluar dan kembali. Catat goresan, bensin awal/akhir, serta kelengkapan dokumen.</p>
        <div class="srw-rent-badge-list">
          <span class="srw-rent-tag">Inspeksi Digital</span>
          <span class="srw-rent-tag">Foto Goresan</span>
          <span class="srw-rent-tag">Cek Bensin</span>
        </div>
      </div>

      <!-- Feature 6 -->
      <div class="srw-rent-card">
        <div class="srw-rent-icon srw-icon-rose">📊</div>
        <h3 class="srw-rent-title">Laporan Keuangan Laba-Rugi Per Unit</h3>
        <p class="srw-rent-desc">Analisis keuntungan bersih masing-masing mobil. Ketahui kendaraan mana yang paling menguntungkan dan mana yang boros biaya perawatan.</p>
        <div class="srw-rent-badge-list">
          <span class="srw-rent-tag">Laba/Rugi Unit</span>
          <span class="srw-rent-tag">Driver Scoring</span>
          <span class="srw-rent-tag">Laporan Omset</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- PLATFORM ADVANTAGES -->
<section class="srw-section srw-section-soft" id="keunggulan">
  <div class="srw-container">
    <div class="srw-head">
      <span class="srw-head-tag">Keunggulan Bagi Pemilik Rental</span>
      <h2 class="srw-head-title">Meningkatkan Keuntungan &amp; Keamanan Usaha Rental</h2>
    </div>
    
    <div class="srw-rent-grid">
      <div class="srw-rent-card">
        <div class="srw-rent-icon srw-icon-emerald">🛡️</div>
        <h3 class="srw-rent-title">Keamanan Armada Terjamin</h3>
        <p class="srw-rent-desc">Verifikasi identitas penyewa (KTP/SIM/Dokumen), integrasi GPS, dan mitigasi resiko penggelapan unit dengan sistem rekam jejak digital.</p>
      </div>

      <div class="srw-rent-card">
        <div class="srw-rent-icon srw-icon-cyan">⚡</div>
        <h3 class="srw-rent-title">Booking Online 24 Jam</h3>
        <p class="srw-rent-desc">Pilihan booking engine (PWA) yang dapat dipasang di website rental Anda sehingga pelanggan dapat pesan &amp; cek unit 24 jam nonstop.</p>
      </div>

      <div class="srw-rent-card">
        <div class="srw-rent-icon srw-icon-indigo">📱</div>
        <h3 class="srw-rent-title">Aplikasi Mobile Driver &amp; Petugas</h3>
        <p class="srw-rent-desc">Tim lapangan dapat melakukan inspeksi serah terima kunci dan konfirmasi penjemputan langsung dari Smartphone tanpa kertas.</p>
      </div>
    </div>
  </div>
</section>

<!-- STEPS WORKFLOW -->
<section class="srw-section srw-section-white" id="cara-kerja">
  <div class="srw-container">
    <div class="srw-head">
      <span class="srw-head-tag">Proses Mudah</span>
      <h2 class="srw-head-title">4 Langkah Modernisasi Bisnis Rental Anda</h2>
    </div>
    
    <div class="srw-steps-grid">
      <div class="srw-step-item">
        <div class="srw-step-badge">1</div>
        <h3 class="srw-step-title">Daftar Workspace</h3>
        <p class="srw-step-desc">Daftarkan usaha rental Anda dan buat sistem manajemen dalam hitungan menit.</p>
      </div>

      <div class="srw-step-item">
        <div class="srw-step-badge">2</div>
        <h3 class="srw-step-title">Input Data Armada</h3>
        <p class="srw-step-desc">Masukkan daftar mobil/motor, nomor polisi, harga sewa per hari, dan dokumen terkait.</p>
      </div>

      <div class="srw-step-item">
        <div class="srw-step-badge">3</div>
        <h3 class="srw-step-title">Atur Kalender &amp; Sopir</h3>
        <p class="srw-step-desc">Tentukan skema sewa lepas kunci atau paket sopir beserta tarif tambahan.</p>
      </div>

      <div class="srw-step-item">
        <div class="srw-step-badge">4</div>
        <h3 class="srw-step-title">Terima Reservasi</h3>
        <p class="srw-step-desc">Kelola reservasi masuk, terbitkan invoice otomatis, dan pantau posisi unit secara live.</p>
      </div>
    </div>
  </div>
</section>

<!-- PRICING PREVIEW -->
<section class="srw-section srw-section-soft" id="harga">
  <div class="srw-container">
    <div class="srw-head">
      <span class="srw-head-tag">Paket Langganan Software</span>
      <h2 class="srw-head-title">Harga Terjangkau Untuk Semua Ukuran Rental</h2>
      <p class="srw-head-sub">Investasi hemat dengan potensi peningkatan omset dan keamanan armada maksimal.</p>
    </div>
    
    <div class="srw-price-grid">
      <!-- Plan 1 -->
      <div class="srw-price-card">
        <div class="srw-price-plan">Rental Starter</div>
        <div class="srw-price-sub">Cocok untuk rental skala kecil (1-10 armada).</div>
        <div class="srw-price-val">Rp 299K <small>/ bulan</small></div>
        <ul class="srw-price-list">
          <li><span>✓</span> Maksimal 10 Unit Armada</li>
          <li><span>✓</span> Kalender Reservasi &amp; Booking Engine</li>
          <li><span>✓</span> Invoice &amp; Kuitansi Otomatis</li>
          <li><span>✓</span> Manajemen Dokumen &amp; STNK</li>
          <li><span>✓</span> Support WA 24/7</li>
        </ul>
        <a href="/login" class="srw-btn-plan srw-btn-plan-outline">Coba Pakai Starter</a>
      </div>

      <!-- Plan 2 (Featured) -->
      <div class="srw-price-card featured">
        <div class="srw-featured-badge">Paling Diminati</div>
        <div class="srw-price-plan">Rental Pro GPS</div>
        <div class="srw-price-sub">Solusi terlengkap untuk rental menengah (11-35 armada).</div>
        <div class="srw-price-val">Rp 699K <small>/ bulan</small></div>
        <ul class="srw-price-list">
          <li><span>✓</span> Hingga 35 Unit Armada</li>
          <li><span>✓</span> Integrasi Pelacakan GPS Realtime</li>
          <li><span>✓</span> Formulir Inspeksi Serah Terima Digital</li>
          <li><span>✓</span> Manajemen Driver &amp; Komisi</li>
          <li><span>✓</span> Pembayaran Online (Midtrans)</li>
          <li><span>✓</span> Laporan Laba/Rugi Per Unit</li>
        </ul>
        <a href="/login" class="srw-btn-plan srw-btn-plan-solid">Coba Gratis Pro 14 Hari</a>
      </div>

      <!-- Plan 3 -->
      <div class="srw-price-card">
        <div class="srw-price-plan">Fleet Enterprise</div>
        <div class="srw-price-sub">Untuk perusahaan rental besar &amp; korporat (>35 armada).</div>
        <div class="srw-price-val">Kustom <small>/ tahunan</small></div>
        <ul class="srw-price-list">
          <li><span>✓</span> Unlimited Jumlah Unit Armada</li>
          <li><span>✓</span> Multi-Depot / Multi-Cabang</li>
          <li><span>✓</span> Remote Engine Kill GPS Integration</li>
          <li><span>✓</span> Integrasi API &amp; Pembukuan Accounting</li>
          <li><span>✓</span> Dedicated Account Manager</li>
        </ul>
        <a href="/login" class="srw-btn-plan srw-btn-plan-outline">Hubungi Tim Sales</a>
      </div>
    </div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section class="srw-section srw-section-white" id="testimoni">
  <div class="srw-container">
    <div class="srw-head">
      <span class="srw-head-tag">Kata Pengusaha Rental</span>
      <h2 class="srw-head-title">Kisah Sukses Pengusaha Rental Kendaraan</h2>
    </div>
    
    <div class="srw-testi-grid">
      <div class="srw-testi-card">
        <div>
          <div class="srw-stars">★★★★★</div>
          <p class="srw-testi-quote">"Sejak pakai Seruwit Rental, tidak pernah ada lagi bentrok jadwal sewa Innova atau Fortuner kami. Tagihan denda dan deposit tercatat rapi!"</p>
        </div>
        <div class="srw-testi-user">
          <div class="srw-testi-avatar">HBP</div>
          <div>
            <div class="srw-testi-name">H. Bambang Purnomo</div>
            <div class="srw-testi-role">Owner · Bintang Rent Car Jakarta</div>
          </div>
        </div>
      </div>

      <div class="srw-testi-card">
        <div>
          <div class="srw-stars">★★★★★</div>
          <p class="srw-testi-quote">"Integrasi GPS live dan alarm Geofencing membuat kami tenang melepas kunci armada ke penyewa. Keamanan usaha rental naik pesat."</p>
        </div>
        <div class="srw-testi-user">
          <div class="srw-testi-avatar">WS</div>
          <div>
            <div class="srw-testi-name">Wawan Setiawan</div>
            <div class="srw-testi-role">Founder · Bali Transport Solutions</div>
          </div>
        </div>
      </div>

      <div class="srw-testi-card">
        <div>
          <div class="srw-stars">★★★★★</div>
          <p class="srw-testi-quote">"Fitur inspeksi digital foto goresan sebelum &amp; sesudah sewa sangat efektif menghindari perdebatan klaim ganti rugi dengan pelanggan."</p>
        </div>
        <div class="srw-testi-user">
          <div class="srw-testi-avatar">DM</div>
          <div>
            <div class="srw-testi-name">Dina Marlina</div>
            <div class="srw-testi-role">Manager Ops · Surabaya Fleet Rental</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA BANNER -->
<section class="srw-cta-section">
  <div class="srw-container">
    <h2 class="srw-cta-title">Siap Otomatiskan Bisnis Rental Kendaraan Anda?</h2>
    <p class="srw-cta-desc">Mulai coba gratis 14 hari tanpa kartu kredit. Rasakan kemudahan mengelola armada secara modern.</p>
    <a href="/workspaces" class="srw-btn-cta">
      🚗 Mulai Coba Gratis Seruwit Rental
    </a>
  </div>
</section>

<!-- FOOTER -->
<footer class="srw-footer">
  <div class="srw-container">
    <div class="srw-footer-grid">
      <div class="srw-footer-brand">
        <h3>⚡ Seruwit Rental</h3>
        <p>Software Sistem Manajemen Rental Kendaraan Enterprise terpadu untuk pengusaha rental mobil, motor, dan armada transportasi.</p>
      </div>
      
      <div class="srw-footer-col">
        <h4>Fitur Rental</h4>
        <ul>
          <li><a href="#fitur">Manajemen Armada</a></li>
          <li><a href="#fitur">Kalender Reservasi</a></li>
          <li><a href="#fitur">GPS &amp; Geofencing</a></li>
          <li><a href="#fitur">Inspeksi Digital</a></li>
        </ul>
      </div>

      <div class="srw-footer-col">
        <h4>Platform</h4>
        <ul>
          <li><a href="/workspaces">Portal Workspace</a></li>
          <li><a href="#keunggulan">Solusi Pengusaha</a></li>
          <li><a href="#harga">Paket Harga Software</a></li>
          <li><a href="/login">Portal Admin</a></li>
        </ul>
      </div>

      <div class="srw-footer-col">
        <h4>Legal &amp; Kontak</h4>
        <ul>
          <li><a href="/terms">Syarat &amp; Ketentuan</a></li>
          <li><a href="/privacy">Kebijakan Privasi</a></li>
          <li><a href="mailto:rental@seruwit.com">rental@seruwit.com</a></li>
          <li><a href="#">Support 24/7 WA</a></li>
        </ul>
      </div>
    </div>

    <div class="srw-footer-bottom">
      <div>© 2026 Seruwit Rental. Seluruh Hak Cipta Dilindungi.</div>
      <div>Platform Sistem Manajemen Rental Kendaraan Enterprise.</div>
    </div>
  </div>
</footer>

</div><!-- /.srw-rental-root -->
HTML;
    }
}
