<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('partner_industries')) {
            return;
        }

        Schema::table('partner_industries', function (Blueprint $table) {
            if (! Schema::hasColumn('partner_industries', 'code')) {
                $table->string('code')->nullable()->unique()->after('id');
            }
        });

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("
                ALTER TABLE partner_industries
                ALTER COLUMN name TYPE jsonb
                USING CASE
                    WHEN name IS NULL OR btrim(name::text) = '' THEN '{}'::jsonb
                    WHEN left(btrim(name::text), 1) = '{' THEN name::jsonb
                    ELSE jsonb_build_object('id', name::text, 'en', name::text)
                END
            ");

            DB::statement("
                ALTER TABLE partner_industries
                ALTER COLUMN description TYPE jsonb
                USING CASE
                    WHEN description IS NULL OR btrim(description::text) = '' THEN NULL
                    WHEN left(btrim(description::text), 1) = '{' THEN description::jsonb
                    ELSE jsonb_build_object('id', description::text, 'en', description::text)
                END
            ");

            return;
        }

        // SQLite / other: rebuild via temporary columns.
        Schema::table('partner_industries', function (Blueprint $table) {
            $table->json('name_i18n')->nullable();
            $table->json('description_i18n')->nullable();
        });

        $rows = DB::table('partner_industries')->select('id', 'name', 'description')->get();
        foreach ($rows as $row) {
            DB::table('partner_industries')->where('id', $row->id)->update([
                'name_i18n' => $this->toJsonMap($row->name),
                'description_i18n' => $row->description !== null && $row->description !== ''
                    ? $this->toJsonMap($row->description)
                    : null,
            ]);
        }

        Schema::table('partner_industries', function (Blueprint $table) {
            $table->dropColumn(['name', 'description']);
        });

        Schema::table('partner_industries', function (Blueprint $table) {
            $table->json('name');
            $table->json('description')->nullable();
        });

        foreach ($rows as $row) {
            DB::table('partner_industries')->where('id', $row->id)->update([
                'name' => DB::table('partner_industries')->where('id', $row->id)->value('name_i18n'),
                'description' => DB::table('partner_industries')->where('id', $row->id)->value('description_i18n'),
            ]);
        }

        Schema::table('partner_industries', function (Blueprint $table) {
            $table->dropColumn(['name_i18n', 'description_i18n']);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('partner_industries')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("
                ALTER TABLE partner_industries
                ALTER COLUMN name TYPE text
                USING COALESCE(name->>'id', name->>'en', name::text)
            ");
            DB::statement("
                ALTER TABLE partner_industries
                ALTER COLUMN description TYPE text
                USING CASE
                    WHEN description IS NULL THEN NULL
                    ELSE COALESCE(description->>'id', description->>'en', description::text)
                END
            ");
        }

        Schema::table('partner_industries', function (Blueprint $table) {
            if (Schema::hasColumn('partner_industries', 'code')) {
                $table->dropUnique(['code']);
                $table->dropColumn('code');
            }
        });
    }

    private function toJsonMap(mixed $value): string
    {
        $text = trim((string) $value);

        if ($text !== '' && str_starts_with($text, '{')) {
            return $text;
        }

        return json_encode(['id' => $text, 'en' => $text], JSON_UNESCAPED_UNICODE);
    }
};
