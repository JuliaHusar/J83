import {useState} from "react";
import axios from "axios";
import {backendRequests} from "../HelperFunctions/BackendRequests";
const Login = () => {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const handleLogin = (e) => {
        e.preventDefault();
        axios.post('http://127.0.0.1:5000/api/login', {
            username: username,
            password: password
        }).then(response => {
            if (response.status === 200) {
                backendRequests(response.data).then(r => {
                    if (r.status === 200) {
                        localStorage.setItem('token', response.data);
                        window.location.href = '/home';
                    } else {
                        alert('Invalid token');
                    }
                });
            }
        }).catch(error => {
            if (error.response && error.response.status === 401) {
                alert('Invalid username or password');
            }
        });
    }

    return (
        <div>
            <form onSubmit={handleLogin}>
                <div className="flex flex-col items-center justify-center h-screen">
                    <h1 className="text-3xl font-bold mb-4">Login</h1>
                    <input
                        type="text"
                        placeholder="Username"
                        className="mb-2 p-2 border border-gray-300 rounded"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="mb-4 p-2 border border-gray-300 rounded"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <button type="submit" className="bg-blue-500 text-white p-2 rounded">Login</button>
                </div>
            </form>
        </div>
    );
}
export default Login;