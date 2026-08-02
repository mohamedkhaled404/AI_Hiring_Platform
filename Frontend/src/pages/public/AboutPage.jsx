import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getAboutContent } from "../../services/contentService";
import LoadingState from "../../components/common/LoadingState";
import BackButton from "../../components/common/BackButton";
import styles from "./AboutPage.module.css";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const ctaViewport = { once: true, amount: 0.3 };

const TEAM_MEMBERS = [
  { name: "Yousef Aboelgheit", initials: "YA", role: "Backend & AI Developer" },
  { name: "Abanob Maqqar", initials: "AM", role: "Backend & AI Developer" },
    { name: "Waleed Mamdouh", initials: "WM", role: "Backend Developer" },
  { name: "Mohamed Khaled", initials: "MK", role: "Frontend Developer" },
  { name: "Sara El-Amir", initials: "SE", role: "Frontend Developer" },
  { name: "Shahd Amr", initials: "SA", role: "Backend Developer" },
];

export default function AboutPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAboutContent()
      .then(setContent)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading..." />;
  if (!content) return null;

  return (
    <>
      {/* Hero — animates on load, not on scroll, since it's above the fold */}
      <section className="public-section landing-hero" style={{ paddingBottom: 48 }}>
        <div className="container">
          <BackButton fallbackTo="/" label="Back to Home" />
          <div className="row justify-content-center">
            <motion.div
              className="col-12 col-lg-8 text-center"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div className="landing-hero-badge" variants={fadeUp} transition={{ duration: 0.5 }}>
                <i className="bi bi-info-circle" aria-hidden="true" /> About Joblio
              </motion.div>
              <motion.h1 className="landing-hero-title" variants={fadeUp} transition={{ duration: 0.6 }}>
                Building the Future of <span style={{ color: "var(--primary)" }}>Intelligent Hiring</span>
              </motion.h1>
              <motion.p
                className="landing-hero-desc mx-auto"
                style={{ maxWidth: 640 }}
                variants={fadeUp}
                transition={{ duration: 0.6 }}
              >
                Joblio is an AI-powered recruitment platform that helps companies find, evaluate, and hire top talent — while giving every candidate a fair, transparent experience.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission / Vision — scroll reveal */}
      <section className="public-section-sm bg-white">
        <div className="container">
          <motion.div
            className="row g-4"
            initial="hidden"
            whileInView="visible"
            viewport={ctaViewport}
            variants={stagger}
          >
            <motion.div className="col-12 col-md-6" variants={fadeUp} transition={{ duration: 0.5 }}>
              <motion.div className="hcard p-4 p-lg-5 h-100" whileHover={{ y: -4 }}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-bullseye fs-4 text-primary" aria-hidden="true" />
                  <h2 className="fs-4 fw-bold mb-0">Our Mission</h2>
                </div>
                <p className="text-muted mb-0 lh-lg">{content.mission}</p>
              </motion.div>
            </motion.div>
            <motion.div className="col-12 col-md-6" variants={fadeUp} transition={{ duration: 0.5 }}>
              <motion.div className="hcard p-4 p-lg-5 h-100" whileHover={{ y: -4 }}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-eye fs-4 text-primary" aria-hidden="true" />
                  <h2 className="fs-4 fw-bold mb-0">Our Vision</h2>
                </div>
                <p className="text-muted mb-0 lh-lg">{content.vision}</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits — scroll reveal */}
      <section className="public-section" style={{ background: "var(--body-bg)" }}>
        <div className="container">
          <motion.div
            className="text-center mb-5"
            initial="hidden"
            whileInView="visible"
            viewport={ctaViewport}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            <h2 className={styles.sectionHeading}>AI Recruitment Benefits</h2>
            <p className="text-muted">Why modern teams choose Joblio for their hiring pipeline.</p>
          </motion.div>
          <motion.div
            className="row g-4"
            initial="hidden"
            whileInView="visible"
            viewport={ctaViewport}
            variants={stagger}
          >
            {content.benefits.map((b) => (
              <motion.div key={b.title} className="col-12 col-sm-6 col-lg-3" variants={fadeUp} transition={{ duration: 0.5 }}>
                <motion.div className="hcard p-4 h-100" whileHover={{ y: -6 }}>
                  <div className={styles.featureIconWrap}>
                    <i className={`bi ${b.icon}`} aria-hidden="true" />
                  </div>
                  <div className="fw-bold mb-2">{b.title}</div>
                  <p className="text-muted small mb-0">{b.desc}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team — redesigned cards (3 per row, bigger avatar) + scroll reveal */}
      <section className="public-section-sm bg-white">
        <div className="container">
          <motion.div
            className="text-center mb-5"
            initial="hidden"
            whileInView="visible"
            viewport={ctaViewport}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
<h2 className={`${styles.sectionHeading} ${styles.jakartaFont}`}>Meet Our Team</h2>            <p className="text-muted">The people behind Joblio.</p>
          </motion.div>
          <motion.div
            className="row g-4 justify-content-center"
            initial="hidden"
            whileInView="visible"
            viewport={ctaViewport}
            variants={stagger}
          >
            {TEAM_MEMBERS.map((member) => (
              <motion.div key={member.name} className="col-12 col-sm-6 col-lg-4" variants={fadeUp} transition={{ duration: 0.5 }}>
                <motion.div className={`hcard h-100 text-center ${styles.teamCard}`} whileHover={{ y: -6 }}>
                  <div className={styles.teamAvatar}>{member.initials}</div>
                  <div className={styles.teamName}>{member.name}</div>
                  <div className={styles.teamRole}>{member.role}</div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <motion.section
        className={styles.ctaBanner}
        initial="hidden"
        whileInView="visible"
        viewport={ctaViewport}
        variants={stagger}
      >
        <div className="container">
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="text-white fw-bold mb-3">Ready to transform your hiring?</motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-white-75 mb-4">Join thousands of companies and candidates already using Joblio.</motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="d-flex flex-wrap gap-3 justify-content-center">
            <motion.button
              type="button"
              className={styles.btnCtaPrimary}
              onClick={() => navigate("/register")}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started
            </motion.button>
            <motion.button
              type="button"
              className={styles.btnCtaOutline}
              onClick={() => navigate("/")}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Back to Home
            </motion.button>
          </motion.div>
        </div>
      </motion.section>
    </>
  );
}