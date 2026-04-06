import AdminLayout from '@/Layouts/AdminLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Create(): JSX.Element {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        is_active: true,
        autoplay_interval: 5000,
        show_navigation: true,
        show_indicators: true,
    });

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setData((prev) => ({
            ...prev,
            name,
            slug: generateSlug(name),
        }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.carousels.store'));
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Create Carousel
                    </h2>
                </div>
            }
        >
            <Head title="Create Carousel" />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="space-y-6 max-w-2xl">
                        <div>
                            <InputLabel htmlFor="name" value="Name" />
                            <TextInput
                                id="name"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={handleNameChange}
                                required
                                autoFocus
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="slug" value="Slug" />
                            <TextInput
                                id="slug"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                required
                            />
                            <InputError message={errors.slug} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="description" value="Description (optional)" />
                            <textarea
                                id="description"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={3}
                            />
                            <InputError message={errors.description} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="autoplay_interval" value="Autoplay Interval (ms)" />
                            <TextInput
                                id="autoplay_interval"
                                type="number"
                                className="mt-1 block w-full"
                                value={data.autoplay_interval}
                                onChange={(e) => setData('autoplay_interval', parseInt(e.target.value))}
                                min={1000}
                                max={30000}
                                step={500}
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Time between slides in milliseconds (1000-30000)
                            </p>
                            <InputError message={errors.autoplay_interval} className="mt-2" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input
                                    id="is_active"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                />
                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                    Active
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="show_navigation"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={data.show_navigation}
                                    onChange={(e) => setData('show_navigation', e.target.checked)}
                                />
                                <label htmlFor="show_navigation" className="ml-2 block text-sm text-gray-900">
                                    Show Navigation Arrows
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="show_indicators"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={data.show_indicators}
                                    onChange={(e) => setData('show_indicators', e.target.checked)}
                                />
                                <label htmlFor="show_indicators" className="ml-2 block text-sm text-gray-900">
                                    Show Slide Indicators
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>
                                Create Carousel
                            </PrimaryButton>
                            <Link href={route('admin.carousels.index')}>
                                <SecondaryButton type="button">Cancel</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
