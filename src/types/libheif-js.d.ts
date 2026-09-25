// libheif-js ships types only for its low-level C API (libheif-wasm/libheif.d.ts),
// not for this specific bundle subpath. Declared loosely — see the `any` cast at
// its one call site in src/lib/storage.ts for why.
declare module "libheif-js/libheif-wasm/libheif-bundle.js" {
  const factory: () => Promise<unknown>;
  export default factory;
}
