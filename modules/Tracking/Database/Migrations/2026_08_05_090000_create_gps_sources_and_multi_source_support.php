<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gps_sources', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('provider')->default('traccar');
            $table->string('base_url')->nullable();
            $table->string('auth_type')->default('basic');
            $table->string('email')->nullable();
            $table->text('password')->nullable();
            $table->text('token')->nullable();
            $table->boolean('poll_enabled')->default(false);
            $table->dateTime('last_polled_at')->nullable();
            $table->text('last_poll_error')->nullable();
            $table->timestamps();
        });

        Schema::table('gps_devices', function (Blueprint $table) {
            $table->foreignId('gps_source_id')
                ->nullable()
                ->after('id')
                ->constrained('gps_sources')
                ->cascadeOnDelete();
        });

        $primarySourceId = null;

        if (Schema::hasTable('tracking_configs')) {
            foreach (DB::table('tracking_configs')->orderBy('id')->get() as $config) {
                $sourceId = DB::table('gps_sources')->insertGetId([
                    'name' => 'Primary',
                    'provider' => $config->provider ?? 'traccar',
                    'base_url' => $config->base_url,
                    'auth_type' => $config->auth_type ?? 'basic',
                    'email' => $config->email,
                    'password' => $config->password,
                    'token' => $config->token,
                    'poll_enabled' => (bool) ($config->poll_enabled ?? false),
                    'last_polled_at' => $config->last_polled_at,
                    'last_poll_error' => $config->last_poll_error,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $primarySourceId ??= $sourceId;
            }
        }

        if ($primarySourceId === null && DB::table('gps_devices')->whereNull('gps_source_id')->exists()) {
            $primarySourceId = DB::table('gps_sources')->insertGetId([
                'name' => 'Primary',
                'provider' => 'traccar',
                'base_url' => null,
                'auth_type' => 'basic',
                'email' => null,
                'password' => null,
                'token' => null,
                'poll_enabled' => false,
                'last_polled_at' => null,
                'last_poll_error' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if ($primarySourceId !== null) {
            DB::table('gps_devices')->whereNull('gps_source_id')->update([
                'gps_source_id' => $primarySourceId,
            ]);
        }

        Schema::table('gps_devices', function (Blueprint $table) {
            $table->dropUnique(['traccar_device_id']);
            $table->dropUnique(['unique_id']);
        });

        Schema::table('gps_devices', function (Blueprint $table) {
            $table->renameColumn('traccar_device_id', 'external_device_id');
            $table->renameColumn('traccar_total_distance_m', 'provider_total_distance_m');
        });

        DB::statement('ALTER TABLE gps_devices ALTER COLUMN gps_source_id SET NOT NULL');

        Schema::table('gps_devices', function (Blueprint $table) {
            $table->unique(['gps_source_id', 'external_device_id']);
            $table->unique(['gps_source_id', 'unique_id']);
        });

        Schema::table('tracking_configs', function (Blueprint $table) {
            $table->dropColumn([
                'provider',
                'base_url',
                'auth_type',
                'email',
                'password',
                'token',
                'poll_enabled',
                'last_polled_at',
                'last_poll_error',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('tracking_configs', function (Blueprint $table) {
            $table->string('provider')->default('traccar')->after('id');
            $table->string('base_url')->nullable()->after('provider');
            $table->string('auth_type')->default('basic')->after('base_url');
            $table->string('email')->nullable()->after('auth_type');
            $table->text('password')->nullable()->after('email');
            $table->text('token')->nullable()->after('password');
            $table->boolean('poll_enabled')->default(false)->after('token');
            $table->dateTime('last_polled_at')->nullable();
            $table->text('last_poll_error')->nullable();
        });

        $primary = DB::table('gps_sources')->orderBy('id')->first();

        if ($primary) {
            DB::table('tracking_configs')->orderBy('id')->limit(1)->update([
                'provider' => $primary->provider,
                'base_url' => $primary->base_url,
                'auth_type' => $primary->auth_type,
                'email' => $primary->email,
                'password' => $primary->password,
                'token' => $primary->token,
                'poll_enabled' => $primary->poll_enabled,
                'last_polled_at' => $primary->last_polled_at,
                'last_poll_error' => $primary->last_poll_error,
            ]);
        }

        Schema::table('gps_devices', function (Blueprint $table) {
            $table->dropUnique(['gps_source_id', 'external_device_id']);
            $table->dropUnique(['gps_source_id', 'unique_id']);
        });

        Schema::table('gps_devices', function (Blueprint $table) {
            $table->renameColumn('external_device_id', 'traccar_device_id');
            $table->renameColumn('provider_total_distance_m', 'traccar_total_distance_m');
        });

        Schema::table('gps_devices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('gps_source_id');
            $table->unique('traccar_device_id');
            $table->unique('unique_id');
        });

        Schema::dropIfExists('gps_sources');
    }
};
