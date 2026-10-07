import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select, { SelectOption } from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo } from 'react';

interface RoleOption {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_system?: boolean;
}

interface Props {
    show: boolean;
    onClose: () => void;
    roles: RoleOption[];
    initialEmail?: string;
}

export default function InviteUserModal({
    show,
    onClose,
    roles,
    initialEmail = '',
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        email: initialEmail,
        role_slug: roles[0]?.slug || 'user',
    });

    useEffect(() => {
        if (show) {
            setData((prev) => ({
                ...prev,
                email: initialEmail,
                role_slug: prev.role_slug || roles[0]?.slug || 'user',
            }));
            clearErrors();
        }
    }, [show, initialEmail]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('users.invite'), {
            preserveScroll: true,
            onSuccess: () => {
                handleClose();
            },
        });
    };

    const getRoleIcon = (slug: string) => {
        switch (slug) {
            case 'admin':
                return '🔑';
            case 'user':
                return '👤';
            case 'driver':
                return '🚚';
            case 'salesperson':
                return '💼';
            case 'warehouse_head':
                return '🏭';
            case 'warehouse_manager':
                return '🏢';
            case 'fleet_base_head':
                return '🚛';
            case 'fleet_base_manager':
                return '🚚';
            case 'rental_operator':
                return '📋';
            case 'reseller':
                return '🤝';
            default:
                return '🛡️';
        }
    };

    const roleOptions: SelectOption[] = useMemo(
        () =>
            roles.map((role) => ({
                value: role.slug,
                label: `${getRoleIcon(role.slug)} ${role.name}`,
                description: role.description || undefined,
                badge: role.is_system ? t('users.system_badge', undefined, 'System') : undefined,
            })),
        [roles, t]
    );

    const selectedRole = roles.find((r) => r.slug === data.role_slug);

    return (
        <Modal show={show} onClose={handleClose} maxWidth="md">
            <form onSubmit={submit} className="p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xl font-bold">
                        ✉️
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {t('users.invite.title')}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {t('users.invite.desc')}
                        </p>
                    </div>
                </div>

                <div className="mt-5 space-y-4">
                    <div>
                        <InputLabel
                            htmlFor="invite-email"
                            value={t('users.invite.email_label')}
                            className="!text-xs !font-bold !uppercase !tracking-wider"
                        />
                        <TextInput
                            id="invite-email"
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder={t('users.invite.email_placeholder')}
                            className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
                            required
                            autoFocus
                        />
                        <InputError message={errors.email} className="mt-1.5" />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="invite-role"
                            value={t('users.invite.role_label')}
                            className="!text-xs !font-bold !uppercase !tracking-wider"
                        />
                        <div className="mt-1">
                            <Select
                                id="invite-role"
                                value={data.role_slug}
                                onChange={(val) => setData('role_slug', val)}
                                options={roleOptions}
                                placeholder={t('users.invite.role_select')}
                            />
                        </div>
                        {selectedRole && selectedRole.description && (
                            <div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 p-2.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                                <span className="text-sm shrink-0">{getRoleIcon(selectedRole.slug)}</span>
                                <div className="leading-relaxed">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 mr-1.5">
                                        {selectedRole.name}:
                                    </span>
                                    <span>{selectedRole.description}</span>
                                </div>
                            </div>
                        )}
                        <InputError message={errors.role_slug} className="mt-1.5" />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <SecondaryButton
                        type="button"
                        onClick={handleClose}
                        disabled={processing}
                        className="!rounded-xl text-xs"
                    >
                        {t('common.cancel')}
                    </SecondaryButton>
                    <PrimaryButton
                        type="submit"
                        disabled={processing}
                        className="!rounded-xl text-xs shadow-sm"
                    >
                        {processing ? t('users.invite.sending') : t('users.invite.submit')}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
