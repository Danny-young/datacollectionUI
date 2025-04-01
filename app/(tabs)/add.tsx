import { Image, StyleSheet, Platform, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import {
  Button,
  ButtonText,
  ButtonSpinner,
  ButtonIcon,
  ButtonGroup,
} from "@/components/ui/button"
import {
  Card,
} from "@/components/ui/card";
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box';
import { Input, InputField } from '@/components/ui/input';
import { BarChart, PieChart } from "react-native-gifted-charts";
import { VStack } from '@/components/ui/vstack';
// import { Heading } from '@/components/ui/heading';  
import { FormControl, 
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
 } from '@/components/ui/form-control';
import { AlertCircleIcon, ChevronDownIcon, PhoneIcon } from '@/components/ui/icon';
import { useToast, Toast, ToastTitle, ToastDescription } from '@/components/ui/toast';
import { useMutation } from '@tanstack/react-query';
import { collectiondata,fetchLocations, fetchLocalitiesByMunicipality } from '@/api/datacollection';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import {  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,} from '@/components/ui/select';
  import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { Icon } from '@/components/ui/icon';
import { SaveIcon, MapPinIcon } from 'lucide-react-native';
import { useAuth } from '@/store/authStore';
import { useCounterStore } from '@/store/counterStore';
import { showCustomToast } from '@/components/ui/custom-toast';
import { Spinner } from '@/components/ui/spinner';
import { useOfflineStore } from '@/store/offlineStore';
//import NetInfo from '@react-native-community/netinfo';



const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};
export interface FormDataType {
  agent_id: string;
  first_name: string;
  last_name: string;
  nationality: string;
  phone_number: string;
  id_type: string;
  id_number: string;
  electoral_area: string;
  locality: string;
  street_name: string;
  valuation_no: string;
  data_type: string;
  data_type_info: string;
  geolocation: {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
  };
}


interface Municipality {
  id: number;
  municipalities: string;
  code: string; 
}

interface Locality {
  id: number;
  name: string;
  code: string; 
}

interface AccuracyStats {
  current: number | null;
  previous: number | null;
  best: number | null;
}

export default function add() {
  const user = useAuth((state:any) => state.user);
  console.log("User:", user);
  console.log("User type:", typeof user);
  console.log("User properties:", Object.keys(user || {}));
  console.log("Full user object:", JSON.stringify(user, null, 2));

  const [formData, setFormData] = useState({
    agent_id: user?.user_name || '',
    first_name: '',
    last_name: '',
    nationality: 'Ghanaian',
    phone_number: '',
    id_type: '',
    id_number: '',
    electoral_area: '',
    locality: '',
    street_name: '',
    valuation_no: '',
    data_type: '',
    data_type_info: '',
    geolocation: {
      latitude: null as number | null,
      longitude: null as number | null,
      accuracy: null as number | null
    }
  });

  // Add useEffect to update agent_id when user data loads
  useEffect(() => {
    if (user?.user_name) {
      console.log("Setting agent_id to:", user.user_name);
      setFormData(prev => ({
        ...prev,
        agent_id: user.user_name
      }));
    }
  }, [user]);

  console.log("User:", user);
  console.log("Agent ID being sent:", formData.agent_id);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [bestAccuracy, setBestAccuracy] = useState<number | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<any>(null);
  const [accuracyStats, setAccuracyStats] = useState<AccuracyStats>({
    current: null,
    previous: null,
    best: null
  });
     // Reference for the Select Bottom Sheet
   const selectRef = useRef<any>(null);
   const [isForeigner, setIsForeigner] = useState(false);
  // Add validation function for ID number format
  const validateIdNumber = (number: string, type: string): boolean => {
    switch (type) {
      case 'Ghana Card':
        return /^GHA-\d{9}-\d$/.test(number); // GHA-123456789-0
      case "Driver's License":
        return /^GA-\d{9}-[A-Z]{2}$/.test(number); // GA-123456789-AB
      case 'passport':
        return /^G\d{8}$/.test(number); // G12345678
      default:
        return false;
    }
  };

  // Update your ID type select handler


  const countries = [
    'Nigeria', 'Togo', 'Burkina Faso', 'Ivory Coast', 'Mali', 
    'Benin', 'Niger', 'Senegal', 'Sierra Leone', 'Liberia'
    // Add more countries as needed
  ];
  const handleIdTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      id_type: value,
      id_number: '' // Clear ID number when type changes
    }));
  };

  // Update your form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Personal Information
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Phone number is required';
    if (!formData.id_type.trim()) newErrors.id_type = 'ID type is required';
    if (!formData.id_number.trim()) newErrors.id_number = 'ID number is required';

    // Location Information
    if (!formData.electoral_area.trim()) newErrors.electoral_area = 'Electoral area is required';
    if (!formData.locality.trim()) newErrors.locality = 'Locality is required';
    if (!formData.street_name.trim()) newErrors.street_name = 'Street name is required';
    if (!formData.valuation_no.trim()) newErrors.valuation_no = 'Valuation number is required';
    if (!formData.geolocation.latitude || !formData.geolocation.longitude) newErrors.geolocation = 'Geolocation is required';

    // Data Information
    if (!formData.data_type.trim()) newErrors.data_type = 'Data type is required';
    if (!formData.data_type_info.trim()) newErrors.data_type_info = 'Data particular is required';

    if (!formData.id_number) {
      newErrors.id_number = 'ID number is required';
    } else if (!validateIdNumber(formData.id_number, formData.id_type)) {
      newErrors.id_number = formData.id_type === 'Ghana Card' ? 'Format: GHA-123456789-0' :
                           formData.id_type === "Driver's License" ? 'Format: GA-123456789-AB' :
                           formData.id_type === 'passport' ? 'Format: G12345678' :
                           'Invalid ID format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (validateForm()) {
      stopLocationTracking();
      collectionMutation.mutate(formData);
    }
  };

 
    // Add queries for municipalities and localities
    const { data: municipalities } = useQuery<Municipality[]>({
      queryKey: ['municipalities'],
      queryFn: fetchLocations
    });

    const [selectedCodes, setSelectedCodes] = useState({
      municipalityCode: '',
      localityCode: ''
    });

    // Update handlers to store codes
const getNextCounter = useCounterStore((state) => state.getNextCounter);
const handleElectoralAreaChange = (value: string) => {
  const municipality = municipalities?.find(m => m.municipalities === value);
  setSelectedCodes(prev => ({
    ...prev,
    municipalityCode: municipality?.code || ''
  }));
  setFormData(prev => ({
    ...prev,
    electoral_area: value,
    locality: '',
   // valuation_no: municipality ? `${municipality.code}-` : ''
  }));
};


const handleLocalityChange = (value: string) => {
  const locality = localities?.find(l => l.name === value);
  if (locality && selectedCodes.municipalityCode) {
    const nextCounter = getNextCounter(selectedCodes.municipalityCode, locality.code);
    const paddedNumber = nextCounter.toString().padStart(3, '0');
    
    setFormData(prev => ({
      ...prev,
      locality: value,
    //  valuation_no: `${selectedCodes.municipalityCode}-${locality.code}-${paddedNumber}`
    }));
  }
};
  
    // if (isLoading) {
    //   return (
    //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    //       <Text>Loading electoral areas...</Text>
    //     </View>
    //   );
    // }


    // if(error){
    //   return 
    //   console.log('message:',error)
    // }
     // Query for localities based on selected municipality
     const { data: localities } = useQuery<Locality[]>({
      queryKey: ['localities', formData.electoral_area],
      queryFn: () => fetchLocalitiesByMunicipality(formData.electoral_area),
      enabled: !!formData.electoral_area
    });


    
  // if (lloading) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <Text>Loading localities...</Text>
  //     </View>
  //   );
  // }

  // if(lerror){
  //   console.log('message:',lerror)
  // }
  console.log('Municipality:', municipalities);
  console.log('Selected Municipality Code:', selectedCodes.municipalityCode);
  console.log('Localities:', localities);
  console.log('Valuation Number:', formData.valuation_no);
 
  const toast = useToast();

  const collectionMutation = useMutation({
    mutationFn: (data: FormDataType) => collectiondata(data),
    onSuccess: (data) => {
      // Show success toast
      toast.show({
        placement: "top",
        render: ({ id }: { id: string }) => {
          return (
            <Toast nativeID={id} action="success" variant="solid">
              <VStack space="xs">
                <ToastTitle>Success</ToastTitle>
                <ToastDescription>
                  Data has been successfully saved
                </ToastDescription>
              </VStack>
            </Toast>
          );
        },
      });
      
      // Reset form
      setFormData({
        agent_id: user?.user_name || '',
        first_name: '',
        last_name: '',
        nationality: 'Ghanaian',
        phone_number: '',
        id_type: '',
        id_number: '',
        electoral_area: '',
        locality: '',
        street_name: '',
        valuation_no: '',
        data_type: '',
        data_type_info: '',
        geolocation: {
          latitude: null,
          longitude: null,
          accuracy: null
        }
      });
    },
    onError: (error) => {
      // Show error toast
      toast.show({
        placement: "top",
        render: ({ id }: { id: string }) => {
          return (
            <Toast nativeID={id} action="error" variant="solid">
              <VStack space="xs">
                <ToastTitle>Error</ToastTitle>
                <ToastDescription>
                  {error.message || 'Failed to save data. Please try again.'}
                </ToastDescription>
              </VStack>
            </Toast>
          );
        },
      });
    },
  });

  console.log(localities)

    // Handler for electoral area change
    // const handleElectoralAreaChange = (value: string) => {
    //   setFormData(prev => ({
    //     ...prev,
    //     electoral_area: value,
    //     locality: '' // Reset locality when electoral area changes
    //   }));
    // };
  
console.log(municipalities);

  const getLocation = async () => {
    try {
      setIsLocating(true);
      setLocationError(null);

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLocationError('Location permission denied');
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          const currentAccuracy = location.coords.accuracy ?? 0;
          
          setAccuracyStats(prev => {
            let newBest = prev.best;
            
            // Update best accuracy if:
            // 1. No best accuracy yet, or
            // 2. Current accuracy is better than best and is <= 4m
            if (!prev.best || (currentAccuracy < prev.best && currentAccuracy <= 4)) {
              newBest = currentAccuracy;
              // Update form data with best location
              setFormData(prevForm => ({
                ...prevForm,
                geolocation: {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  accuracy: currentAccuracy
                }
              }));
            }

            return {
              current: currentAccuracy,
              previous: prev.current,
              best: newBest
            };
          });
        }
      );

      setLocationSubscription(subscription);

    } catch (error) {
      setLocationError('Unable to get location');
      console.error(error);
      setIsLocating(false);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
      setIsLocating(false);
    }
  };

  const withinRange = formData.geolocation.accuracy !== null && formData.geolocation.accuracy <= 4;

/*   useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (!state.isConnected) {
        toast.show({
          placement: "top",
          render: ({ id }: { id: string }) => {
            return (
              <Toast nativeID={id} action="warning" variant="solid">
                <VStack space="xs">
                  <ToastTitle>No Internet Connection</ToastTitle>
                  <ToastDescription>
                    Data will be saved locally and synced when online
                  </ToastDescription>
                </VStack>
              </Toast>
            );
          },
        });
      }
    });

    return () => unsubscribe();
  }, []);
 */
  // Add this helper function
  const formatIdNumber = (text: string, idType: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '');

    switch (idType) {
      case 'Ghana Card':
        if (cleaned.length <= 12) {
          // Format as GHA-XXXXXXXXX-X
          let formatted = cleaned;
          if (cleaned.length > 0) formatted = 'GHA-' + formatted;
          if (cleaned.length > 9) {
            formatted = formatted.slice(0, 13) + '-' + formatted.slice(13);
          }
          return formatted;
        }
        break;

      case "Driver's License":
        if (cleaned.length <= 11) {
          // Format as GA-XXXXXXXXX-XX
          let formatted = cleaned;
          if (cleaned.length > 0) formatted = 'GA-' + formatted;
          if (cleaned.length > 9) {
            formatted = formatted.slice(0, 12) + '-' + formatted.slice(12);
          }
          return formatted;
        }
        break;

      case 'passport':
        if (cleaned.length <= 9) {
          // Format as GXXXXXXXX
          let formatted = cleaned;
          if (cleaned.length > 0) formatted = 'G' + formatted;
          return formatted;
        }
        break;
    }

    return cleaned;
  };

  // Optional: Add network error handling
  /* useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      if (!state.isConnected) {
        toast.show({
          placement: "top", 
          render: ({ id }: { id: string }) => {
            return (
              <Toast nativeID={id} action="warning" variant="solid">
                <VStack space="xs">
                  <ToastTitle>No Internet Connection</ToastTitle>
                  <ToastDescription>
                    Data will be saved locally and synced when online
                  </ToastDescription>
                </VStack>
              </Toast>
            );
          },
        });
      }
    });

    return () => unsubscribe();
  }, []);
 */
  return (
    
    <ScrollView className="flex-1 bg-gray-50 px-4">
     <FormControl>

<View className="">
<Card 
  size="sm" 
  style={{
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16
  }}
>
  <Heading 
    size="md" 
    style={{ 
      color: '#1E293B',
      fontSize: 18,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 2
    }}
  >
    DATA COLLECTION
  </Heading>
</Card>

<Card 
  size="sm" 
  style={{
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  }}
>
  <Heading 
    size="md" 
    style={{ 
      color: '#1E293B',
      marginBottom: 20,
      fontSize: 18,
      fontWeight: '700'
    }}
  >
    Personal Information
  </Heading>

  <VStack space="lg">
    <HStack space="md" style={{ alignItems: 'flex-start' }}>
      <VStack style={{ flex: 1 }}>
        <FormControlLabel>
          <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
            Surname
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{ 
            borderColor: submitAttempted && errors.last_name ? '#EF4444' : '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            height: 39
          }}
        >
          <InputField
            value={formData.last_name}
            placeholder='Surname'
            onChangeText={(text: string) => setFormData(prev => ({...prev, last_name: text}))}
            style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }}
          />
        </Input>      
      </VStack>     
      
      <VStack style={{ flex: 1 }}>
        <FormControlLabel>
          <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600' }}>
            FirstName
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{ 
            borderColor: submitAttempted && errors.first_name ? '#EF4444' : '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            height: 39
          }}
        >
          <InputField
            value={formData.first_name}
            placeholder='Firstname'
            onChangeText={(text: string) => setFormData(prev => ({...prev, first_name: text}))}
            style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }}
          />
        </Input>      
      </VStack> 
    </HStack>    

    <VStack style={{ flex: 1 }}>
      <FormControlLabel>
        <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
          Phone Number
        </FormControlLabelText>
      </FormControlLabel>
      <HStack space="sm">
        <Input
          style={{ 
            width: 60,
            borderColor: '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F1F5F9',
            height: 40
          }}
          isDisabled
        >
          <InputField
            value="+233"
            editable={false}
            style={{ fontSize: 14, color: '#64748B', textAlign: 'center' }}
          />
        </Input>
        <Input
          style={{ 
            flex: 1,
            borderColor: submitAttempted && errors.phone_number ? '#EF4444' : '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            height: 40
          }}
        >
          <InputField
            value={formData.phone_number.replace('+233', '')}
            onChangeText={(text: string) => {
              if (/^\d{0,10}$/.test(text)) {
                setFormData((prev) => ({ ...prev, phone_number: '+233' + text }));
              }
            }}
            placeholder="XXXXXXXXX"
            keyboardType="number-pad"
            style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }}
          />
        </Input>
      </HStack>
    </VStack>
    <HStack space="md" style={{ alignItems: 'flex-start' }}>
<VStack style={{ flex: 1 }}>
  <FormControlLabel>
    <HStack style={{ 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: 2 
    }}>
      <FormControlLabelText style={{ 
        color: '#334155', 
        fontSize: 16, 
        fontWeight: '600'
      }}>
        Nationality
      </FormControlLabelText>
      <HStack space="md" style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: '#64748B' }}>
          {isForeigner ? 'Foreigner' : 'Local'}
        </Text>
        <Switch
          value={isForeigner}
          onValueChange={(value: boolean) => {
            setIsForeigner(value);
            setFormData(prev => ({
              ...prev,
              nationality: value ? '' : 'Ghanaian'
            }));
          }}
          trackColor={{ true: '#2563EB', false: '#CBD5E1' }}
        />
      </HStack>
    </HStack>
  </FormControlLabel>

  {isForeigner ? (
    <Select
      selectedValue={formData.nationality}
      onValueChange={(value: string) => setFormData(prev => ({ ...prev, nationality: value }))}
    >
      <SelectTrigger
        style={{ 
          borderColor: submitAttempted && errors.nationality ? '#EF4444' : '#CBD5E1',
          borderWidth: 1,
          borderRadius: 8,
          backgroundColor: '#F8FAFC',
          height: 40
        }}
      >
        <SelectInput 
          placeholder="Select Country"
          style={{ fontSize: 16, color: '#334155', paddingLeft: 12 }}
        />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent>
          {countries.map((country) => (
            <SelectItem 
              key={country} 
              label={country} 
              value={country}
            />
          ))}
        </SelectContent>
      </SelectPortal>
    </Select>
  ) : (
    <Input
      style={{ 
        borderColor: '#CBD5E1',
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        height: 40
      }}
      isDisabled
    >
      <InputField 
        value="Ghanaian"
        editable={false}
        style={{ fontSize: 16, color: '#64748B', paddingLeft: 12 }}
      />
    </Input>
  )}
</VStack>
</HStack>
    <HStack space="md" style={{ alignItems: 'flex-start' }}>
      <VStack style={{ flex: 1 }}>
        <FormControlLabel>
          <FormControlLabelText style={{ 
            color: '#334155', 
            fontSize: 14, 
            fontWeight: '600', 
            marginBottom: 4 
          }}>
            ID Type*
          </FormControlLabelText>
        </FormControlLabel>
        <Select
          selectedValue={formData.id_type}
          onValueChange={handleIdTypeChange}
        >
          <SelectTrigger
            style={{ 
              borderColor: submitAttempted && errors.id_type ? '#EF4444' : '#CBD5E1',
              borderWidth: 1,
              borderRadius: 8,
              backgroundColor: '#F8FAFC',
              height: 40,
              marginBottom: errors.id_type ? 4 : 0
            }}
          >
            <SelectInput
              placeholder="Select ID Type"
              value={formData.id_type}
              style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }}
            />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectItem label="Ghana Card" value="Ghana Card" />
              <SelectItem label="Driver's License" value="Driver's License" />
              <SelectItem label="Passport" value="passport" />
            </SelectContent>
          </SelectPortal>
        </Select>
        {submitAttempted && errors.id_type && (
          <Text style={{ color: '#EF4444', fontSize: 14 }}>{errors.id_type}</Text>
        )}
      </VStack>

      <VStack style={{ flex: 1.2 }}>
        <FormControlLabel>
          <FormControlLabelText style={{ 
            color: '#334155', 
            fontSize: 14, 
            fontWeight: '600', 
            marginBottom: 4 
          }}>
            ID Number*
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{ 
            borderColor: submitAttempted && errors.id_number ? '#EF4444' : '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            height: 40,
            marginBottom: errors.id_number ? 4 : 0
          }}
        >
          <InputField
            value={formData.id_number}
            onChangeText={(text: string) => setFormData(prev => ({ ...prev, id_number: text }))}
            placeholder={
              formData.id_type === 'Ghana Card' ? 'GHA-123456789-0' :
              formData.id_type === "Driver's License" ? 'GA-123456789-AB' :
              formData.id_type === 'passport' ? 'G12345678' : 'Select ID Type first'
            }
            style={{ fontSize: 15, color: '#334155', paddingLeft: 12 }}
          />
        </Input>
        {submitAttempted && errors.id_number && (
          <Text style={{ color: '#EF4444', fontSize: 14 }}>{errors.id_number}</Text>
        )}
      </VStack>
    </HStack>
  </VStack>
</Card>

<Card 
  size="sm" 
  style={{
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 8
  }}
>
  <Heading 
    size="md" 
    style={{ 
      color: '#1E293B',
      marginBottom: 20,
      fontSize: 18,
      fontWeight: '700'
    }}
  >
    Location
  </Heading>

  <VStack space="md">
    <FormControlLabel>
      <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
        Electoral Area*
      </FormControlLabelText>
    </FormControlLabel>
    <Select
      selectedValue={formData.electoral_area}
      onValueChange={handleElectoralAreaChange}
    >
      <SelectTrigger 
        style={{ 
          borderColor: submitAttempted && errors.electoral_area ? '#EF4444' : '#CBD5E1', 
          borderWidth: 1,
          borderRadius: 8,
          backgroundColor: '#F8FAFC',
          height: 40
        }}
      >
        <SelectInput 
          placeholder="Select Electoral Area"
          style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }}
        />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent>
          {municipalities?.map((municipality: any) => (
            <SelectItem 
              key={municipality.id} 
              label={municipality.municipalities} 
              value={municipality.municipalities} 
            />
          ))}
        </SelectContent>
      </SelectPortal>
    </Select>

    <FormControlLabel>
      <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
        Locality*
      </FormControlLabelText>
    </FormControlLabel>
    <Select
      selectedValue={formData.locality}
      onValueChange={handleLocalityChange}
      isDisabled={!formData.electoral_area}
    >
       <SelectTrigger 
        style={{ 
          borderColor: submitAttempted && errors.locality ? '#EF4444' : '#CBD5E1',
          borderWidth: 1,
          borderRadius: 8,
          backgroundColor: '#F8FAFC',
          height: 40
        }}
      >
        <SelectInput placeholder="Select Locality"
        style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }} />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent>
          {localities?.map((locality) => (
            <SelectItem 
              key={locality.id} 
              label={locality.name} 
              value={locality.name} 
            />
          ))}
        </SelectContent>
      </SelectPortal>
    </Select>

    <VStack space="md">
      <FormControlLabel>
        <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
          Geolocation*
        </FormControlLabelText>
      </FormControlLabel>

      <HStack space="md" style={{ alignItems: 'center' }}>
        <Button
          variant="outline"
          size="lg"
          isDisabled={isLocating}
          style={{
            borderColor: '#CBD5E1',
            borderRadius: 8,
            backgroundColor: isLocating ? '#EEF2FF' : '#F8FAFC'
          }}
          onPress={isLocating ? stopLocationTracking : getLocation}
        >
          <HStack space="sm" style={{ alignItems: 'center' }}>
            <FontAwesome5 
              name="map-marker-alt" 
              size={20} 
              color={isLocating ? "#2563EB" : "#64748B"} 
            />
            <ButtonText style={{ color: isLocating ? '#2563EB' : '#64748B' }}>
              {isLocating ? 'Stop Location' : 'Get Location'}
            </ButtonText>
          </HStack>
        </Button>

      
      </HStack>

      <HStack space="md" style={{ alignItems: 'center' }}>
      <Input
          style={{ 
            flex: 1,
            backgroundColor: '#F1F5F9',
            borderColor: '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            height: 40
          }}
          isDisabled
        >
          <InputField
            value={formData.geolocation.latitude ? formData.geolocation.latitude.toFixed(6) : ''}
            placeholder="Latitude"
            style={{ color: '#64748B', fontSize: 14, paddingLeft: 12 }}
          />
        </Input>

        <Input
          style={{ 
            flex: 1,
            backgroundColor: '#F1F5F9',
            borderColor: '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            height: 40
          }}
          isDisabled
        >
          <InputField
            value={formData.geolocation.longitude ? formData.geolocation.longitude.toFixed(6) : ''}
            placeholder="Longitude"
            style={{ color: '#64748B', fontSize: 14, paddingLeft: 12 }}
          />
        </Input>
      </HStack>

      {locationError && (
        <Text style={{ color: '#EF4444', fontSize: 14 }}>{locationError}</Text>
      )}

      {accuracyStats.current !== null && (
        <VStack space="xs" style={{ alignItems: 'center', marginTop: 8 }}>
          <Text style={{ 
            color: accuracyStats.best && accuracyStats.best <= 4 ? '#10B981' : '#64748B',
            fontSize: 14,
            fontWeight: '600'
          }}>
            Best Accuracy: {accuracyStats.best ? `${accuracyStats.best.toFixed(2)}m` : 'Not yet achieved'}
            {accuracyStats.best && accuracyStats.best <= 4 && ' ✓'}
          </Text>
          <Text style={{ 
            color: accuracyStats.current <= 4 ? '#10B981' : '#EF4444',
            fontSize: 14
          }}>
            Current Accuracy: {accuracyStats.current.toFixed(2)}m
          </Text>
          {accuracyStats.previous && (
            <Text style={{ color: '#64748B', fontSize: 14 }}>
              Previous Accuracy: {accuracyStats.previous.toFixed(2)}m
            </Text>
          )}
        </VStack>
      )}
    </VStack>

    <HStack space="md" style={{ marginTop: 5 }}>
      <VStack style={{ flex: 1 }}>
        <FormControlLabel>
          <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
            Street Name*
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{ 
            borderColor: '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            height: 40
          }}
          isInvalid={!!(submitAttempted && errors.street_name)}
        >
          <InputField
            value={formData.street_name}
            onChangeText={(text:string) => setFormData(prev => ({...prev, street_name: text}))}
            style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }}
          />
        </Input>
      </VStack>

      <VStack style={{ flex: 1 }}>
        <FormControlLabel>
          <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
            Valuation Number*
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{ 
            borderColor: submitAttempted && errors.valuation_no ? '#EF4444' : '#CBD5E1', 
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            height: 40
          }}
          isInvalid={!!(submitAttempted && errors.valuation_no)}
        >
          <InputField
            value={formData.valuation_no}
            onChangeText={(text:string) => setFormData(prev => ({...prev, valuation_no: text}))}
            style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }}
          />
        </Input>
      </VStack>
    </HStack>
  </VStack>
</Card>

<Card 
  size="sm" 
  style={{
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 8
  }}
>
  <Heading 
    size="md" 
    style={{ 
      color: '#1E293B',
      marginBottom: 20,
      fontSize: 18,
      fontWeight: '700'
    }}
  >
    Data Information
  </Heading> 
  <HStack space="md" style={{ alignItems: 'flex-start' }}>
    <VStack style={{ flex: 1}}>
      <FormControlLabel>
        <FormControlLabelText 
          style={{ 
            color: '#334155', 
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 2
          }}
        >
          Data Type*
        </FormControlLabelText>
      </FormControlLabel>
      <Select
        selectedValue={formData.data_type}
        onValueChange={(value: string) =>
          setFormData((prev) => ({
            ...prev,
            data_type: value,
            data_type_info: value === 'business' ? 'business' : '',
          }))
        }
      >
        <SelectTrigger 
          style={{ 
            borderColor: submitAttempted && errors.data_type ? '#EF4444' : '#CBD5E1', 
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            height: 40
          }}
        >
          <SelectInput 
            placeholder="Select data type"
            style={{ 
              fontSize: 16,
              color: '#334155',
              paddingLeft: 12
            }}
          />
          <ChevronDownIcon style={{ marginRight: 12 }} color="#64748B" />
        </SelectTrigger>
        <SelectPortal>
          <SelectBackdrop />
          <SelectContent>
            <SelectItem label="Property" value="property" />
            <SelectItem label="Business" value="business" />
            </SelectContent>
        </SelectPortal>
      </Select>
    </VStack>

    <VStack style={{ flex: 1 }}>
      <FormControlLabel>
        <FormControlLabelText 
          style={{ 
            color: '#334155', 
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 2
          }}
        >
          Data Particular
        </FormControlLabelText>
      </FormControlLabel>
      {formData.data_type === 'property' ? (
        <Select
          selectedValue={formData.data_type_info}
          onValueChange={(value: string) =>
            setFormData((prev) => ({ ...prev, data_type_info: value }))
          }
        >
          <SelectTrigger 
            style={{ 
              borderColor: submitAttempted && errors.data_type_info ? '#EF4444' : '#CBD5E1', 
              borderWidth: 1,
              borderRadius: 8,
              backgroundColor: '#F8FAFC',
              height: 40
            }}
          >
            <SelectInput 
              placeholder="Select property type"
              style={{ 
                fontSize: 16,
                color: '#334155',
                paddingLeft: 12
              }}
            />
            <ChevronDownIcon style={{ marginRight: 12 }} color="#64748B" />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectItem label="Residential" value="residential" />
              <SelectItem label="Commercial" value="commercial" />
              <SelectItem label="Mixed Use" value="mixed" />
            </SelectContent>
          </SelectPortal>
        </Select>
      ) : (
        <Input 
          isDisabled
          style={{ 
            backgroundColor: '#F1F5F9',
            borderRadius: 8,
            height: 40,
            borderColor: '#CBD5E1',
            borderWidth: 1
          }}
        >
          <InputField 
            value="business"
            style={{ 
              color: '#64748B',
              fontSize: 14,
              paddingLeft: 12
            }}
          />
        </Input>
      )}
    </VStack>
  </HStack>
</Card>

  <Alert action="error" className="gap-3">
  
    <AlertText className="text-typography-900" size="sm">
    <Text className="mr-2 font-semibold text-typography-900">Heads up:</Text>
     Once done, this action cannot be undone
  </AlertText>
</Alert>

<VStack space="md" style={{ marginVertical: 16 }}>
  <TouchableOpacity
    style={{
      backgroundColor: withinRange ? '#2563EB' : '#94A3B8',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }}
    onPress={handleSubmit}
    disabled={!withinRange || collectionMutation.isPending}
    activeOpacity={0.8}
  >
    <HStack space="sm" style={{ alignItems: 'center' }}>
      {collectionMutation.isPending ? (
        <Spinner size="small" color="white" />
      ) : withinRange ? (
        <Icon as={SaveIcon} size="md" color="white" />
      ) : (
        <Icon as={MapPinIcon} size="md" color="white" />
      )}
      <Text style={{ 
        color: 'white', 
        fontSize: 16, 
        fontWeight: '600' 
      }}>
        {collectionMutation.isPending ? 'Saving...' : 
         withinRange ? 'Save Data' : 'Get Location Within 4m Range'}
      </Text>
    </HStack>
  </TouchableOpacity>
</VStack>


</View>    
   </FormControl>
   </ScrollView> 
      
  )
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 2,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
