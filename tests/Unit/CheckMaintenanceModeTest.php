<?php

namespace Tests\Unit;

use App\Http\Middleware\CheckMaintenanceMode;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;

class CheckMaintenanceModeTest extends TestCase
{
    public function test_installer_and_health_check_are_always_allowed(): void
    {
        $middleware = new CheckMaintenanceMode;

        $requests = [
            Request::create('/up'),
            Request::create('/install'),
            Request::create('/install/step-1'),
        ];

        foreach ($requests as $request) {
            $executed = false;
            $response = $middleware->handle($request, function ($req) use (&$executed) {
                $executed = true;

                return new \Symfony\Component\HttpFoundation\Response('OK');
            });

            $this->assertTrue($executed);
            $this->assertSame(200, $response->getStatusCode());
        }
    }

    public function test_auth_routes_are_exempt(): void
    {
        $middleware = new CheckMaintenanceMode;
        $refMethod = new \ReflectionMethod(CheckMaintenanceMode::class, 'isExemptRoute');
        $refMethod->setAccessible(true);

        $exemptPaths = [
            '/login',
            '/logout',
            '/password/reset',
            '/two-factor/challenge',
            '/webhooks/payment',
            '/impersonate/xyz',
        ];

        foreach ($exemptPaths as $path) {
            $request = Request::create($path);
            $this->assertTrue(
                $refMethod->invoke($middleware, $request),
                "Path {$path} should be exempt from maintenance mode"
            );
        }

        $nonExemptPaths = [
            '/',
            '/p/about',
            '/blog',
            '/book/shuttle',
        ];

        foreach ($nonExemptPaths as $path) {
            $request = Request::create($path);
            $this->assertFalse(
                $refMethod->invoke($middleware, $request),
                "Path {$path} should not be exempt from maintenance mode"
            );
        }
    }
}
