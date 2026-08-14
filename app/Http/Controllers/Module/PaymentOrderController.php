<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Admin\PaymentOrderController as AdminPaymentOrderController;

class PaymentOrderController extends AdminPaymentOrderController
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    protected function getPagePrefix(): string
    {
        return 'Admin';
    }
}
