import { usePage } from '@inertiajs/react';

type RoutePrefix = 'admin' | 'user' | 'module';

interface UseRoutePrefixReturn {
    routePrefix: RoutePrefix;
    prefixedRoute: (routeName: string, params?: any) => string;
    isCurrentRoute: (routePattern: string) => boolean;
}

/**
 * Custom hook to handle dynamic route prefixes.
 * 
 * This hook provides utilities for working with route prefixes (admin, user, module)
 * that are shared from the backend via HandleInertiaRequests middleware.
 * 
 * @example
 * const { routePrefix, prefixedRoute, isCurrentRoute } = useRoutePrefix();
 * 
 * // Generate a route with the current prefix
 * const postsUrl = prefixedRoute('posts.index'); // e.g., '/admin/posts' or '/user/posts'
 * 
 * // Check if current route matches a pattern
 * const isOnPosts = isCurrentRoute('posts.*');
 */
export function useRoutePrefix(): UseRoutePrefixReturn {
    const props = usePage().props as any;
    const routePrefix: RoutePrefix = props.route_prefix || 'admin';

    /**
     * Generate a route URL with the current prefix
     */
    const prefixedRoute = (routeName: string, params?: any): string => {
        const fullRouteName = `${routePrefix}.${routeName}`;
        return params !== undefined ? route(fullRouteName, params) : route(fullRouteName);
    };

    /**
     * Check if the current route matches a pattern with the current prefix
     */
    const isCurrentRoute = (routePattern: string): boolean => {
        return route().current(`${routePrefix}.${routePattern}`) ?? false;
    };

    return {
        routePrefix,
        prefixedRoute,
        isCurrentRoute,
    };
}

export default useRoutePrefix;
