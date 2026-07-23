<?php

namespace Modules\Partners\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Partners\Database\Factories\PartnerTitleFactory;

class PartnerTitle extends Model
{
    /** @use HasFactory<PartnerTitleFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return PartnerTitleFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'name',
        'short_name',
    ];

    /** @return HasMany<Partner, $this> */
    public function partners(): HasMany
    {
        return $this->hasMany(Partner::class, 'title_id');
    }
}
