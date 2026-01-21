import { Link } from "react-router-dom";
import AuthLayout from "../Layouts/AuthLayouts"
import FormRegister from "../Fragments/FormRegister";
import { AuthProvider } from "../../../context/AuthContext";
import GuestRoute from "../../../middleware/GuestRoute";

const RegisterPage = (props) => {
    return (
        <AuthProvider>
            <GuestRoute>
                <AuthLayout title="Register" type="register">
                    <FormRegister/>
                </AuthLayout>
            </GuestRoute>
        </AuthProvider>
    )
}

export default RegisterPage;