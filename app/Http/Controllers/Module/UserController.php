<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Admin\UserController as AdminUserController;

class UserController extends AdminUserController
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
