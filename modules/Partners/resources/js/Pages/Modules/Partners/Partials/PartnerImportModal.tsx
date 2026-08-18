import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Props {
    show: boolean;
    onClose: () => void;
}

export default function PartnerImportModal({ show, onClose }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{ csv: File | null }>({
        csv: null,
    });

    const close = (): void => {
        reset();
        clearErrors();
        onClose();
    };

    const submit = (event: FormEvent): void => {
        event.preventDefault();
        post(prefixedRoute('partners.import'), {
            forceFormData: true,
            onSuccess: () => close(),
        });
    };

    return (
        <Modal show={show} onClose={close} maxWidth="lg">
            <form onSubmit={submit} className="p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">{t('partners.import.title')}</h2>
                <p className="mt-1 text-xs text-slate-500">{t('partners.import.subtitle')}</p>

                <div className="mt-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-xs text-indigo-900 dark:text-indigo-200 backdrop-blur-sm">
                    <p className="font-medium">{t('partners.import.help')}</p>
                    <a
                        href={prefixedRoute('partners.import.template')}
                        className="mt-2 inline-flex font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        📥 {t('partners.import.download_template')}
                    </a>
                </div>

                <div className="mt-5">
                    <label htmlFor="partners-import-csv" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t('partners.import.file_label')}
                    </label>
                    <input
                        id="partners-import-csv"
                        type="file"
                        accept=".csv,text/csv"
                        className="mt-2 block w-full text-xs text-slate-700 dark:text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-indigo-500/10 file:px-4 file:py-2 file:text-xs file:font-bold file:text-indigo-600 dark:file:text-indigo-400 hover:file:bg-indigo-500/20"
                        onChange={(event) => setData('csv', event.target.files?.[0] ?? null)}
                    />
                    <InputError message={errors.csv} className="mt-2" />
                    <p className="mt-2 text-[11px] text-slate-500">{t('partners.import.file_hint')}</p>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={close} className="!rounded-xl text-xs shadow-sm">
                        {t('common.cancel')}
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={processing || !data.csv} className="!rounded-xl text-xs shadow-sm">
                        {processing ? t('partners.import.importing') : t('partners.import.submit')}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
