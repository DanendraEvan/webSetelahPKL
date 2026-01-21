import { Link } from "react-router-dom";

const AuthLayout = (props) => {
    const {children, title, type} = props;
    
    return (
        <div 
            className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-blue-100"
        >
            {/* Background shapes */}
            <div className="fixed inset-0 overflow-hidden">
                <div className="absolute w-64 h-64 rounded-full bg-blue-700 opacity-20 -top-32 -left-32"></div>
                <div className="absolute w-96 h-96 rounded-full bg-blue-600 opacity-10 -bottom-48 -right-24"></div>
            </div>
            
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 relative z-10 border border-blue-100">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-800 mb-2">{title}</h1>
                    <p className="text-blue-600">
                        Welcome, please login to your account
                    </p>
                </div>
                {children}
                <Navigation type={type}/>
            </div>
        </div>
    )
}

const Navigation = ({type}) => {
    if(type == "login"){
        return (
            <p className="text-sm mt-5 text-center">
                Dont Have An Account?{" "}
                    <Link to="/register" className="font-bold text-blue-600">
                        Register
                    </Link>
            </p>
        )
    }else{
        return(
            <p className="text-sm mt-5 text-center">
                Already Have an Account?{" "}
                    <Link to="/login" className="font-bold text-blue-600">
                        Login
                    </Link>
            </p>
        )
    }
}

export default AuthLayout;