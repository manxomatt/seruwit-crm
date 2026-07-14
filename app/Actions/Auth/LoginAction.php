<?php

namespace App\Actions\Auth;

use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class LoginAction
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    /**
     * Authenticate a user against the local database.
     *
     * Accepts an email address or a username as the $login parameter.
     *
     * @throws ValidationException when authentication fails.
     */
    public function execute(
        string $login,
        string $password,
        string $throttleKey,
        bool $remember = false,
    ): void {
        $credentials = str_contains($login, '@')
            ? ['email' => $login, 'password' => $password]
            : ['username' => $login, 'password' => $password];

        if (! Auth::attempt($credentials, $remember)) {
            RateLimiter::hit($throttleKey);

            throw ValidationException::withMessages([
                'login' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($throttleKey);
        $this->userRepository->updateLastLogin(Auth::user());
    }
}
