import {Link, useNavigate} from 'react-router-dom';

const Header = () => {
    const isAuthenticated = !!localStorage.getItem('token');
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
        window.location.reload();
    };
    return(
        <nav className='flex items-center justify-center font-medium space-x-10 mt-10'>
            <ul>
                <li className='inline-block mr-4'>
                    <Link to='/' className='text-gray-700 hover:text-gray-900'>Dashboard</Link>
                </li>
                <li className='inline-block mr-4'>
                    <Link to='/report' className='text-gray-700 hover:text-gray-900'>Report</Link>
                </li>
                <li className='inline-block mr-4'>
                    <Link to='/summary' className='text-gray-700 hover:text-gray-900'>Summary</Link>
                </li>
                <li className='inline-block'>
                    {isAuthenticated ? (
                        <button onClick={handleLogout} className='text-gray-700 hover:text-gray-900'>Logout</button>
                    ) : (
                        <Link to='/login' className='text-gray-700 hover:text-gray-900'>Login</Link>
                    )}
                </li>
            </ul>
        </nav>
    )
}
export default Header;