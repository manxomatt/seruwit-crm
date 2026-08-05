<?php

namespace Modules\Tracking\Exceptions;

use RuntimeException;

/**
 * Anything that stopped a GPS source poll or sync from completing. Caught per
 * source so one broken account never stalls the rest of the run.
 */
class GpsProviderException extends RuntimeException {}
