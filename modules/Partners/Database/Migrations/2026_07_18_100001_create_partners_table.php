<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('customers')) {
            Schema::rename('customers', 'partners');

            Schema::table('partners', function (Blueprint $table) {
                $table->string('account_type')->default('company')->after('code');
                $table->string('sub_type')->default('customer')->nullable()->after('account_type');
                $table->string('mobile')->nullable()->after('phone');
                $table->string('job_title')->nullable()->after('email');
                $table->string('website')->nullable()->after('job_title');
                $table->string('tax_id')->nullable()->after('website');
                $table->string('company_registry')->nullable()->after('tax_id');
                $table->string('reference')->nullable()->after('company_registry');
                $table->foreignId('parent_id')->nullable()->after('reference')->constrained('partners')->nullOnDelete();
                $table->foreignId('industry_id')->nullable()->after('parent_id');
                $table->foreignId('title_id')->nullable()->after('industry_id');
                $table->integer('customer_rank')->default(0)->after('title_id');
                $table->integer('supplier_rank')->default(0)->after('customer_rank');
                $table->decimal('credit_limit', 16, 2)->nullable()->after('supplier_rank');
                $table->text('comment')->nullable()->after('credit_limit');
                $table->softDeletes()->after('status');

                $table->index('account_type');
                $table->index('sub_type');
                $table->index('tax_id');
                $table->index('reference');
                $table->index('mobile');
                $table->index('phone');
                $table->index('name');
            });

            DB::table('partners')->update(['customer_rank' => 1]);

            if (Schema::hasTable('installed_modules')) {
                DB::table('installed_modules')->where('key', 'customers')->update(['key' => 'partners']);
            }

            if (Schema::hasTable('permissions')) {
                DB::table('permissions')->where('module', 'customers')->update(['module' => 'partners']);
                DB::table('permissions')->where('slug', 'like', 'customers.%')->get()->each(function ($perm) {
                    $action = str_replace('customers.', '', $perm->slug);
                    DB::table('permissions')->where('id', $perm->id)->update([
                        'slug' => "partners.{$action}",
                        'name' => str_replace('Customers', 'Partners', $perm->name),
                        'description' => str_replace('Customers', 'Partners', $perm->description),
                    ]);
                });
            }
        } elseif (! Schema::hasTable('partners')) {
            Schema::create('partners', function (Blueprint $table) {
                $table->id();
                $table->uuid('global_customer_id')->nullable()->unique();
                $table->string('code')->unique();
                $table->string('account_type')->default('company');
                $table->string('sub_type')->default('customer')->nullable();
                $table->string('name');
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->string('mobile')->nullable();
                $table->string('job_title')->nullable();
                $table->string('website')->nullable();
                $table->string('tax_id')->nullable();
                $table->string('company_registry')->nullable();
                $table->string('reference')->nullable();
                $table->foreignId('parent_id')->nullable()->constrained('partners')->nullOnDelete();
                $table->foreignId('industry_id')->nullable();
                $table->foreignId('title_id')->nullable();
                $table->integer('customer_rank')->default(0);
                $table->integer('supplier_rank')->default(0);
                $table->decimal('credit_limit', 16, 2)->nullable();
                $table->text('comment')->nullable();
                $table->text('address')->nullable();
                $table->text('notes')->nullable();
                $table->string('status')->default('active');
                $table->softDeletes();
                $table->timestamps();

                $table->index('account_type');
                $table->index('sub_type');
                $table->index('tax_id');
                $table->index('reference');
                $table->index('mobile');
                $table->index('phone');
                $table->index('name');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('installed_modules')) {
            DB::table('installed_modules')->where('key', 'partners')->update(['key' => 'customers']);
        }

        Schema::table('partners', function (Blueprint $table) {
            $table->dropIndex(['account_type']);
            $table->dropIndex(['sub_type']);
            $table->dropIndex(['tax_id']);
            $table->dropIndex(['reference']);
            $table->dropIndex(['mobile']);
            $table->dropIndex(['phone']);
            $table->dropIndex(['name']);

            $table->dropForeign(['parent_id']);
            $table->dropColumn([
                'account_type', 'sub_type', 'mobile', 'job_title', 'website',
                'tax_id', 'company_registry', 'reference', 'parent_id',
                'industry_id', 'title_id', 'customer_rank', 'supplier_rank',
                'credit_limit', 'comment', 'deleted_at',
            ]);
        });

        Schema::rename('partners', 'customers');
    }
};
