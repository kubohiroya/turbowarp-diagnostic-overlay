import {copyFileSync, mkdirSync} from 'node:fs';
const destination = new URL('../dist/schemas/', import.meta.url);
mkdirSync(destination, {recursive: true});
copyFileSync(new URL('../schemas/diagnostic.schema.json', import.meta.url), new URL('diagnostic.schema.json', destination));
