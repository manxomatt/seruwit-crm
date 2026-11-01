<?php

namespace Modules\DriverPayroll\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Support\PaymentAccountResolver;
use Modules\Driver\Models\Driver;
use Modules\DriverPayroll\Models\DriverPayroll;
use Modules\DriverPayroll\Support\DriverPayrollCalculator;
use Modules\DriverPayroll\Support\DriverPayrollDisbursementService;

class DriverPayrollController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function __construct(
        private readonly DriverPayrollCalculator $calculator,
        private readonly DriverPayrollDisbursementService $disbursement,
    ) {}

    public function index(Request $request): Response
    {
        $query = DriverPayroll::query()
            ->with(['driver', 'approver', 'payer', 'companyBankAccount'])
            ->latest('id');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('driver_id')) {
            $query->where('driver_id', $request->integer('driver_id'));
        }

        $payrolls = $query->paginate(20)->withQueryString();
        $drivers = Driver::query()->orderBy('name')->get(['id', 'name', 'phone']);

        return Inertia::render('Modules/DriverPayroll/Index', [
            'payrolls' => $payrolls,
            'drivers' => $drivers,
            'filters' => $request->only(['status', 'driver_id']),
        ]);
    }

    public function generate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'driver_id' => ['required', 'exists:drivers,id'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
            'base_salary' => ['nullable', 'numeric', 'min:0'],
            'bonus' => ['nullable', 'numeric', 'min:0'],
            'deduct_cash_advances' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $payroll = $this->calculator->generate($validated, $request->user());

        return redirect()
            ->route($this->getRoutePrefix().'.driver-payroll.show', $payroll->id)
            ->with('success', "Draft payroll {$payroll->code} berhasil dibuat.");
    }

    public function show(DriverPayroll $payroll): Response
    {
        $payroll->loadMissing(['driver', 'lines', 'companyBankAccount', 'approver', 'payer', 'creator']);

        return Inertia::render('Modules/DriverPayroll/Show', [
            'payroll' => $payroll,
            'companyBankAccounts' => PaymentAccountResolver::optionsForForms(),
        ]);
    }

    public function approve(DriverPayroll $payroll, Request $request): RedirectResponse
    {
        $this->disbursement->approve($payroll, $request->user());

        return back()->with('success', "Payroll {$payroll->code} berhasil disetujui.");
    }

    public function disburse(DriverPayroll $payroll, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company_bank_account_id' => ['nullable', 'integer'],
            'payment_method' => ['required', 'string', 'in:bank_transfer,cash'],
            'payment_reference' => ['nullable', 'string', 'max:100'],
        ]);

        $this->disbursement->disburse(
            payroll: $payroll,
            companyBankAccountId: $validated['company_bank_account_id'] ?? null,
            paymentMethod: $validated['payment_method'],
            paymentReference: $validated['payment_reference'] ?? null,
            actor: $request->user(),
        );

        return back()->with('success', "Payroll {$payroll->code} berhasil dicairkan.");
    }

    public function print(DriverPayroll $payroll): Response
    {
        $payroll->loadMissing(['driver', 'lines', 'companyBankAccount', 'approver', 'payer']);

        return Inertia::render('Modules/DriverPayroll/Print', [
            'payroll' => $payroll,
        ]);
    }

    public function destroy(DriverPayroll $payroll): RedirectResponse
    {
        if ($payroll->isPaid()) {
            return back()->with('error', 'Payroll yang sudah dicairkan tidak dapat dihapus.');
        }

        $code = $payroll->code;
        $payroll->lines()->delete();
        $payroll->delete();

        return redirect()
            ->route($this->getRoutePrefix().'.driver-payroll.index')
            ->with('success', "Payroll {$code} telah dihapus.");
    }
}
