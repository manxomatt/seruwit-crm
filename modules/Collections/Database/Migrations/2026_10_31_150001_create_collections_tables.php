<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Modules\Expenses\Support\ExpenseSchemaInitializer;

return new class extends Migration
{
    public function up(): void
    {
        ExpenseSchemaInitializer::ensureTables();
        ExpenseSchemaInitializer::ensureSeeded();
    }

    public function down(): void
    {
        Schema::dropIfExists('post_dated_checks');
        Schema::dropIfExists('collection_promises');
        Schema::dropIfExists('collection_dunnings');
    }
};
