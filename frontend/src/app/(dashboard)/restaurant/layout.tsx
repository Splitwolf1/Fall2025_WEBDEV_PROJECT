'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import ChatWidget from '@/components/shared/ChatWidget';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userName, setUserName] = useState('Restaurant');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      try {
        // Fetch latest user data from backend
        const response = await apiClient.getCurrentUser();
        if (response.success && response.user) {
          const user = response.user;
          // Get name from profile or restaurant details
          if (user.profile?.firstName && user.profile?.lastName) {
            setUserName(`${user.profile.firstName} ${user.profile.lastName}`);
          } else if (user.restaurantDetails?.businessName) {
            setUserName(user.restaurantDetails.businessName);
          } else if (user.email) {
            setUserName(user.email.split('@')[0]);
          }
        } else {
          // Fallback to localStorage data
          if (currentUser.profile?.firstName && currentUser.profile?.lastName) {
            setUserName(`${currentUser.profile.firstName} ${currentUser.profile.lastName}`);
          } else if (currentUser.restaurantDetails?.businessName) {
            setUserName(currentUser.restaurantDetails.businessName);
          } else if (currentUser.email) {
            setUserName(currentUser.email.split('@')[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to localStorage data
        const currentUser = auth.getCurrentUser();
        if (currentUser?.profile?.firstName && currentUser?.profile?.lastName) {
          setUserName(`${currentUser.profile.firstName} ${currentUser.profile.lastName}`);
        } else if (currentUser?.restaurantDetails?.businessName) {
          setUserName(currentUser.restaurantDetails.businessName);
        } else if (currentUser?.email) {
          setUserName(currentUser.email.split('@')[0]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole="restaurant" userName={userName} />
      <Sidebar userRole="restaurant" />
      <main className="pl-64 pt-16">
        {children}
      </main>
      <ChatWidget />
    </div>
  );
}
