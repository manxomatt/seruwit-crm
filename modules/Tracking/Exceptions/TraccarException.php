<?php

namespace Modules\Tracking\Exceptions;

use RuntimeException;

/**
 * Anything that stopped this tenant's poll from completing. Caught per tenant
 * so one broken Traccar account never stalls the rest of the run.
 */
class TraccarException extends RuntimeException {}
