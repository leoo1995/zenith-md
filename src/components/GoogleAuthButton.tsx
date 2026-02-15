import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useGoogleStore } from '../store/useGoogleStore';
import { LogIn, LogOut, User } from 'lucide-react';
import { initGoogleDrive } from '../services/googleDriveService';

const GoogleAuthButton: React.FC = () => {
    const { isAuthenticated, user, login, logout } = useGoogleStore();

    const handleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log("Login Success:", tokenResponse);
            // Fetch user info
            try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoRes.json();
                
                login(tokenResponse.access_token, {
                    name: userInfo.name,
                    email: userInfo.email,
                    picture: userInfo.picture,
                });

                // Initialize GAPI client for Drive API usage
                // Ideally this should be done once, but ensuring it's ready after login is good
                // Initialize GAPI picker library
                await initGoogleDrive();

            } catch (error) {
                console.error("Failed to fetch user info", error);
            }
        },
        onError: (error) => console.log('Login Failed:', error),
        scope: 'https://www.googleapis.com/auth/drive.file', // Request Drive scope
        flow: 'implicit', // Use implicit flow for client-side only
    });

    const handleLogout = () => {
        logout();
        // optionally googleLogout() from sdk if needed to clear session completely
    };

    if (isAuthenticated && user) {
        return (
            <div className="flex items-center space-x-2">
                {user.picture ? (
                     <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-gray-600" />
                ) : (
                    <User className="w-6 h-6 text-gray-400" />
                )}
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                    title="Sign out"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => handleLogin()}
            className="flex items-center space-x-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
        >
            <LogIn className="w-4 h-4" />
            <span>Sign in with Google</span>
        </button>
    );
};

export default GoogleAuthButton;
