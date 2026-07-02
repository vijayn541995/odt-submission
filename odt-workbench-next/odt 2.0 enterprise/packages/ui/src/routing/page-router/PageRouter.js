import React from 'react';

export function createPageRoutes(routeComponents = {}) {
  return Object.entries(routeComponents).reduce((routes, [id, component]) => {
    if (typeof component === 'function') {
      routes[id] = { id, component };
    }
    return routes;
  }, {});
}

export function PageRouter({
  activePage = 'overview',
  routes = {},
  defaultPage = 'overview',
  routeProps = {},
  onMissingRoute
}) {
  const route = routes[activePage] || routes[defaultPage];

  if (!route?.component) {
    onMissingRoute?.(activePage);
    return null;
  }

  return React.createElement(route.component, routeProps);
}
