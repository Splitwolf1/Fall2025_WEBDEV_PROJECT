'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Award,
  Save,
  Edit,
  X,
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
  farmDetails?: {
    farmName: string;
    location: { lat: number; lng: number };
    address: string;
    certifications: string[];
  };
}

export default function FarmerProfilePage() {
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
    farmName: '',
    address: '',
    certifications: [] as string[],
  });
  const [newCertification, setNewCertification] = useState('');

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
          farmDetails: response.user.farmDetails,
        };
        setUser(userData);
        setFormData({
          firstName: userData.profile.firstName || '',
          lastName: userData.profile.lastName || '',
          phone: userData.profile.phone || '',
          farmName: userData.farmDetails?.farmName || '',
          address: userData.farmDetails?.address || '',
          certifications: userData.farmDetails?.certifications || [],
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
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
        farmDetails: {
          farmName: formData.farmName,
          address: formData.address,
          certifications: formData.certifications,
          location: user?.farmDetails?.location || { lat: 0, lng: 0 },
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
      console.error('Error updating profile:', error);
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
        farmName: user.farmDetails?.farmName || '',
        address: user.farmDetails?.address || '',
        certifications: user.farmDetails?.certifications || [],
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, newCertification.trim()],
      });
      setNewCertification('');
    }
  };

  const removeCertification = (cert: string) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((c) => c !== cert),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading profile...</p>
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
          <p className="text-gray-600 mt-1">Manage your personal and farm information</p>
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
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
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
                <AvatarFallback className="bg-green-100 text-green-700 text-2xl">
                  {user.profile.firstName?.[0]}{user.profile.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold">
                {user.profile.firstName} {user.profile.lastName}
              </h3>
              <p className="text-sm text-gray-500">🌾 Farmer</p>
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

        {/* Farm Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Farm Details
            </CardTitle>
            <CardDescription>Information about your farm</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Farm Name */}
            <div className="space-y-2">
              <Label htmlFor="farmName">Farm Name</Label>
              <Input
                id="farmName"
                value={formData.farmName}
                onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                disabled={!isEditing}
                placeholder="Green Valley Farm"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Farm Address
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing}
                placeholder="123 Farm Road, City, State, ZIP"
              />
            </div>

            {/* Certifications */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Certifications
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.certifications.map((cert, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-1">
                    {cert}
                    {isEditing && (
                      <button
                        onClick={() => removeCertification(cert)}
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
                  <Input
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                    placeholder="Add certification (e.g., Organic, Non-GMO)"
                  />
                  <Button type="button" onClick={addCertification} variant="outline">
                    Add
                  </Button>
                </div>
              )}
              {!isEditing && formData.certifications.length === 0 && (
                <p className="text-sm text-gray-500">No certifications added</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

