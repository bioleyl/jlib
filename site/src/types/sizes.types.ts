export type Size = { gzip: number; raw: number };

export type ComponentSize = { className: string; tag: string; level: string; added: Size; total: Size };

/** What scripts/size-report.mjs measured: site/src/generated/sizes.json. */
export type SizeReport = { all: Size; baseline: Size; components: ComponentSize[] };
