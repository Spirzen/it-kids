import {loadEcosystemConfig, buildNavItems, resolvePortalBase} from './ecosystem.mjs';

export function getPortalContext() {
  const config = loadEcosystemConfig({dev: import.meta.env.DEV});
  return {
    config,
    navItems: buildNavItems(config, 'kids'),
    brandHref: `${resolvePortalBase(config, 'kids')}/kids/intro`,
    brandLabel: 'IT для детей',
    ecosystemConfigJson: JSON.stringify({
      postMessage: config.postMessage,
      domains: config.domains,
    }),
  };
}
