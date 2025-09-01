import { BrowserRouter, Route, Routes } from "react-router-dom";
import Shortner from "./pages/Shortner";
import Statistics from "./pages/Statistics";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shortner />} />
        <Route path="/statistics" element={<Statistics />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
