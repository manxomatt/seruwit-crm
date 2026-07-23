<?php

namespace Modules\Partners\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Partners\Database\Factories\PartnerTagFactory;

class PartnerTag extends Model
{
    /** @use HasFactory<PartnerTagFactory> */
    use HasFactory;

    use SoftDeletes;

    protected static function newFactory(): Factory
    {
        return PartnerTagFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'name',
        'color',
    ];

    /** @return BelongsToMany<Partner, $this> */
    public function partners(): BelongsToMany
    {
        return $this->belongsToMany(Partner::class, 'partner_partner_tag', 'tag_id', 'partner_id');
    }
}
