import React, { useState } from 'react';
import './style.css';

/**
 * Educational Astronomy Tool
 * Interactive 3D lessons about orbital mechanics using TLE data
 */

const LESSONS = [
  { id: 1, title: 'What is a TLE?', description: 'Learn about Two-Line Element sets' },
  { id: 2, title: 'Orbital Inclination', description: 'Understanding orbital planes' },
  { id: 3, title: 'Eccentricity', description: 'Circular vs elliptical orbits' },
  { id: 4, title: 'Mean Motion', description: 'Satellite orbital period' },
  { id: 5, title: 'SGP4 Propagation', description: 'How positions are calculated' }
];

function App() {
  const [currentLesson, setCurrentLesson] = useState(null);
  const [quizMode, setQuizMode] = useState(false);

  return (
    <div className="app">
      <header className="header">
        <h1>🎓 Educational Astronomy Tool</h1>
        <p>Learn orbital mechanics with interactive 3D visualizations</p>
      </header>

      <div className="main-grid">
        <div className="sidebar">
          <h2>Lessons</h2>
          {LESSONS.map(lesson => (
            <div
              key={lesson.id}
              className="lesson-item"
              onClick={() => setCurrentLesson(lesson)}
            >
              <h3>{lesson.title}</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>{lesson.description}</p>
            </div>
          ))}

          <button className="btn" onClick={() => setQuizMode(!quizMode)}>
            {quizMode ? '📖 Lessons' : '📝 Quiz Mode'}
          </button>
        </div>

        <div className="canvas-container">
          {currentLesson ? (
            <div style={{ padding: '40px' }}>
              <h2>{currentLesson.title}</h2>
              <p style={{ marginTop: '20px', fontSize: '1.2rem' }}>{currentLesson.description}</p>
              <div style={{ marginTop: '40px', background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' }}>
                <p>3D visualization would be rendered here using Three.js</p>
                <p style={{ marginTop: '10px' }}>Interactive controls to manipulate orbital parameters</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <p style={{ fontSize: '1.5rem' }}>Select a lesson to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
