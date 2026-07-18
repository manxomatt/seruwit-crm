<?php

namespace Modules\Customer\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Customer\Http\Requests\StoreCustomerRequest;
use Modules\Customer\Http\Requests\UpdateCustomerRequest;
use Modules\Customer\Models\Customer;

class CustomerController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the customers.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $customers = Customer::query()
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Customer/Index', [
            'customers' => $customers,
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('customers', 'create'),
                'update' => $user->hasPermissionFor('customers', 'update'),
                'delete' => $user->hasPermissionFor('customers', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new customer.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Customer/Create');
    }

    /**
     * Store a newly created customer in storage.
     */
    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        $customer = Customer::create([
            ...$request->validated(),
            'code' => Customer::nextCode(),
        ]);

        return redirect()->route($this->getRoutePrefix().'.customers.show', $customer)
            ->with('success', 'Customer created successfully.');
    }

    /**
     * Display the specified customer.
     */
    public function show(Customer $customer): Response
    {
        $user = Auth::user();

        return Inertia::render('Modules/Customer/Show', [
            'customer' => $customer,
            'can' => [
                'update' => $user->hasPermissionFor('customers', 'update'),
                'delete' => $user->hasPermissionFor('customers', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified customer.
     */
    public function edit(Customer $customer): Response
    {
        return Inertia::render('Modules/Customer/Edit', [
            'customer' => $customer,
        ]);
    }

    /**
     * Update the specified customer in storage.
     */
    public function update(UpdateCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.customers.show', $customer)
            ->with('success', 'Customer updated successfully.');
    }

    /**
     * Remove the specified customer from storage.
     *
     * Customer has no knowledge of Trip or any other module that might
     * reference it, so it cannot check "is this customer referenced" itself —
     * the database's own foreign key constraint is what stops the delete, and
     * this just turns that into a readable message instead of a 500. The
     * delete is wrapped in its own transaction so a constraint violation only
     * rolls back this statement (via a savepoint) instead of poisoning an
     * outer one.
     */
    public function destroy(Customer $customer): RedirectResponse
    {
        try {
            DB::transaction(fn () => $customer->delete());
        } catch (QueryException) {
            return back()->with('error', 'This customer is still referenced by other records and cannot be deleted.');
        }

        return redirect()->route($this->getRoutePrefix().'.customers.index')
            ->with('success', 'Customer deleted successfully.');
    }
}
