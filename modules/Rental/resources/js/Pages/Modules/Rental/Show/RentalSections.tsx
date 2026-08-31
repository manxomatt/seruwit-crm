import AiKycVerificationCard from '../../../../Components/AiKycVerificationCard';
import { type AiInspectionData } from '../../../../Components/AiHandoverInspectionPanel';
import AddonsSection from './sections/AddonsSection';
import BillingSection from './sections/BillingSection';
import BookingDetailsSection from './sections/BookingDetailsSection';
import DamagesSection from './sections/DamagesSection';
import ExtensionRequestsSection from './sections/ExtensionRequestsSection';
import ExtensionsHistorySection from './sections/ExtensionsHistorySection';
import HandoverSection from './sections/HandoverSection';
import NotesSection from './sections/NotesSection';
import PricingSnapshotSection from './sections/PricingSnapshotSection';
import QuickFactsSection from './sections/QuickFactsSection';
import TimelineSection from './sections/TimelineSection';
import VehicleSwapsSection from './sections/VehicleSwapsSection';
import type { AddonCharge, PaymentSummary, Rental, VehicleSwapRow } from './types';
import type { HandoverEvidence } from './types';

interface Props {
    rental: Rental;
    periodLabel: string;
    payment: PaymentSummary;
    invoicingEnabled: boolean;
    addonCharges: AddonCharge[];
    vehicleSwaps: VehicleSwapRow[];
    checklistItems: string[];
    handoverEvidence: HandoverEvidence;
    aiKycEnabled: boolean;
    aiInspectionEnabled: boolean;
    latestAiInspection: AiInspectionData | null;
    aiScanKycUrl?: string;
    aiSyncKycPartnerUrl?: string;
    aiInspectExistingUrl?: string;
    aiApplyDamageUrl?: string;
}

/**
 * Two-column detail grid for the rental Show page. Each child is a display
 * section; the interactive ones fire their own self-contained `router` calls,
 * so no parent-state callbacks are threaded through here.
 */
export default function RentalSections({
    rental,
    periodLabel,
    payment,
    invoicingEnabled,
    addonCharges,
    vehicleSwaps,
    checklistItems,
    handoverEvidence,
    aiKycEnabled,
    aiInspectionEnabled,
    latestAiInspection,
    aiScanKycUrl,
    aiSyncKycPartnerUrl,
    aiInspectExistingUrl,
    aiApplyDamageUrl,
}: Props): JSX.Element {
    const showHandover =
        rental.start_odometer != null ||
        rental.end_odometer != null ||
        Boolean(rental.checkout_checklist) ||
        Boolean(rental.return_checklist);

    return (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
            {/* Left Column (3 of 5 cols) */}
            <div className="space-y-6 lg:col-span-3">
                <BookingDetailsSection rental={rental} periodLabel={periodLabel} />

                {aiKycEnabled && (
                    <AiKycVerificationCard
                        assessment={rental.ai_kyc_assessment ?? null}
                        hasKtp={Boolean(rental.passenger_ktp_path)}
                        hasSim={Boolean(rental.passenger_sim_path)}
                        aiScanKycUrl={aiScanKycUrl || ''}
                        aiSyncKycPartnerUrl={aiSyncKycPartnerUrl}
                        canUpdate={rental.status !== 'cancelled' && rental.status !== 'cancelled_paid'}
                    />
                )}

                <PricingSnapshotSection rental={rental} periodLabel={periodLabel} />

                {invoicingEnabled && <BillingSection payment={payment} />}

                {showHandover && (
                    <HandoverSection
                        rental={rental}
                        checklistItems={checklistItems}
                        handoverEvidence={handoverEvidence}
                        aiInspectionEnabled={aiInspectionEnabled}
                        latestAiInspection={latestAiInspection}
                        aiInspectExistingUrl={aiInspectExistingUrl}
                        aiApplyDamageUrl={aiApplyDamageUrl}
                    />
                )}

                {(rental.extension_requests?.length ?? 0) > 0 && (
                    <ExtensionRequestsSection rental={rental} periodLabel={periodLabel} />
                )}

                {rental.extensions.length > 0 && (
                    <ExtensionsHistorySection extensions={rental.extensions} periodLabel={periodLabel} />
                )}

                {vehicleSwaps.length > 0 && <VehicleSwapsSection vehicleSwaps={vehicleSwaps} />}

                {addonCharges.length > 0 && <AddonsSection rentalId={rental.id} addonCharges={addonCharges} />}

                {rental.damages.length > 0 && <DamagesSection rentalId={rental.id} damages={rental.damages} />}
            </div>

            {/* Right Column (2 of 5 cols) */}
            <div className="space-y-6 lg:col-span-2">
                <TimelineSection rental={rental} />

                {rental.notes && <NotesSection notes={rental.notes} />}

                <QuickFactsSection rental={rental} />
            </div>
        </div>
    );
}
