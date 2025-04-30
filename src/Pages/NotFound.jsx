const NotFound = () => {
  return(
      <div className='text-lg flex flex-col items-center justify-center h-screen'>
            <h1 className='text-4xl font-bold'>404</h1>
            <h2 className='text-2xl font-semibold'>Page Not Found</h2>
            <p className='mt-5'>The page you are looking for does not exist.</p>
            <a href='/' className='mt-5 text-blue-500 hover:underline'>Go back to Home</a>
      </div>
  )
}
export default NotFound;