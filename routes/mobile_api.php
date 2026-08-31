<?php

use Illuminate\Support\Facades\Route;
use Modules\Partners\Http\Controllers\Api\Mobile\KycController;
use Modules\Partners\Http\Controllers\Api\Mobile\ProfileController;
use Modules\Rental\Http\Controllers\Api\Mobile\BookingController as RentalBookingController;
use Modules\Rental\Http\Controllers\Api\Mobile\CatalogController as RentalCatalogController;
use Modules\Rental\Http\Controllers\Api\Mobile\QuoteController as RentalQuoteController;
use Modules\Shuttle\Http\Controllers\Api\Mobile\AuthController;
use Modules\Shuttle\Http\Controllers\Api\Mobile\BookingHistoryController;
use Modules\Shuttle\Http\Controllers\Api\Mobile\BootstrapController;
use Modules\Shuttle\Http\Controllers\Api\Mobile\GeocodeController;
use Modules\Shuttle\Http\Controllers\Api\Mobile\HealthController;
use Modules\Shuttle\Http\Controllers\Api\Mobile\HoldController;
use Modules\Shuttle\Http\Controllers\Api\Mobile\ShuttleCatalogController;
use Modules\Shuttle\Http\Controllers\Api\Mobile\TicketController;
use Modules\Shuttle\Http\Middleware\AuthenticateMobilePassenger;
use Modules\Shuttle\Http\Middleware\MobileApiHeaders;

/*
|--------------------------------------------------------------------------
| Mobile Booking API (JSON) — Capacitor / native clients
|--------------------------------------------------------------------------
|
| Included from routes/app.php (web stack). CSRF is exempted for api/mobile/*
| in bootstrap/app.php. Tenant resolution follows the same domain rules as
| the rest of app.php (central_serves_app locally, tenant domains in prod).
|
*/

Route::prefix('api/mobile/v1')
    ->name('mobile.v1.')
    ->middleware([MobileApiHeaders::class, 'throttle:60,1'])
    ->group(function (): void {
        Route::get('/health', HealthController::class)->name('health');
        Route::get('/bootstrap', BootstrapController::class)->name('bootstrap');

        Route::middleware('throttle:5,1')->group(function (): void {
            Route::post('/auth/otp/send', [AuthController::class, 'sendOtp'])->name('auth.otp.send');
        });

        Route::post('/auth/otp/verify', [AuthController::class, 'verifyOtp'])
            ->middleware('throttle:10,1')
            ->name('auth.otp.verify');

        Route::middleware(AuthenticateMobilePassenger::class)->group(function (): void {
            Route::get('/auth/me', [AuthController::class, 'me'])->name('auth.me');
            Route::get('/auth/profile', [ProfileController::class, 'show'])->name('auth.profile.show');
            Route::match(['put', 'post'], '/auth/profile', [ProfileController::class, 'update'])
                ->middleware('throttle:20,1')
                ->name('auth.profile.update');
            Route::delete('/auth/account', [ProfileController::class, 'destroy'])
                ->middleware('throttle:5,1')
                ->name('auth.account.delete');
            Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');

            Route::get('/auth/kyc', [KycController::class, 'show'])->name('auth.kyc.show');
            Route::post('/auth/kyc', [KycController::class, 'submit'])
                ->middleware('throttle:10,1')
                ->name('auth.kyc.submit');

            Route::get('/shuttle/bookings', BookingHistoryController::class)->name('shuttle.bookings');

            Route::get('/rental/bookings', [RentalBookingController::class, 'index'])->name('rental.bookings.index');
            Route::post('/rental/bookings', [RentalBookingController::class, 'store'])
                ->middleware('throttle:20,1')
                ->name('rental.bookings.store');
            Route::post('/rental/bookings/{token}/cancel', [RentalBookingController::class, 'cancel'])
                ->middleware('throttle:20,1')
                ->name('rental.bookings.cancel');
            Route::post('/rental/bookings/{token}/pay-deposit', [RentalBookingController::class, 'payDeposit'])
                ->middleware('throttle:20,1')
                ->name('rental.bookings.pay_deposit');
            Route::post('/rental/bookings/{token}/pay-balance', [RentalBookingController::class, 'payBalance'])
                ->middleware('throttle:20,1')
                ->name('rental.bookings.pay_balance');
            Route::post('/rental/bookings/{token}/deposit-proof', [RentalBookingController::class, 'uploadDepositProof'])
                ->middleware('throttle:20,1')
                ->name('rental.bookings.deposit_proof');
        });

        Route::get('/shuttle/corridors', [ShuttleCatalogController::class, 'corridors'])
            ->name('shuttle.corridors');
        Route::get('/shuttle/departures', [ShuttleCatalogController::class, 'departures'])
            ->name('shuttle.departures');
        Route::get('/shuttle/geocode/reverse', [GeocodeController::class, 'reverse'])
            ->middleware('throttle:20,1')
            ->name('shuttle.geocode.reverse');

        Route::post('/shuttle/holds', [HoldController::class, 'store'])
            ->middleware('throttle:20,1')
            ->name('shuttle.holds.store');

        Route::get('/shuttle/tickets/{token}', [TicketController::class, 'show'])
            ->name('shuttle.tickets.show');
        Route::post('/shuttle/tickets/{token}/cancel', [TicketController::class, 'cancel'])
            ->middleware('throttle:20,1')
            ->name('shuttle.tickets.cancel');
        Route::post('/shuttle/tickets/{token}/pay', [TicketController::class, 'pay'])
            ->middleware('throttle:20,1')
            ->name('shuttle.tickets.pay');

        Route::get('/rental/payment-methods', [RentalBookingController::class, 'paymentMethods'])
            ->name('rental.payment_methods');
        Route::get('/rental/classes', [RentalCatalogController::class, 'classes'])->name('rental.classes');
        Route::get('/rental/vehicles', [RentalCatalogController::class, 'vehicles'])->name('rental.vehicles.index');
        Route::get('/rental/vehicles/{vehicle}', [RentalCatalogController::class, 'showVehicle'])->name('rental.vehicles.show');
        Route::get('/rental/locations', [RentalCatalogController::class, 'locations'])->name('rental.locations');
        Route::get('/rental/insurance-packages', [RentalCatalogController::class, 'insurancePackages'])->name('rental.insurance_packages');
        Route::post('/rental/quotes', RentalQuoteController::class)
            ->middleware('throttle:30,1')
            ->name('rental.quotes');
        Route::get('/rental/bookings/{token}', [RentalBookingController::class, 'show'])->name('rental.bookings.show');
    });
