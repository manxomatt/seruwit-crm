<?php

namespace Modules\Document\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Document\Database\Factories\DocumentReminderFactory;

class DocumentReminder extends Model
{
    /** @use HasFactory<DocumentReminderFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return DocumentReminderFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'document_id',
        'days_before',
        'remind_at',
        'sent_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'days_before' => 'integer',
            'remind_at' => 'date',
            'sent_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Document, $this>
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function isSent(): bool
    {
        return $this->sent_at !== null;
    }

    public function isPending(): bool
    {
        return $this->sent_at === null && $this->remind_at->isToday();
    }
}
