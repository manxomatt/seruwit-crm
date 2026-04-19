<?php

namespace App\DTOs;

readonly class ExternalUserData
{
    public function __construct(
        public string $name,
        public string $username,
        public string $email,
        public string $externalId,
        public string $role,
        public string $status,
        public ?string $accessToken = null,
        public ?string $refreshToken = null,
    ) {}

    /**
     * Create from external API response payload.
     *
     * Expected response shape:
     * {
     *   "success": true,
     *   "authorization": {
     *     "access_token": "string",
     *     "token_type": "bearer",
     *     "expires_in": 1209600,
     *     "refresh_token": "string"
     *   },
     *   "user": {
     *     "id": 16,
     *     "username": "string",
     *     "email": "string",
     *     "role": "string",    // role slug, e.g. "admin", "manager", "user"
     *     "status": "true",   // string boolean — normalized to "active"/"inactive"
     *     "manager_id": 16
     *   }
     * }
     *
     * @param  array<string, mixed>  $data
     */
    public static function fromApiResponse(array $data): self
    {
        /** @var array<string, mixed> $user */
        $user = $data['user'];

        /** @var array<string, mixed> $authorization */
        $authorization = $data['authorization'] ?? [];

        return new self(
            name: (string) $user['username'],
            username: (string) $user['username'],
            email: (string) $user['email'],
            externalId: (string) $user['id'],
            role: (string) ($user['role'] ?? 'user'),
            status: self::normalizeStatus((string) ($user['status'] ?? 'true')),
            accessToken: isset($authorization['access_token']) ? (string) $authorization['access_token'] : null,
            refreshToken: isset($authorization['refresh_token']) ? (string) $authorization['refresh_token'] : null,
        );
    }

    /**
     * Normalize the API's string boolean status to a consistent local value.
     * API sends "true" or "false" as strings.
     */
    private static function normalizeStatus(string $status): string
    {
        return filter_var($status, FILTER_VALIDATE_BOOLEAN) ? 'active' : 'inactive';
    }
}
