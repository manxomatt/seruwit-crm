import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Role {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_system: boolean;
}

interface Props {
    roles: Role[];
}

export default function Create({ roles }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [] as number[],
        first_name: '',
        last_name: '',
        phone_number: '',
        avatar_url: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('users.store'));
    };

    const toggleRole = (roleId: number) => {
        if (data.roles.includes(roleId)) {
            setData('roles', data.roles.filter(id => id !== roleId));
        } else {
            setData('roles', [...data.roles, roleId]);
        }
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {t('users.pages.create.head')}
                    </h2>
                </div>
            }
        >
            <Head title={t('users.pages.create.title')} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-2xl">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Left Column - User Details */}
                            <div className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="name" value={t('users.fields.name')} />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        autoComplete="name"
                                        isFocused={true}
                                        onChange={(e) => setData('name', e.target.value)}
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="email" value={t('users.fields.email')} />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-1 block w-full"
                                        autoComplete="email"
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password" value={t('users.fields.password')} />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password_confirmation" value={t('users.fields.password_confirmation')} />
                                    <TextInput
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                    />
                                    <InputError message={errors.password_confirmation} className="mt-2" />
                                </div>

                                {/* Profile Fields */}
                                <div className="border-t pt-4 mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">{t('users.sections.profile_information')}</h4>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="first_name" value={t('users.fields.first_name')} />
                                            <TextInput
                                                id="first_name"
                                                type="text"
                                                name="first_name"
                                                value={data.first_name}
                                                className="mt-1 block w-full"
                                                onChange={(e) => setData('first_name', e.target.value)}
                                            />
                                            <InputError message={errors.first_name} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="last_name" value={t('users.fields.last_name')} />
                                            <TextInput
                                                id="last_name"
                                                type="text"
                                                name="last_name"
                                                value={data.last_name}
                                                className="mt-1 block w-full"
                                                onChange={(e) => setData('last_name', e.target.value)}
                                            />
                                            <InputError message={errors.last_name} className="mt-2" />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <InputLabel htmlFor="phone_number" value={t('users.fields.phone_number')} />
                                        <TextInput
                                            id="phone_number"
                                            type="text"
                                            name="phone_number"
                                            value={data.phone_number}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('phone_number', e.target.value)}
                                        />
                                        <InputError message={errors.phone_number} className="mt-2" />
                                    </div>

                                    <div className="mt-4">
                                        <InputLabel htmlFor="avatar_url" value={t('users.fields.avatar_url')} />
                                        <TextInput
                                            id="avatar_url"
                                            type="text"
                                            name="avatar_url"
                                            value={data.avatar_url}
                                            className="mt-1 block w-full"
                                            placeholder={t('users.placeholders.avatar_url')}
                                            onChange={(e) => setData('avatar_url', e.target.value)}
                                        />
                                        <InputError message={errors.avatar_url} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Roles */}
                            <div>
                                <InputLabel value={t('users.fields.roles')} />
                                <div className="mt-2 border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                                    {roles.map((role) => (
                                        <label
                                            key={role.id}
                                            className="flex items-start p-3 cursor-pointer hover:bg-gray-50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={data.roles.includes(role.id)}
                                                onChange={() => toggleRole(role.id)}
                                                className="mt-1 rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                            />
                                            <div className="ml-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {role.name}
                                                    </span>
                                                    {role.is_system && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                            {t('users.system_badge')}
                                                        </span>
                                                    )}
                                                </div>
                                                {role.description && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {role.description}
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.roles} className="mt-2" />
                                <p className="mt-2 text-sm text-gray-500">
                                    {t('users.roles_selected', { count: data.roles.length })}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-4">
                            <PrimaryButton disabled={processing}>
                                {t('users.pages.create.submit')}
                            </PrimaryButton>
                            <Link href={prefixedRoute('users.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
