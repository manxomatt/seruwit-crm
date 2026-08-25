<?php

namespace App\Http\Requests\Install;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DatabaseConnectionRequest extends FormRequest
{
    /**
     * The installer is unauthenticated by design; the first-run gate is the only
     * guard, so any request that reaches it here is allowed.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $requiresServer = Rule::requiredIf(fn (): bool => $this->input('driver') !== 'sqlite');

        return [
            'driver' => ['required', Rule::in(['pgsql', 'mysql', 'sqlite'])],
            'host' => [$requiresServer, 'nullable', 'string', 'max:255'],
            'port' => [$requiresServer, 'nullable', 'integer', 'between:1,65535'],
            'database' => ['required', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array{driver: string, host: ?string, port: ?int, database: string, username: ?string, password: ?string}
     */
    public function connectionConfig(): array
    {
        return [
            'driver' => (string) $this->input('driver'),
            'host' => $this->input('host'),
            'port' => $this->filled('port') ? (int) $this->input('port') : null,
            'database' => (string) $this->input('database'),
            'username' => $this->input('username'),
            'password' => $this->input('password'),
        ];
    }
}
