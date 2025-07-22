import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import { User, Settings, Upload, Save, Camera } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateUsernameMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      const response = await apiRequest("PUT", "/api/profile/username", data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/auth/user"], updatedUser);
      toast({
        title: "Success",
        description: "Your name has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update name. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/profile-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: async (data) => {
      // Update user profile with the new image URL
      const response = await apiRequest("PUT", "/api/profile/picture", {
        profileImageUrl: data.imageUrl,
      });
      const updatedUser = await response.json();

      queryClient.setQueryData(["/api/auth/user"], updatedUser);
      setProfileImageUrl(data.imageUrl);
      setSelectedFile(null);
      setPreviewUrl(null);

      toast({
        title: "Success",
        description: "Your profile picture has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    },
  });

  const updateProfilePictureMutation = useMutation({
    mutationFn: async (data: { profileImageUrl: string }) => {
      const response = await apiRequest("PUT", "/api/profile/picture", data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/auth/user"], updatedUser);
      toast({
        title: "Success",
        description: "Your profile picture has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = () => {
    if (selectedFile) {
      uploadImageMutation.mutate(selectedFile);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast({
        title: "Error",
        description: "First name is required.",
        variant: "destructive",
      });
      return;
    }
    updateUsernameMutation.mutate({ firstName: firstName.trim(), lastName: lastName.trim() });
  };

  const handleUpdateProfilePicture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileImageUrl.trim()) {
      toast({
        title: "Error",
        description: "Profile image URL is required.",
        variant: "destructive",
      });
      return;
    }
    updateProfilePictureMutation.mutate({ profileImageUrl: profileImageUrl.trim() });
  };

  const isUsernameChanged = firstName !== (user?.firstName || "") || lastName !== (user?.lastName || "");
  const isProfilePictureChanged = profileImageUrl !== (user?.profileImageUrl || "");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar className="w-32 h-32">
                      <AvatarImage src={previewUrl || profileImageUrl || user?.profileImageUrl} />
                      <AvatarFallback className="text-2xl">
                        {firstName.charAt(0).toUpperCase() || user?.firstName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      size="sm"
                      className="absolute bottom-0 right-0 rounded-full w-10 h-10 bg-blue-600 hover:bg-blue-700"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {selectedFile && (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 text-center">
                      Selected: {selectedFile.name}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        onClick={handleUploadImage}
                        disabled={uploadImageMutation.isPending}
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadImageMutation.isPending ? "Uploading..." : "Upload Image"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelUpload}
                        disabled={uploadImageMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                <form onSubmit={handleUpdateProfilePicture} className="space-y-4">
                  <div>
                    <Label htmlFor="profileImageUrl">Or use Image URL</Label>
                    <Input
                      id="profileImageUrl"
                      type="url"
                      value={profileImageUrl}
                      onChange={(e) => setProfileImageUrl(e.target.value)}
                      placeholder="https://example.com/your-image.jpg"
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Enter the URL of your profile picture
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={updateProfilePictureMutation.isPending || !isProfilePictureChanged}
                    className="w-full"
                    variant="outline"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfilePictureMutation.isPending ? "Updating..." : "Update from URL"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Personal Information Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleUpdateUsername} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Your first name"
                        className="mt-1"
                        maxLength={50}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Your last name"
                        className="mt-1"
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={updateUsernameMutation.isPending || !isUsernameChanged}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateUsernameMutation.isPending ? "Updating..." : "Update Name"}
                  </Button>
                </form>

                <Separator />

                {/* Account Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Account Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">User ID</Label>
                      <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                        {user?.id}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                      <p className="text-sm text-gray-900">
                        {user?.email || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">Member Since</Label>
                      <p className="text-sm text-gray-900">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">Current Rating</Label>
                      <p className="text-sm text-gray-900 font-bold text-blue-600">
                        {user?.rating || 1200}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Statistics */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Game Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{user?.gamesPlayed || 0}</div>
                    <div className="text-sm text-gray-500">Total Games</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{user?.wins || 0}</div>
                    <div className="text-sm text-gray-500">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{user?.losses || 0}</div>
                    <div className="text-sm text-gray-500">Losses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{user?.draws || 0}</div>
                    <div className="text-sm text-gray-500">Draws</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}