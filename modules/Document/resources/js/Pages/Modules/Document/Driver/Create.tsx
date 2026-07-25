import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import ImageUploader from '@/Components/ImageUploader';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import DocumentNav from '../../../../DocumentNav';
import { DocumentType } from '../../../../documentUtils';

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
        media_id: '' as string | number,
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
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {t('document.entity_docs.upload_title', { name: driver.name })}
                    </h2>
                    <Link href={prefixedRoute('fleet.drivers.documents.index', driver.id)}>
                        <SecondaryButton>{t('document.entity_docs.back')}</SecondaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={t('document.entity_docs.upload_head', { name: driver.name })} />

            <DocumentNav />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <form onSubmit={submit} className="space-y-6 p-6">
                        <div>
                            <InputLabel htmlFor="document_type_id" value={t('document.entity_docs.type')} />
                            <Select
                                id="document_type_id"
                                value={form.data.document_type_id}
                                onChange={handleTypeChange}
                                options={[
                                    { value: '', label: t('document.entity_docs.select_type'), disabled: true },
                                    ...types.map((type) => ({ value: String(type.id), label: type.name })),
                                ]}
                                className="mt-1 w-full"
                            />
                            <InputError message={form.errors.document_type_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="document_number" value={t('document.entity_docs.number_label')} />
                            <TextInput
                                id="document_number"
                                value={form.data.document_number}
                                onChange={(e) => form.setData('document_number', e.target.value)}
                                className="mt-1 w-full"
                                placeholder={t('document.entity_docs.optional')}
                            />
                            <InputError message={form.errors.document_number} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="issued_at" value={t('document.entity_docs.issued_at')} />
                                <TextInput
                                    id="issued_at"
                                    type="date"
                                    value={form.data.issued_at}
                                    onChange={(e) => handleIssuedAtChange(e.target.value)}
                                    className="mt-1 w-full"
                                />
                                <InputError message={form.errors.issued_at} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="expires_at"
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
                                    className="mt-1 w-full"
                                    disabled={selectedType !== undefined && !selectedType.has_expiry}
                                />
                                {selectedType?.typical_validity_days && (
                                    <p className="mt-1 text-xs text-gray-400">
                                        {t('document.entity_docs.typical_validity', {
                                            count: selectedType.typical_validity_days,
                                        })}
                                    </p>
                                )}
                                <InputError message={form.errors.expires_at} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value={t('document.entity_docs.file')} />
                            <div className="mt-1">
                                <ImageUploader
                                    value={form.data.media_id ? Number(form.data.media_id) : null}
                                    onChange={(mediaId) => form.setData('media_id', mediaId ?? '')}
                                />
                            </div>
                            <InputError message={form.errors.media_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value={t('document.entity_docs.notes')} />
                            <textarea
                                id="notes"
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                rows={3}
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                placeholder={t('document.entity_docs.optional')}
                            />
                            <InputError message={form.errors.notes} className="mt-1" />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Link href={prefixedRoute('fleet.drivers.documents.index', driver.id)}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={form.processing}>
                                {form.processing
                                    ? t('document.entity_docs.saving')
                                    : t('document.entity_docs.upload')}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
