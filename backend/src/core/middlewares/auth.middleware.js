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

const authMiddleware = async (req, res, next) => {
    try{
        const token = req.headers.authorization?.split(' ')[1];
        if(!token){
            return res.status(401).json({message: "Unauthorized"});
        }
        const {data, error} = await supabase.auth.getUser(token);
        if(error){
            return res.status(401).json({message: "Unauthorized"});
        }
        req.user = data.user;
        next();
    }catch(error){
        console.log(error);
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

export {register, Login, authMiddleware, refreshToken};