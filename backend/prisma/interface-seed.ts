export interface SeedOrganization {
  name: string;
  adminEmail: string;
  adminPassword: string;
}

export interface SeedData {
  organizations: SeedOrganization[];
}
