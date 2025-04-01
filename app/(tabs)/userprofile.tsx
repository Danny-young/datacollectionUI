import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/store/authStore';
import { 
  Avatar,
  AvatarBadge,
  AvatarImage,
  AvatarFallbackText 
} from '@/components/ui/avatar';
import { 
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorText
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { 
  Card,
  // CardHeader,
  // CardContent,
  // CardFooter 
} from '@/components/ui/card';
import { Text } from "@/components/ui/text"
import { Box } from '@/components/ui/box';

import { useToast } from '@/components/ui/toast';
import { AgentbyID, updateAgent, UpdateAgentData } from '@/api/agents';
import { Heading } from '@/components/ui/heading';
import { AddIcon, Icon } from '@/components/ui/icon';
import { LogOut, MailIcon, MailsIcon, PhoneIcon, ShoppingCart, UserCheck2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { showCustomToast } from '@/components/ui/custom-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/spinner';




interface EditableProfile {
  name: string;
  email: string;
  phone_number: string;
}




interface ProfileItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isEditing?: boolean;
  onEdit?: (value: string) => void;
}





const ProfileItem = ({ icon, label, value, isEditing, onEdit }: ProfileItemProps) => (
  <HStack space="md" className="py-2">
    <Box className="w-8">{icon}</Box>
    {isEditing ? (
      <FormControl>
        <FormControlLabel>
          <FormControlLabelText>{label}</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            value={value}
            onChangeText={onEdit}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        </Input>
      </FormControl>
    ) : (
      <VStack>
        <Text className="text-sm text-gray-500">{label}</Text>
        <Text className="text-base font-medium">{value}</Text>
      </VStack>
    )}
  </HStack>
);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  const suffix = ['th', 'st', 'nd', 'rd'][(day % 10 > 3 ? 0 : day % 10)];
  return `${day}${suffix} ${month} ${year}`;
};

export default function userprofile() {
  const user = useAuth((state:any) => state.user);
  console.log("1. Initial user state:", user);
  console.log("2. User type:", typeof user);
  console.log("3. User properties:", Object.keys(user || {}));
  console.log("3.5 Full user object:", JSON.stringify(user, null, 2));

  const logout = useAuth((state:any) => state.logout);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<EditableProfile>({
    name: user?.name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || ''
  });
  //const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
 

 // Fetch agent data using user's username
 const { data: agentData, isLoading, error } = useQuery({
  queryKey: ['agent', user?.user_name],
  queryFn: async () => {
    if (!user?.user_name) {
      console.log("4. No user_name found in user object:", user);
      throw new Error('No user_name found');
    }
    
    console.log("5. Attempting to fetch agent with user_name:", user.user_name);
    try {
      const response = await AgentbyID(user.user_name);
      console.log("6. API Response:", response);
      return response;
    } catch (err) { 
      console.error("7. API Error:", err);
      throw err;
    }
  },
  enabled: Boolean(user?.user_name), // More explicit boolean check
});

console.log("9. Is query enabled?", Boolean(user?.user_name));
console.log("10. Query state:", {
  isLoading,
  error,
  hasData: !!agentData,
  data: agentData
});

const updateProfileMutation = useMutation({
  mutationFn: (data: UpdateAgentData) => updateAgent(user?.user_name!, data),
  onSuccess: () => {
    setIsEditing(false);
    // Refetch agent data
    queryClient.invalidateQueries({ queryKey: ['agent', user?.user_name] });
    showCustomToast(toast, {
      title: "Success",
      description: "Profile updated successfully",
      variant: "success"
    });
  },
  onError: (error: Error) => {
    showCustomToast(toast, {
      title: "Error",
      description: error.message || "Failed to update profile",
      variant: "error"
    });
  }
});

  // const handleUpdate = () => {
  //   if (AgentbyID) {
  //     updateProfileMutation.mutate(profileData);
  //   }
  // };

  // Show loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading profile...</Text>
      </View>
    );
  }
 console.log("Current user in profile:", user);


 const handleLogout = () => {
  logout(); // Clear user state
  router.replace('/login'); // Redirect to login
  showCustomToast(toast, {
      title: "Logged Out",
      description: "You have been successfully logged out",
      variant: "info"
        });
};

  if (!AgentbyID) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>No profile data available</Text>
      </View>
    );
  }

  
  return (
    <ScrollView className="flex-1 bg-gray-50">
    <Card className="m-4">
      <Card>
        <HStack space="sm" className="pb-4 space-x-8 gap-5">
        <Avatar size="xl">
        <AvatarFallbackText>Jane Does</AvatarFallbackText>
        <AvatarImage
    source={{
      uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    }}
  />
  <AvatarBadge />
</Avatar>

        <VStack space="sm" className="flex-1">
          <Heading 
            size="xl" 
            style={{
              color: '#1E293B',
              fontSize: 28,
              fontWeight: '700',
              letterSpacing: 0.5,
              marginBottom: 4
            }}
          >
         
            <Text className='text-4xl'>{agentData?.name}</Text>
          </Heading>
          <HStack 
            style={{
              backgroundColor: '#EEF2FF',
              paddingVertical: 4,
              paddingHorizontal: 12,
              borderRadius: 20,
              alignSelf: 'flex-start',
              marginBottom: 8
            }}
          >
            <Text 
              style={{
                color: '#4F46E5',
                fontSize: 16,
                fontWeight: '600'
              }}
            >
              {agentData?.user_name}
            </Text>
          </HStack>
          <Button
            variant="outline"
            size="sm"
            style={{
              backgroundColor: '#F0F9FF',
              borderColor: '#93C5FD',
              borderWidth: 1,
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 16,
              alignSelf: 'flex-start'
            }}
            onPress={() => setIsEditing(!isEditing)}
          >
            <ButtonText 
              style={{
                color: '#2563EB',
                fontSize: 14,
                fontWeight: '600'
              }}
            >
              {isEditing ? '✕ Cancel Editing' : '✎ Edit Profile'}
            </ButtonText>
          </Button>
        </VStack>
        </HStack>
      </Card>
    
   <Card className="p-4 bg-white shadow-md rounded-xl">
    <VStack space="md">
      <HStack space="md" style={{ alignItems: 'center' }} className="p-2 rounded-lg hover:bg-gray-50">
        <Box className="bg-blue-50 p-2 rounded-full">
          <Icon color="#2563eb" size="xl" as={PhoneIcon}/>
        </Box>
        <VStack>
          <Text className="text-gray-500 text-sm">Phone Number</Text>
          <Text className="text-gray-800 text-lg font-medium">{agentData?.phone_number}</Text>
        </VStack>
      </HStack>

      <HStack space="md" style={{ alignItems: 'center' }} className="p-2 rounded-lg hover:bg-gray-50">
        <Box className="bg-blue-50 p-2 rounded-full">
          <Icon color="#2563eb" size="xl" as={MailsIcon}/>
        </Box>
        <VStack>
          <Text className="text-gray-500 text-sm">Email Address</Text>
          <Text className="text-gray-800 text-lg font-medium">{agentData?.email}</Text>
        </VStack>
      </HStack>
    </VStack>
   </Card>

    <Card className="p-4 bg-white shadow-md rounded-xl">
      <HStack 
        style={{
          backgroundColor: '#EEF2FF',
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          minHeight: 120
        }}
        className="justify-around w-full divide-x divide-gray-200"
      >
        <VStack className="flex-1 px-4 py-2">
          <Text 
            style={{ 
              color: '#1E40AF',
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 8,
              textAlign: 'center'
            }}
          >
            Data Collected
          </Text>
          <Text 
            style={{ 
              fontSize: 30,
              fontWeight: '800',
              color: '#1E3A8A',
              textAlign: 'center',
              letterSpacing: 1.5,
              marginBottom: 4,
              lineHeight: 35
            }}
          >
            365
          </Text>
          <Text 
            style={{ 
              color: '#6B7280',
              fontSize: 14,
              textAlign: 'center'
            }}
          >
            Total
          </Text>
        </VStack>

        <VStack className="flex-1 px-4 py-2">
          <Text 
            style={{ 
              color: '#1E40AF',
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 8,
              textAlign: 'center'
            }}
          >
            Electoral Area Visited
          </Text>
          <Text 
            style={{ 
              fontSize: 30,
              fontWeight: '800',
              color: '#1E3A8A',
              textAlign: 'center',
              letterSpacing: 1.5,
              marginBottom: 4,
              lineHeight: 35
            }}
          >
            24
          </Text>
          <Text 
            style={{ 
              color: '#6B7280',
              fontSize: 14,
              textAlign: 'center'
            }}
          >
            Areas
          </Text>
        </VStack>
      </HStack>     
    </Card>

    <Card 
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
      }}
    >
      <VStack space="lg">
        <HStack 
          style={{
            backgroundColor: '#F0F9FF',
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Text style={{ color: '#64748B', fontSize: 16 }}>Role</Text>
          <HStack 
            style={{
              backgroundColor: '#EEF2FF',
              paddingVertical: 4,
              paddingHorizontal: 12,
              borderRadius: 20
            }}
          >
            <Text style={{ color: '#4F46E5', fontSize: 16, fontWeight: '600' }}>
            {agentData?.role}
            </Text>
          </HStack>
        </HStack>

        <HStack 
          style={{
            backgroundColor: '#F0F9FF',
            borderRadius: 12,
            padding: 5,
            alignItems: 'center', justifyContent: 'space-between'
          }}
        
        >
          <Text style={{ color: '#64748B', fontSize: 16 }}>Agent Since</Text>
          <Text 
            style={{ 
              color: '#4F46E5', 
              fontSize: 16, 
              fontWeight: '600',
              backgroundColor: '#EEF2FF',
              paddingVertical: 4,
              paddingHorizontal: 12,
              borderRadius: 20
            }}
          >
            {agentData?.created_at && formatDate(agentData.created_at)}
          </Text>
        </HStack>
      </VStack>
    </Card>




      <Card 
        style={{
          backgroundColor: 'white',
          borderRadius: 16,
          marginBottom: 5,
          marginTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
          elevation: 2
        }}
      >
        <TouchableOpacity 
          style={{
            borderRadius: 12,
            overflow: 'hidden'
          }}
          activeOpacity={0.7}
        >
          <HStack 
            style={{
              padding: 16,
              alignItems: 'center',
              backgroundColor: '#F8FAFF'
            }}
          >
            <Box 
              style={{
                backgroundColor: '#EEF2FF',
                padding: 12,
                borderRadius: 12,
                shadowColor: '#2563eb',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 1
              }}
            >
              <Icon color="#2563eb" size="xl" as={UserCheck2}/>
            </Box>
            <Text 
              style={{ 
                marginLeft: 16,
                fontSize: 16,
                fontWeight: '600',
                color: '#334155'
              }}
            >
              Change Password
            </Text>   
          </HStack>    
        </TouchableOpacity>  
      </Card>

      {isEditing && (
        <Card className="p-4 bg-white shadow-md rounded-xl mt-4">
          <VStack space="md">
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText style={{ color: '#475569', fontWeight: '600' }}>Full Name</FormControlLabelText>
              </FormControlLabel>
              <Input style={{ borderColor: '#CBD5E1', borderRadius: 8, height: 48 }}>
                <InputField
                  value={profileData.name}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your full name"
                />
              </Input>
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText style={{ color: '#475569', fontWeight: '600' }}>Email</FormControlLabelText>
              </FormControlLabel>
              <Input style={{ borderColor: '#CBD5E1', borderRadius: 8, height: 48 }}>
                <InputField
                  value={profileData.email}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
                  placeholder="Enter your email"
                />
              </Input>
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText style={{ color: '#475569', fontWeight: '600' }}>Phone Number</FormControlLabelText>
              </FormControlLabel>
              <Input style={{ borderColor: '#CBD5E1', borderRadius: 8, height: 48 }}>
                <InputField
                  value={profileData.phone_number}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, phone_number: text }))}
                  placeholder="Enter your phone number"
                />
              </Input>
            </FormControl>

            <Button
              size="lg"
              style={{
                backgroundColor: '#2563EB',
                borderRadius: 8,
                height: 48,
                marginTop: 8
              }}
              onPress={() => {
                updateProfileMutation.mutate({
                  name: profileData.name,
                  email: profileData.email,
                  phone_number: profileData.phone_number
                });
              }}
              disabled={updateProfileMutation.isPending}
            >
              <HStack space="sm" style={{ alignItems: 'center' }}>
                {updateProfileMutation.isPending && (
                  <Spinner size="small" color="white" />
                )}
                <ButtonText style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                  {updateProfileMutation.isPending ? 'Updating...' : 'Save Changes'}
                </ButtonText>
              </HStack>
            </Button>
          </VStack>
        </Card>
      )}

      <Card 
        style={{
          backgroundColor: 'white',
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
          elevation: 2
        }}
      >
        <TouchableOpacity 
          style={{
            borderRadius: 12,
            overflow: 'hidden'
          }}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <HStack 
            style={{
              padding: 16,
              alignItems: 'center',
              backgroundColor: '#FEF2F2'
            }}
          >
            <Box 
              style={{
                backgroundColor: '#FEE2E2',
                padding: 12,
                borderRadius: 12,
                shadowColor: '#dc2626',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 1
              }}
            >
              <Icon color="#dc2626" size="xl" as={LogOut}/>
            </Box>
            <Text 
              style={{ 
                marginLeft: 16,
                fontSize: 16,
                fontWeight: '600',
                color: '#DC2626'
              }}
            >
              Log out
            </Text>   
          </HStack>    
        </TouchableOpacity>  
      </Card>
    </Card>
  </ScrollView>
);
}