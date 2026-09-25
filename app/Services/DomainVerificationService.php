<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Domain;
use App\Models\Tenant;

class DomainVerificationService
{
    /**
     * @var (callable(string, int): list<array<string, mixed>>)|null
     */
    private $dnsResolver = null;

    public function __construct(
        private readonly CloudflareCustomHostnameService $cloudflareService
    ) {}

    /**
     * Set a custom DNS resolver (primarily for testing).
     *
     * @param  (callable(string, int): list<array<string, mixed>>)|null  $resolver
     */
    public function setDnsResolver(?callable $resolver): void
    {
        $this->dnsResolver = $resolver;
    }

    /**
     * Verify DNS setup for a custom domain.
     */
    public function verify(Domain $domain): bool
    {
        $domain->last_checked_at = now();

        /** @var Tenant|null $tenant */
        $tenant = Tenant::query()->find($domain->tenant_id);
        if (! $tenant) {
            $domain->last_error = 'Tenant tidak ditemukan.';
            $domain->save();

            return false;
        }

        // Expected CNAME target is the tenant's primary/system subdomain or fallback origin
        $systemDomain = $tenant->domains()->where('is_custom', false)->first()?->domain
            ?? $tenant->domains()->first()?->domain;

        $hostname = strtolower(trim($domain->domain));
        $dnsRecords = $this->queryDns($hostname);

        $isVerified = false;
        $matchedReason = '';

        // 1. Check CNAME record
        if ($systemDomain !== null) {
            $expectedTarget = strtolower(rtrim($systemDomain, '.'));
            foreach ($dnsRecords as $record) {
                if (($record['type'] ?? '') === 'CNAME') {
                    $target = strtolower(rtrim((string) ($record['target'] ?? ''), '.'));
                    if ($target === $expectedTarget) {
                        $isVerified = true;
                        $matchedReason = "CNAME cocok mengarah ke {$systemDomain}";
                        break;
                    }
                }
            }
        }

        // 2. Check TXT record (_seruwit-challenge.{hostname} or {hostname}) if not verified by CNAME
        if (! $isVerified && ! empty($domain->verification_token)) {
            $expectedToken = "seruwit-verification={$domain->verification_token}";
            $txtRecords = array_merge(
                $dnsRecords,
                $this->queryDns("_seruwit-challenge.{$hostname}")
            );

            foreach ($txtRecords as $record) {
                if (($record['type'] ?? '') === 'TXT') {
                    $txtContent = (string) ($record['txt'] ?? '');
                    if (str_contains($txtContent, $expectedToken)) {
                        $isVerified = true;
                        $matchedReason = 'TXT token verifikasi terverifikasi';
                        break;
                    }
                }
            }
        }

        if ($isVerified) {
            $domain->status = Domain::STATUS_VERIFIED;
            $domain->verified_at = now();
            $domain->last_error = null;

            // Register to Cloudflare for SaaS for automated SSL
            if (empty($domain->cloudflare_hostname_id)) {
                $cfResult = $this->cloudflareService->createCustomHostname($domain->domain);
                if ($cfResult) {
                    $domain->cloudflare_hostname_id = $cfResult['id'];
                    $domain->cloudflare_status = $cfResult['status'];
                    $domain->cloudflare_ssl_status = $cfResult['ssl_status'];
                }
            }

            $domain->save();

            return true;
        }

        $domain->status = Domain::STATUS_PENDING_DNS;
        $domain->last_error = "DNS record belum terdeteksi atau belum mengarah ke {$systemDomain}. Propagasi DNS dapat membutuhkan waktu beberapa menit.";
        $domain->save();

        return false;
    }

    /**
     * Query DNS records for a given hostname.
     *
     * @return list<array<string, mixed>>
     */
    private function queryDns(string $hostname): array
    {
        if ($this->dnsResolver !== null) {
            return ($this->dnsResolver)($hostname, DNS_CNAME | DNS_TXT);
        }

        try {
            $records = @dns_get_record($hostname, DNS_CNAME | DNS_TXT);

            return is_array($records) ? $records : [];
        } catch (\Throwable) {
            return [];
        }
    }
}
