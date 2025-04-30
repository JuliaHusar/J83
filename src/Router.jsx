import {Routes, Route, useLocation} from "react-router-dom";
import Home from "./Pages/Home";
import Report from "./Pages/Report";
import Summary from "./Pages/Summary";
import NotFound from "./Pages/NotFound";
import Login from "./Pages/Login";
import axios from "axios";
import { useEffect, useState } from "react";

const Router = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log('called')
        axios.post('http://127.0.0.1:5000/api/validate', {}, {
            headers: { Authorization: token }
        })
            .then(res => setIsAuthenticated(res.status === 200))
            .catch(() => {
                    setIsAuthenticated(false)
                    localStorage.removeItem('token')
                }
            )
    }, [location]);

    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="*" element={<Login />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/report" element={<Report />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default Router;