import CanvassingLayout from '@/Layouts/CanvassingLayout';
import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

interface Partner { id: number; name: string; phone: string | null; }
interface Photo { id: number; url: string; }
interface Visit {
    id: number;
    partner: Partner;
    checked_in_at: string;
    checked_out_at: string | null;
    outcome: string;
    notes: string | null;
    photos: Photo[];
    is_open: boolean;
}
interface Salesperson { id: number; name: string; }

interface Props { salesperson: Salesperson; visit: Visit; }

const outcomes = [
    { value: 'contacted', label: 'Terhubung', color: 'border-blue-400 bg-blue-50 text-blue-700' },
    { value: 'interested', label: 'Tertarik', color: 'border-green-400 bg-green-50 text-green-700' },
    { value: 'not_interested', label: 'Tidak Tertarik', color: 'border-red-400 bg-red-50 text-red-700' },
    { value: 'no_contact', label: 'Tidak Ada Kontak', color: 'border-gray-300 bg-gray-50 text-gray-600' },
    { value: 'callback', label: 'Callback', color: 'border-purple-400 bg-purple-50 text-purple-700' },
];

export default function VisitDetail({ salesperson, visit }: Props): JSX.Element {
    const [photos, setPhotos] = useState<string[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm({
        outcome: '',
        notes: visit.notes ?? '',
        photos: [] as string[],
    });

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

    const checkinTime = new Date(visit.checked_in_at);
    const elapsed = Math.round((Date.now() - checkinTime.getTime()) / 60000);

    return (
        <CanvassingLayout salespersonName={salesperson.name} title={visit.partner.name} back={route('module.canvassing.portal.today')}>
            <Head title={visit.partner.name} />

            {/* Visit header */}
            <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">{visit.partner.name}</p>
                {visit.partner.phone && <p className="text-sm text-gray-500">{visit.partner.phone}</p>}
                <p className="mt-1 text-xs text-gray-400">
                    Check-in: {checkinTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    {visit.is_open && <span className="ml-2 text-orange-500">({elapsed} menit berlangsung)</span>}
                </p>
            </div>

            {/* Existing photos (completed visit) */}
            {visit.photos.length > 0 && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <p className="mb-2 text-xs font-semibold text-gray-500">Foto ({visit.photos.length})</p>
                    <div className="grid grid-cols-3 gap-1">
                        {visit.photos.map((p) => (
                            <img key={p.id} src={p.url} alt="" className="aspect-square rounded object-cover" />
                        ))}
                    </div>
                </div>
            )}

            {/* Checkout form — only when open */}
            {visit.is_open ? (
                <form onSubmit={submit} className="space-y-4">
                    {/* Outcome selection */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Hasil Kunjungan *</label>
                        <div className="grid grid-cols-1 gap-2">
                            {outcomes.map((o) => (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => setData('outcome', o.value)}
                                    className={`rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium transition-all ${data.outcome === o.value ? o.color + ' border-opacity-100' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                                >
                                    {o.label}
                                </button>
                            ))}
                        </div>
                        <InputError message={errors.outcome} className="mt-1" />
                    </div>

                    {/* Notes */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <label htmlFor="notes" className="mb-1 block text-sm font-semibold text-gray-700">Catatan</label>
                        <textarea
                            id="notes"
                            rows={3}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="Apa yang dibahas? Tindak lanjut yang dibutuhkan?"
                            className="w-full rounded-md border-gray-300 text-sm"
                        />
                    </div>

                    {/* Photos */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-700">Foto ({photos.length}/5)</label>
                            {photos.length < 5 && (
                                <button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-medium text-emerald-600">+ Tambah Foto</button>
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
                                Ambil foto
                            </button>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing || !data.outcome}
                        className="w-full rounded-xl bg-emerald-600 py-4 text-base font-bold text-white shadow-md disabled:opacity-50 active:bg-emerald-700"
                    >
                        {processing ? 'Memproses…' : 'Check Out & Selesai'}
                    </button>
                </form>
            ) : (
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Kunjungan Selesai</p>
                    <p className="text-sm text-gray-900">Hasil: <span className="font-medium">{visit.outcome.replace('_', ' ')}</span></p>
                    {visit.notes && <p className="mt-2 text-sm text-gray-600">{visit.notes}</p>}
                </div>
            )}
        </CanvassingLayout>
    );
}
