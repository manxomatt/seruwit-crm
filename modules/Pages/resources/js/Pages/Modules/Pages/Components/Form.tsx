import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface ComponentItem {
    id: number;
    key: string;
    label: string;
    category: string;
    module?: string | null;
    content: string;
    media?: string;
    attributes?: Record<string, unknown>;
    sort_order: number;
    is_active: boolean;
}

interface ModuleOption {
    key: string;
    label: string;
}

interface Props {
    component?: ComponentItem;
    modules?: ModuleOption[];
}

export default function Form({ component, modules = [] }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const isEditing = Boolean(component);

    const form = useForm({
        key: component?.key || '',
        label: component?.label || '',
        category: component?.category || 'Sections',
        module: component?.module || '',
        content: component?.content || '<section class="py-12 bg-white">\n  <div class="container mx-auto px-4">\n    <h2 class="text-2xl font-bold text-slate-900">New Section</h2>\n  </div>\n</section>',
        sort_order: component?.sort_order ?? 1,
        is_active: component?.is_active ?? true,
    });

    const handleLabelChange = (val: string) => {
        form.setData('label', val);

        if (!isEditing && (!form.data.key || form.data.key === form.data.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'))) {
            const generatedKey = val
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            form.setData('key', generatedKey);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (isEditing && component) {
            form.put(prefixedRoute('pages.components.update', component.id));
        } else {
            form.post(prefixedRoute('pages.components.store'));
        }
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={isEditing ? `Edit Component: ${component?.label}` : 'Create Page Component'}
                    subtitle="Define dynamic GrapesJS section template HTML & metadata"
                    actions={
                        <Link href={prefixedRoute('pages.components.index')}>
                            <SecondaryButton className="!rounded-xl text-xs shadow-sm">
                                ⬅️ Back to Components
                            </SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={isEditing ? `Edit Component: ${component?.label}` : 'Create Component'} />

            <div className="max-w-4xl mx-auto">
                <form
                    onSubmit={submit}
                    className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Label */}
                        <div>
                            <InputLabel htmlFor="label" value="Component Label *" />
                            <TextInput
                                id="label"
                                type="text"
                                value={form.data.label}
                                onChange={(e) => handleLabelChange(e.target.value)}
                                placeholder="e.g. Hero Joy Section"
                                className="mt-1 block w-full text-xs !rounded-2xl border-slate-200 dark:border-slate-800"
                                required
                            />
                            <InputError message={form.errors.label} className="mt-1" />
                        </div>

                        {/* Key / Slug */}
                        <div>
                            <InputLabel htmlFor="key" value="Component Key / Identifier *" />
                            <TextInput
                                id="key"
                                type="text"
                                value={form.data.key}
                                onChange={(e) => form.setData('key', e.target.value)}
                                placeholder="e.g. hero-joy-section"
                                className="mt-1 block w-full text-xs font-mono !rounded-2xl border-slate-200 dark:border-slate-800"
                                required
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Unique slug used in GrapesJS block manager</p>
                            <InputError message={form.errors.key} className="mt-1" />
                        </div>

                        {/* Category */}
                        <div>
                            <InputLabel htmlFor="category" value="Category" />
                            <TextInput
                                id="category"
                                type="text"
                                value={form.data.category}
                                onChange={(e) => form.setData('category', e.target.value)}
                                placeholder="Sections"
                                className="mt-1 block w-full text-xs !rounded-2xl border-slate-200 dark:border-slate-800"
                            />
                            <InputError message={form.errors.category} className="mt-1" />
                        </div>

                        {/* Bound Module */}
                        <div>
                            <InputLabel htmlFor="module" value="Bound Module" />
                            <select
                                id="module"
                                value={form.data.module}
                                onChange={(e) => form.setData('module', e.target.value)}
                                className="mt-1 block w-full text-xs rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Universal (all tenants)</option>
                                {modules.map((mod) => (
                                    <option key={mod.key} value={mod.key}>
                                        {mod.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1">
                                Bound widgets only appear in a tenant&apos;s editor when that module is installed. Always visible in central admin.
                            </p>
                            <InputError message={form.errors.module} className="mt-1" />
                        </div>

                        {/* Sort Order & Active */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="sort_order" value="Sort Order" />
                                <TextInput
                                    id="sort_order"
                                    type="number"
                                    value={form.data.sort_order}
                                    onChange={(e) => form.setData('sort_order', parseInt(e.target.value) || 0)}
                                    className="mt-1 block w-full text-xs !rounded-2xl border-slate-200 dark:border-slate-800"
                                />
                                <InputError message={form.errors.sort_order} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="is_active" value="Status" />
                                <div className="mt-2.5 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => form.setData('is_active', !form.data.is_active)}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            form.data.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                form.data.is_active ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {form.data.is_active ? 'Active' : 'Disabled'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content HTML */}
                    <div>
                        <InputLabel htmlFor="content" value="Component HTML Content *" />
                        <textarea
                            id="content"
                            rows={12}
                            value={form.data.content}
                            onChange={(e) => form.setData('content', e.target.value)}
                            className="mt-1 block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-950 font-mono text-xs text-slate-100 p-4 focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="<section class='py-12'>...</section>"
                            required
                        />
                        <p className="text-[10px] text-slate-400 mt-1">HTML template code inserted when dragged onto GrapesJS canvas</p>
                        <InputError message={form.errors.content} className="mt-1" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                        <Link href={prefixedRoute('pages.components.index')}>
                            <SecondaryButton type="button" className="!rounded-xl text-xs">
                                Cancel
                            </SecondaryButton>
                        </Link>
                        <PrimaryButton type="submit" disabled={form.processing} className="!rounded-xl text-xs shadow-sm">
                            {form.processing ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Component'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}
