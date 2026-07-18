<?php

namespace Modules\Customer\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Customer\Database\Factories\CustomerFactory;

/**
 * Deliberately has no knowledge of Trip or any other consumer's booking
 * concept — Customer exists so Transportation, Rental, or any future module
 * can reference the same customer records via `requires(): ['customers']`
 * without this module depending back on any of them.
 */
class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return CustomerFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'global_customer_id',
        'code',
        'name',
        'email',
        'phone',
        'address',
        'notes',
        'status',
    ];

    /**
     * Generates the next sequential human-readable customer code, e.g.
     * CUST-000001. Not safe against a race between two simultaneous store
     * requests, but customer creation is a low-frequency, single-operator
     * action here — same trade-off as Trip::nextCode().
     */
    public static function nextCode(): string
    {
        $lastNumber = (int) static::query()
            ->orderByDesc('id')
            ->value('id');

        return sprintf('CUST-%06d', $lastNumber + 1);
    }
}
