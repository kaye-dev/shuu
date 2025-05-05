import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/tabs.css';
import SlideApp from './components/SlideApp';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SlideApp />} />
      </Routes>
    </Router>
  );
}
