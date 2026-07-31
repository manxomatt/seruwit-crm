import { ReactNode } from 'react';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { useTrans } from '@/hooks/useTrans';

interface Props {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string | ReactNode;
    confirmText?: string;
    cancelText?: string;
    processing?: boolean;
    processingText?: string;
}

export default function ConfirmDeleteDialog({
    show,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    processing = false,
    processingText,
}: Props) {
    const { t } = useTrans();

    const resolvedTitle = title ?? t('common.confirm_delete_title');
    const resolvedMessage = message ?? t('common.confirm_delete_message');
    const resolvedConfirm = confirmText ?? t('common.confirm_delete_confirm');
    const resolvedCancel = cancelText ?? t('common.confirm_delete_cancel');
    const resolvedProcessing = processingText ?? t('common.deleting');
    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <div className="flex items-center">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg
                            className="h-6 w-6 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                            />
                        </svg>
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                            {resolvedTitle}
                        </h3>
                    </div>
                </div>

                <div className="mt-4">
                    <p className="text-sm text-gray-500">{resolvedMessage}</p>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={onClose} disabled={processing}>
                        {resolvedCancel}
                    </SecondaryButton>
                    <DangerButton onClick={onConfirm} disabled={processing}>
                        {processing ? resolvedProcessing : resolvedConfirm}
                    </DangerButton>
                </div>
            </div>
        </Modal>
    );
}
