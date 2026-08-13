<?php

namespace App\Support;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class WorkspaceSuspendedPage
{
    /**
     * Render the suspended-workspace screen with HTTP 403.
     */
    public static function toResponse(
        Request $request,
        ?string $workspaceName = null,
        ?string $domain = null,
        ?string $tenantId = null,
        ?bool $isTrialExpired = false,
    ): Response {
        return Inertia::render('Errors/WorkspaceSuspended', [
            'workspace' => [
                'id' => $tenantId,
                'name' => $workspaceName ?? (string) (tenant('name') ?: ''),
                'domain' => $domain ?? $request->getHost(),
            ],
            'workspacesUrl' => route('central.workspaces.index'),
            'isTrialExpired' => $isTrialExpired,
        ])->toResponse($request)->setStatusCode(403);
    }
}
