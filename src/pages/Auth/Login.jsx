import React, { useState } from "react";
import { supabase } from "../../services/supabaseClient"; // 1. Swapped Axios for Supabase
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

// Image import (Keep your existing logo path)
import DSRM_LOGO from "../../assets/DSRM.png";

const LoginPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Added loading state

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Step 1: Button Clicked"); // Check this

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Step 2: Auth Result", { data, authError }); // Check this

      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      console.log("Step 3: Profile Fetch", { profile, profileError }); // Check this!!

      if (profileError) {
        // Fallback if profile is missing (shouldn't happen with our triggers)
        console.error("Profile error:", profileError);
        toast.error("User profile not found.");
        setLoading(false);
        return;
      }

      toast.success("Logged in successfully.");

      // 3. Redirect based on Role
      if (profile.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/resident/dashboard');
      }

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Right Side - Login Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 md:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10">
            
            {/* Header / Logo Section */}
            <div className="mb-6 text-center">
              <div className="mb-4 flex justify-center">
                <img
                  className="h-32 w-auto object-contain"
                  src={DSRM_LOGO}
                  alt="Phase Alert Logo"
                />
              </div>
              <h1 className="text-3xl font-bold text-amber-600 mb-1">
                PHASE ALERT
              </h1>
              <p className="text-gray-500 text-sm">
                Village Disaster & Event Management
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    required
                    disabled={loading}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200 text-gray-900 placeholder-gray-400 disabled:bg-gray-100"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    required
                    disabled={loading}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200 text-gray-900 placeholder-gray-400 disabled:bg-gray-100"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-400 text-white font-semibold py-3 px-4 rounded-lg hover:from-orange-700 hover:from-orange-700 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 transform transition duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;