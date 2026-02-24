import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState, useCallback } from 'react';
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

interface Props {
    page: Page;
}

export default function Editor({ page }: Props): JSX.Element {
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

            await fetch(route('admin.pages.save-content', page.id), {
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

        // Load existing content
        if (page.gjs_data) {
            gjsEditor.loadProjectData(page.gjs_data);
        } else if (page.html) {
            gjsEditor.setComponents(page.html);
            if (page.css) {
                gjsEditor.setStyle(page.css);
            }
        }

        // Add custom blocks
        const blockManager = gjsEditor.BlockManager;

        blockManager.add('navbar-section', {
            label: 'Navbar',
            category: 'Sections',
            content: `
                <nav class="bg-white shadow-lg sticky top-0 z-50">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between h-16">
                            <div class="flex items-center">
                                <a href="#" class="flex-shrink-0 flex items-center">
                                    <span class="text-2xl font-bold text-blue-600">Logo</span>
                                </a>
                                <div class="hidden md:ml-10 md:flex md:space-x-8">
                                    <a href="#" class="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition">Home</a>
                                    <a href="#" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition">Features</a>
                                    <a href="#" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition">Pricing</a>
                                    <a href="#" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition">About</a>
                                    <a href="#" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition">Contact</a>
                                </div>
                            </div>
                            <div class="hidden md:flex md:items-center md:space-x-4">
                                <a href="#" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition">Sign In</a>
                                <a href="#" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">Get Started</a>
                            </div>
                            <div class="flex items-center md:hidden">
                                <button class="text-gray-500 hover:text-gray-700 p-2">
                                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>
            `,
        });
        
        blockManager.add('hero-section', {
            label: 'Hero Section',
            category: 'Sections',
            content: `
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
                        <button class="border-2 border-slate-200 bg-white text-slate-700 px-10 py-5 rounded-full font-extrabold text-xl hover:bg-slate-50 transition-all">
                          See the Magic
                        </button>
                      </div>
                    </div>
                    <div class="relative lg:h-[600px] flex items-center justify-center">
                      <img src="https://picsum.photos/seed/map/800/800" class="rounded-3xl shadow-2xl rotate-2 border-8 border-white" alt="Map" />
                    </div>
                  </div>
                </div>
              </section>
            `,
        });

        blockManager.add('feature-cards', {
            label: 'Feature Cards',
            category: 'Sections',
            content: `
                <section class="py-16 bg-gray-50">
                    <div class="container mx-auto px-4">
                        <h2 class="text-3xl font-bold text-center mb-12">Our Features</h2>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div class="bg-white p-6 rounded-lg shadow-md">
                                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                    </svg>
                                </div>
                                <h3 class="text-xl font-semibold mb-2">Fast Performance</h3>
                                <p class="text-gray-600">Lightning-fast loading times for the best user experience.</p>
                            </div>
                            <div class="bg-white p-6 rounded-lg shadow-md">
                                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <h3 class="text-xl font-semibold mb-2">Easy to Use</h3>
                                <p class="text-gray-600">Intuitive drag-and-drop interface for everyone.</p>
                            </div>
                            <div class="bg-white p-6 rounded-lg shadow-md">
                                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                    <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                                    </svg>
                                </div>
                                <h3 class="text-xl font-semibold mb-2">Responsive Design</h3>
                                <p class="text-gray-600">Looks great on all devices and screen sizes.</p>
                            </div>
                        </div>
                    </div>
                </section>
            `,
        });

        blockManager.add('cta-section', {
            label: 'CTA Section',
            category: 'Sections',
            content: `
                <section class="bg-blue-600 py-16">
                    <div class="container mx-auto px-4 text-center">
                        <h2 class="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
                        <p class="text-blue-100 mb-8 max-w-xl mx-auto">Join thousands of satisfied customers who have transformed their online presence.</p>
                        <a href="#" class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-block">Start Free Trial</a>
                    </div>
                </section>
            `,
        });

        blockManager.add('footer', {
            label: 'Footer',
            category: 'Sections',
            content: `
                <footer class="bg-gray-900 text-gray-300 py-12">
                    <div class="container mx-auto px-4">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div>
                                <h3 class="text-white font-bold text-lg mb-4">Company</h3>
                                <ul class="space-y-2">
                                    <li><a href="#" class="hover:text-white transition">About Us</a></li>
                                    <li><a href="#" class="hover:text-white transition">Careers</a></li>
                                    <li><a href="#" class="hover:text-white transition">Contact</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 class="text-white font-bold text-lg mb-4">Products</h3>
                                <ul class="space-y-2">
                                    <li><a href="#" class="hover:text-white transition">Features</a></li>
                                    <li><a href="#" class="hover:text-white transition">Pricing</a></li>
                                    <li><a href="#" class="hover:text-white transition">Templates</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 class="text-white font-bold text-lg mb-4">Resources</h3>
                                <ul class="space-y-2">
                                    <li><a href="#" class="hover:text-white transition">Documentation</a></li>
                                    <li><a href="#" class="hover:text-white transition">Blog</a></li>
                                    <li><a href="#" class="hover:text-white transition">Support</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 class="text-white font-bold text-lg mb-4">Legal</h3>
                                <ul class="space-y-2">
                                    <li><a href="#" class="hover:text-white transition">Privacy Policy</a></li>
                                    <li><a href="#" class="hover:text-white transition">Terms of Service</a></li>
                                </ul>
                            </div>
                        </div>
                        <div class="border-t border-gray-800 mt-8 pt-8 text-center">
                            <p>&copy; 2024 Your Company. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            `,
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
        router.patch(route('admin.pages.update', page.id), {
            is_published: !page.is_published,
        }, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title={`Edit: ${page.title}`} />

            <div className="h-screen flex flex-col">
                {/* Top Toolbar */}
                <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white px-4 py-2 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('admin.pages.index')}
                            className="text-indigo-200 hover:text-white transition flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Pages
                        </Link>
                        <span className="text-indigo-400">|</span>
                        <span className="font-medium">{page.title}</span>
                    </div>

                    <div className="panel__devices flex items-center gap-2"></div>

                    <div className="flex items-center gap-4">
                        {lastSaved && (
                            <span className="text-indigo-200 text-sm">
                                Last saved: {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={saveContent}
                            disabled={isSaving}
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50 border border-white/20"
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={handlePublishToggle}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                                page.is_published
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                        >
                            {page.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                        <Link
                            href={route('admin.pages.show', page.id)}
                            target="_blank"
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-lg text-sm font-medium transition border border-white/20"
                        >
                            Preview
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
                    background-color: #1f2937;
                }
                .gjs-two-color {
                    color: #9ca3af;
                }
                .gjs-three-bg {
                    background-color: #374151;
                }
                .gjs-four-color,
                .gjs-four-color-h:hover {
                    color: #818cf8;
                }
                .gjs-pn-btn {
                    border-radius: 6px;
                }
                .gjs-pn-btn.gjs-pn-active {
                    background-color: #6366f1;
                    color: white;
                }
                .gjs-block {
                    border-radius: 6px;
                    padding: 10px;
                }
                .gjs-block:hover {
                    box-shadow: 0 0 0 2px #6366f1;
                }
                .gjs-cv-canvas {
                    background-color: #e5e7eb;
                }
            `}</style>
        </>
    );
}
