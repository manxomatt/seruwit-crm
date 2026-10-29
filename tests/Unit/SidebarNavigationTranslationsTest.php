<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class SidebarNavigationTranslationsTest extends TestCase
{
    public function test_shell_translations_include_sidebar_collapse_and_expand_keys(): void
    {
        $baseDir = dirname(__DIR__, 2);
        $idShell = require $baseDir.'/lang/id/shell.php';
        $enShell = require $baseDir.'/lang/en/shell.php';

        $this->assertArrayHasKey('collapse_sidebar', $idShell);
        $this->assertArrayHasKey('expand_sidebar', $idShell);

        $this->assertArrayHasKey('collapse_sidebar', $enShell);
        $this->assertArrayHasKey('expand_sidebar', $enShell);

        $this->assertSame('Tutup menu samping', $idShell['collapse_sidebar']);
        $this->assertSame('Buka menu samping', $idShell['expand_sidebar']);

        $this->assertSame('Collapse sidebar', $enShell['collapse_sidebar']);
        $this->assertSame('Expand sidebar', $enShell['expand_sidebar']);
    }
}
