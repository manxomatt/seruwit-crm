import React from 'react';
import { Head, Link } from '@inertiajs/react';

interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    featured_image: string | null;
    published_at: string;
    user: {
        id: number;
        name: string;
    };
}

interface PaginatedPosts {
    data: Post[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Settings {
    'general.site_name'?: string;
    'general.site_tagline'?: string;
    'site.logo'?: string;
    [key: string]: string | undefined;
}

interface BlogIndexProps {
    posts: PaginatedPosts;
    settings?: Settings;
}

const BlogIndex: React.FC<BlogIndexProps> = ({ posts, settings }) => {
    const siteName = settings?.['general.site_name'] || 'Seruwit CMS';
    const siteLogo = settings?.['site.logo'];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <>
            <Head title="Blog" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                {/* Header */}
                <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">
                            <a href="/" className="flex items-center gap-2">
                                {siteLogo ? (
                                    <img src={siteLogo} alt={siteName} className="h-10 w-auto" />
                                ) : (
                                    <span className="material-symbols-outlined text-indigo-600 text-4xl font-bold">article</span>
                                )}
                                <span className="text-2xl font-black tracking-tight text-slate-900">{siteName}</span>
                            </a>
                            
                            <nav className="hidden md:flex space-x-10">
                                <a className="text-base font-semibold text-slate-600 hover:text-indigo-600 transition-colors" href="/">Beranda</a>
                                <Link className="text-base font-semibold text-indigo-600" href="/blog">Blog</Link>
                            </nav>
                            
                            <div className="flex items-center gap-4">
                                <Link className="text-base font-semibold text-slate-600 hover:text-indigo-600 transition-colors" href="/login">Masuk</Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative py-20 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                    <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
                            Blog &amp; Artikel
                        </h1>
                        <p className="text-xl text-white/80 max-w-2xl mx-auto">
                            Temukan artikel terbaru, tips, dan insight menarik dari tim kami
                        </p>
                    </div>
                </section>

                {/* Blog Posts Grid */}
                <section className="py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {posts.data.length === 0 ? (
                            <div className="text-center py-20">
                                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">article</span>
                                <h3 className="text-xl font-semibold text-slate-600 mb-2">Belum ada artikel</h3>
                                <p className="text-slate-500">Artikel akan segera hadir. Nantikan update terbaru dari kami!</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {posts.data.map((post) => (
                                        <article 
                                            key={post.id} 
                                            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100"
                                        >
                                            <Link href={`/blog/${post.slug}`}>
                                                <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 relative overflow-hidden">
                                                    {post.featured_image ? (
                                                        <img 
                                                            src={post.featured_image} 
                                                            alt={post.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-6xl text-indigo-300">article</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-6">
                                                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                                                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                                                        <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                                                        <span className="mx-2">•</span>
                                                        <span>{post.user.name}</span>
                                                    </div>
                                                    <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                                        {post.title}
                                                    </h2>
                                                    <p className="text-slate-600 line-clamp-3 mb-4">
                                                        {post.excerpt}
                                                    </p>
                                                    <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold group-hover:gap-2 transition-all">
                                                        Baca selengkapnya
                                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                    </span>
                                                </div>
                                            </Link>
                                        </article>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {posts.last_page > 1 && (
                                    <div className="mt-12 flex justify-center">
                                        <nav className="flex items-center gap-2">
                                            {posts.links.map((link, index) => (
                                                <React.Fragment key={index}>
                                                    {link.url ? (
                                                        <Link
                                                            href={link.url}
                                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                                link.active
                                                                    ? 'bg-indigo-600 text-white'
                                                                    : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'
                                                            }`}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    ) : (
                                                        <span
                                                            className="px-4 py-2 rounded-lg font-medium text-slate-400 bg-slate-100"
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </nav>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-900 text-white py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-2">
                                {siteLogo ? (
                                    <img src={siteLogo} alt={siteName} className="h-8 w-auto" />
                                ) : (
                                    <span className="material-symbols-outlined text-indigo-400 text-3xl">article</span>
                                )}
                                <span className="text-xl font-bold">{siteName}</span>
                            </div>
                            <p className="text-slate-400 text-sm">
                                © {new Date().getFullYear()} {siteName}. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default BlogIndex;
