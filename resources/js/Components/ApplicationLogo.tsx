import { SVGProps } from 'react';

export default function ApplicationLogo({
    showText = true,
    ...props
}: SVGProps<SVGSVGElement> & { showText?: boolean }) {
    return (
        <svg
            viewBox={showText ? "0 0 540 160" : "0 0 160 160"}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <defs>
                <linearGradient id="seruwit-c1-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1E3A8A" />
                    <stop offset="40%" stopColor="#2563EB" />
                    <stop offset="75%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
                <linearGradient id="seruwit-c1-biz" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
                <linearGradient id="seruwit-c1-arrow" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#1E40AF" />
                </linearGradient>
            </defs>

            {/* Concept 1 Emblem: Geometric S+B Integration */}
            <g transform="translate(10, 10) scale(0.28)">
                {/* S-curve Ribbon */}
                <path
                    d="M 315 140 C 315 95, 275 65, 215 65 C 155 65, 125 105, 125 145 C 125 200, 260 210, 260 260 C 260 295, 230 320, 185 320 C 140 320, 115 295, 110 270"
                    stroke="url(#seruwit-c1-grad)"
                    strokeWidth="36"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />

                {/* B Loop & Forward Arrow */}
                <path
                    d="M 220 145 L 340 210 C 375 230, 375 285, 340 305 L 210 380 C 170 405, 125 370, 125 325 L 125 145"
                    stroke="url(#seruwit-c1-grad)"
                    strokeWidth="36"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />

                {/* Center Forward Arrow motif */}
                <path d="M 225 210 L 285 245 L 225 280 Z" fill="url(#seruwit-c1-arrow)" />

                {/* Tech Node Dots */}
                <circle cx="315" cy="140" r="18" fill="#06B6D4" />
                <circle cx="110" cy="270" r="18" fill="#1E3A8A" />
            </g>

            {/* Logo Text: SERUWIT BIZ */}
            {showText && (
                <g transform="translate(145, 92)">
                    <text
                        fontFamily="System-UI, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                        fontSize="48"
                        fontWeight="900"
                        letterSpacing="-1"
                        fill="currentColor"
                    >
                        SERUWIT
                    </text>
                    <text
                        x="215"
                        fontFamily="System-UI, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                        fontSize="48"
                        fontWeight="800"
                        letterSpacing="-0.5"
                        fill="url(#seruwit-c1-biz)"
                    >
                        BIZ
                    </text>
                    <text
                        x="0"
                        y="30"
                        fontFamily="System-UI, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                        fontSize="13"
                        fontWeight="700"
                        letterSpacing="4"
                        fill="currentColor"
                        opacity="0.65"
                    >
                        INTEGRATED BUSINESS SYSTEMS
                    </text>
                </g>
            )}
        </svg>
    );
}


