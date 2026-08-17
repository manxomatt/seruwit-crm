import { SVGProps } from 'react';

export default function ApplicationLogo({
    showText = true,
    ...props
}: SVGProps<SVGSVGElement> & { showText?: boolean }) {
    return (
        <svg
            viewBox={showText ? "0 0 260 60" : "0 0 60 60"}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <defs>
                <linearGradient id="seruwit-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="50%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
                <linearGradient id="seruwit-grad-accent" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1E40AF" />
                    <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
            </defs>

            {/* Logo Icon Mark: Stylized Infinity & S/B Integration */}
            <g transform="translate(5, 5)">
                {/* Background Shadow Glow / Base */}
                <rect x="0" y="0" width="50" height="50" rx="14" fill="url(#seruwit-grad-primary)" opacity="0.12" />
                
                {/* Main Dynamic Ribbon 'S' Loop (Finance + Logistics Flow) */}
                <path
                    d="M 15 36 C 12 28 16 18 25 15 C 34 12 40 18 36 26 C 32 34 18 28 14 36 C 11 42 18 48 27 45 C 36 42 41 32 38 24"
                    stroke="url(#seruwit-grad-primary)"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />

                {/* Connection Nodes / Tech Dots representing ERP & CRM integration */}
                <circle cx="15" cy="36" r="3" fill="#2563EB" />
                <circle cx="38" cy="24" r="3" fill="#10B981" />
                <path
                    d="M 22 25 L 30 19 L 34 27"
                    stroke="url(#seruwit-grad-accent)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />
            </g>

            {/* Logo Text: Seruwit Biz */}
            {showText && (
                <g transform="translate(68, 38)">
                    <text
                        fontFamily="System-UI, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                        fontSize="25"
                        fontWeight="800"
                        letterSpacing="-0.5"
                        fill="currentColor"
                    >
                        Seruwit
                    </text>
                    <text
                        x="94"
                        fontFamily="System-UI, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                        fontSize="25"
                        fontWeight="700"
                        letterSpacing="-0.5"
                        fill="url(#seruwit-grad-primary)"
                    >
                        Biz
                    </text>
                    <text
                        x="0"
                        y="14"
                        fontFamily="System-UI, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                        fontSize="8"
                        fontWeight="600"
                        letterSpacing="1.5"
                        fill="currentColor"
                        opacity="0.55"
                    >
                        INTEGRATED SAAS PLATFORM
                    </text>
                </g>
            )}
        </svg>
    );
}

