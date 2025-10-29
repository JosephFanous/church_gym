import { Link } from 'react-router-dom';

const HomePage = () => (
  <div className="content-section">
    <section className="hero">
      <h1>Rent the Church Gym</h1>
      <p>
        Host practices, scrimmages, tournaments, and community events in our freshly renovated
        multi-sport gymnasium. Reserve hourly timeslots and pay securely via PayPal or Clover.
      </p>
      <div className="hero-actions">
        <Link className="btn" to="/book">
          Book Now
        </Link>
        <Link className="btn secondary" to="/availability">
          View Availability
        </Link>
      </div>
    </section>

    <section className="card-grid">
      <article className="card">
        <h3>Flexible Scheduling</h3>
        <p>Choose the time that works for your team with real-time availability and instant holds.</p>
      </article>
      <article className="card">
        <h3>Multi-Sport Ready</h3>
        <p>Basketball, volleyball, futsal, pickleball &mdash; configurable for a variety of sports.</p>
      </article>
      <article className="card">
        <h3>Simple Checkout</h3>
        <p>Complete payment online with PayPal or in-person through Clover point-of-sale options.</p>
      </article>
      <article className="card">
        <h3>Instant Confirmation</h3>
        <p>Receive a confirmation email with a unique reservation ID for quick check-ins.</p>
      </article>
    </section>
  </div>
);

export default HomePage;
