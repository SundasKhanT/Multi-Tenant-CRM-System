export interface Note {
  id: string;
  content: string;
  customerId: string;
  createdById: string;
  createdAt: string;
  createdBy?: { id: string; name: string; email: string };
}
