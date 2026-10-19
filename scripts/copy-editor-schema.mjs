import {copyFileSync, mkdirSync} from 'node:fs';
const destination = new URL('../dist/schemas/', import.meta.url);
mkdirSync(destination, {recursive: true});
copyFileSync(new URL('../schemas/diagnostic.schema.json', import.meta.url), new URL('diagnostic.schema.json', destination));
copyFileSync(new URL('../schemas/block-editor-fixed-inputs.schema.json', import.meta.url), new URL('block-editor-fixed-inputs.schema.json', destination));
