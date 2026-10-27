<?php

namespace Modules\Fleet\Database\Factories;

use Modules\Fleet\Models\Driver;

/**
 * Backward-compatibility factory alias.
 *
 * @extends \Modules\Driver\Database\Factories\DriverFactory<Driver>
 */
class DriverFactory extends \Modules\Driver\Database\Factories\DriverFactory
{
    protected $model = Driver::class;
}
