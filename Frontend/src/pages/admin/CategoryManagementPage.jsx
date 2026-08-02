import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";
import { Modal } from "react-bootstrap";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../utils/errorMessages";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from "../../services/categoryService";
import LoadingState from "../../components/common/LoadingState";
import styles from "./CategoryManagementPage.module.css";

// Validation schema for category operations
const categorySchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name is too long")
    .required("Category name is required")
});

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch categories
  const loadCategories = async () => {
    try {
      const data = await getCategories();
      // Sort alphabetically by name
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
      setCategories(sorted);
    } catch (err) {
      toast.error("Failed to load categories");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Handlers
  const handleAddCategory = async (values, { resetForm }) => {
    setSubmitting(true);
    try {
      const newCat = await createCategory({ name: values.name.trim() });
      toast.success(`Category "${newCat.name}" created successfully`);
      setShowAddModal(false);
      resetForm();
      loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create category"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCategory = async (values) => {
    setSubmitting(true);
    try {
      const updated = await updateCategory(activeCategory._id, {
        name: values.name.trim()
      });
      toast.success(`Category updated to "${updated.name}"`);
      setShowEditModal(false);
      setActiveCategory(null);
      loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update category"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    setSubmitting(true);
    try {
      await deleteCategory(activeCategory._id);
      toast.success(`Category "${activeCategory.name}" removed successfully`);
      setShowDeleteModal(false);
      setActiveCategory(null);
      loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove category"));
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingState message="Fetching system categories..." />;

  return (
    <>
      {/* Page Header */}
      <div className="page-header-row mb-4">
        <div>
          <h1 className={styles.pageTitle}>Category Management</h1>
          <p className={styles.pageSubtitle}>
            Create, update, and manage job tags used for posting new jobs and candidate profile matching.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary-custom"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-plus-lg me-2" aria-hidden="true" /> Add Category
        </button>
      </div>

      {/* Main Container */}
      <div className={`hcard ${styles.cardPadding}`}>
        {/* Search and Filters */}
        <div className={styles.controlsContainer}>
          <div className={`topbar .search-box ${styles.searchBoxContainer}`}>
            <i className="bi bi-search text-muted" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search categories by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Categories Table */}
        <div className="table-responsive">
          <table className="htable">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Date Created</th>
                <th className={styles.actionsHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="3" className={styles.emptyStateCell}>
                    <i className={`bi bi-tag ${styles.emptyStateIcon}`} aria-hidden="true" />
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat._id}>
                    <td>
                      <span className={`badge-status badge-shortlisted ${styles.badgePadding}`}>
                        {cat.name}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(cat.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionsFlex}>
                        <button
                          type="button"
                          className={`topbar-icon-btn ${styles.iconBtnSmall}`}
                          onClick={() => {
                            setActiveCategory(cat);
                            setShowEditModal(true);
                          }}
                          title="Edit Category"
                          aria-label={`Edit category ${cat.name}`}
                        >
                          <i className="bi bi-pencil" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={`topbar-icon-btn ${styles.iconBtnSmall}`}
                          onClick={() => {
                            setActiveCategory(cat);
                            setShowDeleteModal(true);
                          }}
                          title="Delete Category"
                          aria-label={`Delete category ${cat.name}`}
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
      </div>

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <div className="hcard p-4 border-0">
          <Modal.Header closeButton className={styles.modalHeader}>
            <h2 className={`section-title ${styles.modalHeaderTitle}`}>Add New Category</h2>
          </Modal.Header>
          <Formik
            initialValues={{ name: "" }}
            validationSchema={categorySchema}
            onSubmit={handleAddCategory}
          >
            {({ isSubmitting: formikSubmitting }) => (
              <Form className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="cat-name-add" className={styles.formLabel}>
                    Category Name
                  </label>
                  <Field
                    id="cat-name-add"
                    name="name"
                    type="text"
                    placeholder="e.g. Sales, Data Science"
                    className={styles.formInput}
                  />
                  <ErrorMessage name="name">
                    {(msg) => (
                      <div className={styles.errorMsg}>{msg}</div>
                    )}
                  </ErrorMessage>
                </div>
                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={`btn-outline-custom ${styles.footerBtn}`}
                    onClick={() => setShowAddModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn-primary-custom ${styles.footerBtn}`}
                    disabled={formikSubmitting || submitting}
                  >
                    {submitting ? "Creating..." : "Create Category"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setActiveCategory(null); }} centered>
        <div className="hcard p-4 border-0">
          <Modal.Header closeButton className={styles.modalHeader}>
            <h2 className={`section-title ${styles.modalHeaderTitle}`}>Edit Category</h2>
          </Modal.Header>
          {activeCategory && (
            <Formik
              initialValues={{ name: activeCategory.name }}
              validationSchema={categorySchema}
              onSubmit={handleEditCategory}
            >
              {({ isSubmitting: formikSubmitting }) => (
                <Form className={styles.modalForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="cat-name-edit" className={styles.formLabel}>
                      Category Name
                    </label>
                    <Field
                      id="cat-name-edit"
                      name="name"
                      type="text"
                      className={styles.formInput}
                    />
                    <ErrorMessage name="name">
                      {(msg) => (
                        <div className={styles.errorMsg}>{msg}</div>
                      )}
                    </ErrorMessage>
                  </div>
                  <div className={styles.modalFooter}>
                    <button
                      type="button"
                      className={`btn-outline-custom ${styles.footerBtn}`}
                      onClick={() => { setShowEditModal(false); setActiveCategory(null); }}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`btn-primary-custom ${styles.footerBtn}`}
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

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => { setShowDeleteModal(false); setActiveCategory(null); }} centered>
        <div className="hcard p-4 border-0">
          <Modal.Header closeButton className={styles.modalHeader}>
            <h2 className={`section-title text-danger ${styles.modalHeaderTitle}`}>Remove Category</h2>
          </Modal.Header>
          {activeCategory && (
            <div className={styles.modalForm}>
              <p className={styles.deleteModalText}>
                Are you sure you want to delete the category <strong>{activeCategory.name}</strong>?
                This will make jobs classified under this category lose their category name grouping. This action is irreversible.
              </p>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={`btn-outline-custom ${styles.footerBtn}`}
                  onClick={() => { setShowDeleteModal(false); setActiveCategory(null); }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn-danger ${styles.deleteBtn}`}
                  onClick={handleDeleteCategory}
                  disabled={submitting}
                >
                  {submitting ? "Removing..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
