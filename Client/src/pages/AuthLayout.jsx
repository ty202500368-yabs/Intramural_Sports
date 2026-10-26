import { BrandMark } from '../components/ui';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <section className="auth-brand">
        <div className="auth-brand__top">
          <span className="auth-brand__logo">
            <BrandMark />
            <span>
              <strong>WMSU</strong>
              <em>Intramurals</em>
            </span>
          </span>
          <span className="pill pill--on-dark">Season 2026</span>
        </div>

        <div className="auth-brand__center">
          <p className="eyebrow eyebrow--lime">Campus sports, centralised</p>
          <h1>
            Game day
            <br />
            starts <span>here.</span>
          </h1>
          <p className="auth-brand__lede">
            Register your squad, follow the bracket, and never miss a tip-off. Every
            intramural game lives in one place.
          </p>
        </div>

        <div className="auth-scorecard" aria-hidden="true">
          <div className="auth-scorecard__head">
            <span>Now playing · Basketball</span>
            <span className="badge badge--orange">
              <span className="badge__pulse" /> Live
            </span>
          </div>
          <div className="auth-scorecard__team">
            <span>Blazing Falcons</span>
            <strong>64</strong>
          </div>
          <div className="auth-scorecard__team">
            <span>Golden Tigers</span>
            <strong>61</strong>
          </div>
          <div className="auth-scorecard__foot">
            <span>Q4 · 02:14</span>
            <span>WMSU Gymnasium</span>
          </div>
        </div>

        <div className="auth-brand__foot">
          <span>Built for the WMSU community</span>
          <span className="auth-brand__balls">
            <i />
            <i />
            <i />
          </span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-mobile-brand">
          <BrandMark small />
          <span>WMSU Intramurals</span>
        </div>
        <div className="auth-panel__inner">{children}</div>
        <p className="auth-copyright">© 2026 WMSU Intramurals</p>
      </section>
    </div>
  );
}
