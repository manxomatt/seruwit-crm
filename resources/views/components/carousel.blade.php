@if($carousel && $carousel->activeImages->count() > 0)
<div class="carousel-container" data-carousel="{{ $carousel->slug }}" data-autoplay="{{ $carousel->autoplay_interval ?? 5000 }}">
    <div class="carousel-wrapper relative overflow-hidden rounded-lg">
        <!-- Carousel Slides -->
        <div class="carousel-slides relative" style="display: flex; transition: transform 0.5s ease-in-out;">
            @foreach($carousel->activeImages as $index => $image)
            <div class="carousel-slide flex-shrink-0 w-full relative" data-index="{{ $index }}">
                @if($image->link_url)
                <a href="{{ $image->link_url }}" target="{{ $image->link_target ?? '_self' }}" class="block">
                @endif
                    <img 
                        src="{{ asset('storage/' . $image->image_path) }}" 
                        alt="{{ $image->title ?? 'Carousel image ' . ($index + 1) }}"
                        class="w-full h-auto object-cover"
                        style="max-height: 500px; object-fit: cover;"
                    >
                    @if($image->title || $image->description || $image->button_text)
                    <div class="carousel-caption absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                        @if($image->title)
                        <h3 class="text-2xl font-bold mb-2">{{ $image->title }}</h3>
                        @endif
                        @if($image->description)
                        <p class="text-base mb-4">{{ $image->description }}</p>
                        @endif
                        @if($image->button_text && $image->link_url)
                        <span class="inline-block bg-white text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition">
                            {{ $image->button_text }}
                        </span>
                        @endif
                    </div>
                    @endif
                @if($image->link_url)
                </a>
                @endif
            </div>
            @endforeach
        </div>

        @if($carousel->show_navigation && $carousel->activeImages->count() > 1)
        <!-- Navigation Arrows -->
        <button 
            class="carousel-prev absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition z-10"
            onclick="carouselPrev('{{ $carousel->slug }}')"
            aria-label="Previous slide"
        >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
        </button>
        <button 
            class="carousel-next absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition z-10"
            onclick="carouselNext('{{ $carousel->slug }}')"
            aria-label="Next slide"
        >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
        </button>
        @endif

        @if($carousel->show_indicators && $carousel->activeImages->count() > 1)
        <!-- Indicators -->
        <div class="carousel-indicators absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            @foreach($carousel->activeImages as $index => $image)
            <button 
                class="carousel-indicator w-3 h-3 rounded-full transition {{ $index === 0 ? 'bg-white' : 'bg-white/50' }}"
                onclick="carouselGoTo('{{ $carousel->slug }}', {{ $index }})"
                aria-label="Go to slide {{ $index + 1 }}"
            ></button>
            @endforeach
        </div>
        @endif
    </div>
</div>

<script>
(function() {
    const carousels = {};
    
    function initCarousel(slug) {
        const container = document.querySelector(`[data-carousel="${slug}"]`);
        if (!container || carousels[slug]) return;
        
        const slides = container.querySelector('.carousel-slides');
        const slideElements = container.querySelectorAll('.carousel-slide');
        const indicators = container.querySelectorAll('.carousel-indicator');
        const autoplayInterval = parseInt(container.dataset.autoplay) || 5000;
        
        carousels[slug] = {
            currentIndex: 0,
            totalSlides: slideElements.length,
            autoplayTimer: null
        };
        
        function updateCarousel() {
            const { currentIndex } = carousels[slug];
            slides.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('bg-white', index === currentIndex);
                indicator.classList.toggle('bg-white/50', index !== currentIndex);
            });
        }
        
        function startAutoplay() {
            if (autoplayInterval > 0 && carousels[slug].totalSlides > 1) {
                carousels[slug].autoplayTimer = setInterval(() => {
                    carousels[slug].currentIndex = (carousels[slug].currentIndex + 1) % carousels[slug].totalSlides;
                    updateCarousel();
                }, autoplayInterval);
            }
        }
        
        function stopAutoplay() {
            if (carousels[slug].autoplayTimer) {
                clearInterval(carousels[slug].autoplayTimer);
            }
        }
        
        container.addEventListener('mouseenter', stopAutoplay);
        container.addEventListener('mouseleave', startAutoplay);
        
        startAutoplay();
    }
    
    window.carouselPrev = function(slug) {
        if (!carousels[slug]) return;
        carousels[slug].currentIndex = (carousels[slug].currentIndex - 1 + carousels[slug].totalSlides) % carousels[slug].totalSlides;
        const slides = document.querySelector(`[data-carousel="${slug}"] .carousel-slides`);
        const indicators = document.querySelectorAll(`[data-carousel="${slug}"] .carousel-indicator`);
        slides.style.transform = `translateX(-${carousels[slug].currentIndex * 100}%)`;
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('bg-white', index === carousels[slug].currentIndex);
            indicator.classList.toggle('bg-white/50', index !== carousels[slug].currentIndex);
        });
    };
    
    window.carouselNext = function(slug) {
        if (!carousels[slug]) return;
        carousels[slug].currentIndex = (carousels[slug].currentIndex + 1) % carousels[slug].totalSlides;
        const slides = document.querySelector(`[data-carousel="${slug}"] .carousel-slides`);
        const indicators = document.querySelectorAll(`[data-carousel="${slug}"] .carousel-indicator`);
        slides.style.transform = `translateX(-${carousels[slug].currentIndex * 100}%)`;
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('bg-white', index === carousels[slug].currentIndex);
            indicator.classList.toggle('bg-white/50', index !== carousels[slug].currentIndex);
        });
    };
    
    window.carouselGoTo = function(slug, index) {
        if (!carousels[slug]) return;
        carousels[slug].currentIndex = index;
        const slides = document.querySelector(`[data-carousel="${slug}"] .carousel-slides`);
        const indicators = document.querySelectorAll(`[data-carousel="${slug}"] .carousel-indicator`);
        slides.style.transform = `translateX(-${index * 100}%)`;
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('bg-white', i === index);
            indicator.classList.toggle('bg-white/50', i !== index);
        });
    };
    
    // Initialize carousel when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initCarousel('{{ $carousel->slug }}'));
    } else {
        initCarousel('{{ $carousel->slug }}');
    }
})();
</script>
@else
<!-- Carousel "{{ $slug }}" not found or has no active images -->
@endif
