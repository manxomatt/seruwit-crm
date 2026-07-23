import CanvassingLayout from '@/Layouts/CanvassingLayout';
import { Head, Link } from '@inertiajs/react';

interface Salesperson { id: number; name: string; area: string | null; }
interface Partner { id: number; name: string; }
interface Visit { id: number; partner: Partner; checked_in_at: string; checked_out_at: string | null; outcome: string; }
interface Plan { id: number; plan_date: string; notes: string | null; status: string; }

interface Props {
    salesperson: Salesperson;
    todayVisits: Visit[];
    openVisit: (Visit & { partner: Partner }) | null;
    todayPlan: Plan | null;
}

const outcomeColor = (o: string) => ({
    pending: 'border-l-orange-400 bg-orange-50',
    contacted: 'border-l-blue-400 bg-blue-50',
    interested: 'border-l-green-400 bg-green-50',
    not_interested: 'border-l-red-400 bg-red-50',
    no_contact: 'border-l-gray-300 bg-gray-50',
    callback: 'border-l-purple-400 bg-purple-50',
})[o] ?? 'border-l-gray-300 bg-gray-50';

const outcomeLabel = (o: string) => ({
    pending: 'Sedang Berlangsung',
    contacted: 'Terhubung',
    interested: 'Tertarik',
    not_interested: 'Tidak Tertarik',
    no_contact: 'Tidak Ada Kontak',
    callback: 'Callback',
})[o] ?? o;

export default function Today({ salesperson, todayVisits, openVisit, todayPlan }: Props): JSX.Element {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <CanvassingLayout salespersonName={salesperson.name}>
            <Head title="Hari Ini" />

            <div className="mb-4">
                <p className="text-xs text-gray-500">{today}</p>
                <h2 className="text-lg font-semibold text-gray-900">Aktivitas Hari Ini</h2>
                {salesperson.area && <p className="text-sm text-gray-500">{salesperson.area}</p>}
            </div>

            {/* Open visit alert */}
            {openVisit && (
                <div className="mb-4 rounded-lg border-2 border-orange-400 bg-orange-50 p-4">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Kunjungan Aktif</p>
                            <p className="mt-0.5 text-base font-bold text-gray-900">{openVisit.partner.name}</p>
                            <p className="text-xs text-gray-500">Check-in: {new Date(openVisit.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <Link href={route('module.canvassing.portal.visits.show', openVisit.id)} className="shrink-0 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white">
                            Lanjutkan
                        </Link>
                    </div>
                </div>
            )}

            {/* Check in CTA */}
            {!openVisit && (
                <Link
                    href={route('module.canvassing.portal.checkin')}
                    className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-4 text-base font-bold text-white shadow-md active:bg-emerald-700"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Mulai Kunjungan
                </Link>
            )}

            {/* Today's plan */}
            {todayPlan && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Rencana Hari Ini</p>
                    {todayPlan.notes && <p className="mt-1 text-sm text-gray-700">{todayPlan.notes}</p>}
                </div>
            )}

            {/* Visit list */}
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Kunjungan ({todayVisits.length})</h3>
            </div>

            {todayVisits.length === 0 && !openVisit && (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                    <p className="text-sm text-gray-400">Belum ada kunjungan hari ini.</p>
                    <p className="mt-1 text-xs text-gray-400">Tekan tombol di atas untuk memulai.</p>
                </div>
            )}

            <div className="space-y-2">
                {todayVisits.map((v) => (
                    <Link
                        key={v.id}
                        href={route('module.canvassing.portal.visits.show', v.id)}
                        className={`block rounded-lg border-l-4 p-3 shadow-sm ${outcomeColor(v.outcome)}`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate font-medium text-gray-900">{v.partner.name}</p>
                                <p className="text-xs text-gray-500">
                                    {new Date(v.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    {v.checked_out_at && ` — ${new Date(v.checked_out_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                                </p>
                            </div>
                            <span className="shrink-0 text-xs font-medium text-gray-600">{outcomeLabel(v.outcome)}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </CanvassingLayout>
    );
}
