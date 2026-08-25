<?php

namespace Tests\Feature\Install;

use App\Support\Installer\RequirementsChecker;
use Tests\TestCase;

class RequirementsCheckerTest extends TestCase
{
    public function test_it_reports_structured_checks_and_php_version_passes(): void
    {
        $checks = (new RequirementsChecker)->checks();

        $this->assertNotEmpty($checks);

        foreach ($checks as $check) {
            $this->assertArrayHasKey('name', $check);
            $this->assertArrayHasKey('passed', $check);
            $this->assertArrayHasKey('hint', $check);
            $this->assertIsBool($check['passed']);
        }

        $php = collect($checks)->firstWhere('name', 'PHP >= '.RequirementsChecker::MIN_PHP);

        $this->assertNotNull($php);
        $this->assertTrue($php['passed'], 'The test runtime should satisfy the minimum PHP version.');
    }
}
