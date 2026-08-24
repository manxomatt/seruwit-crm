import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import grapesjs, { Editor as GrapesEditor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import gjsPresetWebpage from 'grapesjs-preset-webpage';

interface Page {
    id: number;
    title: string;
    slug: string;
    html: string | null;
    css: string | null;
    gjs_data: Record<string, unknown> | null;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

interface CustomBlock {
    key: string;
    label: string;
    category?: string;
    content: string;
    media?: string | null;
    attributes?: Record<string, unknown> | null;
}

interface Props {
    page: Page;
    customBlocks?: CustomBlock[];
}

export default function Editor({ page, customBlocks = [] }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const editorRef = useRef<HTMLDivElement>(null);
    const [editor, setEditor] = useState<GrapesEditor | null>(null); 
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const saveContent = useCallback(async () => {
        if (!editor) return;

        setIsSaving(true);
        try {
            const html = editor.getHtml();
            const css = editor.getCss();
            const gjsData = editor.getProjectData();

            await fetch(prefixedRoute('pages.save-content', page.id), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    html,
                    css,
                    gjs_data: gjsData,
                }),
            });

            setLastSaved(new Date());
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsSaving(false);
        }
    }, [editor, page.id]);

    useEffect(() => {
        if (!editorRef.current) return;

        const gjsEditor = grapesjs.init({
            container: editorRef.current,
            height: '100%',
            width: 'auto',
            storageManager: false,
            plugins: [gjsBlocksBasic, gjsPresetWebpage],
            pluginsOpts: {
                [gjsBlocksBasic as unknown as string]: {
                    blocks: ['column1', 'column2', 'column3', 'column3-7', 'text', 'link', 'image', 'video', 'map'],
                    flexGrid: true,
                },
                [gjsPresetWebpage as unknown as string]: {
                    blocksBasicOpts: true,
                    navbarOpts: true,
                    countdownOpts: true,
                    formsOpts: true,
                },
            },
            canvas: {
                styles: [
                    'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
                ],
                scripts: [],
                frameStyle: `
                    html, body {
                        background-color: #fff;
                        margin: 0;
                        padding: 0;
                        min-height: 100%;
                        height: auto !important;
                    }
                    * { box-sizing: border-box; }
                    body > * { margin: 0; }
                `,
            },
            deviceManager: {
                devices: [
                    { name: 'Desktop', width: '' },
                    { name: 'Tablet', width: '768px', widthMedia: '992px' },
                    { name: 'Mobile', width: '320px', widthMedia: '480px' },
                ],
            },
            panels: {
                defaults: [
                    {
                        id: 'panel-devices',
                        el: '.panel__devices',
                        buttons: [
                            { id: 'device-desktop', label: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M21,16H3V4H21M21,2H3C1.89,2 1,2.89 1,4V16A2,2 0 0,0 3,18H10V20H8V22H16V20H14V18H21A2,2 0 0,0 23,16V4C23,2.89 22.1,2 21,2Z"/></svg>', command: 'set-device-desktop', active: true, togglable: false },
                            { id: 'device-tablet', label: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19,18H5V6H19M21,4H3C1.89,4 1,4.89 1,6V18A2,2 0 0,0 3,20H21A2,2 0 0,0 23,18V6C23,4.89 22.1,4 21,4Z"/></svg>', command: 'set-device-tablet', togglable: false },
                            { id: 'device-mobile', label: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z"/></svg>', command: 'set-device-mobile', togglable: false },
                        ],
                    },
                ],
            },
        });

        // Add device commands
        gjsEditor.Commands.add('set-device-desktop', {
            run: (editor) => editor.setDevice('Desktop'),
        });
        gjsEditor.Commands.add('set-device-tablet', {
            run: (editor) => editor.setDevice('Tablet'),
        });
        gjsEditor.Commands.add('set-device-mobile', {
            run: (editor) => editor.setDevice('Mobile'),
        });

        // Load existing content: check if gjs_data actually has components, otherwise fallback to HTML/CSS
        const gjsPages = (page.gjs_data as any)?.pages;
        const hasGjsComponents = Array.isArray(gjsPages) &&
            gjsPages.length > 0 &&
            gjsPages[0]?.frames?.[0]?.component?.components?.length > 0;

        if (hasGjsComponents) {
            gjsEditor.loadProjectData(page.gjs_data!);
        } else if (page.html) {
            gjsEditor.setComponents(page.html);
            if (page.css) {
                gjsEditor.setStyle(page.css);
            }
        }

        // Add custom blocks dynamically from database
        const blockManager = gjsEditor.BlockManager;

        if (customBlocks && customBlocks.length > 0) {
            customBlocks.forEach((block) => {
                blockManager.add(block.key, {
                    label: block.label,
                    category: block.category || 'Sections',
                    content: block.content,
                    media: block.media || undefined,
                    attributes: (block.attributes as Record<string, unknown>) || {},
                });
            });
        }

        // Add custom component type for Carousel
        gjsEditor.DomComponents.addType('carousel-component', {
            isComponent: (el: HTMLElement) => el.tagName === 'DIV' && el.classList.contains('carousel-wrapper'),
            model: {
                defaults: {
                    tagName: 'div',
                    droppable: false,
                    attributes: { class: 'carousel-wrapper' },
                    traits: [
                        {
                            type: 'text',
                            name: 'slug',
                            label: 'Carousel Slug',
                            placeholder: 'Enter carousel slug',
                        },
                    ],
                },
                init() {
                    this.on('change:attributes:slug', this.updateCarouselSlug);
                },
                updateCarouselSlug() {
                    const slug = this.getAttributes().slug || 'test-carousel';
                    const content = `<Carousel slug="${slug}" />`;
                    this.components(content);
                },
            },
            view: {
                onRender() {
                    const slug = this.model.getAttributes().slug || 'test-carousel';
                    this.el.innerHTML = `
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 40px; text-align: center; color: white; min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                            <svg style="width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.9;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Carousel Component</div>
                            <div style="font-size: 14px; opacity: 0.8; font-family: monospace; background: rgba(0,0,0,0.2); padding: 8px 16px; border-radius: 6px;">
                                &lt;Carousel slug="${slug}" /&gt;
                            </div>
                            <div style="font-size: 12px; margin-top: 12px; opacity: 0.7;">
                                This carousel will be rendered dynamically on the frontend
                            </div>
                        </div>
                    `;
                },
            },
        });

        // Rental Bridge Block: featured fleet. Stores only a <rental-fleet>
        // marker; the live grid is rendered server-side (see render.blade.php),
        // mirroring the Carousel block above.
        gjsEditor.DomComponents.addType('rental-fleet-component', {
            isComponent: (el: HTMLElement) => el.tagName === 'DIV' && el.classList.contains('rental-fleet-block'),
            model: {
                defaults: {
                    tagName: 'div',
                    droppable: false,
                    attributes: { class: 'rental-fleet-block', limit: '6', fleetclass: '' },
                    traits: [
                        {
                            type: 'number',
                            name: 'limit',
                            label: 'Jumlah kartu',
                            min: 1,
                            max: 12,
                        },
                        {
                            type: 'select',
                            name: 'fleetclass',
                            label: 'Kelas kendaraan',
                            options: [
                                { id: '', name: 'Semua kelas' },
                                { id: 'economy', name: 'Economy' },
                                { id: 'mpv', name: 'MPV' },
                                { id: 'suv', name: 'SUV' },
                                { id: 'van', name: 'Van' },
                                { id: 'premium', name: 'Premium' },
                                { id: 'truck', name: 'Truck' },
                                { id: 'other', name: 'Lainnya' },
                            ],
                        },
                    ],
                },
                init() {
                    this.on('change:attributes:limit change:attributes:fleetclass', this.updateFleetMarker);
                    this.updateFleetMarker();
                },
                updateFleetMarker() {
                    const attrs = this.getAttributes();
                    const limit = attrs.limit || '6';
                    const fleetClass = attrs.fleetclass || '';
                    const classAttr = fleetClass ? ` data-fleet-class="${fleetClass}"` : '';
                    this.components(`<rental-fleet type="featured" limit="${limit}"${classAttr}></rental-fleet>`);
                },
            },
            view: {
                onRender() {
                    const attrs = this.model.getAttributes();
                    const limit = attrs.limit || '6';
                    const fleetClass = attrs.fleetclass || '';
                    const scope = fleetClass ? `kelas ${fleetClass.toUpperCase()}` : 'semua kelas';
                    this.el.innerHTML = `
                        <div style="border: 2px dashed #99f6e4; background: #f0fdfa; border-radius: 12px; padding: 32px; text-align: center; color: #0f766e;">
                            <div style="font-size: 15px; font-weight: 700; margin-bottom: 6px;">🚗 Armada Rental (${scope})</div>
                            <div style="font-size: 12px; opacity: 0.75;">Menampilkan ${limit} kendaraan siap sewa · dirender otomatis di halaman publik</div>
                        </div>
                    `;
                },
            },
        });

        // Rental Bridge Block: curated testimonials. Stores a <rental-reviews>
        // marker; rendered server-side from the tenant's saved testimonials.
        gjsEditor.DomComponents.addType('rental-reviews-component', {
            isComponent: (el: HTMLElement) => el.tagName === 'DIV' && el.classList.contains('rental-reviews-block'),
            model: {
                defaults: {
                    tagName: 'div',
                    droppable: false,
                    attributes: { class: 'rental-reviews-block', limit: '6' },
                    traits: [
                        { type: 'number', name: 'limit', label: 'Jumlah ulasan', min: 1, max: 12 },
                    ],
                },
                init() {
                    this.on('change:attributes:limit', this.updateReviewsMarker);
                    this.updateReviewsMarker();
                },
                updateReviewsMarker() {
                    const limit = this.getAttributes().limit || '6';
                    this.components(`<rental-reviews limit="${limit}"></rental-reviews>`);
                },
            },
            view: {
                onRender() {
                    const limit = this.model.getAttributes().limit || '6';
                    this.el.innerHTML = `
                        <div style="border: 2px dashed #fcd34d; background: #fffbeb; border-radius: 12px; padding: 32px; text-align: center; color: #b45309;">
                            <div style="font-size: 15px; font-weight: 700; margin-bottom: 6px;">★ Ulasan Pelanggan (Rental)</div>
                            <div style="font-size: 12px; opacity: 0.75;">Menampilkan hingga ${limit} testimoni · dikelola di Rental → Settings → Testimoni</div>
                        </div>
                    `;
                },
            },
        });

        const rentalBlockManager = gjsEditor.BlockManager;
        rentalBlockManager.add('rental-landing-template', {
            label: 'Rental: Landing Lengkap',
            category: 'Rental',
            content: `<div class="rental-landing">
    <section style="background: linear-gradient(160deg, var(--brand-primary, #0f766e), var(--brand-secondary, #0f172a)); color: #ffffff; padding: 64px 16px;">
        <div style="max-width: 960px; margin: 0 auto; text-align: center;">
            <span style="display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.85;">Sewa Kendaraan Terpercaya</span>
            <h1 style="margin: 12px 0 10px; font-size: 40px; line-height: 1.1; font-weight: 800; letter-spacing: -0.02em;">Perjalanan Nyaman Dimulai Dari Sini</h1>
            <p style="margin: 0 auto 28px; max-width: 560px; font-size: 16px; line-height: 1.6; opacity: 0.9;">Armada terawat, harga transparan, dan booking online cepat dengan verifikasi WhatsApp.</p>
            <form action="/book/rental" method="GET" style="max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 16px; display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: end; text-align: left;">
                <label style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 700; color: #475569;">Tanggal Mulai
                    <input type="date" name="start_date" style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; font-size: 14px;" />
                </label>
                <label style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 700; color: #475569;">Tanggal Selesai
                    <input type="date" name="end_date" style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; font-size: 14px;" />
                </label>
                <button type="submit" style="background: var(--brand-primary, #0f766e); color: #ffffff; border: none; border-radius: 10px; padding: 12px 22px; font-size: 14px; font-weight: 700; cursor: pointer;">Cari Kendaraan</button>
            </form>
        </div>
    </section>
    <div class="rental-fleet-block" limit="6"><rental-fleet type="featured" limit="6"></rental-fleet></div>
    <div class="rental-reviews-block" limit="6"><rental-reviews limit="6"></rental-reviews></div>
    <section style="background: var(--brand-secondary, #0f172a); color: #ffffff; padding: 48px 16px; text-align: center;">
        <h2 style="margin: 0 0 10px; font-size: 26px; font-weight: 800;">Siap Berangkat?</h2>
        <p style="margin: 0 0 20px; opacity: 0.85;">Pesan kendaraan Anda sekarang, prosesnya hanya beberapa menit.</p>
        <a href="/book/rental" style="display: inline-block; background: var(--brand-primary, #0f766e); color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none;">Mulai Pesan</a>
    </section>
</div>`,
        });
        rentalBlockManager.add('rental-featured-fleet', {
            label: 'Rental: Armada Unggulan',
            category: 'Rental',
            content: '<div class="rental-fleet-block" limit="6"><rental-fleet type="featured" limit="6"></rental-fleet></div>',
        });
        rentalBlockManager.add('rental-fleet-by-class', {
            label: 'Rental: Armada per Kelas',
            category: 'Rental',
            content: '<div class="rental-fleet-block" limit="6" fleetclass="suv"><rental-fleet type="featured" limit="6" data-fleet-class="suv"></rental-fleet></div>',
        });
        rentalBlockManager.add('rental-reviews', {
            label: 'Rental: Ulasan Pelanggan',
            category: 'Rental',
            content: '<div class="rental-reviews-block" limit="6"><rental-reviews limit="6"></rental-reviews></div>',
        });
        rentalBlockManager.add('rental-search-widget', {
            label: 'Rental: Cari Kendaraan',
            category: 'Rental',
            content: `<form action="/book/rental" method="GET" style="max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: end;">
    <label style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 700; color: #475569;">Tanggal Mulai
        <input type="date" name="start_date" style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; font-size: 14px;" />
    </label>
    <label style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 700; color: #475569;">Tanggal Selesai
        <input type="date" name="end_date" style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; font-size: 14px;" />
    </label>
    <button type="submit" style="background: var(--brand-primary, #0f766e); color: #ffffff; border: none; border-radius: 10px; padding: 12px 22px; font-size: 14px; font-weight: 700; cursor: pointer;">Cari Kendaraan</button>
</form>`,
        });

        setEditor(gjsEditor);

        return () => {
            gjsEditor.destroy();
        };
    }, [page]);

    // Auto-save every 30 seconds
    useEffect(() => {
        if (!editor) return;

        const interval = setInterval(() => {
            saveContent();
        }, 30000);

        return () => clearInterval(interval);
    }, [editor, saveContent]);

    // Keyboard shortcut for save (Ctrl+S / Cmd+S)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveContent();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveContent]);

    const handlePublishToggle = () => {
        router.patch(prefixedRoute('pages.update', page.id), {
            is_published: !page.is_published,
        }, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title={t('pages.editor.title', { title: page.title })} />

            <div className="h-screen flex flex-col bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white">
                {/* Top Toolbar */}
                <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-4 py-2.5 flex flex-wrap items-center justify-between z-20 shadow-md gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={prefixedRoute('pages.index')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition border border-slate-700/60"
                        >
                            ← {t('pages.editor.back')}
                        </Link>
                        <span className="text-slate-700">|</span>
                        <div className="flex items-center gap-2.5">
                            <span className="text-xs font-extrabold text-white">{page.title}</span>
                            <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                                /p/{page.slug}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                    page.is_published
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full ${page.is_published ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                                {page.is_published ? t('pages.status.published') : t('pages.status.draft')}
                            </span>
                        </div>
                    </div>

                    <div className="panel__devices flex items-center gap-2"></div>

                    <div className="flex items-center gap-3">
                        {lastSaved && (
                            <span className="hidden sm:inline text-slate-400 font-mono text-[11px]">
                                ⏱️ {t('pages.editor.last_saved', { time: lastSaved.toLocaleTimeString(localeTag) })}
                            </span>
                        )}

                        <button
                            onClick={saveContent}
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                        >
                            {isSaving ? (
                                <>
                                    <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>{t('pages.editor.saving')}</span>
                                </>
                            ) : (
                                <>
                                    <span>💾</span>
                                    <span>{t('pages.editor.save')}</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handlePublishToggle}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                page.is_published
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                            }`}
                        >
                            {page.is_published ? '⏸️ ' + t('pages.editor.unpublish') : '🚀 ' + t('pages.editor.publish')}
                        </button>

                        <Link
                            href={prefixedRoute('pages.show', page.id)}
                            target="_blank"
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-700 flex items-center gap-1.5"
                        >
                            👁️ {t('pages.editor.preview')}
                        </Link>
                    </div>
                </div>

                {/* Editor Container */}
                <div className="flex-1 overflow-hidden">
                    <div ref={editorRef} className="h-full" />
                </div>
            </div>

            <style>{`
                .gjs-one-bg {
                    background-color: #0f172a;
                }
                .gjs-two-color {
                    color: #94a3b8;
                }
                .gjs-three-bg {
                    background-color: #1e293b;
                }
                .gjs-four-color,
                .gjs-four-color-h:hover {
                    color: #818cf8;
                }
                .gjs-pn-btn {
                    border-radius: 8px;
                    padding: 6px;
                    transition: all 0.15s ease;
                }
                .gjs-pn-btn.gjs-pn-active {
                    background-color: #6366f1;
                    color: white;
                }
                /* Compact Block Manager - Strict 3 Columns */
                .gjs-blocks-c {
                    display: grid !important;
                    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                    gap: 6px !important;
                    padding: 8px !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                }
                .gjs-block {
                    width: 100% !important;
                    min-width: 0 !important;
                    max-width: 100% !important;
                    min-height: 52px !important;
                    padding: 6px 2px !important;
                    margin: 0 !important;
                    float: none !important;
                    border-radius: 10px !important;
                    border: 1px solid #334155 !important;
                    background-color: #1e293b !important;
                    transition: all 0.15s ease !important;
                    box-sizing: border-box !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                    text-align: center !important;
                }
                .gjs-block:hover {
                    border-color: #6366f1 !important;
                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3) !important;
                }
                .gjs-block svg,
                .gjs-block-icon,
                .gjs-block i,
                .gjs-block img {
                    width: 18px !important;
                    height: 18px !important;
                    max-width: 18px !important;
                    max-height: 18px !important;
                    margin: 0 auto 3px auto !important;
                }
                .gjs-block-label {
                    font-size: 9.5px !important;
                    line-height: 1.15 !important;
                    font-weight: 600 !important;
                    color: #cbd5e1 !important;
                    word-break: break-word !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    width: 100% !important;
                }
                .gjs-cv-canvas {
                    background-color: #f8fafc;
                }
            `}</style>
        </>
    );
}

