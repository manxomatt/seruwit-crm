import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import Select from '@/Components/Select';
import PosLayout from '../../../../PosLayout';
import {
    MAX_PARKED_CARTS,
    ParkedCart,
    cartItemCount,
    cartMerchandise,
    parkCurrentCart,
    readParkedCarts,
    removeParkedCart,
    takeParkedCart,
} from '../../../../parkedCarts';

interface PosProduct {
    id: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    unit: string | null;
    price: number;
    image: string | null;
    is_service: boolean;
    is_favorite: boolean;
    available: number | null;
}

interface CartLine {
    product_id: number;
    name: string;
    unit: string | null;
    unit_price: number;
    quantity: number;
    available: number | null;
    is_service: boolean;
    image: string | null;
}

interface Shift {
    id: number;
    status: string;
    warehouse_id: number;
    opened_at: string;
    warehouse: { id: number; name: string };
    opener: { id: number; name: string };
}

interface LastSale {
    id: number;
    code: string;
    grand_total: string | number;
    change_due: string | number | null;
    amount_tendered: string | number | null;
    payments: Array<{ method: string; amount: string | number }>;
}

interface TaxConfig {
    enabled: boolean;
    rate: number;
    inclusive: boolean;
}

interface Props {
    shift: Shift | null;
    favorites: PosProduct[];
    customers?: Array<{ id: number; name: string; code: string | null; price_list_id: number | null }>;
    priceMaps?: Record<number, Record<number, number>>;
    lastSale: LastSale | null;
    tax: TaxConfig;
    can: { sell: boolean; open_shift: boolean; close_shift: boolean; void: boolean };
    cashier: { id: number; name: string } | null;
}

function formatMoney(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function Show({
    shift,
    favorites,
    customers = [],
    priceMaps = {},
    lastSale,
    tax,
    can,
    cashier,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const { errors } = usePage().props as { errors?: Record<string, string> };
    const searchRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PosProduct[]>(favorites);
    const [searching, setSearching] = useState(false);
    const [cart, setCart] = useState<CartLine[]>([]);
    const [partnerId, setPartnerId] = useState<string>('');
    const [payOpen, setPayOpen] = useState(false);
    const [successSale, setSuccessSale] = useState<LastSale | null>(lastSale);
    const [toast, setToast] = useState<string | null>(null);
    const [parkedList, setParkedList] = useState<ParkedCart[]>([]);
    const [parkedOpen, setParkedOpen] = useState(false);

    const payForm = useForm({
        pos_shift_id: shift?.id ?? 0,
        partner_id: '' as string | number,
        items: [] as Array<{ product_id: number; quantity: number; unit_price: number }>,
        payment_method: 'cash',
        amount_tendered: '' as string | number,
        payment_reference: '',
        notes: '',
    });

    const selectedPartner = useMemo(
        () => customers.find((customer) => String(customer.id) === partnerId) ?? null,
        [customers, partnerId],
    );

    const customerOptions = useMemo(
        () => [
            { value: '', label: t('pos.terminal.walk_in') },
            ...customers.map((customer) => ({
                value: String(customer.id),
                label: customer.code ? `${customer.name} (${customer.code})` : customer.name,
            })),
        ],
        [customers, t],
    );

    const resolveUnitPrice = useCallback(
        (productId: number, catalogPrice: number): number => {
            const listId = selectedPartner?.price_list_id;
            if (listId && priceMaps[listId]?.[productId] !== undefined) {
                return Number(priceMaps[listId][productId]);
            }

            return catalogPrice;
        },
        [priceMaps, selectedPartner],
    );

    useEffect(() => {
        setResults(favorites);
    }, [favorites]);

    useEffect(() => {
        setCart((prev) =>
            prev.map((line) => {
                const catalog = favorites.find((product) => product.id === line.product_id);
                const base = catalog?.price ?? line.unit_price;

                return { ...line, unit_price: resolveUnitPrice(line.product_id, base) };
            }),
        );
    }, [partnerId, resolveUnitPrice, favorites]);

    useEffect(() => {
        if (lastSale) {
            setSuccessSale(lastSale);
            setCart([]);
            setPayOpen(false);
        }
    }, [lastSale]);

    useEffect(() => {
        searchRef.current?.focus();
    }, [shift?.id]);

    useEffect(() => {
        if (!shift) {
            setParkedList([]);
            return;
        }

        setParkedList(readParkedCarts(sessionStorage, shift.id));
    }, [shift?.id]);

    const customerNameById = useCallback(
        (id: string): string => {
            if (!id) {
                return t('pos.terminal.walk_in');
            }

            const customer = customers.find((item) => String(item.id) === id);

            return customer?.name ?? t('pos.terminal.walk_in');
        },
        [customers, t],
    );

    const merchandise = useMemo(
        () => cart.reduce((sum, line) => sum + line.quantity * line.unit_price, 0),
        [cart],
    );

    const totals = useMemo(() => {
        if (tax.enabled && tax.rate > 0 && tax.inclusive) {
            const taxTotal = Math.round((merchandise * tax.rate) / (100 + tax.rate));
            return {
                subtotal: merchandise - taxTotal,
                taxTotal,
                grandTotal: merchandise,
            };
        }

        return { subtotal: merchandise, taxTotal: 0, grandTotal: merchandise };
    }, [merchandise, tax]);

    const tendered = Number(payForm.data.amount_tendered) || 0;
    const changeDue = payForm.data.payment_method === 'cash' ? Math.max(0, tendered - totals.grandTotal) : 0;

    const showToast = (message: string): void => {
        setToast(message);
        window.setTimeout(() => setToast(null), 2500);
    };

    const addProduct = useCallback(
        (product: PosProduct): void => {
            if (!product.is_service && product.available !== null && product.available <= 0) {
                showToast(t('pos.terminal.out_of_stock'));
                return;
            }

            setCart((prev) => {
                const existing = prev.find((line) => line.product_id === product.id);

                if (existing) {
                    const nextQty = existing.quantity + 1;
                    if (!product.is_service && product.available !== null && nextQty > product.available) {
                        showToast(t('pos.terminal.out_of_stock'));
                        return prev;
                    }

                    return prev.map((line) =>
                        line.product_id === product.id ? { ...line, quantity: nextQty } : line,
                    );
                }

                return [
                    ...prev,
                    {
                        product_id: product.id,
                        name: product.name,
                        unit: product.unit,
                        unit_price: resolveUnitPrice(product.id, product.price),
                        quantity: 1,
                        available: product.available,
                        is_service: product.is_service,
                        image: product.image,
                    },
                ];
            });
            setSuccessSale(null);
        },
        [t, resolveUnitPrice],
    );

    const setQty = (productId: number, quantity: number): void => {
        setCart((prev) =>
            prev
                .map((line) => {
                    if (line.product_id !== productId) {
                        return line;
                    }

                    if (!line.is_service && line.available !== null && quantity > line.available) {
                        showToast(t('pos.terminal.out_of_stock'));
                        return line;
                    }

                    return { ...line, quantity };
                })
                .filter((line) => line.quantity > 0),
        );
    };

    const removeLine = (productId: number): void => {
        setCart((prev) => prev.filter((line) => line.product_id !== productId));
    };

    useEffect(() => {
        if (!shift) {
            return;
        }

        const handle = window.setTimeout(async () => {
            const q = query.trim();
            if (q === '') {
                setResults(favorites);
                return;
            }

            setSearching(true);
            try {
                const url = new URL(route('module.pos.products.search'), window.location.origin);
                url.searchParams.set('q', q);
                url.searchParams.set('warehouse_id', String(shift.warehouse_id));
                const response = await fetch(url.toString(), {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });
                const data = await response.json();
                const products: PosProduct[] = data.products ?? [];
                setResults(products);

                if (products.length === 1 && (products[0].barcode === q || products[0].sku === q || products[0].barcode === q)) {
                    // barcode exact match handled on Enter
                }
            } finally {
                setSearching(false);
            }
        }, 150);

        return () => window.clearTimeout(handle);
    }, [query, shift, favorites]);

    const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        const q = query.trim();
        if (!q || results.length === 0) {
            return;
        }

        const exact =
            results.find((p) => p.barcode === q || p.sku === q) ??
            (results.length === 1 ? results[0] : null);

        if (exact) {
            addProduct(exact);
            setQuery('');
            setResults(favorites);
        }
    };

    useEffect(() => {
        const onKey = (event: KeyboardEvent): void => {
            if (event.key === 'F2') {
                event.preventDefault();
                searchRef.current?.focus();
            }
            if (event.key === 'F4' && cart.length > 0 && can.sell) {
                event.preventDefault();
                setPayOpen(true);
            }
            if (event.key === 'Escape') {
                setPayOpen(false);
                setParkedOpen(false);
            }
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [cart.length, can.sell]);

    const parkCart = (): void => {
        if (!shift || cart.length === 0) {
            return;
        }

        const result = parkCurrentCart(sessionStorage, shift.id, cart, partnerId);
        if (!result.ok) {
            if (result.reason === 'full') {
                showToast(t('pos.terminal.held_full', { max: MAX_PARKED_CARTS }));
                setParkedOpen(true);
            }
            return;
        }

        setParkedList(result.list);
        setCart([]);
        setPartnerId('');
        showToast(t('pos.terminal.held_parked', { count: result.list.length }));
    };

    const discardParked = (id: string): void => {
        if (!shift) {
            return;
        }

        setParkedList(removeParkedCart(sessionStorage, shift.id, id));
    };

    const restoreParked = (id: string): void => {
        if (!shift) {
            return;
        }

        if (cart.length > 0) {
            const parked = parkCurrentCart(sessionStorage, shift.id, cart, partnerId);
            if (!parked.ok) {
                showToast(t('pos.terminal.held_full', { max: MAX_PARKED_CARTS }));
                return;
            }
            setParkedList(parked.list);
            showToast(t('pos.terminal.held_auto_parked'));
        }

        const taken = takeParkedCart(sessionStorage, shift.id, id);
        if (!taken) {
            setParkedList(readParkedCarts(sessionStorage, shift.id));
            return;
        }

        setParkedList(taken.list);
        setCart(taken.ticket.cart);
        setPartnerId(taken.ticket.partner_id || '');
        setParkedOpen(false);
        showToast(t('pos.terminal.held_restored'));
    };

    const submitPay = (event: FormEvent): void => {
        event.preventDefault();
        if (!shift || !can.sell || cart.length === 0) {
            return;
        }

        payForm.setData({
            pos_shift_id: shift.id,
            partner_id: partnerId !== '' ? Number(partnerId) : '',
            items: cart.map((line) => ({
                product_id: line.product_id,
                quantity: line.quantity,
                unit_price: line.unit_price,
            })),
            payment_method: payForm.data.payment_method,
            amount_tendered:
                payForm.data.payment_method === 'cash'
                    ? Number(payForm.data.amount_tendered) || totals.grandTotal
                    : totals.grandTotal,
            payment_reference: payForm.data.payment_reference,
            notes: payForm.data.notes,
        });

        payForm.transform((data) => ({
            ...data,
            partner_id: partnerId !== '' ? Number(partnerId) : null,
            amount_tendered:
                data.payment_method === 'cash' ? Number(data.amount_tendered) || totals.grandTotal : totals.grandTotal,
            items: cart.map((line) => ({
                product_id: line.product_id,
                quantity: line.quantity,
                unit_price: line.unit_price,
            })),
            pos_shift_id: shift.id,
        }));

        payForm.post(prefixedRoute('pos.sales.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setCart([]);
                setPartnerId('');
                setPayOpen(false);
                sessionStorage.removeItem(PARK_KEY);
            },
        });
    };

    if (!shift) {
        return (
            <PosLayout title={t('pos.terminal.title')} fullBleed allowFullscreen>
                <Head title={t('pos.terminal.title')} />
                <div className="flex min-h-[70vh] flex-1 flex-col items-center justify-center px-6 text-center">
                    <p className="text-lg text-[var(--pos-muted)]">{t('pos.terminal.no_shift')}</p>
                    <button
                        type="button"
                        onClick={() => router.visit(`${prefixedRoute('pos.shifts.index')}?open=1`)}
                        className="mt-6 rounded-[10px] bg-[var(--pos-accent)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
                    >
                        {t('pos.actions.open_shift')}
                    </button>
                </div>
            </PosLayout>
        );
    }

    return (
        <PosLayout
            title={t('pos.terminal.title')}
            fullBleed
            allowFullscreen
            header={
                <div className="hidden items-center gap-3 text-sm text-[var(--pos-muted)] md:flex">
                    <span className="font-medium text-[var(--pos-ink)]">{shift.warehouse.name}</span>
                    <span>·</span>
                    <span>{t('pos.terminal.shift_label', { id: shift.id })}</span>
                    <span>·</span>
                    <span>
                        {t('pos.terminal.cashier')}: {cashier?.name ?? shift.opener.name}
                    </span>
                </div>
            }
        >
            <Head title={t('pos.terminal.title')} />

            {toast && (
                <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[var(--pos-ink)] px-4 py-2 text-sm text-white shadow-lg">
                    {toast}
                </div>
            )}

            {successSale && (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-emerald-50/80 px-6 py-12 text-center animate-[pulse_0.6s_ease-out_1]">
                    <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">{t('pos.terminal.success_title')}</p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-900">
                        {t('pos.terminal.success_receipt', { code: successSale.code })}
                    </p>
                    {Number(successSale.change_due) > 0 && (
                        <>
                            <p
                                className="mt-6 text-5xl font-semibold tabular-nums text-emerald-800"
                                style={{ fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}
                            >
                                {formatMoney(Number(successSale.change_due))}
                            </p>
                            <p className="mt-2 text-[var(--pos-muted)]">{t('pos.terminal.change')}</p>
                        </>
                    )}
                    <div className="mt-10 flex flex-wrap justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="rounded-[10px] border border-emerald-300 bg-white px-5 py-3 text-sm font-semibold text-emerald-900"
                        >
                            {t('pos.actions.print_receipt')}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSuccessSale(null);
                                router.visit(prefixedRoute('pos.terminal'), { replace: true });
                                searchRef.current?.focus();
                            }}
                            className="rounded-[10px] bg-[var(--pos-pay)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--pos-pay-hover)]"
                        >
                            {t('pos.actions.new_sale')}
                        </button>
                    </div>
                </div>
            )}

            {!successSale && (
                <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                    <section className="flex min-h-0 flex-1 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">
                        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
                            <input
                                ref={searchRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={onSearchKeyDown}
                                placeholder={t('pos.terminal.search_placeholder')}
                                className="h-12 w-full rounded-xl border-slate-200 text-base shadow-sm focus:border-[var(--pos-accent)] focus:ring-[var(--pos-accent)]"
                            />
                            <button
                                type="button"
                                onClick={() => setParkedOpen((open) => !open)}
                                className="relative hidden h-12 shrink-0 rounded-xl border border-slate-200 px-3 text-sm text-[var(--pos-muted)] hover:bg-slate-50 sm:block"
                            >
                                {t('pos.actions.recall')}
                                {parkedList.length > 0 && (
                                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--pos-accent)] px-1 text-[10px] font-semibold text-white">
                                        {parkedList.length}
                                    </span>
                                )}
                            </button>
                        </div>
                        {parkedOpen && (
                            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pos-muted)]">
                                        {t('pos.terminal.held_title')}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setParkedOpen(false)}
                                        className="text-xs text-[var(--pos-muted)] hover:text-[var(--pos-ink)]"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                </div>
                                {parkedList.length === 0 ? (
                                    <p className="text-sm text-[var(--pos-muted)]">{t('pos.terminal.held_empty')}</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {parkedList.map((ticket, index) => (
                                            <li
                                                key={ticket.id}
                                                className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-[var(--pos-ink)]">
                                                        #{index + 1} · {customerNameById(ticket.partner_id)}
                                                    </p>
                                                    <p className="text-xs text-[var(--pos-muted)]">
                                                        {t('pos.terminal.held_items', { count: cartItemCount(ticket.cart) })}
                                                        {' · '}
                                                        <span
                                                            className="tabular-nums"
                                                            style={{ fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}
                                                        >
                                                            {formatMoney(cartMerchandise(ticket.cart))}
                                                        </span>
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => restoreParked(ticket.id)}
                                                    className="rounded-lg bg-[var(--pos-accent)] px-3 py-1.5 text-xs font-semibold text-white"
                                                >
                                                    {t('pos.terminal.held_restore')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => discardParked(ticket.id)}
                                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-[var(--pos-danger)]"
                                                >
                                                    {t('pos.terminal.held_discard')}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto p-3">
                            {searching && <p className="mb-2 text-xs text-[var(--pos-muted)]">…</p>}
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                                {results.map((product) => {
                                    const disabled =
                                        !product.is_service && product.available !== null && product.available <= 0;

                                    return (
                                        <button
                                            key={product.id}
                                            type="button"
                                            disabled={disabled || !can.sell}
                                            onClick={() => addProduct(product)}
                                            className={`flex min-h-[7.5rem] flex-col overflow-hidden rounded-lg border bg-white text-left transition ${
                                                disabled
                                                    ? 'cursor-not-allowed opacity-50'
                                                    : 'hover:border-[var(--pos-accent)] hover:shadow-sm'
                                            }`}
                                        >
                                            <div className="aspect-square max-h-20 w-full shrink-0 bg-slate-100 sm:max-h-24">
                                                {product.image ? (
                                                    <img src={product.image} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-lg font-semibold text-slate-400">
                                                        {product.name.slice(0, 1).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex min-h-0 flex-1 flex-col gap-0.5 p-1.5">
                                                <p className="line-clamp-2 text-[11px] font-medium leading-tight sm:text-xs">
                                                    {product.name}
                                                </p>
                                                <p
                                                    className="mt-auto text-[11px] font-semibold tabular-nums text-[var(--pos-ink)] sm:text-xs"
                                                    style={{ fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}
                                                >
                                                    {formatMoney(product.price)}
                                                </p>
                                                {!product.is_service && (
                                                    <p className="text-[10px] leading-tight text-[var(--pos-muted)]">
                                                        {t('pos.terminal.stock')}: {product.available ?? '—'}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <aside className="flex w-full flex-col bg-white lg:w-[42%] lg:max-w-md">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--pos-muted)]">
                                {t('pos.terminal.cart')}
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setParkedOpen((open) => !open)}
                                    className="relative text-xs font-medium text-[var(--pos-muted)] hover:text-[var(--pos-ink)] sm:hidden"
                                >
                                    {t('pos.actions.recall')}
                                    {parkedList.length > 0 ? ` (${parkedList.length})` : ''}
                                </button>
                                <button
                                    type="button"
                                    onClick={parkCart}
                                    disabled={cart.length === 0}
                                    className="text-xs font-medium text-[var(--pos-muted)] hover:text-[var(--pos-ink)] disabled:opacity-40"
                                >
                                    {t('pos.actions.park')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCart([])}
                                    disabled={cart.length === 0}
                                    className="text-xs font-medium text-[var(--pos-danger)] disabled:opacity-40"
                                >
                                    {t('pos.actions.clear_cart')}
                                </button>
                            </div>
                        </div>

                        {customers.length > 0 && (
                            <div className="border-b border-slate-200 px-4 py-2">
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--pos-muted)]">
                                    {t('pos.terminal.customer')}
                                </label>
                                <Select
                                    searchable
                                    maxVisibleOptions={10}
                                    value={partnerId}
                                    onChange={setPartnerId}
                                    options={customerOptions}
                                    placeholder={t('pos.terminal.walk_in')}
                                    searchPlaceholder={t('pos.terminal.search_customer')}
                                    emptyText={t('pos.terminal.no_customers')}
                                    noResultsText={t('pos.terminal.no_customer_match')}
                                    className="w-full"
                                />
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto px-4 py-2">
                            {cart.length === 0 ? (
                                <p className="py-16 text-center text-sm text-[var(--pos-muted)]">{t('pos.terminal.empty_cart')}</p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {cart.map((line) => (
                                        <li
                                            key={line.product_id}
                                            className="flex items-center gap-3 py-3 animate-[fadeIn_0.2s_ease-out]"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{line.name}</p>
                                                <p
                                                    className="text-xs tabular-nums text-[var(--pos-muted)]"
                                                    style={{ fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}
                                                >
                                                    {formatMoney(line.unit_price)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-lg"
                                                    onClick={() => setQty(line.product_id, line.quantity - 1)}
                                                >
                                                    −
                                                </button>
                                                <span
                                                    className="w-10 text-center text-sm font-semibold tabular-nums"
                                                    style={{ fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}
                                                >
                                                    {line.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-lg"
                                                    onClick={() => setQty(line.product_id, line.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <p
                                                className="w-20 text-right text-sm font-semibold tabular-nums"
                                                style={{ fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}
                                            >
                                                {formatMoney(line.quantity * line.unit_price)}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => removeLine(line.product_id)}
                                                className="text-[var(--pos-danger)]"
                                                aria-label="Remove"
                                            >
                                                ×
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="border-t border-slate-200 px-4 py-4">
                            {(errors?.cart || errors?.items) && (
                                <p className="mb-3 text-sm text-[var(--pos-danger)]">{errors.cart || errors.items}</p>
                            )}
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between text-[var(--pos-muted)]">
                                    <span>{t('pos.terminal.subtotal')}</span>
                                    <span className="tabular-nums" style={{ fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}>
                                        {formatMoney(totals.subtotal)}
                                    </span>
                                </div>
                                {tax.enabled && (
                                    <div className="flex justify-between text-[var(--pos-muted)]">
                                        <span>
                                            {t('pos.terminal.tax')} {tax.rate}%
                                        </span>
                                        <span className="tabular-nums" style={{ fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}>
                                            {formatMoney(totals.taxTotal)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 text-base font-semibold">
                                    <span>{t('pos.terminal.total')}</span>
                                    <span className="tabular-nums" style={{ fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}>
                                        {formatMoney(totals.grandTotal)}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={cart.length === 0 || !can.sell}
                                onClick={() => setPayOpen(true)}
                                className="mt-4 flex h-16 w-full items-center justify-center rounded-[10px] bg-[var(--pos-pay)] text-lg font-semibold text-white transition hover:bg-[var(--pos-pay-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {t('pos.actions.pay')} · {formatMoney(totals.grandTotal)}
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {payOpen && (
                <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 sm:items-center">
                    <form
                        onSubmit={submitPay}
                        className="w-full max-w-md animate-[slideUp_0.25s_ease-out] rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">{t('pos.terminal.payment')}</h3>
                            <button type="button" onClick={() => setPayOpen(false)} className="text-2xl text-[var(--pos-muted)]">
                                ×
                            </button>
                        </div>
                        <p
                            className="mb-4 text-3xl font-semibold tabular-nums"
                            style={{ fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}
                        >
                            {formatMoney(totals.grandTotal)}
                        </p>
                        <div className="mb-4 grid grid-cols-2 gap-2">
                            {(['cash', 'qris', 'transfer', 'card'] as const).map((method) => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => payForm.setData('payment_method', method)}
                                    className={`rounded-xl border px-3 py-3 text-sm font-medium ${
                                        payForm.data.payment_method === method
                                            ? 'border-[var(--pos-accent)] bg-slate-50 text-[var(--pos-accent)]'
                                            : 'border-slate-200 text-[var(--pos-muted)]'
                                    }`}
                                >
                                    {t(`pos.payment_methods.${method}`)}
                                </button>
                            ))}
                        </div>
                        {payForm.data.payment_method === 'cash' ? (
                            <div className="mb-4">
                                <label className="mb-1 block text-sm text-[var(--pos-muted)]">{t('pos.terminal.tendered')}</label>
                                <input
                                    type="number"
                                    min={0}
                                    step="1"
                                    value={payForm.data.amount_tendered}
                                    onChange={(e) => payForm.setData('amount_tendered', e.target.value)}
                                    className="h-12 w-full rounded-xl border-slate-200 text-lg tabular-nums"
                                    autoFocus
                                />
                                <p className="mt-2 text-sm text-[var(--pos-muted)]">
                                    {t('pos.terminal.change')}:{' '}
                                    <span className="font-semibold text-[var(--pos-ink)] tabular-nums">{formatMoney(changeDue)}</span>
                                </p>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <label className="mb-1 block text-sm text-[var(--pos-muted)]">{t('pos.terminal.reference')}</label>
                                <input
                                    type="text"
                                    value={payForm.data.payment_reference}
                                    onChange={(e) => payForm.setData('payment_reference', e.target.value)}
                                    className="h-12 w-full rounded-xl border-slate-200"
                                />
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={payForm.processing}
                            className="flex h-14 w-full items-center justify-center rounded-[10px] bg-[var(--pos-pay)] text-base font-semibold text-white hover:bg-[var(--pos-pay-hover)] disabled:opacity-50"
                        >
                            {t('pos.actions.confirm_pay')}
                        </button>
                    </form>
                </div>
            )}

            <style>{`
                @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
            `}</style>
        </PosLayout>
    );
}
