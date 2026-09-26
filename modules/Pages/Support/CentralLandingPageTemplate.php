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
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

:root {
    --el-font: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    
    --el-bg: #f8fafc;
    --el-bg-surface: #ffffff;
    --el-bg-subtle: #f1f5f9;
    --el-bg-card: #ffffff;
    
    --el-text-main: #0f172a;
    --el-text-body: #334155;
    --el-text-sub: #64748b;
    --el-text-muted: #94a3b8;
    
    --el-teal: #0d9488;
    --el-teal-dark: #0f766e;
    --el-teal-soft: #f0fdfa;
    --el-teal-border: #ccfbf1;
    
    --el-emerald: #059669;
    --el-emerald-soft: #ecfdf5;
    
    --el-cyan: #0284c7;
    --el-cyan-soft: #f0f9ff;
    
    --el-indigo: #4f46e5;
    --el-indigo-soft: #eef2ff;
    
    --el-amber: #d97706;
    --el-amber-soft: #fffbeb;
    
    --el-grad-primary: linear-gradient(135deg, #0d9488 0%, #0284c7 100%);
    --el-grad-text: linear-gradient(135deg, #0f766e 0%, #0284c7 50%, #4338ca 100%);
    
    --el-border: #e2e8f0;
    --el-border-light: #f1f5f9;
    --el-shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02);
    --el-shadow-md: 0 4px 14px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03);
    --el-shadow-lg: 0 14px 28px -4px rgba(15, 23, 42, 0.06), 0 4px 10px -2px rgba(15, 23, 42, 0.03);
}

body {
    display: block !important;
    background-color: var(--el-bg);
    margin: 0;
    padding: 0;
}

.el-root {
    font-family: var(--el-font);
    color: var(--el-text-body);
    background-color: var(--el-bg);
    line-height: 1.6;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    overflow-x: hidden;
    letter-spacing: -0.01em;
    -webkit-font-smoothing: antialiased;
    display: block !important;
}

.el-root *, .el-root *::before, .el-root *::after {
    box-sizing: border-box;
}

.el-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
}

/* FIXED CAPSULE NAVBAR */
.el-nav-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 1000;
    padding: 16px 24px;
    pointer-events: none;
    transition: padding 0.35s cubic-bezier(0.16, 1, 0.3, 1), background 0.35s ease, border-color 0.35s ease;
}
.el-navbar {
    pointer-events: auto;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(226, 232, 240, 0.95);
    border-radius: 100px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 10px 14px 10px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.el-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--el-text-main);
    letter-spacing: -0.02em;
    flex-shrink: 0;
}
.el-brand-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--el-teal), var(--el-cyan));
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
}
.el-brand-img {
    height: 32px;
    max-height: 36px;
    width: auto;
    max-width: 140px;
    object-fit: contain;
    border-radius: 6px;
}
.el-brand-tag {
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    background: var(--el-teal-soft);
    color: var(--el-teal-dark);
    padding: 2px 8px;
    border-radius: 50px;
    border: 1px solid var(--el-teal-border);
}
.el-nav-links {
    display: flex;
    align-items: center;
    gap: 24px;
    list-style: none;
    margin: 0;
    padding: 0;
}
.el-nav-link {
    text-decoration: none;
    color: var(--el-text-body);
    font-size: 0.86rem;
    font-weight: 600;
    transition: all 0.2s ease;
    padding: 6px 12px;
    border-radius: 50px;
}
.el-nav-link:hover {
    color: var(--el-teal-dark);
    background: var(--el-bg-subtle);
}
.el-nav-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
}
.el-btn-ghost {
    background: transparent;
    color: var(--el-text-body);
    font-size: 0.84rem;
    font-weight: 700;
    text-decoration: none;
    padding: 7px 14px;
    border-radius: 50px;
    transition: all 0.2s;
}
.el-btn-ghost:hover {
    color: var(--el-text-main);
    background: var(--el-bg-subtle);
}
.el-btn-glow {
    background: var(--el-grad-primary);
    color: #ffffff !important;
    font-size: 0.84rem;
    font-weight: 800;
    text-decoration: none;
    padding: 8px 20px;
    border-radius: 50px;
    box-shadow: 0 4px 14px rgba(13, 148, 136, 0.25);
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    border: none;
    cursor: pointer;
}
.el-btn-glow:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(13, 148, 136, 0.35);
    filter: brightness(1.05);
}

/* HERO SECTION: COMMAND CENTER SPLIT */
.el-hero {
    position: relative;
    padding: 130px 0 80px 0;
    background: radial-gradient(circle at 80% 20%, rgba(13, 148, 136, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 20% 60%, rgba(2, 132, 199, 0.06) 0%, transparent 50%),
                #f8fafc;
    overflow: hidden;
}
.el-hero-split {
    display: grid;
    grid-template-columns: 1fr 1.15fr;
    gap: 48px;
    align-items: center;
}
.el-hero-copy {
    text-align: left;
}
.el-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #ffffff;
    border: 1px solid var(--el-teal-border);
    padding: 6px 16px;
    border-radius: 50px;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--el-teal-dark);
    margin-bottom: 20px;
    box-shadow: var(--el-shadow-sm);
}
.el-hero-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--el-teal);
    box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.2);
}
.el-hero-h1 {
    font-size: clamp(2.3rem, 3.8vw, 3.4rem);
    font-weight: 900;
    color: var(--el-text-main);
    line-height: 1.16;
    letter-spacing: -0.035em;
    margin: 0 0 18px 0;
}
.el-hero-h1 span {
    background: linear-gradient(135deg, #0f766e 0%, #0284c7 50%, #4338ca 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: #0f766e;
    display: inline;
}
.el-hero-p {
    font-size: 1.05rem;
    color: var(--el-text-body);
    line-height: 1.6;
    margin: 0 0 28px 0;
}
.el-hero-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
}
.el-hero-btn-primary {
    background: var(--el-grad-primary);
    color: #ffffff !important;
    font-size: 0.95rem;
    font-weight: 800;
    text-decoration: none;
    padding: 13px 28px;
    border-radius: 50px;
    box-shadow: 0 6px 20px rgba(13, 148, 136, 0.25);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.25s ease;
}
.el-hero-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 26px rgba(13, 148, 136, 0.35);
}
.el-hero-btn-secondary {
    background: #ffffff;
    color: var(--el-text-body);
    border: 1px solid var(--el-border);
    font-size: 0.95rem;
    font-weight: 700;
    text-decoration: none;
    padding: 13px 24px;
    border-radius: 50px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.25s ease;
}
.el-hero-btn-secondary:hover {
    background: var(--el-bg-subtle);
    color: var(--el-text-main);
    border-color: #cbd5e1;
}
.el-hero-trust-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 20px;
}
.el-trust-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--el-text-sub);
}
.el-trust-chk {
    color: var(--el-emerald);
    font-weight: 900;
    font-size: 0.9rem;
}

/* COMMAND CENTER CANVAS MOCKUP */
.el-canvas-card {
    background: #ffffff;
    border: 1px solid var(--el-border);
    border-radius: 20px;
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.03);
    overflow: hidden;
    position: relative;
}
.el-canvas-header {
    background: #f8fafc;
    padding: 12px 18px;
    border-bottom: 1px solid var(--el-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.el-canvas-dots {
    display: flex;
    gap: 6px;
}
.el-canvas-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
}
.el-dot-red { background: #fb7185; }
.el-dot-yellow { background: #fbbf24; }
.el-dot-green { background: #34d399; }
.el-canvas-title {
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--el-text-sub);
    font-family: monospace;
}
.el-canvas-status {
    font-size: 0.72rem;
    font-weight: 800;
    color: var(--el-emerald);
    background: var(--el-emerald-soft);
    padding: 3px 10px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

/* TIMELINE GANTT MATRIX */
.el-timeline-matrix {
    padding: 18px;
    background: #ffffff;
}
.el-matrix-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f1f5f9;
}
.el-matrix-title {
    font-size: 0.84rem;
    font-weight: 800;
    color: var(--el-text-main);
}
.el-matrix-days {
    display: grid;
    grid-template-columns: 140px repeat(7, 1fr);
    gap: 4px;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--el-text-sub);
    text-align: center;
    margin-bottom: 8px;
    padding: 0 4px;
}
.el-matrix-day-label {
    padding: 4px 2px;
    border-radius: 4px;
}
.el-matrix-day-label.today {
    background: var(--el-teal-soft);
    color: var(--el-teal-dark);
    font-weight: 900;
}
.el-matrix-rows {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.el-matrix-row {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    padding: 10px 12px;
    display: grid;
    grid-template-columns: 140px 1fr;
    align-items: center;
    gap: 12px;
}
.el-unit-meta h5 {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 800;
    color: var(--el-text-main);
}
.el-unit-meta span {
    font-size: 0.68rem;
    color: var(--el-text-sub);
}
.el-gantt-track {
    display: flex;
    gap: 6px;
    align-items: center;
}
.el-gantt-bar {
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 0.72rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.el-gantt-teal {
    background: #ccfbf1;
    color: #0f766e;
    flex: 3;
}
.el-gantt-indigo {
    background: #e0e7ff;
    color: #4338ca;
    flex: 3;
}
.el-gantt-cyan {
    background: #e0f2fe;
    color: #0369a1;
    flex: 4;
}
.el-gantt-empty {
    background: #ffffff;
    border: 1px dashed #cbd5e1;
    color: #94a3b8;
    flex: 1;
    text-align: center;
}

/* FLOATING REVENUE KPI BADGE */
.el-float-kpi {
    margin-top: 14px;
    background: #ffffff;
    border: 1px solid var(--el-border);
    border-radius: 14px;
    padding: 12px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: var(--el-shadow-sm);
}
.el-kpi-block strong {
    font-size: 1.15rem;
    font-weight: 900;
    color: var(--el-text-main);
}
.el-kpi-block span {
    font-size: 0.72rem;
    color: var(--el-text-sub);
    display: block;
}

/* SECTION STYLES */
.el-section {
    padding: 80px 0;
}
.el-section-white {
    background: #ffffff;
}
.el-section-subtle {
    background: #f8fafc;
    border-top: 1px solid var(--el-border);
    border-bottom: 1px solid var(--el-border);
}
.el-head-center {
    text-align: center;
    max-width: 720px;
    margin: 0 auto 50px auto;
}
.el-tag-pill {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--el-teal-dark);
    background: var(--el-teal-soft);
    border: 1px solid var(--el-teal-border);
    padding: 4px 14px;
    border-radius: 50px;
    margin-bottom: 12px;
}
.el-title {
    font-size: clamp(1.8rem, 3.2vw, 2.5rem);
    font-weight: 900;
    color: var(--el-text-main);
    letter-spacing: -0.03em;
    margin: 0 0 14px 0;
    line-height: 1.22;
}
.el-subtitle {
    font-size: 0.98rem;
    color: var(--el-text-body);
    margin: 0;
    line-height: 1.6;
}

/* 3 CORE PILLARS GRID */
.el-pillars-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
}
.el-pillar-card {
    background: #ffffff;
    border: 1px solid var(--el-border);
    border-radius: 22px;
    padding: 34px 28px;
    box-shadow: var(--el-shadow-sm);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.el-pillar-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
    border-color: #cbd5e1;
}
.el-pillar-card.featured {
    border-color: rgba(13, 148, 136, 0.4);
    box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.15), var(--el-shadow-md);
}
.el-pillar-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin-bottom: 22px;
}
.el-icon-teal {
    background: var(--el-teal-soft);
    color: var(--el-teal-dark);
    border: 1px solid var(--el-teal-border);
}
.el-icon-cyan {
    background: var(--el-cyan-soft);
    color: var(--el-cyan);
    border: 1px solid #bae6fd;
}
.el-icon-emerald {
    background: var(--el-emerald-soft);
    color: var(--el-emerald);
    border: 1px solid #a7f3d0;
}
.el-pillar-name {
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--el-text-main);
    margin: 0 0 10px 0;
}
.el-pillar-desc {
    font-size: 0.88rem;
    color: var(--el-text-body);
    line-height: 1.6;
    margin: 0 0 22px 0;
}
.el-pillar-list {
    list-style: none;
    margin: 0;
    padding: 20px 0 0 0;
    border-top: 1px solid var(--el-border-light);
    display: grid;
    gap: 12px;
}
.el-pillar-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.84rem;
    font-weight: 600;
    color: var(--el-text-main);
}
.el-pillar-item .chk {
    color: var(--el-teal);
    font-weight: bold;
}
.el-pillar-footer {
    margin-top: 28px;
    padding-top: 20px;
    border-top: 1px solid var(--el-border-light);
}
.el-pillar-link {
    font-size: 0.84rem;
    font-weight: 800;
    color: var(--el-teal-dark);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

/* MODULAR ECOSYSTEM */
.el-eco-box {
    background: #ffffff;
    border: 1px solid var(--el-border);
    border-radius: 20px;
    padding: 28px;
    box-shadow: var(--el-shadow-sm);
}
.el-eco-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}
.el-eco-icon-sm {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--el-bg-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
}
.el-eco-name {
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--el-text-main);
    margin: 0;
}
.el-eco-summary {
    font-size: 0.88rem;
    color: var(--el-text-sub);
    line-height: 1.55;
    margin: 0 0 18px 0;
}
.el-eco-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}
.el-tag {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    background: var(--el-bg-subtle);
    color: var(--el-text-body);
}

/* PRICING TABLE STYLES (MATCHING PricingTableRenderer) */
.el-pricing-wrapper {
    margin-top: 20px;
}
.el-pricing-toggle-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 36px;
}
.el-pricing-toggle {
    background: #f1f5f9;
    padding: 4px;
    border-radius: 50px;
    display: inline-flex;
}
.el-toggle-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px 20px;
    border-radius: 50px;
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--el-text-sub);
    transition: all 0.25s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}
.el-toggle-btn.active {
    background: #ffffff;
    color: var(--el-teal-dark);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.el-save-badge {
    background: var(--el-emerald-soft);
    color: var(--el-emerald);
    font-size: 0.72rem;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 20px;
}
.el-pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    align-items: stretch;
}
.el-price-card {
    background: #ffffff;
    border: 1px solid var(--el-border);
    border-radius: 22px;
    padding: 36px 30px;
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: var(--el-shadow-sm);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.el-price-card.el-price-popular {
    border: 2px solid var(--el-teal);
    box-shadow: 0 12px 36px rgba(13, 148, 136, 0.12);
}
.el-price-badge {
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--el-grad-primary);
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 5px 14px;
    border-radius: 50px;
    box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);
    white-space: nowrap;
}
.el-price-header {
    margin-bottom: 20px;
}
.el-price-name {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--el-text-main);
    margin: 0 0 6px 0;
}
.el-price-desc {
    font-size: 0.88rem;
    color: var(--el-text-sub);
    line-height: 1.45;
    margin: 0;
    min-height: 38px;
}
.el-price-box {
    padding: 16px 0 20px 0;
    border-top: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
    margin-bottom: 24px;
}
.el-price-amount-wrap {
    display: flex;
    align-items: baseline;
    gap: 6px;
}
.el-price-num {
    font-size: 2.2rem;
    font-weight: 900;
    color: var(--el-text-main);
    letter-spacing: -0.03em;
    line-height: 1;
}
.el-price-period {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--el-text-sub);
}
.el-price-subtext {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--el-emerald);
    min-height: 18px;
    margin-top: 6px;
}
.el-price-action {
    margin-bottom: 26px;
}
.el-price-btn {
    width: 100%;
    text-align: center;
    justify-content: center;
    padding: 12px 20px;
    font-size: 0.92rem;
}
.el-price-features {
    flex-grow: 1;
}
.el-feat-head {
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--el-text-main);
    margin-bottom: 12px;
}
.el-feat-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
}
.el-feat-list li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 0.86rem;
    color: var(--el-text-body);
    line-height: 1.4;
}
.el-feat-chk {
    color: var(--el-teal);
    font-weight: 900;
    font-size: 0.95rem;
    flex-shrink: 0;
}
.el-pricing-footer-note {
    text-align: center;
    margin-top: 36px;
    font-size: 0.86rem;
    font-weight: 600;
    color: var(--el-text-sub);
}

/* FAQ SECTION */
.el-faq-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    max-width: 960px;
    margin: 0 auto;
}
.el-faq-card {
    background: #ffffff;
    border: 1px solid var(--el-border);
    border-radius: 16px;
    padding: 22px 24px;
    box-shadow: var(--el-shadow-sm);
}
.el-faq-q {
    font-size: 0.96rem;
    font-weight: 800;
    color: var(--el-text-main);
    margin: 0 0 8px 0;
}
.el-faq-a {
    font-size: 0.86rem;
    color: var(--el-text-body);
    line-height: 1.6;
    margin: 0;
}

/* CAPSULE CTA */
.el-cta-card {
    background: linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #0284c7 100%);
    border-radius: 36px;
    padding: 60px 40px;
    text-align: center;
    color: #ffffff;
    box-shadow: 0 20px 40px -10px rgba(15, 118, 110, 0.35);
    max-width: 1040px;
    margin: 0 auto;
}
.el-cta-title {
    font-size: clamp(1.8rem, 3.5vw, 2.6rem);
    font-weight: 900;
    margin: 0 0 14px 0;
    letter-spacing: -0.02em;
}
.el-cta-desc {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.9);
    max-width: 580px;
    margin: 0 auto 32px auto;
    line-height: 1.6;
}
.el-btn-white {
    background: #ffffff;
    color: var(--el-teal-dark) !important;
    font-size: 0.92rem;
    font-weight: 800;
    padding: 14px 32px;
    border-radius: 50px;
    text-decoration: none;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
}
.el-btn-white:hover {
    background: #f8fafc;
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
}

/* FOOTER */
.el-footer {
    background: var(--el-text-main);
    color: #94a3b8;
    padding: 70px 0 32px 0;
}
.el-footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 36px;
    margin-bottom: 48px;
}
.el-footer-brand h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.2rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 12px 0;
}
.el-footer-brand p {
    font-size: 0.86rem;
    line-height: 1.7;
    margin: 0;
    max-width: 320px;
}
.el-footer-col h5 {
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #ffffff;
    margin: 0 0 16px 0;
}
.el-footer-links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
}
.el-footer-link a {
    color: #94a3b8;
    text-decoration: none;
    font-size: 0.84rem;
    transition: color 0.15s ease;
}
.el-footer-link a:hover {
    color: #ffffff;
}
.el-footer-bottom {
    border-top: 1px solid #1e293b;
    padding-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
}

/* RESPONSIVE MEDIA QUERIES */
@media (max-width: 992px) {
    .el-hero-split, .el-pillars-grid {
        grid-template-columns: 1fr;
        gap: 40px;
    }
    .el-nav-links {
        display: none;
    }
    .el-faq-grid, .el-footer-grid {
        grid-template-columns: 1fr 1fr;
    }
}
@media (max-width: 640px) {
    .el-nav-wrapper {
        padding: 10px 10px;
    }
    .el-navbar {
        padding: 6px 10px 6px 16px;
    }
    .el-hero {
        padding-top: 110px;
    }
    .el-matrix-row {
        grid-template-columns: 1fr;
        gap: 8px;
    }
    .el-faq-grid, .el-footer-grid {
        grid-template-columns: 1fr;
    }
    .el-footer-bottom {
        flex-direction: column;
        gap: 10px;
        text-align: center;
    }
}
CSS;
    }

    public static function html(): string
    {
        return <<<'HTML'
<div class="el-root">

  <!-- SLEEK FIXED CAPSULE NAVBAR -->
  <div class="el-nav-wrapper">
    <nav class="el-navbar">
      <a href="/" class="el-brand">
        <img src="{{setting:site.logo}}" alt="{{setting:general.site_name}}" class="el-brand-img" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
        <div class="el-brand-icon" style="display:none;">🚗</div>
        <span>{{setting:general.site_name}}</span>
        <span class="el-brand-tag">SaaS Rental</span>
      </a>

      <ul class="el-nav-links">
        <li><a href="#armada" class="el-nav-link">Fleet Management</a></li>
        <li><a href="#operasional" class="el-nav-link">Rental Operations</a></li>
        <li><a href="#keuangan" class="el-nav-link">Finance &amp; ROI</a></li>
        <li><a href="#modular" class="el-nav-link">Modular Suite</a></li>
        <li><a href="#harga" class="el-nav-link">Harga</a></li>
        <li><a href="#faq" class="el-nav-link">FAQ</a></li>
      </ul>

      <div class="el-nav-actions">
        <a href="/login" class="el-btn-ghost">Masuk</a>
        <a href="/register" class="el-btn-glow">Mulai Gratis ⚡</a>
      </div>
    </nav>
  </div>

  <!-- HERO SECTION: COMMAND CENTER SPLIT HERO -->
  <header class="el-hero">
    <div class="el-container">
      <div class="el-hero-split">
        
        <!-- LEFT COLUMN: VALUE PROPOSITION -->
        <div class="el-hero-copy">
          <div class="el-hero-badge">
            <span class="el-hero-dot"></span> Platform SaaS All-in-One Rental Kendaraan
          </div>
          
          <h1 class="el-hero-h1">
            Kendalikan Armada, Bisnis Rental &amp; Keuangan dalam <span>Satu Platform Cerdas</span>
          </h1>

          <p class="el-hero-p">
            Tinggalkan pencatatan manual dan spreadsheet yang rentan selisih. Otomatisasi jadwal armada, kontrak digital, pemeliharaan preventif, hingga pembagian hasil investor secara real-time.
          </p>

          <div class="el-hero-actions">
            <a href="/register" class="el-hero-btn-primary">
              <span>Coba Gratis 14 Hari</span>
              <span class="material-symbols-outlined" style="font-size: 18px;">rocket_launch</span>
            </a>
            <a href="#armada" class="el-hero-btn-secondary">
              <span class="material-symbols-outlined" style="font-size: 18px; color: var(--el-teal);">play_circle</span>
              <span>Lihat Demo Fitur</span>
            </a>
          </div>

          <!-- TRUST SIGNALS -->
          <div class="el-hero-trust-grid">
            <div class="el-trust-item">
              <span class="el-trust-chk">✓</span>
              <span>99.9% Akurasi Jadwal</span>
            </div>
            <div class="el-trust-item">
              <span class="el-trust-chk">✓</span>
              <span>3x Kecepatan Handover</span>
            </div>
            <div class="el-trust-item">
              <span class="el-trust-chk">✓</span>
              <span>100% Kontrol Finansial</span>
            </div>
            <div class="el-trust-item">
              <span class="el-trust-chk">✓</span>
              <span>Skalabilitas Modular</span>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: COMMAND CENTER LIVE GANTT MATRIX -->
        <div>
          <div class="el-canvas-card">
            <div class="el-canvas-header">
              <div class="el-canvas-dots">
                <div class="el-canvas-dot el-dot-red"></div>
                <div class="el-canvas-dot el-dot-yellow"></div>
                <div class="el-canvas-dot el-dot-green"></div>
              </div>
              <div class="el-canvas-title">app.seruwit.com/fleet-radar</div>
              <div class="el-canvas-status">● Live Telematics</div>
            </div>

            <div class="el-timeline-matrix">
              <div class="el-matrix-head">
                <span class="el-matrix-title">Jadwal Reservasi Armada Real-Time</span>
                <span style="font-size:0.72rem; color:var(--el-text-sub); font-weight:700;">Hari Ini • 42 Unit Terdaftar</span>
              </div>

              <!-- TIMELINE ROWS -->
              <div class="el-matrix-rows">
                <div class="el-matrix-row">
                  <div class="el-unit-meta">
                    <h5>Innova Zenix Hybrid</h5>
                    <span>B 1829 SSR • Lepas Kunci</span>
                  </div>
                  <div class="el-gantt-track">
                    <div class="el-gantt-bar el-gantt-teal">
                      <span>⚡ Disewa • Bandara Soetta (3 Hari)</span>
                    </div>
                  </div>
                </div>

                <div class="el-matrix-row">
                  <div class="el-unit-meta">
                    <h5>Fortuner 2.8 GR Sport</h5>
                    <span>B 2091 PLK • With Driver</span>
                  </div>
                  <div class="el-gantt-track">
                    <div class="el-gantt-bar el-gantt-indigo">
                      <span>👔 VIP Driver • Hotel Mulia</span>
                    </div>
                    <div class="el-gantt-bar el-gantt-empty">
                      <span>Ready</span>
                    </div>
                  </div>
                </div>

                <div class="el-matrix-row">
                  <div class="el-unit-meta">
                    <h5>HiAce Premio Luxury</h5>
                    <span>D 7781 AB • Shuttle/Tour</span>
                  </div>
                  <div class="el-gantt-track">
                    <div class="el-gantt-bar el-gantt-cyan">
                      <span>🚐 Tour Bandung (Full Booked)</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- FLOATING BOTTOM REVENUE KPI -->
              <div class="el-float-kpi">
                <div class="el-kpi-block">
                  <span>Omset Bulan Ini</span>
                  <strong style="color:var(--el-teal-dark);">Rp 128.5 Jt</strong>
                </div>
                <div class="el-kpi-block" style="text-align:right;">
                  <span>Bagi Hasil Mitra</span>
                  <strong style="color:var(--el-emerald);">Rp 38.0 Jt (Otomatis)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </header>

  <!-- 3 CORE PILLARS SECTION -->
  <section class="el-section el-section-white" id="fitur">
    <div class="el-container">
      <div class="el-head-center">
        <span class="el-tag-pill">3 Pilar Solusi Utama</span>
        <h2 class="el-title">Dibuat Khusus untuk Tantangan Pemilik Rental</h2>
        <p class="el-subtitle">
          Mulai dari ketersediaan fisik mobil hingga pembagian hasil investor, semua terkendali rapi dalam satu platform terpadu.
        </p>
      </div>

      <div class="el-pillars-grid">
        <!-- Pilar 1: Fleet Management -->
        <div class="el-pillar-card" id="armada">
          <div>
            <div class="el-pillar-icon el-icon-teal">🚗</div>
            <h3 class="el-pillar-name">Fleet Management</h3>
            <p class="el-pillar-desc">
              Pantau kondisi dan utilisasi seluruh armada secara real-time. Cegah kerugian akibat kerusakan fisik tersembunyi dan unit terbengkalai.
            </p>
            <ul class="el-pillar-list">
              <li class="el-pillar-item"><span class="chk">✓</span> <span>Monitoring ketersediaan unit live</span></li>
              <li class="el-pillar-item"><span class="chk">✓</span> <span>Jadwal servis berkala &amp; STNK/pajak</span></li>
              <li class="el-pillar-item"><span class="chk">✓</span> <span>Inspeksi fisik digital &amp; foto unit</span></li>
              <li class="el-pillar-item"><span class="chk">✓</span> <span>Riwayat biaya operasional per kendaraan</span></li>
            </ul>
          </div>
          <div class="el-pillar-footer">
            <a href="/register" class="el-pillar-link">Eksplorasi Armada →</a>
          </div>
        </div>

        <!-- Pilar 2: Rental Operations -->
        <div class="el-pillar-card featured" id="operasional">
          <div>
            <div class="el-pillar-icon el-icon-cyan">📅</div>
            <h3 class="el-pillar-name">Rental Operations</h3>
            <p class="el-pillar-desc">
              Kelola alur pemesanan tanpa risiko bentrok jadwal. Dari booking pelanggan hingga serah terima unit secara digital tanpa repot berkas kertas.
            </p>
            <ul class="el-pillar-list">
              <li class="el-pillar-item"><span class="chk">✓</span> <span>Kalender booking visual anti bentrok</span></li>
              <li class="el-pillar-item"><span class="chk">✓</span> <span>Surat perjanjian sewa &amp; e-signature</span></li>
              <li class="el-pillar-item"><span class="chk">✓</span> <span>Verifikasi identitas &amp; jaminan deposit</span></li>
              <li class="el-pillar-item"><span class="chk">✓</span> <span>Multi-cabang &amp; antar-jemput bandara</span></li>
            </ul>
          </div>
          <div class="el-pillar-footer">
            <a href="/register" class="el-pillar-link" style="color:var(--el-cyan);">Eksplorasi Operasional →</a>
          </div>
        </div>

        <!-- Pilar 3: Finance Management -->
        <div class="el-pillar-card" id="keuangan">
          <div>
            <div class="el-pillar-icon el-icon-emerald">💰</div>
            <h3 class="el-pillar-name">Finance &amp; ROI</h3>
            <p class="el-pillar-desc">
              Otomatisasi pembukuan dan analisis laba-rugi setiap armada. Transparan bagi pengelola dan pemilik unit titipan (investor mitra).
            </p>
            <ul class="el-pillar-list">
              <li class="el-pillar-item"><span class="chk">✓</span> <span>Invoice digital instan ber-QR payment</span></li>
              <li class="el-pillar-item"><span class="chk">✓</span> <span>Otomatisasi split revenue investor</span></li>
              <li class="el-pillar-item"><span class="chk">✓</span> <span>Laporan profit &amp; margin bersih per mobil</span></li>
              <li class="el-pillar-item"><span class="chk">✓</span> <span>Pencatatan kas operasional harian terpadu</span></li>
            </ul>
          </div>
          <div class="el-pillar-footer">
            <a href="/register" class="el-pillar-link" style="color:var(--el-emerald);">Eksplorasi Keuangan →</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- MODULAR ECOSYSTEM SECTION -->
  <section class="el-section el-section-subtle" id="modular">
    <div class="el-container">
      <div class="el-head-center">
        <span class="el-tag-pill">Arsitektur Modular Seruwit</span>
        <h2 class="el-title">Platform yang Tumbuh Bersama Skala Bisnis Anda</h2>
        <p class="el-subtitle">
          Tidak ada fitur berlebih yang memperlambat sistem. Aktifkan modul tambahan sesuai kebutuhan operasional armada dan cabang Anda sewaktu-waktu.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
        <div class="el-eco-box">
          <div class="el-eco-top">
            <span class="el-eco-icon-sm">🌐</span>
            <h3 class="el-eco-name">Storefront &amp; Public Catalog</h3>
          </div>
          <p class="el-eco-summary">
            Halaman katalog sewa mobil/motor siap pakai untuk konsumen langsung dengan fitur booking online dan filter kelas armada.
          </p>
          <div class="el-eco-tags">
            <span class="el-tag">Online Booking</span>
            <span class="el-tag">Katalog Armada</span>
            <span class="el-tag">Whitelabel Domain</span>
          </div>
        </div>

        <div class="el-eco-box">
          <div class="el-eco-top">
            <span class="el-eco-icon-sm">💬</span>
            <h3 class="el-eco-name">WhatsApp Automation</h3>
          </div>
          <p class="el-eco-summary">
            Kirimkan konfirmasi booking, invoice ber-QR, dan pengingat pengembalian unit secara otomatis langsung ke WhatsApp pelanggan.
          </p>
          <div class="el-eco-tags">
            <span class="el-tag">Notifikasi Booking</span>
            <span class="el-tag">Pengingat Kembali</span>
            <span class="el-tag">Broadcast Promo</span>
          </div>
        </div>

        <div class="el-eco-box">
          <div class="el-eco-top">
            <span class="el-eco-icon-sm">🏢</span>
            <h3 class="el-eco-name">Multi-Branch Tenancy</h3>
          </div>
          <p class="el-eco-summary">
            Kelola puluhan kantor cabang atau pangkalan armada dalam satu akun induk dengan hak akses dan pembagian armada terisolasi.
          </p>
          <div class="el-eco-tags">
            <span class="el-tag">Multi-Pool</span>
            <span class="el-tag">Role-Based Access</span>
            <span class="el-tag">Konsolidasi Laporan</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PRICING SECTION -->
  <section class="el-section el-section-white" id="harga">
    <div class="el-container">
      <div class="el-head-center">
        <span class="el-tag-pill">Paket Investasi Bisnis</span>
        <h2 class="el-title">Pilihan Paket Fleksibel Sesuai Jumlah Armada</h2>
        <p class="el-subtitle">
          Mulai gratis 14 hari penuh. Tanpa komitmen kartu kredit. Upgrade kapan saja saat armada Anda bertambah.
        </p>
      </div>

      {{pricing_table}}
    </div>
  </section>

  <!-- FAQ SECTION -->
  <section class="el-section el-section-subtle" id="faq">
    <div class="el-container">
      <div class="el-head-center">
        <span class="el-tag-pill">Tanya Jawab</span>
        <h2 class="el-title">Pertanyaan yang Sering Diajukan</h2>
        <p class="el-subtitle">
          Semua yang perlu Anda ketahui sebelum menggunakan platform Seruwit SaaS.
        </p>
      </div>

      <div class="el-faq-grid">
        <div class="el-faq-card">
          <h3 class="el-faq-q">Apakah aplikasi ini cocok untuk rental mobil dan motor?</h3>
          <p class="el-faq-a">Ya. Seruwit dirancang fleksibel untuk segala jenis rental kendaraan, baik mobil keluarga, mobil premium, bus/shuttle, hingga motor harian.</p>
        </div>
        <div class="el-faq-card">
          <h3 class="el-faq-q">Bagaimana jika saya memiliki armada milik investor (titip sewa)?</h3>
          <p class="el-faq-a">Sistem menyediakan fitur split revenue otomatis. Anda dapat menentukan persentase bagi hasil dan menghasilkan laporan bulanan transparan bagi mitra dalam satu klik.</p>
        </div>
        <div class="el-faq-card">
          <h3 class="el-faq-q">Apakah saya bisa memindahkan data dari Excel?</h3>
          <p class="el-faq-a">Tentu saja. Tersedia fitur impor data kendaraan dan pelanggan via spreadsheet sehingga Anda tidak perlu input satu per satu secara manual.</p>
        </div>
        <div class="el-faq-card">
          <h3 class="el-faq-q">Apakah halaman website publik bisa diedit sendiri?</h3>
          <p class="el-faq-a">Bisa! Seruwit dilengkapi modul visual Page Builder (GrapesJS) yang memungkinkan Anda mengubah teks, gambar, promo, dan katalog tanpa koding.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CAPSULE CTA SECTION -->
  <section class="el-section el-section-white" id="daftar">
    <div class="el-container">
      <div class="el-cta-card">
        <h2 class="el-cta-title">Siap Memodernisasi Bisnis Rental Anda?</h2>
        <p class="el-cta-desc">
          Tingkatkan utilisasi armada dan pantau laba operasional secara akurat hari ini. Mulai uji coba gratis 14 hari penuh.
        </p>
        <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
          <a href="/register" class="el-btn-white">
            <span>Mulai Uji Coba Gratis 14 Hari</span>
            <span class="material-symbols-outlined" style="font-size: 18px;">arrow_forward</span>
          </a>
          <a href="/login" class="el-btn-glow" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.4); box-shadow: none;">
            Masuk ke Portal Akun
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="el-footer">
    <div class="el-container">
      <div class="el-footer-grid">
        <div class="el-footer-brand">
          <h4>
            <span class="material-symbols-outlined" style="font-size: 22px; color: var(--el-teal);">directions_car</span>
            <span>{{setting:general.site_name}}</span>
          </h4>
          <p>
            Platform SaaS all-in-one untuk efisiensi armada, otomatisasi operasional sewa, dan akuntansi bisnis rental terpadu.
          </p>
        </div>

        <div class="el-footer-col">
          <h5>Fitur Utama</h5>
          <ul class="el-footer-links">
            <li class="el-footer-link"><a href="#armada">Fleet Management</a></li>
            <li class="el-footer-link"><a href="#operasional">Rental Operations</a></li>
            <li class="el-footer-link"><a href="#keuangan">Finance &amp; ROI</a></li>
          </ul>
        </div>

        <div class="el-footer-col">
          <h5>Ekosistem</h5>
          <ul class="el-footer-links">
            <li class="el-footer-link"><a href="#modular">Storefront &amp; Pages</a></li>
            <li class="el-footer-link"><a href="#modular">WhatsApp Reminder</a></li>
            <li class="el-footer-link"><a href="#modular">Multi-Cabang Tenant</a></li>
          </ul>
        </div>

        <div class="el-footer-col">
          <h5>Akses</h5>
          <ul class="el-footer-links">
            <li class="el-footer-link"><a href="/login">Masuk Akun</a></li>
            <li class="el-footer-link"><a href="/register">Registrasi Baru</a></li>
            <li class="el-footer-link"><a href="#faq">Pusat Bantuan</a></li>
          </ul>
        </div>
      </div>

      <div class="el-footer-bottom">
        <div>{{setting:site.copyright}}</div>
        <div>Platform Manajemen Rental Kendaraan Modern</div>
      </div>
    </div>
  </footer>

</div>
HTML;
    }
}
