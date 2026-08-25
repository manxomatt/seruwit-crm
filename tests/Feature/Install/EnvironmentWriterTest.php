<?php

namespace Tests\Feature\Install;

use App\Support\Installer\EnvironmentWriter;
use Tests\TestCase;

class EnvironmentWriterTest extends TestCase
{
    public function test_it_updates_in_place_appends_and_quotes_values(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'env');
        file_put_contents($path, "APP_NAME=Old\nDB_HOST=127.0.0.1\n");

        (new EnvironmentWriter($path))->write([
            'APP_NAME' => 'My Company',        // spaces → quoted
            'DB_HOST' => 'db.internal',        // updated in place
            'CENTRAL_SERVES_APP' => false,     // bool → literal
            'NEW_KEY' => 'plain',              // appended
        ]);

        $contents = file_get_contents($path);
        @unlink($path);

        $this->assertStringContainsString('APP_NAME="My Company"', $contents);
        $this->assertStringContainsString('DB_HOST=db.internal', $contents);
        $this->assertStringNotContainsString('127.0.0.1', $contents);
        $this->assertStringContainsString('CENTRAL_SERVES_APP=false', $contents);
        $this->assertStringContainsString('NEW_KEY=plain', $contents);
    }

    public function test_it_creates_the_file_when_missing(): void
    {
        $path = sys_get_temp_dir().'/install-env-'.uniqid().'.env';

        (new EnvironmentWriter($path))->write(['APP_KEY' => 'base64:abc']);

        $this->assertFileExists($path);
        $this->assertStringContainsString('APP_KEY=base64:abc', file_get_contents($path));

        @unlink($path);
    }
}
