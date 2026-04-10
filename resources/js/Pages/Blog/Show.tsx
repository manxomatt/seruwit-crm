import React from 'react';
import { Head, Link } from '@inertiajs/react';

interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featured_image: string | null;
    published_at: string;
    user: {
        id: number;
        name: string;
    };
}

interface Settings {
    'general.site_name'?: string;
    'general.site_tagline'?: string;
    'site.logo'?: string;
    [key: string]: string | undefined;
}

interface BlogShowProps {
    post: Post;
    relatedPosts: Post[];
    settings?: Settings;
}

const BlogShow: React.FC<BlogShowProps> = ({ post, relatedPosts, settings }) => {
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
            <Head title={post.title} />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                {/* Header */}
                <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">
                            <Link href="/" className="flex items-center gap-2">
                                {siteLogo ? (
                                    <img src={siteLogo} alt={siteName} className="h-10 w-auto" />
                                ) : (
                                    <span className="material-symbols-outlined text-indigo-600 text-4xl font-bold">article</span>
                                )}
                                <span className="text-2xl font-black tracking-tight text-slate-900">{siteName}</span>
                            </Link>
                            
                            <nav className="hidden md:flex space-x-10">
                                <Link className="text-base font-semibold text-slate-600 hover:text-indigo-600 transition-colors" href="/">Beranda</Link>
                                <Link className="text-base font-semibold text-indigo-600" href="/blog">Blog</Link>
                            </nav>
                            
                            <div className="flex items-center gap-4">
                                <Link className="text-base font-semibold text-slate-600 hover:text-indigo-600 transition-colors" href="/login">Masuk</Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Article Header */}
                <section className="relative py-16 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                    <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>
                    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <Link 
                            href="/blog" 
                            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Kembali ke Blog
                        </Link>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                            {post.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-white/80">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">person</span>
                                <span>{post.user.name}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">calendar_today</span>
                                <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Article Content */}
                <article className="py-12">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Featured Image */}
                        {post.featured_image && (
                            <div className="mb-10 -mt-20 relative z-10">
                                <img 
                                    src={post.featured_image} 
                                    alt={post.title}
                                    className="w-full rounded-2xl shadow-2xl object-cover max-h-[500px]"
                                />
                            </div>
                        )}

                        {/* Content */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
                            {/* Excerpt */}
                            {post.excerpt && (
                                <p className="text-xl text-slate-600 leading-relaxed mb-8 pb-8 border-b border-slate-100 font-medium">
                                    {post.excerpt}
                                </p>
                            )}

                            {/* Main Content */}
                            <div 
                                className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-lg"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />

                            {/* Share Section */}
                            <div className="mt-12 pt-8 border-t border-slate-100">
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Bagikan Artikel</h4>
                                <div className="flex gap-3">
                                    <a 
                                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">share</span>
                                        Twitter
                                    </a>
                                    <a 
                                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">share</span>
                                        Facebook
                                    </a>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(window.location.href)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">content_copy</span>
                                        Salin Link
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                    <section className="py-16 bg-white border-t border-slate-100">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-8">
                                Artikel Terkait
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {relatedPosts.map((relatedPost) => (
                                    <article 
                                        key={relatedPost.id} 
                                        className="group bg-slate-50 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                                    >
                                        <Link href={`/blog/${relatedPost.slug}`}>
                                            <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 relative overflow-hidden">
                                                {relatedPost.featured_image ? (
                                                    <img 
                                                        src={relatedPost.featured_image} 
                                                        alt={relatedPost.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-5xl text-indigo-300">article</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-5">
                                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                                                    <time dateTime={relatedPost.published_at}>{formatDate(relatedPost.published_at)}</time>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                                    {relatedPost.title}
                                                </h3>
                                            </div>
                                        </Link>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

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

export default BlogShow;
