import DriverLayout from '@/Layouts/DriverLayout';
import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';
import { ChangeEvent, FormEventHandler, useEffect, useRef, useState } from 'react';

interface OrderItem {
    id: number;
    quantity: string;
    notes: string | null;
    product: { id: number; name: string } | null;
}

interface Order {
    id: number;
    code: string;
    trip_id: number | null;
    customer: { id: number; name: string } | null;
    items: OrderItem[];
}

interface Props {
    driverName: string;
    order: Order;
}

interface PodItemInput {
    delivery_order_item_id: number;
    accepted_quantity: string;
    rejected_quantity: string;
    returned_quantity: string;
    reason: string;
}

/**
 * Downscales a captured photo to a max edge and re-encodes it as JPEG so a POD
 * with several photos still fits inside one POST.
 */
function downscale(file: File, maxEdge = 1280, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('no canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function PodForm({ driverName, order }: Props): JSX.Element {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const hasDrawn = useRef(false);

    const { data, setData, post, processing, errors, transform } = useForm({
        recipient_name: '',
        signature: null as string | null,
        photos: [] as string[],
        notes: '',
        latitude: null as number | null,
        longitude: null as number | null,
        items: order.items.map<PodItemInput>((item) => ({
            delivery_order_item_id: item.id,
            accepted_quantity: item.quantity,
            rejected_quantity: '0',
            returned_quantity: '0',
            reason: '',
        })),
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setData((prev) => ({
                    ...prev,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                }));
            },
            () => undefined,
            { enableHighAccuracy: true, timeout: 10000 },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const ratio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(ratio, ratio);
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#111827';
        }
    }, []);

    const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
        drawing.current = true;
        hasDrawn.current = true;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const { x, y } = pointerPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const moveStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawing.current) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const { x, y } = pointerPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const endStroke = () => {
        if (!drawing.current) return;
        drawing.current = false;
        if (canvasRef.current) {
            setData('signature', canvasRef.current.toDataURL('image/png'));
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        hasDrawn.current = false;
        setData('signature', null);
    };

    const addPhotos = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        const encoded = await Promise.all(files.map((file) => downscale(file)));
        setData('photos', [...data.photos, ...encoded].slice(0, 5));
        e.target.value = '';
    };

    const removePhoto = (index: number) => {
        setData('photos', data.photos.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof PodItemInput, value: string) => {
        setData(
            'items',
            data.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((payload) => ({
            ...payload,
            signature: hasDrawn.current ? payload.signature : null,
        }));
        post(route('module.driver.pod.store', order.id));
    };

    return (
        <DriverLayout driverName={driverName} title="Serah Terima" back={route('module.driver.trip', order.trip_id ?? 0)}>
            <Head title={`POD ${order.code}`} />

            <form onSubmit={submit} className="space-y-5">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-gray-900">{order.code}</p>
                    <p className="text-xs text-gray-500">{order.customer?.name}</p>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <label htmlFor="recipient_name" className="block text-sm font-medium text-gray-700">
                        Nama Penerima
                    </label>
                    <input
                        id="recipient_name"
                        type="text"
                        value={data.recipient_name}
                        onChange={(e) => setData('recipient_name', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <InputError message={errors.recipient_name} className="mt-1" />
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Tanda Tangan</span>
                        <button type="button" onClick={clearSignature} className="text-xs font-medium text-indigo-600">
                            Hapus
                        </button>
                    </div>
                    <canvas
                        ref={canvasRef}
                        onPointerDown={startStroke}
                        onPointerMove={moveStroke}
                        onPointerUp={endStroke}
                        onPointerLeave={endStroke}
                        className="mt-2 h-40 w-full touch-none rounded-md border border-dashed border-gray-300 bg-gray-50"
                    />
                    <InputError message={errors.signature} className="mt-1" />
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <span className="text-sm font-medium text-gray-700">Foto Bukti</span>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                        {data.photos.map((photo, index) => (
                            <div key={index} className="relative">
                                <img src={photo} alt={`Foto ${index + 1}`} className="h-20 w-full rounded object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(index)}
                                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                                    aria-label="Hapus foto"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {data.photos.length < 5 && (
                            <label className="flex h-20 cursor-pointer items-center justify-center rounded border border-dashed border-gray-300 text-2xl text-gray-400">
                                +
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    multiple
                                    onChange={addPhotos}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                    <InputError message={errors.photos} className="mt-1" />
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <span className="text-sm font-medium text-gray-700">Barang</span>
                    <div className="mt-2 space-y-4">
                        {order.items.map((item, index) => {
                            const input = data.items[index];
                            const showReason =
                                Number(input.rejected_quantity) > 0 || Number(input.returned_quantity) > 0;
                            return (
                                <div key={item.id} className="rounded-md border border-gray-200 p-3">
                                    <p className="text-sm font-medium text-gray-900">{item.product?.name ?? 'Barang'}</p>
                                    <p className="text-xs text-gray-500">Dipesan: {item.quantity}</p>
                                    <div className="mt-2 grid grid-cols-3 gap-2">
                                        <label className="text-xs text-gray-600">
                                            Diterima
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={input.accepted_quantity}
                                                onChange={(e) => updateItem(index, 'accepted_quantity', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
                                            />
                                        </label>
                                        <label className="text-xs text-gray-600">
                                            Ditolak
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={input.rejected_quantity}
                                                onChange={(e) => updateItem(index, 'rejected_quantity', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
                                            />
                                        </label>
                                        <label className="text-xs text-gray-600">
                                            Retur
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={input.returned_quantity}
                                                onChange={(e) => updateItem(index, 'returned_quantity', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
                                            />
                                        </label>
                                    </div>
                                    {showReason && (
                                        <input
                                            type="text"
                                            placeholder="Alasan tolak / retur"
                                            value={input.reason}
                                            onChange={(e) => updateItem(index, 'reason', e.target.value)}
                                            className="mt-2 block w-full rounded-md border-gray-300 text-sm shadow-sm"
                                        />
                                    )}
                                    <InputError message={errors[`items.${index}.accepted_quantity` as keyof typeof errors]} className="mt-1" />
                                    <InputError message={errors[`items.${index}.reason` as keyof typeof errors]} className="mt-1" />
                                </div>
                            );
                        })}
                    </div>
                    <InputError message={errors.items} className="mt-1" />
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Catatan
                    </label>
                    <textarea
                        id="notes"
                        rows={3}
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {data.latitude !== null && (
                        <p className="mt-1 text-xs text-gray-400">
                            Lokasi: {data.latitude.toFixed(5)}, {data.longitude?.toFixed(5)}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-md bg-indigo-600 py-3 text-sm font-semibold text-white active:bg-indigo-700 disabled:opacity-50"
                >
                    Simpan Bukti Pengiriman
                </button>
            </form>
        </DriverLayout>
    );
}
