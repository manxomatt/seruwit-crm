<?php

namespace Modules\Tracking\Exceptions;

/**
 * The Traccar server could not be reached or answered with an error — a
 * transient condition, unlike bad credentials.
 */
class TraccarUnavailableException extends TraccarException {}
