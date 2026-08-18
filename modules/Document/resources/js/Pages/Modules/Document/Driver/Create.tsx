import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import MediaFileUploader from '@/Components/MediaFileUploader';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import DocumentNav from '../../../../DocumentNav';
import { DocumentType } from '../../../../documentUtils';
import PageHeader from '@/Components/PageHeader';

interface Driver {
    id: number;
    name: string;
    license_number: string;
}

interface Props {
    driver: Driver;
    types: DocumentType[];
    preselectedTypeId?: number;
}

export default function Create({ driver, types, preselectedTypeId }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const form = useForm({
        document_type_id: preselectedTypeId ? String(preselectedTypeId) : '',
        document_number: '',
        issued_at: '',
        expires_at: '',
        notes: '',
        media_id: null as number | null,
    });

    const selectedType = types.find((type) => String(type.id) === form.data.document_type_id);

    const handleTypeChange = (value: string) => {
        form.setData('document_type_id', value);
        const type = types.find((item) => String(item.id) === value);
        if (type?.typical_validity_days && form.data.issued_at) {
            const issued = new Date(form.data.issued_at);
            issued.setDate(issued.getDate() + type.typical_validity_days);
            form.setData('expires_at', issued.toISOString().slice(0, 10));
        }
    };

    const handleIssuedAtChange = (value: string) => {
        form.setData('issued_at', value);
        if (selectedType?.typical_validity_days && value) {
            const issued = new Date(value);
            issued.setDate(issued.getDate() + selectedType.typical_validity_days);
            form.setData('expires_at', issued.toISOString().slice(0, 10));
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(prefixedRoute('fleet.drivers.documents.store', driver.id));
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('document.entity_docs.upload_title', { name: driver.name })}
                    actions={
                        <Link href={prefixedRoute('fleet.drivers.documents.index', driver.id)}>
                            <SecondaryButton className="!rounded-xl text-xs">
                                ← {t('document.entity_docs.back')}
                            </SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('document.entity_docs.upload_head', { name: driver.name })} />

            <DocumentNav />

            <div className="mx-auto max-w-2xl">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <InputLabel htmlFor="document_type_id" value={t('document.entity_docs.type')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <Select
                                id="document_type_id"
                                value={form.data.document_type_id}
                                onChange={handleTypeChange}
                                options={[
                                    { value: '', label: t('document.entity_docs.select_type'), disabled: true },
                                    ...types.map((type) => ({ value: String(type.id), label: type.name })),
                                ]}
                                className="mt-1 w-full !rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            />
                            <InputError message={form.errors.document_type_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="document_number" value={t('document.entity_docs.number_label')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <TextInput
                                id="document_number"
                                value={form.data.document_number}
                                onChange={(e) => form.setData('document_number', e.target.value)}
                                className="mt-1 w-full !rounded-xl font-mono text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                placeholder={t('document.entity_docs.optional')}
                            />
                            <InputError message={form.errors.document_number} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="issued_at" value={t('document.entity_docs.issued_at')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <TextInput
                                    id="issued_at"
                                    type="date"
                                    value={form.data.issued_at}
                                    onChange={(e) => handleIssuedAtChange(e.target.value)}
                                    className="mt-1 w-full !rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                />
                                <InputError message={form.errors.issued_at} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="expires_at"
                                    className="!text-xs !font-bold !uppercase !tracking-wider"
                                    value={
                                        selectedType && !selectedType.has_expiry
                                            ? t('document.entity_docs.expires_na')
                                            : t('document.entity_docs.expires_at')
                                    }
                                />
                                <TextInput
                                    id="expires_at"
                                    type="date"
                                    value={form.data.expires_at}
                                    onChange={(e) => form.setData('expires_at', e.target.value)}
                                    className="mt-1 w-full !rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    disabled={selectedType !== undefined && !selectedType.has_expiry}
                                />
                                {selectedType?.typical_validity_days && (
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        {t('document.entity_docs.typical_validity', {
                                            count: selectedType.typical_validity_days,
                                        })}
                                    </p>
                                )}
                                <InputError message={form.errors.expires_at} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value={t('document.entity_docs.file')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <div className="mt-1">
                                <MediaFileUploader
                                    value={form.data.media_id}
                                    onChange={(mediaId) => form.setData('media_id', mediaId)}
                                />
                            </div>
                            <InputError message={form.errors.media_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value={t('document.entity_docs.notes')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <textarea
                                id="notes"
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                rows={3}
                                className="mt-1 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs"
                                placeholder={t('document.entity_docs.optional')}
                            />
                            <InputError message={form.errors.notes} className="mt-1" />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Link href={prefixedRoute('fleet.drivers.documents.index', driver.id)}>
                                <SecondaryButton type="button" className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={form.processing} className="!rounded-xl text-xs shadow-sm">
                                {form.processing
                                    ? t('document.entity_docs.saving')
                                    : `📤 ${t('document.entity_docs.upload')}`}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

