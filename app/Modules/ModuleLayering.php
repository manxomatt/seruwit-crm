<?php

namespace App\Modules;

use App\Models\Permission;

/**
 * Checks the dependency graph against the tier layering rule.
 *
 * The rule: dependencies only ever flow toward lower tiers. Content is the base,
 * Foundation builds on it, and Verticals build on both — so a Vertical may
 * require a Foundation module, but a Foundation module reaching for a Vertical
 * would weld one line of business into the shared base that every other line is
 * supposed to reuse. That is the layer-level statement of the rule this codebase
 * already keeps: a module never knows its consumer.
 *
 * Same-tier dependencies are fine (Orders on Transportation, Document on Fleet);
 * only reaching *upward* is a violation.
 *
 * This is a design invariant, not a runtime concern — nothing in a request asks
 * it. It is checked by ModuleLayeringTest so a violation surfaces in CI, at the
 * moment a module is added, rather than as a puzzling coupling months later.
 */
class ModuleLayering
{
    public function __construct(private readonly ModuleRegistry $registry) {}

    /**
     * Every way the current module graph breaks the rule, as readable sentences.
     * An empty list means the graph is sound.
     *
     * @return list<string>
     */
    public function violations(): array
    {
        $violations = [];

        foreach ($this->registry->all() as $key => $module) {
            foreach ($module->requires() as $dependency) {
                $violation = $this->inspect($key, $module, $dependency);

                if ($violation !== null) {
                    $violations[] = $violation;
                }
            }
        }

        return $violations;
    }

    /**
     * What, if anything, is wrong with $module depending on $dependency.
     */
    private function inspect(string $key, ModuleContract $module, string $dependency): ?string
    {
        // Core features ship with every tenant and sit below every tier, so they
        // are always a legal dependency.
        if (array_key_exists($dependency, Permission::MODULES)) {
            return null;
        }

        $required = $this->registry->find($dependency);

        // ModuleInstaller treats an unregistered dependency as a core feature and
        // skips it, so a typo here would install a module without the thing it
        // needs and only fail much later, on a missing table.
        if ($required === null) {
            return "Module [{$key}] requires [{$dependency}], which is neither a registered module nor a core feature.";
        }

        if ($required->tier()->order() > $module->tier()->order()) {
            return sprintf(
                'Module [%s] (%s) requires [%s] (%s) — dependencies must flow toward lower tiers, never up.',
                $key,
                $module->tier()->value,
                $dependency,
                $required->tier()->value,
            );
        }

        return null;
    }
}
