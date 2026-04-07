import { usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import AdminLayout from './AdminLayout';
import UserLayout from './UserLayout';

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    is_admin: boolean;
}

interface Props {
    header?: ReactNode;
    children?: ReactNode;
}

/**
 * DynamicLayout component that automatically selects the appropriate layout
 * based on the user's role:
 * - Admin users: AdminLayout (indigo theme)
 * - Non-admin users (e.g., content-manager): UserLayout (emerald theme)
 */
export default function DynamicLayout({ header, children }: Props) {
    const user = (usePage().props as any).auth.user as User | null;
    
    // Use AdminLayout for admin users, UserLayout for non-admin users
    const isAdmin = user?.is_admin || false;
    
    if (isAdmin) {
        return (
            <AdminLayout header={header}>
                {children}
            </AdminLayout>
        );
    }
    
    return (
        <UserLayout header={header}>
            {children}
        </UserLayout>
    );
}
