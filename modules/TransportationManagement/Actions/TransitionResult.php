<?php

namespace Modules\TransportationManagement\Actions;

/**
 * The outcome of a stop transition, in a form both a controller and a
 * background listener can act on — the controller turns it into a flash
 * message, the listener into a log line.
 */
readonly class TransitionResult
{
    private function __construct(
        public bool $ok,
        public string $message,
    ) {}

    public static function ok(string $message): self
    {
        return new self(true, $message);
    }

    public static function refused(string $message): self
    {
        return new self(false, $message);
    }
}
