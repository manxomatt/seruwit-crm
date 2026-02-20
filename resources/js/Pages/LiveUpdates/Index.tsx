import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm, router, usePoll } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface LiveUpdate {
    id: number;
    title: string;
    content: string;
    type: 'info' | 'success' | 'warning' | 'error';
    is_active: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    liveUpdates: LiveUpdate[];
    serverTime: string;
}

const typeStyles = {
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    success: 'border-green-200 bg-green-50 text-green-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    error: 'border-red-200 bg-red-50 text-red-800',
};

const typeIcons = {
    info: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
    ),
    success: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    ),
    warning: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    ),
    error: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
    ),
};

export default function Index({ liveUpdates, serverTime }: Props): JSX.Element {
    const [isPolling, setIsPolling] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

    // Use Inertia v2 polling - automatically refreshes data every 3 seconds
    const { start, stop } = usePoll(3000, {
        onStart() {
            console.log('Polling started');
        },
        onFinish() {
            setLastUpdated(new Date().toLocaleTimeString());
            console.log('Polling finished');
        },
    }, {
        autoStart: true,
    });

    const togglePolling = () => {
        if (isPolling) {
            stop();
            setIsPolling(false);
        } else {
            start();
            setIsPolling(true);
        }
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        content: '',
        type: 'info' as 'info' | 'success' | 'warning' | 'error',
        is_active: true,
        published_at: new Date().toISOString().slice(0, 16),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('live-updates.store'), {
            onSuccess: () => reset(),
        });
    };

    const deleteLiveUpdate = (liveUpdate: LiveUpdate) => {
        if (confirm('Are you sure you want to delete this update?')) {
            router.delete(route('live-updates.destroy', liveUpdate.id));
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Not published';
        return new Date(dateString).toLocaleString();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Live Updates
                    </h2>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                            Last updated: {lastUpdated}
                        </span>
                        <button
                            onClick={togglePolling}
                            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                isPolling
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <span className={`h-2 w-2 rounded-full ${isPolling ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                            {isPolling ? 'Live' : 'Paused'}
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Live Updates" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Create New Update Form */}
                    <div className="mb-6 overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">
                                Create New Update
                            </h3>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                            Title
                                        </label>
                                        <TextInput
                                            id="title"
                                            type="text"
                                            name="title"
                                            value={data.title}
                                            className="mt-1 block w-full"
                                            placeholder="Update title"
                                            onChange={(e) => setData('title', e.target.value)}
                                        />
                                        <InputError message={errors.title} className="mt-2" />
                                    </div>
                                    <div>
                                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                                            Type
                                        </label>
                                        <select
                                            id="type"
                                            name="type"
                                            value={data.type}
                                            onChange={(e) => setData('type', e.target.value as 'info' | 'success' | 'warning' | 'error')}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="info">Info</option>
                                            <option value="success">Success</option>
                                            <option value="warning">Warning</option>
                                            <option value="error">Error</option>
                                        </select>
                                        <InputError message={errors.type} className="mt-2" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                                        Content
                                    </label>
                                    <textarea
                                        id="content"
                                        name="content"
                                        value={data.content}
                                        onChange={(e) => setData('content', e.target.value)}
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Update content..."
                                    />
                                    <InputError message={errors.content} className="mt-2" />
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label htmlFor="published_at" className="block text-sm font-medium text-gray-700">
                                            Publish Date
                                        </label>
                                        <TextInput
                                            id="published_at"
                                            type="datetime-local"
                                            name="published_at"
                                            value={data.published_at}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('published_at', e.target.value)}
                                        />
                                        <InputError message={errors.published_at} className="mt-2" />
                                    </div>
                                    <div className="flex items-center pt-6">
                                        <input
                                            id="is_active"
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                            Active
                                        </label>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <PrimaryButton disabled={processing}>
                                        Create Update
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Live Updates List */}
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Recent Updates
                                </h3>
                                <span className="text-sm text-gray-500">
                                    Server time: {new Date(serverTime).toLocaleString()}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {liveUpdates.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <svg
                                            className="mx-auto h-12 w-12 text-gray-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                            />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No updates</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Get started by creating a new update above.
                                        </p>
                                    </div>
                                ) : (
                                    liveUpdates.map((update) => (
                                        <div
                                            key={update.id}
                                            className={`rounded-lg border p-4 ${typeStyles[update.type]}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0">
                                                        {typeIcons[update.type]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium">{update.title}</h4>
                                                        <p className="mt-1 text-sm opacity-90">{update.content}</p>
                                                        <p className="mt-2 text-xs opacity-75">
                                                            Published: {formatDate(update.published_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteLiveUpdate(update)}
                                                    className="ml-4 flex-shrink-0 rounded p-1 opacity-50 transition-opacity hover:opacity-100"
                                                >
                                                    <svg
                                                        className="h-5 w-5"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Polling Info */}
                    <div className="mt-6 rounded-lg bg-gray-50 p-4">
                        <h4 className="text-sm font-medium text-gray-900">About Live Updates</h4>
                        <p className="mt-1 text-sm text-gray-600">
                            This page uses Inertia.js v2 polling to automatically refresh data every 3 seconds.
                            The polling indicator shows when the page is actively fetching new data.
                            You can pause/resume polling using the button in the header.
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
