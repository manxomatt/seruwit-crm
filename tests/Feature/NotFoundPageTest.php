<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotFoundPageTest extends TestCase
{
    public function test_unmatched_web_route_renders_custom_inertia_not_found_page(): void
    {
        $response = $this->get('/halaman-yang-tidak-ada-12345');

        $response->assertStatus(404);
        $response->assertInertia(fn (Assert $page): Assert => $page
            ->component('Errors/NotFound')
            ->where('requestedPath', '/halaman-yang-tidak-ada-12345')
            ->where('requestMethod', 'GET')
            ->has('siteName')
            ->has('homeUrl')
            ->has('loginUrl')
        );
    }

    public function test_api_or_json_not_found_returns_json_response(): void
    {
        $this->getJson('/halaman-yang-tidak-ada-12345')
            ->assertStatus(404)
            ->assertJsonStructure(['message']);

        $this->get('/api/endpoint-tidak-ada-12345', ['Accept' => 'application/json'])
            ->assertStatus(404)
            ->assertJsonStructure(['message']);
    }
}
