import React from 'react';
import LoginPage from './components/pages/login';
import RegisterPage from './components/pages/register';

function App() {
  return (
    <div className="flex justify-center  min-h-screen items-center">
      {/* <LoginPage></LoginPage> */}
      <RegisterPage/>
    </div>
  );
}

export default App;
