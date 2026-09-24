import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useTrans } from '@/hooks/useTrans';
import { useForm } from '@inertiajs/react';
import React, { useRef, useState } from 'react';
import { ModalHeader } from '../../ShowUi';
import type { Rental } from '../types';

interface Props {
    show: boolean;
    rental: Rental;
    uploadUrl: string;
    onClose: () => void;
}

export default function UploadDocumentsModal({
    show,
    rental,
    uploadUrl,
    onClose,
}: Props): JSX.Element {
    const { t } = useTrans();
    const ktpInputRef = useRef<HTMLInputElement>(null);
    const simInputRef = useRef<HTMLInputElement>(null);

    const [ktpPreview, setKtpPreview] = useState<string | null>(null);
    const [simPreview, setSimPreview] = useState<string | null>(null);

    const form = useForm<{
        ktp: File | null;
        sim: File | null;
    }>({
        ktp: null,
        sim: null,
    });

    const handleKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        form.setData('ktp', file);
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setKtpPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setKtpPreview(null);
        }
    };

    const handleSimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        form.setData('sim', file);
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setSimPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setSimPreview(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.data.ktp && !form.data.sim) {
            return;
        }

        form.post(uploadUrl, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setKtpPreview(null);
                setSimPreview(null);
                onClose();
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <ModalHeader
                    tone="primary"
                    icon="🪪"
                    title={t('rental.documents.modal_title', undefined, 'Unggah / Perbarui Dokumen Identitas')}
                    subtitle={`Customer: ${rental.partner.name} · ${rental.code}`}
                    onClose={onClose}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* KTP Upload */}
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-700/80 dark:bg-slate-800/40 space-y-3">
                        <div className="flex items-center justify-between">
                            <InputLabel
                                htmlFor="ktp_upload"
                                value={t('rental.documents.ktp_label', undefined, 'Foto e-KTP')}
                                className="font-bold text-xs"
                            />
                            {rental.passenger_ktp_path && (
                                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    Sudah Ada
                                </span>
                            )}
                        </div>

                        {ktpPreview ? (
                            <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                <img src={ktpPreview} alt="Preview KTP" className="h-28 w-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        form.setData('ktp', null);
                                        setKtpPreview(null);
                                        if (ktpInputRef.current) ktpInputRef.current.value = '';
                                    }}
                                    className="absolute top-1 right-1 rounded-full bg-slate-900/70 p-1 text-white hover:bg-slate-900"
                                >
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ) : form.data.ktp ? (
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                <span>📄</span>
                                <span className="truncate flex-1 font-medium">{form.data.ktp.name}</span>
                            </div>
                        ) : null}

                        <input
                            ref={ktpInputRef}
                            id="ktp_upload"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={handleKtpChange}
                            className="block w-full text-xs text-slate-500 file:mr-2.5 file:rounded-xl file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-300"
                        />
                        <p className="text-[10px] text-slate-400">Format: JPG, PNG, WEBP, PDF (Maks. 5MB)</p>
                        <InputError message={form.errors.ktp} className="mt-1" />
                    </div>

                    {/* SIM Upload */}
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-700/80 dark:bg-slate-800/40 space-y-3">
                        <div className="flex items-center justify-between">
                            <InputLabel
                                htmlFor="sim_upload"
                                value={t('rental.documents.sim_label', undefined, 'Foto SIM')}
                                className="font-bold text-xs"
                            />
                            {rental.passenger_sim_path && (
                                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    Sudah Ada
                                </span>
                            )}
                        </div>

                        {simPreview ? (
                            <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                <img src={simPreview} alt="Preview SIM" className="h-28 w-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        form.setData('sim', null);
                                        setSimPreview(null);
                                        if (simInputRef.current) simInputRef.current.value = '';
                                    }}
                                    className="absolute top-1 right-1 rounded-full bg-slate-900/70 p-1 text-white hover:bg-slate-900"
                                >
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ) : form.data.sim ? (
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                <span>📄</span>
                                <span className="truncate flex-1 font-medium">{form.data.sim.name}</span>
                            </div>
                        ) : null}

                        <input
                            ref={simInputRef}
                            id="sim_upload"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={handleSimChange}
                            className="block w-full text-xs text-slate-500 file:mr-2.5 file:rounded-xl file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-300"
                        />
                        <p className="text-[10px] text-slate-400">Format: JPG, PNG, WEBP, PDF (Maks. 5MB)</p>
                        <InputError message={form.errors.sim} className="mt-1" />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <SecondaryButton type="button" onClick={onClose} disabled={form.processing}>
                        Batal
                    </SecondaryButton>
                    <PrimaryButton
                        type="submit"
                        disabled={form.processing || (!form.data.ktp && !form.data.sim)}
                        className="rounded-xl px-5 py-2 text-xs font-bold"
                    >
                        {form.processing ? 'Menyimpan...' : 'Simpan Dokumen'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
