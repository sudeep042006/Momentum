import { supabase } from "../../config/supabase.js";

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if(!name || !email || !password) {
            return res.status(400).json({ message: "Please provide all the required fields" });
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                },
            },
        });

        if (error) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Auto-create MongoDB UserProfile
        try {
            const UserProfile = (await import('../../modules/users/user.model.js')).default;
            await UserProfile.create({
                user: data.user.id,
                name: name,
                email: email,
                profilePic: ""
            });
        } catch (dbError) {
            console.error("Failed to auto-create MongoDB profile:", dbError);
        }

        return res.status(200).json({ data });

    } catch (error) {
        console.log(error);
    }
}

const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        return res.status(200).json({ data });

    } catch (error) {
        console.log(error);
    }
}

// Simple in-memory cache to prevent N+1 Supabase Auth API rate-limiting delays
const tokenCache = new Map();

// Cleanup cache periodically to avoid memory leaks (every 1 hour)
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of tokenCache.entries()) {
        if (now > data.expiresAt) {
            tokenCache.delete(token);
        }
    }
}, 3600000);

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Check if token is in cache and still valid
        const cachedUser = tokenCache.get(token);
        if (cachedUser && Date.now() < cachedUser.expiresAt) {
            req.user = cachedUser.user;
            return next();
        }

        // If not in cache, hit Supabase API
        const { data, error } = await supabase.auth.getUser(token);
        
        if (error || !data || !data.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Cache the successful validation for 15 minutes
        tokenCache.set(token, {
            user: data.user,
            expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins
        });

        req.user = data.user;
        next();
    } catch (error) {
        console.log("Auth Middleware Error:", error);
        return res.status(500).json({ message: "Internal server error during authentication" });
    }
}
const refreshToken = async (req, res) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.status(400).json({ message: "Refresh token is required" });
        }

        const { data, error } = await supabase.auth.refreshSession({ refresh_token });
        
        if (error) {
            return res.status(401).json({ message: "Invalid or expired refresh token" });
        }

        return res.status(200).json({ data });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error during token refresh" });
    }
}

const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`,
        });

        if (error) {
            return res.status(400).json({ message: error.message });
        }

        return res.status(200).json({ message: "Password reset link sent to email" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const updatePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword) {
            return res.status(400).json({ message: "New password is required" });
        }

        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            return res.status(400).json({ message: error.message });
        }

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export {register, Login, authMiddleware, refreshToken, requestPasswordReset, updatePassword};