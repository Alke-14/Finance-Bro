// herosection.tsx
// import React from 'react';

function HeroSection(){
    return (
        <header className ='hero-section'>
            <div className = 'hero-content'>
                <h1 className = "hero-title">
                    Find Your <span className = "dream-car-highlight"> Dream Car</span>
                </h1>
                <p className = "hero-subtitle"> Gearing Dreams Towards Reality</p>
                <div className = "hero-actions">
                    <button className = 'btn-form'>Get Started</button>
                    
                </div>
            </div>
        </header>
    );
}

export default HeroSection