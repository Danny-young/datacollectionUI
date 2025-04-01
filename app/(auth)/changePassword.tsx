import React, { useState } from 'react';
import { View } from 'react-native';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '../../components/ui/form-control';
import { Input, InputField, InputSlot, InputIcon } from '../../components/ui/input';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText } from '../../components/ui/button';
import { EyeIcon, EyeOffIcon } from '../../components/ui/icon';
import { useToast } from '@/components/ui/toast';
import { HStack } from '@/components/ui/hstack';
import { useMutation } from '@tanstack/react-query';
import { changePassword } from '@/api/auth';
import { router } from 'expo-router';
import { Heading } from '@/components/ui/heading';
import { showCustomToast } from '@/components/ui/custom-toast';
import { Spinner } from '@/components/ui/spinner';


export default function ChangePassword() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    user_name: '',
    oldPassword: '',
    newPassword: '',
  });

  const toast = useToast();

  const handleToggleOldPassword = () => setShowOldPassword((prev) => !prev);
  const handleToggleNewPassword = () => setShowNewPassword((prev) => !prev);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const changePasswordMutation = useMutation({
    mutationFn: () => changePassword(
      formData.user_name,
      formData.oldPassword,
      formData.newPassword
    ),
    onSuccess: () => {
        showCustomToast(toast, {
        title: 'Success',
        description: 'Password changed successfully!',
        variant: 'success',
        });      
      setFormData({ user_name: '', oldPassword: '', newPassword: '' });
      router.replace('/login');
    },
    onError: (error) => {
        showCustomToast(toast, {
        title: 'Error',
        description: error?.message || 'Failed to change password. Please try again.',
        variant: 'error',
        });
    },
  });


  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      padding: 16 
    }}>
      <VStack 
        style={{ 
          width: '100%',
          maxWidth: 400,
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}
      >
        <Heading 
          size="2xl" 
          style={{ 
            textAlign: 'center',
            marginBottom: 24,
            color: '#1E293B'
          }}
        >
          Change Password
        </Heading>

        <FormControl style={{ marginBottom: 16 }}>
          <FormControlLabel>
            <FormControlLabelText style={{ color: '#475569', fontWeight: '600' }}>
              Agent Code
            </FormControlLabelText>
          </FormControlLabel>
          <Input 
            size="xl" 
            style={{
              borderColor: '#CBD5E1',
              borderWidth: 1,
              borderRadius: 8,
              backgroundColor: '#F8FAFC',
              marginTop: 4
            }}
          >
            <InputField
              placeholder="Enter your Agent Code"
              value={formData.user_name}
              onChangeText={(text: string) => handleChange('user_name', text)}
              style={{ fontSize: 16, color: '#334155' }}
            />
          </Input>
        </FormControl>

        <FormControl style={{ marginBottom: 16 }}>
          <FormControlLabel>
            <FormControlLabelText style={{ color: '#475569', fontWeight: '600' }}>
              Old Password
            </FormControlLabelText>
          </FormControlLabel>
          <Input 
            size="xl"
            style={{
              borderColor: '#CBD5E1',
              borderWidth: 1,
              borderRadius: 8,
              backgroundColor: '#F8FAFC',
              marginTop: 4
            }}
          >
            <InputField
              type={showOldPassword ? 'text' : 'password'}
              placeholder="Enter old password"
              value={formData.oldPassword}
              onChangeText={(text: string) => handleChange('oldPassword', text)}
              style={{ fontSize: 16, color: '#334155' }}
            />
            <InputSlot onPress={handleToggleOldPassword}>
              <InputIcon 
                as={showOldPassword ? EyeIcon : EyeOffIcon} 
                color="#64748B"
              />
            </InputSlot>
          </Input>
        </FormControl>

        <FormControl style={{ marginBottom: 24 }}>
          <FormControlLabel>
            <FormControlLabelText style={{ color: '#475569', fontWeight: '600' }}>
              New Password
            </FormControlLabelText>
          </FormControlLabel>
          <Input 
            size="xl"
            style={{
              borderColor: '#CBD5E1',
              borderWidth: 1,
              borderRadius: 8,
              backgroundColor: '#F8FAFC',
              marginTop: 4
            }}
          >
            <InputField
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={formData.newPassword}
              onChangeText={(text: string) => handleChange('newPassword', text)}
              style={{ fontSize: 16, color: '#334155' }}
            />
            <InputSlot onPress={handleToggleNewPassword}>
              <InputIcon 
                as={showNewPassword ? EyeIcon : EyeOffIcon} 
                color="#64748B"
              />
            </InputSlot>
          </Input>
        </FormControl>

        <HStack space="md" style={{ justifyContent: 'space-between' }}>
          {/* <Button
            size="lg"
            variant="outline"
            style={{
              flex: 1,
              borderColor: '#2563EB',
              borderRadius: 8,
              height: 48,
            }}
            onPress={() => router.push('/forgot-password')}
          >
            <ButtonText style={{ 
              color: '#2563EB', 
              fontSize: 16,
              textAlign: 'center'
            }}>
              Forgot Password?
            </ButtonText>
          </Button> */}
          <Button
            size="lg"
            style={{
              flex: 1,
              backgroundColor: '#2563EB',
              borderRadius: 8,
              height: 48,
            }}
            onPress={() => changePasswordMutation.mutate()}
            disabled={changePasswordMutation.isPending}
          >
            <HStack space="sm" style={{ alignItems: 'center' }}>
              {changePasswordMutation.isPending && (
                <Spinner size="small" color="white" />
              )}
              <ButtonText style={{ 
                fontSize: 16, 
                fontWeight: '600',
                color: 'white'
              }}>
                {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
              </ButtonText>
            </HStack>
          </Button>
        </HStack>
      </VStack>
    </View>
  );
}
