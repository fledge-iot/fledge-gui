export type Microfrontend = {
  // Logical name used in federation.manifest.json
  remoteName: string;
  // Exposed module path, e.g. './Module' or './routes'
  exposedModule: string;
  // Display label in side menu
  displayName: string;
  // Route path in host app
  routePath: string;
  // Exported NgModule name to load from the exposed module
  ngModuleName: string;
};
