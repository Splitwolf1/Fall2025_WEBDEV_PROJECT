'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  UtensilsCrossed,
  Save,
  Edit,
  X,
  Loader2,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';

interface UserProfile {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
  restaurantDetails?: {
    businessName: string;
    location: { lat: number; lng: number };
    address: string;
    cuisine: string[];
  };
}

const CUISINE_OPTIONS = [
  'American',
  'Italian',
  'Asian',
  'Mexican',
  'French',
  'Mediterranean',
  'Indian',
  'Japanese',
  'Thai',
  'Vegetarian',
  'Vegan',
  'Seafood',
  'BBQ',
  'Other',
];

export default function RestaurantProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    businessName: '',
    address: '',
    cuisine: [] as string[],
  });
  const [newCuisine, setNewCuisine] = useState('');

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response: any = await apiClient.getCurrentUser();
      if (response.success && response.user) {
        const userData: UserProfile = {
          id: response.user.id || response.user._id,
          email: response.user.email,
          profile: response.user.profile || { firstName: '', lastName: '' },
          restaurantDetails: response.user.restaurantDetails,
        };
        setUser(userData);
        setFormData({
          firstName: userData.profile.firstName || '',
          lastName: userData.profile.lastName || '',
          phone: userData.profile.phone || '',
          businessName: userData.restaurantDetails?.businessName || '',
          address: userData.restaurantDetails?.address || '',
          cuisine: userData.restaurantDetails?.cuisine || [],
        });
      }
    } catch (error: any) {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const updates = {
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        },
        restaurantDetails: {
          businessName: formData.businessName,
          address: formData.address,
          cuisine: formData.cuisine,
          location: user?.restaurantDetails?.location || { lat: 0, lng: 0 },
        },
      };

      const response: any = await apiClient.updateProfile(updates);
      if (response.success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        await fetchProfile();
        // Update auth user data
        await auth.updateProfile(updates);
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        phone: user.profile.phone || '',
        businessName: user.restaurantDetails?.businessName || '',
        address: user.restaurantDetails?.address || '',
        cuisine: user.restaurantDetails?.cuisine || [],
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const addCuisine = () => {
    if (newCuisine.trim() && !formData.cuisine.includes(newCuisine.trim())) {
      setFormData({
        ...formData,
        cuisine: [...formData.cuisine, newCuisine.trim()],
      });
      setNewCuisine('');
    }
  };

  const removeCuisine = (cuisine: string) => {
    setFormData({
      ...formData,
      cuisine: formData.cuisine.filter((c) => c !== cuisine),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="ml-2 text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Failed to load profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">Manage your personal and restaurant information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm text-green-800">{success}</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.profile.avatar} alt={`${user.profile.firstName} ${user.profile.lastName}`} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl">
                  {user.profile.firstName?.[0]}{user.profile.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold">
                {user.profile.firstName} {user.profile.lastName}
              </h3>
              <p className="text-sm text-gray-500">🍽️ Restaurant</p>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input value={user.email} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="(555) 123-4567"
              />
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Restaurant Details
            </CardTitle>
            <CardDescription>Information about your restaurant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="businessName">Restaurant Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                disabled={!isEditing}
                placeholder="Fresh Bistro"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Restaurant Address
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing}
                placeholder="123 Main Street, City, State, ZIP"
              />
            </div>

            {/* Cuisine Types */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Cuisine Types
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.cuisine.map((cuisine, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-1">
                    {cuisine}
                    {isEditing && (
                      <button
                        onClick={() => removeCuisine(cuisine)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <Select value={newCuisine} onValueChange={setNewCuisine}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cuisine type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUISINE_OPTIONS.map((cuisine) => (
                        <SelectItem key={cuisine} value={cuisine}>
                          {cuisine}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addCuisine} variant="outline" disabled={!newCuisine}>
                    Add
                  </Button>
                </div>
              )}
              {!isEditing && formData.cuisine.length === 0 && (
                <p className="text-sm text-gray-500">No cuisine types added</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

