import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AudioInterviewPage from './pages/AudioInterviewPage'
import TestGeminiConnection from './pages/TestGeminiConnection'
import NotFoundPage from './pages/NotFoundPage'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/interview" element={<AudioInterviewPage />} />
        <Route path="/test" element={<TestGeminiConnection />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
