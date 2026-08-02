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
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900">{t('partners.import.title')}</h2>
                <p className="mt-1 text-sm text-gray-600">{t('partners.import.subtitle')}</p>

                <div className="mt-4 rounded-md border border-indigo-100 bg-indigo-50/60 px-3 py-3 text-sm text-indigo-900">
                    <p>{t('partners.import.help')}</p>
                    <a
                        href={prefixedRoute('partners.import.template')}
                        className="mt-2 inline-flex font-medium text-indigo-700 hover:underline"
                    >
                        {t('partners.import.download_template')}
                    </a>
                </div>

                <div className="mt-5">
                    <label htmlFor="partners-import-csv" className="block text-sm font-medium text-gray-700">
                        {t('partners.import.file_label')}
                    </label>
                    <input
                        id="partners-import-csv"
                        type="file"
                        accept=".csv,text/csv"
                        className="mt-1 block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                        onChange={(event) => setData('csv', event.target.files?.[0] ?? null)}
                    />
                    <InputError message={errors.csv} className="mt-2" />
                    <p className="mt-2 text-xs text-gray-500">{t('partners.import.file_hint')}</p>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={close}>
                        {t('common.cancel')}
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={processing || !data.csv}>
                        {processing ? t('partners.import.importing') : t('partners.import.submit')}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
