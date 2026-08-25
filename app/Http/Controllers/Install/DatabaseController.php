<?php

namespace App\Http\Controllers\Install;

use App\Http\Controllers\Controller;
use App\Http\Requests\Install\DatabaseConnectionRequest;
use App\Support\Installer\DatabaseConnectionTester;
use App\Support\Installer\EnvironmentWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class DatabaseController extends Controller
{
    public function test(DatabaseConnectionRequest $request, DatabaseConnectionTester $tester): JsonResponse
    {
        return response()->json($tester->test($request->connectionConfig()));
    }

    public function store(
        DatabaseConnectionRequest $request,
        DatabaseConnectionTester $tester,
        EnvironmentWriter $env,
    ): RedirectResponse {
        $config = $request->connectionConfig();
        $result = $tester->test($config);

        if (! $result['ok']) {
            return back()->withInput()->withErrors(['database' => $result['message']]);
        }

        $payload = [
            'DB_CONNECTION' => $config['driver'],
            'DB_DATABASE' => $config['database'],
        ];

        if ($config['driver'] !== 'sqlite') {
            $payload += [
                'DB_HOST' => $config['host'],
                'DB_PORT' => $config['port'],
                'DB_USERNAME' => $config['username'],
                'DB_PASSWORD' => $config['password'],
            ];
        }

        $env->write($payload);

        return redirect()->route('install.index')->with('status', 'database-configured');
    }
}
