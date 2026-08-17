<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Pages\Models\PageComponent;

class PageComponentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $components = [
            [
                'key' => 'navbar-section',
                'label' => 'Navbar GPSTrack',
                'category' => 'Sections',
                'sort_order' => 1,
                'content' => <<<'HTML'
<header class="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-20">
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-4xl font-bold">explore</span>
                <span class="text-2xl font-black tracking-tight text-slate-900 font-display">GPSTrack</span>
            </div>
            
            <nav class="hidden md:flex space-x-10">
                <a class="text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="#features">Features</a>
                <a class="text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="#pricing">Pricing</a>
                <a class="text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="#">Resources</a>
            </nav>
            
            <div class="flex items-center gap-4 sm:gap-6">
                <a class="hidden sm:block text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="#">Login</a>
                <button class="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm sm:text-base hover:scale-105 transition-all vibrant-glow whitespace-nowrap">
                    Join Today
                </button>
            </div>
        </div>
    </div>
</header>
HTML,
            ],
            [
                'key' => 'navbar-modern-gray',
                'label' => 'Navbar Modern Gray',
                'category' => 'Sections',
                'sort_order' => 2,
                'content' => <<<'HTML'
<header class="fixed top-0 left-0 right-0 z-50 w-full bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 shadow-sm" style="position: fixed; top: 0; left: 0; right: 0; z-index: 50;">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16 lg:h-20">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-lg" style="width: 40px; height: 40px; background: linear-gradient(to bottom right, #374151, #111827); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-6 h-6 text-white" style="width: 24px; height: 24px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                </div>
                <span class="text-xl lg:text-2xl font-bold" style="font-size: 1.5rem; font-weight: 700; background: linear-gradient(to right, #1f2937, #4b5563); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">BrandName</span>
            </div>
            
            <nav class="hidden lg:flex items-center gap-1" style="display: flex; align-items: center; gap: 4px;">
                <a class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all duration-200" style="padding: 8px 16px; font-size: 14px; font-weight: 500; color: #374151; border-radius: 8px; text-decoration: none;" href="#home">Home</a>
                <a class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all duration-200" style="padding: 8px 16px; font-size: 14px; font-weight: 500; color: #374151; border-radius: 8px; text-decoration: none;" href="#features">Features</a>
                <a class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all duration-200" style="padding: 8px 16px; font-size: 14px; font-weight: 500; color: #374151; border-radius: 8px; text-decoration: none;" href="#pricing">Pricing</a>
                <a class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all duration-200" style="padding: 8px 16px; font-size: 14px; font-weight: 500; color: #374151; border-radius: 8px; text-decoration: none;" href="#about">About</a>
            </nav>
            
            <div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 12px;">
                <a class="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors" style="padding: 8px 16px; font-size: 14px; font-weight: 500; color: #374151; text-decoration: none;" href="#login">Sign In</a>
                <a class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-800 to-gray-700 text-white text-sm font-semibold rounded-xl shadow-lg transition-all duration-300" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: linear-gradient(to right, #1f2937, #374151); color: white; font-size: 14px; font-weight: 600; border-radius: 12px; text-decoration: none;" href="#signup">
                    Get Started
                </a>
            </div>
        </div>
    </div>
</header>
<div style="height: 80px;"></div>
HTML,
            ],
            [
                'key' => 'hero-section',
                'label' => 'Hero Section Joy',
                'category' => 'Sections',
                'sort_order' => 3,
                'content' => <<<'HTML'
<section class="relative pt-16 pb-24 lg:pt-32 lg:pb-40 overflow-hidden bg-gradient-to-b from-green-50/50 to-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div class="z-10">
                <div class="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold bg-orange-500/10 text-orange-500 ring-1 ring-inset ring-orange-500/20 mb-8">
                    ✨ New: Tracking Joy V3 is Live!
                </div>
                <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[1.1] font-display">
                    Track with Joy, <span class="text-green-500">Live with Peace</span>
                </h1>
                <p class="text-xl text-slate-600 mb-10 max-w-xl leading-relaxed">
                    Keep what you love close. Experience real-time freedom with the world's most vibrant and reliable GPS tracking community.
                </p>
                <div class="flex flex-col sm:flex-row gap-5">
                    <button class="bg-orange-500 text-white px-10 py-5 rounded-full font-extrabold text-xl hover:scale-105 transition-all">
                        Unlock Your Freedom
                    </button>
                </div>
            </div>
            <div class="relative lg:h-[600px] flex items-center justify-center">
                <img src="https://picsum.photos/seed/map/800/800" class="rounded-3xl shadow-2xl rotate-2 border-8 border-white" alt="Map" />
            </div>
        </div>
    </div>
</section>
HTML,
            ],
            [
                'key' => 'hero-gps-tracking-indonesia',
                'label' => 'Hero GPS Tracking ID',
                'category' => 'Sections',
                'sort_order' => 4,
                'content' => <<<'HTML'
<section style="position: relative; min-height: 100vh; overflow: hidden; background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);">
    <div style="position: relative; max-width: 80rem; margin: 0 auto; padding: 80px 24px 60px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;">
            <div style="text-align: left; position: relative; z-index: 10;">
                <div style="display: inline-flex; align-items: center; gap: 8px; border-radius: 9999px; padding: 6px 14px; font-size: 13px; font-weight: 600; background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); margin-bottom: 24px;">
                    🇮🇩 Solusi GPS Tracking #1 di Indonesia
                </div>
                <h1 style="font-size: 3.5rem; font-weight: 800; letter-spacing: -0.025em; color: white; margin-bottom: 20px; line-height: 1.15;">
                    Pantau Aset Anda
                    <span style="display: block; background: linear-gradient(to right, #60a5fa, #22d3ee, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                        Kapan Saja, Dimana Saja
                    </span>
                </h1>
                <p style="font-size: 1.125rem; color: #94a3b8; margin-bottom: 32px; max-width: 520px; line-height: 1.7;">
                    Lindungi kendaraan, armada, dan aset berharga Anda dengan teknologi GPS tracking real-time terdepan.
                </p>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <a href="#" style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; text-decoration: none;">
                        Mulai Tracking
                    </a>
                </div>
            </div>
        </div>
    </div>
</section>
HTML,
            ],
            [
                'key' => 'feature-cards',
                'label' => 'Feature Cards Grid',
                'category' => 'Sections',
                'sort_order' => 5,
                'content' => <<<'HTML'
<section class="py-16 bg-gray-50">
    <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Our Features</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-xl font-semibold mb-2">Fast Performance</h3>
                <p class="text-gray-600">Lightning-fast loading times for the best user experience.</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-xl font-semibold mb-2">Easy to Use</h3>
                <p class="text-gray-600">Intuitive drag-and-drop interface for everyone.</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-xl font-semibold mb-2">Responsive Design</h3>
                <p class="text-gray-600">Looks great on all devices and screen sizes.</p>
            </div>
        </div>
    </div>
</section>
HTML,
            ],
            [
                'key' => 'cta-section',
                'label' => 'CTA Banner',
                'category' => 'Sections',
                'sort_order' => 6,
                'content' => <<<'HTML'
<section class="bg-blue-600 py-16">
    <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
        <p class="text-blue-100 mb-8 max-w-xl mx-auto">Join thousands of satisfied customers who have transformed their online presence.</p>
        <a href="#" class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-block">Start Free Trial</a>
    </div>
</section>
HTML,
            ],
            [
                'key' => 'footer-dynamic',
                'label' => 'Footer Dynamic',
                'category' => 'Sections',
                'sort_order' => 7,
                'content' => <<<'HTML'
<footer style="background: #0f172a; color: #94a3b8; padding: 48px 0 24px; border-top: 1px solid #1e293b;">
    <div style="max-width: 80rem; margin: 0 auto; padding: 0 24px; text-align: center;">
        <p style="font-size: 14px; color: #64748b; margin: 0;">
            © GPSTrack. All rights reserved.
        </p>
    </div>
</footer>
HTML,
            ],
        ];

        foreach ($components as $data) {
            PageComponent::query()->updateOrCreate(
                ['key' => $data['key']],
                $data
            );
        }
    }
}
