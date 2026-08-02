import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { getCategories } from "../../services/categoryService";
import { getAllUsers } from "../../services/userService";
import { getJobs } from "../../services/jobService";
import LoadingState from "../../components/common/LoadingState";
import styles from "./AdminDashboard.module.css";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [jobsCount, setJobsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [cats, users, jobs] = await Promise.all([
          getCategories(),
          getAllUsers({ limit: 1 }), // efficient query to count total users
          getJobs()
        ]);
        setCategoriesCount(cats.length);
        setUsersCount(users.total || (users.users?.length ?? 0));
        setJobsCount(jobs.total ?? jobs.jobs?.length ?? 0);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) return <LoadingState message="Loading dashboard statistics..." />;

  const statCards = [
    {
      label: "Total Categories",
      value: categoriesCount,
      icon: "bi-tags-fill",
      bgColor: "#f3f5fb",
      iconColor: "#1d2445",
      actionLabel: "Manage",
      onClick: () => navigate("/admin/categories")
    },
    {
      label: "Total Registered Users",
      value: usersCount,
      icon: "bi-people-fill",
      bgColor: "#E0F2FE", // pastel blue
      iconColor: "#0284C7",
      linkTo: "/admin/users"
    },
    {
      label: "Active Jobs",
      value: jobsCount,
      icon: "bi-briefcase-fill",
      bgColor: "#DCFCE7", // pastel green
      iconColor: "#15803D",
      linkTo: "/admin/jobs"
    }
  ];

  return (
    <>
      <div className="page-header-row">
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>
            System overview and data administration panel. Welcome back, {user?.name || "Administrator"}.
          </p>
        </div>
      </div>

<div className="row g-4 mb-4">
  {statCards.map((card) => (
    <div key={card.label} className="col-12 col-md-4">
        <div className={`border-0 shadow-sm d-flex justify-content-between align-items-center p-4 ${styles.statCard}`} style={{ backgroundColor: card.bgColor }}>
        <div className="d-flex flex-column">
          <div className={styles.statLabel}>{card.label}</div>
          <div className={styles.statValue}>{card.value}</div>
        </div>
        {card.onClick ? (
          <button type="button" onClick={card.onClick} className={`btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center ${styles.iconBtn}`}>
            <i className="bi bi-arrow-right-short fs-4"></i>
          </button>
        ) : card.linkTo ? (
          <Link to={card.linkTo} className={`btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center ${styles.iconBtn}`}>
            <i className="bi bi-arrow-right-short fs-4"></i>
          </Link>
        ) : null}
      </div>
    </div>
  ))}
</div>

        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className={`hcard ${styles.taskCard}`}>
              <h2 className={`section-title ${styles.taskTitle}`}>
                Quick Admin Tasks
              </h2>
              <p className={styles.taskDesc}>
                Use the category manager to review and add job tags. These categories dictate options when recruiter HRs submit job vacancies and candidates browse or filter open roles.
              </p>
              <button
                type="button"
                className="btn-outline-custom"
                onClick={() => navigate("/admin/categories")}
              >
                Launch Category Module
              </button>
            </div>
          </div>
        </div>
    </>
  );
}