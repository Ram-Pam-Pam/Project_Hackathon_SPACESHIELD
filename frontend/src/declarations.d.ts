declare module "*.geojson" {
  const value: any;
  export default value;
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}