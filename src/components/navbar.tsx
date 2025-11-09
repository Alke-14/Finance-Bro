function Navbar() {
    return(
        <nav className = "navbar">
            <div className = "nav-logo">CarFinder</div>
            <ul className = "nav-links">
                <li>Products</li>
                <li>Solutions</li>
                <li>Community</li>
                <li>Resources</li>
                <li>Pricing</li>
                <li>Contact</li>
            </ul>
            <div className ="nav-actions">
                <button className = "btn-outline">Login</button>
                <button className = "btn-primar"> Sign Up</button>
            </div>
        </nav>
    );
}

export default Navbar;