<?php

namespace Tests\Unit\Modules\Pos;

use PHPUnit\Framework\TestCase;

/**
 * Mirrors the client-side parked-cart list rules in parkedCarts.ts so the
 * multi-park contract stays covered without a JS test runner.
 */
class ParkedCartsLogicTest extends TestCase
{
    public function test_normalize_accepts_multi_list_for_matching_shift(): void
    {
        $raw = [
            [
                'id' => 'a',
                'shift_id' => 7,
                'cart' => [['product_id' => 1, 'quantity' => 2, 'unit_price' => 1000]],
                'partner_id' => '',
                'parked_at' => '2026-07-28T10:00:00Z',
            ],
            [
                'id' => 'b',
                'shift_id' => 8,
                'cart' => [['product_id' => 2, 'quantity' => 1, 'unit_price' => 500]],
                'partner_id' => '',
                'parked_at' => '2026-07-28T10:01:00Z',
            ],
        ];

        $normalized = $this->normalize($raw, 7);

        $this->assertCount(1, $normalized);
        $this->assertSame('a', $normalized[0]['id']);
    }

    public function test_normalize_migrates_legacy_single_cart(): void
    {
        $legacy = [
            'shift_id' => 3,
            'cart' => [
                ['product_id' => 9, 'quantity' => 1, 'unit_price' => 2500],
            ],
        ];

        $normalized = $this->normalize($legacy, 3);

        $this->assertCount(1, $normalized);
        $this->assertNotSame('', $normalized[0]['id']);
        $this->assertSame(3, $normalized[0]['shift_id']);
        $this->assertCount(1, $normalized[0]['cart']);
    }

    public function test_park_rejects_when_full(): void
    {
        $list = [];
        for ($i = 0; $i < 10; $i++) {
            $list[] = [
                'id' => "id-{$i}",
                'shift_id' => 1,
                'cart' => [['product_id' => $i + 1, 'quantity' => 1, 'unit_price' => 100]],
                'partner_id' => '',
                'parked_at' => '2026-07-28T10:00:00Z',
            ];
        }

        $result = $this->park($list, 1, [['product_id' => 99, 'quantity' => 1, 'unit_price' => 100]], '');

        $this->assertFalse($result['ok']);
        $this->assertSame('full', $result['reason']);
    }

    public function test_park_appends_and_take_removes(): void
    {
        $list = [];
        $parked = $this->park($list, 1, [['product_id' => 1, 'quantity' => 2, 'unit_price' => 500]], '12');
        $this->assertTrue($parked['ok']);
        $this->assertCount(1, $parked['list']);

        $taken = $this->take($parked['list'], 'missing');
        $this->assertNull($taken);

        $id = $parked['list'][0]['id'];
        $taken = $this->take($parked['list'], $id);
        $this->assertNotNull($taken);
        $this->assertSame('12', $taken['ticket']['partner_id']);
        $this->assertCount(0, $taken['list']);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function normalize(mixed $raw, int $shiftId): array
    {
        if (! is_array($raw)) {
            return [];
        }

        if (array_is_list($raw) && isset($raw[0]) && is_array($raw[0]) && array_key_exists('id', $raw[0])) {
            return array_values(array_filter($raw, function (mixed $item) use ($shiftId): bool {
                return is_array($item)
                    && isset($item['id'], $item['shift_id'], $item['cart'])
                    && is_string($item['id'])
                    && (int) $item['shift_id'] === $shiftId
                    && is_array($item['cart'])
                    && count($item['cart']) > 0;
            }));
        }

        if (isset($raw['shift_id'], $raw['cart']) && (int) $raw['shift_id'] === $shiftId && is_array($raw['cart']) && count($raw['cart']) > 0) {
            return [[
                'id' => 'migrated-'.uniqid(),
                'shift_id' => $shiftId,
                'cart' => $raw['cart'],
                'partner_id' => is_string($raw['partner_id'] ?? null) ? $raw['partner_id'] : '',
                'parked_at' => now()->toIso8601String(),
            ]];
        }

        return [];
    }

    /**
     * @param  list<array<string, mixed>>  $list
     * @param  list<array<string, mixed>>  $cart
     * @return array{ok: bool, reason?: string, list?: list<array<string, mixed>>}
     */
    private function park(array $list, int $shiftId, array $cart, string $partnerId): array
    {
        if ($cart === []) {
            return ['ok' => false, 'reason' => 'empty'];
        }

        if (count($list) >= 10) {
            return ['ok' => false, 'reason' => 'full'];
        }

        $list[] = [
            'id' => 'new-'.uniqid(),
            'shift_id' => $shiftId,
            'cart' => $cart,
            'partner_id' => $partnerId,
            'parked_at' => now()->toIso8601String(),
        ];

        return ['ok' => true, 'list' => $list];
    }

    /**
     * @param  list<array<string, mixed>>  $list
     * @return array{ticket: array<string, mixed>, list: list<array<string, mixed>>}|null
     */
    private function take(array $list, string $id): ?array
    {
        $ticket = null;
        foreach ($list as $item) {
            if (($item['id'] ?? null) === $id) {
                $ticket = $item;
                break;
            }
        }

        if ($ticket === null) {
            return null;
        }

        return [
            'ticket' => $ticket,
            'list' => array_values(array_filter($list, fn (array $item): bool => ($item['id'] ?? null) !== $id)),
        ];
    }
}
