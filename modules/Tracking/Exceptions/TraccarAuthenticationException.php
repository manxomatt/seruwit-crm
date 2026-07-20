<?php

namespace Modules\Tracking\Exceptions;

/**
 * Traccar rejected the tenant's credentials — most often an expired API token,
 * which otherwise presents as "the map just stopped updating".
 */
class TraccarAuthenticationException extends TraccarException {}
