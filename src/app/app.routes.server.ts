import { RenderMode, ServerRoute } from '@angular/ssr';
import { routes } from './app.routes';

export const serverRoutes: ServerRoute[] = routes.map(
  (route): ServerRoute => ({
    path: route.path ?? '',
    renderMode: RenderMode.Prerender,
  }),
);
