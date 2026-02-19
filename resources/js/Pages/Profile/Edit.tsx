import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import DeleteUserForm from './Partials/DeleteUserForm';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Edit() {
    return (
        <AuthenticatedLayout>
            <div className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
                <div className="bg-white shadow sm:rounded-lg p-6">
                    <UpdateProfileInformationForm />
                </div>

                <div className="bg-white shadow sm:rounded-lg p-6 mt-6">
                    <UpdatePasswordForm />
                </div>

                <div className="bg-white shadow sm:rounded-lg p-6 mt-6">
                    <DeleteUserForm />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
