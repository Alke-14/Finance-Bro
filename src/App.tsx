import { useState } from 'react'
import './App.css'
import mainCarVideo from './assets/red_car.mp4';

// import custom components 
import HeroSection from './components/HeroSection';
import FactCard from './components/factcard';

//defines the interface
interface CoreValue {
  letter: string;
  title: string;
  definition: string;
}

function App() {

  const coreValues: CoreValue[] = [
    {
      letter: "C",
      title: "Consumer-Personalized Experience",
      definition: "Multiple Preferences are utilized through Gemini integration and an extensive, independently produced Toyota vehicle dataset."
    },

    {
      letter: "O",
      title: "Original, Authentic Product",
      definition: "No products currently on the market have similar purposes."
    },

    {
      letter: "R",
      title: "Reimagined and welcoming approach to the car buying process",
      definition: "Addresses the knowledge gap of car buyers, while giving them intelligent feedback based on user input."
    },

    {
      letter: "E",
      title: "Easily scalable for market use",
      definition: "This solution could be applied at scale to the overall market or to multiple brands simultaneously, based on the dataset."
    },

  ];

  return(
    <div className = "app-container">
      <header className="header">
        <h1>Home Page</h1>
      </header>

      <main className = "main-content">
        <video 
          className = "main-car-video"
          src = {mainCarVideo}
          autoPlay
          loop
          muted
          
        >
          Your browser does not support HTML5 video.
        </video>
      </main>

      <HeroSection />

      <section className = "core-values-section">
        <h2 className='section-heading'> Core Values</h2>

        <div className='core-values-list'>
          {coreValues.map((values,index) => (
            <div key={index} className='core-value-card'>
              <div className='core-left'>{values.letter}</div>
              <div className='core-right'>
                <h3 className='core-title'>{values.title}</h3>
                <p className='core-desc'>{values.definition}</p>
              {/* <h3 className='core-letter'>{values.letter}</h3>
              <p className = "core-title">{values.title}</p>
              <div className = "core-tooltip">{values.definition}</div> */}
              </div>
          </div>
          ))}
        </div>
      </section>
    </div>
  );
}


export default App
