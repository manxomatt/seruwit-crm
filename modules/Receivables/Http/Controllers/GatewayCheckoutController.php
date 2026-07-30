<?php

namespace Modules\Receivables\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Modules\Invoicing\Models\Invoice;
use Modules\Receivables\Support\GatewayCheckoutService;
use Symfony\Component\HttpFoundation\Response;

class GatewayCheckoutController extends Controller
{
    public function __construct(private readonly GatewayCheckoutService $gateway) {}

    public function payInvoice(Invoice $invoice): RedirectResponse
    {
        $invoice->loadMissing('partner');
        $charge = $this->gateway->createInvoiceCharge($invoice);

        return redirect()->away($charge->redirect_url);
    }

    public function webhook(Request $request): JsonResponse
    {
        if (! \Illuminate\Support\Facades\Schema::hasTable('gateway_charges')) {
            return response()->json(['message' => 'Gateway not installed'], Response::HTTP_NOT_FOUND);
        }

        try {
            $this->gateway->handleNotification($request->all());
        } catch (ValidationException $e) {
            return response()->json([
                'message' => collect($e->errors())->flatten()->first() ?? 'Invalid notification',
            ], Response::HTTP_BAD_REQUEST);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Order not found'], Response::HTTP_NOT_FOUND);
        }

        return response()->json(['message' => 'ok']);
    }
}
