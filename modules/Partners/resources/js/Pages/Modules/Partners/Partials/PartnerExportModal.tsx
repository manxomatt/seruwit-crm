import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { FormEvent, useMemo, useState } from 'react';

export interface ExportColumnOption {
    key: string;
    label: string;
    default: boolean;
}

interface Props {
    show: boolean;
    onClose: () => void;
    columns: ExportColumnOption[];
    filters: {
        search: string | null;
        status: string | null;
        account_type: string | null;
        role: string | null;
    };
}

export default function PartnerExportModal({ show, onClose, columns, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const initialSelected = useMemo(
        () =>
            Object.fromEntries(
                columns.map((column) => [column.key, column.default]),
            ) as Record<string, boolean>,
        [columns],
    );

    const [selected, setSelected] = useState<Record<string, boolean>>(initialSelected);
    const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');

    const selectedKeys = columns.filter((column) => selected[column.key]).map((column) => column.key);

    const toggle = (key: string): void => {
        setSelected((current) => ({ ...current, [key]: !current[key] }));
    };

    const selectAll = (): void => {
        setSelected(Object.fromEntries(columns.map((column) => [column.key, true])));
    };

    const selectDefaults = (): void => {
        setSelected(Object.fromEntries(columns.map((column) => [column.key, column.default])));
    };

    const download = (event: FormEvent): void => {
        event.preventDefault();
        if (selectedKeys.length === 0) {
            return;
        }

        const params = new URLSearchParams();
        params.set('format', format);
        selectedKeys.forEach((key) => params.append('columns[]', key));

        if (filters.search) {
            params.set('search', filters.search);
        }
        if (filters.status) {
            params.set('status', filters.status);
        }
        if (filters.account_type) {
            params.set('account_type', filters.account_type);
        }
        if (filters.role) {
            params.set('role', filters.role);
        }

        window.location.assign(`${prefixedRoute('partners.export')}?${params.toString()}`);
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <form onSubmit={download} className="p-6">
                <h2 className="text-lg font-medium text-gray-900">{t('partners.export.title')}</h2>
                <p className="mt-1 text-sm text-gray-600">{t('partners.export.subtitle')}</p>

                <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {t('partners.export.format')}
                    </p>
                    <div className="mt-2 flex gap-4">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="radio"
                                name="format"
                                value="csv"
                                checked={format === 'csv'}
                                onChange={() => setFormat('csv')}
                                className="border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            CSV
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="radio"
                                name="format"
                                value="xlsx"
                                checked={format === 'xlsx'}
                                onChange={() => setFormat('xlsx')}
                                className="border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Excel (.xlsx)
                        </label>
                    </div>
                </div>

                <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {t('partners.export.columns_heading')}
                        </p>
                        <div className="flex gap-3 text-xs">
                            <button type="button" onClick={selectDefaults} className="font-medium text-indigo-600 hover:underline">
                                {t('partners.export.select_defaults')}
                            </button>
                            <button type="button" onClick={selectAll} className="font-medium text-indigo-600 hover:underline">
                                {t('partners.export.select_all')}
                            </button>
                        </div>
                    </div>
                    <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-3 sm:grid-cols-2">
                        {columns.map((column) => (
                            <label key={column.key} className="inline-flex items-start gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={Boolean(selected[column.key])}
                                    onChange={() => toggle(column.key)}
                                    className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>
                                    {column.label}
                                    <span className="ml-1 font-mono text-[11px] text-gray-400">{column.key}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        {t('partners.export.selected_count', { count: selectedKeys.length })}
                    </p>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={onClose}>
                        {t('common.cancel')}
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={selectedKeys.length === 0}>
                        {t('partners.export.download')}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
