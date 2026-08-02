import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";
import { Modal } from "react-bootstrap";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../utils/errorMessages";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} from "../../services/userService";
import { toFrontendRole, toBackendRole } from "../../utils/roleMap";
import LoadingState from "../../components/common/LoadingState";
import styles from "./UserManagementPage.module.css";

// Yup validations for Create
const createUserSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name cannot exceed 50 characters")
    .required("Name is required"),
  email: yup
    .string()
    .trim()
    .email("Provide a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  role: yup
    .string()
    .oneOf(["candidate", "recruiter", "admin"], "Select a valid role")
    .required("Role is required")
});

// Yup validations for Edit (only Name and Email are editable by admin)
const editUserSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name cannot exceed 50 characters")
    .required("Name is required"),
  email: yup
    .string()
    .trim()
    .email("Provide a valid email address")
    .required("Email is required")
});

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [activeUser, setActiveUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch users from backend API
  const loadUsers = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const data = await getAllUsers({ page: pageNumber, limit: 10 });
      setUsers(data.users || []);
      setPage(data.page || 1);
      setTotalPages(data.pages || 1);
    } catch (err) {
      toast.error("Failed to load users from backend API");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
  }, []);

  // Handlers
  const handleAddUser = async (values, { resetForm }) => {
    setSubmitting(true);
    try {
      // Map frontend role "recruiter" -> backend "hr"
      const payload = {
        ...values,
        role: toBackendRole(values.role)
      };
      const response = await createUser(payload);
      toast.success(response.message || `User "${values.name}" created successfully`);
      setShowAddModal(false);
      resetForm();
      loadUsers(1); // Refresh back to page 1
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create user"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        email: values.email.trim()
      };
      const response = await updateUser(activeUser._id, payload);
      toast.success(response.message || `User "${values.name}" updated successfully`);
      setShowEditModal(false);
      setActiveUser(null);
      loadUsers(page); // Stay on current page
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update user"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    setSubmitting(true);
    try {
      const response = await deleteUser(activeUser._id);
      toast.success(response.message || `User deleted successfully`);
      setShowDeleteModal(false);
      setActiveUser(null);
      loadUsers(page); // Stay on current page
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete user"));
    } finally {
      setSubmitting(false);
    }
  };

  // Client-side search within current active page
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeClass = (role) => {
    const fRole = toFrontendRole(role);
    if (fRole === "admin") return "badge-status badge-accepted";
    if (fRole === "recruiter") return "badge-status badge-interviewing";
    return "badge-status badge-shortlisted";
  };

  if (loading && users.length === 0) return <LoadingState message="Loading users from API..." />;

  return (
    <>
      {/* Page Header */}
      <div className="page-header-row mb-4">
        <div>
          <h1 className={styles.headerTitle}>User Management</h1>
          <p className={styles.headerSubtitle}>
            Create, update, and manage candidate, recruiter, and administrator profiles directly on the backend database.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary-custom"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-person-plus me-2" aria-hidden="true" /> Add New User
        </button>
      </div>

      {/* Main Table Card */}
      <div className={`hcard ${styles.cardPadding}`}>
        {/* Search Bar */}
        <div className={styles.searchBarContainer}>
          <div className={styles.searchBox}>
            <i className="bi bi-search text-muted" aria-hidden="true" />
            <input
              type="text"
              placeholder="Filter users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, width: "100%" }}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="table-responsive">
          <table className="htable">
            <thead>
              <tr>
                <th>Profile &amp; Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Joined</th>
                <th style={{ width: "120px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
                    <i className="bi bi-people" style={{ fontSize: 28, display: "block", marginBottom: 8 }} aria-hidden="true" />
                    No users found on this page.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className={styles.userInfoFlex}>
                        <img
                          src={
                            u.profile_image ||
                            u.company_logo ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=F3F5FB&color=1D2445&size=80`
                          }
                          alt={u.name}
                          className={styles.userAvatar}
                        />
                        <div>
                          <div className={styles.userName}>{u.name}</div>
                          <div className={styles.userId}>ID: {u._id}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.emailCell}>{u.email}</td>
                    <td>
                      <span className={`${getRoleBadgeClass(u.role)} ${styles.roleBadge}`} style={{ fontSize: 12, padding: "4px 10px" }}>
                        {toFrontendRole(u.role)}
                      </span>
                    </td>
                    <td className={styles.createdAtCell}>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })
                        : "N/A"}
                    </td>
                    <td className={styles.actionCell}>
                      <div className={styles.actionButtons}>
                        <button
                          type="button"
                          className="topbar-icon-btn"
                          style={{ width: 32, height: 32, fontSize: 14 }}
                          onClick={() => {
                            setActiveUser(u);
                            setShowDeleteModal(true);
                          }}
                          title="Delete User"
                          aria-label={`Delete user ${u.name}`}
                        >
                          <i className="bi bi-trash text-danger" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className={styles.footerContainer}>
            <span className={styles.pageInfo}>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className={styles.paginationContainer}>
              <button
                type="button"
                className={`btn-outline-custom ${styles.paginationBtn}`}
                disabled={page <= 1 || loading}
                onClick={() => loadUsers(page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className={`btn-outline-custom ${styles.paginationBtn}`}
                disabled={page >= totalPages || loading}
                onClick={() => loadUsers(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <div className="hcard p-4 border-0">
          <Modal.Header closeButton style={{ borderBottom: "none", padding: 0 }}>
            <h2 className={`${styles.modalHeaderTitle} section-title`} style={{ margin: 0, fontSize: 18 }}>Add New User</h2>
          </Modal.Header>
          <Formik
            initialValues={{ name: "", email: "", password: "", role: "candidate" }}
            validationSchema={createUserSchema}
            onSubmit={handleAddUser}
          >
            {({ isSubmitting: formikSubmitting }) => (
              <Form style={{ marginTop: 20 }}>
                {/* Name */}
                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="user-name-add" className={styles.formLabel}>Full Name</label>
                  <Field id="user-name-add" name="name" type="text" placeholder="Enter full name" className={styles.formField} />
                  <ErrorMessage name="name">{(msg) => <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{msg}</div>}</ErrorMessage>
                </div>

                {/* Email */}
                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="user-email-add" className={styles.formLabel}>Email Address</label>
                  <Field id="user-email-add" name="email" type="email" placeholder="Enter email address (e.g., name@domain.com)" className={styles.formField} />
                  <ErrorMessage name="email">{(msg) => <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{msg}</div>}</ErrorMessage>
                </div>

                {/* Password */}
                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="user-password-add" className={styles.formLabel}>Password</label>
                  <Field id="user-password-add" name="password" type="password" placeholder="Minimum 8 characters" className={styles.formField} />
                  <ErrorMessage name="password">{(msg) => <div className={styles.errorMsg}>{msg}</div>}</ErrorMessage>
                </div>

                {/* Role */}
                <div className={styles.formGroup}>
                  <label htmlFor="user-role-add" className={styles.formLabel}>Access Role</label>
                  <Field id="user-role-add" name="role" as="select" className={styles.formField}>
                    <option value="candidate">Candidate</option>
                    <option value="recruiter">Recruiter (HR)</option>
                    <option value="admin">Administrator</option>
                  </Field>
                  <ErrorMessage name="role">{(msg) => <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{msg}</div>}</ErrorMessage>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    type="button"
                    className={`btn-outline-custom ${styles.modalFooterButton}`}
                    onClick={() => setShowAddModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn-primary-custom ${styles.modalFooterButton}`}
                    disabled={formikSubmitting || submitting}
                  >
                    {submitting ? "Creating..." : "Create User"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setActiveUser(null); }} centered>
        <div className="hcard p-4 border-0">
          <Modal.Header closeButton style={{ borderBottom: "none", padding: 0 }}>
            <h2 className={`${styles.modalHeaderTitle} section-title`} style={{ margin: 0, fontSize: 18 }}>Edit User Profile</h2>
          </Modal.Header>
          {activeUser && (
            <Formik
              initialValues={{
                name: activeUser.name || "",
                email: activeUser.email || ""
              }}
              validationSchema={editUserSchema}
              onSubmit={handleEditUser}
            >
              {({ isSubmitting: formikSubmitting }) => (
                <Form style={{ marginTop: 20 }}>
                  {/* Name */}
                  <div style={{ marginBottom: 14 }}>
                    <label htmlFor="user-name-edit" className={styles.formLabel}>Full Name</label>
                    <Field id="user-name-edit" name="name" type="text" placeholder="Enter full name" className={styles.formField} />
                    <ErrorMessage name="name">{(msg) => <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{msg}</div>}</ErrorMessage>
                  </div>

                  {/* Email */}
                  <div style={{ marginBottom: 14 }}>
                    <label htmlFor="user-email-edit" className={styles.formLabel}>Email Address</label>
                    <Field id="user-email-edit" name="email" type="email" placeholder="Enter email address (e.g., name@domain.com)" className={styles.formField} />
                    <ErrorMessage name="email">{(msg) => <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{msg}</div>}</ErrorMessage>
                  </div>

                  {/* Footer Buttons */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      type="button"
                      className={`btn-outline-custom ${styles.modalFooterButton}`}
                      onClick={() => { setShowEditModal(false); setActiveUser(null); }}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary-custom"
                      style={{ padding: "8px 16px", fontSize: 13 }}
                      disabled={formikSubmitting || submitting}
                    >
                      {submitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          )}
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal show={showDeleteModal} onHide={() => { setShowDeleteModal(false); setActiveUser(null); }} centered>
        <div className="hcard p-4 border-0">
          <Modal.Header closeButton style={{ borderBottom: "none", padding: 0 }}>
            <h2 className={`${styles.modalHeaderTitle} section-title text-danger`} style={{ margin: 0, fontSize: 18 }}>Delete User Profile</h2>
          </Modal.Header>
          {activeUser && (
            <div className={styles.deleteModalText}>
              <p style={{ fontSize: 14, color: "var(--text-dark)", lineHeight: 1.6, marginBottom: 24 }}>
                Are you sure you want to permanently delete the profile for <strong>{activeUser.name}</strong> ({activeUser.email})?
                This user will no longer be able to log in, and all associated media profiles will be purged. This action is irreversible.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="btn-outline-custom"
                  style={{ padding: "8px 16px", fontSize: 13 }}
                  onClick={() => { setShowDeleteModal(false); setActiveUser(null); }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600 }}
                  onClick={handleDeleteUser}
                  disabled={submitting}
                >
                  {submitting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}