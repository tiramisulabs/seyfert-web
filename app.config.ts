export interface AppConfig {
  repository: string;
}

export const config: AppConfig = {
  repository: "tiramisulabs/seyfert",
} as const;
