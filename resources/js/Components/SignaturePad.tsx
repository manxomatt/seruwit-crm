import { useEffect, useRef } from 'react';

interface SignaturePadProps {
    value: string | null;
    onChange: (value: string | null) => void;
    className?: string;
    height?: number;
}

/**
 * Lightweight canvas signature capture (same pattern as Orders POD).
 */
export default function SignaturePad({
    value,
    onChange,
    className = '',
    height = 140,
}: SignaturePadProps): JSX.Element {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const hasDrawn = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (! canvas) {
            return;
        }

        const resize = () => {
            const ratio = window.devicePixelRatio || 1;
            const width = canvas.clientWidth;
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            const ctx = canvas.getContext('2d');
            if (! ctx) {
                return;
            }
            ctx.scale(ratio, ratio);
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#111827';
            if (value) {
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    hasDrawn.current = true;
                };
                img.src = value;
            } else {
                ctx.clearRect(0, 0, width, height);
                hasDrawn.current = false;
            }
        };

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [height, value]);

    const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (! canvas) {
            return { x: 0, y: 0 };
        }
        const rect = canvas.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (! canvas || ! ctx) {
            return;
        }
        drawing.current = true;
        hasDrawn.current = true;
        canvas.setPointerCapture(event.pointerId);
        const { x, y } = point(event);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (! drawing.current) {
            return;
        }
        const ctx = canvasRef.current?.getContext('2d');
        if (! ctx) {
            return;
        }
        const { x, y } = point(event);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const end = () => {
        if (! drawing.current) {
            return;
        }
        drawing.current = false;
        const canvas = canvasRef.current;
        if (! canvas || ! hasDrawn.current) {
            return;
        }
        onChange(canvas.toDataURL('image/png'));
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (! canvas || ! ctx) {
            return;
        }
        ctx.clearRect(0, 0, canvas.clientWidth, height);
        hasDrawn.current = false;
        onChange(null);
    };

    return (
        <div className={className}>
            <canvas
                ref={canvasRef}
                className="h-[140px] w-full touch-none rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
                style={{ height }}
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerLeave={end}
            />
            <button
                type="button"
                onClick={clear}
                className="mt-2 text-xs text-gray-500 underline hover:text-gray-700 dark:hover:text-gray-300"
            >
                Clear
            </button>
        </div>
    );
}
