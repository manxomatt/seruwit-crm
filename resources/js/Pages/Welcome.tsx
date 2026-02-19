import { Head } from '@inertiajs/react';
import LandingApp from './WelcomeLanding/App';

export default function Welcome(): JSX.Element {
    return (
        <>
            <Head title="Welcome" />
            <LandingApp />
        </>
    );
}
