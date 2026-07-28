import CanvassingLayout from '@/Layouts/CanvassingLayout';
import InputError from '@/Components/InputError';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useRef, useState } from 'react';

interface Partner { id: number; name: string; phone: string | null; }
interface Photo { id: number; url: string; }
interface OrderItem {
    id?: number;
    product_id: number;
    quantity: string;
    unit_price: string;
    unit?: string | null;
    product?: { id: number; name: string; code: string | null };
}
interface Visit {
    id: number;
    partner: Partner;
    checked_in_at: string;
    checked_out_at: string | null;
    outcome: string;
    notes: string | null;
    photos: Photo[];
    is_open: boolean;
    warehouse_id?: number | null;
    sales_order_id?: number | null;
    order_items?: OrderItem[];
}
interface Salesperson { id: number; name: string; }
interface ProductOption { id: number; name: string; code: string | null; unit: string | null; price: string | number | null; }
interface WarehouseOption { id: number; name: string; }

interface Props {
    salesperson: Salesperson;
    visit: Visit;
    orderCapture?: {
        enabled: boolean;
        warehouses: WarehouseOption[];
        products: ProductOption[];
        sales_order_id: number | null;
    };
}

const OUTCOME_OPTIONS = [
    { value: 'contacted', color: 'border-blue-400 bg-blue-50 text-blue-700' },
    { value: 'interested', color: 'border-green-400 bg-green-50 text-green-700' },
    { value: 'not_interested', color: 'border-red-400 bg-red-50 text-red-700' },
    { value: 'no_contact', color: 'border-gray-300 bg-gray-50 text-gray-600' },
    { value: 'callback', color: 'border-purple-400 bg-purple-50 text-purple-700' },
];

export default function VisitDetail({ salesperson, visit, orderCapture }: Props): JSX.Element {
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [photos, setPhotos] = useState<string[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);
    const captureEnabled = orderCapture?.enabled ?? false;

    const { data, setData, post, processing, errors } = useForm({
        outcome: '',
        notes: visit.notes ?? '',
        photos: [] as string[],
    });

    const orderForm = useForm({
        warehouse_id: visit.warehouse_id ? String(visit.warehouse_id) : '',
        items: (visit.order_items ?? []).map((item) => ({
            product_id: String(item.product_id),
            quantity: String(item.quantity),
            unit_price: String(item.unit_price),
            unit: item.unit ?? '',
        })),
        convert: false,
    });

    const productMap = useMemo(() => {
        const map = new Map<number, ProductOption>();
        (orderCapture?.products ?? []).forEach((product) => map.set(product.id, product));
        return map;
    }, [orderCapture?.products]);

    const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        files.slice(0, 5 - photos.length).forEach((file) => {
            const reader = new FileReader();
            const canvas = document.createElement('canvas');
            const img = new Image();
            img.onload = () => {
                const maxW = 1024;
                const scale = Math.min(1, maxW / img.width);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
                const compressed = canvas.toDataURL('image/jpeg', 0.7);
                setPhotos((prev) => [...prev, compressed]);
                setData('photos', [...data.photos, compressed]);
            };
            reader.onload = (ev) => { img.src = ev.target!.result as string; };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const removePhoto = (i: number) => {
        setPhotos((prev) => prev.filter((_, idx) => idx !== i));
        setData('photos', data.photos.filter((_, idx) => idx !== i));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('module.canvassing.portal.visits.checkout', visit.id));
    };

    const addOrderLine = (): void => {
        const first = orderCapture?.products?.[0];
        orderForm.setData('items', [
            ...orderForm.data.items,
            {
                product_id: first ? String(first.id) : '',
                quantity: '1',
                unit_price: first?.price != null ? String(first.price) : '0',
                unit: first?.unit ?? '',
            },
        ]);
    };

    const updateOrderLine = (index: number, key: string, value: string): void => {
        const next = orderForm.data.items.map((item, i) => {
            if (i !== index) {
                return item;
            }
            const updated = { ...item, [key]: value };
            if (key === 'product_id') {
                const product = productMap.get(Number(value));
                updated.unit_price = product?.price != null ? String(product.price) : '0';
                updated.unit = product?.unit ?? '';
            }
            return updated;
        });
        orderForm.setData('items', next);
    };

    const removeOrderLine = (index: number): void => {
        orderForm.setData('items', orderForm.data.items.filter((_, i) => i !== index));
    };

    const saveOrder = (convert: boolean): void => {
        orderForm.transform((payload) => ({
            ...payload,
            convert,
            warehouse_id: payload.warehouse_id !== '' ? Number(payload.warehouse_id) : null,
            items: payload.items
                .filter((item) => item.product_id !== '')
                .map((item) => ({
                    product_id: Number(item.product_id),
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                    unit: item.unit || null,
                })),
        }));
        orderForm.post(route('module.canvassing.portal.visits.order', visit.id), {
            preserveScroll: true,
        });
    };

    const checkinTime = new Date(visit.checked_in_at);
    const elapsed = Math.round((Date.now() - checkinTime.getTime()) / 60000);

    return (
        <CanvassingLayout salespersonName={salesperson.name} title={visit.partner.name} back={route('module.canvassing.portal.today')}>
            <Head title={visit.partner.name} />

            <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">{visit.partner.name}</p>
                {visit.partner.phone && <p className="text-sm text-gray-500">{visit.partner.phone}</p>}
                <p className="mt-1 text-xs text-gray-400">
                    {t('canvassing.portal.check_in_at', { time: checkinTime.toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' }) })}
                    {visit.is_open && <span className="ml-2 text-orange-500">{t('canvassing.portal.elapsed', { count: elapsed })}</span>}
                </p>
                {visit.sales_order_id && (
                    <p className="mt-2 text-xs font-medium text-emerald-700">
                        {t('canvassing.portal.so_linked', { number: `#${visit.sales_order_id}` })}
                    </p>
                )}
            </div>

            {visit.photos.length > 0 && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <p className="mb-2 text-xs font-semibold text-gray-500">{t('canvassing.portal.photos', { count: visit.photos.length })}</p>
                    <div className="grid grid-cols-3 gap-1">
                        {visit.photos.map((p) => (
                            <img key={p.id} src={p.url} alt="" className="aspect-square rounded object-cover" />
                        ))}
                    </div>
                </div>
            )}

            {captureEnabled && visit.is_open && !visit.sales_order_id && (
                <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">{t('canvassing.portal.order_section')}</p>
                        <button type="button" onClick={addOrderLine} className="text-xs font-medium text-emerald-600">
                            {t('canvassing.portal.add_line')}
                        </button>
                    </div>

                    {(orderCapture?.warehouses?.length ?? 0) > 0 && (
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">{t('canvassing.portal.warehouse')}</label>
                            <select
                                value={orderForm.data.warehouse_id}
                                onChange={(e) => orderForm.setData('warehouse_id', e.target.value)}
                                className="w-full rounded-md border-gray-300 text-sm"
                            >
                                <option value="">—</option>
                                {orderCapture?.warehouses.map((warehouse) => (
                                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {orderForm.data.items.length === 0 ? (
                        <p className="text-xs text-gray-400">{t('canvassing.portal.no_products')}</p>
                    ) : (
                        <div className="space-y-2">
                            {orderForm.data.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 rounded border border-gray-100 p-2">
                                    <select
                                        className="col-span-7 rounded-md border-gray-300 text-sm"
                                        value={item.product_id}
                                        onChange={(e) => updateOrderLine(index, 'product_id', e.target.value)}
                                    >
                                        <option value="">—</option>
                                        {(orderCapture?.products ?? []).map((product) => (
                                            <option key={product.id} value={product.id}>{product.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="col-span-3 rounded-md border-gray-300 text-sm"
                                        value={item.quantity}
                                        onChange={(e) => updateOrderLine(index, 'quantity', e.target.value)}
                                        placeholder={t('canvassing.portal.qty')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeOrderLine(index)}
                                        className="col-span-2 text-sm text-red-500"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <InputError message={errors.order || orderForm.errors.order || orderForm.errors.items} className="mt-1" />

                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={orderForm.processing}
                            onClick={() => saveOrder(false)}
                            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700"
                        >
                            {t('common.save')}
                        </button>
                        <button
                            type="button"
                            disabled={orderForm.processing || orderForm.data.items.length === 0}
                            onClick={() => saveOrder(true)}
                            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {t('canvassing.portal.create_so')}
                        </button>
                    </div>
                </div>
            )}

            {visit.is_open ? (
                <form onSubmit={submit} className="space-y-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <label className="mb-2 block text-sm font-semibold text-gray-700">{t('canvassing.portal.outcome_label')}</label>
                        <div className="grid grid-cols-1 gap-2">
                            {OUTCOME_OPTIONS.map((o) => (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => setData('outcome', o.value)}
                                    className={`rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium transition-all ${data.outcome === o.value ? o.color + ' border-opacity-100' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                                >
                                    {t(`canvassing.outcomes.${o.value}`, undefined, o.value)}
                                </button>
                            ))}
                        </div>
                        <InputError message={errors.outcome} className="mt-1" />
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <label htmlFor="notes" className="mb-1 block text-sm font-semibold text-gray-700">{t('canvassing.portal.notes')}</label>
                        <textarea
                            id="notes"
                            rows={3}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder={t('canvassing.portal.notes_checkout_placeholder')}
                            className="w-full rounded-md border-gray-300 text-sm"
                        />
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-700">{t('canvassing.portal.photos_count', { count: photos.length })}</label>
                            {photos.length < 5 && (
                                <button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-medium text-emerald-600">{t('canvassing.portal.add_photo')}</button>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={addPhoto} />
                        {photos.length > 0 ? (
                            <div className="grid grid-cols-3 gap-1">
                                {photos.map((src, i) => (
                                    <div key={i} className="relative">
                                        <img src={src} alt="" className="aspect-square rounded object-cover" />
                                        <button type="button" onClick={() => removePhoto(i)} className="absolute right-0.5 top-0.5 rounded-full bg-red-500 p-0.5 text-white">
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-6 text-sm text-gray-400 active:bg-gray-50">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {t('canvassing.portal.take_photo')}
                            </button>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing || !data.outcome}
                        className="w-full rounded-xl bg-emerald-600 py-4 text-base font-bold text-white shadow-md disabled:opacity-50 active:bg-emerald-700"
                    >
                        {processing ? t('canvassing.portal.processing') : t('canvassing.portal.checkout')}
                    </button>
                </form>
            ) : (
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">{t('canvassing.portal.visit_done')}</p>
                    <p className="text-sm text-gray-900">{t('canvassing.portal.result', { outcome: t(`canvassing.outcomes.${visit.outcome}`, undefined, visit.outcome) })}</p>
                    {visit.notes && <p className="mt-2 text-sm text-gray-600">{visit.notes}</p>}
                </div>
            )}
        </CanvassingLayout>
    );
}
