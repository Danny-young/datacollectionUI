import React, { useState } from 'react'
import { View, Modal, ActivityIndicator, Platform } from 'react-native'
import { FormControl, FormControlLabel, FormControlLabelText } from '../../components/ui/form-control'
import { Input, InputField } from '../../components/ui/input'
import { VStack } from '../../components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Button, ButtonText } from '../../components/ui/button'
import { useMutation } from '@tanstack/react-query'
import { register } from '@/api/auth'
import { router } from 'expo-router'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast'
import { sendSMS } from '@/api/sms'
import { showCustomToast } from '@/components/ui/custom-toast'
import axios from 'axios'

const API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3500'    // For Android emulator
  : 'http://localhost:3500';   // For iOS

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('') 
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [showCredentials, setShowCredentials] = useState(false)
  const [agentCode, setAgentCode] = useState('')
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast()

  const smsMutation = useMutation({
    mutationFn: (data: { phone_number: string; message: string }) => sendSMS(data),
    onSuccess: () => {
      showCustomToast(toast, {
        title: "SMS Sent",
        description: "Your credentials have been sent via SMS",
        variant: "success"
      });
    },
    onError: (error) => {
      console.error('SMS Error:', error);
      showCustomToast(toast, {
        title: "SMS Failed",
        description: "Failed to send credentials via SMS",
        variant: "error"
              });
          }
  });

  const registerMutation = useMutation({
    mutationFn: () => register(name, email, phoneNumber),
    onMutate: () => {
      setIsLoading(true);
    },
    onSettled: () => {
      setIsLoading(false);
    },
    onSuccess: async (data) => {
      console.log('Success: ', data);
      setGeneratedPassword(data.temporaryPassword);
      setAgentCode(data.AgentCode);
      
      // Send SMS
      const message = `Your SHC Data Collection login credentials:\nAgent Code: ${data.AgentCode}\nPassword: ${data.temporaryPassword}`;
      smsMutation.mutate({
        phone_number: phoneNumber,
        message: message
      });
      
      // Send Email
      try {
        await axios.post('/api/email/send-credentials', {
          to: email,
          agentCode: data.AgentCode,
          temporaryPassword: data.temporaryPassword,
          name: name
        });
        
        showCustomToast(toast, {
          title: "Registration Successful",
          description: "Credentials sent to your email and phone",
          variant: "success"
        });
      } catch (error) {
        console.error('Email sending failed:', error);
        showCustomToast(toast, {
          title: "Email Notification Failed",
          description: "Please check your credentials in the app",
          variant: "warning"
        });
      }
      
      setShowCredentials(true);
    },
    onError: (error) => {
      //console.error('Registration Error:', error)
         showCustomToast(toast, {
        title: "Registration Failed",
        description: "Failed to create account. Please try again.",
        variant: "error"
        });
    }
  })

  

  const handleCloseCredentials = () => {
    setShowCredentials(false)
    router.replace('/(auth)/login')
  }

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
          Create Account
        </Heading>

        <FormControl style={{ marginBottom: 16 }}>
          <FormControlLabel>
            <FormControlLabelText style={{ color: '#475569', fontWeight: '600' }}>
              Full Name
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
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              style={{ fontSize: 16, color: '#334155' }}
            />
          </Input>
        </FormControl>

        <FormControl style={{ marginBottom: 16 }}>
          <FormControlLabel>
            <FormControlLabelText style={{ color: '#475569', fontWeight: '600' }}>
              Email
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
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              style={{ fontSize: 16, color: '#334155' }}
            />
          </Input>
        </FormControl>

        <FormControl style={{ marginBottom: 24 }}>
          <FormControlLabel>
            <FormControlLabelText style={{ color: '#475569', fontWeight: '600' }}>
              Phone Number
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
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              style={{ fontSize: 16, color: '#334155' }}
              keyboardType='number-pad'
            />
          </Input>
        </FormControl>

        <Button
          size="lg"
          style={{
            backgroundColor: '#2563EB',
            borderRadius: 8
          }}
          onPress={() => registerMutation.mutate()}          
          disabled={registerMutation.isPending}
        >
          <HStack space="sm" style={{ alignItems: 'center' }}>
            {registerMutation.isPending && (
              <ActivityIndicator size="small" color="white" />
            )}
            <ButtonText style={{ fontSize: 16, fontWeight: '600' }}>
              {registerMutation.isPending ? 'Registering...' : 'Register'}
            </ButtonText>
          </HStack>
        </Button>

        <HStack style={{ justifyContent: 'center', marginTop: 16 }}>
          <Button
            variant="link"
            onPress={() => router.push('/login')}
          >
            <ButtonText style={{ color: '#2563EB', fontSize: 14 }}>
              Already have an account? Sign in
            </ButtonText>
          </Button>
        </HStack>
      </VStack>

      <Modal
        visible={showCredentials}
        transparent={true}
        animationType="fade"
      >
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 16,
            width: '90%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5
          }}>
            <Heading size="lg" style={{ marginBottom: 16, color: '#1E293B' }}>
              Your Login Credentials
            </Heading>
            <Text style={{ fontSize: 16, color: '#475569', marginBottom: 8 }}>
              Agent Code: <Text style={{ fontWeight: '600', color: '#1E293B' }}>{agentCode}</Text>
            </Text>
            <Text style={{ fontSize: 16, color: '#475569', marginBottom: 16 }}>
              Password: <Text style={{ fontWeight: '600', color: '#1E293B' }}>{generatedPassword}</Text>
            </Text>
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 16 }}>
              Your credentials have also been sent via SMS.
            </Text>
            <Button
              size="lg"
              style={{
                backgroundColor: '#2563EB',
                borderRadius: 8
              }}
              onPress={handleCloseCredentials}
            >
              <ButtonText style={{ fontSize: 16, fontWeight: '600' }}>
                Continue to Login
              </ButtonText>
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  )
}
