import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm, router } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Todo {
    id: number;
    title: string;
    description: string | null;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    todos: Todo[];
}

export default function Index({ todos }: Props): JSX.Element {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('todos.store'), {
            onSuccess: () => reset(),
        });
    };

    const toggleComplete = (todo: Todo) => {
        router.patch(route('todos.update', todo.id), {
            is_completed: !todo.is_completed,
        });
    };

    const deleteTodo = (todo: Todo) => {
        if (confirm('Are you sure you want to delete this todo?')) {
            router.delete(route('todos.destroy', todo.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    To-Do List
                </h2>
            }
        >
            <Head title="To-Do List" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Add Todo Form */}
                            <form onSubmit={submit} className="mb-6">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <TextInput
                                            id="title"
                                            type="text"
                                            name="title"
                                            value={data.title}
                                            className="block w-full"
                                            placeholder="What needs to be done?"
                                            onChange={(e) => setData('title', e.target.value)}
                                        />
                                        <InputError message={errors.title} className="mt-2" />
                                    </div>
                                    <PrimaryButton disabled={processing}>
                                        Add Todo
                                    </PrimaryButton>
                                </div>
                                <div className="mt-3">
                                    <TextInput
                                        id="description"
                                        type="text"
                                        name="description"
                                        value={data.description}
                                        className="block w-full"
                                        placeholder="Description (optional)"
                                        onChange={(e) => setData('description', e.target.value)}
                                    />
                                    <InputError message={errors.description} className="mt-2" />
                                </div>
                            </form>

                            {/* Todo List */}
                            <div className="space-y-3">
                                {todos.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">
                                        No todos yet. Add one above!
                                    </p>
                                ) : (
                                    todos.map((todo) => (
                                        <div
                                            key={todo.id}
                                            className={`flex items-center justify-between rounded-lg border p-4 ${
                                                todo.is_completed
                                                    ? 'border-green-200 bg-green-50'
                                                    : 'border-gray-200 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={todo.is_completed}
                                                    onChange={() => toggleComplete(todo)}
                                                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <div>
                                                    <p
                                                        className={`font-medium ${
                                                            todo.is_completed
                                                                ? 'text-gray-400 line-through'
                                                                : 'text-gray-900'
                                                        }`}
                                                    >
                                                        {todo.title}
                                                    </p>
                                                    {todo.description && (
                                                        <p
                                                            className={`text-sm ${
                                                                todo.is_completed
                                                                    ? 'text-gray-400'
                                                                    : 'text-gray-500'
                                                            }`}
                                                        >
                                                            {todo.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteTodo(todo)}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Summary */}
                            {todos.length > 0 && (
                                <div className="mt-6 text-sm text-gray-500">
                                    {todos.filter((t) => t.is_completed).length} of {todos.length} completed
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
