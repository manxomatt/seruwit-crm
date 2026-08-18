<?php

namespace Modules\Pages\Support;

class CentralLandingPageTemplate
{
    /**
     * Build the data array for the modern bright Central Landing Page.
     *
     * @return array{title: string, slug: string, html: string, css: string, gjs_data: null}
     */
    public static function build(): array
    {
        $css = self::css();
        $html = self::html();

        return [
            'title' => 'Seruwit CRM – Platform Enterprise CRM & ERP Modular',
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

.srw-landing-root {
    --srw-bg-body: #f8fafc;
    --srw-bg-white: #ffffff;
    --srw-bg-soft: #f1f5f9;
    --srw-bg-indigo-soft: #eef2ff;
    
    --srw-primary: #4f46e5;
    --srw-primary-hover: #4338ca;
    --srw-primary-gradient: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
    --srw-accent-gradient: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
    
    --srw-text-main: #0f172a;
    --srw-text-body: #334155;
    --srw-text-muted: #64748b;
    --srw-text-sub: #94a3b8;
    --srw-border: #e2e8f0;
    --srw-border-hover: #cbd5e1;

    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--srw-text-body);
    background-color: var(--srw-bg-body);
    line-height: 1.6;
    width: 100%;
    overflow-x: hidden;
}

.srw-landing-root *, 
.srw-landing-root *::before, 
.srw-landing-root *::after {
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
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--srw-border);
    width: 100%;
}
.srw-nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 74px;
}
.srw-brand {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--srw-text-main) !important;
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
}
.srw-brand-icon {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: var(--srw-primary-gradient);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 1.15rem;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
}
.srw-brand-badge {
    background: #e0e7ff;
    color: #4338ca;
    font-size: 0.68rem;
    font-weight: 800;
    padding: 4px 9px;
    border-radius: 6px;
    border: 1px solid #c7d2fe;
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
    color: var(--srw-text-body) !important;
    text-decoration: none;
    transition: color 0.2s;
}
.srw-nav-links a:hover {
    color: var(--srw-primary) !important;
}
.srw-nav-actions {
    display: flex;
    gap: 12px;
    align-items: center;
}
.srw-btn-login {
    color: var(--srw-text-main) !important;
    font-size: 0.9rem;
    font-weight: 700;
    padding: 9px 20px;
    border-radius: 50px;
    text-decoration: none;
    transition: all 0.2s;
}
.srw-btn-login:hover {
    background: var(--srw-bg-soft);
    color: var(--srw-primary) !important;
}
.srw-btn-portal {
    background: var(--srw-primary-gradient);
    color: #ffffff !important;
    padding: 11px 24px;
    border-radius: 50px;
    font-size: 0.9rem;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
    transition: all 0.2s;
    white-space: nowrap;
}
.srw-btn-portal:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(79, 70, 229, 0.45);
}

/* HERO SECTION */
.srw-hero {
    position: relative;
    padding: 90px 0 100px;
    background: radial-gradient(circle at 50% -10%, rgba(99, 102, 241, 0.1) 0%, transparent 60%),
                radial-gradient(circle at 90% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
                var(--srw-bg-body);
    width: 100%;
}
.srw-hero-grid {
    display: flex;
    align-items: center;
    gap: 52px;
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
    background: #e0e7ff;
    border: 1px solid #c7d2fe;
    padding: 7px 18px;
    border-radius: 50px;
    color: #4338ca;
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 24px;
}
.srw-pill-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 10px #10b981;
}

.srw-hero-title {
    font-size: clamp(2.3rem, 4.2vw, 3.4rem);
    font-weight: 800;
    color: var(--srw-text-main);
    line-height: 1.16;
    margin: 0 0 22px 0;
    letter-spacing: -0.025em;
}
.srw-hero-title span {
    background: var(--srw-accent-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.srw-hero-subtitle {
    font-size: 1.1rem;
    color: var(--srw-text-muted);
    margin: 0 0 36px 0;
    max-width: 550px;
    line-height: 1.7;
}
.srw-hero-btns {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
}

.srw-btn-primary {
    background: var(--srw-primary-gradient);
    color: #ffffff !important;
    padding: 15px 32px;
    border-radius: 50px;
    font-size: 0.98rem;
    font-weight: 700;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
    transition: all 0.2s;
}
.srw-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(79, 70, 229, 0.5);
}

.srw-btn-secondary {
    background: var(--srw-bg-white);
    color: var(--srw-text-main) !important;
    padding: 15px 28px;
    border-radius: 50px;
    font-size: 0.98rem;
    font-weight: 700;
    text-decoration: none;
    border: 1px solid var(--srw-border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
}
.srw-btn-secondary:hover {
    background: var(--srw-bg-soft);
    border-color: var(--srw-border-hover);
    transform: translateY(-1px);
}

/* HERO DASHBOARD WIDGET */
.srw-dashboard-card {
    background: var(--srw-bg-white);
    border: 1px solid var(--srw-border);
    border-radius: 24px;
    padding: 26px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
}
.srw-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 22px;
}
.srw-card-title {
    color: var(--srw-text-main);
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
    background: #f8fafc;
    border: 1px solid var(--srw-border);
    border-radius: 16px;
    padding: 16px 18px;
}
.srw-mini-label {
    font-size: 0.73rem;
    color: var(--srw-text-muted);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.srw-mini-val {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--srw-text-main);
    margin-top: 4px;
}
.srw-mini-trend {
    font-size: 0.76rem;
    color: #10b981;
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
    border-radius: 12px;
    padding: 14px 16px;
    border: 1px solid var(--srw-border);
}
.srw-bar-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--srw-text-main);
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
    background: linear-gradient(90deg, #4f46e5, #06b6d4);
}

/* METRICS BAR */
.srw-metrics-section {
    background: var(--srw-bg-indigo-soft);
    border-top: 1px solid #e0e7ff;
    border-bottom: 1px solid #e0e7ff;
    padding: 40px 0;
    width: 100%;
}
.srw-metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    text-align: center;
}
.srw-metric-num {
    font-size: 2.4rem;
    font-weight: 800;
    color: var(--srw-text-main);
}
.srw-metric-num span {
    color: var(--srw-primary);
}
.srw-metric-lbl {
    font-size: 0.86rem;
    color: var(--srw-text-body);
    font-weight: 700;
    margin-top: 4px;
}

/* SECTIONS COMMON */
.srw-section {
    padding: 95px 0;
    width: 100%;
}
.srw-section-white {
    background: var(--srw-bg-white);
}
.srw-section-soft {
    background: var(--srw-bg-body);
}

.srw-head {
    text-align: center;
    margin-bottom: 60px;
}
.srw-head-tag {
    color: var(--srw-primary);
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 12px;
    display: inline-block;
    background: #e0e7ff;
    padding: 4px 14px;
    border-radius: 50px;
}
.srw-head-title {
    font-size: clamp(1.9rem, 3.5vw, 2.6rem);
    font-weight: 800;
    color: var(--srw-text-main);
    margin: 0;
    letter-spacing: -0.02em;
}
.srw-head-sub {
    color: var(--srw-text-muted);
    font-size: 1.05rem;
    max-width: 600px;
    margin: 14px auto 0;
}

/* MODULAR SUITES GRID */
.srw-suites-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
}
.srw-suite-card {
    background: var(--srw-bg-white);
    border: 1px solid var(--srw-border);
    border-radius: 22px;
    padding: 38px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
}
.srw-suite-card:hover {
    transform: translateY(-5px);
    border-color: #c7d2fe;
    box-shadow: 0 16px 36px rgba(79, 70, 229, 0.1);
}
.srw-suite-header {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 20px;
}
.srw-suite-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    color: #ffffff;
    flex-shrink: 0;
}
.srw-icon-cyan { background: linear-gradient(135deg, #0284c7, #06b6d4); box-shadow: 0 6px 16px rgba(6, 182, 212, 0.3); }
.srw-icon-emerald { background: linear-gradient(135deg, #059669, #10b981); box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3); }
.srw-icon-amber { background: linear-gradient(135deg, #d97706, #f59e0b); box-shadow: 0 6px 16px rgba(245, 158, 11, 0.3); }
.srw-icon-indigo { background: linear-gradient(135deg, #4f46e5, #818cf8); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); }

.srw-suite-title {
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--srw-text-main);
}
.srw-suite-desc {
    font-size: 0.95rem;
    color: var(--srw-text-body);
    margin-bottom: 24px;
    line-height: 1.65;
}
.srw-tags-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
.srw-tag {
    background: #f1f5f9;
    color: #334155;
    border: 1px solid #e2e8f0;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 5px 14px;
    border-radius: 50px;
}

/* PLATFORM ADVANTAGES */
.srw-feat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 26px;
}
.srw-feat-card {
    background: var(--srw-bg-white);
    border: 1px solid var(--srw-border);
    border-radius: 20px;
    padding: 32px 26px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    transition: transform 0.2s, box-shadow 0.2s;
}
.srw-feat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}
.srw-feat-icon {
    font-size: 2.2rem;
    margin-bottom: 18px;
}
.srw-feat-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--srw-text-main);
    margin: 0 0 10px 0;
}
.srw-feat-desc {
    font-size: 0.9rem;
    color: var(--srw-text-body);
    line-height: 1.6;
    margin: 0;
}

/* STEPS WORKFLOW */
.srw-steps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
}
.srw-step-item {
    background: var(--srw-bg-white);
    border: 1px solid var(--srw-border);
    border-radius: 20px;
    padding: 36px 30px;
    text-align: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.03);
}
.srw-step-badge {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--srw-primary-gradient);
    color: #ffffff;
    font-size: 1.25rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 22px auto;
    box-shadow: 0 6px 18px rgba(79, 70, 229, 0.35);
}
.srw-step-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--srw-text-main);
    margin: 0 0 12px 0;
}
.srw-step-desc {
    font-size: 0.92rem;
    color: var(--srw-text-body);
    margin: 0;
    line-height: 1.6;
}

/* PRICING */
.srw-price-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
}
.srw-price-card {
    background: var(--srw-bg-white);
    border: 1px solid var(--srw-border);
    border-radius: 24px;
    padding: 40px 32px;
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}
.srw-price-card.featured {
    border: 2px solid var(--srw-primary);
    box-shadow: 0 12px 36px rgba(79, 70, 229, 0.15);
}
.srw-featured-badge {
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--srw-primary-gradient);
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 5px 16px;
    border-radius: 50px;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.srw-price-plan {
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--srw-text-main);
    margin-bottom: 8px;
}
.srw-price-sub {
    font-size: 0.86rem;
    color: var(--srw-text-muted);
    margin-bottom: 24px;
}
.srw-price-val {
    font-size: 2.3rem;
    font-weight: 800;
    color: var(--srw-text-main);
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
    font-size: 0.9rem;
    color: var(--srw-text-body);
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
    padding: 13px 22px;
    border-radius: 50px;
    font-size: 0.95rem;
    font-weight: 800;
    text-decoration: none;
    transition: all 0.2s;
}
.srw-btn-plan-outline {
    background: transparent;
    color: var(--srw-primary) !important;
    border: 1.5px solid var(--srw-primary);
}
.srw-btn-plan-outline:hover {
    background: var(--srw-bg-indigo-soft);
}
.srw-btn-plan-solid {
    background: var(--srw-primary-gradient);
    color: #ffffff !important;
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
}
.srw-btn-plan-solid:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.5);
}

/* TESTIMONIALS */
.srw-testi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 26px;
}
.srw-testi-card {
    background: var(--srw-bg-white);
    border: 1px solid var(--srw-border);
    border-radius: 20px;
    padding: 32px 26px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 2px 12px rgba(0,0,0,0.02);
}
.srw-stars {
    color: #f59e0b;
    font-size: 1rem;
    margin-bottom: 16px;
}
.srw-testi-quote {
    font-size: 0.95rem;
    color: var(--srw-text-body);
    font-style: italic;
    margin-bottom: 22px;
    line-height: 1.65;
}
.srw-testi-user {
    display: flex;
    align-items: center;
    gap: 14px;
}
.srw-testi-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--srw-primary-gradient);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 800;
    font-size: 0.95rem;
    flex-shrink: 0;
}
.srw-testi-name {
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--srw-text-main);
}
.srw-testi-role {
    font-size: 0.8rem;
    color: var(--srw-text-muted);
}

/* CTA BANNER */
.srw-cta-section {
    padding: 85px 0;
    background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
    text-align: center;
    width: 100%;
}
.srw-cta-title {
    font-size: clamp(2rem, 3.8vw, 2.8rem);
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 18px 0;
    letter-spacing: -0.02em;
}
.srw-cta-desc {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.9);
    max-width: 560px;
    margin: 0 auto 38px auto;
}
.srw-btn-cta {
    background: #ffffff;
    color: var(--srw-primary) !important;
    padding: 16px 38px;
    border-radius: 50px;
    font-size: 1.05rem;
    font-weight: 800;
    text-decoration: none;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    display: inline-flex;
    align-items: center;
    gap: 10px;
    transition: all 0.2s;
}
.srw-btn-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.3);
}

/* FOOTER */
.srw-footer {
    background: #0f172a;
    padding: 70px 0 36px 0;
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
    font-size: 1.3rem;
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
    font-size: 0.9rem;
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
    color: #38bdf8 !important;
}
.srw-footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 26px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
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
    .srw-suites-grid {
        grid-template-columns: 1fr;
    }
    .srw-feat-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .srw-steps-grid,
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
    .srw-feat-grid,
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
<div class="srw-landing-root">

<!-- NAVBAR -->
<nav class="srw-navbar">
  <div class="srw-container">
    <div class="srw-nav-inner">
      <a href="/" class="srw-brand">
        <span class="srw-brand-icon">⚡</span>
        Seruwit CRM
        <span class="srw-brand-badge">Modular ERP</span>
      </a>
      <ul class="srw-nav-links">
        <li><a href="#modul">Modul Suite</a></li>
        <li><a href="#keunggulan">Keunggulan</a></li>
        <li><a href="#cara-kerja">Cara Kerja</a></li>
        <li><a href="#harga">Paket Harga</a></li>
        <li><a href="#testimoni">Testimoni</a></li>
      </ul>
      <div class="srw-nav-actions">
        <a href="/login" class="srw-btn-login">Masuk</a>
        <a href="/workspaces" class="srw-btn-portal">Portal Workspace</a>
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
          <span class="srw-pill-dot"></span> Platform CRM &amp; ERP Modular #1
        </div>
        <h1 class="srw-hero-title">
          Kelola Seluruh Operasional <span>Bisnis Anda dalam Satu Ekosistem</span>
        </h1>
        <p class="srw-hero-subtitle">
          Seruwit CRM menghubungkan rantai pasok, logistik, armada, penjualan, hingga akuntansi dalam arsitektur multi-tenant modular yang siap diskalakan.
        </p>
        <div class="srw-hero-btns">
          <a href="#modul" class="srw-btn-primary">
            🚀 Jelajahi Modul Suite
          </a>
          <a href="/login" class="srw-btn-secondary">
            🔐 Masuk ke Workspace
          </a>
        </div>
      </div>
      
      <div class="srw-hero-visual">
        <div class="srw-dashboard-card">
          <div class="srw-card-header">
            <div class="srw-card-title">
              <span class="srw-live-indicator"></span> Executive Control Center
            </div>
            <span style="color:#64748b; font-size:0.75rem; font-weight:700;">Live Workspace</span>
          </div>
          
          <div class="srw-stats-mini-grid">
            <div class="srw-mini-stat">
              <div class="srw-mini-label">Total Volume Transaksi</div>
              <div class="srw-mini-val">Rp 2.45B</div>
              <div class="srw-mini-trend">↑ +18.4% bulan ini</div>
            </div>
            <div class="srw-mini-stat">
              <div class="srw-mini-label">Modul Aktif</div>
              <div class="srw-mini-val">15 / 15</div>
              <div class="srw-mini-trend" style="color:#4f46e5;">Full Suite Active</div>
            </div>
          </div>
          
          <div class="srw-module-bars">
            <div class="srw-bar-item">
              <div class="srw-bar-info"><span>Supply Chain &amp; Inventory</span><span>94% Utilization</span></div>
              <div class="srw-bar-bg"><div class="srw-bar-fill" style="width: 94%;"></div></div>
            </div>
            <div class="srw-bar-item">
              <div class="srw-bar-info"><span>Fleet &amp; Transportation Live Tracking</span><span>88% Active Units</span></div>
              <div class="srw-bar-bg"><div class="srw-bar-fill" style="width: 88%; background: linear-gradient(90deg, #10b981, #34d399);"></div></div>
            </div>
            <div class="srw-bar-item">
              <div class="srw-bar-info"><span>Sales &amp; POS Automated Invoicing</span><span>99.2% Accuracy</span></div>
              <div class="srw-bar-bg"><div class="srw-bar-fill" style="width: 99%; background: linear-gradient(90deg, #0284c7, #38bdf8);"></div></div>
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
        <div class="srw-metric-num">10K<span>+</span></div>
        <div class="srw-metric-lbl">Transaksi Harian Terproses</div>
      </div>
      <div>
        <div class="srw-metric-num">99.99<span>%</span></div>
        <div class="srw-metric-lbl">Reliabilitas &amp; Uptime System</div>
      </div>
      <div>
        <div class="srw-metric-num">15<span>+</span></div>
        <div class="srw-metric-lbl">Modul Spesialis Siap Pakai</div>
      </div>
      <div>
        <div class="srw-metric-num">500<span>+</span></div>
        <div class="srw-metric-lbl">Enterprise &amp; UMKM Terdaftar</div>
      </div>
    </div>
  </div>
</section>

<!-- MODULAR SUITES GRID -->
<section class="srw-section srw-section-white" id="modul">
  <div class="srw-container">
    <div class="srw-head">
      <span class="srw-head-tag">Ekosistem Lengkap</span>
      <h2 class="srw-head-title">Modul Spesialis Sesuai Skala Bisnis Anda</h2>
      <p class="srw-head-sub">Aktifkan hanya modul yang Anda butuhkan, matikan kapan saja tanpa biaya tersembunyi.</p>
    </div>
    
    <div class="srw-suites-grid">
      <!-- Suite 1 -->
      <div class="srw-suite-card">
        <div class="srw-suite-header">
          <div class="srw-suite-icon srw-icon-cyan">📦</div>
          <div class="srw-suite-title">Supply Chain &amp; Logistik</div>
        </div>
        <p class="srw-suite-desc">Kelola stok gudang, pengadaan barang, manajemen armada kendaraan, rute pengiriman, dan pelacakan GPS real-time secara terpusat.</p>
        <div class="srw-tags-wrap">
          <span class="srw-tag">Inventory</span>
          <span class="srw-tag">Purchasing</span>
          <span class="srw-tag">Outbound</span>
          <span class="srw-tag">Fleet</span>
          <span class="srw-tag">Transportation</span>
          <span class="srw-tag">Live Tracking</span>
        </div>
      </div>

      <!-- Suite 2 -->
      <div class="srw-suite-card">
        <div class="srw-suite-header">
          <div class="srw-suite-icon srw-icon-emerald">🛍️</div>
          <div class="srw-suite-title">Commerce &amp; Penjualan</div>
        </div>
        <p class="srw-suite-desc">Otomatiskan pesanan pelanggan, manajemen tim sales lapangan, Point of Sale (POS) kasir, canvassing, hingga promo perdagangan.</p>
        <div class="srw-tags-wrap">
          <span class="srw-tag">Orders</span>
          <span class="srw-tag">Sales Pipeline</span>
          <span class="srw-tag">POS Kasir</span>
          <span class="srw-tag">Canvassing</span>
          <span class="srw-tag">Trade Promotions</span>
        </div>
      </div>

      <!-- Suite 3 -->
      <div class="srw-suite-card">
        <div class="srw-suite-header">
          <div class="srw-suite-icon srw-icon-amber">💰</div>
          <div class="srw-suite-title">Keuangan &amp; Akuntansi</div>
        </div>
        <p class="srw-suite-desc">Penerbitan faktur otomatis, manajemen piutang (Receivables), utang usaha (Payables), hingga laporan keuangan Buku Besar (Accounting).</p>
        <div class="srw-tags-wrap">
          <span class="srw-tag">Invoicing</span>
          <span class="srw-tag">Receivables</span>
          <span class="srw-tag">Payables</span>
          <span class="srw-tag">General Ledger</span>
          <span class="srw-tag">Midtrans Payment</span>
        </div>
      </div>

      <!-- Suite 4 -->
      <div class="srw-suite-card">
        <div class="srw-suite-header">
          <div class="srw-suite-icon srw-icon-indigo">📊</div>
          <div class="srw-suite-title">Operasional &amp; Governance</div>
        </div>
        <p class="srw-suite-desc">Alur persetujuan bertingkat (Approvals), manajemen dokumen legal/kontrak, analitik bisnis, dan Executive Dashboard eksekutif.</p>
        <div class="srw-tags-wrap">
          <span class="srw-tag">Workflow Approvals</span>
          <span class="srw-tag">Document Center</span>
          <span class="srw-tag">Analytics</span>
          <span class="srw-tag">Executive Dashboard</span>
          <span class="srw-tag">Role Permissions</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- PLATFORM ADVANTAGES -->
<section class="srw-section srw-section-soft" id="keunggulan">
  <div class="srw-container">
    <div class="srw-head">
      <span class="srw-head-tag">Mengapa Seruwit CRM?</span>
      <h2 class="srw-head-title">Didesain Spesifik untuk Skalabilitas Enterprise</h2>
    </div>
    
    <div class="srw-feat-grid">
      <div class="srw-feat-card">
        <div class="srw-feat-icon">🏢</div>
        <h3 class="srw-feat-title">Multi-Tenant Isolation</h3>
        <p class="srw-feat-desc">Setiap workspace memiliki isolasi data penuh, database mandiri, dan domain khusus untuk menjamin privasi dan keamanan tinggi.</p>
      </div>

      <div class="srw-feat-card">
        <div class="srw-feat-icon">🧩</div>
        <h3 class="srw-feat-title">Plug &amp; Play Modules</h3>
        <p class="srw-feat-desc">Aktifkan atau nonaktifkan modul secara instan dari modul registry tanpa mengganggu stabilitas sistem secara keseluruhan.</p>
      </div>

      <div class="srw-feat-card">
        <div class="srw-feat-icon">🔒</div>
        <h3 class="srw-feat-title">Role-Based Access Control</h3>
        <p class="srw-feat-desc">Atur hak akses pengguna secara mendalam hingga ke tingkat action (view, create, update, delete) pada setiap modul.</p>
      </div>

      <div class="srw-feat-card">
        <div class="srw-feat-icon">📍</div>
        <h3 class="srw-feat-title">Telematika &amp; Geocoding</h3>
        <p class="srw-feat-desc">Integrasi peta real-time untuk pelacakan armada pengiriman, titik koordinat penjemputan, dan rute otomatis.</p>
      </div>

      <div class="srw-feat-card">
        <div class="srw-feat-icon">📈</div>
        <h3 class="srw-feat-title">Real-Time Analytics</h3>
        <p class="srw-feat-desc">Visualisasi performa bisnis, pendapatan harian, hingga penilaian pengemudi (Driver Scoring) secara akurat.</p>
      </div>

      <div class="srw-feat-card">
        <div class="srw-feat-icon">📱</div>
        <h3 class="srw-feat-title">Mobile PWA Ready</h3>
        <p class="srw-feat-desc">Akses lancar dari perangkat seluler untuk booking mandiri pelanggan, aplikasi pengemudi, maupun kasir POS.</p>
      </div>
    </div>
  </div>
</section>

<!-- STEPS WORKFLOW -->
<section class="srw-section srw-section-white" id="cara-kerja">
  <div class="srw-container">
    <div class="srw-head">
      <span class="srw-head-tag">Langkah Mudah</span>
      <h2 class="srw-head-title">Mulai Hanya Dalam 3 Langkah Sederhana</h2>
    </div>
    
    <div class="srw-steps-grid">
      <div class="srw-step-item">
        <div class="srw-step-badge">1</div>
        <h3 class="srw-step-title">Daftar &amp; Buat Workspace</h3>
        <p class="srw-step-desc">Daftarkan akun perusahaan Anda dan buat workspace khusus dengan subdomain yang unik dalam hitungan detik.</p>
      </div>

      <div class="srw-step-item">
        <div class="srw-step-badge">2</div>
        <h3 class="srw-step-title">Pilih &amp; Aktifkan Modul</h3>
        <p class="srw-step-desc">Pilih modul yang sesuai kebutuhan bisnis Anda dari katalog modul lengkap (Rental, Logistics, Commerce, Finance).</p>
      </div>

      <div class="srw-step-item">
        <div class="srw-step-badge">3</div>
        <h3 class="srw-step-title">Kelola Operasional &amp; Scale</h3>
        <p class="srw-step-desc">Undang tim Anda, atur hak akses, dan mulai otomatisasi operasional bisnis Anda dari satu dashboard terpadu.</p>
      </div>
    </div>
  </div>
</section>

<!-- PRICING PREVIEW -->
<section class="srw-section srw-section-soft" id="harga">
  <div class="srw-container">
    <div class="srw-head">
      <span class="srw-head-tag">Paket Langganan</span>
      <h2 class="srw-head-title">Pilihan Paket Sesuai Kebutuhan Anda</h2>
      <p class="srw-head-sub">Transparan tanpa biaya tersembunyi. Tingkatkan paket kapan saja saat bisnis Anda berkembang.</p>
    </div>
    
    <div class="srw-price-grid">
      <!-- Plan 1 -->
      <div class="srw-price-card">
        <div class="srw-price-plan">Starter</div>
        <div class="srw-price-sub">Cocok untuk bisnis berkembang yang butuh fondasi CRM.</div>
        <div class="srw-price-val">Rp 499K <small>/ bulan</small></div>
        <ul class="srw-price-list">
          <li><span>✓</span> Hingga 5 Pengguna Workspace</li>
          <li><span>✓</span> Modul Sales &amp; Orders</li>
          <li><span>✓</span> Modul Inventory Basic</li>
          <li><span>✓</span> Invoicing &amp; Billing</li>
          <li><span>✓</span> Support Email 24/7</li>
        </ul>
        <a href="/login" class="srw-btn-plan srw-btn-plan-outline">Mulai Pakai Starter</a>
      </div>

      <!-- Plan 2 (Featured) -->
      <div class="srw-price-card featured">
        <div class="srw-featured-badge">Paling Populer</div>
        <div class="srw-price-plan">Business Pro</div>
        <div class="srw-price-sub">Solusi lengkap untuk perusahaan logistik, rental, &amp; perdagangan.</div>
        <div class="srw-price-val">Rp 1.299K <small>/ bulan</small></div>
        <ul class="srw-price-list">
          <li><span>✓</span> Hingga 25 Pengguna Workspace</li>
          <li><span>✓</span> Semua Modul Supply Chain &amp; Logistics</li>
          <li><span>✓</span> Fleet, Transportation &amp; Live Tracking</li>
          <li><span>✓</span> Multi-Tier Approvals &amp; Documents</li>
          <li><span>✓</span> Integration Midtrans Payment</li>
          <li><span>✓</span> Support Priority Telepon &amp; Chat</li>
        </ul>
        <a href="/login" class="srw-btn-plan srw-btn-plan-solid">Coba Gratis Pro</a>
      </div>

      <!-- Plan 3 -->
      <div class="srw-price-card">
        <div class="srw-price-plan">Enterprise</div>
        <div class="srw-price-sub">Untuk perusahaan besar dengan kebutuhan kustomisasi khusus.</div>
        <div class="srw-price-val">Kustom <small>/ tahunan</small></div>
        <ul class="srw-price-list">
          <li><span>✓</span> Unlimited Pengguna &amp; Workspace</li>
          <li><span>✓</span> Akses Seluruh 15+ Modul Platform</li>
          <li><span>✓</span> Dedicated Infrastructure &amp; SLA 99.99%</li>
          <li><span>✓</span> Kustomisasi Modul &amp; Integration API</li>
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
      <span class="srw-head-tag">Kata Pemimpin Bisnis</span>
      <h2 class="srw-head-title">Dipercaya Oleh Berbagai Sektor Industri</h2>
    </div>
    
    <div class="srw-testi-grid">
      <div class="srw-testi-card">
        <div>
          <div class="srw-stars">★★★★★</div>
          <p class="srw-testi-quote">"Seruwit CRM mengubah efisiensi armada rental kami secara drastis. Pelacakan GPS real-time dan sistem booking terintegrasi langsung dengan faktur otomatis."</p>
        </div>
        <div class="srw-testi-user">
          <div class="srw-testi-avatar">BS</div>
          <div>
            <div class="srw-testi-name">Budi Santoso</div>
            <div class="srw-testi-role">Director · Trans Nusantara Logistik</div>
          </div>
        </div>
      </div>

      <div class="srw-testi-card">
        <div>
          <div class="srw-stars">★★★★★</div>
          <p class="srw-testi-quote">"Modul persetujuan bertingkat (Approvals) dan POS Kasir sangat membantu pengelolaan cabang kami di 5 kota. Pembukuan kini akurat dan transparan."</p>
        </div>
        <div class="srw-testi-user">
          <div class="srw-testi-avatar">RH</div>
          <div>
            <div class="srw-testi-name">Ratna Hapsari</div>
            <div class="srw-testi-role">Head of Ops · Mega Commerce Indonesia</div>
          </div>
        </div>
      </div>

      <div class="srw-testi-card">
        <div>
          <div class="srw-stars">★★★★★</div>
          <p class="srw-testi-quote">"Arsitektur modularnya sangat fleksibel. Kami bisa mengaktifkan modul pengadaan dan persediaan barang sesuai kecepatan pertumbuhan cabang kami."</p>
        </div>
        <div class="srw-testi-user">
          <div class="srw-testi-avatar">AP</div>
          <div>
            <div class="srw-testi-name">Aditya Pratama</div>
            <div class="srw-testi-role">VP Technology · Global Supply Chain</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA BANNER -->
<section class="srw-cta-section">
  <div class="srw-container">
    <h2 class="srw-cta-title">Siap Mentransformasi Operasional Bisnis Anda?</h2>
    <p class="srw-cta-desc">Bergabunglah dengan ratusan perusahaan yang mengoptimalkan rantai pasok dan penjualan dengan Seruwit CRM.</p>
    <a href="/workspaces" class="srw-btn-cta">
      ⚡ Masuk Ke Workspace Sekarang
    </a>
  </div>
</section>

<!-- FOOTER -->
<footer class="srw-footer">
  <div class="srw-container">
    <div class="srw-footer-grid">
      <div class="srw-footer-brand">
        <h3>⚡ Seruwit CRM</h3>
        <p>Platform Enterprise Modular CRM &amp; ERP terpadu untuk rantai pasok, armada, penjualan, dan akuntansi modern.</p>
      </div>
      
      <div class="srw-footer-col">
        <h4>Modul Suite</h4>
        <ul>
          <li><a href="#modul">Supply Chain &amp; Logistics</a></li>
          <li><a href="#modul">Commerce &amp; Penjualan</a></li>
          <li><a href="#modul">Keuangan &amp; Akuntansi</a></li>
          <li><a href="#modul">Workflow Approvals</a></li>
        </ul>
      </div>

      <div class="srw-footer-col">
        <h4>Platform</h4>
        <ul>
          <li><a href="/workspaces">Portal Workspace</a></li>
          <li><a href="#keunggulan">Multi-Tenant Isolation</a></li>
          <li><a href="#harga">Paket Langganan</a></li>
          <li><a href="/login">Portal Admin</a></li>
        </ul>
      </div>

      <div class="srw-footer-col">
        <h4>Legal &amp; Kontak</h4>
        <ul>
          <li><a href="/terms">Syarat &amp; Ketentuan</a></li>
          <li><a href="/privacy">Kebijakan Privasi</a></li>
          <li><a href="mailto:info@seruwit.com">info@seruwit.com</a></li>
          <li><a href="#">Support 24/7</a></li>
        </ul>
      </div>
    </div>

    <div class="srw-footer-bottom">
      <div>© 2026 Seruwit CRM. Seluruh Hak Cipta Dilindungi.</div>
      <div>Platform Modular CRM &amp; ERP Enterprise.</div>
    </div>
  </div>
</footer>

</div><!-- /.srw-landing-root -->
HTML;
    }
}
