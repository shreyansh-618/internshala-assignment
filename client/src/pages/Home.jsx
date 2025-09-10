import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  return (
    <div className="home">
      <div className="container">
        <div className="hero-section">
          <h1 className="hero-title">Welcome to Intern</h1>
          <p className="hero-subtitle">
            Your one-stop destination for all your shopping needs
          </p>
          <Link to="/products" className="cta-button">
            Start Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
