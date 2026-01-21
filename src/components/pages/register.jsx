import { Link } from "react-router-dom";
import AuthLayout from "../Layouts/AuthLayouts"
import FormRegister from "../Fragments/FormRegister";

const RegisterPage = (props) => {
    return (
        <AuthLayout title="Register" type="register">
            <FormRegister/>
        </AuthLayout>
    )
}

export default RegisterPage;