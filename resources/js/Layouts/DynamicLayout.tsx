import { ReactNode } from 'react';
import AdminLayout from './AdminLayout';

interface Props {
    header?: ReactNode;
    children?: ReactNode;
}

/**
 * DynamicLayout component that provides a unified layout for all user levels.
 * 
 * The AdminLayout component now handles dynamic route prefixes internally,
 * so all users (admin, user, module) see the same layout structure.
 * The menu links are automatically adjusted based on the current route prefix
 * (admin, user, or module) which is shared via HandleInertiaRequests middleware.
 * 
 * Content and menu visibility are controlled by user permissions,
 * not by different layout components.
 */
export default function DynamicLayout({ header, children }: Props) {
    return (
        <AdminLayout header={header}>
            {children}
        </AdminLayout>
    );
}
