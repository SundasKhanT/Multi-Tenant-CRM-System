'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PaginatedCustomers, Customer } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CustomerFormDialog } from '@/components/Forms/customer/customer-form';
import { AssignCustomerDialog } from '@/components/Forms/customer/assign-customer';
import { CustomerNotesDialog } from '@/components/Forms/customer/customer-notes';
import { NavBar } from '@/components/ui/nav-bar';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningCustomer, setAssigningCustomer] = useState<Customer | null>(null);

  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesCustomer, setNotesCustomer] = useState<Customer | null>(null);

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setCurrentUserRole(JSON.parse(stored).role);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCustomers();
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  async function fetchCustomers() {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search ? { search } : {}),
      });
      const res = await api.get<PaginatedCustomers>(`/customers?${query}`);
      setCustomers(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingCustomer(null);
    setDialogOpen(true);
  }

  function openEditDialog(customer: Customer) {
    setEditingCustomer(customer);
    setDialogOpen(true);
  }

  function openAssignDialog(customer: Customer) {
    setAssigningCustomer(customer);
    setAssignDialogOpen(true);
  }

  function openNotesDialog(customer: Customer) {
    setNotesCustomer(customer);
    setNotesDialogOpen(true);
  }

  async function handleDelete(customer: Customer) {
    if (!confirm(`Delete ${customer.name}? This can be restored later.`)) return;
    try {
      const res = await api.delete<{ message: string }>(`/customers/${customer.id}`);
      toast.success(res.message);
      fetchCustomers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast.error(message);
    }
  }

  return (
    <>
      <NavBar />
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Customers</h1>
          <Button onClick={openCreateDialog}>+ New Customer</Button>
        </div>

        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="mb-4 max-w-sm"
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.phone ?? '-'}</TableCell>
                      <TableCell>
                        {c.assignedTo ? (
                          <Badge variant="secondary">{c.assignedTo.name}</Badge>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(c)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openAssignDialog(c)}>
                          Assign
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openNotesDialog(c)}>
                          Notes
                        </Button>
                        {currentUserRole === 'ADMIN' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDelete(c)}
                          >
                            Delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )}

        <CustomerFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          customer={editingCustomer}
          onSuccess={fetchCustomers}
        />

        <AssignCustomerDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          customer={assigningCustomer}
          onSuccess={fetchCustomers}
        />

        <CustomerNotesDialog
          open={notesDialogOpen}
          onOpenChange={setNotesDialogOpen}
          customer={notesCustomer}
        />
      </div>
    </>
  );
}