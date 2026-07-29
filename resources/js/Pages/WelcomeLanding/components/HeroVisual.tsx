import React from 'react';

/**
 * Full-bleed operations network: warehouses, routes, finance nodes.
 * Serves as the hero's dominant visual plane (not an inset card).
 */
const HeroVisual: React.FC = () => {
    return (
        <div className="landing-hero-visual pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(13,148,136,0.14),transparent_50%),radial-gradient(ellipse_at_80%_10%,rgba(6,182,212,0.16),transparent_45%),radial-gradient(ellipse_at_70%_80%,rgba(245,158,11,0.12),transparent_50%),radial-gradient(ellipse_at_10%_85%,rgba(16,185,129,0.12),transparent_45%)]" />
            <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />

            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <linearGradient id="routeCyan" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.55" />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity="0.15" />
                    </linearGradient>
                    <linearGradient id="routeAmber" x1="1" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.12" />
                    </linearGradient>
                    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <path
                    className="landing-route landing-route-a"
                    d="M180 620 C 360 520, 520 480, 700 420 S 980 280, 1180 260"
                    stroke="url(#routeCyan)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="8 10"
                />
                <path
                    className="landing-route landing-route-b"
                    d="M220 240 C 420 300, 560 520, 760 580 S 1040 640, 1260 560"
                    stroke="url(#routeAmber)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6 12"
                />
                <path
                    className="landing-route landing-route-c"
                    d="M320 780 C 480 700, 640 620, 820 540 S 1100 400, 1320 380"
                    stroke="#14b8a6"
                    strokeOpacity="0.35"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="4 14"
                />

                {/* Warehouse / supply */}
                <g className="landing-node landing-node-1" filter="url(#softGlow)">
                    <circle cx="220" cy="620" r="18" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
                    <circle cx="220" cy="620" r="6" fill="#10b981" />
                </g>
                {/* Fleet hub */}
                <g className="landing-node landing-node-2" filter="url(#softGlow)">
                    <circle cx="700" cy="420" r="22" fill="#ecfeff" stroke="#06b6d4" strokeWidth="2" />
                    <circle cx="700" cy="420" r="7" fill="#06b6d4" />
                </g>
                {/* Commerce */}
                <g className="landing-node landing-node-3" filter="url(#softGlow)">
                    <circle cx="1180" cy="260" r="18" fill="#fffbeb" stroke="#f59e0b" strokeWidth="2" />
                    <circle cx="1180" cy="260" r="6" fill="#f59e0b" />
                </g>
                {/* Finance */}
                <g className="landing-node landing-node-4" filter="url(#softGlow)">
                    <circle cx="760" cy="580" r="16" fill="#f0fdfa" stroke="#0d9488" strokeWidth="2" />
                    <circle cx="760" cy="580" r="5" fill="#0d9488" />
                </g>
                {/* Field */}
                <g className="landing-node landing-node-5" filter="url(#softGlow)">
                    <circle cx="1260" cy="560" r="14" fill="#fff7ed" stroke="#ea580c" strokeWidth="2" />
                    <circle cx="1260" cy="560" r="5" fill="#ea580c" />
                </g>
            </svg>

            <div className="absolute -right-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-cyan-200/30 blur-3xl landing-orb" />
            <div className="absolute -left-20 bottom-0 h-[22rem] w-[22rem] rounded-full bg-emerald-200/25 blur-3xl landing-orb landing-orb-delay" />
        </div>
    );
};

export default HeroVisual;
