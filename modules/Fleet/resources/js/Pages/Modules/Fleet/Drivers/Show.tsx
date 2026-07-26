import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import FleetNav from '../../../../FleetNav';

interface DriverUser {
    id: number;
    name: string;
    username: string | null;
    email: string;
}

interface Driver {
    id: number;
    name: string;
    license_number: string;
    license_type: string | null;
    license_expires_at: string | null;
    phone: string;
    email: string | null;
    status: string;
    photo_url: string | null;
    notes: string | null;
    user: DriverUser | null;
}

interface DocumentSummary {
    total: number;
    expired: number;
    expiring_soon: number;
    nearest_expiry: string | null;
}

interface Props {
    driver: Driver;
    documentsEnabled?: boolean;
    documentSummary?: DocumentSummary | null;
    can: { update: boolean; delete: boolean };
}

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'available':
            return 'bg-green-100 text-green-800';
        case 'on_trip':
            return 'bg-blue-100 text-blue-800';
        case 'off_duty':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function Show({
    driver,
    documentsEnabled = false,
    documentSummary = null,
    can,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    const accountForm = useForm({
        name: driver.name,
        username: '',
        email: driver.email ?? '',
        password: '',
    });

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(prefixedRoute('fleet.drivers.destroy', driver.id), {
            onFinish: () => setProcessing(false),
        });
    };

    const submitAccount: FormEventHandler = (event) => {
        event.preventDefault();
        accountForm.post(prefixedRoute('fleet.drivers.account.store', driver.id), {
            preserveScroll: true,
            onSuccess: () => accountForm.reset('password'),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('fleet.title')}</h2>
                    <div className="flex gap-2">
                        {can.update && (
                            <Link href={prefixedRoute('fleet.drivers.edit', driver.id)}>
                                <SecondaryButton>{t('common.edit')}</SecondaryButton>
                            </Link>
                        )}
                        <Link href={prefixedRoute('fleet.drivers.index')}>
                            <SecondaryButton>{t('common.back')}</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={t('fleet.drivers.show')} />

            <FleetNav />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        {driver.photo_url && (
                            <img src={driver.photo_url} alt={driver.name} className="mb-6 h-32 w-32 rounded-full object-cover" />
                        )}
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.drivers.name')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{driver.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.drivers.license_number')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{driver.license_number}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.drivers.license_type')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{driver.license_type || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.drivers.status')}</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(driver.status)}`}>
                                        {t(`fleet.status.${driver.status}`)}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.drivers.phone')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{driver.phone}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.drivers.email')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{driver.email || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.drivers.license_expires')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{driver.license_expires_at || '—'}</dd>
                            </div>
                            {driver.notes && (
                                <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">{t('fleet.drivers.notes')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{driver.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {documentsEnabled && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">{t('fleet.drivers.documents')}</h3>
                                <Link
                                    href={prefixedRoute('fleet.drivers.documents.index', driver.id)}
                                    className="text-sm font-medium text-indigo-600 hover:underline"
                                >
                                    {t('fleet.drivers.manage_documents')}
                                </Link>
                            </div>
                            {!documentSummary || documentSummary.total === 0 ? (
                                <p className="text-sm text-gray-500">{t('fleet.drivers.no_documents')}</p>
                            ) : (
                                <div className="grid gap-3 text-sm sm:grid-cols-4">
                                    <div>
                                        <p className="text-xs uppercase text-gray-500">{t('fleet.drivers.docs_total')}</p>
                                        <p className="mt-1 text-xl font-semibold tabular-nums">{documentSummary.total}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase text-gray-500">{t('fleet.drivers.docs_expired')}</p>
                                        <p className="mt-1 text-xl font-semibold tabular-nums text-red-700">{documentSummary.expired}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase text-gray-500">{t('fleet.drivers.docs_expiring')}</p>
                                        <p className="mt-1 text-xl font-semibold tabular-nums text-amber-700">{documentSummary.expiring_soon}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase text-gray-500">{t('fleet.drivers.docs_nearest')}</p>
                                        <p className="mt-1 font-medium">
                                            {documentSummary.nearest_expiry
                                                ? new Date(documentSummary.nearest_expiry).toLocaleDateString('id-ID')
                                                : '—'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {can.update && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-sm font-medium text-gray-900">{t('fleet.drivers.create_login')}</h3>
                            {driver.user ? (
                                <div className="mt-2 rounded-md bg-green-50 p-4">
                                    <p className="text-sm text-green-800">{t('fleet.drivers.login_created')}</p>
                                    <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                                        <div>
                                            <dt className="font-medium text-gray-500">{t('fleet.drivers.account_username')}</dt>
                                            <dd className="text-gray-900">{driver.user.username || '—'}</dd>
                                        </div>
                                        <div>
                                            <dt className="font-medium text-gray-500">{t('fleet.drivers.email')}</dt>
                                            <dd className="text-gray-900">{driver.user.email}</dd>
                                        </div>
                                    </dl>
                                </div>
                            ) : (
                                <>
                                    <p className="mt-1 text-sm text-gray-500">{t('fleet.drivers.no_login')}</p>
                                    <form onSubmit={submitAccount} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="account_name" value={t('fleet.drivers.name')} />
                                            <TextInput
                                                id="account_name"
                                                className="mt-1 block w-full"
                                                value={accountForm.data.name}
                                                onChange={(e) => accountForm.setData('name', e.target.value)}
                                            />
                                            <InputError message={accountForm.errors.name} className="mt-1" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="account_username" value={t('fleet.drivers.account_username')} />
                                            <TextInput
                                                id="account_username"
                                                className="mt-1 block w-full"
                                                value={accountForm.data.username}
                                                onChange={(e) => accountForm.setData('username', e.target.value)}
                                                autoComplete="off"
                                            />
                                            <InputError message={accountForm.errors.username} className="mt-1" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="account_email" value={t('fleet.drivers.email')} />
                                            <TextInput
                                                id="account_email"
                                                type="email"
                                                className="mt-1 block w-full"
                                                value={accountForm.data.email}
                                                onChange={(e) => accountForm.setData('email', e.target.value)}
                                                autoComplete="off"
                                            />
                                            <InputError message={accountForm.errors.email} className="mt-1" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="account_password" value={t('fleet.drivers.account_password')} />
                                            <TextInput
                                                id="account_password"
                                                type="password"
                                                className="mt-1 block w-full"
                                                value={accountForm.data.password}
                                                onChange={(e) => accountForm.setData('password', e.target.value)}
                                                autoComplete="new-password"
                                            />
                                            <InputError message={accountForm.errors.password} className="mt-1" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <PrimaryButton disabled={accountForm.processing}>
                                                {t('fleet.drivers.create_login')}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {can.delete && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">{t('common.delete')}</h3>
                                <p className="text-sm text-gray-500">{t('common.confirm_delete_message')}</p>
                            </div>
                            <button onClick={() => setShowDeleteDialog(true)} className="text-sm font-medium text-red-600 hover:text-red-900">
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                processing={processing}
                message={t('fleet.drivers.delete_confirm', { name: driver.name })}
            />
        </DynamicLayout>
    );
}
