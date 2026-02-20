import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

export default function Create(): JSX.Element {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        slug: '',
    });

    useEffect(() => {
        const slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        setData('slug', slug);
    }, [data.title]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('pages.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Create New Page
                </h2>
            }
        >
            <Head title="Create Page" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="title" value="Page Title" />
                                    <TextInput
                                        id="title"
                                        type="text"
                                        name="title"
                                        value={data.title}
                                        className="mt-1 block w-full"
                                        autoComplete="off"
                                        isFocused={true}
                                        onChange={(e) => setData('title', e.target.value)}
                                    />
                                    <InputError message={errors.title} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="slug" value="URL Slug" />
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                            /p/
                                        </span>
                                        <TextInput
                                            id="slug"
                                            type="text"
                                            name="slug"
                                            value={data.slug}
                                            className="block w-full rounded-l-none"
                                            autoComplete="off"
                                            onChange={(e) => setData('slug', e.target.value)}
                                        />
                                    </div>
                                    <InputError message={errors.slug} className="mt-2" />
                                </div>

                                <div className="flex items-center justify-end gap-4">
                                    <Link href={route('pages.index')}>
                                        <SecondaryButton type="button">Cancel</SecondaryButton>
                                    </Link>
                                    <PrimaryButton disabled={processing}>
                                        Create & Open Editor
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
