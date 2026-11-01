import "./landing.css"

type LandingDestination = "login" | "register"
type FeatureType = "projects" | "team" | "activity" | "twin"

function LandingLogo() {
  return (
    <div className="lp-logo">
      <div className="lp-logo-mark" aria-hidden="true">
        <span />
        <span />
        <i />
      </div>
      <span>DevOrbit</span>
    </div>
  )
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h11M11 6l4 4-4 4" />
    </svg>
  )
}

function FeatureIcon({ type }: { type: FeatureType }) {
  const paths = {
    projects: (
      <>
        <path d="M4 6.5h6l1.8-2H20v13H4z" />
        <path d="M7 11h10M7 14h6" />
      </>
    ),
    team: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6a3 3 0 0 1 0 5M17 14a5 5 0 0 1 4 5" />
      </>
    ),
    twin: (
      <>
        <circle cx="12" cy="12" r="2" />
        <circle cx="5" cy="7" r="1.5" />
        <circle cx="19" cy="6" r="1.5" />
        <circle cx="18" cy="18" r="1.5" />
        <circle cx="6" cy="18" r="1.5" />
        <path d="m6.5 8 4 3M13.5 10.5 18 7M13.5 13.5l3.5 3M10.5 13.5 7 17" />
      </>
    ),
    activity: (
      <>
        <path d="M3 12h4l2.2-6 4 12 2.2-6H21" />
        <path d="M4 21h16" />
      </>
    ),
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {paths[type]}
    </svg>
  )
}

function AvatarStack() {
  return (
    <div className="lp-avatar-stack" aria-label="Illustrative project team">
      <span>AM</span>
      <span>RK</span>
      <span>JL</span>
      <i>+2</i>
    </div>
  )
}

function ProductPreview() {
  return (
    <div className="lp-product-stage">
      <div className="lp-network" aria-hidden="true">
        <span className="ring ring-one" />
        <span className="ring ring-two" />
        <i className="network-node node-a" />
        <i className="network-node node-b" />
        <i className="network-node node-c" />
        <svg viewBox="0 0 640 520" preserveAspectRatio="none">
          <path d="M72 117 247 76 483 118 566 318 345 447 123 357 72 117M247 76 345 447M483 118 123 357" />
        </svg>
      </div>

      <div className="lp-product-window">
        <div className="lp-window-bar">
          <div className="lp-window-dots"><i /><i /><i /></div>
          <span>Workspace overview</span>
          <div className="lp-window-user">AD</div>
        </div>
        <div className="lp-window-body">
          <aside className="lp-window-nav">
            <LandingLogo />
            <span className="active"><FeatureIcon type="projects" /> Overview</span>
            <span><FeatureIcon type="projects" /> Projects</span>
            <span><FeatureIcon type="team" /> Team</span>
            <span><FeatureIcon type="twin" /> Career Twin</span>
          </aside>
          <div className="lp-window-content">
            <div className="lp-window-heading">
              <div><small>Good morning</small><strong>Your developer workspace</strong></div>
              <span>Illustrative preview</span>
            </div>
            <div className="lp-window-grid">
              <section className="lp-project-panel">
                <div className="lp-panel-head"><strong>Active projects</strong><span>View all</span></div>
                <div className="lp-project-item">
                  <div className="lp-project-glyph indigo">DS</div>
                  <div><strong>Design system migration</strong><span>Platform · In progress</span><i className="lp-bar bar-a"><b /></i></div>
                </div>
                <div className="lp-project-item">
                  <div className="lp-project-glyph blue">DP</div>
                  <div><strong>Developer portal</strong><span>Web app · Planning</span><i className="lp-bar bar-b"><b /></i></div>
                </div>
                <div className="lp-project-foot"><AvatarStack /><span>Illustrative workspace</span></div>
              </section>

              <section className="lp-orbit-panel">
                <div className="lp-panel-head"><strong>Developer orbit</strong><span>Sample</span></div>
                <div className="lp-mini-orbit">
                  <svg viewBox="0 0 210 130" aria-hidden="true">
                    <ellipse cx="105" cy="65" rx="76" ry="42" />
                    <path d="M105 65 39 43M105 65 170 35M105 65 165 97M105 65 54 104" />
                  </svg>
                  <span className="orbit-person">AD</span>
                  <i className="orbit-point point-a">P</i>
                  <i className="orbit-point point-b">S</i>
                  <i className="orbit-point point-c">T</i>
                  <i className="orbit-point point-d">G</i>
                </div>
                <div className="lp-orbit-legend"><span><i /> Projects</span><span><i /> Skills</span></div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-float-card lp-float-task">
        <div className="lp-float-icon"><FeatureIcon type="activity" /></div>
        <div><small>Task activity</small><strong>Review moved forward</strong><span>Design system migration</span></div>
        <i className="lp-status-dot" />
      </div>

      <div className="lp-float-card lp-float-team">
        <div><small>Team collaboration</small><strong>Project orbit</strong></div>
        <AvatarStack />
      </div>

      <div className="lp-float-card lp-float-skill">
        <div className="lp-skill-node"><span /><i /><i /><i /></div>
        <div><small>Career Twin · Sample</small><strong>Skill evidence connected</strong><span>Project contribution added</span></div>
      </div>
    </div>
  )
}

function FeaturePreview({ type }: { type: FeatureType }) {
  if (type === "projects") {
    return (
      <div className="lp-feature-preview project-preview">
        <div><span>API documentation</span><strong>In progress</strong></div>
        <i className="lp-bar bar-feature"><b /></i>
        <div className="lp-feature-task"><i /> Define endpoint contracts <span>Review</span></div>
        <div className="lp-feature-task"><i /> Add usage examples <span>Next</span></div>
      </div>
    )
  }

  if (type === "team") {
    return (
      <div className="lp-feature-preview team-preview">
        <svg viewBox="0 0 250 112" aria-hidden="true">
          <path d="M40 57 124 28 207 56 126 91 40 57M124 28 126 91" />
        </svg>
        <span className="team-node team-one">AM</span>
        <span className="team-node team-two">RK</span>
        <span className="team-node team-three">JL</span>
        <span className="team-node team-center">P</span>
      </div>
    )
  }

  if (type === "activity") {
    return (
      <div className="lp-feature-preview activity-preview">
        <div><i /><span><strong>Pull request reviewed</strong><small>Design system migration</small></span><em>Now</em></div>
        <div><i /><span><strong>Task completed</strong><small>API documentation</small></span><em>Earlier</em></div>
        <div><i /><span><strong>Milestone updated</strong><small>Developer portal</small></span><em>Mon</em></div>
      </div>
    )
  }

  return (
    <div className="lp-feature-preview twin-preview">
      <div className="lp-twin-constellation">
        <svg viewBox="0 0 260 112" aria-hidden="true">
          <path d="M38 72 91 29 149 55 213 25 225 89 149 55 115 96 38 72" />
        </svg>
        <i className="skill-one" /><i className="skill-two" /><i className="skill-three" /><i className="skill-four" />
      </div>
      <div className="lp-skill-labels"><span>Architecture</span><span>Collaboration</span><span>Delivery</span></div>
    </div>
  )
}

const features: {
  type: FeatureType
  index: string
  title: string
  copy: string
}[] = [
  {
    type: "projects",
    index: "01",
    title: "Projects & Tasks",
    copy: "Plan work, connect tasks to outcomes, and keep technical context attached to delivery.",
  },
  {
    type: "team",
    index: "02",
    title: "Team Collaboration",
    copy: "See project ownership and contribution relationships without losing sight of the people doing the work.",
  },
  {
    type: "activity",
    index: "03",
    title: "Developer Activity",
    copy: "Turn meaningful project events into a coherent, inspectable record of progress.",
  },
  {
    type: "twin",
    index: "04",
    title: "Career Twin",
    copy: "Connect verified work evidence to skills, growth areas, and practical next-step recommendations.",
  },
]

function WorkflowSection() {
  return (
    <section className="lp-workflow">
      <div className="lp-workflow-copy">
        <div className="lp-section-kicker">From delivery to development</div>
        <h2>Your work already contains the evidence.</h2>
        <p>
          DevOrbit is designed to preserve the path from a project contribution to a
          useful career signal—without presenting illustrative data as a real
          assessment.
        </p>
        <div className="lp-workflow-note"><i /> Career intelligence requires verified project evidence.</div>
      </div>
      <div className="lp-workflow-track">
        <div className="lp-workflow-line" aria-hidden="true" />
        <article>
          <span>01</span>
          <div className="lp-workflow-icon"><FeatureIcon type="projects" /></div>
          <div><small>Project work</small><strong>Ship meaningful contributions</strong><p>Tasks, decisions, and delivery context stay connected.</p></div>
        </article>
        <article>
          <span>02</span>
          <div className="lp-workflow-icon"><FeatureIcon type="activity" /></div>
          <div><small>Evidence</small><strong>Capture the work signal</strong><p>Relevant activity becomes traceable supporting evidence.</p></div>
        </article>
        <article>
          <span>03</span>
          <div className="lp-workflow-icon violet"><FeatureIcon type="twin" /></div>
          <div><small>Career Twin</small><strong>Build a clearer growth view</strong><p>Verified evidence can support skills and recommendations.</p></div>
        </article>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="lp-header">
        <a className="lp-brand-link" href="/" aria-label="DevOrbit home"><LandingLogo /></a>
        <div className="lp-header-center"><span>Product</span><span>Career Twin</span><span>Workflow</span></div>
        <nav className="lp-nav" aria-label="Landing navigation">
          <a className="lp-login" href="/login">Log in</a>
          <a className="lp-button small" href="/register">Get Started</a>
        </nav>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <div className="lp-eyebrow"><i /> Developer work, connected</div>
            <h1>Your work tells a story. <span>Make it visible.</span></h1>
            <p>
              DevOrbit connects project management, team collaboration, developer
              contributions, and Career Twin intelligence in one focused workspace.
            </p>
            <div className="lp-hero-actions">
              <a className="lp-button" href="/register">Get Started <ArrowIcon /></a>
              <a className="lp-secondary" href="/login">Log in</a>
            </div>
            <div className="lp-hero-footnote"><span /><p>Built to connect delivery context with developer growth.</p></div>
          </div>
          <ProductPreview />
        </section>

        <section className="lp-value-strip" aria-label="DevOrbit product values">
          <div><span>01</span><strong>One connected workspace</strong><p>Projects, people, and contributions stay in context.</p></div>
          <div><span>02</span><strong>Evidence over assumptions</strong><p>Career insights are designed around verified work.</p></div>
          <div><span>03</span><strong>Built for clarity</strong><p>Useful signals without noisy dashboards or invented claims.</p></div>
        </section>

        <section className="lp-features">
          <div className="lp-section-intro">
            <div className="lp-section-kicker">A connected product system</div>
            <h2>Everything around the work, working together.</h2>
            <p>
              Move from planning to collaboration to growth without fragmenting the
              story across disconnected tools.
            </p>
          </div>
          <div className="lp-feature-grid">
            {features.map((feature) => (
              <article className={`lp-feature feature-${feature.type}`} key={feature.title}>
                <div className="lp-feature-top">
                  <div className="lp-feature-icon"><FeatureIcon type={feature.type} /></div>
                  <span>{feature.index}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
                <FeaturePreview type={feature.type} />
              </article>
            ))}
          </div>
        </section>

        <WorkflowSection />

        <section className="lp-final">
          <div className="lp-final-grid" aria-hidden="true" />
          <div className="lp-final-orbit" aria-hidden="true"><i /><i /><span /></div>
          <div className="lp-section-kicker">Start with the work you already do</div>
          <h2>Build your developer story<br />as you build your projects.</h2>
          <p>Bring your work, your team, and your growth into one clear workspace.</p>
          <div className="lp-hero-actions">
            <a className="lp-button" href="/register">Get Started <ArrowIcon /></a>
            <a className="lp-secondary" href="/login">Log in</a>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-brand"><LandingLogo /><p>Project intelligence for developer teams.</p></div>
        <div className="lp-footer-status"><i /><span>Product preview uses illustrative data</span></div>
        <div><a href="/login">Log in</a><a href="/register">Create account</a><span>© DevOrbit</span></div>
      </footer>
    </div>
  )
}

export function AuthDestination({ type }: { type: LandingDestination }) {
  const isLogin = type === "login"
  return (
    <div className="lp-auth-destination">
      <a className="lp-brand-link" href="/"><LandingLogo /></a>
      <div>
        <div className="lp-section-kicker">Authentication route</div>
        <h1>{isLogin ? "Log in to DevOrbit" : "Create your DevOrbit account"}</h1>
        <p>
          This repository does not currently include an authentication UI or backend.
          The landing-page route is ready, but account access still requires the
          product authentication implementation to be supplied.
        </p>
        <a className="lp-secondary" href="/">Return to the landing page</a>
      </div>
    </div>
  )
}
