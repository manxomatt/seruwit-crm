<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('shuttle_cities')) {
            Schema::create('shuttle_cities', function (Blueprint $table) {
                $table->id();
                $table->string('code', 50)->unique();
                $table->string('name');
                $table->string('province')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('shuttle_settings')) {
            Schema::create('shuttle_settings', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->text('value')->nullable();
                $table->timestamps();
            });
        }

        if (Schema::hasTable('shuttle_pools')) {
            Schema::table('shuttle_pools', function (Blueprint $table) {
                if (! Schema::hasColumn('shuttle_pools', 'city_id')) {
                    $table->foreignId('city_id')->nullable()->after('id')->constrained('shuttle_cities')->nullOnDelete();
                }
                if (! Schema::hasColumn('shuttle_pools', 'code')) {
                    $table->string('code', 50)->nullable()->after('city_id');
                }
                if (! Schema::hasColumn('shuttle_pools', 'name')) {
                    $table->string('name')->nullable()->after('code');
                }
            });

            if (! $this->hasIndex('shuttle_pools', 'shuttle_pools_code_unique')) {
                Schema::table('shuttle_pools', function (Blueprint $table) {
                    $table->unique('code');
                });
            }
        }

        if (Schema::hasTable('shuttle_corridors')) {
            Schema::table('shuttle_corridors', function (Blueprint $table) {
                if (! Schema::hasColumn('shuttle_corridors', 'origin_city_id')) {
                    $table->foreignId('origin_city_id')->nullable()->after('destination_city')->constrained('shuttle_cities')->nullOnDelete();
                }
                if (! Schema::hasColumn('shuttle_corridors', 'destination_city_id')) {
                    $table->foreignId('destination_city_id')->nullable()->after('origin_city_id')->constrained('shuttle_cities')->nullOnDelete();
                }
                if (! Schema::hasColumn('shuttle_corridors', 'origin_pool_id')) {
                    $table->foreignId('origin_pool_id')->nullable()->after('destination_location_id')->constrained('shuttle_pools')->nullOnDelete();
                }
                if (! Schema::hasColumn('shuttle_corridors', 'destination_pool_id')) {
                    $table->foreignId('destination_pool_id')->nullable()->after('origin_pool_id')->constrained('shuttle_pools')->nullOnDelete();
                }
            });
        }

        $defaults = [
            'default_seat_capacity' => '14',
            'default_pickup_cutoff_minutes' => '90',
            'default_pool_base_fare' => '200000',
            'default_door_base_fare' => '250000',
        ];

        foreach ($defaults as $key => $value) {
            if (! DB::table('shuttle_settings')->where('key', $key)->exists()) {
                DB::table('shuttle_settings')->insert([
                    'key' => $key,
                    'value' => $value,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('shuttle_corridors')) {
            Schema::table('shuttle_corridors', function (Blueprint $table) {
                if (Schema::hasColumn('shuttle_corridors', 'destination_pool_id')) {
                    $table->dropConstrainedForeignId('destination_pool_id');
                }
                if (Schema::hasColumn('shuttle_corridors', 'origin_pool_id')) {
                    $table->dropConstrainedForeignId('origin_pool_id');
                }
                if (Schema::hasColumn('shuttle_corridors', 'destination_city_id')) {
                    $table->dropConstrainedForeignId('destination_city_id');
                }
                if (Schema::hasColumn('shuttle_corridors', 'origin_city_id')) {
                    $table->dropConstrainedForeignId('origin_city_id');
                }
            });
        }

        if (Schema::hasTable('shuttle_pools')) {
            Schema::table('shuttle_pools', function (Blueprint $table) {
                if (Schema::hasColumn('shuttle_pools', 'city_id')) {
                    $table->dropConstrainedForeignId('city_id');
                }
                if (Schema::hasColumn('shuttle_pools', 'code')) {
                    $table->dropUnique(['code']);
                    $table->dropColumn(['code', 'name']);
                }
            });
        }

        Schema::dropIfExists('shuttle_settings');
        Schema::dropIfExists('shuttle_cities');
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();
        $database = $connection->getDatabaseName();

        if ($connection->getDriverName() === 'pgsql') {
            $result = $connection->selectOne(
                'select 1 from pg_indexes where schemaname = current_schema() and tablename = ? and indexname = ?',
                [$table, $indexName]
            );

            return $result !== null;
        }

        $result = $connection->selectOne(
            'select 1 from information_schema.statistics where table_schema = ? and table_name = ? and index_name = ? limit 1',
            [$database, $table, $indexName]
        );

        return $result !== null;
    }
};
