import Header from "./Components/Header";
import {BrowserRouter} from "react-router-dom";
import Router from "./Router";
import {Axios} from "axios";

function App() {
  return (
    <div className="">
        <BrowserRouter>
            <Header />
            <Router />
        </BrowserRouter>
    </div>
  );
}

export default App;
