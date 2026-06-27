#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {mirrorMarkdownDir, repoRoot, resolveKnowledgeBaseRoot} from './lib.mjs';
import {mirrorAssetsDir} from './mirror-assets.mjs';

const kb = resolveKnowledgeBaseRoot();
const src = path.join(kb, 'docs/encyclopedia/9-spinoff/9-11-dlya-detey');
const dest = path.join(repoRoot, 'content/kids');
const assetsDest = path.join(repoRoot, 'public/doc-assets/kids');

if (fs.existsSync(dest)) {
  fs.rmSync(dest, {recursive: true, force: true});
}
if (fs.existsSync(assetsDest)) {
  fs.rmSync(assetsDest, {recursive: true, force: true});
}
fs.mkdirSync(dest, {recursive: true});

let count = mirrorMarkdownDir(src, dest, {copyCategory: true});
const assets = mirrorAssetsDir(src, assetsDest);

const forkids = path.join(dest, 'forkids.md');
const intro = path.join(dest, 'intro.md');
if (fs.existsSync(forkids)) {
  if (fs.existsSync(intro)) {
    fs.rmSync(intro);
  }
  fs.renameSync(forkids, intro);
}

console.log(`sync-kids: ${count} files → content/kids, ${assets} assets → public/doc-assets/kids`);
