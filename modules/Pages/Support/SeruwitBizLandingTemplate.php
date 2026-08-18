<?php

namespace Modules\Pages\Support;

class SeruwitBizLandingTemplate
{
    /**
     * Build the data array for the Seruwit Biz modern bright & soft landing page.
     *
     * @return array{title: string, slug: string, html: string, css: string, gjs_data: null}
     */
    public static function build(): array
    {
        $css = self::css();
        $html = self::html();

        return [
            'title' => 'Seruwit Biz – All-in-One Business OS & Smart Commerce Platform',
            'slug' => 'seruwit-biz',
            'html' => '<style>'.$css.'</style>'."\n".$html,
            'css' => $css,
            'gjs_data' => null,
        ];
    }

    public static function css(): string
    {
        return <<<'CSS'
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

.srw-biz-root {
    --srw-bg-base: #f8fafc;
    --srw-bg-white: #ffffff;
    --srw-bg-soft-blue: #f0f7ff;
    --srw-bg-soft-purple: #fbf5ff;
    --srw-bg-soft-emerald: #f0fdf4;
    
    --srw-indigo: #6366f1;
    --srw-indigo-dark: #4338ca;
    --srw-violet: #8b5cf6;
    --srw-sky: #0ea5e9;
    --srw-emerald: #10b981;
    --srw-rose: #f43f5e;
    --srw-amber: #f59e0b;
    
    --srw-grad-brand: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
    --srw-grad-primary: linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%);
    --srw-grad-accent: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    --srw-grad-text: linear-gradient(135deg, #4338ca 0%, #6366f1 40%, #0ea5e9 80%, #10b981 100%);
    
    --srw-grad-hero-bg: radial-gradient(circle at 50% -15%, rgba(99, 102, 241, 0.12) 0%, transparent 60%),
                        radial-gradient(circle at 85% 30%, rgba(236, 72, 153, 0.08) 0%, transparent 45%),
                        radial-gradient(circle at 15% 65%, rgba(14, 165, 233, 0.08) 0%, transparent 50%),
                        radial-gradient(circle at 75% 85%, rgba(16, 185, 129, 0.06) 0%, transparent 40%);

    --srw-text-dark: #0f172a;
    --srw-text-main: #334155;
    --srw-text-muted: #64748b;
    --srw-border: #e2e8f0;
    --srw-border-soft: rgba(226, 232, 240, 0.7);

    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--srw-text-main);
    background-color: var(--srw-bg-base);
    line-height: 1.6;
    width: 100%;
    overflow-x: hidden;
}

.srw-biz-root *, 
.srw-biz-root *::before, 
.srw-biz-root *::after {
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
    background: var(--srw-grad-brand);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 1.2rem;
    box-shadow: 0 6px 18px rgba(99, 102, 241, 0.35);
}
.srw-brand-badge {
    background: #fdf4ff;
    color: #a855f7;
    font-size: 0.7rem;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 50px;
    border: 1px solid #f0abfc;
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
    color: var(--srw-indigo) !important;
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
    background: var(--srw-bg-soft-blue);
    color: var(--srw-indigo) !important;
}
.srw-btn-portal {
    background: var(--srw-grad-brand);
    color: #ffffff !important;
    padding: 11px 26px;
    border-radius: 50px;
    font-size: 0.9rem;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 4px 18px rgba(168, 85, 247, 0.35);
    transition: all 0.2s;
    white-space: nowrap;
}
.srw-btn-portal:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(168, 85, 247, 0.5);
}

/* HERO SECTION */
.srw-hero {
    position: relative;
    padding: 95px 0 100px;
    background: var(--srw-grad-hero-bg), var(--srw-bg-base);
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
    border: 1px solid #e0e7ff;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
    padding: 7px 20px;
    border-radius: 50px;
    color: #4338ca;
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
    background: #a855f7;
    box-shadow: 0 0 10px #a855f7;
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
    background: var(--srw-grad-brand);
    color: #ffffff !important;
    padding: 16px 34px;
    border-radius: 50px;
    font-size: 1rem;
    font-weight: 700;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 8px 26px rgba(99, 102, 241, 0.38);
    transition: all 0.2s;
}
.srw-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(99, 102, 241, 0.52);
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
    background: var(--srw-bg-soft-blue);
    border-color: #c7d2fe;
    transform: translateY(-1px);
}

/* HERO DASHBOARD WIDGET */
.srw-dashboard-card {
    background: #ffffff;
    border: 1px solid var(--srw-border);
    border-radius: 26px;
    padding: 28px;
    box-shadow: 0 24px 60px rgba(99, 102, 241, 0.08);
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
    background: var(--srw-bg-soft-purple);
    border: 1px solid #f0abfc;
    border-radius: 16px;
    padding: 16px 18px;
}
.srw-mini-label {
    font-size: 0.72rem;
    color: #9333ea;
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
    background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
}

/* METRICS BAR */
.srw-metrics-section {
    background: linear-gradient(135deg, #fdf4ff 0%, #eff6ff 100%);
    border-top: 1px solid #e0e7ff;
    border-bottom: 1px solid #e0e7ff;
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
    color: #a855f7;
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
    color: #7e22ce;
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 14px;
    display: inline-block;
    background: #fdf4ff;
    padding: 5px 16px;
    border-radius: 50px;
    border: 1px solid #f0abfc;
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

/* SOLUTION CARDS GRID */
.srw-biz-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
}
.srw-biz-card {
    background: #ffffff;
    border: 1px solid var(--srw-border);
    border-radius: 24px;
    padding: 38px 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
    display: flex;
    flex-direction: column;
}
.srw-biz-card:hover {
    transform: translateY(-6px);
    border-color: #c7d2fe;
    box-shadow: 0 20px 40px rgba(99, 102, 241, 0.12);
}
.srw-biz-icon {
    width: 60px;
    height: 60px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.7rem;
    margin-bottom: 24px;
}
.srw-icon-purple { background: linear-gradient(135deg, #8b5cf6, #a855f7); color: #fff; box-shadow: 0 6px 18px rgba(168, 85, 247, 0.3); }
.srw-icon-sky { background: linear-gradient(135deg, #0284c7, #0ea5e9); color: #fff; box-shadow: 0 6px 18px rgba(14, 165, 233, 0.3); }
.srw-icon-rose { background: linear-gradient(135deg, #e11d48, #f43f5e); color: #fff; box-shadow: 0 6px 18px rgba(244, 63, 94, 0.3); }
.srw-icon-emerald { background: linear-gradient(135deg, #059669, #10b981); color: #fff; box-shadow: 0 6px 18px rgba(16, 185, 129, 0.3); }
.srw-icon-amber { background: linear-gradient(135deg, #d97706, #f59e0b); color: #fff; box-shadow: 0 6px 18px rgba(245, 158, 11, 0.3); }
.srw-icon-indigo { background: linear-gradient(135deg, #4f46e5, #6366f1); color: #fff; box-shadow: 0 6px 18px rgba(79, 70, 229, 0.3); }

.srw-biz-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--srw-text-dark);
    margin: 0 0 12px 0;
}
.srw-biz-desc {
    font-size: 0.94rem;
    color: var(--srw-text-main);
    line-height: 1.65;
    margin: 0 0 20px 0;
    flex: 1;
}
.srw-biz-badge-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.srw-biz-tag {
    background: #f8fafc;
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
    background: var(--srw-grad-brand);
    color: #ffffff;
    font-size: 1.25rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 22px auto;
    box-shadow: 0 8px 22px rgba(168, 85, 247, 0.35);
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
    border: 2px solid #a855f7;
    box-shadow: 0 16px 40px rgba(168, 85, 247, 0.16);
}
.srw-featured-badge {
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--srw-grad-brand);
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
    color: #9333ea !important;
    border: 1.5px solid #a855f7;
}
.srw-btn-plan-outline:hover {
    background: var(--srw-bg-soft-purple);
}
.srw-btn-plan-solid {
    background: var(--srw-grad-brand);
    color: #ffffff !important;
    box-shadow: 0 6px 22px rgba(168, 85, 247, 0.38);
}
.srw-btn-plan-solid:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(168, 85, 247, 0.52);
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
    background: var(--srw-grad-brand);
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
    background: linear-gradient(135deg, #4f46e5 0%, #9333ea 50%, #db2777 100%);
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
    color: #7e22ce !important;
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
    color: #f472b6 !important;
}
.srw-footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 28px;
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
    .srw-biz-grid {
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
    .srw-biz-grid,
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
<div class="srw-biz-root">

<!-- NAVBAR -->
<nav class="srw-navbar">
  <div class="srw-container">
    <div class="srw-nav-inner">
      <a href="/" class="srw-brand">
        <span class="srw-brand-icon">⚡</span>
        Seruwit Biz
        <span class="srw-brand-badge">Business OS</span>
      </a>
      <ul class="srw-nav-links">
        <li><a href="#solusi">Solusi Bisnis</a></li>
        <li><a href="#ekosistem">Ekosistem</a></li>
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
          <span class="srw-pill-dot"></span> All-in-One Business Operating System
        </div>
        <h1 class="srw-hero-title">
          Akselerasi Omset &amp; Efisiensi <span>Bisnis Anda dalam Satu Ekosistem Pintar</span>
        </h1>
        <p class="srw-hero-subtitle">
          Seruwit Biz mengintegrasikan penjualan omni-channel, kasir POS multi-outlet, manajemen stok gudang, penagihan invoice otomatis, hingga laporan keuangan laba-rugi secara terpadu.
        </p>
        <div class="srw-hero-btns">
          <a href="#solusi" class="srw-btn-primary">
            🚀 Jelajahi Solusi Bisnis
          </a>
          <a href="/workspaces" class="srw-btn-secondary">
            ⚡ Coba Demo Interaktif
          </a>
        </div>
      </div>
      
      <div class="srw-hero-visual">
        <div class="srw-dashboard-card">
          <div class="srw-card-header">
            <div class="srw-card-title">
              <span class="srw-live-indicator"></span> Commerce Hub Control Center
            </div>
            <span style="color:#9333ea; font-size:0.78rem; font-weight:800;">Realtime Live Stream</span>
          </div>
          
          <div class="srw-stats-mini-grid">
            <div class="srw-mini-stat">
              <div class="srw-mini-label">Total Omset Penjualan</div>
              <div class="srw-mini-val">Rp 458.2M</div>
              <div class="srw-mini-trend">↑ +28.4% bulan ini</div>
            </div>
            <div class="srw-mini-stat">
              <div class="srw-mini-label">Transaksi Berhasil</div>
              <div class="srw-mini-val">12,840 Trx</div>
              <div class="srw-mini-trend" style="color:#7e22ce;">Omni-Channel Active</div>
            </div>
          </div>
          
          <div class="srw-module-bars">
            <div class="srw-bar-item">
              <div class="srw-bar-info"><span>POS Kasir &amp; Outlet Retail</span><span>98.6% Target Tercapai</span></div>
              <div class="srw-bar-bg"><div class="srw-bar-fill" style="width: 98%;"></div></div>
            </div>
            <div class="srw-bar-item">
              <div class="srw-bar-info"><span>Inventaris &amp; Multi-Gudang Terhubung</span><span>94% Efisiensi Stok</span></div>
              <div class="srw-bar-bg"><div class="srw-bar-fill" style="width: 94%; background: linear-gradient(90deg, #0ea5e9, #38bdf8);"></div></div>
            </div>
            <div class="srw-bar-item">
              <div class="srw-bar-info"><span>Otomatisasi Penagihan &amp; Pembukuan</span><span>100% Rekonsiliasi Otomatis</span></div>
              <div class="srw-bar-bg"><div class="srw-bar-fill" style="width: 100%; background: linear-gradient(90deg, #10b981, #34d399);"></div></div>
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
        <div class="srw-metric-num">25K<span>+</span></div>
        <div class="srw-metric-lbl">Pelanggan Aktif Terlayani</div>
      </div>
      <div>
        <div class="srw-metric-num">99.9<span>%</span></div>
        <div class="srw-metric-lbl">Uptime &amp; Kecepatan Server</div>
      </div>
      <div>
        <div class="srw-metric-num">3x<span>+</span></div>
        <div class="srw-metric-lbl">Peningkatan Efisiensi Operasional</div>
      </div>
      <div>
        <div class="srw-metric-num">100<span>%</span></div>
        <div class="srw-metric-lbl">Data Terenkripsi &amp; Aman</div>
      </div>
    </div>
  </div>
</section>

<!-- MAIN SOLUTIONS GRID -->
<section class="srw-section srw-section-white" id="solusi">
  <div class="srw-container">
    <div class="srw-head">
      <span class="srw-head-tag">Solusi Bisnis Komprehensif</span>
      <h2 class="srw-head-title">Satu Platform untuk Seluruh Kebutuhan Usaha</h2>
      <p class="srw-head-sub">Tingkatkan produktivitas tim dan kepuasan pelanggan dengan alat bantu modern yang siap pakai.</p>
    </div>
    
    <div class="srw-biz-grid">
      <!-- Solution 1 -->
      <div class="srw-biz-card">
        <div class="srw-biz-icon srw-icon-purple">🛍️</div>
        <h3 class="srw-biz-title">Smart POS &amp; Kasir Multi-Cabang</h3>
        <p class="srw-biz-desc">Sistem kasir cepat yang mendukung scanner barcode, pembayaran QRIS/kartu, cetak struk thermal, hingga pengiriman nota via WhatsApp.</p>
        <div class="srw-biz-badge-list">
          <span class="srw-biz-tag">Multi-Outlet</span>
          <span class="srw-biz-tag">QRIS Dinamis</span>
          <span class="srw-biz-tag">Struk Digital WA</span>
        </div>
      </div>

      <!-- Solution 2 -->
      <div class="srw-biz-card">
        <div class="srw-biz-icon srw-icon-sky">📦</div>
        <h3 class="srw-biz-title">Manajemen Stok &amp; Multi-Gudang</h3>
        <p class="srw-biz-desc">Sinkronisasi stok barang real-time di semua cabang, alur mutasi barang antar gudang, dan notifikasi pintar saat stok menipis.</p>
        <div class="srw-biz-badge-list">
          <span class="srw-biz-tag">Real-Time Sync</span>
          <span class="srw-biz-tag">Mutasi Stok</span>
          <span class="srw-biz-tag">Low Stock Alert</span>
        </div>
      </div>

      <!-- Solution 3 -->
      <div class="srw-biz-card">
        <div class="srw-biz-icon srw-icon-rose">💳</div>
        <h3 class="srw-biz-title">Faktur &amp; Penagihan Piutang Otomatis</h3>
        <p class="srw-biz-desc">Buat invoice profesional dalam hitungan detik. Dilengkapi payment link otomatis dan reminder tagihan jatuh tempo ke WhatsApp pelanggan.</p>
        <div class="srw-biz-badge-list">
          <span class="srw-biz-tag">Payment Link</span>
          <span class="srw-biz-tag">Auto Reminder</span>
          <span class="srw-biz-tag">Rekonsiliasi Bank</span>
        </div>
      </div>

      <!-- Solution 4 -->
      <div class="srw-biz-card">
        <div class="srw-biz-icon srw-icon-emerald">📊</div>
        <h3 class="srw-biz-title">Laporan Keuangan &amp; Laba Rugi</h3>
        <p class="srw-biz-desc">Pembukuan otomatis tanpa rumus akuntansi rumit. Pantau arus kas harian, margin laba per produk, dan neraca keuangan instan.</p>
        <div class="srw-biz-badge-list">
          <span class="srw-biz-tag">Laba / Rugi Realtime</span>
          <span class="srw-biz-tag">Arus Kas</span>
          <span class="srw-biz-tag">Buku Besar</span>
        </div>
      </div>

      <!-- Solution 5 -->
      <div class="srw-biz-card">
        <div class="srw-biz-icon srw-icon-amber">👥</div>
        <h3 class="srw-biz-title">Loyalty Pelanggan &amp; Promo Diskon</h3>
        <p class="srw-biz-desc">Kelola database pelanggan, riwayat belanja, skema diskon bertingkat, voucher promo, dan program poin reward loyalitas.</p>
        <div class="srw-biz-badge-list">
          <span class="srw-biz-tag">Poin Reward</span>
          <span class="srw-biz-tag">Voucher Promo</span>
          <span class="srw-biz-tag">Database CRM</span>
        </div>
      </div>

      <!-- Solution 6 -->
      <div class="srw-biz-card">
        <div class="srw-biz-icon srw-icon-indigo">📱</div>
        <h3 class="srw-biz-title">Mobile Business Dashboard (PWA)</h3>
        <p class="srw-biz-desc">Akses seluruh ringkasan bisnis dari smartphone Anda. Beri otorisasi diskon kasir, cek laporan harian, dan setujui pengadaan di mana saja.</p>
        <div class="srw-biz-badge-list">
          <span class="srw-biz-tag">Akses HP &amp; Tablet</span>
          <span class="srw-biz-tag">Approval Cepat</span>
          <span class="srw-biz-tag">Live Analytics</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- PLATFORM ADVANTAGES -->
<section class="srw-section srw-section-soft" id="ekosistem">
  <div class="srw-container">
    <div class="srw-head">
      <span class="srw-head-tag">Keunggulan Seruwit Biz</span>
      <h2 class="srw-head-title">Mengapa Pebisnis Memilih Seruwit Biz?</h2>
    </div>
    
    <div class="srw-biz-grid">
      <div class="srw-biz-card">
        <div class="srw-biz-icon srw-icon-purple">⚡</div>
        <h3 class="srw-biz-title">Setup Kilat dalam 5 Menit</h3>
        <p class="srw-biz-desc">Daftar, import daftar produk melalui Excel/CSV, dan langsung gunakan sistem kasir &amp; penagihan tanpa instalasi rumit.</p>
      </div>

      <div class="srw-biz-card">
        <div class="srw-biz-icon srw-icon-emerald">🛡️</div>
        <h3 class="srw-biz-title">Keamanan Cloud Terjamin</h3>
        <p class="srw-biz-desc">Enkripsi data tingkat tinggi dan backup otomatis harian memastikan data transaksi bisnis Anda selalu aman dan terlindungi.</p>
      </div>

      <div class="srw-biz-card">
        <div class="srw-biz-icon srw-icon-sky">🤝</div>
        <h3 class="srw-biz-title">Dukungan CS Prioritas 24/7</h3>
        <p class="srw-biz-desc">Tim pendamping teknis siap membantu Anda melalui WhatsApp dan panggilan langsung kapan pun Anda membutuhkan asistensi.</p>
      </div>
    </div>
  </div>
</section>

<!-- STEPS WORKFLOW -->
<section class="srw-section srw-section-white" id="cara-kerja">
  <div class="srw-container">
    <div class="srw-head">
      <span class="srw-head-tag">Langkah Sederhana</span>
      <h2 class="srw-head-title">Mulai Kembangkan Bisnis Hanya 4 Langkah</h2>
    </div>
    
    <div class="srw-steps-grid">
      <div class="srw-step-item">
        <div class="srw-step-badge">1</div>
        <h3 class="srw-step-title">Buat Workspace</h3>
        <p class="srw-step-desc">Daftarkan usaha Anda dan buat subdomain workspace bisnis khusus dalam hitungan detik.</p>
      </div>

      <div class="srw-step-item">
        <div class="srw-step-badge">2</div>
        <h3 class="srw-step-title">Input Produk &amp; Stok</h3>
        <p class="srw-step-desc">Unggah data barang, harga jual, dan jumlah stok awal secara mudah lewat spreadsheet.</p>
      </div>

      <div class="srw-step-item">
        <div class="srw-step-badge">3</div>
        <h3 class="srw-step-title">Hubungkan Tim Kasir</h3>
        <p class="srw-step-desc">Tambahkan anggota tim toko, atur hak akses kasir, dan aktifkan POS kasir cabang.</p>
      </div>

      <div class="srw-step-item">
        <div class="srw-step-badge">4</div>
        <h3 class="srw-step-title">Pantau &amp; Scale Up</h3>
        <p class="srw-step-desc">Saksikan grafik omset berkembang dan nikmati otomatisasi pembukuan tanpa repot.</p>
      </div>
    </div>
  </div>
</section>

<!-- PRICING PREVIEW -->
<section class="srw-section srw-section-soft" id="harga">
  <div class="srw-container">
    <div class="srw-head">
      <span class="srw-head-tag">Investasi Bisnis Cerdas</span>
      <h2 class="srw-head-title">Paket Harga Transparan Sesuai Tahap Bisnis</h2>
      <p class="srw-head-sub">Investasi terjangkau untuk sistem operasional bisnis yang lengkap tanpa biaya tersembunyi.</p>
    </div>
    
    <div class="srw-price-grid">
      <!-- Plan 1 -->
      <div class="srw-price-card">
        <div class="srw-price-plan">Biz Starter</div>
        <div class="srw-price-sub">Cocok untuk toko ritel atau cafe 1 cabang.</div>
        <div class="srw-price-val">Rp 199K <small>/ bulan</small></div>
        <ul class="srw-price-list">
          <li><span>✓</span> 1 Outlet &amp; 3 Akun Kasir</li>
          <li><span>✓</span> Smart POS Kasir &amp; Barcode</li>
          <li><span>✓</span> Manajemen Stok Gudang Basic</li>
          <li><span>✓</span> Struk Nota Digital WhatsApp</li>
          <li><span>✓</span> Support Email &amp; Chat</li>
        </ul>
        <a href="/login" class="srw-btn-plan srw-btn-plan-outline">Mulai Pakai Starter</a>
      </div>

      <!-- Plan 2 (Featured) -->
      <div class="srw-price-card featured">
        <div class="srw-featured-badge">Paling Diminati</div>
        <div class="srw-price-plan">Biz Growth Pro</div>
        <div class="srw-price-sub">Solusi lengkap untuk bisnis multi-cabang berkembang.</div>
        <div class="srw-price-val">Rp 499K <small>/ bulan</small></div>
        <ul class="srw-price-list">
          <li><span>✓</span> Hingga 5 Outlet Cabang &amp; Multi-Gudang</li>
          <li><span>✓</span> Faktur &amp; Penagihan Piutang Otomatis</li>
          <li><span>✓</span> Payment Gateway QRIS &amp; Midtrans</li>
          <li><span>✓</span> Program Poin &amp; Loyalty Member CRM</li>
          <li><span>✓</span> Laporan Laba Rugi &amp; Arus Kas Instan</li>
          <li><span>✓</span> Support Prioritas WhatsApp 24/7</li>
        </ul>
        <a href="/login" class="srw-btn-plan srw-btn-plan-solid">Coba Gratis Pro 14 Hari</a>
      </div>

      <!-- Plan 3 -->
      <div class="srw-price-card">
        <div class="srw-price-plan">Biz Enterprise</div>
        <div class="srw-price-sub">Untuk perusahaan distribusi &amp; ritel jaringan besar.</div>
        <div class="srw-price-val">Kustom <small>/ tahunan</small></div>
        <ul class="srw-price-list">
          <li><span>✓</span> Unlimited Outlet &amp; Multi-Cabang</li>
          <li><span>✓</span> Integrasi API Custom &amp; ERP Accounting</li>
          <li><span>✓</span> Dedicated Server &amp; SLA 99.99%</li>
          <li><span>✓</span> On-Site Training Tim Lapangan</li>
          <li><span>✓</span> Dedicated Business Account Manager</li>
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
      <span class="srw-head-tag">Kata Para Pebisnis</span>
      <h2 class="srw-head-title">Cerita Sukses Bersama Seruwit Biz</h2>
    </div>
    
    <div class="srw-testi-grid">
      <div class="srw-testi-card">
        <div>
          <div class="srw-stars">★★★★★</div>
          <p class="srw-testi-quote">"Seruwit Biz mempermudah pengelolaan 4 cabang kedai kopi kami. Stok biji kopi dan syrup otomatis terpotong saat kasir input transaksi."</p>
        </div>
        <div class="srw-testi-user">
          <div class="srw-testi-avatar">RA</div>
          <div>
            <div class="srw-testi-name">Reza Ardiansyah</div>
            <div class="srw-testi-role">Owner · Senja Roastery &amp; Coffee</div>
          </div>
        </div>
      </div>

      <div class="srw-testi-card">
        <div>
          <div class="srw-stars">★★★★★</div>
          <p class="srw-testi-quote">"Fitur penagihan invoice otomatis dan QRIS dynamic mempercepat perputaran piutang grosir kami. Arus kas toko jadi sangat lancar."</p>
        </div>
        <div class="srw-testi-user">
          <div class="srw-testi-avatar">HL</div>
          <div>
            <div class="srw-testi-name">Hendra Lie</div>
            <div class="srw-testi-role">Managing Director · Mega Jaya Distribusi</div>
          </div>
        </div>
      </div>

      <div class="srw-testi-card">
        <div>
          <div class="srw-stars">★★★★★</div>
          <p class="srw-testi-quote">"Tampilan dashboard-nya sangat segar, modern, dan tidak bikin pusing. Laporan laba rugi bulanan langsung jadi tanpa perlu hire akuntan tambahan."</p>
        </div>
        <div class="srw-testi-user">
          <div class="srw-testi-avatar">MA</div>
          <div>
            <div class="srw-testi-name">Maya Anggraini</div>
            <div class="srw-testi-role">Founder · Chic Fashion Boutiques</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA BANNER -->
<section class="srw-cta-section">
  <div class="srw-container">
    <h2 class="srw-cta-title">Siap Membawa Bisnis Anda ke Level Berikutnya?</h2>
    <p class="srw-cta-desc">Bergabunglah dengan ribuan pengusaha yang telah mengotomatisasi operasional toko dan penjualannya dengan Seruwit Biz.</p>
    <a href="/workspaces" class="srw-btn-cta">
      ⚡ Mulai Coba Gratis Seruwit Biz
    </a>
  </div>
</section>

<!-- FOOTER -->
<footer class="srw-footer">
  <div class="srw-container">
    <div class="srw-footer-grid">
      <div class="srw-footer-brand">
        <h3>⚡ Seruwit Biz</h3>
        <p>All-in-One Business OS &amp; Smart Commerce Platform untuk percepatan omset dan efisiensi operasional bisnis modern.</p>
      </div>
      
      <div class="srw-footer-col">
        <h4>Solusi Bisnis</h4>
        <ul>
          <li><a href="#solusi">Smart POS Kasir</a></li>
          <li><a href="#solusi">Manajemen Stok Multi-Gudang</a></li>
          <li><a href="#solusi">Faktur &amp; Invoice Otomatis</a></li>
          <li><a href="#solusi">Laporan Keuangan Instan</a></li>
        </ul>
      </div>

      <div class="srw-footer-col">
        <h4>Platform</h4>
        <ul>
          <li><a href="/workspaces">Portal Workspace</a></li>
          <li><a href="#ekosistem">Keunggulan Sistem</a></li>
          <li><a href="#harga">Paket Harga Bisnis</a></li>
          <li><a href="/login">Portal Admin</a></li>
        </ul>
      </div>

      <div class="srw-footer-col">
        <h4>Legal &amp; Kontak</h4>
        <ul>
          <li><a href="/terms">Syarat &amp; Ketentuan</a></li>
          <li><a href="/privacy">Kebijakan Privasi</a></li>
          <li><a href="mailto:biz@seruwit.com">biz@seruwit.com</a></li>
          <li><a href="#">Support 24/7 WA</a></li>
        </ul>
      </div>
    </div>

    <div class="srw-footer-bottom">
      <div>© 2026 Seruwit Biz. Seluruh Hak Cipta Dilindungi.</div>
      <div>All-in-One Business OS &amp; Smart Commerce Platform.</div>
    </div>
  </div>
</footer>

</div><!-- /.srw-biz-root -->
HTML;
    }
}
