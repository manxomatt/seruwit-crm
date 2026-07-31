import Select from '@/Components/Select';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import axios from 'axios';

interface Corridor {
    id: number;
    code: string;
    name: string;
    origin_city: string;
    destination_city: string;
    service_type: string;
    base_fare: string | number;
}

interface Departure {
    id: number;
    departure_number: string;
    depart_date: string;
    depart_time: string;
    seats_remaining: number;
    seat_capacity: number;
    unit_fare: number;
    service_type: string;
    corridor: { id: number; name: string } | null;
}

interface Props {
    brand: { name: string; color: string };
    filters: { date: string; corridor_id: number | null };
    corridors: Corridor[];
    departures: Departure[];
    hold_ttl_minutes: number;
    gateway_available: boolean;
}

const money = (v: number) => 'Rp ' + Number(v).toLocaleString('id-ID');

const fieldClassName =
    'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export default function Search({ brand, filters, corridors, departures, hold_ttl_minutes, gateway_available }: Props) {
    const [selected, setSelected] = useState<Departure | null>(null);
    const [otpHint, setOtpHint] = useState<string | null>(null);

    const searchForm = useForm({
        date: filters.date,
        corridor_id: filters.corridor_id ? String(filters.corridor_id) : '',
    });

    const holdForm = useForm({
        departure_id: 0,
        passenger_count: 1,
        pickup_mode: 'pool',
        dropoff_mode: 'pool',
        booker_phone: '',
        otp_code: '',
        passengers: [{ name: '', phone: '', id_number: '' }],
    });

    const corridorOptions = useMemo(
        () =>
            corridors.map((c) => ({
                value: String(c.id),
                label: `${c.name || `${c.origin_city} → ${c.destination_city}`} · ${money(Number(c.base_fare))}`,
            })),
        [corridors],
    );

    const runSearch = (next?: { date?: string; corridor_id?: string }) => {
        const data = {
            date: next?.date ?? searchForm.data.date,
            corridor_id: next?.corridor_id ?? searchForm.data.corridor_id,
        };
        router.get(route('book.shuttle.search'), data, { preserveState: true, replace: true });
    };

    const submitSearch = (e: FormEvent) => {
        e.preventDefault();
        runSearch();
    };

    const selectDeparture = (d: Departure) => {
        setSelected(d);
        holdForm.setData({
            ...holdForm.data,
            departure_id: d.id,
            pickup_mode: d.service_type === 'door' ? 'door' : 'pool',
            dropoff_mode: d.service_type === 'door' ? 'door' : 'pool',
        });
    };

    const syncPax = (count: number) => {
        const passengers = [...holdForm.data.passengers];
        while (passengers.length < count) {
            passengers.push({ name: '', phone: '', id_number: '' });
        }
        while (passengers.length > count) {
            passengers.pop();
        }
        holdForm.setData({ ...holdForm.data, passenger_count: count, passengers });
    };

    const sendOtp = async () => {
        const { data } = await axios.post(route('book.shuttle.otp'), {
            booker_phone: holdForm.data.booker_phone,
        });
        setOtpHint(data.debug_code ? `OTP (dev): ${data.debug_code}` : data.message);
    };

    const submitHold = (e: FormEvent) => {
        e.preventDefault();
        holdForm.post(route('book.shuttle.hold'));
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8" style={{ ['--brand' as string]: brand.color }}>
            <Head title={`${brand.name} — Book`} />
            <div className="mx-auto max-w-3xl px-4">
                <div className="mb-6 flex items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold" style={{ color: brand.color }}>
                            {brand.name}
                        </h1>
                        <p className="text-sm text-slate-600">Book a seat · hold {hold_ttl_minutes} min · pay later{gateway_available ? ' or online' : ''}</p>
                    </div>
                    <Link href={route('book.shuttle.history')} className="text-sm font-medium" style={{ color: brand.color }}>
                        My bookings
                    </Link>
                </div>

                <form onSubmit={submitSearch} className="mb-6 grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3">
                    <div className="min-w-0 sm:col-span-1">
                        <label className="text-xs font-medium text-slate-500">Corridor</label>
                        <div className="mt-1">
                            <Select
                                value={searchForm.data.corridor_id}
                                onChange={(value) => {
                                    searchForm.setData('corridor_id', value);
                                    setSelected(null);
                                    if (value) {
                                        runSearch({ corridor_id: value });
                                    }
                                }}
                                options={corridorOptions}
                                placeholder="Select corridor…"
                                searchable
                                emptyText="No corridors available"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Date</label>
                        <input
                            type="date"
                            className={fieldClassName}
                            value={searchForm.data.date}
                            onChange={(e) => {
                                searchForm.setData('date', e.target.value);
                                if (searchForm.data.corridor_id) {
                                    runSearch({ date: e.target.value });
                                }
                            }}
                        />
                    </div>
                    <div className="flex items-end">
                        <button type="submit" className="w-full rounded-md px-4 py-2 text-sm font-medium text-white" style={{ background: brand.color }}>
                            Search
                        </button>
                    </div>
                </form>

                <div className="space-y-2">
                    {!searchForm.data.corridor_id ? (
                        <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                            Choose a corridor to see available departures.
                        </p>
                    ) : departures.length === 0 ? (
                        <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">No open departures for this filter.</p>
                    ) : (
                        departures.map((d) => (
                            <button
                                key={d.id}
                                type="button"
                                onClick={() => selectDeparture(d)}
                                className={`flex w-full items-center justify-between rounded-xl bg-white p-4 text-left shadow-sm ring-2 ${selected?.id === d.id ? 'ring-teal-600' : 'ring-transparent'}`}
                            >
                                <div>
                                    <div className="font-medium text-slate-900">
                                        {d.depart_time} · {d.corridor?.name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {d.departure_number} · {d.seats_remaining}/{d.seat_capacity} seats · {money(d.unit_fare)}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {selected && (
                    <form onSubmit={submitHold} className="mt-6 space-y-4 rounded-xl bg-white p-4 shadow-sm">
                        <h2 className="font-semibold text-slate-900">Passengers & contact</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="text-xs font-medium text-slate-500">Seats</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={selected.seats_remaining}
                                    className={fieldClassName}
                                    value={holdForm.data.passenger_count}
                                    onChange={(e) => syncPax(Number(e.target.value) || 1)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Booker phone</label>
                                <div className="mt-1 flex gap-2">
                                    <input
                                        className={`w-full ${fieldClassName} mt-0`}
                                        value={holdForm.data.booker_phone}
                                        onChange={(e) => holdForm.setData('booker_phone', e.target.value)}
                                        placeholder="08…"
                                        required
                                    />
                                    <button type="button" onClick={sendOtp} className="whitespace-nowrap rounded-md border border-gray-300 px-3 text-sm shadow-sm">
                                        Send OTP
                                    </button>
                                </div>
                                {otpHint && <p className="mt-1 text-xs text-teal-700">{otpHint}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">OTP code</label>
                                <input
                                    className={fieldClassName}
                                    value={holdForm.data.otp_code}
                                    onChange={(e) => holdForm.setData('otp_code', e.target.value)}
                                    required
                                />
                                {holdForm.errors.otp_code && <p className="mt-1 text-xs text-red-600">{holdForm.errors.otp_code}</p>}
                            </div>
                        </div>

                        {holdForm.data.passengers.map((p, i) => (
                            <div key={i} className="grid gap-2 sm:grid-cols-3">
                                <input
                                    className={fieldClassName}
                                    placeholder="Passenger name"
                                    value={p.name}
                                    required
                                    onChange={(e) => {
                                        const passengers = [...holdForm.data.passengers];
                                        passengers[i] = { ...passengers[i], name: e.target.value };
                                        holdForm.setData('passengers', passengers);
                                    }}
                                />
                                <input
                                    className={fieldClassName}
                                    placeholder="Phone"
                                    value={p.phone ?? ''}
                                    onChange={(e) => {
                                        const passengers = [...holdForm.data.passengers];
                                        passengers[i] = { ...passengers[i], phone: e.target.value };
                                        holdForm.setData('passengers', passengers);
                                    }}
                                />
                                <input
                                    className={fieldClassName}
                                    placeholder="ID number"
                                    value={p.id_number ?? ''}
                                    onChange={(e) => {
                                        const passengers = [...holdForm.data.passengers];
                                        passengers[i] = { ...passengers[i], id_number: e.target.value };
                                        holdForm.setData('passengers', passengers);
                                    }}
                                />
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={holdForm.processing}
                            className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                            style={{ background: brand.color }}
                        >
                            Hold seats · {money(selected.unit_fare * holdForm.data.passenger_count)}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
