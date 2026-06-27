import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {findRepoRoot} from '../ecosystem.mjs';
import {PORTAL, pathSegmentsToHref, resolveSpinoffDocHref} from '../portal-config.mjs';
import {
  listMarkdownFilesRecursive,
  parsePortalMarkdownFile,
} from './parse-markdown.mjs';
import {renderMarkdownToHtml} from './render-markdown.mjs';
import {buildPortalCardListHtml, extractTocFromMarkdown, sortByDocPath, compareByDocPath, categoryOrderKey} from '../markdown/shared.mjs';

const SPIRZEN_BASE = 'https://spirzen.ru';
const TERMS_BASE = 'https://terms.spirzen.ru';
const LAB_BASE = 'https://lab.spirzen.ru';
const TOOLS_BASE = 'https://tools.spirzen.ru';

export async function loadPortalPages(contentDir) {
  const dir =
    contentDir ?? path.join(findRepoRoot(path.dirname(fileURLToPath(import.meta.url))), PORTAL.contentDir);
  const relFiles = listMarkdownFilesRecursive(dir);
  const parsed = relFiles.map((rel) => parsePortalMarkdownFile(path.join(dir, rel), dir));
  const byHref = new Map(parsed.map((page) => [page.href, page]));

  const pages = [];
  for (const page of parsed) {
    pages.push(await buildPortalPage(page, byHref));
  }

  pages.sort(compareByDocPath);

  return {
    pages,
    sidebar: buildSidebar(pages),
  };
}

async function buildPortalPage(page, byHref) {
  let markdown = page.bodyMarkdown;
  if (markdown.includes('<!-- DOC_CARD_LIST -->')) {
    markdown = markdown.replace('<!-- DOC_CARD_LIST -->', buildDocCardListHtml(page, byHref));
  }

  const toc = extractTocFromMarkdown(markdown);

  return {
    ...page,
    pathSlug: page.pathSegments.join('/'),
    bodyHtml: await renderMarkdownToHtml(markdown),
    relatedLinks: buildRelatedLinks(page.related),
    breadcrumbs: buildBreadcrumbs(page),
    toc,
  };
}

function buildBreadcrumbs(page) {
  const crumbs = [{label: PORTAL.label, href: PORTAL.introHref}];
  if (page.categoryKey && page.href !== PORTAL.introHref) {
    crumbs.push({
      label: page.categoryLabel ?? page.categoryKey,
      href: `/${PORTAL.prefix}/${page.categoryKey}/intro`,
    });
  }
  if (!page.isIntro || page.pathSegments.length > 1) {
    crumbs.push({label: page.title, href: page.href, current: true});
  } else if (page.href === PORTAL.introHref) {
    crumbs[0].current = true;
  }
  return crumbs;
}

function buildDocCardListHtml(page, byHref) {
  const categoryKey = page.categoryKey;
  const items = [];

  if (page.href === PORTAL.introHref) {
    for (const candidate of byHref.values()) {
      if (
        candidate.isIntro &&
        candidate.href !== PORTAL.introHref &&
        candidate.categoryKey &&
        candidate.pathSegments.length === 2
      ) {
        items.push(candidate);
      }
    }
  } else if (categoryKey) {
    for (const candidate of byHref.values()) {
      if (
        candidate.categoryKey === categoryKey &&
        !candidate.isIntro &&
        candidate.href.startsWith(`/${PORTAL.prefix}/${categoryKey}/`)
      ) {
        items.push(candidate);
      }
    }
  }

  sortByDocPath(items);
  if (items.length === 0) {
    return '';
  }

  const cards = items.slice(0, 32).map((item) => ({
    title: item.title,
    description: item.description,
    href: item.href,
  }));

  return buildPortalCardListHtml(cards);
}

function buildRelatedLinks(related) {
  return related
    .map((item) => {
      const doc = item.doc ?? '';
      const spinoff = resolveSpinoffDocHref(doc);
      if (spinoff) {
        return {
          title: item.title ?? doc,
          href: spinoff.href,
          external: spinoff.external,
        };
      }
      if (doc.startsWith('encyclopedia/')) {
        return {
          title: item.title ?? doc,
          href: `${SPIRZEN_BASE}/${doc}`,
          external: true,
        };
      }
      if (doc.startsWith('lab/')) {
        return {
          title: item.title ?? doc,
          href: `${LAB_BASE}/${doc}`,
          external: true,
        };
      }
      if (doc.startsWith('tools/')) {
        return {
          title: item.title ?? doc,
          href: `${TOOLS_BASE}/${doc}`,
          external: true,
        };
      }
      if (doc.startsWith('glossary/')) {
        return {
          title: item.title ?? doc,
          href: `${TERMS_BASE}/${doc}`,
          external: true,
        };
      }
      return null;
    })
    .filter(Boolean);
}

function buildSidebar(pages) {
  const items = [];
  const rootIntro = pages.find((p) => p.href === PORTAL.introHref);
  if (rootIntro) {
    items.push({type: 'link', slug: 'intro', label: 'О портале', href: PORTAL.introHref});
  }

  const categories = new Map();
  for (const page of pages) {
    if (!page.categoryKey) {
      continue;
    }
    if (!categories.has(page.categoryKey)) {
      categories.set(page.categoryKey, {label: page.categoryLabel ?? page.categoryKey, pages: []});
    }
    categories.get(page.categoryKey).pages.push(page);
  }

  for (const [key, {label, pages: categoryPages}] of [...categories.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], 'ru'),
  )) {
    const intro = categoryPages.find((p) => p.isIntro && p.pathSegments.length === 2);
    const children = sortByDocPath(
      categoryPages.filter((p) => !p.isIntro || p.pathSegments.length > 2).filter((p) => !(p.isIntro && p.pathSegments.length === 2)),
    ).map((p) => ({
        slug: p.pathSlug,
        label: p.title,
        href: p.href,
      }));

    items.push({
      type: 'category',
      slug: intro?.pathSlug ?? key,
      categoryKey: key,
      label,
      href: intro?.href ?? `/${PORTAL.prefix}/${key}/intro`,
      children,
    });
  }

  return items;
}
