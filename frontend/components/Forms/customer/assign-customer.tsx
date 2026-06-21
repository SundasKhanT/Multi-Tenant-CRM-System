'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Customer } from '@/types/customer';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AssignCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSuccess: () => void;
}

export function AssignCustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: AssignCustomerDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedUserId('');
    }
  }, [open]);

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const res = await api.get<User[]>('/users');
      setUsers(res);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleAssign() {
    if (!customer || !selectedUserId) return;
    setLoading(true);

    try {
      const res = await api.patch<{ message: string }>(
        `/customers/${customer.id}/assign`,
        { userId: selectedUserId },
      );
      toast.success(res.message);
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Assignment failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign {customer?.name} to a user</DialogTitle>
        </DialogHeader>

        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger>
            <SelectValue
              placeholder={loadingUsers ? 'Loading users...' : 'Select a user'}
            />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} ({user.activeCustomerCount ?? 0}/5 active)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button
            onClick={handleAssign}
            disabled={!selectedUserId || loading}
          >
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}