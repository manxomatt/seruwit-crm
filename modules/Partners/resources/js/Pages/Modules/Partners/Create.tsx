import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Industry {
    id: number;
    name: string;
}

interface Title {
    id: number;
    name: string;
    short_name: string;
}

interface Tag {
    id: number;
    name: string;
    color: string | null;
}

interface ParentPartner {
    id: number;
    name: string;
    code: string;
}

interface Props {
    industries: Industry[];
    titles: Title[];
    tags: Tag[];
    partners: ParentPartner[];
}

export default function Create({ industries, titles, tags, partners }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing, errors } = useForm({
        account_type: 'company',
        sub_type: 'customer',
        name: '',
        email: '',
        phone: '',
        mobile: '',
        job_title: '',
        website: '',
        tax_id: '',
        company_registry: '',
        reference: '',
        parent_id: '',
        industry_id: '',
        title_id: '',
        is_customer: true,
        is_supplier: false,
        credit_limit: '',
        address: '',
        notes: '',
        comment: '',
        status: 'active',
        tag_ids: [] as number[],
    });

    const isIndividual = data.account_type === 'individual';

    const toggleTag = (tagId: number) => {
        setData('tag_ids', data.tag_ids.includes(tagId)
            ? data.tag_ids.filter((id) => id !== tagId)
            : [...data.tag_ids, tagId]);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('partners.store'));
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Tambah Partner</h2>}
        >
            <Head title="Tambah Partner" />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-3xl space-y-6">
                        {/* Tipe Akun & Peran */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div>
                                <InputLabel htmlFor="account_type" value="Tipe Akun" />
                                <Select
                                    id="account_type"
                                    className="mt-1"
                                    value={data.account_type}
                                    onChange={(value) => setData('account_type', value)}
                                    options={[
                                        { value: 'company', label: 'Perusahaan' },
                                        { value: 'individual', label: 'Individu' },
                                    ]}
                                />
                                <InputError message={errors.account_type} className="mt-2" />
                            </div>
                            <div className="flex items-end gap-6">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_customer}
                                        onChange={(e) => setData('is_customer', e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">Customer</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_supplier}
                                        onChange={(e) => setData('is_supplier', e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">Supplier</span>
                                </label>
                            </div>
                            <div>
                                <InputLabel htmlFor="status" value="Status" />
                                <Select
                                    id="status"
                                    className="mt-1"
                                    value={data.status}
                                    onChange={(value) => setData('status', value)}
                                    options={[
                                        { value: 'active', label: 'Active' },
                                        { value: 'inactive', label: 'Inactive' },
                                    ]}
                                />
                                <InputError message={errors.status} className="mt-2" />
                            </div>
                        </div>

                        <hr className="border-gray-200" />

                        {/* Identitas */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {isIndividual && (
                                <div>
                                    <InputLabel htmlFor="title_id" value="Sapaan" />
                                    <Select
                                        id="title_id"
                                        className="mt-1"
                                        value={data.title_id}
                                        onChange={(value) => setData('title_id', value)}
                                        placeholder="Pilih sapaan"
                                        options={[
                                            { value: '', label: 'Tidak ada' },
                                            ...titles.map((t) => ({ value: String(t.id), label: `${t.short_name} (${t.name})` })),
                                        ]}
                                    />
                                </div>
                            )}
                            <div className={isIndividual ? '' : 'sm:col-span-2'}>
                                <InputLabel htmlFor="name" value="Nama" />
                                <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            {isIndividual && (
                                <div>
                                    <InputLabel htmlFor="job_title" value="Jabatan" />
                                    <TextInput id="job_title" className="mt-1 block w-full" value={data.job_title} onChange={(e) => setData('job_title', e.target.value)} />
                                    <InputError message={errors.job_title} className="mt-2" />
                                </div>
                            )}
                            {isIndividual && (
                                <div>
                                    <InputLabel htmlFor="parent_id" value="Perusahaan Induk" />
                                    <Select
                                        id="parent_id"
                                        className="mt-1"
                                        value={data.parent_id}
                                        onChange={(value) => setData('parent_id', value)}
                                        placeholder="Pilih perusahaan"
                                        options={[
                                            { value: '', label: 'Tidak ada' },
                                            ...partners.map((p) => ({ value: String(p.id), label: `${p.name} (${p.code})` })),
                                        ]}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Kontak */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="phone" value="Telepon" />
                                <TextInput id="phone" className="mt-1 block w-full" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                                <InputError message={errors.phone} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="mobile" value="HP / WhatsApp" />
                                <TextInput id="mobile" className="mt-1 block w-full" value={data.mobile} onChange={(e) => setData('mobile', e.target.value)} />
                                <InputError message={errors.mobile} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="email" value="Email" />
                                <TextInput id="email" type="email" className="mt-1 block w-full" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                <InputError message={errors.email} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="website" value="Website" />
                                <TextInput id="website" className="mt-1 block w-full" value={data.website} onChange={(e) => setData('website', e.target.value)} />
                                <InputError message={errors.website} className="mt-2" />
                            </div>
                        </div>

                        {/* Bisnis */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div>
                                <InputLabel htmlFor="industry_id" value="Industri" />
                                <Select
                                    id="industry_id"
                                    className="mt-1"
                                    value={data.industry_id}
                                    onChange={(value) => setData('industry_id', value)}
                                    placeholder="Pilih industri"
                                    options={[
                                        { value: '', label: 'Tidak ada' },
                                        ...industries.map((i) => ({ value: String(i.id), label: i.name })),
                                    ]}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="tax_id" value="NPWP" />
                                <TextInput id="tax_id" className="mt-1 block w-full" value={data.tax_id} onChange={(e) => setData('tax_id', e.target.value)} />
                                <InputError message={errors.tax_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="credit_limit" value="Batas Kredit" />
                                <TextInput id="credit_limit" type="number" className="mt-1 block w-full" value={data.credit_limit} onChange={(e) => setData('credit_limit', e.target.value)} min="0" step="0.01" />
                                <InputError message={errors.credit_limit} className="mt-2" />
                            </div>
                        </div>

                        {/* Tags */}
                        {tags.length > 0 && (
                            <div>
                                <InputLabel value="Tags" />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => toggleTag(tag.id)}
                                            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                                                data.tag_ids.includes(tag.id)
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Alamat & Catatan */}
                        <div>
                            <InputLabel htmlFor="address" value="Alamat Utama" />
                            <textarea id="address" rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.address} onChange={(e) => setData('address', e.target.value)} />
                            <InputError message={errors.address} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Catatan" />
                            <textarea id="notes" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>Simpan Partner</PrimaryButton>
                            <Link href={prefixedRoute('partners.index')}>
                                <SecondaryButton type="button">Batal</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
