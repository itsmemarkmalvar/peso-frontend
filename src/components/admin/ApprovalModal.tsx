"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getDepartments, getDepartmentSupervisors, type DepartmentSupervisor } from "@/lib/api/departments";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface Department {
  id: number;
  name: string;
  code: string | null;
}

interface ApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrationRequest: {
    id: number;
    full_name: string;
    email: string;
  } | null;
  onApprove: (role: string, departmentId: number | null, supervisorUserId: number | null) => Promise<void>;
}

export function ApprovalModal({
  open,
  onOpenChange,
  registrationRequest,
  onApprove,
}: ApprovalModalProps) {
  const { user } = useAuth();
  const isSupervisor = user?.role === "supervisor";
  const [role, setRole] = useState<string>("intern");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsSupervisors, setDepartmentsSupervisors] = useState<DepartmentSupervisor[]>([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("");
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingSupervisors, setIsLoadingSupervisors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadDepartments();
      setRole(isSupervisor ? "intern" : "intern");
      setDepartmentId("");
      setDepartmentsSupervisors([]);
      setSelectedSupervisorId("");
    }
  }, [open, isSupervisor]);

  useEffect(() => {
    if (open && (role === "intern" || role === "gip") && departmentId) {
      loadSupervisors(parseInt(departmentId, 10));
    } else {
      setDepartmentsSupervisors([]);
      setSelectedSupervisorId("");
    }
  }, [open, role, departmentId]);

  const loadSupervisors = async (deptId: number) => {
    setIsLoadingSupervisors(true);
    try {
      const data = await getDepartmentSupervisors(deptId);
      setDepartmentsSupervisors(data);
      if (data.length > 0) {
        setSelectedSupervisorId(data[0].id.toString());
      } else {
        setSelectedSupervisorId("");
      }
    } catch {
      setDepartmentsSupervisors([]);
      setSelectedSupervisorId("");
    } finally {
      setIsLoadingSupervisors(false);
    }
  };

  const loadDepartments = async () => {
    setIsLoadingDepartments(true);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error("Failed to load departments:", err);
      setDepartments([]);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const VALID_ROLES = ["admin", "supervisor", "gip", "intern"] as const;

  const handleApprove = async () => {
    if (!registrationRequest) return;

    // Supervisors can only assign Intern or GIP; admins can assign any role
    const effectiveRole = isSupervisor
      ? (role === "gip" ? "gip" : "intern")
      : (role && (VALID_ROLES as readonly string[]).includes(role) ? role : "intern");

    // Validate: Department is required for intern and GIP roles
    if ((effectiveRole === "intern" || effectiveRole === "gip") && !departmentId) {
      alert(`Please select a department for ${effectiveRole} role.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const supId = selectedSupervisorId ? parseInt(selectedSupervisorId, 10) : null;
      await onApprove(effectiveRole, departmentId ? parseInt(departmentId, 10) : null, supId);
      onOpenChange(false);
    } catch (err) {
      console.error("Approval failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!registrationRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[540px] z-[100]"
        onClose={() => onOpenChange(false)}
        aria-describedby="approval-modal-description"
      >
        <DialogHeader>
          <DialogTitle>Approve Registration Request</DialogTitle>
          <DialogDescription id="approval-modal-description">
            Assign a role and department for <span className="font-medium text-slate-900">{registrationRequest.full_name}</span> ({registrationRequest.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2.5">
            <Label htmlFor="role" className="text-sm font-semibold text-slate-700">
              Role <span className="text-red-600">*</span>
            </Label>
            {isSupervisor ? (
              <>
                <Select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <option value="intern">Intern</option>
                  <option value="gip">GIP</option>
                </Select>
                <p className="text-xs text-slate-500 mt-1.5">
                  Supervisors can only assign Intern or GIP
                </p>
              </>
            ) : (
              <>
                <Select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <option value="admin">Administrator</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="gip">GIP</option>
                  <option value="intern">Intern</option>
                </Select>
                <p className="text-xs text-slate-500 mt-1.5">
                  Select the role for this user account
                </p>
              </>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="department" className="text-sm font-semibold text-slate-700">
              Department / Office {(role === "intern" || role === "gip") && <span className="text-red-600">*</span>}
            </Label>
            <Select
              id="department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={isSubmitting || isLoadingDepartments}
              placeholder={
                isLoadingDepartments
                  ? "Loading departments..."
                  : "Select a department"
              }
              className="w-full"
            >
              {departments.length === 0 && !isLoadingDepartments && (
                <option value="" disabled>
                  No departments available
                </option>
              )}
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id.toString()}>
                  {dept.name} {dept.code && `(${dept.code})`}
                </option>
              ))}
            </Select>
            <p className="text-xs text-slate-500 mt-1.5">
              {(role === "intern" || role === "gip")
                ? `Required: Select the department where this ${role} will be deployed`
                : "Optional: Assign to a specific department"}
            </p>
          </div>

          {(role === "intern" || role === "gip") && departmentId && (
            <div className="space-y-2.5">
              <Label htmlFor="supervisor" className="text-sm font-semibold text-slate-700">
                Supervisor
              </Label>
              {isLoadingSupervisors ? (
                <p className="text-xs text-slate-500">Loading supervisors…</p>
              ) : departmentsSupervisors.length === 0 ? (
                <p className="text-xs text-slate-500">No supervisors assigned to this department.</p>
              ) : (
                <>
                  <Select
                    id="supervisor"
                    value={selectedSupervisorId}
                    onChange={(e) => setSelectedSupervisorId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {departmentsSupervisors.map((s) => (
                      <option key={s.id} value={s.id.toString()}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Auto-filled from department. Supervisor name and email will be saved to the intern record.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="min-w-[100px] border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
            <Button
            type="button"
            onClick={handleApprove}
            disabled={isSubmitting || ((role === "intern" || role === "gip") && !departmentId)}
            className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
          >
            {isSubmitting ? "Processing..." : "Confirm Approval"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
