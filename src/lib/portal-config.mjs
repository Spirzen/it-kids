/** @typedef {{ prefix: string, label: string, brandLabel: string, assetsBase: string, contentDir: string, introHref: string, spinoffRoots: string[] }} PortalConfig */

/** @type {PortalConfig} */
export const PORTAL = {
  prefix: 'kids',
  label: 'Для детей',
  brandLabel: 'Kids IT',
  assetsBase: '/doc-assets/kids',
  contentDir: 'content/kids',
  introHref: '/kids/intro',
  spinoffRoots: ['9-11-dlya-detey'],
};

export const GAMES_ORIGIN = 'https://games.spirzen.ru';

/** @param {string[]} segments */
export function pathSegmentsToHref(segments) {
  return `/${PORTAL.prefix}/${segments.join('/')}`;
}

/**
 * @param {string} doc — encyclopedia/9-spinoff/… или kids/…
 */
export function resolveSpinoffDocHref(doc) {
  for (const root of PORTAL.spinoffRoots) {
    const marker = `encyclopedia/9-spinoff/${root}/`;
    if (doc.startsWith(marker)) {
      let rel = doc.slice(marker.length);
      if (rel === 'forkids') {
        rel = 'intro';
      }
      return {href: pathSegmentsToHref(rel.split('/').filter(Boolean)), external: false};
    }
  }
  if (
    doc.startsWith('encyclopedia/9-spinoff/9-03-igrovaya-industriya/') ||
    doc.startsWith('encyclopedia/9-spinoff/9-04-razrabotka-igr/')
  ) {
    const rel = doc.replace(/^encyclopedia\/9-spinoff\//, '');
    return {href: `${GAMES_ORIGIN}/games/${rel}`, external: true};
  }
  if (doc.startsWith(`${PORTAL.prefix}/`)) {
    const rel = doc.replace(new RegExp(`^${PORTAL.prefix}/`), '');
    return {href: pathSegmentsToHref(rel.split('/').filter(Boolean)), external: false};
  }
  return null;
}
