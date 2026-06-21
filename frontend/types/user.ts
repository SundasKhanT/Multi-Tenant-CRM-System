export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  organizationId: string;
  activeCustomerCount?: number;
}
