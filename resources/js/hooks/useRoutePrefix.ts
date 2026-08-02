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
     * Resolve a prefixed route name, preferring the tenant name and falling
     * back to the central-domain duplicate (routes/web.php wraps app routes
     * in a "central." name prefix when CENTRAL_SERVES_APP is on).
     */
    const resolveRouteName = (routeName: string): string => {
        const fullRouteName = `${routePrefix}.${routeName}`;

        if (route().has(fullRouteName)) {
            return fullRouteName;
        }

        const centralRouteName = `central.${fullRouteName}`;
        if (route().has(centralRouteName)) {
            return centralRouteName;
        }

        return fullRouteName;
    };

    /**
     * Generate a route URL with the current prefix
     */
    const prefixedRoute = (routeName: string, params?: any): string => {
        const fullRouteName = resolveRouteName(routeName);
        return params !== undefined ? route(fullRouteName, params) : route(fullRouteName);
    };

    /**
     * Check if the current route matches a pattern with the current prefix
     */
    const isCurrentRoute = (routePattern: string): boolean => {
        return (
            route().current(`${routePrefix}.${routePattern}`) ||
            route().current(`central.${routePrefix}.${routePattern}`) ||
            false
        );
    };

    return {
        routePrefix,
        prefixedRoute,
        isCurrentRoute,
    };
}

export default useRoutePrefix;
