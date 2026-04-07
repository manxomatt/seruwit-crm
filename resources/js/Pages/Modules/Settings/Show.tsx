import DynamicLayout from '@/Layouts/DynamicLayout';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Setting {
    id: number;
    key: string;
    group: string;
    value: string | null;
    type: string;
    label: string;
    description: string | null;
    is_public: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    setting: Setting;
}

export default function Show({ setting }: Props): JSX.Element {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    const openDeleteDialog = () => {
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
    };

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(route('admin.settings.destroy', setting.id), {
            onFinish: () => setProcessing(false),
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            text: 'bg-blue-100 text-blue-800',
            textarea: 'bg-purple-100 text-purple-800',
            boolean: 'bg-green-100 text-green-800',
            number: 'bg-yellow-100 text-yellow-800',
            email: 'bg-pink-100 text-pink-800',
            url: 'bg-indigo-100 text-indigo-800',
            select: 'bg-orange-100 text-orange-800',
            json: 'bg-gray-100 text-gray-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const renderValue = () => {
        if (!setting.value) {
            return <span className="text-gray-400 italic">Empty</span>;
        }

        if (setting.type === 'boolean') {
            return (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    setting.value === '1' || setting.value === 'true'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    {setting.value === '1' || setting.value === 'true' ? 'Yes / True' : 'No / False'}
                </span>
            );
        }

        if (setting.type === 'json') {
            try {
                const parsed = JSON.parse(setting.value);
                return (
                    <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm">
                        {JSON.stringify(parsed, null, 2)}
                    </pre>
                );
            } catch {
                return <span className="text-red-600">Invalid JSON</span>;
            }
        }

        if (setting.type === 'url') {
            return (
                <a
                    href={setting.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-900 underline"
                >
                    {setting.value}
                </a>
            );
        }

        if (setting.type === 'email') {
            return (
                <a
                    href={`mailto:${setting.value}`}
                    className="text-indigo-600 hover:text-indigo-900 underline"
                >
                    {setting.value}
                </a>
            );
        }

        if (setting.type === 'textarea') {
            return (
                <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                    {setting.value}
                </div>
            );
        }

        return setting.value;
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Setting Details
                    </h2>
                    <div className="flex gap-2">
                        <Link href={route('admin.settings.edit', setting.id)}>
                            <PrimaryButton>Edit</PrimaryButton>
                        </Link>
                        <DangerButton onClick={openDeleteDialog}>Delete</DangerButton>
                    </div>
                </div>
            }
        >
            <Head title={`Setting - ${setting.label}`} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Label</h3>
                            <p className="mt-1 text-lg text-gray-900">{setting.label}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Key</h3>
                            <p className="mt-1 text-lg text-gray-900 font-mono">{setting.key}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Group</h3>
                            <p className="mt-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {setting.group}
                                </span>
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Type</h3>
                            <p className="mt-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(setting.type)}`}>
                                    {setting.type}
                                </span>
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Visibility</h3>
                            <p className="mt-1">
                                {setting.is_public ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Public
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Private
                                    </span>
                                )}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Sort Order</h3>
                            <p className="mt-1 text-lg text-gray-900">{setting.sort_order}</p>
                        </div>

                        <div className="md:col-span-2">
                            <h3 className="text-sm font-medium text-gray-500">Value</h3>
                            <div className="mt-1 text-gray-900">
                                {renderValue()}
                            </div>
                        </div>

                        {setting.description && (
                            <div className="md:col-span-2">
                                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                                <p className="mt-1 text-gray-900">{setting.description}</p>
                            </div>
                        )}

                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                            <p className="mt-1 text-gray-900">{formatDate(setting.created_at)}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Updated At</h3>
                            <p className="mt-1 text-gray-900">{formatDate(setting.updated_at)}</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <Link href={route('admin.settings.index')}>
                            <SecondaryButton>Back to Settings</SecondaryButton>
                        </Link>
                    </div>
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                title="Hapus Setting"
                message={
                    <>
                        Apakah Anda yakin ingin menghapus setting{' '}
                        <strong>"{setting.label}"</strong> (key:{' '}
                        <code className="bg-gray-100 px-1 rounded">{setting.key}</code>
                        )? Tindakan ini tidak dapat dibatalkan.
                    </>
                }
            />
        </DynamicLayout>
    );
}
