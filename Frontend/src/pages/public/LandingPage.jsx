import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import authHeroVideo from "../../assets/authhero.mp4";
import s from "./LandingPage.module.css";

const STATS = [
  { value: "50K+", label: "Candidates Analyzed" },
  { value: "95%", label: "Match Accuracy" },
  { value: "10K+", label: "Interviews Scheduled" },
  { value: "500+", label: "Companies Using Joblio" },
];

const LOGOS = ["Google", "Microsoft", "Amazon", "Netflix", "Spotify", "Airbnb"];

const FEATURES = [
  { icon: "bi-person-lines-fill", color: "#1d2445", bg: "#EEF0F8", title: "AI CV Screening", desc: "Automatically extract and analyze data from thousands of resumes with pinpoint accuracy." },
  { icon: "bi-trophy-fill", color: "#0D9488", bg: "#CCFBF1", title: "Candidate Ranking", desc: "Proprietary algorithms rank candidates based on skill-match, cultural fit, and potential." },
  { icon: "bi-clipboard2-pulse-fill", color: "#374172", bg: "#E7E9F4", title: "AI Assessments", desc: "Generate role-specific dynamic tests that evaluate technical depth and soft skills." },
  { icon: "bi-chat-dots-fill", color: "#0F766E", bg: "#D9F5F0", title: "Automated Feedback", desc: "Deliver personalized, constructive feedback to every applicant, maintaining brand reputation." },
  { icon: "bi-diagram-3-fill", color: "#131933", bg: "#E2E4F0", title: "Smart Matching", desc: "AI matches the right candidates to the right roles based on multiple intelligent factors." },
  { icon: "bi-bar-chart-line-fill", color: "#0D9488", bg: "#CCFBF1", title: "Analytics & Insights", desc: "Real-time dashboards and reports to track your hiring performance and team productivity." },
];

const STEPS = [
  { num: "01", icon: "bi-plug-fill", title: "Connect & Integrate", desc: "Connect your ATS or upload resumes to get started." },
  { num: "02", icon: "bi-robot", title: "AI Screening", desc: "Our AI scans and analyzes candidates instantly." },
  { num: "03", icon: "bi-star-fill", title: "Rank & Shortlist", desc: "Top candidates are ranked based on match score." },
  { num: "04", icon: "bi-person-check-fill", title: "Human Interview", desc: "Review shortlisted candidates and conduct interviews." },
  { num: "05", icon: "bi-trophy-fill", title: "Hire the Best", desc: "Make confident, data-driven hiring decisions." },
];

const TESTIMONIALS = [
  { stars: 5, text: "Joblio has cut our time-to-hire by 70%. The AI matching is incredibly accurate and saves us hours every week.", name: "Jessica Martinez", role: "Head of Talent, TechCorp", initials: "JM", color: "#1d2445" },
  { stars: 5, text: "The best recruitment platform we've ever used. The insights and analytics help us make smarter hiring decisions.", name: "Mark Thompson", role: "HR Director, InnovateX", initials: "MT", color: "#0F766E" },
  { stars: 5, text: "Super easy to use and the AI assessments are a game changer! Highly recommended.", name: "Priya Sharma", role: "Talent Manager, GrowthLabs", initials: "PS", color: "#374172" },
];

const FAQS = [
  { q: "How does AI screening work?", a: "Our AI analyzes resumes using NLP and ML to extract skills, experience, and match them against your job requirements automatically." },
  { q: "How accurate are the match scores?", a: "Our matching algorithm achieves 95% accuracy based on data from over 50,000 successful placements." },
  { q: "Can I upload resumes manually?", a: "Yes! You can upload resumes in bulk via CSV, PDF, or connect directly to your existing ATS." },
  { q: "Can I integrate with my existing ATS?", a: "Joblio integrates with all major ATS platforms including Greenhouse, Lever, Workday, and more." },
  { q: "Is my data safe and secure?", a: "We use enterprise-grade encryption and are fully GDPR compliant. Your data is never shared with third parties." },
  { q: "Is Joblio free to use?", a: "We offer a free trial with full access. No credit card required to get started." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

const slideLeft = {
  hidden: { opacity: 0, x: -28 },
  visible: { opacity: 1, x: 0 },
};

const slideRight = {
  hidden: { opacity: 0, x: 28 },
  visible: { opacity: 1, x: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const viewport = { once: true, amount: 0.2 };

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      {/* Hero */}
      <section className={`${s.hero} ${s.heroVideo}`}>
        <video
          className={s.heroVideoBg}
          src={authHeroVideo}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className={s.heroVideoOverlay} aria-hidden="true" />
        <motion.div
          className={s.heroGlow}
          aria-hidden="true"
          animate={{ opacity: [0.15, 0.28, 0.15], scale: [1, 1.08, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className={`container ${s.heroContent}`}>
          <div className="row justify-content-center">
            <motion.div
              className={`col-12 col-lg-8 text-center ${s.heroCopy}`}
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div className={s.badge} variants={fadeUp} transition={{ duration: 0.55 }}>
                <i className={`bi bi-stars me-2 ${s.badgeIcon}`} />
                Revolutionizing Recruitment
              </motion.div>
              <motion.h1 className={s.heroTitle} variants={fadeUp} transition={{ duration: 0.6 }}>
                AI-Powered <span className={s.highlightText}>Recruitment</span> Platform
              </motion.h1>
              <motion.p className={s.heroDesc} variants={fadeUp} transition={{ duration: 0.6 }}>
                The future of hiring is human-centered and AI-driven. Automate the mundane and focus on what truly matters: finding the perfect fit.
              </motion.p>
              <motion.div className={`d-flex flex-wrap justify-content-center gap-3 mb-4 ${s.heroBtns}`} variants={fadeUp} transition={{ duration: 0.6 }}>
                <motion.button
                  className={`btn-primary-custom ${s.btnLgCustom} ${s.getStartedBtn}`}
                  onClick={() => navigate("/register")}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Get Started Free <i className="bi bi-arrow-right ms-1" />
                </motion.button>
                <motion.button
                  className={`btn-outline-custom ${s.btnLgCustom} ${s.btnOutlineLight}`}
                  onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Demo
                </motion.button>
              </motion.div>
              <motion.div className={`d-flex align-items-center justify-content-center gap-2 ${s.heroSocial}`} variants={fadeUp} transition={{ duration: 0.6 }}>
                <div className={s.avatarGroup}>
                  {["#1d2445", "#0EA5E9", "#10B981", "#F43F5E"].map((c, i) => (
                    <motion.div
                      key={c}
                      className={s.avatar}
                      style={{ background: c, marginLeft: i ? -10 : 0 }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.08, type: "spring", stiffness: 260 }}
                    />
                  ))}
                </div>
                <span className={s.heroSocialText}>
                  <strong className={s.heroSocialStrong}>Join 500+ companies</strong> already hiring smarter
                </span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <motion.section
        className={s.trusted}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={fadeIn}
        transition={{ duration: 0.6 }}
      >
        <div className="container">
          <p className={s.trustedLabel}>Trusted by modern teams worldwide</p>
          <motion.div className={s.logoRow} variants={stagger} initial="hidden" whileInView="visible" viewport={viewport}>
            {LOGOS.map((logo) => (
              <motion.span key={logo} className={s.logoItem} variants={fadeUp} whileHover={{ y: -3, color: "var(--primary)" }}>
                {logo}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Stats */}
      <section className={s.statsSection}>
        <div className="container">
          <motion.div className="row g-3" variants={stagger} initial="hidden" whileInView="visible" viewport={viewport}>
            {STATS.map((st) => (
              <div key={st.label} className="col-6 col-md-3">
                <motion.div
                  className={s.statCard}
                  variants={scaleIn}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -6, boxShadow: "0 12px 32px rgba(29,36,69,0.12)" }}
                >
                  <div className={s.statValue}>{st.value}</div>
                  <div className={s.statLabel}>{st.label}</div>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={s.tealSection}>
        <div className="container">
          <motion.div
            className="text-center mb-5"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            <div className={s.sectionEyebrow}>POWERFUL FEATURES</div>
            <h2 className={s.sectionTitle}>Everything you need to hire better</h2>
            <p className={s.sectionDesc}>Our AI tools help you attract, evaluate and hire the best talent 10x faster.</p>
          </motion.div>
          <motion.div className="row g-4" variants={stagger} initial="hidden" whileInView="visible" viewport={viewport}>
            {FEATURES.map((f) => (
              <div key={f.title} className="col-12 col-sm-6 col-lg-4">
                <motion.div
                  className={s.featureCard}
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -8, boxShadow: "0 16px 40px rgba(29,36,69,0.1)" }}
                >
                  <motion.div
                    className={s.featureIcon}
                    style={{ background: f.bg }}
                    whileHover={{ rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <i className={`bi ${f.icon}`} style={{ color: f.color, fontSize: 22 }} />
                  </motion.div>
                  <div className={s.featureTitle}>{f.title}</div>
                  <p className={s.featureDesc}>{f.desc}</p>
                  <a href="#features" className={s.learnMore}>Learn more →</a>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className={s.whiteSection}>
        <div className="container">
          <div className="row align-items-center g-5">
            <motion.div
              className="col-12 col-lg-5"
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              variants={slideLeft}
              transition={{ duration: 0.65 }}
            >
              <div className={s.sectionEyebrow}>REAL-TIME DASHBOARD</div>
              <h2 className={`${s.sectionTitle} ${s.textLeft}`}>
                All your hiring in one intelligent dashboard
              </h2>
              <p className={s.dashboardDesc}>
                Get a complete overview of your recruitment pipeline, candidate quality, and team performance in real-time.
              </p>
              <ul className={s.checkList}>
                {["Track every candidate in your pipeline", "AI-powered match scores & insights", "Team collaboration made simple", "Data-driven hiring decisions"].map((item) => (
                  <li key={item} className={s.checkItem}>
                    <i className={`bi bi-check-circle-fill ${s.checkIcon}`} />
                    {item}
                  </li>
                ))}
              </ul>
              <motion.button
                className={`btn-primary-custom ${s.exploreBtn}`}
                onClick={() => navigate("/login")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Explore Dashboard →
              </motion.button>
            </motion.div>
            <motion.div
              className="col-12 col-lg-7"
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              variants={slideRight}
              transition={{ duration: 0.65, delay: 0.1 }}
            >
              <motion.div
                className={s.dashboardMock}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className={s.dashHeader}>
                  <span className={s.dashBrand}>⚡ Joblio</span>
                  <span className={s.dashWelcome}>Welcome back, Sarah 👋</span>
                </div>
                <div className={s.dashStats}>
                  {[{ label: "Candidates", val: "12,642", up: "+10.3%" }, { label: "Interviews", val: "32", up: "+48.0%" }, { label: "Hired", val: "156", up: "+12.2%" }, { label: "Days to Hire", val: "28", up: "+1.1%" }].map((d) => (
                    <div key={d.label} className={s.dashStat}>
                      <div className={s.dashStatLabel}>{d.label}</div>
                      <div className={s.dashStatValue}>{d.val}</div>
                      <div className={s.dashStatTrend}>{d.up}</div>
                    </div>
                  ))}
                </div>
                <div className={s.dashCandidatesWrap}>
                  <div className={s.dashCandidatesTitle}>Top Candidates</div>
                  {[{ name: "John Smith", score: 94, skills: "React, Node.js" }, { name: "Sarah Johnson", score: 92, skills: "Python, ML" }, { name: "Michael Lee", score: 89, skills: "Java, Spring" }].map((c) => (
                    <div key={c.name} className={s.dashRow}>
                      <div className={s.dashAvatar}>{c.name[0]}</div>
                      <div className={s.dashCandidateInfo}>
                        <div className={s.dashCandidateName}>{c.name}</div>
                        <div className={s.dashCandidateSkills}>{c.skills}</div>
                      </div>
                      <div className={s.dashCandidateScore}>{c.score}%</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className={s.tealSection}>
        <div className="container">
          <motion.div
            className="text-center mb-5"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            <div className={s.sectionEyebrow}>HOW IT WORKS</div>
            <h2 className={s.sectionTitle}>A smarter hiring process in 5 simple steps</h2>
          </motion.div>
          <motion.div className="row g-4" variants={stagger} initial="hidden" whileInView="visible" viewport={viewport}>
            {STEPS.map((st, i) => (
              <div key={st.num} className={`col-12 col-sm-6 col-lg ${s.stepCol}`}>
                {i < STEPS.length - 1 && <div className={`${s.stepConnector} d-none d-lg-block`} />}
                <motion.div
                  className={s.stepCard}
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -6 }}
                >
                  <div className={s.stepNum}>{st.num}</div>
                  <div className={s.stepIconWrap}>
                    <i className={`bi ${st.icon} ${s.stepIcon}`} />
                  </div>
                  <div className={s.stepTitle}>{st.title}</div>
                  <p className={s.stepDesc}>{st.desc}</p>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={s.whiteSection}>
        <div className="container">
          <motion.div
            className="text-center mb-5"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            <div className={s.sectionEyebrow}>WHAT OUR CUSTOMERS SAY</div>
            <h2 className={s.sectionTitle}>Loved by recruitment teams</h2>
          </motion.div>
          <motion.div className="row g-4" variants={stagger} initial="hidden" whileInView="visible" viewport={viewport}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="col-12 col-md-4">
                <motion.div
                  className={s.testimonialCard}
                  variants={scaleIn}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -6 }}
                >
                  <div className={s.starsWrap}>
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <i key={j} className={`bi bi-star-fill ${s.starIcon}`} />
                    ))}
                  </div>
                  <p className={s.testimonialText}>"{t.text}"</p>
                  <div className="d-flex align-items-center gap-3">
                    <div className={s.testimonialAvatar} style={{ background: t.color }}>{t.initials}</div>
                    <div>
                      <div className={s.testimonialAuthor}>{t.name}</div>
                      <div className={s.testimonialRole}>{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className={s.tealSection}>
        <div className="container">
          <motion.div
            className="text-center mb-5"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            <div className={s.sectionEyebrow}>FREQUENTLY ASKED QUESTIONS</div>
            <h2 className={s.sectionTitle}>Have questions? We've got answers.</h2>
          </motion.div>
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10">
              <motion.div className="row g-3" variants={stagger} initial="hidden" whileInView="visible" viewport={viewport}>
                {FAQS.map((faq, i) => (
                  <div key={faq.q} className="col-12 col-md-6">
                    <motion.div
                      className={`${s.faqCard} ${openFaq === i ? s.faqCardOpen : ""}`}
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      variants={fadeUp}
                      whileHover={{ scale: 1.01 }}
                      layout
                    >
                      <div className={s.faqQ}>
                        <span>{faq.q}</span>
                        <motion.i
                          className={`bi bi-chevron-down ${s.faqArrow}`}
                          animate={{ rotate: openFaq === i ? 180 : 0 }}
                          transition={{ duration: 0.25 }}
                        />
                      </div>
                      <motion.div
                        initial={false}
                        animate={{
                          height: openFaq === i ? "auto" : 0,
                          opacity: openFaq === i ? 1 : 0,
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={s.faqAnswerWrap}
                      >
                        <p className={s.faqA}>{faq.a}</p>
                      </motion.div>
                    </motion.div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <motion.section
        className={s.ctaSection}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={stagger}
      >
        <div className={s.ctaGlow} />
        <div className={s.ctaGlow2} />
        <div className={`container ${s.ctaContent}`}>
          <div className="row align-items-center justify-content-between g-4">
            <motion.div
              className="col-12 col-lg-7 text-center text-lg-start"
              variants={slideLeft}
              transition={{ duration: 0.6 }}
            >
              <h2 className={s.ctaTitle}>
                Ready to hire smarter?
              </h2>
              <p className={s.ctaDesc}>
                Join 500+ companies already using Joblio to build amazing teams.
              </p>
            </motion.div>
            <motion.div
              className="col-12 col-lg-4 text-center text-lg-end"
              variants={slideRight}
              transition={{ duration: 0.6 }}
            >
              <motion.button
                className={s.ctaBtn}
                onClick={() => navigate("/register")}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Get Started Free →
              </motion.button>
              <p className={s.ctaDisclaimer}>
                No credit card required • Free forever
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </>
  );
}
