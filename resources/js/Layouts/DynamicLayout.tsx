import { ReactNode } from 'react';
import ModuleLayout from './ModuleLayout';

interface Props {
    header?: ReactNode;
    children?: ReactNode;
}

/**
 * DynamicLayout component that provides a unified layout for all user levels.
 * 
 * The ModuleLayout component handles dynamic route prefixes internally,
 * so all users see the same layout structure.
 * The menu links are automatically adjusted based on the current route prefix
 * which is shared via HandleInertiaRequests middleware.
 * 
 * Content and menu visibility are controlled by user permissions,
 * not by different layout components.
 */
export default function DynamicLayout({ header, children }: Props) {
    return (
        <ModuleLayout header={header}>
            {children}
        </ModuleLayout>
    );
}
