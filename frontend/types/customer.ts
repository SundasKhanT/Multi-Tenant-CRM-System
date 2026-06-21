import { Note } from "./note";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organizationId: string;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  notes?: Note[];
}

export interface PaginatedCustomers {
  data: Customer[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
