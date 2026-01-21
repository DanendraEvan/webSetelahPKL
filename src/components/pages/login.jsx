import { Link } from "react-router-dom";
import AuthLayout from "../Layouts/AuthLayouts";
import FormLogin from "../Fragments/FormLogin";
import { AuthProvider } from "../../../context/AuthContext";
import GuestRoute from "../../../middleware/GuestRoute";

const LoginPage = () => {
  return (
    <AuthProvider>
      <GuestRoute>
        <AuthLayout title="Login" type="login">
          <FormLogin />
        </AuthLayout>
      </GuestRoute>
    </AuthProvider>
  );
};

export default LoginPage;
