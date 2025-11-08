'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { auth, type UserRole } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole | ''>('');
  const [formData, setFormData] = useState({
    // Step 2: Basic Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',

    // Step 3: Role-specific
    businessName: '',
    location: '',
    certifications: [] as string[],
    cuisine: '',
    fleetSize: '',
    licenseNumber: '',

    // Step 4: Agreement
    termsAccepted: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!role) {
      setError('Please select a role');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Build role-specific details
      const roleDetails: any = {};

      if (role === 'farmer') {
        roleDetails.farmDetails = {
          farmName: formData.businessName,
          location: { lat: 0, lng: 0 }, // TODO: Add geocoding
          address: formData.location,
          certifications: formData.certifications,
        };
      } else if (role === 'restaurant') {
        roleDetails.restaurantDetails = {
          businessName: formData.businessName,
          location: { lat: 0, lng: 0 }, // TODO: Add geocoding
          address: formData.location,
          cuisine: [formData.cuisine],
        };
      } else if (role === 'distributor') {
        roleDetails.distributorDetails = {
          companyName: formData.businessName,
          fleetSize: parseInt(formData.fleetSize) || 0,
          serviceAreas: [formData.location],
        };
      } else if (role === 'inspector') {
        roleDetails.inspectorDetails = {
          licenseNumber: formData.licenseNumber,
          jurisdiction: formData.location,
        };
      }

      // Register user with real backend API
      const user = await auth.register({
        email: formData.email,
        password: formData.password,
        role: role as UserRole,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        },
        ...roleDetails,
      });

      // Ensure we have a valid user before redirecting
      if (!user || !user.role) {
        throw new Error('Registration succeeded but user data is incomplete');
      }

      // Reset loading state before redirect
      setIsLoading(false);
      
      // Small delay to ensure state updates, then redirect
      setTimeout(() => {
        router.push(`/${user.role}`);
      }, 100);
    } catch (err: any) {
      // Display error in UI
      setError(err.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const getRoleInfo = (selectedRole: string) => {
    const roleData: Record<string, { icon: string; title: string; description: string }> = {
      farmer: {
        icon: '🌾',
        title: 'Farmer',
        description: 'List and sell your fresh produce directly to restaurants'
      },
      restaurant: {
        icon: '🍽️',
        title: 'Restaurant',
        description: 'Order fresh, local produce from verified farmers'
      },
      distributor: {
        icon: '🚚',
        title: 'Distributor',
        description: 'Manage logistics and deliveries for the supply chain'
      },
      inspector: {
        icon: '🔍',
        title: 'Health Inspector',
        description: 'Conduct inspections and ensure compliance'
      },
    };
    return roleData[selectedRole] || roleData.farmer;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="text-4xl mb-2">🌾</div>
            <CardTitle className="text-3xl font-bold">Join Farm-to-Table</CardTitle>
            <CardDescription className="text-base mt-2">
              Create your account in {totalSteps} simple steps
            </CardDescription>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Step {step} of {totalSteps}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit}>
              {/* Step 1: Choose Role */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Your Role</h3>
                    <p className="text-gray-500">Select how you'll use the platform</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {(['farmer', 'restaurant', 'distributor', 'inspector'] as UserRole[]).map((roleOption) => {
                      const info = getRoleInfo(roleOption);
                      return (
                        <button
                          key={roleOption}
                          type="button"
                          onClick={() => setRole(roleOption as UserRole)}
                          className={`p-6 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                            role === roleOption
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-4xl mb-3">{info.icon}</div>
                          <h4 className="font-semibold text-gray-900 mb-1">{info.title}</h4>
                          <p className="text-sm text-gray-500">{info.description}</p>
                        </button>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* Step 2: Basic Information */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="text-center mb-6">
                    <div className="text-3xl mb-2">{getRoleInfo(role).icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Basic Information</h3>
                    <p className="text-gray-500">Tell us about yourself</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>
              )}

              {/* Step 3: Role-Specific Information */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="text-center mb-6">
                    <div className="text-3xl mb-2">{getRoleInfo(role).icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {role === 'farmer' && 'Farm Details'}
                      {role === 'restaurant' && 'Restaurant Details'}
                      {role === 'distributor' && 'Business Details'}
                      {role === 'inspector' && 'Inspector Details'}
                    </h3>
                    <p className="text-gray-500">Provide additional information</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessName">
                      {role === 'farmer' && 'Farm Name *'}
                      {role === 'restaurant' && 'Restaurant Name *'}
                      {role === 'distributor' && 'Company Name *'}
                      {role === 'inspector' && 'Full Name *'}
                    </Label>
                    <Input
                      id="businessName"
                      placeholder={
                        role === 'farmer' ? 'Green Valley Farm' :
                        role === 'restaurant' ? 'Fresh Bistro' :
                        role === 'distributor' ? 'FastTrack Logistics' :
                        'Sarah Johnson'
                      }
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">
                      {role === 'inspector' ? 'Jurisdiction *' : 'Business Address *'}
                    </Label>
                    <Input
                      id="location"
                      placeholder="123 Main Street, City, State"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>

                  {role === 'farmer' && (
                    <>
                      <div className="space-y-2">
                        <Label>Certifications (Optional)</Label>
                        <div className="space-y-2">
                          {['Organic', 'Non-GMO', 'Fair Trade', 'Local'].map((cert) => (
                            <div key={cert} className="flex items-center space-x-2">
                              <Checkbox id={cert} />
                              <label
                                htmlFor={cert}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {cert} Certified
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {role === 'restaurant' && (
                    <div className="space-y-2">
                      <Label htmlFor="cuisine">Cuisine Type *</Label>
                      <Select value={formData.cuisine} onValueChange={(value) => setFormData({ ...formData, cuisine: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cuisine type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="american">American</SelectItem>
                          <SelectItem value="italian">Italian</SelectItem>
                          <SelectItem value="asian">Asian</SelectItem>
                          <SelectItem value="mexican">Mexican</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {role === 'distributor' && (
                    <div className="space-y-2">
                      <Label htmlFor="fleetSize">Fleet Size *</Label>
                      <Input
                        id="fleetSize"
                        type="number"
                        placeholder="5"
                        min="1"
                        value={formData.fleetSize}
                        onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  {role === 'inspector' && (
                    <div className="space-y-2">
                      <Label htmlFor="license">License Number *</Label>
                      <Input
                        id="license"
                        placeholder="INS-12345"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Terms & Confirmation */}
              {step === 4 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="text-center mb-6">
                    <div className="text-3xl mb-2">✅</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Almost Done!</h3>
                    <p className="text-gray-500">Review and accept our terms</p>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-gray-900 mb-3">Account Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-500">Role:</div>
                      <div className="font-medium text-gray-900">
                        {getRoleInfo(role).icon} {getRoleInfo(role).title}
                      </div>
                      <div className="text-gray-500">Name:</div>
                      <div className="font-medium text-gray-900">
                        {formData.firstName} {formData.lastName}
                      </div>
                      <div className="text-gray-500">Email:</div>
                      <div className="font-medium text-gray-900">{formData.email}</div>
                      <div className="text-gray-500">
                        {role === 'inspector' ? 'Jurisdiction:' : 'Business:'}
                      </div>
                      <div className="font-medium text-gray-900">{formData.businessName}</div>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={formData.termsAccepted}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, termsAccepted: checked as boolean })
                        }
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="terms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I agree to the Terms of Service and Privacy Policy *
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          By creating an account, you agree to our{' '}
                          <a href="#" className="text-green-600 hover:underline">
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a href="#" className="text-green-600 hover:underline">
                            Privacy Policy
                          </a>
                          . We'll use your information to provide you with the best service possible.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}

                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 gap-2"
                    disabled={
                      (step === 1 && !role) ||
                      (step === 2 && (!formData.firstName || !formData.lastName || !formData.email || !formData.password || formData.password !== formData.confirmPassword))
                    }
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={!formData.termsAccepted || isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                )}
              </div>

              <p className="text-center text-sm text-gray-600 mt-6">
                Already have an account?{' '}
                <a href="/login" className="text-green-600 font-semibold hover:underline">
                  Sign in
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
  );
}
