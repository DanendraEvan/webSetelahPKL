import { Link } from "react-router-dom";
import AuthLayout from "../Layouts/AuthLayouts";
import FormLogin from "../Fragments/FormLogin";

const LoginPage = () => {
  return (
    <AuthLayout title="Login" type="login">
      <FormLogin />
    </AuthLayout>
  );
};

export default LoginPage;
