import AddonModal from './AddonModal';
import CancelModal from './CancelModal';
import DamageModal from './DamageModal';
import ExtendModal from './ExtendModal';
import NoShowModal from './NoShowModal';
import SettleDepositModal from './SettleDepositModal';
import SwapModal from './SwapModal';
import type { AddonCodeOption, ModalRental, SwapVehicleOption } from '../types';

export type LifecycleModalName =
    | 'cancel'
    | 'no_show'
    | 'checkout'
    | 'return'
    | 'extend'
    | 'damage'
    | 'addon'
    | 'deposit'
    | 'swap'
    | null;

interface Props {
    active: LifecycleModalName;
    rental: ModalRental;
    swapVehicles: SwapVehicleOption[];
    addonCodes: AddonCodeOption[];
    onClose: () => void;
}

/**
 * Renders the staff-driven lifecycle modals for the rental Show page. Each modal
 * owns its own `useForm` state; this dispatcher only decides which one is open
 * based on the parent's `active` union value.
 */
export default function LifecycleModals({ active, rental, swapVehicles, addonCodes, onClose }: Props): JSX.Element {
    return (
        <>
            <CancelModal show={active === 'cancel'} rental={rental} onClose={onClose} />
            <NoShowModal show={active === 'no_show'} rental={rental} onClose={onClose} />
            <ExtendModal show={active === 'extend'} rental={rental} onClose={onClose} />
            <SwapModal show={active === 'swap'} rental={rental} swapVehicles={swapVehicles} onClose={onClose} />
            <DamageModal show={active === 'damage'} rental={rental} onClose={onClose} />
            <AddonModal show={active === 'addon'} rental={rental} addonCodes={addonCodes} onClose={onClose} />
            <SettleDepositModal show={active === 'deposit'} rental={rental} onClose={onClose} />
        </>
    );
}
