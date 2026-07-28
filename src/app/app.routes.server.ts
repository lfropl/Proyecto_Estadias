import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Authentication is held in the browser (localStorage), so it is not available
 * during server rendering. Prerendering/SSR ran the route guards on the server
 * where the session always looks empty, which made a refresh on a protected
 * route 302 to /login and bounce the user off the page they were on.
 *
 * Rendering on the client serves the app shell for every route and lets the
 * client-side guards (which can read the session) decide, so a refresh keeps
 * the user on the same page.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
