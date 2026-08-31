import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import MoneyInput from '@/Components/MoneyInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ModalHeader } from '../../ShowUi';
import type { AddonCodeOption, ModalRental } from '../types';

interface Props {
    show: boolean;
    rental: ModalRental;
    addonCodes: AddonCodeOption[];
    onClose: () => void;
}

export default function AddonModal({ show, rental, addonCodes, onClose }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const form = useForm({
        addon_code: addonCodes[0]?.value ?? 'other',
        amount: '',
        description: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(prefixedRoute('rental.addons.store', rental.id), {
            onSuccess: () => {
                onClose();
                form.reset('amount', 'description');
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="space-y-4 p-6">
                <ModalHeader
                    tone="primary"
                    icon="➕"
                    title={t('rental.modals.addon', undefined, 'Tambah Layanan Tambahan (Addon)')}
                    subtitle={`Booking ${rental.code} • Layanan / Biaya Ekstra`}
                    onClose={onClose}
                />

                <div>
                    <InputLabel htmlFor="addon_code" value={`${t('rental.fields.addon_code', undefined, 'Pilih Jenis Layanan')} *`} />
                    <Select
                        id="addon_code"
                        className="mt-1 w-full !rounded-xl"
                        value={form.data.addon_code}
                        onChange={(value) => form.setData('addon_code', value)}
                        placeholder={t('rental.placeholders.select_addon_code', undefined, '-- Pilih Layanan --')}
                        searchable
                        maxVisibleOptions={Math.max(addonCodes.length, 1)}
                        options={addonCodes.map((option) => ({
                            value: option.value,
                            label: option.label || t(`rental.addon.codes.${option.value}`, undefined, option.value),
                        }))}
                    />
                    <InputError message={form.errors.addon_code} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="addon_amount" value={`${t('rental.fields.addon_amount', undefined, 'Nominal Biaya')} *`} />
                    <MoneyInput
                        id="addon_amount"
                        value={form.data.amount}
                        onChange={(value) => form.setData('amount', value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={form.errors.amount} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="addon_desc" value={t('rental.fields.addon_description', undefined, 'Keterangan Tambahan')} />
                    <TextInput
                        id="addon_desc"
                        value={form.data.description}
                        onChange={(e) => form.setData('description', e.target.value)}
                        className="mt-1 w-full !rounded-xl"
                        placeholder={t('rental.placeholders.addon_description', undefined, 'Catatan atau detail layanan...')}
                    />
                    <InputError message={form.errors.description} className="mt-1" />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                    <SecondaryButton type="button" onClick={onClose}>
                        {t('common.cancel', undefined, 'Batal')}
                    </SecondaryButton>
                    <PrimaryButton disabled={form.processing} className="rounded-xl px-5 py-2">
                        {form.processing ? 'Menyimpan...' : t('rental.actions.save_addon', undefined, 'Tambahkan Layanan')}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
