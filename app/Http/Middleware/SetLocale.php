<?php

namespace App\Http\Middleware;

use App\Support\LocaleResolver;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function __construct(private LocaleResolver $locales) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $this->locales->apply($request);

        return $next($request);
    }
}
