import React, { useState } from 'react'
import { Pressable, Text } from 'react-native'
import { View } from 'react-native'
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from '../../components/ui/form-control'
import { Input, InputField, InputIcon, InputSlot } from '../../components/ui/input'
import { VStack } from '@/components/ui/vstack'
import { Button, ButtonText } from '../../components/ui/button'
import { AlertCircleIcon, CloseIcon, EyeIcon, EyeOffIcon, Icon } from '../../components/ui/icon'
import { useMutation } from '@tanstack/react-query';
import { login } from '@/api/auth'
import { HStack } from '@/components/ui/hstack'
import { Redirect, router } from 'expo-router'
import { useToast,Toast,ToastTitle, ToastDescription,} from '@/components/ui/toast';
import { useAuth } from '@/store/authStore'
import { Spinner } from '@/components/ui/spinner';
import { Heading } from '@/components/ui/heading'
import { HelpCircleIcon } from 'lucide-react-native'
import { showCustomToast } from '@/components/ui/custom-toast';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useAuth((s: any) => s.setUser);
  const isLoggedIn = useAuth((s: any) => !!s.user)

  const toast = useToast()

  

  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };

  const loginMutation = useMutation({
    mutationFn: () => login(username, password),
    onMutate: () => {
      setIsLoading(true);
    },
    onSettled: () => {
      setIsLoading(false);
    },
    onSuccess: (data) => {
      if (data.user.first_login === true) {
        setUser({
          user_name: data.user.user_name,
          // first_login: data.user.first_login              
        })
        router.replace('/changePassword')
        showCustomToast(toast, {
          title: 'Info',
          description: 'Please change your password for security.',
          variant: 'info'
        });
      } else {
        setUser({
          user_name: data.user.user_name,
          // first_login: data.user.first_login              
        })
        router.replace('/(tabs)')
        showCustomToast(toast, {
          title: 'Success',
          description: 'Logged in successfully!',
          variant: 'success'
        });
      }
    },
    onError: (error) => {
      //console.error('Login error:', error);
      showCustomToast(toast, {
        title: 'Error',
        description: error.message || "Failed to login. Please check your credentials.",
        variant: 'error'
      });
    }
  });

  if(isLoggedIn) {
    return <Redirect href={'/(tabs)'} />
  }

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#F8FAFC' 
    }}>
      <VStack style={{ 
        width: '90%', 
        maxWidth: 400,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}>
        <Heading 
          size="2xl" 
          style={{ 
            textAlign: 'center', 
            marginBottom: 24,
            color: '#1E293B',
            fontWeight: '700'
          }}
        >
          Welcome Back
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
              height: 48,
              marginTop: 4
            }}
          >
            <InputField
              placeholder="Enter your agent code"
              value={username}
              onChangeText={setUsername}
              style={{ fontSize: 16, color: '#334155' }}
            />
          </Input>
        </FormControl>

        <FormControl style={{ marginBottom: 24 }}>
          <FormControlLabel>
            <FormControlLabelText style={{ color: '#475569', fontWeight: '600' }}>
              Password
            </FormControlLabelText>
          </FormControlLabel>
          <Input 
            size="xl"
            style={{
              borderColor: '#CBD5E1',
              borderWidth: 1,
              borderRadius: 8,
              backgroundColor: '#F8FAFC',
              height: 48,
              marginTop: 4
            }}
          >
            <InputField
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              style={{ fontSize: 16, color: '#334155' }}
            />
            <InputSlot onPress={handleState}>
              <InputIcon 
                as={showPassword ? EyeIcon : EyeOffIcon}
                color="#64748B"
              />
            </InputSlot>
          </Input>
        </FormControl>

        <Button
          size="lg"
          style={{
            backgroundColor: '#2563EB',
            borderRadius: 8,
            height: 48,
            marginBottom: 16
          }}
          onPress={() => loginMutation.mutate()}
          disabled={isLoading}
        >
          <HStack space="sm" style={{ alignItems: 'center' }}>
            {isLoading && (
              <Spinner size="small" color="white" />
            )}
            <ButtonText>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </ButtonText>
          </HStack>
        </Button>

        <HStack style={{ justifyContent: 'space-between', marginTop: 8 }}>
          <Button
            variant="link"
           /*  onPress={() => router.push('/forgot-password')} */
          >
            <ButtonText style={{ color: '#2563EB', fontSize: 14 }}>
              Forgot Password?
            </ButtonText>
          </Button>
          <Button
            variant="link"
            onPress={() => router.push('/register')}
          >
            <ButtonText style={{ color: '#2563EB', fontSize: 14 }}>
              Create Account
            </ButtonText>
          </Button>
        </HStack>
      </VStack>
    </View>
  );
}