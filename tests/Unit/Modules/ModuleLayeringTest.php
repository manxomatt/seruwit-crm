<?php

namespace Tests\Unit\Modules;

use App\Modules\ModuleContract;
use App\Modules\ModuleLayering;
use App\Modules\ModuleRegistry;
use App\Modules\ModuleTier;
use Tests\TestCase;

/**
 * Enforces the tier layering rule on the real module graph, and proves the
 * checker would actually catch a break in it.
 *
 * Without the fixture cases below, a checker that silently returned nothing
 * would pass the real-graph assertion forever and enforce nothing at all.
 */
class ModuleLayeringTest extends TestCase
{
    /**
     * @param  list<class-string<ModuleContract>>  $classes
     */
    private function layeringFor(array $classes): ModuleLayering
    {
        config(['modules.registered' => $classes]);

        return new ModuleLayering(new ModuleRegistry);
    }

    public function test_the_real_module_graph_satisfies_the_layering_rule(): void
    {
        $this->assertSame([], app(ModuleLayering::class)->violations());
    }

    public function test_a_foundation_module_may_not_require_a_vertical(): void
    {
        $violations = $this->layeringFor([
            FoundationReachingUpward::class,
            SomeVertical::class,
        ])->violations();

        $this->assertCount(1, $violations);
        $this->assertStringContainsString('never up', $violations[0]);
        $this->assertStringContainsString('[bad-foundation]', $violations[0]);
    }

    public function test_a_content_module_may_not_require_a_foundation(): void
    {
        $violations = $this->layeringFor([
            ContentReachingUpward::class,
            SomeFoundation::class,
        ])->violations();

        $this->assertCount(1, $violations);
        $this->assertStringContainsString('never up', $violations[0]);
    }

    public function test_an_unresolvable_dependency_is_reported(): void
    {
        $violations = $this->layeringFor([TypoDependency::class])->violations();

        $this->assertCount(1, $violations);
        $this->assertStringContainsString('neither a registered module nor a core feature', $violations[0]);
    }

    public function test_a_vertical_may_require_a_foundation_and_a_core_feature(): void
    {
        $violations = $this->layeringFor([
            VerticalReachingDownward::class,
            SomeFoundation::class,
        ])->violations();

        $this->assertSame([], $violations);
    }

    public function test_same_tier_dependencies_are_allowed(): void
    {
        $violations = $this->layeringFor([
            VerticalOnVertical::class,
            SomeVertical::class,
        ])->violations();

        $this->assertSame([], $violations);
    }
}

/**
 * Spares each fixture below the eight methods it would otherwise have to repeat
 * to satisfy ModuleContract; only key/tier/requires matter to the layering rule.
 */
abstract class LayeringFixture implements ModuleContract
{
    public function label(): string
    {
        return ucfirst($this->key());
    }

    public function description(): string
    {
        return 'Layering fixture.';
    }

    public function permissions(): array
    {
        return ['view'];
    }

    public function menu(): ?array
    {
        return null;
    }

    public function migrationsPath(): string
    {
        return __DIR__;
    }

    public function viewsPath(): ?string
    {
        return null;
    }

    public function boot(): void {}

    public function routes(): void {}
}

class SomeFoundation extends LayeringFixture
{
    public function key(): string
    {
        return 'some-foundation';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function requires(): array
    {
        return [];
    }
}

class SomeVertical extends LayeringFixture
{
    public function key(): string
    {
        return 'some-vertical';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function requires(): array
    {
        return [];
    }
}

class FoundationReachingUpward extends LayeringFixture
{
    public function key(): string
    {
        return 'bad-foundation';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function requires(): array
    {
        return ['some-vertical'];
    }
}

class ContentReachingUpward extends LayeringFixture
{
    public function key(): string
    {
        return 'bad-content';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Content;
    }

    public function requires(): array
    {
        return ['some-foundation'];
    }
}

class TypoDependency extends LayeringFixture
{
    public function key(): string
    {
        return 'typo';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function requires(): array
    {
        return ['fleets'];
    }
}

class VerticalReachingDownward extends LayeringFixture
{
    public function key(): string
    {
        return 'good-vertical';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function requires(): array
    {
        return ['some-foundation', 'media'];
    }
}

class VerticalOnVertical extends LayeringFixture
{
    public function key(): string
    {
        return 'another-vertical';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function requires(): array
    {
        return ['some-vertical'];
    }
}
