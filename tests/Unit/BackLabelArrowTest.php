<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Back buttons render their own leading arrow in the React pages, so a label
 * that also carries one shows up as "← ← Kembali" in the UI.
 */
class BackLabelArrowTest extends TestCase
{
    public function test_document_back_labels_have_no_leading_arrow(): void
    {
        foreach (['en', 'id'] as $locale) {
            $lines = require dirname(__DIR__, 2)."/lang/{$locale}/document.php";

            $this->assertStringNotContainsString(
                '←',
                $lines['entity_docs']['back'],
                "The {$locale} document back label must not carry its own arrow.",
            );
        }
    }
}
