<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class LocaleResolver
{
    /**
     * Resolve and apply the active locale for this request.
     */
    public function apply(Request $request): string
    {
        $locale = $this->resolve($request);
        App::setLocale($locale);

        return $locale;
    }

    public function resolve(Request $request): string
    {
        $supported = config('localization.supported', ['en', 'id']);

        $candidates = [
            $request->user()?->locale,
            $request->session()->get(config('localization.session_key', 'locale')),
            config('localization.default'),
            config('app.locale'),
            'en',
        ];

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && in_array($candidate, $supported, true)) {
                return $candidate;
            }
        }

        return 'en';
    }

    public function isSupported(string $locale): bool
    {
        return in_array($locale, config('localization.supported', ['en', 'id']), true);
    }

    /**
     * Persist locale for the current visitor (session) and authenticated user.
     */
    public function persist(Request $request, string $locale): void
    {
        if (! $this->isSupported($locale)) {
            return;
        }

        $request->session()->put(config('localization.session_key', 'locale'), $locale);

        $user = $request->user();

        if ($user && $user->locale !== $locale) {
            $user->forceFill(['locale' => $locale])->save();
        }

        App::setLocale($locale);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function sharedTranslations(): array
    {
        $groups = config('localization.shared_groups', []);
        $bag = [];

        foreach ($groups as $group) {
            $lines = trans($group);
            $bag[$group] = is_array($lines) ? $lines : [];
        }

        return $bag;
    }

    /**
     * @return list<array{code: string, label: string}>
     */
    public function availableLocales(): array
    {
        return [
            ['code' => 'en', 'label' => 'English'],
            ['code' => 'id', 'label' => 'Bahasa Indonesia'],
        ];
    }
}
