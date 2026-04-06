<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Admin\RoleController as AdminRoleController;

class RoleController extends AdminRoleController
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    protected function getPagePrefix(): string
    {
        return 'Module';
    }
}
